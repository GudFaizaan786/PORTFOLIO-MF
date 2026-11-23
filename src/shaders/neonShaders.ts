export const auroraBgVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const auroraBgFragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uScroll;
  uniform float uVelocity;
  uniform float uSection;
  uniform float uGlitch;
  uniform float uDim;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = rot * p * 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.14;

    // Optional glitch horizontal slice
    if (uGlitch > 0.5) {
      float slice = step(0.86, hash(vec2(floor(uv.y * 42.0), floor(uTime * 14.0))));
      uv.x += slice * (hash(vec2(uTime, uv.y)) - 0.5) * 0.06;
    }

    vec2 mouseOffset = uMouse * 0.08;
    float n1 = fbm(uv * 2.8 + vec2(t, -t * 0.6) + mouseOffset);
    float n2 = fbm(uv * 3.4 + vec2(-t * 0.4, t * 0.7) + n1 + uScroll * 1.4);

    // Falling pixel data-rain columns (subtle, low brightness)
    float cols = 72.0;
    float colId = floor(uv.x * cols);
    float colSpeed = 0.35 + hash(vec2(colId, 1.0)) * 0.85;
    float colPhase = hash(vec2(colId, 7.0)) * 20.0;
    float rainCoord = uv.y * 36.0 + uTime * colSpeed * (1.2 + abs(uVelocity) * 0.8) + colPhase;
    float cell = fract(rainCoord);
    float trail = fract(rainCoord * 0.12);
    float cellOn = step(0.76, hash(vec2(colId, floor(rainCoord))));
    float rainMask = cellOn * smoothstep(0.1, 0.85, 1.0 - trail) * step(0.15, fract(uv.x * cols)) * step(fract(uv.x * cols), 0.85);
    rainMask *= smoothstep(0.0, 0.25, cell) * (1.0 - smoothstep(0.75, 1.0, cell));

    // Shift hue subtly by section (Hero neon green -> About deeper forest -> Projects cyan-green -> Contact calm emerald)
    vec3 baseBlack = vec3(0.019, 0.031, 0.023); // #050806
    vec3 neonGreen = vec3(0.223, 1.0, 0.078);   // #39FF14
    vec3 cyanGreen = vec3(0.0, 1.0, 0.612);     // #00FF9C
    vec3 deepForest = vec3(0.04, 0.28, 0.14);

    float cyanMix = clamp(sin(uSection * 1.15) * 0.5 + 0.5, 0.0, 1.0);
    vec3 auroraTint = mix(neonGreen, cyanGreen, cyanMix * 0.65);
    auroraTint = mix(auroraTint, deepForest, 0.35);

    float auroraBand = smoothstep(0.45, 0.92, n1 * 0.55 + n2 * 0.45);
    float dimFactor = mix(1.0, 0.42, uDim);

    vec3 col = baseBlack;
    col += auroraTint * auroraBand * 0.11 * dimFactor;
    col += mix(neonGreen, cyanGreen, 0.4) * rainMask * 0.085 * dimFactor;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const gridFloorVertexShader = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const gridFloorFragmentShader = /* glsl */ `
  varying vec3 vWorldPos;
  uniform float uTime;
  uniform float uDim;

  void main() {
    vec2 coord = vWorldPos.xz * 0.45;
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    float line = min(grid.x, grid.y);
    float gridAlpha = 1.0 - min(line, 1.0);

    float dist = length(vWorldPos.xz - vec2(0.0, -52.0));
    float fade = 1.0 - smoothstep(14.0, 76.0, dist);

    float pulse = 0.75 + 0.25 * sin(vWorldPos.z * 0.18 + uTime * 1.2);
    vec3 col = vec3(0.18, 0.95, 0.25);
    float alpha = gridAlpha * fade * pulse * mix(0.18, 0.08, uDim);

    gl_FragColor = vec4(col, alpha);
  }
`;

export const carouselCardVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying float vRipple;
  uniform float uTime;
  uniform float uHover;
  uniform vec2 uMouseUv;
  uniform float uVelocity;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float dist = distance(uv, uMouseUv);
    float ripple = sin(dist * 18.0 - uTime * 5.0) * exp(-dist * 3.8);
    float hoverZ = ripple * uHover * 0.18;
    float velCurve = sin(uv.x * 3.14159) * uVelocity * 0.08;

    pos.z += hoverZ + velCurve;
    vRipple = hoverZ;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const carouselCardFragmentShader = /* glsl */ `
  varying vec2 vUv;
  varying float vRipple;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uHover;
  uniform float uActive;
  uniform vec2 uMouseUv;
  uniform float uVelocity;
  uniform vec3 uAccent;
  uniform float uDim;

  void main() {
    vec2 uv = vUv;
    vec2 dir = uv - uMouseUv;
    float dist = length(dir);
    float wave = sin(dist * 20.0 - uTime * 5.5) * exp(-dist * 4.2);
    uv += normalize(dir + 0.0001) * wave * uHover * 0.016;

    // Subtle velocity RGB split
    float shift = (0.001 + abs(uVelocity) * 0.003 + uHover * 0.0025) * mix(1.0, 0.25, uDim);
    float r = texture2D(uTexture, clamp(uv + vec2(shift, 0.0), 0.002, 0.998)).r;
    float g = texture2D(uTexture, clamp(uv, 0.002, 0.998)).g;
    float b = texture2D(uTexture, clamp(uv - vec2(shift, 0.0), 0.002, 0.998)).b;

    vec3 color = vec3(r, g, b);

    // Subtle scanline
    float scan = 0.96 + 0.04 * sin(vUv.y * 220.0 + uTime * 2.0);
    color *= scan;

    // Luminous 1px accent edge when active or hovered
    float borderX = min(vUv.x, 1.0 - vUv.x);
    float borderY = min(vUv.y, 1.0 - vUv.y);
    float borderMask = 1.0 - smoothstep(0.0, 0.016, min(borderX, borderY));
    float borderGlow = borderMask * mix(0.25, 1.0, max(uActive, uHover)) * mix(1.0, 0.45, uDim);
    color = mix(color, uAccent * 1.25, borderGlow * 0.85);

    // Dim inactive background cards slightly for depth focus
    color *= mix(0.62, 1.0, max(uActive, uHover));
    color += uAccent * max(0.0, vRipple) * 0.55;

    gl_FragColor = vec4(color, 1.0);
  }
`;
