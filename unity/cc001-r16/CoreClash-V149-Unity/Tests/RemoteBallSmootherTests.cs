using System.Collections.Generic;
using CoreClash.Core;
using CoreClash.Presentation;

public static partial class Program
{
    static GameState A34Snapshot(int action,int frame,float x,float y,MatchPhase phase=MatchPhase.Moving)
    {
        return new GameState{actionSerial=action,frame=frame,phase=phase,
            balls=new List<BallRuntime>{new BallRuntime{id=12,x=x,y=y}}};
    }
    static void RemoteBallSmootherTests()
    {
        Test("A30 W11 stale and duplicated Protocol149 revisions cannot enter visual state",()=>{
            True(RemoteSnapshotEvents.IsFreshRevision(0,1));
            True(RemoteSnapshotEvents.IsFreshRevision(1,2));
            True(RemoteSnapshotEvents.IsFreshRevision(2,4)); // an allowed network gap
            False(RemoteSnapshotEvents.IsFreshRevision(4,4));
            False(RemoteSnapshotEvents.IsFreshRevision(4,3));
            False(RemoteSnapshotEvents.IsFreshRevision(4,0));
            False(RemoteSnapshotEvents.IsFreshRevision(4,-1));
            False(RemoteSnapshotEvents.IsFreshRevision(0,0));
            True(RemoteSnapshotEvents.IsFreshRevision(0,1)); // new session reset
        });
        Test("A34 first P2 snapshot is exact",()=>{
            var p=new RemoteBallSmoother();p.Observe(A34Snapshot(1,10,100,100),1);
            True(p.TryGetPosition(12,1.1f,out var x,out var y));Near(100,x);Near(100,y);
        });
        Test("A34 200ms interpolation converges to received snapshot",()=>{
            var p=new RemoteBallSmoother();p.Observe(A34Snapshot(1,10,100,100),1);
            p.Observe(A34Snapshot(1,30,180,100),1.2f);
            True(p.TryGetPosition(12,1.3f,out var x,out _));Near(140,x,.01f);
            True(p.TryGetPosition(12,1.5f,out x,out _));Near(180,x);
        });
        Test("A34 overlap uses current visual pose not previous target",()=>{
            var p=new RemoteBallSmoother();p.Observe(A34Snapshot(1,10,100,100),1);
            p.Observe(A34Snapshot(1,30,180,100),1.2f);p.Observe(A34Snapshot(1,40,220,100),1.3f);
            True(p.TryGetPosition(12,1.3f,out var x,out _));Near(140,x,.01f);
        });
        Test("A34 legitimate large position jump never interpolates",()=>{
            var p=new RemoteBallSmoother();p.Observe(A34Snapshot(1,10,100,100),1);
            p.Observe(A34Snapshot(1,30,460,100),1.2f);
            True(p.TryGetPosition(12,1.2f,out var x,out _));Near(460,x);
        });
        Test("A34 new action or packet gap snaps instantly",()=>{
            var p=new RemoteBallSmoother();p.Observe(A34Snapshot(1,10,100,100),1);
            p.Observe(A34Snapshot(2,30,160,100),1.2f);
            True(p.TryGetPosition(12,1.2f,out var x,out _));Near(160,x);
            p.Observe(A34Snapshot(2,40,190,100),2f);
            True(p.TryGetPosition(12,2f,out x,out _));Near(190,x);
        });
        Test("A34 render smoother cannot mutate authoritative ball",()=>{
            var p=new RemoteBallSmoother();var original=A34Snapshot(1,10,100,100);
            p.Observe(original,1);p.Observe(A34Snapshot(1,30,180,100),1.2f);
            True(p.TryGetPosition(12,1.3f,out _,out _));Near(100,original.balls[0].x);
        });
        Test("A34 phase switch, despawn and disconnect clear stale cache",()=>{
            var p=new RemoteBallSmoother();p.Observe(A34Snapshot(1,10,100,100),1);
            var gone=A34Snapshot(1,30,180,100);gone.balls[0].dead=true;p.Observe(gone,1.2f);
            False(p.TryGetPosition(12,1.2f,out _,out _));Eq(0,p.TrackedCount);
            p.Observe(A34Snapshot(1,40,180,100),1.3f);
            p.Observe(A34Snapshot(1,50,180,100,MatchPhase.Aiming),1.4f);
            False(p.TryGetPosition(12,1.4f,out _,out _));p.Reset();Eq(0,p.TrackedCount);
        });
        Test("A34 owner conversion snaps even on a short move",()=>{
            var p=new RemoteBallSmoother();
            p.Observe(A34Snapshot(1,10,100,100),1);
            var next=A34Snapshot(1,20,115,100);
            next.balls[0].owner=1;
            p.Observe(next,1.05f);
            True(p.TryGetPosition(12,1.05f,out var x,out _));Near(115,x);
        });
        Test("A34 type conversion snaps and changes identity without interpolation",()=>{
            var p=new RemoteBallSmoother();
            var first=A34Snapshot(1,10,100,100);first.balls[0].type="normal";
            p.Observe(first,1);
            var converted=A34Snapshot(1,20,130,100);converted.balls[0].type="phoenix";
            p.Observe(converted,1.05f);
            True(p.TryGetPosition(12,1.05f,out var x,out _));Near(130,x);
        });
        Test("A34 20Hz cadence converges without frame extrapolation",()=>{
            var p=new RemoteBallSmoother();
            p.Observe(A34Snapshot(1,10,100,100),1);
            p.Observe(A34Snapshot(1,16,110,100),1.05f);
            True(p.TryGetPosition(12,1.075f,out var x,out _));Near(105,x,.02f);
            True(p.TryGetPosition(12,1.105f,out x,out _));Near(110,x);
            True(p.TryGetPosition(12,999,out x,out _));Near(110,x);
        });
        Test("A34 malformed remote ball entries never corrupt the visual cache",()=>{
            var p=new RemoteBallSmoother();
            var state=A34Snapshot(1,10,100,100);
            state.balls.Insert(0,null);
            state.balls.Add(new BallRuntime{id=0,x=500,y=500});
            p.Observe(state,1);
            Eq(1,p.TrackedCount);
            state.balls=null;
            p.Observe(state,1.1f);
            Eq(0,p.TrackedCount);
        });
        Test("A34 duplicate transport ball IDs cannot override first visual track",()=>{
            var p=new RemoteBallSmoother();
            var state=A34Snapshot(1,10,100,100);
            state.balls.Add(new BallRuntime{id=12,x=440,y=440});
            p.Observe(state,1);
            Eq(1,p.TrackedCount);
            True(p.TryGetPosition(12,1.1f,out var x,out var y));
            Near(100,x);Near(100,y);
        });
        Test("A34 stale frame and clock rewind cannot interpolate",()=>{
            var p=new RemoteBallSmoother();p.Observe(A34Snapshot(1,100,100,100),1);
            p.Observe(A34Snapshot(1,99,200,100),1.2f);
            True(p.TryGetPosition(12,1.2f,out var x,out _));Near(200,x);
            p.Observe(A34Snapshot(1,101,300,100),1.1f);
            True(p.TryGetPosition(12,100,out x,out _));Near(300,x);
        });        Test("A34 W10 fresh short PORTAL event snaps once and old event expires",()=>{
            var p=new RemoteBallSmoother();
            p.Observe(A34Snapshot(1,10,100,100),1);
            var next=A34Snapshot(1,16,130,100);
            next.events.Add(new GameEvent{id=7,ballId=12,kind="PORTAL"});
            var instant=RemoteSnapshotEvents.InstantBallIds(next,0,out int latest);
            Eq(7,latest);True(instant.Contains(12));
            p.Observe(next,1.05f,instant);
            True(p.TryGetPosition(12,1.05f,out var x,out _));Near(130,x);
            var old=RemoteSnapshotEvents.InstantBallIds(next,latest,out int same);
            Eq(7,same);False(old.Contains(12));
        });

    }
}
