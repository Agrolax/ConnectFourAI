import argparse
import time
from ConnectFourAI.engine import ConnectFourEngine
from ConnectFourAI.agents.random_agent import RandomAgent

def run_game(mode, seed, delay):
    engine = ConnectFourEngine()
    
    # Initialize agents based on mode
    agent1 = None
    agent2 = None
    
    # Using different seeds or offset seeds if seed is provided
    # so that the two agents are independent but reproducible.
    seed1 = seed if seed is not None else None
    seed2 = seed + 1000 if seed is not None else None

    if mode == 'random-vs-random':
        agent1 = RandomAgent(seed=seed1)
        agent2 = RandomAgent(seed=seed2)
        print(f"Starting Random vs Random game. Seed 1: {seed1}, Seed 2: {seed2}")
    elif mode == 'player-vs-random':
        agent2 = RandomAgent(seed=seed2)
        print(f"Starting Player vs Random game. Random Agent Seed: {seed2}")
    else:
        raise ValueError(f"Unknown mode: {mode}")

    print("Initial Board:")
    engine.print_board()
    print()

    while not engine.is_terminal():
        current = engine.current_player()
        legal = engine.legal_moves()
        
        print(f"Player {current}'s turn. Move count: {engine.move_count}")
        
        # Decide move
        if current == 1:
            if agent1 is not None:
                # Random agent 1
                move = agent1.get_move(engine)
                print(f"Random Agent 1 chooses column: {move}")
                if delay > 0:
                    time.sleep(delay)
            else:
                # Human player
                move = None
                while move is None:
                    try:
                        inp = input(f"Enter column {legal} (or 'q' to quit): ").strip().lower()
                        if inp == 'q':
                            print("Quitting game.")
                            return
                        col = int(inp)
                        if col not in legal:
                            print(f"Column {col} is full or out of bounds. Please choose from {legal}.")
                            continue
                        move = col
                    except ValueError:
                        print("Invalid input. Please enter an integer.")
        else:
            # Player 2
            if agent2 is not None:
                # Random agent 2
                move = agent2.get_move(engine)
                print(f"Random Agent 2 chooses column: {move}")
                if delay > 0:
                    time.sleep(delay)
            else:
                # Human player (if we ever run player-vs-player or reversed)
                move = None
                while move is None:
                    try:
                        inp = input(f"Enter column {legal} (or 'q' to quit): ").strip().lower()
                        if inp == 'q':
                            print("Quitting game.")
                            return
                        col = int(inp)
                        if col not in legal:
                            print(f"Column {col} is full or out of bounds. Please choose from {legal}.")
                            continue
                        move = col
                    except ValueError:
                        print("Invalid input. Please enter an integer.")

        # Apply move
        try:
            engine.apply_move(move)
        except ValueError as e:
            print(f"Error applying move: {e}")
            continue

        print("Board after move:")
        engine.print_board()
        print()

    # Game over
    win = engine.winner()
    if win == 0:
        print("Game Over: It's a draw!")
    else:
        print(f"Game Over: Player {win} wins!")

def main():
    parser = argparse.ArgumentParser(description="Connect Four AI")
    parser.add_argument(
        '--mode',
        choices=['random-vs-random', 'player-vs-random'],
        default='random-vs-random',
        help="Game play mode: 'random-vs-random' or 'player-vs-random'"
    )
    parser.add_argument(
        '--seed',
        type=int,
        default=None,
        help="Random seed for reproducibility"
    )
    parser.add_argument(
        '--delay',
        type=float,
        default=0.5,
        help="Delay in seconds between moves in random-vs-random mode (default: 0.5)"
    )
    args = parser.parse_args()
    
    run_game(args.mode, args.seed, args.delay)

if __name__ == '__main__':
    main()
