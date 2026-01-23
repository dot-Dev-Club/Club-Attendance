import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, User, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../components/ui/Toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Session } from '../types';
import { users } from '../data/mockData';

export function Sessions() {
  const { user } = useAuth();
  const { sessions, addSession, updateSession, deleteSession, refresh, students, attendanceRecords, saveAttendance, saveToSheet } = useData();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const clubSessions = sessions
    .filter((s) => s.clubId === user?.clubId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const clubStudents = students.filter((s) => s.clubId === user?.clubId);

  // marking state
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [markingSession, setMarkingSession] = useState<Session | null>(null);
  const [localAttendance, setLocalAttendance] = useState<Record<string, 'present' | 'absent' | 'late' | undefined>>({});
  const [sheetSaved, setSheetSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!markingSession) return;
    const initial: Record<string, 'present' | 'absent' | 'late' | undefined> = {};
    // Populate initial selections once when opening the modal from the current snapshot
    attendanceRecords
      .filter((r) => r.sessionId === markingSession.id)
      .forEach((r) => {
        initial[r.studentId] = r.status as any;
      });
    setLocalAttendance(initial);
  }, [markingSession]);

  const computeSessionStatus = (s: Session) => {
    const timePart = s.time || '00:00';
    const start = new Date(`${s.date}T${timePart}`);
    const now = new Date();
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    if (now >= end) return 'past';
    if (now >= start) return 'present';
    return 'upcoming';
  };

  const isMarked = (sessionId: string) => attendanceRecords.some((a) => a.sessionId === sessionId);

  const openMarkModal = (s: Session) => {
    // always set selected session; button disabled state controls actual availability
    setMarkingSession(s);
    setMarkModalOpen(true);
  };
  const closeMarkModal = () => {
    setMarkModalOpen(false);
    setMarkingSession(null);
    setLocalAttendance({});
  };

  const handleMarkAttendance = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setLocalAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const formatRemaining = (s: Session) => {
    const timePart = s.time || '00:00';
    const start = new Date(`${s.date}T${timePart}`);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const now = new Date();
    const ms = end.getTime() - now.getTime();
    if (ms <= 0) return '0m';
    const totalMinutes = Math.floor(ms / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  // auto-close modal if window expires while open
  useEffect(() => {
    if (!markModalOpen || !markingSession) return;
    const interval = setInterval(() => {
      const timePart = markingSession.time || '00:00';
      const start = new Date(`${markingSession.date}T${timePart}`);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      const now = new Date();
      if (now >= end) {
        setMarkModalOpen(false);
        setMarkingSession(null);
        setLocalAttendance({});
        showToast('Marking window expired for this session', 'info');
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [markModalOpen, markingSession]);

  const commitAttendanceForSession = async () => {
    if (!markingSession) return;
    const items = Object.entries(localAttendance)
      .filter(([, status]) => !!status)
      .map(([studentId, status]) => ({ studentId, status }));
    try {
      const results = await saveAttendance(markingSession.id, user!.id, items);
      showToast('Attendance saved!', 'success');
      const fresh: Record<string, 'present' | 'absent' | 'late' | undefined> = {};
      results.forEach((r: any) => {
        const sid = r.student_id || r.studentId;
        fresh[sid] = r.status;
      });
      setLocalAttendance(fresh);
      // refresh global data so other users/roles see the update
      await refresh();
      setSheetSaved((prev) => ({ ...prev, [markingSession.id]: false }));
      setTimeout(() => closeMarkModal(), 600);
    } catch (e) {
      console.error(e);
      showToast('Failed to save attendance', 'error');
    }
  };

  const handleSaveToSheet = (sessionId: string) => {
    (async () => {
      try {
        const res = await saveToSheet(sessionId, 'vishwav@karunya.edu.in');
        setSheetSaved((prev) => ({ ...prev, [sessionId]: true }));
        await refresh();
        showToast('Saved to Google Sheet', 'success');
      } catch (err) {
        console.error(err);
        showToast('Failed to save to Google Sheet', 'error');
      }
    })();
  };

  useEffect(() => {
    if (!user) return;
    // pause polling while marking modal is open so local selections aren't overwritten
    if (markModalOpen) return;
    const id = setInterval(() => {
      refresh().catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [user, markModalOpen]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: Session = {
      id: `session-${Date.now()}`,
      name: sessionName,
      date: sessionDate,
      time: sessionTime,
      clubId: user!.clubId,
      createdBy: user!.id,
      createdAt: new Date().toISOString(),
    };
    try {
      const created = await addSession(newSession);
      if (!created) throw new Error('Create failed');
      await refresh();
      showToast('Session created successfully!', 'success');
      setIsModalOpen(false);
      setSessionName('');
      setSessionDate('');
      setSessionTime('');
    } catch (err) {
      console.error(err);
      showToast('Failed to create session', 'error');
    }
  };

  const handleStartEdit = (s: Session) => {
    setEditingSession(s);
    setIsModalOpen(true);
    setSessionName(s.name || '');
    setSessionDate(s.date || '');
    setSessionTime(s.time || '');
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    try {
      const updated = await updateSession(editingSession.id, {
        name: sessionName,
        date: sessionDate,
        time: sessionTime,
      });
      if (!updated) throw new Error('Update failed');
      await refresh();
      showToast('Session updated', 'success');
      setEditingSession(null);
      setIsModalOpen(false);
      setSessionName('');
      setSessionDate('');
      setSessionTime('');
    } catch (err) {
      console.error(err);
      showToast('Failed to update session', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session?')) return;
    try {
      await deleteSession(id);
      await refresh();
      showToast('Session deleted', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete session', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Sessions</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{user?.role === 'admin' ? 'Create and manage attendance sessions' : 'View available sessions'}</p>
        </motion.div>

        {(user?.role === 'admin' || user?.role === 'tutor') && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Button onClick={() => setIsModalOpen(true)} size="sm" className="h-8 text-sm font-semibold">
              Create Session
            </Button>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubSessions.map((session, index) => {
          const creator = users.find((u) => u.id === session.createdBy);
          const status = computeSessionStatus(session);
          const isPast = status === 'past';
          const markAllowed = status !== 'past';

          return (
            <motion.div key={session.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card hover className="h-full min-h-[220px]">
                    <div className="flex flex-col h-full justify-between">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                          <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{session.name}</h3>
                                  <div className="flex items-center gap-2 mt-2">
                                        <div>
                                          {
                                            (() => {
                                              const timePart = session.time || '00:00';
                                              const start = new Date(`${session.date}T${timePart}`);
                                              const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
                                              const now = new Date();
                                              const inWindow = now >= start && now < end;
                                              let statusLabel = '';
                                              if (status === 'past') statusLabel = isMarked(session.id) ? 'Completed' : 'Expired (Unmarked)';
                                              else if (status === 'present') statusLabel = `Present — ${formatRemaining(session)}`;
                                              else statusLabel = 'Upcoming';

                                              const statusClass = status === 'past'
                                                ? (isMarked(session.id) ? 'bg-green-600 dark:bg-green-500 text-white' : 'bg-yellow-400 dark:bg-yellow-500 text-yellow-900 dark:text-yellow-900')
                                                : 'bg-red-600 dark:bg-red-500 text-white';

                                              return (
                                                <Button
                                                  size="sm"
                                                  className={`h-8 w-full sm:min-w-[120px] text-sm font-semibold ${statusClass} truncate`}
                                                  onClick={() => {}}
                                                >
                                                  {statusLabel}
                                                </Button>
                                              );
                                            })()
                                          }
                                        </div>
                        <div className="ml-2 flex items-center gap-2">
                          {isMarked(session.id) ? (
                            <div className="flex items-center text-sm text-green-600 dark:text-green-300"><Check className="w-4 h-4 mr-1" />Marked</div>
                          ) : (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300"><X className="w-4 h-4 mr-1" />Unmarked</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(user?.role === 'admin' || user?.role === 'tutor') && (
                        <>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-sm" onClick={() => handleStartEdit(session)}>Edit</Button>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-sm" onClick={() => handleDelete(session.id)}>Delete</Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{session.time}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span className="text-sm">Created by {creator?.name}</span>
                    </div>
                  </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Created on {new Date(session.createdAt).toLocaleDateString()}</p>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                          {(() => {
                            const timePart = session.time || '00:00';
                            const start = new Date(`${session.date}T${timePart}`);
                            const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
                            const now = new Date();
                            // enable marking up until 'end' (2 hours after start), including before start (upcoming)
                            const enabled = now < end;
                            return (
                              <Button onClick={() => openMarkModal(session)} disabled={!enabled} size="sm" className="h-8 w-full sm:min-w-[120px] text-sm font-semibold">
                                Mark Attendance
                              </Button>
                            );
                          })()}
                        {isMarked(session.id) && !sheetSaved[session.id] && (
                          <Button onClick={() => handleSaveToSheet(session.id)} variant="secondary" size="sm" className="h-8 w-full sm:min-w-[120px] text-sm font-semibold">
                            Save to sheet
                          </Button>
                        )}
                        {sheetSaved[session.id] && (
                          <Button variant="ghost" size="sm" className="h-8 w-full sm:min-w-[120px] text-sm font-semibold" disabled>Saved</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {clubSessions.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions yet</h3>
          <p className="text-gray-600">{user?.role === 'admin' ? 'Create your first session to get started' : 'No sessions have been created yet'}</p>
        </motion.div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingSession(null); }} title={editingSession ? 'Edit Session' : 'Create New Session'}>
        <form onSubmit={editingSession ? handleUpdateSession : handleCreateSession} className="space-y-4">
          <Input label="Session Name" placeholder="e.g., Chess Fundamentals" value={sessionName} onChange={setSessionName} required />

          <Input type="date" label="Date" value={sessionDate} onChange={setSessionDate} required />

          <Input type="time" label="Time" value={sessionTime} onChange={setSessionTime} required />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editingSession ? 'Save Changes' : 'Create Session'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={markModalOpen} onClose={closeMarkModal} title={markingSession ? `Mark Attendance — ${markingSession.name}` : 'Mark Attendance'}>
        <div className="space-y-4">
          {clubStudents.length === 0 && (<p className="text-sm text-gray-500">No students available for this club.</p>)}

          {clubStudents.map((student) => {
            const status = localAttendance[student.id];
            return (
              <div key={student.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant={status === 'present' ? 'primary' : 'ghost'} size="sm" onClick={() => handleMarkAttendance(student.id, 'present')}><Check className="w-4 h-4 mr-1" />Present</Button>
                  <Button variant={status === 'late' ? 'primary' : 'ghost'} size="sm" onClick={() => handleMarkAttendance(student.id, 'late')}><Clock className="w-4 h-4 mr-1" />Late</Button>
                  <Button variant={status === 'absent' ? 'danger' : 'ghost'} size="sm" onClick={() => handleMarkAttendance(student.id, 'absent')}><X className="w-4 h-4 mr-1" />Absent</Button>
                </div>
              </div>
            );
          })}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={closeMarkModal}>Cancel</Button>
            <Button onClick={commitAttendanceForSession}>Save Attendance</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
