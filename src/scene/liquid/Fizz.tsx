import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useQuality } from '../../hooks/useQuality'
import { createRandom } from '../../lib/random'
import { useAppStore } from '../../store/useAppStore'
import { sceneState } from '../sceneState'
import { canUp, emitSpray, openingPosition } from './liquidPhysics'
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
    // A bubble is a thin film: clear in the middle, a bright rim and one sharp glint up-left.
    float rim = pow(1.0 - facing, 3.0);
    float spec = pow(max(dot(vNormal, normalize(vec3(-0.4, 0.6, 0.7))), 0.0), 60.0);
    vec3 color = mix(uTint, vec3(1.0), 0.75);
    gl_FragColor = vec4(mix(color, vec3(1.0), spec), clamp(rim * 0.7 + spec, 0.0, 1.0));
  }
`

const matrix = new THREE.Matrix4()
const scale = new THREE.Vector3()
const IDENTITY = new THREE.Quaternion()
const origin = new THREE.Vector3()
const axis = new THREE.Vector3()
const side = new THREE.Vector3()
const velocity = new THREE.Vector3()

/** Rising carbonation bubbles around the can opening that pop at the end of their life. */
export function Fizz() {
  const { bubbles } = useQuality()
  const mesh = useRef<THREE.InstancedMesh>(null)
  const rand = useMemo(() => createRandom(808), [])
  const spawnBudget = useRef(0)
  const spritzBudget = useRef(0)
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
      const r = Math.sqrt(rand.next()) * 0.1 * k * spread
      // Carbonation comes out of the opening, not the whole lid.
      openingPosition(b.position)
      b.position.x += Math.cos(a) * r
      b.position.y += rand.range(0, 0.08) * k
      b.position.z += Math.sin(a) * r
      b.speed = rand.range(0.35, 0.9) * (spread > 1 ? 1.8 : 1)
      b.age = 0
      b.life = rand.range(0.9, 2.1)
      b.size = rand.range(0.008, 0.024) * k
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

    // Popping bubbles throw a fine spritz of micro-drops a few centimetres up out of the opening.
    if ((hasSelected || sectionProgress > 0.5) && !reducedMotion) {
      spritzBudget.current += 14 * dt
      const k = sceneState.canScale
      openingPosition(origin)
      canUp(axis)
      while (spritzBudget.current >= 1) {
        spritzBudget.current -= 1
        side.set(rand.range(-1, 1), rand.range(-1, 1), rand.range(-1, 1))
        velocity.copy(axis).multiplyScalar(rand.range(0.9, 1.7) * k).addScaledVector(side, 0.35 * k)
        emitSpray(origin, velocity, rand.range(0.004, 0.009) * k, rand.range(0.25, 0.45))
      }
    }

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
      />
    </instancedMesh>
  )
}
