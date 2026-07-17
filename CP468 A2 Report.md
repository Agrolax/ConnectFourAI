![][image1]

**Assignment 2 Report** 

CP468-D \- Artificial Intelligence

Wilfrid Laurier University

[View Interactive GUI](http://agrolax.github.io/ConnectFourAI)

**Group 7**

Farhan Chowdhury

Manahil Bashir 

Morad Mohammad 

Noah Samarita 

Safdar Shukur

## **1\. Introduction** 

Connect Four serves as a classic game environment for exploring adversarial search spaces, perfect information constraints, and deterministic transition mechanics. The game features a combination of deep branching factors and gravity constraints that require a balanced integration of systematic algorithms and heuristic valuations. 

This project explores these principles by creating a centralized game engine and implementing three intelligent agents of increasing complexity: a baseline random agent, a rule-based agent, and an advanced zero-sum tree-search explorer. 

**2\. System Design** 

### 2.1 State Space and Board Representation

The board environment is modeled as a factored grid matrix of dimensions 6 rows by 7 columns. Row coordinates map strictly from 0 up to 5, where row index 0 represents the absolute bottom cell of the grid layout and row 5 captures the top height ceiling. Cells are represented explicitly as integers: 0 denotes an empty cell, 1 represents Player 1 tokens, and 2 identifies Player 2 discs.

### 2.2 Core Engine

The engine operates deterministically through primary operations:

* **legal\_moves():** Scans the top index (row 5\) of all 7 columns. It returns a dynamic array of available column indices where a piece can safely fall.  
* **apply\_move(col):** Simulates downward physics gravity by scanning a target column from row index 0 up to 5\. It locks the piece into the first available empty cell, alternates the player turn identifier, updates the move counter, and handles illegal out-of-bounds selections by raising explicit ValueError constraints.  
* **winner():** Executes bidirectional orientation matrix checks scanning the board for 4 consecutive identical non-zero discs across all axes (Horizontal, Vertical, Main-Diagonal, and Anti-Diagonal). If a win is confirmed, it returns the winning player ID (1 or 2). If the grid is full with no winner, it returns 0 (Draw); otherwise, it evaluates to None to indicate an ongoing game.  
* **clone():** Generates a complete state deep copy of the board array, move counts, and active players. This utility allows tree-search agents to simulate hypothetical futures without polluting the actual match state.

## **3\. AI Agents**

### 3.1 Agent 1: Baseline Uniform Random Agent

The random agent establishes a lower performance boundary. It queries the engine's valid column list and picks a move using an independent, isolated random object initialized via an optional integer seed parameter. 

### 3.2 Agent 2: Logic-Driven Rule-Based Agent

Agent 2 implements a multi-tiered conditional priority hierarchy designed to evaluate immediate state utilities without incurring exponential branch exploration costs:

1. **Immediate Wins:** Loops through actions using deep copies. If any column yields an immediate victory via winner(), that column is picked instantly.  
2. **Opponent Blocks:** If no win is present, it simulates the opponent's next turn. It identifies any column where the opponent could immediately connect a line of four and executes a defensive block.  
3. **Spatial Center Preference:** Lacking immediate win or block constraints, it scores columns by their distance to the central column (Column 3\) to maximize long-term vector alignment possibilities.  
4. **Contiguous Threat Scoring & Tie-Breaking:** Remaining moves are filtered by calculating the maximum length of contiguous matching pieces intersecting that position. Surviving ties are resolved cleanly using an isolated random seed instance.

### 3.3 Agent 3: Adversarial Alpha-Beta Minimax Agent

Agent 3 executes an adversarial tree-search optimization algorithm using a zero-sum framing. Minimax evaluates alternating plies where MAX aims to maximize the evaluation function, while MIN moves to minimize it. To manage computation costs, the agent sets a standard search horizon limit of depth d=4. To prune redundant subtrees, the search updates bounds tracking alpha (MAX's lower bound) and beta (MIN's upper bound). Branches are cut immediately whenever beta is less than or equal to alpha. Definite terminal wins evaluate to true mathematical infinity, while losses evaluate to negative infinity. For non-terminal leaf nodes sitting at the depth limit, a sliding matrix heuristic counts line configurations based on optimized positive priority multipliers for non-terminal structures, and opponent clusters are subtracted as penalties.

## **4\. Experimental Results & Evaluation**

System testing was automated over batches of 30 games per agent pairing using independent initialized parameter distributions. Turn priority was alternated evenly (\~15 matches starting as Player 1 vs Player 2). Compute speed was evaluated in wall-clock time using high-precision counters.

| Matchup Pairing (P1 vs. P2) | P1 Win % | P2 Win % | Draw % | Avg. Decision Speed   |
| :---- | :---: | :---: | :---: | ----- |
| Random vs. Rule-Based | 3.33% | 96.67% | 0.00% | 0.2555 ms |
| Rule-Based vs. Minimax (D4) | 10.00% | 86.67% | 3.33% | 33.4204 ms |
| Minimax (D4) vs. Random | 100.00% | 0.00% | 0.00% | 42.5260 ms |

Our metrics validate a clear hierarchy of strategic capability: Random Agent \< Rule-Based Agent \< Minimax Search Agent. 

**5\. Discussion** 

### 5.1 Performance Hierarchy 

* **Validated Strength Ordering:** Results follow the expected path: **Random (weakest) \< Rule-Based (middle) \< Minimax (strongest)**.  
* **Rule-Based vs. Random (29–1):** Proves that immediate win/block checks and center preference provide a massive step up over random play. The single random win shows the baseline isn't completely toothless.  
* **Minimax Dominance:** Swept Random 30–0, and dominated Rule-Based 26–3 (with 1 draw).

### 5.2 First-Mover Advantage & Forcing Sequences

* **The 9-Move Deterministic Signature:** When Minimax played first against Rule-Based, *every single game* (all 15\) ended in a Minimax win in exactly 9 moves. This consistent signature shows depth-4 minimax is strong enough to execute a flawless forcing line against predictable heuristics.  
* **Random Unpredictability:** Against Random, Minimax’s first-mover wins varied (7 to 17 moves) because erratic play prevents a fixed forcing sequence.  
* **First-Move Asymmetry:** All of Rule-Based's points (3 wins, 1 draw) against Minimax occurred *only* when Rule-Based moved first. It never won or drew from the second-mover position.

### 5.3 Decision Times & Pruning Mechanics

* **Lookahead Overhead:** Random and Rule-Based take a fraction of a millisecond ($O(1)$ lookahead). Minimax averages **33 to 43 ms per move** to expand its depth-4 tree.  
* **Pruning Efficiency:** Minimax was slower against Random (42.53 ms) than Rule-Based (33.42 ms). Random's chaotic moves create un-ordered branches, whereas Rule-Based’s structured play allows **Alpha-Beta pruning** to trigger cutoffs much earlier.

**6\. Team Member Contributions**

* Safdar Md Abdus Shukur: Requirement 1 (Game Engine), Requirement 2 — Agent 1 (Random Agent) and Web GUI

* Morad Mohammad: Requirement 2 — Agent 2 (Rule-Based Agent)

* Noah Samarita: Requirement 2 — Agent 3 (Minimax Agent)

* Farhan Chowdhury: Requirement 3 (Experimental Evaluation) and the Report (Requirement 4\)

* Manahil Bashir: Requirement 3 (Experimental Evaluation), done together with Farhan on his system, and Requirement 5 (Demonstration Video)

## **6\. References & Acknowledgements**

* Russell, S., & Norvig, P. *Artificial Intelligence: A Modern Approach (4th Edition)*. Pearson, 2020\.  
* Python Software Foundation. *The Python Language Reference & Standard Library Documentation*. [https://www.python.org](https://www.python.org)   
* ECMA International. *ECMAScript® Language Specification*. [https://tc39.es/ecma262/](https://tc39.es/ecma262/)   
* Tailwind CSS. *Tailwind Engine Core CDN Architecture*. [https://tailwindcss.com](https://tailwindcss.com)   
* Lucide Open Source Community. *The Lucide Vector Asset Library*. [https://lucide](https://lucide)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAR4AAAA4CAYAAAArS5dJAAAKF0lEQVR4Xu2dv48dVxXHb5UiQsEJASfGDuPEu1hu4iIyooj0RBMkIssiokmTp+xulApC0tCAn4jSQGGoEFDMQCQaCkcUNBSvpKQgEYmEGBGEBLsb7Z+w8bV9d8793nPuj3lv7Tu75yN9Jfue77kzZ9+c49md97zGCGy+vt9vbO0d1q7Lbx40eO6KokwMbOypCOtQFGUCbOwcXMVmnpx2dq9iXYqiVEzQxBMV1qUoSqVg805dWJ+iKBWCjTt1YX2KolTG5tY0nl6Vab/HOhVFqYiwaU+GsE5FUSoCG/akCOtUFKUisGFjevqbPzn84tkrR3ri4rcCD+rSa/3h4+eveXnPvfr3wIe68NLvvZynXng78MSEdSqKUhHYsJLoEECh1+nsnWGB3pxBgl6qnKFlhXUqilIR2LCcsPk5YU5OHvqt7EBCHwpzOGGdiqJUBDYsJ2x8TmNyxubZb8MwD4V1KopSEdiwnLDxOV383l+Lc6zGHOsrz78R5KGwTkVRKgIblhM2Pqfmxl+Kc6zGHOvLV14N8lBYp6IoFYENywkbnxPm4JMsTtxTMfRwwrsrTlinoigVgQ3L6cmN60HzozDHCj0o9Ft97Tu3Ax8KczhhnYqiVAQ2rCRs/pxBYO9M0OsUu2uxd0LoTx0LhXUeMwd3ZI8p6fZgVSoFX7McLe9mngLG9pXXlzv7cz6QEA6BnEFw7sWfBzl2DX0obvigJ6ah9GOlMeHFGJPy4HFf+xYDAL5WOVrezTzhbGztt66vvr699xbGY3h9OXbwTElD6cdGb8ILMUc3bLLywHBf9xYDAL5OOVrezTzhrNJbXq4OnpXBCzB2vMbke5X1477mLQaAXN+pwv6f5qv0lperg2cl7IVJh0jjRWUWRofOwyB3oOT6ThXYV6X95eXp4FkJOnTOQEypj9yBkus7VWBflfaXlzd28Iz9xPifnv/h4b8vfPtIGOdkPwxKj5XzMQmqofS1Yi9KOniU+skdKLm+U8PG67vzo5669+el+3szP8j6R9fryzGDB58w5Txtenf2a2/gUL07+03gd4q9+RC9kobS18qDGDo3jX8cq5zH8Usih30CgXvFsH63x4Ks49sFGhLL4ZYJz6OhhgzsOeEec2q4jzt/J+ftYR1xvhYDI5mZ8HzHvo4cMZ9bX9z/+03jn8ff7q9H4fqJW4vh9WXp4OEebaMwxwqHDQr9Vude/FmwNwpzOA2lrxX64q2bH5jwQkX1R+4QPDfMzdmnM4OnNekndynQzykFDj1O9BEvxiQhbr3FwAjwWKh+sAbEzpES87n1lvyZUxSun+ja5vb/F8TO4vVl6eDBxueEOThkOH108btBHu7LCT8XxmkofW3MzPCCLf3QyvQmvChi4kBPSst7aR6dCX0pSaAvJgn0xWTvqkpyELfeYqCA3oTHiYkjFXfEfHgcSSJ3euiA66VL23uzkj7z+vI4Bs8zL9/2cnDISBpzrC9tXg/yUEPpa6Mzwws29yKrMTP+xWD/jjTG99i7AAQvKu6NXvYXHlIP0plwH8R+b19yLkuIOToTP07qPCyNkc/B4fJbDAB4vBxR5mTdqvei92hMfA9LLEaJ+WiM+9oscAGJ9RKNpX7W4/XlcQwevAvBASNpzLEe0qfTOzO8mDMvshr0Iun8kEdj8i82Lu6gnrkfCoaBdFHZnxHEjhWLUWI+Gmv8kMccFwC3R4sBgB4vV5RYjILDH7/GOXtYYr5YLIn/3p3dHuPQa0uMUzzvcQwezPno2VeCIcMJ83BfTjjkOA2lr43ODC/m3IusRslFYl9k5134oaJ9JG9H1jGGSL5eWOegd08zst6SdfvnVcjdh9aTK4q0ztEb2S+tIzFfLJYk1Uf2LiflcXh9WTp4Yk+ZnDDHCocMCv1WFf9w2X7Uwb2YH0BsLL8ww572X8IcpItKWueQvB1ZX/qhAGkPaV3CeXtmLXePGG6fFgNAro/DPq0qPWfJL60jMZ9bL75ON7f3Fjl9RD325z4Yd3h9WTp4rLD5cwaBPk5PQp/Y5CKdg7TOIXk7st76oQBpD7peKge3Nha3T4sBINfHQc934YdEpBqldSTmG10L7aHYQNnc2rud029eX44ZPFYXXnrfGwL2192gh9Nvv/He0cCx34JhnNOzwRsI3w88MQ2lr5XYiz2G3pTvJ52DtM4heTuy3vqhAGkPul4i+kNQur4qbp8WA0Cuj4Oer72LzUGqUVpHYr7RtWAf5Qr3cXi+sYNnShpKXyv0DqX4RWWgt+i5SBectM4heTuynqpP2oOuzwrUmAFp7zGU1pPycfRmyLc/eM9BqlFaR2K+UbVskHcml0p6T4/n08GzErEXvBT6w9UlxDgaM/jxAi85L8nbkfXWDwVIe0jrJdABj099SimtJ+XjmJmyumdG9kvrSMw3qhbsoVLhfhbPo4NnJZYm/qJLNIb3l+wV88ZiiOTtyHrrhwKkPWZkvfdDRUj7l1JaT8onQc/3JsQQ6sXj0ZjEzAwe7ls7aW+Ry4VvDHTQHO49PV5f6uBZGXpxWPV+OAD9lLcg1njRgdgellgMkbwdWW/9UIC0h4XGeohRpHwL3UPyWHKP0WIAyPVJ0CeUVrf88BGpuhYmHrfkxrNr8ftnPzsv9Wjd23fs4MEnTDlPmbjH43YNfahH//iPw0f+/KEn9MQ0lH5s0G8HSrS0yUDpXhypOEXydmS99UMB0h4OPGcnqVYO9MQkPTp28RYDQK4vBp5TShLok9S6BCAVD1ild2K5Xl+OGTw4PHKGz9j/7J0bOqXDZyj9WMELIaX+XhoLeiUFt7P3oZ4Ukrcj660fCpD2cND3PaUk0ZjQK0nCxVsMALm+FL0Jz40T9y2SozGhn5OEi7cY4Li0/dmtoXfy73YctO/wEbzXl6WDZ+yn09GDQr/VuZ9+GgwbFOZwGkp/IOAFgbL/yufQmTDXqR9sLNSbQvJ2ZL31QwHSHgj1oVLHcPQmzHVaDDaW3GPl+nJoTHieTsvBlgRznXpqYnC+FgMc6+gbaQ+vL0sHDw4MTpiTM6zOnL8W5OGQ4fTMj/4b5KGG0hVFqQ5sWE44MDjhp9MxLgmPhUOG0xf+8HGQh8I6FUWpCGxYTjgsOOEHNzEuCY+FQ4bTY7/7JMhDYZ2KolQENiwnHBacxuRweThkOH31x/8J8lBYp6IoFYENywmHBSfMyclDv9UTv/pnMGhQmMMJ61QUpSKwYSXh0EgNECv7WyjQ63T2hXcCvxMOGqqL3/9f4OeEdSqKUhHYsDGdhUGS8z8B2k+Z4xOuS6/1gQ/1NDxWf/KX/wo8MWGdiqJUBDbsSRHWqShKRWDDnhRhnYqiVMTm1n6PTTt97abe2akoysMmbNxpC+tTFKVCsHGnLqxPUZRKweadqrAuRVEqZmNn9yo28eQ03839FTGKotRE0MwTEdahKMoE2dza7bG5q9SO3uUoytT4HLNz8fU/4evXAAAAAElFTkSuQmCC>