import * as THREE from 'three'
import { createRandom } from '../../lib/random'
import { CAMERA_Z, halfHeightAt } from '../layout'

/** Vertical distance (world units) that floating objects travel over the whole page. */
const PAGE_TRAVEL = 34

export interface Floater {
  x: number
  y: number
  z: number
  scale: number
  axis: THREE.Vector3
  spin: number
  phase: number
  drift: number
}

interface ScatterOptions {
  seed: number
  zMin: number
  zMax: number
  scaleMin: number
  scaleMax: number
  /** Keep objects closer than this depth out of the central column, so they never cover the copy. */
  clearCenterAbove?: number
}

export function scatterFloaters(count: number, aspect: number, o: ScatterOptions): Floater[] {
  const rand = createRandom(o.seed)
  return Array.from({ length: count }, () => {
    const z = rand.range(o.zMin, o.zMax)
    const halfW = halfHeightAt(z) * Math.max(aspect, 0.6)
    let nx = rand.range(-1, 1)
    if (o.clearCenterAbove !== undefined && z > o.clearCenterAbove) nx = rand.sign() * rand.range(0.55, 1)
    return {
      x: nx * halfW * 1.05,
      y: rand.range(-1, 1),
      z,
      scale: rand.range(o.scaleMin, o.scaleMax),
      axis: new THREE.Vector3(rand.range(-1, 1), rand.range(-1, 1), rand.range(-1, 1)).normalize(),
      spin: rand.range(0.2, 0.7) * rand.sign(),
      phase: rand.range(0, Math.PI * 2),
      drift: rand.range(0.05, 0.18),
    }
  })
}

const quat = new THREE.Quaternion()
const pos = new THREE.Vector3()
const scl = new THREE.Vector3()

/** Places a floater for the current scroll and time; nearer objects parallax faster. */
export function floaterMatrix(f: Floater, scroll: number, time: number, motion: number, scale: number, out: THREE.Matrix4) {
  const range = halfHeightAt(f.z) * 1.3
  const parallax = Math.min(2, Math.max(0.3, 9 / (CAMERA_Z - f.z)))
  const raw = f.y * range + scroll * PAGE_TRAVEL * parallax + time * f.drift * motion
  const y = -range + ((((raw + range) % (2 * range)) + 2 * range) % (2 * range))
  pos.set(f.x + Math.sin(time * 0.3 + f.phase) * 0.3 * motion, y, f.z)
  quat.setFromAxisAngle(f.axis, f.phase + time * f.spin * motion)
  scl.setScalar(f.scale * scale)
  return out.compose(pos, quat, scl)
}
