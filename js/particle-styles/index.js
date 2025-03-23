// Export all particle styles from a centralized file
import { createEmberGlowParticleSystem } from './ember-glow.js';
import { createQuantumFluxParticleSystem } from './quantum-flux.js';
import { createNebulaWhisperParticleSystem } from './nebula-whisper.js';

// Re-export the imported styles
export { createEmberGlowParticleSystem, createQuantumFluxParticleSystem, createNebulaWhisperParticleSystem };

/**
 * Default configurations for each player's particle appearance
 * These get applied by the game logic, not within the particle systems themselves
 */
export const defaultPlayerStyles = {
    X: {
        // Red-themed with diagonal movement for X
        color: { 
            primary: [1.0, 0.3, 0.3], 
            secondary: [1.0, 0.1, 0.1],
            variation: 0.2
        },
        movementPattern: { 
            type: 'diagonal', 
            strength: 0.7 
        },
        geometry: {
            distribution: 'cross'
        }
    },
    O: {
        // Blue-themed with orbital movement for O
        color: { 
            primary: [0.3, 0.4, 1.0], 
            secondary: [0.1, 0.2, 1.0],
            variation: 0.2 
        },
        movementPattern: { 
            type: 'orbital', 
            strength: 0.6
        },
        geometry: {
            distribution: 'circular'
        }
    }
};

// Create a more simplified version of particles for the turn indicator
export function createSimplifiedIndicatorParticles(player, position) {
    // Get player-specific styling
    const playerStyle = defaultPlayerStyles[player] || {};
    
    // Create particles using the quantum flux style with player styling
    // This implementation needs to be updated to support the new API
    const particles = createQuantumFluxParticleSystem(position, {
        // Apply player-specific styling
        color: playerStyle.color,
        // Override with smaller size for indicator
        particleSizeFactor: 0.8
    });
    
    // Make the particles more densely packed for the small indicator
    if (particles.material && particles.material.uniforms) {
        const originalUpdate = particles.material.onBeforeCompile;
        particles.material.onBeforeCompile = function(shader) {
            // Original modifications if any
            if (originalUpdate) originalUpdate(shader);
            
            // Make the particles more dense in the center
            shader.vertexShader = shader.vertexShader.replace(
                'vec3 pos = initialPosition + offset + velocity * localTime;',
                'vec3 pos = initialPosition * 0.7 + offset * 0.8 + velocity * localTime * 0.8;'
            );
        };
    }
    
    return particles;
}

// Define a global active particle system that can be changed at runtime
window.__ActiveParticleSystem = createQuantumFluxParticleSystem;

// Dynamically use the current active particle system with player-specific styling
export function createParticleSystem(player, position) {
    // Get player-specific styling
    const playerStyle = defaultPlayerStyles[player] || {};
    
    // Use the active particle system with player styling
    return window.__ActiveParticleSystem(position, playerStyle);
}