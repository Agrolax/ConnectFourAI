# ConnectFourAI

Connect Four is played on a 7 × 6 board (7 columns, 6 rows). Two players alternately drop a disc into one of the seven columns; a disc falls to the lowest empty cell of that column. The first player to connect four consecutive discs horizontally, vertically, or diagonally wins. If the board fills with no winner, the game is a draw.

This repository contains a modular Python implementation of a Connect Four game engine and a seedable Random AI Agent, satisfying Requirements 1 & 2 (Agent 1) of the Assignment.

## Code Structure

- [connect_four/engine.py](file:///Users/safdar/Documents/antigravity/eager-darwin/connect_four/engine.py): Implements the core game state, rules, win/draw detection, state cloning, and turn tracking.
- [connect_four/agents/base.py](file:///Users/safdar/Documents/antigravity/eager-darwin/connect_four/agents/base.py): Base class defining the API for Connect Four AI agents.
- [connect_four/agents/random_agent.py](file:///Users/safdar/Documents/antigravity/eager-darwin/connect_four/agents/random_agent.py): The Random Agent baseline that chooses legal moves uniformly at random using a seeded `random.Random` instance.
- [main.py](file:///Users/safdar/Documents/antigravity/eager-darwin/main.py): A CLI interface for playing or simulating games.
- [tests/](file:///Users/safdar/Documents/antigravity/eager-darwin/tests/): Automated test suite to verify correctness.

## Usage

### Run Unit Tests
To execute the automated unit tests, run:
```bash
python3 -m unittest discover -s tests
```

### Play Game (Player vs AI)
To play interactively against the Random Agent:
```bash
python3 main.py --mode player-vs-random
```

### Simulate Game (AI vs AI)
To run a simulated game between two Random Agents with a seed for reproducibility:
```bash
python3 main.py --mode random-vs-random --seed 42 --delay 0.5
```
You can adjust `--delay` to speed up or slow down the visualization.
