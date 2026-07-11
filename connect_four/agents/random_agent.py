import random
from connect_four.agents.base import BaseAgent

class RandomAgent(BaseAgent):
    """
    Agent that selects legal moves uniformly at random.
    Supports a custom seed for reproducibility.
    """
    def __init__(self, seed=None):
        self.seed = seed
        self.rng = random.Random(seed)

    def get_move(self, engine):
        """
        Selects a legal move uniformly at random.
        """
        moves = engine.legal_moves()
        if not moves:
            raise ValueError("No legal moves available.")
        return self.rng.choice(moves)
