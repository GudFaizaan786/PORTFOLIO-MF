import { useEffect, useMemo, useRef, useState } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PORTFOLIO_CONTENT } from "../content";
import { worldState } from "../hooks/useWorldState";
import { PORTRAIT_CONFIG } from "./portraitConfig";

interface PortraitDot {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  part: number; // 0 = torso, 1 = head, 2 = eye
  brightness: number;
  seedX: number;
  seedY: number;
  seedZ: number;
}

const _targetPos = new THREE.Vector3();
const _identity = new THREE.Matrix4();

function samplePortraitDots(
  img: HTMLImageElement,
  sampleW: number,
  sampleH: number
): PortraitDot[] {
  const canvas = document.createElement("canvas");
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  ctx.drawImage(img, 0, 0, sampleW, sampleH);
  const data = ctx.getImageData(0, 0, sampleW, sampleH).data;

  const { width: worldW, height: worldH } = PORTRAIT_CONFIG.portraitWorldSize;
  const { headRegion, leftEye, rightEye, eyeRadius, brightnessThreshold } =
    PORTRAIT_CONFIG;

  const dots: PortraitDot[] = [];
  let leftEyeDots = 0;
  let rightEyeDots = 0;

  const pushDot = (
    nx: number,
    ny: number,
    bright: number,
    partOverride?: number
  ) => {
    const x = (nx - 0.5) * worldW;
    const y = (0.5 - ny) * worldH;

    // Determine region: head, eye, or torso
    const distLeftEye = Math.hypot(nx - leftEye.x, ny - leftEye.y);
    const distRightEye = Math.hypot(nx - rightEye.x, ny - rightEye.y);
    const inEye = distLeftEye <= eyeRadius || distRightEye <= eyeRadius;
    const inHead =
      nx >= headRegion.minX &&
      nx <= headRegion.maxX &&
      ny >= headRegion.minY &&
      ny <= headRegion.maxY;

    let part = 0; // torso
    if (partOverride !== undefined) {
      part = partOverride;
    } else if (inEye) {
      part = 2;
      if (distLeftEye <= eyeRadius) leftEyeDots++;
      if (distRightEye <= eyeRadius) rightEyeDots++;
    } else if (inHead) {
      part = 1;
    }

    // Fake 3D depth (z): brightness relief + head ellipsoid bias + shoulder curve
    let depthBias = 0;
    if (part >= 1) {
      const hCx = (headRegion.minX + headRegion.maxX) * 0.5;
      const hCy = 0.33;
      const hRx = (headRegion.maxX - headRegion.minX) * 0.52;
      const hRy = (headRegion.maxY - headRegion.minY) * 0.52;
      const dx = (nx - hCx) / hRx;
      const dy = (ny - hCy) / hRy;
      const r2 = dx * dx + dy * dy;
      depthBias = Math.sqrt(Math.max(0, 1.0 - r2)) * 0.56;
    } else {
      const sx = (nx - 0.5) / 0.36;
      const sy = Math.max(0, (ny - 0.6) / 0.4);
      depthBias = Math.max(0, 1.0 - sx * sx * 0.85 - sy * 0.32) * 0.28;
    }

    const z = bright * 0.34 + depthBias;

    // Deterministic outward scatter vector
    const hashA = Math.sin(nx * 127.1 + ny * 311.7) * 43758.5453;
    const hashB = Math.sin(nx * 269.5 + ny * 183.3) * 29431.1234;
    const angle = (hashA - Math.floor(hashA)) * Math.PI * 2;
    const elev = ((hashB - Math.floor(hashB)) - 0.5) * 1.4;

    dots.push({
      x,
      y,
      z,
      nx,
      ny,
      part,
      brightness: bright,
      seedX: Math.cos(angle),
      seedY: Math.sin(angle) * 0.7 + elev * 0.4,
      seedZ: 0.45 + Math.abs(elev) * 0.7,
    });
  };

  for (let iy = 0; iy < sampleH; iy++) {
    for (let ix = 0; ix < sampleW; ix++) {
      const nx = (ix + 0.5) / sampleW;
      const ny = (iy + 0.5) / sampleH;

      // Exclude bottom-right corner mark & very edges
      if (nx > 0.84 && ny > 0.74) continue;
      if (nx < 0.08 || nx > 0.92 || ny < 0.03) continue;

      const idx = (iy * sampleW + ix) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      if (a < 40) continue;

      const bright = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Filter faint background code & grid lines outside eye pockets
      const distL = Math.hypot(nx - leftEye.x, ny - leftEye.y);
      const distR = Math.hypot(nx - rightEye.x, ny - rightEye.y);
      const nearEye = distL <= eyeRadius || distR <= eyeRadius;

      if (nearEye && bright > 0.08) {
        pushDot(nx, ny, Math.max(0.65, bright * 1.35), 2);
      } else if (bright >= brightnessThreshold) {
        // Isolate main bust silhouette from scattered peripheral noise
        const bustMask =
          ny < 0.62
            ? nx >= 0.34 && nx <= 0.66
            : nx >= 0.16 && nx <= 0.84;
        if (bustMask) {
          pushDot(nx, ny, bright);
        }
      }
    }
  }

  // Ensure crisp glowing eye clusters even if source eye sockets are dark
  const ensureEyeCluster = (cx: number, cy: number, existing: number) => {
    if (existing >= 7) return;
    const offsets = [
      [0, 0, 1.0],
      [-0.007, 0, 0.9],
      [0.007, 0, 0.9],
      [0, -0.004, 0.82],
      [0, 0.004, 0.82],
      [-0.011, 0.001, 0.72],
      [0.011, 0.001, 0.72],
    ];
    for (const [ox, oy, br] of offsets) {
      pushDot(cx + ox, cy + oy, br, 2);
    }
  };

  ensureEyeCluster(leftEye.x, leftEye.y, leftEyeDots);
  ensureEyeCluster(rightEye.x, rightEye.y, rightEyeDots);

  return dots;
}

