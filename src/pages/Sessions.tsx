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

export function Sessions() {
  const { user } = useAuth();
  const { sessions, addSession, updateSession, deleteSession, refresh, students, attendanceRecords, saveAttendance, saveToSheet, clubUsers } = useData();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  // Loading states
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [savingToSheet, setSavingToSheet] = useState<Record<string, boolean>>({});
  const [creatingSession, setCreatingSession] = useState(false);
  const [updatingSession, setUpdatingSession] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deletingSession, setDeletingSession] = useState(false);

  const clubSessions = sessions
    .filter((s) => s.clubId === user?.clubId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const clubStudents = students.filter((s) => s.clubId === user?.clubId);

  // marking state
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [markingSession, setMarkingSession] = useState<Session | null>(null);
  const [localAttendance, setLocalAttendance] = useState<Record<string, 'present' | 'absent' | 'late' | undefined>>({});
  // sheetSaved is now derived from the persistent sheetSavedAt field on sessions

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
    if (!markingSession || savingAttendance) return;
    setSavingAttendance(true);
    const items = Object.entries(localAttendance)
      .filter(([, status]) => status !== undefined)
      .map(([studentId, status]) => ({ studentId, status: status as string }));
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
      setTimeout(() => closeMarkModal(), 600);
    } catch (e) {
      console.error(e);
      showToast('Failed to save attendance', 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleSaveToSheet = async (sessionId: string) => {
    if (savingToSheet[sessionId]) return;
    setSavingToSheet((prev) => ({ ...prev, [sessionId]: true }));
    try {
      await saveToSheet(sessionId, user!.email);
      await refresh();
      showToast('Saved to Google Sheet', 'success');
    } catch (err: any) {
      console.error(err);
      const msg = err?.message?.includes('already saved') ? 'Already saved to Google Sheet' : 'Failed to save to Google Sheet';
      showToast(msg, 'error');
    } finally {
      setSavingToSheet((prev) => ({ ...prev, [sessionId]: false }));
    }
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
    if (creatingSession) return;
    setCreatingSession(true);
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
    } finally {
      setCreatingSession(false);
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
    if (!editingSession || updatingSession) return;
    setUpdatingSession(true);
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
    } finally {
      setUpdatingSession(false);
    }
  };

  const handleDelete = async (id: string) => {
    const sess = clubSessions.find((s) => s.id === id);
    setDeleteConfirm({ id, name: sess?.name || 'this session' });
  };

  const confirmDeleteSession = async () => {
    if (!deleteConfirm || deletingSession) return;
    setDeletingSession(true);
    try {
      await deleteSession(deleteConfirm.id);
      await refresh();
      showToast('Session deleted', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete session', 'error');
    } finally {
      setDeletingSession(false);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="sticky-header">
        <div className="flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Sessions</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">{user?.role === 'admin' ? 'Create and manage attendance sessions' : 'View available sessions'}</p>
          </motion.div>

          {(user?.role === 'admin' || user?.role === 'tutor') && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Button onClick={() => setIsModalOpen(true)} size="sm" className="h-9">
                <Plus className="w-4 h-4" />
                Create Session
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubSessions.map((session, index) => {
          const creator = clubUsers.find((u) => u.id === session.createdBy);
          const status = computeSessionStatus(session);

          return (
            <motion.div key={session.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card hover className="h-full min-h-[220px]">
                    <div className="flex flex-col h-full justify-between">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                          <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white truncate">{session.name}</h3>
                                  <div className="flex items-center gap-2 mt-2">
                                        <div>
                                          {
                                            (() => {
                                              let statusLabel = '';
                                              if (status === 'past') statusLabel = isMarked(session.id) ? 'Completed' : 'Expired (Unmarked)';
                                              else if (status === 'present') statusLabel = `Present — ${formatRemaining(session)}`;
                                              else statusLabel = 'Upcoming';

                                              const statusClass = status === 'past'
                                                ? (isMarked(session.id)
                                                  ? 'bg-success-500 hover:bg-success-600 text-white shadow-sm shadow-success-500/25'
                                                  : 'bg-accent-500 hover:bg-accent-600 text-white shadow-sm shadow-accent-500/25')
                                                : status === 'present'
                                                  ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm shadow-primary-500/25'
                                                  : 'bg-violet-500 hover:bg-violet-600 text-white shadow-sm shadow-violet-500/25';

                                              return (
                                                <span
                                                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${statusClass} truncate`}
                                                >
                                                  {statusLabel}
                                                </span>
                                              );
                                            })()
                                          }
                                        </div>
                        <div className="ml-2 flex items-center gap-2">
                          {isMarked(session.id) ? (
                            <div className="flex items-center text-sm font-medium text-success-600 dark:text-success-400"><Check className="w-4 h-4 mr-1" />Marked</div>
                          ) : (
                            <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400"><X className="w-4 h-4 mr-1" />Unmarked</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(user?.role === 'admin' || user?.role === 'tutor') && (
                        <>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-sm" onClick={() => handleStartEdit(session)}>Edit</Button>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20" onClick={() => handleDelete(session.id)}>Delete</Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mt-3">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span className="text-sm">{new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span className="text-sm">{session.time}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span className="text-sm">Created by {creator?.name}</span>
                    </div>
                  </div>

                    <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Created on {new Date(session.createdAt).toLocaleDateString()}</p>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                          {(() => {
                            const timePart = session.time || '00:00';
                            const start = new Date(`${session.date}T${timePart}`);
                            const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
                            const now = new Date();
                            // enable marking only during the session window (start <= now < end)
                            const enabled = now >= start && now < end;
                            return (
                              <Button onClick={() => openMarkModal(session)} disabled={!enabled} variant="primary" size="sm" className="h-8 w-full sm:min-w-[120px] text-sm font-semibold">
                                Mark Attendance
                              </Button>
                            );
                          })()}
                        {(() => {
                          const alreadySaved = !!session.sheetSavedAt;
                          const canSave = isMarked(session.id) && !alreadySaved;
                          return canSave ? (
                            <Button onClick={() => handleSaveToSheet(session.id)} variant="warning" size="sm" className="h-8 w-full sm:min-w-[120px] text-sm font-semibold" loading={savingToSheet[session.id]} disabled={savingToSheet[session.id]}>
                              {savingToSheet[session.id] ? 'Saving...' : 'Save to Sheet'}
                            </Button>
                          ) : null;
                        })()}
                        {isMarked(session.id) && !!session.sheetSavedAt && (
                          <Button variant="success" size="sm" className="h-8 w-full sm:min-w-[120px] text-sm font-semibold opacity-80" disabled>
                            <Check className="w-4 h-4" /> Synced to Sheet
                          </Button>
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
          <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No sessions yet</h3>
          <p className="text-slate-600 dark:text-slate-400">{user?.role === 'admin' ? 'Create your first session to get started' : 'No sessions have been created yet'}</p>
        </motion.div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingSession(null); }} title={editingSession ? 'Edit Session' : 'Create New Session'}>
        <form onSubmit={editingSession ? handleUpdateSession : handleCreateSession} className="space-y-4">
          <Input label="Session Name" placeholder="e.g., Chess Fundamentals" value={sessionName} onChange={setSessionName} required />

          <Input type="date" label="Date" value={sessionDate} onChange={setSessionDate} required />

          <Input type="time" label="Time" value={sessionTime} onChange={setSessionTime} required />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1" disabled={creatingSession || updatingSession}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={creatingSession || updatingSession} disabled={creatingSession || updatingSession}>{editingSession ? (updatingSession ? 'Saving...' : 'Save Changes') : (creatingSession ? 'Creating...' : 'Create Session')}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={markModalOpen} onClose={closeMarkModal} title={markingSession ? `Mark Attendance — ${markingSession.name}` : 'Mark Attendance'}>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {clubStudents.length === 0 && (<p className="text-sm text-slate-500 dark:text-slate-400">No students available for this club.</p>)}

          {clubStudents.map((student) => {
            const status = localAttendance[student.id];
            return (
              <div key={student.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {student.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{student.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{student.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant={status === 'present' ? 'success' : 'ghost'} size="sm" onClick={() => handleMarkAttendance(student.id, 'present')} className="w-full justify-center text-xs px-1"><Check className="w-3.5 h-3.5 mr-1 flex-shrink-0" />Present</Button>
                  <Button variant={status === 'late' ? 'warning' : 'ghost'} size="sm" onClick={() => handleMarkAttendance(student.id, 'late')} className="w-full justify-center text-xs px-1"><Clock className="w-3.5 h-3.5 mr-1 flex-shrink-0" />Late</Button>
                  <Button variant={status === 'absent' ? 'danger' : 'ghost'} size="sm" onClick={() => handleMarkAttendance(student.id, 'absent')} className="w-full justify-center text-xs px-1"><X className="w-3.5 h-3.5 mr-1 flex-shrink-0" />Absent</Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-4">
          <Button variant="secondary" onClick={closeMarkModal} disabled={savingAttendance}>Cancel</Button>
          <Button onClick={commitAttendanceForSession} loading={savingAttendance} disabled={savingAttendance}>
            {savingAttendance ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Session">
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This will also remove all attendance records for this session. This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1" disabled={deletingSession}>Cancel</Button>
            <Button variant="danger" onClick={confirmDeleteSession} className="flex-1" loading={deletingSession} disabled={deletingSession}>
              {deletingSession ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
