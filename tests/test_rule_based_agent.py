import unittest
from ConnectFourAI.engine import ConnectFourEngine
from ConnectFourAI.agents.rule_based_agent import RuleBasedAgent

class TestRuleBasedAgent(unittest.TestCase):
    def test_winning_move_p1(self):
        # Set up a board where player 1 can win in column 0
        engine = ConnectFourEngine()
        engine.board[0][0] = 1
        engine.board[1][0] = 1
        engine.board[2][0] = 1
        engine._current_player = 1
        
        agent = RuleBasedAgent(seed=42)
        move = agent.get_move(engine)
        self.assertEqual(move, 0)

    def test_blocking_move_p2(self):
        # Set up a board where player 1 has 3 in column 0, and player 2 must block in column 0
        engine = ConnectFourEngine()
        engine.board[0][0] = 1
        engine.board[1][0] = 1
        engine.board[2][0] = 1
        engine._current_player = 2 # Player 2's turn
        
        agent = RuleBasedAgent(seed=42)
        move = agent.get_move(engine)
        self.assertEqual(move, 0)

    def test_center_preference(self):
        # On an empty board, RuleBasedAgent (either player) should prefer column 3
        # since it's the center column and there are no winning/blocking moves yet.
        engine = ConnectFourEngine()
        agent = RuleBasedAgent(seed=42)
        move = agent.get_move(engine)
        self.assertEqual(move, 3)

if __name__ == '__main__':
    unittest.main()
