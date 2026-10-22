import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import type { PointerEvent, ReactNode } from 'react'
import { useAppStore } from '../store/useAppStore'

interface TiltCardProps {
  children: ReactNode
  className?: string
}

/** Card that tilts toward the pointer in 3D with a moving glare. */
export function TiltCard({ children, className = '' }: TiltCardProps) {
  const reducedMotion = useAppStore((s) => s.reducedMotion)
  const rx = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 })
  const ry = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 })
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.18), transparent 55%)`

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || e.pointerType === 'touch') return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    ry.set((px - 0.5) * 16)
    rx.set(-(py - 0.5) * 16)
    gx.set(px * 100)
    gy.set(py * 100)
  }
  const onLeave = () => {
    rx.set(0)
    ry.set(0)
  }

  return (
    <div className="[perspective:900px]" onPointerMove={onMove} onPointerLeave={onLeave}>
      <motion.div style={{ rotateX: rx, rotateY: ry }} className={`relative transform-3d ${className}`}>
        {children}
        <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: glare }} />
      </motion.div>
    </div>
  )
}
