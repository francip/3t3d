import * as THREE from 'three';

/**
 * Creates a Nebula Whisper particle system
 * @param {Vector3} position - Center position of the effect
 * @param {Object} options - Configuration options
 * @returns {THREE.Points} Particle system
 */
export function createNebulaWhisperParticleSystem(position, options = {}) {
    // Destructure and set defaults from options
    const {
        particleCount = 500,
        particleSizeFactor = 1.0,
        animationSpeed = 0.6,
        color = {
            primary: [1.0, 1.0, 1.0],
            secondary: [0.8, 0.8, 0.8],
            variation: 0.2
        },
        volume = {
            size: 0.42,
            boundaryBehavior: 'soft'
        },
        geometry = {
            type: 'default',
            distribution: 'circular',
            adherence: 0.5
        },
        movementPattern = {
            type: 'wave',
            strength: 1.0,
            secondaryStrength: 0.5,
            patternSpecific: {
                frequencies: [1.2, 1.7, 2.3],
                secondaryFrequencies: [0.7, 0.9, 1.3],
                amplitudes: [0.08, 0.08, 0.08],
                secondaryAmplitudes: [0.04, 0.04, 0.04]
            }
        }
    } = options;

    // Initialize Three.js geometry
    const bufferGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Generate particles based on geometry settings
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.05 + Math.random() * 0.2; // Base radius for circular distribution
        
        // Set initial positions based on geometry distribution
        if (geometry.distribution === 'circular') {
            initialPositions[i * 3] = Math.cos(angle) * radius;
            initialPositions[i * 3 + 1] = Math.sin(angle) * radius;
        } else if (geometry.distribution === 'cross') {
            // Cross pattern - particles tend to follow diagonals
            const diagonal = Math.random() > 0.5;
            const dist = Math.random() * 0.2;
            
            if (diagonal) {
                initialPositions[i * 3] = dist * (Math.random() > 0.5 ? 1 : -1);
                initialPositions[i * 3 + 1] = dist * (Math.random() > 0.5 ? 1 : -1);
            } else {
                // Some random particles too
                initialPositions[i * 3] = Math.cos(angle) * radius;
                initialPositions[i * 3 + 1] = Math.sin(angle) * radius;
            }
        } else {
            // Default - random distribution
            initialPositions[i * 3] = (Math.random() - 0.5) * 0.3;
            initialPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
        }
        
        // Z distribution is consistent regardless of pattern
        initialPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
        
        // Copy to current positions
        positions[i * 3] = initialPositions[i * 3];
        positions[i * 3 + 1] = initialPositions[i * 3 + 1];
        positions[i * 3 + 2] = initialPositions[i * 3 + 2];
        
        // Random velocities with configurable variance
        const velocityScale = 0.02; // Base velocity scale
        velocities[i * 3] = (Math.random() - 0.5) * velocityScale;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * velocityScale;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * velocityScale;
        
        // Particle sizes with variation
        sizes[i] = 1.0 + Math.random() * 2.0;
    }

    // Set buffer attributes
    bufferGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    bufferGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    bufferGeometry.setAttribute('initialPosition', new THREE.BufferAttribute(initialPositions, 3));
    bufferGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Convert colors to THREE.Vector3 objects for shader uniforms
    const primaryColor = new THREE.Vector3().fromArray(color.primary);
    const secondaryColor = new THREE.Vector3().fromArray(color.secondary || 
        [color.primary[0] * 0.8, color.primary[1] * 0.8, color.primary[2] * 0.8]);

    // Movement pattern code generator
    const generateMovementCode = () => {
        // Base wave movement for Nebula Whisper
        const frequencies = movementPattern.patternSpecific?.frequencies || [1.2, 1.7, 2.3];
        const secondaryFreqs = movementPattern.patternSpecific?.secondaryFrequencies || [0.7, 0.9, 1.3];
        const amplitudes = movementPattern.patternSpecific?.amplitudes || [0.08, 0.08, 0.08];
        const secondaryAmps = movementPattern.patternSpecific?.secondaryAmplitudes || [0.04, 0.04, 0.04];
        
        const waveCode = `
            // Primary wave motion
            vec3 offset = vec3(
                // X offset: primary + secondary waves
                sin(localTime * ${frequencies[0]} + initialPosition.x * 12.0) * ${amplitudes[0]} * movementStrength +
                cos(localTime * ${secondaryFreqs[0]} + initialPosition.z * 5.0) * ${secondaryAmps[0]} * secondaryStrength,
                
                // Y offset: primary + secondary waves
                sin(localTime * ${frequencies[1]} + initialPosition.y * 14.0) * ${amplitudes[1]} * movementStrength +
                sin(localTime * ${secondaryFreqs[1]} + initialPosition.x * 7.0) * ${secondaryAmps[1]} * secondaryStrength,
                
                // Z offset: primary + secondary waves
                sin(localTime * ${frequencies[2]} + initialPosition.z * 16.0) * ${amplitudes[2]} * movementStrength +
                cos(localTime * ${secondaryFreqs[2]} + initialPosition.y * 9.0) * ${secondaryAmps[2]} * secondaryStrength
            );
            
            // Base position calculation
            vec3 pos = initialPosition + offset + velocity * localTime;
        `;
        
        // Additional pattern-specific movement
        if (movementPattern.type === 'orbital') {
            return waveCode + `
                // Apply orbital motion
                float angle = atan(pos.y, pos.x) + 0.4 * time * movementStrength; 
                float radius = length(pos.xy) * (0.5 + 0.2 * sin(time * 0.7)); 
                pos.x = cos(angle) * radius; 
                pos.y = sin(angle) * radius;
                pos.z *= 0.7 + 0.2 * cos(time * 0.5);
            `;
        } else if (movementPattern.type === 'diagonal') {
            return waveCode + `
                // Apply diagonal attraction
                float xFactor = 0.35 + 0.15 * sin(time); 
                pos.xy = mix(pos.xy, vec2(sign(pos.x) * 0.25 * cos(time * 0.3), sign(pos.y) * 0.25 * sin(time * 0.3)), xFactor); 
                pos.z *= 0.7 + 0.2 * sin(time * 0.5);
            `;
        } else {
            // Default is just wave motion
            return waveCode;
        }
    };
    
    // Boundary behavior code generator
    const generateBoundaryCode = () => {
        const boundarySize = volume.size || 0.42;
        
        if (volume.boundaryBehavior === 'soft') {
            return `
                // Soft boundary: gently scale particles back toward center
                float boundarySize = ${boundarySize};
                if (abs(pos.x) > boundarySize || abs(pos.y) > boundarySize || abs(pos.z) > boundarySize) {
                    pos *= 0.85;
                }
            `;
        } else if (volume.boundaryBehavior === 'hard') {
            return `
                // Hard boundary: clamp positions to box
                float boundarySize = ${boundarySize};
                pos = clamp(pos, vec3(-boundarySize), vec3(boundarySize));
            `;
        } else if (volume.boundaryBehavior === 'wrap') {
            return `
                // Wrap boundary: particles reappear on opposite side
                float boundarySize = ${boundarySize};
                if (abs(pos.x) > boundarySize) pos.x = -sign(pos.x) * boundarySize;
                if (abs(pos.y) > boundarySize) pos.y = -sign(pos.y) * boundarySize;
                if (abs(pos.z) > boundarySize) pos.z = -sign(pos.z) * boundarySize;
            `;
        } else {
            // Default soft boundary
            return `
                // Default soft boundary
                float boundarySize = ${boundarySize};
                if (abs(pos.x) > boundarySize || abs(pos.y) > boundarySize || abs(pos.z) > boundarySize) {
                    pos *= 0.85;
                }
            `;
        }
    };

    // Create the shader material
    const shaderMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            attribute vec3 velocity;
            attribute vec3 initialPosition;
            attribute float size;
            
            uniform float time;
            uniform float movementStrength;
            uniform float secondaryStrength;
            uniform float particleSizeFactor;
            
            varying vec2 vUv;
            varying float vDistFromCenter;
            varying float vVisibility;
            varying vec3 vTangent;
            
            void main() {
                // Animation timing with configurable speed
                float localTime = time * ${animationSpeed};
                
                // Movement pattern using the generator
                ${generateMovementCode()}
                
                // Boundary constraints
                ${generateBoundaryCode()}
                
                // Calculate tangent for special effects
                vTangent = normalize(vec3(sin(localTime + pos.x), cos(localTime + pos.y), sin(localTime * 1.2 + pos.z)));
                
                // Calculate distance from center for coloration
                vDistFromCenter = length(pos) / ${volume.size || 0.42};
                
                // Transform to view space
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                
                // Always fully visible
                vVisibility = 1.0;
                
                // Dynamic point size calculation with pulsing effect
                float distanceToCamera = -mvPosition.z;
                float sizeScale = 0.8 + 0.2 * sin(time * 2.0 + vDistFromCenter * 6.0);
                gl_PointSize = size * sizeScale * particleSizeFactor * (1.0 / distanceToCamera) * 18.0;
                
                gl_Position = projectionMatrix * mvPosition;
                vUv = uv;
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 primaryColor;
            uniform vec3 secondaryColor;
            uniform float colorVariation;
            
            varying vec2 vUv;
            varying float vDistFromCenter;
            varying float vVisibility;
            varying vec3 vTangent;
            
            void main() {
                // Enhanced point rendering
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                
                // Create interesting point shape with smoother falloff
                float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
                
                // Add shape variation based on tangent
                float shapeVariation = 0.05 * sin(atan(vTangent.y, vTangent.x) * 8.0 + time * 2.0);
                alpha *= 1.0 + shapeVariation;
                
                // Glow effect that pulses
                float glow = 0.7 + 0.3 * sin(time * 4.0 + vDistFromCenter * 8.0);
                
                // Dynamic color mixing based on distance from center
                vec3 color = mix(primaryColor, secondaryColor, vDistFromCenter);
                
                // Add subtle color fringing
                color += vec3(0.15, 0.2, 0.25) * (1.0 - dist);
                
                // Apply color variation using noise-like pattern
                color += vec3(colorVariation) * sin(time * 3.0 + vDistFromCenter * 10.0);
                
                // Final color with glow and visibility
                gl_FragColor = vec4(color * glow, alpha * 0.9 * vVisibility);
                
                // Discard nearly transparent fragments for better performance
                if (gl_FragColor.a < 0.05) discard;
            }
        `,
        uniforms: { 
            time: { value: 0 },
            primaryColor: { value: primaryColor },
            secondaryColor: { value: secondaryColor },
            colorVariation: { value: color.variation || 0.2 },
            movementStrength: { value: movementPattern.strength || 1.0 },
            secondaryStrength: { value: movementPattern.secondaryStrength || 0.5 },
            particleSizeFactor: { value: particleSizeFactor }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide
    });

    // Create and return the particle system
    const particles = new THREE.Points(bufferGeometry, shaderMaterial);
    particles.position.copy(position);
    return particles;
}