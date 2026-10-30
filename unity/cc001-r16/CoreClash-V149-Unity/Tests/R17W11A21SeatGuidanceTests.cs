using CoreClash.Core;
using CoreClash.Presentation;

public static partial class Program
{
    static void R17W11A21SeatGuidanceTests()
    {
        Test("A21-W11 disconnected P1 cannot claim YOUR SHOT even on P1 turn",()=>{
            var state=new GameState{turn=0,phase=MatchPhase.Aiming,turnNumber=8};
            False(LocalTurnPresentation.HasPlayableSeat(0,true,false));
            Eq("TURN 8 / 50     PLAYER 1 / WAITING FOR CONNECTION",
                LocalTurnPresentation.Status(state,0,true,false));
            Eq("WAITING FOR CONNECTION",
                LocalTurnPresentation.ActionHint(state,0,true,false,true,60,0,"DRAG FROM LAUNCHER"));
            Eq("OFFLINE",LocalTurnPresentation.CompactStatus(state,0,true,false));
            Eq("PLAYER 1",LocalTurnPresentation.PlayerLabel(0,0,true,false,false));
            Eq("P1",LocalTurnPresentation.PlayerLabel(0,0,true,false,true));
        });
        Test("A21-W11 disconnected P2 cannot claim YOU or active aim",()=>{
            var state=new GameState{turn=1,phase=MatchPhase.Aiming};
            False(LocalTurnPresentation.HasPlayableSeat(1,true,false));
            False(LocalTurnPresentation.Status(state,1,true,false).Contains("YOUR"));
            Eq("WAITING FOR CONNECTION",
                LocalTurnPresentation.ActionHint(state,1,true,false,false,0,0,"SELECT A BALL"));
            Eq("PLAYER 2",LocalTurnPresentation.PlayerLabel(1,1,true,false,false));
            Eq("P2",LocalTurnPresentation.PlayerLabel(1,1,true,false,true));
        });
        Test("A21-W11 unknown connected seat does not claim turn",()=>{
            var state=new GameState{turn=0,phase=MatchPhase.Aiming};
            foreach(var seat in new[]{-1,2,50}){
                False(LocalTurnPresentation.HasPlayableSeat(seat,true,true));
                True(LocalTurnPresentation.Status(state,seat,true,true).Contains("WAITING FOR CONNECTION"));
                Eq("WAITING FOR CONNECTION",
                    LocalTurnPresentation.ActionHint(state,seat,true,true,true,80,0,"DRAG"));
                Eq("OFFLINE",LocalTurnPresentation.CompactStatus(state,seat,true,true));
                Eq("PLAYER 1",LocalTurnPresentation.PlayerLabel(0,seat,true,true,false));
            }
        });
        Test("A21-W11 connected seats show only their own identity",()=>{
            var state=new GameState{turn=1,phase=MatchPhase.Aiming};
            True(LocalTurnPresentation.HasPlayableSeat(1,true,true));
            Eq("P2 YOU",LocalTurnPresentation.PlayerLabel(1,1,true,true,true));
            Eq("P1",LocalTurnPresentation.PlayerLabel(0,1,true,true,true));
            Eq("PLAYER 1 (YOU)",LocalTurnPresentation.PlayerLabel(0,0,true,true,false));
            Eq("PLAYER 2",LocalTurnPresentation.PlayerLabel(1,0,true,true,false));
            True(LocalTurnPresentation.Status(state,1,true,true).Contains("YOUR SHOT"));
            True(LocalTurnPresentation.Status(state,0,true,true).Contains("WAITING FOR PLAYER 2"));
        });
        Test("A21-W11 moving session disconnect takes priority over resolving",()=>{
            var state=new GameState{turn=1,phase=MatchPhase.Moving};
            Eq("TURN 1 / 50     PLAYER 2 / WAITING FOR CONNECTION",
                LocalTurnPresentation.Status(state,1,true,false));
            Eq("WAITING FOR CONNECTION",
                LocalTurnPresentation.ActionHint(state,1,true,false,true,20,0,"DRAG"));
            Eq("OFFLINE",LocalTurnPresentation.CompactStatus(state,1,true,false));
            Eq("SHOT RESOLVING",
                LocalTurnPresentation.ActionHint(state,1,true,true,false,20,0,"DRAG"));
            Eq("MOVING",LocalTurnPresentation.CompactStatus(state,1,true,true));
        });
        Test("A21-W11 remote opponent turn never claims local launch",()=>{
            var state=new GameState{turn=0,phase=MatchPhase.Aiming};
            False(LocalTurnPresentation.Status(state,1,true,true).Contains("YOUR"));
            Eq("WAITING FOR PLAYER 1",
                LocalTurnPresentation.ActionHint(state,1,true,true,true,80,0,"DRAG"));
            Eq("WAIT P1",LocalTurnPresentation.CompactStatus(state,1,true,true));
            state.turn=1;
            True(LocalTurnPresentation.Status(state,1,true,true).Contains("YOUR SHOT"));
        });
        Test("A21-W11 offline hotseat never inherits connected network identity",()=>{
            var state=new GameState{turn=1,phase=MatchPhase.Aiming};
            True(LocalTurnPresentation.HasPlayableSeat(-1,false,false));
            True(LocalTurnPresentation.Status(state,-1,false,false).Contains("AIMING"));
            Eq("PLAYER 2",LocalTurnPresentation.PlayerLabel(1,1,false,true,false));
            Eq("P1",LocalTurnPresentation.PlayerLabel(0,0,false,true,true));
        });
        Test("A21-W11 bonus shot visible only to controlling local seat",()=>{
            var state=new GameState{turn=1,phase=MatchPhase.Aiming,bonusPending=true};
            True(LocalTurnPresentation.Status(state,1,true,true).Contains("YOUR BONUS SHOT"));
            True(LocalTurnPresentation.Status(state,0,true,true).Contains("WAITING FOR PLAYER 2"));
            Eq("YOUR BONUS",LocalTurnPresentation.CompactStatus(state,1,true,true));
            Eq("WAIT P2",LocalTurnPresentation.CompactStatus(state,0,true,true));
        });
        Test("A21-W11 inspection and cancelled connectivity are read-only",()=>{
            var state=new GameState{turn=1,phase=MatchPhase.Aiming,revision=12};
            int rev=state.revision,turn=state.turn,count=state.events.Count;
            LocalTurnPresentation.Status(state,1,true,false);
            LocalTurnPresentation.CompactStatus(state,1,true,false);
            LocalTurnPresentation.ActionHint(state,1,true,false,true,100,30,"DRAG");
            LocalTurnPresentation.PlayerLabel(1,1,true,false,false);
            Eq(rev,state.revision);Eq(turn,state.turn);Eq(count,state.events.Count);
        });
        Test("A21-W11 game over shows authoritative outcome without YOUR TURN",()=>{
            var state=new GameState{turn=1,winner=0,phase=MatchPhase.Over};
            Eq("PLAYER 1 WINS",LocalTurnPresentation.Status(state,1,true,false));
            Eq("MATCH COMPLETE",LocalTurnPresentation.ActionHint(state,1,true,false,true,12,0,"DRAG"));
            state.winner=-1;
            Eq("MATCH COMPLETE / DRAW",LocalTurnPresentation.Status(state,-1,true,false));
            Eq("DRAW",LocalTurnPresentation.CompactStatus(state,1,true,false));
        });
        Test("A21-W11 null state is safe for disconnected and unassigned input",()=>{
            Eq("WAITING FOR MATCH",LocalTurnPresentation.Status(null,-1,true,false));
            Eq("WAITING FOR MATCH",
                LocalTurnPresentation.ActionHint(null,-1,true,false,true,30,0,"DRAG"));
            Eq("WAIT",LocalTurnPresentation.CompactStatus(null,-1,true,false));
        });
    }
}
