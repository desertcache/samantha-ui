import { Color } from 'three'

export function Void() {
    return (
        <>
            <color attach="background" args={['#0a0908']} />
            {/* We could add a large background sphere or fog here if needed for more depth */}
            <fog attach="fog" args={['#0a0908', 5, 15]} />
        </>
    )
}
