import { useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { useQuality } from '../../hooks/useQuality'
import { createRandom } from '../../lib/random'
import type { SceneAssets } from '../../lib/textures/sceneAssets'
import { FruitSwarm } from '../fruits/FruitSwarm'
import { useDisplayedFruit } from '../fruits/useDisplayedFruit'
import { sceneState } from '../sceneState'
import { BURST_STRENGTH, useBurst } from './useBurst'

interface Flyer {
  position: THREE.Vector3
  velocity: THREE.Vector3
  rotation: THREE.Euler
  spin: THREE.Vector3
  age: number
  life: number
  size: number
}

const quat = new THREE.Quaternion()
const scale = new THREE.Vector3()

/** Fruit pieces flung out of the can on a splash. */
export function FruitBurst({ assets }: { assets: SceneAssets }) {
  const { burstFruits } = useQuality()
  const { fruit } = useDisplayedFruit()
  const rand = useMemo(() => createRandom(5150), [])
  const flyers = useMemo<Flyer[]>(
    () =>
      Array.from({ length: burstFruits }, () => ({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        rotation: new THREE.Euler(),
        spin: new THREE.Vector3(),
        age: 1,
        life: 0,
        size: 1,
      })),
    [burstFruits],
  )

  useBurst((size) => {
    const strength = BURST_STRENGTH[size]
    const count = size === 'small' ? Math.ceil(flyers.length * 0.35) : flyers.length
    const k = sceneState.canScale
    for (let i = 0; i < count; i++) {
      const f = flyers[i]
      const a = (i / count) * Math.PI * 2 + rand.range(-0.3, 0.3)
      f.position.copy(sceneState.canTop)
      const out = rand.range(1.6, 3.2) * strength
      f.velocity.set(Math.cos(a) * out, rand.range(2.5, 4.5) * strength, Math.sin(a) * out * 0.5 + 0.3)
      f.rotation.set(rand.range(0, 6), rand.range(0, 6), rand.range(0, 6))
      f.spin.set(rand.range(-4, 4), rand.range(-4, 4), rand.range(-4, 4))
      f.age = 0
      f.life = rand.range(1.8, 2.6)
      f.size = rand.range(0.7, 0.95) * k
    }
  })

  const update = useCallback(
    (i: number, _kind: string, m: THREE.Matrix4, _t: number, delta: number) => {
      const f = flyers[i]
      const dt = Math.min(delta, 1 / 30)
      if (f.age >= f.life) {
        m.makeScale(0, 0, 0)
        return
      }
      f.age += dt
      f.velocity.y -= 4.2 * dt
      f.velocity.multiplyScalar(1 - 0.9 * dt)
      f.position.addScaledVector(f.velocity, dt)
      f.rotation.x += f.spin.x * dt
      f.rotation.y += f.spin.y * dt
      f.rotation.z += f.spin.z * dt
      const pop = Math.min(1, f.age / 0.12) * Math.min(1, (f.life - f.age) / 0.4)
      scale.setScalar(f.size * pop)
      m.compose(f.position, quat.setFromEuler(f.rotation), scale)
    },
    [flyers],
  )

  return <FruitSwarm assets={assets} fruit={fruit} count={flyers.length} update={update} />
}
