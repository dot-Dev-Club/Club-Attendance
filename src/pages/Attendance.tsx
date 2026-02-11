import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export function Attendance() {
  useAuth();
  // Attendance UI has been moved to the Sessions page.
  // Keep this page as a redirect/notice so users go to Sessions to mark attendance.

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="sticky-header">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Mark Attendance</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Attendance marking has moved to the Sessions page. Open a session card and click <strong>Mark Attendance</strong>.</p>
        </motion.div>
      </div>
    </div>
  );
}
