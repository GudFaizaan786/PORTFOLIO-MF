import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Volume2 } from "lucide-react";
import { PORTFOLIO_CONTENT } from "../content";
import { Magnetic } from "./Magnetic";

interface EnterPreloaderProps {
  visible: boolean;
  onEnter: (withSound: boolean) => void;
}

export function EnterPreloader({ visible, onEnter }: EnterPreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    const start = performance.now();
    const duration = 1250;

    const tick = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / duration);
      // Smooth ease-out curve
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(Math.round(eased * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setReady(true);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  const enterQuote = PORTFOLIO_CONTENT.quotes.enter;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="enter-preloader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.03,
            transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
          }}
          className="fixed inset-0 z-50 flex flex-col justify-between bg-[#050806]/96 backdrop-blur-md px-6 py-8 sm:px-12 sm:py-12"
          role="dialog"
          aria-modal="true"
          aria-label="Enter portfolio"
        >
          {/* Subtle scanline & corner brackets */}
          <div className="pointer-events-none fixed inset-0 scanline-overlay" />

          {/* Top status row */}
          <div className="relative z-10 flex items-center justify-between text-xs font-mono-ui tracking-[0.2em] uppercase text-[var(--text-dim)]">
            <span>{PORTFOLIO_CONTENT.identity.location}</span>
            <span>{PORTFOLIO_CONTENT.identity.alias} // 2026</span>
          </div>

          {/* Center identity + progress line + Enter CTA */}
          <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center text-center">
            <p className="font-mono-ui text-[11px] uppercase tracking-[0.28em] text-[var(--neon-secondary)] mb-4">
              {PORTFOLIO_CONTENT.identity.role}
            </p>

            <h1
              className="font-display font-semibold tracking-tight text-[clamp(34px,6vw,72px)] leading-[1.02] text-[var(--text-body)] neon-text-glow"
              style={{
                textShadow: ready
                  ? "0 0 24px rgba(57, 255, 20, 0.25)"
                  : "2px 0 rgba(57,255,20,0.45), -2px 0 rgba(0,255,156,0.35)",
                transition: "text-shadow 0.4s ease",
              }}
            >
              {PORTFOLIO_CONTENT.identity.name}
            </h1>

            {/* Neon progress line + mono counter */}
            <div className="mt-8 w-full max-w-md">
              <div className="mb-2 flex items-center justify-between font-mono-ui text-xs text-[var(--text-dim)]">
                <span>INITIALIZING_WORLD</span>
                <span className="text-[var(--neon-primary)]">
                  {String(progress).padStart(3, "0")}%
                </span>
              </div>
              <div className="h-[2px] w-full overflow-hidden bg-[rgba(57,255,20,0.12)]">
                <div
                  className="h-full bg-[var(--neon-primary)] shadow-[0_0_14px_rgba(57,255,20,0.75)] transition-transform duration-75"
                  style={{
                    transform: `scaleX(${progress / 100})`,
                    transformOrigin: "left center",
                  }}
                />
              </div>
            </div>

            {/* Enter action */}
            <div className="mt-10 min-h-[78px] flex flex-col items-center justify-center gap-3">
              {ready ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <Magnetic strength={0.22}>
                      <button
                        type="button"
                        onClick={() => onEnter(true)}
                        data-cursor="play"
                        className="group relative inline-flex items-center gap-3 border border-[var(--neon-primary)] bg-[rgba(57,255,20,0.08)] px-8 py-3.5 font-mono-ui text-xs uppercase tracking-[0.22em] text-[var(--neon-primary)] shadow-[0_0_24px_rgba(57,255,20,0.2)] transition-all duration-300 hover:bg-[var(--neon-primary)] hover:text-[#050806] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)]"
                      >
                        <Volume2 className="h-4 w-4" />
                        <span>Enter World</span>
                      </button>
                    </Magnetic>

                    <button
                      type="button"
                      onClick={() => onEnter(false)}
                      className="px-4 py-3 font-mono-ui text-[11px] uppercase tracking-[0.18em] text-[var(--text-dim)] transition-colors hover:text-[var(--text-body)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--neon-primary)]"
                    >
                      Enter Muted
                    </button>
                  </div>
                  <p className="font-mono-ui text-[11px] tracking-[0.16em] text-[var(--text-dim)]">
                    Best with sound · Procedural ambient audio
                  </p>
                </motion.div>
              ) : (
                <p className="font-mono-ui text-[11px] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                  Building procedural geometry...
                </p>
              )}
            </div>
          </div>

          {/* Bottom Enter Quote Card */}
          <div className="relative z-10 mx-auto w-full max-w-xl">
            <blockquote className="neon-border bg-[var(--bg-panel-glass)] px-5 py-4 text-center">
              <p className="text-xs sm:text-sm leading-relaxed text-[var(--text-body)]">
                “{enterQuote.text}”
              </p>
              {enterQuote.source && (
                <footer className="mt-2 font-mono-ui text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                  — {enterQuote.source}
                </footer>
              )}
            </blockquote>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
