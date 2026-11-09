import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { TeamVisualTheme } from '../types/cricket';

interface WinnerCelebrationProps {
  theme: TeamVisualTheme;
  reducedMotion: boolean;
}

/** A lightweight, team-coloured fireworks burst for a completed-match winner. */
export const WinnerCelebration: React.FC<WinnerCelebrationProps> = ({
  theme,
  reducedMotion,
}) => {
  const sparks = [
    { x: -58, y: -36, rotate: -45, color: theme.primary },
    { x: -18, y: -62, rotate: 32, color: '#FACC15' },
    { x: 28, y: -52, rotate: 78, color: '#38BDF8' },
    { x: 62, y: -16, rotate: 122, color: '#F472B6' },
    { x: 48, y: 31, rotate: 168, color: '#34D399' },
    { x: 6, y: 51, rotate: 220, color: theme.secondary },
    { x: -42, y: 34, rotate: 278, color: '#FB923C' },
    { x: -64, y: 2, rotate: 328, color: '#E879F9' },
  ];

  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-3 rounded-2xl opacity-90 blur-xl"
        style={{
          background: `radial-gradient(circle at 18% 50%, ${theme.glow}, transparent 66%)`,
        }}
      />
      {!reducedMotion && (
        <span aria-hidden="true" className="pointer-events-none absolute left-12 top-1/2 z-10">
          <span
            className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full blur-sm"
            style={{ backgroundColor: theme.glow }}
          />
          {sparks.map((spark, index) => (
            <motion.span
              key={`${spark.color}-${index}`}
              className="absolute h-1.5 w-1.5 rounded-sm"
              style={{ backgroundColor: spark.color, boxShadow: `0 0 8px ${spark.color}` }}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0, 1.15, 0.85, 0.35],
                x: [0, spark.x * 0.45, spark.x, spark.x * 1.18],
                y: [0, spark.y * 0.45, spark.y, spark.y * 1.18],
                rotate: [0, spark.rotate * 0.5, spark.rotate, spark.rotate * 1.35],
              }}
              transition={{ duration: 2.9, delay: index * 0.055, ease: 'easeOut' }}
            />
          ))}
        </span>
      )}
    </>
  );
};

export const WinnerBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-400/15 px-2 py-1 text-[10px] font-extrabold tracking-[0.14em] text-amber-200">
    <Sparkles className="h-3 w-3" />
    WINNERS
  </span>
);
