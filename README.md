# ConnectFourAI

Connect Four is played on a 7 × 6 board (7 columns, 6 rows). Two players alternately drop a disc into one of the seven columns; a disc falls to the lowest empty cell of that column. The first player to connect four consecutive discs horizontally, vertically, or diagonally wins. If the board fills with no winner, the game is a draw.

This repository contains a modular Python implementation of a Connect Four game engine and a seedable Random AI Agent.

---

## Automated Unit Tests

([tests/test_engine.py](./tests/test_engine.py) and [tests/test_agents.py](./tests/test_agents.py)) help ensure correctness and prevent regressions.
- **Why it is needed:** Manual testing of every possible win direction (horizontal, vertical, diagonal, anti-diagonal), draw conditions, and invalid inputs is slow and error-prone.
- **Regression prevention:** When you implement Agent 2 (Rule-Based) and Agent 3 (Minimax), the unit tests guarantee that any changes made to the game state representation or move execution do not break the core engine rules.
- **Verification:** It allows you to verify the entire system in under a millisecond by running:
  ```bash
  python3 -m unittest discover -s tests
  ```

---

## How the Random Seed Works

Computers cannot generate truly random numbers; they use **Pseudo-Random Number Generators (PRNGs)**, which are deterministic mathematical algorithms.
- **The Starting Point (Seed):** A PRNG starts its algorithm with a starting integer value called a **Seed**.
- **Deterministic Sequence:** Once a seed is provided, the generator applies a mathematical formula (such as Mersenne Twister in Python or the LCG in our JavaScript port) to generate a sequence of numbers that *look* random but are actually 100% deterministic.
- **Identical Results:** If you initialize the random generator with the exact same seed (e.g., `42`), it will generate the **exact same sequence of numbers** every single time you run the program.
- **Why it matters for AI Experiments:**
  - Without a seed, the Random Agent's decisions are based on the computer's system clock, causing games to play out differently every time.
  - For Requirement 3 (Experimental Evaluation), using seeds makes your head-to-head win/draw rates **reproducible**. Anyone else running your program with the same seed will get the exact same results, validating that your experimental numbers are not just a result of random luck.

---

## Assignment Requirements & Progress

