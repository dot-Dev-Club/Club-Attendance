import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
}

export function Card({ children, className = '', hover = false, glass = false }: CardProps) {
  const baseClasses = glass 
    ? 'glass-card rounded-2xl p-4 sm:p-6 text-slate-900 dark:text-slate-100 min-h-[120px]'
    : 'bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-100 dark:border-slate-700/50 p-4 sm:p-6 text-slate-900 dark:text-slate-100 min-h-[120px] transition-all duration-300';
  
  const hoverClasses = hover 
    ? 'hover:shadow-card-hover hover:border-slate-200 dark:hover:border-slate-600 hover:-translate-y-1'
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${baseClasses} ${hoverClasses} ${className}`}
    >
      {children}
    </motion.div>
  );
}

