using CoreClash.Core;

namespace CoreClash.Presentation
{
    // A21 / W11: read-only secondary coaching for the current authoritative match view.
    // Never infer local command rights from state.turn or from an existing notice.
    public static class SecondaryMatchHelp
    {
        public static string Text(GameState state, int localOwner, bool multiplayer,
            bool connected, bool canChoose, string latestNotice)
        {
            if (state == null) return "WAITING FOR MATCH";
            if (state.phase == MatchPhase.Over)
                return !string.IsNullOrWhiteSpace(state.resultReason)
                    ? state.resultReason : "MATCH COMPLETE";

            // A disconnected or as-yet-unassigned seat must not receive a launch instruction,
            // even when the host is still resolving its previous shot.
            if (multiplayer && (!connected || (localOwner != 0 && localOwner != 1)))
                return "Connection or player seat unavailable. Waiting for multiplayer state.";
            if (state.phase == MatchPhase.Moving)
                return "Shot in progress. Wait for the balls to settle.";
            if (multiplayer && state.turn != localOwner)
                return "Opponent is aiming. Watch the board before your next turn.";

            // A rejected local command is useful only while the local seat can issue a shot.
            // Otherwise a stale message masks the current WAITING/Opponent instruction.
            if (canChoose && !string.IsNullOrWhiteSpace(latestNotice))
                return latestNotice;
            if (state.bonusPending && state.turn == 1)
                return "Player 2 has one extra opening spawn.";
            return "A glowing home ball can Replay before a new spawn.";
        }
    }
}
