import * as THREE from 'three'
import { createRandom } from '../../lib/random'
import type { BurstSize } from '../../store/useAppStore'
import { CAN } from '../can/canGeometry'
import { sceneState } from '../sceneState'
import { BURST_STRENGTH } from './useBurst'

/**
 * Small particle sim behind every splash. Parcels are blobs of liquid that attract each other
 * (surface tension), share velocity (viscosity), cling to and run down the can and splat on the floor.
 * They are drawn as merging metaballs, so jets neck and pinch into drops on their own.
 * Spray is the fine mist of tiny ballistic drops shed by parcels and by the fizz.
 */

export interface Parcel {
  position: THREE.Vector3
  velocity: THREE.Vector3
  /** Rest radius in world units. */
  radius: number
  /** Radius to draw this frame (fades in and out); 0 when dead. */
  size: number
  age: number
  life: number
  /** 0..1, how firmly the parcel is resting on the can. */
  contact: number
  /** 0..1, how far the parcel has squashed against the floor. */
  flatten: number
  /** 0..1, eased toward 1 while the parcel touches others. Lone parcels are drawn as drops, not metaballs. */
  joined: number
  links: number
}

export interface SprayDrop {
  position: THREE.Vector3
  velocity: THREE.Vector3
  age: number
  life: number
  size: number
}

interface Emitter {
  kind: 'jet' | 'glug'
  start: number
  duration: number
  count: number
  emitted: number
  strength: number
  side: number
}

const GRAVITY = -8
const SPRAY_GRAVITY = -7.5
const AIR_DRAG = 0.35
/** Spring pulling neighbours to their preferred spacing, in 1/s². */
const COHESION = 7
/** How quickly neighbours share velocity, in 1/s. */
const VISCOSITY = 3.2
const CAN_FRICTION = 6
const CAN_ADHESION = 6
/** Outward push on liquid sitting on the lid, in units/s². */
const LID_SPREAD = 2.5
const FLOOR_FRICTION = 6
/** Spray shed per second per unit of parcel speed. */
const SHED_RATE = 0.16
/** Can speed below which an overflow is let out, and the longest it waits for that. */
const SETTLED_SPEED = 0.6
const MAX_SETTLE_WAIT = 0.8
/** Pool sizes the emission counts are tuned for (the high tier). */
const REFERENCE_PARCELS = 96

const HALF_HEIGHT = CAN.height / 2
/** The drink opening on the lid, in can-local units: in front of the rivet, under the tab nose. */
const OPENING = new THREE.Vector3(0, HALF_HEIGHT - 0.054, 0.26)

const rand = createRandom(4711)
export const parcels: Parcel[] = []
export const spray: SprayDrop[] = []
const emitters: Emitter[] = []
const pending: { size: BurstSize; at: number }[] = []
let time = 0
let jetSide = 1
let alive = 0

// Can frame tracking.
const prevMatrix = new THREE.Matrix4()
const inverse = new THREE.Matrix4()
const carry = new THREE.Matrix4()
const prevCenter = new THREE.Vector3()
const canVelocity = new THREE.Vector3()
const prevOpening = new THREE.Vector3()
/** Speed of the drink opening, which also sees the can spinning. */
let openingSpeed = 0
const up = new THREE.Vector3()
let tracked = false
let settledFor = 0

// Scratch.
const v = new THREE.Vector3()
const w = new THREE.Vector3()
const local = new THREE.Vector3()
const normal = new THREE.Vector3()
const WORLD_X = new THREE.Vector3(1, 0, 0)
const WORLD_Z = new THREE.Vector3(0, 0, 1)

const newParcel = (): Parcel => ({
  position: new THREE.Vector3(),
  velocity: new THREE.Vector3(),
  radius: 0,
  size: 0,
  age: 1,
  life: 0,
  contact: 0,
  flatten: 0,
  joined: 0,
  links: 0,
})

const newDrop = (): SprayDrop => ({ position: new THREE.Vector3(), velocity: new THREE.Vector3(), age: 1, life: 0, size: 0 })

/** Resizes the pools for the current quality tier. Live liquid is dropped when the size changes. */
export function configureLiquid(parcelCount: number, sprayCount: number) {
  if (parcels.length !== parcelCount) parcels.splice(0, parcels.length, ...Array.from({ length: parcelCount }, newParcel))
  if (spray.length !== sprayCount) spray.splice(0, spray.length, ...Array.from({ length: sprayCount }, newDrop))
}

