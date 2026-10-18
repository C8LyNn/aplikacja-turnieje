using System;
using System.Linq;
using System.Text.Json;
using CoreClash.Core;
using CoreClash.Networking;

public static partial class Program
{
    // R14: cross-wave contracts. These are C# test definitions until run under .NET 9.
    static void IntegrationR14Tests()
    {
        Test("R14 structure repair works on another ability's Wallmaker pillars", () => {
            var s = Sim();
            var wall = s.Spawn(0, "wallmaker", 270, 450);
            wall.angle = -(float)Math.PI / 2;
            s.Abilities.OnStop(wall);
            Eq(3, s.Structures.ActiveCount);
            var first = s.State.structures.OrderBy(g => g.id).First();
            var repair = s.Spawn(0, "repairpulse", first.x + 35, first.y);
            True(s.Structures.Damage(first, 2, null));
            Eq(3, first.hp);
            s.Abilities.OnTurnStart(0);
            Eq(5, first.hp);
            Eq(3, s.Structures.ActiveCount);
            True(s.State.events.Any(e => e.kind == "STRUCTURE_REPAIR" && e.otherId == first.id));
        });
        Test("R14 Commander grants reinforcement shields to generated Quartermaster Standards", () => {
            var s = Sim();
            s.Spawn(0, "quartermaster", 270, 450);
            s.Spawn(0, "commander", 340, 450);
            s.Abilities.OnTurnStart(0);
            s.State.turnNumber += 2;
            s.Abilities.OnTurnStart(0);
            var generated = s.State.balls.Single(x => !x.dead && x.type == "normal" && x.generated);
            Eq(10, generated.hp);
            // Quartermaster has a lower ID: Commander sees the newborn this turn.
            Eq(5, generated.shield);
            s.State.turnNumber += 2;
            s.Abilities.OnTurnStart(0);
            Eq(10, generated.shield);
        });
        Test("R14 Firebrand can ignite R12 Replicator copies without damaging ownership", () => {
            var s = Sim();
            var parent = s.Spawn(0, "replicator", 200, 450);
            s.Abilities.OnTurnStart(0);
            s.State.turnNumber += 2;
            s.Abilities.OnTurnStart(0);
            var clone = s.State.balls.Single(x => x.type == "replicator" && x.generated);
            Eq(0, clone.owner);
            var fire = s.Spawn(1, "firebrand", clone.x + 65, clone.y);
            s.Abilities.OnStop(fire);
            Eq(1, clone.fireStacks);
            Eq(0, parent.fireStacks); // parent is outside the 100px fire wave
        });
        Test("R14 combined construction, generated units and elemental fields round-trip", () => {
            var s = Sim();
            var wall = s.Spawn(0, "wallmaker", 270, 450);
            s.Abilities.OnStop(wall);
            s.Spawn(0, "hatchery", 120, 430);
            var furnace = s.Spawn(1, "furnace", 410, 450);
            s.Abilities.OnTurnStart(0);
            s.Abilities.OnTurnStart(1);
            True(s.State.structures.Count > 0);
            True(s.State.zones.Any(z => !z.dead && z.kind == "furnaceFire"));
            var opts = new JsonSerializerOptions { IncludeFields = true };
            var packet = new NetworkGameSession(s).Capture(state => JsonSerializer.Serialize(state, opts));
            var adapter = new NetworkGameStateAdapter();
            True(adapter.Apply(packet, json => JsonSerializer.Deserialize<GameState>(json, opts), out _));
            Eq(s.State.structures.Count, adapter.State.structures.Count);
            Eq(s.State.zones.Count, adapter.State.zones.Count);
            Eq(s.State.balls.Count, adapter.State.balls.Count);
            True(adapter.State.zones.Any(z => z.kind == "furnaceFire" && z.owner == furnace.owner));
        });
    }
}
