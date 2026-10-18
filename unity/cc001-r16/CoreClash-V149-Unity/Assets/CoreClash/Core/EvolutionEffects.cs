using System;
using System.Linq;

namespace CoreClash.Core
{
    public sealed partial class AbilityResolver
    {
        // R12: generation, division, and veteran upgrades are resolved by the host.
        // Spawned units use the same collision-safe placement and no deck stock.
        void EvolutionTurn(BallRuntime b)
        {
            if (b.type != "hatchery" && b.type != "replicator") return;
            if (b.lastEvolutionTurn == S.turnNumber) return;
            b.lastEvolutionTurn = S.turnNumber;
            if (b.type == "hatchery")
            {
                if (b.hatcherySpawnCount >= 3) return;
                b.hatcheryTurnCounter++;
                if (b.hatcheryTurnCounter < 2) return;
                var definition = sim.Catalog.Ball("broodling");
                if (definition == null) return;
                float angle = b.angle + (b.hatcherySpawnCount % 2 == 0 ? -1 : 1) * (float)Math.PI * .58f;
                float distance = b.radius + definition.radius + 10;
                var child = GenerateAt(b, "broodling", 5, 5,
                    b.x + (float)Math.Cos(angle) * distance,
                    b.y + (float)Math.Sin(angle) * distance, angle, 180);
                if (child == null) { b.hatcheryTurnCounter = 1; return; }
                b.hatcheryTurnCounter = 0;
                b.hatcherySpawnCount++;
                sim.Emit("HATCH", child, "Hatchery " + b.hatcherySpawnCount + "/3", b.id);
                return;
            }
            b.replicatorTurnCounter++;
            if (b.replicatorTurnCounter < 2) return;
            // V148 resets the timer even when the board or owner cap prevents a birth.
            b.replicatorTurnCounter = 0;
            if (Living().Count(x => x.owner == b.owner && x.type == "replicator") >= 3) return;
            var cloneDef = sim.Catalog.Ball("replicator");
            if (cloneDef == null) return;
            float direction = b.angle + (float)Math.PI / 2;
            float offset = b.radius + cloneDef.radius + 10;
            var clone = GenerateAt(b, "replicator", Math.Min(b.hp, cloneDef.hp), cloneDef.hp,
                b.x + (float)Math.Cos(direction) * offset,
                b.y + (float)Math.Sin(direction) * offset, direction, 180);
            if (clone == null) return;
            clone.replicatorTurnCounter = 0;
            clone.lastEvolutionTurn = S.turnNumber;
            sim.Emit("CLONE", clone, "Replicator clone", b.id);
        }

        // Called for both original contact participants before Mimic/Traitor can
        // change either identity. The caller resolves Mine's lethal trigger first.
        void EvolutionPairContact(BallRuntime a, BallRuntime b)
        {
            if (a.type == "mitosis" && a.jammed == 0) SplitMitosis(a);
            if (b.type == "mitosis" && b.jammed == 0) SplitMitosis(b);
        }

        // Other ability tests and copied events may dispatch contact directly.
        void EvolutionContact(BallRuntime ball)
        {
            if (ball.type == "mitosis") SplitMitosis(ball);
        }

        bool SplitMitosis(BallRuntime ball)
        {
            if (ball == null || ball.dead || ball.banished || ball.type != "mitosis" || ball.mitosisSplit)
                return false;
            var definition = sim.Catalog.Ball("mitosis");
            if (definition == null) return false;
            float direction = ball.angle + (float)Math.PI;
            float distance = ball.radius + definition.radius + 10;
            var child = GenerateAt(ball, "mitosis", 15, 15,
                ball.x + (float)Math.Cos(direction) * distance,
                ball.y + (float)Math.Sin(direction) * distance, direction, 180);
            if (child == null) return false; // no space: original remains intact
            ball.mitosisSplit = child.mitosisSplit = true;
            ball.maxHp = ball.hp = 15;
            ball.radius = Math.Max(12, ball.radius * .88f);
            ball.mass = Math.Max(.72f, ball.mass * .72f);
            ball.spawnGrace = .26f;
            child.radius = ball.radius;
            child.mass = ball.mass;
            child.vx = -ball.vy * .18f;
            child.vy = ball.vx * .18f;
            // Generated child does not consume stock and cannot enter the graveyard.
            sim.Emit("MITOSIS", ball, "Mitosis 15 + 15", child.id);
            return true;
        }

        void SpawnSwarmShards(BallRuntime source)
        {
            var definition = sim.Catalog.Ball("shard");
            if (definition == null) return;
            int count = 0;
            float distance = source.radius + definition.radius + 10;
            for (int i = 0; i < 3; i++)
            {
                float angle = source.angle + i * (float)(2 * Math.PI / 3);
                var child = GenerateAt(source, "shard", 5, 5,
                    source.x + (float)Math.Cos(angle) * distance,
                    source.y + (float)Math.Sin(angle) * distance, angle, 145);
                if (child != null) count++;
            }
            if (count > 0) sim.Emit("SWARM", source, "Swarm fragments x" + count);
        }

        void ConscriptorDeath(BallRuntime source)
        {
            var target = Living().Where(x => x.owner == source.owner && x.type == "normal" && Dist(x, source) <= 230)
                .OrderBy(x => Dist(x, source)).ThenBy(x => x.id).FirstOrDefault();
            if (target == null) return;
            target.maxHp += 10;
            sim.Heal(target, 10);
            target.mass = Math.Min(1.5f, target.mass + .10f);
            target.maxSpeed = Math.Min(860, target.maxSpeed + 40);
            target.veteranUpgrades++;
            sim.Emit("VETERAN", target, "Standard veteran +10 Max HP", source.id);
        }
    }
}
