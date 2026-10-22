import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { DRINKS, type FruitKind } from '../../data/drinks'
import { damp } from '../../lib/math'
import { useAppStore } from '../../store/useAppStore'

/**
 * The fruit currently on screen plus a 0..1 scale. When the drink changes the old fruit
 * shrinks away first, then the new one grows in, so swaps never pop.
 */
export function useDisplayedFruit() {
  const active = useAppStore((s) => DRINKS[s.activeIndex].fruit)
  const [shown, setShown] = useState<FruitKind>(active)
  const scale = useRef(1)

  useFrame((_, dt) => {
    if (shown !== active) {
      scale.current = damp(scale.current, 0, 9, dt)
      if (scale.current < 0.03) setShown(active)
    } else {
      scale.current = damp(scale.current, 1, 3.5, dt)
    }
  })

  return { fruit: shown, scale }
}
