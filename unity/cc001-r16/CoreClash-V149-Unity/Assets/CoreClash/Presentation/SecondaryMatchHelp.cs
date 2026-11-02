using CoreClash.Core;
using CoreClash.Physics;

namespace CoreClash.Presentation
{
    // A21: secondary, read-only beginner coaching; never submits moves or changes match rules.
    public static class SecondaryMatchHelp
    {
        // A single pass selects one actual legal Replay or a truthful reason that no
        // home ball can Replay. Existing GameSimulation.CanReplay is always authoritative.
        // Used once by ForLocal during HUD rendering; also supports isolated tests.
        static void EvaluateReplay(GameSimulation simulation, out bool ready, out string blocked)
        {
            ready = false;
            blocked = null;
            var state = simulation?.State;
            if (state == null || state.phase != MatchPhase.Aiming ||
                state.bonusPending || (state.turn != 0 && state.turn != 1) ||
                state.balls == null || state.replayedIds == null) return;

            foreach (var ball in state.balls)
            {
                if (simulation.CanReplay(ball))
                {
                    ready = true;
                    blocked = null; // A legal alternative always outranks blocked balls.
                    return;
                }

                // Only offer a blocker for an owned, living ball touching its own
                // home zone. Other balls are not relevant to the local instruction.
                if (blocked != null || ball == null || ball.owner != state.turn ||
                    ball.dead || ball.banished || !ZoneResolver.TouchesOwnZone(ball))
                    continue;

                if (ball.rooted) blocked = "Replay blocked: a home ball is rooted.";
                else if (ball.frozen > 0) blocked = "Replay blocked: a home ball is frozen.";
                else if (ball.type == "titan") blocked = "Replay blocked: Titan cannot Replay.";
                else if (state.replayedIds.Contains(ball.id))
                    blocked = "Replay used: a home ball already replayed this turn.";
            }
        }

        public static bool ReplayReady(GameSimulation simulation)
        {
            EvaluateReplay(simulation, out var ready, out _);
            return ready;
        }

        public static string ReplayBlockedReason(GameSimulation simulation)
        {
            EvaluateReplay(simulation, out _, out var blocked);
            return blocked;
        }

        // Single entrypoint for live local HUD: at most one board scan per render.
        // Remote turns, disconnection, Moving, bonus and game-over skip the scan.
        public static string ForLocal(GameSimulation simulation, int localOwner,
            bool multiplayer, bool connected)
        {
            var state = simulation?.State;
            if (state == null || state.phase != MatchPhase.Aiming ||
                state.bonusPending ||
                (multiplayer && (!connected || (localOwner != 0 && localOwner != 1) ||
                                 state.turn != localOwner)))
                return Text(state, localOwner, multiplayer, connected);

            EvaluateReplay(simulation, out var ready, out var blocked);
            return Text(state, localOwner, multiplayer, connected, ready, blocked);
        }

        // The exact active turn/connection precedence is also used in unit tests.
        public static string Text(GameState state, int localOwner, bool multiplayer,
            bool connected, bool replayReady = false, string replayBlockedReason = null)
        {
            if (state == null) return "Waiting for match.";
            if (state.phase == MatchPhase.Over)
                return !string.IsNullOrWhiteSpace(state.resultReason)
                    ? state.resultReason : "Match complete.";

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
