'use client';

import { motion } from 'framer-motion';

const SPRING = {
  type: 'spring' as const,
  stiffness: 180,
  damping: 24,
  mass: 1.2,
};

const SIZE_MAP = { sm: 24, md: 40, lg: 56 } as const;

const STATUS_COLORS = {
  idle: 'var(--color-ceramic)',
  loading: 'var(--color-neon-blue)',
  error: 'var(--color-signal-error)',
  success: 'var(--color-signal-success)',
} as const;

/** Slightly imperfect circle (squircle / organic blob) — "Bouba" idle shape. */
const IDLE_PATH =
  'M 20 5.5 C 30 5.5 34.5 10 34.5 20 C 34.5 30 30 34.5 20 34.5 C 10 34.5 5.5 30 5.5 20 C 5.5 10 10 5.5 20 5.5 Z';

/** Jagged, spiky shape — "Kiki" error shape. */
const ERROR_PATH =
  'M 20 4 L 23 14 L 34 10 L 26 20 L 32 30 L 21 26 L 20 36 L 19 26 L 8 30 L 14 20 L 6 10 L 17 14 Z';

const VIEWBOX = '0 0 40 40';
const CENTER = 20;

export type LivingLogoStatus = 'idle' | 'loading' | 'error' | 'success';
export type LivingLogoSize = 'sm' | 'md' | 'lg';

interface LivingLogoProps {
  status?: LivingLogoStatus;
  size?: LivingLogoSize;
  className?: string;
}

export function LivingLogo({
  status = 'idle',
  size = 'md',
  className,
}: LivingLogoProps) {
  const px = SIZE_MAP[size];
  const strokeWidth = Math.max(1.2, px * 0.055);
  const color = STATUS_COLORS[status];
  const isError = status === 'error';
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';

  return (
    <motion.svg
      width={px}
      height={px}
      viewBox={VIEWBOX}
      fill="none"
      className={className}
      initial={false}
      animate={
        isError
          ? { skewX: 20, x: [-2, 2, -2] }
          : { skewX: 0, x: 0 }
      }
      transition={
        isError
          ? { x: { duration: 0.25, repeat: Infinity, ease: 'easeInOut' }, skewX: SPRING }
          : SPRING
      }
      style={{
        color,
        transformOrigin: 'center',
        overflow: 'visible',
      }}
    >
      <defs>
        <filter
          id="living-logo-glow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={isSuccess ? 2 : 0}
            result="blur"
          />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Idle / Loading: organic blob path */}
      {!isError && (
        <motion.g
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          animate={
            isIdle
              ? { rotate: 360, scale: [1, 1.05, 1] }
              : isLoading
                ? { rotate: 360, scale: 1 }
                : { rotate: 0, scale: 1 }
          }
          transition={
            isIdle
              ? {
                  rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
                }
              : isLoading
                ? {
                    rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
                    scale: SPRING,
                  }
                : SPRING
          }
        >
          <motion.path
            d={IDLE_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{
              strokeDasharray: isLoading ? ['10 10', '20 20'] : '0 0',
              opacity: isSuccess ? 0 : 1,
            }}
            transition={
              isLoading
                ? {
                    strokeDasharray: { duration: 0.6, repeat: Infinity, ease: 'linear' },
                  }
                : SPRING
            }
            style={{ strokeDashoffset: 0 }}
          />
        </motion.g>
      )}

      {/* Error: jagged path (shake is on parent SVG) */}
      {isError && (
        <path
          d={ERROR_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
        />
      )}

      {/* Success: filled blob + glow */}
      {isSuccess && (
        <motion.path
          d={IDLE_PATH}
          fill="currentColor"
          filter="url(#living-logo-glow)"
          initial={false}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING}
          style={{
            transformOrigin: `${CENTER}px ${CENTER}px`,
          }}
        />
      )}
    </motion.svg>
  );
}
