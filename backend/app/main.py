from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, schemas, crud
from .database import SessionLocal, engine, Base
from . import sheets
import os
import logging
from fastapi.responses import RedirectResponse
from fastapi import Request
from typing import Any
try:
    from google_auth_oauthlib.flow import Flow
except Exception:
    Flow = None

LOG = logging.getLogger('main')

# create DB tables
Base.metadata.create_all(bind=engine)

# Migrate: add missing columns (SQLite)
try:
    from sqlalchemy import text, inspect as sa_inspect
    inspector = sa_inspect(engine)
    session_cols = [c['name'] for c in inspector.get_columns('sessions')]
    if 'sheet_saved_at' not in session_cols:
        with engine.connect() as conn:
            conn.execute(text('ALTER TABLE sessions ADD COLUMN sheet_saved_at DATETIME'))
            conn.commit()
    user_cols = [c['name'] for c in inspector.get_columns('users')]
    if 'password_hash' not in user_cols:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR DEFAULT ''"))
            conn.commit()
    student_cols = [c['name'] for c in inspector.get_columns('students')]
    if 'register_no' not in student_cols:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE students ADD COLUMN register_no VARCHAR"))
            conn.commit()
except Exception:
    pass

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


def _get_club_name(db: Session, club_id: str) -> str:
    """Resolve club name from club_id."""
    club = db.query(models.Club).filter(models.Club.id == club_id).first()
    return club.name if club else 'Unknown'


# ============================================================================
# Auth
# ============================================================================

@app.post('/login')
def login(payload: schemas.LoginPayload, db: Session = Depends(get_db)):
    from passlib.hash import bcrypt
    user = crud.get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid email or password')
    if not bcrypt.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail='Invalid email or password')
    club = db.query(models.Club).filter(models.Club.id == user.club_id).first()
    return {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role.value,
        'club_id': user.club_id,
        'clubName': club.name if club else None,
        'clubColor': club.color if club else None,
    }


# ============================================================================
# Sessions  (auto-synced to Google Sheets)
# ============================================================================

@app.get('/sessions', response_model=list[schemas.SessionOut])
def list_sessions(clubId: str, db: Session = Depends(get_db)):
    return crud.get_sessions_for_club(db, clubId)


