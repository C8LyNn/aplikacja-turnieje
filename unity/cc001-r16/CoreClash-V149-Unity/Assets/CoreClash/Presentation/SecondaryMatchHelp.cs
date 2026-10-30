using CoreClash.Core;
using CoreClash.Physics;

namespace CoreClash.Presentation
{
    // A21/W12: beginner-facing coaching only. No turn ownership, commands or simulation writes.
    // The A20 action hint handles launch readiness and current intent errors independently.
    public static class SecondaryMatchHelp
    {
        // Exact existing GameSimulation.CanReplay is the eligibility oracle.
        // The helper must NOT infer replay rights merely from ball position/appearance.
        public static bool ReplayReady(GameSimulation simulation)
        {
            var state = simulation?.State;
            if (state == null || state.phase != MatchPhase.Aiming ||
                state.bonusPending || (state.turn != 0 && state.turn != 1) ||
                state.balls == null || state.replayedIds == null) return false;
            foreach (var ball in state.balls)
                if (simulation.CanReplay(ball)) return true;
            return false;
        }

        // This is an explanatory cue, NOT a second source of Replay rules.
        // Only explain a known blocker when no actual CanReplay-eligible ball exists.
        public static string ReplayBlockedReason(GameSimulation simulation)
        {
            var state = simulation?.State;
            if (state == null || state.phase != MatchPhase.Aiming ||
                state.bonusPending || (state.turn != 0 && state.turn != 1) ||
                state.balls == null || state.replayedIds == null ||
                ReplayReady(simulation)) return null;

            foreach (var ball in state.balls)
            {
                if (ball == null || ball.owner != state.turn || ball.dead ||
                    ball.banished || !ZoneResolver.TouchesOwnZone(ball)) continue;

                if (ball.rooted) return "Replay blocked: a home ball is rooted.";
                if (ball.frozen > 0) return "Replay blocked: a home ball is frozen.";
                if (ball.type == "titan") return "Replay blocked: Titan cannot Replay.";
                if (state.replayedIds.Contains(ball.id))
                    return "Replay used: a home ball already replayed this turn.";
            }
            return null; // No qualifying home ball: neutral first-launch instruction.
        }

        public static string Text(GameState state, int localOwner, bool multiplayer, bool connected, bool replayReady = false, string replayBlockedReason = null)
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
            if (replayReady) return "Replay ready: drag a glowing home ball to launch it again.";
            return !string.IsNullOrEmpty(replayBlockedReason)
                ? replayBlockedReason : "Choose a ball, then drag from your launcher to shoot.";
        }
    }
}
