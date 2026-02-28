# Samantha UI

Audio-reactive 3D visualization built with **React 19**, **TypeScript**, and **Three.js**. A liquid glass orb that responds to voice input in real time, powered by custom WebGL shaders.
https://www.youtube.com/watch?v=_4_-0YiA5H0

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat&logo=threedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=flat&logo=vite&logoColor=white)

## What It Does

A 3D orb (the "SoulOrb") that visually represents an AI assistant's state — listening, thinking, or speaking. The orb morphs between shapes, shifts colors, and pulses with audio amplitude, all driven by custom GLSL shaders running at 60fps.

**No backend required.** The app includes a built-in demo mode that cycles through all visual states automatically.

### Visual States

| State | Behavior |
|-------|----------|
| **Listening** | Calm, slowly breathing orb with warm tones |
| **Thinking** | Faster rotation, pulsing glow, increased noise |
| **Speaking** | Audio-reactive shape morphing, amplitude-driven scale and emission |

## Architecture

```
src/
├── App.jsx                     # Canvas + post-processing pipeline
├── components/
│   ├── SoulOrb/
│   │   ├── SoulOrb.jsx         # R3F mesh with custom ShaderMaterial
│   │   ├── vertexShader.glsl   # Noise-driven vertex displacement
│   │   └── fragmentShader.glsl # Fresnel + emissive + color mixing
│   ├── Environment/
│   │   └── Void.jsx            # Background environment
│   └── Overlay/
│       ├── Overlay.jsx         # HUD layer (transcript + subtitles)
│       ├── SubtitleText.jsx    # Animated subtitle display
│       └── TranscriptText.jsx  # Live transcript display
├── hooks/
│   ├── useAIState.ts           # WebSocket client + demo mode fallback
│   └── useSmoothValue.js       # Lerp-based animation utility
└── types/
    └── ai.ts                   # State configs, color maps, type definitions
```

### Key Technical Details

- **Custom GLSL shaders** — vertex displacement with simplex noise for organic blob morphing; fragment shader with Fresnel effect, dual-color mixing, and emissive glow
- **SmoothedValue system** — all visual properties (color, scale, noise, rotation) interpolate via configurable lerp speeds in the `useFrame` loop, preventing jarring transitions
- **State machine** — `AIState` (`LISTENING` | `THINKING` | `SPEAKING`) drives per-state configs for color, noise frequency/amplitude, emissive intensity, Fresnel power, scale, and rotation speed
- **Post-processing pipeline** — Bloom, chromatic aberration, noise grain, and vignette via `@react-three/postprocessing`
- **Demo mode** — auto-activates after 2 failed WebSocket connection attempts; cycles through states with simulated audio amplitude

## Quick Start

```bash
git clone https://github.com/desertcache/samantha-ui.git
cd samantha-ui
npm install
npm run dev
```

Opens at `http://localhost:5173`. The orb starts in demo mode immediately — no backend needed.

### Optional: Connect a Backend

The app connects to `ws://localhost:8765` for live data. Send JSON messages with this shape:

```json
{
  "state": "SPEAKING",
  "amplitude": 0.6,
  "transcript": "What the user said",
  "partialTranscript": "What the user is saying...",
  "aiResponse": "The AI's response",
  "subtitleChunk": "Current subtitle text",
  "subtitleDuration": 3.5
}
```

## Tech Stack

- **React 19** + **React DOM 19**
- **Three.js 0.182** + **@react-three/fiber 9.5** + **@react-three/drei 10.7**
- **@react-three/postprocessing 3.0** (Bloom, ChromaticAberration, Noise, Vignette)
- **TypeScript 5.9** + **Vite 7.2**
- **Tailwind CSS 3.4**
- **Custom GLSL** (vertex + fragment shaders loaded via `vite-plugin-glsl`)

## License

MIT
