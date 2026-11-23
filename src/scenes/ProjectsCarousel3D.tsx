import { useEffect, useMemo, useRef, useState } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PORTFOLIO_CONTENT, ProjectItem } from "../content";
import { loadProjectTextureWithFallback } from "../hooks/useProceduralAssets";
import { worldState } from "../hooks/useWorldState";
import {
  carouselCardFragmentShader,
  carouselCardVertexShader,
} from "../shaders/neonShaders";
import { ambientAudio } from "../audio/ambientAudio";

export const CAROUSEL_CENTER = new THREE.Vector3(0, 0.85, -46);

interface CarouselCardProps {
  project: ProjectItem;
  index: number;
  total: number;
  activeIndex: number;
  dragRotation: React.MutableRefObject<number>;
  onSelectProject: (project: ProjectItem, index: number) => void;
  onFocusIndex: (index: number) => void;
}

function CarouselCard({
  project,
  index,
  total,
  activeIndex,
  dragRotation,
  onSelectProject,
  onFocusIndex,
}: CarouselCardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const hoverVal = useRef(0);
  const mouseUv = useRef(new THREE.Vector2(0.5, 0.5));

  const initialTex = useMemo(() => {
    return loadProjectTextureWithFallback(project, index, (upgraded) => {
      if (matRef.current) {
        matRef.current.uniforms.uTexture.value = upgraded;
        matRef.current.needsUpdate = true;
      }
    });
  }, [project, index]);

  useEffect(() => {
    return () => {
      initialTex.dispose();
    };
  }, [initialTex]);

  const uniforms = useMemo(
    () => ({
      uTexture: { value: initialTex },
      uTime: { value: 0 },
      uHover: { value: 0 },
      uActive: { value: index === activeIndex ? 1 : 0 },
      uMouseUv: { value: new THREE.Vector2(0.5, 0.5) },
      uVelocity: { value: 0 },
      uAccent: { value: new THREE.Color(project.accentColor) },
      uDim: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialTex, project.accentColor]
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const isCurrent = index === activeIndex;

    hoverVal.current = THREE.MathUtils.damp(
      hoverVal.current,
      hovered ? 1 : 0,
      7,
      delta
    );

    if (matRef.current) {
      const u = matRef.current.uniforms;
      u.uTime.value = t;
      u.uHover.value = hoverVal.current;
      u.uActive.value = THREE.MathUtils.damp(
        u.uActive.value,
        isCurrent ? 1 : 0,
        6,
        delta
      );
      u.uMouseUv.value.lerp(mouseUv.current, Math.min(1, delta * 10));
      u.uVelocity.value = worldState.velocity;
      u.uDim.value = worldState.dimMode ? 1 : 0;
    }

    if (groupRef.current) {
      // Arrange cards on a coverflow ring arc
      const angleStep = (Math.PI * 2) / total;
      const angle = index * angleStep - dragRotation.current;
      const radius = 4.6;
      const px = Math.sin(angle) * radius;
      const pz = Math.cos(angle) * radius - radius; // front card sits at z=0 relative to center
      const py = Math.sin(t * 0.9 + index) * 0.08;

      groupRef.current.position.x = THREE.MathUtils.damp(
        groupRef.current.position.x,
        px,
        7,
        delta
      );
      groupRef.current.position.y = THREE.MathUtils.damp(
        groupRef.current.position.y,
        py,
        7,
        delta
      );
      groupRef.current.position.z = THREE.MathUtils.damp(
        groupRef.current.position.z,
        pz,
        7,
        delta
      );

      const tiltX = hovered ? (mouseUv.current.y - 0.5) * -0.16 : 0;
      const tiltY = Math.sin(angle) * -0.45 + (hovered ? (mouseUv.current.x - 0.5) * 0.18 : 0);

      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        tiltX,
        6,
        delta
      );
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        tiltY,
        6,
        delta
      );

      const targetScale = isCurrent ? (hovered ? 1.12 : 1.06) : 0.84;
      const s = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 6, delta);
      groupRef.current.scale.setScalar(s);
    }
  });

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (e.uv) mouseUv.current.copy(e.uv);
  };

  return (
    <group ref={groupRef}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.dataset.cursor = index === activeIndex ? "view" : "drag";
          ambientAudio.playInteractionTone(330 + index * 55);
        }}
        onPointerMove={handlePointerMove}
        onPointerOut={() => {
          setHovered(false);
          delete document.body.dataset.cursor;
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (index === activeIndex) {
            onSelectProject(project, index);
          } else {
            onFocusIndex(index);
          }
        }}
      >
        <planeGeometry args={[4.2, 2.62, 24, 18]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={carouselCardVertexShader}
          fragmentShader={carouselCardFragmentShader}
          uniforms={uniforms}
        />
      </mesh>

      {/* Thin 1px neon frame backing */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[4.28, 2.7, 0.04]} />
        <meshStandardMaterial
          color="#0A0F0B"
          emissive={project.accentColor}
          emissiveIntensity={index === activeIndex ? 0.35 : 0.08}
          roughness={0.4}
          metalness={0.75}
        />
      </mesh>
    </group>
  );
}

