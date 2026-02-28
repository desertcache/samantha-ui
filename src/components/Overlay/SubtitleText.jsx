import React, { useState, useEffect, useRef, useMemo } from 'react'

/**
 * SubtitleText component displays AI response as subtitles during SPEAKING.
 * Features word-by-word reveal synced to audio duration, with amplitude-based
 * emphasis on the current word.
 * 
 * Updates: 
 * - Limits display to roughly 3 lines.
 * - Auto-scrolls to keep active word in view, phasing out old lines.
 */
export function SubtitleText({
    subtitleChunk,
    subtitleDuration,
    amplitudeRef,
    isVisible
}) {
    // Track all accumulated text to show full subtitle history
    const [accumulatedText, setAccumulatedText] = useState('')
    // Track which words have been revealed
    const [revealedWordCount, setRevealedWordCount] = useState(0)
    // Track the current chunk's start index in accumulated text
    const [currentChunkStartIndex, setCurrentChunkStartIndex] = useState(0)
    // Ref for animation frame
    const animationRef = useRef(null)
    // Track current amplitude for pulse effect
    const [currentAmplitude, setCurrentAmplitude] = useState(0)

    // Refs for scrolling
    const containerRef = useRef(null)
    const activeWordRef = useRef(null)

    // Split accumulated text into words for rendering
    const words = useMemo(() => {
        return accumulatedText.split(/\s+/).filter(w => w.length > 0)
    }, [accumulatedText])

    // When a new chunk arrives, append it and start reveal animation
    useEffect(() => {
        if (!subtitleChunk || subtitleDuration <= 0) return

        // Append new chunk to accumulated text
        const newText = accumulatedText
            ? accumulatedText + ' ' + subtitleChunk
            : subtitleChunk

        // Calculate word indices
        const previousWords = accumulatedText.split(/\s+/).filter(w => w.length > 0)
        const newWords = subtitleChunk.split(/\s+/).filter(w => w.length > 0)
        const startIndex = previousWords.length

        setAccumulatedText(newText)
        setCurrentChunkStartIndex(startIndex)

        // Calculate reveal timing
        const wordCount = newWords.length
        if (wordCount === 0) return

        const msPerWord = (subtitleDuration * 1000) / wordCount
        let currentWordIndex = 0
        const startTime = performance.now()

        // Cancel any existing animation
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
        }

        // Reveal words over time
        const animate = () => {
            const elapsed = performance.now() - startTime
            const targetIndex = Math.min(
                Math.floor(elapsed / msPerWord) + 1, // +1 to reveal slightly ahead
                wordCount
            )

            if (targetIndex > currentWordIndex) {
                currentWordIndex = targetIndex
                setRevealedWordCount(startIndex + currentWordIndex)
            }

            // Update amplitude for pulse effect
            if (amplitudeRef?.current !== undefined) {
                setCurrentAmplitude(amplitudeRef.current)
            }

            if (currentWordIndex < wordCount) {
                animationRef.current = requestAnimationFrame(animate)
            }
        }

        animationRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [subtitleChunk, subtitleDuration])

    // Amplitude polling for pulse effect (runs during SPEAKING)
    useEffect(() => {
        if (!isVisible) return

        let frameId = null
        const poll = () => {
            if (amplitudeRef?.current !== undefined) {
                setCurrentAmplitude(amplitudeRef.current)
            }
            frameId = requestAnimationFrame(poll)
        }
        frameId = requestAnimationFrame(poll)

        return () => {
            if (frameId) cancelAnimationFrame(frameId)
        }
    }, [isVisible, amplitudeRef])

    // Clear subtitles when not visible
    useEffect(() => {
        if (!isVisible) {
            // Delay clear to allow fade-out
            const timer = setTimeout(() => {
                setAccumulatedText('')
                setRevealedWordCount(0)
                setCurrentChunkStartIndex(0)
            }, 600)
            return () => clearTimeout(timer)
        }
    }, [isVisible])

    // Auto-scroll to keep active word in view (manual scroll to avoid affecting parent elements)
    useEffect(() => {
        if (activeWordRef.current && containerRef.current) {
            const container = containerRef.current
            const activeWord = activeWordRef.current

            // Get positions relative to the container
            const containerRect = container.getBoundingClientRect()
            const wordRect = activeWord.getBoundingClientRect()

            // Calculate if the word is outside the visible area
            const wordBottom = wordRect.bottom - containerRect.top + container.scrollTop
            const visibleBottom = container.scrollTop + container.clientHeight

            // If the word is below the visible area, scroll down to show it
            if (wordBottom > visibleBottom) {
                container.scrollTo({
                    top: wordBottom - container.clientHeight + 10, // +10 for padding
                    behavior: 'smooth'
                })
            }
        }
    }, [revealedWordCount]) // Trigger whenever a new word is revealed

    // Determine which word is "active" (most recently revealed)
    const activeWordIndex = revealedWordCount - 1

    return (
        <div
            className="subtitle-wrapper"
            style={{
                width: '100%',
                maxWidth: '600px', // Increased width closely matching the image example
                height: '6rem',    // Fixed height to prevent layout shift
                minHeight: '6rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start', // Anchor text to top - text stays below orb
                zIndex: 20,
            }}
        >
            <div
                ref={containerRef}
                className="subtitle-container"
                style={{
                    width: '100%',
                    // Height calculation: line-height (1.6) * font-size (1.25rem) * 3 lines
                    // 1.25rem = 20px. 1.6 * 20 = 32px per line. 3 lines = 96px (6rem).
                    // Fixed height prevents CLS - container reserves space immediately
                    height: '6rem',
                    minHeight: '6rem',
                    overflowY: 'hidden', // Strict hide old lines
                    textAlign: 'center',
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.5s ease-out',
                    pointerEvents: 'none',
                    // Mask creates the fade-out effect at the top - adjusted to be sharper
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 100%)',
                    padding: '0 20px',
                    // Override CSS class absolute positioning - use static to stay in flexbox flow
                    position: 'static',
                    top: 'auto',
                    left: 'auto',
                    transform: 'translateX(-15px)', // Slight left shift to align with Orb center
                    display: 'block'
                }}
            >
                <p
                    className="subtitle-text"
                    style={{
                        fontSize: '1.25rem',
                        fontWeight: 400,
                        lineHeight: 1.6,
                        color: 'rgba(255, 255, 255, 0.95)',
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                        margin: 0,
                        // Remove excessive top padding to ensure first line starts correctly in the flow
                        padding: '0.2em 0',
                    }}
                >
                    {words.map((word, index) => {
                        const isRevealed = index < revealedWordCount
                        const isActive = index === activeWordIndex

                        // Pulse scale based on amplitude (subtle effect)
                        const pulseScale = isActive
                            ? 1 + (currentAmplitude * 0.08)
                            : 1

                        // Active word gets slight glow
                        const glowIntensity = isActive
                            ? Math.max(0.3, currentAmplitude * 0.8)
                            : 0

                        return (
                            <span
                                key={`${index}-${word}`}
                                ref={isActive ? activeWordRef : null}
                                style={{
                                    display: 'inline-block',
                                    opacity: isRevealed ? 1 : 0,
                                    filter: isRevealed ? 'blur(0px)' : 'blur(4px)',
                                    transform: `scale(${pulseScale})`,
                                    transition: isActive
                                        ? 'transform 0.05s ease-out'
                                        : 'opacity 0.35s ease-out, filter 0.35s ease-out',
                                    marginRight: '0.35em',
                                    textShadow: isActive
                                        ? `0 0 ${10 + glowIntensity * 20}px rgba(245, 158, 11, ${glowIntensity}), 0 2px 10px rgba(0,0,0,0.5)`
                                        : '0 2px 10px rgba(0,0,0,0.5)',
                                    willChange: 'opacity, filter'
                                }}
                            >
                                {word}
                            </span>
                        )
                    })}
                </p>
            </div>
        </div>
    )
}
