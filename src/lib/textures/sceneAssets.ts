import * as THREE from 'three'
import { DRINKS, type DrinkId } from '../../data/drinks'
import { toTexture } from './canvas'
import { createBrushedNormal, createLabelSurfaceMaps, createLidNormal, createMetalRoughness } from './canTextures'
import { CITRUS_PALETTES, createPeelNormal, createSkinNormal, drawCitrusFace, drawCitrusWedgeFace } from './fruitTextures'
import { BODY_FONT, DISPLAY_FONT, drawLabel, drawLabelMetalMask } from './labelTexture'

export interface SceneAssets {
  labels: Record<DrinkId, THREE.Texture>
  labelNormal: THREE.Texture
  labelSurface: THREE.Texture
  brushedNormal: THREE.Texture
  metalRoughness: THREE.Texture
  lidNormal: THREE.Texture
  citrusFace: Record<'lime' | 'orange', THREE.Texture>
  citrusWedge: Record<'lime' | 'orange', THREE.Texture>
  peelNormal: THREE.Texture
  skinNormal: THREE.Texture
}

const manager = THREE.DefaultLoadingManager

/** Yields to the browser between heavy generation steps so the loader keeps animating. */
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/** Runs one generation step and reports it to the default loading manager, which drei's useProgress observes. */
async function step<T>(name: string, run: () => T): Promise<T> {
  manager.itemStart(name)
  await nextFrame()
  try {
    return run()
  } finally {
    manager.itemEnd(name)
  }
}

async function loadFonts() {
  const fonts = [`800 64px ${DISPLAY_FONT}`, `900 64px ${DISPLAY_FONT}`, `400 32px ${BODY_FONT}`, `600 32px ${BODY_FONT}`]
  try {
    await Promise.all(fonts.map((f) => document.fonts.load(f)))
  } catch {
    // Fallback fonts in the stack still produce a readable label.
  }
}

async function generate(): Promise<SceneAssets> {
  // Register every step up front so progress moves forward instead of jumping between totals.
  const names = ['fonts', ...DRINKS.map((d) => `label-${d.id}`), 'condensation', 'metal', 'fruit']
  names.forEach((n) => manager.itemStart(`queue-${n}`))
  const done = (n: string) => manager.itemEnd(`queue-${n}`)

  await step('fonts', loadFonts)
  done('fonts')

  const labelWidth = Math.min(window.innerWidth, window.innerHeight) < 700 ? 1024 : 2048
  const labels = {} as Record<DrinkId, THREE.Texture>
  for (const drink of DRINKS) {
    labels[drink.id] = await step(`label-${drink.id}`, () => toTexture(drawLabel(drink, labelWidth), { srgb: true, anisotropy: 16 }))
    done(`label-${drink.id}`)
  }

  const maps = await step('condensation', () => createLabelSurfaceMaps(labelWidth, drawLabelMetalMask(labelWidth)))
  done('condensation')

  const metal = await step('metal', () => ({
    brushedNormal: toTexture(createBrushedNormal(), { repeat: [6, 3] }),
    metalRoughness: toTexture(createMetalRoughness()),
    lidNormal: toTexture(createLidNormal()),
  }))
  done('metal')

  const fruit = await step('fruit', () => ({
    citrusFace: {
      lime: toTexture(drawCitrusFace(CITRUS_PALETTES.lime), { srgb: true }),
      orange: toTexture(drawCitrusFace(CITRUS_PALETTES.orange), { srgb: true }),
    },
    citrusWedge: {
      lime: toTexture(drawCitrusWedgeFace(CITRUS_PALETTES.lime), { srgb: true }),
      orange: toTexture(drawCitrusWedgeFace(CITRUS_PALETTES.orange), { srgb: true }),
    },
    peelNormal: toTexture(createPeelNormal(), { repeat: [3, 3] }),
    skinNormal: toTexture(createSkinNormal(), { repeat: [2, 2] }),
  }))
  done('fruit')

  return {
    labels,
    labelNormal: toTexture(maps.normal),
    labelSurface: toTexture(maps.surface),
    ...metal,
    ...fruit,
  }
}

let assetsPromise: Promise<SceneAssets> | null = null

/** Generates every procedural texture once; later calls share the same promise. */
export function loadSceneAssets() {
  assetsPromise ??= generate()
  return assetsPromise
}
