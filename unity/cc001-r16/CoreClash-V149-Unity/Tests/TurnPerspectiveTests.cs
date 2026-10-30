using CoreClash.Core;
using CoreClash.Presentation;

public static partial class Program
{
    static void A21TurnPerspectiveTests()
    {
        Test("A21 local P2 does not see YOUR TURN while P1 aims",()=>{
            var s=new GameState{turn=0,turnNumber=4,phase=MatchPhase.Aiming};
            True(TurnPerspective.TurnLabel(s,true,true,1).Contains("OPPONENT'S TURN"));
            False(TurnPerspective.TurnLabel(s,true,true,1).Contains("YOUR"));
            Eq("OPPONENT IS AIMING",TurnPerspective.ActionHint(s,true,true,1,false,false));
            False(TurnPerspective.CanShowLocalAim(s,true,true,1));
            Eq("P2 YOU",TurnPerspective.SeatLabel(1,true,true,1,true));
            Eq("P1 OPP",TurnPerspective.SeatLabel(0,true,true,1,true));
            Eq("OPP TURN",TurnPerspective.CompactPhase(s,true,true,1));
        });
        Test("A21 P2 turn becomes YOUR TURN only on local PC2",()=>{
            var s=new GameState{turn=1,turnNumber=5,phase=MatchPhase.Aiming};
            True(TurnPerspective.TurnLabel(s,true,true,1).Contains("YOUR TURN"));
            True(TurnPerspective.TurnLabel(s,true,true,0).Contains("OPPONENT'S TURN"));
            True(TurnPerspective.CanShowLocalAim(s,true,true,1));
            False(TurnPerspective.CanShowLocalAim(s,true,true,0));
            Eq("YOUR TURN",TurnPerspective.CompactPhase(s,true,true,1));
            Eq("DRAG FROM YOUR LAUNCHER TO AIM",TurnPerspective.ActionHint(s,true,true,1,false,false));
            Eq("RELEASE TO LAUNCH",TurnPerspective.ActionHint(s,true,true,1,false,true));
        });
        Test("A21 connected P1 can aim on turn zero, P2 cannot",()=>{
            var s=new GameState{turn=0,phase=MatchPhase.Aiming};
            True(TurnPerspective.TurnLabel(s,true,true,0).Contains("YOUR TURN"));
            True(TurnPerspective.CanShowLocalAim(s,true,true,0));
            False(TurnPerspective.CanShowLocalAim(s,true,true,1));
        });
        Test("A21 disconnected and unknown seat fail closed",()=>{
            var s=new GameState{turn=1,phase=MatchPhase.Aiming};
            foreach(var identity in new[]{(-1,true),(2,true),(1,false)}){
                False(TurnPerspective.TurnLabel(s,true,identity.Item2,identity.Item1).Contains("YOUR"));
                Eq("WAITING FOR CONNECTION",TurnPerspective.ActionHint(s,true,identity.Item2,identity.Item1,false,false));
                False(TurnPerspective.CanShowLocalAim(s,true,identity.Item2,identity.Item1));
                Eq("WAIT",TurnPerspective.CompactPhase(s,true,identity.Item2,identity.Item1));
                Eq("P2",TurnPerspective.SeatLabel(1,true,identity.Item2,identity.Item1,true));
            }
        });
        Test("A21 moving phase never advertises aiming or YOUR TURN",()=>{
            var s=new GameState{turn=1,phase=MatchPhase.Moving};
            foreach(var seat in new[]{0,1}){
                False(TurnPerspective.TurnLabel(s,true,true,seat).Contains("YOUR TURN"));
                Eq("SHOT RELEASED / RESOLVING",TurnPerspective.ActionHint(s,true,true,seat,false,false));
                False(TurnPerspective.CanShowLocalAim(s,true,true,seat));
                Eq("MOVING",TurnPerspective.CompactPhase(s,true,true,seat));
            }
        });
        Test("A21 bonus shot belongs to actual local seat only",()=>{
            var s=new GameState{turn=1,phase=MatchPhase.Aiming,bonusPending=true};
            True(TurnPerspective.TurnLabel(s,true,true,1).Contains("YOUR BONUS SHOT"));
            False(TurnPerspective.TurnLabel(s,true,true,0).Contains("YOUR BONUS SHOT"));
            Eq("YOUR BONUS",TurnPerspective.CompactPhase(s,true,true,1));
            Eq("OPP TURN",TurnPerspective.CompactPhase(s,true,true,0));
        });
        Test("A21 offline player numbers remain neutral, never infer a network seat",()=>{
            var s=new GameState{turn=1,phase=MatchPhase.Aiming};
            var text=TurnPerspective.TurnLabel(s,false,false,-1);
            True(text.Contains("PLAYER 2"));
            False(text.Contains("YOUR"));
            False(text.Contains("OPPONENT"));
            Eq("P2",TurnPerspective.SeatLabel(1,false,false,-1,true));
            True(TurnPerspective.CanShowLocalAim(s,false,false,-1));
            Eq("AIM",TurnPerspective.CompactPhase(s,false,false,-1));
        });
        Test("A21 inspection can be explained during opponent turn but not launch",()=>{
            var s=new GameState{turn=0,phase=MatchPhase.Aiming};
            Eq("TAP A BALL TO INSPECT",TurnPerspective.ActionHint(s,true,true,1,true,false));
            Eq("OPPONENT IS AIMING",TurnPerspective.ActionHint(s,true,true,1,false,true));
            False(TurnPerspective.CanShowLocalAim(s,true,true,1));
        });
        Test("A21 completed game uses actual winner or draw, independent of seat",()=>{
            var s=new GameState{turn=1,phase=MatchPhase.Over,winner=0};
            Eq("PLAYER 1 WINS",TurnPerspective.TurnLabel(s,true,true,1));
            Eq("P1 WINS",TurnPerspective.CompactPhase(s,true,true,1));
            Eq("MATCH COMPLETE",TurnPerspective.ActionHint(s,true,true,1,false,true));
            s.winner=-1;
            Eq("MATCH COMPLETE / DRAW",TurnPerspective.TurnLabel(s,true,true,0));
            Eq("DRAW",TurnPerspective.CompactPhase(s,true,true,0));
        });
        Test("A21 local turn cues are read-only on network snapshots",()=>{
            var s=new GameState{turn=0,turnNumber=6,phase=MatchPhase.Aiming,revision=17};
            int beforeRevision=s.revision,beforeTurn=s.turn,beforeEvents=s.events.Count;
            TurnPerspective.TurnLabel(s,true,true,1);
            TurnPerspective.ActionHint(s,true,true,1,false,false);
            TurnPerspective.CompactPhase(s,true,true,1);
            TurnPerspective.SeatLabel(0,true,true,1,true);
            Eq(beforeRevision,s.revision);Eq(beforeTurn,s.turn);Eq(beforeEvents,s.events.Count);
            Eq("WAITING FOR MATCH",TurnPerspective.TurnLabel(null,true,true,1));
        });
    }
}
