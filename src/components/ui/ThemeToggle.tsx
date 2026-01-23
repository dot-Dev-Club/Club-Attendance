import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
    } catch (e) {
      /* ignore */
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      try {
        localStorage.setItem('theme', 'dark');
      } catch (e) {}
    } else {
      root.classList.remove('dark');
      try {
        localStorage.setItem('theme', 'light');
      } catch (e) {}
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark((v) => !v)}
      title={isDark ? 'Switch to light' : 'Switch to dark'}
      className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:shadow-sm transition-all"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
