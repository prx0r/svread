"""Private gateway-only HTTP adapter. Never expose directly to the Internet.

Authentication boundary: an upstream OAuth 2.1 gateway validates access tokens,
scopes, user consent and identity, then supplies a service credential + opaque user ID.
This adapter is NOT a public MCP endpoint and does NOT implement OAuth.
"""
import hmac
import json
import os
from pathlib import Path
from fastapi import FastAPI, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from .store import TutorStore

ROOT=Path(__file__).resolve().parents[1]
DB_PATH=os.getenv('SVAT_TUTOR_DB',str(ROOT/'data'/'tutor.sqlite3'))
store=TutorStore(DB_PATH)
app=FastAPI(title='Svatantrya Tutor Internal Service', version='0.1.0', docs_url=None, redoc_url=None)

class Preference(BaseModel):
    value: str = Field(min_length=1,max_length=280)
class Proposal(BaseModel):
    kind: str
    payload: dict
    rationale: str
class Decision(BaseModel):
    approve: bool
class Focus(BaseModel):
    wheel_id: str
    level_id: str
    pack_id: str
class Attempt(BaseModel):
    client_event_id: str
    skill_id: str
    wheel_id: str
    level_id: str
    pack_id: str
    combination_id: str
    rating: str
    evidence: str
    error_tags: list[str] = Field(default_factory=list)
class Delete(BaseModel):
    confirm_delete_all: bool
class Timezone(BaseModel):
    timezone: str


def authorized_user(x_internal_service_token: str | None = Header(None),
                    x_authenticated_user_id: str | None = Header(None)) -> str:
    expected=os.environ.get('SVAT_TUTOR_INTERNAL_TOKEN','')
    if not expected or not x_internal_service_token or not hmac.compare_digest(x_internal_service_token,expected):
        raise HTTPException(401,'Trusted gateway authentication required')
    if not x_authenticated_user_id:
        raise HTTPException(401,'Gateway user identity missing')
    if len(x_authenticated_user_id)>128:
        raise HTTPException(400,'Invalid user identity')
    return x_authenticated_user_id

@app.get('/health')
def health():
    # Liveness only; never leaks user records, keys or database paths.
    return {'ok':True}

@app.get('/v1/context')
def get_context(user_id: str = Depends(authorized_user)):
    return store.context(user_id)

@app.put('/v1/preferences/{key}')
def put_preference(key:str, data:Preference, user_id:str=Depends(authorized_user)):
    try: return store.update_preference(user_id,key,data.value)
    except ValueError as e: raise HTTPException(400,str(e))

@app.delete('/v1/preferences/{key}')
def delete_preference(key:str, user_id:str=Depends(authorized_user)):
    try: return store.delete_preference(user_id,key)
    except ValueError as e: raise HTTPException(400,str(e))

@app.delete('/v1/pack-facts/{fact_id}')
def delete_pack_fact(fact_id:str,user_id:str=Depends(authorized_user)):
    try: return store.delete_pack_fact(user_id,fact_id)
    except ValueError as e: raise HTTPException(400,str(e))

@app.post('/v1/proposals')
def new_proposal(data:Proposal,user_id:str=Depends(authorized_user)):
    try: return store.propose(user_id,data.kind,data.payload,data.rationale)
    except ValueError as e: raise HTTPException(400,str(e))

@app.post('/v1/proposals/{proposal_id}/decision')
def decide_proposal(proposal_id:str,data:Decision,user_id:str=Depends(authorized_user)):
    try: return store.decide_proposal(user_id,proposal_id,data.approve)
    except KeyError: raise HTTPException(404,'Not found')
    except ValueError as e: raise HTTPException(409,str(e))

@app.post('/v1/focus')
def set_focus(data:Focus,user_id:str=Depends(authorized_user)):
    try: return store.select_focus(user_id,data.wheel_id,data.level_id,data.pack_id)
    except ValueError as e: raise HTTPException(400,str(e))

@app.post('/v1/attempts')
def post_attempt(data:Attempt,user_id:str=Depends(authorized_user),
                 x_internal_assessor_token: str | None = Header(None)):
    if data.evidence in ('exact_match','human_review'):
        assessor=os.environ.get('SVAT_TUTOR_ASSESSOR_TOKEN','')
        if not assessor or not x_internal_assessor_token or not hmac.compare_digest(assessor,x_internal_assessor_token):
            raise HTTPException(403,'Verified assessment requires trusted grading service')
    try: return store.record_attempt(user_id,data.model_dump())
    except ValueError as e: raise HTTPException(400,str(e))

@app.get('/v1/recommendation')
def get_recommendation(user_id:str=Depends(authorized_user)):
    curriculum=json.loads((ROOT/'fixtures'/'curriculum.json').read_text(encoding='utf8'))
    return store.recommend(user_id,curriculum)

@app.put('/v1/timezone')
def set_timezone(data:Timezone,user_id:str=Depends(authorized_user)):
    try:
        store.set_timezone(user_id,data.timezone)
        return {'timezone':data.timezone}
    except (ValueError,KeyError) as e: raise HTTPException(400,str(e))

@app.get('/v1/export')
def export(user_id:str=Depends(authorized_user)):
    return store.export(user_id)

@app.post('/v1/delete-account-data')
def delete(data:Delete,user_id:str=Depends(authorized_user)):
    try: return store.delete_user(user_id,data.confirm_delete_all)
    except ValueError as e: raise HTTPException(400,str(e))
