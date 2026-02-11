from passlib.hash import bcrypt
from app.database import SessionLocal, engine, Base
from app import models

Base.metadata.create_all(bind=engine)

# ── Clubs ─────────────────────────────────────────────
mock_clubs = [
    {"id": "club-dotdev", "name": "DotDev", "description": "Development and tech community", "color": "#3B82F6"},
    {"id": "club-unbiased", "name": "Unbiased Club", "description": "Open discussion and debate", "color": "#10B981"},
]

# ── Users (passwords hashed at seed time) ─────────────
mock_users = [
    # DotDev — Admins
    {"id": "user-dharshan", "name": "Dharshan Kumar", "email": "dharshankumarjeyakumar@karunya.edu.in", "password": "Dharshan18@Clubpass", "role": "admin", "club_id": "club-dotdev"},
    {"id": "user-danish", "name": "Danish Prabhu", "email": "Danishprabhu@karunya.edu.in", "password": "Danish27@Clubpass", "role": "admin", "club_id": "club-dotdev"},
    # DotDev — Tutors
    {"id": "user-varsha", "name": "Varsha T", "email": "varshat@karunya.edu.in", "password": "Varsha@Clubpass", "role": "tutor", "club_id": "club-dotdev"},
    {"id": "user-jola", "name": "Jola Keseena", "email": "jolakeseena@karunya.edu.in", "password": "jola@Clubpass", "role": "tutor", "club_id": "club-dotdev"},
    {"id": "user-manisha", "name": "Manisha C", "email": "cmanisha@karunya.edu.in", "password": "manisha@Clubpass", "role": "tutor", "club_id": "club-dotdev"},
    # Unbiased Club — Admins
    {"id": "user-arvind", "name": "Arvind", "email": "arvind@karunya.edu.in", "password": "arvind@Clubpass", "role": "admin", "club_id": "club-unbiased"},
    {"id": "user-ronnie", "name": "Ronnie A", "email": "ronniea@karunya.edu.in", "password": "ronnie12@Clubpass", "role": "admin", "club_id": "club-unbiased"},
    # Unbiased Club — Tutors
    {"id": "user-thirupathi", "name": "Thirupathi S", "email": "thirupathis@karunya.edu.in", "password": "thirupathi04@Clubpass", "role": "tutor", "club_id": "club-unbiased"},
    {"id": "user-aparna", "name": "Aparna J", "email": "aparnaj@karunya.edu.in", "password": "aparna24@Clubpass", "role": "tutor", "club_id": "club-unbiased"},
    {"id": "user-lebi", "name": "Lebi Raja", "email": "lebiraja@karunya.edu.in", "password": "lebi23@Clubpass", "role": "tutor", "club_id": "club-unbiased"},
    {"id": "user-vasuki", "name": "Vasuki", "email": "vasuki@karunya.edu.in", "password": "vasuki@Clubpass", "role": "tutor", "club_id": "club-unbiased"},
]


def seed():
    db = SessionLocal()
    try:
        # clear existing data
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
            pw = u.pop('password')
            u['password_hash'] = bcrypt.hash(pw)
            user = models.User(**u)
            db.add(user)

        db.commit()
        print(f'Seeded {len(mock_clubs)} clubs and {len(mock_users)} users.')
    finally:
        db.close()


if __name__ == '__main__':
    seed()
