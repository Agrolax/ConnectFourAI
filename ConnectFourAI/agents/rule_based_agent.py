import random
from ConnectFourAI.agents.base import BaseAgent

ROWS = 6
COLS = 7


class RuleBasedAgent(BaseAgent):
    """
    Agent driven by manually defined, prioritized rules (in order):

      1. Winning move   - play any move that wins immediately.
      2. Blocking move  - if the opponent has an immediate winning move
                           available, play a column that blocks it.
      3. Center control - prefer columns closest to the centre (column 3).
      4. Threat/line    - among the remaining candidates, prefer the move
                           that extends the longest line of the agent discs.

    Whenever two or more moves are equally good under the rule that is
    currently deciding the move, one of them is chosen uniformly at
    random using a seedable RNG, so results are reproducible.
    """

    CENTER_COLUMN = 3

    def __init__(self, seed=None):
        self.seed = seed
        self.rng = random.Random(seed)

    def get_move(self, engine):
        moves = engine.legal_moves()
        if not moves:
            raise ValueError("No legal moves available.")

        player = engine.current_player()
        opponent = 3 - player

        # Rule 1: take an immediate win if one exists.
        winning = [c for c in moves if self._wins_for(engine, c, player)]
        if winning:
            return self.rng.choice(winning)

        # Rule 2: block the opponent immediate winning move(s).
        blocking = [c for c in moves if self._wins_for(engine, c, opponent)]
        if blocking:
            return self.rng.choice(blocking)

        # Rule 3: prefer the column(s) closest to the centre.
        min_dist = min(abs(c - self.CENTER_COLUMN) for c in moves)
        central = [c for c in moves if abs(c - self.CENTER_COLUMN) == min_dist]

        # Rule 4: break remaining ties by extending our longest line.
        scores = {c: self._line_score(engine, c, player) for c in central}
        best = max(scores.values())
        best_moves = [c for c, s in scores.items() if s == best]

        return self.rng.choice(best_moves)

    # -- helpers ---------------------------------------------------------

    @staticmethod
    def _drop(engine, col, player):
        """Clones the engine and drops a disc for player into col, purely
        to evaluate the resulting board (does not alter whose turn it
        officially is)."""
        sim = engine.clone()
        for r in range(ROWS):
            if sim.board[r][col] == 0:
                sim.board[r][col] = player
                return sim, r
        raise ValueError(f"Column {col} is full.")

    def _wins_for(self, engine, col, player):
        """True if player dropping a disc in col completes 4-in-a-row."""
        sim, _ = self._drop(engine, col, player)
        return sim.winner() == player

    def _line_score(self, engine, col, player):
        """
        Score of dropping a disc for player in col: the length of the
        longest contiguous run of player discs (through the newly
        placed disc) across the four possible directions.
        """
        sim, row = self._drop(engine, col, player)
        board = sim.board
        directions = [(0, 1), (1, 0), (1, 1), (1, -1)]
        best = 0
        for dr, dc in directions:
            count = 1
            r, c = row + dr, col + dc
            while 0 <= r < ROWS and 0 <= c < COLS and board[r][c] == player:
                count += 1
                r += dr
                c += dc
            r, c = row - dr, col - dc
            while 0 <= r < ROWS and 0 <= c < COLS and board[r][c] == player:
                count += 1
                r -= dr
                c -= dc
            best = max(best, count)
        return best
