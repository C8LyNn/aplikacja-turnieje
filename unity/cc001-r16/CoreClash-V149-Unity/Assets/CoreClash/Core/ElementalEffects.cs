using System;
using System.Linq;

namespace CoreClash.Core
{
    public sealed partial class AbilityResolver
    {
        // R13: use the existing status machine.  The host alone resolves
        // targets, turn locks, shields, and element-zone lifetimes.
        void ElementalStop(BallRuntime source)
        {
            switch (source.type)
            {
                case "firebrand":
                    int burned = 0;
                    foreach (var target in Near(source, 100, false))
                    {
                        ApplyFire(target, source.owner);
                        burned++;
                    }
                    sim.Emit("FIREBRAND", source, "Flame wave x" + burned);
                    break;
                case "chainfrost":
                    ChainFrost(source);
                    break;
                case "frostguard":
                    // V148 Frostguard has a defensive anchor independent of
                    // Earth stacks. Never manufacture or overwrite those stacks.
                    source.frostguardAnchored = true;
                    source.vx = source.vy = 0;
                    if (source.shield < 15) sim.Shield(source, 10, 15);
                    sim.Emit("FROSTGUARD", source, "Anchored; counter-freeze active");
                    break;
            }
        }

        void ChainFrost(BallRuntime source)
        {
            float x = source.x, y = source.y;
            int hits = 0;
            // Each bounce changes its origin. First hop MEDIUM, subsequent SHORT.
            var candidates = Living().Where(b => b.owner != source.owner).ToList();
            while (hits < 4)
            {
                float range = hits == 0 ? 165 : 100;
                var next = candidates.Where(b => (b.x - x) * (b.x - x) + (b.y - y) * (b.y - y) <= range * range)
                    .OrderBy(b => (b.x - x) * (b.x - x) + (b.y - y) * (b.y - y))
                    .ThenBy(b => b.id).FirstOrDefault();
                if (next == null) break;
                candidates.Remove(next);
                ApplyIce(next, source.owner);
                x = next.x; y = next.y; hits++;
                sim.Emit("ICE_CHAIN", next, "Hop " + hits + "/4", source.id);
            }
            sim.Emit("CHAINFROST", source, "Frost chain x" + hits);
        }

        void ElementalTurn(BallRuntime source)
        {
            if (source.type != "ashcore" && source.type != "furnace") return;
            if (source.lastElementalTurn == S.turnNumber) return;
            source.lastElementalTurn = S.turnNumber;
            if (source.type == "ashcore")
            {
                // A single +5 shield grant per own turn, irrespective of the
                // number of burning enemies. Source V148 has a 15 shield cap.
                if (Living().Any(b => b.owner != source.owner && b.fireStacks > 0) && source.shield < 15)
                {
                    sim.Shield(source, 5, 15);
                    sim.Emit("ASHCORE", source, "Burning-enemy shield +5");
                }
            }
            else
            {
                // V148 makes/refreshes one 104px, 3-tick element zone per
                // source; the zone applies FIRE at turn end, not every frame.
                var zone = S.zones.FirstOrDefault(z => !z.dead && z.kind == "furnaceFire" && z.sourceId == source.id && z.owner == source.owner);
                if (zone == null)
                {
                    zone = CreateZone(source, "furnaceFire", 104, 3);
                }
                else
                {
                    zone.x = source.x;
                    zone.y = source.y;
                    zone.radius = 104;
                    zone.turns = 3;
                    zone.createdTurn = S.turnNumber;
                    sim.Emit("ZONE_REFRESH", source, "Furnace field 3 turns");
                }
            }
        }

        void ElementalContact(BallRuntime source, BallRuntime target, bool hit)
        {
            if (!hit || source.owner == target.owner) return;
            if (source.type == "frostguard" && source.frostguardAnchored)
            {
                ApplyIce(target, source.owner);
                sim.Emit("FROSTGUARD_COUNTER", target, "Anchored defender counter-freeze", source.id);
            }
        }
    }
}
