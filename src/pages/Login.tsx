import { motion } from 'framer-motion';
import { useState } from 'react';
import { LogIn, Users, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { users } from '../data/mockData';

export function Login() {
  const [email, setEmail] = useState('');
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      const success = await login(email);
      if (success) {
        showToast('Successfully logged in!', 'success');
      } else {
        showToast('Invalid email. Please try again.', 'error');
      }
    })();
  };

  const adminUsers = users.filter((u) => u.role === 'admin');
  const tutorUsers = users.filter((u) => u.role === 'tutor');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl grid lg:grid-cols-2 gap-8"
      >
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl p-8 lg:p-12"
        >
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4"
            >
              <GraduationCap className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Club Attendance
            </h1>
            <p className="text-gray-600">
              Manage your club sessions and track student attendance
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChange={setEmail}
              required
            />

            <Button type="submit" className="w-full">
              <LogIn className="w-5 h-5 mr-2 inline" />
              Sign In
            </Button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">
              Demo Accounts:
            </p>
            <p className="text-xs text-blue-600">
              Use any email from the list on the right to test different roles and
              clubs
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Admin Accounts</h2>
            </div>
            <div className="space-y-3">
              {adminUsers.map((user, index) => (
                <motion.button
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  onClick={() => setEmail(user.email)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Tutor Accounts</h2>
            </div>
            <div className="space-y-3">
              {tutorUsers.map((user, index) => (
                <motion.button
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  onClick={() => setEmail(user.email)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
