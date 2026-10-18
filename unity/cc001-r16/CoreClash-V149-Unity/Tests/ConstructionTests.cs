using System;
using System.Linq;
using System.Text.Json;
using CoreClash.Core;
using CoreClash.Networking;

public static partial class Program
{
    static void ConstructionTests()
    {
        Test("R10 Wallmaker STOP creates exactly three independent pillars", () => {
            var s = Sim(); var b = s.Spawn(0, "wallmaker", 270, 450); b.angle = -(float)Math.PI / 2;
            s.Abilities.OnStop(b);
            Eq(3, s.State.structures.Count(g => !g.dead));
            True(s.State.structures.All(g => g.kind == "wallOrb" && g.owner == 0 && g.sourceId == b.id && g.hp == 5 && g.maxHp == 5));
            var items = s.State.structures.ToArray();
            for (int i = 0; i < items.Length; i++) for (int j = i+1; j < items.Length; j++)
            {
                double dx = items[i].x-items[j].x, dy = items[i].y-items[j].y;
                True(Math.Sqrt(dx*dx+dy*dy) >= items[i].radius+items[j].radius+7);
            }
        });
        Test("R10 Wallmaker refuses partial row when fewer than three slots remain", () => {
            var s = Sim(); var b = s.Spawn(0, "wallmaker", 270, 450);
            for (int i = 0; i < 12; i++) s.State.structures.Add(new StructureRuntime { id = s.State.nextId++, kind = "dummy", hp = 1, maxHp = 1, radius = 1, x = 22 + i * 40, y = 100 });
            int id = s.State.nextId; s.Abilities.OnStop(b);
            Eq(12, s.Structures.ActiveCount); Eq(id, s.State.nextId);
            True(s.State.events.Any(e => e.kind == "PLACEMENT_BLOCKED"));
        });
        Test("R10 structure placement keeps both firing fields empty and respects global cap", () => {
            var s = Sim(); var b = s.Spawn(0, "wallmaker", 270, 450);
            Eq(null, s.Structures.TryCreate(b, "wallOrb", 270, 853, 17, 5, .18f));
            for (int i = 0; i < StructureSystem.MaxLive; i++) s.State.structures.Add(new StructureRuntime { id = s.State.nextId++, kind = "dummy", hp = 1, maxHp = 1, radius = 1, x = 30 + i * 34, y = 200 });
            Eq(null, s.Structures.TryCreate(b, "engineerWall", 200, 400, 14, 5, .08f));
        });
        Test("R10 Repair Pulse repairs own damaged construction before shielding a ball", () => {
            var s = Sim(); var repair = s.Spawn(0, "repairpulse", 240, 450);
            var ally = s.Spawn(0, "normal", 160, 450);
            var g = s.Structures.TryCreate(repair, "wallOrb", 300, 450, 17, 5, .18f);
            True(g != null); s.Structures.Damage(g, 3, null); Eq(2, g.hp);
            s.Abilities.OnTurnStart(0); Eq(4, g.hp); Eq(0, ally.shield);
            s.Abilities.OnTurnStart(0); Eq(5, g.hp);
            s.Abilities.OnTurnStart(0); Eq(5, ally.shield);
        });
        Test("R10 Repair Pulse ignores enemy structures and caps shield", () => {
            var s = Sim(); var repair = s.Spawn(0, "repairpulse", 240, 450); var ally = s.Spawn(0, "normal", 220, 360);
            var owner = s.Spawn(1, "normal", 400, 450);
            var g = s.Structures.TryCreate(owner, "wallOrb", 320, 450, 17, 5, .18f);
            True(g != null); s.Structures.Damage(g, 1, null);
            for (int i = 0; i < 4; i++) s.Abilities.OnTurnStart(0);
            Eq(4, g.hp); Eq(10, ally.shield);
        });
        Test("R10 Engineer repairs before building and counts only own living segments", () => {
            var s = Sim(); var b = s.Spawn(0, "engineer", 270, 450);
            s.Abilities.OnTurnStart(0); Eq(1, s.State.structures.Count(g => !g.dead));
            var g = s.State.structures.Single(); Eq("engineerWall", g.kind); Eq(b.id, g.sourceId);
            s.Structures.Damage(g, 2, null); s.Abilities.OnTurnStart(0);
            Eq(4, g.hp); Eq(1, s.State.structures.Count(x => !x.dead));
            for (int i = 0; i < 18; i++) s.Abilities.OnTurnStart(0);
            True(s.State.structures.Count(x => !x.dead && x.sourceId == b.id) <= 8);
            True(s.Structures.ActiveCount <= StructureSystem.MaxLive);
        });
        Test("R10 Barricade makes at most four segments, respects blocked geometry", () => {
            var s = Sim(); var b = s.Spawn(0, "barricade", 270, 450); b.angle = -(float)Math.PI / 2;
            s.Abilities.OnStop(b); True(s.Structures.ActiveCount > 0 && s.Structures.ActiveCount <= 4);
            True(s.State.structures.All(g => g.kind == "wallOrb" && g.radius == 14 && g.sourceId == b.id));
        });
        Test("R10 Bastion shields nearest teammate or falls back to self", () => {
            var s = Sim(); var b = s.Spawn(0, "bastion", 270, 450);
            s.Abilities.OnTurnStart(0); Eq(5, b.shield);
            var near = s.Spawn(0, "normal", 300, 450); var far = s.Spawn(0, "normal", 350, 450);
            s.Abilities.OnTurnStart(0); Eq(5, near.shield); Eq(0, far.shield);
            s.Abilities.OnTurnStart(0); Eq(10, near.shield);
            s.Abilities.OnTurnStart(0); Eq(10, near.shield);
        });
        Test("R10 structure collisions count separate episodes, not repeated overlap frames", () => {
            var s = Sim(); var owner = s.Spawn(0, "pinballer", 100, 450);
            var g = s.Structures.TryCreate(owner, "bumper", 200, 450, 20, 5, 1.42f);
            True(g != null); var b = s.Spawn(1, "normal", 240, 450, -500, 0);
            s.Physics.Step(1f / 120); Eq(4, g.hp);
            b.x = 240; b.y = 450; b.vx = -500; b.vy = 0;
            s.Physics.Step(1f / 120); Eq(4, g.hp);
            b.x = 350; b.y = 450; b.vx = b.vy = 0; s.Physics.Step(1f / 120);
            b.x = 240; b.vx = -500; s.Physics.Step(1f / 120); Eq(3, g.hp);
        });
        Test("R10 structure lifecycle is included in authoritative JSON snapshots", () => {
            var s = Sim(); var b = s.Spawn(0, "engineer", 270, 450);
            s.Abilities.OnTurnStart(0);
            var g = s.State.structures.First(); s.Structures.Damage(g, 1, null);
            var options = new JsonSerializerOptions { IncludeFields = true };
            var packet = new NetworkGameSession(s).Capture(state => JsonSerializer.Serialize(state, options));
            var adapter = new NetworkGameStateAdapter();
            True(adapter.Apply(packet, json => JsonSerializer.Deserialize<GameState>(json, options), out _));
            var recovered = adapter.State.structures.Single();
            Eq(g.id, recovered.id); Eq(g.sourceId, recovered.sourceId);
            Eq(g.hp, recovered.hp); Eq(g.maxHp, recovered.maxHp);
        });
    }
}