/** Parcels smaller than this are too fine for the metaball grid and are drawn as drops instead. */
export const MIN_SURFACE_RADIUS = 0.045

/** Whether a parcel belongs in the merged metaball surface rather than drawn as a lone drop. */
export const isSurfaceParcel = (p: Parcel) => p.joined >= 0.5 && p.size >= MIN_SURFACE_RADIUS * sceneState.canScale

/** True while any liquid is in flight or still waiting to be emitted. */
export const liquidActive = () => alive > 0 || emitters.length > 0 || pending.length > 0

export function emitSpray(position: THREE.Vector3, velocity: THREE.Vector3, size: number, life = rand.range(0.7, 1.4)) {
  for (const d of spray) {
    if (d.age < d.life) continue
    d.position.copy(position)
    d.velocity.copy(velocity)
    d.age = 0
    d.life = life
    d.size = size
    return
  }
}

function spawnParcel(position: THREE.Vector3, velocity: THREE.Vector3, radius: number, life: number) {
  for (const p of parcels) {
    if (p.age < p.life) continue
    p.position.copy(position)
    p.velocity.copy(velocity).add(canVelocity)
    p.radius = radius
    p.size = 0
    p.age = 0
    p.life = life
    p.contact = 0
    p.flatten = 0
    p.joined = 1
    p.links = 0
    alive++
    return
  }
}

/** Can-local point to world. */
const toWorld = (x: number, y: number, z: number, out: THREE.Vector3) => out.set(x, y, z).applyMatrix4(sceneState.canMatrix)

/** Can-local direction to a normalized world direction. */
const dirToWorld = (x: number, y: number, z: number, out: THREE.Vector3) => out.set(x, y, z).transformDirection(sceneState.canMatrix)

/** Fine mist thrown up from the opening the moment the can splashes. */
function sprayBurst(count: number, strength: number) {
  const k = sceneState.canScale
  for (let i = 0; i < count; i++) {
    const a = rand.range(0, Math.PI * 2)
    const r = Math.sqrt(rand.next()) * 0.4
    toWorld(Math.cos(a) * r, HALF_HEIGHT, Math.sin(a) * r, v)
    const out = rand.range(0.6, 3) * strength
    const rise = rand.range(2, 5.5) * strength
    dirToWorld(Math.cos(a) * out, rise, Math.sin(a) * out, w).multiplyScalar(Math.hypot(out, rise) * k)
    w.add(canVelocity)
    emitSpray(v, w, rand.range(0.01, 0.034) * k)
  }
}

/** A ring of liquid thrown up and out round the rim, taller at a few random spikes; tips throw extra drops. */
function crown(strength: number, budget: number) {
  const k = sceneState.canScale
  const count = Math.max(10, Math.round(20 * budget))
  const spikes = rand.int(6, 9)
  const phase = rand.range(0, Math.PI * 2)
  const phase2 = rand.range(0, Math.PI * 2)
  const radius = 0.07 * k * Math.cbrt(1 / budget)
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rand.range(-0.08, 0.08)
    const wave = 0.5 + 0.5 * (Math.sin(a * spikes + phase) * 0.75 + Math.sin(a * 3 + phase2) * 0.25)
    const lift = 0.55 + 0.45 * Math.pow(wave, 1.6)
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    toWorld(cos * 0.4, HALF_HEIGHT + 0.04, sin * 0.4, v)
    const out = rand.range(1.0, 1.5) * strength
    const rise = rand.range(1.7, 2.2) * strength * lift
    dirToWorld(cos * out, rise, sin * out, w).multiplyScalar(Math.hypot(out, rise) * k)
    spawnParcel(v, w, radius * rand.range(0.85, 1.15), rand.range(1.6, 2.4))
    // Spike tips stretch into thin jets that pinch off a drop.
    if (wave > 0.8) {
      toWorld(cos * 0.42, HALF_HEIGHT + 0.08, sin * 0.42, v)
      dirToWorld(cos * out * 1.1, rise * 1.35, sin * out * 1.1, w).multiplyScalar(Math.hypot(out * 1.1, rise * 1.35) * k)
      spawnParcel(v, w, radius * 0.6, rand.range(1.6, 2.4))
    }
  }
}

