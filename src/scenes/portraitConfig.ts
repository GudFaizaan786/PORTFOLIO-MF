// Normalized (0..1, origin top-left) segmentation & sampling config
// for the dot-matrix 3D portrait. Append `?debug` to the URL to preview overlays.

export const PORTRAIT_CONFIG = {
  // Fallback image path (overridden if identity.portraitUrl is set in content.ts)
  fallbackPortraitUrl:
    "/assets/aistudio/Gemini_Generated_Image_vfnnsbvfnnsbvfnn_a909947f.png",

  // Offscreen sampling grid dimensions
  desktopSample: { width: 160, height: 90 },
  mobileSample: { width: 100, height: 56 },
  lowFpsSample: { width: 96, height: 54 },

  // Brightness threshold (0..1) separating lit figure dots from dark background & faint code
  brightnessThreshold: 0.165,

  // World-space dimensions of the portrait (16:9 aspect matching source)
  portraitWorldSize: { width: 4.5, height: 2.53125 },

  // Head region (top of skull to chin)
  headRegion: {
    minX: 0.38,
    maxX: 0.62,
    minY: 0.06,
    maxY: 0.6,
  },

  // Neck rotation pivot
  neckPivot: {
    x: 0.5,
    y: 0.6,
  },

  // Left and Right eye centers & radius
  leftEye: {
    x: 0.453,
    y: 0.29,
  },
  rightEye: {
    x: 0.541,
    y: 0.29,
  },
  eyeRadius: 0.018,

  // Torso/shoulders start below this Y
  torsoMinY: 0.6,

  // Cursor-tracking limits (radians) & speeds
  limits: {
    maxYawRad: (30 * Math.PI) / 180, // ±30°
    maxPitchRad: (18 * Math.PI) / 180, // ±18°
    maxRollRad: (4 * Math.PI) / 180, // ±4°
    eyeLeadOffsetNorm: 0.012, // up to ~0.012 normalized units
    torsoCounterFactor: -0.15, // subtle 15% counter-rotation
  },
} as const;
