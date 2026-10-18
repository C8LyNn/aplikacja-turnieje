using System;
using System.Linq;

namespace CoreClash.Core
{
    public sealed partial class AbilityResolver
    {
        void ConstructionStop(BallRuntime b)
        {
            if (b.type == "wallmaker") BuildWallmakerRow(b);
            else if (b.type == "barricade") BuildBarricade(b);
        }
        void ConstructionTurn(BallRuntime b)
        {
            switch (b.type)
            {
                case "repairpulse": RepairPulse(b); break;
                case "engineer": EngineerTurn(b); break;
                case "bastion": BastionTurn(b); break;
            }
        }
        static float DistanceTo(StructureRuntime g, BallRuntime b)
        {
            float dx = g.x - b.x, dy = g.y - b.y;
            return (float)Math.Sqrt(dx * dx + dy * dy);
        }
        StructureRuntime DamagedNearby(BallRuntime b)
        {
            return S.structures.Where(g => !g.dead && g.owner == b.owner && g.maxHp > g.hp && DistanceTo(g, b) <= 165)
                .OrderBy(g => DistanceTo(g, b)).ThenBy(g => g.id).FirstOrDefault();
        }
        void BuildWallmakerRow(BallRuntime b)
        {
            const float radius = 17, spacing = 43;
            float angle = b.angle, rowAngle = angle + (float)Math.PI / 2;
            float back = b.radius + radius + 9;
            float cx = b.x - (float)Math.Cos(angle) * back;
            float cy = b.y - (float)Math.Sin(angle) * back;
            if (sim.Structures.ActiveCount + 3 > StructureSystem.MaxLive)
            {
                sim.Emit("PLACEMENT_BLOCKED", b, "Wallmaker: no three slots"); return;
            }
            foreach (float ring in new[] { 0f, 16f, 28f, 42f, 58f, 74f })
            {
                int steps = ring == 0 ? 1 : ring <= 28 ? 8 : ring <= 58 ? 12 : 16;
                for (int i = 0; i < steps; i++)
                {
                    float shiftAngle = angle + (float)Math.PI + (float)(Math.PI * 2 * i / steps);
                    float x = cx + (float)Math.Cos(shiftAngle) * ring;
                    float y = cy + (float)Math.Sin(shiftAngle) * ring;
                    if (sim.Structures.TryCreateRow(b, "wallOrb", x, y, rowAngle, radius, spacing, 3, 5, .18f))
                        return;
                }
            }
            sim.Emit("PLACEMENT_BLOCKED", b, "Wallmaker: no legal row");
        }
        void BuildBarricade(BallRuntime b)
        {
            const float radius = 14;
            float distance = b.radius + radius + 24;
            int count = 0;
            foreach (float offset in new[] { -.72f, -.24f, .24f, .72f })
            {
                float angle = b.angle + offset;
                var placed = sim.Structures.TryCreate(b, "wallOrb",
                    b.x + (float)Math.Cos(angle) * distance,
                    b.y + (float)Math.Sin(angle) * distance,
                    radius, 5, .24f, true, 40, angle);
                if (placed != null) count++;
            }
            if (count == 0) sim.Emit("PLACEMENT_BLOCKED", b, "Barricade: no free space");
        }
        void RepairPulse(BallRuntime b)
        {
            var target = DamagedNearby(b);
            if (target != null) { sim.Structures.Repair(target, b, 2); return; }
            var ally = Near(b, 165, true)
                .OrderBy(t => t.shield + t.hp).ThenBy(t => t.id).FirstOrDefault();
            if (ally != null && ally.shield < 10) sim.Shield(ally, 5, 10);
        }
        void EngineerTurn(BallRuntime b)
        {
            var target = DamagedNearby(b);
            if (target != null) { sim.Structures.Repair(target, b); return; }
            var owned = S.structures.Where(g => !g.dead && g.sourceId == b.id && g.kind == "engineerWall").ToArray();
            if (owned.Length >= 8) return;
            var angles = owned.Select(g => (float)Math.Atan2(g.y - b.y, g.x - b.x)).ToArray();
            var candidates = Enumerable.Range(0, 8).Select(i => new
            {
                index = i,
                angle = -(float)Math.PI / 2 + i * (float)Math.PI / 4
            }).Select(v => new
            {
                v.index, v.angle,
                score = angles.Length == 0 ? float.PositiveInfinity : angles.Min(a =>
                {
                    float delta = Math.Abs(v.angle - a) % ((float)Math.PI * 2);
                    return Math.Min(delta, (float)Math.PI * 2 - delta);
                })
            }).OrderByDescending(v => v.score).ThenBy(v => v.index);
            foreach (var candidate in candidates)
            {
                float x = b.x + (float)Math.Cos(candidate.angle) * 44;
                float y = b.y + (float)Math.Sin(candidate.angle) * 44;
                if (sim.Structures.TryCreate(b, "engineerWall", x, y, 14, 5, .08f,
                        true, 42, candidate.angle) != null) return;
            }
            sim.Emit("PLACEMENT_BLOCKED", b, "Engineer: no legal segment");
        }
        void BastionTurn(BallRuntime b)
        {
            var ally = Near(b, 165, true).FirstOrDefault() ?? b;
            if (ally.shield < 10) sim.Shield(ally, 5, 10);
        }
    }
}
