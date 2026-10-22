import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { DRINKS } from '../../data/drinks'
import { useQuality } from '../../hooks/useQuality'
import type { SceneAssets } from '../../lib/textures/sceneAssets'
import { useAppStore } from '../../store/useAppStore'
import { getCanGeometry } from '../can/canGeometry'
import { getCanMaterials } from '../can/canMaterials'
import { floaterMatrix, scatterFloaters } from './drift'

const matrix = new THREE.Matrix4()

/** Background cans of every flavor tumbling at depth. One instanced mesh per flavor. */
export function AmbientCans({ assets }: { assets: SceneAssets }) {
  const { ambientCans } = useQuality()
  const aspect = useThree((s) => s.size.width / s.size.height)
  const geometry = useMemo(() => getCanGeometry(), [])
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([])
  const floaters = useMemo(
    () => scatterFloaters(ambientCans, aspect, { seed: 7, zMin: -26, zMax: -11, scaleMin: 0.7, scaleMax: 1 }),
    [ambientCans, aspect],
  )
  const perDrink = useMemo(
    () => DRINKS.map((_drink, d) => floaters.map((_floater, i) => i).filter((i) => i % DRINKS.length === d)),
    [floaters],
  )

  useFrame((state) => {
    const { scrollProgress, reducedMotion } = useAppStore.getState()
    const t = state.clock.elapsedTime
    perDrink.forEach((indices, d) => {
      const mesh = meshes.current[d]
      if (!mesh) return
      indices.forEach((i, local) => {
        floaterMatrix(floaters[i], scrollProgress * 0.6, t, reducedMotion ? 0.25 : 0.7, 1, matrix)
        mesh.setMatrixAt(local, matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    })
  })

  return (
    <>
      {DRINKS.map((drink, d) =>
        perDrink[d].length === 0 ? null : (
          <instancedMesh
            key={`${drink.id}-${perDrink[d].length}`}
            ref={(m) => void (meshes.current[d] = m)}
            args={[geometry, getCanMaterials(assets, drink.id), perDrink[d].length]}
            frustumCulled={false}
            dispose={null}
          />
        ),
      )}
    </>
  )
}
