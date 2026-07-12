import argparse
import time

from ConnectFourAI.engine import ConnectFourEngine
from ConnectFourAI.agents import RandomAgent, RuleBasedAgent, MinimaxAgent

# Modes that involve a human player typing moves into the terminal.
PLAYER_MODES = {
    'player-vs-random': 'random',
    'player-vs-rulebased': 'rulebased',
    'player-vs-minimax': 'minimax',
}

# Modes that are fully AI vs AI (no human input).
AI_VS_AI_MODES = {
    'random-vs-random': ('random', 'random'),
    'rulebased-vs-random': ('rulebased', 'random'),
    'random-vs-rulebased': ('random', 'rulebased'),
    'rulebased-vs-rulebased': ('rulebased', 'rulebased'),
    'minimax-vs-random': ('minimax', 'random'),
    'random-vs-minimax': ('random', 'minimax'),
    'rulebased-vs-minimax': ('rulebased', 'minimax'),
    'minimax-vs-rulebased': ('minimax', 'rulebased'),
    'minimax-vs-minimax': ('minimax', 'minimax'),
}

ALL_MODES = list(PLAYER_MODES.keys()) + list(AI_VS_AI_MODES.keys())


def _make_agent(kind, seed):
    """Build an agent instance of the given kind ('random', 'rulebased', or 'minimax')."""
    if kind == 'random':
        return RandomAgent(seed=seed)
    if kind == 'rulebased':
        return RuleBasedAgent(seed=seed)
    if kind == 'minimax':
        return MinimaxAgent(depth=4, seed=seed)
    raise ValueError(f"Unknown agent kind: {kind}")


def run_game(mode, seed, delay):
    engine = ConnectFourEngine()

    # Using different seeds (offset) if a seed is provided, so that the
    # two agents are independent but still reproducible.
    seed1 = seed if seed is not None else None
    seed2 = seed + 1000 if seed is not None else None

    agent1 = None
    agent2 = None

    if mode in AI_VS_AI_MODES:
        kind1, kind2 = AI_VS_AI_MODES[mode]
        agent1 = _make_agent(kind1, seed1)
        agent2 = _make_agent(kind2, seed2)
        print(
            f"Starting {kind1} (Player 1) vs {kind2} (Player 2). "
            f"Seed 1: {seed1}, Seed 2: {seed2}"
        )
    elif mode in PLAYER_MODES:
        # Human is always Player 1; the named agent plays Player 2.
        kind2 = PLAYER_MODES[mode]
        agent2 = _make_agent(kind2, seed2)
        print(f"Starting Player vs {kind2}. Agent seed: {seed2}")
    else:
        raise ValueError(f"Unknown mode: {mode}")

    print("Initial Board:")
    engine.print_board()
    print()

    while not engine.is_terminal():
        current = engine.current_player()
        legal = engine.legal_moves()
        print(f"Player {current}'s turn. Move count: {engine.move_count}")

        active_agent = agent1 if current == 1 else agent2

        if active_agent is not None:
            move = active_agent.get_move(engine)
            print(f"Agent (Player {current}) chooses column: {move}")
            if delay > 0:
                time.sleep(delay)
        else:
            # Human player.
            move = None
            while move is None:
                try:
                    inp = input(
                        f"Enter column {legal} (or 'q' to quit): "
                    ).strip().lower()
                    if inp == 'q':
                        print("Quitting game.")
                        return
                    col = int(inp)
                    if col not in legal:
                        print(
                            f"Column {col} is full or out of bounds. "
                            f"Please choose from {legal}."
                        )
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
        choices=ALL_MODES,
        default='random-vs-random',
        help="Game play mode. AI vs AI: " + ", ".join(AI_VS_AI_MODES) +
             ". Human vs AI: " + ", ".join(PLAYER_MODES),
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
        help="Delay in seconds between moves in AI-vs-AI modes (default: 0.5)"
    )
    args = parser.parse_args()

    run_game(args.mode, args.seed, args.delay)


if __name__ == '__main__':
    main()
