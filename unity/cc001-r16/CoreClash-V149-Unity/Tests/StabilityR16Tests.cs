using System;
using System.Linq;
using System.Text.Json;
using CoreClash.Core;
using CoreClash.Networking;

public static partial class Program
{
    static void StabilityR16Tests()
    {
        Test("R16 snapshot rejects null presentation events and status stamps atomically",()=>{
            RejectSnapshotMutation(s=>s.events.Add(null));
            RejectSnapshotMutation(s=>s.balls[0].statusOrder.Add(null));
            RejectSnapshotMutation(s=>s.graveyard.Add(null));
            RejectSnapshotMutation(s=>s.lineages.Add(null));
            RejectSnapshotMutation(s=>s.virulence.Add(null));
        });
        Test("R16 snapshot rejects nonfinite zone event and saved-state geometry",()=>{
            RejectSnapshotMutation(s=>s.balls[0].angle=float.NaN);
            RejectSnapshotMutation(s=>s.balls[0].maxSpeed=float.PositiveInfinity);
            RejectSnapshotMutation(s=>s.balls[0].chronoSave=new SavedBallState{x=float.NaN});
            RejectSnapshotMutation(s=>s.zones.Add(new ZoneRuntime{id=s.nextId++,owner=0,kind="portal",radius=25,exitX=float.NaN}));
            RejectSnapshotMutation(s=>s.events[0].x=float.PositiveInfinity);
        });
        Test("R16 snapshot rejects duplicate IDs and invalid next-ID cursor",()=>{
            RejectSnapshotMutation(s=>s.balls.Add(s.balls[0]));
            RejectSnapshotMutation(s=>s.nextId=s.balls[0].id);
            RejectSnapshotMutation(s=>s.zones.Add(new ZoneRuntime{id=s.balls[0].id,owner=0,kind="web",radius=14}));
        });
        Test("R16 malformed snapshots do not throw or poison later revision",()=>{
            RejectSnapshotMutation(s=>s.zones.Add(null));
            RejectSnapshotMutation(s=>s.structures.Add(null));
        });
        W3SnapshotAdmissionCases();
    }

    // R17-W3 / A51: executable C# adapter fixtures ported from R17-W2 Issue #110.
    // Every TEST below registers with the existing StabilityR16Tests() call in Program.Main.
    // This is a pure GameState/NetworkGameSession regression suite; it is not NGO wire QA.
    static void W3SnapshotAdmissionCases()
    {
        Test("R17-W3 SNAP-001 valid snapshots advance admission revision",()=>{
            var sim=Sim();sim.Spawn(0,"normal",200,450);
            var opts=new JsonSerializerOptions{IncludeFields=true};
            string json=JsonSerializer.Serialize(sim.State,opts);
            var adapter=new NetworkGameStateAdapter();
            var packet=new SessionSnapshot{protocol=149,revision=17,stateJson=json};
            True(adapter.Apply(packet,t=>JsonSerializer.Deserialize<GameState>(t,opts),out var why),"first packet must admit");
            Eq("",why);
            var first=adapter.State;
            packet.revision=18;
            True(adapter.Apply(packet,t=>JsonSerializer.Deserialize<GameState>(t,opts),out _),"higher revision must admit");
            True(!Object.ReferenceEquals(first,adapter.State),"new valid packet must replace state instance");
            Eq(json,JsonSerializer.Serialize(adapter.State,opts));
        });
        Test("R17-W3 SNAP-002 stale revision cannot change last-good state",()=>W3RejectEnvelopeAndRetry(0,149,"snapshot"));
        Test("R17-W3 SNAP-003 duplicate revision cannot change last-good state",()=>W3RejectEnvelopeAndRetry(17,149,"snapshot"));
        Test("R17-W3 SNAP-004 incompatible protocol 148 cannot change last-good state",()=>W3RejectEnvelopeAndRetry(18,148,"snapshot"));
        Test("R17-W3 SNAP-005 empty payload cannot change last-good state",()=>W3RejectEnvelopeAndRetry(18,149,""));
        Test("R17-W3 SNAP-006 null packet cannot change last-good state",()=>W3RejectEnvelopeAndRetry(18,149,"snapshot",true));
        Test("R17-W3 SNAP-007 decoder exception is contained and same revision recovers",()=>W3RejectDecoderAndRetry(true));
        Test("R17-W3 SNAP-007 raw malformed JSON is contained and same revision recovers",()=>W3RejectMalformedJsonAndRetry());
        Test("R17-W3 SNAP-008 null decoded GameState is rejected and recovers",()=>W3RejectDecoderAndRetry(false));
        Test("R17-W3 SNAP-011 null player array is atomic",()=>W3RejectStateAndRetry(s=>s.players=null));
        Test("R17-W3 SNAP-012 null nested player stock is atomic",()=>W3RejectStateAndRetry(s=>s.players[0].stock=null));
        Test("R17-W3 SNAP-013 null status stamp is atomic",()=>W3RejectStateAndRetry(s=>s.balls[0].statusOrder.Add(null)));
        Test("R17-W3 SNAP-014 invalid status family is atomic",()=>W3RejectStateAndRetry(s=>s.balls[0].statusOrder.Add(new StatusStamp{family="EARTH",owner=0})));
        Test("R17-W3 SNAP-016 null event collection is atomic",()=>W3RejectStateAndRetry(s=>s.events=null));
        Test("R17-W3 SNAP-019 duplicate ball ID is atomic",()=>W3RejectStateAndRetry(s=>s.balls.Add(s.balls[0])));
        Test("R17-W3 SNAP-020 zone colliding with ball ID is atomic",()=>W3RejectStateAndRetry(s=>s.zones.Add(new ZoneRuntime{id=s.balls[0].id,owner=0,kind="web",radius=14})));
        Test("R17-W3 SNAP-021 nextId equal existing ID is atomic",()=>W3RejectStateAndRetry(s=>s.nextId=s.balls[0].id));
        Test("R17-W3 SNAP-022 in-memory NaN ball coordinate is atomic",()=>W3RejectStateAndRetry(s=>s.balls[0].x=float.NaN,true));
        Test("R17-W3 SNAP-023 in-memory infinite velocity is atomic",()=>W3RejectStateAndRetry(s=>s.balls[0].vx=float.PositiveInfinity,true));
        Test("R17-W3 SNAP-024 nonfinite portal exit is atomic",()=>W3RejectStateAndRetry(s=>s.zones.Add(new ZoneRuntime{id=s.nextId++,owner=0,kind="portal",radius=25,exitX=float.NegativeInfinity}),true));
        Test("R17-W3 SNAP-025 nonfinite event coordinate is atomic",()=>W3RejectStateAndRetry(s=>s.events.Add(new GameEvent{kind="probe",x=float.PositiveInfinity}),true));
        Test("R17-W3 SNAP-029 zone missing inside collection is atomic",()=>W3RejectStateAndRetry(s=>s.zones.Add(new ZoneRuntime{id=s.nextId++,owner=0,kind="web",radius=14,inside=null})));
        Test("R17-W3 host intent rejects spoof, zero sequence and duplicate",()=>{
            var sim=Sim();var host=new NetworkGameSession(sim);
            var bad=Shot(sim,0);bad.sequence=0;
            False(host.Submit(0,bad,out _));Eq(0,sim.State.actionSerial);Eq(0,sim.State.balls.Count);
            var spoof=Shot(sim,1);spoof.sequence=1;
            False(host.Submit(0,spoof,out _));Eq(0,sim.State.actionSerial);
            var legal=Shot(sim,0);legal.sequence=1;
            True(host.Submit(0,legal,out _));Eq(1,sim.State.actionSerial);Eq(1,sim.State.balls.Count);
            False(host.Submit(0,legal,out _));Eq(1,sim.State.actionSerial);Eq(1,sim.State.balls.Count);
        });
    }

