import { MeshTransmissionMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useAppStore } from '../../store/useAppStore'
import { sceneState } from '../sceneState'

interface LiquidMaterialProps {
  /** Physical thickness used for refraction; thin sheets want lower values. */
  thickness?: number
}

/**
 * Drink-tinted liquid. Mid and high tiers refract the scene through three's shared
 * transmission pass; the low tier uses a cheap fresnel + environment reflection shader.
 */
export function LiquidMaterial({ thickness = 0.6 }: LiquidMaterialProps) {
  const tier = useAppStore((s) => s.tier)
  return tier === 'low' ? <CheapLiquidMaterial /> : <TransmissiveLiquid thickness={thickness} high={tier === 'high'} />
}

function TransmissiveLiquid({ thickness, high }: { thickness: number; high: boolean }) {
  const ref = useRef<THREE.MeshPhysicalMaterial>(null)
  useFrame(() => {
    const m = ref.current
    if (!m) return
    m.color.copy(sceneState.theme.liquid).lerp(WHITE, 0.25)
    m.attenuationColor.copy(sceneState.theme.liquid)
  })
  return (
    <MeshTransmissionMaterial
      // drei types this ref as a props object; the runtime instance is a MeshPhysicalMaterial subclass.
      ref={(m: unknown) => void (ref.current = m instanceof THREE.MeshPhysicalMaterial ? m : null)}
      transmissionSampler
      resolution={16}
      backsideResolution={16}
      samples={high ? 6 : 3}
      transmission={1}
      thickness={thickness}
      ior={1.34}
      roughness={0.04}
      chromaticAberration={high ? 0.06 : 0.025}
      anisotropicBlur={0.08}
      distortion={0.12}
      distortionScale={0.4}
      temporalDistortion={0.08}
      attenuationDistance={0.9}
      clearcoat={1}
      clearcoatRoughness={0.02}
      envMapIntensity={1.6}
      specularIntensity={1}
    />
  )
}

const WHITE = new THREE.Color('#ffffff')

/** Adds a fresnel rim and fresnel-driven opacity to the standard material. */
function addFresnel(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <opaque_fragment>',
    /* glsl */ `
    #include <opaque_fragment>
    float facing = abs(dot(normalize(normal), normalize(vViewPosition)));
    float fresnel = pow(1.0 - facing, 2.2);
    gl_FragColor.rgb += diffuseColor.rgb * 0.35 + fresnel * vec3(0.55);
    gl_FragColor.a = mix(0.55, 1.0, fresnel);
    `,
  )
}

const cheapCacheKey = () => 'fizzora-cheap-liquid'

function CheapLiquidMaterial() {
  const ref = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(() => ref.current?.color.copy(sceneState.theme.liquid))
  return (
    <meshStandardMaterial
      ref={ref}
      roughness={0.04}
      metalness={0}
      transparent
      envMapIntensity={2.2}
      onBeforeCompile={addFresnel}
      customProgramCacheKey={cheapCacheKey}
    />
  )
}
