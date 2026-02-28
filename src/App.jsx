import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import { SoulOrb } from './components/SoulOrb/SoulOrb'
import { Void } from './components/Environment/Void'
import { Overlay } from './components/Overlay/Overlay'
import { useAIState } from './hooks/useAIState'

export default function App() {
  const {
    state,
    amplitudeRef,
    transcript,
    partialTranscript,
    subtitleChunk,
    subtitleDuration
  } = useAIState()

  return (
    <>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Void />

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -5, -10]} intensity={0.5} color="#444" />

        <SoulOrb state={state} amplitudeRef={amplitudeRef} />

        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.4} luminanceSmoothing={0.95} intensity={0.8} radius={0.8} />
          <ChromaticAberration offset={[0.0005, 0.0005]} />
          <Noise opacity={0.08} />
          <Vignette eskil={false} offset={0.2} darkness={0.7} />
        </EffectComposer>
      </Canvas>

      <Overlay
        state={state}
        transcript={transcript}
        partialTranscript={partialTranscript}
        subtitleChunk={subtitleChunk}
        subtitleDuration={subtitleDuration}
        amplitudeRef={amplitudeRef}
      />
    </>
  )
}
