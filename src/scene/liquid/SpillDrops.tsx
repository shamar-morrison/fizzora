import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useQuality } from '../../hooks/useQuality'
import { getDropletGeometry } from './dropletGeometry'
import { LiquidMaterial } from './LiquidMaterial'
import { isSurfaceParcel, parcels } from './liquidPhysics'

const UP = new THREE.Vector3(0, 1, 0)
const dir = new THREE.Vector3()
const quat = new THREE.Quaternion()
const scale = new THREE.Vector3()
const matrix = new THREE.Matrix4()

/**
 * Splash parcels drawn as individual teardrops. On the low tier this draws the whole splash;
 * elsewhere only the drops that have broken away from the metaball surface.
 */
export function SpillDrops({ loneOnly }: { loneOnly: boolean }) {
  const { spillParcels } = useQuality()
  const mesh = useRef<THREE.InstancedMesh>(null)

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    let alive = 0
    for (const p of parcels) {
      if (p.size <= 0 || (loneOnly && isSurfaceParcel(p))) continue
      const speed = p.velocity.length()
      const f = p.flatten
      if (f > 0.05) {
        // Puddling on the floor: squash flat and spread.
        quat.identity()
        scale.set(p.size * (1 + 0.8 * f), p.size * (1 - 0.7 * f), p.size * (1 + 0.8 * f))
      } else {
        dir.copy(p.velocity).divideScalar(speed || 1)
        quat.setFromUnitVectors(UP, dir)
        scale.set(p.size, p.size * Math.min(1.8, 0.8 + speed * 0.12), p.size)
      }
      matrix.compose(p.position, quat, scale)
      m.setMatrixAt(alive++, matrix)
    }
    m.count = alive
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh key={spillParcels} ref={mesh} args={[getDropletGeometry(), undefined, spillParcels]} frustumCulled={false} dispose={null}>
      <LiquidMaterial thickness={0.25} />
    </instancedMesh>
  )
}
