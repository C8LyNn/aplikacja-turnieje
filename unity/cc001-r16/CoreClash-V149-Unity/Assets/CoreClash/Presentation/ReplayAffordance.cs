using System.Collections.Generic;
using CoreClash.Core;
namespace CoreClash.Presentation
{
    // CC-001 W18-02 (#287): which balls the board advertises as Replay-able.
    // Read-only and fail-closed: a ball is advertised ONLY when the canonical
    // GameSimulation.CanReplay(ball) says so during Aiming. No new limit, no new
    // rule, no state change. Reasons for a blocked Replay stay with A21
    // (SecondaryMatchHelp, #256/#277) so the explanation is not duplicated here.
    public static class ReplayAffordance
    {
        public static bool Advertise(GameSimulation sim,BallRuntime ball)
        {
            var s=sim?.State;
            if(s==null||ball==null||s.phase!=MatchPhase.Aiming||s.balls==null||s.replayedIds==null)return false;
            return sim.CanReplay(ball);
        }

        // Ids in board order (State.balls), for the board count and tests.
        public static List<int> Eligible(GameSimulation sim)
        {
            var ids=new List<int>();
            var s=sim?.State;if(s?.balls==null)return ids;
            foreach(var b in s.balls)if(b!=null&&Advertise(sim,b))ids.Add(b.id);
            return ids;
        }

        // Board chip for the acting player; empty when nothing can be replayed.
        public static string CounterLabel(int owner,int count)=>count<=0?"":"P"+(owner+1)+" · REPLAY ×"+count+" · DRAG A GLOWING BALL";
        public const string BallChip="R";
    }
}
