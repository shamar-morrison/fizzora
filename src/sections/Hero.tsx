import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, type PointerEvent, type WheelEvent } from 'react'
import { CanIllustration } from '../components/CanIllustration'
import { KineticHeading } from '../components/KineticHeading'
import { DRINK_COUNT, DRINKS } from '../data/drinks'
import { scrollToSection } from '../lib/scroll'
import { sceneState } from '../scene/sceneState'
import { useActiveDrink, useAppStore, wrapIndex } from '../store/useAppStore'

const EASE = [0.22, 1, 0.36, 1] as const

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

/** Pointer drag, wheel and keyboard input for the carousel. */
function useCarouselInput(staticMode: boolean) {
  const drag = useRef({ id: -1, x: 0, y: 0, lastX: 0, lastT: 0, velocity: 0, active: false })
  const wheel = useRef({ acc: 0, lockedUntil: 0 })

  const stepPx = () => Math.min(window.innerWidth * 0.35, 320)

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, lastX: e.clientX, lastT: e.timeStamp, velocity: 0, active: false }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    // Only claim clearly horizontal gestures; vertical swipes stay with the page.
    if (!d.active && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      d.active = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (!d.active) return
    const dt = Math.max(1, e.timeStamp - d.lastT)
    d.velocity = d.velocity * 0.6 + ((-(e.clientX - d.lastX) / stepPx()) * 1000 * 0.4) / dt
    d.lastX = e.clientX
    d.lastT = e.timeStamp
    sceneState.dragOffset = staticMode ? 0 : -dx / stepPx()
    if (staticMode && Math.abs(dx) > stepPx() * 0.4) {
      useAppStore.getState().rotateBy(dx < 0 ? 1 : -1)
      d.x = e.clientX
    }
  }

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (d.id !== e.pointerId) return
    if (d.active && !staticMode) {
      const projected = sceneState.dragOffset + Math.max(-1.5, Math.min(1.5, d.velocity * 0.25))
      const steps = Math.round(projected)
      sceneState.dragOffset = 0
      if (steps !== 0) useAppStore.getState().rotateBy(steps)
    }
    sceneState.dragOffset = 0
    drag.current.id = -1
  }

  const onWheel = (e: WheelEvent<HTMLElement>) => {
    const { hasSelected, rotateBy } = useAppStore.getState()
    const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
    // Once scrolling is unlocked, vertical wheel belongs to the page.
    const delta = horizontal ? e.deltaX : hasSelected ? 0 : e.deltaY
    if (!delta) return
    const now = performance.now()
    if (now < wheel.current.lockedUntil) return
    wheel.current.acc += delta
    if (Math.abs(wheel.current.acc) > 40) {
      rotateBy(wheel.current.acc > 0 ? 1 : -1)
      wheel.current = { acc: 0, lockedUntil: now + 420 }
    }
  }

  return { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag, onWheel }
}

