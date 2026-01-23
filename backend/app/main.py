from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, schemas, crud
from .database import SessionLocal, engine, Base
from . import sheets
import os
from fastapi.responses import RedirectResponse
from fastapi import Request
from typing import Any
try:
    from google_auth_oauthlib.flow import Flow
except Exception:
    Flow = None

# create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title='Club Attendance API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv('FRONTEND_ORIGIN', '*')],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post('/login', response_model=schemas.UserOut)
def login(payload: dict, db: Session = Depends(get_db)):
    email = payload.get('email')
    if not email:
        raise HTTPException(status_code=400, detail='Email required')
    user = crud.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid email')
    # return user with alias mapping (pydantic will handle)
    return user

@app.get('/sessions', response_model=list[schemas.SessionOut])
def list_sessions(clubId: str, db: Session = Depends(get_db)):
    sessions = crud.get_sessions_for_club(db, clubId)
    return sessions

@app.get('/students', response_model=list[schemas.StudentOut])
def list_students(clubId: str, db: Session = Depends(get_db)):
    students = crud.get_students_for_club(db, clubId)
    return students


@app.post('/students', response_model=schemas.StudentOut)
def create_student(student_in: schemas.StudentCreate, db: Session = Depends(get_db)):
    payload = student_in.dict(by_alias=True)
    # ensure id exists
    if not payload.get('id'):
        payload['id'] = f"student-{int(__import__('time').time()*1000)}"
    s = crud.create_student(db, payload)
    return s


@app.put('/students/{student_id}', response_model=schemas.StudentOut)
def update_student(student_id: str, patch: schemas.StudentUpdate, db: Session = Depends(get_db)):
    payload = {k: v for k, v in patch.dict(by_alias=True, exclude_unset=True).items()}
    s = crud.update_student(db, student_id, payload)
    if not s:
        raise HTTPException(status_code=404, detail='Student not found')
    return s


@app.delete('/students/{student_id}')
def delete_student(student_id: str, db: Session = Depends(get_db)):
    ok = crud.delete_student(db, student_id)
    if not ok:
        raise HTTPException(status_code=404, detail='Student not found')
    return {'ok': True}


@app.post('/sessions', response_model=schemas.SessionOut)
def create_session(session_in: schemas.SessionCreate, db: Session = Depends(get_db)):
    payload = session_in.dict(by_alias=True)
    if not payload.get('id'):
        payload['id'] = f"session-{int(__import__('time').time()*1000)}"
    # validate club and user exist to provide clearer errors
    club = db.query(models.Club).filter(models.Club.id == payload.get('club_id')).first()
    if not club:
        raise HTTPException(status_code=400, detail=f"Club not found: {payload.get('club_id')}")
    user = db.query(models.User).filter(models.User.id == payload.get('created_by')).first()
    if not user:
        raise HTTPException(status_code=400, detail=f"User not found: {payload.get('created_by')}")
    try:
        s = crud.create_session(db, payload)
        return s
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put('/sessions/{session_id}', response_model=schemas.SessionOut)
def update_session(session_id: str, patch: schemas.SessionUpdate, db: Session = Depends(get_db)):
    payload = {k: v for k, v in patch.dict(by_alias=True, exclude_unset=True).items()}
    s = crud.update_session(db, session_id, payload)
    if not s:
        raise HTTPException(status_code=404, detail='Session not found')
    return s


@app.delete('/sessions/{session_id}')
def delete_session(session_id: str, db: Session = Depends(get_db)):
    ok = crud.delete_session(db, session_id)
    if not ok:
        raise HTTPException(status_code=404, detail='Session not found')
    return {'ok': True}

@app.get('/attendance/session/{session_id}', response_model=list[schemas.AttendanceOut])
def get_attendance(session_id: str, db: Session = Depends(get_db)):
    records = crud.get_attendance_for_session(db, session_id)
    return records

