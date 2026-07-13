# Requirement 3: Experimental Evaluation Results

## Verification note

These results were re-verified by running evaluate.py fresh end-to-end (not just trusting a previously committed file). All 28 unit tests (python3 -m unittest discover -s tests) passed first. The experiment was then run twice with python3 evaluate.py --games 30; win/draw counts were identical across both runs (only wall-clock decision times varied by a fraction of a millisecond, as expected), confirming the results below are reproducible.

## Test machine specifications

| Spec | Value |
|---|---|
| CPU | Intel Core i7-13620H, 2 logical CPUs allocated |
| RAM | 3.8 GB |
| OS | Ubuntu 22.04.5 LTS (Linux 6.8.0, x86_64) |
| Language | Python 3.10.12 |

All timing numbers below were measured on this single machine in one sitting, as required by the protocol -- decision times are not meant to be compared against numbers from a different machine.

## Methodology

Each pairing below was played over 30 games, alternating which agent moves first (15 games each way). Every agent instance is constructed with its own seed per game (listed alongside each game in evaluation_results.json) so the whole experiment is reproducible. Decision time is the wall-clock time taken by an agent's get_move call, averaged over every move that agent made across all 30 games of the pairing.

## Random vs Rule-Based

| Agent | Win rate | Draw rate | Avg decision time (ms) |
|---|---|---|---|
| Random | 1/30 (3.33%) | 0/30 (0.00%) | 0.0012 |
| RuleBased | 29/30 (96.67%) | 0/30 (0.00%) | 0.2555 |

Seeds: Random seeded 1000-1029, RuleBased seeded 2000-2029 (one seed per game).

## Rule-Based vs Minimax

| Agent | Win rate | Draw rate | Avg decision time (ms) |
|---|---|---|---|
| RuleBased | 3/30 (10.00%) | 1/30 (3.33%) | 0.2719 |
| Minimax | 26/30 (86.67%) | 1/30 (3.33%) | 33.4204 |

Seeds: RuleBased seeded 3000-3029, Minimax seeded 4000-4029 (one seed per game). Minimax uses a fixed search depth of 4.

## Minimax vs Random

| Agent | Win rate | Draw rate | Avg decision time (ms) |
|---|---|---|---|
| Minimax | 30/30 (100.00%) | 0/30 (0.00%) | 42.5260 |
| Random | 0/30 (0.00%) | 0/30 (0.00%) | 0.0021 |

Seeds: Minimax seeded 5000-5029, Random seeded 6000-6029 (one seed per game).

## Discussion

The results follow the expected strength ordering Random < Rule-Based < Minimax. The Rule-Based agent won 29 of 30 games against Random, since immediate win/block detection plus centre preference is already enough to beat purely uniform moves almost every time. Minimax at depth 4 in turn dominated the Rule-Based agent (26 wins, 1 draw, 3 losses) and swept Random completely, which matches the sanity check in the assignment: Connect Four is a solved, first-player-win game, so a sufficiently deep search agent moving first should dominate weaker agents -- use this as a sanity check when interpreting your numbers.

Decision time scales with search cost rather than rule complexity. Random and Rule-Based both decide in a fraction of a millisecond because neither performs any lookahead, while Minimax averages roughly 33-43 ms per move because it expands a depth-4 game tree with alpha-beta pruning at every turn. Minimax was slower on average against Random (42.53 ms) than against Rule-Based (33.42 ms); this is consistent with Random's scattered play generating more open, less pruned branches for Minimax to search, whereas Rule-Based's more purposeful play tends to steer into positions where alpha-beta cutoffs trigger earlier.

For future improvement, increasing the Minimax search depth (e.g. depth 6, as the assignment allows for an optional discussion run), adding a transposition table to avoid re-searching repeated board states, or replacing fixed-depth Minimax with Monte Carlo Tree Search (MCTS) would likely improve both playing strength and time efficiency, particularly in the mid-game where the branching factor is largest.
