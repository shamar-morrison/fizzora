interface LogoProps {
  className?: string
}

/** Wordmark with a bubble dot over the "i". */
export function Logo({ className = '' }: LogoProps) {
  return (
    <span className={`relative inline-flex items-baseline font-display text-xl font-extrabold tracking-tight sm:text-2xl ${className}`}>
      FIZZORA
      <span aria-hidden="true" className="ml-1 inline-block size-2 rounded-full bg-accent shadow-[0_0_12px_var(--accent)] transition-colors duration-700" />
    </span>
  )
}
