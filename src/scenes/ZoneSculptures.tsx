import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { worldState } from "../hooks/useWorldState";

function OrbitingSkillNode({
  label,
  orbitAngle,
  color,
  variant,
}: {
  label: string;
  orbitAngle: number;
  color: string;
  variant: "c" | "python" | "react";
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const motion = worldState.reducedMotion ? 0.12 : 1.0;
    const a = orbitAngle + t * 0.25 * motion;
    const r = 2.3;
    groupRef.current.position.set(
      Math.cos(a) * r,
      Math.sin(t * 1.1 + orbitAngle) * 0.32 * motion,
      Math.sin(a) * r * 0.72
    );
    groupRef.current.rotation.y += delta * (hovered ? 1.4 : 0.45) * motion;
    const s = THREE.MathUtils.damp(groupRef.current.scale.x, hovered ? 1.25 : 1, 7, delta);
    groupRef.current.scale.setScalar(s);
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.dataset.cursor = "view";
      }}
      onPointerOut={() => {
        setHovered(false);
        delete document.body.dataset.cursor;
      }}
    >
      {variant === "c" && (
        // C open-ring emblem
        <mesh rotation={[0, 0, Math.PI * 0.25]}>
          <torusGeometry args={[0.42, 0.08, 16, 48, Math.PI * 1.5]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hovered ? 1.3 : 0.55}
            roughness={0.25}
          />
        </mesh>
      )}
      {variant === "python" && (
        // Python dual interlocked torus knot
        <mesh>
          <torusKnotGeometry args={[0.28, 0.065, 64, 10, 2, 3]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hovered ? 1.3 : 0.55}
            roughness={0.25}
          />
        </mesh>
      )}
      {variant === "react" && (
        // React atomic orbital rings + core
        <group>
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} />
          </mesh>
          {[0, Math.PI / 3, -Math.PI / 3].map((rot, idx) => (
            <mesh key={idx} rotation={[0.6, rot, rot]}>
              <torusGeometry args={[0.46, 0.025, 12, 48]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
            </mesh>
          ))}
        </group>
      )}

      {hovered && (
        <Html center distanceFactor={9} position={[0, 0.78, 0]}>
          <div className="pointer-events-none whitespace-nowrap border border-[var(--border-neon)] bg-[#050806]/95 px-2.5 py-1 font-mono-ui text-[11px] text-[#39FF14]">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

export function ZoneSculptures() {
  return (
    <>
      {/* About Zone: Orbiting C, Python, React glowing 3D skill objects */}
      <group position={[2.2, 0.85, -21]}>
        <OrbitingSkillNode label="C Systems" orbitAngle={0} color="#39FF14" variant="c" />
        <OrbitingSkillNode
          label="Python"
          orbitAngle={(Math.PI * 2) / 3}
          color="#F4FF3A"
          variant="python"
        />
        <OrbitingSkillNode
          label="React & WebGL"
          orbitAngle={(Math.PI * 4) / 3}
          color="#00FF9C"
          variant="react"
        />
      </group>

      {/* Skills & Journey Corridor Markers */}
      <group position={[0, 0.4, -76]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[4.5, 0.02, 16, 96]} />
          <meshStandardMaterial color="#39FF14" emissive="#39FF14" emissiveIntensity={0.45} />
        </mesh>
      </group>

      <group position={[0, 0.5, -104]}>
        <mesh rotation={[Math.PI / 2.4, 0.2, 0]}>
          <torusGeometry args={[3.8, 0.022, 16, 96]} />
          <meshStandardMaterial color="#00FF9C" emissive="#00FF9C" emissiveIntensity={0.45} />
        </mesh>
      </group>

      {/* Contact Calm Sanctuary Halo */}
      <group position={[0, 0.3, -135]}>
        <mesh rotation={[Math.PI / 2.2, 0, 0]}>
          <torusGeometry args={[4.6, 0.025, 16, 110]} />
          <meshStandardMaterial color="#39FF14" emissive="#39FF14" emissiveIntensity={0.55} />
        </mesh>
        <mesh rotation={[0, 0.4, 0]}>
          <torusGeometry args={[3.1, 0.018, 16, 96]} />
          <meshStandardMaterial color="#00FF9C" emissive="#00FF9C" emissiveIntensity={0.35} />
        </mesh>
      </group>
    </>
  );
}
