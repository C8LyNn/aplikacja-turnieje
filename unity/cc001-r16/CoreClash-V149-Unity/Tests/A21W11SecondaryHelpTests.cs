using CoreClash.Core;
using CoreClash.Presentation;

public static partial class Program
{
    static void A21W11SecondaryHelpTests()
    {
        Test("A21-W11 secondary hint hides stale P2 notice while P1 aims",()=>{
            var state=new GameState{turn=0,phase=MatchPhase.Aiming};
            Eq("Opponent is aiming. Watch the board before your next turn.",
                SecondaryMatchHelp.Text(state,1,true,true,false,"RELEASE TO LAUNCH"));
        });
        Test("A21-W11 P2 disconnected on its own turn never sees replay guidance",()=>{
            var state=new GameState{turn=1,phase=MatchPhase.Aiming,bonusPending=true};
            Eq("Connection or player seat unavailable. Waiting for multiplayer state.",
                SecondaryMatchHelp.Text(state,1,true,false,false,"RELEASE TO LAUNCH"));
        });
        Test("A21-W11 disconnected moving phase prioritizes loss of connection",()=>{
            var state=new GameState{turn=1,phase=MatchPhase.Moving};
            Eq("Connection or player seat unavailable. Waiting for multiplayer state.",
                SecondaryMatchHelp.Text(state,1,true,false,false,"SHOT REJECTED"));
            Eq("Shot in progress. Wait for the balls to settle.",
                SecondaryMatchHelp.Text(state,1,true,true,false,"SHOT REJECTED"));
        });
        Test("A21-W11 connected unknown seat cannot inherit current turn hint",()=>{
            var state=new GameState{turn=1,phase=MatchPhase.Aiming};
            foreach(int seat in new[]{-1,2,20})
                Eq("Connection or player seat unavailable. Waiting for multiplayer state.",
                    SecondaryMatchHelp.Text(state,seat,true,true,true,"RELEASE TO LAUNCH"));
        });
        Test("A21-W11 valid own turn may show fresh rejection",()=>{
            var state=new GameState{turn=0,phase=MatchPhase.Aiming};
            Eq("Not enough power",
                SecondaryMatchHelp.Text(state,0,true,true,true,"Not enough power"));
            Eq("A glowing home ball can Replay before a new spawn.",
                SecondaryMatchHelp.Text(state,0,true,true,false,"Not enough power"));
        });
        Test("A21-W11 P2 legal opening bonus described only on active local turn",()=>{
            var state=new GameState{turn=1,phase=MatchPhase.Aiming,bonusPending=true};
            Eq("Player 2 has one extra opening spawn.",
                SecondaryMatchHelp.Text(state,1,true,true,true,""));
            Eq("Opponent is aiming. Watch the board before your next turn.",
                SecondaryMatchHelp.Text(state,0,true,true,false,""));
        });
        Test("A21-W11 offline local hotseat keeps neutral replay guidance",()=>{
            var state=new GameState{turn=0,phase=MatchPhase.Aiming};
            Eq("A glowing home ball can Replay before a new spawn.",
                SecondaryMatchHelp.Text(state,-1,false,false,true,null));
        });
        Test("A21-W11 finished match only shows authoritative outcome",()=>{
            var state=new GameState{turn=0,phase=MatchPhase.Over,winner=1,
                resultReason="PLAYER 2 WINS"};
            Eq("PLAYER 2 WINS",SecondaryMatchHelp.Text(state,0,true,false,false,"RELEASE TO LAUNCH"));
            state.resultReason="";
            Eq("MATCH COMPLETE",SecondaryMatchHelp.Text(state,0,true,true,false,""));
        });
        Test("A21-W11 null state and whitespace notice are safe",()=>{
            Eq("WAITING FOR MATCH",SecondaryMatchHelp.Text(null,1,true,true,false,"RELEASE"));
            var state=new GameState{turn=0,phase=MatchPhase.Aiming};
            Eq("A glowing home ball can Replay before a new spawn.",
                SecondaryMatchHelp.Text(state,0,true,true,true,"   "));
        });
        Test("A21-W11 secondary help never mutates gameplay or revisions",()=>{
            var state=new GameState{turn=1,phase=MatchPhase.Aiming,revision=104,
                bonusPending=true};
            int revision=state.revision,turn=state.turn,count=state.events.Count;
            SecondaryMatchHelp.Text(state,1,true,true,true,"NOTICE");
            SecondaryMatchHelp.Text(state,0,true,true,false,"NOTICE");
            SecondaryMatchHelp.Text(state,1,true,false,false,"NOTICE");
            Eq(revision,state.revision);
            Eq(turn,state.turn);
            Eq(count,state.events.Count);
            True(state.bonusPending);
        });
    }
}
