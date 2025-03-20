// Export all particle styles from a centralized file
import { createEmberGlowParticleSystem } from './ember-glow.js';
import { createQuantumFluxParticleSystem } from './quantum-flux.js';
import { createNebulaWhisperParticleSystem } from './nebula-whisper.js';

// Re-export the imported styles
export { createEmberGlowParticleSystem, createQuantumFluxParticleSystem, createNebulaWhisperParticleSystem };

// Create a more simplified version of particles for the turn indicator
// This works because the createXXParticleSystem functions accept type and position
// So we can create a simplified version by wrapping one of the existing ones
export function createSimplifiedIndicatorParticles(type, position) {
    // Create particles using the quantum flux style but modify them
    const particles = createQuantumFluxParticleSystem(type, position);
    
    // Make the particles a bit larger to be more visible in a small display
    if (particles.material && particles.material.uniforms) {
        // We'll override some of the uniforms to make this effect more compact
        // and better suited for the small indicator
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

// Current active particle style - change this to switch styles
export const createParticleSystem = createQuantumFluxParticleSystem;