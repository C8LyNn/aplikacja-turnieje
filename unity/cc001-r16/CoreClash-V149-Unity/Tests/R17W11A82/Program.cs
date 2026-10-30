using System;
using System.Collections.Generic;
using CoreClash.Core;
using CoreClash.Presentation;

// R17-W11 A82 RED/green regression. The app's authoritative simulation is NOT edited.
// Only the actual author-owned RemoteSnapshotEvents and RemoteBallSmoother classes are linked.
public static class Program
{
    static int passed,failed;
    static void Main()
    {
        Run("PORTAL explicitly snaps the entering ball", Portal);
        Run("TELEPORT emits a one-ball displacement cue", Teleport);
        Run("SWAP snaps BOTH participating balls, not just initiator", SwapBoth);
        Run("stale already-consumed displacement events do not replay", Stale);
        Run("non-displacement game events must never force visual snap", Nondisplacement);
        Run("monotonic revision admission refuses duplicate/older transport", Revisions);
        Run("sub-220-unit explicit teleport must not interpolate through fake path", SmallTeleportPose);
        Run("normal same-action movement without event remains visually interpolated", NormalMovement);
        Run("owner/type identity replacement cannot interpolate old pose", IdentityReplacement);
        Run("two-ball SWAP must snap both rendered poses in same revision", SwapVisualBoth);
        Console.WriteLine("CC001-W11-A82 "+passed+" PASS / "+failed+" FAIL");
        Environment.ExitCode=failed==0?0:1;
    }
    static void Run(string name,Action action)
    {
        try {action(); passed++;Console.WriteLine("PASS "+name);}
        catch(Exception ex){failed++;Console.WriteLine("FAIL "+name+" :: "+ex.Message);}
    }
    static void Expect(bool value,string msg){if(!value)throw new InvalidOperationException(msg);}
    static void Eq<T>(T want,T got,string msg)
    {
        if(!EqualityComparer<T>.Default.Equals(want,got))
            throw new InvalidOperationException(msg+": expected "+want+", got "+got);
    }
    static GameEvent Ev(int id,string kind,int actor,int other=0)
        =>new GameEvent{id=id,kind=kind,ballId=actor,otherId=other};
    static GameState State(int action,int frame,float x,float otherX=170f)
        =>new GameState{
            phase=MatchPhase.Moving,actionSerial=action,frame=frame,
            balls=new List<BallRuntime>{
                new BallRuntime{id=7,owner=0,type="timeshift",x=x,y=400f},
                new BallRuntime{id=8,owner=1,type="normal",x=otherX,y=400f}
            },
            events=new List<GameEvent>()
        };
    static void Portal()
    {
        var state=State(1,10,120);
        state.events.Add(Ev(12,"PORTAL",7));
        var ids=RemoteSnapshotEvents.InstantBallIds(state,11,out int latest);
        Expect(ids.Contains(7),"PORTAL does not mark ball 7");
        Expect(!ids.Contains(8),"PORTAL incorrectly marks other ball");
        Eq(12,latest,"event cursor");
    }
    static void Teleport()
    {
        // AbilityResolver.OnWall emits TELEPORT after the wall Warp relocation.
        var state=State(1,10,140);
        state.events.Add(Ev(12,"TELEPORT",7));
        var ids=RemoteSnapshotEvents.InstantBallIds(state,11,out int latest);
        Expect(ids.Contains(7),"TELEPORT must snap relocated ball");
        Expect(!ids.Contains(8),"TELEPORT must not snap bystanders");
        Eq(12,latest,"event cursor");
    }
    static void SwapBoth()
    {
        // RealityEffects.RealityStop emits SWAP on b, otherId=enemy.id,
        // after moving both positions. Neither one should animate a fake transit.
        var state=State(1,11,170,100);
        state.events.Add(Ev(12,"SWAP",7,8));
        var ids=RemoteSnapshotEvents.InstantBallIds(state,11,out int latest);
        Expect(ids.Contains(7),"SWAP source must snap");
        Expect(ids.Contains(8),"SWAP enemy (otherId) must also snap");
        Eq(12,latest,"event cursor");
    }
    static void Stale()
    {
        var state=State(1,12,150);
        state.events.Add(Ev(10,"PORTAL",7));
        state.events.Add(Ev(12,"SWAP",7,8));
        var ids=RemoteSnapshotEvents.InstantBallIds(state,12,out int latest);
        Eq(0,ids.Count,"already-consumed historical events re-applied");
        Eq(12,latest,"old cursor should not regress");
    }
    static void Nondisplacement()
    {
        var state=State(1,13,150);
        state.events.Add(Ev(14,"FIRE",7));
        state.events.Add(Ev(15,"PULL",8));
        state.events.Add(Ev(16,"OWNERSHIP",7,8));
        var ids=RemoteSnapshotEvents.InstantBallIds(state,13,out int latest);
        Eq(0,ids.Count,"unrelated effects incorrectly forced displacement snap");
        Eq(16,latest,"non-displacement events still advance cursor");
    }
    static void Revisions()
    {
        // #207: revision admission lives in RemoteBallSmoother.Observe,
        // not in the older A30-only IsFreshRevision() helper.
        var render=new RemoteBallSmoother();
        render.Observe(State(1,10,100),1f,null,10);
        var newer=State(1,11,155);
        render.Observe(newer,1.1f,new HashSet<int>{7},11);
        Expect(render.TryGetPosition(7,1.1f,out float at11,out _),"missing revision 11 pose");
        Eq(155f,at11,"fresh revision must apply");
        render.Observe(State(1,12,110),1.2f,new HashSet<int>{7},10);
        Expect(render.TryGetPosition(7,1.2f,out float stale,out _),"missing pose after stale revision");
        Eq(155f,stale,"stale revision must not replace admitted authoritative display");
        render.Observe(State(1,13,120),1.3f,new HashSet<int>{7},11);
        Expect(render.TryGetPosition(7,1.3f,out float duplicate,out _),"missing pose after duplicate revision");
        Eq(155f,duplicate,"duplicate revision must not replace admitted display");
    }
    static void SmallTeleportPose()
    {
        var render=new RemoteBallSmoother();
        var first=State(1,10,100);
        render.Observe(first,1.0f);
        var moved=State(1,11,155); // only 55 world units; < MaxDistance 220.
        moved.events.Add(Ev(13,"TELEPORT",7));
        var instant=RemoteSnapshotEvents.InstantBallIds(moved,12,out _);
        render.Observe(moved,1.1f,instant);
        Expect(render.TryGetPosition(7,1.1f,out float x,out _),"missing rendered ball");
        Eq(155f,x,"explicit small teleport must snap immediately");
    }
    static void NormalMovement()
    {
        var render=new RemoteBallSmoother();
        render.Observe(State(1,10,100),1f);
        render.Observe(State(1,11,140),1.1f);
        Expect(render.TryGetPosition(7,1.1f,out float x,out _),"missing rendered pose");
        Expect(x<140f&&x>=100f,"ordinary same-action pose jumped instead of smoothing");
    }
    static void SwapVisualBoth()
    {
        var render=new RemoteBallSmoother();
        var before=State(1,10,100,170);
        render.Observe(before,1f,null,10);
        var swapped=State(1,11,170,100);
        swapped.events.Add(Ev(15,"SWAP",7,8));
        var instant=RemoteSnapshotEvents.InstantBallIds(swapped,14,out int latest);
        Eq(15,latest,"swap event cursor");
        render.Observe(swapped,1.1f,instant,11);
        Expect(render.TryGetPosition(7,1.1f,out float a,out _),"missing actor pose");
        Expect(render.TryGetPosition(8,1.1f,out float b,out _),"missing target pose");
        Eq(170f,a,"SWAP initiator must not render fake transit");
        Eq(100f,b,"SWAP target must not render fake transit");
    }

    static void IdentityReplacement()
    {
        var render=new RemoteBallSmoother();
        render.Observe(State(1,10,100),1f);
        var replacement=State(1,11,145);
        replacement.balls[0].owner=1;
        render.Observe(replacement,1.1f);
        Expect(render.TryGetPosition(7,1.1f,out float x,out _),"missing replacement pose");
        Eq(145f,x,"owner change retained previous entity's interpolated pose");
    }
}
