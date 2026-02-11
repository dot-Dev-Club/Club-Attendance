import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Users,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { ThemeToggle } from './ui/ThemeToggle';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ currentPage, onNavigate, collapsed, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const clubName = user?.clubName || 'Club';
  const clubColor = user?.clubColor || '#3B82F6';

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sessions', label: 'Sessions', icon: Calendar },
    { id: 'students', label: 'Students', icon: Users },
  ];

  const tutorMenuItems = [
    { id: 'sessions', label: 'Sessions', icon: Calendar },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : tutorMenuItems;

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[260px]';

  const sidebarContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-4 border-b border-slate-200/60 dark:border-slate-700/60 ${collapsed && !isMobile ? 'px-3' : 'px-5'}`}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md"
            style={{ backgroundColor: clubColor }}
          >
            {clubName.charAt(0)}
          </div>
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden flex-1 min-w-0"
              >
                <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{clubName}</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {(!collapsed || isMobile) && (
            <div className="ml-auto flex-shrink-0">
              <ThemeToggle />
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-3 space-y-1 overflow-y-auto ${collapsed && !isMobile ? 'px-2' : 'px-3'}`}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => {
                onNavigate(item.id);
                if (isMobile) setMobileOpen(false);
              }}
              className={`group relative w-full flex items-center gap-3 rounded-xl transition-all ${
                collapsed && !isMobile ? 'px-3 py-3 justify-center' : 'px-4 py-2.5'
              } ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
              <AnimatePresence>
                {(!collapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap text-sm"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {collapsed && !isMobile && (
                <span className="sidebar-tooltip">{item.label}</span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer  */}
      <div className={`border-t border-slate-200/60 dark:border-slate-700/60 ${collapsed && !isMobile ? 'p-2' : 'p-3'}`}>
        {/* Theme toggle when collapsed */}
        {collapsed && !isMobile && (
          <div className="flex justify-center mb-2">
            <ThemeToggle />
          </div>
        )}

        {/* User info – only when expanded */}
        <AnimatePresence>
          {(!collapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-2 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl"
            >
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{user?.email}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setLogoutConfirmOpen(true)}
          className={`w-full flex items-center gap-3 rounded-xl text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all font-medium ${
            collapsed && !isMobile ? 'px-3 py-3 justify-center' : 'px-4 py-2.5'
          }`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap text-sm"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700"
      >
        {mobileOpen ? <X className="w-5 h-5 text-slate-700 dark:text-slate-200" /> : <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />}
      </button>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`hidden lg:flex fixed left-0 top-0 h-screen bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-700/60 shadow-soft z-40 flex-col overflow-visible`}
      >
        {sidebarContent(false)}

        {/* Collapse toggle button */}
        <motion.button
          onClick={onToggleCollapse}
          animate={{ left: collapsed ? 60 : 248 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-7 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-700 z-50 cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          )}
        </motion.button>
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-[260px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shadow-xl z-40 flex flex-col"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <Modal isOpen={logoutConfirmOpen} onClose={() => setLogoutConfirmOpen(false)} title="Confirm Logout">
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300">Are you sure you want to logout?</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setLogoutConfirmOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={() => { setLogoutConfirmOpen(false); logout(); }} className="flex-1">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