### Requirement 1: Game Engine [1.5 marks]
- **Status:** ![Completed](https://img.shields.io/badge/Status-Completed-success?style=flat-square)
- **Implementation File:** [ConnectFourAI/engine.py](./ConnectFourAI/engine.py)
- **Detailed Work Done:**
  - **Board Representation:** Designed an internal 2D list grid representing 6 rows (0-5, where 0 is bottom and 5 is top) by 7 columns (0-6).
  - **Legal-Move Generation:** Created the `legal_moves()` API which dynamically checks column height limits (column top index 5) and returns a list of column indices that can accept a disc.
  - **Gravity-based Execution:** Implemented `apply_move(col)` which simulates physical gravity by placing the player's disc in the lowest available row index in the selected column.
  - **Strict Error Handling:** Configured `apply_move(col)` to raise a `ValueError` for out-of-bounds columns or columns that are already full, preventing silent failures.
  - **Win Detection:** Developed scanning algorithms searching all active coordinate patterns on the board:
    - *Horizontal:* 4 consecutive identical discs on any row.
    - *Vertical:* 4 consecutive identical discs on any column.
    - *Main Diagonal:* 4 consecutive identical discs in a top-left to bottom-right slope.
    - *Anti-Diagonal:* 4 consecutive identical discs in a bottom-left to top-right slope (tested separately to isolate potential logic bugs).
  - **Draw Detection:** Detects if no legal moves remain (`legal_moves()` is empty) and no player has won, returning `0` (Draw).
  - **Turn & State Tracking:** Tracks `current_player()` (1 or 2) and `move_count`.
  - **State Deep Copying:** Added `clone()` returning a complete deep copy of the engine's game state, enabling future look-ahead search agents to simulate future board states without altering the main game state.

### Requirement 2: AI Agents

#### Agent 1 — Random Agent [0.5 marks]
- **Status:** ![Completed](https://img.shields.io/badge/Status-Completed-success?style=flat-square)
- **Implementation File:** [ConnectFourAI/agents/random_agent.py](./ConnectFourAI/agents/random_agent.py)
- **Detailed Work Done:**
  - **Seeded Random Instance:** Configured `RandomAgent` to accept an optional `seed` parameter in `__init__` which instantiates an isolated `random.Random(seed)` generator. This avoids messing with Python's global random state and ensures all simulation results can be reproduced identically.
  - **Move Selection:** Uses `rng.choice()` to uniformly select one option from the active `engine.legal_moves()` list.
  - **Error Handling:** Raises a `ValueError` if invoked on a terminal board state where no legal moves exist.

#### Agent 2 — Rule-Based Agent [1.5 marks]
- **Status:** ![Completed](https://img.shields.io/badge/Status-Completed-success?style=flat-square)
- **Implementation File:** [ConnectFourAI/agents/rule_based_agent.py](./ConnectFourAI/agents/rule_based_agent.py)
- **Detailed Work Done:**
  - **Winning Move:** Simulates dropping a disc in each legal column (via `engine.clone()`) and immediately plays any column where `winner()` returns the agent's own player.
  - **Blocking Move:** If no immediate win exists, simulates the opponent dropping a disc in each legal column and blocks any column where the opponent would immediately win.
  - **Center Preference:** Among the remaining legal moves, narrows the candidates to the column(s) closest to the center column (column 3).
  - **Threat/Line Building:** Scores each central candidate by the length of the longest contiguous run of the agent's own discs (checked in all four directions) through the cell the disc would land in, and selects the move(s) with the highest score.
  - **Tie-Breaking:** Uses an isolated `random.Random(seed)` instance (same pattern as `RandomAgent`) to choose uniformly at random whenever multiple moves are tied under the currently active rule, keeping results reproducible.

#### Agent 3 — Minimax Agent [3 marks]
- **Status:** ![Completed](https://img.shields.io/badge/Status-Completed-success?style=flat-square)
- **Implementation File:** [ConnectFourAI/agents/minimax_agent.py](./ConnectFourAI/agents/minimax_agent.py)
- **Detailed Work Done:**
  - **Adversarial Search:** Implemented minimax adversarial search with alpha-beta pruning to prune suboptimal paths and accelerate move search.
  - **Depth Limit:** Set default search depth to 4 for optimal performance-time trade-off.
  - **Terminal Valuation:** Scores win conditions with positive infinity (`float('inf')`) and losses with negative infinity (`float('-inf')`).
  - **Heuristic Window Evaluation:** Slides length-4 windows horizontally, vertically, and diagonally across the grid. Scores each window dynamically (heavy weights for 3-in-a-row threats, moderate weights for 2-in-a-row setups, and subtracts opponent threat scores).
  - **Reproducible Tie-Breaking:** Utilizes a seedable `random.Random` instance for picking among moves of equal valuation, keeping performance reproducible.

---

### Requirement 3: Experimental Evaluation [25% marks]
- **Status:** ![Completed](https://img.shields.io/badge/Status-Completed-success?style=flat-square)
- **Evaluation Report:** [evaluation_results.md](./evaluation_results.md) · [evaluation_results.json](./evaluation_results.json) · [Report PDF](./assets/report.pdf)
- **Live charts:** open the site and tap **View evaluation**
- **Protocol:** 30 games per pairing, alternating first player (~15 each way), seeded agents, decision time = mean `get_move` wall-clock (ms)

#### Case study A - Random vs Rule-Based
| Agent | Wins | Win rate | Draws | Avg decision time |
|---|---:|---:|---:|---:|
| Random | 1/30 | 3.33% | 0 | 0.0012 ms |
| Rule-Based | 29/30 | 96.67% | 0 | 0.2555 ms |

**Takeaway:** immediate win/block + centre preference already crush uniform random play.

#### Case study B - Rule-Based vs Minimax
| Agent | Wins | Win rate | Draws | Avg decision time |
|---|---:|---:|---:|---:|
| Rule-Based | 3/30 | 10.00% | 1 | 0.2719 ms |
| Minimax (depth 4) | 26/30 | 86.67% | 1 | 33.4204 ms |

**Takeaway:** depth-4 adversarial search dominates heuristic rules, at ~100× higher move cost.

#### Case study C - Minimax vs Random
| Agent | Wins | Win rate | Draws | Avg decision time |
|---|---:|---:|---:|---:|
| Minimax (depth 4) | 30/30 | 100.00% | 0 | 42.5260 ms |
| Random | 0/30 | 0.00% | 0 | 0.0021 ms |

**Takeaway:** strength order holds as Random &lt; Rule-Based &lt; Minimax. Minimax is slower vs Random than vs Rule-Based because sparse play leaves wider trees for alpha-beta.

- **Evaluation Runner Script:** [evaluate.py](./evaluate.py) - records decision times with `time.perf_counter()`.

---

### Requirement 4: Report [12.5% marks]
- **Status:** ![Completed](https://img.shields.io/badge/Status-Completed-success?style=flat-square)
- **Report:** [assets/report.pdf](./assets/report.pdf) (also [CP468 Assignment 2 Report.pdf](./CP468%20Assignment%202%20Report.pdf))
- Covers introduction, engine/agent design, experimental results, and discussion.

---

### Requirement 5: Demonstration Video [6.25% marks]
- **Status:** ![Pending](https://img.shields.io/badge/Status-Pending-yellow?style=flat-square)
- **What needs to be done:**
  - Record a 3-5 minute video demonstrating one full run (engine CLI plus agent-vs-agent matches) with narration.
- **How to do it:**
  - Record screen using OBS/QuickTime while running `main.py` simulations, upload to Drive/YouTube, and put the link in the README.

---

## CLI Usage

### Run Unit Tests
To execute the automated unit tests:
```bash
python3 -m unittest discover -s tests
```

### Play Game (Interactive CLI)
- **Player vs Player (Local):**
  ```bash
  python3 main.py --mode player-vs-player
  ```
- **Player vs Random AI:**
  ```bash
  python3 main.py --mode player-vs-random
  ```
- **Player vs Rule-Based AI:**
  ```bash
  python3 main.py --mode player-vs-rulebased
  ```
- **Player vs Minimax AI:**
  ```bash
  python3 main.py --mode player-vs-minimax
  ```

### Simulate Game (AI vs AI)
To run a simulated game between two agents with a seed for reproducibility:
```bash
python3 main.py --mode minimax-vs-random --seed 42 --delay 0.5
```
