import * as THREE from 'three';
import { createCell } from './shaders.js';

/**
 * Board class to handle the 3D tic-tac-toe board creation and management
 * Allows for custom dimensions beyond the standard 3x3x3
 */
export class Board {
    /**
     * Creates a new 3D board with custom dimensions
     * @param {number} width - Number of cells along X axis
     * @param {number} height - Number of cells along Y axis
     * @param {number} depth - Number of cells along Z axis
     * @param {object} options - Additional options (spacing, cellSize, etc.)
     */
    constructor(width = 3, height = 3, depth = 3, options = {}) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        
        // Default options
        this.options = {
            spacing: 1.0,
            cellSize: 0.9,
            ...options
        };
        
        // Calculate the center offset to keep the board centered
        this.centerX = (this.width - 1) / 2;
        this.centerY = (this.height - 1) / 2;
        this.centerZ = (this.depth - 1) / 2;
        
        // Create cells container
        this.cells = [];
        this.cellMap = new Map(); // For easier lookups by position
        
        // Create board object
        this.boardObj = new THREE.Group();
        
        this.createBoard();
    }
    
    /**
     * Creates all the board's cells
     */
    createBoard() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                for (let z = 0; z < this.depth; z++) {
                    // Create cell (use the original cell creation function)
                    const cell = createCell(
                        x - this.centerX, 
                        y - this.centerY, 
                        z - this.centerZ,
                        this.options.cellSize
                    );
                    
                    // Store cell in an array and map for easy access
                    this.cells.push(cell);
                    
                    // Use 1-based indexing for the game logic (0,0,0 -> 1,1,1)
                    const adjustedX = x + 1;
                    const adjustedY = y + 1;
                    const adjustedZ = z + 1;
                    
                    // Store cell with its game board position as key
                    const posKey = `${adjustedX},${adjustedY},${adjustedZ}`;
                    this.cellMap.set(posKey, cell);
                    
                    // Associate cell with its logical position
                    cell.userData = { x: adjustedX, y: adjustedY, z: adjustedZ };
                    
                    // Add to board object
                    this.boardObj.add(cell);
                }
            }
        }
    }
    
    /**
     * Gets the Three.js object for the entire board
     * @returns {THREE.Group} The board object to add to a scene
     */
    getObject() {
        return this.boardObj;
    }
    
    /**
     * Gets a cell at a specific position (using game coordinates: 1-based)
     * @param {number} x - X position (1 to width)
     * @param {number} y - Y position (1 to height)
     * @param {number} z - Z position (1 to depth)
     * @returns {THREE.Mesh|null} The cell mesh or null if not found
     */
    getCell(x, y, z) {
        const posKey = `${x},${y},${z}`;
        return this.cellMap.get(posKey) || null;
    }
    
    /**
     * Get all cells as an array
     * @returns {Array<THREE.Mesh>} Array of all cell meshes
     */
    getAllCells() {
        return this.cells;
    }
    
    /**
     * Animate all cells
     * @param {number} time - The current animation time
     */
    animate(time) {
        this.cells.forEach(cell => {
            if (cell.material && cell.material.uniforms) {
                cell.material.uniforms.time.value = time;
            }
        });
    }
    
    /**
     * Converts from a cell position to game board coordinates
     * @param {THREE.Mesh} cell - The cell to get coordinates for
     * @returns {Array} [x, y, z] as 1-based board coordinates
     */
    getCellCoordinates(cell) {
        // If the cell has userData with coordinates, return those
        if (cell.userData && cell.userData.x !== undefined) {
            return [cell.userData.x, cell.userData.y, cell.userData.z];
        }
        
        // Fallback to calculating based on position
        return [
            Math.round(cell.position.x + this.centerX) + 1,
            Math.round(cell.position.y + this.centerY) + 1,
            Math.round(cell.position.z + this.centerZ) + 1
        ];
    }
}