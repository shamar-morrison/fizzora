import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js'
import { LiquidMaterial } from './LiquidMaterial'

/** Adds a ball at a world position with a world radius. */
export type AddBall = (x: number, y: number, z: number, radius: number) => void

interface MetaballSurfaceProps {
  resolution: number
  /** Called every frame to collect this frame's balls. */
  fill: (add: AddBall) => void
  /** Smallest and largest cube side a surface may use, in world units. */
  minSide: number
  maxSide: number
  /** Separate grids available; clumps of liquid far apart each get their own so detail stays fine. */
  surfaces?: number
  /** Clumps are packed into one grid while it stays at most this wide. */
  packSide?: number
  thickness?: number
  maxPolyCount?: number
}

const MAX_BALLS = 256
const ISOLATION = 80
const SUBTRACT = 12
/** How far a ball's field reaches, as a multiple of its surface radius. */
const REACH = Math.sqrt((ISOLATION + SUBTRACT) / SUBTRACT)
const SIDE_STEP = 1.25
const placeholder = new THREE.MeshBasicMaterial()

/** Same field as MarchingCubes.addBall, without its per-call Color allocation and palette writes. */
function addFieldBall(mc: MarchingCubes, bx: number, by: number, bz: number, strength: number) {
  const size = mc.size
  const field = mc.field
  const reach = size * Math.sqrt(strength / SUBTRACT)
  const xs = bx * size
  const ys = by * size
  const zs = bz * size
  const minX = Math.max(1, Math.floor(xs - reach))
  const maxX = Math.min(size - 1, Math.floor(xs + reach))
  const minY = Math.max(1, Math.floor(ys - reach))
  const maxY = Math.min(size - 1, Math.floor(ys + reach))
  const minZ = Math.max(1, Math.floor(zs - reach))
  const maxZ = Math.min(size - 1, Math.floor(zs + reach))
  for (let z = minZ; z < maxZ; z++) {
    const fz = z / size - bz
    const fz2 = fz * fz
    const zOffset = mc.size2 * z
    for (let y = minY; y < maxY; y++) {
      const fy = y / size - by
      const fyz = fy * fy + fz2
      const offset = zOffset + size * y
      for (let x = minX; x < maxX; x++) {
        const fx = x / size - bx
        const val = strength / (0.000001 + fx * fx + fyz) - SUBTRACT
        if (val > 0) field[offset + x] += val
      }
    }
  }
}

interface Group {
  minX: number
  minY: number
  minZ: number
  maxX: number
  maxY: number
  maxZ: number
  maxR: number
}

const emptyGroup = (): Group => ({ minX: Infinity, minY: Infinity, minZ: Infinity, maxX: -Infinity, maxY: -Infinity, maxZ: -Infinity, maxR: 0 })

function resetGroup(g: Group) {
  g.minX = g.minY = g.minZ = Infinity
  g.maxX = g.maxY = g.maxZ = -Infinity
  g.maxR = 0
}

function mergeInto(g: Group, o: Group) {
  g.minX = Math.min(g.minX, o.minX)
  g.minY = Math.min(g.minY, o.minY)
  g.minZ = Math.min(g.minZ, o.minZ)
  g.maxX = Math.max(g.maxX, o.maxX)
  g.maxY = Math.max(g.maxY, o.maxY)
  g.maxZ = Math.max(g.maxZ, o.maxZ)
  g.maxR = Math.max(g.maxR, o.maxR)
}

/** Cube side needed to hold a group with room for every field to fall off to zero. */
const groupSide = (g: Group) => Math.max(g.maxX - g.minX, g.maxY - g.minY, g.maxZ - g.minZ) + 2 * g.maxR * REACH

/** Side of the union of two groups, without building it. */
function unionSide(a: Group, b: Group) {
  const ext = Math.max(
    Math.max(a.maxX, b.maxX) - Math.min(a.minX, b.minX),
    Math.max(a.maxY, b.maxY) - Math.min(a.minY, b.minY),
    Math.max(a.maxZ, b.maxZ) - Math.min(a.minZ, b.minZ),
  )
  return ext + 2 * Math.max(a.maxR, b.maxR) * REACH
}

/**
 * Liquid surface wrapped around a set of metaballs. Balls closer than about twice their radius merge,
 * so streams neck and pinch off by themselves. Balls are split into clumps whose fields never touch;
 * nearby clumps share a grid and far-apart ones get their own, and each grid fits itself to its balls
 * every frame, so the surface stays finely detailed however far the liquid spreads.
 */
