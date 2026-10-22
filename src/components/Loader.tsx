import { useProgress } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { Logo } from './Logo'

/** Branded loading screen. Tracks procedural asset generation through drei's useProgress. */
export function Loader({ webglEnabled }: { webglEnabled: boolean }) {
  const { progress } = useProgress()
  const sceneReady = useAppStore((s) => s.sceneReady)
  const webgl = useAppStore((s) => s.webgl)
  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true)).catch(() => setFontsReady(true))
  }, [])

  const done = webglEnabled && webgl !== 'failed' ? sceneReady : fontsReady
  // Every generation step is queued up front, so progress only moves forward.
  const display = done ? 100 : Math.min(99, Math.round(progress))

  useEffect(() => {
    document.documentElement.setAttribute('aria-busy', String(!done))
  }, [done])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-[#0b0507]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)', pointerEvents: 'none' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Logo className="text-4xl sm:text-5xl" />
          </motion.div>
          <div className="relative h-24 w-14 overflow-hidden rounded-[14px] border-2 border-white/25" aria-hidden="true">
            <motion.div
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-accent-deep via-accent to-accent-light"
              animate={{ height: `${display}%` }}
              transition={{ type: 'spring', stiffness: 60, damping: 18 }}
            />
            <div className="absolute inset-x-2 top-1.5 h-1 rounded-full bg-white/30" />
          </div>
          <p aria-live="polite" className="font-display text-xs font-semibold tracking-[0.35em] text-white/70 uppercase">
            Chilling the cans <span className="tabular-nums text-white">{display}%</span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
