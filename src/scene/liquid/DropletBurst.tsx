import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useQuality } from '../../hooks/useQuality'
import { createRandom } from '../../lib/random'
import { sceneState } from '../sceneState'
import { LiquidMaterial } from './LiquidMaterial'
import { BURST_STRENGTH, useBurst } from './useBurst'

interface Droplet {
  position: THREE.Vector3
  velocity: THREE.Vector3
  age: number
  life: number
  size: number
}

const GRAVITY = -7.5
const UP = new THREE.Vector3(0, 1, 0)
const dir = new THREE.Vector3()
const quat = new THREE.Quaternion()
const scale = new THREE.Vector3()
const matrix = new THREE.Matrix4()

/** Pool of liquid droplets thrown from the can: gravity, drag, stretch along velocity, shrink out. */
export function DropletBurst() {
  const { burstDroplets } = useQuality()
  const mesh = useRef<THREE.InstancedMesh>(null)
  const rand = useMemo(() => createRandom(99), [])
  const pool = useMemo<Droplet[]>(
    () =>
      Array.from({ length: burstDroplets }, () => ({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        age: 1,
        life: 0,
        size: 0,
      })),
    [burstDroplets],
  )

  useBurst((size) => {
    const strength = BURST_STRENGTH[size]
    const spawn = Math.round(pool.length * (size === 'small' ? 0.3 : size === 'big' ? 0.65 : 0.9))
    const k = sceneState.canScale
    let spawned = 0
    for (const d of pool) {
      if (spawned >= spawn) break
      if (d.age < d.life) continue
      const a = rand.range(0, Math.PI * 2)
      const r = 0.38 * k
      d.position.set(Math.cos(a) * r, rand.range(0, 0.15), Math.sin(a) * r).add(sceneState.canTop)
      const out = rand.range(0.8, 3.4) * strength
      d.velocity.set(Math.cos(a) * out, rand.range(2.2, 5.6) * strength, Math.sin(a) * out + rand.range(0, 1.2))
      d.age = 0
      d.life = rand.range(0.9, 1.8)
      d.size = rand.range(0.012, 0.042) * k
      spawned++
    }
  })

  useFrame((_, delta) => {
    const m = mesh.current
    if (!m) return
    const dt = Math.min(delta, 1 / 30)
    let alive = 0
    for (const d of pool) {
      if (d.age >= d.life) continue
      d.age += dt
      d.velocity.y += GRAVITY * dt
      d.velocity.multiplyScalar(1 - 0.6 * dt)
      d.position.addScaledVector(d.velocity, dt)
      const speed = d.velocity.length()
      dir.copy(d.velocity).divideScalar(speed || 1)
      quat.setFromUnitVectors(UP, dir)
      const fade = Math.min(1, (d.life - d.age) / 0.35) * Math.min(1, d.age / 0.05)
      const s = d.size * fade
      scale.set(s, s * Math.min(2.2, 1 + speed * 0.15), s)
      matrix.compose(d.position, quat, scale)
      m.setMatrixAt(alive++, matrix)
    }
    m.count = alive
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh key={pool.length} ref={mesh} args={[undefined, undefined, pool.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 16, 12]} />
      <LiquidMaterial thickness={0.12} />
    </instancedMesh>
  )
}
