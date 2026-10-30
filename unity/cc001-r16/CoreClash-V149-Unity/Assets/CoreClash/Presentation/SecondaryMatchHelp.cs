using CoreClash.Core;

namespace CoreClash.Presentation
{
    // A21/W12: beginner-facing coaching only. No turn ownership, commands or simulation writes.
    // The A20 action hint handles launch readiness and current intent errors independently.
    public static class SecondaryMatchHelp
    {
        public static string Text(GameState state, int localOwner, bool multiplayer, bool connected)
        {
            if (state == null) return "Waiting for match.";
            if (state.phase == MatchPhase.Over)
                return !string.IsNullOrWhiteSpace(state.resultReason)
                    ? state.resultReason : "Match complete.";

            // Check connection and assigned seat before phase or turn.
            // Never advise a disconnected or unassigned client to shoot/replay.
            if (multiplayer && !connected) return "Connection lost. Waiting to reconnect.";
            if (multiplayer && localOwner != 0 && localOwner != 1)
                return "Waiting for your player seat.";
            if (state.phase == MatchPhase.Moving)
                return "Shot resolving. Wait for the balls to settle.";
            if (multiplayer && state.turn != localOwner)
                return "Opponent is aiming. Wait for your turn.";
            if (state.bonusPending && state.turn == 1)
                return "Player 2 has one extra opening spawn.";
            return "Replay: drag a glowing home ball instead of spawning.";
        }
    }
}