function addEmitter(kind: Emitter['kind'], duration: number, count: number, strength: number, side: number) {
  emitters.push({ kind, start: time, duration, count, emitted: 0, strength, side })
}

/** Queues a splash; it is emitted on the next step, once the can's transform for this frame is known. */
export function emitLiquid(size: BurstSize) {
  pending.push({ size, at: time })
  // Bursts come with a move (a scroll or a drink switch), so the calm spell starts over.
  settledFor = 0
}

function emitBurst(size: BurstSize) {
  if (!parcels.length) return
  const strength = BURST_STRENGTH[size]
  const budget = parcels.length / REFERENCE_PARCELS
  if (size === 'small') {
    addEmitter('glug', 0.4, Math.max(8, Math.round(16 * budget)), strength, 1)
    sprayBurst(Math.round(spray.length * 0.1), strength)
    return
  }
  crown(strength, budget)
  const jetCount = Math.max(10, Math.round(28 * budget))
  jetSide = -jetSide
  addEmitter('jet', 0.45, jetCount, strength, jetSide)
  if (size === 'finale') addEmitter('jet', 0.5, jetCount, strength, -jetSide)
  sprayBurst(Math.round(spray.length * (size === 'big' ? 0.4 : 0.55)), strength)
}

function runEmitters() {
  const k = sceneState.canScale
  const budget = parcels.length / REFERENCE_PARCELS
  const volume = Math.cbrt(1 / budget)
  for (let i = emitters.length - 1; i >= 0; i--) {
    const e = emitters[i]
    const progress = Math.min(1, (time - e.start) / e.duration)
    const target = Math.round(e.count * progress)
    while (e.emitted < target) {
      const f = e.emitted / e.count
      e.emitted++
      if (e.kind === 'jet') {
        // The gush is strongest at first and tails off, so the stream stretches as the head outruns the tail.
        const speed = rand.range(3.0, 3.3) * e.strength * (1 - 0.4 * f) * k
        const r = (0.11 - 0.035 * f) * k * volume * rand.range(0.9, 1.1)
        toWorld(OPENING.x, OPENING.y + 0.1, OPENING.z, v)
        // Aim along the can's own axis, leaning to a side in world space so a spinning can doesn't sprinkle.
        w.copy(up)
          .addScaledVector(WORLD_X, e.side * (0.95 + rand.range(-0.06, 0.06)))
          .addScaledVector(WORLD_Z, 0.4 + rand.range(-0.06, 0.06))
          .normalize()
          .multiplyScalar(speed)
        spawnParcel(v, w, r, rand.range(2.2, 3))
      } else {
        // Overflow: liquid wells up out of the opening, spills over the lid and runs down the side.
        const a = rand.range(-0.6, 0.6)
        toWorld(OPENING.x + Math.sin(a) * 0.05, OPENING.y + 0.08, OPENING.z + rand.range(-0.03, 0.03), v)
        const out = rand.range(0.15, 0.4)
        dirToWorld(Math.sin(a) * out, rand.range(0.8, 1.2), Math.cos(a) * out, w).multiplyScalar(rand.range(0.9, 1.2) * k)
        spawnParcel(v, w, 0.085 * k * volume * rand.range(0.85, 1.15), rand.range(2.4, 3.2))
      }
    }
    if (progress >= 1) emitters.splice(i, 1)
  }
}

/** Follows the featured can: its velocity, up axis and the transform that carries liquid resting on it. */
function trackCan(dt: number): boolean {
  const m = sceneState.canMatrix
  const k = sceneState.canScale
  v.setFromMatrixPosition(m)
  // Switching drinks moves the "featured can" to another can in one frame; treat that as a cut.
  const cut = !tracked || v.distanceTo(prevCenter) > 1.5 * k
  if (cut) {
    canVelocity.set(0, 0, 0)
    carry.identity()
    for (const p of parcels) p.contact = 0
  } else {
    canVelocity.subVectors(v, prevCenter).divideScalar(Math.max(dt, 1e-4))
    carry.multiplyMatrices(m, inverse.copy(prevMatrix).invert())
  }
  w.copy(OPENING).applyMatrix4(m)
  openingSpeed = cut ? 0 : w.distanceTo(prevOpening) / Math.max(dt, 1e-4)
  prevOpening.copy(w)
  up.set(0, 1, 0).transformDirection(m)
  inverse.copy(m).invert()
  prevMatrix.copy(m)
  prevCenter.copy(v)
  tracked = true
  return cut
}

