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
            
            // Find and replace the box size with our calculated value
            // Handle different box size values in different particle styles
            let boxSizeReplaced = false;
            
            // Try the standard box size definition pattern
            if (shader.vertexShader.includes('float boxSize = 0.42;')) {
                shader.vertexShader = shader.vertexShader.replace(
                    'float boxSize = 0.42;',
                    `float boxSize = ${targetBoxSize.toFixed(3)};`
                );
                boxSizeReplaced = true;
            }
            
            // Try alternate box size for nebula whisper
            if (!boxSizeReplaced && shader.vertexShader.includes('float boxSize = 0.45;')) {
                shader.vertexShader = shader.vertexShader.replace(
                    'float boxSize = 0.45;',
                    `float boxSize = ${targetBoxSize.toFixed(3)};`
                );
                boxSizeReplaced = true;
            }
            
            // Adjust point sizes for different particle styles
            
            // Quantum Flux style
            if (shader.vertexShader.includes('gl_PointSize = size * (1.0 / distanceToCamera) * 60.0')) {
                shader.vertexShader = shader.vertexShader.replace(
                    'gl_PointSize = size * (1.0 / distanceToCamera) * 60.0',
                    'gl_PointSize = size * (1.0 / distanceToCamera) * 30.0' // Reduce the base size multiplier
                );
            }
            
            // Ember Glow style - adjust fixed point size
            if (shader.vertexShader.includes('gl_PointSize = mix(2.0, 4.0,')) {
                shader.vertexShader = shader.vertexShader.replace(
                    'gl_PointSize = mix(2.0, 4.0,',
                    'gl_PointSize = mix(4.0, 8.0,' // Double the point sizes to make them more visible
                );
            }
            
            // Nebula Whisper style - we now use a lower base value (18.0) in the original shader
            if (shader.vertexShader.includes('gl_PointSize = size * sizeScale * (1.0 / distanceToCamera) * 18.0')) {
                // For mini boards, we need to scale the point size consistently with other styles
                shader.vertexShader = shader.vertexShader.replace(
                    'gl_PointSize = size * sizeScale * (1.0 / distanceToCamera) * 18.0',
                    'gl_PointSize = size * sizeScale * (1.0 / distanceToCamera) * 15.0' // Reduce further for mini board
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