@app.post('/attendance/save', response_model=list[schemas.AttendanceOut])
def save_attendance(payload: schemas.AttendanceSave, db: Session = Depends(get_db)):
    # payload has sessionId, markedBy, items
    session_id = payload.sessionId
    marked_by = payload.markedBy
    items = [item.dict(by_alias=True) for item in payload.items]
    results = crud.upsert_attendance_items(db, session_id, marked_by, items)
    # attempt to save to Google Sheets (best-effort)
    try:
        # fetch session metadata
        s = db.query(models.Session).filter(models.Session.id == session_id).first()
        session_data = {
            'name': getattr(s, 'name', ''),
            'date': getattr(s, 'date', ''),
            'time': getattr(s, 'time', ''),
        }
        # call sheets helper
        try:
            sheets.save_session_attendance(session_data, items, marked_by)
        except Exception:
            pass
    except Exception:
        pass
    return results


@app.post('/sheets/save')
def save_to_sheets(payload: schemas.SheetsSave):
    # Save attendance directly to Google Sheets (no DB required)
    session_data = {
        'name': payload.sessionName,
        'date': payload.sessionDate,
        'time': payload.sessionTime,
    }
    items = [it.dict(by_alias=True) for it in payload.items]
    res = sheets.save_session_attendance(session_data, items, payload.email)
    if not res.get('ok'):
        raise HTTPException(status_code=500, detail=res.get('error'))
    return {'ok': True}


@app.get('/sheets/oauth/start')
def sheets_oauth_start():
    # Returns a redirect to Google's OAuth consent page. Requires a client secrets JSON.
    client_secrets = os.getenv('GOOGLE_OAUTH_CLIENT_SECRETS')
    if not client_secrets:
        # default to project backend/client_secret.json (relative to this file)
        client_secrets = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'client_secret.json'))
    if not os.path.exists(client_secrets):
        raise HTTPException(status_code=500, detail=f'Client secrets file not found; set GOOGLE_OAUTH_CLIENT_SECRETS. Checked: {client_secrets}')
    if Flow is None:
        raise HTTPException(status_code=500, detail='OAuth libraries not installed')
    redirect_uri = os.getenv('OAUTH_REDIRECT_URI', 'http://localhost:8000/sheets/oauth/callback')
    flow = Flow.from_client_secrets_file(client_secrets, scopes=sheets.SCOPES, redirect_uri=redirect_uri)
    auth_url, state = flow.authorization_url(access_type='offline', include_granted_scopes='true', prompt='consent')
    return RedirectResponse(auth_url)


@app.get('/sheets/oauth/callback')
def sheets_oauth_callback(request: Request):
    # Exchange code and store token to file specified by GOOGLE_OAUTH_TOKEN_FILE
    client_secrets = os.getenv('GOOGLE_OAUTH_CLIENT_SECRETS')
    if not client_secrets:
        client_secrets = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'client_secret.json'))
    token_file = os.getenv('GOOGLE_OAUTH_TOKEN_FILE')
    if not token_file:
        token_file = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'oauth_token.json'))
    if not os.path.exists(client_secrets):
        raise HTTPException(status_code=500, detail=f'Client secrets file not found. Checked: {client_secrets}')
    if Flow is None:
        raise HTTPException(status_code=500, detail='OAuth libraries not installed')
    redirect_uri = os.getenv('OAUTH_REDIRECT_URI', 'http://localhost:8000/sheets/oauth/callback')
    flow = Flow.from_client_secrets_file(client_secrets, scopes=sheets.SCOPES, redirect_uri=redirect_uri)
    # full URL including query params
    authorization_response = str(request.url)
    try:
        flow.fetch_token(authorization_response=authorization_response)
        creds = flow.credentials
        # persist credentials
        with open(token_file, 'w', encoding='utf-8') as fh:
            fh.write(creds.to_json())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to fetch token: {e}')
    return {'ok': True, 'message': f'Credentials saved to {token_file}'}
