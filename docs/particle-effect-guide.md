# Particle Effect Development Guide

This document outlines the standardized approach for creating particle effects that inhabit specific cells in our 3D Tic-Tac-Toe game.

## Core Design Philosophy

Each particle effect in the game should:
1. Operate within a confined volume (cell)
2. Respect geometry and boundaries
3. Be player-agnostic and fully configurable through parameters
4. Adapt appropriately to different display contexts (main board vs. mini boards)
5. Support extension to any number of players/markers

## Standard Parameters

All particle systems should accept and utilize these core parameters:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `position` | Vector3 | Center position of the effect | (Required) |
| `volume` | Object | Defines the containment volume | `{ size: 0.42 }` |
| `geometry` | Object | Defines shape characteristics | `{ type: 'default' }` |
| `color` | Object | Color configuration for particles | `{ primary: [1.0, 1.0, 1.0] }` |
| `particleSizeFactor` | Number | Scale factor for particle size (0.0-1.0) | 1.0 |
| `particleCount` | Number | Number of particles to generate | 500 |
| `animationSpeed` | Number | Time scaling factor | 1.0 |
| `movementPattern` | Object | Controls the particle motion algorithm | (Pattern-specific) |

## Volume Configuration

The `volume` parameter controls the spatial constraints:

```javascript
{
  size: 0.42,                // Box radius from center (default: 0.42)
  shape: 'box',              // 'box', 'sphere', 'cylinder' (default: 'box')
  boundaryBehavior: 'soft'   // 'soft', 'hard', 'wrap', 'fade' (default: 'soft')
}
```

Boundary behaviors:
- `soft`: Particles gently pushed back when hitting boundaries
- `hard`: Particles bounce off boundaries
- `wrap`: Particles reappear on opposite side
- `fade`: Particles fade out near boundaries

## Geometry Configuration

The `geometry` parameter controls how particles relate to the underlying shape:

```javascript
{
  type: 'default',           // 'default', 'edge', 'vertex', 'surface', 'volume' (default: 'default')
  distribution: 'random',    // 'random', 'uniform', 'gaussian' (default: 'random')
  adherence: 0.5             // 0.0 (ignore geometry) to 1.0 (strict adherence) (default: 0.5)
}
```

Geometry types:
- `default`: General particle cloud within volume
- `edge`: Particles tend to follow the edges of the symbol
- `vertex`: Particles cluster around vertices/corners
- `surface`: Particles distribute across symbol surface
- `volume`: Particles fill the entire volume

## Color Configuration

Color parameters allow for game-level customization by player:

```javascript
{
  primary: [1.0, 1.0, 1.0],      // RGB primary color
  secondary: [0.8, 0.8, 0.8],    // Secondary/accent color
  variation: 0.2,                // Random color variation (0.0-1.0)
  scheme: 'complementary'        // 'complementary', 'analogous', 'monochrome'
}
```

## Movement Pattern Configuration

The `movementPattern` parameter allows customization of particle behavior:

```javascript
{
  type: 'orbital',              // 'orbital', 'flowField', 'attraction', 'wave', 'chaos'
  strength: 0.5,                // Overall intensity of the movement (0.0-1.0)
  directionality: 0.7,          // How directional vs random the motion is (0.0-1.0)
  patternSpecific: {            // Parameters specific to the pattern type
    // For orbital:
    axis: [0, 1, 0],            // Rotation axis
    radius: 0.3,                // Base orbital radius
    
    // For flowField:
    noiseScale: 0.1,            // Scale of noise field
    
    // For attraction:
    points: [[0.2, 0.2, 0], [-0.2, -0.2, 0]],  // Attraction point locations
    
    // For wave:
    frequencies: [1.0, 0.7, 1.3],  // Wave frequencies for x, y, z
    amplitudes: [0.1, 0.15, 0.08],  // Wave amplitudes for x, y, z
    
    // For chaos:
    system: 'lorenz',           // 'lorenz', 'rossler', 'thomas', etc.
    parameters: [10, 28, 8/3]   // System-specific parameters
  }
}
```

## Implementation Example

Typical implementation pattern:

```javascript
export function createParticleSystem(position, options = {}) {
    // 1. Set defaults and merge with options
    const { 
        volume = { size: 0.42, shape: 'box', boundaryBehavior: 'soft' },
        geometry = { type: 'default', distribution: 'random', adherence: 0.5 },
        color = { primary: [1.0, 1.0, 1.0], secondary: [0.8, 0.8, 0.8], variation: 0.2 },
        particleSizeFactor = 1.0,
        particleCount = 500,
        animationSpeed = 1.0,
        movementPattern = { type: 'wave', strength: 0.5 }
    } = options;
    
    // 2. Configure particle geometry
    const geometry = new THREE.BufferGeometry();
    // ...set up positions, velocities, etc. based on geometry and distribution
    
    // 3. Define shader material with correct parameters
    const shaderMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            attribute vec3 velocity;
            attribute vec3 initialPosition;
            attribute float size;
            uniform float time;
            uniform vec3 primaryColor;
            uniform vec3 secondaryColor;
            uniform float boundarySize;
            uniform float movementStrength;
            // ...more uniforms
            
            varying vec2 vUv;
            varying float vDistFromCenter;
            
            void main() {
                // Apply correct movement algorithm based on pattern type
                vec3 pos;
                ${generateMovementCode(movementPattern)}
                
                // Apply boundary constraints
                ${generateBoundaryCode(volume)}
                
                // Calculate distance from center for coloring
                vDistFromCenter = length(pos) / boundarySize;
                
                // Standard point size calculation
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * particleSizeFactor * (1.0 / -mvPosition.z) * 60.0;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 primaryColor;
            uniform vec3 secondaryColor;
            uniform float colorVariation;
            
            varying vec2 vUv;
            varying float vDistFromCenter;
            
            void main() {
                // Distance from center of point
                float dist = length(gl_PointCoord - vec2(0.5));
                
                // Create circular points with falloff
                float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                
                // Apply color effects based on configuration
                vec3 color = mix(primaryColor, secondaryColor, vDistFromCenter);
                
                // Add variations and effects
                color += primaryColor * sin(time * 2.0) * 0.1;
                
                gl_FragColor = vec4(color, alpha);
                if (gl_FragColor.a < 0.05) discard;
            }
        `,
        uniforms: { 
            time: { value: 0 },
            boundarySize: { value: volume.size },
            primaryColor: { value: new THREE.Vector3(...color.primary) },
            secondaryColor: { value: new THREE.Vector3(...color.secondary) },
            colorVariation: { value: color.variation },
            particleSizeFactor: { value: particleSizeFactor },
            movementStrength: { value: movementPattern.strength },
            // ...additional parameter-specific uniforms
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    const particles = new THREE.Points(geometry, shaderMaterial);
    particles.position.copy(position);
    return particles;
}

