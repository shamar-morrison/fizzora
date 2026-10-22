import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'

interface CountUpProps {
  value: number
  suffix?: string
  className?: string
}

/** Counts up the first time it scrolls into view, then tweens between values when the drink changes. */
export function CountUp({ value, suffix = '', className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const current = useRef({ v: 0 })
  const started = useRef(false)
  const reducedMotion = useAppStore((s) => s.reducedMotion)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const render = () => (el.textContent = `${Math.round(current.current.v)}${suffix}`)
    const animate = () => {
      started.current = true
      gsap.to(current.current, { v: value, duration: reducedMotion ? 0 : 1.6, ease: 'power3.out', onUpdate: render, overwrite: true })
    }
    if (started.current) {
      animate()
      return
    }
    render()
    const trigger = ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: animate })
    return () => trigger.kill()
  }, [value, suffix, reducedMotion])

  return (
    <span className={className}>
      <span className="sr-only">{`${value}${suffix}`}</span>
      <span ref={ref} aria-hidden="true" className="tabular-nums" />
    </span>
  )
}
