import React from 'react'
import { TranscriptText } from './TranscriptText'
import { SubtitleText } from './SubtitleText'

export function Overlay({ state, transcript, partialTranscript, subtitleChunk, subtitleDuration, amplitudeRef }) {
    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between z-10 p-10">
            {/* Top Status */}
            <div className="w-full flex justify-center pt-8 opacity-50">
                <div className="text-white text-xs tracking-[0.3em] font-light uppercase transition-all duration-500">
                    {state}
                </div>
            </div>

            {/* Middle/Bottom User Transcript & AI Subtitles */}
            <div className="w-full flex-1 flex flex-col justify-end items-center pb-4">
                {/* AI Subtitle - Word-by-word reveal during SPEAKING */}
                <SubtitleText
                    subtitleChunk={subtitleChunk}
                    subtitleDuration={subtitleDuration}
                    amplitudeRef={amplitudeRef}
                    isVisible={state === 'SPEAKING'}
                />

                <TranscriptText
                    text={state === 'SPEAKING' ? (transcript || partialTranscript) : partialTranscript}
                    isVisible={state === 'LISTENING'}
                />
            </div>
        </div>
    )
}
