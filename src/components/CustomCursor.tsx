import { useEffect, useRef, useState } from "react";

interface RippleItem {
  id: number;
  x: number;
  y: number;
}

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [cursorLabel, setCursorLabel] = useState<string>("");
  const [isVisible, setIsVisible] = useState(false);
  const [ripples, setRipples] = useState<RippleItem[]>([]);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isCoarse || reduced) {
      setEnabled(false);
      return;
    }
    setEnabled(true);

    let raf = 0;

    const handleMove = (e: PointerEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      setIsVisible(true);

      // Check DOM element data-cursor or body dataset.cursor (used by R3F meshes)
      const el = (e.target as HTMLElement | null)?.closest?.(
        "[data-cursor]"
      ) as HTMLElement | null;
      const label = el?.dataset.cursor || document.body.dataset.cursor || "";
      setCursorLabel(label);
    };

    const handleDown = (e: PointerEvent) => {
      const id = Date.now() + Math.random();
      setRipples((prev) => [...prev.slice(-4), { id, x: e.clientX, y: e.clientY }]);
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 520);
    };

    const handleLeave = () => setIsVisible(false);

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerdown", handleDown, { passive: true });
    document.addEventListener("mouseleave", handleLeave);

    const loop = () => {
      ringPos.current.x += (target.current.x - ringPos.current.x) * 0.18;
      ringPos.current.y += (target.current.y - ringPos.current.y) * 0.18;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${target.current.x}px, ${target.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerdown", handleDown);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  if (!enabled) return null;

  const expanded = Boolean(cursorLabel);

  return (
    <>
      {/* Subtle neon click ripples */}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 z-[90] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--neon-primary)] animate-ping"
          style={{ left: r.x, top: r.y, animationDuration: "520ms" }}
        />
      ))}

      {/* Inner sharp neon dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[95] h-2 w-2 rounded-full bg-[var(--neon-primary)] shadow-[0_0_10px_var(--neon-primary)] transition-opacity duration-200"
        style={{ opacity: isVisible ? 1 : 0 }}
      />

      {/* Outer lagging ring with optional state badge */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 z-[94] flex items-center justify-center rounded-full border transition-[width,height,background-color,border-color,opacity] duration-200 ${
          expanded
            ? "h-14 w-14 border-[var(--neon-primary)] bg-[rgba(57,255,20,0.12)] backdrop-blur-xs"
            : "h-8 w-8 border-[rgba(57,255,20,0.5)] bg-transparent"
        }`}
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        {cursorLabel && (
          <span className="font-mono-ui text-[9px] uppercase tracking-[0.18em] text-[var(--neon-primary)]">
            {cursorLabel}
          </span>
        )}
      </div>
    </>
  );
}
