import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, ScrollText } from 'lucide-react';

const ToastContext = createContext(null);

const VARIANTS = {
  success: { icon: CheckCircle2, color: 'text-medieval-forest-light', glow: 'rgba(45,138,78,0.25)', border: 'border-medieval-forest-light/30' },
  error:   { icon: XCircle,      color: 'text-medieval-crimson-light', glow: 'rgba(196,43,43,0.25)', border: 'border-medieval-crimson/40' },
  warning: { icon: AlertTriangle, color: 'text-neon-amber',            glow: 'rgba(245,158,11,0.25)', border: 'border-neon-amber/30' },
  info:    { icon: Info,          color: 'text-medieval-gold',          glow: 'rgba(212,168,71,0.25)', border: 'border-medieval-gold/30' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((message, variant = 'info', opts = {}) => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, variant, title: opts.title }]);
    const ttl = opts.duration ?? 4000;
    if (ttl > 0) setTimeout(() => dismiss(id), ttl);
    return id;
  }, [dismiss]);

  const toast = {
    success: (m, o) => push(m, 'success', o),
    error:   (m, o) => push(m, 'error', o),
    warning: (m, o) => push(m, 'warning', o),
    info:    (m, o) => push(m, 'info', o),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Pergaminos flotantes — esquina inferior derecha */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => {
            const v = VARIANTS[t.variant] || VARIANTS.info;
            const Icon = v.icon;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 60, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                onClick={() => dismiss(t.id)}
                className={`pointer-events-auto cursor-pointer relative overflow-hidden
                  min-w-[280px] max-w-sm rounded-xl px-4 py-3 flex items-start gap-3
                  bg-council-darker/90 backdrop-blur-md border ${v.border}`}
                style={{ boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 24px ${v.glow}` }}
              >
                {/* shimmer dorado sutil */}
                <div className="absolute inset-0 shimmer-badge opacity-40 pointer-events-none" />
                <Icon className={`w-5 h-5 ${v.color} flex-shrink-0 mt-0.5 relative`} />
                <div className="relative flex-1 min-w-0">
                  {t.title && (
                    <p className="text-sm font-bold text-white/90 medieval-text leading-tight">{t.title}</p>
                  )}
                  <p className="text-sm text-white/70 leading-snug">{t.message}</p>
                </div>
                <ScrollText className="w-3 h-3 text-medieval-gold/20 flex-shrink-0 relative" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toast: { success: ()=>{}, error: ()=>{}, warning: ()=>{}, info: ()=>{} } };
  return ctx;
};
