import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { worldState } from "../hooks/useWorldState";
import {
  auroraBgFragmentShader,
  auroraBgVertexShader,
  gridFloorFragmentShader,
  gridFloorVertexShader,
} from "../shaders/neonShaders";

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export function LiveBackground({ isMobile }: { isMobile: boolean }) {
  const { camera } = useThree();
  const bgGroupRef = useRef<THREE.Group>(null);
  const auroraMatRef = useRef<THREE.ShaderMaterial>(null);
  const floorMatRef = useRef<THREE.ShaderMaterial>(null);
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const leavesRef = useRef<THREE.InstancedMesh>(null);

  const particleCount = useMemo(() => {
    if (worldState.qualityTier === "low") return 260;
    return isMobile ? 420 : 1200;
  }, [isMobile]);

  const leafCount = isMobile ? 36 : 90;

  const particles = useMemo(() => {
    const arr: Array<{
      x: number;
      y: number;
      z: number;
      speed: number;
      phase: number;
      scale: number;
    }> = [];
    for (let i = 0; i < particleCount; i++) {
      const r1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
      const r2 = Math.abs(Math.sin(i * 78.233) * 24634.6345) % 1;
      const r3 = Math.abs(Math.sin(i * 39.425) * 19283.421) % 1;
      arr.push({
        x: (r1 - 0.5) * 34,
        y: (r2 - 0.35) * 16,
        z: 14 - r3 * 160,
        speed: 0.25 + (i % 7) * 0.1,
        phase: i * 0.41,
        scale: 0.025 + (i % 5) * 0.012,
      });
    }
    return arr;
  }, [particleCount]);

  // Pixel leaf rain data for "plant" easter egg
  const leafParticles = useMemo(() => {
    const arr: Array<{ x: number; y: number; z: number; speed: number; rot: number }> = [];
    for (let i = 0; i < leafCount; i++) {
      const r1 = Math.abs(Math.sin(i * 45.164) * 19432.123) % 1;
      const r2 = Math.abs(Math.sin(i * 91.732) * 31942.451) % 1;
      arr.push({
        x: (r1 - 0.5) * 18,
        y: 6 + r2 * 8,
        z: -4 - (i % 10) * 0.7,
        speed: 1.8 + (i % 5) * 0.45,
        rot: i * 0.6,
      });
    }
    return arr;
  }, [leafCount]);

  useEffect(() => {
    const mesh = particlesRef.current;
    if (!mesh) return;
    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];
      _dummy.position.set(p.x, p.y, p.z);
      _dummy.scale.setScalar(p.scale);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);

      if (i % 4 === 0) _color.set("#39FF14");
      else if (i % 3 === 0) _color.set("#00FF9C");
      else _color.set("#67B87B");
      mesh.setColorAt(i, _color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [particleCount, particles]);

  const auroraUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uVelocity: { value: 0 },
      uSection: { value: 0 },
      uGlitch: { value: 0 },
      uDim: { value: 0 },
    }),
    []
  );

  const floorUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDim: { value: 0 },
    }),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const motion = worldState.reducedMotion ? 0.1 : 1.0;

    // Keep background sky quad anchored behind camera at all times
    if (bgGroupRef.current) {
      bgGroupRef.current.position.copy(camera.position);
      bgGroupRef.current.quaternion.copy(camera.quaternion);
    }

    if (auroraMatRef.current) {
      const u = auroraMatRef.current.uniforms;
      u.uTime.value = t;
      u.uMouse.value.set(worldState.mouseX, worldState.mouseY);
      u.uScroll.value = worldState.progress;
      u.uVelocity.value = worldState.velocity;
      u.uSection.value = THREE.MathUtils.lerp(
        u.uSection.value,
        worldState.activeSectionIndex,
        Math.min(1, delta * 3)
      );
      u.uGlitch.value = worldState.glitchMode ? 1 : 0;
      u.uDim.value = THREE.MathUtils.lerp(
        u.uDim.value,
        worldState.dimMode ? 1 : 0,
        Math.min(1, delta * 4)
      );
    }

    if (floorMatRef.current) {
      floorMatRef.current.uniforms.uTime.value = t;
      floorMatRef.current.uniforms.uDim.value = worldState.dimMode ? 1 : 0;
    }

    // Update instanced firefly/spore pixels
    const mesh = particlesRef.current;
    if (mesh) {
      const velBoost = 1 + Math.min(3.5, Math.abs(worldState.velocity) * 2.2);
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        const dy = Math.sin(t * p.speed * velBoost + p.phase) * 0.45 * motion;
        const dx =
          Math.cos(t * p.speed * 0.6 + p.phase) * 0.35 * motion +
          worldState.mouseX * 0.38;
        _dummy.position.set(p.x + dx, p.y + dy, p.z);
        _dummy.rotation.set(t * 0.4 * p.speed, t * 0.3 * p.speed, 0);
        _dummy.scale.setScalar(
          p.scale * (1 + Math.abs(worldState.velocity) * 0.35)
        );
        _dummy.updateMatrix();
        mesh.setMatrixAt(i, _dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Update "plant" easter-egg pixel leaf rain
    const leafMesh = leavesRef.current;
    if (leafMesh) {
      const active = performance.now() < worldState.plantShowerUntil;
      leafMesh.visible = active;
      if (active) {
        for (let i = 0; i < leafCount; i++) {
          const lp = leafParticles[i];
          const fallY = ((lp.y - ((t * lp.speed) % 12)) + 12) % 12 - 5;
          _dummy.position.set(
            camera.position.x + lp.x + Math.sin(t * 2 + i) * 0.4,
            camera.position.y + fallY,
            camera.position.z + lp.z
          );
          _dummy.rotation.set(t * 1.4 + lp.rot, t * 0.9, lp.rot);
          _dummy.scale.set(0.14, 0.24, 0.04);
          _dummy.updateMatrix();
          leafMesh.setMatrixAt(i, _dummy.matrix);
        }
        leafMesh.instanceMatrix.needsUpdate = true;
      }
    }
  });

  return (
    <>
      {/* Camera-locked full-screen GPU aurora + data-rain backdrop */}
      <group ref={bgGroupRef}>
        <mesh position={[0, 0, -48]} renderOrder={-10}>
          <planeGeometry args={[120, 75]} />
          <shaderMaterial
            ref={auroraMatRef}
            vertexShader={auroraBgVertexShader}
            fragmentShader={auroraBgFragmentShader}
            uniforms={auroraUniforms}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Instanced pixel fireflies / spores */}
      <instancedMesh
        ref={particlesRef}
        args={[undefined, undefined, particleCount]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          emissive="#39FF14"
          emissiveIntensity={worldState.dimMode ? 0.35 : 0.9}
          roughness={0.3}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Easter egg pixel leaves */}
      <instancedMesh
        ref={leavesRef}
        args={[undefined, undefined, leafCount]}
        frustumCulled={false}
        visible={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#39FF14"
          emissive="#00FF9C"
          emissiveIntensity={1.1}
          roughness={0.3}
        />
      </instancedMesh>

      {/* Receding perspective neon grid floor */}
      <mesh position={[0, -3.5, -55]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[160, 220]} />
        <shaderMaterial
          ref={floorMatRef}
          vertexShader={gridFloorVertexShader}
          fragmentShader={gridFloorFragmentShader}
          uniforms={floorUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
