"""Local, anonymous demonstration; no chat/plugin/network calls."""
import json
import tempfile
from pathlib import Path
from datetime import datetime, timezone
from backend.store import TutorStore

with tempfile.TemporaryDirectory() as folder:
    s=TutorStore(Path(folder)/'learner.sqlite3')
    user='sample-anonymous-learner'
    now=datetime.now(timezone.utc)
    proposal=s.propose(user,'preference',{'key':'script_reveal','value':'Show Devanagari first; reveal IAST and English on request'},'Learner explicitly asked about this learning mode',now)
    print('Preference proposal (not saved yet):',proposal['preview'])
    s.decide_proposal(user,proposal['proposal_id'],True,now)
    s.select_focus(user,'conversation','1.1','about-me',now)
    s.record_attempt(user,{'client_event_id':'sample-1','skill_id':'question.name','wheel_id':'conversation','level_id':'1.1',
                           'pack_id':'about-me','combination_id':'demo-question-1','rating':'good','evidence':'self_report'},now)
    print('Tutor context:')
    print(json.dumps(s.context(user,now),indent=2,ensure_ascii=False))
    print('Self report does not confer mastery.')
