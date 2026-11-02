# CC-001 W19-03 — headless self-play (#291)

Deterministic AI-vs-AI matches on the **real** `GameSimulation`: every action is a
`PlayerCommand` admitted by `GameSimulation.TryCommand`, time advances only through
`GameSimulation.Step(1/120)`. Rules, physics, stats, catalog and decks are read-only
inputs; nothing in `Assets/` is changed or compiled differently.

```
dotnet run -c Release --project Tools/SelfPlay -- --out <dir outside the repo> [--seed 20261102] [--per-cell 21]
    [--strategies random,fixed,heuristic] [--decks id,id,...] [--threads N] [--min-matches 1000] [--root <Unity project>]
dotnet run -c Release --project Tools/SelfPlay -- --compare <runDirA> <runDirB>
```

Default run: 3 strategies (same strategy on both sides) × 16 ordered pairs of the 4 featured
decks (mirrors included) × 21 seeds = **1008 matches**.

| Strategy | Behaviour |
|---|---|
| `random` | random ball with stock, angle −80°…80° forward, power 60…590; 25 % Replay when allowed |
| `fixed` | constant angle 0° and power 420; only the ball choice is seeded; never Replays |
| `heuristic` | hits the enemy ball deepest in its own half (heaviest ball); otherwise 50 % Replay toward the enemy zone or launches the ball with most stock into the enemy zone; ±3° seeded noise |

Outputs (in `--out`): `matches.csv` (one deterministic row per match — winner, sides, turns,
end reason/class, base HP, Replays per side, balls launched per side, alive/graveyard, motion
guards, illegal proposals, final-state SHA-256 prefix), `timing.csv` (wall time per match — the
only non-deterministic data), `matches.json`, `summary.json` (config, digest, data hashes,
runtime/hardware, aggregates) and `report.md` (winrate P1/P2, deck matrix per strategy,
median/P90 turns, tiebreak share, end reasons, failures, ball usage).

Exit code: `0` every match completed, ≥ `--min-matches`, catalog/featured unchanged · `1` any
match failed, too few matches, data changed, or `--compare` found a difference · `2` usage error.

Determinism: the bot RNG is an own splitmix64 stream seeded from `seed + cell + repeat`
(never `string.GetHashCode`, `Random` or time); the gameplay RNG keeps its real start value
`randomState = 149`. Results are stored by match index, so `--threads` cannot change them.
Two runs with the same seed/config must produce byte-identical `matches.csv` (`--compare`).

A bot crash, an action that does not resolve within 4000 frames, more than 2000 actions,
a non-finite ball, base HP outside 0…20 or an unknown end reason is recorded as a `FAILED`
row with its reason — never skipped. An illegal proposal is counted and replaced by a legal
Standard launch (built-in strategies are expected to produce 0).

The bots are deliberately simple; the numbers are raw material for owner decisions Q3–Q7,
not balance verdicts.
