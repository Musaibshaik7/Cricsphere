import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * TiltCard: 3D tilt-on-hover container with cursor-following stadium light sheen.
 * Automatically disables tilt on touch or reduced-motion devices.
 */
export const TiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  cursorLabel?: string;
  reducedMotion?: boolean;
  ariaLabel?: string;
}> = ({ children, className = '', onClick, cursorLabel, reducedMotion = false, ariaLabel }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4.5;
    const rotateY = ((x - centerX) / centerX) * 4.5;

    cardRef.current.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    if (sheenRef.current) {
      sheenRef.current.style.opacity = '1';
      sheenRef.current.style.background = `radial-gradient(360px circle at ${x}px ${y}px, rgba(255,255,255,0.08), transparent 70%)`;
    }
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
    if (sheenRef.current) {
      sheenRef.current.style.opacity = '0';
    }
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        data-cursor="card"
        data-cursor-label={cursorLabel || 'VIEW'}
        className={`group relative text-left w-full transition-transform duration-200 ease-out focus-visible:outline-2 focus-visible:outline-amber-400 ${className}`}
      >
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full h-full transition-transform duration-150 ease-out overflow-hidden rounded-xl"
        >
          <div
            ref={sheenRef}
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 z-10"
          />
          {children}
        </div>
      </button>
    );
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-transform duration-150 ease-out overflow-hidden rounded-xl ${className}`}
    >
      <div
        ref={sheenRef}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 z-10"
      />
      {children}
    </div>
  );
};

/**
 * MagneticButton: Gently pulls button toward the cursor on hover.
 */
export const MagneticButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  cursorLabel?: string;
  className?: string;
  reducedMotion?: boolean;
  ariaLabel?: string;
}> = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
  cursorLabel = 'PLAY',
  className = '',
  reducedMotion = false,
  ariaLabel,
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reducedMotion || disabled || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.18;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.18;
    btnRef.current.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
  };

  const handleMouseLeave = () => {
    if (!btnRef.current) return;
    btnRef.current.style.transform = 'translate3d(0px, 0px, 0)';
  };

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      data-cursor="button"
      data-cursor-label={cursorLabel}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap shrink-0 ${className}`}
    >
      {children}
    </button>
  );
};

/**
 * ScoreboardValue: Animates counting up to the exact number returned by the C++ API.
 * Automatically formats floating-point statistics (like 121.232345678765) to clean decimals.
 */
export const ScoreboardValue: React.FC<{
  value: number | string;
  decimals?: number;
  reducedMotion?: boolean;
  className?: string;
}> = ({ value, decimals, reducedMotion = false, className = '' }) => {
  const formatVal = (v: number | string): string => {
    if (typeof v === 'number') {
      if (Number.isInteger(v) && decimals === undefined) return String(v);
      return v.toFixed(decimals ?? 2);
    }
    const str = String(v).trim();
    if (/^-?\d+\.\d+$/.test(str)) {
      const parsed = parseFloat(str);
      if (!Number.isNaN(parsed)) {
        return parsed.toFixed(decimals ?? 2);
      }
    }
    return str;
  };

  const formattedTarget = formatVal(value);
  const [display, setDisplay] = useState<string>(formattedTarget);

  useEffect(() => {
    const cleanStr = formatVal(value);
    if (reducedMotion) {
      setDisplay(cleanStr);
      return;
    }

    // If the value is a pure integer, animate count-up over 350ms, then lock to cleanStr
    if (/^\d+$/.test(cleanStr)) {
      const target = parseInt(cleanStr, 10);
      if (target === 0) {
        setDisplay('0');
        return;
      }
      const startTime = performance.now();
      const duration = 350;
      let raf = 0;

      const step = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        if (progress < 1) {
          setDisplay(String(Math.round(target * eased)));
          raf = requestAnimationFrame(step);
        } else {
          setDisplay(cleanStr);
        }
      };

      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    } else {
      setDisplay(cleanStr);
    }
  }, [value, decimals, reducedMotion]);

  return <span className={`font-mono-num ${className}`}>{display}</span>;
};

/**
 * SimulationLoader: Bouncing cricket ball and animated over-by-over placeholder
 * while the C++ backend executes match simulations.
 */
