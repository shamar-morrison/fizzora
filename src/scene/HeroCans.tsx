import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { DRINK_COUNT, DRINKS } from '../data/drinks'
import { damp, smoothstep, stepSpring, wrapAngle, type SpringState } from '../lib/math'
import type { SceneAssets } from '../lib/textures/sceneAssets'
import { useAppStore, wrapIndex } from '../store/useAppStore'
import { CAN, getCanGeometry } from './can/canGeometry'
import { getCanMaterials } from './can/canMaterials'
import { carouselPose, emptyPose, finalePose, lerpPose, parkedPose, sectionPose, type Pose, type Viewport } from './layout'
import { sceneState } from './sceneState'

interface HeroCansProps {
  assets: SceneAssets
  castShadows: boolean
}

interface CanMotion {
  pose: Pose
  lift: number
}

const scratch = { carousel: emptyPose(), section: emptyPose(), finale: emptyPose(), parked: emptyPose(), out: emptyPose() }
const topLocal = new THREE.Vector3(0, CAN.height / 2, 0)

/** True when a pointer event started on the page's canvas surface rather than on DOM UI layered over it. */
function fromSceneSurface(e: ThreeEvent<MouseEvent | PointerEvent>) {
  const target = e.nativeEvent.target
  return target instanceof Element && target.closest('[data-scene-surface]') !== null
}

/**
 * The five featured cans. One continuous pose function covers every state:
 * carousel (s = 0), featured can through the sections (1..5) and the finale line-up (6).
 */
