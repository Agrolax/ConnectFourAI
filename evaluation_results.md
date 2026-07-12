# Requirement 3: Experimental Evaluation Results

## Methodology

Each pairing below was played over 30 games, alternating which agent moves first (15 games each way). Every agent instance is constructed with its own seed per game (listed alongside each game in evaluation_results.json) so the whole experiment is reproducible. Decision time is the wall-clock time taken by an agent's get_move call, averaged over every move that agent made across all 30 games of the pairing.

Important note on provenance: these numbers were produced by running the project's deployed JavaScript engine/agents (js/engine.js, js/agents.js), which are a line-for-line port of the Python engine and agents described in the README, inside an automated browser session. They demonstrate the full Requirement 3 protocol (30 games per pairing, alternating first move, seeded reproducibility, win/draw rate, and average decision time). The evaluate.py script added alongside this file runs the identical protocol directly against the Python implementation (ConnectFourAI/engine.py and ConnectFourAI/agents/); running it locally with python3 evaluate.py will regenerate this report from the Python codebase and let you record your own machine's CPU/RAM/OS specs, which the assignment asks you to state since decision times are only comparable on a single machine.

## Random vs Rule-Based

| Agent | Win rate | Draw rate | Avg decision time (ms) |
|---|---|---|---|
| Random | 0/30 (0.00%) | 0/30 (0.00%) | 0.0065 |
| RuleBased | 30/30 (100.00%) | 0/30 (0.00%) | 0.2149 |

Seeds: Random seeded 1000-1029, RuleBased seeded 2000-2029 (one seed per game).

## Rule-Based vs Minimax

| Agent | Win rate | Draw rate | Avg decision time (ms) |
|---|---|---|---|
| RuleBased | 1/30 (3.33%) | 2/30 (6.67%) | 0.0426 |
| Minimax | 27/30 (90.00%) | 2/30 (6.67%) | 16.3759 |

Seeds: RuleBased seeded 3000-3029, Minimax seeded 4000-4029 (one seed per game). Minimax uses a fixed search depth of 4.

## Minimax vs Random

| Agent | Win rate | Draw rate | Avg decision time (ms) |
|---|---|---|---|
| Minimax | 30/30 (100.00%) | 0/30 (0.00%) | 22.4817 |
| Random | 0/30 (0.00%) | 0/30 (0.00%) | 0.0021 |

Seeds: Minimax seeded 5000-5029, Random seeded 6000-6029 (one seed per game).

## Discussion

The results follow the expected strength ordering Random < Rule-Based < Minimax. The Rule-Based agent won every game against Random, since immediate win/block detection plus centre preference is already enough to beat purely uniform moves. Minimax at depth 4 in turn dominated the Rule-Based agent (27 wins, 2 draws, 1 loss) and swept Random completely, which matches the sanity check in the assignment: Connect Four is a solved, first-player-win game, so a deeper search agent should dominate weaker opponents regardless of who moves first. The one game the Rule-Based agent won against Minimax highlights that a fixed-depth, non-exhaustive search can still occasionally miss a line that a simpler heuristic happens to block, especially in shorter, more tactical games.

Decision time scales with search cost rather than rule complexity: Random and Rule-Based both decide in a fraction of a millisecond because neither performs any lookahead, while Minimax averages roughly 16-22 ms per move because it expands a depth-4 game tree with alpha-beta pruning at every turn. Minimax was also slower on average against Random (22.48 ms) than against Rule-Based (16.38 ms); this is consistent with Random's scattered play generating more open, less pruned branches for Minimax to search, whereas Rule-Based's more purposeful play tends to steer into positions where alpha-beta cutoffs trigger earlier.

For future improvement, increasing the Minimax search depth (e.g. depth 6, as the assignment allows for an optional discussion run), adding a transposition table to avoid re-searching repeated board states, or replacing fixed-depth Minimax with Monte Carlo Tree Search (MCTS) would likely improve both playing strength and time efficiency, particularly in the mid-game where the branching factor is largest.
