import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { FruitKind } from '../../data/drinks'
import { createRandom } from '../../lib/random'
import type { SceneAssets } from '../../lib/textures/sceneAssets'

export type PieceKind =
  | 'cherry'
  | 'limeWheel'
  | 'limeWedge'
  | 'orangeWheel'
  | 'orangeWedge'
  | 'blueberry'
  | 'grape'
  | 'grapeCluster'

/** Which pieces represent each fruit; repeats weight the mix. */
export const FRUIT_PIECES: Record<FruitKind, PieceKind[]> = {
  cherry: ['cherry'],
  lime: ['limeWheel', 'limeWedge', 'limeWheel'],
  orange: ['orangeWheel', 'orangeWedge', 'orangeWheel'],
  blueberry: ['blueberry'],
  grape: ['grape', 'grape', 'grapeCluster'],
}

export interface FruitPiece {
  geometry: THREE.BufferGeometry
  materials: THREE.Material[]
  /** Rough bounding radius, used to space pieces out. */
  radius: number
}

const flat = (g: THREE.BufferGeometry) => {
  if (!g.index) return g
  const out = g.toNonIndexed()
  g.dispose()
  return out
}

/** Merges each list into one group, so the result has one group per entry in `groups`. */
function mergeGroups(groups: THREE.BufferGeometry[][]) {
  const merged = groups.map((list) => {
    const parts = list.map(flat)
    const g = parts.length === 1 ? parts[0] : mergeGeometries(parts, false)
    if (!g) throw new Error('Could not merge fruit geometry')
    if (parts.length > 1) parts.forEach((p) => p.dispose())
    g.clearGroups()
    return g
  })
  const result = mergeGeometries(merged, true)
  merged.forEach((g) => g.dispose())
  if (!result) throw new Error('Could not merge fruit geometry')
  result.computeBoundingSphere()
  return result
}

function cherryGeometry(r: number) {
  const profile = new THREE.SplineCurve(
    [
      [0, -0.9],
      [0.45, -0.84],
      [0.86, -0.45],
      [1, 0.05],
      [0.88, 0.55],
      [0.5, 0.84],
      [0.2, 0.8],
      [0, 0.66],
    ].map(([x, y]) => new THREE.Vector2(x * r, y * r)),
  ).getPoints(32)
  const skin = new THREE.LatheGeometry(profile, 36)
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.66 * r, 0),
    new THREE.Vector3(0.04, 1.4 * r, 0.02),
    new THREE.Vector3(0.14, 2.4 * r, -0.02),
    new THREE.Vector3(0.28, 3.0 * r, -0.04),
  ])
  const stem = new THREE.TubeGeometry(stemCurve, 20, r * 0.09, 6)
  const g = mergeGroups([[skin], [stem]])
  g.translate(0, -0.6 * r, 0)
  return g
}

function wheelGeometry(r: number, thickness: number) {
  // Cylinder groups are already side / top cap / bottom cap.
  return flat(new THREE.CylinderGeometry(r, r, thickness, 56, 1))
}

/** Half-disc cut face of a wedge, lying in the plane spanned by the Y axis and `dir`. */
function cutFace(r: number, yScale: number, dir: THREE.Vector3, outward: THREE.Vector3) {
  const steps = 24
  const pos: number[] = []
  const uv: number[] = []
  const point = (t: number) => {
    const theta = t * Math.PI
    return new THREE.Vector3(dir.x * Math.sin(theta) * r, Math.cos(theta) * r * yScale, dir.z * Math.sin(theta) * r)
  }
  const tmp = new THREE.Vector3()
  for (let i = 0; i < steps; i++) {
    const a = point(i / steps)
    const b = point((i + 1) / steps)
    const tri = [new THREE.Vector3(0, 0, 0), a, b]
    tmp.subVectors(a, tri[0]).cross(new THREE.Vector3().subVectors(b, tri[0]))
    if (tmp.dot(outward) < 0) tri.reverse()
    for (const p of tri) {
      pos.push(p.x, p.y, p.z)
      // Radial distance drives v so the rind band in the texture follows the arc.
      const radial = Math.min(1, Math.hypot(p.x, p.z, p.y / yScale) / r)
      const along = p.y / (r * yScale) * 0.5 + 0.5
      uv.push(along, radial)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

function wedgeGeometry(r: number, yScale: number) {
  const phi = Math.PI / 3
  const rind = new THREE.SphereGeometry(r, 24, 20, 0, phi)
  rind.scale(1, yScale, 1)
  // SphereGeometry places phi = 0 along -X and sweeps toward +Z.
  const dirA = new THREE.Vector3(-1, 0, 0)
  const dirB = new THREE.Vector3(-Math.cos(phi), 0, Math.sin(phi))
  const outA = new THREE.Vector3(0, 0, -1)
  const outB = new THREE.Vector3(Math.sin(phi), 0, Math.cos(phi))
  const g = mergeGroups([[rind], [cutFace(r, yScale, dirA, outA)], [cutFace(r, yScale, dirB, outB)]])
  const mid = new THREE.Vector3(-Math.cos(phi / 2), 0, Math.sin(phi / 2)).multiplyScalar(r * 0.45)
  g.translate(-mid.x, 0, -mid.z)
  return g
}

function blueberryGeometry(r: number) {
  const skin = new THREE.SphereGeometry(r, 28, 18)
  skin.scale(1, 0.84, 1)
  const ring = new THREE.TorusGeometry(r * 0.3, r * 0.1, 8, 16)
  ring.rotateX(Math.PI / 2)
  ring.translate(0, r * 0.8, 0)
  const sepals: THREE.BufferGeometry[] = [ring]
  for (let i = 0; i < 5; i++) {
    const cone = new THREE.ConeGeometry(r * 0.12, r * 0.32, 5)
    const a = (i / 5) * Math.PI * 2
    cone.rotateZ(-1.1)
    cone.rotateY(a)
    cone.translate(Math.cos(a) * r * 0.34, r * 0.86, -Math.sin(a) * r * 0.34)
    sepals.push(cone)
  }
  return mergeGroups([[skin], sepals])
}

function grapeGeometry(r: number) {
  const skin = new THREE.SphereGeometry(r, 28, 20)
  skin.scale(1, 1.12, 1)
  const nub = new THREE.CylinderGeometry(r * 0.08, r * 0.14, r * 0.35, 8)
  nub.translate(0, r * 1.22, 0)
  return mergeGroups([[skin], [nub]])
}

function grapeClusterGeometry(r: number) {
  const rand = createRandom(17)
  const grapes: THREE.BufferGeometry[] = []
  const rows = [5, 5, 4, 3, 2, 1]
  rows.forEach((count, row) => {
    const ringR = count === 1 ? 0 : r * (0.55 + count * 0.22)
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + row * 0.6
      const g = new THREE.SphereGeometry(r * rand.range(0.92, 1.05), 18, 14)
      g.scale(1, 1.12, 1)
      g.translate(Math.cos(a) * ringR, -row * r * 1.45, Math.sin(a) * ringR)
      grapes.push(g)
    }
  })
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -r * 4, 0),
    new THREE.Vector3(0, r * 0.6, 0),
    new THREE.Vector3(r * 0.4, r * 2, 0),
    new THREE.Vector3(r * 1.2, r * 2.6, r * 0.2),
  ])
  const stem = new THREE.TubeGeometry(stemCurve, 24, r * 0.12, 6)
  const g = mergeGroups([grapes, [stem]])
  g.translate(0, r * 3, 0)
  return g
}

