import { useFrame } from '@react-three/fiber'
import { Bloom, DepthOfField, EffectComposer, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import type { DepthOfFieldEffect } from 'postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useRef } from 'react'
import { sceneState } from './sceneState'

/** High tier only: bloom on highlights, depth of field that keeps the featured can sharp and softens far cans. */
export function Effects() {
  const dof = useRef<DepthOfFieldEffect>(null)
  useFrame(() => {
    dof.current?.target?.copy(sceneState.canCenter)
  })
  // SMAA instead of MSAA: multisampled targets combined with bloom rendered black on some GPUs (seen on ANGLE/Metal).
  return (
    <EffectComposer multisampling={0}>
      <DepthOfField ref={dof} target={[0, 0, 0]} worldFocusRange={11} bokehScale={2.2} />
      <Bloom mipmapBlur intensity={0.4} luminanceThreshold={0.82} luminanceSmoothing={0.25} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.3} darkness={0.5} />
      <SMAA />
    </EffectComposer>
  )
}
