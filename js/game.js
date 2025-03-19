export class TicTacToe {
    constructor() {
        this.board = Array(3).fill().map(() => Array(3).fill().map(() => Array(3).fill(null)));
        this.currentPlayer = 'X';
    }

    makeMove(x, y, z) {
        if (!this.board[x][y][z]) {
            this.board[x][y][z] = this.currentPlayer;
            const winner = this.checkWin();
            if (!winner) this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            return winner;
        }
        return null;
    }

    checkWin() {
        // Check all rows (fix z, vary x and y)
        for (let z = 0; z < 3; z++) {
            for (let y = 0; y < 3; y++) {
                if (this.checkLine(this.board[0][y][z], this.board[1][y][z], this.board[2][y][z])) {
                    return this.board[0][y][z];
                }
            }
        }

        // Check all columns (fix z, vary x and y)
        for (let z = 0; z < 3; z++) {
            for (let x = 0; x < 3; x++) {
                if (this.checkLine(this.board[x][0][z], this.board[x][1][z], this.board[x][2][z])) {
                    return this.board[x][0][z];
                }
            }
        }

        // Check all pillars (fix x and y, vary z)
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                if (this.checkLine(this.board[x][y][0], this.board[x][y][1], this.board[x][y][2])) {
                    return this.board[x][y][0];
                }
            }
        }

        // Check face diagonals (across each plane)
        // XY plane (fix z)
        for (let z = 0; z < 3; z++) {
            if (this.checkLine(this.board[0][0][z], this.board[1][1][z], this.board[2][2][z]) ||
                this.checkLine(this.board[2][0][z], this.board[1][1][z], this.board[0][2][z])) {
                return this.board[1][1][z];
            }
        }

        // XZ plane (fix y)
        for (let y = 0; y < 3; y++) {
            if (this.checkLine(this.board[0][y][0], this.board[1][y][1], this.board[2][y][2]) ||
                this.checkLine(this.board[2][y][0], this.board[1][y][1], this.board[0][y][2])) {
                return this.board[1][y][1];
            }
        }

        // YZ plane (fix x)
        for (let x = 0; x < 3; x++) {
            if (this.checkLine(this.board[x][0][0], this.board[x][1][1], this.board[x][2][2]) ||
                this.checkLine(this.board[x][2][0], this.board[x][1][1], this.board[x][0][2])) {
                return this.board[x][1][1];
            }
        }

        // Check space diagonals (corner to corner through the cube)
        if (this.checkLine(this.board[0][0][0], this.board[1][1][1], this.board[2][2][2]) ||
            this.checkLine(this.board[2][0][0], this.board[1][1][1], this.board[0][2][2]) ||
            this.checkLine(this.board[0][2][0], this.board[1][1][1], this.board[2][0][2]) ||
            this.checkLine(this.board[2][2][0], this.board[1][1][1], this.board[0][0][2])) {
            return this.board[1][1][1];
        }

        // No winner yet
        return null;
    }

    // Helper function to check if three cells form a winning line
    checkLine(a, b, c) {
        return a !== null && a === b && b === c;
    }
}