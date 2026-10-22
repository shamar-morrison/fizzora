import { DRINK_COUNT } from '../data/drinks'
import { lerp, smoothstep, wrapAngle } from '../lib/math'

/** Camera distance used for layout math; the camera rig dollies around it. */
export const CAMERA_Z = 10
export const CAMERA_FOV = 32

export const SECTION_COUNT = 7

export interface Pose {
  x: number
  y: number
  z: number
  rx: number
  ry: number
  rz: number
  scale: number
}

export interface Viewport {
  aspect: number
  /** True on portrait / narrow screens where text stacks under the can. */
  narrow: boolean
}

/** Half the visible height at world depth z for the layout camera. */
export const halfHeightAt = (z: number) => Math.tan((CAMERA_FOV * Math.PI) / 360) * (CAMERA_Z - z)

interface ScreenPose {
  /** Horizontal position as a fraction of the half-width (-1 left edge, 1 right edge). */
  nx: number
  ny: number
  z: number
  scale: number
  rz: number
}

// Featured-can placement per scroll section (1..5). Text sits on the opposite side.
const WIDE: ScreenPose[] = [
  { nx: 0.42, ny: -0.02, z: 0.6, scale: 1.25, rz: -0.12 },
  { nx: -0.42, ny: 0, z: 0, scale: 1.15, rz: 0.16 },
  { nx: 0.46, ny: 0.02, z: 0.5, scale: 1.2, rz: -0.08 },
  { nx: 0.0, ny: 0.1, z: -7, scale: 1.5, rz: 0.1 },
  { nx: 0.45, ny: 0, z: 0, scale: 1.15, rz: -0.14 },
]
const NARROW: ScreenPose[] = [
  { nx: 0.05, ny: 0.42, z: 0, scale: 0.78, rz: -0.1 },
  { nx: -0.05, ny: 0.45, z: 0, scale: 0.72, rz: 0.12 },
  { nx: 0.55, ny: 0.62, z: -1, scale: 0.5, rz: -0.08 },
  { nx: 0, ny: 0.2, z: -7, scale: 1.2, rz: 0.1 },
  { nx: 0.55, ny: 0.62, z: 0, scale: 0.5, rz: -0.12 },
]

function screenToWorld(p: ScreenPose, vp: Viewport, out: Pose) {
  const h = halfHeightAt(p.z)
  out.x = p.nx * h * vp.aspect
  out.y = p.ny * h
  out.z = p.z
  out.rx = 0
  out.ry = 0
  out.rz = p.rz
  out.scale = p.scale
  return out
}

export function lerpPose(a: Pose, b: Pose, t: number, out: Pose) {
  out.x = lerp(a.x, b.x, t)
  out.y = lerp(a.y, b.y, t)
  out.z = lerp(a.z, b.z, t)
  out.rx = lerp(a.rx, b.rx, t)
  // Shortest way round, so blending never unwinds accumulated spin.
  out.ry = a.ry + wrapAngle(b.ry - a.ry) * t
  out.rz = lerp(a.rz, b.rz, t)
  out.scale = lerp(a.scale, b.scale, t)
  return out
}

export const emptyPose = (): Pose => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, scale: 1 })

/** Ring radius that keeps the side cans visible on any aspect ratio. */
export const carouselRadius = (vp: Viewport) => Math.min(3.3, Math.max(1.7, halfHeightAt(0) * vp.aspect * 0.72))

/** Carousel slot for a can whose angular offset from the front is `offset` steps. */
export function carouselPose(offset: number, vp: Viewport, out: Pose) {
  const angle = (offset / DRINK_COUNT) * Math.PI * 2
  const r = carouselRadius(vp)
  const front = Math.max(0, Math.cos(angle))
  out.x = Math.sin(angle) * r
  out.z = (Math.cos(angle) - 1) * r * 1.1
  out.y = vp.narrow ? 0.75 : 0.55
  out.rx = 0
  // Cans turn slightly away as they travel round, like products on a turntable.
  out.ry = -angle * 0.5
  out.rz = 0
  out.scale = (vp.narrow ? 0.72 : 1) * (0.88 + 0.27 * Math.pow(front, 6))
  return out
}

const scratchA = emptyPose()
const scratchB = emptyPose()

/** Pose of the featured can for a continuous section position s in [1, 5]. */
export function sectionPose(s: number, vp: Viewport, out: Pose) {
  const poses = vp.narrow ? NARROW : WIDE
  const i = Math.min(poses.length - 2, Math.max(0, Math.floor(s - 1)))
  const t = smoothstep(0, 1, s - 1 - i)
  screenToWorld(poses[i], vp, scratchA)
  screenToWorld(poses[i + 1], vp, scratchB)
  return lerpPose(scratchA, scratchB, s <= 1 ? 0 : s >= 5 ? 1 : t, out)
}

/** Final line-up of all five cans; `slot` runs -2..2 with the featured can in the middle. */
export function finalePose(slot: number, vp: Viewport, out: Pose) {
  const depth = -Math.abs(slot) * (vp.narrow ? 1.4 : 0.9)
  const h = halfHeightAt(depth)
  const spread = vp.narrow ? 0.34 : Math.min(0.32, 2.2 / (h * vp.aspect))
  out.x = slot * spread * h * vp.aspect
  out.y = (vp.narrow ? 0.22 : 0.2) * h + Math.abs(slot) * 0.12
  out.z = depth
  out.rx = 0
  out.ry = -slot * 0.35
  out.rz = slot * 0.08
  out.scale = vp.narrow ? 0.85 : 1.05
  return out
}

/** Off-stage position for cans that are not featured in the middle sections. */
export function parkedPose(index: number, out: Pose) {
  out.x = (index - 2) * 3.2
  out.y = 8.5 + (index % 2) * 1.5
  out.z = -6
  out.rx = 0.6
  out.ry = index
  out.rz = 0.3
  out.scale = 0.7
  return out
}
