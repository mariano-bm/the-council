import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function GlassCard({ children, className, hover = true, delay = 0, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={hover ? { y: -4, scale: 1.005 } : undefined}
      onClick={onClick}
      className={clsx(
        'glass-card p-6',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
