import * as THREE from 'three'

let cached: THREE.BufferGeometry | null = null

/**
 * Unit teardrop: a round head of radius 1 at the origin and a tail tapering to a point along -Y.
 * Pointing +Y along the velocity makes a flying drop trail its tail.
 */
export function getDropletGeometry() {
  if (cached) return cached
  const points: THREE.Vector2[] = []
  const TAIL = 1.2
  for (let i = 0; i <= 8; i++) {
    // Tail: from the tip up to the widest point, a smooth cosine taper.
    const s = 1 - i / 8
    points.push(new THREE.Vector2(Math.pow(Math.cos((s * Math.PI) / 2), 1.3), -TAIL * s))
  }
  for (let i = 1; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2)
    points.push(new THREE.Vector2(Math.cos(a), Math.sin(a)))
  }
  points[points.length - 1].x = 0
  cached = new THREE.LatheGeometry(points, 12)
  return cached
}