/** Signed distance from a can-local point to the can (a capped cylinder), with the outward normal. */
function canDistance(p: THREE.Vector3, outNormal: THREE.Vector3) {
  const rho = Math.hypot(p.x, p.z)
  const dx = rho - CAN.radius
  const dy = Math.abs(p.y) - HALF_HEIGHT
  const sy = Math.sign(p.y) || 1
  const rx = rho > 1e-5 ? p.x / rho : 1
  const rz = rho > 1e-5 ? p.z / rho : 0
  if (dx > 0 && dy > 0) {
    const d = Math.hypot(dx, dy)
    outNormal.set((rx * dx) / d, (sy * dy) / d, (rz * dx) / d)
    return d
  }
  if (dx > dy) outNormal.set(rx, 0, rz)
  else outNormal.set(0, sy, 0)
  return Math.max(dx, dy)
}

function collideCan(p: Parcel, dt: number) {
  const k = sceneState.canScale
  local.copy(p.position).applyMatrix4(inverse)
  const r = p.radius / k
  const d = canDistance(local, normal)
  let touching = false
  // Inside the film's reach the parcel rides along with the can.
  const clinging = d < r * 1.8
  if (clinging) {
    const onLid = normal.y > 0.9
    normal.transformDirection(sceneState.canMatrix)
    if (d < r) {
      touching = true
      // Liquid still welling up behind pushes what's on the lid outward, so it spills over the rim.
      if (onLid) {
        const rho = Math.hypot(local.x, local.z)
        dirToWorld(rho > 1e-4 ? local.x / rho : 0, 0, rho > 1e-4 ? local.z / rho : 1, v)
        p.velocity.addScaledVector(v, LID_SPREAD * dt * k)
      }
      // Push out along the world normal (uniform scale, so local depth × k is world depth).
      p.position.addScaledVector(normal, (r - d) * k)
      const vn = p.velocity.dot(normal)
      if (vn < 0) p.velocity.addScaledVector(normal, -vn)
      // Friction on the tangential part so it runs down slowly instead of sliding off.
      w.copy(normal).multiplyScalar(p.velocity.dot(normal))
      v.subVectors(p.velocity, w)
      p.velocity.addScaledVector(v, -Math.min(1, CAN_FRICTION * dt))
    }
    // Adhesion: a thin film clings, so drips follow the can round instead of dropping straight off.
    p.velocity.addScaledVector(normal, -CAN_ADHESION * dt * k)
  }
  p.contact += ((clinging ? 1 : 0) - p.contact) * Math.min(1, dt * (touching ? 20 : 6))
}

function shed(p: Parcel, count: number, speedScale: number) {
  const k = sceneState.canScale
  for (let i = 0; i < count; i++) {
    w.copy(p.velocity).multiplyScalar(speedScale)
    w.x += rand.range(-0.6, 0.6) * k
    w.y += rand.range(-0.2, 0.8) * k
    w.z += rand.range(-0.6, 0.6) * k
    v.copy(p.position).addScaledVector(p.velocity, 0.01)
    emitSpray(v, w, Math.min(p.radius * 0.35, rand.range(0.012, 0.03) * k), rand.range(0.5, 1))
  }
}

