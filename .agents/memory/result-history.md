---
name: Result history tracking
description: How result history and match revert work in this project
---

Every time `POST /matches/:id/complete` is called, a row is inserted into `result_history` table.
The standings endpoint (`GET /tournaments/:id/standings`) recalculates from scratch using matches table (not from player.wins column directly), to be accurate.

Revert (`POST /matches/:id/revert`):
- Undoes player stats (wins/draws/losses/points) by decrementing with GREATEST(..., 0)
- For single_elimination: removes advanced player from next round match slot
- Removes the result_history row for that match
- Resets match to status="pending" with null scores

**Why:** Faithful recreation of original Unity app's correction panel (Korekta błędów).

**How to apply:** Only works on status="completed" matches. Single elimination bracket reversion may need re-checking if multiple rounds have advanced since.