export const SimulationLoader: React.FC<{ label?: string }> = ({
  label = 'Simulating overs on C++ engine...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-amber-500/30 bg-slate-900/90 p-6 flex flex-col sm:flex-row items-center justify-between gap-6"
    >
      <div className="flex items-center gap-4">
        <div className="relative h-12 w-12 flex items-center justify-center">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-red-500 to-red-800 border border-amber-200/70 shadow-[0_0_20px_rgba(239,68,68,0.75)] animate-bounce" />
          <div className="absolute bottom-1 h-1.5 w-8 rounded-full bg-black/60 blur-[2px]" />
        </div>
        <div>
          <p className="font-display text-xl font-bold tracking-wide text-white">{label}</p>
          <p className="text-xs text-slate-400">
            Awaiting JSON response from C++ simulation backend
          </p>
        </div>
      </div>

      {/* Over-by-over animated scoreboard placeholder bars */}
      <div className="flex items-end gap-1.5 h-10" aria-hidden="true">
        {[40, 75, 55, 95, 65, 85, 50, 90, 70, 100].map((heightPct, idx) => (
          <div
            key={idx}
            className="w-2 rounded-t bg-amber-400/70 animate-pulse"
            style={{
              height: `${heightPct}%`,
              animationDelay: `${idx * 90}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

/** Full-screen cricket action shown while the match engine is calculating. */
export const MatchSimulationOverlay: React.FC<{ reducedMotion: boolean }> = ({
  reducedMotion,
}) => {
  const loopTransition = { duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-label="Match is going on. Simulating every delivery."
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#03050a]/95 px-5 backdrop-blur-md"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(14,165,233,0.16),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(245,158,11,0.16),transparent_46%)]" />
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-amber-400/35 bg-slate-950/75 px-6 py-8 text-center shadow-[0_0_70px_rgba(245,158,11,0.15)] sm:px-10">
        <p className="font-mono-num text-[11px] font-bold tracking-[0.24em] text-amber-300">
          LIVE MATCH SIMULATION
        </p>
        <h2 className="mt-2 font-display text-4xl font-extrabold tracking-wide text-white sm:text-5xl">
          Match is going on…
        </h2>
        <p className="mt-3 text-sm text-slate-400">
          Simulating every delivery and calculating the final result.
        </p>

        <div className="relative mx-auto mt-8 h-48 max-w-md overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-b from-sky-950/50 via-slate-950 to-emerald-950/35">
          <div className="absolute inset-x-0 bottom-0 h-16 bg-emerald-500/10" />
          <div className="absolute bottom-7 left-1/2 h-1 w-3/4 -translate-x-1/2 rounded-full bg-amber-100/50 shadow-[0_0_12px_rgba(253,230,138,0.65)]" />
          <div className="absolute bottom-3 left-1/2 h-12 w-16 -translate-x-1/2 rounded-t-[50%] border-x border-t border-amber-100/35" />

          <motion.div
            className="absolute bottom-7 left-1/2 h-24 w-16 -translate-x-1/2 origin-bottom"
            animate={reducedMotion ? undefined : { rotate: [0, 0, -30, 0] }}
            transition={loopTransition}
          >
            <div className="absolute left-1/2 top-0 h-5 w-5 -translate-x-1/2 rounded-full border border-amber-100/70 bg-slate-100" />
            <div className="absolute left-1/2 top-5 h-10 w-7 -translate-x-1/2 rounded-t-xl bg-sky-500" />
            <div className="absolute bottom-0 left-3 h-10 w-2 -rotate-12 rounded-full bg-slate-200" />
            <div className="absolute bottom-0 right-3 h-10 w-2 rotate-12 rounded-full bg-slate-200" />
            <div className="absolute right-0 top-8 h-2 w-8 rotate-[35deg] rounded-full bg-amber-200" />
            <div className="absolute -right-6 top-1 h-2 w-14 rotate-[35deg] rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.75)]" />
          </motion.div>

          <motion.div
            className="absolute bottom-12 left-1/2 h-4 w-4 rounded-full border border-amber-100/80 bg-gradient-to-br from-red-400 to-red-800 shadow-[0_0_18px_rgba(239,68,68,0.9)]"
            initial={false}
            animate={reducedMotion ? { x: 0, y: 0 } : { x: [-170, -16, 135], y: [8, -5, -70], scale: [0.65, 1, 0.8] }}
            transition={reducedMotion ? undefined : loopTransition}
          />
          {!reducedMotion && (
            <motion.div
              className="absolute right-8 top-5 text-2xl text-amber-300"
              animate={{ opacity: [0, 0, 1, 0], scale: [0.7, 0.7, 1.15, 0.8] }}
              transition={loopTransition}
            >
              ✦
            </motion.div>
          )}
        </div>

        <div className="mt-7 flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          C++ match engine in progress
        </div>
      </div>
    </div>
  );
};

/** Scorecard transition that reveals the recorded toss before the innings tables. */
export const CoinTossReveal: React.FC<{
  tossWinner?: string;
  tossDecision?: string;
  reducedMotion: boolean;
}> = ({ tossWinner, tossDecision, reducedMotion }) => {
  const hasResult = Boolean(tossWinner);

  return (
    <section
      role="status"
      aria-live="polite"
      className="relative flex min-h-[440px] items-center justify-center overflow-hidden rounded-3xl border border-amber-400/30 bg-slate-950/80 px-6 py-12 text-center"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(245,158,11,0.2),transparent_27%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.14),transparent_48%)]" />
      <div className="relative flex max-w-md flex-col items-center">
        <p className="font-mono-num text-[11px] font-bold tracking-[0.28em] text-amber-300">
          MATCH DAY PROTOCOL
        </p>
        <h2 className="mt-3 font-display text-4xl font-extrabold tracking-wide text-white sm:text-5xl">
          The Coin Toss
        </h2>

        <div className="mt-9 h-32 [perspective:800px]">
          <motion.div
            className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-amber-200 bg-[radial-gradient(circle_at_35%_28%,#fef3c7,transparent_22%),linear-gradient(145deg,#fbbf24,#b45309)] shadow-[0_0_34px_rgba(245,158,11,0.55)] [transform-style:preserve-3d]"
            animate={
              reducedMotion
                ? { rotateY: 0 }
                : hasResult
                  ? { rotateY: [0, 720, 1440], y: [0, -16, 0], scale: [1, 1.08, 1] }
                  : { rotateY: [0, 360], y: [0, -12, 0] }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : hasResult
                  ? { duration: 1.35, ease: 'easeOut' }
                  : { duration: 0.9, repeat: Infinity, ease: 'linear' }
            }
          >
            <span className="font-display text-3xl font-extrabold text-amber-950">T</span>
          </motion.div>
        </div>

        {hasResult ? (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reducedMotion ? 0 : 0.75, duration: 0.35 }}
            className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-6 py-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Toss won by</p>
            <p className="mt-1 font-display text-3xl font-bold tracking-wide text-white">{tossWinner}</p>
            <p className="mt-1 text-sm text-slate-300">Elected to {tossDecision?.toLowerCase() || 'bat'} first</p>
          </motion.div>
        ) : (
          <p className="mt-5 text-sm text-slate-400">Calling the toss from the official scorecard…</p>
        )}
      </div>
    </section>
  );
};

/** One-time glass welcome shown while the app first opens. */
export const WelcomeIntro: React.FC<{
  reducedMotion: boolean;
  onComplete: () => void;
}> = ({ reducedMotion, onComplete }) => {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, reducedMotion ? 650 : 4800);
    return () => window.clearTimeout(timer);
  }, [onComplete, reducedMotion]);

  const glassMotion = reducedMotion
    ? undefined
    : {
        x: [-18, 24, -18],
        y: [-12, 18, -12],
        scale: [1, 1.14, 1],
      };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
      transition={{ duration: reducedMotion ? 0.2 : 0.55, ease: 'easeOut' }}
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-[#04060b] px-6"
    >
      <motion.div
        aria-hidden="true"
        className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl"
        animate={glassMotion}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl"
        animate={reducedMotion ? undefined : { x: [16, -20, 16], y: [12, -18, 12], scale: [1, 1.2, 1] }}
        transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/20 bg-white/[0.075] px-8 py-14 text-center shadow-[0_22px_100px_rgba(56,189,248,0.14)] backdrop-blur-2xl sm:px-16 sm:py-18">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.16),transparent_34%,rgba(56,189,248,0.08)_65%,rgba(245,158,11,0.1))]" />
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: reducedMotion ? 0 : 0.3, duration: 0.7, ease: 'easeOut' }}
          className="relative"
        >
          <p className="font-mono-num text-[11px] font-bold tracking-[0.3em] text-sky-200/85">
            CRICSIM STADIUM NIGHT
          </p>
          <h1 className="font-welcome mt-5 text-6xl leading-none text-white drop-shadow-[0_0_28px_rgba(125,211,252,0.45)] sm:text-8xl">
            Hello, User
          </h1>
          <p className="mt-7 text-sm text-slate-300 sm:text-base">
            Your stadium is ready. Let&apos;s play.
          </p>
          <div className="mx-auto mt-10 h-px w-full max-w-xs overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="h-full bg-gradient-to-r from-sky-300 via-white to-amber-300 shadow-[0_0_16px_rgba(125,211,252,0.9)]"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: reducedMotion ? 0.35 : 4.25, ease: 'easeInOut' }}
            />
          </div>
          <button
            type="button"
            onClick={onComplete}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-sky-200/35 bg-white/10 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_24px_rgba(125,211,252,0.14)] transition hover:bg-white/18 focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            Enter Stadium <span aria-hidden="true">→</span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};
