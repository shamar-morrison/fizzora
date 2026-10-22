import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useAppStore } from '../../store/useAppStore'
import { LAYER_BACKDROP } from '../layers'
import { sceneState } from '../sceneState'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy * 2.0, 0.9999, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uGlow;
  uniform float uAspect;
  uniform float uScroll;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main() {
    vec2 p = vUv - vec2(0.5, 0.56 - uScroll * 0.08);
    p.x *= uAspect;
    float glow = smoothstep(0.95, 0.0, length(p));
    vec3 color = mix(uBase, uGlow, glow * 0.55);
    // Faint secondary glow low on the left keeps big screens from feeling empty.
    vec2 q = vUv - vec2(0.12, 0.1);
    q.x *= uAspect;
    color += uGlow * smoothstep(0.7, 0.0, length(q)) * 0.12;
    // Dither to avoid banding in the dark gradient.
    color += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`

/** Fullscreen gradient behind everything, tinted by the theme. Also feeds the fog color. */
export function Backdrop() {
  const size = useThree((s) => s.size)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const mesh = useRef<THREE.Mesh>(null)
  const uniforms = useMemo(
    () => ({
      uBase: { value: new THREE.Color() },
      uGlow: { value: new THREE.Color() },
      uAspect: { value: 1 },
      uScroll: { value: 0 },
    }),
    [],
  )

  useEffect(() => {
    mesh.current?.layers.set(LAYER_BACKDROP)
    camera.layers.enable(LAYER_BACKDROP)
    scene.fog = new THREE.Fog('#000000', 16, 50)
    return () => {
      scene.fog = null
    }
  }, [camera, scene])

  useFrame(() => {
    const { theme } = sceneState
    uniforms.uBase.value.copy(theme.background)
    uniforms.uGlow.value.copy(theme.accent).multiplyScalar(0.55)
    uniforms.uAspect.value = size.width / size.height
    uniforms.uScroll.value = useAppStore.getState().scrollProgress
    // Fog matches the mid-tone of the backdrop so distant cans fade into it rather than turning black.
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(theme.background).lerp(uniforms.uGlow.value, 0.4)
  })

  return (
    <mesh ref={mesh} renderOrder={-1000} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </mesh>
  )
}
