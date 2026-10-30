using CoreClash.Core;
using CoreClash.Presentation;

public static partial class Program
{
    static void R17W10A21GuidanceTests()
    {
        Test("A21-W10 P2 connected sees opponent when P1 aims",()=>{
            var s=new GameState{turn=0,phase=MatchPhase.Aiming,turnNumber=7};
            True(LocalSeatGuidance.TurnText(s,1,true,true).Contains("OPPONENT SHOT"));
            False(LocalSeatGuidance.TurnText(s,1,true,true).Contains("YOUR"));
            Eq("OPPONENT IS AIMING",LocalSeatGuidance.Hint(s,1,true,true,false,false));
            Eq("OPP TURN",LocalSeatGuidance.CompactPhase(s,1,true,true));
            False(LocalSeatGuidance.CanAim(s,1,true,true));
        });
        Test("A21-W10 P1 connected sees local aim and P2 blocked",()=>{
            var s=new GameState{turn=0,phase=MatchPhase.Aiming};
            True(LocalSeatGuidance.TurnText(s,0,true,true).Contains("YOUR SHOT"));
            True(LocalSeatGuidance.CanAim(s,0,true,true));
            False(LocalSeatGuidance.CanAim(s,1,true,true));
            Eq("RELEASE TO LAUNCH",LocalSeatGuidance.Hint(s,0,true,true,false,true));
        });
        Test("A21-W10 P2 gets local turn only after authoritative handoff",()=>{
            var s=new GameState{turn=1,phase=MatchPhase.Aiming,turnNumber=2};
            True(LocalSeatGuidance.TurnText(s,1,true,true).Contains("YOUR SHOT"));
            True(LocalSeatGuidance.TurnText(s,0,true,true).Contains("OPPONENT SHOT"));
            True(LocalSeatGuidance.CanAim(s,1,true,true));
            Eq("YOUR TURN",LocalSeatGuidance.CompactPhase(s,1,true,true));
        });
        Test("A21-W10 pending bonus belongs only to actual P2",()=>{
            var s=new GameState{turn=1,phase=MatchPhase.Aiming,bonusPending=true};
            True(LocalSeatGuidance.TurnText(s,1,true,true).Contains("YOUR BONUS SHOT"));
            True(LocalSeatGuidance.TurnText(s,0,true,true).Contains("OPPONENT BONUS SHOT"));
            Eq("YOUR BONUS",LocalSeatGuidance.CompactPhase(s,1,true,true));
            Eq("OPP TURN",LocalSeatGuidance.CompactPhase(s,0,true,true));
        });
        Test("A21-W10 moving state never prompts another launch",()=>{
            var s=new GameState{turn=1,phase=MatchPhase.Moving};
            foreach(int seat in new[]{0,1}){
                False(LocalSeatGuidance.TurnText(s,seat,true,true).Contains("YOUR"));
                False(LocalSeatGuidance.CanAim(s,seat,true,true));
                Eq("SHOT RELEASED / RESOLVING",LocalSeatGuidance.Hint(s,seat,true,true,false,true));
                Eq("MOVING",LocalSeatGuidance.CompactPhase(s,seat,true,true));
            }
        });
        Test("A21-W10 disconnect fails closed for both seats",()=>{
            var s=new GameState{turn=1,phase=MatchPhase.Aiming};
            foreach(int seat in new[]{0,1}){
                True(LocalSeatGuidance.TurnText(s,seat,true,false).Contains("WAITING FOR CONNECTION"));
                False(LocalSeatGuidance.TurnText(s,seat,true,false).Contains("YOUR"));
                Eq("WAITING FOR CONNECTION",LocalSeatGuidance.Hint(s,seat,true,false,false,true));
                Eq("WAIT",LocalSeatGuidance.CompactPhase(s,seat,true,false));
                False(LocalSeatGuidance.CanAim(s,seat,true,false));
                Eq("PLAYER "+(seat+1),LocalSeatGuidance.PlayerLabel(seat,seat,true,false,false));
            }
        });
        Test("A21-W10 invalid owner cannot claim either local turn",()=>{
            var s=new GameState{turn=0,phase=MatchPhase.Aiming};
            foreach(int seat in new[]{-1,2}){
                False(LocalSeatGuidance.CanAim(s,seat,true,true));
                True(LocalSeatGuidance.TurnText(s,seat,true,true).Contains("WAITING FOR CONNECTION"));
                Eq("WAIT",LocalSeatGuidance.CompactPhase(s,seat,true,true));
                Eq("P1",LocalSeatGuidance.PlayerLabel(0,seat,true,true,true));
            }
        });
        Test("A21-W10 offline hotseat uses neutral wording",()=>{
            var s=new GameState{turn=0,phase=MatchPhase.Aiming};
            Eq("TURN 1 / 50     PLAYER 1  /  AIM",LocalSeatGuidance.TurnText(s,-1,false,false));
            False(LocalSeatGuidance.TurnText(s,-1,false,false).Contains("YOUR"));
            True(LocalSeatGuidance.CanAim(s,-1,false,false));
            Eq("AIM",LocalSeatGuidance.CompactPhase(s,-1,false,false));
            Eq("PLAYER 1",LocalSeatGuidance.PlayerLabel(0,0,false,true,false));
            s.bonusPending=true;
            True(LocalSeatGuidance.TurnText(s,1,false,false).Contains("BONUS SHOT"));
        });
        Test("A21-W10 board inspection never changes ownership",()=>{
            var s=new GameState{turn=0,phase=MatchPhase.Aiming};
            Eq("TAP A BALL TO INSPECT",LocalSeatGuidance.Hint(s,1,true,true,true,false));
            Eq("OPPONENT IS AIMING",LocalSeatGuidance.Hint(s,1,true,true,false,true));
            False(LocalSeatGuidance.CanAim(s,1,true,true));
        });
        Test("A21-W10 results reflect winner and draw even after disconnect",()=>{
            var s=new GameState{turn=0,phase=MatchPhase.Over,winner=1};
            Eq("PLAYER 2 WINS",LocalSeatGuidance.TurnText(s,0,true,false));
            Eq("P2 WINS",LocalSeatGuidance.CompactPhase(s,0,true,false));
            Eq("MATCH COMPLETE",LocalSeatGuidance.Hint(s,0,true,false,false,true));
            s.winner=-1;
            Eq("MATCH COMPLETE / DRAW",LocalSeatGuidance.TurnText(s,1,true,true));
            Eq("DRAW",LocalSeatGuidance.CompactPhase(s,1,true,true));
        });
        Test("A21-W10 seat captions correctly follow connected owner",()=>{
            Eq("P2 YOU",LocalSeatGuidance.PlayerLabel(1,1,true,true,true));
            Eq("P1",LocalSeatGuidance.PlayerLabel(0,1,true,true,true));
            Eq("PLAYER 1 · YOU",LocalSeatGuidance.PlayerLabel(0,0,true,true,false));
            Eq("PLAYER 2",LocalSeatGuidance.PlayerLabel(1,0,true,true,false));
            Eq("P2",LocalSeatGuidance.PlayerLabel(1,-1,true,true,true));
        });
        Test("A21-W10 hints never mutate host snapshot state",()=>{
            var s=new GameState{turn=0,turnNumber=10,revision=33,phase=MatchPhase.Aiming};
            var revision=s.revision;var count=s.events.Count;var turn=s.turn;
            LocalSeatGuidance.TurnText(s,1,true,true);
            LocalSeatGuidance.Hint(s,1,true,true,false,true);
            LocalSeatGuidance.CompactPhase(s,1,true,true);
            LocalSeatGuidance.PlayerLabel(1,1,true,true,true);
            Eq(revision,s.revision);Eq(count,s.events.Count);Eq(turn,s.turn);
            Eq("WAITING FOR MATCH",LocalSeatGuidance.TurnText(null,1,true,true));
            Eq("WAITING FOR MATCH",LocalSeatGuidance.Hint(null,1,true,true,false,false));
            False(LocalSeatGuidance.CanAim(null,1,true,true));
        });
    }
}
