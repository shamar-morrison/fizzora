import { useFrame } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useQuality } from '../../hooks/useQuality'
import { damp, smoothstep } from '../../lib/math'
import { useAppStore } from '../../store/useAppStore'
import { sceneState } from '../sceneState'
import { LiquidMaterial } from './LiquidMaterial'
import { type AddBall, MetaballSurface } from './MetaballSurface'

const OFFSETS: [number, number, number, number][] = [
  [1.35, 0.8, 0.6, 0.2],
  [-1.3, -0.6, 0.9, 0.15],
  [1.05, -1.0, -0.4, 0.12],
]

/** How much of the blobs to show at this point of the page: the story sections and the finale. */
const blobTarget = (s: number) => smoothstep(0.5, 1, s) * (1 - smoothstep(3.3, 3.8, s)) + smoothstep(5.4, 6, s)

/** Blob centre near the featured can, drifting slowly. */
function blobCenter(index: number, t: number, out: THREE.Vector3) {
  const [ox, oy, oz] = OFFSETS[index]
  const k = sceneState.canScale
  return out.set(
    sceneState.canCenter.x + ox * k + Math.sin(t * 0.5) * 0.15,
    sceneState.canCenter.y + oy * k + Math.cos(t * 0.6) * 0.15,
    sceneState.canCenter.z + oz,
  )
}

const center = new THREE.Vector3()

// Sub-balls per blob: orbit radius and size (as fractions of the blob radius), and orbit speeds.
const LOBES: [number, number, number, number][] = [
  [0.0, 0.78, 0.35, 0.5],
  [0.62, 0.55, 0.9, 1.3],
  [0.7, 0.48, -1.1, 0.8],
  [0.55, 0.42, 1.5, -1.2],
]

/**
 * A floating blob as a few metaballs orbiting each other, so it stretches, buds and pulls back
 * together like liquid in zero gravity.
 */
function MetaBlob({ index, resolution }: { index: number; resolution: number }) {
  const visibility = useRef(0)
  const clock = useRef(0)
  const fill = useCallback(
    (add: AddBall) => {
      const { sectionProgress: s, reducedMotion } = useAppStore.getState()
      if (visibility.current < 0.01 && blobTarget(s) < 0.01) return
      const t = clock.current * (reducedMotion ? 0.3 : 1) + index * 10
      blobCenter(index, t, center)
      const r = OFFSETS[index][3] * sceneState.canScale * visibility.current
      for (let i = 0; i < LOBES.length; i++) {
        const [orbit, size, su, sv] = LOBES[i]
        const u = t * su + i * 2.1
        const v = t * sv + i * 1.3
        const o = r * orbit * (0.75 + 0.25 * Math.sin(t * 0.9 + i))
        add(center.x + Math.cos(u) * Math.cos(v) * o, center.y + Math.sin(v) * o, center.z + Math.sin(u) * Math.cos(v) * o, r * size)
      }
    },
    [index],
  )
  useFrame((state, dt) => {
    clock.current = state.clock.elapsedTime
    visibility.current = damp(visibility.current, blobTarget(useAppStore.getState().sectionProgress), 4, dt)
  })
  return <MetaballSurface resolution={resolution} fill={fill} minSide={0.8} maxSide={2} thickness={0.5} maxPolyCount={8000} />
}

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

/** Low tier: one icosphere with a cheap sine wobble. */
function Blob({ index, detail }: { index: number; detail: number }) {
  const mesh = useRef<THREE.Mesh>(null)
  const { geometry, rest } = useBlobGeometry(detail)
  const visibility = useRef(0)
  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state, dt) => {
    const m = mesh.current
    if (!m) return
    const { sectionProgress: s, reducedMotion } = useAppStore.getState()
    visibility.current = damp(visibility.current, blobTarget(s), 4, dt)
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
    blobCenter(index, t, m.position)
    m.scale.setScalar(OFFSETS[index][3] * sceneState.canScale * visibility.current)
  })

  return (
    <mesh ref={mesh} geometry={geometry} visible={false}>
      <LiquidMaterial thickness={1.2} />
    </mesh>
  )
}

/** Floating liquid blobs near the featured can in the story sections and the finale. */
export function LiquidBlobs() {
  const { blobDetail, blobResolution } = useQuality()
  return (
    <>
      {OFFSETS.map((_, i) =>
        blobResolution > 0 ? (
          <MetaBlob key={`${i}-m${blobResolution}`} index={i} resolution={blobResolution} />
        ) : (
          <Blob key={`${i}-${blobDetail}`} index={i} detail={blobDetail} />
        ),
      )}
    </>
  )
}
