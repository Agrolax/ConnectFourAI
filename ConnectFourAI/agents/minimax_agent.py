import math
import random

from ConnectFourAI.agents.base import BaseAgent


ROWS = 6
COLS = 7
WINDOW_LENGTH = 4


class MinimaxAgent(BaseAgent):
    """
    Connect Four agent that uses Minimax search with alpha-beta pruning.
    """

    WIN_SCORE = 1_000_000
    CENTER_COLUMN = 3

    def __init__(self, depth=4, seed=None):
        """
        depth:
            Number of moves ahead that the agent searches.

        seed:
            Controls random tie-breaking so experiments are reproducible.
        """
        if not isinstance(depth, int) or depth < 1:
            raise ValueError("Depth must be a positive integer.")

        self.depth = depth
        self.seed = seed
        self.rng = random.Random(seed)

    def get_move(self, engine):
        """
        Return the best legal column for the current player.
        """
        legal_moves = engine.legal_moves()

        if not legal_moves:
            raise ValueError("No legal moves available.")

        # Remember which player this Minimax agent controls.
        root_player = engine.current_player()

        move_scores = {}

        for column in self._ordered_moves(legal_moves):
            simulation = engine.clone()
            simulation.apply_move(column)

            score = self._minimax(
                engine=simulation,
                depth=self.depth - 1,
                alpha=-math.inf,
                beta=math.inf,
                root_player=root_player
            )

            move_scores[column] = score

        best_score = max(move_scores.values())

        # Mandatory random tie-breaking between equally good moves.
        best_moves = [
            column
            for column, score in move_scores.items()
            if score == best_score
        ]

        return self.rng.choice(best_moves)

    def _minimax(self, engine, depth, alpha, beta, root_player):
        """
        Recursively evaluate the game tree.

        The root player maximizes the score.
        The opponent minimizes the score.
        """
        result = engine.winner()

        # Terminal board evaluation.
        if result is not None:
            if result == root_player:
                # Prefer wins that happen sooner.
                return self.WIN_SCORE + depth

            if result == 0:
                return 0

            # Prefer losses that happen later.
            return -self.WIN_SCORE - depth

        # Stop searching and use the heuristic.
        if depth == 0:
            return self._evaluate_board(engine, root_player)

        legal_moves = self._ordered_moves(engine.legal_moves())

        # Maximizing player's turn.
        if engine.current_player() == root_player:
            best_score = -math.inf

            for column in legal_moves:
                simulation = engine.clone()
                simulation.apply_move(column)

                score = self._minimax(
                    engine=simulation,
                    depth=depth - 1,
                    alpha=alpha,
                    beta=beta,
                    root_player=root_player
                )

                best_score = max(best_score, score)
                alpha = max(alpha, best_score)

                # Alpha-beta pruning.
                if alpha >= beta:
                    break

            return best_score

        # Minimizing opponent's turn.
        best_score = math.inf

        for column in legal_moves:
            simulation = engine.clone()
            simulation.apply_move(column)

            score = self._minimax(
                engine=simulation,
                depth=depth - 1,
                alpha=alpha,
                beta=beta,
                root_player=root_player
            )

            best_score = min(best_score, score)
            beta = min(beta, best_score)

            # Alpha-beta pruning.
            if alpha >= beta:
                break

        return best_score

    def _evaluate_board(self, engine, player):
        """
        Estimate how favourable a non-terminal board is for player.
        """
        board = engine.get_board_state()
        opponent = 3 - player
        score = 0

        # Reward control of the centre column.
        center_cells = [
            board[row][self.CENTER_COLUMN]
            for row in range(ROWS)
        ]

        score += center_cells.count(player) * 6
        score -= center_cells.count(opponent) * 6

        # Horizontal windows.
        for row in range(ROWS):
            for column in range(COLS - 3):
                window = [
                    board[row][column + offset]
                    for offset in range(WINDOW_LENGTH)
                ]

                score += self._score_window(window, player)

        # Vertical windows.
        for column in range(COLS):
            for row in range(ROWS - 3):
                window = [
                    board[row + offset][column]
                    for offset in range(WINDOW_LENGTH)
                ]

                score += self._score_window(window, player)

        # Positive-slope diagonal windows.
        for row in range(ROWS - 3):
            for column in range(COLS - 3):
                window = [
                    board[row + offset][column + offset]
                    for offset in range(WINDOW_LENGTH)
                ]

                score += self._score_window(window, player)

        # Negative-slope diagonal windows.
        for row in range(3, ROWS):
            for column in range(COLS - 3):
                window = [
                    board[row - offset][column + offset]
                    for offset in range(WINDOW_LENGTH)
                ]

                score += self._score_window(window, player)

        return score

    @staticmethod
    def _score_window(window, player):
        """
        Give a score to one group of four board cells.
        """
        opponent = 3 - player

        player_count = window.count(player)
        opponent_count = window.count(opponent)
        empty_count = window.count(0)

        # A mixed window cannot become four-in-a-row for either player.
        if player_count > 0 and opponent_count > 0:
            return 0

        # Reward the Minimax player.
        if player_count == 4:
            return 100_000

        if player_count == 3 and empty_count == 1:
            return 100

        if player_count == 2 and empty_count == 2:
            return 10

        if player_count == 1 and empty_count == 3:
            return 1

        # Penalize opponent threats.
        if opponent_count == 4:
            return -100_000

        if opponent_count == 3 and empty_count == 1:
            return -120

        if opponent_count == 2 and empty_count == 2:
            return -12

        if opponent_count == 1 and empty_count == 3:
            return -1

        return 0

    @staticmethod
    def _ordered_moves(moves):
        """
        Search centre columns first to improve alpha-beta pruning.
        """
        return sorted(moves, key=lambda column: abs(column - 3))