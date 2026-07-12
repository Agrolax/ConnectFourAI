import unittest

from ConnectFourAI.engine import ConnectFourEngine
from ConnectFourAI.agents.random_agent import RandomAgent
from ConnectFourAI.agents.rule_based_agent import RuleBasedAgent


class TestRandomAgent(unittest.TestCase):

    def test_random_agent_valid_move(self):
        engine = ConnectFourEngine()
        agent = RandomAgent(seed=42)
        # Test for multiple moves that agent only selects legal moves
        for _ in range(10):
            legal = engine.legal_moves()
            if not legal:
                break
            move = agent.get_move(engine)
            self.assertIn(move, legal)
            engine.apply_move(move)

    def test_reproducibility(self):
        # Two agents with same seed should choose identical moves
        agent1 = RandomAgent(seed=123)
        agent2 = RandomAgent(seed=123)
        engine = ConnectFourEngine()
        # Take 10 steps and check they match
        for _ in range(10):
            move1 = agent1.get_move(engine)
            move2 = agent2.get_move(engine)
            self.assertEqual(move1, move2)
            engine.apply_move(move1)

    def test_no_moves_error(self):
        engine = ConnectFourEngine()
        # Fill the board manually
        engine.board = [[1] * 7 for _ in range(6)]
        self.assertEqual(engine.legal_moves(), [])
        agent = RandomAgent(seed=10)
        with self.assertRaises(ValueError):
            agent.get_move(engine)


class TestRuleBasedAgent(unittest.TestCase):

    def test_center_move_on_empty_board(self):
        engine = ConnectFourEngine()
        agent = RuleBasedAgent(seed=42)
        move = agent.get_move(engine)
        self.assertEqual(move, 3)

    def test_returns_legal_move(self):
        engine = ConnectFourEngine()
        agent = RuleBasedAgent(seed=42)
        move = agent.get_move(engine)
        self.assertIn(move, engine.legal_moves())

    def test_no_moves_error(self):
        engine = ConnectFourEngine()
        engine.board = [[1] * 7 for _ in range(6)]
        agent = RuleBasedAgent(seed=42)
        with self.assertRaises(ValueError):
            agent.get_move(engine)

    def test_takes_immediate_win(self):
        # Player 1 has three in a row horizontally on the bottom row
        # (cols 0,1,2) and can win by playing column 3.
        engine = ConnectFourEngine()
        engine.board[0][0] = 1
        engine.board[0][1] = 1
        engine.board[0][2] = 1
        engine._current_player = 1
        agent = RuleBasedAgent(seed=1)
        move = agent.get_move(engine)
        self.assertEqual(move, 3)

    def test_blocks_immediate_opponent_win(self):
        # Player 2 (the opponent of the agent to move) has three in a
        # row on the bottom row (cols 0,1,2). The agent to move is
        # player 1 and must block at column 3, even though blocking
        # is not the most central legal move.
        engine = ConnectFourEngine()
        engine.board[0][0] = 2
        engine.board[0][1] = 2
        engine.board[0][2] = 2
        engine._current_player = 1
        agent = RuleBasedAgent(seed=1)
        move = agent.get_move(engine)
        self.assertEqual(move, 3)

    def test_reproducibility(self):
        # Two agents with the same seed on the same board should
        # always agree, including on tie-breaks.
        agent1 = RuleBasedAgent(seed=7)
        agent2 = RuleBasedAgent(seed=7)
        engine = ConnectFourEngine()
        for _ in range(6):
            legal = engine.legal_moves()
            if not legal:
                break
            move1 = agent1.get_move(engine)
            move2 = agent2.get_move(engine)
            self.assertEqual(move1, move2)
            engine.apply_move(move1)


if __name__ == '__main__':
    unittest.main()
