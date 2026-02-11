from sqlalchemy.orm import Session
from . import models
from . import schemas
from datetime import datetime

# Simple CRUD helpers

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_sessions_for_club(db: Session, club_id: str):
    return db.query(models.Session).filter(models.Session.club_id == club_id).all()

def get_students_for_club(db: Session, club_id: str):
    return db.query(models.Student).filter(models.Student.club_id == club_id).all()

def get_attendance_for_session(db: Session, session_id: str):
    return db.query(models.AttendanceRecord).filter(models.AttendanceRecord.session_id == session_id).all()

def upsert_attendance_items(db: Session, session_id: str, marked_by: str, items: list):
    # items: list of dicts with studentId and status
    results = []
    for item in items:
        student_id = item.get('studentId') or item.get('student_id')
        status = item.get('status')
        # check existing record for this session+student
        existing = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.session_id == session_id,
            models.AttendanceRecord.student_id == student_id
        ).first()

        if existing:
            existing.status = status
            existing.marked_by = marked_by
            existing.marked_at = datetime.utcnow()
            db.add(existing)
            results.append(existing)
        else:
            new = models.AttendanceRecord(
                id=f"att-{int(datetime.utcnow().timestamp()*1000)}-{student_id}",
                session_id=session_id,
                student_id=student_id,
                status=status,
                marked_by=marked_by,
                marked_at=datetime.utcnow(),
            )
            db.add(new)
            results.append(new)
    db.commit()
    return results


def create_student(db: Session, student_in: dict):
    s = models.Student(**student_in)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def update_student(db: Session, student_id: str, patch: dict):
    s = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not s:
        return None
    for k, v in patch.items():
        if k == 'clubId':
            setattr(s, 'club_id', v)
        elif k == 'enrollmentDate':
            setattr(s, 'enrollment_date', v)
        elif k == 'registerNo':
            setattr(s, 'register_no', v)
        else:
            setattr(s, k, v)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def delete_student(db: Session, student_id: str):
    s = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not s:
        return False
    db.delete(s)
    db.commit()
    return True


def create_session(db: Session, session_in: dict):
    ses = models.Session(**session_in)
    db.add(ses)
    db.commit()
    db.refresh(ses)
    return ses


def update_session(db: Session, session_id: str, patch: dict):
    s = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not s:
        return None
    for k, v in patch.items():
        if k == 'clubId':
            setattr(s, 'club_id', v)
        elif k == 'createdBy':
            setattr(s, 'created_by', v)
        else:
            setattr(s, k, v)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def delete_session(db: Session, session_id: str):
    s = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not s:
        return False
    # delete attendance for session as well
    db.query(models.AttendanceRecord).filter(models.AttendanceRecord.session_id == session_id).delete()
    db.delete(s)
    db.commit()
    return True
