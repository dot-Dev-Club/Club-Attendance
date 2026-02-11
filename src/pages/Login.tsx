import { motion } from 'framer-motion';
import { useState } from 'react';
import { LogIn, GraduationCap, Lock, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        showToast('Successfully logged in!', 'success');
      } else {
        showToast('Invalid email or password. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors relative overflow-hidden">
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-200/40 dark:bg-primary-900/20 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -40, 20, 0], y: [0, 40, -20, 0], scale: [1, 0.9, 1.15, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent-200/30 dark:bg-accent-900/15 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 20, -20, 0], y: [0, -20, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-violet-200/20 dark:bg-violet-900/10 blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl rounded-3xl shadow-soft-lg p-8 lg:p-10 border border-slate-200/50 dark:border-slate-700/50"
        >
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-500/30"
            >
              <GraduationCap className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight"
            >
              Club Attendance
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-slate-500 dark:text-slate-400"
            >
              Sign in to manage your club sessions
            </motion.p>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="relative">
              <Input
                type="email"
                label="Email Address"
                placeholder="yourname@karunya.edu.in"
                value={email}
                onChange={setEmail}
                required
              />
            </div>

            <div className="relative">
              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={setPassword}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading} disabled={loading}>
              <LogIn className="w-5 h-5" />
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </motion.form>
        </motion.div>
      </motion.div>
    </div>
  );
}
