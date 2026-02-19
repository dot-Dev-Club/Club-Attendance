import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Student, Session, AttendanceRecord, User } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
  students: Student[];
  sessions: Session[];
  attendanceRecords: AttendanceRecord[];
  clubUsers: { id: string; name: string; email: string; role: string }[];
  refresh: () => Promise<void>;
  saveAttendance: (sessionId: string, markedBy: string, items: { studentId: string; status: string }[]) => Promise<AttendanceRecord[]>;
  saveToSheet: (sessionId: string, email: string) => Promise<any>;
  addStudent: (student: Partial<Student>) => Promise<Student | null>;
  updateStudent: (id: string, patch: Partial<Student>) => Promise<Student | null>;
  deleteStudent: (id: string) => Promise<boolean>;
  addSession: (session: Partial<Session>) => Promise<Session | null>;
  updateSession: (id: string, patch: Partial<Session>) => Promise<Session | null>;
  deleteSession: (id: string) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [clubUsers, setClubUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);

  const API = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

  const fetchSessions = async (clubId: string) => {
    const res = await fetch(`${API}/sessions?clubId=${clubId}`);
    if (!res.ok) throw new Error('Failed to fetch sessions');
    const data = await res.json();
    setSessions(data.map((d: any) => ({
      id: d.id,
      name: d.name,
      date: d.date,
      time: d.time,
      clubId: d.clubId || d.club_id,
      createdBy: d.createdBy || d.created_by,
      createdAt: d.createdAt || d.created_at,
      sheetSavedAt: d.sheetSavedAt || d.sheet_saved_at || null,
    })));
  };

  const fetchStudents = async (clubId: string) => {
    const res = await fetch(`${API}/students?clubId=${clubId}`);
    if (!res.ok) throw new Error('Failed to fetch students');
    const data = await res.json();
    setStudents(data.map((d: any) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      registerNo: d.registerNo || d.register_no || '',
      clubId: d.clubId || d.club_id,
      enrollmentDate: d.enrollmentDate || d.enrollment_date,
    })));
  };

  const fetchClubUsers = async (clubId: string) => {
    const res = await fetch(`${API}/users?clubId=${clubId}`);
    if (!res.ok) return;
    const data = await res.json();
    setClubUsers(data.map((d: any) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      role: d.role,
    })));
  };

  const fetchAttendanceForClub = async (clubId: string) => {
    // fetch attendance for all sessions in the club
    const resSessions = await fetch(`${API}/sessions?clubId=${clubId}`);
    if (!resSessions.ok) return;
    const sess = await resSessions.json();
    const records: AttendanceRecord[] = [];
    for (const s of sess) {
      const r = await fetch(`${API}/attendance/session/${s.id}`);
      if (!r.ok) continue;
      const arr = await r.json();
      arr.forEach((it: any) => records.push({
        id: it.id,
        sessionId: it.sessionId || it.session_id,
        studentId: it.studentId || it.student_id,
        status: it.status,
        markedBy: it.markedBy || it.marked_by,
        markedAt: it.markedAt || it.marked_at,
      }));
    }
    setAttendanceRecords(records);
  };

  const refresh = async () => {
    if (!user) return;
    try {
      await Promise.all([fetchSessions(user.clubId), fetchStudents(user.clubId), fetchClubUsers(user.clubId)]);
      await fetchAttendanceForClub(user.clubId);
    } catch (e) {
      console.error('Data refresh failed', e);
    }
  };

  useEffect(() => {
    refresh();
  }, [user]);

  const saveAttendance = async (sessionId: string, markedBy: string, items: { studentId: string; status: string }[]) => {
    const payload = {
      sessionId,
      markedBy,
      items,
    };
    const res = await fetch(`${API}/attendance/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to save attendance');
    const data = await res.json();
    // update local attendanceRecords for this session
    const others = attendanceRecords.filter((r) => r.sessionId !== sessionId);
    const updated = data.map((it: any) => ({
      id: it.id,
      sessionId: it.session_id || it.sessionId,
      studentId: it.student_id || it.studentId,
      status: it.status,
      markedBy: it.marked_by || it.markedBy,
      markedAt: it.marked_at || it.markedAt,
    }));
    setAttendanceRecords([...others, ...updated]);
    return updated;
  };

  const saveToSheet = async (sessionId: string, email: string) => {
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) throw new Error('Session not found');
    const items = attendanceRecords
      .filter((r) => r.sessionId === sessionId)
      .map((r) => ({ studentId: r.studentId, status: r.status }));
    const payload = {
      email,
      sessionId,
      sessionName: s.name,
      sessionDate: s.date,
      sessionTime: s.time,
      items,
    };
    const res = await fetch(`${API}/sheets/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to save sheet: ${text}`);
    }
    return await res.json();
  };

  const addStudent = async (student: Partial<Student>) => {
    try {
      const payload = {
        id: student.id,
        name: student.name,
        email: student.email,
        club_id: student.clubId || user?.clubId,
        register_no: student.registerNo || '',
        enrollment_date: student.enrollmentDate,
      };
      const res = await fetch(`${API}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create student');
      const data = await res.json();
      const s: Student = {
        id: data.id,
        name: data.name,
        email: data.email,
        registerNo: data.registerNo || data.register_no || '',
        clubId: data.clubId || data.club_id,
        enrollmentDate: data.enrollmentDate || data.enrollment_date,
      };
      setStudents((prev) => [...prev, s]);
      return s;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const updateStudent = async (id: string, patchObj: Partial<Student>) => {
    try {
      const payload: any = {};
      if (patchObj.name) payload.name = patchObj.name;
      if (patchObj.email) payload.email = patchObj.email;
      if (patchObj.enrollmentDate) payload.enrollmentDate = patchObj.enrollmentDate;
      if (patchObj.registerNo !== undefined) payload.registerNo = patchObj.registerNo;
      const res = await fetch(`${API}/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update student');
      const data = await res.json();
      const updated: Student = {
        id: data.id,
        name: data.name,
        email: data.email,
        registerNo: data.registerNo || data.register_no || '',
        clubId: data.clubId || data.club_id,
        enrollmentDate: data.enrollmentDate || data.enrollment_date,
      };
      setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return updated;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const res = await fetch(`${API}/students/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setStudents((prev) => prev.filter((s) => s.id !== id));
      setAttendanceRecords((prev) => prev.filter((a) => a.studentId !== id));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const addSession = async (session: Partial<Session>) => {
    try {
      const payload = {
        id: session.id,
        name: session.name,
        date: session.date,
        time: session.time,
        club_id: session.clubId || user?.clubId,
        created_by: session.createdBy || user?.id,
      };
      const res = await fetch(`${API}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('Create session failed:', res.status, text);
        throw new Error('Failed to create session');
      }
      const data = await res.json();
      const s: Session = {
        id: data.id,
        name: data.name,
        date: data.date,
        time: data.time,
        clubId: data.clubId || data.club_id,
        createdBy: data.createdBy || data.created_by,
        createdAt: data.createdAt || data.created_at,
      };
      setSessions((prev) => [...prev, s]);
      return s;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const updateSession = async (id: string, patchObj: Partial<Session>) => {
    try {
      const payload: any = {};
      if (patchObj.name) payload.name = patchObj.name;
      if (patchObj.date) payload.date = patchObj.date;
      if (patchObj.time) payload.time = patchObj.time;
      const res = await fetch(`${API}/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update session');
      const data = await res.json();
      const updated: Session = {
        id: data.id,
        name: data.name,
        date: data.date,
        time: data.time,
        clubId: data.clubId || data.club_id,
        createdBy: data.createdBy || data.created_by,
        createdAt: data.createdAt || data.created_at,
      };
      setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return updated;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const deleteSession = async (id: string) => {
    try {
      const res = await fetch(`${API}/sessions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete session');
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setAttendanceRecords((prev) => prev.filter((a) => a.sessionId !== id));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return (
    <DataContext.Provider
      value={{
        students,
        sessions,
        attendanceRecords,
        clubUsers,
        refresh,
        saveAttendance,
        saveToSheet,
        addStudent,
        updateStudent,
        deleteStudent,
        addSession,
        updateSession,
        deleteSession,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
