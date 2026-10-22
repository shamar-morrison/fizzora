import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type * as THREE from 'three'
import { sceneState } from '../sceneState'

interface StageLightsProps {
  castShadows: boolean
}

/** Key, rim and fill lights. Rim and fill follow the animated theme color. */
export function StageLights({ castShadows }: StageLightsProps) {
  const key = useRef<THREE.DirectionalLight>(null)
  const rim = useRef<THREE.DirectionalLight>(null)
  const fill = useRef<THREE.PointLight>(null)

  useEffect(() => {
    const light = key.current
    if (!light) return
    // Tight shadow frustum around the hero stage keeps the shadow map sharp.
    const cam = light.shadow.camera
    cam.left = -3
    cam.right = 3
    cam.top = 3
    cam.bottom = -3
    cam.near = 1
    cam.far = 20
    cam.updateProjectionMatrix()
  }, [])

  useFrame(() => {
    rim.current?.color.copy(sceneState.theme.accentLight)
    fill.current?.color.copy(sceneState.theme.accent)
  })

  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight
        ref={key}
        position={[4, 6, 6]}
        intensity={2.2}
        castShadow={castShadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight ref={rim} position={[-4, 3, -5]} intensity={4} />
      <pointLight ref={fill} position={[-5, -1, 4]} intensity={18} distance={20} decay={1.6} />
    </>
  )
}
