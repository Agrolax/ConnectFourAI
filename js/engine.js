class ConnectFourEngine {
    constructor() {
        this.board = Array(6).fill(null).map(() => Array(7).fill(0));
        this._currentPlayer = 1;
        this.moveCount = 0;
    }

    getBoardState() {
        return this.board.map(row => [...row]);
    }

    currentPlayer() {
        return this._currentPlayer;
    }

    legalMoves() {
        const moves = [];
        for (let c = 0; c < 7; c++) {
            if (this.board[5][c] === 0) {
                moves.push(c);
            }
        }
        return moves;
    }

    // Lowest empty row in a column, or -1 if full (engine coords: 0 = bottom)
    getLandingRow(col) {
        if (col < 0 || col > 6) return -1;
        for (let r = 0; r < 6; r++) {
            if (this.board[r][col] === 0) return r;
        }
        return -1;
    }

    applyMove(col) {
        if (col < 0 || col > 6) {
            throw new Error(`Column ${col} is out of bounds (must be 0-6).`);
        }
        if (this.board[5][col] !== 0) {
            throw new Error(`Column ${col} is full.`);
        }

        // Find the lowest empty row
        let appliedRow = -1;
        for (let r = 0; r < 6; r++) {
            if (this.board[r][col] === 0) {
                this.board[r][col] = this._currentPlayer;
                appliedRow = r;
                break;
            }
        }

        this.moveCount++;
        this._currentPlayer = 3 - this._currentPlayer;

        // Return row and col where disc was placed (useful for animations)
        return { row: appliedRow, col: col };
    }

    clone() {
        const copy = new ConnectFourEngine();
        copy.board = this.getBoardState();
        copy._currentPlayer = this._currentPlayer;
        copy.moveCount = this.moveCount;
        return copy;
    }

    winner() {
        // 1. Check horizontal wins
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 4; c++) {
                const val = this.board[r][c];
                if (val !== 0 &&
                    val === this.board[r][c+1] &&
                    val === this.board[r][c+2] &&
                    val === this.board[r][c+3]) {
                    return { player: val, cells: [[r, c], [r, c+1], [r, c+2], [r, c+3]] };
                }
            }
        }

        // 2. Check vertical wins
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 7; c++) {
                const val = this.board[r][c];
                if (val !== 0 &&
                    val === this.board[r+1][c] &&
                    val === this.board[r+2][c] &&
                    val === this.board[r+3][c]) {
                    return { player: val, cells: [[r, c], [r+1, c], [r+2, c], [r+3, c]] };
                }
            }
        }

        // 3. Check anti-diagonal wins (bottom-left to top-right / positive slope)
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 4; c++) {
                const val = this.board[r][c];
                if (val !== 0 &&
                    val === this.board[r+1][c+1] &&
                    val === this.board[r+2][c+2] &&
                    val === this.board[r+3][c+3]) {
                    return { player: val, cells: [[r, c], [r+1, c+1], [r+2, c+2], [r+3, c+3]] };
                }
            }
        }

        // 4. Check main diagonal wins (top-left to bottom-right / negative slope)
        for (let r = 3; r < 6; r++) {
            for (let c = 0; c < 4; c++) {
                const val = this.board[r][c];
                if (val !== 0 &&
                    val === this.board[r-1][c+1] &&
                    val === this.board[r-2][c+2] &&
                    val === this.board[r-3][c+3]) {
                    return { player: val, cells: [[r, c], [r-1, c+1], [r-2, c+2], [r-3, c+3]] };
                }
            }
        }

        // 5. Check for draw
        if (this.legalMoves().length === 0) {
            return { player: 0, cells: [] };
        }

        return null;
    }

    isTerminal() {
        return this.winner() !== null;
    }
}
