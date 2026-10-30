using System;
using System.Collections.Generic;
using CoreClash.Core;

namespace CoreClash.Presentation
{
    // W10 A30 integration: only fresh displacement events bypass interpolation.
    public static class RemoteSnapshotEvents
    {
        public static ISet<int> InstantBallIds(GameState state,int afterEventId,out int latestEventId)
        {
            latestEventId=afterEventId;
            var ids=new HashSet<int>();
            if(state?.events==null)return ids;
            foreach(var e in state.events){
                if(e==null||e.id<=afterEventId)continue;
                latestEventId=Math.Max(latestEventId,e.id);
                if(e.kind=="PORTAL"&&e.ballId>0)ids.Add(e.ballId);
            }
            return ids;
        }
    }

    // R17-W9 A34: presentation-only smoothing; the authoritative GameState is never mutated.
    public sealed class RemoteBallSmoother
    {
        const float MaxGap=0.6f,MaxDuration=0.2f,MaxDistance=220f;
        sealed class Pose
        {
            public float fromX,fromY,toX,toY,start,duration;
            public int owner;
            public string type;
        }
        readonly Dictionary<int,Pose> poses=new Dictionary<int,Pose>();
        readonly HashSet<int> active=new HashSet<int>();
        readonly List<int> stale=new List<int>();
        int action,lastFrame,lastSnapshotRevision=-1;
        float lastPacket;
        bool hasPacket;
        public int TrackedCount=>poses.Count;

        public void Reset()
        {
            poses.Clear();active.Clear();stale.Clear();
            hasPacket=false;action=lastFrame=0;lastPacket=0;lastSnapshotRevision=-1;
        }
        static bool Finite(float v)=>!float.IsNaN(v)&&!float.IsInfinity(v);
        static void Position(Pose p,float now,out float x,out float y)
        {
            float t=p.duration<=0?1:Math.Max(0,Math.Min(1,(now-p.start)/p.duration));
            t=t*t*(3-2*t);
            x=p.fromX+(p.toX-p.fromX)*t;
            y=p.fromY+(p.toY-p.fromY)*t;
        }
        // Invoke only after Protocol149 snapshot admission. No extrapolation, simulation, or velocity writes.
        public void Observe(GameState state,float now,ISet<int> instantBallIds=null,int snapshotRevision=-1)
        {
            // Accepted NGO revision is explicit; reject duplicate/reordered visual samples.
            // This does NOT change host authority, GameState, or Protocol149.
            if(snapshotRevision>=0&&lastSnapshotRevision>=0&&snapshotRevision<=lastSnapshotRevision)return;
            if(state==null||state.balls==null||state.phase!=MatchPhase.Moving||!Finite(now)){Reset();return;}
            bool snap=!hasPacket||state.actionSerial!=action||state.frame<lastFrame||
                now<=lastPacket||now-lastPacket>MaxGap;
            float duration=hasPacket?Math.Max(.05f,Math.Min(MaxDuration,now-lastPacket)):0;
            if(snap)poses.Clear();
            active.Clear();
            foreach(var ball in state.balls)
            {
                if(ball==null||ball.id<=0||ball.dead||ball.banished||!Finite(ball.x)||!Finite(ball.y))continue;
                if(!active.Add(ball.id))continue;
                if(!poses.TryGetValue(ball.id,out var pose))
                {
                    pose=new Pose{fromX=ball.x,fromY=ball.y,toX=ball.x,toY=ball.y,start=now,owner=ball.owner,type=ball.type};
                    poses.Add(ball.id,pose);continue;
                }
                if(instantBallIds!=null&&instantBallIds.Contains(ball.id))
                {
                    pose.fromX=pose.toX=ball.x;pose.fromY=pose.toY=ball.y;
                    pose.owner=ball.owner;pose.type=ball.type;pose.start=now;pose.duration=0;
                    continue;
                }
                if(pose.owner!=ball.owner||!string.Equals(pose.type,ball.type,StringComparison.Ordinal))
                {
                    // Stable transport id is not proof of the same playable identity.
                    // Owner/type conversion must not animate the prior entity into the next.
                    pose.fromX=pose.toX=ball.x;pose.fromY=pose.toY=ball.y;
                    pose.owner=ball.owner;pose.type=ball.type;
                    pose.start=now;pose.duration=0;
                    continue;
                }
                Position(pose,now,out var x,out var y);
                float dx=ball.x-x,dy=ball.y-y;
                if(dx*dx+dy*dy>MaxDistance*MaxDistance)
                {
                    // Warp, teleport, packet gap: never smooth through unrelated geometry.
                    x=ball.x;y=ball.y;pose.duration=0;
                }
                else pose.duration=duration;
                pose.fromX=x;pose.fromY=y;
                pose.toX=ball.x;pose.toY=ball.y;pose.start=now;
            }
            stale.Clear();
            foreach(var pair in poses)if(!active.Contains(pair.Key))stale.Add(pair.Key);
            foreach(var id in stale)poses.Remove(id);
            action=state.actionSerial;lastFrame=state.frame;
            lastPacket=now;hasPacket=true;
            if(snapshotRevision>=0)lastSnapshotRevision=snapshotRevision;
        }
        public bool TryGetPosition(int id,float now,out float x,out float y)
        {
            x=y=0;
            if(!Finite(now)||!poses.TryGetValue(id,out var pose))return false;
            Position(pose,now,out x,out y);
            return true;
        }
    }
}
