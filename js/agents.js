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
