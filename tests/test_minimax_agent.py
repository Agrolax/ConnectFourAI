import unittest

from ConnectFourAI.engine import ConnectFourEngine
from ConnectFourAI.agents.minimax_agent import MinimaxAgent


class TestMinimaxAgent(unittest.TestCase):

    def test_returns_legal_move(self):
        engine = ConnectFourEngine()
        agent = MinimaxAgent(depth=4, seed=41)

        move = agent.get_move(engine)

        self.assertIn(move, engine.legal_moves())

    def test_prefers_center_on_empty_board(self):
        engine = ConnectFourEngine()
        agent = MinimaxAgent(depth=4, seed=41)

        move = agent.get_move(engine)

        self.assertEqual(move, 3)

    def test_selects_immediate_winning_move(self):
        engine = ConnectFourEngine()

        # Player 1 receives discs in columns 0, 1 and 2.
        # Column 3 will complete the horizontal four-in-a-row.
        moves = [0, 6, 1, 6, 2, 5]

        for move in moves:
            engine.apply_move(move)

        self.assertEqual(engine.current_player(), 1)

        agent = MinimaxAgent(depth=4, seed=41)

        self.assertEqual(agent.get_move(engine), 3)

    def test_blocks_opponent_immediate_win(self):
        engine = ConnectFourEngine()

        # Player 2 has discs in columns 0, 1 and 2.
        # Player 1 must block column 3.
        moves = [6, 0, 6, 1, 5, 2]

        for move in moves:
            engine.apply_move(move)

        self.assertEqual(engine.current_player(), 1)

        agent = MinimaxAgent(depth=4, seed=41)

        self.assertEqual(agent.get_move(engine), 3)

    def test_does_not_modify_original_engine(self):
        engine = ConnectFourEngine()
        agent = MinimaxAgent(depth=4, seed=41)

        original_board = engine.get_board_state()
        original_player = engine.current_player()
        original_move_count = engine.move_count

        agent.get_move(engine)

        self.assertEqual(engine.get_board_state(), original_board)
        self.assertEqual(engine.current_player(), original_player)
        self.assertEqual(engine.move_count, original_move_count)

    def test_invalid_depth_raises_error(self):
        with self.assertRaises(ValueError):
            MinimaxAgent(depth=0)

    def test_no_legal_moves_raises_error(self):
        engine = ConnectFourEngine()
        engine.board = [[1] * 7 for _ in range(6)]

        agent = MinimaxAgent(depth=4, seed=41)

        with self.assertRaises(ValueError):
            agent.get_move(engine)


if __name__ == "__main__":
    unittest.main()