---
name: API mutation signatures
description: Orval-generated mutation hooks take { data: Body } not flat fields
---

All Orval-generated mutation hooks (useMutation wrappers) expect a wrapper object:
- `useCreateTournament({ data: TournamentInput })`
- `useAddPlayer({ id, data: PlayerInput })`
- `useCompleteMatch({ id, data: MatchResult })`
etc.

**Why:** Orval wraps mutation variables in `{ data: Body }` by default in this project config.

**How to apply:** Always wrap mutation arguments in `{ data: ... }` when calling `.mutate()`. Do NOT pass flat fields directly to the mutate call.
