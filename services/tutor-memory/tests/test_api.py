import importlib
from fastapi.testclient import TestClient


def test_private_api_fail_closed_and_isolated(monkeypatch,tmp_path):
    monkeypatch.setenv('SVAT_TUTOR_DB',str(tmp_path/'private.sqlite3'))
    monkeypatch.setenv('SVAT_TUTOR_INTERNAL_TOKEN','an-internal-only-secret')
    from backend import api
    importlib.reload(api)
    client=TestClient(api.app)
    assert client.get('/v1/context').status_code == 401
    assert client.get('/v1/context',headers={'X-Authenticated-User-Id':'alice'}).status_code == 401
    headers={'X-Internal-Service-Token':'an-internal-only-secret','X-Authenticated-User-Id':'alice'}
    other={'X-Internal-Service-Token':'an-internal-only-secret','X-Authenticated-User-Id':'bob'}
    assert client.put('/v1/preferences/pacing',headers=headers,json={'value':'Quick fire'}).status_code==200
    assert client.get('/v1/context',headers=headers).json()['teaching_style']=={'pacing':'Quick fire'}
    assert client.get('/v1/context',headers=other).json()['teaching_style']=={}
    assert client.get('/v1/recommendation',headers=headers).status_code==200
    result={'client_event_id':'e1','skill_id':'question.name','wheel_id':'conversation','level_id':'1.1','pack_id':'about-me','combination_id':'c1','rating':'good','evidence':'exact_match'}
    assert client.post('/v1/attempts',headers=headers,json=result).status_code==403
    result['evidence']='self_report'
    assert client.post('/v1/attempts',headers=headers,json=result).status_code==200
    assert client.post('/v1/delete-account-data',headers=headers,json={'confirm_delete_all':False}).status_code==400
    assert client.post('/v1/delete-account-data',headers=headers,json={'confirm_delete_all':True}).status_code==200
    assert client.get('/v1/context',headers=headers).json()['teaching_style']=={}
