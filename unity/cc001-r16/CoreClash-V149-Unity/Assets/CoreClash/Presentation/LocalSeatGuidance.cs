using CoreClash.Core;

namespace CoreClash.Presentation
{
    // R17-W10 A21: labels are non-authoritative views of the already admitted seat/phase.
    // Never infer the local network owner from state.turn or a ball's owner.
    public static class LocalSeatGuidance
    {
        static bool ValidSeat(int owner) => owner == 0 || owner == 1;
        static bool ConnectedSeat(bool networked, bool connected, int localOwner) =>
            !networked || (connected && ValidSeat(localOwner));

        public static bool CanAim(GameState state, int localOwner, bool networked, bool connected) =>
            state != null && state.phase == MatchPhase.Aiming &&
            ConnectedSeat(networked, connected, localOwner) &&
            (!networked || state.turn == localOwner);

        public static string TurnText(GameState state, int localOwner, bool networked, bool connected)
        {
            if (state == null) return "WAITING FOR MATCH";
            if (state.phase == MatchPhase.Over)
                return state.winner < 0 ? "MATCH COMPLETE / DRAW" : "PLAYER " + (state.winner + 1) + " WINS";
            string prefix = "TURN " + state.turnNumber + " / 50     PLAYER " + (state.turn + 1) + "  /  ";
            if (!ConnectedSeat(networked, connected, localOwner))
                return prefix + "WAITING FOR CONNECTION";
            if (state.phase == MatchPhase.Moving) return prefix + "MOVING";
            if (!networked) return prefix + (state.bonusPending ? "BONUS SHOT" : "AIM");
            return MatchPerspective.TurnText(state, localOwner, true);
        }

        public static string Hint(GameState state, int localOwner, bool networked, bool connected, bool inspection, bool dragging)
        {
            if (state == null) return "WAITING FOR MATCH";
            if (state.phase == MatchPhase.Over) return "MATCH COMPLETE";
            if (!ConnectedSeat(networked, connected, localOwner)) return "WAITING FOR CONNECTION";
            if (inspection) return "TAP A BALL TO INSPECT";
            if (state.phase == MatchPhase.Moving) return "SHOT RELEASED / RESOLVING";
            if (networked && state.turn != localOwner) return "OPPONENT IS AIMING";
            return dragging ? "RELEASE TO LAUNCH" : "DRAG FROM YOUR LAUNCHER TO AIM";
        }

        public static string CompactPhase(GameState state, int localOwner, bool networked, bool connected)
        {
            if (state == null) return "WAIT";
            if (state.phase == MatchPhase.Over)
                return state.winner < 0 ? "DRAW" : "P" + (state.winner + 1) + " WINS";
            if (!ConnectedSeat(networked, connected, localOwner)) return "WAIT";
            if (state.phase == MatchPhase.Moving) return "MOVING";
            if (!networked) return state.bonusPending ? "BONUS" : "AIM";
            if (state.turn != localOwner) return "OPP TURN";
            return state.bonusPending ? "YOUR BONUS" : "YOUR TURN";
        }

        public static string PlayerLabel(int owner, int localOwner, bool networked, bool connected, bool compact)
        {
            string name = compact ? "P" + (owner + 1) : "PLAYER " + (owner + 1);
            return networked && connected && ValidSeat(localOwner) && owner == localOwner
                ? name + (compact ? " YOU" : " · YOU") : name;
        }
    }
}
