import * as THREE from 'three';

export function createParticleSystem(type, position) {
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
                float localTime = time * 0.5;
                vec3 offset = vec3(
                    sin(localTime * 1.2 + initialPosition.x * 10.0) * 0.15,
                    sin(localTime * 1.7 + initialPosition.y * 10.0) * 0.15,
                    sin(localTime * 2.3 + initialPosition.z * 10.0) * 0.15
                );
                
                // Calculate base position with some drift
                vec3 pos = initialPosition + offset + velocity * localTime;
                
                // Apply different effects based on X or O
                ${type === 'X' ? 
                    // X pattern - particles tend to move toward diagonals
                    'float factor = 0.3 + 0.1 * sin(time); pos.xy = mix(pos.xy, vec2(sign(pos.x) * 0.3 * cos(time * 0.2), sign(pos.y) * 0.3 * sin(time * 0.2)), factor);' : 
                    // O pattern - particles move in spiral/orbital pattern
                    'float angle = atan(pos.y, pos.x) + 0.3 * time; float radius = length(pos.xy) * (0.8 + 0.2 * sin(time)); pos.x = cos(angle) * radius; pos.y = sin(angle) * radius;'}
                
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
                
                // Glow effect that pulses
                float glow = 0.6 + 0.4 * sin(time * 3.0 + vDistFromCenter * 5.0);
                
                // X is red, O is blue - with some color variation
                vec3 color = ${type === 'X' ? 
                    'vec3(1.0, 0.2 + 0.1 * sin(time + vDistFromCenter * 10.0), 0.2)' : 
                    'vec3(0.2, 0.3 + 0.1 * sin(time + vDistFromCenter * 10.0), 1.0)'};
                
                gl_FragColor = vec4(color * glow, alpha * 0.8);
            }
        `,
        uniforms: { 
            time: { value: 0 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(geometry, shaderMaterial);
    particles.position.copy(position);
    return particles;
}