from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class UserRole(str, Enum):
    admin = 'admin'
    tutor = 'tutor'


class ClubOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    color: Optional[str]

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    clubId: str = Field(..., alias='club_id')

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        allow_population_by_alias = True


class StudentOut(BaseModel):
    id: str
    name: str
    email: str
    clubId: str = Field(..., alias='club_id')
    enrollmentDate: Optional[str] = Field(None, alias='enrollment_date')

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        allow_population_by_alias = True


class StudentCreate(BaseModel):
    id: Optional[str]
    name: str
    email: str
    clubId: str = Field(..., alias='club_id')
    enrollmentDate: Optional[str] = Field(None, alias='enrollment_date')


class StudentUpdate(BaseModel):
    name: Optional[str]
    email: Optional[str]
    enrollmentDate: Optional[str] = Field(None, alias='enrollment_date')


class SessionOut(BaseModel):
    id: str
    name: str
    date: str
    time: Optional[str]
    clubId: str = Field(..., alias='club_id')
    createdBy: str = Field(..., alias='created_by')
    createdAt: Optional[datetime] = Field(None, alias='created_at')

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        allow_population_by_alias = True


class SessionCreate(BaseModel):
    id: Optional[str]
    name: str
    date: str
    time: Optional[str]
    clubId: str = Field(..., alias='club_id')
    createdBy: str = Field(..., alias='created_by')


class SessionUpdate(BaseModel):
    name: Optional[str]
    date: Optional[str]
    time: Optional[str]


class AttendanceItem(BaseModel):
    studentId: str = Field(..., alias='studentId')
    status: str


class AttendanceSave(BaseModel):
    sessionId: str = Field(..., alias='sessionId')
    markedBy: str = Field(..., alias='markedBy')
    items: List[AttendanceItem]


class AttendanceOut(BaseModel):
    id: str
    sessionId: str = Field(..., alias='session_id')
    studentId: str = Field(..., alias='student_id')
    status: str
    markedBy: str = Field(..., alias='marked_by')
    markedAt: Optional[datetime] = Field(None, alias='marked_at')

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        allow_population_by_alias = True


class SheetsSave(BaseModel):
    email: str
    sessionName: str = Field(..., alias='sessionName')
    sessionDate: str = Field(..., alias='sessionDate')
    sessionTime: Optional[str] = Field(None, alias='sessionTime')
    items: List[AttendanceItem]
