using CoreClash.Core;
using CoreClash.Presentation;

public static partial class Program
{
    static void A21W15SinglePassCoachingTests()
    {
        Test("A21-W15 empty board teaches launch instead of fake Replay",()=>{
            var sim=Sim();
            Eq("Choose a ball, then drag from your launcher to shoot.",
                SecondaryMatchHelp.ForLocal(sim,0,true,true));
        });
        Test("A21-W15 legal home ball suggests Replay",()=>{
            var sim=Sim();
            sim.Spawn(0,"normal",180,750);
            Eq("Replay ready: drag a glowing home ball to launch it again.",
                SecondaryMatchHelp.ForLocal(sim,0,true,true));
        });
        Test("A21-W15 rooted home ball gives exact blocker",()=>{
            var sim=Sim();
            sim.Spawn(0,"normal",180,750).rooted=true;
            Eq("Replay blocked: a home ball is rooted.",
                SecondaryMatchHelp.ForLocal(sim,0,true,true));
        });
        Test("A21-W15 frozen home ball gives exact blocker",()=>{
            var sim=Sim();
            sim.Spawn(0,"normal",180,750).frozen=2;
            Eq("Replay blocked: a home ball is frozen.",
                SecondaryMatchHelp.ForLocal(sim,0,true,true));
        });
        Test("A21-W15 used home ball gives exact blocker",()=>{
            var sim=Sim();
            var ball=sim.Spawn(0,"normal",180,750);
            sim.State.replayedIds.Add(ball.id);
            Eq("Replay used: a home ball already replayed this turn.",
                SecondaryMatchHelp.ForLocal(sim,0,true,true));
        });
        Test("A21-W15 Titan home ball cannot Replay",()=>{
            var sim=Sim();
            sim.Spawn(0,"normal",180,750).type="titan";
            Eq("Replay blocked: Titan cannot Replay.",
                SecondaryMatchHelp.ForLocal(sim,0,true,true));
        });
        Test("A21-W15 later eligible ball overrides earlier rooted blocker",()=>{
            var sim=Sim();
            sim.Spawn(0,"normal",180,750).rooted=true;
            sim.Spawn(0,"normal",270,750);
            Eq("Replay ready: drag a glowing home ball to launch it again.",
                SecondaryMatchHelp.ForLocal(sim,0,true,true));
        });
        Test("A21-W15 earlier eligible ball overrides later frozen blocker",()=>{
            var sim=Sim();
            sim.Spawn(0,"normal",180,750);
            sim.Spawn(0,"normal",270,750).frozen=2;
            Eq("Replay ready: drag a glowing home ball to launch it again.",
                SecondaryMatchHelp.ForLocal(sim,0,true,true));
        });
        Test("A21-W15 opponent sees turn not Replay even when P1 owns legal home ball",()=>{
            var sim=Sim();
            sim.Spawn(0,"normal",180,750);
            Eq("Opponent is aiming. Wait for your turn.",
                SecondaryMatchHelp.ForLocal(sim,1,true,true));
        });
        Test("A21-W15 disconnected owner sees connection despite ready Replay",()=>{
            var sim=Sim();
            sim.Spawn(0,"normal",180,750);
            Eq("Connection lost. Waiting to reconnect.",
                SecondaryMatchHelp.ForLocal(sim,0,true,false));
        });
        Test("A21-W15 unassigned local seat sees waiting cue",()=>{
            var sim=Sim();
            sim.Spawn(0,"normal",180,750);
            Eq("Waiting for your player seat.",
                SecondaryMatchHelp.ForLocal(sim,-1,true,true));
        });
        Test("A21-W15 resolving shot skips Replay guidance",()=>{
            var sim=Sim();
            sim.Spawn(0,"normal",180,750);
            sim.State.phase=MatchPhase.Moving;
            Eq("Shot resolving. Wait for the balls to settle.",
                SecondaryMatchHelp.ForLocal(sim,0,true,true));
        });
        Test("A21-W15 game-over result outranks disconnection",()=>{
            var sim=Sim();
            sim.State.phase=MatchPhase.Over;
            sim.State.resultReason="PLAYER 2 WINS";
            Eq("PLAYER 2 WINS",SecondaryMatchHelp.ForLocal(sim,0,true,false));
        });
        Test("A21-W15 P2 opening bonus suppresses Replay",()=>{
            var sim=Sim();
            sim.State.turn=1;sim.State.bonusPending=true;
            sim.Spawn(1,"normal",180,150);
            Eq("Player 2 has one extra opening spawn.",
                SecondaryMatchHelp.ForLocal(sim,1,true,true));
        });
        Test("A21-W15 malformed replay list degrades to neutral without throwing",()=>{
            var sim=Sim();
            sim.Spawn(0,"normal",180,750);
            sim.State.replayedIds=null;
            Eq("Choose a ball, then drag from your launcher to shoot.",
                SecondaryMatchHelp.ForLocal(sim,0,true,true));
        });
        Test("A21-W15 null simulation degrades to waiting",()=>{
            Eq("Waiting for match.",SecondaryMatchHelp.ForLocal(null,0,true,true));
        });
        Test("A21-W15 one coaching calculation never mutates game state",()=>{
            var sim=Sim();
            var ball=sim.Spawn(0,"normal",180,750);
            int rev=sim.State.revision,turn=sim.State.turn,serial=sim.State.actionSerial,
                events=sim.State.events.Count,replays=sim.State.replayedIds.Count,hp=ball.hp;
            for(int i=0;i<50;i++)
                Eq("Replay ready: drag a glowing home ball to launch it again.",
                    SecondaryMatchHelp.ForLocal(sim,0,true,true));
            Eq(rev,sim.State.revision);Eq(turn,sim.State.turn);
            Eq(serial,sim.State.actionSerial);Eq(events,sim.State.events.Count);
            Eq(replays,sim.State.replayedIds.Count);Eq(hp,ball.hp);
        });
    }
}
