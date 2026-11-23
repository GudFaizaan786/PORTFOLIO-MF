import { PORTFOLIO_CONTENT } from "../content";
import { Magnetic } from "./Magnetic";

interface NavbarProps {
  activeSection: number;
  scrollProgress: number;
  onJumpToSection: (id: string) => void;
}

export function Navbar({
  activeSection,
  scrollProgress,
  onJumpToSection,
}: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      {/* Top 1px neon scroll progress indicator */}
      <div className="h-[2px] w-full bg-[rgba(57,255,20,0.08)]">
        <div
          className="h-full bg-[var(--neon-primary)] shadow-[0_0_12px_var(--neon-primary)] origin-left"
          style={{ transform: `scaleX(${scrollProgress})` }}
        />
      </div>

      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-10"
      >
        {/* Left: Wordmark */}
        <Magnetic strength={0.18}>
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              onJumpToSection("hero");
            }}
            className="inline-flex items-center gap-2.5 px-2 py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--neon-primary)]"
          >
            <span className="h-2 w-2 bg-[var(--neon-primary)] shadow-[0_0_10px_var(--neon-primary)]" />
            <span className="font-display text-sm font-semibold tracking-[0.16em] text-[var(--text-body)]">
              {PORTFOLIO_CONTENT.identity.wordmark}
            </span>
            <span className="hidden sm:inline font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[var(--text-dim)]">
              // {PORTFOLIO_CONTENT.identity.alias}
            </span>
          </a>
        </Magnetic>

        {/* Center/Right: Section anchors */}
        <ul className="hidden md:flex items-center gap-6 bg-[var(--bg-panel-glass)] backdrop-blur-md neon-border px-5 py-2">
          {PORTFOLIO_CONTENT.sections.map((sec, idx) => {
            const active = idx === activeSection;
            return (
              <li key={sec.id}>
                <a
                  href={`#${sec.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onJumpToSection(sec.id);
                  }}
                  className={`neon-underline font-mono-ui text-[11px] uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--neon-primary)] ${
                    active
                      ? "text-[var(--neon-primary)]"
                      : "text-[var(--text-dim)] hover:text-[var(--text-body)]"
                  }`}
                >
                  <span className="mr-1 opacity-60">{sec.index}</span>
                  {sec.label}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Far Right: Single availability / contact CTA */}
        <Magnetic strength={0.2}>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              onJumpToSection("contact");
            }}
            className="inline-flex items-center gap-2 border border-[var(--border-neon)] bg-[var(--bg-panel-glass)] backdrop-blur-md px-3.5 py-2 font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[var(--neon-secondary)] transition-colors hover:border-[var(--neon-primary)] hover:text-[var(--neon-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--neon-primary)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-primary)] animate-pulse" />
            <span className="hidden sm:inline">Jan 2027 · Open</span>
            <span className="sm:hidden">Contact</span>
          </a>
        </Magnetic>
      </nav>
    </header>
  );
}
