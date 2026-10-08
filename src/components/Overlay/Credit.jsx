import React from 'react'

const PORTFOLIO_URL = 'https://desertcache.github.io/portfolio/'
const SOURCE_URL = 'https://github.com/desertcache/samantha-ui'

// Links read a step brighter than the line around them, underlined, and warm to the
// orb's peach on hover / keyboard focus. The padding (cancelled by the negative margin)
// only enlarges the tap target to about 24px tall; it does not move anything.
const linkClass = `
    -m-1 inline-block rounded-sm p-1 text-soul-white/90
    underline decoration-soul-white/50 underline-offset-[3px]
    transition-colors duration-300 hover:text-soul-peach hover:decoration-soul-peach
    focus-visible:text-soul-peach focus-visible:outline focus-visible:outline-1 focus-visible:outline-soul-peach/70
`

/**
 * Credit line in the bottom-left corner of the standalone page, so it is not a dead end.
 * It lives inside Overlay, which App skips in every embed mode, so embeds never show it.
 *
 * Quiet on purpose: the same system font and light weight as the status word, in the
 * page's warm white at 70%. That is about 7.9:1 on the #0a0908 void, and it stays above
 * the 4.5:1 WCAG AA minimum for small text even over the brightest film-grain pixels
 * the Noise pass puts behind it, which is why it is not any quieter. It sits in the
 * overlay's 2.5rem edge padding, below the transcript and subtitle block, so it clears
 * both at desktop and phone widths (on a phone the links wrap to a second line).
 */
export function Credit() {
    return (
        <footer
            className={`
                pointer-events-auto absolute bottom-3 left-4 right-4 z-20 w-fit md:bottom-4 md:left-6 md:right-6
                flex flex-wrap items-baseline gap-x-4 gap-y-1
                text-[11px] font-light leading-[1.45] tracking-[0.08em] text-soul-white/70 md:text-[12px]
            `}
        >
            <span>
                Samantha UI <span aria-hidden="true">&middot;</span> an audio-reactive orb by Samuel Bates
            </span>
            <span className="whitespace-nowrap">
                <a className={linkClass} href={PORTFOLIO_URL} target="_blank" rel="noopener">Portfolio</a>
                <span aria-hidden="true" className="mx-2">&middot;</span>
                <a className={linkClass} href={SOURCE_URL} target="_blank" rel="noopener">Source</a>
            </span>
        </footer>
    )
}
