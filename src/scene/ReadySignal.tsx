import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'

/** Compiles shaders up front, then reports the scene ready after a couple of real frames. */
export function ReadySignal() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const compiled = useRef(false)
  const frames = useRef(0)

  useEffect(() => {
    let cancelled = false
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) compiled.current = true
      })
    return () => {
      cancelled = true
    }
  }, [gl, scene, camera])

  useFrame(() => {
    if (!compiled.current || useAppStore.getState().sceneReady) return
    frames.current += 1
    if (frames.current > 2) useAppStore.getState().setSceneReady()
  })
  return null
}
