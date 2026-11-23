import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { PORTFOLIO_CONTENT, ProjectItem } from "../content";

interface ProjectModalProps {
  project: ProjectItem | null;
  onClose: () => void;
  onSwitchProject: (project: ProjectItem) => void;
}

export function ProjectModal({
  project,
  onClose,
  onSwitchProject,
}: ProjectModalProps) {
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    setSlideIdx(0);
  }, [project?.id]);

  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, onClose]);

  const slides = useMemo(() => {
    if (!project) return [];
    const urls: string[] = [];
    if (project.coverImageUrl) urls.push(project.coverImageUrl);
    if (project.galleryUrls.length > 0) urls.push(...project.galleryUrls);
    return urls;
  }, [project]);

  const currentIdx = project
    ? PORTFOLIO_CONTENT.projects.findIndex((p) => p.id === project.id)
    : -1;

  const goNeighbor = (dir: -1 | 1) => {
    if (currentIdx < 0) return;
    const total = PORTFOLIO_CONTENT.projects.length;
    const next = (currentIdx + dir + total) % total;
    onSwitchProject(PORTFOLIO_CONTENT.projects[next]);
  };

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          key="project-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050806]/90 backdrop-blur-xl p-4 sm:p-8 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={project.title}
        >
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto w-full max-w-4xl bg-[var(--bg-panel)] neon-border p-6 sm:p-10"
            style={{
              borderColor: `${project.accentColor}55`,
              boxShadow: `0 0 40px ${project.accentColor}1c`,
            }}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-3 font-mono-ui text-[11px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                  <span style={{ color: project.accentColor }}>
                    {project.year}
                  </span>
                  <span>//</span>
                  <span>{project.category}</span>
                </div>
                <h2 className="mt-2 font-display text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--text-body)]">
                  {project.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close case study"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--border-neon)] text-[var(--text-body)] transition-colors hover:border-[var(--neon-primary)] hover:text-[var(--neon-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--neon-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Visual Gallery / Procedural Preview Slider */}
            <div className="relative mt-6 overflow-hidden border border-[var(--border-subtle)] bg-[#050806]">
              {slides.length > 0 ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  <img
                    src={slides[slideIdx % slides.length]}
                    alt={`${project.title} preview ${slideIdx + 1}`}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {slides.length > 1 && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSlideIdx(
                            (prev) => (prev - 1 + slides.length) % slides.length
                          )
                        }
                        aria-label="Previous gallery image"
                        className="border border-[var(--border-neon)] bg-[#050806]/85 p-2 text-[var(--neon-primary)] hover:bg-[var(--neon-primary)] hover:text-[#050806]"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSlideIdx((prev) => (prev + 1) % slides.length)
                        }
                        aria-label="Next gallery image"
                        className="border border-[var(--border-neon)] bg-[#050806]/85 p-2 text-[var(--neon-primary)] hover:bg-[var(--neon-primary)] hover:text-[#050806]"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Procedural Neon Visual Frame when coverImageUrl is null */
                <div
                  className="relative flex aspect-[16/9] w-full flex-col justify-between p-6 sm:p-8"
                  style={{
                    backgroundImage: `radial-gradient(circle at 80% 25%, ${project.accentColor}26, transparent 58%), repeating-linear-gradient(to right, rgba(57,255,20,0.05) 0 1px, transparent 1px 32px), repeating-linear-gradient(to bottom, rgba(57,255,20,0.05) 0 1px, transparent 1px 32px)`,
                  }}
                >
                  <div className="flex items-center justify-between font-mono-ui text-[11px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    <span>PROCEDURAL_SYSTEM_FRAME</span>
                    <span style={{ color: project.accentColor }}>
                      {project.year}
                    </span>
                  </div>
                  <div>
                    <p
                      className="font-display text-2xl sm:text-4xl font-semibold max-w-lg"
                      style={{ color: project.accentColor }}
                    >
                      {project.title}
                    </p>
                    <p className="mt-2 font-mono-ui text-xs text-[var(--text-dim)]">
                      {project.role}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Content grid */}
            <div className="mt-7 grid gap-8 md:grid-cols-3">
              <div className="md:col-span-2 space-y-4">
                <p className="text-base sm:text-lg leading-relaxed text-[var(--text-body)]">
                  {project.summary}
                </p>
                {project.description.map((para, idx) => (
                  <p
                    key={idx}
                    className="text-sm leading-relaxed text-[var(--text-dim)]"
                  >
                    {para}
                  </p>
                ))}
              </div>

              <div className="space-y-5 border-t border-[var(--border-subtle)] pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-6">
                <div>
                  <div className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    Role
                  </div>
                  <div className="mt-1 text-sm text-[var(--text-body)]">
                    {project.role}
                  </div>
                </div>

                <div>
                  <div className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    Tags
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="border border-[var(--border-neon)] px-2.5 py-1 font-mono-ui text-[10px] uppercase tracking-[0.14em] text-[var(--text-body)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hide empty liveLink cleanly */}
                {project.liveLink && (
                  <a
                    href={project.liveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 border border-[var(--neon-primary)] bg-[rgba(57,255,20,0.1)] px-4 py-2.5 font-mono-ui text-xs uppercase tracking-[0.18em] text-[var(--neon-primary)] transition-colors hover:bg-[var(--neon-primary)] hover:text-[#050806]"
                  >
                    <span>Visit Live Project</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Footer Prev/Next switch */}
            <div className="mt-8 flex items-center justify-between border-t border-[var(--border-subtle)] pt-5">
              <button
                type="button"
                onClick={() => goNeighbor(-1)}
                className="inline-flex items-center gap-2 font-mono-ui text-xs uppercase tracking-[0.18em] text-[var(--text-dim)] transition-colors hover:text-[var(--neon-primary)]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Prev Case Study</span>
              </button>
              <button
                type="button"
                onClick={() => goNeighbor(1)}
                className="inline-flex items-center gap-2 font-mono-ui text-xs uppercase tracking-[0.18em] text-[var(--text-dim)] transition-colors hover:text-[var(--neon-primary)]"
              >
                <span>Next Case Study</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ProjectIndexModalProps {
  open: boolean;
  onClose: () => void;
  onSelectProject: (project: ProjectItem, index: number) => void;
}

export function ProjectIndexModal({
  open,
  onClose,
  onSelectProject,
}: ProjectIndexModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="project-index-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050806]/92 backdrop-blur-xl p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Project Index"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-[var(--bg-panel)] neon-border p-6 sm:p-10"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div>
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.22em] text-[var(--neon-secondary)]">
                  PROJECT_ARCHIVE
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-[var(--text-body)]">
                  Index View ({PORTFOLIO_CONTENT.projects.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close project index"
                className="inline-flex h-10 w-10 items-center justify-center border border-[var(--border-neon)] text-[var(--text-body)] hover:border-[var(--neon-primary)] hover:text-[var(--neon-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 divide-y divide-[var(--border-subtle)]">
              {PORTFOLIO_CONTENT.projects.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  data-cursor="view"
                  onClick={() => {
                    onClose();
                    onSelectProject(p, idx);
                  }}
                  className="group flex w-full flex-col sm:flex-row sm:items-center justify-between gap-2 py-4 text-left transition-colors hover:bg-[rgba(57,255,20,0.04)] px-2"
                >
                  <div className="flex items-baseline gap-4">
                    <span
                      className="font-mono-ui text-xs"
                      style={{ color: p.accentColor }}
                    >
                      0{idx + 1}
                    </span>
                    <span className="font-display text-lg sm:text-xl font-medium text-[var(--text-body)] group-hover:text-[var(--neon-primary)]">
                      {p.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 font-mono-ui text-[11px] uppercase tracking-[0.14em] text-[var(--text-dim)]">
                    <span>{p.category}</span>
                    <span>{p.year}</span>
                    <ArrowUpRight className="h-4 w-4 text-[var(--neon-primary)] opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
