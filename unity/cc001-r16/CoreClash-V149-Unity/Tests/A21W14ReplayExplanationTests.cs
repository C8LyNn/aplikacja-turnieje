using System.Collections.Generic;
using CoreClash.Core;
using CoreClash.Presentation;

public static partial class Program
{
    static void A21W14ReplayExplanationTests()
    {
        Test("A21-W14 empty board has neutral launch instruction",()=>{
            var s=Sim();
            False(SecondaryMatchHelp.ReplayReady(s));
            Eq(null,SecondaryMatchHelp.ReplayBlockedReason(s));
            Eq("Choose a ball, then drag from your launcher to shoot.",
                SecondaryMatchHelp.Text(s.State,0,true,true,false,SecondaryMatchHelp.ReplayBlockedReason(s)));
        });
        Test("A21-W14 incomplete replay budget must fail closed without exception",()=>{
            var s=Sim();
            s.Spawn(0,"normal",180,750);
            s.State.replayedIds=null;
            False(SecondaryMatchHelp.ReplayReady(s));
            Eq(null,SecondaryMatchHelp.ReplayBlockedReason(s));
            Eq("Choose a ball, then drag from your launcher to shoot.",
                SecondaryMatchHelp.Text(s.State,0,true,true,false,SecondaryMatchHelp.ReplayBlockedReason(s)));
        });
        Test("A21-W14 missing ball list must fail closed without exception",()=>{
            var s=Sim();s.State.balls=null;
            False(SecondaryMatchHelp.ReplayReady(s));
            Eq(null,SecondaryMatchHelp.ReplayBlockedReason(s));
        });
        Test("A21-W14 null ball entry is ignored before checking real legal ball",()=>{
            var s=Sim();
            s.State.balls.Add(null);
            s.Spawn(0,"normal",180,750);
            True(SecondaryMatchHelp.ReplayReady(s));
            Eq(null,SecondaryMatchHelp.ReplayBlockedReason(s));
        });
        Test("A21-W14 played home ball explains spent replay",()=>{
            var s=Sim();var b=s.Spawn(0,"normal",180,750);
            s.State.replayedIds.Add(b.id);
            False(SecondaryMatchHelp.ReplayReady(s));
            Eq("Replay used: a home ball already replayed this turn.",SecondaryMatchHelp.ReplayBlockedReason(s));
        });
        Test("A21-W14 rooted home ball explains root restriction",()=>{
            var s=Sim();var b=s.Spawn(0,"normal",180,750);b.rooted=true;
            False(SecondaryMatchHelp.ReplayReady(s));
            Eq("Replay blocked: a home ball is rooted.",SecondaryMatchHelp.ReplayBlockedReason(s));
        });
        Test("A21-W14 frozen home ball explains freeze restriction",()=>{
            var s=Sim();var b=s.Spawn(0,"normal",180,750);b.frozen=2;
            False(SecondaryMatchHelp.ReplayReady(s));
            Eq("Replay blocked: a home ball is frozen.",SecondaryMatchHelp.ReplayBlockedReason(s));
        });
        Test("A21-W14 Titan near home zone explains Titan restriction",()=>{
            var s=Sim();var b=s.Spawn(0,"normal",180,750);b.type="titan";
            False(SecondaryMatchHelp.ReplayReady(s));
            Eq("Replay blocked: Titan cannot Replay.",SecondaryMatchHelp.ReplayBlockedReason(s));
        });
        Test("A21-W14 actual valid home ball suppresses all blocked explanations",()=>{
            var s=Sim();var b=s.Spawn(0,"normal",180,750);
            b.rooted=true;
            s.Spawn(0,"normal",270,750);
            True(SecondaryMatchHelp.ReplayReady(s));
            Eq(null,SecondaryMatchHelp.ReplayBlockedReason(s));
        });
        Test("A21-W14 opponent ball and out-of-zone ball cannot show false blocker",()=>{
            var s=Sim();
            s.Spawn(1,"normal",180,750).rooted=true;
            s.Spawn(0,"normal",180,450).rooted=true;
            Eq(null,SecondaryMatchHelp.ReplayBlockedReason(s));
        });
        Test("A21-W14 P2 own base and currently used Replay explain correctly",()=>{
            var s=Sim();s.State.turn=1;
            var b=s.Spawn(1,"normal",180,150);b.rooted=true;
            Eq("Replay blocked: a home ball is rooted.",SecondaryMatchHelp.ReplayBlockedReason(s));
            b.rooted=false;
            True(SecondaryMatchHelp.ReplayReady(s));
            Eq(null,SecondaryMatchHelp.ReplayBlockedReason(s));
        });
        Test("A21-W14 no Replay blocker is shown during Moving or bonus",()=>{
            var s=Sim();s.Spawn(0,"normal",180,750).rooted=true;
            s.State.phase=MatchPhase.Moving;
            Eq(null,SecondaryMatchHelp.ReplayBlockedReason(s));
            s.State.phase=MatchPhase.Aiming;s.State.bonusPending=true;
            Eq(null,SecondaryMatchHelp.ReplayBlockedReason(s));
        });
        Test("A21-W14 local status overrides blocker on opposite turn/disconnect",()=>{
            var s=Sim();var reason="Replay blocked: a home ball is rooted.";
            s.State.turn=0;
            Eq("Opponent is aiming. Wait for your turn.",
                SecondaryMatchHelp.Text(s.State,1,true,true,false,reason));
            Eq("Connection lost. Waiting to reconnect.",
                SecondaryMatchHelp.Text(s.State,0,true,false,false,reason));
            Eq(reason,SecondaryMatchHelp.Text(s.State,0,true,true,false,reason));
            Eq("Replay ready: drag a glowing home ball to launch it again.",
                SecondaryMatchHelp.Text(s.State,0,true,true,true,reason));
        });
        Test("A21-W14 explanation does not mutate gameplay snapshot",()=>{
            var s=Sim();var b=s.Spawn(0,"normal",180,750);b.rooted=true;
            int turn=s.State.turn,revision=s.State.revision,action=s.State.actionSerial,
                id=s.State.nextId,events=s.State.events.Count,bCount=s.State.balls.Count;
            for(int i=0;i<10;i++)SecondaryMatchHelp.ReplayBlockedReason(s);
            Eq(turn,s.State.turn);Eq(revision,s.State.revision);Eq(action,s.State.actionSerial);
            Eq(id,s.State.nextId);Eq(events,s.State.events.Count);Eq(bCount,s.State.balls.Count);
            True(b.rooted);
        });
        Test("A21-W14 null simulation is safe",()=>{
            False(SecondaryMatchHelp.ReplayReady(null));
            Eq(null,SecondaryMatchHelp.ReplayBlockedReason(null));
        });
    }
}
