import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TicTacToe } from './game.js';
import { createCell } from './shaders.js';
import { createParticleSystem, createSimplifiedIndicatorParticles } from './particles.js';

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

// Game Setup
const game = new TicTacToe();
const cells = [];
for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
            const cell = createCell(x, y, z);
            cells.push(cell);
            scene.add(cell);
        }
    }
}

camera.position.z = 10;

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
    container.style.padding = '5px 10px';
    container.style.borderRadius = '15px';
    
    // Create text element
    const textElement = document.createElement('div');
    textElement.style.color = '#ffffff';
    textElement.style.fontSize = '14px';
    textElement.style.fontFamily = 'Arial, sans-serif';
    textElement.style.marginRight = '10px';
    textElement.style.textShadow = '0 0 5px rgba(0,0,0,0.8)';
    textElement.style.letterSpacing = '1px';
    textElement.textContent = 'NEXT';
    container.appendChild(textElement);
    
    // Create canvas for the 3D turn indicator
    const indicatorCanvas = document.createElement('canvas');
    indicatorCanvas.width = 50;
    indicatorCanvas.height = 50;
    container.appendChild(indicatorCanvas);
    
    document.body.appendChild(container);
    
    // Setup mini renderer
    const indicatorRenderer = new THREE.WebGLRenderer({
        canvas: indicatorCanvas,
        alpha: true,
        antialias: true
    });
    indicatorRenderer.setClearColor(0x000000, 0);
    
    // Setup mini scene
    const indicatorScene = new THREE.Scene();
    const indicatorCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
    indicatorCamera.position.z = 2;
    
    // Add light to mini scene
    const indicatorLight = new THREE.AmbientLight(0xffffff, 1);
    indicatorScene.add(indicatorLight);
    
    // Create simplified particle system for current player
    const particlePosition = new THREE.Vector3(0, 0, 0);
    const particles = createSimplifiedIndicatorParticles(game.currentPlayer, particlePosition);
    particles.scale.set(0.25, 0.25, 0.25);
    indicatorScene.add(particles);
    
    return {
        container,
        textElement,
        scene: indicatorScene,
        camera: indicatorCamera,
        renderer: indicatorRenderer,
        particles
    };
}

function updateTurnIndicator() {
    if (!turnIndicator) {
        turnIndicator = createTurnIndicator();
        turnIndicatorText = turnIndicator.textElement;
    }
    
    // Remove old particles and add new ones for current player
    turnIndicator.scene.remove(turnIndicator.particles);
    turnIndicator.particles = createSimplifiedIndicatorParticles(game.currentPlayer, new THREE.Vector3(0, 0, 0));
    turnIndicator.particles.scale.set(0.25, 0.25, 0.25);
    turnIndicator.scene.add(turnIndicator.particles);
    
    // Keep text color white as requested
    turnIndicatorText.style.color = '#ffffff';
    
    // Adjust the background color instead to show player
    if (game.currentPlayer === 'X') {
        turnIndicator.container.style.borderBottom = '2px solid #ff5555';
        turnIndicator.container.style.boxShadow = '0 0 8px rgba(255, 85, 85, 0.5)';
    } else {
        turnIndicator.container.style.borderBottom = '2px solid #5555ff';
        turnIndicator.container.style.boxShadow = '0 0 8px rgba(85, 85, 255, 0.5)';
    }
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
    
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cells);
    
    if (intersects.length > 0) {
        const cell = intersects[0].object;
        const [x, y, z] = [
            Math.round(cell.position.x + 1),
            Math.round(cell.position.y + 1),
            Math.round(cell.position.z + 1)
        ];
        
        const prevPlayer = game.currentPlayer;
        const winner = game.makeMove(x, y, z);
        
        if (game.board[x][y][z]) {
            // Add particles for the move
            const particles = createParticleSystem(game.board[x][y][z], cell.position);
            scene.add(particles);
            activeParticles.push(particles);
            
            // Only update turn indicator if we actually made a move
            if (game.currentPlayer !== prevPlayer) {
                updateTurnIndicator();
            }
        }
        
        if (winner) {
            // If there's a winner, update the turn indicator text
            turnIndicatorText.textContent = 'WINNER';
            turnIndicatorText.style.fontWeight = 'bold';
            setTimeout(() => {
                alert(`${winner} wins!`);
            }, 100);
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
    cells.forEach(cell => cell.material.uniforms.time.value = time);
    activeParticles.forEach(p => p.material.uniforms.time.value = time);
    
    // Update turn indicator particles
    if (turnIndicator && turnIndicator.particles && turnIndicator.renderer) {
        turnIndicator.particles.material.uniforms.time.value = time;
        
        // Rotate the indicator slightly for better visual effect
        turnIndicator.particles.rotation.y = time * 0.3;
        turnIndicator.particles.rotation.x = Math.sin(time * 0.2) * 0.2;
        
        // Render the turn indicator
        turnIndicator.renderer.render(turnIndicator.scene, turnIndicator.camera);
    }
    
    controls.update();
    
    // Sort particles by distance to camera to help with rendering order
    const cameraPosition = camera.position.clone();
    activeParticles.sort((a, b) => {
        const distA = a.position.distanceTo(cameraPosition);
        const distB = b.position.distanceTo(cameraPosition);
        return distB - distA; // Render furthest first
    });
    
    // Debug - log camera position once per second to help troubleshoot
    if (Math.floor(time * 20) % 20 === 0) {
        console.log(`Camera position: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})`);
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
        turnIndicator.renderer.setSize(50, 50);
    }
});