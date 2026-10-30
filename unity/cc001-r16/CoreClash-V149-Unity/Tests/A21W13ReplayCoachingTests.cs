using System.Collections.Generic;
using CoreClash.Core;
using CoreClash.Presentation;

public static partial class Program
{
    static void A21W13ReplayCoachingTests()
    {
        Test("A21-W13 initial empty board never promises replay",()=>{
            var sim=Sim();
            False(SecondaryMatchHelp.ReplayReady(sim));
            Eq("Choose a ball, then drag from your launcher to shoot.",
                SecondaryMatchHelp.Text(sim.State,0,true,true,SecondaryMatchHelp.ReplayReady(sim)));
        });
        Test("A21-W13 eligible P1 home ball gets precise Replay cue",()=>{
            var sim=Sim();
            var ball=sim.Spawn(0,"normal",180,750);
            True(sim.CanReplay(ball));
            True(SecondaryMatchHelp.ReplayReady(sim));
            Eq("Replay ready: drag a glowing home ball to launch it again.",
                SecondaryMatchHelp.Text(sim.State,0,true,true,SecondaryMatchHelp.ReplayReady(sim)));
        });
        Test("A21-W13 remote player never sees a launch instruction",()=>{
            var sim=Sim();
            var ball=sim.Spawn(0,"normal",180,750);
            True(sim.CanReplay(ball));
            Eq("Opponent is aiming. Wait for your turn.",
                SecondaryMatchHelp.Text(sim.State,1,true,true,SecondaryMatchHelp.ReplayReady(sim)));
            Eq("Connection lost. Waiting to reconnect.",
                SecondaryMatchHelp.Text(sim.State,0,true,false,SecondaryMatchHelp.ReplayReady(sim)));
        });
        Test("A21-W13 opponent-owned ball near P1 base does not permit replay",()=>{
            var sim=Sim();
            sim.Spawn(1,"normal",180,750);
            False(SecondaryMatchHelp.ReplayReady(sim));
        });
        Test("A21-W13 ball outside own base does not permit replay",()=>{
            var sim=Sim();
            sim.Spawn(0,"normal",180,450);
            False(SecondaryMatchHelp.ReplayReady(sim));
        });
        Test("A21-W13 replay already used cannot be taught as available",()=>{
            var sim=Sim();
            var ball=sim.Spawn(0,"normal",180,750);
            True(SecondaryMatchHelp.ReplayReady(sim));
            sim.State.replayedIds.Add(ball.id);
            False(SecondaryMatchHelp.ReplayReady(sim));
        });
        Test("A21-W13 rooted and frozen home balls never appear Replay-ready",()=>{
            var sim=Sim();
            var ball=sim.Spawn(0,"normal",180,750);
            ball.rooted=true;
            False(SecondaryMatchHelp.ReplayReady(sim));
            ball.rooted=false;
            ball.frozen=1;
            False(SecondaryMatchHelp.ReplayReady(sim));
        });
        Test("A21-W13 banned and dead home balls are not Replay-ready",()=>{
            var sim=Sim();
            var ball=sim.Spawn(0,"normal",180,750);
            ball.banished=true;
            False(SecondaryMatchHelp.ReplayReady(sim));
            ball.banished=false;
            ball.dead=true;
            False(SecondaryMatchHelp.ReplayReady(sim));
        });
        Test("A21-W13 Titan cannot Replay even inside home zone",()=>{
            var sim=Sim();
            var ball=sim.Spawn(0,"normal",180,750);
            ball.type="titan";
            False(SecondaryMatchHelp.ReplayReady(sim));
        });
        Test("A21-W13 P2 opening bonus forbids Replay and teaches bonus spawn",()=>{
            var sim=Sim();
            sim.State.turn=1;
            sim.State.bonusPending=true;
            sim.Spawn(1,"normal",180,150);
            False(SecondaryMatchHelp.ReplayReady(sim));
            Eq("Player 2 has one extra opening spawn.",
                SecondaryMatchHelp.Text(sim.State,1,true,true,false));
        });
        Test("A21-W13 Moving and Over cannot show Replay-ready",()=>{
            var sim=Sim();
            sim.Spawn(0,"normal",180,750);
            sim.State.phase=MatchPhase.Moving;
            False(SecondaryMatchHelp.ReplayReady(sim));
            sim.State.phase=MatchPhase.Over;
            False(SecondaryMatchHelp.ReplayReady(sim));
        });
        Test("A21-W13 null and malformed snapshots return false without throwing",()=>{
            False(SecondaryMatchHelp.ReplayReady(null));
            var sim=Sim();
            sim.State.balls=null;
            False(SecondaryMatchHelp.ReplayReady(sim));
            sim.State.balls=new List<BallRuntime>{null};
            False(SecondaryMatchHelp.ReplayReady(sim));
            sim.State.turn=-1;
            False(SecondaryMatchHelp.ReplayReady(sim));
        });
        Test("A21-W13 replay eligibility check is read-only",()=>{
            var sim=Sim();
            var ball=sim.Spawn(0,"normal",180,750);
            var state=sim.State;
            int revision=state.revision,action=state.actionSerial,
                count=state.events.Count,ballCount=state.balls.Count;
            int hp=ball.hp;
            for(int i=0;i<10;i++)True(SecondaryMatchHelp.ReplayReady(sim));
            Eq(revision,state.revision);
            Eq(action,state.actionSerial);
            Eq(count,state.events.Count);
            Eq(ballCount,state.balls.Count);
            Eq(hp,ball.hp);
        });
    }
}
