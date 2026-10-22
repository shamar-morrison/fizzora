/** Background used when WebGL is unavailable: the same theme glow, painted with CSS. */
export function StaticBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 transition-colors duration-700"
      style={{
        background:
          'radial-gradient(ellipse 70% 60% at 50% 45%, color-mix(in oklab, var(--accent) 45%, transparent), transparent 70%), radial-gradient(circle at 10% 90%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 50%), var(--bg)',
      }}
    />
  )
}
