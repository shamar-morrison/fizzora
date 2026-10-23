import { ContactShadows, MeshReflectorMaterial } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useQuality } from '../hooks/useQuality'
import { smoothstep } from '../lib/math'
import { createCanvas, toTexture } from '../lib/textures/canvas'
import { useAppStore } from '../store/useAppStore'
import { sceneState } from './sceneState'

/** Radial alpha so the floor melts into the backdrop instead of ending in a hard horizon. */
function useFloorFade() {
  return useMemo(() => {
    const { canvas, ctx } = createCanvas(256, 256)
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.22, '#a0a0a0')
    g.addColorStop(0.5, '#000000')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    const texture = toTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
    return texture
  }, [])
}

interface HeroStageProps {
  reflective: boolean
  receiveShadows: boolean
}

/** Floor under the carousel: contact shadows always, plus key-light shadows and a soft reflection on capable tiers. */
export function HeroStage({ reflective, receiveShadows }: HeroStageProps) {
  const group = useRef<THREE.Group>(null)
  const { contactShadowResolution } = useQuality()
  const narrow = useThree((s) => s.size.width / s.size.height < 0.8)
  const inHero = useAppStore((s) => s.sectionProgress < 1.05)
  const fade = useFloorFade()
  useEffect(() => () => fade.dispose(), [fade])
  const floorY = narrow ? -0.2 : -0.52

  useFrame(() => {
    const g = group.current
    if (!g) return
    const s = useAppStore.getState().sectionProgress
    g.position.y = floorY - smoothstep(0, 0.9, s) * 3
    sceneState.floorY = g.position.y
    sceneState.floorActive = s < 0.5
    // The contact shadow keeps its last frame when paused, so hide the whole floor off-stage.
    g.visible = s < 1.05
  })

  return (
    <group ref={group} position-y={floorY}>
      <ContactShadows
        position-y={0.005}
        scale={12}
        blur={2.6}
        far={3}
        opacity={0.75}
        resolution={contactShadowResolution}
        color="#000000"
        frames={inHero ? Infinity : 0}
      />
      {receiveShadows && (
        <mesh rotation-x={-Math.PI / 2} position-y={0.01} receiveShadow>
          <planeGeometry args={[14, 14]} />
          <shadowMaterial transparent opacity={0.3} />
        </mesh>
      )}
      {reflective && inHero && (
        <mesh rotation-x={-Math.PI / 2}>
          <planeGeometry args={[30, 30]} />
          <MeshReflectorMaterial
            alphaMap={fade}
            transparent
            resolution={512}
            blur={[400, 120]}
            mixBlur={1}
            mixStrength={2.2}
            mixContrast={1}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            roughness={0.85}
            metalness={0.4}
            color="#141418"
            envMapIntensity={0.4}
          />
        </mesh>
      )}
    </group>
  )
}
