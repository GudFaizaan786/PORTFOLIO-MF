import { Eye, Volume2, VolumeX } from "lucide-react";
import { PORTFOLIO_CONTENT } from "../content";
import { SaplingProgressMotif } from "./QuoteCard";

interface SectionNavProps {
  activeSection: number;
  scrollProgress: number;
  onJumpToSection: (id: string) => void;
  soundPlaying: boolean;
  soundVolume: number;
  onToggleSound: () => void;
  onChangeVolume: (val: number) => void;
  dimMode: boolean;
  onToggleDimMode: () => void;
  glitchMode: boolean;
  onToggleGlitch: () => void;
}

export function SectionNav({
  activeSection,
  scrollProgress,
  onJumpToSection,
  soundPlaying,
  soundVolume,
  onToggleSound,
  onChangeVolume,
  dimMode,
  onToggleDimMode,
  glitchMode,
  onToggleGlitch,
}: SectionNavProps) {
  return (
    <>
      {/* Right-edge section dot nav + growing sapling SVG */}
      <aside
        aria-label="Section progress navigation"
        className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 lg:flex flex-col items-end gap-5"
      >
        <div className="flex flex-col items-end gap-3 bg-[var(--bg-panel-glass)] backdrop-blur-md neon-border px-2.5 py-3">
          {PORTFOLIO_CONTENT.sections.map((sec, idx) => {
            const active = idx === activeSection;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onJumpToSection(sec.id)}
                aria-label={`Jump to ${sec.label}`}
                className="group flex items-center gap-2.5 focus-visible:outline-none"
              >
                <span
                  className={`font-mono-ui text-[10px] uppercase tracking-[0.18em] transition-all duration-300 ${
                    active
                      ? "opacity-100 text-[var(--neon-primary)]"
                      : "opacity-0 group-hover:opacity-100 text-[var(--text-dim)]"
                  }`}
                >
                  {sec.label}
                </span>
                <span
                  className={`block transition-all duration-300 ${
                    active
                      ? "h-3 w-3 bg-[var(--neon-primary)] shadow-[0_0_10px_var(--neon-primary)]"
                      : "h-1.5 w-1.5 bg-[rgba(57,255,20,0.35)] group-hover:bg-[var(--neon-secondary)]"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="bg-[var(--bg-panel-glass)] backdrop-blur-md neon-border px-2.5 py-2.5">
          <SaplingProgressMotif progress={scrollProgress} />
        </div>
      </aside>

      {/* Bottom-left Audio Equalizer + Accessibility & Voxel Head Controls HUD */}
      <div className="fixed bottom-4 left-4 z-30 flex flex-wrap items-center gap-2">
        {/* Audio Toggle + Volume Slider */}
        <div className="flex items-center gap-2.5 bg-[var(--bg-panel-glass)] backdrop-blur-md neon-border px-3 py-2">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundPlaying ? "Mute ambient sound" : "Play ambient sound"}
            className="inline-flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[0.16em] text-[var(--neon-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--neon-primary)]"
          >
            {soundPlaying ? (
              <Volume2 className="h-3.5 w-3.5" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-[var(--text-dim)]" />
            )}

            {/* Animated 4-bar equalizer */}
            <span className="inline-flex h-3 items-end gap-[2px]" aria-hidden="true">
              {[0.6, 1, 0.45, 0.85].map((h, idx) => (
                <span
                  key={idx}
                  className={`w-[2px] bg-[var(--neon-primary)] transition-all duration-200 ${
                    soundPlaying ? "animate-pulse" : "opacity-30"
                  }`}
                  style={{
                    height: soundPlaying ? `${Math.round(h * 12)}px` : "3px",
                    animationDelay: `${idx * 140}ms`,
                  }}
                />
              ))}
            </span>

            <span className="hidden sm:inline">
              {soundPlaying ? "Sound On" : "Muted"}
            </span>
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={soundVolume}
            onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
            aria-label="Ambient audio volume"
            className="hidden sm:block h-1 w-14 accent-[#39ff14] cursor-pointer"
          />
        </div>

        {/* Dim-neon accessibility toggle */}
        <button
          type="button"
          onClick={onToggleDimMode}
          aria-pressed={dimMode}
          title="Reduce neon intensity for comfortable reading"
          className={`inline-flex items-center gap-1.5 bg-[var(--bg-panel-glass)] backdrop-blur-md neon-border px-3 py-2 font-mono-ui text-[10px] uppercase tracking-[0.15em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--neon-primary)] ${
            dimMode
              ? "text-[var(--neon-primary)]"
              : "text-[var(--text-dim)] hover:text-[var(--text-body)]"
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>{dimMode ? "Dim: On" : "Dim"}</span>
        </button>

        {/* Glitch Mode Toggle visible cleanly in Hero/About/Contact */}
        {(activeSection <= 1 || activeSection === 5) && (
          <div className="hidden sm:flex items-center gap-1.5 bg-[var(--bg-panel-glass)] backdrop-blur-md neon-border px-2.5 py-1.5 font-mono-ui text-[10px] uppercase tracking-[0.14em]">
            <button
              type="button"
              onClick={onToggleGlitch}
              aria-pressed={glitchMode}
              title="Shortcut: press G"
              className={`px-1.5 py-0.5 transition-colors ${
                glitchMode
                  ? "bg-[rgba(57,255,20,0.22)] text-[var(--neon-primary)]"
                  : "text-[var(--text-dim)] hover:text-[var(--text-body)]"
              }`}
            >
              Glitch
            </button>
          </div>
        )}
      </div>
    </>
  );
}
