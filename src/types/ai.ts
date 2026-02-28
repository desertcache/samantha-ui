import * as THREE from 'three'

/**
 * AI state machine states representing the assistant's current activity
 */
export type AIState = 'LISTENING' | 'THINKING' | 'SPEAKING'

/**
 * Context object containing all AI state and real-time metrics
 */
export interface AIContext {
  /** Current state of the AI assistant */
  state: AIState
  /** Voice amplitude (0.0 to 1.0) used for visual feedback during speech */
  amplitude: number
  /** Energy level (0.0 to 1.0) determining orb animation intensity */
  energy: number
  /** Complete transcript text from the current conversation turn */
  transcript: string
  /** Partial transcript text being accumulated in real-time */
  partialTranscript: string
  /** AI's current spoken response text for subtitles */
  aiResponse: string
  /** Current text chunk being spoken (for word-by-word reveal) */
  subtitleChunk: string
  /** Duration of current chunk in seconds (for timing word reveals) */
  subtitleDuration: number
  /** Whether the AI is currently transitioning between states */
  isTransitioning: boolean
  /** Progress of the current state transition (0.0 to 1.0) */
  transitionProgress: number
}

/**
 * Visual and animation configuration for a specific AI state
 */
export interface StateConfig {
  /** Frequency of noise-based surface deformation (0.0 to 3.0+) */
  noiseFrequency: number
  /** Amplitude of noise-based surface deformation (0.0 to 1.0) */
  noiseAmplitude: number
  /** Primary color for the orb surface */
  colorPrimary: THREE.Color
  /** Secondary color for blending/highlights */
  colorSecondary: THREE.Color
  /** Intensity of emissive glow (0.0 to 1.0+) */
  emissiveIntensity: number
  /** Minimum emissive intensity for pulsing states (THINKING) */
  emissivePulseMin?: number
  /** Maximum emissive intensity for pulsing states (THINKING) */
  emissivePulseMax?: number
  /** Fresnel effect power for edge glow (1.0 to 5.0) */
  fresnelPower: number
  /** Base scale multiplier for the orb (0.5 to 2.0) */
  scale: number
  /** Speed of noise-based rotation effect */
  rotationSpeed: number
  /** Y-axis position offset */
  positionY: number
  /** Z-axis position offset (toward/away from camera) */
  positionZ: number
  /** X-axis rotation speed (radians per second) */
  rotationXSpeed: number
  /** Y-axis rotation speed (radians per second) */
  rotationYSpeed: number
}

/**
 * Pre-configured visual states for each AI state.
 * These configurations define the appearance and behavior of the Soul Orb.
 */
export const STATE_CONFIGS: Record<AIState, StateConfig> = {
  LISTENING: {
    noiseFrequency: 0.8,
    noiseAmplitude: 0.15,
    colorPrimary: new THREE.Color('#E8A87C'),
    colorSecondary: new THREE.Color('#E8A87C'),
    emissiveIntensity: 0.3,
    fresnelPower: 2.5,
    scale: 1.0,
    rotationSpeed: 0.1,
    positionY: 0,
    positionZ: 0,
    rotationXSpeed: 0,
    rotationYSpeed: 0.001 // Very slow Y rotation drift
  },
  THINKING: {
    noiseFrequency: 2.0,
    noiseAmplitude: 0.12,
    colorPrimary: new THREE.Color('#8B5CF6'),
    colorSecondary: new THREE.Color('#06B6D4'),
    emissiveIntensity: 0.6, // Will pulse
    emissivePulseMin: 0.5,
    emissivePulseMax: 0.9,
    fresnelPower: 4.0,
    scale: 0.95,
    rotationSpeed: 0.3,
    positionY: 0,
    positionZ: 0, // Return to center
    rotationXSpeed: 0.005, // Multi-axis rotation accelerates
    rotationYSpeed: 0.01
  },
  SPEAKING: {
    noiseFrequency: 1.5,
    noiseAmplitude: 0.2, // Will be driven by amplitude prop
    colorPrimary: new THREE.Color('#F59E0B'),
    colorSecondary: new THREE.Color('#DC2626'),
    emissiveIntensity: 0.35,
    fresnelPower: 2.0,
    scale: 1.0,
    rotationSpeed: 0.12,
    positionY: 0,
    positionZ: 0, // Stable center position
    rotationXSpeed: 0,
    rotationYSpeed: 0.08 // Slow grounding rotation
  }
}

/**
 * Energy level mapping for each AI state.
 * Used to drive animation intensity and visual feedback.
 */
export const ENERGY_MAP: Record<AIState, number> = {
  LISTENING: 0.2,
  THINKING: 0.8,
  SPEAKING: 0.6 // Base energy, modulated by amplitude during speech
}

/**
 * Hook return type for useAIState
 */
export interface UseAIStateReturn {
  /** Current AI state */
  state: AIState
  /** Current amplitude value (0.0 to 1.0) */
  amplitude: number
  /** Current transcript text */
  transcript: string
  /** Current partial transcript being accumulated */
  partialTranscript: string
  /** AI's current spoken response for subtitles */
  aiResponse: string
  /** Current text chunk being spoken */
  subtitleChunk: string
  /** Duration of current chunk in seconds */
  subtitleDuration: number
  /** Whether currently transitioning between states */
  isTransitioning: boolean
  /** Transition animation progress (0.0 to 1.0) */
  transitionProgress: number
  /** Current energy level (0.0 to 1.0) */
  energy: number
  /** Direct reference to amplitude (0.0 to 1.0) for high-performance reading */
  amplitudeRef: React.MutableRefObject<number>
}
