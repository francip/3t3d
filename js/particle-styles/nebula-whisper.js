import * as THREE from 'three';

export function createNebulaWhisperParticleSystem(type, position) {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const cellSize = 0.4; 

    for (let i = 0; i < particleCount; i++) {
        // Create a more complex initial pattern for stylized systems
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.1 + Math.random() * 0.3; // Min radius to ensure some spread
        
        // Create different initial distributions for X and O
        if (type === 'X') {
            // X gets a cross pattern
            const diagonal = Math.random() > 0.5;
            const dist = Math.random() * 0.3;
            
            if (diagonal) {
                initialPositions[i * 3] = dist * (Math.random() > 0.5 ? 1 : -1);
                initialPositions[i * 3 + 1] = dist * (Math.random() > 0.5 ? 1 : -1);
            } else {
                // Some random particles too
                initialPositions[i * 3] = Math.cos(angle) * radius;
                initialPositions[i * 3 + 1] = Math.sin(angle) * radius;
            }
        } else {
            // O gets a circular pattern
            initialPositions[i * 3] = Math.cos(angle) * radius;
            initialPositions[i * 3 + 1] = Math.sin(angle) * radius;
        }
        
        initialPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
        
        // Copy to current positions
        positions[i * 3] = initialPositions[i * 3];
        positions[i * 3 + 1] = initialPositions[i * 3 + 1];
        positions[i * 3 + 2] = initialPositions[i * 3 + 2];
        
        // Velocities with more variance for stylized mode
        velocities[i * 3] = (Math.random() - 0.5) * 0.04;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.04;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
        
        // Smaller sizes for better proportion
        sizes[i] = 1.0 + Math.random() * 2.0;
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
            varying vec3 vTangent;
            
            void main() {
                // Create complex motion using composite sine and cosine waves
                float localTime = time * 0.6; // Faster time scale for more dynamic movement
                
                // Each position component combines two trigonometric functions:
                // 1. Primary sine wave with larger amplitude (0.15)
                // 2. Secondary wave (cos or sin) with smaller amplitude (0.07)
                // This creates complex non-repeating motion patterns
                vec3 offset = vec3(
                    // X offset: sin wave (primary) + cos wave (secondary)
                    sin(localTime * 1.2 + initialPosition.x * 12.0) * 0.15 +  // Primary wave
                    cos(localTime * 0.7 + initialPosition.z * 5.0) * 0.07,    // Secondary wave
                    
                    // Y offset: sin wave (primary) + sin wave (secondary)
                    sin(localTime * 1.7 + initialPosition.y * 14.0) * 0.15 +  // Primary wave
                    sin(localTime * 0.9 + initialPosition.x * 7.0) * 0.07,    // Secondary wave
                    
                    // Z offset: sin wave (primary) + cos wave (secondary)
                    sin(localTime * 2.3 + initialPosition.z * 16.0) * 0.15 +  // Primary wave
                    cos(localTime * 1.3 + initialPosition.y * 9.0) * 0.07     // Secondary wave
                );
                
                // Calculate positions with more dynamic motion
                vec3 pos = initialPosition + offset + velocity * localTime;
                
                // More pronounced type-specific effects
                ${type === 'X' ? 
                    // X pattern - diagonal motion with reduced amplitude
                    'float xFactor = 0.35 + 0.15 * sin(time); pos.xy = mix(pos.xy, vec2(sign(pos.x) * 0.25 * cos(time * 0.3), sign(pos.y) * 0.25 * sin(time * 0.3)), xFactor); pos.z *= 0.7 + 0.2 * sin(time * 0.5);' : 
                    // O pattern - spiral with reduced radius
                    'float angle = atan(pos.y, pos.x) + 0.4 * time; float radius = length(pos.xy) * (0.5 + 0.2 * sin(time * 0.7)); pos.x = cos(angle) * radius; pos.y = sin(angle) * radius; pos.z *= 0.7 + 0.2 * cos(time * 0.5);'}
                
                // More aggressive constraint to keep particles tightly contained
                float boxSize = 0.42; // Use same box size as other styles for consistency
                if (abs(pos.x) > boxSize || abs(pos.y) > boxSize || abs(pos.z) > boxSize) {
                    // More aggressive scaling to pull particles in from the edges
                    pos *= 0.85; 
                }
                
                // Calculate tangent for special effects
                vTangent = normalize(vec3(sin(localTime + pos.x), cos(localTime + pos.y), sin(localTime * 1.2 + pos.z)));
                
                // Calculate distance for shading effects
                vDistFromCenter = length(pos) / boxSize;
                
                // Calculate view space position
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                
                // Enhanced visibility calculation
                vVisibility = 1.0;
                
                // Dynamic point size - further reduced for better consistency
                float distanceToCamera = -mvPosition.z;
                // Smaller pulsing effect to prevent oversized particles
                float sizeScale = 0.8 + 0.2 * sin(time * 2.0 + vDistFromCenter * 6.0);
                // Further reduce the base multiplier from 25.0 to 18.0 for better miniboard compatibility
                gl_PointSize = size * sizeScale * (1.0 / distanceToCamera) * 18.0;
                
                gl_Position = projectionMatrix * mvPosition;
                vUv = uv;
            }
        `,
        fragmentShader: `
            uniform float time;
            varying vec2 vUv;
            varying float vDistFromCenter;
            varying float vVisibility;
            varying vec3 vTangent;
            
            void main() {
                // Enhanced point rendering with more elaborate effects
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                
                // More interesting point shape
                float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
                
                // Add some variation to the shape based on tangent
                float shapeVariation = 0.05 * sin(atan(vTangent.y, vTangent.x) * 8.0 + time * 2.0);
                alpha *= 1.0 + shapeVariation;
                
                // More dramatic glow effect
                float glow = 0.7 + 0.3 * sin(time * 4.0 + vDistFromCenter * 8.0);
                
                // Enhanced color with more variation - intensified to compensate for smaller particles
                vec3 color = ${type === 'X' ? 
                    'vec3(1.0 + 0.0 * sin(time + dist * 15.0), 0.15 + 0.25 * sin(time + vDistFromCenter * 12.0), 0.15 + 0.15 * cos(time * 1.5))' : 
                    'vec3(0.15 + 0.15 * sin(time * 1.2), 0.3 + 0.2 * sin(time + vDistFromCenter * 6.0), 1.0 + 0.0 * cos(time + dist * 15.0))'};
                
                // Add subtle color fringing with increased intensity
                color += vec3(0.15, 0.2, 0.25) * (1.0 - dist);
                
                // Apply more dramatic pulsing with increased brightness
                color += vec3(0.25) * sin(time * 3.0 + vDistFromCenter * 10.0);
                
                gl_FragColor = vec4(color * glow, alpha * 0.9 * vVisibility);
                
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