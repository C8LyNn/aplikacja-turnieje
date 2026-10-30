using CoreClash.Core;
using CoreClash.Networking;

public static partial class Program
{
    static void NetworkSeatTests()
    {
        Test("LAN approval reserves the sole remote seat before connection completes",()=>{
            var seat=new LanSeat();False(seat.TryReserve(0,0));True(seat.TryReserve(11,0));
            False(seat.TryReserve(12,1));False(seat.Commit(12,1));True(seat.Commit(11,1));
            True(seat.Owns(11));False(seat.TryReserve(12,2));
        });
        Test("LAN disconnect frees P2 while late old callbacks cannot release the replacement",()=>{
            var seat=new LanSeat();True(seat.TryReserve(11,0));True(seat.Commit(11,1));True(seat.Release(11));
            True(seat.TryReserve(12,2));True(seat.Commit(12,3));False(seat.Owns(11));
            False(seat.Release(11));True(seat.Owns(12));
        });
        Test("aborted LAN joins release their reservation without granting authority",()=>{
            var seat=new LanSeat();True(seat.TryReserve(11,0));False(seat.Owns(11));
            True(seat.Release(11));True(seat.TryReserve(12,1));False(seat.Commit(11,2));True(seat.Commit(12,2));
        });
        Test("LAN reservation timeout rejects late completion but does not expire connected P2",()=>{
            var seat=new LanSeat();True(seat.TryReserve(11,0));Eq<ulong?>(11,seat.Expire(11));False(seat.Commit(11,12));
            True(seat.TryReserve(12,12));True(seat.Commit(12,13));Eq<ulong?>(null,seat.Expire(1000));True(seat.Owns(12));
            False(seat.TryReserve(13,double.NaN));
        });
        Test("LAN endpoints accept canonical unicast IPv4 and reject malformed connection input",()=>{
            True(LanEndpoint.TryNormalize("192.168.1.42",7777,out var address));Eq("192.168.1.42",address);
            True(LanEndpoint.TryNormalize("localhost",7777,out address));Eq("127.0.0.1",address);
            foreach(var bad in new[]{"", "0.0.0.0", "255.255.255.255", "239.1.2.3", "127.1", "http://192.168.1.2", "192.168.1.2:7777", "192.168.1.2\n127.0.0.1"})False(LanEndpoint.TryNormalize(bad,7777,out _));
            False(LanEndpoint.TryNormalize("192.168.1.42",0,out _));
        });
        Test("replacement P2 starts sequence one against the same match and still rejects duplicate and spoof",()=>{
            var sim=Sim();var authority=new NetworkGameSession(sim);var first=Shot(sim);first.sequence=1;
            True(authority.Submit(0,first,out _));Settle(sim);
            var oldP2=Shot(sim,1);oldP2.sequence=1;True(authority.Submit(1,oldP2,out _));Settle(sim);
            Eq(1,sim.State.turn);Eq(2,sim.State.actionSerial);False(authority.Submit(1,oldP2,out _));
            authority.ForgetConnection(1);var replacement=Shot(sim,1);replacement.sequence=1;
            var spoof=Shot(sim,0);spoof.sequence=999;False(authority.Submit(1,spoof,out _));
            True(authority.Submit(1,replacement,out _));Eq(3,sim.State.actionSerial);False(authority.Submit(1,replacement,out _));
            Eq(3,sim.State.balls.Count);
        });
        // R17-W3 / A41: security regression coverage for CURRENT R16 seat-refill policy.
        // None of these tests implements identity-authenticated same-player resume.
        Test("R17 LAN pending seat expires exactly at the ten-second deadline",()=>{
            var seat=new LanSeat();True(seat.TryReserve(21,0));
            Eq<ulong?>(null,seat.Expire(9.999));Eq<ulong?>(21,seat.Pending);
            False(seat.Commit(21,10));Eq<ulong?>(null,seat.Pending);
            True(seat.TryReserve(22,10));True(seat.Commit(22,10.5));True(seat.Owns(22));
        });
        Test("R17 failed competing reservations cannot extend the original deadline",()=>{
            var seat=new LanSeat();True(seat.TryReserve(31,0));
            False(seat.TryReserve(32,5));False(seat.TryReserve(31,9.9));
            False(seat.Commit(31,10));Eq<ulong?>(null,seat.Pending);
            True(seat.TryReserve(32,10));False(seat.Commit(31,10.1));
            True(seat.Commit(32,10.1));True(seat.Owns(32));
        });
        Test("R17 invalid timestamps and zero transport ID cannot reserve or corrupt pending seat",()=>{
            var seat=new LanSeat();False(seat.TryReserve(0,0));False(seat.Owns(0));
            True(seat.TryReserve(41,0));
            False(seat.TryReserve(42,double.NaN));
            False(seat.TryReserve(42,double.PositiveInfinity));
            False(seat.TryReserve(42,double.NegativeInfinity));
            False(seat.Commit(41,double.NaN));False(seat.Commit(41,double.PositiveInfinity));
            Eq<ulong?>(41,seat.Pending);False(seat.Release(0));
            True(seat.Commit(41,1));True(seat.Owns(41));False(seat.Owns(0));
        });
        Test("R17 pending transport cannot own P2 and only exact candidate can commit once",()=>{
            var seat=new LanSeat();True(seat.TryReserve(51,0));
            False(seat.Owns(51));False(seat.Commit(52,1));
            Eq<ulong?>(51,seat.Pending);Eq<ulong?>(null,seat.Connected);
            True(seat.Commit(51,1));False(seat.Commit(51,2));
            Eq<ulong?>(null,seat.Pending);Eq<ulong?>(51,seat.Connected);
        });
        Test("R17 nonfinite expiry query never evicts a pending transport",()=>{
            var seat=new LanSeat();True(seat.TryReserve(61,0));
            Eq<ulong?>(null,seat.Expire(double.NaN));
            Eq<ulong?>(null,seat.Expire(double.PositiveInfinity));
            Eq<ulong?>(null,seat.Expire(double.NegativeInfinity));
            Eq<ulong?>(61,seat.Pending);Eq<ulong?>(61,seat.Expire(10));
            False(seat.Commit(61,10));Eq<ulong?>(null,seat.Pending);
        });
        Test("R17 connected seat does not expire even after large time advance",()=>{
            var seat=new LanSeat();True(seat.TryReserve(71,1));True(seat.Commit(71,2));
            Eq<ulong?>(null,seat.Expire(1000000));
            False(seat.TryReserve(72,1000001));
            True(seat.Owns(71));Eq<ulong?>(71,seat.Connected);
        });
        Test("R17 stale disconnect cannot cancel a different pending replacement",()=>{
            var seat=new LanSeat();True(seat.TryReserve(81,0));True(seat.Commit(81,1));
            True(seat.Release(81));True(seat.TryReserve(82,2));
            False(seat.Release(81));Eq<ulong?>(82,seat.Pending);
            False(seat.Owns(81));False(seat.Owns(82));
            True(seat.Commit(82,3));False(seat.Release(81));
            True(seat.Owns(82));
        });
        Test("R17 pending cancellation cannot revoke already connected replacement",()=>{
            var seat=new LanSeat();True(seat.TryReserve(91,0));True(seat.Release(91));
            True(seat.TryReserve(92,1));True(seat.Commit(92,2));
            False(seat.Release(91));False(seat.Commit(91,3));
            True(seat.Owns(92));Eq<ulong?>(null,seat.Pending);
        });
        Test("R17 reset invalidates both pending and connected session ownership",()=>{
            var seat=new LanSeat();True(seat.TryReserve(101,0));seat.Reset();
            False(seat.Commit(101,1));False(seat.Release(101));
            Eq<ulong?>(null,seat.Connected);Eq<ulong?>(null,seat.Pending);
            True(seat.TryReserve(102,2));True(seat.Commit(102,3));
            seat.Reset();False(seat.Owns(102));False(seat.Release(102));
            True(seat.TryReserve(103,4));True(seat.Commit(103,5));
            True(seat.Owns(103));
        });
        Test("R17 repeated join release cycles retain only one owner and no stale reservations",()=>{
            var seat=new LanSeat();
            for(int i=0;i<512;i++){
                ulong client=(ulong)(200+i);
                double now=i*20;
                True(seat.TryReserve(client,now));
                False(seat.TryReserve(client+1000,now+1));
                True(seat.Commit(client,now+1));
                False(seat.Owns(client+1000));
                Eq<ulong?>(null,seat.Pending);
                True(seat.Owns(client));True(seat.Release(client));
                False(seat.Release(client));False(seat.Owns(client));
                Eq<ulong?>(null,seat.Connected);
            }
            Eq<ulong?>(null,seat.Pending);Eq<ulong?>(null,seat.Connected);
        });
        Test("R17 unauthorized P1 spoof from P2 authority does not mutate live turn",()=>{
            var sim=Sim();var authority=new NetworkGameSession(sim);
            var host=Shot(sim);host.sequence=1;
            True(authority.Submit(0,host,out _));Settle(sim);
            Eq(1,sim.State.turn);Eq(1,sim.State.actionSerial);
            var spoof=Shot(sim,0);spoof.sequence=999;
            int oldBalls=sim.State.balls.Count;
            False(authority.Submit(1,spoof,out _));
            Eq(1,sim.State.actionSerial);Eq(oldBalls,sim.State.balls.Count);
            var real=Shot(sim,1);real.sequence=1;
            True(authority.Submit(1,real,out _));Eq(2,sim.State.actionSerial);
        });
        Test("R17 null out-of-range and zero-sequence intents cannot mutate host state",()=>{
            var sim=Sim();var authority=new NetworkGameSession(sim);
            False(authority.Submit(0,null,out _));
            var command=Shot(sim);command.sequence=0;
            False(authority.Submit(0,command,out _));
            command.sequence=-1;False(authority.Submit(0,command,out _));
            command.sequence=1;
            False(authority.Submit(-1,command,out _));
            False(authority.Submit(2,command,out _));
            Eq(0,sim.State.actionSerial);Eq(0,sim.State.balls.Count);
            True(authority.Submit(0,command,out _));Eq(1,sim.State.actionSerial);
        });
        Test("R17 duplicate and decreasing owner sequences cannot double apply host command",()=>{
            var sim=Sim();var authority=new NetworkGameSession(sim);
            var command=Shot(sim);command.sequence=2;
            True(authority.Submit(0,command,out _));
            int serial=sim.State.actionSerial,ballCount=sim.State.balls.Count;
            False(authority.Submit(0,command,out _));
            command.sequence=1;False(authority.Submit(0,command,out _));
            Eq(serial,sim.State.actionSerial);Eq(ballCount,sim.State.balls.Count);
        });
        Test("R17 invalid high sequence does not poison subsequent legal sequence",()=>{
            var sim=Sim();var authority=new NetworkGameSession(sim);
            var invalid=Shot(sim);invalid.sequence=100;invalid.power=float.NaN;
            False(authority.Submit(0,invalid,out _));
            Eq(0,sim.State.actionSerial);
            var legal=Shot(sim);legal.sequence=1;
            True(authority.Submit(0,legal,out _));Eq(1,sim.State.actionSerial);
        });
        Test("R17 rejected command while P2 moves does not consume next bonus sequence",()=>{
            var sim=Sim();var authority=new NetworkGameSession(sim);
            var p1=Shot(sim);p1.sequence=1;
            True(authority.Submit(0,p1,out _));Settle(sim);
            Eq(1,sim.State.turn);
            var p2=Shot(sim,1);p2.sequence=1;
            True(authority.Submit(1,p2,out _));
            var tooEarly=Shot(sim,1);tooEarly.sequence=2;
            False(authority.Submit(1,tooEarly,out _));
            Settle(sim);True(sim.State.bonusPending);Eq(1,sim.State.turn);
            var bonus=Shot(sim,1);bonus.sequence=2;
            True(authority.Submit(1,bonus,out _));
            Eq(3,sim.State.actionSerial);
        });
        Test("R17 released NGO seat cannot authorize old transport after new P2 commit",()=>{
            var sim=Sim();var authority=new NetworkGameSession(sim);var seat=new LanSeat();
            var p1=Shot(sim);p1.sequence=1;
            True(authority.Submit(0,p1,out _));Settle(sim);
            True(seat.TryReserve(301,0));True(seat.Commit(301,1));
            var p2=Shot(sim,1);p2.sequence=1;
            True(seat.Owns(301)&&authority.Submit(1,p2,out _));Settle(sim);
            True(seat.Release(301));True(seat.TryReserve(302,2));
            True(seat.Commit(302,3));authority.ForgetConnection(1);
            var stale=Shot(sim,1);stale.sequence=2;
            False(seat.Owns(301)&&authority.Submit(1,stale,out _));
            False(seat.Release(301));Eq(2,sim.State.actionSerial);
            var replacement=Shot(sim,1);replacement.sequence=1;
            True(seat.Owns(302)&&authority.Submit(1,replacement,out _));
            False(seat.Owns(301)&&authority.Submit(1,stale,out _));
            False(seat.Owns(302)&&authority.Submit(1,replacement,out _));
            Eq(3,sim.State.actionSerial);True(seat.Owns(302));
        });
        Test("R17 stale callbacks cannot clear P2 seat after a timed-out pending contender",()=>{
            var seat=new LanSeat();True(seat.TryReserve(401,0));
            Eq<ulong?>(401,seat.Expire(10));False(seat.Commit(401,10));
            True(seat.TryReserve(402,11));False(seat.Release(401));
            False(seat.Commit(401,12));True(seat.Commit(402,12));
            False(seat.Release(401));True(seat.Owns(402));
        });
        // R17-W9: adaptive snapshots address P2's former five-Hz teleport-like jumps.
        // These are managed policy tests; they do not certify live network smoothness.
        Test("R17 W10 small moving snapshots match twenty Hz NGO tick",()=>{
            float interval=NetworkSnapshotRate.Interval(MatchPhase.Moving,900);
            True(System.Math.Abs(interval-.05f)<0.00001f);
            True(interval<.2f);
        });
        Test("R17 W9 larger moving snapshots respect bandwidth step-down",()=>{
            True(System.Math.Abs(NetworkSnapshotRate.Interval(MatchPhase.Moving,8*1024-1)-.05f)<0.00001f);
            True(System.Math.Abs(NetworkSnapshotRate.Interval(MatchPhase.Moving,8*1024)-1f/12f)<0.00001f);
            True(System.Math.Abs(NetworkSnapshotRate.Interval(MatchPhase.Moving,16*1024-1)-1f/12f)<0.00001f);
            True(System.Math.Abs(NetworkSnapshotRate.Interval(MatchPhase.Moving,16*1024)-.125f)<0.00001f);
            True(System.Math.Abs(NetworkSnapshotRate.Interval(MatchPhase.Moving,64*1024-1)-.125f)<0.00001f);
            True(System.Math.Abs(NetworkSnapshotRate.Interval(MatchPhase.Moving,64*1024)-.25f)<0.00001f);
            True(System.Math.Abs(NetworkSnapshotRate.Interval(MatchPhase.Moving,256*1024)-.25f)<0.00001f);
        });
        Test("R17 W9 idle turn and match-over snapshots stay on bounded refresh",()=>{
            True(System.Math.Abs(NetworkSnapshotRate.Interval(MatchPhase.Aiming,900)-.25f)<0.00001f);
            True(System.Math.Abs(NetworkSnapshotRate.Interval(MatchPhase.Over,900)-.25f)<0.00001f);
            True(System.Math.Abs(NetworkSnapshotRate.Interval(MatchPhase.Aiming,256*1024)-.25f)<0.00001f);
            True(NetworkSnapshotRate.Interval(MatchPhase.Moving,900)<NetworkSnapshotRate.Interval(MatchPhase.Aiming,900));
        });
        Test("R17 W9 result must match current pending P2 intent",()=>{
            False(NetworkIntentReceipt.MatchesPending(false,4,4));
            False(NetworkIntentReceipt.MatchesPending(true,0,0));
            False(NetworkIntentReceipt.MatchesPending(true,4,3));
            False(NetworkIntentReceipt.MatchesPending(true,4,5));
            True(NetworkIntentReceipt.MatchesPending(true,4,4));
        });
        Test("R17 W9 old ack cannot clear a later pending sequence after reconnect",()=>{
            // First result was already consumed (pending=false).
            False(NetworkIntentReceipt.MatchesPending(false,1,1));
            // New connection's pending sequence belongs to the current local lifecycle.
            False(NetworkIntentReceipt.MatchesPending(true,2,1));
            True(NetworkIntentReceipt.MatchesPending(true,2,2));
            // Sequence 1 may legitimately recur on a new transport; pending guard
            // must also be cleared as ResetSession begins that transport lifecycle.
            False(NetworkIntentReceipt.MatchesPending(false,1,1));
        });
        Test("R17 W10 impossible compressed size uses fail-slow snapshot cadence",()=>{
            True(System.Math.Abs(NetworkSnapshotRate.Interval(MatchPhase.Moving,-1)-.25f)<0.00001f);
            True(System.Math.Abs(NetworkSnapshotRate.Interval(MatchPhase.Moving,0)-.05f)<0.00001f);
        });
        Test("R17 W10 trace rate gate is one second and rejects rewound or invalid time",()=>{
            True(NetworkSnapshotTrace.Due(0,-1));
            False(NetworkSnapshotTrace.Due(.5f,0f));
            False(NetworkSnapshotTrace.Due(.999f,0f));
            True(NetworkSnapshotTrace.Due(1f,0f));
            False(NetworkSnapshotTrace.Due(.5f,1f));
            False(NetworkSnapshotTrace.Due(float.NaN,0f));
            False(NetworkSnapshotTrace.Due(float.PositiveInfinity,0f));
            False(NetworkSnapshotTrace.Due(1f,float.NaN));
            False(NetworkSnapshotTrace.Due(1f,float.PositiveInfinity));
        });
        Test("R17 W11 state digest uses standard SHA256 UTF8 byte vector",()=>{
            Eq("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
               NetworkStateDigest.Compute("abc"));
            Eq<string>(null,NetworkStateDigest.Compute(null));
            Eq<string>(null,NetworkStateDigest.Compute(""));
        });
        Test("R17 W11 state digest is deterministic and detects modified serialized state",()=>{
            const string state="{\"turn\":1,\"balls\":[1,2,3]}";
            string original=NetworkStateDigest.Compute(state);
            Eq(original,NetworkStateDigest.Compute(state));
            False(original==NetworkStateDigest.Compute("{\"turn\":0,\"balls\":[1,2,3]}"));
            Eq(64,original.Length);
        });
        Test("R17 W11 state digest revision sampler is shared between TX and RX",()=>{
            False(NetworkStateDigest.ShouldSample(-16));
            False(NetworkStateDigest.ShouldSample(0));
            True(NetworkStateDigest.ShouldSample(1));
            False(NetworkStateDigest.ShouldSample(2));
            False(NetworkStateDigest.ShouldSample(15));
            True(NetworkStateDigest.ShouldSample(16));
            False(NetworkStateDigest.ShouldSample(17));
            True(NetworkStateDigest.ShouldSample(32));
        });
        Test("R17 W14 A41 Phoenix empty hand remains valid and zero-HP inventory is supported",()=>{
            var sim=Sim();var host=new NetworkGameSession(sim);
            var options=new System.Text.Json.JsonSerializerOptions{IncludeFields=true};
            System.Func<string,GameState> decode=raw=>System.Text.Json.JsonSerializer.Deserialize<GameState>(raw,options);
            var adapter=new NetworkGameStateAdapter();
            True(adapter.Apply(host.Capture(s=>System.Text.Json.JsonSerializer.Serialize(s,options)),decode,out _));
            Eq(0,adapter.State.phoenixHand.Count);
            sim.State.phoenixHand.Add(new PhoenixHandEntry{owner=1,maxHp=10,hp=0,shield=0});
            True(adapter.Apply(host.Capture(s=>System.Text.Json.JsonSerializer.Serialize(s,options)),decode,out _));
            Eq(0,adapter.State.phoenixHand[0].hp);
        });
        Test("R17 W14 A41 Phoenix negative HP or nonpositive max rejects snapshot without revision commit",()=>{
            var sim=Sim();var host=new NetworkGameSession(sim);
            var options=new System.Text.Json.JsonSerializerOptions{IncludeFields=true};
            System.Func<string,GameState> decode=raw=>System.Text.Json.JsonSerializer.Deserialize<GameState>(raw,options);
            var adapter=new NetworkGameStateAdapter();
            True(adapter.Apply(host.Capture(s=>System.Text.Json.JsonSerializer.Serialize(s,options)),decode,out _));
            var good=adapter.State;
            var hand=new PhoenixHandEntry{owner=0,maxHp=10,hp=-1,shield=0};
            sim.State.phoenixHand.Add(hand);
            False(adapter.Apply(host.Capture(s=>System.Text.Json.JsonSerializer.Serialize(s,options)),decode,out _));
            True(object.ReferenceEquals(good,adapter.State));
            hand.hp=1;hand.maxHp=0;
            False(adapter.Apply(host.Capture(s=>System.Text.Json.JsonSerializer.Serialize(s,options)),decode,out _));
            True(object.ReferenceEquals(good,adapter.State));
            hand.maxHp=10;
            True(adapter.Apply(host.Capture(s=>System.Text.Json.JsonSerializer.Serialize(s,options)),decode,out _));
            Eq(1,adapter.State.phoenixHand[0].hp);
        });
        Test("R17 W14 A41 Phoenix valid zero-hand does not bypass duplicate Protocol149 revision guard",()=>{
            var sim=Sim();var options=new System.Text.Json.JsonSerializerOptions{IncludeFields=true};
            System.Func<string,GameState> decode=raw=>System.Text.Json.JsonSerializer.Deserialize<GameState>(raw,options);
            var adapter=new NetworkGameStateAdapter();
            var good=new SessionSnapshot{protocol=149,revision=7,
                stateJson=System.Text.Json.JsonSerializer.Serialize(sim.State,options)};
            True(adapter.Apply(good,decode,out _));
            False(adapter.Apply(good,decode,out _));
            var stored=adapter.State;
            var bad=new SessionSnapshot{protocol=149,revision=8,stateJson="{}"};
            False(adapter.Apply(bad,decode,out _));
            True(object.ReferenceEquals(stored,adapter.State));
            good.revision=9;
            True(adapter.Apply(good,decode,out _));
        });
    }
}
