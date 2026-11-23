import { motion } from "motion/react";
import { QuoteItem } from "../content";

interface QuoteCardProps {
  quote: QuoteItem;
  className?: string;
  align?: "left" | "center" | "right";
}

export function QuoteCard({
  quote,
  className = "",
  align = "left",
}: QuoteCardProps) {
  const alignCls =
    align === "center"
      ? "mx-auto text-center"
      : align === "right"
        ? "ml-auto text-right"
        : "text-left";

  return (
    <motion.blockquote
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className={`relative neon-border bg-[var(--bg-panel-glass)] backdrop-blur-md px-5 py-4 max-w-md ${alignCls} ${className}`}
    >
      {/* Minimal corner micro-ticks */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-2 w-2 border-t border-l border-[var(--neon-primary)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b border-r border-[var(--neon-primary)]"
      />

      <p className="text-xs sm:text-sm leading-relaxed text-[var(--text-body)]">
        “{quote.text}”
      </p>
      {quote.source && (
        <footer className="mt-2 font-mono-ui text-[10px] uppercase tracking-[0.2em] text-[var(--neon-secondary)]/85">
          {quote.source}
        </footer>
      )}
    </motion.blockquote>
  );
}

interface SaplingProgressMotifProps {
  progress: number;
  className?: string;
}

/**
 * Tiny animated leaf / sapling SVG motif that grows smoothly from seed -> stem -> full sprout
 * as scroll progress goes from 0 to 1.
 */
export function SaplingProgressMotif({
  progress,
  className = "",
}: SaplingProgressMotifProps) {
  const p = Math.max(0, Math.min(1, progress));
  const stemHeight = 6 + p * 16;
  const leafScaleLeft = Math.max(0.15, Math.min(1, p * 1.4));
  const leafScaleRight = Math.max(0, Math.min(1, (p - 0.25) * 1.35));

  return (
    <div
      className={`inline-flex flex-col items-center gap-1 ${className}`}
      title={`Ecosystem growth: ${Math.round(p * 100)}%`}
    >
      <svg
        width="26"
        height="30"
        viewBox="0 0 26 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="overflow-visible"
      >
        {/* Soil base */}
        <line
          x1="4"
          y1="27"
          x2="22"
          y2="27"
          stroke="var(--neon-primary)"
          strokeOpacity="0.45"
          strokeWidth="1.2"
        />
        {/* Seed / Root dot */}
        <circle cx="13" cy="27" r="1.8" fill="var(--neon-primary)" />

        {/* Growing stem */}
        <line
          x1="13"
          y1="27"
          x2="13"
          y2={27 - stemHeight}
          stroke="var(--neon-primary)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Left leaf */}
        <g
          transform={`translate(13, ${27 - stemHeight * 0.65}) scale(${leafScaleLeft})`}
        >
          <path
            d="M0 0 C-5 -1 -8 -5 -7 -9 C-3 -9 0 -5 0 0 Z"
            fill="rgba(57, 255, 20, 0.24)"
            stroke="var(--neon-primary)"
            strokeWidth="1.2"
          />
        </g>

        {/* Right upper leaf */}
        {leafScaleRight > 0.05 && (
          <g
            transform={`translate(13, ${27 - stemHeight}) scale(${leafScaleRight})`}
          >
            <path
              d="M0 0 C5 -1 8 -5 7 -9 C3 -9 0 -5 0 0 Z"
              fill="rgba(0, 255, 156, 0.28)"
              stroke="var(--neon-secondary)"
              strokeWidth="1.2"
            />
          </g>
        )}
      </svg>
      <span className="font-mono-ui text-[9px] tracking-[0.14em] text-[var(--text-dim)]">
        {Math.round(p * 100)}%
      </span>
    </div>
  );
}
