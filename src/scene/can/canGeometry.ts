import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** Real 330 ml can proportions, in scene units (radius 0.5). The geometry is centered on its middle. */
export const CAN = {
  radius: 0.5,
  height: 1.83,
  labelBottom: 0.16,
  labelTop: 1.56,
}

/** Material slots, in the order of the merged geometry groups. */
export const CAN_SLOTS = ['label', 'metal', 'metal', 'lid', 'tab', 'tab'] as const

const SEGMENTS = 96
// Rotate the lathe so u = 0.5 (the front of the label) faces +Z.
const PHI_START = Math.PI

const v2 = (x: number, y: number) => new THREE.Vector2(x, y)

function smoothProfile(points: THREE.Vector2[], divisions: number) {
  return new THREE.SplineCurve(points).getPoints(divisions)
}

function bottomProfile() {
  // From the dome center, out across the standing ring and up the chime to the label.
  return smoothProfile(
    [v2(0, 0.11), v2(0.22, 0.085), v2(0.33, 0.035), v2(0.38, 0.003), v2(0.42, 0.01), v2(0.465, 0.06), v2(0.493, 0.12), v2(0.5, CAN.labelBottom)],
    40,
  )
}

function neckProfile() {
  // Shoulder taper, double-seam rim, then down the inside wall to the lid.
  return smoothProfile(
    [
      v2(0.5, CAN.labelTop),
      v2(0.498, 1.6),
      v2(0.475, 1.67),
      v2(0.44, 1.735),
      v2(0.428, 1.775),
      v2(0.432, 1.805),
      v2(0.43, 1.828),
      v2(0.418, 1.83),
      v2(0.41, 1.815),
      v2(0.405, 1.79),
      v2(0.398, 1.772),
    ],
    60,
  )
}

function lidProfile() {
  return smoothProfile([v2(0.398, 1.772), v2(0.385, 1.762), v2(0.37, 1.768), v2(0.25, 1.774), v2(0, 1.776)], 24)
}

function planarLidUVs(geometry: THREE.BufferGeometry) {
  const pos = geometry.attributes.position
  const uv = geometry.attributes.uv
  const r = 0.43
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, 0.5 + pos.getX(i) / (2 * r), 0.5 - pos.getZ(i) / (2 * r))
  }
  uv.needsUpdate = true
}

function pullTab() {
  const shape = new THREE.Shape()
  const w = 0.058
  shape.moveTo(-w, -0.04)
  shape.quadraticCurveTo(-w, -0.075, -0.02, -0.078)
  shape.lineTo(0.02, -0.078)
  shape.quadraticCurveTo(w, -0.075, w, -0.04)
  shape.lineTo(w * 1.08, 0.13)
  shape.quadraticCurveTo(w * 1.08, 0.175, 0, 0.178)
  shape.quadraticCurveTo(-w * 1.08, 0.175, -w * 1.08, 0.13)
  shape.closePath()

  const finger = new THREE.Path()
  finger.absellipse(0, 0.105, 0.036, 0.048, 0, Math.PI * 2, true, 0)
  shape.holes.push(finger)
  const slot = new THREE.Path()
  slot.absarc(0, 0.005, 0.03, Math.PI * 0.15, Math.PI * 0.85, true)
  slot.absarc(0, 0.005, 0.02, Math.PI * 0.85, Math.PI * 0.15, false)
  shape.holes.push(slot)

  const tab = new THREE.ExtrudeGeometry(shape, {
    depth: 0.008,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
    curveSegments: 24,
  })
  // Lay it flat on the lid: nose over the opening (front, +Z), finger ring toward the back.
  tab.rotateX(-Math.PI / 2)
  tab.rotateX(0.06)
  tab.translate(0, 1.781, 0.02)
  return tab
}

function rivet() {
  const geo = new THREE.CylinderGeometry(0.02, 0.026, 0.016, 20)
  geo.translate(0, 1.783, 0.02)
  return geo
}

let cached: THREE.BufferGeometry | null = null

/** One merged geometry with a group per material slot, so cans can be instanced. */
export function getCanGeometry() {
  if (cached) return cached
  const body = new THREE.LatheGeometry([v2(CAN.radius, CAN.labelBottom), v2(CAN.radius, CAN.labelTop)], SEGMENTS, PHI_START)
  const bottom = new THREE.LatheGeometry(bottomProfile(), SEGMENTS, PHI_START)
  const neck = new THREE.LatheGeometry(neckProfile(), SEGMENTS, PHI_START)
  const lid = new THREE.LatheGeometry(lidProfile(), SEGMENTS, PHI_START)
  planarLidUVs(lid)

  const parts = [body, bottom, neck, lid, pullTab(), rivet()].map((g) => {
    const flat = g.index ? g.toNonIndexed() : g
    if (flat !== g) g.dispose()
    return flat
  })
  const merged = mergeGeometries(parts, true)
  parts.forEach((p) => p.dispose())
  if (!merged) throw new Error('Could not build can geometry')
  merged.translate(0, -CAN.height / 2, 0)
  merged.computeBoundingSphere()
  cached = merged
  return merged
}
