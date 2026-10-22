import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DRINKS } from '../../data/drinks'
import { useAppStore } from '../../store/useAppStore'
import { sceneState } from '../sceneState'

const target = {
  accent: new THREE.Color(),
  accentLight: new THREE.Color(),
  background: new THREE.Color(),
  liquid: new THREE.Color(),
}

/** Eases the shared theme colors toward the active drink. Runs before every other frame callback. */
export function ThemeAnimator() {
  useFrame((_, dt) => {
    const { colors } = DRINKS[useAppStore.getState().activeIndex]
    target.accent.set(colors.accent)
    target.accentLight.set(colors.accentLight)
    target.background.set(colors.background)
    target.liquid.set(colors.liquid)
    const t = 1 - Math.exp(-3.5 * dt)
    const theme = sceneState.theme
    theme.accent.lerp(target.accent, t)
    theme.accentLight.lerp(target.accentLight, t)
    theme.background.lerp(target.background, t)
    theme.liquid.lerp(target.liquid, t)
  }, -10)
  return null
}
