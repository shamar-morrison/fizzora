import { AnimatePresence, motion } from 'framer-motion'
import { scrollToElement } from '../lib/scroll'
import { useAppStore } from '../store/useAppStore'
import { DrinkSelector } from './DrinkSelector'
import { Logo } from './Logo'

export function SiteHeader() {
  const hasSelected = useAppStore((s) => s.hasSelected)
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <a
        href="#main"
        className="sr-only rounded-full bg-white px-4 py-2 font-semibold text-black focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => scrollToElement(0)}
          className="rounded-lg transition-opacity hover:opacity-80"
          aria-label="Fizzora, back to top"
        >
          <Logo />
        </button>
        <AnimatePresence>
          {hasSelected && (
            <motion.nav
              aria-label="Flavor"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <DrinkSelector />
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
