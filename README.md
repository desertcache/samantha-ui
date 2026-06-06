<!-- screenshot/GIF: add a short demo GIF here -->

# Samantha UI

**A "Her"-inspired voice-assistant front end: an audio-reactive 3D orb rendered with React 19, Three.js, and hand-written GLSL.**

Samantha UI is the visual layer for a local voice assistant. A single GPU-displaced sphere ("the Soul Orb") reacts in real time to the assistant's voice and conversational state, melting between an organic blob, a pulsing "thinking" form, and a flowing "liquid silk" surface while it speaks. It runs as a Vite/React app that subscribes to a WebSocket stream of state and audio amplitude from a Python backend, and renders entirely on the GPU through custom vertex/fragment shaders.

## What's hard about this

The interesting engineering here is keeping a shader-driven, audio-reactive scene smooth and physically coherent at 60fps while React owns the surrounding state. The non-trivial parts:

- **Audio amplitude driving shader uniforms every frame.** The backend pushes a normalized `amplitude` (0–1) over a WebSocket. Feeding that directly into a uniform looks jittery, so amplitude is written to a `useRef` (not React state) to avoid a re-render per audio frame, then read inside the Three.js `useFrame` render loop and lerped through a custom `SmoothedValue` class. Different uniforms get deliberately different smoothing speeds: amplitude and scale snap fast (speeds of 50–60) for "punchy" speech response, while color and noise frequency lerp slowly (speed 0.5, multi-second morphs) so state changes feel organic rather than abrupt.

- **Custom GLSL displacement, not a stock material.** The orb is a 128x128-segment sphere driven by a hand-integrated Ashima 3D simplex-noise vertex shader. The vertex shader runs two completely different displacement models and blends them with a `uShapeMorph` uniform: a layered multi-octave "blob" (four simplex samples at different frequencies/time scales, weighted and summed, scaled by live audio amplitude) and a "liquid silk" model built from domain-warped flow noise plus a high-pass `smoothstep` on the flow field to isolate peaks ("tips") that get pushed outward by amplitude. The fragment shader adds a Fresnel rim term and an emissive glow keyed off the Fresnel and the noise pattern passed through as a varying.

- **A visual state machine layered over the render loop.** Three states (LISTENING / THINKING / SPEAKING) each carry a full config of color, noise frequency/amplitude, Fresnel power, scale, rotation speeds, and emissive behavior. Some effects cannot just be smoothed toward a target: the THINKING pulse, for example, would be averaged out by the lerp, so it is split into a smoothed base level plus a separately computed sine-wave pulse multiplied by a faded-in `pulseIntensity`. There is also a second "Valentina" palette selected by a `mode` field on the stream.

- **WebGL + React 19 lifecycle.** The scene is built with @react-three/fiber and a postprocessing chain (Bloom, chromatic aberration, film noise, vignette). Shader materials are created once via `useMemo` and explicitly `dispose()`d on unmount to avoid leaking GPU resources; `vite-plugin-glsl` imports `.glsl` files as modules. The WebSocket hook handles reconnection with backoff and a delayed state reset so the orb does not flicker on brief disconnects, and only calls `setState` when a value actually changes.

- **Audio-synced subtitle reveal.** During speech, subtitles reveal word-by-word using `requestAnimationFrame`, pacing each word by `subtitleDuration / wordCount`. The currently-spoken word scales and glows with live amplitude, lines auto-scroll with a CSS mask fade, and the container reserves fixed height to avoid layout shift.

## Stack

- **React 19** + **Vite 7**
- **Three.js** (`three` 0.182) via **@react-three/fiber** 9 and **@react-three/drei**
- **@react-three/postprocessing** for the bloom / chromatic-aberration / noise / vignette chain
- **Custom GLSL** vertex + fragment shaders (Ashima simplex noise), loaded with **vite-plugin-glsl**
- **TypeScript** for the state machine and hooks (`useAIState`, AI state types); components in JSX
- **Tailwind CSS** for overlay styling
- **WebSocket** client consuming a real-time state/amplitude stream from a Python backend

## Run it

A standard Vite app, run from the repo root.

```bash
npm install
npm run dev      # start the Vite dev server
```

Other scripts from `package.json`:

```bash
npm run build    # production build
npm run preview  # preview the production build
npm run lint     # ESLint
```

The UI expects a WebSocket server at `ws://localhost:8765` broadcasting `{ state, amplitude, transcript, subtitleChunk, subtitleDuration, mode, ... }`. It runs without the backend (it will retry the connection and idle in the LISTENING state), but the audio-reactive behavior only comes alive when the assistant backend is streaming.
