import * as THREE from "three";
import { ProjectItem } from "../content";

let cachedSoftwareGl: boolean | null = null;

export function detectSoftwareWebGL(): boolean {
  if (cachedSoftwareGl !== null) return cachedSoftwareGl;
  if (typeof document === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) {
      cachedSoftwareGl = true;
      return true;
    }
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || "");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    cachedSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return cachedSoftwareGl;
  } catch {
    cachedSoftwareGl = true;
    return true;
  }
}

export function createNeonProjectTexture(
  project: ProjectItem,
  index: number
): THREE.CanvasTexture {
  const width = 1024;
  const height = 640;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#060a07";
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(
      width * 0.72,
      height * 0.36,
      20,
      width * 0.72,
      height * 0.36,
      width * 0.6
    );
    glow.addColorStop(0, `${project.accentColor}40`);
    glow.addColorStop(0.55, `${project.accentColor}12`);
    glow.addColorStop(1, "rgba(5, 8, 6, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Subtle technical grid
    ctx.strokeStyle = "rgba(57, 255, 20, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 64; x < width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 64; y < height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Concentric accent reticle
    ctx.save();
    ctx.translate(width * 0.74, height * 0.48);
    ctx.strokeStyle = `${project.accentColor}88`;
    ctx.lineWidth = 1.5;
    for (let r = 52; r <= 184; r += 44) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = project.accentColor;
    ctx.font = "500 20px 'JetBrains Mono', monospace";
    ctx.fillText(`0${index + 1} · ${project.year} · ${project.category}`, 56, 86);

    ctx.fillStyle = "#D8F5DC";
    ctx.font = "700 44px 'Syne', sans-serif";
    const words = project.title.split(" ");
    let line = "";
    let lineY = 395;
    for (let i = 0; i < words.length; i++) {
      const testLine = line ? `${line} ${words[i]}` : words[i];
      if (ctx.measureText(testLine).width > 560 && line) {
        ctx.fillText(line, 56, lineY);
        line = words[i];
        lineY += 54;
      } else {
        line = testLine;
      }
    }
    if (line) ctx.fillText(line, 56, lineY);

    ctx.fillStyle = "#7A8F7F";
    ctx.font = "400 20px 'Inter', sans-serif";
    ctx.fillText(project.role, 56, lineY + 42);

    ctx.strokeStyle = `${project.accentColor}66`;
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, width - 40, height - 40);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function loadProjectTextureWithFallback(
  project: ProjectItem,
  index: number,
  onUpgrade: (tex: THREE.Texture) => void
): THREE.CanvasTexture {
  const fallback = createNeonProjectTexture(project, index);

  if (project.coverImageUrl) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.onload = () => {
      try {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        onUpgrade(tex);
      } catch {
        // Keep procedural neon gradient fallback
      }
    };
    img.onerror = () => {
      // Keep procedural neon gradient fallback
    };
    img.src = project.coverImageUrl;
  }

  return fallback;
}