    // Every rejected packet must preserve both the identity and the serialized value
    // of the last-good state. Accepting a valid packet at the rejected revision is the
    // observable check that the adapter did not advance its private revision cursor.
    static void W3AssertRetained(NetworkGameStateAdapter adapter,GameState retained,string serialized,JsonSerializerOptions opts)
    {
        True(Object.ReferenceEquals(retained,adapter.State),"reject replaced last-good State reference");
        Eq(serialized,JsonSerializer.Serialize(adapter.State,opts));
    }
    static void W3RejectStateAndRetry(Action<GameState> mutate,bool inMemoryFloat=false)
    {
        var sim=Sim();sim.Spawn(0,"normal",200,450);
        var opts=new JsonSerializerOptions{IncludeFields=true};
        string json=JsonSerializer.Serialize(sim.State,opts);
        var adapter=new NetworkGameStateAdapter();
        var first=new SessionSnapshot{protocol=149,revision=17,stateJson=json};
        True(adapter.Apply(first,t=>JsonSerializer.Deserialize<GameState>(t,opts),out _));
        var retained=adapter.State;
        string retainedJson=JsonSerializer.Serialize(retained,opts);
        GameState invalid=JsonSerializer.Deserialize<GameState>(json,opts);
        mutate(invalid);
        // Null/ID/status/list mutations traverse real System.Text.Json decoding;
        // nonfinite NaN/Infinity exists only as an in-memory GameState float.
        string payload=inMemoryFloat?json:JsonSerializer.Serialize(invalid,opts);
        var second=new SessionSnapshot{protocol=149,revision=18,stateJson=payload};
        Func<string,GameState> decodeInvalid=inMemoryFloat
            ? new Func<string,GameState>(_=>invalid)
            : new Func<string,GameState>(t=>JsonSerializer.Deserialize<GameState>(t,opts));
        False(adapter.Apply(second,decodeInvalid,out string error));
        True(!string.IsNullOrEmpty(error),"rejection should include a reason");
        W3AssertRetained(adapter,retained,retainedJson,opts);
        second.stateJson=json;
        True(adapter.Apply(second,t=>JsonSerializer.Deserialize<GameState>(t,opts),out _),"valid retry of rejected revision must admit");
        True(!Object.ReferenceEquals(retained,adapter.State),"successful retry must replace state reference");
        Eq(retainedJson,JsonSerializer.Serialize(adapter.State,opts));
        False(adapter.Apply(second,t=>JsonSerializer.Deserialize<GameState>(t,opts),out _));
    }
    static void W3RejectEnvelopeAndRetry(int badRevision,int badProtocol,string badPayload,bool nullPacket=false)
    {
        var sim=Sim();sim.Spawn(0,"normal",200,450);
        var opts=new JsonSerializerOptions{IncludeFields=true};
        string json=JsonSerializer.Serialize(sim.State,opts);
        var adapter=new NetworkGameStateAdapter();
        var first=new SessionSnapshot{protocol=149,revision=17,stateJson=json};
        True(adapter.Apply(first,t=>JsonSerializer.Deserialize<GameState>(t,opts),out _));
        var retained=adapter.State;
        string retainedJson=JsonSerializer.Serialize(retained,opts);
        var invalid=new SessionSnapshot{protocol=badProtocol,revision=badRevision,stateJson=badPayload};
        False(adapter.Apply(nullPacket?null:invalid,t=>JsonSerializer.Deserialize<GameState>(t,opts),out string reason));
        True(!string.IsNullOrEmpty(reason));
        W3AssertRetained(adapter,retained,retainedJson,opts);
        var retry=new SessionSnapshot{protocol=149,revision=18,stateJson=json};
        True(adapter.Apply(retry,t=>JsonSerializer.Deserialize<GameState>(t,opts),out _));
        True(!Object.ReferenceEquals(retained,adapter.State));
        Eq(retainedJson,JsonSerializer.Serialize(adapter.State,opts));
    }
    static void W3RejectMalformedJsonAndRetry()
    {
        var sim=Sim();sim.Spawn(0,"normal",200,450);
        var opts=new JsonSerializerOptions{IncludeFields=true};
        string json=JsonSerializer.Serialize(sim.State,opts);
        var adapter=new NetworkGameStateAdapter();
        var first=new SessionSnapshot{protocol=149,revision=17,stateJson=json};
        True(adapter.Apply(first,t=>JsonSerializer.Deserialize<GameState>(t,opts),out _));
        var retained=adapter.State;
        string retainedJson=JsonSerializer.Serialize(retained,opts);
        var packet=new SessionSnapshot{protocol=149,revision=18,stateJson="{\"balls\":["};
        False(adapter.Apply(packet,t=>JsonSerializer.Deserialize<GameState>(t,opts),out string reason));
        True(!string.IsNullOrEmpty(reason));
        W3AssertRetained(adapter,retained,retainedJson,opts);
        packet.stateJson=json;
        True(adapter.Apply(packet,t=>JsonSerializer.Deserialize<GameState>(t,opts),out _));
        Eq(retainedJson,JsonSerializer.Serialize(adapter.State,opts));
    }
    static void W3RejectDecoderAndRetry(bool throwDecode)
    {
        var sim=Sim();sim.Spawn(0,"normal",200,450);
        var opts=new JsonSerializerOptions{IncludeFields=true};
        string json=JsonSerializer.Serialize(sim.State,opts);
        var adapter=new NetworkGameStateAdapter();
        var first=new SessionSnapshot{protocol=149,revision=17,stateJson=json};
        True(adapter.Apply(first,t=>JsonSerializer.Deserialize<GameState>(t,opts),out _));
        var retained=adapter.State;
        string retainedJson=JsonSerializer.Serialize(retained,opts);
        var second=new SessionSnapshot{protocol=149,revision=18,stateJson=json};
        Func<string,GameState> decoder=throwDecode
            ? new Func<string,GameState>(_=>throw new FormatException("W3 injected decoder failure"))
            : new Func<string,GameState>(_=>null);
        False(adapter.Apply(second,decoder,out string reason));
        True(!string.IsNullOrEmpty(reason));
        W3AssertRetained(adapter,retained,retainedJson,opts);
        True(adapter.Apply(second,t=>JsonSerializer.Deserialize<GameState>(t,opts),out _));
        Eq(retainedJson,JsonSerializer.Serialize(adapter.State,opts));
    }
    static void RejectSnapshotMutation(Action<GameState> mutate)
    {
        var sim=Sim();sim.Spawn(0,"normal",200,450);
        var opts=new JsonSerializerOptions{IncludeFields=true};
        string json=JsonSerializer.Serialize(sim.State,opts);
        var client=new NetworkGameStateAdapter();
        var packet=new SessionSnapshot{revision=1,stateJson=json};
        True(client.Apply(packet,t=>JsonSerializer.Deserialize<GameState>(t,opts),out _));
        var retained=client.State;
        var invalid=JsonSerializer.Deserialize<GameState>(json,opts);mutate(invalid);
        packet.revision=2;
        False(client.Apply(packet,_=>invalid,out _));
        True(Object.ReferenceEquals(retained,client.State));
        True(client.Apply(packet,t=>JsonSerializer.Deserialize<GameState>(t,opts),out _));
    }
}