function generateFallbackBustDots(sampleW: number, sampleH: number): PortraitDot[] {
  const { width: worldW, height: worldH } = PORTRAIT_CONFIG.portraitWorldSize;
  const { leftEye, rightEye, eyeRadius } = PORTRAIT_CONFIG;
  const dots: PortraitDot[] = [];

  for (let iy = 0; iy < sampleH; iy++) {
    for (let ix = 0; ix < sampleW; ix++) {
      const nx = (ix + 0.5) / sampleW;
      const ny = (iy + 0.5) / sampleH;
      const inHead =
        Math.pow((nx - 0.5) / 0.105, 2) + Math.pow((ny - 0.31) / 0.24, 2) <= 1;
      const inNeck = Math.abs(nx - 0.5) < 0.055 && ny >= 0.5 && ny <= 0.65;
      const inTorso =
        ny > 0.62 &&
        Math.pow((nx - 0.5) / 0.28, 2) + Math.pow((ny - 0.98) / 0.36, 2) <= 1;
      if (!inHead && !inNeck && !inTorso) continue;

      const dL = Math.hypot(nx - leftEye.x, ny - leftEye.y);
      const dR = Math.hypot(nx - rightEye.x, ny - rightEye.y);
      const part = dL <= eyeRadius || dR <= eyeRadius ? 2 : ny <= 0.6 ? 1 : 0;
      const rim = inHead
        ? 0.45 + 0.5 * Math.pow(Math.abs(nx - 0.5) / 0.105, 1.4)
        : 0.6;

      dots.push({
        x: (nx - 0.5) * worldW,
        y: (0.5 - ny) * worldH,
        z: part >= 1 ? 0.35 + rim * 0.2 : 0.2,
        nx,
        ny,
        part,
        brightness: Math.min(1, rim),
        seedX: Math.cos(ix * 0.7),
        seedY: Math.sin(iy * 0.7),
        seedZ: 0.7,
      });
    }
  }
  return dots;
}

