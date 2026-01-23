import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  History,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clubs } from '../data/mockData';
import { useState } from 'react';
import { ThemeToggle } from './ui/ThemeToggle';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const club = clubs.find((c) => c.id === user?.clubId);

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sessions', label: 'Sessions', icon: Calendar },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'history', label: 'History', icon: History },
  ];

  const tutorMenuItems = [
    { id: 'sessions', label: 'Sessions', icon: Calendar },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : tutorMenuItems;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-screen w-70 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-xl z-40 flex flex-col"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: club?.color }}
            >
              {club?.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{club?.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>
            <div className="ml-2">
              <ThemeToggle />
            </div>
          </motion.div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user?.email}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900 transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </motion.button>
        </div>
      </motion.aside>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
        />
      )}
    </>
  );
}
