/**
 * A simple Linear Congruential Generator (LCG) for reproducible pseudo-random numbers in JS.
 */
class SeededRandom {
    constructor(seed) {
        // If seed is null/undefined, use a random integer as initial seed
        this.seed = seed !== null && seed !== undefined ? seed : Math.floor(Math.random() * 2147483647);
        this.state = this.seed;
    }

    // Returns a pseudo-random float between 0 (inclusive) and 1 (exclusive)
    nextFloat() {
        // LCG parameters: Numerical Recipes
        this.state = (1664525 * this.state + 1013904223) % 4294967296;
        return this.state / 4294967296;
    }

    // Selects a random element from an array
    choice(arr) {
        if (arr.length === 0) return null;
        const index = Math.floor(this.nextFloat() * arr.length);
        return arr[index];
    }
}

class BaseAgent {
    getMove(engine) {
        throw new Error("getMove must be implemented by subclass");
    }
}

class RandomAgent extends BaseAgent {
    constructor(seed = null) {
        super();
        this.seed = seed;
        this.rng = new SeededRandom(seed);
    }

    getMove(engine) {
        const moves = engine.legalMoves();
        if (moves.length === 0) {
            throw new Error("No legal moves available.");
        }
        return this.rng.choice(moves);
    }
}
class RuleBasedAgent extends BaseAgent {
    constructor(seed = null) {
        super();
        this.seed = seed;
        this.rng = new SeededRandom(seed);
        this.centerColumn = 3;
    }

    getMove(engine) {
        const moves = engine.legalMoves();

        if (moves.length === 0) {
            throw new Error("No legal moves available.");
        }

        const player = engine.currentPlayer();
        const opponent = 3 - player;

        // Rule 1: Play an immediate winning move.
        const winningMoves = moves.filter(col =>
            this.winsFor(engine, col, player)
        );

        if (winningMoves.length > 0) {
            return this.rng.choice(winningMoves);
        }

        // Rule 2: Block an immediate opponent winning move.
        const blockingMoves = moves.filter(col =>
            this.winsFor(engine, col, opponent)
        );

        if (blockingMoves.length > 0) {
            return this.rng.choice(blockingMoves);
        }

        // Rule 3: Prefer columns closest to the centre.
        const minimumDistance = Math.min(
            ...moves.map(col => Math.abs(col - this.centerColumn))
        );

        const centralMoves = moves.filter(
            col => Math.abs(col - this.centerColumn) === minimumDistance
        );

        // Rule 4: Among equally central moves, extend longest line.
        const scores = centralMoves.map(col => ({
            col: col,
            score: this.lineScore(engine, col, player)
        }));

        const bestScore = Math.max(...scores.map(item => item.score));

        const bestMoves = scores
            .filter(item => item.score === bestScore)
            .map(item => item.col);

        return this.rng.choice(bestMoves);
    }

    drop(engine, col, player) {
        const simulation = engine.clone();

        for (let row = 0; row < 6; row++) {
            if (simulation.board[row][col] === 0) {
                simulation.board[row][col] = player;

                return {
                    engine: simulation,
                    row: row
                };
            }
        }

        throw new Error(`Column ${col} is full.`);
    }

    winsFor(engine, col, player) {
        const simulation = this.drop(engine, col, player).engine;
        const result = simulation.winner();

        return result !== null && result.player === player;
    }

    lineScore(engine, col, player) {
        const dropped = this.drop(engine, col, player);
        const board = dropped.engine.board;
        const row = dropped.row;

        const directions = [
            [0, 1],
            [1, 0],
            [1, 1],
            [1, -1]
        ];

        let longestLine = 1;

        for (const [rowChange, colChange] of directions) {
            let count = 1;

            let currentRow = row + rowChange;
            let currentCol = col + colChange;

            while (
                currentRow >= 0 &&
                currentRow < 6 &&
                currentCol >= 0 &&
                currentCol < 7 &&
                board[currentRow][currentCol] === player
            ) {
                count++;
                currentRow += rowChange;
                currentCol += colChange;
            }

            currentRow = row - rowChange;
            currentCol = col - colChange;

            while (
                currentRow >= 0 &&
                currentRow < 6 &&
                currentCol >= 0 &&
                currentCol < 7 &&
                board[currentRow][currentCol] === player
            ) {
                count++;
                currentRow -= rowChange;
                currentCol -= colChange;
            }

            longestLine = Math.max(longestLine, count);
        }

        return longestLine;
    }
}

class MinimaxAgent extends BaseAgent {
    constructor(depth = 4, seed = null) {
        super();
        if (!Number.isInteger(depth) || depth < 1) {
            throw new Error("Depth must be a positive integer.");
        }
        this.depth = depth;
        this.seed = seed;
        this.rng = new SeededRandom(seed);
        this.WIN_SCORE = 1000000;
        this.CENTER_COLUMN = 3;
    }

