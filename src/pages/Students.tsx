import { motion } from 'framer-motion';
import { useState } from 'react';
import { Plus, Trash2, Mail, Calendar, Users as UsersIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../components/ui/Toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Student } from '../types';

export function Students() {
  const { user } = useAuth();
  const { students, addStudent, updateStudent, deleteStudent, attendanceRecords, sessions, refresh } = useData();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');

  const clubStudents = students.filter((s) => s.clubId === user?.clubId);
  const clubSessions = sessions.filter((s) => s.clubId === user?.clubId);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    const newStudent: Student = {
      id: `student-${Date.now()}`,
      name: studentName,
      email: studentEmail,
      clubId: user!.clubId,
      enrollmentDate: new Date().toISOString().split('T')[0],
    };

    try {
      const created = await addStudent(newStudent);
      if (!created) throw new Error('Create failed');
      await refresh();
      showToast('Student added successfully!', 'success');
      setIsModalOpen(false);
      setStudentName('');
      setStudentEmail('');
    } catch (err) {
      console.error(err);
      showToast('Failed to add student', 'error');
    }
  };

  const startEditStudent = (s: Student) => {
    setEditingStudent(s);
    setStudentName(s.name || '');
    setStudentEmail(s.email || '');
    setIsModalOpen(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      const updated = await updateStudent(editingStudent.id, {
        name: studentName,
        email: studentEmail,
      });
      if (!updated) throw new Error('Update failed');
      await refresh();
      showToast('Student updated', 'success');
      setEditingStudent(null);
      setIsModalOpen(false);
      setStudentName('');
      setStudentEmail('');
    } catch (err) {
      console.error(err);
      showToast('Failed to update student', 'error');
    }
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name}?`)) {
      deleteStudent(id);
      showToast('Student removed successfully', 'info');
    }
  };

  const getStudentStats = (studentId: string) => {
    const studentAttendance = attendanceRecords.filter(
      (a) => a.studentId === studentId && clubSessions.some((s) => s.id === a.sessionId)
    );
    const total = studentAttendance.length;
    const present = studentAttendance.filter((a) => a.status === 'present').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, rate };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">
            Manage your club's student roster
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Button onClick={() => setIsModalOpen(true)} className="dark:text-gray-100">
            Add Student
          </Button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {clubStudents.length}
              </p>
              <p className="text-sm text-gray-600">Total Students</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubStudents.map((student, index) => {
          const stats = getStudentStats(student.id);

          return (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {student.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {student.name}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditStudent(student)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStudent(student.id, student.name)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{student.email}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        Joined{' '}
                        {new Date(student.enrollmentDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Attendance</span>
                      <span className="text-lg font-bold text-gray-900">
                        {stats.rate}%
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${stats.rate}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.present} of {stats.total} sessions attended
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {clubStudents.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No students yet
          </h3>
          <p className="text-gray-600 mb-6">
            Add your first student to get started
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="dark:text-gray-100">
            Add Student
          </Button>
        </motion.div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
        }}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
      >
        <form onSubmit={editingStudent ? handleUpdateStudent : handleAddStudent} className="space-y-4">
          <Input
            label="Student Name"
            placeholder="e.g., John Doe"
            value={studentName}
            onChange={setStudentName}
            required
          />

          <Input
            type="email"
            label="Email Address"
            placeholder="e.g., john.doe@student.com"
            value={studentEmail}
            onChange={setStudentEmail}
            required
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingStudent ? 'Save Changes' : 'Add Student'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