@app.post('/sessions', response_model=schemas.SessionOut)
def create_session(session_in: schemas.SessionCreate, db: Session = Depends(get_db)):
    payload = session_in.dict(by_alias=True)
    if not payload.get('id'):
        payload['id'] = f"session-{int(__import__('time').time()*1000)}"

    club = db.query(models.Club).filter(models.Club.id == payload.get('club_id')).first()
    if not club:
        raise HTTPException(status_code=400, detail=f"Club not found: {payload.get('club_id')}")
    user = db.query(models.User).filter(models.User.id == payload.get('created_by')).first()
    if not user:
        raise HTTPException(status_code=400, detail=f"User not found: {payload.get('created_by')}")

    try:
        s = crud.create_session(db, payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Sync to Google Sheet (background, don't fail the request)
    try:
        sheet_data = {
            'id': s.id,
            'name': s.name,
            'date': s.date,
            'time': s.time,
            'created_by': user.name,
            'created_at': s.created_at.isoformat() if s.created_at else '',
        }
        sheets.save_session_to_sheet(club.name, sheet_data)
    except Exception as e:
        LOG.warning('Sheet sync failed on session create: %s', e)

    return s


@app.put('/sessions/{session_id}', response_model=schemas.SessionOut)
def update_session(session_id: str, patch: schemas.SessionUpdate, db: Session = Depends(get_db)):
    payload = {k: v for k, v in patch.dict(by_alias=True, exclude_unset=True).items()}
    s = crud.update_session(db, session_id, payload)
    if not s:
        raise HTTPException(status_code=404, detail='Session not found')

    # Sync update to Google Sheet
    try:
        club_name = _get_club_name(db, s.club_id)
        sheet_data = {
            'name': s.name,
            'date': s.date,
            'time': s.time,
        }
        sheets.update_session_in_sheet(club_name, session_id, sheet_data)
    except Exception as e:
        LOG.warning('Sheet sync failed on session update: %s', e)

    return s


@app.delete('/sessions/{session_id}')
def delete_session(session_id: str, db: Session = Depends(get_db)):
    # Get club info before deleting
    session_obj = db.query(models.Session).filter(models.Session.id == session_id).first()
    club_name = _get_club_name(db, session_obj.club_id) if session_obj else None

    ok = crud.delete_session(db, session_id)
    if not ok:
        raise HTTPException(status_code=404, detail='Session not found')

    # Sync delete to Google Sheet
    if club_name:
        try:
            sheets.delete_session_from_sheet(club_name, session_id)
        except Exception as e:
            LOG.warning('Sheet sync failed on session delete: %s', e)

    return {'ok': True}


# ============================================================================
# Students  (auto-synced to Google Sheets)
# ============================================================================

@app.get('/students', response_model=list[schemas.StudentOut])
def list_students(clubId: str, db: Session = Depends(get_db)):
    return crud.get_students_for_club(db, clubId)


@app.post('/students', response_model=schemas.StudentOut)
def create_student(student_in: schemas.StudentCreate, db: Session = Depends(get_db)):
    payload = student_in.dict(by_alias=True)
    if not payload.get('id'):
        payload['id'] = f"student-{int(__import__('time').time()*1000)}"
    s = crud.create_student(db, payload)

    # Sync to Google Sheet
    try:
        club_name = _get_club_name(db, s.club_id)
        sheet_data = {
            'id': s.id,
            'name': s.name,
            'email': s.email,
            'register_no': s.register_no or '',
            'enrollment_date': s.enrollment_date or '',
        }
        sheets.save_student_to_sheet(club_name, sheet_data)
    except Exception as e:
        LOG.warning('Sheet sync failed on student create: %s', e)

    return s


@app.put('/students/{student_id}', response_model=schemas.StudentOut)
def update_student(student_id: str, patch: schemas.StudentUpdate, db: Session = Depends(get_db)):
    payload = {k: v for k, v in patch.dict(by_alias=True, exclude_unset=True).items()}
    s = crud.update_student(db, student_id, payload)
    if not s:
        raise HTTPException(status_code=404, detail='Student not found')

    # Sync update to Google Sheet
    try:
        club_name = _get_club_name(db, s.club_id)
        sheet_data = {
            'name': s.name,
            'email': s.email,
            'register_no': s.register_no or '',
        }
        sheets.update_student_in_sheet(club_name, s.id, sheet_data)
    except Exception as e:
        LOG.warning('Sheet sync failed on student update: %s', e)

    return s


@app.delete('/students/{student_id}')
def delete_student(student_id: str, db: Session = Depends(get_db)):
    # Get club info before deleting
    student_obj = db.query(models.Student).filter(models.Student.id == student_id).first()
    club_name = _get_club_name(db, student_obj.club_id) if student_obj else None

    ok = crud.delete_student(db, student_id)
    if not ok:
        raise HTTPException(status_code=404, detail='Student not found')

    # Sync delete to Google Sheet
    if club_name:
        try:
            sheets.delete_student_from_sheet(club_name, student_id)
        except Exception as e:
            LOG.warning('Sheet sync failed on student delete: %s', e)

    return {'ok': True}


# ============================================================================
# Users
# ============================================================================

@app.get('/users')
def list_users(clubId: str, db: Session = Depends(get_db)):
    users = db.query(models.User).filter(models.User.club_id == clubId).all()
    return [{'id': u.id, 'name': u.name, 'email': u.email, 'role': u.role.value, 'club_id': u.club_id} for u in users]


# ============================================================================
# Attendance  (auto-synced to Google Sheets)
# ============================================================================

@app.get('/attendance/session/{session_id}', response_model=list[schemas.AttendanceOut])
def get_attendance(session_id: str, db: Session = Depends(get_db)):
    return crud.get_attendance_for_session(db, session_id)


@app.post('/attendance/save', response_model=list[schemas.AttendanceOut])
def save_attendance(payload: schemas.AttendanceSave, db: Session = Depends(get_db)):
    session_id = payload.sessionId
    marked_by = payload.markedBy
    items = [item.dict(by_alias=True) for item in payload.items]
    results = crud.upsert_attendance_items(db, session_id, marked_by, items)
    # Attendance sheet sync is done via explicit /sheets/save endpoint
    return results


@app.post('/sheets/save')
def save_to_sheets(payload: schemas.SheetsSave, db: Session = Depends(get_db)):
    """Explicitly save attendance to Google Sheets when user clicks Save to Sheet."""
    session_obj = db.query(models.Session).filter(models.Session.id == payload.sessionId).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail='Session not found')
    if session_obj.sheet_saved_at:
        raise HTTPException(status_code=409, detail='Attendance already saved to sheet')

    club_name = _get_club_name(db, session_obj.club_id)

    # Resolve student names
    student_map = {}
    for st in db.query(models.Student).filter(models.Student.club_id == session_obj.club_id).all():
        student_map[st.id] = st.name

    items_with_names = []
    for it in payload.items:
        sid = it.studentId
        items_with_names.append({
            'studentId': sid,
            'studentName': student_map.get(sid, sid),
            'status': it.status,
        })

    session_data = {
        'id': session_obj.id,
        'name': session_obj.name,
        'date': session_obj.date,
        'time': session_obj.time,
    }
    res = sheets.save_session_attendance(club_name, session_data, items_with_names, payload.email)
    if not res.get('ok'):
        raise HTTPException(status_code=500, detail=res.get('error'))

    from datetime import datetime as dt
    session_obj.sheet_saved_at = dt.utcnow()
    db.add(session_obj)
    db.commit()

    return {'ok': True}


# ============================================================================
# OAuth flow (kept for initial setup)
# ============================================================================

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
