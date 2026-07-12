import random

from ConnectFourAI.agents.base import BaseAgent

ROWS = 6
COLS = 7


class RuleBasedAgent(BaseAgent):

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

        # Rule 1: Play an immediate winning move.
        winning_moves = [
            col for col in moves
            if self._wins_for(engine, col, player)
        ]

        if winning_moves:
            return self.rng.choice(winning_moves)

        # Rule 2: Block an immediate opponent win.
        blocking_moves = [
            col for col in moves
            if self._wins_for(engine, col, opponent)
        ]

        if blocking_moves:
            return self.rng.choice(blocking_moves)

        # Rule 3: Find the most central legal moves.
        minimum_distance = min(
            abs(col - self.CENTER_COLUMN)
            for col in moves
        )

        central_moves = [
            col for col in moves
            if abs(col - self.CENTER_COLUMN) == minimum_distance
        ]

        # Rule 4: Among equally central moves, extend the longest line.
        line_scores = {
            col: self._line_score(engine, col, player)
            for col in central_moves
        }

        best_score = max(line_scores.values())

        best_moves = [
            col
            for col, score in line_scores.items()
            if score == best_score
        ]

        return self.rng.choice(best_moves)

    @staticmethod
    def _drop(engine, col, player):
        """
        Return a cloned engine after placing one disc for player in col.

        The original engine is not changed.
        """
        simulation = engine.clone()

        for row in range(ROWS):
            if simulation.board[row][col] == 0:
                simulation.board[row][col] = player
                return simulation, row

        raise ValueError(f"Column {col} is full.")

    def _wins_for(self, engine, col, player):
        """Return True if player wins immediately by playing col."""
        simulation, _ = self._drop(engine, col, player)
        return simulation.winner() == player

    def _line_score(self, engine, col, player):
        """
        Return the longest contiguous line passing through the newly
        placed disc.
        """
        simulation, row = self._drop(engine, col, player)
        board = simulation.board

        directions = [
            (0, 1),   # Horizontal
            (1, 0),   # Vertical
            (1, 1),   # Positive diagonal
            (1, -1),  # Negative diagonal
        ]

        longest_line = 1

        for row_change, col_change in directions:
            count = 1

            current_row = row + row_change
            current_col = col + col_change

            while (
                0 <= current_row < ROWS
                and 0 <= current_col < COLS
                and board[current_row][current_col] == player
            ):
                count += 1
                current_row += row_change
                current_col += col_change

            current_row = row - row_change
            current_col = col - col_change

            while (
                0 <= current_row < ROWS
                and 0 <= current_col < COLS
                and board[current_row][current_col] == player
            ):
                count += 1
                current_row -= row_change
                current_col -= col_change

            longest_line = max(longest_line, count)

        return longest_line
