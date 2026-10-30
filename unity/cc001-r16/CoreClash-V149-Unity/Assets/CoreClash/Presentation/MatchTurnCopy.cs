using CoreClash.Core;

namespace CoreClash.Presentation
{
    // Player-facing copy is relative to the local seat, never to the currently active seat.
    // This is presentation only: it does not alter turn ownership or network authorization.
    public static class MatchTurnCopy
    {
        public static string TurnText(int turnNumber, int activeOwner, MatchPhase phase,
            int winner, bool bonusPending, bool networked, bool connected, int localOwner)
        {
            if (phase == MatchPhase.Over)
                return winner < 0 ? "MATCH COMPLETE / DRAW" : "PLAYER " + (winner + 1) + " WINS";

            string prefix = "TURN " + turnNumber + " / 50     PLAYER " + (activeOwner + 1);
            if (phase == MatchPhase.Moving)
                return prefix + " / MOVING";
            if (networked && (!connected || localOwner < 0 || localOwner > 1))
                return prefix + " / WAITING FOR CONNECTION";
            if (networked && activeOwner != localOwner)
                return prefix + " / OPPONENT'S SHOT";
            if (bonusPending)
                return prefix + (networked ? " / YOUR BONUS SHOT" : " / BONUS SHOT");
            return prefix + (networked ? " / YOUR SHOT" : " / TO AIM");
        }

        public static string AimHint(int activeOwner, MatchPhase phase, bool networked,
            bool connected, int localOwner, bool inspecting, bool dragging)
        {
            if (inspecting)
                return "TAP A BALL TO INSPECT";
            if (phase == MatchPhase.Moving)
                return "SHOT RELEASED / RESOLVING";
            if (phase == MatchPhase.Over)
                return "MATCH COMPLETE";
            if (networked && (!connected || localOwner < 0 || localOwner > 1))
                return "WAITING FOR CONNECTION";
            if (networked && activeOwner != localOwner)
                return "WAIT FOR PLAYER " + (activeOwner + 1);
            return dragging ? "RELEASE TO LAUNCH" : "DRAG FROM LAUNCHER TO AIM";
        }

        public static string CompactPhase(int activeOwner, MatchPhase phase, int winner,
            bool bonusPending, bool networked, bool connected, int localOwner)
        {
            if (phase == MatchPhase.Over)
                return winner < 0 ? "DRAW" : "P" + (winner + 1) + " WINS";
            if (phase == MatchPhase.Moving)
                return "MOVING";
            if (networked && (!connected || localOwner < 0 || localOwner > 1))
                return "CONNECT";
            if (networked && activeOwner != localOwner)
                return "P" + (activeOwner + 1) + " TURN";
            if (bonusPending)
                return networked ? "YOUR BONUS" : "BONUS";
            return networked ? "YOUR AIM" : "AIM";
        }
    }
}
