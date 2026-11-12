"""Small persistence core: authenticated-user ID must come from a trusted gateway."""
from __future__ import annotations
import hashlib
import json
import re
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

RATINGS = {'again', 'hard', 'good', 'easy'}
EVIDENCE = {'self_report', 'model_feedback', 'exact_match', 'human_review', 'voice_unverified'}
VERIFIED = {'exact_match', 'human_review'}
PREFERENCE_KEYS = {
    'explanation_style', 'correction_style', 'script_reveal', 'pacing',
    'preferred_examples', 'practice_mode', 'feedback_tone', 'session_minutes',
    'pronunciation_help', 'review_preference'
}
PREFERENCE_LIMIT = 280
REVIEW_DAYS = [1, 3, 7, 14, 30, 60, 120]
SENSITIVE_PATTERN = re.compile(r'(?i)(\bghp_[a-z0-9]{15,}\b|\bsk-[a-z0-9_-]{20,}\b|password\s*[:=]|secret\s*[:=]|api.key\s*[:=]|otp\s*[:=])')


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def stamp(dt: datetime) -> str:
    if dt.tzinfo is None:
        raise ValueError('Timezone-aware datetime required')
    return dt.astimezone(timezone.utc).isoformat(timespec='seconds')


def jdump(value) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def jload(value):
    return json.loads(value)


def _safe_text(value: str, length: int = PREFERENCE_LIMIT) -> str:
    if not isinstance(value, str) or not value.strip() or len(value) > length:
        raise ValueError('A short nonempty string is required')
    if SENSITIVE_PATTERN.search(value):
        raise ValueError('Potential secret: refuse storage')
    return value.strip()


