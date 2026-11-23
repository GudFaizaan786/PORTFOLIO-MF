import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ProjectItem } from "../content";
import { detectSoftwareWebGL } from "../hooks/useProceduralAssets";
import { worldState } from "../hooks/useWorldState";
import { LiveBackground } from "./LiveBackground";
import { PixelPortraitHead } from "./PixelPortraitHead";
import { CAROUSEL_CENTER, ProjectsCarousel3D } from "./ProjectsCarousel3D";
import { ZoneSculptures } from "./ZoneSculptures";

const _camPos = new THREE.Vector3();
const _lookAt = new THREE.Vector3();
const _curLook = new THREE.Vector3(0, 0.6, 0);
const _caVec = new THREE.Vector2(0.0006, 0.0006);

function StudioSetup() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const envTarget = pmrem.fromScene(room, 0.04);
    scene.environment = envTarget.texture;
    room.dispose();
    pmrem.dispose();
    return () => envTarget.dispose();
  }, [gl, scene]);

  return (
    <>
      <color attach="background" args={["#050806"]} />
      <fogExp2 attach="fog" args={["#050806", 0.022]} />
      <hemisphereLight args={["#52ff9b", "#050a06", 0.45]} />
      <directionalLight position={[6, 10, 8]} intensity={1.35} color="#d8f5dc" />
      <pointLight position={[-5, 3, 5]} intensity={1.8} distance={28} color="#39FF14" />
      <pointLight position={[4, 3, -44]} intensity={2.0} distance={32} color="#00FF9C" />
    </>
  );
}

function CameraPathAndAdaptiveFPS({
  onQualityDrop,
}: {
  onQualityDrop: () => void;
}) {
  const { camera } = useThree();
  const lowFpsCount = useRef(0);

  const camCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.9, 9.2), // 0: Enter / Hero
        new THREE.Vector3(-3.6, 1.35, -13), // 1: About
        new THREE.Vector3(0, 1.05, -36.5), // 2: Projects 3D Carousel
        new THREE.Vector3(0, 1.6, -68), // 3: Skills Horizontal Pinned
        new THREE.Vector3(0, 1.4, -96), // 4: Journey / Values
        new THREE.Vector3(0, 1.25, -126), // 5: Contact Calm Zone
      ]),
    []
  );

  const lookCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.65, 2.0), // 0: Pixel Portrait Head
        new THREE.Vector3(1.1, 0.95, -20.5), // 1: About Portrait + Skill Orbs
        new THREE.Vector3(
          CAROUSEL_CENTER.x,
          CAROUSEL_CENTER.y,
          CAROUSEL_CENTER.z
        ), // 2: Projects Carousel Center
        new THREE.Vector3(0, 0.5, -80), // 3: Skills Ring
        new THREE.Vector3(0, 0.5, -108), // 4: Values Ring
        new THREE.Vector3(1.1, 0.9, -135), // 5: Contact Sanctuary + Portrait
      ]),
    []
  );

  useFrame((state, delta) => {
    // Adaptive quality check (if FPS drops below ~45 -> delta > 0.023s consistently)
    if (delta > 0.023 && delta < 0.25) {
      lowFpsCount.current++;
      if (lowFpsCount.current > 45 && worldState.qualityTier === "high") {
        worldState.qualityTier = "medium";
        onQualityDrop();
      }
    } else {
      lowFpsCount.current = Math.max(0, lowFpsCount.current - 1);
    }

    const t = THREE.MathUtils.clamp(worldState.progress, 0, 1);

    if (worldState.zoomTargetPos && worldState.zoomTargetLook) {
      _camPos.copy(worldState.zoomTargetPos);
      _lookAt.copy(worldState.zoomTargetLook);
    } else {
      camCurve.getPointAt(t, _camPos);
      lookCurve.getPointAt(t, _lookAt);

      // Push camera smoothly inward when Enter button is clicked
      const pushOffset = (1 - worldState.entryPush) * 4.5;
      _camPos.z += pushOffset;

      const motion = worldState.reducedMotion ? 0.08 : 1.0;
      const elapsed = state.clock.elapsedTime;
      _camPos.x +=
        worldState.mouseX * 0.55 * motion + Math.sin(elapsed * 0.35) * 0.1 * motion;
      _camPos.y +=
        worldState.mouseY * 0.35 * motion + Math.cos(elapsed * 0.28) * 0.08 * motion;
    }

    camera.position.x = THREE.MathUtils.damp(camera.position.x, _camPos.x, 4.5, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, _camPos.y, 4.5, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, _camPos.z, 4.5, delta);

    _curLook.x = THREE.MathUtils.damp(_curLook.x, _lookAt.x, 5.2, delta);
    _curLook.y = THREE.MathUtils.damp(_curLook.y, _lookAt.y, 5.2, delta);
    _curLook.z = THREE.MathUtils.damp(_curLook.z, _lookAt.z, 5.2, delta);

    camera.lookAt(_curLook);
  });

  return null;
}

