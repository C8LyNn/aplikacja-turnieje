using CoreClash.Core;
using CoreClash.Presentation;

public static partial class Program
{
    static void A21W12SecondaryHelpTests()
    {
        Test("A21-W12 P2 sees opponent coaching during P1 aiming",()=>{
            var s=new GameState{turn=0,phase=MatchPhase.Aiming};
            Eq("Opponent is aiming. Wait for your turn.",
                SecondaryMatchHelp.Text(s,1,true,true));
        });
        Test("A21-W12 P1 sees opponent coaching during P2 aiming",()=>{
            var s=new GameState{turn=1,phase=MatchPhase.Aiming};
            Eq("Opponent is aiming. Wait for your turn.",
                SecondaryMatchHelp.Text(s,0,true,true));
        });
        Test("A21-W12 disconnected PC1 cannot get Replay or launch cue",()=>{
            var s=new GameState{turn=0,phase=MatchPhase.Aiming};
            Eq("Connection lost. Waiting to reconnect.",
                SecondaryMatchHelp.Text(s,0,true,false));
        });
        Test("A21-W12 disconnected P2 Moving shows connection state first",()=>{
            var s=new GameState{turn=1,phase=MatchPhase.Moving};
            Eq("Connection lost. Waiting to reconnect.",
                SecondaryMatchHelp.Text(s,1,true,false));
        });
        Test("A21-W12 invalid or unassigned local seat fails closed",()=>{
            var s=new GameState{turn=1,phase=MatchPhase.Aiming};
            foreach(var localOwner in new[]{-1,2,99})
                Eq("Waiting for your player seat.",
                    SecondaryMatchHelp.Text(s,localOwner,true,true));
        });
        Test("A21-W12 connected Moving shows resolving regardless of turn",()=>{
            var s=new GameState{turn=1,phase=MatchPhase.Moving};
            Eq("Shot resolving. Wait for the balls to settle.",
                SecondaryMatchHelp.Text(s,1,true,true));
            Eq("Shot resolving. Wait for the balls to settle.",
                SecondaryMatchHelp.Text(s,0,true,true));
        });
        Test("A21-W12 P2 opening bonus is shown to P2 only",()=>{
            var s=new GameState{turn=1,phase=MatchPhase.Aiming,bonusPending=true};
            Eq("Player 2 has one extra opening spawn.",
                SecondaryMatchHelp.Text(s,1,true,true));
            Eq("Opponent is aiming. Wait for your turn.",
                SecondaryMatchHelp.Text(s,0,true,true));
        });
        Test("A21-W12 normal local aiming shows replay hint",()=>{
            var s=new GameState{turn=0,phase=MatchPhase.Aiming};
            Eq("Choose a ball, then drag from your launcher to shoot.",
                SecondaryMatchHelp.Text(s,0,true,true));
            Eq("Choose a ball, then drag from your launcher to shoot.",
                SecondaryMatchHelp.Text(s,-1,false,false));
        });
        Test("A21-W12 GameOver always shows actual outcome or fallback",()=>{
            var s=new GameState{phase=MatchPhase.Over,winner=1,resultReason="PLAYER 2 WINS"};
            Eq("PLAYER 2 WINS",SecondaryMatchHelp.Text(s,0,true,false));
            s.resultReason=null;
            Eq("Match complete.",SecondaryMatchHelp.Text(s,-1,true,false));
        });
        Test("A21-W12 null game state is safe",()=>{
            Eq("Waiting for match.",SecondaryMatchHelp.Text(null,0,true,true));
        });
        Test("A21-W12 coaching is read-only for turn, revision, events",()=>{
            var s=new GameState{turn=1,phase=MatchPhase.Aiming,revision=15,bonusPending=true};
            int rev=s.revision,turn=s.turn,eventCount=s.events.Count;
            SecondaryMatchHelp.Text(s,1,true,true);
            SecondaryMatchHelp.Text(s,0,true,false);
            SecondaryMatchHelp.Text(s,-1,true,true);
            Eq(rev,s.revision);Eq(turn,s.turn);Eq(eventCount,s.events.Count);
            True(s.bonusPending);
        });
    }
}
