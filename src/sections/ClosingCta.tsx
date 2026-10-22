import { CanIllustration } from '../components/CanIllustration'
import { KineticHeading } from '../components/KineticHeading'
import { Reveal } from '../components/Reveal'
import { DRINKS } from '../data/drinks'
import { scrollToElement } from '../lib/scroll'
import { useAppStore } from '../store/useAppStore'
import { SectionShell } from './SectionShell'

export function ClosingCta() {
  const staticMode = useAppStore((s) => s.webgl === 'failed')

  const backToCarousel = () => {
    scrollToElement(0)
    // Hand keyboard focus to the carousel once the scroll has had a moment to start.
    window.setTimeout(() => document.querySelector<HTMLElement>('[data-hero-primary]')?.focus({ preventScroll: true }), 300)
  }

  return (
    <SectionShell id="closing" index={6} labelledBy="closing-title" className="items-end">
      <Reveal className="mx-auto max-w-3xl pt-[46svh] text-center md:pt-[52svh]">
        {staticMode && (
          <div className="mb-8 flex justify-center gap-2" aria-hidden="true">
            {DRINKS.map((d) => (
              <CanIllustration key={d.id} drink={d} className="h-36 w-auto" />
            ))}
          </div>
        )}
        <p className="eyebrow" data-reveal>
          Five flavors · Zero sugar · All fizz
        </p>
        <KineticHeading
          id="closing-title"
          text="Which one are you?"
          className="mt-4 font-display text-4xl leading-[1.02] font-extrabold tracking-tight uppercase sm:text-6xl"
        />
        <p className="mx-auto mt-5 max-w-md text-white/75" data-reveal>
          Cherry, lime, orange, blueberry or grape. Grab a cold one and go.
        </p>
        <div className="mt-8 flex justify-center" data-reveal>
          <button type="button" className="btn-primary" onClick={backToCarousel}>
            Pick your flavor
          </button>
        </div>
      </Reveal>
    </SectionShell>
  )
}
