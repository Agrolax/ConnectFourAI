import copy

class ConnectFourEngine:
    """
    Connect Four game engine.
    The board is represented as a 6x7 grid, where:
    - 0 represents an empty cell.
    - 1 represents Player 1's disc.
    - 2 represents Player 2's disc.
    Rows are indexed 0 to 5, where 0 is the bottom row and 5 is the top row.
    Columns are indexed 0 to 6, from left to right.
    """
    def __init__(self):
        # 6 rows, 7 columns
        self.board = [[0] * 7 for _ in range(6)]
        self._current_player = 1
        self.move_count = 0

    def get_board_state(self):
        """Returns a copy of the current board grid."""
        return [row[:] for row in self.board]

    def current_player(self):
        """Returns the player whose turn it is to move (1 or 2)."""
        return self._current_player

    def legal_moves(self):
        """Returns a list of column indices (0-6) that are not full."""
        # A column is legal if its top row (index 5) is empty
        return [c for c in range(7) if self.board[5][c] == 0]

    def apply_move(self, col):
        """
        Places the current player's disc in the lowest empty cell of the specified column.
        Raises ValueError if the move is illegal.
        """
        if col < 0 or col > 6:
            raise ValueError(f"Column {col} is out of bounds (must be 0-6).")
        
        # Check if the column is full
        if self.board[5][col] != 0:
            raise ValueError(f"Column {col} is full.")
        
        # Find the lowest empty row in the column
        for r in range(6):
            if self.board[r][col] == 0:
                self.board[r][col] = self._current_player
                break
        
        self.move_count += 1
        # Alternate current player
        self._current_player = 3 - self._current_player

    def clone(self):
        """Returns a deep copy of the full game state."""
        return copy.deepcopy(self)

    def winner(self):
        """
        Returns:
        - 1 if Player 1 won.
        - 2 if Player 2 won.
        - 0 if the game is a draw.
        - None if the game is still active.
        """
        # 1. Check for a winner
        # Check horizontal wins
        for r in range(6):
            for c in range(4):
                val = self.board[r][c]
                if val != 0 and val == self.board[r][c+1] == self.board[r][c+2] == self.board[r][c+3]:
                    return val
        
        # Check vertical wins
        for r in range(3):
            for c in range(7):
                val = self.board[r][c]
                if val != 0 and val == self.board[r+1][c] == self.board[r+2][c] == self.board[r+3][c]:
                    return val
        
        # Check anti-diagonal wins (bottom-left to top-right / positive slope)
        for r in range(3):
            for c in range(4):
                val = self.board[r][c]
                if val != 0 and val == self.board[r+1][c+1] == self.board[r+2][c+2] == self.board[r+3][c+3]:
                    return val
        
        # Check main diagonal wins (top-left to bottom-right / negative slope)
        for r in range(3, 6):
            for c in range(4):
                val = self.board[r][c]
                if val != 0 and val == self.board[r-1][c+1] == self.board[r-2][c+2] == self.board[r-3][c+3]:
                    return val

        # 2. Check for draw (full board and no winner)
        if len(self.legal_moves()) == 0:
            return 0

        # Game is still active
        return None

    def is_terminal(self):
        """Returns True if the game has ended (either a win or a draw)."""
        return self.winner() is not None

    def print_board(self):
        """Prints a text representation of the board."""
        symbols = {0: '.', 1: 'X', 2: 'O'}
        # Print from top row down to bottom row
        for r in range(5, -1, -1):
            row_str = " ".join(symbols[self.board[r][c]] for c in range(7))
            print(f"| {row_str} |")
        print("+---------------+")
        print("  0 1 2 3 4 5 6")
