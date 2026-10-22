import { useThree } from '@react-three/fiber'
import { useCallback, useMemo } from 'react'
import type * as THREE from 'three'
import { useQuality } from '../../hooks/useQuality'
import type { SceneAssets } from '../../lib/textures/sceneAssets'
import { useAppStore } from '../../store/useAppStore'
import { FruitSwarm } from '../fruits/FruitSwarm'
import { useDisplayedFruit } from '../fruits/useDisplayedFruit'
import { floaterMatrix, scatterFloaters } from './drift'

/** Fruit bits of the active flavor drifting through the whole page at many depths. */
export function AmbientFruits({ assets }: { assets: SceneAssets }) {
  const { ambientFruits } = useQuality()
  const aspect = useThree((s) => s.size.width / s.size.height)
  const { fruit, scale } = useDisplayedFruit()
  const floaters = useMemo(
    () => scatterFloaters(ambientFruits, aspect, { seed: 91, zMin: -12, zMax: 2, scaleMin: 0.6, scaleMax: 1.1, clearCenterAbove: -1.5 }),
    [ambientFruits, aspect],
  )

  const update = useCallback(
    (i: number, _kind: string, m: THREE.Matrix4, t: number) => {
      const { scrollProgress, reducedMotion } = useAppStore.getState()
      floaterMatrix(floaters[i], scrollProgress, t, reducedMotion ? 0.25 : 1, scale.current, m)
    },
    [floaters, scale],
  )

  return <FruitSwarm assets={assets} fruit={fruit} count={floaters.length} update={update} />
}
