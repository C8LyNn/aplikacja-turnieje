using CoreClash.Core;

namespace CoreClash.Presentation
{
    // A21: presentation-only local-seat cues. Never use these labels for command ownership.
    // An unknown/disconnected network seat fails closed: no "YOUR TURN" or launch hint.
    public static class TurnPerspective
    {
        static bool ValidSeat(int seat) => seat == 0 || seat == 1;

        public static bool CanShowLocalAim(GameState state, bool networked, bool connected, int localOwner)
        {
            return state != null && state.phase == MatchPhase.Aiming
                && (!networked || (connected && ValidSeat(localOwner) && state.turn == localOwner));
        }

        public static string TurnLabel(GameState state, bool networked, bool connected, int localOwner)
        {
            if (state == null) return "WAITING FOR MATCH";
            if (state.phase == MatchPhase.Over)
                return state.winner < 0 ? "MATCH COMPLETE / DRAW" : "PLAYER " + (state.winner + 1) + " WINS";

            string prefix = "TURN " + state.turnNumber + " / 50     PLAYER " + (state.turn + 1);
            if (networked && (!connected || !ValidSeat(localOwner)))
                return prefix + " / WAITING FOR CONNECTION";
            if (state.phase == MatchPhase.Moving)
                return prefix + " / SHOT RESOLVING";
            if (networked && state.turn != localOwner)
                return prefix + " / OPPONENT'S TURN";
            if (networked)
                return prefix + (state.bonusPending ? " / YOUR BONUS SHOT" : " / YOUR TURN");
            return prefix + (state.bonusPending ? " / BONUS SHOT" : " / AIM");
        }

        public static string ActionHint(GameState state, bool networked, bool connected, int localOwner, bool inspecting, bool dragging)
        {
            if (state == null) return "WAITING FOR MATCH";
            if (state.phase == MatchPhase.Over) return "MATCH COMPLETE";
            if (inspecting) return "TAP A BALL TO INSPECT";
            if (networked && (!connected || !ValidSeat(localOwner))) return "WAITING FOR CONNECTION";
            if (state.phase == MatchPhase.Moving) return "SHOT RELEASED / RESOLVING";
            if (networked && state.turn != localOwner) return "OPPONENT IS AIMING";
            return dragging ? "RELEASE TO LAUNCH" : "DRAG FROM YOUR LAUNCHER TO AIM";
        }

        public static string CompactPhase(GameState state, bool networked, bool connected, int localOwner)
        {
            if (state == null) return "WAIT";
            if (state.phase == MatchPhase.Over)
                return state.winner < 0 ? "DRAW" : "P" + (state.winner + 1) + " WINS";
            if (networked && (!connected || !ValidSeat(localOwner))) return "WAIT";
            if (state.phase == MatchPhase.Moving) return "MOVING";
            if (networked && state.turn != localOwner) return "OPP TURN";
            if (networked) return state.bonusPending ? "YOUR BONUS" : "YOUR TURN";
            return state.bonusPending ? "BONUS" : "AIM";
        }

        public static string SeatLabel(int seat, bool networked, bool connected, int localOwner, bool compact)
        {
            string name = compact ? "P" + (seat + 1) : "PLAYER " + (seat + 1);
            if (!ValidSeat(seat) || !networked || !connected || !ValidSeat(localOwner)) return name;
            return name + (seat == localOwner ? (compact ? " YOU" : " / YOU") : (compact ? " OPP" : " / OPPONENT"));
        }
    }
}
