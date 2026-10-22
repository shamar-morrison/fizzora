import { useEffect } from 'react'
import { REDUCED_MOTION_QUERY, SMALL_SCREEN_QUERY } from '../lib/device'
import { sceneState } from '../scene/sceneState'
import { useAppStore } from '../store/useAppStore'

/** Keeps reduced-motion and screen-size flags live, and tracks the pointer for scene parallax. */
export function useEnvironmentSync() {
  useEffect(() => {
    const motion = window.matchMedia(REDUCED_MOTION_QUERY)
    const small = window.matchMedia(SMALL_SCREEN_QUERY)
    const forcedReduced = new URLSearchParams(window.location.search).has('reduced-motion')
    const sync = () =>
      useAppStore.getState().setEnvironment({ reducedMotion: forcedReduced || motion.matches, isSmallScreen: small.matches })
    motion.addEventListener('change', sync)
    small.addEventListener('change', sync)

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      sceneState.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    return () => {
      motion.removeEventListener('change', sync)
      small.removeEventListener('change', sync)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [])
}
