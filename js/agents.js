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
    }

    getMove(engine) {
        const moves = engine.legalMoves();
        if (moves.length === 0) {
            throw new Error("No legal moves available.");
        }

        const player = engine.currentPlayer();
        const opponent = 3 - player;

        // Rule 1: Winning Move (check if we can win immediately)
        for (const col of moves) {
            const clone = engine.clone();
            clone.applyMove(col);
            const winRes = clone.winner();
            if (winRes !== null && winRes.player === player) {
                return col;
            }
        }

        // Rule 2: Blocking Move (check if we must block the opponent's winning move)
        for (const col of moves) {
            const clone = engine.clone();
            clone._currentPlayer = opponent; // Simulate opponent playing
            clone.applyMove(col);
            const winRes = clone.winner();
            if (winRes !== null && winRes.player === opponent) {
                return col;
            }
        }

        // Rule 3 (Center Preference) and Rule 4 (Threat/Line Building)
        const scoredMoves = moves.map(col => {
            const clone = engine.clone();
            clone.applyMove(col);
            const score = this._scoreBoard(clone.board, player);
            const distance = Math.abs(col - 3);
            return { col, distance, score };
        });

        // Prioritize Center Preference (distance ascending), then Threat/Line Building (score descending)
        scoredMoves.sort((a, b) => {
            if (a.distance !== b.distance) {
                return a.distance - b.distance;
            }
            return b.score - a.score;
        });

        // Filter all moves that share the best distance and score
        const best = scoredMoves[0];
        const bestMoves = scoredMoves
            .filter(m => m.distance === best.distance && m.score === best.score)
            .map(m => m.col);

        return this.rng.choice(bestMoves);
    }

    _scoreBoard(board, player) {
        const opponent = 3 - player;
        let score = 0;

        // Helper to score a window of 4 coordinates
        const scoreWindow = (coords) => {
            let playerCount = 0;
            let opponentCount = 0;
            for (const [r, c] of coords) {
                const val = board[r][c];
                if (val === player) playerCount++;
                else if (val === opponent) opponentCount++;
            }
            
            if (opponentCount > 0) return 0; // Blocked window
            if (playerCount === 4) return 1000;
            if (playerCount === 3) return 100;
            if (playerCount === 2) return 10;
            if (playerCount === 1) return 1;
            return 0;
        };

        // Horizontal windows
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 4; c++) {
                score += scoreWindow([[r, c], [r, c+1], [r, c+2], [r, c+3]]);
            }
        }

        // Vertical windows
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 7; c++) {
                score += scoreWindow([[r, c], [r+1, c], [r+2, c], [r+3, c]]);
            }
        }

        // Diagonal windows (positive slope)
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 4; c++) {
                score += scoreWindow([[r, c], [r+1, c+1], [r+2, c+2], [r+3, c+3]]);
            }
        }

        // Diagonal windows (negative slope)
        for (let r = 3; r < 6; r++) {
            for (let c = 0; c < 4; c++) {
                score += scoreWindow([[r, c], [r-1, c+1], [r-2, c+2], [r-3, c+3]]);
            }
        }

        return score;
    }
}

