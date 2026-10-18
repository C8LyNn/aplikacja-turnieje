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
