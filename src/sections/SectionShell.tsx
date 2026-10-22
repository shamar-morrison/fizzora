import type { ReactNode } from 'react'

interface SectionShellProps {
  id: string
  index: number
  labelledBy: string
  children: ReactNode
  className?: string
}

/** Full-height scroll section. `index` maps it to a stop in the 3D choreography. */
export function SectionShell({ id, index, labelledBy, children, className = '' }: SectionShellProps) {
  return (
    <section id={id} data-section={index} aria-labelledby={labelledBy} className={`relative flex min-h-svh items-center py-24 ${className}`}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  )
}

/** On narrow screens the featured can floats in the top part of the viewport; copy starts below it. */
export const BELOW_CAN = 'pt-[44svh] md:pt-0'
