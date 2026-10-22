import gsap from 'gsap'
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useAppStore } from '../store/useAppStore'

interface RevealProps {
  children: ReactNode
  className?: string
  stagger?: number
}

/** Staggers every `[data-reveal]` descendant in when the block scrolls into view. */
/** Give it a `key` (e.g. the drink id) to replay the reveal when content changes. */
export function Reveal({ children, className, stagger = 0.08 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useAppStore((s) => s.reducedMotion)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const items = el.querySelectorAll('[data-reveal]')
    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        reducedMotion ? { opacity: 0 } : { opacity: 0, y: 40, filter: 'blur(6px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: reducedMotion ? 0.5 : 0.9,
          ease: 'power3.out',
          stagger: reducedMotion ? 0 : stagger,
          scrollTrigger: { trigger: el, start: 'top 82%', toggleActions: 'play none none reverse' },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [reducedMotion, stagger])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
