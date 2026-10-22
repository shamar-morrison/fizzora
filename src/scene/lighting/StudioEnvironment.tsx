import { Environment, Lightformer } from '@react-three/drei'

/** Procedural photo-studio environment: softboxes and strip lights that give the metal its reflections. */
export function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#0a0b0d']} />
      {/* Overhead softbox */}
      <Lightformer form="rect" intensity={2.4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} />
      {/* Tall strip lights left and right: the classic vertical highlights on a can */}
      <Lightformer form="rect" intensity={5} position={[-5, 1, 1]} scale={[0.9, 10, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={3.5} position={[5, 1, 2]} scale={[0.6, 10, 1]} target={[0, 0, 0]} />
      {/* Big soft fill behind the camera */}
      <Lightformer form="rect" intensity={0.9} position={[0, 0, 8]} scale={[10, 5, 1]} target={[0, 0, 0]} />
      {/* Back kicker and a ring for a crisp catch-light */}
      <Lightformer form="rect" intensity={2} position={[0, 2, -7]} scale={[6, 2, 1]} target={[0, 0, 0]} />
      <Lightformer form="ring" intensity={3} position={[3, 4, 5]} scale={1.2} target={[0, 0, 0]} />
      {/* Warm floor bounce */}
      <Lightformer form="rect" intensity={0.4} color="#ffe8d0" position={[0, -5, 2]} rotation-x={-Math.PI / 2} scale={[12, 6, 1]} />
    </Environment>
  )
}
