import { motion } from 'framer-motion';

export function Loading() {
  return (
    <div className="flex items-center justify-center h-full">
      <motion.div
        className="flex space-x-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-blue-600 rounded-full"
            animate={{
              y: [0, -12, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
