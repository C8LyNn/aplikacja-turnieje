using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using CoreClash.Core;
using CoreClash.Presentation;

// CC-001 W18-02 (#287): Replay is advertised exactly when the canonical
// GameSimulation.CanReplay allows it; advertising never changes the match.
public static partial class Program
{
    static void W18ReplayAffordanceTests()
    {
        Test("W18-02 a ball is advertised for Replay only when CanReplay allows it (legal and every illegal case)",()=>{
            var cases=new (string name,Action<GameSimulation,BallRuntime> setup,bool expected)[]{
                ("own ball touching home zone",(s,b)=>{},true),
                ("dead",(s,b)=>b.dead=true,false),
                ("banished",(s,b)=>b.banished=true,false),
                ("already replayed this turn",(s,b)=>s.State.replayedIds.Add(b.id),false),
                ("outside home zone",(s,b)=>b.y=450,false),
                ("rooted",(s,b)=>b.rooted=true,false),
                ("frozen",(s,b)=>b.frozen=1,false),
                ("bonus spawn pending",(s,b)=>s.State.bonusPending=true,false),
                ("opponent's turn",(s,b)=>s.State.turn=1,false),
                ("ball still moving (Moving phase)",(s,b)=>s.State.phase=MatchPhase.Moving,false),
                ("match over",(s,b)=>s.State.phase=MatchPhase.Over,false),
                ("malformed snapshot without replayedIds",(s,b)=>s.State.replayedIds=null,false)};
            foreach(var c in cases)
            {
                var s=W18Sim();var b=s.Spawn(0,"normal",180,760);c.setup(s,b);
                Eq(c.expected,ReplayAffordance.Advertise(s,b));
                if(s.State.replayedIds!=null&&s.State.phase==MatchPhase.Aiming)Eq(s.CanReplay(b),ReplayAffordance.Advertise(s,b));
            }
            var t=W18Sim();var titan=t.Spawn(0,"titan",180,760);False(t.CanReplay(titan));False(ReplayAffordance.Advertise(t,titan));
            var p2=W18Sim();p2.State.turn=1;var home=p2.Spawn(1,"normal",360,140);True(ReplayAffordance.Advertise(p2,home));var mine=p2.Spawn(0,"normal",180,760);False(ReplayAffordance.Advertise(p2,mine));
            False(ReplayAffordance.Advertise(null,home));False(ReplayAffordance.Advertise(p2,null));
        });
        Test("W18-02 board counter equals the number of CanReplay balls and disappears at zero",()=>{
            var s=W18Sim();
            Eq(0,ReplayAffordance.Eligible(s).Count);Eq("",ReplayAffordance.CounterLabel(0,0));
            var a=s.Spawn(0,"normal",120,760);var b=s.Spawn(0,"normal",400,770);s.Spawn(0,"normal",270,450);s.Spawn(1,"normal",200,140);var d=s.Spawn(0,"normal",300,800);d.dead=true;
            True(ReplayAffordance.Eligible(s).SequenceEqual(new[]{a.id,b.id}));
            Eq(s.State.balls.Count(x=>s.CanReplay(x)),ReplayAffordance.Eligible(s).Count);
            Eq("P1 · REPLAY ×2 · DRAG A GLOWING BALL",ReplayAffordance.CounterLabel(0,2));
            True(ReplayAffordance.CounterLabel(1,1).StartsWith("P2 · REPLAY ×1"));
            Eq(0,ReplayAffordance.Eligible(null).Count);
        });
        Test("W18-02 Replay keeps once-per-ball-per-turn, adds no global limit, spawns nothing and keeps the turn",()=>{
            var s=W18Sim();var a=s.Spawn(0,"normal",120,760);var b=s.Spawn(0,"normal",400,770);
            int balls=s.State.balls.Count,turn=s.State.turn,turnNumber=s.State.turnNumber;var stock=s.State.players[0].stock.Select(x=>x.remaining).ToArray();
            True(s.TryCommand(new PlayerCommand{owner=0,turnNumber=turnNumber,kind=CommandKind.Replay,ballId=a.id,dx=0,dy=-60,power=200},out string why),why);
            for(int i=0;i<4000&&s.State.phase==MatchPhase.Moving;i++)s.Step(1f/120);
            Eq(MatchPhase.Aiming,s.State.phase);Eq(balls,s.State.balls.Count);Eq(turn,s.State.turn);Eq(turnNumber,s.State.turnNumber);
            True(stock.SequenceEqual(s.State.players[0].stock.Select(x=>x.remaining)),"stock changed");
            False(ReplayAffordance.Advertise(s,a));
            Eq(s.CanReplay(b),ReplayAffordance.Advertise(s,b));True(ReplayAffordance.Advertise(s,b),"second ball blocked by an invented global limit");
        });
        Test("W18-02 advertising is read-only",()=>{
            var s=W18Sim();s.Spawn(0,"normal",120,760);s.Spawn(0,"titan",400,770);s.Spawn(1,"normal",200,140);
            var json=new JsonSerializerOptions{IncludeFields=true};string before=JsonSerializer.Serialize(s.State,json);
            foreach(var b in s.State.balls)ReplayAffordance.Advertise(s,b);ReplayAffordance.Eligible(s);
            Eq(before,JsonSerializer.Serialize(s.State,json));
        });
        Test("W18-02 board uses the gold Replay affordance and counter, not the team colour",()=>{
            string board=File.ReadAllText(Path.Combine(projectRoot,"Assets/CoreClash/Presentation/BoardView.cs"));
            string ball=File.ReadAllText(Path.Combine(projectRoot,"Assets/CoreClash/Presentation/BallView.cs"));
            True(board.Contains("ReplayAffordance.Advertise(simulation,ball)")&&board.Contains("RenderReplayCounter("),"BoardView does not use the Replay affordance");
            True(ball.Contains("Alpha(ReplayColor, .85f)")&&!ball.Contains("Ring(point, radius + pulse, Alpha(team"),"Replay pulse still uses the team colour");
            True(ball.Contains("ReplayAffordance.BallChip"),"no Replay chip on the ball");
        });
    }
}
