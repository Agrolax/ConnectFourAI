import unittest
from ConnectFourAI.engine import ConnectFourEngine
from ConnectFourAI.agents.random_agent import RandomAgent

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

if __name__ == '__main__':
    unittest.main()
