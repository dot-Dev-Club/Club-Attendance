import { motion } from 'framer-motion';
import { useState } from 'react';
import { History as HistoryIcon, Check, X, Clock, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

export function History() {
  const { user } = useAuth();
  const { students, sessions, attendanceRecords } = useData();
  const [selectedStudent, setSelectedStudent] = useState<string>('all');

  const clubStudents = students.filter((s) => s.clubId === user?.clubId);
  const clubSessions = sessions.filter((s) => s.clubId === user?.clubId);
  const clubAttendance = attendanceRecords.filter((a) =>
    clubSessions.some((s) => s.id === a.sessionId)
  );

  const [modalSessionId, setModalSessionId] = useState<string | null>(null);

  const filteredAttendance =
    selectedStudent === 'all'
      ? clubAttendance
      : clubAttendance.filter((a) => a.studentId === selectedStudent);

  const attendanceWithDetails = filteredAttendance.map((record) => {
    const student = clubStudents.find((s) => s.id === record.studentId);
    const session = clubSessions.find((s) => s.id === record.sessionId);
    return { ...record, student, session };
  });

  const sortedAttendance = attendanceWithDetails.sort(
    (a, b) =>
      new Date(b.session?.date || 0).getTime() -
      new Date(a.session?.date || 0).getTime()
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'absent':
        return <X className="w-5 h-5 text-red-600" />;
      case 'late':
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      present: 'bg-green-100 text-green-700',
      absent: 'bg-red-100 text-red-700',
      late: 'bg-orange-100 text-orange-700',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700';
  };

  const modalSession = modalSessionId ? clubSessions.find((s) => s.id === modalSessionId) : null;
  const modalSessionAttendance = modalSessionId
    ? attendanceRecords.filter((a) => a.sessionId === modalSessionId)
    : [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900">Attendance History</h1>
        <p className="text-gray-600 mt-1">
          View detailed attendance records for all sessions
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Sessions</h2>
          <div className="space-y-2">
            {clubSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{session.name}</p>
                  <p className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString()} at {session.time}</p>
                </div>
                <div>
                  <Button onClick={() => setModalSessionId(session.id)} size="sm" variant="ghost">See Attendance</Button>
                </div>
              </div>
            ))}

            {clubSessions.length === 0 && (
              <p className="text-sm text-gray-500">No sessions available.</p>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            >
              <option value="all">All Students</option>
              {clubStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>
        </Card>
      </motion.div>

      <div className="space-y-4">
        {sortedAttendance.map((record, index) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    {getStatusIcon(record.status)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {record.student?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {record.session?.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {record.session?.date &&
                        new Date(record.session.date).toLocaleDateString(
                          'en-US',
                          {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}{' '}
                      at {record.session?.time}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                      record.status
                    )}`}
                  >
                    {record.status.charAt(0).toUpperCase() +
                      record.status.slice(1)}
                  </span>
                  <p className="text-xs text-gray-500 mt-2">
                    Marked on{' '}
                    {new Date(record.markedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {sortedAttendance.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <HistoryIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No attendance records
          </h3>
          <p className="text-gray-600">
            {selectedStudent === 'all'
              ? 'Start marking attendance to see records here'
              : 'No attendance records for this student'}
          </p>
        </motion.div>
      )}

      <Modal
        isOpen={!!modalSessionId}
        onClose={() => setModalSessionId(null)}
        title={modalSession?.name || 'Session Attendance'}
      >
        {modalSession ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {new Date(modalSession.date).toLocaleDateString()} at {modalSession.time}
            </p>

            <div className="space-y-2">
              {clubStudents.map((student) => {
                const record = modalSessionAttendance.find((r) => r.studentId === student.id);
                const status = record?.status;

                return (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(status || '')}`}>
                        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Not marked'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setModalSessionId(null)}>Close</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No session selected.</p>
        )}
      </Modal>
    </div>
  );
}
