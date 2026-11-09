import React, { useEffect, useRef, useState } from 'react';

interface CustomCursorProps {
  isSimulating: boolean;
  reducedMotion: boolean;
}

interface ClickBurst {
  id: number;
  x: number;
  y: number;
}

/**
 * Custom desktop-only Stadium Night cursor.
 * - Default: cricket ball dot with trailing glow and lagging ring.
 * - On buttons/links: ring expands and displays contextual action label ("PLAY", "OPEN", "VIEW").
 * - On cards: ring turns into a "VIEW" lens bubble.
 * - On click: boundary-shot ripple particle burst.
 * - While simulation runs: spinning cricket ball indicator.
 */
export const CustomCursor: React.FC<CustomCursorProps> = ({ isSimulating, reducedMotion }) => {
  const [enabled, setEnabled] = useState(false);
  const [cursorLabel, setCursorLabel] = useState<string | null>(null);
  const [cursorKind, setCursorKind] = useState<'default' | 'button' | 'card'>('default');
  const [bursts, setBursts] = useState<ClickBurst[]>([]);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    if (reducedMotion || typeof window === 'undefined') {
      setEnabled(false);
      document.documentElement.classList.remove('custom-cursor-enabled');
      return;
    }

    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updateDeviceSupport = () => {
      const ok = mediaQuery.matches && !reducedMotion;
      setEnabled(ok);
      if (ok) {
        document.documentElement.classList.add('custom-cursor-enabled');
      } else {
        document.documentElement.classList.remove('custom-cursor-enabled');
      }
    };

    updateDeviceSupport();
    mediaQuery.addEventListener('change', updateDeviceSupport);
    return () => {
      mediaQuery.removeEventListener('change', updateDeviceSupport);
      document.documentElement.classList.remove('custom-cursor-enabled');
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!enabled) return;

    let rafId = 0;

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      const target = e.target as HTMLElement | null;
      const interactiveEl = target?.closest('[data-cursor], button, a, [role="button"]') as HTMLElement | null;

      if (interactiveEl) {
        const customType = interactiveEl.getAttribute('data-cursor');
        const customText = interactiveEl.getAttribute('data-cursor-label');
        if (customType === 'card') {
          setCursorKind('card');
          setCursorLabel(customText || 'VIEW');
        } else {
          setCursorKind('button');
          setCursorLabel(customText || 'PLAY');
        }
      } else {
        setCursorKind('default');
        setCursorLabel(null);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const id = Date.now() + Math.random();
      setBursts((prev) => [...prev.slice(-4), { id, x: e.clientX, y: e.clientY }]);
      window.setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== id));
      }, 550);
    };

    const animateRing = () => {
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.22;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.22;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }
      rafId = requestAnimationFrame(animateRing);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    rafId = requestAnimationFrame(animateRing);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      cancelAnimationFrame(rafId);
    };
  }, [enabled]);

  if (!enabled) return null;

  const isExpanded = cursorKind !== 'default' || isSimulating;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden" aria-hidden="true">
      {/* Lagging outer ring & contextual label */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 transition-[width,height,background-color,border-color] duration-150 ease-out flex items-center justify-center rounded-full"
        style={{
          width: isExpanded ? 58 : 34,
          height: isExpanded ? 58 : 34,
          border:
            cursorKind === 'card'
              ? '1.5px solid rgba(56, 189, 248, 0.8)'
              : isExpanded
              ? '1.5px solid rgba(245, 158, 11, 0.85)'
              : '1px solid rgba(248, 113, 113, 0.45)',
          backgroundColor:
            cursorKind === 'card'
              ? 'rgba(14, 165, 233, 0.16)'
              : isExpanded
              ? 'rgba(245, 158, 11, 0.16)'
              : 'rgba(239, 68, 68, 0.04)',
          boxShadow: isExpanded
            ? '0 0 24px rgba(245, 158, 11, 0.28)'
            : '0 0 12px rgba(239, 68, 68, 0.2)',
        }}
      >
        {isSimulating ? (
          <span className="h-5 w-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        ) : cursorLabel ? (
          <span className="absolute top-full mt-1.5 rounded bg-slate-950/90 border border-amber-400/40 px-1.5 py-0.5 font-mono-num text-[9px] font-bold tracking-wider text-amber-300 shadow-sm">
            {cursorLabel}
          </span>
        ) : null}
      </div>

      {/* Primary Cricket Ball Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2"
      >
        <div
          className={`h-3 w-3 rounded-full bg-red-600 border border-amber-200/80 shadow-[0_0_12px_rgba(239,68,68,0.9)] ${
            isSimulating ? 'animate-spin' : ''
          }`}
        />
      </div>

      {/* Click boundary burst ripples */}
      {bursts.map((b) => (
        <div
          key={b.id}
          className="fixed -translate-x-1/2 -translate-y-1/2"
          style={{ left: b.x, top: b.y }}
        >
          <div className="h-12 w-12 rounded-full border-2 border-amber-400/80 animate-ping" />
        </div>
      ))}
    </div>
  );
};
