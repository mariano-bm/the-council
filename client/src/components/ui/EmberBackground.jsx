import { motion } from 'framer-motion';
import { useMemo } from 'react';

// Brasas que suben desde abajo
function Ember({ delay, x, size, duration, drift, brightness }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        bottom: '-3%',
        background: `radial-gradient(circle, rgba(212,168,71,${brightness}) 0%, rgba(212,168,71,${brightness * 0.3}) 50%, transparent 70%)`,
        boxShadow: `0 0 ${size * 2}px rgba(212,168,71,${brightness * 0.5})`,
      }}
      animate={{
        y: [0, -(700 + Math.random() * 600)],
        x: [0, drift],
        opacity: [0, 1, 0.8, 0],
        scale: [0.4, 1.2, 0.3],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  );
}

// Luciérnagas estáticas que parpadean en su lugar
function Firefly({ x, y, delay, size }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        background: `radial-gradient(circle, rgba(212,168,71,0.6) 0%, rgba(240,208,120,0.2) 40%, transparent 70%)`,
        boxShadow: `0 0 ${size * 3}px rgba(212,168,71,0.3)`,
      }}
      animate={{
        opacity: [0, 0.9, 0.3, 0.8, 0],
        scale: [0.5, 1.3, 0.8, 1.1, 0.5],
      }}
      transition={{
        duration: 4 + Math.random() * 4,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

export default function EmberBackground({ count = 30 }) {
  const embers = useMemo(() =>
    Array.from({ length: count }).map((_, i) => ({
      id: `e-${i}`,
      x: Math.random() * 100,
      size: 3 + Math.random() * 6,
      delay: Math.random() * 10,
      duration: 6 + Math.random() * 7,
      drift: (Math.random() - 0.5) * 180,
      brightness: 0.4 + Math.random() * 0.5,
    })),
  [count]);

  const fireflies = useMemo(() =>
    Array.from({ length: Math.floor(count * 0.6) }).map((_, i) => ({
      id: `f-${i}`,
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 90,
      size: 2 + Math.random() * 5,
      delay: Math.random() * 8,
    })),
  [count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {embers.map(e => (
        <Ember key={e.id} {...e} />
      ))}
      {fireflies.map(f => (
        <Firefly key={f.id} {...f} />
      ))}
    </div>
  );
}
