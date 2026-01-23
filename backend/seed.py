from app.database import SessionLocal, engine, Base
from app import models

Base.metadata.create_all(bind=engine)

mock_clubs = [
    {"id": "club-1", "name": "Chess Club", "description": "Strategic thinking and competitive chess", "color": "#3B82F6"},
    {"id": "club-2", "name": "Robotics Club", "description": "Build and program robots", "color": "#10B981"},
    {"id": "club-3", "name": "Drama Club", "description": "Theatre and performing arts", "color": "#F59E0B"},
]

mock_users = [
    {"id": "user-1", "name": "Sarah Johnson", "email": "sarah.admin@chess.com", "role": "admin", "club_id": "club-1"},
    {"id": "user-2", "name": "Mike Chen", "email": "mike.tutor@chess.com", "role": "tutor", "club_id": "club-1"},
    {"id": "user-3", "name": "Emily Davis", "email": "emily.admin@robotics.com", "role": "admin", "club_id": "club-2"},
    {"id": "user-4", "name": "James Wilson", "email": "james.tutor@robotics.com", "role": "tutor", "club_id": "club-2"},
    {"id": "user-5", "name": "Lisa Anderson", "email": "lisa.admin@drama.com", "role": "admin", "club_id": "club-3"},
]

mock_students = [
    {"id": "student-1", "name": "Alex Turner", "email": "alex.turner@student.com", "club_id": "club-1", "enrollment_date": "2024-09-01"},
    {"id": "student-2", "name": "Emma Watson", "email": "emma.watson@student.com", "club_id": "club-1", "enrollment_date": "2024-09-01"},
    {"id": "student-3", "name": "Oliver Smith", "email": "oliver.smith@student.com", "club_id": "club-1", "enrollment_date": "2024-09-05"},
    {"id": "student-4", "name": "Sophia Brown", "email": "sophia.brown@student.com", "club_id": "club-1", "enrollment_date": "2024-09-10"},
    {"id": "student-5", "name": "Noah Johnson", "email": "noah.johnson@student.com", "club_id": "club-1", "enrollment_date": "2024-09-15"},
    {"id": "student-6", "name": "Ava Martinez", "email": "ava.martinez@student.com", "club_id": "club-2", "enrollment_date": "2024-09-01"},
    {"id": "student-7", "name": "Liam Garcia", "email": "liam.garcia@student.com", "club_id": "club-2", "enrollment_date": "2024-09-01"},
    {"id": "student-8", "name": "Mia Rodriguez", "email": "mia.rodriguez@student.com", "club_id": "club-2", "enrollment_date": "2024-09-08"},
    {"id": "student-9", "name": "Ethan Lee", "email": "ethan.lee@student.com", "club_id": "club-3", "enrollment_date": "2024-09-01"},
    {"id": "student-10", "name": "Isabella Kim", "email": "isabella.kim@student.com", "club_id": "club-3", "enrollment_date": "2024-09-01"},
]

mock_sessions = [
    {"id": "session-1", "name": "Chess Fundamentals", "date": "2024-10-15", "time": "14:00", "club_id": "club-1", "created_by": "user-1"},
    {"id": "session-2", "name": "Opening Strategies", "date": "2024-10-22", "time": "14:00", "club_id": "club-1", "created_by": "user-1"},
    {"id": "session-3", "name": "Tournament Practice", "date": "2024-10-29", "time": "15:00", "club_id": "club-1", "created_by": "user-1"},
    {"id": "session-4", "name": "Robot Assembly Workshop", "date": "2024-10-16", "time": "16:00", "club_id": "club-2", "created_by": "user-3"},
    {"id": "session-5", "name": "Programming Basics", "date": "2024-10-23", "time": "16:00", "club_id": "club-2", "created_by": "user-3"},
    {"id": "session-6", "name": "Improv Workshop", "date": "2024-10-17", "time": "17:00", "club_id": "club-3", "created_by": "user-5"},
]

mock_attendance = [
    {"id": "att-1", "session_id": "session-1", "student_id": "student-1", "status": "present", "marked_by": "user-1"},
    {"id": "att-2", "session_id": "session-1", "student_id": "student-2", "status": "present", "marked_by": "user-1"},
    {"id": "att-3", "session_id": "session-1", "student_id": "student-3", "status": "late", "marked_by": "user-1"},
    {"id": "att-4", "session_id": "session-1", "student_id": "student-4", "status": "absent", "marked_by": "user-1"},
    {"id": "att-5", "session_id": "session-1", "student_id": "student-5", "status": "present", "marked_by": "user-2"},
]


def seed():
    db = SessionLocal()
    try:
        # clear existing
        db.query(models.AttendanceRecord).delete()
        db.query(models.Session).delete()
        db.query(models.Student).delete()
        db.query(models.User).delete()
        db.query(models.Club).delete()
        db.commit()

        for c in mock_clubs:
            club = models.Club(**c)
            db.add(club)

        for u in mock_users:
            user = models.User(**u)
            db.add(user)

        for s in mock_students:
            student = models.Student(**s)
            db.add(student)

        for sess in mock_sessions:
            session = models.Session(**sess)
            db.add(session)

        for a in mock_attendance:
            att = models.AttendanceRecord(**a)
            db.add(att)

        db.commit()
        print('Seeding completed.')
    finally:
        db.close()

if __name__ == '__main__':
    seed()
