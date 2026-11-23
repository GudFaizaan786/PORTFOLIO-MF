import * as THREE from "three";

export interface WorldMutableState {
  progress: number;
  velocity: number;
  mouseX: number;
  mouseY: number;
  lastPointerTime: number;
  activeSectionIndex: number;
  entered: boolean;
  entryPush: number;
  carouselIndex: number;
  carouselDragOffset: number;
  zoomTargetPos: THREE.Vector3 | null;
  zoomTargetLook: THREE.Vector3 | null;
  glitchMode: boolean;
  dimMode: boolean;
  reducedMotion: boolean;
  plantShowerUntil: number;
  qualityTier: "high" | "medium" | "low";
}

export const worldState: WorldMutableState = {
  progress: 0,
  velocity: 0,
  mouseX: 0,
  mouseY: 0,
  lastPointerTime: 0,
  activeSectionIndex: 0,
  entered: false,
  entryPush: 0,
  carouselIndex: 0,
  carouselDragOffset: 0,
  zoomTargetPos: null,
  zoomTargetLook: null,
  glitchMode: false,
  dimMode: false,
  reducedMotion: false,
  plantShowerUntil: 0,
  qualityTier: "high",
};
