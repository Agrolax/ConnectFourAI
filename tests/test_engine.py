import unittest
from connect_four.engine import ConnectFourEngine

class TestConnectFourEngine(unittest.TestCase):
    def setUp(self):
        self.engine = ConnectFourEngine()

    def test_initial_state(self):
        self.assertEqual(self.engine.current_player(), 1)
        self.assertEqual(self.engine.move_count, 0)
        self.assertEqual(self.engine.legal_moves(), [0, 1, 2, 3, 4, 5, 6])
        self.assertIsNone(self.engine.winner())
        self.assertFalse(self.engine.is_terminal())
        # Check board is empty
        board = self.engine.get_board_state()
        for r in range(6):
            for c in range(7):
                self.assertEqual(board[r][c], 0)

    def test_apply_move_gravity_and_turns(self):
        # Player 1 moves in col 3
        self.engine.apply_move(3)
        self.assertEqual(self.engine.board[0][3], 1)
        self.assertEqual(self.engine.current_player(), 2)
        self.assertEqual(self.engine.move_count, 1)

        # Player 2 moves in col 3 (should land on row 1)
        self.engine.apply_move(3)
        self.assertEqual(self.engine.board[1][3], 2)
        self.assertEqual(self.engine.current_player(), 1)
        self.assertEqual(self.engine.move_count, 2)

    def test_invalid_moves_raise_error(self):
        # Column out of bounds
        with self.assertRaises(ValueError):
            self.engine.apply_move(-1)
        with self.assertRaises(ValueError):
            self.engine.apply_move(7)

        # Column full
        for _ in range(6):
            self.engine.apply_move(0)
        
        self.assertNotIn(0, self.engine.legal_moves())
        with self.assertRaises(ValueError):
            self.engine.apply_move(0)

    def test_clone(self):
        self.engine.apply_move(2)
        self.engine.apply_move(3)
        cloned = self.engine.clone()
        
        # Verify state is identical
        self.assertEqual(cloned.move_count, self.engine.move_count)
        self.assertEqual(cloned.current_player(), self.engine.current_player())
        self.assertEqual(cloned.get_board_state(), self.engine.get_board_state())

        # Modify cloned engine and check original is unaffected
        cloned.apply_move(2)
        self.assertNotEqual(cloned.get_board_state(), self.engine.get_board_state())
        self.assertNotEqual(cloned.current_player(), self.engine.current_player())
        self.assertNotEqual(cloned.move_count, self.engine.move_count)

    def test_horizontal_win(self):
        # Setup board for horizontal win on row 0 for Player 1:
        # P1: 0, P2: 0 (row 1), P1: 1, P2: 1 (row 1), P1: 2, P2: 2 (row 1), P1: 3
        moves = [0, 0, 1, 1, 2, 2, 3] # alternating player 1 and 2
        for m in moves:
            self.engine.apply_move(m)
        
        self.assertEqual(self.engine.winner(), 1)
        self.assertTrue(self.engine.is_terminal())

    def test_vertical_win(self):
        # Setup board for vertical win on col 4 for Player 2:
        # P1: 0, P2: 4, P1: 0, P2: 4, P1: 0, P2: 4, P1: 1, P2: 4
        moves = [0, 4, 0, 4, 0, 4, 1, 4]
        for m in moves:
            self.engine.apply_move(m)
        
        self.assertEqual(self.engine.winner(), 2)
        self.assertTrue(self.engine.is_terminal())

    def test_main_diagonal_win(self):
        # Main diagonal (top-left to bottom-right / negative slope)
        # Columns:
        # col 0: 3 discs -> top disc row 2 is P1 or P2
        # We want diagonal: (3,0), (2,1), (1,2), (0,3)
        # Let's set up the board state manually for simplicity of test setup
        # Row 3, Col 0: 1
        # Row 2, Col 1: 1
        # Row 1, Col 2: 1
        # Row 0, Col 3: 1
        self.engine.board[3][0] = 1
        self.engine.board[2][1] = 1
        self.engine.board[1][2] = 1
        self.engine.board[0][3] = 1
        
        self.assertEqual(self.engine.winner(), 1)
        self.assertTrue(self.engine.is_terminal())

    def test_anti_diagonal_win(self):
        # Separate explicit test case for anti-diagonal wins (bottom-left to top-right / positive slope)
        # We want diagonal: (0,0), (1,1), (2,2), (3,3)
        # Let's set up the board state manually
        self.engine.board[0][0] = 2
        self.engine.board[1][1] = 2
        self.engine.board[2][2] = 2
        self.engine.board[3][3] = 2
        
        self.assertEqual(self.engine.winner(), 2)
        self.assertTrue(self.engine.is_terminal())

    def test_draw(self):
        # Build a board filled with no win
        # Pattern to avoid 4 in a row:
        # Row 0: 1 1 2 2 1 1 2
        # Row 1: 2 2 1 1 2 2 1
        # Row 2: 1 1 2 2 1 1 2
        # Row 3: 2 2 1 1 2 2 1
        # Row 4: 1 1 2 2 1 1 2
        # Row 5: 2 2 1 1 2 2 1
        pattern = [
            [1, 1, 2, 2, 1, 1, 2],
            [2, 2, 1, 1, 2, 2, 1],
            [1, 1, 2, 2, 1, 1, 2],
            [2, 2, 1, 1, 2, 2, 1],
            [1, 1, 2, 2, 1, 1, 2],
            [2, 2, 1, 1, 2, 2, 1]
        ]
        self.engine.board = pattern
        self.assertEqual(self.engine.winner(), 0)
        self.assertTrue(self.engine.is_terminal())
        self.assertEqual(self.engine.legal_moves(), [])

if __name__ == '__main__':
    unittest.main()