function NeonPostProcessing({
  dimMode,
  isMobile,
}: {
  dimMode: boolean;
  isMobile: boolean;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const caRef = useRef<any>(null);

  useFrame((_, delta) => {
    if (caRef.current?.offset) {
      const target =
        (dimMode ? 0.0001 : 0.00035) +
        Math.min(0.0025, Math.abs(worldState.velocity) * 0.0018);
      const next = THREE.MathUtils.damp(caRef.current.offset.x, target, 6, delta);
      _caVec.set(next, next * 0.6);
      caRef.current.offset.copy(_caVec);
    }
  });

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={dimMode ? 0.16 : isMobile ? 0.35 : 0.62}
        luminanceThreshold={0.72}
        luminanceSmoothing={0.3}
        mipmapBlur
      />
      <ChromaticAberration
        ref={caRef}
        offset={_caVec}
        radialModulation={false}
        modulationOffset={0.2}
      />
      <Noise opacity={0.035} blendFunction={BlendFunction.OVERLAY} />
      <Vignette eskil={false} offset={0.2} darkness={0.5} />
    </EffectComposer>
  );
}

interface WorldCanvasProps {
  activeProjectIndex: number;
  onChangeProjectIndex: (idx: number) => void;
  onSelectProject: (project: ProjectItem, index: number) => void;
  dimMode: boolean;
}

export function WorldCanvas({
  activeProjectIndex,
  onChangeProjectIndex,
  onSelectProject,
  dimMode,
}: WorldCanvasProps) {
  const [contextLost, setContextLost] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [qualityDropped, setQualityDropped] = useState(false);
  const isSoftwareGl = useMemo(() => detectSoftwareWebGL(), []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const showPost =
    !isSoftwareGl && !qualityDropped && !worldState.reducedMotion;

  if (contextLost) {
    return <div className="fixed inset-0 z-0 bg-[#050806]" aria-hidden="true" />;
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-auto">
      <Canvas
        dpr={isSoftwareGl ? 1 : [1, 1.75]}
        camera={{ position: [0, 0.9, 13.7], fov: 46, near: 0.1, far: 180 }}
        gl={{
          antialias: !isSoftwareGl,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        onCreated={({ gl }) => {
          const dom = gl.domElement;
          dom.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            setContextLost(true);
          });
          dom.addEventListener("webglcontextrestored", () => {
            setContextLost(false);
          });
        }}
      >
        <StudioSetup />
        <CameraPathAndAdaptiveFPS onQualityDrop={() => setQualityDropped(true)} />

        <LiveBackground isMobile={isMobile} />
        <PixelPortraitHead
          isMobile={isMobile}
          qualityTier={qualityDropped ? "medium" : "high"}
        />
        <ProjectsCarousel3D
          activeIndex={activeProjectIndex}
          onChangeIndex={onChangeProjectIndex}
          onSelectProject={onSelectProject}
        />
        <ZoneSculptures />

        {showPost && <NeonPostProcessing dimMode={dimMode} isMobile={isMobile} />}
      </Canvas>
    </div>
  );
}
