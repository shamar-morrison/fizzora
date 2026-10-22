import { Loader } from './components/Loader'
import { SiteHeader } from './components/SiteHeader'
import { SmoothScroll } from './components/SmoothScroll'
import { StaticBackdrop } from './components/StaticBackdrop'
import { ThemeSync } from './components/ThemeSync'
import { useEnvironmentSync } from './hooks/useEnvironmentSync'
import { Experience } from './scene/Experience'
import { ClosingCta } from './sections/ClosingCta'
import { Features } from './sections/Features'
import { FlavorStory } from './sections/FlavorStory'
import { FlavorWheel } from './sections/FlavorWheel'
import { Hero } from './sections/Hero'
import { Ingredients } from './sections/Ingredients'
import { Nutrition } from './sections/Nutrition'
import { useAppStore } from './store/useAppStore'

interface AppProps {
  webglSupported: boolean
  tierLocked: boolean
}

export function App({ webglSupported, tierLocked }: AppProps) {
  useEnvironmentSync()
  const webglFailed = useAppStore((s) => s.webgl === 'failed')
  const hasSelected = useAppStore((s) => s.hasSelected)
  const use3D = webglSupported && !webglFailed

  return (
    <>
      <ThemeSync />
      <SmoothScroll />
      {use3D ? <Experience tierLocked={tierLocked} /> : <StaticBackdrop />}
      <SiteHeader />
      <main id="main" className="relative z-10">
        <Hero />
        {/* Below-the-fold content stays inert until a flavor is picked, matching the scroll lock. */}
        <div inert={!hasSelected}>
          <FlavorStory />
          <Ingredients />
          <Nutrition />
          <Features />
          <FlavorWheel />
          <ClosingCta />
          <footer className="relative mx-auto max-w-7xl px-4 pt-8 pb-10 text-sm text-white/60 sm:px-6 lg:px-8">
            <p>Fizzora is a fictional brand created for a design and engineering demo. No products are for sale.</p>
          </footer>
        </div>
      </main>
      <Loader webglEnabled={use3D} />
    </>
  )
}
