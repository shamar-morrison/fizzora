import { useThree } from '@react-three/fiber'
import { use, useEffect } from 'react'
import { loadSceneAssets } from '../lib/textures/sceneAssets'
import { useAppStore } from '../store/useAppStore'
import { AmbientCans } from './ambient/AmbientCans'
import { AmbientDroplets } from './ambient/AmbientDroplets'
import { AmbientFruits } from './ambient/AmbientFruits'
import { CameraRig } from './CameraRig'
import { Effects } from './Effects'
import { SectionFruits } from './fruits/SectionFruits'
import { HeroCans } from './HeroCans'
import { HeroStage } from './HeroStage'
import { Backdrop } from './lighting/Backdrop'
import { StageLights } from './lighting/StageLights'
import { StudioEnvironment } from './lighting/StudioEnvironment'
import { ThemeAnimator } from './lighting/ThemeAnimator'
import { DropletBurst } from './liquid/DropletBurst'
import { Fizz } from './liquid/Fizz'
import { FruitBurst } from './liquid/FruitBurst'
import { LiquidBlobs } from './liquid/LiquidBlobs'
import { LiquidRibbon } from './liquid/LiquidRibbon'
import { SplashCrown } from './liquid/SplashCrown'
import { ReadySignal } from './ReadySignal'

/** Everything inside the canvas. Suspends until the procedural textures exist. */
export function SceneContent() {
  const assets = use(loadSceneAssets())
  const tier = useAppStore((s) => s.tier)
  const small = useAppStore((s) => s.isSmallScreen)
  const desktopShadows = !small && tier !== 'low'
  const gl = useThree((s) => s.gl)

  // Refraction does not need a full-resolution copy of the scene below the high tier.
  useEffect(() => {
    gl.transmissionResolutionScale = tier === 'high' ? 1 : 0.5
  }, [gl, tier])

  return (
    <>
      <ThemeAnimator />
      <CameraRig />
      <Backdrop />
      <StudioEnvironment />
      <StageLights castShadows={desktopShadows} />

      <HeroCans assets={assets} castShadows={desktopShadows} />
      <HeroStage reflective={tier === 'high'} receiveShadows={desktopShadows} />

      <AmbientCans assets={assets} />
      <AmbientFruits assets={assets} />
      <AmbientDroplets />
      <SectionFruits assets={assets} />

      <LiquidBlobs />
      <SplashCrown />
      <LiquidRibbon />
      <DropletBurst />
      <FruitBurst assets={assets} />
      <Fizz />

      {tier === 'high' && <Effects />}
      <ReadySignal />
    </>
  )
}
