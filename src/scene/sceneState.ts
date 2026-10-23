import * as THREE from 'three'
import { DRINKS } from '../data/drinks'

/**
 * Mutable per-frame state shared between scene components and DOM input handlers.
 * Kept outside React so high-frequency updates never trigger renders.
 */
export const sceneState = {
  /** Pointer in normalized device coords, tracked on window so it works through DOM overlays. */
  pointer: new THREE.Vector2(),
  /** Carousel drag offset in "can steps", written by the hero drag surface. */
  dragOffset: 0,
  /** World position of the featured can's opening; splashes and fizz spawn here. */
  canTop: new THREE.Vector3(0, 1, 0),
  canCenter: new THREE.Vector3(),
  canScale: 1,
  /** World matrix of the featured can; the liquid sim emits along its axes and collides with it. */
  canMatrix: new THREE.Matrix4(),
  /** World height of the hero floor, and whether falling liquid should land on it. */
  floorY: -0.52,
  floorActive: true,
  /** Animated theme colors, eased toward the active drink every frame. */
  theme: {
    accent: new THREE.Color(DRINKS[0].colors.accent),
    accentLight: new THREE.Color(DRINKS[0].colors.accentLight),
    background: new THREE.Color(DRINKS[0].colors.background),
    liquid: new THREE.Color(DRINKS[0].colors.liquid),
  },
}