    getMove(engine) {
        const legalMoves = engine.legalMoves();
        if (legalMoves.length === 0) {
            throw new Error("No legal moves available.");
        }

        const rootPlayer = engine.currentPlayer();
        const moveScores = {};

        // Search centre columns first to improve alpha-beta pruning
        const ordered = this._orderedMoves(legalMoves);

        for (const column of ordered) {
            const simulation = engine.clone();
            simulation.applyMove(column);

            const score = this._minimax(
                simulation,
                this.depth - 1,
                -Infinity,
                Infinity,
                rootPlayer
            );

            moveScores[column] = score;
        }

        const bestScore = Math.max(...Object.values(moveScores));
        const bestMoves = Object.keys(moveScores)
            .map(Number)
            .filter(col => moveScores[col] === bestScore);

        return this.rng.choice(bestMoves);
    }

    _minimax(engine, depth, alpha, beta, rootPlayer) {
        const result = engine.winner();

        // Terminal board evaluation
        if (result !== null) {
            const winVal = result.player;
            if (winVal === rootPlayer) {
                return this.WIN_SCORE + depth;
            }
            if (winVal === 0) {
                return 0;
            }
            return -this.WIN_SCORE - depth;
        }

        // Stop searching and use the heuristic
        if (depth === 0) {
            return this._evaluateBoard(engine, rootPlayer);
        }

        const legalMoves = this._orderedMoves(engine.legalMoves());

        // Maximizing player's turn
        if (engine.currentPlayer() === rootPlayer) {
            let bestScore = -Infinity;

            for (const column of legalMoves) {
                const simulation = engine.clone();
                simulation.applyMove(column);

                const score = this._minimax(
                    simulation,
                    depth - 1,
                    alpha,
                    beta,
                    rootPlayer
                );

                bestScore = Math.max(bestScore, score);
                alpha = Math.max(alpha, bestScore);

                if (alpha >= beta) {
                    break;
                }
            }

            return bestScore;
        }

        // Minimizing opponent's turn
        let bestScore = Infinity;

        for (const column of legalMoves) {
            const simulation = engine.clone();
            simulation.applyMove(column);

            const score = this._minimax(
                simulation,
                depth - 1,
                alpha,
                beta,
                rootPlayer
            );

            bestScore = Math.min(bestScore, score);
            beta = Math.min(beta, bestScore);

            if (alpha >= beta) {
                break;
            }
        }

        return bestScore;
    }

    _evaluateBoard(engine, player) {
        const board = engine.getBoardState();
        const opponent = 3 - player;
        let score = 0;

        // Reward control of the centre column
        let centerCountPlayer = 0;
        let centerCountOpponent = 0;
        for (let r = 0; r < 6; r++) {
            const val = board[r][this.CENTER_COLUMN];
            if (val === player) centerCountPlayer++;
            else if (val === opponent) centerCountOpponent++;
        }

        score += centerCountPlayer * 6;
        score -= centerCountOpponent * 6;

        // Helper to count element in array
        const countOccurrences = (arr, val) => arr.filter(item => item === val).length;

        // Helper to score a window
        const scoreWindow = (window) => {
            const pCount = countOccurrences(window, player);
            const oCount = countOccurrences(window, opponent);
            const eCount = countOccurrences(window, 0);

            if (pCount > 0 && oCount > 0) return 0;
            if (pCount === 4) return 100000;
            if (pCount === 3 && eCount === 1) return 100;
            if (pCount === 2 && eCount === 2) return 10;
            if (pCount === 1 && eCount === 3) return 1;

            if (oCount === 4) return -100000;
            if (oCount === 3 && eCount === 1) return -120;
            if (oCount === 2 && eCount === 2) return -12;
            if (oCount === 1 && eCount === 3) return -1;

            return 0;
        };

        // Horizontal windows
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 4; c++) {
                const window = [board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]];
                score += scoreWindow(window);
            }
        }

        // Vertical windows
        for (let c = 0; c < 7; c++) {
            for (let r = 0; r < 3; r++) {
                const window = [board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]];
                score += scoreWindow(window);
            }
        }

        // Diagonal windows (positive slope)
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 4; c++) {
                const window = [board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]];
                score += scoreWindow(window);
            }
        }

        // Diagonal windows (negative slope)
        for (let r = 3; r < 6; r++) {
            for (let c = 0; c < 4; c++) {
                const window = [board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3]];
                score += scoreWindow(window);
            }
        }

        return score;
    }

    _orderedMoves(moves) {
        return [...moves].sort((a, b) => Math.abs(a - 3) - Math.abs(b - 3));
    }
}

