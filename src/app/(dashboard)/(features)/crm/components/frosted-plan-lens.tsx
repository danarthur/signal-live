'use client';

import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { SIGNAL_PHYSICS } from '@/shared/lib/motion-constants';

type FrostedPlanLensProps = {
  onHandover: () => void;
  handingOver?: boolean;
};

export function FrostedPlanLens({ onHandover, handingOver }: FrostedPlanLensProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SIGNAL_PHYSICS}
      className="relative flex flex-col items-center justify-center min-h-[280px] rounded-[28px] overflow-hidden liquid-card p-8 border border-white/10"
    >
      {/* Frosted overlay — blurred so the lock reads as locked */}
      <div
        className="absolute inset-0 bg-obsidian/70 backdrop-blur-xl pointer-events-none border border-white/5"
        aria-hidden
      />
      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        <div className="p-4 rounded-2xl liquid-panel-nested border border-white/10 shadow-inner">
          <Lock size={32} className="text-ink-muted" aria-hidden />
        </div>
        <div>
          <p className="text-ceramic font-medium tracking-tight leading-none">
            This event has not been handed over yet.
          </p>
          <p className="text-sm text-ink-muted leading-relaxed mt-2">
            Hand over to production to unlock run of show, crewing, and logistics.
          </p>
        </div>
        <motion.button
          type="button"
          onClick={onHandover}
          disabled={handingOver}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={SIGNAL_PHYSICS}
          className="bg-obsidian text-ceramic px-6 py-3 rounded-full liquid-levitation flex items-center gap-2 transition-all hover:brightness-110 disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-obsidian)]"
        >
          {handingOver ? 'Handing over…' : 'Hand over to production'}
        </motion.button>
      </div>
    </motion.div>
  );
}