export function HeroCans({ assets, castShadows }: HeroCansProps) {
  const geometry = useMemo(() => getCanGeometry(), [])
  const materials = useMemo(() => DRINKS.map((d) => getCanMaterials(assets, d.id)), [assets])
  const groups = useRef<(THREE.Group | null)[]>([])
  const size = useThree((s) => s.size)
  const rotation = useRef<SpringState>({ value: 0, velocity: 0 })
  const spin = useRef<SpringState>({ value: 0, velocity: 0 })
  const spinTarget = useRef(0)
  const motion = useRef<CanMotion[]>(DRINKS.map(() => ({ pose: emptyPose(), lift: 0 })))
  const hovered = useRef<number | null>(null)
  const initialized = useRef(false)

  // Each explicit pick adds a full turn to the featured can.
  useEffect(
    () =>
      useAppStore.subscribe((s, prev) => {
        if (s.selectionNonce !== prev.selectionNonce) spinTarget.current += Math.PI * 2
      }),
    [],
  )

  useEffect(() => () => void (document.body.style.cursor = ''), [])

  useFrame((state, dt) => {
    const { carouselTarget, activeIndex, sectionProgress: s, hasSelected, reducedMotion } = useAppStore.getState()
    const vp: Viewport = { aspect: size.width / size.height, narrow: size.width / size.height < 0.8 }
    const rot = stepSpring(rotation.current, carouselTarget + sceneState.dragOffset, dt, reducedMotion ? 60 : 90, reducedMotion ? 16 : 15)
    const spinValue = stepSpring(spin.current, spinTarget.current, dt, 40, 9)
    const t = state.clock.elapsedTime
    const heroWeight = 1 - smoothstep(0, 1, s)
    const finaleWeight = smoothstep(5, 6, s)
    const pointer = sceneState.pointer
    const motionScale = reducedMotion ? 0.3 : 1

    for (let i = 0; i < DRINK_COUNT; i++) {
      const group = groups.current[i]
      if (!group) continue
      const isActive = i === activeIndex
      const offset = i - rot
      // Shortest signed distance around the ring.
      const wrapped = offset - Math.round(offset / DRINK_COUNT) * DRINK_COUNT
      carouselPose(wrapped, vp, scratch.carousel)
      const frontness = Math.max(0, 1 - Math.abs(wrapped))

      // Float, cursor tilt and the selection lift only apply on the hero stage.
      scratch.carousel.y += Math.sin(t * 1.3 + i * 1.7) * 0.06 * motionScale
      scratch.carousel.rx += -pointer.y * 0.18 * frontness * motionScale
      scratch.carousel.ry += pointer.x * 0.45 * frontness * motionScale + Math.sin(t * 0.4 + i) * 0.08 * motionScale
      if (hovered.current === i && !hasSelected) scratch.carousel.scale *= 1.04

      const slot = wrapIndex(i - activeIndex + 2) - 2
      finalePose(slot, vp, scratch.finale)
      scratch.finale.y += Math.sin(t * 1.1 + i) * 0.08 * motionScale

      let pose: Pose
      if (isActive) {
        sectionPose(Math.min(5, Math.max(1, s)), vp, scratch.section)
        // Slow showcase spin while scrolling, plus the extra turn on each pick.
        scratch.section.ry = t * 0.35 * motionScale + s * Math.PI * 0.75
        scratch.section.rx = 0.1 + Math.sin(t * 0.6) * 0.05 * motionScale
        scratch.section.y += Math.sin(t * 0.9) * 0.08 * motionScale
        if (s < 1) pose = lerpPose(scratch.carousel, scratch.section, smoothstep(0, 1, s), scratch.out)
        else if (s < 5) pose = scratch.section
        else pose = lerpPose(scratch.section, scratch.finale, finaleWeight, scratch.out)
        // Only the unfinished part of the pick spin, so switching cans never replays old turns.
        pose.ry += spinValue - spinTarget.current
      } else {
        parkedPose(i, scratch.parked)
        scratch.parked.ry += t * 0.2
        if (s < 1) pose = lerpPose(scratch.carousel, scratch.parked, smoothstep(0, 1, s), scratch.out)
        else if (s < 5) pose = scratch.parked
        else pose = lerpPose(scratch.parked, scratch.finale, finaleWeight, scratch.out)
      }

      const m = motion.current[i]
      const liftTarget = isActive && hasSelected ? (vp.narrow ? 0.1 : 0.32) * heroWeight : 0
      m.lift = damp(m.lift, liftTarget, 5, dt)
      const lambda = initialized.current ? 7 : 1000
      m.pose.x = damp(m.pose.x, pose.x, lambda, dt)
      m.pose.y = damp(m.pose.y, pose.y + m.lift, lambda, dt)
      m.pose.z = damp(m.pose.z, pose.z, lambda, dt)
      m.pose.rx = damp(m.pose.rx, pose.rx, lambda, dt)
      const ryTarget = m.pose.ry + wrapAngle(pose.ry - m.pose.ry)
      m.pose.ry = damp(m.pose.ry, ryTarget, lambda, dt)
      m.pose.rz = damp(m.pose.rz, pose.rz, lambda, dt)
      m.pose.scale = damp(m.pose.scale, pose.scale, lambda, dt)

      group.position.set(m.pose.x, m.pose.y, m.pose.z)
      group.rotation.set(m.pose.rx, m.pose.ry, m.pose.rz)
      group.scale.setScalar(m.pose.scale)
      group.visible = m.pose.y < 9

      if (isActive) {
        group.updateMatrixWorld()
        sceneState.canCenter.setFromMatrixPosition(group.matrixWorld)
        sceneState.canTop.copy(topLocal).applyMatrix4(group.matrixWorld)
        sceneState.canScale = m.pose.scale
      }
    }
    initialized.current = true
  })

  const handleClick = (index: number) => (e: ThreeEvent<MouseEvent>) => {
    const { sectionProgress, select } = useAppStore.getState()
    // Ignore drags and clicks that landed on buttons or text above the canvas.
    if (sectionProgress > 0.5 || e.delta > 6 || !fromSceneSurface(e)) return
    e.stopPropagation()
    select(index)
  }

  const handleOver = (index: number) => (e: ThreeEvent<PointerEvent>) => {
    if (useAppStore.getState().sectionProgress > 0.5 || !fromSceneSurface(e)) return
    e.stopPropagation()
    hovered.current = index
    document.body.style.cursor = 'pointer'
  }

  const handleOut = (index: number) => () => {
    if (hovered.current === index) hovered.current = null
    document.body.style.cursor = ''
  }

  return (
    <>
      {DRINKS.map((drink, i) => (
        <group key={drink.id} ref={(g) => void (groups.current[i] = g)}>
          <mesh
            geometry={geometry}
            material={materials[i]}
            castShadow={castShadows}
            onClick={handleClick(i)}
            onPointerOver={handleOver(i)}
            onPointerOut={handleOut(i)}
            dispose={null}
          />
        </group>
      ))}
    </>
  )
}
