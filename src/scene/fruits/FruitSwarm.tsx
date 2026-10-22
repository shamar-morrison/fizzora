import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { FruitKind } from '../../data/drinks'
import type { SceneAssets } from '../../lib/textures/sceneAssets'
import { FRUIT_PIECES, getFruitPieces, type PieceKind } from './fruitPieces'

/** Writes the world matrix for instance `index` (global across piece kinds). */
export type SwarmUpdater = (index: number, kind: PieceKind, matrix: THREE.Matrix4, time: number, dt: number) => void

interface FruitSwarmProps {
  assets: SceneAssets
  fruit: FruitKind
  count: number
  update: SwarmUpdater
}

interface Batch {
  kind: PieceKind
  /** Global indices of the instances drawn by this batch. */
  indices: number[]
}

const matrix = new THREE.Matrix4()

/** Instanced fruit pieces of one fruit type. Instances are spread round-robin over the fruit's piece kinds. */
export function FruitSwarm({ assets, fruit, count, update }: FruitSwarmProps) {
  const pieces = getFruitPieces(assets)
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([])
  const batches = useMemo<Batch[]>(() => {
    const kinds = FRUIT_PIECES[fruit]
    const unique = [...new Set(kinds)]
    return unique.map((kind) => ({
      kind,
      indices: Array.from({ length: count }, (_, i) => i).filter((i) => kinds[i % kinds.length] === kind),
    }))
  }, [fruit, count])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    batches.forEach((batch, b) => {
      const mesh = meshes.current[b]
      if (!mesh) return
      batch.indices.forEach((index, local) => {
        update(index, batch.kind, matrix, t, dt)
        mesh.setMatrixAt(local, matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    })
  })

  return (
    <>
      {batches.map((batch, b) =>
        batch.indices.length === 0 ? null : (
          <instancedMesh
            key={`${batch.kind}-${count}`}
            ref={(m) => void (meshes.current[b] = m)}
            args={[pieces[batch.kind].geometry, pieces[batch.kind].materials, batch.indices.length]}
            frustumCulled={false}
            dispose={null}
          />
        ),
      )}
    </>
  )
}