// GPU Instanced Dot-Matrix Portrait Shaders
const dotPortraitVertexShader = /* glsl */ `
  attribute vec3 aHomePos;
  attribute vec2 aNormUv;
  attribute float aPart;
  attribute float aBrightness;
  attribute vec3 aSeed;

  uniform float uTime;
  uniform float uDotScale;
  uniform float uGroupScale;
  uniform vec3 uNeckPivot;
  uniform vec3 uTorsoPivot;
  uniform vec3 uHeadRot;   // x=pitch, y=yaw, z=roll
  uniform vec3 uTorsoRot;  // ~ -15% of headRot
  uniform vec2 uEyeShift;  // cursor gaze offset
  uniform vec2 uEyeRot;    // faster eye lead rotation
  uniform float uBlink;    // 0..1 blink flatten
  uniform float uScatter;  // 0..1+ hover/click scatter
  uniform float uScanY;    // 0..1 normalized sweep Y
  uniform float uScanActive;
  uniform float uGlitchBand;
  uniform float uGlitchShift;

  varying vec2 vQuadUv;
  varying float vBrightness;
  varying float vPart;
  varying float vScanBoost;

  vec3 rotateXYZ(vec3 p, vec3 pivot, vec3 rot) {
    vec3 v = p - pivot;
    // Yaw (Y)
    float cy = cos(rot.y), sy = sin(rot.y);
    v = vec3(v.x * cy + v.z * sy, v.y, -v.x * sy + v.z * cy);
    // Pitch (X)
    float cx = cos(rot.x), sx = sin(rot.x);
    v = vec3(v.x, v.y * cx - v.z * sx, v.y * sx + v.z * cx);
    // Roll (Z)
    float cz = cos(rot.z), sz = sin(rot.z);
    v = vec3(v.x * cz - v.y * sz, v.x * sz + v.y * cz, v.z);
    return v + pivot;
  }

  void main() {
    vQuadUv = uv;
    vBrightness = aBrightness;
    vPart = aPart;

    vec3 p = aHomePos;

    if (aPart > 0.5) {
      // Eye dots: gaze shift + extra fast lead before head rotation
      if (aPart > 1.5) {
        p.xy += uEyeShift;
        p = rotateXYZ(p, vec3(uNeckPivot.x, uNeckPivot.y + 0.72, uNeckPivot.z), vec3(uEyeRot.x, uEyeRot.y, 0.0));
      }
      // Head & Eye dots pivot cleanly at neck base
      p = rotateXYZ(p, uNeckPivot, uHeadRot);
    } else {
      // Torso/shoulders counter-rotate subtly (~15%) for depth
      p = rotateXYZ(p, uTorsoPivot, uTorsoRot);
    }

    // Scanline sweep every 6-8s
    float scanDist = abs(aNormUv.y - uScanY);
    float scanPulse = exp(-scanDist * 36.0) * uScanActive;
    vScanBoost = scanPulse;
    p.z += scanPulse * 0.07;

    // Hover / click outward noise scatter
    float scatterWave = 0.55 + 0.45 * sin(uTime * 4.5 + aSeed.x * 6.28);
    p += aSeed * uScatter * scatterWave * 0.52;

    // 80ms horizontal micro-glitch row shift
    if (abs(uGlitchShift) > 0.0001) {
      float bandA = step(abs(aNormUv.y - uGlitchBand), 0.032);
      float bandB = step(abs(aNormUv.y - fract(uGlitchBand + 0.37)), 0.022);
      p.x += (bandA - bandB * 0.7) * uGlitchShift;
    }

    // View-space billboarding so every dot remains a crisp round circle from any angle
    vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
    float eyeBoost = aPart > 1.5 ? (1.2 + uBlink * 0.45) : 1.0;
    float size = uDotScale * uGroupScale * (0.55 + aBrightness * 0.72) * (1.0 + scanPulse * 0.38) * eyeBoost;

    vec2 quadOffset = position.xy * size;
    if (aPart > 1.5) {
      quadOffset.y *= mix(1.0, 0.14, uBlink);
    }

    mvPos.xy += quadOffset;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const dotPortraitFragmentShader = /* glsl */ `
  uniform float uDim;
  uniform float uBlink;

  varying vec2 vQuadUv;
  varying float vBrightness;
  varying float vPart;
  varying float vScanBoost;

  void main() {
    vec2 centered = vQuadUv - 0.5;
    float d = length(centered) * 2.0;
    if (d > 1.0) discard;

    // Soft glowing circular dot sprite
    float core = smoothstep(1.0, 0.18, d);
    float hotspot = smoothstep(0.55, 0.0, d) * 0.45;

    // Recolor palette: #00FF9C mid, #39FF14 bright, near-white-green brightest rim
    vec3 colMid = vec3(0.0, 1.0, 0.612);
    vec3 colNeon = vec3(0.224, 1.0, 0.078);
    vec3 colRim = vec3(0.86, 1.0, 0.90);

    vec3 baseCol = mix(colMid, colNeon, smoothstep(0.22, 0.72, vBrightness));
    baseCol = mix(baseCol, colRim, smoothstep(0.78, 0.98, vBrightness));

    // Eyes glow crisply and brighten momentarily on blink
    if (vPart > 1.5) {
      baseCol = mix(colNeon, colRim, 0.55 + uBlink * 0.4);
    }

    baseCol += vec3(0.25, 1.0, 0.4) * vScanBoost * 0.55;

    float intensity = (0.45 + vBrightness * 0.9 + vScanBoost * 0.5) * (uDim > 0.5 ? 0.55 : 1.15);
    float alpha = (core + hotspot) * smoothstep(0.1, 0.55, vBrightness + 0.15);

    gl_FragColor = vec4(baseCol * intensity, alpha);
  }
