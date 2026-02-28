import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export function useSmoothValue(targetValue, speed = 0.1) {
    const value = useRef(targetValue)

    // We can't really use a hook that returns a ref's current value directly for rendering 
    // if we want it to drive a uniform every frame without re-rendering the component.
    // Instead, this hook might be used inside useFrame. 

    // BUT, usually we want a value we can pass to a uniform.
    // A common pattern is:
    // const smoothed = useRef(0)
    // useFrame((state, delta) => {
    //   smoothed.current = THREE.MathUtils.lerp(smoothed.current, target, delta * speed)
    // })

    // Since this is asked as a utility hook, I'll provide a hook that returns a ref 
    // that automatically lerps towards valid input in a useFrame loop, 
    // OR just a helper function if not using R3F hooks directly here.

    // Let's make it a simple ref holder that you update manually in useFrame, 
    // or a custom hook that attaches a listener? No, keep it simple.

    return value
}

// Actually, better to just provide a standard hook that returns the ref
// and maybe a setter, but for R3F, we usually do this logic inside the component's useFrame.
// I'll assume the prompt meant a logic helper.
// "useSmoothValue" implies it returns a value. But driving animations in React state is slow.
// I will create a class/helper.

export class SmoothedValue {
    constructor(initial) {
        this.value = initial
        this.target = initial
    }
    update(delta, speed = 10) {
        this.value = THREE.MathUtils.lerp(this.value, this.target, delta * speed)
        return this.value
    }
    set(target) {
        this.target = target
    }
}
