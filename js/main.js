import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TicTacToe } from './game.js';
import { createCell } from './shaders.js';
import { 
    createParticleSystem, 
    createSimplifiedIndicatorParticles,
    createEmberGlowParticleSystem,
    createQuantumFluxParticleSystem,
    createNebulaWhisperParticleSystem,
    setActiveParticleSystem
} from './particles.js';
import { Board } from './board.js';

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Debug - Add axis helper
const axisHelper = new THREE.AxesHelper(5);
scene.add(axisHelper);
// Red is X, Green is Y, Blue is Z

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(ambientLight, pointLight);

// Game Configuration
const config = {
    width: 3,
    height: 3,
    depth: 3,
    winLength: 3
};

// Game Setup
const game = new TicTacToe(config.width, config.height, config.depth, config.winLength);
const board = new Board(config.width, config.height, config.depth);
scene.add(board.getObject());

// Set camera position
camera.position.z = 10;

// Create style selector UI
function createStyleSelector() {
    // Create container
    const selector = document.createElement('div');
    selector.id = 'style-selector';
    
    // Create gear icon button
    const gear = document.createElement('div');
    gear.id = 'style-gear';
    gear.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
    </svg>`;
    selector.appendChild(gear);
    
    // Create popup
    const popup = document.createElement('div');
    popup.id = 'style-popup';
    
    // Popup content
    popup.innerHTML = `
        <h3>PARTICLE STYLE</h3>
        <div class="style-options">
            <div class="style-option" data-style="ember-glow">
                <div class="style-preview">
                    <canvas id="preview-ember-glow"></canvas>
                </div>
                <div class="style-name">Ember Glow</div>
            </div>
            <div class="style-option selected" data-style="quantum-flux">
                <div class="style-preview">
                    <canvas id="preview-quantum-flux"></canvas>
                </div>
                <div class="style-name">Quantum Flux</div>
            </div>
            <div class="style-option" data-style="nebula-whisper">
                <div class="style-preview">
                    <canvas id="preview-nebula-whisper"></canvas>
                </div>
                <div class="style-name">Nebula Whisper</div>
            </div>
        </div>
    `;
    selector.appendChild(popup);
    
    // Add to document
    document.body.appendChild(selector);
    
    // Toggle popup
    gear.addEventListener('click', (e) => {
        e.stopPropagation();
        popup.classList.toggle('visible');
        
        // Initialize previews if popup is now visible
        if (popup.classList.contains('visible')) {
            initializeStylePreviews();
        }
    });
    
    // Close popup when clicking elsewhere
    document.addEventListener('click', () => {
        popup.classList.remove('visible');
    });
    
    // Prevent popup from closing when clicking inside it
    popup.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Handle style selection
    document.querySelectorAll('.style-option').forEach(option => {
        option.addEventListener('click', () => {
            const styleName = option.getAttribute('data-style');
            
            // Update selection UI
            document.querySelectorAll('.style-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            option.classList.add('selected');
            
            // Set the active particle system
            setActiveParticleSystem(styleName);
            
            // Update turn indicator with the new style
            if (turnIndicator) {
                updateTurnIndicator();
            }
            
            // Optional: close the popup after selection
            // popup.classList.remove('visible');
        });
    });
    
    return selector;
}

// Style preview renderers
const previewRenderers = {};

// Setup style previews with small rotating cubes and particle systems
function initializeStylePreviews() {
    const styles = [
        { name: 'ember-glow', fn: createEmberGlowParticleSystem },
        { name: 'quantum-flux', fn: createQuantumFluxParticleSystem },
        { name: 'nebula-whisper', fn: createNebulaWhisperParticleSystem }
    ];
    
    styles.forEach(style => {
        const canvasId = `preview-${style.name}`;
        const canvas = document.getElementById(canvasId);
        
        // Skip if already initialized
        if (previewRenderers[style.name]) return;
        
        // Create mini scene, camera, renderer
        const previewScene = new THREE.Scene();
        const previewCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
        previewCamera.position.set(1.5, 1.5, 1.5);
        previewCamera.lookAt(0, 0, 0);
        
        const previewRenderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });
        previewRenderer.setClearColor(0x111111, 0.1); // Dark gray transparent background
        previewRenderer.setSize(70, 70);
        
        // Add light
        const previewLight = new THREE.AmbientLight(0xffffff, 1);
        previewScene.add(previewLight);
        
        // Create a small cell - uniform across all previews
        const cellGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const cellMaterial = new THREE.MeshBasicMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        const cell = new THREE.Mesh(cellGeometry, cellMaterial);
        previewScene.add(cell);
        
        // Add particles of both types
        const xParticles = style.fn('X', new THREE.Vector3(0, 0, 0));
        xParticles.scale.set(0.3, 0.3, 0.3);
        previewScene.add(xParticles);
        
        // Store the renderer and scene for animation
        previewRenderers[style.name] = {
            renderer: previewRenderer,
            scene: previewScene,
            camera: previewCamera,
            cell: cell,
            particles: xParticles
        };
    });
}

// Create the style selector
const styleSelector = createStyleSelector();

// Turn Indicator Setup
let turnIndicator;
let turnIndicatorText;

function createTurnIndicator() {
    // Create container for the turn indicator
    const container = document.createElement('div');
    container.id = 'turn-indicator';
    container.style.position = 'absolute';
    container.style.top = '20px';
    container.style.left = '50%';
    container.style.transform = 'translateX(-50%)';
    container.style.zIndex = '100';
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.alignItems = 'center';
    container.style.pointerEvents = 'none'; // Don't catch mouse events
    container.style.backgroundColor = 'rgba(0,0,0,0.2)';
    container.style.padding = '4px 8px';
    container.style.borderRadius = '8px';
    
    // Create text element
    const textElement = document.createElement('div');
    textElement.style.color = '#ffffff';
    textElement.style.fontSize = '12px';
    textElement.style.fontFamily = 'Arial, sans-serif';
    textElement.style.marginRight = '8px';
    textElement.style.textShadow = '0 0 3px rgba(0,0,0,0.5)';
    textElement.style.letterSpacing = '1px';
    textElement.textContent = 'NEXT';
    container.appendChild(textElement);
    
    // Create canvas for the 3D turn indicator
    const indicatorCanvas = document.createElement('canvas');
    indicatorCanvas.width = 64; // Larger canvas for better visualization
    indicatorCanvas.height = 64;
    container.appendChild(indicatorCanvas);
    
    document.body.appendChild(container);
    
    // Setup mini renderer
    const indicatorRenderer = new THREE.WebGLRenderer({
        canvas: indicatorCanvas,
        alpha: true,
        antialias: true
    });
    // Set the clear color to fully transparent black
    indicatorRenderer.setClearColor(0x000000, 0);
    
    // Setup mini scene with transparent background
    const indicatorScene = new THREE.Scene();
    indicatorScene.background = null; // Make scene background transparent
    
    // Create a camera that looks at the mini board from an angled perspective
    // Use a narrower field of view to reduce distortion at the edges
    const indicatorCamera = new THREE.PerspectiveCamera(40, 1, 0.1, 10);
    // Position slightly further back to ensure full containment
    indicatorCamera.position.set(1.7, 1.7, 1.7);
    indicatorCamera.lookAt(0, 0, 0);
    
    // Add light to mini scene
    const indicatorLight = new THREE.AmbientLight(0xffffff, 1);
    indicatorScene.add(indicatorLight);
    
    // Create a directional light for better depth perception
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(1, 1, 1);
    indicatorScene.add(directionalLight);
    
    // Create a mini 1x1x1 board (cell)
    // Use exact proportion ratios from main board
    const miniCellSize = 0.7;
    const miniBoard = new Board(1, 1, 1, { 
        cellSize: miniCellSize,  // Base cell size for scale calculations
        spacing: 1.0
    });
    
    // Move the mini board to center
    miniBoard.getObject().position.set(0, 0, 0);
    indicatorScene.add(miniBoard.getObject());
    
    // Create particle system for current player placed inside the cell
    const particlePosition = new THREE.Vector3(0, 0, 0);
    const particles = createParticleSystem(game.currentPlayer, particlePosition);
    
    // Define constants for cell sizes and box sizes
    const mainCellSize = 0.9; // From board.js default
    const mainBoxSize = 0.42; // From particle shader default
    
    // Scale down the particles to fit in the mini cell
    // Calculate scale based on the ratio of mini cell size to main cell size
    const particleScale = miniCellSize / mainCellSize * 0.9; // Scale factor with a small safety margin
    particles.scale.set(particleScale, particleScale, particleScale);
    
    // Calculate proper containment box size based on proportions from main board
    // Formula: boxSize = (mainBoxSize / mainCellSize) * miniCellSize
    const miniBoxSize = (mainBoxSize / mainCellSize) * miniCellSize;
    
    // Add containment to the particle shader with calculated proportional size
    if (particles.material && particles.material.onBeforeCompile) {
        const originalUpdate = particles.material.onBeforeCompile;
        particles.material.onBeforeCompile = function(shader) {
            // Run the original modifications
            if (originalUpdate) originalUpdate(shader);
            
            // Use calculated box size based on proper proportions
            shader.vertexShader = shader.vertexShader.replace(
                'float boxSize = 0.42;',
                `float boxSize = ${miniBoxSize.toFixed(3)};` // Proportionally scaled box size
            );
        };
    }
    
    indicatorScene.add(particles);
    
    return {
        container,
        textElement,
        scene: indicatorScene,
        camera: indicatorCamera,
        renderer: indicatorRenderer,
        particles,
        miniBoard
    };
}

function updateTurnIndicator() {
    if (!turnIndicator) {
        turnIndicator = createTurnIndicator();
        turnIndicatorText = turnIndicator.textElement;
    }
    
    // Remove old particles and add new ones for current player
    turnIndicator.scene.remove(turnIndicator.particles);
    turnIndicator.particles = createParticleSystem(game.currentPlayer, new THREE.Vector3(0, 0, 0));
    
    // Define constants for cell sizes and box sizes
    const mainCellSize = 0.9; // From board.js default
    const mainBoxSize = 0.42; // From particle shader default
    const miniCellSize = 0.7; // From our miniboard definition
    
    // Calculate scale based on the ratio of mini cell size to main cell size
    const particleScale = miniCellSize / mainCellSize * 0.9; // Scale factor with safety margin
    turnIndicator.particles.scale.set(particleScale, particleScale, particleScale);
    
    // Calculate proper containment box size based on proportions from main board
    // Formula: boxSize = (mainBoxSize / mainCellSize) * miniCellSize
    const miniBoxSize = (mainBoxSize / mainCellSize) * miniCellSize;
    
    // Add containment to the particle shader with calculated proportional size
    if (turnIndicator.particles.material && turnIndicator.particles.material.onBeforeCompile) {
        const originalUpdate = turnIndicator.particles.material.onBeforeCompile;
        turnIndicator.particles.material.onBeforeCompile = function(shader) {
            // Run the original modifications
            if (originalUpdate) originalUpdate(shader);
            
            // Use calculated box size based on proper proportions
            shader.vertexShader = shader.vertexShader.replace(
                'float boxSize = 0.42;',
                `float boxSize = ${miniBoxSize.toFixed(3)};` // Proportionally scaled box size
            );
        };
    }
    
    turnIndicator.scene.add(turnIndicator.particles);
    
    // Keep text color white as requested
    turnIndicatorText.style.color = '#ffffff';
    
    // Animate the mini board to match the current player
    const miniCell = turnIndicator.miniBoard.getCell(1, 1, 1);
    if (miniCell) {
        // Add subtle glow to cell based on player
        if (game.currentPlayer === 'X') {
            // Red glow for X
            miniCell.material.uniforms.playerColor = { value: new THREE.Vector3(1.0, 0.2, 0.2) };
        } else {
            // Blue glow for O
            miniCell.material.uniforms.playerColor = { value: new THREE.Vector3(0.2, 0.2, 1.0) };
        }
    }
    
    // Leave the container styling to CSS
}

// Create initial turn indicator
updateTurnIndicator();

// Input Handling
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const activeParticles = [];

function onClick(event) {
    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    const clientY = event.clientY || (event.touches && event.touches[0].clientY);
    
    // Convert screen coordinates to normalized device coordinates (NDC)
    // NDC x-coordinate: -1 (left) to +1 (right)
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    // NDC y-coordinate: -1 (bottom) to +1 (top) - note the negative sign to flip Y axis
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(board.getAllCells());
    
    if (intersects.length > 0) {
        const cell = intersects[0].object;
        const [x, y, z] = board.getCellCoordinates(cell);
        
        const prevPlayer = game.currentPlayer;
        const winner = game.makeMove(x, y, z);
        
        // If the move was valid (not already occupied)
        if (game.getCell(x, y, z)) {
            // Add particles for the move
            const particles = createParticleSystem(game.getCell(x, y, z), cell.position);
            scene.add(particles);
            activeParticles.push(particles);
            
            // Only update turn indicator if we actually made a move
            if (game.currentPlayer !== prevPlayer) {
                updateTurnIndicator();
            }
            
            // Handle win or draw
            if (winner) {
                if (winner === 'draw') {
                    turnIndicatorText.textContent = 'DRAW';
                    setTimeout(() => {
                        alert('Game ended in a draw!');
                    }, 100);
                } else {
                    // If there's a winner, update the turn indicator text
                    turnIndicatorText.textContent = 'WINNER';
                    turnIndicatorText.style.fontWeight = 'bold';
                    setTimeout(() => {
                        alert(`${winner} wins!`);
                    }, 100);
                }
            }
        }
    }
}

window.addEventListener('click', onClick);
window.addEventListener('touchstart', (e) => onClick(e));

// Animation Loop
let time = 0;

function animate() {
    requestAnimationFrame(animate);
    
    time += 0.05;
    // Animate all board cells
    board.animate(time);
    
    // Animate all active particles in the scene
    activeParticles.forEach(p => p.material.uniforms.time.value = time);
    
    // Update turn indicator 
    if (turnIndicator && turnIndicator.renderer) {
        // Update particle animations
        if (turnIndicator.particles && turnIndicator.particles.material && turnIndicator.particles.material.uniforms) {
            turnIndicator.particles.material.uniforms.time.value = time;
            
            // Rotate the particles slightly for better visual effect
            turnIndicator.particles.rotation.y = time * 0.3;
            turnIndicator.particles.rotation.x = Math.sin(time * 0.2) * 0.2;
        }
        
        // Update the mini board animations if it exists
        if (turnIndicator.miniBoard) {
            // Animate miniBoard cells
            turnIndicator.miniBoard.animate(time);
            
            // Add a small rotation to the mini board for visual interest
            const boardObj = turnIndicator.miniBoard.getObject();
            boardObj.rotation.y = Math.sin(time * 0.2) * 0.2;
            boardObj.rotation.x = Math.sin(time * 0.15) * 0.1;
        }
        
        // Render the turn indicator
        turnIndicator.renderer.render(turnIndicator.scene, turnIndicator.camera);
    }
    
    controls.update();
    
    // Sort particles by distance to camera to help with rendering order
    // This implements a painter's algorithm approach - render furthest objects first
    const cameraPosition = camera.position.clone();
    activeParticles.sort((a, b) => {
        // Calculate distance from each particle system to the camera
        const distA = a.position.distanceTo(cameraPosition);
        const distB = b.position.distanceTo(cameraPosition);
        // Sort in descending order (furthest first, closest last)
        // This ensures proper transparency rendering when particles overlap
        return distB - distA; // Render furthest particles first
    });
    
    // Debug - log camera position once per second to help troubleshoot
    if (Math.floor(time * 20) % 20 === 0) {
        console.log(`Camera position: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})`);
    }
    
    // Animate style previews if they're visible
    if (document.getElementById('style-popup').classList.contains('visible')) {
        Object.values(previewRenderers).forEach(preview => {
            if (preview.cell) {
                preview.cell.rotation.x = time * 0.3;
                preview.cell.rotation.y = time * 0.5;
            }
            
            if (preview.particles && preview.particles.material && preview.particles.material.uniforms) {
                preview.particles.material.uniforms.time.value = time;
                preview.particles.rotation.y = time * 0.3;
            }
            
            preview.renderer.render(preview.scene, preview.camera);
        });
    }
    
    renderer.render(scene, camera);
}
animate();

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Also update turn indicator if it exists
    if (turnIndicator && turnIndicator.renderer) {
        turnIndicator.camera.aspect = 1;
        turnIndicator.camera.updateProjectionMatrix();
        turnIndicator.renderer.setSize(64, 64);
    }
});