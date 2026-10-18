using System;
using System.Linq;
using System.Text.Json;
using CoreClash.Core;
using CoreClash.Networking;

public static partial class Program
{
    // Tests are deliberately registered, but only a real .NET 9 run can certify them.
    static void StabilityR15Tests()
    {
        Test("R15 wildcard RNG advances inside serialized authoritative GameState", () => {
            var s=Sim();
            Eq((uint)149,s.State.randomState);
            var b=s.Spawn(0,"wildcard",200,450);
            s.Abilities.OnStop(b);
            uint expected=149;
            expected ^= expected << 13;
            expected ^= expected >> 17;
            expected ^= expected << 5;
            Eq(expected,s.State.randomState);
            True(b.type!="wildcard");
        });
        Test("R15 restored RNG yields the same future wildcard and next RNG state", () => {
            var original=Sim();
            var first=original.Spawn(0,"wildcard",200,450);
            original.Abilities.OnStop(first);
            var json=new JsonSerializerOptions{IncludeFields=true};
            var packet=new NetworkGameSession(original).Capture(s=>JsonSerializer.Serialize(s,json));
            var adapter=new NetworkGameStateAdapter();
            True(adapter.Apply(packet,s=>JsonSerializer.Deserialize<GameState>(s,json),out _));
            Eq(original.State.randomState,adapter.State.randomState);
            var restored=Sim();
            restored.State=adapter.State;
            var a=original.Spawn(0,"wildcard",320,450);
            var b=restored.Spawn(0,"wildcard",320,450);
            original.Abilities.OnStop(a);
            restored.Abilities.OnStop(b);
            Eq(a.type,b.type);
            Eq(original.State.randomState,restored.State.randomState);
            Eq(a.id,b.id);
        });
        Test("R15 malformed nested network snapshot is rejected without replacing good state", () => {
            var s=Sim();s.Spawn(0,"normal",200,450);
            var json=new JsonSerializerOptions{IncludeFields=true};
            var session=new NetworkGameSession(s);
            var good=session.Capture(state=>JsonSerializer.Serialize(state,json));
            var adapter=new NetworkGameStateAdapter();
            True(adapter.Apply(good,txt=>JsonSerializer.Deserialize<GameState>(txt,json),out _));
            var retained=adapter.State;
            var bad=session.Capture(state=>JsonSerializer.Serialize(state,json));
            var invalid=JsonSerializer.Deserialize<GameState>(bad.stateJson,json);
            invalid.balls.Add(null);
            False(adapter.Apply(bad,_=>invalid,out _));
            True(Object.ReferenceEquals(retained,adapter.State));
            // A rejected revision cannot prevent a subsequent corrected packet.
            True(adapter.Apply(bad,txt=>JsonSerializer.Deserialize<GameState>(txt,json),out _));
        });
        Test("R15 snapshot rejects zero RNG, nonfinite structures and missing subtrees", () => {
            var s=Sim();var owner=s.Spawn(0,"wallmaker",200,450);
            var g=s.Structures.TryCreate(owner,"wallOrb",300,450,17,5,.18f);
            True(g!=null);
            var adapter=new NetworkGameStateAdapter();
            var packet=new SessionSnapshot{protocol=149,revision=1,stateJson="test"};
            var invalid=Sim().State;
            invalid.randomState=0;
            False(adapter.Apply(packet,_=>invalid,out _));
            invalid.randomState=149;
            invalid.players[1]=null;
            False(adapter.Apply(packet,_=>invalid,out _));
            invalid=s.State;
            invalid.structures[0].x=float.PositiveInfinity;
            False(adapter.Apply(packet,_=>invalid,out _));
            True(adapter.State==null);
        });
    }
}
