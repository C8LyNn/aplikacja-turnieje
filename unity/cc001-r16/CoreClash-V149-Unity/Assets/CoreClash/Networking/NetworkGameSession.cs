using System;
using System.Collections.Generic;
using CoreClash.Core;
namespace CoreClash.Networking
{
    [Serializable] public sealed class SessionSnapshot { public int protocol=149,revision;public string stateJson; }
    public sealed class NetworkGameSession
    {
        readonly GameSimulation sim;
        readonly int[] lastSequence=new int[2];
        int snapshotSerial;
        public NetworkGameSession(GameSimulation s){sim=s;}
        // Called only after NGO binds a new transport connection to the released seat.
        public void ForgetConnection(int owner){if(owner>=0&&owner<lastSequence.Length)lastSequence[owner]=0;}
        public bool Submit(int connectionOwner,PlayerCommand command,out string reason)
        {
            reason="Invalid or duplicate intent.";
            if(connectionOwner<0||connectionOwner>1||command==null||command.owner!=connectionOwner||command.sequence<=lastSequence[connectionOwner])return false;
            if(!sim.TryCommand(command,out reason))return false;lastSequence[connectionOwner]=command.sequence;return true;
        }
        public SessionSnapshot Capture(Func<GameState,string> encode)=>new SessionSnapshot{protocol=149,revision=++snapshotSerial,stateJson=encode(sim.State)};
    }
    // Snapshot cadence is a transport budget, not a gameplay tick or protocol revision.
    // Keep expensive full-state snapshots slower as compressed payloads grow.
    public static class NetworkSnapshotRate
    {
        // 20-Hz NGO simulation tick is the maximum broadcast rate. Large reliable
        // full-state packets throttle before their queue competes with shot intents.
        public const float IdleSeconds=0.25f;
        public const float MovingSeconds=0.05f;
        public static float Interval(MatchPhase phase,int compressedBytes)
        {
            if(phase!=MatchPhase.Moving)return IdleSeconds;
            if(compressedBytes<0)return 0.25f; // invalid size: fail to slow cadence
            if(compressedBytes>=64*1024)return 0.25f; // 4 Hz
            if(compressedBytes>=16*1024)return 0.125f; // 8 Hz
            if(compressedBytes>=8*1024)return 1f/12f; // 12 Hz
            return MovingSeconds; // 20 Hz when compressed packet is small
        }
    }
    // Deterministic 1-Hz privacy-safe log rate-limit for host/client state traces.
    public static class NetworkSnapshotTrace
    {
        public static bool Due(float now,float previous)
        {
            return !float.IsNaN(now)&&!float.IsInfinity(now)&&now>=0f&&
                !float.IsNaN(previous)&&!float.IsInfinity(previous)&&
                now>=previous&&now-previous>=1f;
        }
    }
    // Observability only: compare exact wire stateJson bytes for the SAME revision
    // on host and client. This does not replace authoritative snapshot admission,
    // prove rendered pose parity, or authenticate a remote player.
    public static class NetworkStateDigest
    {
        public static bool ShouldSample(int revision)=>revision>0&&(revision==1||revision%16==0);
        public static string Compute(string stateJson)
        {
            if(string.IsNullOrEmpty(stateJson))return null;
            using(var sha=System.Security.Cryptography.SHA256.Create()){
                byte[] raw=System.Text.Encoding.UTF8.GetBytes(stateJson);
                return BitConverter.ToString(sha.ComputeHash(raw)).Replace("-","").ToLowerInvariant();
            }
        }
    }
    // An old or duplicated result must never clear a newer P2 pending intent.
    public static class NetworkIntentReceipt
    {
        public static bool MatchesPending(bool pending,int expectedSequence,int receivedSequence)
            =>pending&&expectedSequence>0&&receivedSequence==expectedSequence;
    }
    public sealed class NetworkGameStateAdapter
    {
        public GameState State;
        int revision=-1;
        public bool Apply(SessionSnapshot packet,Func<string,GameState> decode,out string reason)
        {
            reason="Invalid, incompatible or stale snapshot.";
            if(packet==null||packet.protocol!=149||packet.revision<=revision||string.IsNullOrEmpty(packet.stateJson))return false;
            GameState next;try{next=decode(packet.stateJson);}catch{return false;}
            if(!IsValidState(next))return false;
            State=next;revision=packet.revision;reason="";return true;
        }
        // Keep this a pure admission check: malformed network data must not throw,
        // advance snapshot revision, or replace the last known-good client state.
        static bool IsValidState(GameState s)
        {
            if(s==null||s.specVersion!=149||s.randomState==0||s.turn<0||s.turn>1||
                s.turnNumber<1||s.nextId<1||s.phase<MatchPhase.Aiming||s.phase>MatchPhase.Over||
                !GameSimulation.Finite(s.time)||!GameSimulation.Finite(s.actionTime)||
                !GameSimulation.Finite(s.actionDeadline)||!GameSimulation.Finite(s.settledTime)||
                s.players==null||s.players.Length!=2||s.balls==null||s.structures==null||
                s.zones==null||s.events==null||s.replayedIds==null||s.graveyard==null||
                s.lineages==null||s.virulence==null)return false;
            for(int i=0;i<2;i++)
            {
                var p=s.players[i];
                if(p==null||p.owner!=i||p.stock==null)return false;
                foreach(var entry in p.stock)
                    if(entry==null||string.IsNullOrEmpty(entry.id)||entry.remaining<0)return false;
            }
            var ids=new HashSet<int>();
            foreach(var b in s.balls)
            {
                if(b==null||string.IsNullOrEmpty(b.type)||b.owner<0||b.owner>1||
                    !ValidId(b.id,s.nextId,ids)||
                    !GameSimulation.Finite(b.x)||!GameSimulation.Finite(b.y)||
                    !GameSimulation.Finite(b.vx)||!GameSimulation.Finite(b.vy)||
                    !GameSimulation.Finite(b.radius)||b.radius<=0||
                    !GameSimulation.Finite(b.mass)||b.mass<=0||
                    b.maxHp<=0||b.hp<0||b.hp>b.maxHp||
                    b.collection==null||b.affectedIds==null||b.turnAffectedIds==null||
                    b.statusOrder==null||!Finite(b.angle,b.maxSpeed,b.restitution,b.wallRestitution,
                        b.stopHold,b.frozen,b.spawnGrace,b.motionPeak,b.portalCooldown,b.sticky)||
                    !ValidSave(b.chronoSave)||!ValidSave(b.paradoxSave))return false;
                foreach(var stamp in b.statusOrder)if(!ValidStamp(stamp))return false;
            }
            foreach(var g in s.structures)
                if(g==null||g.owner<0||g.owner>1||g.maxHp<=0||g.hp<0||g.hp>g.maxHp||
                    !ValidId(g.id,s.nextId,ids)||string.IsNullOrEmpty(g.kind)||!GameSimulation.Finite(g.restitution)||
                    !GameSimulation.Finite(g.x)||!GameSimulation.Finite(g.y)||
                    !GameSimulation.Finite(g.radius)||g.radius<=0)return false;
            foreach(var z in s.zones)
                if(z==null||z.owner<0||z.owner>1||!GameSimulation.Finite(z.x)||
                    !ValidId(z.id,s.nextId,ids)||string.IsNullOrEmpty(z.kind)||
                    !Finite(z.coreRadius,z.pull,z.exitX,z.exitY)||
                    !GameSimulation.Finite(z.y)||!GameSimulation.Finite(z.radius)||
                    z.radius<=0||z.inside==null)return false;
            foreach(var e in s.events)
                if(e==null||string.IsNullOrEmpty(e.kind)||!Finite(e.x,e.y,e.atTime))return false;
            foreach(var g in s.graveyard)
                if(g==null||g.owner<0||g.owner>1||string.IsNullOrEmpty(g.type)||!Finite(g.x,g.y))return false;
            foreach(var lineage in s.lineages)if(lineage==null)return false;
            foreach(var v in s.virulence)if(v==null)return false;
            return true;
        }
        static bool ValidId(int id,int next,HashSet<int> ids)=>id>0&&id<next&&ids.Add(id);
        static bool Finite(params float[] values){foreach(float value in values)if(!GameSimulation.Finite(value))return false;return true;}
        static bool ValidStamp(StatusStamp stamp)=>stamp!=null&&stamp.owner>=0&&stamp.owner<=1&&
            (stamp.family=="FIRE"||stamp.family=="ICE"||stamp.family=="TOXIN");
        static bool ValidSave(SavedBallState saved)
        {
            if(saved==null)return true;
            if(!Finite(saved.x,saved.y,saved.frozen,saved.sticky))return false;
            if(saved.stamps!=null)foreach(var stamp in saved.stamps)if(!ValidStamp(stamp))return false;
            return true;
        }
    }
}
