import { useState, useEffect, useRef, useCallback } from 'react'
import { AIState, UseAIStateReturn, ENERGY_MAP } from '../types/ai'

/**
 * WebSocket message from the backend server
 */
interface WebSocketMessage {
    state: AIState
    amplitude: number
    transcript: string
    partialTranscript: string
    aiResponse: string
    subtitleChunk: string
    subtitleDuration: number
}

const WS_URL = 'ws://localhost:8765'
const RECONNECT_DELAY_MS = 2000

/**
 * Demo mode phrases for simulated AI conversation
 */
const DEMO_PHRASES = [
    "I've been thinking about what makes consciousness interesting",
    "It's the ability to reflect on your own thoughts",
    "Like right now, I'm aware that I'm speaking to you",
    "And there's something beautiful about that connection",
]

/**
 * Demo mode: cycles through AI states with simulated data
 * when no WebSocket backend is available.
 */
function useDemoMode(
    setState: (s: AIState) => void,
    amplitudeRef: React.MutableRefObject<number>,
    setSubtitleChunk: (s: string) => void,
    setSubtitleDuration: (n: number) => void,
    setPartialTranscript: (s: string) => void,
) {
    useEffect(() => {
        console.log('[Demo] Starting demo mode — no backend required')
        let phraseIndex = 0
        let cancelled = false
        let amplitudeInterval: ReturnType<typeof setInterval> | null = null

        const cycle = async () => {
            while (!cancelled) {
                // LISTENING phase (3s) — calm orb
                setState('LISTENING')
                amplitudeRef.current = 0
                setPartialTranscript('listening...')
                await sleep(3000)
                if (cancelled) break

                // THINKING phase (2s) — pulsing orb
                setState('THINKING')
                setPartialTranscript('')
                await sleep(2000)
                if (cancelled) break

                // SPEAKING phase (4s) — audio-reactive orb
                setState('SPEAKING')
                const phrase = DEMO_PHRASES[phraseIndex % DEMO_PHRASES.length]
                setSubtitleChunk(phrase)
                setSubtitleDuration(3.5)

                // Simulate amplitude oscillation during speech
                amplitudeInterval = setInterval(() => {
                    amplitudeRef.current = 0.3 + Math.random() * 0.5
                }, 50)

                await sleep(4000)
                if (amplitudeInterval) clearInterval(amplitudeInterval)
                amplitudeRef.current = 0
                if (cancelled) break

                phraseIndex++
            }
        }

        cycle()

        return () => {
            cancelled = true
            if (amplitudeInterval) clearInterval(amplitudeInterval)
        }
    }, [setState, amplitudeRef, setSubtitleChunk, setSubtitleDuration, setPartialTranscript])
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}


export function useAIState(): UseAIStateReturn {
    const [state, setState] = useState<AIState>('LISTENING')
    const [transcript, setTranscript] = useState<string>('')
    const [partialTranscript, setPartialTranscript] = useState<string>('')
    const [aiResponse, setAiResponse] = useState<string>('')
    const [subtitleChunk, setSubtitleChunk] = useState<string>('')
    const [subtitleDuration, setSubtitleDuration] = useState<number>(0)
    const [isTransitioning, setIsTransitioning] = useState<boolean>(false)
    const [transitionProgress, setTransitionProgress] = useState<number>(1)
    const [energy, setEnergy] = useState<number>(0.2)
    const [demoMode, setDemoMode] = useState<boolean>(false)

    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const smoothedAmplitudeRef = useRef<number>(0)
    const animationFrameRef = useRef<number | null>(null)
    const lastStateRef = useRef<AIState | null>(null)
    const transcriptRef = useRef<string>('')
    const partialTranscriptRef = useRef<string>('')
    const aiResponseRef = useRef<string>('')
    const subtitleChunkRef = useRef<string>('')
    const subtitleDurationRef = useRef<number>(0)
    const connectAttemptsRef = useRef<number>(0)

    // State transition tracking
    useEffect(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }

        setEnergy(ENERGY_MAP[state] || 0.2)
        setIsTransitioning(true)
        setTransitionProgress(0)

        const startTime = performance.now()
        const duration = 500

        const animateProgress = () => {
            const elapsed = performance.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            setTransitionProgress(progress)

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animateProgress)
            } else {
                setIsTransitioning(false)
                animationFrameRef.current = null
            }
        }

        animationFrameRef.current = requestAnimationFrame(animateProgress)

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }
        }
    }, [state])

    // WebSocket connection — falls back to demo mode after 2 failed attempts
    useEffect(() => {
        let isConnecting = false

        const connect = () => {
            if (isConnecting || (wsRef.current?.readyState === WebSocket.OPEN)) {
                return
            }

            if (connectAttemptsRef.current >= 2) {
                console.log('[WebSocket] Backend unavailable — switching to demo mode')
                setDemoMode(true)
                return
            }

            isConnecting = true
            connectAttemptsRef.current++
            console.log(`[WebSocket] Connecting to ${WS_URL} (attempt ${connectAttemptsRef.current})...`)

            const ws = new WebSocket(WS_URL)
            wsRef.current = ws

            ws.onopen = () => {
                console.log('[WebSocket] Connected successfully')
                isConnecting = false
                connectAttemptsRef.current = 0
            }

            ws.onmessage = (event) => {
                try {
                    const data: WebSocketMessage = JSON.parse(event.data)

                    if (data.state !== lastStateRef.current) {
                        setState(data.state)
                        lastStateRef.current = data.state
                    }

                    if (data.transcript !== transcriptRef.current) {
                        transcriptRef.current = data.transcript
                        setTranscript(data.transcript)
                    }
                    if (data.partialTranscript !== partialTranscriptRef.current) {
                        partialTranscriptRef.current = data.partialTranscript
                        setPartialTranscript(data.partialTranscript)
                    }
                    if (data.aiResponse !== aiResponseRef.current) {
                        aiResponseRef.current = data.aiResponse
                        setAiResponse(data.aiResponse)
                    }

                    if (data.subtitleChunk !== subtitleChunkRef.current ||
                        data.subtitleDuration !== subtitleDurationRef.current) {
                        subtitleChunkRef.current = data.subtitleChunk ?? ''
                        subtitleDurationRef.current = data.subtitleDuration ?? 0
                        setSubtitleChunk(data.subtitleChunk ?? '')
                        setSubtitleDuration(data.subtitleDuration ?? 0)
                    }

                    smoothedAmplitudeRef.current = data.amplitude ?? 0

                } catch (error) {
                    console.error('[WebSocket] Error parsing message:', error)
                }
            }

            ws.onerror = () => {
                isConnecting = false
            }

            ws.onclose = () => {
                isConnecting = false

                reconnectTimeoutRef.current = setTimeout(() => {
                    connect()
                }, RECONNECT_DELAY_MS)
            }
        }

        connect()

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }
            if (wsRef.current) {
                wsRef.current.close()
                wsRef.current = null
            }
        }
    }, [])

    // Activate demo mode when backend is unavailable
    useDemoMode(
        demoMode ? setState : () => {},
        smoothedAmplitudeRef,
        demoMode ? setSubtitleChunk : () => {},
        demoMode ? setSubtitleDuration : () => {},
        demoMode ? setPartialTranscript : () => {},
    )

    return {
        state,
        amplitude: smoothedAmplitudeRef.current,
        amplitudeRef: smoothedAmplitudeRef,
        transcript,
        partialTranscript,
        aiResponse,
        subtitleChunk,
        subtitleDuration,
        isTransitioning,
        transitionProgress,
        energy
    }
}
