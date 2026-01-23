from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class UserRole(str, enum.Enum):
    admin = 'admin'
    tutor = 'tutor'

class Club(Base):
    __tablename__ = 'clubs'
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    color = Column(String, nullable=True)

    users = relationship('User', back_populates='club')
    students = relationship('Student', back_populates='club')
    sessions = relationship('Session', back_populates='club')

class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    club_id = Column(String, ForeignKey('clubs.id'), nullable=False)

    club = relationship('Club', back_populates='users')

class Student(Base):
    __tablename__ = 'students'
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    club_id = Column(String, ForeignKey('clubs.id'), nullable=False)
    enrollment_date = Column(String, nullable=True)

    club = relationship('Club', back_populates='students')

class Session(Base):
    __tablename__ = 'sessions'
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    date = Column(String, nullable=False)
    time = Column(String, nullable=True)
    club_id = Column(String, ForeignKey('clubs.id'), nullable=False)
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    club = relationship('Club', back_populates='sessions')

class AttendanceStatus(str, enum.Enum):
    present = 'present'
    absent = 'absent'
    late = 'late'

class AttendanceRecord(Base):
    __tablename__ = 'attendance_records'
    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey('sessions.id'), nullable=False)
    student_id = Column(String, ForeignKey('students.id'), nullable=False)
    status = Column(String, nullable=False)
    marked_by = Column(String, ForeignKey('users.id'), nullable=False)
    marked_at = Column(DateTime, server_default=func.now())

    # relationships not strictly necessary here