interface ProjectsCarousel3DProps {
  activeIndex: number;
  onChangeIndex: (index: number) => void;
  onSelectProject: (project: ProjectItem, index: number) => void;
}

export function ProjectsCarousel3D({
  activeIndex,
  onChangeIndex,
  onSelectProject,
}: ProjectsCarousel3DProps) {
  const total = PORTFOLIO_CONTENT.projects.length;
  const angleStep = (Math.PI * 2) / total;
  const dragRotation = useRef(activeIndex * angleStep);
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragVelocity = useRef(0);

  useFrame((_, delta) => {
    const rawTarget = activeIndex * angleStep;
    const diff =
      ((rawTarget - dragRotation.current + Math.PI) % (Math.PI * 2) +
        Math.PI * 2) %
        (Math.PI * 2) -
      Math.PI;
    const target = dragRotation.current + diff;

    if (!dragging.current) {
      if (Math.abs(dragVelocity.current) > 0.002) {
        dragRotation.current += dragVelocity.current;
        dragVelocity.current *= 0.92;
      } else {
        dragRotation.current = THREE.MathUtils.damp(
          dragRotation.current,
          target,
          6,
          delta
        );
      }
    }
  });

  return (
    <group
      position={[CAROUSEL_CENTER.x, CAROUSEL_CENTER.y, CAROUSEL_CENTER.z]}
      onPointerDown={(e) => {
        dragging.current = true;
        dragStartX.current = e.clientX;
        document.body.dataset.cursor = "drag";
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        const dx = e.clientX - dragStartX.current;
        dragStartX.current = e.clientX;
        const deltaAngle = -dx * 0.0065;
        dragRotation.current += deltaAngle;
        dragVelocity.current = deltaAngle * 0.6;
      }}
      onPointerUp={() => {
        if (!dragging.current) return;
        dragging.current = false;
        delete document.body.dataset.cursor;
        const rawIdx = Math.round(dragRotation.current / angleStep);
        const wrapped = ((rawIdx % total) + total) % total;
        onChangeIndex(wrapped);
      }}
    >
      {/* Subtle ring floor halo under coverflow */}
      <mesh position={[0, -1.7, -4.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.45, 4.55, 72]} />
        <meshStandardMaterial
          color="#39FF14"
          emissive="#39FF14"
          emissiveIntensity={worldState.dimMode ? 0.35 : 0.8}
          transparent
          opacity={0.45}
        />
      </mesh>

      {PORTFOLIO_CONTENT.projects.map((project, idx) => (
        <CarouselCard
          key={project.id}
          project={project}
          index={idx}
          total={total}
          activeIndex={activeIndex}
          dragRotation={dragRotation}
          onSelectProject={onSelectProject}
          onFocusIndex={onChangeIndex}
        />
      ))}
    </group>
  );
}
