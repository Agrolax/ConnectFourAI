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

if __name__ == '__main__':
    unittest.main()
    
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
