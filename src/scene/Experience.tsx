import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback } from 'react'
import * as THREE from 'three'
import { WebGLBoundary } from '../components/WebGLBoundary'
import { useAppStore, type PerformanceTier } from '../store/useAppStore'
import { CAMERA_FOV, CAMERA_Z } from './layout'
import { PerformanceTier as PerformanceTierMonitor } from './PerformanceTier'
import { SceneContent } from './SceneContent'

const DPR: Record<PerformanceTier, number | [number, number]> = {
  high: [1, 1.5],
  mid: [1, 1.25],
  low: 1,
}

interface ExperienceProps {
  /** Set when the tier was forced from the URL; disables automatic tier changes. */
  tierLocked: boolean
}

/** The single fixed canvas that sits behind all page content. */
export function Experience({ tierLocked }: ExperienceProps) {
  const tier = useAppStore((s) => s.tier)
  const small = useAppStore((s) => s.isSmallScreen)
  const setWebGL = useAppStore((s) => s.setWebGL)
  const fail = useCallback(() => setWebGL('failed'), [setWebGL])

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <WebGLBoundary onError={fail}>
        <Canvas
          dpr={DPR[tier]}
          shadows={small ? false : 'percentage'}
          camera={{ fov: CAMERA_FOV, position: [0, 0, CAMERA_Z], near: 0.1, far: 80 }}
          gl={{ antialias: true, powerPreference: 'high-performance', alpha: false, stencil: false }}
          eventSource={document.getElementById('root') ?? undefined}
          eventPrefix="client"
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.05
            gl.outputColorSpace = THREE.SRGBColorSpace
            // Transparent clear: ContactShadows reads alpha from its render target.
            gl.setClearColor('#000000', 0)
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault()
              fail()
            })
            setWebGL('ok')
          }}
        >
          <PerformanceTierMonitor locked={tierLocked} />
          <Suspense fallback={null}>
            <SceneContent />
          </Suspense>
        </Canvas>
      </WebGLBoundary>
    </div>
  )
}
