"""Requirement 3: Experimental Evaluation runner for ConnectFourAI.

Plays head-to-head matches between the three agents (Random, Rule-Based,
Minimax) using the shared ConnectFourEngine, records win rate, draw rate,
and average per-move decision time for each agent, and writes the results
to evaluation_results.md and evaluation_results.json.

Usage:
    python3 evaluate.py
    python3 evaluate.py --games 30

All matches alternate which agent moves first (half the games each way),
and every agent instance is constructed with its own seed so that the
whole experiment is reproducible.
"""

import argparse
import json
import time

from ConnectFourAI.engine import ConnectFourEngine
from ConnectFourAI.agents import RandomAgent, RuleBasedAgent, MinimaxAgent


def make_random(seed):
    return RandomAgent(seed=seed)


def make_rulebased(seed):
    return RuleBasedAgent(seed=seed)


def make_minimax(seed):
    return MinimaxAgent(depth=4, seed=seed)


def play_match(name_a, factory_a, name_b, factory_b, games, seed_base_a, seed_base_b):
    """Play games games between two agents, alternating who starts.

    Returns a dict with per-agent wins/draws/decision-time totals and a
    per-game log (for reproducibility / auditing).
    """
    stats = {
        name_a: {"wins": 0, "draws": 0, "total_time": 0.0, "total_moves": 0},
        name_b: {"wins": 0, "draws": 0, "total_time": 0.0, "total_moves": 0},
    }
    game_logs = []

    for i in range(games):
        a_first = i < games // 2
        engine = ConnectFourEngine()

        seed_a = seed_base_a + i
        seed_b = seed_base_b + i
        agent_a = factory_a(seed_a)
        agent_b = factory_b(seed_b)

        player1_name = name_a if a_first else name_b
        player2_name = name_b if a_first else name_a
        player1_agent = agent_a if a_first else agent_b
        player2_agent = agent_b if a_first else agent_a

        moves = 0
        while not engine.is_terminal():
            current = engine.current_player()
            agent = player1_agent if current == 1 else player2_agent
            agent_name = player1_name if current == 1 else player2_name

            t0 = time.perf_counter()
            col = agent.get_move(engine)
            t1 = time.perf_counter()

            stats[agent_name]["total_time"] += (t1 - t0)
            stats[agent_name]["total_moves"] += 1

            engine.apply_move(col)
            moves += 1

        result = engine.winner()
        if result == 0:
            stats[name_a]["draws"] += 1
            stats[name_b]["draws"] += 1
            outcome = "draw"
        elif result == 1:
            stats[player1_name]["wins"] += 1
            outcome = player1_name
        else:
            stats[player2_name]["wins"] += 1
            outcome = player2_name

        game_logs.append({
            "game": i,
            "first": player1_name,
            "seed_a": seed_a,
            "seed_b": seed_b,
            "result": outcome,
            "moves": moves,
        })

    return {"stats": stats, "game_logs": game_logs}


def summarize(pairing_name, result, games):
    lines = [f"### {pairing_name}", "", "| Agent | Win rate | Draw rate | Avg decision time (ms) |",
             "|---|---|---|---|"]
    for agent_name, s in result["stats"].items():
        win_rate = 100.0 * s["wins"] / games
        draw_rate = 100.0 * s["draws"] / games
        avg_ms = 1000.0 * s["total_time"] / s["total_moves"] if s["total_moves"] else 0.0
        lines.append(
            f"| {agent_name} | {s['wins']}/{games} ({win_rate:.2f}%) | "
            f"{s['draws']}/{games} ({draw_rate:.2f}%) | {avg_ms:.4f} |"
        )
    lines.append("")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Requirement 3 evaluation runner")
    parser.add_argument("--games", type=int, default=30, help="Games per pairing (default: 30)")
    args = parser.parse_args()
    games = args.games

    pairings = [
        ("Random vs Rule-Based", "Random", make_random, "RuleBased", make_rulebased, 1000, 2000),
        ("Rule-Based vs Minimax", "RuleBased", make_rulebased, "Minimax", make_minimax, 3000, 4000),
        ("Minimax vs Random", "Minimax", make_minimax, "Random", make_random, 5000, 6000),
    ]

    all_results = {}
    md_sections = [
        "# Requirement 3: Experimental Evaluation Results", "",
        f"Each pairing was played over {games} games, alternating which agent moves first "
        f"({games // 2} games each way). Each agent instance is constructed with its own "
        "seed per game (see the seed_a/seed_b columns in evaluation_results.json) so the "
        "whole experiment is reproducible.", "",
    ]

    for label, name_a, factory_a, name_b, factory_b, seed_base_a, seed_base_b in pairings:
        result = play_match(name_a, factory_a, name_b, factory_b, games, seed_base_a, seed_base_b)
        all_results[label] = result
        md_sections.append(summarize(label, result, games))
        print(summarize(label, result, games))

    with open("evaluation_results.json", "w") as f:
        json.dump(all_results, f, indent=2)

    with open("evaluation_results.md", "w") as f:
        f.write("\n".join(md_sections))

    print("Wrote evaluation_results.json and evaluation_results.md")


if __name__ == "__main__":
    main()
