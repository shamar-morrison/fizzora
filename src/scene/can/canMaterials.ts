import * as THREE from 'three'
import type { DrinkId } from '../../data/drinks'
import type { SceneAssets } from '../../lib/textures/sceneAssets'
import { CAN_SLOTS } from './canGeometry'

let shared: { metal: THREE.MeshPhysicalMaterial; lid: THREE.MeshPhysicalMaterial; tab: THREE.MeshPhysicalMaterial } | null = null
const labelCache = new Map<DrinkId, THREE.MeshPhysicalMaterial>()

function sharedMetal(assets: SceneAssets) {
  if (shared) return shared
  const metal = new THREE.MeshPhysicalMaterial({
    color: '#d5dade',
    metalness: 1,
    roughness: 1,
    roughnessMap: assets.metalRoughness,
    normalMap: assets.brushedNormal,
    normalScale: new THREE.Vector2(0.12, 0.12),
    clearcoat: 0.4,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.25,
  })
  const lid = new THREE.MeshPhysicalMaterial({
    color: '#c7ccd2',
    metalness: 1,
    roughness: 0.28,
    normalMap: assets.lidNormal,
    normalScale: new THREE.Vector2(0.6, 0.6),
    envMapIntensity: 1.2,
  })
  const tab = new THREE.MeshPhysicalMaterial({
    color: '#e3e6ea',
    metalness: 1,
    roughness: 0.18,
    clearcoat: 0.6,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.4,
  })
  shared = { metal, lid, tab }
  return shared
}

function labelMaterial(assets: SceneAssets, id: DrinkId) {
  const existing = labelCache.get(id)
  if (existing) return existing
  const material = new THREE.MeshPhysicalMaterial({
    map: assets.labels[id],
    metalness: 1,
    metalnessMap: assets.labelSurface,
    roughness: 1,
    roughnessMap: assets.labelSurface,
    normalMap: assets.labelNormal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    clearcoat: 0.5,
    clearcoatRoughness: 0.08,
    clearcoatNormalMap: assets.labelNormal,
    clearcoatNormalScale: new THREE.Vector2(0.25, 0.25),
    envMapIntensity: 1,
  })
  labelCache.set(id, material)
  return material
}

/** Material array matching the can geometry groups. Cached; lives for the whole session. */
export function getCanMaterials(assets: SceneAssets, id: DrinkId): THREE.Material[] {
  const { metal, lid, tab } = sharedMetal(assets)
  const label = labelMaterial(assets, id)
  const bySlot = { label, metal, lid, tab }
  return CAN_SLOTS.map((slot) => bySlot[slot])
}
