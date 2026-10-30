using CoreClash.Core;
using CoreClash.Presentation;

public static partial class Program
{
    static void MatchTurnCopyTests()
    {
        Test("A83-W9 host P1 sees own shot only on P1 turn", () => {
            var own = MatchTurnCopy.TurnText(1, 0, MatchPhase.Aiming, -1, false, true, true, 0);
            var other = MatchTurnCopy.TurnText(2, 1, MatchPhase.Aiming, -1, false, true, true, 0);
            True(own.Contains("YOUR SHOT"));
            True(other.Contains("OPPONENT'S SHOT"));
            False(other.Contains("YOUR SHOT"));
        });
        Test("A83-W9 client P2 sees opponent shot on P1 turn", () => {
            var before = MatchTurnCopy.TurnText(1, 0, MatchPhase.Aiming, -1, false, true, true, 1);
            var after = MatchTurnCopy.TurnText(2, 1, MatchPhase.Aiming, -1, false, true, true, 1);
            True(before.Contains("PLAYER 1"));
            True(before.Contains("OPPONENT'S SHOT"));
            False(before.Contains("YOUR"));
            True(after.Contains("PLAYER 2"));
            True(after.Contains("YOUR SHOT"));
            Eq("WAIT FOR PLAYER 1", MatchTurnCopy.AimHint(0, MatchPhase.Aiming, true, true, 1, false, false));
            Eq("YOUR AIM", MatchTurnCopy.CompactPhase(1, MatchPhase.Aiming, -1, false, true, true, 1));
            Eq("P1 TURN", MatchTurnCopy.CompactPhase(0, MatchPhase.Aiming, -1, false, true, true, 1));
        });
        Test("A83-W9 disconnected client does not claim active turn", () => {
            var label = MatchTurnCopy.TurnText(1, 1, MatchPhase.Aiming, -1, false, true, false, 1);
            True(label.Contains("WAITING FOR CONNECTION"));
            False(label.Contains("YOUR SHOT"));
            Eq("WAITING FOR CONNECTION", MatchTurnCopy.AimHint(1, MatchPhase.Aiming, true, false, 1, false, false));
            Eq("CONNECT", MatchTurnCopy.CompactPhase(1, MatchPhase.Aiming, -1, false, true, false, 1));
        });
        Test("A83-W9 local hotseat does not label an arbitrary player as network client", () => {
            var text = MatchTurnCopy.TurnText(1, 0, MatchPhase.Aiming, -1, false, false, true, -1);
            True(text.Contains("PLAYER 1"));
            True(text.Contains("TO AIM"));
            False(text.Contains("OPPONENT"));
        });
        Test("A83-W9 bonus, moving and match-over copy never produce false your turn", () => {
            var bonus = MatchTurnCopy.TurnText(3, 1, MatchPhase.Aiming, -1, true, true, true, 0);
            True(bonus.Contains("OPPONENT'S SHOT"));
            False(bonus.Contains("YOUR BONUS"));
            var ownBonus = MatchTurnCopy.TurnText(3, 1, MatchPhase.Aiming, -1, true, true, true, 1);
            True(ownBonus.Contains("YOUR BONUS SHOT"));
            var moving = MatchTurnCopy.TurnText(3, 1, MatchPhase.Moving, -1, false, true, true, 1);
            True(moving.Contains("MOVING"));False(moving.Contains("YOUR SHOT"));
            var over = MatchTurnCopy.TurnText(4, 1, MatchPhase.Over, 0, false, true, true, 1);
            Eq("PLAYER 1 WINS", over);
            Eq("MATCH COMPLETE / DRAW", MatchTurnCopy.TurnText(4, 1, MatchPhase.Over, -1, false, true, true, 1));
        });
        Test("A83-W9 inspection and aiming guidance are gated by phase and active player", () => {
            Eq("TAP A BALL TO INSPECT", MatchTurnCopy.AimHint(0, MatchPhase.Aiming, true, true, 1, true, false));
            Eq("SHOT RELEASED / RESOLVING", MatchTurnCopy.AimHint(1, MatchPhase.Moving, true, true, 1, false, false));
            Eq("RELEASE TO LAUNCH", MatchTurnCopy.AimHint(1, MatchPhase.Aiming, true, true, 1, false, true));
            Eq("WAIT FOR PLAYER 2", MatchTurnCopy.AimHint(1, MatchPhase.Aiming, true, true, 0, false, true));
        });
    }
}