export function MetaballSurface({
  resolution,
  fill,
  minSide,
  maxSide,
  surfaces = 1,
  packSide = maxSide,
  thickness = 0.4,
  maxPolyCount = 24000,
}: MetaballSurfaceProps) {
  const grids = useMemo(
    () =>
      Array.from({ length: surfaces }, () => {
        const m = new MarchingCubes(resolution, placeholder, false, false, maxPolyCount)
        m.isolation = ISOLATION
        m.frustumCulled = false
        // Visible but empty until the first frame, so the loader's shader precompile includes it
        // and the first splash doesn't stall on a compile.
        m.geometry.setDrawRange(0, 0)
        return m
      }),
    [resolution, maxPolyCount, surfaces],
  )
  useEffect(() => () => grids.forEach((m) => m.geometry.dispose()), [grids])

  const balls = useMemo(() => new Float32Array(MAX_BALLS * 4), [])
  const count = useRef(0)
  const add = useMemo<AddBall>(
    () => (x, y, z, radius) => {
      if (count.current >= MAX_BALLS || radius <= 0) return
      const i = count.current++ * 4
      balls[i] = x
      balls[i + 1] = y
      balls[i + 2] = z
      balls[i + 3] = radius
    },
    [balls],
  )
  const work = useMemo(
    () => ({
      parent: new Int16Array(MAX_BALLS),
      clumpOf: new Int16Array(MAX_BALLS),
      clumps: Array.from({ length: MAX_BALLS }, emptyGroup),
      clumpSize: new Int16Array(MAX_BALLS),
      order: [] as number[],
      groupOf: new Int16Array(MAX_BALLS),
      assigned: new Int16Array(MAX_BALLS),
      groups: Array.from({ length: surfaces }, emptyGroup),
    }),
    [surfaces],
  )

  useFrame(() => {
    count.current = 0
    fill(add)
    const n = count.current
    const { parent, clumpOf, clumps, clumpSize, order, groupOf, assigned, groups } = work

    // Clumps: balls whose fields overlap, by union-find.
    const find = (i: number) => {
      while (parent[i] !== i) i = parent[i] = parent[parent[i]]
      return i
    }
    for (let i = 0; i < n; i++) parent[i] = i
    for (let i = 0; i < n; i++) {
      const ia = i * 4
      for (let j = i + 1; j < n; j++) {
        const ja = j * 4
        const reach = (balls[ia + 3] + balls[ja + 3]) * REACH
        const dx = balls[ia] - balls[ja]
        const dy = balls[ia + 1] - balls[ja + 1]
        const dz = balls[ia + 2] - balls[ja + 2]
        if (dx * dx + dy * dy + dz * dz < reach * reach) {
          const a = find(i)
          const b = find(j)
          if (a !== b) parent[a] = b
        }
      }
    }
    let clumpCount = 0
    for (let i = 0; i < n; i++) clumpOf[i] = -1
    for (let i = 0; i < n; i++) {
      const root = find(i)
      if (clumpOf[root] < 0) {
        clumpOf[root] = clumpCount
        resetGroup(clumps[clumpCount])
        clumpSize[clumpCount] = 0
        clumpCount++
      }
      const c = clumpOf[root]
      clumpOf[i] = c
      const g = clumps[c]
      const b = i * 4
      g.minX = Math.min(g.minX, balls[b])
      g.maxX = Math.max(g.maxX, balls[b])
      g.minY = Math.min(g.minY, balls[b + 1])
      g.maxY = Math.max(g.maxY, balls[b + 1])
      g.minZ = Math.min(g.minZ, balls[b + 2])
      g.maxZ = Math.max(g.maxZ, balls[b + 2])
      g.maxR = Math.max(g.maxR, balls[b + 3])
      clumpSize[c]++
    }

    // Pack clumps into grids, biggest first: join the grid that grows least while it stays under packSide,
    // otherwise open a new grid, and once all are open join whichever grows least.
    order.length = 0
    for (let c = 0; c < clumpCount; c++) order.push(c)
    order.sort((a, b) => clumpSize[b] - clumpSize[a])
    let used = 0
    for (const c of order) {
      let best = -1
      let bestSide = Infinity
      for (let g = 0; g < used; g++) {
        const side = unionSide(groups[g], clumps[c])
        if (side < bestSide) {
          bestSide = side
          best = g
        }
      }
      if (best < 0 || (bestSide > packSide && used < surfaces)) {
        best = used++
        resetGroup(groups[best])
      }
      mergeInto(groups[best], clumps[c])
      assigned[c] = best
    }
    for (let i = 0; i < n; i++) groupOf[i] = assigned[clumpOf[i]]

    for (let g = 0; g < surfaces; g++) {
      const mc = grids[g]
      mc.visible = g < used
      if (!mc.visible) continue
      const group = groups[g]
      // Room for the two outer cells marching cubes skips, then step the size and snap the centre
      // to the grid so the triangulation doesn't shimmer frame to frame.
      const padded = groupSide(group) / (1 - 4 / resolution)
      const steps = Math.max(0, Math.ceil(Math.log(padded / minSide) / Math.log(SIDE_STEP)))
      const side = Math.min(maxSide, minSide * Math.pow(SIDE_STEP, steps))
      const cell = side / resolution
      const cx = Math.round((group.minX + group.maxX) / 2 / cell) * cell
      const cy = Math.round((group.minY + group.maxY) / 2 / cell) * cell
      const cz = Math.round((group.minZ + group.maxZ) / 2 / cell) * cell

      mc.reset()
      for (let i = 0; i < n; i++) {
        if (groupOf[i] !== g) continue
        const b = i * 4
        const r = balls[b + 3] / side
        addFieldBall(mc, (balls[b] - cx) / side + 0.5, (balls[b + 1] - cy) / side + 0.5, (balls[b + 2] - cz) / side + 0.5, (ISOLATION + SUBTRACT) * r * r)
      }
      mc.update()
      mc.position.set(cx, cy, cz)
      mc.scale.setScalar(side / 2)
      // three scales transmission thickness by the mesh scale; keep it constant while the cube resizes.
      if (mc.material instanceof THREE.MeshPhysicalMaterial) mc.material.thickness = (thickness * 2) / side
    }
  })

  return (
    <>
      {grids.map((mc) => (
        <primitive key={mc.uuid} object={mc}>
          <LiquidMaterial thickness={thickness} />
        </primitive>
      ))}
    </>
  )
}
