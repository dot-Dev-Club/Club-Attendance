export type UserRole = 'admin' | 'tutor';

export interface Club {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clubId: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  clubId: string;
  enrollmentDate: string;
}

export interface Session {
  id: string;
  name: string;
  date: string;
  time: string;
  clubId: string;
  createdBy: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: 'present' | 'absent' | 'late';
  markedBy: string;
  markedAt: string;
}
