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
        Test("A30 W11 application rejects duplicate, zero and reversed revisions",()=>{
            True(RemoteSnapshotEvents.IsFreshRevision(0,1));
            True(RemoteSnapshotEvents.IsFreshRevision(1,2));
            True(RemoteSnapshotEvents.IsFreshRevision(2,4)); // gaps allowed
            False(RemoteSnapshotEvents.IsFreshRevision(4,4));
            False(RemoteSnapshotEvents.IsFreshRevision(4,3));
            False(RemoteSnapshotEvents.IsFreshRevision(4,0));
            False(RemoteSnapshotEvents.IsFreshRevision(4,-1));
            True(RemoteSnapshotEvents.IsFreshRevision(0,1)); // fresh session
        });
        Test("A34 W11 4Hz dense snapshot still moves before the next packet",()=>{
            var p=new RemoteBallSmoother();
            p.Observe(A34Snapshot(1,10,100,100),1f);
            p.Observe(A34Snapshot(1,40,200,100),1.25f);
            True(p.TryGetPosition(12,1.45f,out var x,out _));
            Near(189.6f,x,.15f);
            True(x<200,"dense 4Hz smoothing plateaued 50ms early");
            True(p.TryGetPosition(12,1.50f,out x,out _));Near(200,x,.01f);
        });
        Test("A34 W11 8Hz moving cadence preserves midpoint and canonical endpoint",()=>{
            var p=new RemoteBallSmoother();
            p.Observe(A34Snapshot(1,10,100,100),1f);
            p.Observe(A34Snapshot(1,25,200,100),1.125f);
            True(p.TryGetPosition(12,1.1875f,out var x,out _));Near(150,x,.1f);
            True(p.TryGetPosition(12,1.25f,out x,out _));Near(200,x,.01f);
        });
        Test("A34 W13 read-only blend duration is zero on new action snap",()=>{
            var p=new RemoteBallSmoother();
            p.Observe(A34Snapshot(1,10,100,100),1f,null,10);
            Near(0f,p.LastBlendSeconds,.001f);
            p.Observe(A34Snapshot(1,20,140,100),1.1f,null,11);
            Near(.1f,p.LastBlendSeconds,.001f);
            p.Observe(A34Snapshot(2,30,180,100),1.2f,null,12);
            Near(0f,p.LastBlendSeconds,.001f);
            True(p.TryGetPosition(12,1.2f,out var x,out _));Near(180f,x,.01f);
        });
        Test("A34 W13 gap/frame rollback reports zero blended time",()=>{
            var p=new RemoteBallSmoother();
            p.Observe(A34Snapshot(1,10,100,100),1f,null,1);
            p.Observe(A34Snapshot(1,20,150,100),1.1f,null,2);
            Near(.1f,p.LastBlendSeconds,.001f);
            p.Observe(A34Snapshot(1,30,180,100),2f,null,3);
            Near(0f,p.LastBlendSeconds,.001f);
            p.Observe(A34Snapshot(1,29,200,100),2.1f,null,4);
            Near(0f,p.LastBlendSeconds,.001f);
        });
        Test("A34 W13 stale revision does not poison read-only blend duration",()=>{
            var p=new RemoteBallSmoother();
            p.Observe(A34Snapshot(1,10,100,100),1f,null,9);
            p.Observe(A34Snapshot(1,20,180,100),1.1f,null,10);
            Near(.1f,p.LastBlendSeconds,.001f);
            p.Observe(A34Snapshot(1,21,450,100),1.2f,null,10);
            Near(.1f,p.LastBlendSeconds,.001f);
            p.Reset();Near(0f,p.LastBlendSeconds,.001f);
        });
        Test("A34 W14 stationary snapshot has no phantom visual blend",()=>{
            var p=new RemoteBallSmoother();
            p.Observe(A34Snapshot(1,10,100,100),1f,null,10);
            p.Observe(A34Snapshot(1,20,100,100),1.1f,null,11);
            Near(0f,p.LastBlendSeconds,.001f);
            True(p.TryGetPosition(12,1.15f,out var x,out _));Near(100f,x,.001f);
        });
        Test("A34 W14 fresh short TELEPORT snap has zero reported visual blend",()=>{
            var p=new RemoteBallSmoother();
            p.Observe(A34Snapshot(1,10,100,100),1f,null,10);
            p.Observe(A34Snapshot(1,20,140,100),1.1f,new HashSet<int>{12},11);
            Near(0f,p.LastBlendSeconds,.001f);
            True(p.TryGetPosition(12,1.1f,out var x,out _));Near(140f,x,.001f);
        });
        Test("A34 W14 SWAP of two balls does not report phantom interpolation",()=>{
            var p=new RemoteBallSmoother();
            var prior=A34Snapshot(1,10,100,100);
            prior.balls.Add(new BallRuntime{id=13,x=180,y=100,type="normal"});
            p.Observe(prior,1f,null,10);
            var swapped=A34Snapshot(1,20,180,100);
            swapped.balls.Add(new BallRuntime{id=13,x=100,y=100,type="normal"});
            p.Observe(swapped,1.1f,new HashSet<int>{12,13},11);
            Near(0f,p.LastBlendSeconds,.001f);
            True(p.TryGetPosition(12,1.1f,out var x,out _));Near(180f,x,.001f);
            True(p.TryGetPosition(13,1.1f,out x,out _));Near(100f,x,.001f);
        });
        Test("A34 W14 mixed teleport and normal motion report the actual blend",()=>{
            var p=new RemoteBallSmoother();
            var prior=A34Snapshot(1,10,100,100);
            prior.balls.Add(new BallRuntime{id=13,x=180,y=100,type="normal"});
            p.Observe(prior,1f,null,10);
            var next=A34Snapshot(1,20,140,100);
            next.balls.Add(new BallRuntime{id=13,x=200,y=100,type="normal"});
            p.Observe(next,1.1f,new HashSet<int>{12},11);
            Near(.1f,p.LastBlendSeconds,.001f);
            True(p.TryGetPosition(12,1.15f,out var x,out _));Near(140f,x,.001f);
            True(p.TryGetPosition(13,1.15f,out x,out _));Near(190f,x,.01f);
        });
        Test("A34 W14 large warp cannot masquerade as visual interpolation",()=>{
            var p=new RemoteBallSmoother();
            p.Observe(A34Snapshot(1,10,100,100),1f,null,10);
            p.Observe(A34Snapshot(1,20,450,100),1.1f,null,11);
            Near(0f,p.LastBlendSeconds,.001f);
            True(p.TryGetPosition(12,1.15f,out var x,out _));Near(450f,x,.001f);
        });
        Test("A34 W11 fresh short TELEPORT event snaps one ball once",()=>{
            var p=new RemoteBallSmoother();
            p.Observe(A34Snapshot(1,10,100,100),1f,null,10);
            var next=A34Snapshot(1,20,130,100);
            next.events.Add(new GameEvent{id=9,ballId=12,kind="TELEPORT"});
            var ids=RemoteSnapshotEvents.InstantBallIds(next,0,out int cursor);
            Eq(9,cursor);True(ids.Contains(12));
            p.Observe(next,1.05f,ids,11);
            True(p.TryGetPosition(12,1.05f,out var x,out _));Near(130f,x,.01f);
            var oldIds=RemoteSnapshotEvents.InstantBallIds(next,cursor,out int same);
            Eq(cursor,same);Eq(0,oldIds.Count);
        });
        Test("A34 W11 SWAP event snaps BOTH participant ball ids",()=>{
            var p=new RemoteBallSmoother();
            var first=A34Snapshot(1,10,100,100);
            first.balls.Add(new BallRuntime{id=13,x=180,y=100,type="normal"});
            p.Observe(first,1f,null,10);
            var swapped=A34Snapshot(1,20,180,100);
            swapped.balls.Add(new BallRuntime{id=13,x=100,y=100,type="normal"});
            swapped.events.Add(new GameEvent{id=21,ballId=12,otherId=13,kind="SWAP"});
            var ids=RemoteSnapshotEvents.InstantBallIds(swapped,0,out int cursor);
            Eq(21,cursor);True(ids.Contains(12));True(ids.Contains(13));
            p.Observe(swapped,1.05f,ids,11);
            True(p.TryGetPosition(12,1.05f,out var x,out _));Near(180f,x,.01f);
            True(p.TryGetPosition(13,1.05f,out x,out _));Near(100f,x,.01f);
        });
        Test("A34 W11 irrelevant, malformed and stale events never add false instant ids",()=>{
            var state=A34Snapshot(1,20,120,100);
            state.events.Add(new GameEvent{id=4,ballId=12,kind="DAMAGE"});
            state.events.Add(new GameEvent{id=5,ballId=12,otherId=0,kind="SWAP"});
            state.events.Add(new GameEvent{id=6,ballId=0,otherId=-3,kind="SWAP"});
            var ids=RemoteSnapshotEvents.InstantBallIds(state,0,out int cursor);
            Eq(6,cursor);Eq(1,ids.Count);True(ids.Contains(12));
            ids=RemoteSnapshotEvents.InstantBallIds(state,cursor,out int same);
            Eq(cursor,same);Eq(0,ids.Count);
        });
        Test("A34 W11 ordinary DAMAGE event retains bounded pose smoothing",()=>{
            var p=new RemoteBallSmoother();
            p.Observe(A34Snapshot(1,10,100,100),1f,null,10);
            var next=A34Snapshot(1,20,160,100);
            next.events.Add(new GameEvent{id=3,ballId=12,kind="DAMAGE"});
            var ids=RemoteSnapshotEvents.InstantBallIds(next,0,out int cursor);
            Eq(3,cursor);Eq(0,ids.Count);
            p.Observe(next,1.1f,ids,11);
            True(p.TryGetPosition(12,1.15f,out var x,out _));Near(130f,x,.1f);
            True(p.TryGetPosition(12,1.25f,out x,out _));Near(160f,x,.01f);
        });
        Test("A70 W11 repeated and older snapshot revisions cannot overwrite client visual pose",()=>{
            var p=new RemoteBallSmoother();
            p.Observe(A34Snapshot(1,10,100,100),1f,null,10);
            p.Observe(A34Snapshot(1,20,160,100),1.1f,null,11);
            p.Observe(A34Snapshot(1,21,470,100),1.11f,null,11);
            p.Observe(A34Snapshot(1,22,510,100),1.12f,null,9);
            True(p.TryGetPosition(12,1.3f,out var x,out _));Near(160f,x,.01f);
            p.Observe(A34Snapshot(1,30,175,100),1.31f,null,12);
            True(p.TryGetPosition(12,1.6f,out x,out _));Near(175f,x,.01f);
        });
        Test("A70 W11 new session reset allows low snapshot revision again",()=>{
            var p=new RemoteBallSmoother();
            p.Observe(A34Snapshot(1,10,100,100),1f,null,90);
            p.Reset();
            p.Observe(A34Snapshot(1,10,55,100),2f,null,1);
            True(p.TryGetPosition(12,2.2f,out var x,out _));Near(55f,x,.01f);
        });

    }
}