function fruitMaterials(assets: SceneAssets) {
  const skin = assets.skinNormal
  const peel = assets.peelNormal
  const physical = (p: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(p)
  const n = (v: number) => new THREE.Vector2(v, v)
  // Cut faces fake subsurface glow with an emissive copy of the pulp texture.
  const face = (map: THREE.Texture) =>
    physical({
      map,
      emissiveMap: map,
      emissive: '#ffffff',
      emissiveIntensity: 0.32,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      sheen: 0.6,
      sheenColor: '#ffffff',
      sheenRoughness: 0.4,
    })
  const stem = physical({ color: '#5d6b26', roughness: 0.65 })
  return {
    cherry: [
      physical({ color: '#8e0618', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.04, normalMap: skin, normalScale: n(0.35), sheen: 0.25, sheenColor: '#ff5a6e' }),
      stem,
    ],
    lime: physical({ color: '#3a961c', roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.12, normalMap: peel, normalScale: n(0.55) }),
    orange: physical({ color: '#ff7a00', roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.14, normalMap: peel, normalScale: n(0.7) }),
    limeFace: face(assets.citrusFace.lime),
    orangeFace: face(assets.citrusFace.orange),
    limeWedgeFace: face(assets.citrusWedge.lime),
    orangeWedgeFace: face(assets.citrusWedge.orange),
    blueberry: [
      physical({ color: '#26357a', roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.2, normalMap: skin, normalScale: n(0.3), sheen: 1, sheenColor: '#9fb3ee', sheenRoughness: 0.55 }),
      physical({ color: '#161a36', roughness: 0.8 }),
    ],
    grape: physical({ color: '#4f1580', roughness: 0.2, clearcoat: 0.9, clearcoatRoughness: 0.06, normalMap: skin, normalScale: n(0.3), sheen: 0.5, sheenColor: '#c9a6ee', sheenRoughness: 0.5 }),
    stem,
  }
}

let cache: Record<PieceKind, FruitPiece> | null = null

/** Every fruit piece type, built once and shared by all fruit systems. */
export function getFruitPieces(assets: SceneAssets): Record<PieceKind, FruitPiece> {
  if (cache) return cache
  const m = fruitMaterials(assets)
  cache = {
    cherry: { geometry: cherryGeometry(0.17), materials: m.cherry, radius: 0.22 },
    limeWheel: { geometry: wheelGeometry(0.36, 0.07), materials: [m.lime, m.limeFace, m.limeFace], radius: 0.36 },
    limeWedge: { geometry: wedgeGeometry(0.34, 1.15), materials: [m.lime, m.limeWedgeFace, m.limeWedgeFace], radius: 0.36 },
    orangeWheel: { geometry: wheelGeometry(0.46, 0.08), materials: [m.orange, m.orangeFace, m.orangeFace], radius: 0.46 },
    orangeWedge: { geometry: wedgeGeometry(0.44, 1.05), materials: [m.orange, m.orangeWedgeFace, m.orangeWedgeFace], radius: 0.44 },
    blueberry: { geometry: blueberryGeometry(0.11), materials: m.blueberry, radius: 0.12 },
    grape: { geometry: grapeGeometry(0.12), materials: [m.grape, m.stem], radius: 0.14 },
    grapeCluster: { geometry: grapeClusterGeometry(0.1), materials: [m.grape, m.stem], radius: 0.5 },
  }
  return cache
}
