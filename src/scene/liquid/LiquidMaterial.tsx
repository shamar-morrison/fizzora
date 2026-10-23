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
    // Split the tint between the surface colour and absorption through the body. Both multiply in linear
    // space, so putting the full colour in each would square it (orange turns red). Thick parts end up
    // deep and saturated and thin edges stay light, as real soda does.
    m.color.copy(sceneState.theme.liquid).lerp(WHITE, 0.6)
    m.attenuationColor.copy(sceneState.theme.liquid)
    // Light scattered inside the drink, so it glows like backlit soda instead of going dark over a dark backdrop.
    m.emissive.copy(sceneState.theme.liquid)
  })
  // One clean water interface: no clearcoat (a second highlight reads as plastic) and almost no dispersion
  // or distortion noise (those read as glass).
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
      roughness={0.02}
      chromaticAberration={high ? 0.012 : 0}
      anisotropicBlur={0}
      distortion={0.03}
      distortionScale={0.3}
      temporalDistortion={0}
      attenuationDistance={1.4}
      emissiveIntensity={0.14}
      envMapIntensity={1.3}
      specularIntensity={1}
    />
  )
}

const WHITE = new THREE.Color('#ffffff')

/** Low tier: a saturated core where the liquid faces you, a bright fresnel rim at grazing angles and a sharp wet glint. */
function addFresnel(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <opaque_fragment>',
    /* glsl */ `
    #include <opaque_fragment>
    vec3 n = normalize(normal);
    vec3 viewDir = normalize(vViewPosition);
    float facing = abs(dot(n, viewDir));
    float fresnel = pow(1.0 - facing, 3.0);
    vec3 core = diffuseColor.rgb * mix(0.55, 1.1, fresnel);
    float glint = pow(max(dot(reflect(-viewDir, n), normalize(vec3(-0.35, 0.8, 0.5))), 0.0), 60.0);
    gl_FragColor.rgb = mix(core, vec3(1.0), fresnel * 0.6) + gl_FragColor.rgb * 0.35 + glint;
    gl_FragColor.a = mix(0.72, 1.0, fresnel);
    `,
  )
}

const cheapCacheKey = () => 'fizzora-cheap-liquid-v2'

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
