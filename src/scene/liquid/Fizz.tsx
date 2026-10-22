import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useQuality } from '../../hooks/useQuality'
import { createRandom } from '../../lib/random'
import { useAppStore } from '../../store/useAppStore'
import { sceneState } from '../sceneState'
import { useBurst } from './useBurst'

interface Bubble {
  position: THREE.Vector3
  speed: number
  age: number
  life: number
  size: number
  phase: number
}

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uTint;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float facing = abs(dot(vNormal, vView));
    float rim = pow(1.0 - facing, 2.5);
    // Small specular dot up-left sells the "bubble" read.
    float spec = pow(max(dot(vNormal, normalize(vec3(-0.4, 0.6, 0.7))), 0.0), 40.0);
    vec3 color = mix(uTint, vec3(1.0), 0.6) * rim + vec3(spec);
    gl_FragColor = vec4(color, rim * 0.85 + spec);
  }
`

const matrix = new THREE.Matrix4()
const scale = new THREE.Vector3()
const IDENTITY = new THREE.Quaternion()

/** Rising carbonation bubbles around the can opening that pop at the end of their life. */
export function Fizz() {
  const { bubbles } = useQuality()
  const mesh = useRef<THREE.InstancedMesh>(null)
  const rand = useMemo(() => createRandom(808), [])
  const spawnBudget = useRef(0)
  const pool = useMemo<Bubble[]>(
    () => Array.from({ length: bubbles }, () => ({ position: new THREE.Vector3(), speed: 0, age: 1, life: 0, size: 0, phase: 0 })),
    [bubbles],
  )
  const uniforms = useMemo(() => ({ uTint: { value: new THREE.Color() } }), [])

  const spawn = (n: number, spread: number) => {
    const k = sceneState.canScale
    for (const b of pool) {
      if (n <= 0) break
      if (b.age < b.life) continue
      const a = rand.range(0, Math.PI * 2)
      const r = Math.sqrt(rand.next()) * 0.32 * k * spread
      b.position.set(Math.cos(a) * r, rand.range(-0.05, 0.1), Math.sin(a) * r).add(sceneState.canTop)
      b.speed = rand.range(0.35, 0.9) * (spread > 1 ? 1.8 : 1)
      b.age = 0
      b.life = rand.range(0.9, 2.1)
      b.size = rand.range(0.012, 0.035) * k
      b.phase = rand.range(0, 6.28)
      n--
    }
  }

  useBurst(() => spawn(Math.floor(pool.length * 0.5), 2.2))

  useFrame((state, delta) => {
    const m = mesh.current
    if (!m) return
    const dt = Math.min(delta, 1 / 30)
    const { reducedMotion, sectionProgress, hasSelected } = useAppStore.getState()
    uniforms.uTint.value.copy(sceneState.theme.accentLight)
    // Fizz once a can is open (picked), or always in the sections below.
    const rate = hasSelected || sectionProgress > 0.5 ? (reducedMotion ? 6 : 26) : 4
    spawnBudget.current += rate * dt
    const n = Math.floor(spawnBudget.current)
    spawnBudget.current -= n
    if (n > 0) spawn(n, 1)

    const t = state.clock.elapsedTime
    let alive = 0
    for (const b of pool) {
      if (b.age >= b.life) continue
      b.age += dt
      b.position.y += b.speed * dt
      b.position.x += Math.sin(t * 6 + b.phase) * 0.12 * dt
      const remaining = b.life - b.age
      // Swell quickly just before popping.
      const pop = remaining < 0.08 ? 1 + (0.08 - remaining) * 6 : 1
      scale.setScalar(b.size * pop * Math.min(1, b.age / 0.1))
      matrix.compose(b.position, IDENTITY, scale)
      m.setMatrixAt(alive++, matrix)
    }
    m.count = alive
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh key={pool.length} ref={mesh} args={[undefined, undefined, pool.length]} frustumCulled={false} renderOrder={10}>
      <sphereGeometry args={[1, 12, 8]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  )
}
