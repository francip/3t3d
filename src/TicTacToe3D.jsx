import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TicTacToe } from '../js/game.js';
import { Board } from '../js/board.js';
import { 
    createParticleSystem, 
    createSimplifiedIndicatorParticles,
    createEmberGlowParticleSystem,
    createQuantumFluxParticleSystem,
    createNebulaWhisperParticleSystem,
    setActiveParticleSystem,
    configureParticleSystemForCell
} from '../js/particles.js';

const TicTacToe3D = () => {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const gameRef = useRef(null);
    const boardRef = useRef(null);
    const controlsRef = useRef(null);
    const timeRef = useRef(0);
    const activeParticlesRef = useRef([]);
    const turnIndicatorRef = useRef(null);
    const previewRenderersRef = useRef({});
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());

    // Initialize the 3D scene
    useEffect(() => {
        if (!containerRef.current) return;

        // Scene Setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraRef.current = camera;
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Debug - Add axis helper
        const axisHelper = new THREE.AxesHelper(5);
        scene.add(axisHelper);

        // Orbit Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.minDistance = 8;
        controls.maxDistance = 25;
        controlsRef.current = controls;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(6, 8, 7);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight.position.set(-5, 3, -2);
        scene.add(ambientLight, pointLight, directionalLight);

        // Game Configuration
        const config = {
            width: 3,
            height: 3,
            depth: 3,
            winLength: 3
        };

        // Game Setup
        const game = new TicTacToe(config.width, config.height, config.depth, config.winLength);
        gameRef.current = game;
        
        const board = new Board(config.width, config.height, config.depth);
        boardRef.current = board;
        scene.add(board.getObject());

        // Set camera position
        camera.position.set(6, 5, 8);
        camera.lookAt(0, 0, 0);

        // Set up for global access (needed for particle style system)
        window.__currentParticleStyle = 'quantum-flux';
        
        return () => {
            // Cleanup
            if (renderer && containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('touchstart', handleTouch);
        };
    }, []);

    // Handle resize
    const handleResize = () => {
        if (!cameraRef.current || !rendererRef.current) return;
        
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
        
        if (turnIndicatorRef.current?.renderer) {
            turnIndicatorRef.current.camera.aspect = 1;
            turnIndicatorRef.current.camera.updateProjectionMatrix();
            turnIndicatorRef.current.renderer.setSize(64, 64);
        }
    };

    // Setup event listeners for resize
    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle clicks/touches
    const handleClick = (event) => {
        if (!gameRef.current || !boardRef.current || !cameraRef.current || !sceneRef.current) return;
        
        const clientX = event.clientX || (event.touches && event.touches[0].clientX);
        const clientY = event.clientY || (event.touches && event.touches[0].clientY);
        
        // Convert screen coordinates to normalized device coordinates
        mouseRef.current.x = (clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -(clientY / window.innerHeight) * 2 + 1;
        
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(boardRef.current.getAllCells());
        
        if (intersects.length > 0) {
            const cell = intersects[0].object;
            const [x, y, z] = boardRef.current.getCellCoordinates(cell);
            
            const prevPlayer = gameRef.current.currentPlayer;
            const winner = gameRef.current.makeMove(x, y, z);
            
            // If the move was valid
            if (gameRef.current.getCell(x, y, z)) {
                // Add particles for the move
                const particles = createParticleSystem(gameRef.current.getCell(x, y, z), cell.position);
                
                // Special handling for Nebula Whisper style
                const currentStyle = window.__currentParticleStyle || '';
                if (currentStyle === 'nebula-whisper') {
                    configureParticleSystemForCell(particles, 0.9, 0.9, 0.42, 0.65);
                }
                
                sceneRef.current.add(particles);
                activeParticlesRef.current.push(particles);
                
                // Only update turn indicator if we actually made a move
                if (gameRef.current.currentPlayer !== prevPlayer) {
                    updateTurnIndicator();
                }
                
                // Handle win or draw
                if (winner) {
                    if (winner === 'draw') {
                        if (turnIndicatorRef.current) {
                            turnIndicatorRef.current.textElement.textContent = 'DRAW';
                        }
                        setTimeout(() => {
                            alert('Game ended in a draw!');
                        }, 100);
                    } else {
                        // If there's a winner, update the turn indicator text
                        if (turnIndicatorRef.current) {
                            turnIndicatorRef.current.textElement.textContent = 'WINNER';
                            turnIndicatorRef.current.textElement.style.fontWeight = 'bold';
                        }
                        setTimeout(() => {
                            alert(`${winner} wins!`);
                        }, 100);
                    }
                }
            }
        }
    };

    const handleTouch = (event) => {
        handleClick(event);
    };

    // Setup event listeners for input
    useEffect(() => {
        window.addEventListener('click', handleClick);
        window.addEventListener('touchstart', handleTouch);
        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('touchstart', handleTouch);
        };
    }, []);

    // Turn indicator functions
    const createTurnIndicator = () => {
        if (!gameRef.current) return null;
        
        // ----- UI CONTAINER SETUP -----
        const container = document.createElement('div');
        container.id = 'turn-indicator';
        
        Object.assign(container.style, {
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '100',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            pointerEvents: 'none',
            backgroundColor: 'rgba(0,0,0,0.2)',
            padding: '4px 8px',
            borderRadius: '8px'
        });
        
        const textElement = document.createElement('div');
        Object.assign(textElement.style, {
            color: '#ffffff',
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
            marginRight: '8px',
            textShadow: '0 0 3px rgba(0,0,0,0.5)',
            letterSpacing: '1px'
        });
        textElement.textContent = 'NEXT';
        container.appendChild(textElement);
        
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        container.appendChild(canvas);
        document.body.appendChild(container);
        
        // ----- 3D SCENE SETUP -----
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });
        renderer.setClearColor(0x000000, 0);
        
        const scene = new THREE.Scene();
        scene.background = null;
        
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10);
        camera.position.set(2.0, 2.0, 2.0);
        camera.lookAt(0, 0, 0);
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        // Create mini board
        const miniCellSize = 0.8;
        const miniBoard = new Board(1, 1, 1, { 
            cellSize: miniCellSize, 
            spacing: 1.0
        });
        scene.add(miniBoard.getObject());
        
        // Create particle system for current player
        const particles = createParticleSystem(gameRef.current.currentPlayer, new THREE.Vector3(0, 0, 0));
        
        // Configure particles
        configureParticleSystemForCell(particles, miniCellSize);
        scene.add(particles);
        
        return {
            container,
            textElement,
            scene,
            camera,
            renderer,
            particles,
            miniBoard
        };
    };

    const updateTurnIndicator = () => {
        if (!gameRef.current) return;
        
        // Create the indicator if it doesn't exist
        if (!turnIndicatorRef.current) {
            turnIndicatorRef.current = createTurnIndicator();
        }
        
        const turnIndicator = turnIndicatorRef.current;
        if (!turnIndicator) return;
        
        // Update particles for current player
        turnIndicator.scene.remove(turnIndicator.particles);
        turnIndicator.particles = createParticleSystem(
            gameRef.current.currentPlayer, 
            new THREE.Vector3(0, 0, 0)
        );
        
        // Configure particles
        const currentStyle = window.__currentParticleStyle || '';
        const isNebulaWhisper = currentStyle === 'nebula-whisper';
        
        if (isNebulaWhisper) {
            configureParticleSystemForCell(turnIndicator.particles, 0.8, 0.9, 0.42, 0.4);
        } else {
            configureParticleSystemForCell(turnIndicator.particles, 0.8);
        }
        turnIndicator.scene.add(turnIndicator.particles);
        
        // Keep text styling consistent
        turnIndicator.textElement.style.color = '#ffffff';
        
        // Update cell color based on current player
        const miniCell = turnIndicator.miniBoard.getCell(1, 1, 1);
        if (miniCell) {
            // Set cell glow color based on player
            const colorVector = gameRef.current.currentPlayer === 'X' 
                ? new THREE.Vector3(1.0, 0.2, 0.2)  // Red for X
                : new THREE.Vector3(0.2, 0.2, 1.0); // Blue for O
                
            miniCell.material.uniforms.playerColor = { value: colorVector };
        }
    };

    // Style selector functionality
    const createStyleSelector = () => {
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
            <div class="style-options">
                <div class="style-option" data-style="ember-glow">
                    <div class="style-preview">
                        <canvas id="preview-ember-glow"></canvas>
                    </div>
                    <div class="style-label">Ember Glow</div>
                </div>
                <div class="style-option selected" data-style="quantum-flux">
                    <div class="style-preview">
                        <canvas id="preview-quantum-flux"></canvas>
                    </div>
                    <div class="style-label">Quantum Flux</div>
                </div>
                <div class="style-option" data-style="nebula-whisper">
                    <div class="style-preview">
                        <canvas id="preview-nebula-whisper"></canvas>
                    </div>
                    <div class="style-label">Nebula Whisper</div>
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
                
                // Store current style selection
                window.__currentParticleStyle = styleName;
                updateTurnIndicator();
            });
        });
        
        return selector;
    };

    const initializeStylePreviews = () => {
        const styles = [
            { name: 'ember-glow', fn: createEmberGlowParticleSystem },
            { name: 'quantum-flux', fn: createQuantumFluxParticleSystem },
            { name: 'nebula-whisper', fn: createNebulaWhisperParticleSystem }
        ];
        
        styles.forEach(style => {
            const canvasId = `preview-${style.name}`;
            const canvas = document.getElementById(canvasId);
            
            // Skip if already initialized
            if (previewRenderersRef.current[style.name]) return;
            
            // Create mini scene with transparent background
            const scene = new THREE.Scene();
            scene.background = null;
            
            // Create camera with same perspective as turn indicator
            const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10);
            camera.position.set(2.0, 2.0, 2.0);
            camera.lookAt(0, 0, 0);
            
            // Create renderer with transparency
            const renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: true
            });
            renderer.setClearColor(0x000000, 0);
            renderer.setSize(70, 70);
            
            // Add lighting
            scene.add(new THREE.AmbientLight(0xffffff, 0.7));
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
            directionalLight.position.set(1, 1, 1);
            scene.add(directionalLight);
            
            // Create a mini board (1x1x1)
            const miniCellSize = 0.8;
            const miniBoard = new Board(1, 1, 1, { 
                cellSize: miniCellSize, 
                spacing: 1.0 
            });
            scene.add(miniBoard.getObject());
            
            // Create example particles using this style
            const particles = style.fn('X', new THREE.Vector3(0, 0, 0));
            
            // Configure particles
            if (style.name === 'nebula-whisper') {
                configureParticleSystemForCell(particles, miniCellSize, 0.9, 0.42, 0.4);
            } else {
                configureParticleSystemForCell(particles, miniCellSize);
            }
            scene.add(particles);
            
            // Store components for animation
            previewRenderersRef.current[style.name] = {
                renderer,
                scene,
                camera,
                miniBoard,
                particles
            };
        });
    };

    // Animation function
    useEffect(() => {
        // Create UI elements
        createStyleSelector();
        updateTurnIndicator();
        
        // Animation loop
        const animate = () => {
            if (!sceneRef.current || !rendererRef.current || !cameraRef.current || 
                !boardRef.current || !controlsRef.current) {
                requestAnimationFrame(animate);
                return;
            }
            
            timeRef.current += 0.05;
            const time = timeRef.current;
            
            // Animate board cells
            boardRef.current.animate(time);
            
            // Animate active particles
            activeParticlesRef.current.forEach(p => {
                if (p.material && p.material.uniforms) {
                    p.material.uniforms.time.value = time;
                }
            });
            
            // Animate turn indicator
            if (turnIndicatorRef.current) {
                const turnIndicator = turnIndicatorRef.current;
                
                if (turnIndicator.particles?.material?.uniforms) {
                    turnIndicator.particles.material.uniforms.time.value = time;
                    turnIndicator.particles.rotation.y = time * 0.3;
                    turnIndicator.particles.rotation.x = Math.sin(time * 0.2) * 0.2;
                }
                
                if (turnIndicator.miniBoard) {
                    turnIndicator.miniBoard.animate(time);
                    const boardObj = turnIndicator.miniBoard.getObject();
                    boardObj.rotation.y = Math.sin(time * 0.2) * 0.2;
                    boardObj.rotation.x = Math.sin(time * 0.15) * 0.1;
                }
                
                turnIndicator.renderer.render(turnIndicator.scene, turnIndicator.camera);
            }
            
            // Update controls
            controlsRef.current.update();
            
            // Sort particles by distance to camera
            const cameraPosition = cameraRef.current.position.clone();
            activeParticlesRef.current.sort((a, b) => {
                const distA = a.position.distanceTo(cameraPosition);
                const distB = b.position.distanceTo(cameraPosition);
                return distB - distA;
            });
            
            // Animate style previews
            if (document.getElementById('style-popup')?.classList.contains('visible')) {
                Object.values(previewRenderersRef.current).forEach(preview => {
                    if (preview.particles?.material?.uniforms) {
                        preview.particles.material.uniforms.time.value = time;
                        preview.particles.rotation.y = time * 0.3;
                        preview.particles.rotation.x = Math.sin(time * 0.2) * 0.2;
                    }
                    
                    if (preview.miniBoard) {
                        preview.miniBoard.animate(time);
                        const boardObj = preview.miniBoard.getObject();
                        boardObj.rotation.y = Math.sin(time * 0.2) * 0.2;
                        boardObj.rotation.x = Math.sin(time * 0.15) * 0.1;
                    }
                    
                    preview.renderer.render(preview.scene, preview.camera);
                });
            }
            
            // Render the scene
            rendererRef.current.render(sceneRef.current, cameraRef.current);
            
            requestAnimationFrame(animate);
        };
        
        animate();
        
        // Cleanup
        return () => {
            const styleSelector = document.getElementById('style-selector');
            if (styleSelector) {
                document.body.removeChild(styleSelector);
            }
            
            if (turnIndicatorRef.current) {
                document.body.removeChild(turnIndicatorRef.current.container);
            }
        };
    }, []);

    return (
        <div ref={containerRef} id="game-container" style={{ width: '100%', height: '100%' }} />
    );
};

export default TicTacToe3D;