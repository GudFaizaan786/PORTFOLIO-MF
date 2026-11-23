import { useEffect, useState } from "react";

interface MorphingTextProps {
  words: string[];
  className?: string;
  morphDuration?: number;
  holdDuration?: number;
  blurAmount?: number;
}

export function MorphingText({
  words,
  className = "",
  morphDuration = 1.3,
  holdDuration = 1.8,
  blurAmount = 14,
}: MorphingTextProps) {
  const [index, setIndex] = useState(0);
  const [morphing, setMorphing] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!words || words.length <= 1) return;

    const totalCycleMs = (holdDuration + morphDuration) * 1000;
    const holdMs = holdDuration * 1000;

    let holdTimeout: number | undefined;
    let morphTimeout: number | undefined;

    const scheduleNext = () => {
      holdTimeout = window.setTimeout(() => {
        setMorphing(true);
        morphTimeout = window.setTimeout(() => {
          setIndex((prev) => (prev + 1) % words.length);
          setMorphing(false);
          scheduleNext();
        }, morphDuration * 1000);
      }, holdMs);
    };

    scheduleNext();

    return () => {
      if (holdTimeout) window.clearTimeout(holdTimeout);
      if (morphTimeout) window.clearTimeout(morphTimeout);
    };
  }, [words, morphDuration, holdDuration]);

  if (!words || words.length === 0) return null;

  const currentWord = words[index];
  const nextWord = words[(index + 1) % words.length];

  const halfDur = Math.max(0.25, morphDuration * 0.55);

  return (
    <div
      className={`relative grid place-items-center text-center select-none ${className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Hidden SVG gooey threshold filter for crisp organic morph without clipping */}
      {!reducedMotion && (
        <svg className="sr-only" width="0" height="0" aria-hidden="true">
          <defs>
            <filter id="neon-morph-threshold">
              <feColorMatrix
                in="SourceGraphic"
                type="matrix"
                values="
                  1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 18 -6
                "
              />
            </filter>
          </defs>
        </svg>
      )}

      <div
        className="relative grid place-items-center w-full"
        style={{
          filter:
            !reducedMotion && morphing
              ? "url(#neon-morph-threshold)"
              : undefined,
        }}
      >
        {/* Outgoing phrase */}
        <span
          className="col-start-1 row-start-1 font-display font-semibold tracking-tight leading-[1.06]"
          style={{
            color: "var(--neon-primary)",
            textShadow: "var(--glow-text)",
            fontSize: "clamp(32px, 6vw, 90px)",
            whiteSpace: "normal",
            textWrap: "balance",
            opacity: reducedMotion ? 1 : morphing ? 0 : 1,
            filter: reducedMotion
              ? "none"
              : morphing
                ? `blur(${blurAmount}px)`
                : "blur(0px)",
            transform: reducedMotion
              ? "none"
              : morphing
                ? "scale(1.04) translateY(-4px)"
                : "scale(1) translateY(0px)",
            transition: reducedMotion
              ? "none"
              : `opacity ${halfDur}s cubic-bezier(0.16, 1, 0.3, 1), filter ${halfDur}s ease, transform ${halfDur}s cubic-bezier(0.16, 1, 0.3, 1)`,
          }}
        >
          {currentWord}
        </span>

        {/* Incoming phrase */}
        {!reducedMotion && (
          <span
            aria-hidden="true"
            className="col-start-1 row-start-1 font-display font-semibold tracking-tight leading-[1.06]"
            style={{
              color: "var(--neon-primary)",
              textShadow: "var(--glow-text)",
              fontSize: "clamp(32px, 6vw, 90px)",
              whiteSpace: "normal",
              textWrap: "balance",
              opacity: morphing ? 1 : 0,
              filter: morphing ? "blur(0px)" : `blur(${blurAmount}px)`,
              transform: morphing
                ? "scale(1) translateY(0px)"
                : "scale(0.96) translateY(4px)",
              transition: `opacity ${halfDur}s cubic-bezier(0.16, 1, 0.3, 1), filter ${halfDur}s ease, transform ${halfDur}s cubic-bezier(0.16, 1, 0.3, 1)`,
            }}
          >
            {nextWord}
          </span>
        )}
      </div>
    </div>
  );
}
