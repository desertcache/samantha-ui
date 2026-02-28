import React from 'react'

export function TranscriptText({ text, isVisible }) {
    return (
        <div
            style={{
                height: '4rem',    // Fixed height to prevent layout shift
                minHeight: '4rem',
            }}
            className={`
                max-w-2xl text-center text-white/80 font-light text-lg md:text-xl leading-relaxed tracking-wide
                transition-opacity duration-1000 ease-in-out
                ${isVisible && text ? 'opacity-100' : 'opacity-0'}
            `}
        >
            {text}
        </div>
    )
}
