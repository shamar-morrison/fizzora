import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useQuality } from '../../hooks/useQuality'
import { getDropletGeometry } from './dropletGeometry'
import { LiquidMaterial } from './LiquidMaterial'
import { spray } from './liquidPhysics'

const UP = new THREE.Vector3(0, 1, 0)
const dir = new THREE.Vector3()
const quat = new THREE.Quaternion()
const scale = new THREE.Vector3()
const matrix = new THREE.Matrix4()

/** The fine drops shed by the spill and the fizz: teardrops that trail their tails and shrink out. */
export function Spray() {
  const { spray: count } = useQuality()
  const mesh = useRef<THREE.InstancedMesh>(null)

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    let alive = 0
    for (const d of spray) {
      if (d.age >= d.life) continue
      const speed = d.velocity.length()
      dir.copy(d.velocity).divideScalar(speed || 1)
      quat.setFromUnitVectors(UP, dir)
      const fade = Math.min(1, (d.life - d.age) / 0.3) * Math.min(1, d.age / 0.04)
      const s = d.size * fade
      // Slow drops round up under surface tension; fast ones draw out a tail.
      scale.set(s, s * Math.min(1.7, 0.75 + speed * 0.14), s)
      matrix.compose(d.position, quat, scale)
      m.setMatrixAt(alive++, matrix)
    }
    m.count = alive
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh key={count} ref={mesh} args={[getDropletGeometry(), undefined, count]} frustumCulled={false} dispose={null}>
      <LiquidMaterial thickness={0.08} />
    </instancedMesh>
  )
}