`;

// GPU Shader for scattered drifting ambient pixels around the portrait
const ambientDustVertexShader = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uGroupScale;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.45 + aPhase) * 0.18 + uMouse.x * 0.22;
    p.y += cos(uTime * 0.38 + aPhase * 1.3) * 0.16 + uMouse.y * 0.14;
    p.z += sin(uTime * 0.32 + aPhase * 0.7) * 0.14;

    vAlpha = 0.3 + 0.48 * abs(sin(uTime * 0.9 + aPhase));
    vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * uGroupScale * (540.0 / max(1.0, -mvPos.z));
    gl_Position = projectionMatrix * mvPos;
  }
`;

const ambientDustFragmentShader = /* glsl */ `
  uniform float uDim;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (max(abs(c.x), abs(c.y)) > 0.48) discard;
    vec3 col = uDim > 0.5 ? vec3(0.32, 0.75, 0.38) : vec3(0.224, 1.0, 0.32);
    gl_FragColor = vec4(col, vAlpha * (uDim > 0.5 ? 0.45 : 0.85));
  }
`;

function createCodeSnippetTexture(lines: string[]): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 512, 256);
    ctx.font = '15px "JetBrains Mono", monospace';
    ctx.fillStyle = "rgba(57, 255, 20, 0.45)";
    lines.forEach((line, i) => {
      ctx.fillText(line, 18, 34 + i * 24);
    });
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function DebugRegionOverlay() {
  const { width: w, height: h } = PORTRAIT_CONFIG.portraitWorldSize;
  const { headRegion, neckPivot, leftEye, rightEye, eyeRadius, torsoMinY } =
    PORTRAIT_CONFIG;

  const toLocal = (nx: number, ny: number) =>
    new THREE.Vector3((nx - 0.5) * w, (0.5 - ny) * h, 0.65);

  const objects = useMemo(() => {
    const makeLine = (pts: THREE.Vector3[], color: string) => {
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color });
      return new THREE.Line(geo, mat);
    };

    const headBox = makeLine(
      [
        toLocal(headRegion.minX, headRegion.minY),
        toLocal(headRegion.maxX, headRegion.minY),
        toLocal(headRegion.maxX, headRegion.maxY),
        toLocal(headRegion.minX, headRegion.maxY),
        toLocal(headRegion.minX, headRegion.minY),
      ],
      "#39FF14"
    );

    const makeCircle = (cx: number, cy: number, r: number, color: string) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        pts.push(toLocal(cx + Math.cos(a) * r, cy + Math.sin(a) * r * (16 / 9)));
      }
      return makeLine(pts, color);
    };

    const eyeL = makeCircle(leftEye.x, leftEye.y, eyeRadius, "#00FFFF");
    const eyeR = makeCircle(rightEye.x, rightEye.y, eyeRadius, "#00FFFF");

    const pivotCrossH = makeLine(
      [
        toLocal(neckPivot.x - 0.03, neckPivot.y),
        toLocal(neckPivot.x + 0.03, neckPivot.y),
      ],
      "#F4FF3A"
    );
    const pivotCrossV = makeLine(
      [
        toLocal(neckPivot.x, neckPivot.y - 0.04),
        toLocal(neckPivot.x, neckPivot.y + 0.04),
      ],
      "#F4FF3A"
    );

    const torsoLine = makeLine(
      [toLocal(0.18, torsoMinY), toLocal(0.82, torsoMinY)],
      "#FF3B8D"
    );

    return [headBox, eyeL, eyeR, pivotCrossH, pivotCrossV, torsoLine];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      objects.forEach((obj) => {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      });
    };
  }, [objects]);

  return (
    <group>
      {objects.map((obj, idx) => (
        <primitive key={idx} object={obj} />
      ))}
    </group>
  );
}

interface PixelPortraitHeadProps {
  isMobile: boolean;
  qualityTier: "high" | "medium" | "low";
}

