import { motion } from 'framer-motion';
import { Users, Calendar, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card } from '../components/ui/Card';
import { clubs } from '../data/mockData';

export function Dashboard() {
  const { user } = useAuth();
  const { students, sessions, attendanceRecords } = useData();
  const club = clubs.find((c) => c.id === user?.clubId);

  const clubStudents = students.filter((s) => s.clubId === user?.clubId);
  const clubSessions = sessions.filter((s) => s.clubId === user?.clubId);
  const clubAttendance = attendanceRecords.filter((a) =>
    clubSessions.some((s) => s.id === a.sessionId)
  );

  const totalAttendance = clubAttendance.length;
  const presentCount = clubAttendance.filter((a) => a.status === 'present').length;
  const attendanceRate =
    totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  const recentSessions = clubSessions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const stats = [
    {
      label: 'Total Students',
      value: clubStudents.length,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+12%',
    },
    {
      label: 'Total Sessions',
      value: clubSessions.length,
      icon: Calendar,
      color: 'bg-green-500',
      trend: '+8%',
    },
    {
      label: 'Attendance Rate',
      value: `${attendanceRate}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      trend: '+5%',
    },
    {
      label: 'Recent Activity',
      value: recentSessions.length,
      icon: Clock,
      color: 'bg-orange-500',
      trend: 'Last 7 days',
    },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of {club?.name}'s activity
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">
                      {stat.value}
                    </p>
                    <p className="text-xs text-green-600 font-medium">
                      {stat.trend}
                    </p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-xl`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Recent Sessions
          </h2>
          <div className="space-y-4">
            {recentSessions.map((session, index) => {
              const sessionAttendance = clubAttendance.filter(
                (a) => a.sessionId === session.id
              );
              const attended = sessionAttendance.filter(
                (a) => a.status === 'present'
              ).length;

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {session.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(session.date).toLocaleDateString()} at{' '}
                        {session.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {attended}/{sessionAttendance.length}
                      </p>
                      <p className="text-xs text-gray-500">Attended</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {recentSessions.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No sessions yet. Create your first session!
              </p>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Top Students
          </h2>
          <div className="space-y-4">
            {clubStudents.slice(0, 5).map((student, index) => {
              const studentAttendance = clubAttendance.filter(
                (a) => a.studentId === student.id
              );
              const attended = studentAttendance.filter(
                (a) => a.status === 'present'
              ).length;
              const rate =
                studentAttendance.length > 0
                  ? Math.round((attended / studentAttendance.length) * 100)
                  : 0;

              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: club?.color }}
                    >
                      {student.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{rate}%</p>
                    <p className="text-xs text-gray-500">Attendance</p>
                  </div>
                </motion.div>
              );
            })}
            {clubStudents.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No students yet. Add your first student!
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
