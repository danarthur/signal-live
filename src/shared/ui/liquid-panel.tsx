'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

interface LiquidPanelProps extends HTMLMotionProps<"div"> {
  children?: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function LiquidPanel({ children = null, className, hoverEffect = false, ...props }: LiquidPanelProps) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileHover={hoverEffect ? { scale: 1.005, opacity: 1 } : undefined}
      className={cn(
        "liquid-panel p-6 relative overflow-hidden transition-colors duration-300",
        hoverEffect && "liquid-panel-hover",
        className
      )}
      {...props}
    >
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
}
