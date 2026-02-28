import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SmoothedValue } from '../../hooks/useSmoothValue'
import { STATE_CONFIGS } from '../../types/ai'

import vertexShader from './vertexShader.glsl'
import fragmentShader from './fragmentShader.glsl'

export function SoulOrb({ state = 'LISTENING', amplitudeRef }) {
    const meshRef = useRef()
    const timeRef = useRef(0)

    // Use refs to track latest prop values for useFrame
    const stateRef = useRef(state)
    stateRef.current = state

    // Create shader material
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uAmplitude: { value: 0 },
                uNoiseFrequency: { value: 0.8 },
                uNoiseAmplitude: { value: 0.15 },
                uColorPrimary: { value: new THREE.Color('#E8A87C') },
                uColorSecondary: { value: new THREE.Color('#E8A87C') },
                uEmissiveIntensity: { value: 0.3 },
                uFresnelPower: { value: 2.5 },
                uShapeMorph: { value: 0.0 } // 0 = Blob, 1 = Silk
            },
            transparent: false,
            side: THREE.FrontSide
        })
    }, [])

    // Smoothed values for transitions
    const smoothedValues = useMemo(() => ({
        amplitude: new SmoothedValue(0),
        noiseFrequency: new SmoothedValue(0.8),
        noiseAmplitude: new SmoothedValue(0.15),
        emissiveIntensity: new SmoothedValue(0.3),
        fresnelPower: new SmoothedValue(2.5),
        scale: new SmoothedValue(1.0),
        positionY: new SmoothedValue(0),
        positionZ: new SmoothedValue(0),
        rotationX: new SmoothedValue(0),
        rotationY: new SmoothedValue(0),
        colorPrimaryR: new SmoothedValue(0.91),
        colorPrimaryG: new SmoothedValue(0.91),
        colorPrimaryB: new SmoothedValue(0.49),
        colorSecondaryR: new SmoothedValue(0.91),
        colorSecondaryG: new SmoothedValue(0.66),
        colorSecondaryB: new SmoothedValue(0.49),
        pulseIntensity: new SmoothedValue(0), // New: Tracks fade-in of pulse effect
        shapeMorph: new SmoothedValue(0.0) // New: Tracks morph to Liquid Silk
    }), [])

    // Cleanup GPU resources on unmount
    React.useEffect(() => {
        return () => {
            material.dispose()
        }
    }, [material])

    useFrame((frameState, delta) => {
        if (!meshRef.current) return

        // Read current values from refs (avoids stale closure issues)
        const currentState = stateRef.current
        const currentAmplitude = amplitudeRef?.current || 0

        // Update time
        timeRef.current += delta
        material.uniforms.uTime.value = timeRef.current

        // Get current state config
        const config = STATE_CONFIGS[currentState] || STATE_CONFIGS.LISTENING

        // Update target values based on state
        smoothedValues.noiseFrequency.set(config.noiseFrequency)
        smoothedValues.fresnelPower.set(config.fresnelPower)

        // Color targets
        smoothedValues.colorPrimaryR.set(config.colorPrimary.r)
        smoothedValues.colorPrimaryG.set(config.colorPrimary.g)
        smoothedValues.colorPrimaryB.set(config.colorPrimary.b)
        smoothedValues.colorSecondaryR.set(config.colorSecondary.r)
        smoothedValues.colorSecondaryG.set(config.colorSecondary.g)
        smoothedValues.colorSecondaryB.set(config.colorSecondary.b)

        // Position targets with organic motion
        let targetPositionY = config.positionY
        let targetPositionZ = config.positionZ
        let targetScale = config.scale

        // State-specific behavior
        // State-specific behavior
        let targetPulseIntensity = 0
        let targetShapeMorph = 0.0

        if (currentState === 'LISTENING') {
            // LISTENING breathing: gentle Y-axis hover and scale breathing
            targetPositionY += Math.sin(timeRef.current * 0.25) * 0.05 // ±0.05 over 4 second period
            targetScale += Math.sin(timeRef.current * (Math.PI / 3)) * 0.02 // ±0.02 over 6 second period

            targetShapeMorph = 0.0 // Ensure we are in Blob mode

            smoothedValues.emissiveIntensity.set(config.emissiveIntensity)
            smoothedValues.noiseAmplitude.set(config.noiseAmplitude)
            smoothedValues.noiseFrequency.set(config.noiseFrequency)
            smoothedValues.amplitude.set(0)

        } else if (currentState === 'SPEAKING') {
            // Subtle amplitude response - refined visual feedback
            // Scale: Reduced global scaling to let the "tips" do the work
            targetScale = 1.0 + currentAmplitude * 0.1

            // MORPH TO LIQUID SILK
            targetShapeMorph = 1.0

            // Gentle wobble driven by amplitude
            const wobbleIntensity = currentAmplitude * 0.1
            const wobbleX = Math.sin(timeRef.current * 7.0) * wobbleIntensity
            const wobbleY = Math.cos(timeRef.current * 5.5) * wobbleIntensity
            const wobbleZ = Math.sin(timeRef.current * 6.0) * wobbleIntensity * 0.5
            targetPositionY += wobbleY
            targetPositionZ += wobbleZ

            // Moderate surface distortion driven by amplitude
            const targetNoiseAmp = config.noiseAmplitude + currentAmplitude * 0.2
            smoothedValues.noiseAmplitude.set(targetNoiseAmp)
            smoothedValues.amplitude.set(currentAmplitude * 0.3) // Reduced from 0.45

            // Subtle glow increases with amplitude
            const targetEmissive = config.emissiveIntensity + currentAmplitude * 0.3
            smoothedValues.emissiveIntensity.set(targetEmissive)

            // Moderate noise frequency during loud moments
            const targetFreq = config.noiseFrequency + currentAmplitude * 0.15
            smoothedValues.noiseFrequency.set(targetFreq)

        } else if (currentState === 'THINKING') {
            targetShapeMorph = 0.0 // Remain as Blob, but pulse

            // THINKING: Separation of Base Transition vs Pulse Animation

            // 1. Dynamic breathing (scale) - deeper and faster than LISTENING
            const breath = Math.sin(timeRef.current * 3.0)
            targetScale = config.scale + breath * 0.05

            // 2. Dynamic noise amplitude (undulation)
            const undulating = Math.sin(timeRef.current * 2.5) * 0.5 + 0.5
            const targetNoiseAmp = THREE.MathUtils.lerp(
                config.noiseAmplitude,
                config.noiseAmplitude * 2.0,
                undulating
            )
            smoothedValues.noiseAmplitude.set(targetNoiseAmp)

            // 3. Dynamic frequency (morphing)
            const morphing = Math.cos(timeRef.current * 1.5) * 0.5 + 0.5
            const targetFreq = THREE.MathUtils.lerp(
                config.noiseFrequency,
                config.noiseFrequency * 1.2,
                morphing
            )
            smoothedValues.noiseFrequency.set(targetFreq)

            // 4. Pulse Animation Logic:
            // Instead of setting emissive target directly to the sine wave (which gets smoothed out),
            // we set the base target to the average, and animate the pulse separately.
            targetPulseIntensity = 1.0 // Fade in the pulse effect

            // Base emissive should target the average of min/max
            const avgEmissive = (config.emissivePulseMin + config.emissivePulseMax) / 2
            smoothedValues.emissiveIntensity.set(avgEmissive)

            smoothedValues.amplitude.set(0)

        } else {
            // Fallback
            targetShapeMorph = 0.0
            smoothedValues.noiseAmplitude.set(config.noiseAmplitude)
            smoothedValues.emissiveIntensity.set(config.emissiveIntensity)
            smoothedValues.amplitude.set(0)
        }

        // Update shape morph smoother
        smoothedValues.shapeMorph.set(targetShapeMorph)

        // Update pulse intensity smoother
        smoothedValues.pulseIntensity.set(targetPulseIntensity)

        // Set position and scale targets
        smoothedValues.positionY.set(targetPositionY)
        smoothedValues.positionZ.set(targetPositionZ)
        smoothedValues.scale.set(targetScale)

        // Smooth transitions (different speeds for different properties)
        // Smooth transitions - VERY SLOW (0.5) for ~4 second organic morphing
        // Higher values = more responsive, Lower values = slower/smoother
        const slowSpeed = 0.5

        // INSTANT amplitude response for punchy speech visualization (keep high)
        material.uniforms.uAmplitude.value = smoothedValues.amplitude.update(delta, 60)

        material.uniforms.uNoiseFrequency.value = smoothedValues.noiseFrequency.update(delta, slowSpeed)
        material.uniforms.uNoiseAmplitude.value = smoothedValues.noiseAmplitude.update(delta, slowSpeed)

        // Emissive updates: Base fade + Pulse Animation
        const currentEmissiveBase = smoothedValues.emissiveIntensity.update(delta, slowSpeed)
        const currentPulseIntensity = smoothedValues.pulseIntensity.update(delta, slowSpeed)

        // Calculate pulse (2Hz)
        const pulse = Math.sin(timeRef.current * 12.56) // -1 to 1
        // Pulse adds ±0.2 intensity when fully active
        material.uniforms.uEmissiveIntensity.value = currentEmissiveBase + (pulse * 0.2 * currentPulseIntensity)

        // Update colors - VERY SLOW (0.5) for ~4s morph between states
        material.uniforms.uShapeMorph.value = smoothedValues.shapeMorph.update(delta, 1.0) // 1.0 speed = ~1s transition

        material.uniforms.uFresnelPower.value = smoothedValues.fresnelPower.update(delta, slowSpeed)

        // Update colors - VERY SLOW (0.5) for ~4s morph between states
        material.uniforms.uColorPrimary.value.r = smoothedValues.colorPrimaryR.update(delta, 0.5)
        material.uniforms.uColorPrimary.value.g = smoothedValues.colorPrimaryG.update(delta, 0.5)
        material.uniforms.uColorPrimary.value.b = smoothedValues.colorPrimaryB.update(delta, 0.5)
        material.uniforms.uColorSecondary.value.r = smoothedValues.colorSecondaryR.update(delta, 0.5)
        material.uniforms.uColorSecondary.value.g = smoothedValues.colorSecondaryG.update(delta, 0.5)
        material.uniforms.uColorSecondary.value.b = smoothedValues.colorSecondaryB.update(delta, 0.5)

        // Update position with smooth lerp
        meshRef.current.position.y = smoothedValues.positionY.update(delta, 3)
        meshRef.current.position.z = smoothedValues.positionZ.update(delta, 3)

        // Update scale with smooth lerp
        // INSTANT scale response for dramatic "breathing" during speech
        const currentScale = smoothedValues.scale.update(delta, 50)
        meshRef.current.scale.setScalar(currentScale)

        // Update rotation with smooth lerp and continuous accumulation
        smoothedValues.rotationX.value += delta * config.rotationXSpeed
        smoothedValues.rotationY.value += delta * config.rotationYSpeed
        meshRef.current.rotation.x = smoothedValues.rotationX.value
        meshRef.current.rotation.y = smoothedValues.rotationY.value
    })

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[1, 128, 128]} />
            <primitive object={material} attach="material" />
        </mesh>
    )
}
