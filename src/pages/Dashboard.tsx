import { motion } from 'framer-motion';
import { Users, Calendar, TrendingUp, Clock, BarChart3, PieChart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card } from '../components/ui/Card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from 'recharts';

export function Dashboard() {
  const { user } = useAuth();
  const { students, sessions, attendanceRecords } = useData();
  const clubName = user?.clubName || 'Club';

  const clubStudents = students.filter((s) => s.clubId === user?.clubId);
  const clubSessions = sessions.filter((s) => s.clubId === user?.clubId);
  const clubAttendance = attendanceRecords.filter((a) =>
    clubSessions.some((s) => s.id === a.sessionId)
  );

  const totalAttendance = clubAttendance.length;
  const presentCount = clubAttendance.filter((a) => a.status === 'present').length;
  const lateCount = clubAttendance.filter((a) => a.status === 'late').length;
  const absentCount = clubAttendance.filter((a) => a.status === 'absent').length;
  const attendanceRate =
    totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  // Recent activity count (last 7 days)
  const recentSessions = clubSessions
    .filter((s) => {
      const sessionDate = new Date(s.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo;
    })
    .length;

  const stats = [
    {
      label: 'Total Students',
      value: clubStudents.length,
      icon: Users,
      gradient: 'from-primary-500 to-primary-700',
      bgLight: 'bg-primary-50',
      bgDark: 'dark:bg-primary-900/30',
      trend: '+12%',
    },
    {
      label: 'Total Sessions',
      value: clubSessions.length,
      icon: Calendar,
      gradient: 'from-success-500 to-success-700',
      bgLight: 'bg-success-50',
      bgDark: 'dark:bg-success-900/30',
      trend: '+8%',
    },
    {
      label: 'Attendance Rate',
      value: `${attendanceRate}%`,
      icon: TrendingUp,
      gradient: 'from-violet-500 to-violet-700',
      bgLight: 'bg-violet-50',
      bgDark: 'dark:bg-violet-900/30',
      trend: '+5%',
    },
    {
      label: 'Recent Activity',
      value: recentSessions,
      icon: Clock,
      gradient: 'from-accent-500 to-accent-700',
      bgLight: 'bg-accent-50',
      bgDark: 'dark:bg-accent-900/30',
      trend: 'Last 7 days',
    },
  ];

  // Prepare chart data for sessions attendance
  const sessionChartData = clubSessions
    .slice(-10)
    .map((session) => {
      const sessionAttendance = clubAttendance.filter((a) => a.sessionId === session.id);
      const present = sessionAttendance.filter((a) => a.status === 'present').length;
      const late = sessionAttendance.filter((a) => a.status === 'late').length;
      const absent = sessionAttendance.filter((a) => a.status === 'absent').length;
      return {
        name: session.name.length > 10 ? session.name.substring(0, 10) + '...' : session.name,
        present,
        late,
        absent,
        total: present + late + absent,
      };
    });

  // Pie chart data for overall attendance distribution
  const pieChartData = [
    { name: 'Present', value: presentCount, color: '#10b981' },
    { name: 'Late', value: lateCount, color: '#f59e0b' },
    { name: 'Absent', value: absentCount, color: '#f43f5e' },
  ].filter((d) => d.value > 0);

  // Student attendance rates
  const studentAttendanceData = clubStudents.slice(0, 8).map((student) => {
    const studentRecords = clubAttendance.filter((a) => a.studentId === student.id);
    const present = studentRecords.filter((a) => a.status === 'present').length;
    const total = studentRecords.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return {
      name: student.name.split(' ')[0],
      rate,
      sessions: total,
    };
  });

  const isDark = document.documentElement.classList.contains('dark');
  const chartColors = {
    text: isDark ? '#94a3b8' : '#64748b',
    grid: isDark ? '#334155' : '#e2e8f0',
    bg: isDark ? '#1e293b' : '#ffffff',
  };

  return (
    <div className="space-y-8">
      {/* Sticky Header */}
      <div className="sticky-header">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
            Welcome back, <span className="gradient-text">{user?.name}</span>!
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Here's an overview of {clubName}'s activity
          </p>
        </motion.div>
      </div>

      {/* Stats Grid */}
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
              <Card hover className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                      {stat.value}
                    </p>
                    <p className="text-xs text-success-600 dark:text-success-400 font-medium">
                      {stat.trend}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Session Attendance Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-md">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Session Attendance
              </h2>
            </div>
            {sessionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sessionChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: chartColors.text, fontSize: 12 }}
                    axisLine={{ stroke: chartColors.grid }}
                  />
                  <YAxis 
                    tick={{ fill: chartColors.text, fontSize: 12 }}
                    axisLine={{ stroke: chartColors.grid }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.bg, 
                      border: `1px solid ${chartColors.grid}`,
                      borderRadius: '12px',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500 dark:text-slate-400">
                No session data available
              </div>
            )}
          </Card>
        </motion.div>

        {/* Attendance Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 shadow-md">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Attendance Distribution
              </h2>
            </div>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.bg, 
                      border: `1px solid ${chartColors.grid}`,
                      borderRadius: '12px',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500 dark:text-slate-400">
                No attendance data available
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Student Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Student Attendance Rates
            </h2>
          </div>
          {studentAttendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={studentAttendanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: chartColors.text, fontSize: 12 }}
                  axisLine={{ stroke: chartColors.grid }}
                />
                <YAxis 
                  tick={{ fill: chartColors.text, fontSize: 12 }}
                  axisLine={{ stroke: chartColors.grid }}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: chartColors.bg, 
                    border: `1px solid ${chartColors.grid}`,
                    borderRadius: '12px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                  formatter={(value) => [`${value}%`, 'Attendance Rate']}
                />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#14b8a6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRate)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-slate-500 dark:text-slate-400">
              No student data available
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
