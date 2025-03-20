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

/**
 * Configure a particle system to fit proportionally within a specified cell size
 * @param {THREE.Points} particleSystem - The particle system to configure
 * @param {number} targetCellSize - The cell size the particles should fit within
 * @param {number} [originalCellSize=0.9] - The original/reference cell size
 * @param {number} [originalBoxSize=0.42] - The original/reference particle containment box size
 * @param {number} [safetyMargin=0.5] - Safety margin to ensure particles stay inside (0-1)
 *                                     Lower values make particles smaller relative to cell
 * @returns {THREE.Points} The configured particle system (same as input)
 */
export function configureParticleSystemForCell(particleSystem, targetCellSize, originalCellSize = 0.9, originalBoxSize = 0.42, safetyMargin = 0.5) {
    if (!particleSystem || !particleSystem.material) return particleSystem;
    
    // Calculate the proportional scale for the particle system
    // We use a smaller safety margin to make particles more compact in the mini board
    const scaleFactor = (targetCellSize / originalCellSize) * safetyMargin;
    
    // Scale the particle system
    particleSystem.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
    // Calculate the box size proportionally
    // Use a slightly smaller box size to constrain particles more tightly
    const targetBoxSize = (originalBoxSize / originalCellSize) * targetCellSize * 0.8;
    
    // Modify the shader if possible
    if (particleSystem.material.onBeforeCompile) {
        const originalOnBeforeCompile = particleSystem.material.onBeforeCompile;
        
        particleSystem.material.onBeforeCompile = function(shader) {
            // Run original modifications if they exist
            if (originalOnBeforeCompile) originalOnBeforeCompile(shader);
            
            // Replace the box size with our calculated value
            shader.vertexShader = shader.vertexShader.replace(
                'float boxSize = 0.42;',
                `float boxSize = ${targetBoxSize.toFixed(3)};`
            );
            
            // Also reduce the point size to make particles smaller
            if (shader.vertexShader.includes('gl_PointSize = size * (1.0 / distanceToCamera) * 60.0')) {
                shader.vertexShader = shader.vertexShader.replace(
                    'gl_PointSize = size * (1.0 / distanceToCamera) * 60.0',
                    'gl_PointSize = size * (1.0 / distanceToCamera) * 30.0' // Reduce the base size multiplier
                );
            }
        };
    }
    
    return particleSystem;
}

// Re-export for backward compatibility and new functionality
export { 
    createParticleSystem,
    createSimplifiedIndicatorParticles,
    createEmberGlowParticleSystem,
    createQuantumFluxParticleSystem,
    createNebulaWhisperParticleSystem
};