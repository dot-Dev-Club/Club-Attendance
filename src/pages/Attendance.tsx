import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ClipboardList, Check, X, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../components/ui/Toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function Attendance() {
  const { user } = useAuth();
  // Attendance UI has been moved to the Sessions page.
  // Keep this page as a redirect/notice so users go to Sessions to mark attendance.

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-gray-600 mt-1">Attendance marking has moved to the Sessions page. Open a session card and click <strong>Mark Attendance</strong>.</p>
      </motion.div>
    </div>
  );
}