class TutorStore:
    def __init__(self, path: str | Path):
        self.path = str(path)
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        self._init()

    def _conn(self):
        db = sqlite3.connect(self.path, timeout=8)
        db.row_factory = sqlite3.Row
        db.execute('PRAGMA foreign_keys = ON')
        db.execute('PRAGMA busy_timeout = 8000')
        return db

    def _init(self):
        with self._conn() as db:
            db.execute('PRAGMA journal_mode = WAL')
            version = db.execute('PRAGMA user_version').fetchone()[0]
            if version > 1:
                raise RuntimeError('Database schema is newer than this application')
            db.executescript('''
                CREATE TABLE IF NOT EXISTS learners (
                    user_id TEXT PRIMARY KEY, tz TEXT NOT NULL DEFAULT 'UTC', created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS preferences (
                    user_id TEXT NOT NULL REFERENCES learners(user_id) ON DELETE CASCADE,
                    key TEXT NOT NULL, value TEXT NOT NULL, origin TEXT NOT NULL,
                    version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL,
                    PRIMARY KEY(user_id,key)
                );
                CREATE TABLE IF NOT EXISTS proposals (
                    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES learners(user_id) ON DELETE CASCADE,
                    kind TEXT NOT NULL, payload_json TEXT NOT NULL, rationale TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, reviewed_at TEXT
                );
                CREATE TABLE IF NOT EXISTS focus (
                    user_id TEXT PRIMARY KEY REFERENCES learners(user_id) ON DELETE CASCADE,
                    wheel_id TEXT NOT NULL, level_id TEXT NOT NULL, pack_id TEXT NOT NULL,
                    local_date TEXT NOT NULL, selected_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS attempts (
                    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES learners(user_id) ON DELETE CASCADE,
                    client_event_id TEXT NOT NULL, skill_id TEXT NOT NULL,
                    wheel_id TEXT NOT NULL, level_id TEXT NOT NULL, pack_id TEXT NOT NULL,
                    combination_id TEXT NOT NULL, rating TEXT NOT NULL, evidence TEXT NOT NULL,
                    error_tags_json TEXT NOT NULL, digest TEXT NOT NULL, created_at TEXT NOT NULL,
                    UNIQUE(user_id,client_event_id)
                );
                CREATE INDEX IF NOT EXISTS attempts_by_user_skill ON attempts(user_id,skill_id,created_at);
                CREATE TABLE IF NOT EXISTS mastery (
                    user_id TEXT NOT NULL REFERENCES learners(user_id) ON DELETE CASCADE,
                    skill_id TEXT NOT NULL, stage TEXT NOT NULL,
                    seen INTEGER NOT NULL, verified_correct INTEGER NOT NULL,
                    verified_attempts INTEGER NOT NULL, distinct_combinations_json TEXT NOT NULL,
                    distinct_days_json TEXT NOT NULL, distinct_packs_json TEXT NOT NULL,
                    last_seen TEXT NOT NULL, due_at TEXT,
                    PRIMARY KEY(user_id,skill_id)
                );
                CREATE TABLE IF NOT EXISTS approved_pack_facts (
                    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES learners(user_id) ON DELETE CASCADE,
                    pack_id TEXT NOT NULL, fact_text TEXT NOT NULL,
                    source TEXT NOT NULL, updated_at TEXT NOT NULL
                );
            ''')
            db.execute('PRAGMA user_version = 1')

    def _user(self, user_id: str):
        return _safe_text(user_id, 128)

    def _ensure(self, db, user_id: str, dt: datetime):
        db.execute('INSERT OR IGNORE INTO learners(user_id,tz,created_at) VALUES(?,?,?)',
                   (user_id, 'UTC', stamp(dt)))

    def set_timezone(self, user_id: str, tz: str, now: datetime | None = None):
        user_id = self._user(user_id)
        ZoneInfo(tz)
        now = now or utcnow()
        with self._conn() as db:
            self._ensure(db, user_id, now)
            db.execute('UPDATE learners SET tz=? WHERE user_id=?', (tz, user_id))

    def _local_date(self, db, user_id: str, now: datetime):
        row = db.execute('SELECT tz FROM learners WHERE user_id=?', (user_id,)).fetchone()
        return now.astimezone(ZoneInfo(row['tz'] if row else 'UTC')).date().isoformat()

    def update_preference(self, user_id: str, key: str, value: str, now: datetime | None = None):
        """Called only after an explicit user request/approval (not speculative model inference)."""
        user_id = self._user(user_id)
        if key not in PREFERENCE_KEYS:
            raise ValueError('Unknown teaching-preference key')
        value = _safe_text(value)
        now = now or utcnow()
        with self._conn() as db:
            self._ensure(db, user_id, now)
            db.execute('''INSERT INTO preferences(user_id,key,value,origin,updated_at)
                 VALUES(?,?,?,?,?) ON CONFLICT(user_id,key) DO UPDATE SET
                 value=excluded.value,origin=excluded.origin,updated_at=excluded.updated_at,
                 version=preferences.version+1''', (user_id,key,value,'user_confirmed',stamp(now)))
        return {'key':key, 'value':value, 'origin':'user_confirmed'}

    def delete_preference(self, user_id: str, key: str):
        user_id = self._user(user_id)
        if key not in PREFERENCE_KEYS: raise ValueError('Unknown preference')
        with self._conn() as db:
            db.execute('DELETE FROM preferences WHERE user_id=? AND key=?', (user_id,key))
        return {'key':key,'deleted':True}

    def delete_pack_fact(self, user_id: str, fact_id: str):
        user_id = self._user(user_id)
        _safe_text(fact_id,128)
        with self._conn() as db:
            result=db.execute('DELETE FROM approved_pack_facts WHERE user_id=? AND id=?',(user_id,fact_id))
        return {'deleted':bool(result.rowcount)}

    def propose(self, user_id: str, kind: str, payload: dict, rationale: str, now: datetime | None = None):
        user_id = self._user(user_id)
        if kind not in ('preference','pack_fact'):
            raise ValueError('Unknown proposal kind')
        if not isinstance(payload, dict):
            raise ValueError('Expected object')
        rationale = _safe_text(rationale, 300)
        if kind == 'preference':
            if set(payload) != {'key','value'} or payload['key'] not in PREFERENCE_KEYS:
                raise ValueError('Invalid preference proposal')
            _safe_text(payload['value'])
        else:
            if set(payload) != {'pack_id','fact'}:
                raise ValueError('Invalid pack-fact proposal')
            _safe_text(payload['pack_id'], 64)
            _safe_text(payload['fact'], 240)
        if len(jdump(payload)) > 700:
            raise ValueError('Oversized proposal')
        now = now or utcnow()
        proposal_id = str(uuid.uuid4())
        with self._conn() as db:
            self._ensure(db, user_id, now)
            db.execute('INSERT INTO proposals(id,user_id,kind,payload_json,rationale,created_at) VALUES(?,?,?,?,?,?)',
                       (proposal_id,user_id,kind,jdump(payload),rationale,stamp(now)))
        return {'proposal_id':proposal_id, 'status':'pending', 'preview':payload, 'rationale':rationale}

    def decide_proposal(self, user_id: str, proposal_id: str, approve: bool, now: datetime | None = None):
        user_id = self._user(user_id)
        now = now or utcnow()
        with self._conn() as db:
            db.execute('BEGIN IMMEDIATE')
            row = db.execute('SELECT * FROM proposals WHERE user_id=? AND id=?',
                             (user_id,proposal_id)).fetchone()
            if row is None:
                raise KeyError('Proposal not found for this learner')
            if row['status'] != 'pending':
                raise ValueError('Proposal already decided')
            payload = jload(row['payload_json'])
            if approve:
                if row['kind'] == 'preference':
                    db.execute('''INSERT INTO preferences(user_id,key,value,origin,updated_at)
                      VALUES(?,?,?,?,?) ON CONFLICT(user_id,key) DO UPDATE SET
                      value=excluded.value,origin=excluded.origin,updated_at=excluded.updated_at,
                      version=preferences.version+1''',
                               (user_id,payload['key'],payload['value'],'user_approved',stamp(now)))
                else:
                    db.execute('INSERT INTO approved_pack_facts VALUES(?,?,?,?,?,?)',
                               (str(uuid.uuid4()),user_id,payload['pack_id'],payload['fact'],'user_approved',stamp(now)))
            db.execute('UPDATE proposals SET status=?,reviewed_at=? WHERE id=?',
                       ('approved' if approve else 'rejected',stamp(now),proposal_id))
        return {'proposal_id':proposal_id,'status':'approved' if approve else 'rejected'}

    def select_focus(self, user_id: str, wheel_id: str, level_id: str, pack_id: str,
                     now: datetime | None = None):
        user_id = self._user(user_id)
        for value in (wheel_id,level_id,pack_id): _safe_text(value,80)
        now = now or utcnow()
        with self._conn() as db:
            self._ensure(db,user_id,now)
            day = self._local_date(db,user_id,now)
            db.execute('''INSERT INTO focus(user_id,wheel_id,level_id,pack_id,local_date,selected_at)
                VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET
                wheel_id=excluded.wheel_id,level_id=excluded.level_id,
                pack_id=excluded.pack_id,local_date=excluded.local_date,selected_at=excluded.selected_at''',
                       (user_id,wheel_id,level_id,pack_id,day,stamp(now)))
        return {'wheel_id':wheel_id,'level_id':level_id,'pack_id':pack_id,'local_date':day}

    def record_attempt(self, user_id: str, payload: dict, now: datetime | None = None):
        user_id = self._user(user_id)
        now = now or utcnow()
        required={'client_event_id','skill_id','wheel_id','level_id','pack_id','combination_id','rating','evidence'}
        if not required.issubset(payload) or set(payload)-required-{'error_tags'}:
            raise ValueError('Attempt fields invalid')
        for k in required:
            if k not in ('rating','evidence'): _safe_text(payload[k], 128)
        if payload['rating'] not in RATINGS or payload['evidence'] not in EVIDENCE:
            raise ValueError('Invalid rating or evidence')
        tags = payload.get('error_tags', [])
        if not isinstance(tags,list) or len(tags)>8 or any(not isinstance(t,str) or len(t)>64 for t in tags):
            raise ValueError('Invalid error tags')
        clean={key:payload[key] for key in sorted(required)}
        clean['error_tags']=sorted(set(tags))
        digest=hashlib.sha256(jdump(clean).encode()).hexdigest()
        with self._conn() as db:
            db.execute('BEGIN IMMEDIATE')
            self._ensure(db,user_id,now)
            existing=db.execute('SELECT id,digest FROM attempts WHERE user_id=? AND client_event_id=?',
                                (user_id,payload['client_event_id'])).fetchone()
            if existing:
                if existing['digest'] != digest:
                    raise ValueError('Idempotency key reused for different attempt')
                state=self._read_mastery(db,user_id,payload['skill_id'])
                return {'event_id':existing['id'],'duplicate':True,'mastery':state}
            eid=str(uuid.uuid4())
            db.execute('''INSERT INTO attempts VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                       (eid,user_id,payload['client_event_id'],payload['skill_id'],payload['wheel_id'],
                        payload['level_id'],payload['pack_id'],payload['combination_id'],payload['rating'],
                        payload['evidence'],jdump(clean['error_tags']),digest,stamp(now)))
            current=self._read_mastery(db,user_id,payload['skill_id'])
            correct=payload['evidence'] in VERIFIED and payload['rating'] in {'good','easy'}
            verified=payload['evidence'] in VERIFIED
            seen=current['seen']+1
            va=current['verified_attempts']+int(verified)
            vc=current['verified_correct']+int(correct)
            combinations=set(current['distinct_combinations'])
            days=set(current['distinct_days'])
            packs=set(current['distinct_packs'])
            if correct:
                combinations.add(payload['combination_id'])
                days.add(self._local_date(db,user_id,now))
                packs.add(payload['pack_id'])
            # bounded set of examples. Counters themselves remain unbounded.
            combinations=sorted(combinations)[-50:]
            days=sorted(days)[-60:]
            packs=sorted(packs)[-25:]
            stage=current['stage']
            if current['stage'] == 'review_due' and not correct:
                stage='review_due'
            elif verified and not correct and stage == 'mastered':
                stage='review_due'
            elif correct and vc>=5 and len(combinations)>=3 and len(days)>=2:
                stage='mastered'
            elif correct and vc>=3 and len(combinations)>=2:
                stage='ready'
            elif stage == 'unseen':
                stage='practising'
            due=stamp(now + timedelta(days=REVIEW_DAYS[min(vc-1,len(REVIEW_DAYS)-1)])) if correct else current['due_at']
            if verified and not correct:
                due=stamp(now)
            db.execute('''INSERT INTO mastery VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,skill_id)
                 DO UPDATE SET stage=excluded.stage,seen=excluded.seen,
                 verified_correct=excluded.verified_correct,verified_attempts=excluded.verified_attempts,
                 distinct_combinations_json=excluded.distinct_combinations_json,
                 distinct_days_json=excluded.distinct_days_json,distinct_packs_json=excluded.distinct_packs_json,
                 last_seen=excluded.last_seen,due_at=excluded.due_at''',
                       (user_id,payload['skill_id'],stage,seen,vc,va,jdump(combinations),jdump(days),
                        jdump(packs),stamp(now),due))
            state=self._read_mastery(db,user_id,payload['skill_id'])
        return {'event_id':eid,'duplicate':False,'mastery':state}

    def _read_mastery(self, db, user_id, skill_id):
        row=db.execute('SELECT * FROM mastery WHERE user_id=? AND skill_id=?', (user_id,skill_id)).fetchone()
        if not row:
            return {'skill_id':skill_id,'stage':'unseen','seen':0,'verified_attempts':0,'verified_correct':0,
                    'distinct_combinations':[],'distinct_days':[],'distinct_packs':[], 'last_seen':None,'due_at':None}
        d=dict(row)
        return {'skill_id':skill_id,'stage':d['stage'],'seen':d['seen'],
                'verified_attempts':d['verified_attempts'],'verified_correct':d['verified_correct'],
                'distinct_combinations':jload(d['distinct_combinations_json']),
                'distinct_days':jload(d['distinct_days_json']),
                'distinct_packs':jload(d['distinct_packs_json']),
                'last_seen':d['last_seen'],'due_at':d['due_at']}

    def context(self, user_id: str, now: datetime | None = None, max_skills: int = 6):
        user_id=self._user(user_id)
        now=now or utcnow()
        with self._conn() as db:
            exists=db.execute('SELECT tz FROM learners WHERE user_id=?',(user_id,)).fetchone()
            if not exists: return {'teaching_style':{},'daily_focus':None,'skill_summary':[],'approved_pack_facts':[], 'pending_suggestions':0}
            preferences={r['key']:r['value'] for r in db.execute('SELECT key,value FROM preferences WHERE user_id=?', (user_id,))}
            focus=db.execute('SELECT wheel_id,level_id,pack_id,local_date FROM focus WHERE user_id=?',(user_id,)).fetchone()
            skills=[]
            for row in db.execute('''SELECT * FROM mastery WHERE user_id=?
                                     ORDER BY CASE WHEN due_at IS NOT NULL AND due_at<=? THEN 0 ELSE 1 END,
                                              last_seen DESC LIMIT ?''',(user_id,stamp(now),min(max_skills,10))):
                skills.append({'skill_id':row['skill_id'],'stage':row['stage'],
                               'verified_correct':row['verified_correct'],
                               'seen':row['seen'],'due':bool(row['due_at'] and row['due_at']<=stamp(now))})
            facts=[{'id':r['id'],'pack_id':r['pack_id'],'fact':r['fact_text']} for r in db.execute('''SELECT id,pack_id,fact_text FROM approved_pack_facts
                         WHERE user_id=? ORDER BY updated_at DESC LIMIT 8''',(user_id,))]
            pending=db.execute("SELECT COUNT(*) FROM proposals WHERE user_id=? AND status='pending'",(user_id,)).fetchone()[0]
            return {'teaching_style':preferences,'daily_focus':dict(focus) if focus else None,
                    'skill_summary':skills,'approved_pack_facts':facts,'pending_suggestions':pending}

    def recommend(self, user_id: str, curriculum: list[dict], now: datetime | None = None):
        """Transparent deterministic recommendation; no hidden model-based scoring."""
        user_id=self._user(user_id)
        now=now or utcnow()
        with self._conn() as db:
            focus=db.execute('SELECT wheel_id,level_id,pack_id,local_date FROM focus WHERE user_id=?',(user_id,)).fetchone()
            if focus and focus['local_date']==self._local_date(db,user_id,now):
                return {'reason':'user_selected_daily_focus','lesson':dict(focus)}
            states={r['skill_id']:r for r in db.execute('SELECT * FROM mastery WHERE user_id=?',(user_id,))}
        # Past-due review is prioritized over new lessons.
        overdue=sorted((r for r in states.values() if r['due_at'] and r['due_at']<=stamp(now)),
                       key=lambda r:r['due_at'])
        if overdue:
            skill=overdue[0]['skill_id']
            match=next((x for x in curriculum if skill in x['skills']),None)
            if match:
                return {'reason':'review_due','lesson':match,'skill_id':skill}
        for lesson in curriculum:
            if all(states.get(s,{}).get('stage') in ('ready','mastered','review_due')
                   for s in lesson.get('prerequisites',[])):
                skill_states=[states.get(s,{}).get('stage','unseen') for s in lesson['skills']]
                if any(s in ('unseen','practising') for s in skill_states):
                    return {'reason':'next_foundation','lesson':lesson}
        return {'reason':'free_exploration','lesson':curriculum[0] if curriculum else None}

    def export(self, user_id: str):
        user_id=self._user(user_id)
        with self._conn() as db:
            tables=('learners','preferences','proposals','focus','attempts','mastery','approved_pack_facts')
            return {'schema_version':1,'export':{
                table:[dict(r) for r in db.execute(f'SELECT * FROM {table} WHERE user_id=?',(user_id,))]
                for table in tables}}

    def delete_user(self,user_id: str,confirm: bool):
        if confirm is not True: raise ValueError('Explicit deletion confirmation required')
        user_id=self._user(user_id)
        with self._conn() as db:
            db.execute('DELETE FROM learners WHERE user_id=?',(user_id,))
        return {'deleted':True}
