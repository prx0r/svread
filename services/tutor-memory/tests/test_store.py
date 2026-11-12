import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
import pytest
from backend.store import TutorStore

T0=datetime(2026,11,12,8,0,tzinfo=timezone.utc)

@pytest.fixture
def store(tmp_path): return TutorStore(tmp_path/'tutor.sqlite3')

def attempt(event='evt-1', rating='good', evidence='exact_match', pack='about-me',combo='a',skill='verb.present.person'):
    return {'client_event_id':event,'skill_id':skill,'wheel_id':'action','level_id':'3.1',
            'pack_id':pack,'combination_id':combo,'rating':rating,'evidence':evidence,'error_tags':[]}

def test_no_user_leakage_and_explicit_preferences(store):
    store.update_preference('learner-A','pacing','Short fast drills',T0)
    assert store.context('learner-A')['teaching_style']['pacing']=='Short fast drills'
    assert store.context('learner-B')['teaching_style']=={}
    assert store.export('learner-B')['export']['preferences']==[]

def test_suggestions_need_approval(store):
    p=store.propose('A','preference',{'key':'pacing','value':'Rapid-fire'},'Learner requested shorter lessons',T0)
    assert store.context('A')['teaching_style']=={}
    store.decide_proposal('A',p['proposal_id'],True,T0)
    assert store.context('A')['teaching_style']['pacing']=='Rapid-fire'
    with pytest.raises(ValueError): store.decide_proposal('A',p['proposal_id'],True,T0)
    with pytest.raises(KeyError): store.decide_proposal('B',p['proposal_id'],True,T0)

def test_unapproved_pack_facts_not_in_context(store):
    p=store.propose('A','pack_fact',{'pack_id':'about-me','fact':'Enjoys Sanskrit word families'},'Requested pack seed',T0)
    assert not store.context('A')['approved_pack_facts']
    store.decide_proposal('A',p['proposal_id'],True,T0)
    assert store.context('A')['approved_pack_facts'][0]['fact']=='Enjoys Sanskrit word families'

def test_idempotency_and_conflict(store):
    first=store.record_attempt('A',attempt(),T0)
    second=store.record_attempt('A',attempt(),T0)
    assert first['event_id']==second['event_id'] and second['duplicate']
    assert second['mastery']['seen']==1
    with pytest.raises(ValueError): store.record_attempt('A',attempt(rating='again'),T0)

def test_self_report_cannot_become_verified_mastery(store):
    for i in range(10):
        s=store.record_attempt('A',attempt(event=f'e{i}',evidence='self_report',combo=f'c{i}'),T0)
    assert s['mastery']['stage']=='practising'
    assert s['mastery']['verified_correct']==0


def test_mastery_requires_verified_correct_and_multiple_days(store):
    for i in range(4):
        out=store.record_attempt('A',attempt(event=f'e{i}',combo=f'c{i}'),T0)
    assert out['mastery']['stage']=='ready'
    assert out['mastery']['verified_correct']==4
    out=store.record_attempt('A',attempt(event='e4',combo='c4',pack='trika'),T0+timedelta(days=2))
    assert out['mastery']['stage']=='mastered'
    assert set(out['mastery']['distinct_packs'])=={'about-me','trika'}
    out=store.record_attempt('A',attempt(event='e5',rating='again',combo='c5'),T0+timedelta(days=4))
    assert out['mastery']['stage']=='review_due'


def test_focus_and_neighbors_do_not_mutate_focus(store):
    store.set_timezone('A','Asia/Kolkata',T0)
    chosen=store.select_focus('A','conversation','1.1','about-me',T0)
    assert chosen['local_date']=='2026-11-12'
    curriculum=json.loads((Path(__file__).parents[1]/'fixtures/curriculum.json').read_text())
    rec=store.recommend('A',curriculum,T0)
    assert rec['reason']=='user_selected_daily_focus'
    store.record_attempt('A',attempt(),T0)
    assert store.context('A')['daily_focus']['level_id']=='1.1'


def test_delete_and_export(store):
    store.update_preference('A','pacing','Quick',T0)
    store.record_attempt('A',attempt(),T0)
    data=store.export('A')['export']
    assert data['preferences'] and data['attempts']
    with pytest.raises(ValueError): store.delete_user('A',False)
    store.delete_user('A',True)
    assert store.context('A')['teaching_style']=={}
    assert all(not rows for rows in store.export('A')['export'].values())


def test_reject_secret_like_profile_strings(store):
    with pytest.raises(ValueError):
        store.update_preference('A','pacing','password: something',T0)
    with pytest.raises(ValueError):
        store.propose('A','pack_fact',{'pack_id':'personal','fact':'api_key=12345'},'Not safe',T0)


def test_no_proposal_can_override_unknown_preference(store):
    with pytest.raises(ValueError):
        store.propose('A','preference',{'key':'medical_details','value':'Something'},'reason',T0)


def test_revision_is_versioned(store):
    store.update_preference('A','pacing','Short',T0)
    store.update_preference('A','pacing','Longer',T0+timedelta(days=1))
    assert store.export('A')['export']['preferences'][0]['version']==2


def test_only_owned_data_returned_by_context(store):
    store.record_attempt('A',attempt(event='1',skill='known'),T0)
    store.record_attempt('B',attempt(event='1',skill='secret-skill'),T0)
    assert [s['skill_id'] for s in store.context('A')['skill_summary']]==['known']


def test_failed_review_cannot_be_restored_by_self_report(store):
    for i in range(5):
        store.record_attempt('A',attempt(event=f'ver{i}',combo=f'c{i}'),T0+timedelta(days=i))
    assert store.context('A')['skill_summary'][0]['stage']=='mastered'
    store.record_attempt('A',attempt(event='fail',rating='again'),T0+timedelta(days=6))
    store.record_attempt('A',attempt(event='self',evidence='self_report'),T0+timedelta(days=7))
    assert store.context('A')['skill_summary'][0]['stage']=='review_due'


def test_delete_single_pack_fact_and_preference(store):
    store.update_preference('A','pacing','Quick',T0)
    p=store.propose('A','pack_fact',{'pack_id':'about-me','fact':'Studies Sanskrit'},'Learner asked',T0)
    store.decide_proposal('A',p['proposal_id'],True,T0)
    fid=store.context('A')['approved_pack_facts'][0]['id']
    store.delete_pack_fact('A',fid)
    store.delete_preference('A','pacing')
    assert store.context('A')['approved_pack_facts']==[]
    assert store.context('A')['teaching_style']=={}
