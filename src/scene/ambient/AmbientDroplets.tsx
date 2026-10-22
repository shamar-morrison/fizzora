import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useQuality } from '../../hooks/useQuality'
import { useAppStore } from '../../store/useAppStore'
import { LiquidMaterial } from '../liquid/LiquidMaterial'
import { floaterMatrix, scatterFloaters } from './drift'

const matrix = new THREE.Matrix4()
const stretch = new THREE.Matrix4()

/** Liquid droplets hanging in the air between the cans. */
export function AmbientDroplets() {
  const { ambientDroplets } = useQuality()
  const aspect = useThree((s) => s.size.width / s.size.height)
  const mesh = useRef<THREE.InstancedMesh>(null)
  const floaters = useMemo(
    () => scatterFloaters(ambientDroplets, aspect, { seed: 33, zMin: -8, zMax: 2, scaleMin: 0.04, scaleMax: 0.11, clearCenterAbove: -1 }),
    [ambientDroplets, aspect],
  )

  useFrame((state) => {
    const m = mesh.current
    if (!m) return
    const { scrollProgress, reducedMotion } = useAppStore.getState()
    const t = state.clock.elapsedTime
    floaters.forEach((f, i) => {
      floaterMatrix(f, scrollProgress, t, reducedMotion ? 0.2 : 0.6, 1, matrix)
      // Gentle wobble so droplets read as liquid rather than glass beads.
      const w = Math.sin(t * 2.2 + f.phase) * 0.08
      stretch.makeScale(1 + w, 1 - w, 1 + w)
      m.setMatrixAt(i, matrix.multiply(stretch))
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh key={floaters.length} ref={mesh} args={[undefined, undefined, floaters.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 20]} />
      <LiquidMaterial thickness={0.8} />
    </instancedMesh>
  )
}
