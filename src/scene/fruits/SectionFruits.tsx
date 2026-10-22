import { useCallback, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useQuality } from '../../hooks/useQuality'
import { damp, lerp, smoothstep } from '../../lib/math'
import { createRandom } from '../../lib/random'
import type { SceneAssets } from '../../lib/textures/sceneAssets'
import { useAppStore } from '../../store/useAppStore'
import { sceneState } from '../sceneState'
import { FruitSwarm } from './FruitSwarm'
import { useDisplayedFruit } from './useDisplayedFruit'

const orbit = new THREE.Vector3()
const cluster = new THREE.Vector3()
const far = new THREE.Vector3()
const pos = new THREE.Vector3()
const quat = new THREE.Quaternion()
const euler = new THREE.Euler()
const scl = new THREE.Vector3()

/**
 * Fruit that orbits the featured can in the flavor story, then flies in to hug it
 * for the ingredients section, and flies back out afterwards.
 */
export function SectionFruits({ assets }: { assets: SceneAssets }) {
  const { sectionFruits } = useQuality()
  const { fruit, scale } = useDisplayedFruit()
  const presence = useRef(0)
  const seeds = useMemo(() => {
    const rand = createRandom(64)
    return Array.from({ length: sectionFruits }, (_, i) => ({
      clusterAngle: lerp(-2.2, 2.2, i / Math.max(1, sectionFruits - 1)) + rand.range(-0.15, 0.15),
      clusterY: rand.range(-0.9, 1.0),
      farDir: new THREE.Vector3(rand.range(-1, 1), rand.range(-1, 1), rand.range(0.3, 1)).normalize(),
      spin: new THREE.Vector3(rand.range(-1, 1), rand.range(-1, 1), rand.range(-1, 1)),
      size: rand.range(0.85, 1.2),
    }))
  }, [sectionFruits])

  const update = useCallback(
    (i: number, _kind: string, m: THREE.Matrix4, t: number, dt: number) => {
      const { sectionProgress: s, reducedMotion } = useAppStore.getState()
      if (i === 0) presence.current = damp(presence.current, smoothstep(0.35, 1, s) * (1 - smoothstep(2.4, 3, s)), 5, dt)
      const w = presence.current
      if (w < 0.01) {
        m.makeScale(0, 0, 0)
        return
      }
      const seed = seeds[i]
      const k = sceneState.canScale
      const motion = reducedMotion ? 0.3 : 1
      const c = sceneState.canCenter

      const a = (i / seeds.length) * Math.PI * 2 + t * 0.55 * motion
      orbit.set(Math.cos(a) * 1.55 * k, Math.sin(a * 2) * 0.25 + Math.sin(a) * 0.45 * k, Math.sin(a) * 1.2 * k).add(c)
      cluster
        .set(Math.sin(seed.clusterAngle) * 1.05 * k, seed.clusterY * k + Math.sin(t + i) * 0.05, Math.cos(seed.clusterAngle) * 0.9 * k)
        .add(c)
      far.copy(seed.farDir).multiplyScalar(9).add(c)

      pos.lerpVectors(orbit, cluster, smoothstep(1.25, 1.9, s))
      pos.lerp(far, 1 - w)
      euler.set(seed.spin.x * t * motion, seed.spin.y * t * motion, seed.spin.z * t * motion)
      scl.setScalar(seed.size * k * Math.sqrt(w) * scale.current)
      m.compose(pos, quat.setFromEuler(euler), scl)
    },
    [seeds, scale],
  )

  return <FruitSwarm assets={assets} fruit={fruit} count={seeds.length} update={update} />
}
