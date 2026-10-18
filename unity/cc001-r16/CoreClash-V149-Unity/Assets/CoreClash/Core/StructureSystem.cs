using System;
using System.Collections.Generic;
using System.Linq;
using CoreClash.Physics;

namespace CoreClash.Core
{
    // Shared, host-owned structure lifecycle. No client-side structure creation.
    public sealed class StructureSystem
    {
        public const int MaxLive = 14;
        readonly GameSimulation sim;
        GameState S => sim.State;
        public StructureSystem(GameSimulation simulation) { sim = simulation; }
        public int ActiveCount => S.structures.Count(g => !g.dead);

        public bool IsFree(float x, float y, float radius, int ignoreBallId = 0)
        {
            if (!GameSimulation.Finite(x) || !GameSimulation.Finite(y) || radius <= 0) return false;
            if (x - radius < ZoneResolver.Left + 4 || x + radius > ZoneResolver.Right - 4 ||
                y - radius < 20 || y + radius > 880) return false;
            foreach (float py in new[] { 47f, 853f })
            {
                float dx = x - 270, dy = y - py;
                if (dx * dx + dy * dy < (radius + 69) * (radius + 69)) return false;
            }
            foreach (var ball in S.balls)
            {
                if (ball.dead || ball.banished || ball.id == ignoreBallId) continue;
                float dx = ball.x - x, dy = ball.y - y, min = ball.radius + radius + 5;
                if (dx * dx + dy * dy < min * min) return false;
            }
            foreach (var g in S.structures)
            {
                if (g.dead) continue;
                float dx = g.x - x, dy = g.y - y, min = g.radius + radius + 7;
                if (dx * dx + dy * dy < min * min) return false;
            }
            return true;
        }
        public bool FindPlacement(float x, float y, float radius, int ignoreBallId,
            float searchRadius, float preferredAngle, out float px, out float py)
        {
            if (IsFree(x, y, radius, ignoreBallId)) { px = x; py = y; return true; }
            foreach (float ring in new[] { 16f, 28f, 42f, 58f, 76f, 96f, 120f, 148f, 180f, 220f })
            {
                if (ring > searchRadius) break;
                int steps = ring <= 28 ? 8 : ring <= 58 ? 12 : 16;
                for (int i = 0; i < steps; i++)
                {
                    double angle = preferredAngle + Math.PI * 2 * i / steps;
                    float tx = x + (float)Math.Cos(angle) * ring;
                    float ty = y + (float)Math.Sin(angle) * ring;
                    if (IsFree(tx, ty, radius, ignoreBallId)) { px = tx; py = ty; return true; }
                }
            }
            px = x; py = y; return false;
        }
        StructureRuntime AddUnchecked(BallRuntime source, string kind, float x, float y,
            float radius, int hp, float restitution)
        {
            var g = new StructureRuntime
            {
                id = S.nextId++, owner = source.owner, sourceId = source.id, kind = kind,
                x = x, y = y, radius = radius, hp = hp, maxHp = hp, restitution = restitution
            };
            S.structures.Add(g);
            sim.Emit("STRUCTURE", new BallRuntime { id = source.id, owner = source.owner, x = x, y = y }, kind + " built", g.id);
            return g;
        }
        public StructureRuntime TryCreate(BallRuntime source, string kind, float x, float y,
            float radius, int hp, float restitution, bool relocate = false, float search = 0, float angle = 0)
        {
            if (source == null || source.dead || ActiveCount >= MaxLive) return null;
            float px = x, py = y;
            if (relocate)
            {
                if (!FindPlacement(x, y, radius, source.id, search, angle, out px, out py)) return null;
            }
            else if (!IsFree(x, y, radius, source.id)) return null;
            return AddUnchecked(source, kind, px, py, radius, hp, restitution);
        }
        // Atomic multi-structure placement: validate the whole row before consuming any IDs.
        public bool TryCreateRow(BallRuntime source, string kind, float centerX, float centerY,
            float rowAngle, float radius, float spacing, int count, int hp, float restitution)
        {
            if (source == null || source.dead || count < 1 || count > MaxLive || ActiveCount + count > MaxLive) return false;
            var positions = new List<(float x, float y)>();
            for (int i = 0; i < count; i++)
            {
                float offset = (i - (count - 1) / 2f) * spacing;
                float x = centerX + (float)Math.Cos(rowAngle) * offset;
                float y = centerY + (float)Math.Sin(rowAngle) * offset;
                if (!IsFree(x, y, radius, source.id)) return false;
                foreach (var other in positions)
                {
                    float dx = x - other.x, dy = y - other.y;
                    if (dx * dx + dy * dy < (2 * radius + 7) * (2 * radius + 7)) return false;
                }
                positions.Add((x, y));
            }
            foreach (var pos in positions) AddUnchecked(source, kind, pos.x, pos.y, radius, hp, restitution);
            return true;
        }
        public bool Repair(StructureRuntime target, BallRuntime source, int hits = 1)
        {
            if (target == null || source == null || target.dead || source.dead || target.owner != source.owner ||
                target.hp >= target.maxHp || hits < 1) return false;
            int before = target.hp;
            target.hp = Math.Min(target.maxHp, target.hp + hits);
            sim.Emit("STRUCTURE_REPAIR", new BallRuntime { id = source.id, owner = source.owner, x = target.x, y = target.y },
                "Repair +" + (target.hp - before), target.id);
            return true;
        }
        public bool Damage(StructureRuntime target, int hits, BallRuntime source)
        {
            if (target == null || target.dead || hits <= 0) return false;
            target.hp = Math.Max(0, target.hp - hits);
            sim.Emit("STRUCTURE_HIT", new BallRuntime { id = source?.id ?? 0, owner = source?.owner ?? -1, x = target.x, y = target.y },
                "Structure -" + hits, target.id);
            if (target.hp == 0)
            {
                target.dead = true;
                sim.Emit("STRUCTURE_BREAK", new BallRuntime { id = source?.id ?? 0, owner = source?.owner ?? -1, x = target.x, y = target.y },
                    "Structure broken", target.id);
            }
            return true;
        }
    }
}
