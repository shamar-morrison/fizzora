import { useFrame } from '@react-three/fiber'
import { damp, smoothstep } from '../lib/math'
import { useAppStore } from '../store/useAppStore'
import { CAMERA_Z } from './layout'
import { sceneState } from './sceneState'

/** Dollies in when a drink is picked and adds a soft parallax drift following the pointer. */
export function CameraRig() {
  useFrame((state, dt) => {
    const { hasSelected, sectionProgress: s, reducedMotion } = useAppStore.getState()
    const cam = state.camera
    const hero = 1 - smoothstep(0, 1, s)
    const narrow = state.size.width / state.size.height < 0.8
    const motion = reducedMotion ? 0.2 : 1
    const dolly = hasSelected ? (narrow ? 0.5 : 1.9) * hero : 0
    const p = sceneState.pointer
    cam.position.x = damp(cam.position.x, p.x * 0.35 * motion, 2.5, dt)
    cam.position.y = damp(cam.position.y, p.y * 0.2 * motion + hero * 0.45, 2.5, dt)
    cam.position.z = damp(cam.position.z, CAMERA_Z - dolly, 2.2, dt)
    cam.lookAt(0, hero * (narrow ? 0.45 : 0.3) + (hasSelected ? 0.15 * hero : 0), 0)
  })
  return null
}
