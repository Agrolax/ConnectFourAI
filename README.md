# ConnectFourAI

Connect Four is played on a 7 × 6 board (7 columns, 6 rows). Two players alternately drop a disc into one of the seven columns; a disc falls to the lowest empty cell of that column. The first player to connect four consecutive discs horizontally, vertically, or diagonally wins. If the board fills with no winner, the game is a draw.

This repository contains a modular Python implementation of a Connect Four game engine and a seedable Random AI Agent, satisfying Requirements 1 & 2 (Agent 1) of the Assignment.

---

## Assignment Requirements & Progress

### Requirement 1: Game Engine [1.5 marks]
- **Status:** **Completed**
- **Implementation:** Located in [ConnectFourAI/engine.py](file:///Users/safdar/Documents/antigravity/eager-darwin/ConnectFourAI/engine.py)
- **Work Done:**
  - Board representation: 2D grid/list of size 6 rows × 7 columns.
  - Legal-move generation: `legal_moves()` returning indices of non-full columns.
  - Move execution with gravity: `apply_move(col)` drops discs to the lowest empty row; raises `ValueError` if column is full or invalid.
  - Win detection: Scans horizontal, vertical, and both diagonal directions for 4 consecutive matching discs.
  - Draw detection: Active when no moves are legal and there is no winner.
  - Supporting features: `clone()` for deep copying engine state, `current_player()` for turn-tracking.

### Requirement 2: AI Agents
Each agent receives the board state and returns a single legal column index.

#### Agent 1 — Random Agent [0.5 marks]
- **Status:** **Completed**
- **Implementation:** Located in [ConnectFourAI/agents/random_agent.py](file:///Users/safdar/Documents/antigravity/eager-darwin/ConnectFourAI/agents/random_agent.py)
- **Work Done:**
  - Uniformly selects a legal move at random.
  - Utilizes a seedable `random.Random(seed)` instance internally (avoiding global state mutation) to guarantee reproducible game play during evaluations.

#### Agent 2 — Rule-Based Agent [1.5 marks]
- **Status:** **Pending**
- **What needs to be done:**
  - Implement an agent driven by manually defined, prioritized rules:
    1. Winning Move: Play if a move wins immediately.
    2. Blocking Move: Block opponent's immediate winning moves.
    3. Center Preference: Prefer the center column (column 3).
    4. Threat/Line Building: Extend longest line of player's own discs.
- **How to do it:**
  - Create `connect_four_ai/agents/rule_based_agent.py` subclassing `BaseAgent`.
  - For rules 1 and 2: Simulate placing a disc in each legal column (using `engine.clone()`) and check if `winner()` returns that player.
  - For rule 3: Sort legal moves by distance to column 3.
  - For rule 4: Iterate through all lines of length 4, scoring them based on count of player discs vs empty spaces.

#### Agent 3 — Minimax Agent [3 marks]
- **Status:** **Pending**
- **What needs to be done:**
  - Implement Minimax adversarial search with configurable search depth (fixed depth 4 for experiments).
  - Terminal evaluation: win = positive infinity/large constant, loss = negative infinity/large constant, draw = 0 (from the perspective of the agent to move).
  - Heuristic evaluation for non-terminal states at search depth limit using windowed scoring: slide a window of size 4 across every row, column, and diagonal, scoring it (heavy reward for 3-in-a-window, modest reward for 2-in-a-window, penalizing opponent similarly).
- **How to do it:**
  - Create `connect_four_ai/agents/minimax_agent.py` subclassing `BaseAgent`.
  - Write a recursive `minimax` function with alpha-beta pruning for efficiency.
  - Use `engine.clone()` and `apply_move()` inside the search tree to simulate state transitions.
  - Implement a scoring utility that sums scores of all overlapping length-4 windows on the board.

---

### Requirement 3: Experimental Evaluation [2 marks]
- **Status:** **Pending**
- **What needs to be done:**
  - Run head-to-head matches for pairings: Random vs Rule-Based, Rule-Based vs Minimax, Minimax vs Random.
  - Play 30 games per pairing (alternating starting turns, ~15 times each way).
  - Log win rate, draw rate, and average decision time per move per agent.
- **How to do it:**
  - Create an evaluation runner script (e.g. `evaluate.py`).
  - Run the pairings sequentially, using `time.perf_counter()` around `agent.get_move(engine)` calls to record decision times.
  - Save results in tables to be included in the final report.

---

### Requirement 4: Report [1 mark]
- **Status:** **Pending**
- **What needs to be done:**
  - Compile a `Report.pdf` containing introduction, system design (engine & agent architecture), agent details, experimental results, and discussion (interpretations, improvement proposals like MCTS).
- **How to do it:**
  - Draft report in markdown or LaTeX, and compile to PDF.

---

### Requirement 5: Demonstration Video [0.5 marks]
- **Status:** **Pending**
- **What needs to be done:**
  - Record a 3-5 minute video demonstrating one full run (engine CLI plus agent-vs-agent matches) with narration.
- **How to do it:**
  - Record screen using OBS/QuickTime while running `main.py` simulations, upload to Drive/YouTube, and put the link in the README.

---

## Usage

### Run Unit Tests
To execute the automated unit tests:
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