function ArrowIcon({ direction }: { direction: 'left' | 'right' | 'down' }) {
  const rotate = direction === 'left' ? 180 : direction === 'down' ? 90 : 0
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${rotate}deg)` }} aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  )
}

/** CSS carousel shown when WebGL is unavailable. */
function StaticCarousel() {
  const activeIndex = useAppStore((s) => s.activeIndex)
  const select = useAppStore((s) => s.select)
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[14%] bottom-[36%] flex items-center justify-center md:bottom-[18%]">
      {DRINKS.map((drink, i) => {
        const raw = wrapIndex(i - activeIndex + 2) - 2
        return (
          <button
            key={drink.id}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => select(i)}
            className="pointer-events-auto absolute h-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              transform: `translateX(${raw * 62}%) scale(${raw === 0 ? 1 : 0.72})`,
              opacity: Math.abs(raw) > 1 ? 0 : raw === 0 ? 1 : 0.55,
              zIndex: 10 - Math.abs(raw),
            }}
          >
            <CanIllustration drink={drink} className="h-full w-auto drop-shadow-[0_30px_40px_rgba(0,0,0,0.5)]" />
          </button>
        )
      })}
    </div>
  )
}

export function Hero() {
  const drink = useActiveDrink()
  const activeIndex = useAppStore((s) => s.activeIndex)
  const hasSelected = useAppStore((s) => s.hasSelected)
  const rotateBy = useAppStore((s) => s.rotateBy)
  const select = useAppStore((s) => s.select)
  const focusIndex = useAppStore((s) => s.focusIndex)
  const staticMode = useAppStore((s) => s.webgl === 'failed')
  const input = useCarouselInput(staticMode)

  // Arrow keys rotate the carousel whenever the hero is on screen and focus is not in a form control.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { sectionProgress } = useAppStore.getState()
      if (sectionProgress > 0.5 || isTypingTarget(e.target) || e.defaultPrevented || e.altKey || e.metaKey) return
      if (e.key === 'ArrowLeft') rotateBy(-1)
      if (e.key === 'ArrowRight') rotateBy(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rotateBy])

  return (
    <section
      id="hero"
      data-section="0"
      aria-roledescription="carousel"
      aria-label="Choose your flavor. Use the left and right arrow keys to browse."
      className="relative h-svh min-h-[560px] overflow-hidden"
      onWheel={input.onWheel}
    >
      {/* Transparent surface over the canvas: drag to rotate, click a can to pick it. */}
      <div
        data-scene-surface
        className="absolute inset-0 touch-pan-y select-none"
        onPointerDown={input.onPointerDown}
        onPointerMove={input.onPointerMove}
        onPointerUp={input.onPointerUp}
        onPointerCancel={input.onPointerCancel}
      />
      {staticMode && <StaticCarousel />}

      <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pt-24 pb-8 sm:px-6 md:pb-12 lg:px-8">
        <div className="pointer-events-auto max-w-xl self-start">
          <p className="sr-only" aria-live="polite">
            {`${drink.name}, flavor ${activeIndex + 1} of ${DRINK_COUNT}${hasSelected ? ', picked' : ''}`}
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={drink.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18, filter: 'blur(6px)' }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              <p className="eyebrow mb-3">
                Flavor {String(activeIndex + 1).padStart(2, '0')} / {String(DRINK_COUNT).padStart(2, '0')} · {drink.fruitLabel}
              </p>
              <KineticHeading
                as="h1"
                immediate
                text={drink.name}
                className="font-display text-[2.6rem] leading-[0.95] font-extrabold tracking-tight uppercase sm:text-6xl lg:text-7xl"
              />
              <p className="mt-4 max-w-md text-base text-white/80 sm:text-lg">{drink.tagline}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="pointer-events-auto mt-6 flex flex-wrap items-center gap-3">
          <button type="button" className="btn-ghost" aria-label="Previous flavor" onClick={() => rotateBy(-1)}>
            <ArrowIcon direction="left" />
          </button>
          <button type="button" className="btn-ghost" aria-label="Next flavor" onClick={() => rotateBy(1)}>
            <ArrowIcon direction="right" />
          </button>
          <AnimatePresence mode="wait" initial={false}>
            {hasSelected ? (
              <motion.button
                key="explore"
                type="button"
                data-hero-primary
                className="btn-primary"
                onClick={() => scrollToSection('flavor-story')}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                Explore {drink.shortName}
                <motion.span animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}>
                  <ArrowIcon direction="down" />
                </motion.span>
              </motion.button>
            ) : (
              <motion.button
                key="pick"
                type="button"
                data-hero-primary
                className="btn-primary"
                onClick={() => select(activeIndex)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                Pick {drink.shortName}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="pointer-events-auto mt-5 flex items-center justify-between gap-4">
          <p className="text-xs text-white/60 sm:text-sm">
            {hasSelected ? 'Scroll to explore, or keep browsing flavors.' : 'Drag, swipe or use the arrow keys. Click a can to pick it.'}
          </p>
          <fieldset className="flex gap-2">
            <legend className="sr-only">Jump to flavor</legend>
            {DRINKS.map((d, i) => (
              <button
                key={d.id}
                type="button"
                aria-label={`Show ${d.name}`}
                aria-current={i === activeIndex}
                onClick={() => focusIndex(i)}
                className="group flex h-6 items-center"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-500 group-hover:bg-white ${i === activeIndex ? 'w-8 bg-accent-light' : 'w-3 bg-white/35'}`}
                />
              </button>
            ))}
          </fieldset>
        </div>
      </div>

      <AnimatePresence>
        {hasSelected && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-2 hidden justify-center md:flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden="true"
          >
            <div className="flex h-10 w-6 justify-center rounded-full border-2 border-white/40 pt-2">
              <motion.span className="size-1.5 rounded-full bg-white" animate={{ y: [0, 12, 0], opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1.6 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
