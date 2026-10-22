import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { easeInOutCubic, easeOutCubic } from '../../lib/math'
import { sceneState } from '../sceneState'
import { LiquidMaterial } from './LiquidMaterial'
import { BURST_STRENGTH, useBurst } from './useBurst'

const RINGS = 64
const SIDES = 12
const DURATION = 1.6

const center = new THREE.Vector3()
const tangent = new THREE.Vector3()
const normal = new THREE.Vector3()
const binormal = new THREE.Vector3()
const UP = new THREE.Vector3(0, 0, 1)

/** A rope of liquid that arcs out of the can and falls away, drawn head first and erased tail last. */
export function LiquidRibbon() {
  const mesh = useRef<THREE.Mesh>(null)
  const state = useRef({ start: -1, strength: 1, side: 1 })

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(RINGS * (SIDES + 1) * 3), 3))
    const index: number[] = []
    for (let r = 0; r < RINGS - 1; r++) {
      for (let s = 0; s < SIDES; s++) {
        const a = r * (SIDES + 1) + s
        const b = (r + 1) * (SIDES + 1) + s
        index.push(a, b, a + 1, b, b + 1, a + 1)
      }
    }
    g.setIndex(index)
    return g
  }, [])

  const curves = useMemo(
    () =>
      [1, -1].map(
        (d) =>
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0.02, 0),
            new THREE.Vector3(0.2 * d, 0.55, 0.2),
            new THREE.Vector3(0.75 * d, 0.85, 0.45),
            new THREE.Vector3(1.3 * d, 0.45, 0.6),
            new THREE.Vector3(1.6 * d, -0.4, 0.55),
            new THREE.Vector3(1.75 * d, -1.3, 0.4),
          ]),
      ),
    [],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  useBurst((size) => {
    if (size === 'small') return
    state.current = { start: performance.now() / 1000, strength: BURST_STRENGTH[size], side: -state.current.side }
  })

  useFrame((frame) => {
    const m = mesh.current
    if (!m) return
    const s = state.current
    const t = (performance.now() / 1000 - s.start) / DURATION
    if (s.start < 0 || t > 1) {
      m.visible = false
      return
    }
    m.visible = true
    const curve = curves[s.side > 0 ? 0 : 1]
    const head = easeOutCubic(Math.min(1, t / 0.55))
    const tail = easeInOutCubic(Math.max(0, (t - 0.25) / 0.75))
    const pos = geometry.attributes.position as THREE.BufferAttribute
    const time = frame.clock.elapsedTime
    for (let r = 0; r < RINGS; r++) {
      const k = r / (RINGS - 1)
      const u = Math.min(0.999, tail + (head - tail) * k)
      curve.getPointAt(u, center)
      curve.getTangentAt(u, tangent)
      normal.crossVectors(tangent, UP).normalize()
      binormal.crossVectors(tangent, normal).normalize()
      // Fat in the middle, pinched at both ends, with a little travelling wobble.
      const radius = 0.12 * s.strength * Math.pow(Math.sin(Math.PI * k), 0.55) * (1 + 0.18 * Math.sin(k * 18 - time * 9))
      for (let j = 0; j <= SIDES; j++) {
        const a = (j / SIDES) * Math.PI * 2
        const c = Math.cos(a) * radius
        const sn = Math.sin(a) * radius
        pos.setXYZ(
          r * (SIDES + 1) + j,
          center.x + normal.x * c + binormal.x * sn,
          center.y + normal.y * c + binormal.y * sn,
          center.z + normal.z * c + binormal.z * sn,
        )
      }
    }
    pos.needsUpdate = true
    geometry.computeVertexNormals()
    m.position.copy(sceneState.canTop)
    m.scale.setScalar(sceneState.canScale)
  })

  return (
    <mesh ref={mesh} geometry={geometry} frustumCulled={false} visible={false}>
      <LiquidMaterial thickness={0.35} />
    </mesh>
  )
}
