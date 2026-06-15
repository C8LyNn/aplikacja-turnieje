---
name: Swiss pairing logic
description: How Swiss round generation works in this app — pairing, Buchholz, byes
---

Swiss format uses greedy points-based pairing:
1. Sort players by points DESC, wins DESC
2. Pair top unpaired with next best unpaired who hasn't played them yet
3. Fallback: allow repeat pairing if no fresh opponent available
4. Unpaired player gets a bye match (auto-win, status="bye", wins+1, points+3)

Buchholz = sum of opponent points (calculated at standings endpoint from completed matches).

**Why:** Faithfully replicates original Unity app's Swiss logic without needing a full Swiss library.

**How to apply:** `generateSwissRound()` in `artifacts/api-server/src/routes/tournaments.ts`. New rounds generated via POST `/tournaments/:id/generate-round` (only for swiss format, only after all current round matches done).