export function PixelPortraitHead({
  isMobile,
  qualityTier,
}: PixelPortraitHeadProps) {
  const rootRef = useRef<THREE.Group>(null);
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const dotMatRef = useRef<THREE.ShaderMaterial>(null);
  const dustMatRef = useRef<THREE.ShaderMaterial>(null);
  const codeGroupRef = useRef<THREE.Group>(null);

  const [hovered, setHovered] = useState(false);
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);
  const scatterPulseRef = useRef(0);
  const hoverScatterRef = useRef(0);

  // Cursor / Eye / Blink / Glitch refs
  const headYawRef = useRef(0);
  const headPitchRef = useRef(0);
  const headRollRef = useRef(0);
  const eyeYawRef = useRef(0);
  const eyePitchRef = useRef(0);
  const eyeShiftRef = useRef(new THREE.Vector2(0, 0));
  const nextBlinkAtRef = useRef(3.2);
  const blinkAmtRef = useRef(0);
  const nextGlitchAtRef = useRef(4.5);
  const glitchEndAtRef = useRef(0);
  const glitchBandRef = useRef(0.35);
  const glitchShiftRef = useRef(0);

  const isDebug = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).has("debug");
  }, []);

  // Load portraitUrl (or fallback image) into an HTMLImageElement for offscreen sampling
  useEffect(() => {
    let active = true;
    const url =
      PORTFOLIO_CONTENT.identity.portraitUrl.trim() ||
      PORTRAIT_CONFIG.fallbackPortraitUrl;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.onload = () => {
      if (active) setLoadedImg(img);
    };
    img.onerror = () => {
      if (url !== PORTRAIT_CONFIG.fallbackPortraitUrl) {
        const fb = new Image();
        fb.onload = () => {
          if (active) setLoadedImg(fb);
        };
        fb.src = PORTRAIT_CONFIG.fallbackPortraitUrl;
      }
    };
    img.src = url;

    return () => {
      active = false;
    };
  }, []);

  // Adaptive resolution based on mobile + FPS qualityTier
  const sampleRes = useMemo(() => {
    if (qualityTier !== "high") return PORTRAIT_CONFIG.lowFpsSample;
    if (isMobile) return PORTRAIT_CONFIG.mobileSample;
    return PORTRAIT_CONFIG.desktopSample;
  }, [isMobile, qualityTier]);

  const dots = useMemo(() => {
    if (!loadedImg) {
      return generateFallbackBustDots(sampleRes.width, sampleRes.height);
    }
    try {
      const sampled = samplePortraitDots(
        loadedImg,
        sampleRes.width,
        sampleRes.height
      );
      return sampled.length > 50
        ? sampled
        : generateFallbackBustDots(sampleRes.width, sampleRes.height);
    } catch {
      return generateFallbackBustDots(sampleRes.width, sampleRes.height);
    }
  }, [loadedImg, sampleRes]);

  // Build InstancedBufferAttributes whenever sampled dots change
  const { homePosAttr, normUvAttr, partAttr, brightAttr, seedAttr, dotScale } =
    useMemo(() => {
      const count = dots.length;
      const homePos = new Float32Array(count * 3);
      const normUv = new Float32Array(count * 2);
      const part = new Float32Array(count);
      const bright = new Float32Array(count);
      const seed = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const d = dots[i];
        homePos[i * 3] = d.x;
        homePos[i * 3 + 1] = d.y;
        homePos[i * 3 + 2] = d.z;

        normUv[i * 2] = d.nx;
        normUv[i * 2 + 1] = d.ny;

        part[i] = d.part;
        bright[i] = d.brightness;

        seed[i * 3] = d.seedX;
        seed[i * 3 + 1] = d.seedY;
        seed[i * 3 + 2] = d.seedZ;
      }

      const cellW =
        PORTRAIT_CONFIG.portraitWorldSize.width / sampleRes.width;

      return {
        homePosAttr: new THREE.InstancedBufferAttribute(homePos, 3),
        normUvAttr: new THREE.InstancedBufferAttribute(normUv, 2),
        partAttr: new THREE.InstancedBufferAttribute(part, 1),
        brightAttr: new THREE.InstancedBufferAttribute(bright, 1),
        seedAttr: new THREE.InstancedBufferAttribute(seed, 3),
        dotScale: cellW * 1.48,
      };
    }, [dots, sampleRes.width]);

  // Sync identity instanceMatrix once per dot-set rebuild
  useEffect(() => {
    const mesh = instancedRef.current;
    if (!mesh) return;
    _identity.identity();
    for (let i = 0; i < dots.length; i++) {
      mesh.setMatrixAt(i, _identity);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [dots]);

  const { width: worldW, height: worldH } = PORTRAIT_CONFIG.portraitWorldSize;

  const dotUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDotScale: { value: dotScale },
      uGroupScale: { value: 1 },
      uNeckPivot: {
        value: new THREE.Vector3(
          (PORTRAIT_CONFIG.neckPivot.x - 0.5) * worldW,
          (0.5 - PORTRAIT_CONFIG.neckPivot.y) * worldH,
          0.1
        ),
      },
      uTorsoPivot: {
        value: new THREE.Vector3(0, -worldH * 0.42, 0.08),
      },
      uHeadRot: { value: new THREE.Vector3(0, 0, 0) },
      uTorsoRot: { value: new THREE.Vector3(0, 0, 0) },
      uEyeShift: { value: new THREE.Vector2(0, 0) },
      uEyeRot: { value: new THREE.Vector2(0, 0) },
      uBlink: { value: 0 },
      uScatter: { value: 0 },
      uScanY: { value: -0.2 },
      uScanActive: { value: 0 },
      uGlitchBand: { value: 0.35 },
      uGlitchShift: { value: 0 },
      uDim: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [worldW, worldH]
  );

  useEffect(() => {
    if (dotMatRef.current) {
      dotMatRef.current.uniforms.uDotScale.value = dotScale;
    }
  }, [dotScale]);

  // Separate GPU-driven scattered floating pixels around the bust
  const dustGeo = useMemo(() => {
    const count = isMobile ? 90 : 180;
    const pos = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    const size = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r1 = Math.abs(Math.sin(i * 19.31) * 43758.5) % 1;
      const r2 = Math.abs(Math.sin(i * 73.19) * 21934.2) % 1;
      const r3 = Math.abs(Math.sin(i * 41.73) * 18372.9) % 1;
      pos[i * 3] = (r1 - 0.5) * worldW * 1.1;
      pos[i * 3 + 1] = (r2 - 0.48) * worldH * 1.15;
      pos[i * 3 + 2] = -0.2 + r3 * 0.85;
      phase[i] = i * 0.71;
      size[i] = 0.028 + (i % 4) * 0.014;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    return geo;
  }, [isMobile, worldW, worldH]);

  const dustUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uGroupScale: { value: 1 },
      uDim: { value: 0 },
    }),
    []
  );

  useEffect(() => {
    return () => dustGeo.dispose();
  }, [dustGeo]);

  // Procedural dim-green drifting monospace code-text textures behind figure
  const codeSprites = useMemo(() => {
    const t1 = createCodeSnippetTexture([
      "// core // ecosystem.init()",
      "if (seed.active && soil > 0.4) {",
      "  matrix.align(headPivot);",
      "  photon.emit(#39FF14);",
      "}",
    ]);
    const t2 = createCodeSnippetTexture([
      "struct OriginsNode {",
      "  float sabr;",
      "  float shukr;",
      "  vec3 gazeTarget;",
      "};",
    ]);
    const t3 = createCodeSnippetTexture([
      "def grow_sapling(light):",
      "  return [x * 0.15 for x in light]",
      "assert humanity_above_all()",
    ]);
    return [
      { tex: t1, pos: [-2.15, 0.55, -0.55] as [number, number, number] },
      { tex: t2, pos: [2.1, 0.35, -0.6] as [number, number, number] },
      { tex: t3, pos: [-2.05, -0.65, -0.52] as [number, number, number] },
    ];
  }, []);

  useEffect(() => {
    return () => codeSprites.forEach((c) => c.tex.dispose());
  }, [codeSprites]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const p = worldState.progress;
    const reduced = worldState.reducedMotion;

    // 1. Scroll-linked world position, scale, and slight turn toward content
    let targetScale = isMobile ? 0.88 : 1.05;
    let scrollLookYaw = 0;

    if (p < 0.16) {
      // Hero center stage
      _targetPos.set(0, 0.82, 2.35);
      targetScale = isMobile ? 0.88 : 1.05;
      scrollLookYaw = 0;
    } else if (p < 0.34) {
      // About: shrinks & glides left beside bio, looks gently right toward bio
      _targetPos.set(-1.5, 1.32, -18.2);
      targetScale = 0.54;
      scrollLookYaw = 0.16;
    } else if (p < 0.82) {
      // Middle sections: discreetly tucked above corridor
      _targetPos.set(0, 6.8, -46);
      targetScale = 0.001;
    } else {
      // Contact: shrinks & moves to right calm corner, turns gently toward form
      _targetPos.set(2.35, 1.15, -133.5);
      targetScale = 0.58;
      scrollLookYaw = -0.18;
    }

    let currentScale = targetScale;
    if (rootRef.current) {
      rootRef.current.position.x = THREE.MathUtils.damp(
        rootRef.current.position.x,
        _targetPos.x,
        4.2,
        delta
      );
      rootRef.current.position.y = THREE.MathUtils.damp(
        rootRef.current.position.y,
        _targetPos.y + (reduced ? 0 : Math.sin(t * 1.1) * 0.04),
        4.2,
        delta
      );
      rootRef.current.position.z = THREE.MathUtils.damp(
        rootRef.current.position.z,
        _targetPos.z,
        4.2,
        delta
      );
      currentScale = THREE.MathUtils.damp(
        rootRef.current.scale.x,
        targetScale,
        5.5,
        delta
      );
      rootRef.current.scale.setScalar(currentScale);
    }

    // 2. Idle check (> 2 seconds without pointer/touch movement)
    const nowMs = performance.now();
    const isIdle =
      worldState.lastPointerTime === 0 ||
      nowMs - worldState.lastPointerTime > 2000;

    const idleYaw = reduced ? 0 : Math.sin(t * 0.65) * 0.24;
    const idlePitch = reduced ? 0 : Math.cos(t * 0.45) * 0.12;
    const idleEyeDriftX = reduced ? 0 : Math.sin(t * 1.15) * 0.35;
    const idleEyeDriftY = reduced ? 0 : Math.cos(t * 0.85) * 0.22;

    const cursorX = isIdle ? idleYaw : worldState.mouseX;
    const cursorY = isIdle ? idlePitch : worldState.mouseY;

    const { maxYawRad, maxPitchRad, maxRollRad, eyeLeadOffsetNorm, torsoCounterFactor } =
      PORTRAIT_CONFIG.limits;

    // 3. Head damped rotation (±30° yaw, ±18° pitch, ±4° roll)
    const targetHeadYaw = THREE.MathUtils.clamp(
      cursorX * maxYawRad + scrollLookYaw,
      -maxYawRad,
      maxYawRad
    );
    const targetHeadPitch = THREE.MathUtils.clamp(
      -cursorY * maxPitchRad,
      -maxPitchRad,
      maxPitchRad
    );
    const targetHeadRoll = THREE.MathUtils.clamp(
      -cursorX * maxRollRad,
      -maxRollRad,
      maxRollRad
    );

    headYawRef.current = THREE.MathUtils.damp(
      headYawRef.current,
      targetHeadYaw,
      4.8,
      delta
    );
    headPitchRef.current = THREE.MathUtils.damp(
      headPitchRef.current,
      targetHeadPitch,
      4.8,
      delta
    );
    headRollRef.current = THREE.MathUtils.damp(
      headRollRef.current,
      targetHeadRoll,
      4.2,
      delta
    );

    // 4. Eyes lead the head (~2x faster response + up to 0.012 norm unit gaze shift)
    const eyeCursorX = isIdle ? idleEyeDriftX : worldState.mouseX;
    const eyeCursorY = isIdle ? idleEyeDriftY : worldState.mouseY;

    eyeYawRef.current = THREE.MathUtils.damp(
      eyeYawRef.current,
      THREE.MathUtils.clamp(eyeCursorX * 0.18, -0.18, 0.18),
      10.5,
      delta
    );
    eyePitchRef.current = THREE.MathUtils.damp(
      eyePitchRef.current,
      THREE.MathUtils.clamp(-eyeCursorY * 0.12, -0.12, 0.12),
      10.5,
      delta
    );

    const targetShiftX = eyeCursorX * eyeLeadOffsetNorm * worldW;
    const targetShiftY = eyeCursorY * eyeLeadOffsetNorm * worldH;
    eyeShiftRef.current.x = THREE.MathUtils.damp(
      eyeShiftRef.current.x,
      targetShiftX,
      11,
      delta
    );
    eyeShiftRef.current.y = THREE.MathUtils.damp(
      eyeShiftRef.current.y,
      targetShiftY,
      11,
      delta
    );

    // 5. Natural blink every 3..6 seconds
    if (!reduced) {
      if (t >= nextBlinkAtRef.current) {
        const blinkElapsed = t - nextBlinkAtRef.current;
        if (blinkElapsed < 0.15) {
          blinkAmtRef.current = Math.sin((blinkElapsed / 0.15) * Math.PI);
        } else {
          blinkAmtRef.current = 0;
          nextBlinkAtRef.current = t + 3.0 + ((Math.sin(t * 17.3) * 0.5 + 0.5) * 3.0);
        }
      } else {
        blinkAmtRef.current = 0;
      }
    }

    // 6. Scanline sweep every 7 seconds
    let scanY = -0.2;
    let scanActive = 0;
    if (!reduced) {
      const scanPhase = t % 7.0;
      if (scanPhase < 1.35) {
        scanY = scanPhase / 1.35;
        scanActive = Math.sin((scanPhase / 1.35) * Math.PI);
      }
    }

    // 7. Hover / click scatter spring back
    hoverScatterRef.current = THREE.MathUtils.damp(
      hoverScatterRef.current,
      hovered && !reduced ? 0.55 : 0,
      6.0,
      delta
    );
    scatterPulseRef.current = THREE.MathUtils.damp(
      scatterPulseRef.current,
      0,
      5.2,
      delta
    );

    // 8. Occasional 80ms horizontal micro-glitch (plus manual G toggle)
    let glitchShift = 0;
    if (!reduced) {
      if (worldState.glitchMode) {
        glitchBandRef.current = (t * 2.1) % 1;
        glitchShift = Math.sin(t * 48) * 0.085;
      } else if (t >= nextGlitchAtRef.current) {
        glitchBandRef.current = (Math.sin(t * 13.7) * 0.5 + 0.5) * 0.8 + 0.1;
        glitchEndAtRef.current = t + 0.08; // 80ms burst
        nextGlitchAtRef.current = t + 3.5 + ((Math.cos(t * 7.1) * 0.5 + 0.5) * 4.0);
      }
      if (t < glitchEndAtRef.current) {
        glitchShift = Math.sin(t * 90) > 0 ? 0.095 : -0.095;
      }
    }
    glitchShiftRef.current = glitchShift;

    // Upload GPU shader uniforms (zero per-dot JS loops!)
    if (dotMatRef.current) {
      const u = dotMatRef.current.uniforms;
      u.uTime.value = t;
      u.uGroupScale.value = currentScale;
      u.uHeadRot.value.set(
        headPitchRef.current,
        headYawRef.current,
        headRollRef.current
      );
      u.uTorsoRot.value.set(
        headPitchRef.current * torsoCounterFactor,
        headYawRef.current * torsoCounterFactor,
        headRollRef.current * torsoCounterFactor
      );
      u.uEyeShift.value.copy(eyeShiftRef.current);
      u.uEyeRot.value.set(eyePitchRef.current, eyeYawRef.current);
      u.uBlink.value = blinkAmtRef.current;
      u.uScatter.value = reduced
        ? 0
        : hoverScatterRef.current + scatterPulseRef.current;
      u.uScanY.value = scanY;
      u.uScanActive.value = scanActive;
      u.uGlitchBand.value = glitchBandRef.current;
      u.uGlitchShift.value = glitchShiftRef.current;
      u.uDim.value = worldState.dimMode ? 1.0 : 0.0;
    }

    if (dustMatRef.current) {
      const du = dustMatRef.current.uniforms;
      du.uTime.value = reduced ? 0 : t;
      du.uMouse.value.set(cursorX, cursorY);
      du.uGroupScale.value = currentScale;
      du.uDim.value = worldState.dimMode ? 1.0 : 0.0;
    }

    if (codeGroupRef.current && !reduced) {
      codeGroupRef.current.position.y = Math.sin(t * 0.45) * 0.08;
    }
  });

  return (
    <group ref={rootRef} position={[0, 0.82, 2.35]}>
      {/* Invisible interaction hitbox for hover/click scatter */}
      <mesh
        visible={false}
        position={[0, 0.05, 0.25]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHovered(true);
          document.body.dataset.cursor = "play";
        }}
        onPointerOut={() => {
          setHovered(false);
          delete document.body.dataset.cursor;
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (!worldState.reducedMotion) {
            scatterPulseRef.current = 1.25;
          }
        }}
      >
        <planeGeometry args={[worldW * 0.72, worldH * 0.96]} />
        <meshBasicMaterial />
      </mesh>

      {/* Single GPU-Instanced Dot-Matrix Portrait Mesh (Head + Eyes + Torso) */}
      <instancedMesh
        ref={instancedRef}
        key={`${dots.length}-${sampleRes.width}-${Boolean(loadedImg)}`}
        args={[undefined, undefined, dots.length]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]}>
          <primitive attach="attributes-aHomePos" object={homePosAttr} />
          <primitive attach="attributes-aNormUv" object={normUvAttr} />
          <primitive attach="attributes-aPart" object={partAttr} />
          <primitive attach="attributes-aBrightness" object={brightAttr} />
          <primitive attach="attributes-aSeed" object={seedAttr} />
        </planeGeometry>
        <shaderMaterial
          ref={dotMatRef}
          vertexShader={dotPortraitVertexShader}
          fragmentShader={dotPortraitFragmentShader}
          uniforms={dotUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Separate GPU-animated floating scattered pixels reacting to cursor */}
      <points geometry={dustGeo} frustumCulled={false}>
        <shaderMaterial
          ref={dustMatRef}
          vertexShader={ambientDustVertexShader}
          fragmentShader={ambientDustFragmentShader}
          uniforms={dustUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Faint drifting dim-green monospace code sprites behind figure */}
      <group ref={codeGroupRef}>
        {codeSprites.map((sp, idx) => (
          <mesh key={idx} position={sp.pos}>
            <planeGeometry args={[1.65, 0.82]} />
            <meshBasicMaterial
              map={sp.tex}
              transparent
              opacity={worldState.dimMode ? 0.12 : 0.24}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>

      {/* Subtle grid/reflection ring beneath the shoulders */}
      <mesh position={[0, -worldH * 0.51, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.85, 48]} />
        <meshBasicMaterial
          color="#39FF14"
          transparent
          opacity={worldState.dimMode ? 0.08 : 0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Optional `?debug` region & pivot visual overlay */}
      {isDebug && <DebugRegionOverlay />}
    </group>
  );
}
