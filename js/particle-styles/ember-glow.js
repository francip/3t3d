import * as THREE from 'three';

export function createEmberGlowParticleSystem(type, position) {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3);
    const cellSize = 0.4; // Max distance from center for particles (half the cell width)

    for (let i = 0; i < particleCount; i++) {
        // Initial swirl pattern
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.3;
        
        // Store initial positions
        initialPositions[i * 3] = Math.cos(angle) * radius;
        initialPositions[i * 3 + 1] = Math.sin(angle) * radius;
        initialPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
        
        // Copy to current positions
        positions[i * 3] = initialPositions[i * 3];
        positions[i * 3 + 1] = initialPositions[i * 3 + 1];
        positions[i * 3 + 2] = initialPositions[i * 3 + 2];
        
        // Random velocities but slightly biased outward
        velocities[i * 3] = (Math.random() - 0.5) * 0.03;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.03;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('initialPosition', new THREE.BufferAttribute(initialPositions, 3));

    const shaderMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            attribute vec3 velocity;
            attribute vec3 initialPosition;
            uniform float time;
            varying vec2 vUv;
            varying float vDistFromCenter;
            
            vec3 reflectVelocity(vec3 position, vec3 velocity, float boxSize) {
                vec3 reflection = velocity;
                if (abs(position.x) > boxSize) reflection.x = -velocity.x;
                if (abs(position.y) > boxSize) reflection.y = -velocity.y;
                if (abs(position.z) > boxSize) reflection.z = -velocity.z;
                return reflection;
            }
            
            void main() {
                // Base movement using sine waves for more interesting motion
                // Scale time by 0.5 to slow down the animation
                float localTime = time * 0.5;
                
                // Create offset using sine waves at different frequencies for more complex motion
                // Each component has:
                // - Different frequency multiplier (1.2, 1.7, 2.3) for varied oscillation speeds
                // - Initial position factor (10.0) to ensure different particles move differently
                // - Amplitude of 0.15 to limit the displacement range
                vec3 offset = vec3(
                    sin(localTime * 1.2 + initialPosition.x * 10.0) * 0.15,  // X offset
                    sin(localTime * 1.7 + initialPosition.y * 10.0) * 0.15,  // Y offset
                    sin(localTime * 2.3 + initialPosition.z * 10.0) * 0.15   // Z offset
                );
                
                // Calculate base position with some drift
                vec3 pos = initialPosition + offset + velocity * localTime;
                
                // Apply different effects based on X or O
                ${type === 'X' ? 
                    // X pattern - particles tend to move toward diagonals
                    // 1. Calculate a time-varying mix factor (0.3±0.1)
                    // 2. Use mix() to blend between current position and diagonal target positions
                    // 3. sign() preserves which quadrant the particle is in
                    // 4. cos/sin with time create subtle oscillation in the diagonal targets
                    'float factor = 0.3 + 0.1 * sin(time); // Mix factor that oscillates between 0.2-0.4\\n' +
                    'vec2 diagonalTarget = vec2(sign(pos.x) * 0.3 * cos(time * 0.2), sign(pos.y) * 0.3 * sin(time * 0.2));\\n' +
                    'pos.xy = mix(pos.xy, diagonalTarget, factor); // Blend toward diagonal pattern' : 
                    
                    // O pattern - particles move in spiral/orbital pattern
                    // 1. Calculate angle (in radians) from origin to particle with gradual rotation
                    // 2. Calculate radius with subtle pulsing effect
                    // 3. Convert from polar to Cartesian coordinates using cos/sin
                    'float angle = atan(pos.y, pos.x) + 0.3 * time; // Angle from center with rotation\\n' +
                    'float radius = length(pos.xy) * (0.8 + 0.2 * sin(time)); // Pulsing radius\\n' +
                    'pos.x = cos(angle) * radius; // Convert back to Cartesian coordinates\\n' +
                    'pos.y = sin(angle) * radius;'}
                
                // Soft confinement - particles bounce when they hit boundaries
                float boxSize = 0.42;
                if (abs(pos.x) > boxSize || abs(pos.y) > boxSize || abs(pos.z) > boxSize) {
                    pos = clamp(pos, vec3(-boxSize), vec3(boxSize));
                }
                
                // Calculate distance from center for fragment shader
                vDistFromCenter = length(pos) / boxSize;
                
                // Set point size based on z position for depth effect
                gl_PointSize = mix(2.0, 4.0, 0.5 + 0.5 * pos.z / boxSize);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                vUv = uv;
            }
        `,
        fragmentShader: `
            uniform float time;
            varying vec2 vUv;
            varying float vDistFromCenter;
            
            void main() {
                // Distance from center of point
                float dist = length(gl_PointCoord - vec2(0.5));
                
                // Create soft circular points
                float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                
                // Create pulsing glow effect
                // - Base intensity of 0.6
                // - Additional oscillation of ±0.4 based on time and distance
                // - Higher frequency (3.0) creates faster pulsing
                // - Distance factor (5.0) creates waves radiating from center
                float glow = 0.6 + 0.4 * sin(time * 3.0 + vDistFromCenter * 5.0);
                
                // X is red, O is blue - with some color variation
                vec3 color = ${type === 'X' ? 
                    // X color: Primarily red (1.0) with small green component that varies with time and distance
                    'vec3(1.0, // Red component (always full intensity)\n' +
                    '      0.2 + 0.1 * sin(time + vDistFromCenter * 10.0), // Green component with variation\n' +
                    '      0.2) // Blue component (fixed low intensity)' : 
                    
                    // O color: Primarily blue (1.0) with small green component that varies
                    'vec3(0.2, // Red component (fixed low intensity)\n' +
                    '      0.3 + 0.1 * sin(time + vDistFromCenter * 10.0), // Green component with variation\n' +
                    '      1.0) // Blue component (always full intensity)'};
                
                gl_FragColor = vec4(color * glow, alpha * 0.8);
            }
        `,
        uniforms: { 
            time: { value: 0 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true
    });

    const particles = new THREE.Points(geometry, shaderMaterial);
    particles.position.copy(position);
    return particles;
}