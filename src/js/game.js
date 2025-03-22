export class TicTacToe {
    /**
     * Creates a new tic-tac-toe game with configurable dimensions
     * @param {number} width - Width of the board (X dimension)
     * @param {number} height - Height of the board (Y dimension)
     * @param {number} depth - Depth of the board (Z dimension)
     * @param {number} winLength - Number of marks in a row needed to win (defaults to min dimension)
     */
    constructor(width = 3, height = 3, depth = 3, winLength = null) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        
        // Default win length to the smallest dimension, or allow custom
        this.winLength = winLength || Math.min(width, height, depth);
        
        // Initialize the 3D board array
        this.initializeBoard();
        
        // Start with X
        this.currentPlayer = 'X';
        
        // Track game state
        this.winner = null;
        this.moveCount = 0;
        this.totalCells = width * height * depth;
    }
    
    /**
     * Initialize the game board
     */
    initializeBoard() {
        // Create a 3D array with the specified dimensions
        this.board = Array(this.width).fill().map(() => 
            Array(this.height).fill().map(() => 
                Array(this.depth).fill(null)
            )
        );
    }

    /**
     * Make a move at the specified coordinates
     * @param {number} x - X coordinate (1-based)
     * @param {number} y - Y coordinate (1-based)
     * @param {number} z - Z coordinate (1-based)
     * @returns {string|null} The winner ('X', 'O', 'draw') or null if game continues
     */
    makeMove(x, y, z) {
        // Convert to 0-based for array access
        const xIdx = x - 1;
        const yIdx = y - 1;
        const zIdx = z - 1;
        
        // Check if coordinates are valid
        if (xIdx < 0 || xIdx >= this.width || 
            yIdx < 0 || yIdx >= this.height || 
            zIdx < 0 || zIdx >= this.depth) {
            return null; // Invalid move
        }
        
        // Check if the cell is empty
        if (!this.board[xIdx][yIdx][zIdx]) {
            // Make the move
            this.board[xIdx][yIdx][zIdx] = this.currentPlayer;
            this.moveCount++;
            
            // Check for win or draw
            const winner = this.checkWin(xIdx, yIdx, zIdx);
            
            if (winner) {
                this.winner = winner;
                return winner;
            }
            
            // Check for draw
            if (this.moveCount === this.totalCells) {
                this.winner = 'draw';
                return 'draw';
            }
            
            // Switch players
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            return null;
        }
        
        return null; // Cell already occupied
    }

    /**
     * Check if the last move resulted in a win
     * @param {number} x - X coordinate of last move (0-based)
     * @param {number} y - Y coordinate of last move (0-based)
     * @param {number} z - Z coordinate of last move (0-based)
     * @returns {string|null} The winner ('X' or 'O') or null
     */
    checkWin(x, y, z) {
        // Get the player who made the last move
        const player = this.board[x][y][z];
        if (!player) return null;
        
        // For standard 3x3x3 board, use the optimized checking method
        // which directly checks all 49 possible winning lines
        if (this.width === 3 && this.height === 3 && this.depth === 3 && this.winLength === 3) {
            return this.checkWinStandard();
        }
        
        // For custom dimensions, we need to check in all possible directions from the last move
        
        // Define the 26 possible directions in 3D space
        const directions = [];
        
        // Generate all possible combinations of -1, 0, 1 for x, y, z except [0,0,0]
        // This creates unit vectors in all 26 directions from a center point
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    // Skip the [0,0,0] vector which is not a direction
                    if (dx !== 0 || dy !== 0 || dz !== 0) {
                        directions.push([dx, dy, dz]);
                    }
                }
            }
        }
        
        // Check each direction for a win
        for (const [dx, dy, dz] of directions) {
            let count = 1; // Start with the current cell (already counted)
            
            // Check in the positive direction (e.g., up, right, forward...)
            for (let i = 1; i < this.winLength; i++) {
                // Calculate the next cell coordinates by moving in direction vector
                const nx = x + dx * i;  // Move i steps in x direction
                const ny = y + dy * i;  // Move i steps in y direction
                const nz = z + dz * i;  // Move i steps in z direction
                
                // Check if we're still on the board and the cell has the same player mark
                if (nx >= 0 && nx < this.width && 
                    ny >= 0 && ny < this.height && 
                    nz >= 0 && nz < this.depth &&
                    this.board[nx][ny][nz] === player) {
                    count++;  // Increment count if we found a matching cell
                } else {
                    break;     // Stop checking if we hit the board edge or different value
                }
            }
            
            // Check in the negative direction (opposite of above)
            for (let i = 1; i < this.winLength; i++) {
                // Calculate the next cell by moving in the opposite direction
                const nx = x - dx * i;  // Move i steps in negative x direction
                const ny = y - dy * i;  // Move i steps in negative y direction
                const nz = z - dz * i;  // Move i steps in negative z direction
                
                // Check if we're still on the board and the cell has the same player mark
                if (nx >= 0 && nx < this.width && 
                    ny >= 0 && ny < this.height && 
                    nz >= 0 && nz < this.depth &&
                    this.board[nx][ny][nz] === player) {
                    count++;  // Increment count if we found a matching cell
                } else {
                    break;     // Stop checking if we hit the board edge or different value
                }
            }
            
            // Check if we have enough cells in a row to win
            if (count >= this.winLength) {
                return player;  // Return the winning player
            }
        }
        
        return null; // No winner
    }
    
    /**
     * Optimized win checking for standard 3x3x3 board
     * This method directly checks all 49 possible winning lines in a 3D cube:
     * - 9 rows (across X axis) × 3 layers = 27 lines
     * - 9 columns (across Y axis) × 3 layers = 27 lines 
     * - 9 pillars (across Z axis) = 9 lines
     * - 6 face diagonals (2 per face × 3 faces) = 6 lines
     * - 4 space diagonals (corner to corner) = 4 lines
     * @returns {string|null} The winner ('X' or 'O') or null
     */
    checkWinStandard() {
        // Check all rows (horizontal lines along X axis)
        // For each Z-layer and Y-row, check the 3 cells in X direction
        for (let z = 0; z < 3; z++) {          // Each Z layer front to back
            for (let y = 0; y < 3; y++) {      // Each row top to bottom
                if (this.checkLine(this.board[0][y][z], this.board[1][y][z], this.board[2][y][z])) {
                    return this.board[0][y][z]; // Return winner (X or O)
                }
            }
        }

        // Check all columns (vertical lines along Y axis)
        // For each Z-layer and X-column, check the 3 cells in Y direction (top to bottom)
        for (let z = 0; z < 3; z++) {          // Each Z layer front to back
            for (let x = 0; x < 3; x++) {      // Each column left to right
                if (this.checkLine(this.board[x][0][z], this.board[x][1][z], this.board[x][2][z])) {
                    return this.board[x][0][z]; // Return winner (X or O)
                }
            }
        }

        // Check all pillars (vertical lines along Z axis)
        // For each X-column and Y-row, check the 3 cells in Z direction (front to back)
        for (let x = 0; x < 3; x++) {          // Each X column left to right
            for (let y = 0; y < 3; y++) {      // Each Y row top to bottom
                if (this.checkLine(this.board[x][y][0], this.board[x][y][1], this.board[x][y][2])) {
                    return this.board[x][y][0]; // Return winner (X or O)
                }
            }
        }

        // Check face diagonals (diagonal lines on each face of the cube)
        // XY plane diagonals (face diagonals on each Z layer)
        for (let z = 0; z < 3; z++) {
            // Check both diagonals on this Z layer:
            // 1. Top-left to bottom-right diagonal
            // 2. Bottom-left to top-right diagonal
            if (this.checkLine(this.board[0][0][z], this.board[1][1][z], this.board[2][2][z]) ||
                this.checkLine(this.board[2][0][z], this.board[1][1][z], this.board[0][2][z])) {
                return this.board[1][1][z];     // Return winner (both diagonals cross the middle)
            }
        }

        // XZ plane diagonals (face diagonals on each Y layer)
        for (let y = 0; y < 3; y++) {
            // Check both diagonals on this Y layer:
            // 1. Front-left to back-right diagonal
            // 2. Back-left to front-right diagonal
            if (this.checkLine(this.board[0][y][0], this.board[1][y][1], this.board[2][y][2]) ||
                this.checkLine(this.board[2][y][0], this.board[1][y][1], this.board[0][y][2])) {
                return this.board[1][y][1];     // Return winner
            }
        }

        // YZ plane diagonals (face diagonals on each X layer)
        for (let x = 0; x < 3; x++) {
            // Check both diagonals on this X layer:
            // 1. Top-front to bottom-back diagonal
            // 2. Bottom-front to top-back diagonal
            if (this.checkLine(this.board[x][0][0], this.board[x][1][1], this.board[x][2][2]) ||
                this.checkLine(this.board[x][2][0], this.board[x][1][1], this.board[x][0][2])) {
                return this.board[x][1][1];     // Return winner
            }
        }

        // Check space diagonals (corner to corner through the cube's center)
        // There are exactly 4 space diagonals in a cube:
        // 1. Front-bottom-left to back-top-right diagonal
        if (this.checkLine(this.board[0][0][0], this.board[1][1][1], this.board[2][2][2])) {
            return this.board[1][1][1];
        }
        // 2. Front-bottom-right to back-top-left diagonal
        if (this.checkLine(this.board[2][0][0], this.board[1][1][1], this.board[0][2][2])) {
            return this.board[1][1][1];
        }
        // 3. Front-top-left to back-bottom-right diagonal
        if (this.checkLine(this.board[0][2][0], this.board[1][1][1], this.board[2][0][2])) {
            return this.board[1][1][1];
        }
        // 4. Front-top-right to back-bottom-left diagonal
        if (this.checkLine(this.board[2][2][0], this.board[1][1][1], this.board[0][0][2])) {
            return this.board[1][1][1];
        }

        // No winner yet
        return null;
    }

    /**
     * Helper function to check if three cells form a winning line
     * @param {string|null} a - First cell value ('X', 'O', or null)
     * @param {string|null} b - Second cell value ('X', 'O', or null)
     * @param {string|null} c - Third cell value ('X', 'O', or null)
     * @returns {boolean} True if cells form a winning line (all non-null and matching)
     */
    checkLine(a, b, c) {
        // Check that: 1) first cell is not empty, 2) all cells have the same value (X or O)
        return a !== null && a === b && b === c;
    }
    
    /**
     * Reset the game
     */
    reset() {
        this.initializeBoard();
        this.currentPlayer = 'X';
        this.winner = null;
        this.moveCount = 0;
    }
    
    /**
     * Get cell value at position (1-based indices)
     * @returns {string|null} The cell value ('X', 'O') or null if empty
     */
    getCell(x, y, z) {
        // Convert to 0-based for array access
        const xIdx = x - 1;
        const yIdx = y - 1;
        const zIdx = z - 1;
        
        if (xIdx >= 0 && xIdx < this.width && 
            yIdx >= 0 && yIdx < this.height && 
            zIdx >= 0 && zIdx < this.depth) {
            return this.board[xIdx][yIdx][zIdx];
        }
        
        return null; // Out of bounds
    }
}