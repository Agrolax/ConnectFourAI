import random
from ConnectFourAI.agents.base import BaseAgent

class RuleBasedAgent(BaseAgent):
    """
    Connect Four Rule-Based Agent.
    Prioritizes rules in order:
    1. Winning Move: Play if a move wins immediately.
    2. Blocking Move: Block opponent's immediate winning moves.
    3. Center Preference: Prefer the center column (column 3).
    4. Threat/Line Building: Extend longest line of player's own discs.
    """
    def __init__(self, seed=None):
        self.seed = seed
        self.rng = random.Random(seed)

    def get_move(self, engine):
        """
        Calculates and returns a legal column choice index.
        """
        moves = engine.legal_moves()
        if not moves:
            raise ValueError("No legal moves available.")

        player = engine.current_player()
        opponent = 3 - player

        # Rule 1: Winning Move (check if we can win immediately)
        for col in moves:
            clone = engine.clone()
            clone.apply_move(col)
            if clone.winner() == player:
                return col

        # Rule 2: Blocking Move (check if we must block the opponent's winning move)
        for col in moves:
            clone = engine.clone()
            clone._current_player = opponent  # Simulate opponent playing
            clone.apply_move(col)
            if clone.winner() == opponent:
                return col

        # Rule 3 (Center Preference) and Rule 4 (Threat/Line Building)
        move_scores = []
        for col in moves:
            clone = engine.clone()
            clone.apply_move(col)
            score = self._score_board(clone.board, player)
            distance = abs(col - 3)
            move_scores.append((col, distance, score))

        # Sort: distance ascending, then score descending
        move_scores.sort(key=lambda x: (x[1], -x[2]))

        # Find the best distance and score
        best_distance = move_scores[0][1]
        best_score = move_scores[0][2]

        # Filter all moves that share the best distance and score
        best_moves = [item[0] for item in move_scores if item[1] == best_distance and item[2] == best_score]

        return self.rng.choice(best_moves)

    def _score_board(self, board, player):
        opponent = 3 - player
        score = 0

        # Helper to score a window of 4 cells
        def score_window(window):
            player_count = window.count(player)
            opp_count = window.count(opponent)
            if opp_count > 0:
                return 0  # Blocked window
            if player_count == 4:
                return 1000
            if player_count == 3:
                return 100
            if player_count == 2:
                return 10
            if player_count == 1:
                return 1
            return 0

        # Horizontal windows
        for r in range(6):
            for c in range(4):
                window = [board[r][c+i] for i in range(4)]
                score += score_window(window)

        # Vertical windows
        for r in range(3):
            for c in range(7):
                window = [board[r+i][c] for i in range(4)]
                score += score_window(window)

        # Diagonal windows (positive slope)
        for r in range(3):
            for c in range(4):
                window = [board[r+i][c+i] for i in range(4)]
                score += score_window(window)

        # Diagonal windows (negative slope)
        for r in range(3, 6):
            for c in range(4):
                window = [board[r-i][c+i] for i in range(4)]
                score += score_window(window)

        return score
