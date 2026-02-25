#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import logging
from app.database import SessionLocal
from app import crud, sheets, models

def sync_all():
    logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
    log = logging.getLogger('sync')
    db = SessionLocal()
    try:
        clubs = db.query(models.Club).all()
        if not clubs:
            log.info('No clubs found in database.')
            return
        for club in clubs:
            log.info('=== Syncing club: %s (%s) ===', club.name, club.id)
            students_db = crud.get_students_for_club(db, club.id)
            students = []
            student_map = {}
            for s in students_db:
                students.append({'id': s.id, 'name': s.name, 'email': s.email, 'register_no': s.register_no or '', 'enrollment_date': s.enrollment_date or ''})
                student_map[s.id] = s.name
            sessions_db = crud.get_sessions_for_club(db, club.id)
            sessions = []
            attendance_by_session = {}
            for ses in sessions_db:
                creator = db.query(models.User).filter(models.User.id == ses.created_by).first()
                sessions.append({'id': ses.id, 'name': ses.name, 'date': ses.date, 'time': ses.time, 'created_by': creator.name if creator else '', 'created_at': ses.created_at.isoformat() if getattr(ses, 'created_at', None) else ''})
                att_records = crud.get_attendance_for_session(db, ses.id)
                if att_records:
                    items = []
                    for a in att_records:
                        mb_user = db.query(models.User).filter(models.User.id == a.marked_by).first()
                        items.append({'studentId': a.student_id, 'studentName': student_map.get(a.student_id, a.student_id), 'status': a.status, 'marked_by': mb_user.email if mb_user else ''})
                    attendance_by_session[ses.id] = items
            log.info('  %d students, %d sessions, %d with attendance', len(students), len(sessions), len(attendance_by_session))
            res = sheets.sync_club_as_tables(club.name, students, sessions, attendance_by_session, student_map)
            log.info('  Result: %s', res)
        log.info('=== Full sync completed ===')
    finally:
        db.close()

if __name__ == '__main__':
    sync_all()
