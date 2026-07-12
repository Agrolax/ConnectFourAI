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
