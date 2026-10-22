import { useEffect, useRef } from 'react'
import { useAppStore, type BurstSize } from '../../store/useAppStore'

/** Calls `onBurst` for every splash event. Reduced motion skips bursts entirely. */
export function useBurst(onBurst: (size: BurstSize) => void) {
  const handler = useRef(onBurst)
  useEffect(() => {
    handler.current = onBurst
  })
  useEffect(
    () =>
      useAppStore.subscribe((s, prev) => {
        if (s.burst.id !== prev.burst.id && !s.reducedMotion) handler.current(s.burst.size)
      }),
    [],
  )
}

export const BURST_STRENGTH: Record<BurstSize, number> = { small: 0.55, big: 1, finale: 1.25 }
