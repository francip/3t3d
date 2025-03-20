// Importing from the particle-styles directory
import { 
    createParticleSystem, 
    createSimplifiedIndicatorParticles,
    createEmberGlowParticleSystem,
    createQuantumFluxParticleSystem,
    createNebulaWhisperParticleSystem
} from './particle-styles/index.js';

// Function to set the active particle system
export function setActiveParticleSystem(styleName) {
    if (styleName === 'ember-glow') {
        window.__ActiveParticleSystem = createEmberGlowParticleSystem;
    } else if (styleName === 'quantum-flux') {
        window.__ActiveParticleSystem = createQuantumFluxParticleSystem;
    } else if (styleName === 'nebula-whisper') {
        window.__ActiveParticleSystem = createNebulaWhisperParticleSystem;
    }
}

// Re-export for backward compatibility and new functionality
export { 
    createParticleSystem,
    createSimplifiedIndicatorParticles,
    createEmberGlowParticleSystem,
    createQuantumFluxParticleSystem,
    createNebulaWhisperParticleSystem
};