import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { easeOutCubic, smoothstep } from '../../lib/math'
import { createRandom } from '../../lib/random'
import { sceneState } from '../sceneState'
import { LiquidMaterial } from './LiquidMaterial'
import { BURST_STRENGTH, useBurst } from './useBurst'

const SEGMENTS = 96
const ROWS = 20
const DURATION = 1.25

/** Crown-shaped splash rising from the can opening: a thin liquid wall with noisy spiked rim. */
export function SplashCrown() {
  const mesh = useRef<THREE.Mesh>(null)
  const state = useRef({ start: -1, strength: 1, phases: [0, 0, 0], spikes: 9 })
  const rand = useMemo(() => createRandom(2024), [])

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const count = (SEGMENTS + 1) * (ROWS + 1)
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    const index: number[] = []
    for (let a = 0; a < SEGMENTS; a++) {
      for (let r = 0; r < ROWS; r++) {
        const i0 = a * (ROWS + 1) + r
        const i1 = (a + 1) * (ROWS + 1) + r
        index.push(i0, i1, i0 + 1, i1, i1 + 1, i0 + 1)
      }
    }
    g.setIndex(index)
    return g
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  useBurst((size) => {
    state.current.start = performance.now() / 1000
    state.current.strength = BURST_STRENGTH[size]
    state.current.phases = [rand.range(0, 6.28), rand.range(0, 6.28), rand.range(0, 6.28)]
    state.current.spikes = rand.int(6, 9)
  })

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const s = state.current
    const t = (performance.now() / 1000 - s.start) / DURATION
    if (s.start < 0 || t > 1) {
      m.visible = false
      return
    }
    m.visible = true
    const rise = easeOutCubic(t / 0.3)
    const collapse = 1 - smoothstep(0.55, 1, t)
    const height = 0.5 * s.strength * rise * collapse
    const baseR = 0.36
    const flare = 0.12 + 0.32 * easeOutCubic(t) * s.strength
    const pos = geometry.attributes.position as THREE.BufferAttribute
    for (let a = 0; a <= SEGMENTS; a++) {
      const theta = (a / SEGMENTS) * Math.PI * 2
      const wave =
        0.5 +
        0.5 * (Math.sin(theta * s.spikes + s.phases[0]) * 0.75 + Math.sin(theta * 3 + s.phases[2]) * 0.25)
      const spike = 0.6 + 0.4 * Math.pow(Math.max(0, wave), 1.6)
      const h = height * spike
      const cos = Math.cos(theta)
      const sin = Math.sin(theta)
      for (let r = 0; r <= ROWS; r++) {
        // First half of the rows climbs the outer wall, second half returns down the inside.
        const p = r / ROWS
        const up = p < 0.5 ? p * 2 : (1 - p) * 2
        const y = h * up
        const thickness = 0.035 * Math.sqrt(1 - up) * s.strength + 0.006
        const radius = baseR + flare * up * up + (p < 0.5 ? thickness : -thickness)
        pos.setXYZ(a * (ROWS + 1) + r, cos * radius, y, sin * radius)
      }
    }
    pos.needsUpdate = true
    geometry.computeVertexNormals()
    m.position.copy(sceneState.canTop)
    m.scale.setScalar(sceneState.canScale)
  })

  return (
    <mesh ref={mesh} geometry={geometry} frustumCulled={false} visible={false}>
      <LiquidMaterial thickness={0.15} />
    </mesh>
  )
}