// Helper function for generating movement code based on pattern type
function generateMovementCode(pattern) {
    switch(pattern.type) {
        case 'orbital':
            return `
                float angle = time * movementStrength;
                float radius = initialPosition.x * ${pattern.patternSpecific?.radius || 0.3};
                pos = vec3(
                    cos(angle) * radius,
                    sin(angle) * radius,
                    initialPosition.z
                );
            `;
        case 'wave':
            return `
                vec3 frequencies = vec3(${pattern.patternSpecific?.frequencies?.join(', ') || '1.0, 0.7, 1.3'});
                vec3 amplitudes = vec3(${pattern.patternSpecific?.amplitudes?.join(', ') || '0.1, 0.15, 0.08'});
                pos = initialPosition + vec3(
                    sin(time * frequencies.x + initialPosition.x * 10.0) * amplitudes.x,
                    sin(time * frequencies.y + initialPosition.y * 10.0) * amplitudes.y,
                    sin(time * frequencies.z + initialPosition.z * 10.0) * amplitudes.z
                ) * movementStrength;
            `;
        // ... other pattern implementations
        default:
            return `pos = initialPosition;`;
    }
}

// Helper function for generating boundary constraint code
function generateBoundaryCode(volume) {
    switch(volume.boundaryBehavior) {
        case 'hard':
            return `
                if (abs(pos.x) > boundarySize) pos.x = sign(pos.x) * boundarySize;
                if (abs(pos.y) > boundarySize) pos.y = sign(pos.y) * boundarySize;
                if (abs(pos.z) > boundarySize) pos.z = sign(pos.z) * boundarySize;
            `;
        case 'soft':
            return `
                if (abs(pos.x) > boundarySize || abs(pos.y) > boundarySize || abs(pos.z) > boundarySize) {
                    pos *= 0.9;
                }
            `;
        // ... other boundary behaviors
        default:
            return ``;
    }
}
```

## Adapting to Display Context

Effects should be adaptable to both main board and mini board displays:

```javascript
// Configure a particle system for specific cell size
function configureParticleSystemForCell(particleSystem, targetCellSize, options) {
    const { 
        originalCellSize = 0.9,
        safetyMargin = 0.5
    } = options || {};
    
    // Scale particle system appropriately
    const scaleFactor = (targetCellSize / originalCellSize) * safetyMargin;
    particleSystem.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
    // Adjust shader parameters if needed
    if (particleSystem.material && particleSystem.material.uniforms) {
        // Update boundary size, point size calculations, etc.
    }
}
```

## Game Integration Example

The game code would handle player-specific styling, not the particle effect itself:

```javascript
// In game.js
function createPlayerMarker(player, position) {
    // Each player has its own configuration
    const playerConfigs = {
        player1: {
            color: { primary: [1.0, 0.3, 0.3], secondary: [1.0, 0.1, 0.1] },
            movementPattern: { type: 'wave', strength: 0.7 }
        },
        player2: {
            color: { primary: [0.3, 0.4, 1.0], secondary: [0.1, 0.2, 1.0] },
            movementPattern: { type: 'orbital', strength: 0.5 }
        },
        player3: {
            color: { primary: [0.3, 1.0, 0.3], secondary: [0.1, 0.8, 0.1] },
            movementPattern: { type: 'flowField', strength: 0.6 }
        }
    };
    
    // Create particle system with player-specific configuration
    return createParticleSystem(position, playerConfigs[player]);
}
```

## GPU Optimization Considerations

- Limit particle count for mini board displays
- Use efficient boundary checking techniques
- Consider LOD (Level of Detail) based on camera distance
- Use instanced rendering where appropriate
- Implement efficient shader branching for different particle behaviors

## Reference Implementations

For detailed code examples, see our current particle effects:
- [Quantum Flux](/js/particle-styles/quantum-flux.js): Fluid orbital motion with bouncing behavior
- [Ember Glow](/js/particle-styles/ember-glow.js): Heat/fire-like effects with edge adherence
- [Nebula Whisper](/js/particle-styles/nebula-whisper.js): Complex wave motion with distinct type behaviors

See also: [Nebula Whisper Parameters](/docs/nebula-whisper-parameters.md) for a detailed examination of parameter tuning.