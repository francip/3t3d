import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TicTacToe } from './game.js';
import { createCell } from './shaders.js';
import { createParticleSystem } from './particles.js';

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

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
        const winner = game.makeMove(x, y, z);
        if (game.board[x][y][z]) {
            const particles = createParticleSystem(game.board[x][y][z], cell.position);
            scene.add(particles);
            activeParticles.push(particles);
        }
        if (winner) {
            alert(`${winner} wins!`);
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
    
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});