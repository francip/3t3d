import * as THREE from 'three';

export function createQuantumFluxParticleSystem(type, position) {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const cellSize = 0.4; // Max distance from center for particles (half the cell width)

    for (let i = 0; i < particleCount; i++) {
        // Initial swirl pattern
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.3;
        
        // Store initial positions - create a more uniform distribution in all dimensions
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
        
        // Random sizes with variation to make some particles stand out
        sizes[i] = 2.0 + Math.random() * 3.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('initialPosition', new THREE.BufferAttribute(initialPositions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const shaderMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            attribute vec3 velocity;
            attribute vec3 initialPosition;
            attribute float size;
            uniform float time;
            varying vec2 vUv;
            varying float vDistFromCenter;
            varying float vVisibility;
            
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
                
                // Calculate position in view space (important for visibility calculation)
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                
                // Calculate a visibility factor based on view position
                // This helps prevent disappearing when viewed from certain angles
                vec3 viewPos = mvPosition.xyz;
                vVisibility = 1.0; // Base visibility
                
                // Apply point size based on custom size attribute and view distance
                float distanceToCamera = -mvPosition.z;
                gl_PointSize = size * (1.0 / distanceToCamera) * 60.0;
                
                gl_Position = projectionMatrix * mvPosition;
                vUv = uv;
            }
        `,
        fragmentShader: `
            uniform float time;
            varying vec2 vUv;
            varying float vDistFromCenter;
            varying float vVisibility;
            
            void main() {
                // Distance from center of point
                float dist = length(gl_PointCoord - vec2(0.5));
                
                // Create soft circular points with sharper falloff
                float alpha = 1.0 - smoothstep(0.25, 0.45, dist);
                
                // Glow effect that pulses
                float glow = 0.7 + 0.3 * sin(time * 3.0 + vDistFromCenter * 5.0);
                
                // X is red, O is blue - with brighter color variation and stronger contrast
                vec3 color = ${type === 'X' ? 
                    'vec3(1.0, 0.3 + 0.15 * sin(time + vDistFromCenter * 10.0), 0.3)' : 
                    'vec3(0.3, 0.4 + 0.15 * sin(time + vDistFromCenter * 10.0), 1.0)'};
                
                // Add pulsing brightness to make particles more visible
                color += vec3(0.15) * sin(time * 2.0);
                
                // Apply visibility factor 
                gl_FragColor = vec4(color * glow, alpha * 0.95 * vVisibility);
                
                // Add discarding of nearly transparent fragments for better performance
                if (gl_FragColor.a < 0.05) discard;
            }
        `,
        uniforms: { 
            time: { value: 0 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide
    });

    const particles = new THREE.Points(geometry, shaderMaterial);
    particles.position.copy(position);
    return particles;
}