import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useQuality } from '../../hooks/useQuality'
import { damp, smoothstep } from '../../lib/math'
import { useAppStore } from '../../store/useAppStore'
import { sceneState } from '../sceneState'
import { LiquidMaterial } from './LiquidMaterial'

const OFFSETS: [number, number, number, number][] = [
  [1.35, 0.8, 0.6, 0.2],
  [-1.3, -0.6, 0.9, 0.15],
  [1.05, -1.0, -0.4, 0.12],
]

function useBlobGeometry(detail: number) {
  return useMemo(() => {
    const base = new THREE.IcosahedronGeometry(1, detail)
    base.deleteAttribute('normal')
    base.deleteAttribute('uv')
    // Welding shared vertices lets computeVertexNormals produce smooth shading.
    const welded = mergeVertices(base)
    base.dispose()
    const rest = Float32Array.from(welded.attributes.position.array)
    return { geometry: welded, rest }
  }, [detail])
}

function Blob({ index, detail }: { index: number; detail: number }) {
  const mesh = useRef<THREE.Mesh>(null)
  const { geometry, rest } = useBlobGeometry(detail)
  const visibility = useRef(0)
  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state, dt) => {
    const m = mesh.current
    if (!m) return
    const { sectionProgress: s, reducedMotion } = useAppStore.getState()
    const target = smoothstep(0.5, 1, s) * (1 - smoothstep(3.3, 3.8, s)) + smoothstep(5.4, 6, s)
    visibility.current = damp(visibility.current, target, 4, dt)
    m.visible = visibility.current > 0.01
    if (!m.visible) return
    const t = state.clock.elapsedTime * (reducedMotion ? 0.3 : 1) + index * 10
    const pos = geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = rest[i * 3]
      const y = rest[i * 3 + 1]
      const z = rest[i * 3 + 2]
      const n = 1 + 0.11 * Math.sin(x * 3 + t * 1.6) * Math.sin(y * 2.6 + t * 1.2) + 0.06 * Math.sin(z * 4.5 - t * 2.1)
      pos.setXYZ(i, x * n, y * n, z * n)
    }
    pos.needsUpdate = true
    geometry.computeVertexNormals()
    const [ox, oy, oz, r] = OFFSETS[index]
    const k = sceneState.canScale
    m.position.set(
      sceneState.canCenter.x + ox * k + Math.sin(t * 0.5) * 0.15,
      sceneState.canCenter.y + oy * k + Math.cos(t * 0.6) * 0.15,
      sceneState.canCenter.z + oz,
    )
    m.scale.setScalar(r * k * visibility.current)
  })

  return (
    <mesh ref={mesh} geometry={geometry} visible={false}>
      <LiquidMaterial thickness={1.2} />
    </mesh>
  )
}

/** Wobbling liquid blobs floating near the featured can in the story sections and the finale. */
export function LiquidBlobs() {
  const { blobDetail } = useQuality()
  return (
    <>
      {OFFSETS.map((_, i) => (
        <Blob key={`${i}-${blobDetail}`} index={i} detail={blobDetail} />
      ))}
    </>
  )
}