function stepParcels(dt: number) {
  const k = sceneState.canScale
  const killBelow = Math.min(sceneState.canMatrix.elements[13] - 5 * k, sceneState.floorActive ? sceneState.floorY - 0.5 : Infinity)
  alive = 0
  for (const p of parcels) {
    if (p.age >= p.life) continue
    p.age += dt
    if (p.age >= p.life || p.position.y < killBelow) {
      if (p.contact < 0.5 && p.flatten < 0.5 && p.radius > 0.05 * k) shed(p, rand.int(1, 3), 0.6)
      p.age = p.life
      p.size = 0
      continue
    }
    alive++
    p.links = 0
    if (p.contact > 0.5) p.position.applyMatrix4(carry)
    p.velocity.y += GRAVITY * dt
    p.velocity.multiplyScalar(1 - AIR_DRAG * dt)
  }

  // Surface tension and viscosity between neighbours.
  for (let i = 0; i < parcels.length; i++) {
    const a = parcels[i]
    if (a.age >= a.life) continue
    for (let j = i + 1; j < parcels.length; j++) {
      const b = parcels[j]
      if (b.age >= b.life) continue
      v.subVectors(b.position, a.position)
      const sum = a.radius + b.radius
      const range = 2.2 * sum
      const distSq = v.lengthSq()
      if (distSq > range * range || distSq < 1e-10) continue
      const dist = Math.sqrt(distSq)
      // Close enough for their surfaces to merge.
      if (dist < 1.6 * sum) {
        a.links++
        b.links++
      }
      const falloff = 1 - dist / range
      const pull = ((dist - 0.9 * sum) / range) * COHESION * falloff * dt
      v.divideScalar(dist)
      a.velocity.addScaledVector(v, pull)
      b.velocity.addScaledVector(v, -pull)
      w.subVectors(b.velocity, a.velocity).multiplyScalar(Math.min(0.5, VISCOSITY * falloff * dt))
      a.velocity.add(w)
      b.velocity.sub(w)
    }
  }

  const floor = sceneState.floorY
  for (const p of parcels) {
    if (p.age >= p.life) continue
    p.position.addScaledVector(p.velocity, dt)
    collideCan(p, dt)

    if (sceneState.floorActive && p.position.y - p.radius < floor) {
      const impact = -p.velocity.y
      if (p.flatten < 0.05) {
        // The floor is barely visible, so a landing drop bursts into a crown of spray and vanishes
        // instead of pooling into a puddle hanging in mid-air.
        if (impact > 1) {
          p.velocity.y = impact * 0.5
          shed(p, rand.int(3, 6), 0.5)
        }
        p.life = Math.min(p.life, p.age + 0.35)
      }
      p.position.y = floor + p.radius * (1 - 0.6 * p.flatten)
      p.velocity.y = 0
      p.velocity.x *= 1 - Math.min(1, FLOOR_FRICTION * dt)
      p.velocity.z *= 1 - Math.min(1, FLOOR_FRICTION * dt)
      p.flatten += (1 - p.flatten) * Math.min(1, dt * 10)
    }

    const speed = p.velocity.length()
    if (p.contact < 0.5 && p.flatten < 0.5 && rand.next() < SHED_RATE * (speed / k) * dt) shed(p, 1, 0.9)

    p.joined += ((p.links > 0 || p.flatten > 0.05 ? 1 : 0) - p.joined) * Math.min(1, dt * 12)

    const fade = Math.min(1, p.age / 0.06) * Math.min(1, (p.life - p.age) / 0.35)
    p.size = p.radius * fade
  }
}

function stepSpray(dt: number) {
  const floor = sceneState.floorActive ? sceneState.floorY : -Infinity
  for (const d of spray) {
    if (d.age >= d.life) continue
    d.age += dt
    d.velocity.y += SPRAY_GRAVITY * dt
    d.velocity.multiplyScalar(1 - 0.6 * dt)
    d.position.addScaledVector(d.velocity, dt)
    if (d.position.y < floor) d.age = d.life
  }
}

export function stepLiquid(delta: number) {
  const dt = Math.min(delta, 1 / 30)
  const cut = trackCan(dt)
  if (!liquidActive() && !spray.some((d) => d.age < d.life)) return
  time += dt
  // Wait out a cut so the splash inherits the new can's motion instead of starting at rest. An overflow
  // also waits (briefly) for the can to settle, so it runs down the can instead of being flung off.
  if (!cut) {
    settledFor = openingSpeed < SETTLED_SPEED * sceneState.canScale ? settledFor + dt : 0
    // A jump in scroll leaves the can still for a frame before it starts gliding, so wait for a short calm spell.
    const settled = settledFor > 0.15
    for (let i = pending.length - 1; i >= 0; i--) {
      const { size, at } = pending[i]
      if (size === 'small' && !settled && time - at < MAX_SETTLE_WAIT) continue
      emitBurst(size)
      pending.splice(i, 1)
    }
  }
  runEmitters()
  stepParcels(dt)
  stepSpray(dt)
}

/** World position of the drink opening on the featured can. */
export const openingPosition = (out: THREE.Vector3) => out.copy(OPENING).applyMatrix4(sceneState.canMatrix)

/** World up axis of the featured can. */
export const canUp = (out: THREE.Vector3) => out.copy(up)
