import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  Copy,
  Layers,
  List,
  MoveHorizontal,
  Send,
  Sprout,
} from "lucide-react";
import * as THREE from "three";

import { PORTFOLIO_CONTENT, ProjectItem } from "./content";
import { ambientAudio } from "./audio/ambientAudio";
import { worldState } from "./hooks/useWorldState";
import { WorldCanvas } from "./scenes/WorldCanvas";
import { CAROUSEL_CENTER } from "./scenes/ProjectsCarousel3D";
import { EnterPreloader } from "./components/EnterPreloader";
import { CustomCursor } from "./components/CustomCursor";
import { Navbar } from "./components/Navbar";
import { SectionNav } from "./components/SectionNav";
import { MorphingText } from "./components/MorphingText";
import { QuoteCard } from "./components/QuoteCard";
import { Magnetic } from "./components/Magnetic";
import { ProjectIndexModal, ProjectModal } from "./components/ProjectModal";

gsap.registerPlugin(ScrollTrigger);

function AnimatedStatCounter({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          const obj = { val: 0 };
          gsap.to(obj, {
            val: value,
            duration: 1.35,
            ease: "power3.out",
            onUpdate: () => setDisplay(Math.round(obj.val)),
          });
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  return (
    <div
      ref={ref}
      className="neon-border bg-[var(--bg-panel-glass)] backdrop-blur-md p-4"
    >
      <div className="font-display text-2xl sm:text-3xl font-semibold text-[var(--neon-primary)]">
        {display}
        {suffix}
      </div>
      <div className="mt-1 font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[var(--text-dim)]">
        {label}
      </div>
    </div>
  );
}

export default function App() {
  const [entered, setEntered] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Audio & accessibility state
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [soundVolume, setSoundVolume] = useState(0.45);
  const [dimMode, setDimMode] = useState(false);
  const [glitchMode, setGlitchMode] = useState(false);
  const [plantNotice, setPlantNotice] = useState(false);

  // Projects state
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(
    null
  );
  const [indexOpen, setIndexOpen] = useState(false);
  const [projectViewMode, setProjectViewMode] = useState<
    "carousel3d" | "filmstrip"
  >("carousel3d");

  // Contact interactions
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [formSent, setFormSent] = useState(false);

  const lenisRef = useRef<Lenis | null>(null);
  const skillsPinRef = useRef<HTMLDivElement>(null);
  const skillsTrackRef = useRef<HTMLDivElement>(null);
  const skillsSvgLineRef = useRef<SVGPathElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);
  const [activeJourneyStep, setActiveJourneyStep] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const typedBufferRef = useRef("");
  const wasPlayingBeforeHide = useRef(false);

  // Reduced motion sync
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    worldState.reducedMotion = mq.matches;
    const onChange = () => {
      worldState.reducedMotion = mq.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Mouse, touch, and device-orientation tracking + idle timestamp
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      worldState.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      worldState.mouseY = -((e.clientY / window.innerHeight) * 2 - 1);
      worldState.lastPointerTime = performance.now();
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      worldState.mouseX = (t.clientX / window.innerWidth) * 2 - 1;
      worldState.mouseY = -((t.clientY / window.innerHeight) * 2 - 1);
      worldState.lastPointerTime = performance.now();
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      // Only apply device orientation if user hasn't touched/moved mouse in last 2s
      if (performance.now() - worldState.lastPointerTime < 2000) return;
      worldState.mouseX = THREE.MathUtils.clamp(e.gamma / 35, -1, 1);
      worldState.mouseY = THREE.MathUtils.clamp((e.beta - 35) / 35, -1, 1);
      worldState.lastPointerTime = performance.now();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("deviceorientation", onOrient, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, []);

  // Pause/duck sound when tab is hidden
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        wasPlayingBeforeHide.current = ambientAudio.getIsPlaying();
        if (wasPlayingBeforeHide.current) {
          ambientAudio.stop();
          setSoundPlaying(false);
        }
      } else if (wasPlayingBeforeHide.current) {
        ambientAudio.start();
        setSoundPlaying(true);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Lenis + ScrollTrigger choreography
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    const sectionIds = PORTFOLIO_CONTENT.sections.map((s) => s.id);

    lenis.on("scroll", (e: { progress: number; velocity: number }) => {
      ScrollTrigger.update();
      const p = THREE.MathUtils.clamp(e.progress || 0, 0, 1);
      worldState.progress = p;
      worldState.velocity = THREE.MathUtils.clamp(
        (e.velocity || 0) * 0.04,
        -2,
        2
      );
      setScrollProgress(p);

      // Update active section cleanly based on viewport midpoint
      let currentIdx = 0;
      const mid = window.innerHeight * 0.45;
      for (let i = 0; i < sectionIds.length; i++) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= mid) currentIdx = i;
        }
      }
      worldState.activeSectionIndex = currentIdx;
      setActiveSection(currentIdx);

      // Subtle audio ducking on very fast scroll
      ambientAudio.setDucking(
        Boolean(selectedProject) || Math.abs(worldState.velocity) > 0.65,
        worldState.velocity
      );
    });

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Pinned horizontal-scroll timeline + SVG stroke drawing in Skills
    const ctx = gsap.context(() => {
      if (skillsPinRef.current && skillsTrackRef.current && !worldState.reducedMotion) {
        const track = skillsTrackRef.current;
        const getDist = () =>
          Math.max(0, track.scrollWidth - window.innerWidth + 120);

        gsap.to(track, {
          x: () => -getDist(),
          ease: "none",
          scrollTrigger: {
            trigger: skillsPinRef.current,
            start: "top top",
            end: () => `+=${Math.max(900, getDist())}`,
            scrub: 0.9,
            pin: true,
            invalidateOnRefresh: true,
          },
        });

        if (skillsSvgLineRef.current) {
          const len = skillsSvgLineRef.current.getTotalLength();
          gsap.set(skillsSvgLineRef.current, {
            strokeDasharray: len,
            strokeDashoffset: len,
          });
          gsap.to(skillsSvgLineRef.current, {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              trigger: skillsPinRef.current,
              start: "top top",
              end: () => `+=${Math.max(900, getDist())}`,
              scrub: 0.9,
            },
          });
        }
      }

      // Journey vertical scroll step illumination
      if (journeyRef.current) {
        const items = journeyRef.current.querySelectorAll("[data-journey-item]");
        items.forEach((item, idx) => {
          ScrollTrigger.create({
            trigger: item,
            start: "top 65%",
            end: "bottom 35%",
            onEnter: () => setActiveJourneyStep(idx),
            onEnterBack: () => setActiveJourneyStep(idx),
          });
        });
      }

      // About line reveals
      gsap.utils.toArray<HTMLElement>("[data-reveal-line]").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0.15, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 86%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    });

    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [selectedProject]);

  // Trigger plant shower helper
  const triggerPlantShower = useCallback(() => {
    worldState.plantShowerUntil = performance.now() + 6500;
    setPlantNotice(true);
    ambientAudio.playInteractionTone(523.25);
    window.setTimeout(() => setPlantNotice(false), 3800);
  }, []);

  // Jump to section helper
  const jumpToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(el, { duration: 1.4 });
    } else {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Global keyboard shortcuts (arrows for carousel, PageUp/Down, "g" glitch, "plant" shower)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "g" || e.key === "G") {
        setGlitchMode((prev) => {
          const next = !prev;
          worldState.glitchMode = next;
          return next;
        });
        return;
      }

      if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        typedBufferRef.current = (
          typedBufferRef.current + e.key.toLowerCase()
        ).slice(-5);
        if (typedBufferRef.current === "plant") {
          triggerPlantShower();
          typedBufferRef.current = "";
        }
      }

      if (!selectedProject && !indexOpen) {
        if (e.key === "ArrowRight") {
          setActiveProjectIndex(
            (prev) => (prev + 1) % PORTFOLIO_CONTENT.projects.length
          );
          ambientAudio.playInteractionTone(392);
        } else if (e.key === "ArrowLeft") {
          setActiveProjectIndex(
            (prev) =>
              (prev - 1 + PORTFOLIO_CONTENT.projects.length) %
              PORTFOLIO_CONTENT.projects.length
          );
          ambientAudio.playInteractionTone(349.23);
        } else if (e.key === "PageDown") {
          e.preventDefault();
          const nextIdx = Math.min(
            PORTFOLIO_CONTENT.sections.length - 1,
            activeSection + 1
          );
          jumpToSection(PORTFOLIO_CONTENT.sections[nextIdx].id);
        } else if (e.key === "PageUp") {
          e.preventDefault();
          const prevIdx = Math.max(0, activeSection - 1);
          jumpToSection(PORTFOLIO_CONTENT.sections[prevIdx].id);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeSection,
    indexOpen,
    jumpToSection,
    selectedProject,
    triggerPlantShower,
  ]);

  const handleEnter = (withSound: boolean) => {
    setEntered(true);
    worldState.entered = true;
    gsap.to(worldState, {
      entryPush: 1,
      duration: 1.7,
      ease: "power3.out",
    });
    if (withSound) {
      ambientAudio.start();
      setSoundPlaying(true);
    }
  };

  const handleToggleSound = () => {
    const next = ambientAudio.toggle();
    setSoundPlaying(next);
  };

  const handleChangeVolume = (val: number) => {
    setSoundVolume(val);
    ambientAudio.setVolume(val);
  };

  const handleToggleDimMode = () => {
    setDimMode((prev) => {
      const next = !prev;
      worldState.dimMode = next;
      return next;
    });
  };

  const handleSelectProject = useCallback((project: ProjectItem, idx: number) => {
    setActiveProjectIndex(idx);
    setSelectedProject(project);
    worldState.zoomTargetPos = new THREE.Vector3(
      CAROUSEL_CENTER.x,
      CAROUSEL_CENTER.y + 0.1,
      CAROUSEL_CENTER.z + 3.4
    );
    worldState.zoomTargetLook = new THREE.Vector3(
      CAROUSEL_CENTER.x,
      CAROUSEL_CENTER.y,
      CAROUSEL_CENTER.z
    );
    ambientAudio.setDucking(true, 0);
    ambientAudio.playInteractionTone(440 + idx * 45);
  }, []);

  const handleCloseProjectModal = useCallback(() => {
    setSelectedProject(null);
    worldState.zoomTargetPos = null;
    worldState.zoomTargetLook = null;
    ambientAudio.setDucking(false, 0);
  }, []);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PORTFOLIO_CONTENT.contact.email);
    } catch {
      // Fallback silent
    }
    setCopiedEmail(true);
    ambientAudio.playInteractionTone(587.33);
    window.setTimeout(() => setCopiedEmail(false), 2200);
  };

  const handleContactSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMsg.trim()) return;
    setFormSent(true);
    ambientAudio.playInteractionTone(523.25);
    setContactName("");
    setContactEmail("");
    setContactMsg("");
  };

  const activeProject = useMemo(
    () => PORTFOLIO_CONTENT.projects[activeProjectIndex],
    [activeProjectIndex]
  );

  return (
    <div
      className={`relative min-h-screen bg-[var(--bg-base)] text-[var(--text-body)] selection:bg-[var(--neon-primary)] selection:text-[#050806] ${
        dimMode ? "dim-neon" : ""
      } ${glitchMode ? "glitch-active" : ""}`}
    >
      {/* Full-3D Live Procedural World (fixed behind everything) */}
      <WorldCanvas
        activeProjectIndex={activeProjectIndex}
        onChangeProjectIndex={setActiveProjectIndex}
        onSelectProject={handleSelectProject}
        dimMode={dimMode}
      />

      {/* Subtle scanline & grain overlays */}
      <div className="pointer-events-none fixed inset-0 z-10 scanline-overlay" />
      <div className="pointer-events-none fixed inset-0 z-10 grain-overlay" />

      {/* Custom Neon Cursor */}
      <CustomCursor />

      {/* Enter Screen & Preloader */}
      <EnterPreloader visible={!entered} onEnter={handleEnter} />

      {/* Navigation & Corner HUD */}
      <Navbar
        activeSection={activeSection}
        scrollProgress={scrollProgress}
        onJumpToSection={jumpToSection}
      />

      <SectionNav
        activeSection={activeSection}
        scrollProgress={scrollProgress}
        onJumpToSection={jumpToSection}
        soundPlaying={soundPlaying}
        soundVolume={soundVolume}
        onToggleSound={handleToggleSound}
        onChangeVolume={handleChangeVolume}
        dimMode={dimMode}
        onToggleDimMode={handleToggleDimMode}
        glitchMode={glitchMode}
        onToggleGlitch={() =>
          setGlitchMode((prev) => {
            const next = !prev;
            worldState.glitchMode = next;
            return next;
          })
        }
      />

      {/* Plant Easter Egg Toast */}
      {plantNotice && (
        <div className="fixed top-20 right-6 z-40 neon-border bg-[var(--bg-panel-glass)] backdrop-blur-md px-4 py-2.5 font-mono-ui text-xs text-[var(--neon-primary)] shadow-[0_0_20px_rgba(57,255,20,0.28)]">
          <span className="inline-flex items-center gap-2">
            <Sprout className="h-4 w-4" />
            Sapling protocol active · pixel leaf shower
          </span>
        </div>
      )}

      {/* Main Scrollable Foreground Overlay */}
      <main className="relative z-20 pointer-events-none">
        {/* 1. HERO SECTION */}
        <section
          id="hero"
          className="relative flex min-h-screen flex-col justify-between px-5 pt-24 pb-10 sm:px-10 lg:px-16"
        >
          {/* Top identity header row */}
          <div className="mx-auto flex w-full max-w-7xl flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="pointer-events-auto max-w-md">
              <p className="font-mono-ui text-[11px] uppercase tracking-[0.22em] text-[var(--neon-secondary)]">
                01 // {PORTFOLIO_CONTENT.identity.role}
              </p>
              <h1 className="mt-1.5 font-display text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--text-body)] glitch-target">
                {PORTFOLIO_CONTENT.identity.name}
              </h1>
              <p className="mt-1 font-mono-ui text-xs text-[var(--text-dim)]">
                {PORTFOLIO_CONTENT.identity.alias} ·{" "}
                {PORTFOLIO_CONTENT.identity.location}
              </p>
            </div>

            {/* Hero Quote Card */}
            <div className="pointer-events-auto hidden md:block">
              <QuoteCard quote={PORTFOLIO_CONTENT.quotes.hero} align="right" />
            </div>
          </div>

          {/* Center spacer left clear for the 3D Pixel-Portrait Head */}
          <div className="my-auto h-[22vh] sm:h-[28vh]" aria-hidden="true" />

          {/* Lower Hero: MorphingText (ONLY in Hero) + Scroll Cue + Side Socials */}
          <div className="mx-auto w-full max-w-7xl">
            <div className="pointer-events-auto mx-auto max-w-5xl pb-4">
              <MorphingText
                words={PORTFOLIO_CONTENT.heroMorphingWords}
                morphDuration={1.3}
                holdDuration={1.8}
                blurAmount={14}
              />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-5">
              {/* Left social icons */}
              <div className="pointer-events-auto flex flex-wrap items-center gap-4">
                {PORTFOLIO_CONTENT.contact.socials.map((soc) => (
                  <Magnetic key={soc.label} strength={0.2}>
                    <a
                      href={soc.href}
                      target="_blank"
                      rel="noreferrer"
                      className="neon-underline font-mono-ui text-[11px] uppercase tracking-[0.16em] text-[var(--text-dim)] transition-colors hover:text-[var(--neon-primary)]"
                    >
                      {soc.label}
                    </a>
                  </Magnetic>
                ))}
              </div>

              {/* Mobile Hero Quote */}
              <div className="pointer-events-auto md:hidden w-full">
                <QuoteCard quote={PORTFOLIO_CONTENT.quotes.hero} align="center" />
              </div>

              {/* Scroll cue */}
              <button
                type="button"
                onClick={() => jumpToSection("about")}
                className="pointer-events-auto inline-flex items-center gap-2.5 font-mono-ui text-[11px] uppercase tracking-[0.22em] text-[var(--neon-primary)] hover:opacity-80"
              >
                <span className="h-5 w-[1px] bg-[var(--neon-primary)] animate-pulse" />
                <span>Scroll to explore</span>
              </button>
            </div>
          </div>
        </section>

        {/* 2. ABOUT SECTION */}
        <section
          id="about"
          className="relative min-h-screen px-5 py-24 sm:px-10 lg:px-16"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12 items-start">
            {/* Left column stays lighter/open for the 3D Pixel Head companion + Skill Orbs */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-8 lg:min-h-[65vh]">
              <div className="pointer-events-auto">
                <p className="font-mono-ui text-[11px] uppercase tracking-[0.22em] text-[var(--neon-secondary)]">
                  02 // About & Identity
                </p>
                <h2 className="mt-2 font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[var(--text-body)] glitch-target">
                  Grounded craft,
                  <br />
                  <span className="text-[var(--neon-primary)] neon-text-glow">
                    humanity above all.
                  </span>
                </h2>
              </div>

              <div className="hidden lg:block h-56" aria-hidden="true" />

              <div className="pointer-events-auto">
                <QuoteCard quote={PORTFOLIO_CONTENT.quotes.about} />
              </div>
            </div>

            {/* Right column: Bio reveal + Animated Stats + Skills & Tools */}
            <div className="pointer-events-auto lg:col-span-7 space-y-8">
              <div className="neon-border bg-[var(--bg-panel-glass)] backdrop-blur-md p-6 sm:p-8 space-y-5">
                <p
                  data-reveal-line
                  className="font-display text-xl sm:text-2xl font-medium leading-snug text-[var(--text-body)]"
                >
                  {PORTFOLIO_CONTENT.bio.short}
                </p>

                {PORTFOLIO_CONTENT.bio.longParagraphs.map((para, i) => (
                  <p
                    key={i}
                    data-reveal-line
                    className="text-sm sm:text-base leading-relaxed text-[var(--text-dim)]"
                  >
                    {para}
                  </p>
                ))}

                <p
                  data-reveal-line
                  className="border-l-2 border-[var(--neon-primary)] pl-4 text-sm sm:text-base leading-relaxed text-[var(--text-body)]"
                >
                  {PORTFOLIO_CONTENT.bio.philosophy}
                </p>
              </div>

              {/* Animated Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {PORTFOLIO_CONTENT.bio.stats.map((st) => (
                  <AnimatedStatCounter
                    key={st.label}
                    value={st.value}
                    suffix={st.suffix}
                    label={st.label}
                  />
                ))}
              </div>

              {/* Core skills & tools */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="neon-border bg-[var(--bg-panel-glass)] backdrop-blur-md p-5">
                  <div className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-[var(--neon-secondary)]">
                    Core Focus
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {PORTFOLIO_CONTENT.bio.skills.map((sk) => (
                      <span
                        key={sk}
                        className="border border-[var(--border-subtle)] px-2.5 py-1 text-xs text-[var(--text-body)]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="neon-border bg-[var(--bg-panel-glass)] backdrop-blur-md p-5">
                  <div className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-[var(--neon-secondary)]">
                    Daily Toolkit
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {PORTFOLIO_CONTENT.bio.tools.map((tl) => (
                      <span
                        key={tl}
                        className="border border-[var(--border-neon)] px-2.5 py-1 font-mono-ui text-[11px] text-[var(--neon-primary)]"
                      >
                        {tl}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. PROJECTS SECTION (3D Coverflow Ring + Filmstrip + Index List) */}
        <section
          id="projects"
          className="relative min-h-[115vh] flex flex-col justify-between px-5 py-24 sm:px-10 lg:px-16"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
            const dx = endX - touchStartX.current;
            if (Math.abs(dx) > 45) {
              const total = PORTFOLIO_CONTENT.projects.length;
              setActiveProjectIndex((prev) =>
                dx < 0 ? (prev + 1) % total : (prev - 1 + total) % total
              );
            }
            touchStartX.current = null;
          }}
        >
          {/* Header & View Mode Controls */}
          <div className="mx-auto flex w-full max-w-7xl flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="pointer-events-auto">
              <p className="font-mono-ui text-[11px] uppercase tracking-[0.22em] text-[var(--neon-secondary)]">
                03 // Selected Works
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[var(--text-body)] glitch-target">
                3D Project Carousel
              </h2>
              <p className="mt-1.5 font-mono-ui text-xs text-[var(--text-dim)]">
                Drag 3D cards, use arrow keys, swipe, or open a case study.
              </p>
            </div>

            <div className="pointer-events-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setProjectViewMode("carousel3d")}
                className={`inline-flex items-center gap-1.5 border px-3 py-2 font-mono-ui text-[11px] uppercase tracking-[0.16em] transition-colors ${
                  projectViewMode === "carousel3d"
                    ? "border-[var(--neon-primary)] bg-[rgba(57,255,20,0.12)] text-[var(--neon-primary)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-panel-glass)] text-[var(--text-dim)] hover:text-[var(--text-body)]"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>3D Ring</span>
              </button>

              <button
                type="button"
                onClick={() => setProjectViewMode("filmstrip")}
                className={`inline-flex items-center gap-1.5 border px-3 py-2 font-mono-ui text-[11px] uppercase tracking-[0.16em] transition-colors ${
                  projectViewMode === "filmstrip"
                    ? "border-[var(--neon-primary)] bg-[rgba(57,255,20,0.12)] text-[var(--neon-primary)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-panel-glass)] text-[var(--text-dim)] hover:text-[var(--text-body)]"
                }`}
              >
                <MoveHorizontal className="h-3.5 w-3.5" />
                <span>Filmstrip</span>
              </button>

              <button
                type="button"
                onClick={() => setIndexOpen(true)}
                className="inline-flex items-center gap-1.5 border border-[var(--border-neon)] bg-[var(--bg-panel-glass)] px-3 py-2 font-mono-ui text-[11px] uppercase tracking-[0.16em] text-[var(--text-body)] hover:border-[var(--neon-primary)] hover:text-[var(--neon-primary)]"
              >
                <List className="h-3.5 w-3.5" />
                <span>Index ({PORTFOLIO_CONTENT.projects.length})</span>
              </button>
            </div>
          </div>

          {/* Middle stage: open WebGL window in 3D Ring mode OR Horizontal Filmstrip */}
          {projectViewMode === "carousel3d" ? (
            <div className="my-auto h-[42vh] sm:h-[48vh]" aria-hidden="true" />
          ) : (
            <div className="pointer-events-auto mx-auto my-8 w-full max-w-7xl overflow-x-auto pb-4">
              <div className="flex gap-5 min-w-max">
                {PORTFOLIO_CONTENT.projects.map((p, idx) => (
                  <article
                    key={p.id}
                    data-cursor="view"
                    onClick={() => handleSelectProject(p, idx)}
                    className="group w-[300px] sm:w-[360px] cursor-pointer neon-border bg-[var(--bg-panel-glass)] backdrop-blur-md p-4 transition-transform duration-300 hover:-translate-y-1.5"
                    style={{ borderColor: `${p.accentColor}4d` }}
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden border border-[var(--border-subtle)] bg-[#050806]">
                      {p.coverImageUrl ? (
                        <img
                          src={p.coverImageUrl}
                          alt={p.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full flex-col justify-between p-4"
                          style={{
                            backgroundImage: `radial-gradient(circle at 75% 25%, ${p.accentColor}26, transparent 60%)`,
                          }}
                        >
                          <span className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[var(--text-dim)]">
                            {p.category}
                          </span>
                          <span
                            className="font-display text-lg font-semibold"
                            style={{ color: p.accentColor }}
                          >
                            {p.title}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between font-mono-ui text-[10px] uppercase tracking-[0.18em]">
                      <span style={{ color: p.accentColor }}>{p.year}</span>
                      <span className="text-[var(--text-dim)]">
                        {p.category}
                      </span>
                    </div>
                    <h3 className="mt-1.5 font-display text-lg font-semibold text-[var(--text-body)] group-hover:text-[var(--neon-primary)]">
                      {p.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--text-dim)]">
                      {p.summary}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Active Project HUD Card & Prev/Next controls */}
          <div className="mx-auto w-full max-w-7xl grid gap-6 lg:grid-cols-12 items-end">
            <div className="pointer-events-auto lg:col-span-7 neon-border bg-[var(--bg-panel-glass)] backdrop-blur-md p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 font-mono-ui text-[11px] uppercase tracking-[0.18em]">
                  <span style={{ color: activeProject.accentColor }}>
                    0{activeProjectIndex + 1} / 0
                    {PORTFOLIO_CONTENT.projects.length}
                  </span>
                  <span className="text-[var(--text-dim)]">
                    {activeProject.category} · {activeProject.year}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous project"
                    onClick={() =>
                      setActiveProjectIndex(
                        (prev) =>
                          (prev - 1 + PORTFOLIO_CONTENT.projects.length) %
                          PORTFOLIO_CONTENT.projects.length
                      )
                    }
                    className="border border-[var(--border-neon)] p-2 text-[var(--text-body)] hover:border-[var(--neon-primary)] hover:text-[var(--neon-primary)]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next project"
                    onClick={() =>
                      setActiveProjectIndex(
                        (prev) => (prev + 1) % PORTFOLIO_CONTENT.projects.length
                      )
                    }
                    className="border border-[var(--border-neon)] p-2 text-[var(--text-body)] hover:border-[var(--neon-primary)] hover:text-[var(--neon-primary)]"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="mt-3 font-display text-xl sm:text-2xl font-semibold text-[var(--text-body)]">
                {activeProject.title}
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[var(--text-dim)]">
                {activeProject.summary}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-1.5">
                  {activeProject.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border border-[var(--border-subtle)] px-2 py-0.5 font-mono-ui text-[10px] text-[var(--text-dim)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <Magnetic strength={0.2}>
                  <button
                    type="button"
                    data-cursor="view"
                    onClick={() =>
                      handleSelectProject(activeProject, activeProjectIndex)
                    }
                    className="inline-flex items-center gap-2 border border-[var(--neon-primary)] bg-[rgba(57,255,20,0.1)] px-4 py-2 font-mono-ui text-[11px] uppercase tracking-[0.18em] text-[var(--neon-primary)] transition-colors hover:bg-[var(--neon-primary)] hover:text-[#050806]"
                  >
                    <span>Open Case Study</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </Magnetic>
              </div>
            </div>

            <div className="pointer-events-auto lg:col-span-5 flex justify-end">
              <QuoteCard quote={PORTFOLIO_CONTENT.quotes.projects} align="right" />
            </div>
          </div>
        </section>

        {/* ENVIRONMENT QUOTE INTERLUDE (between Projects and Skills) */}
        <section
          aria-label="Environment reflection"
          className="px-5 py-16 sm:px-10 lg:px-16"
        >
          <div className="pointer-events-auto mx-auto max-w-7xl flex justify-center">
            <QuoteCard
              quote={PORTFOLIO_CONTENT.quotes.environment}
              align="center"
            />
          </div>
        </section>

        {/* 4. SKILLS & SERVICES SECTION (Pinned Horizontal-Scroll Timeline + Draggable Carousel) */}
        <section id="skills" ref={skillsPinRef} className="relative overflow-hidden">
          <div className="min-h-screen flex flex-col justify-center px-5 py-20 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-7xl">
              <div className="pointer-events-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <p className="font-mono-ui text-[11px] uppercase tracking-[0.22em] text-[var(--neon-secondary)]">
                    04 // Capabilities & Craft
                  </p>
                  <h2 className="mt-2 font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[var(--text-body)] glitch-target">
                    Skills & Services
                  </h2>
                </div>
                <QuoteCard quote={PORTFOLIO_CONTENT.quotes.skills} align="right" />
              </div>

              {/* Scroll-scrubbed SVG neon stroke line drawing */}
              <div className="mt-8 w-full overflow-hidden">
                <svg
                  viewBox="0 0 1200 44"
                  fill="none"
                  className="w-full h-10"
                  aria-hidden="true"
                >
                  <path
                    d="M0 22 L1200 22"
                    stroke="rgba(57,255,20,0.14)"
                    strokeWidth="1"
                  />
                  <path
                    ref={skillsSvgLineRef}
                    d="M0 22 L240 22 L270 8 L300 36 L330 22 L640 22 L670 10 L700 34 L730 22 L1200 22"
                    stroke="#39FF14"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Pinned horizontal track + Draggable 2D Carousel */}
            <div
              ref={skillsTrackRef}
              className="pointer-events-auto mt-6 flex items-stretch gap-5 pl-2 sm:pl-10 lg:pl-16 w-max cursor-grab active:cursor-grabbing"
              data-cursor="drag"
            >
              <motion.div
                drag="x"
                dragConstraints={{ left: -340, right: 0 }}
                dragElastic={0.12}
                className="flex gap-5"
              >
                {PORTFOLIO_CONTENT.skillsAndServices.map((skill, idx) => (
                  <article
                    key={skill.id}
                    className="group w-[290px] sm:w-[350px] shrink-0 neon-border bg-[var(--bg-panel-glass)] backdrop-blur-md p-6 transition-transform duration-300 hover:-translate-y-1.5"
                  >
                    <div className="flex items-center justify-between font-mono-ui text-[10px] uppercase tracking-[0.2em]">
                      <span className="text-[var(--neon-primary)]">
                        0{idx + 1} //
                      </span>
                      <span className="text-[var(--text-dim)]">
                        {skill.level}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-xl font-semibold text-[var(--text-body)] group-hover:text-[var(--neon-primary)]">
                      {skill.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--text-dim)]">
                      {skill.summary}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {skill.tools.map((t) => (
                        <span
                          key={t}
                          className="border border-[var(--border-neon)] px-2.5 py-1 font-mono-ui text-[10px] text-[var(--neon-secondary)]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* 5. JOURNEY / VALUES SECTION (Vertical Scroll-Lit Timeline) */}
        <section
          id="journey"
          ref={journeyRef}
          className="relative min-h-screen px-5 py-24 sm:px-10 lg:px-16"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12 items-start">
            <div className="pointer-events-auto lg:col-span-5 lg:sticky lg:top-28 space-y-6">
              <div>
                <p className="font-mono-ui text-[11px] uppercase tracking-[0.22em] text-[var(--neon-secondary)]">
                  05 // Journey & Principles
                </p>
                <h2 className="mt-2 font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[var(--text-body)] glitch-target">
                  Values in Motion
                </h2>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-[var(--text-dim)]">
                  Guiding anchors across software systems, Origins, planting,
                  robotics, and everyday human craft.
                </p>
              </div>

              <QuoteCard quote={PORTFOLIO_CONTENT.quotes.journey} />
            </div>

            <div className="pointer-events-auto lg:col-span-7 relative pl-6 border-l border-[var(--border-subtle)] space-y-6">
              {PORTFOLIO_CONTENT.journeyValues.map((item, idx) => {
                const isLit = idx <= activeJourneyStep;
                return (
                  <div
                    key={item.id}
                    data-journey-item
                    className={`relative neon-border bg-[var(--bg-panel-glass)] backdrop-blur-md p-6 transition-all duration-500 ${
                      isLit
                        ? "opacity-100 border-[var(--neon-primary)]/60 shadow-[0_0_24px_rgba(57,255,20,0.14)]"
                        : "opacity-55"
                    }`}
                  >
                    {/* Timeline node dot */}
                    <span
                      aria-hidden="true"
                      className={`absolute -left-[31px] top-7 h-3 w-3 transition-all duration-300 ${
                        isLit
                          ? "bg-[var(--neon-primary)] shadow-[0_0_12px_var(--neon-primary)] scale-110"
                          : "bg-[#1a291e]"
                      }`}
                    />
                    <div className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-[var(--neon-primary)]">
                      {item.principle}
                    </div>
                    <h3 className="mt-2 font-display text-xl font-semibold text-[var(--text-body)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">
                      {item.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PLANTING QUOTE INTERLUDE (before Contact) */}
        <section
          aria-label="Planting reflection"
          className="px-5 py-16 sm:px-10 lg:px-16"
        >
          <div className="pointer-events-auto mx-auto max-w-3xl flex flex-col items-center gap-5 text-center">
            <QuoteCard
              quote={PORTFOLIO_CONTENT.quotes.planting}
              align="center"
            />
            <button
              type="button"
              onClick={triggerPlantShower}
              className="inline-flex items-center gap-2 border border-[var(--border-neon)] bg-[var(--bg-panel-glass)] px-4 py-2 font-mono-ui text-[11px] uppercase tracking-[0.18em] text-[var(--neon-primary)] transition-colors hover:bg-[rgba(57,255,20,0.12)]"
            >
              <Sprout className="h-3.5 w-3.5" />
              <span>Plant a Pixel Sapling</span>
            </button>
          </div>
        </section>

        {/* 6. CONTACT SECTION */}
        <section
          id="contact"
          className="relative min-h-screen px-5 py-24 sm:px-10 lg:px-16"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12 items-start">
            <div className="pointer-events-auto lg:col-span-7 space-y-7">
              <div>
                <p className="font-mono-ui text-[11px] uppercase tracking-[0.22em] text-[var(--neon-secondary)]">
                  06 // Contact
                </p>
                <h2 className="mt-2 font-display text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.03] text-[var(--text-body)] glitch-target">
                  {PORTFOLIO_CONTENT.contact.cta}
                </h2>
                <p className="mt-3 font-mono-ui text-xs uppercase tracking-[0.18em] text-[var(--neon-primary)]">
                  {PORTFOLIO_CONTENT.identity.availability}
                </p>
              </div>

              {/* Magnetic Email copy-to-clipboard CTA */}
              <div className="flex flex-wrap items-center gap-4">
                <Magnetic strength={0.2}>
                  <button
                    type="button"
                    data-cursor="copy"
                    onClick={handleCopyEmail}
                    className="inline-flex items-center gap-3 border border-[var(--neon-primary)] bg-[rgba(57,255,20,0.08)] px-5 py-3.5 font-mono-ui text-xs sm:text-sm text-[var(--neon-primary)] shadow-[0_0_24px_rgba(57,255,20,0.16)] transition-all hover:bg-[var(--neon-primary)] hover:text-[#050806]"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Copied to clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>{PORTFOLIO_CONTENT.contact.email}</span>
                      </>
                    )}
                  </button>
                </Magnetic>
              </div>

              {/* Social Links */}
              <div className="flex flex-wrap gap-3">
                {PORTFOLIO_CONTENT.contact.socials.map((soc) => (
                  <Magnetic key={soc.label} strength={0.2}>
                    <a
                      href={soc.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 neon-border bg-[var(--bg-panel-glass)] px-4 py-2.5 font-mono-ui text-xs text-[var(--text-body)] transition-colors hover:border-[var(--neon-primary)] hover:text-[var(--neon-primary)]"
                    >
                      <span>{soc.label}</span>
                      <span className="text-[var(--text-dim)]">
                        {soc.handle}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </Magnetic>
                ))}
              </div>

              {/* Front-end Contact Form */}
              <form
                onSubmit={handleContactSubmit}
                className="neon-border bg-[var(--bg-panel-glass)] backdrop-blur-md p-6 space-y-4"
              >
                <div className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                  Direct Message Interface
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block font-mono-ui text-[10px] uppercase tracking-[0.16em] text-[var(--text-dim)] mb-1.5"
                    >
                      Your Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Ada Lovelace"
                      className="w-full border border-[var(--border-subtle)] bg-[#050806]/85 px-3.5 py-2.5 text-sm text-[var(--text-body)] placeholder:text-[var(--text-dim)]/50 focus:border-[var(--neon-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block font-mono-ui text-[10px] uppercase tracking-[0.16em] text-[var(--text-dim)] mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full border border-[var(--border-subtle)] bg-[#050806]/85 px-3.5 py-2.5 text-sm text-[var(--text-body)] placeholder:text-[var(--text-dim)]/50 focus:border-[var(--neon-primary)] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="contact-message"
                    className="block font-mono-ui text-[10px] uppercase tracking-[0.16em] text-[var(--text-dim)] mb-1.5"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={3}
                    required
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    placeholder="Share a project idea, collaboration, or robotics note..."
                    className="w-full border border-[var(--border-subtle)] bg-[#050806]/85 px-3.5 py-2.5 text-sm text-[var(--text-body)] placeholder:text-[var(--text-dim)]/50 focus:border-[var(--neon-primary)] focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 border border-[var(--neon-primary)] bg-[rgba(57,255,20,0.12)] px-5 py-2.5 font-mono-ui text-xs uppercase tracking-[0.18em] text-[var(--neon-primary)] transition-colors hover:bg-[var(--neon-primary)] hover:text-[#050806]"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Message</span>
                  </button>
                  {formSent && (
                    <span className="font-mono-ui text-xs text-[var(--neon-secondary)]">
                      Message queued — you can also reach me directly via email.
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* Right column leaves calm space for the returning 3D Pixel Portrait Head */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-8 lg:min-h-[60vh]">
              <div className="hidden lg:block h-64" aria-hidden="true" />
              <div className="pointer-events-auto">
                <QuoteCard
                  quote={PORTFOLIO_CONTENT.quotes.contact}
                  align="right"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 7. FOOTER */}
        <footer className="relative border-t border-[var(--border-subtle)] bg-[#050806]/85 backdrop-blur-md pt-10 pb-20">
          {/* Tagline Marquee */}
          <div className="overflow-hidden border-y border-[var(--border-subtle)] py-4 mb-10">
            <div className="marquee-track flex items-center gap-10 whitespace-nowrap font-display text-2xl sm:text-4xl font-semibold text-[var(--neon-primary)]/80">
              {Array.from({ length: 6 }).map((_, idx) => (
                <span key={idx} className="inline-flex items-center gap-10">
                  <span>{PORTFOLIO_CONTENT.identity.tagline}</span>
                  <span className="h-2 w-2 bg-[var(--neon-secondary)]" />
                </span>
              ))}
            </div>
          </div>

          <div className="pointer-events-auto mx-auto flex max-w-7xl flex-col md:flex-row items-center justify-between gap-8 px-5 sm:px-10 lg:px-16">
            <div className="space-y-2 text-center md:text-left">
              <div className="font-display text-lg font-semibold text-[var(--text-body)]">
                {PORTFOLIO_CONTENT.identity.name} (
                {PORTFOLIO_CONTENT.identity.alias})
              </div>
              <div className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-[var(--text-dim)]">
                {PORTFOLIO_CONTENT.identity.location} · Origins · Keys: G
                (glitch), &ldquo;plant&rdquo; (leaf shower)
              </div>
            </div>

            <QuoteCard
              quote={PORTFOLIO_CONTENT.quotes.footer}
              align="center"
            />

            <Magnetic strength={0.22}>
              <button
                type="button"
                onClick={() => jumpToSection("hero")}
                className="inline-flex items-center gap-2 border border-[var(--border-neon)] px-4 py-2.5 font-mono-ui text-xs uppercase tracking-[0.18em] text-[var(--neon-primary)] transition-colors hover:bg-[var(--neon-primary)] hover:text-[#050806]"
              >
                <ArrowUp className="h-4 w-4" />
                <span>Back to Top</span>
              </button>
            </Magnetic>
          </div>
        </footer>
      </main>

      {/* Case Study Modal & Project Index List Modal */}
      <ProjectModal
        project={selectedProject}
        onClose={handleCloseProjectModal}
        onSwitchProject={(proj) => {
          const idx = PORTFOLIO_CONTENT.projects.findIndex(
            (p) => p.id === proj.id
          );
          if (idx >= 0) handleSelectProject(proj, idx);
        }}
      />

      <ProjectIndexModal
        open={indexOpen}
        onClose={() => setIndexOpen(false)}
        onSelectProject={handleSelectProject}
      />
    </div>
  );
}
