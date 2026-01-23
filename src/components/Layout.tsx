import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Dashboard } from '../pages/Dashboard';
import { Sessions } from '../pages/Sessions';
import { Attendance } from '../pages/Attendance';
import { Students } from '../pages/Students';
import { History } from '../pages/History';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(
    user?.role === 'admin' ? 'dashboard' : 'sessions'
  );

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'sessions':
        return <Sessions />;
      case 'attendance':
        return <Attendance />;
      case 'students':
        return <Students />;
      case 'history':
        return <History />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="lg:pl-72 min-h-screen">
        <main className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
