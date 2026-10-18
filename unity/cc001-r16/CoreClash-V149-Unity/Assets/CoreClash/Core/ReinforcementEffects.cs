using System;
using System.Linq;

namespace CoreClash.Core
{
    public sealed partial class AbilityResolver
    {
        // All reinforcement decisions happen on the authoritative simulation.
        // No stock is consumed when a generated unit is created.
        BallRuntime GenerateAt(BallRuntime parent, string type, int hp, int maxHp,
            float targetX, float targetY, float preferredAngle, float searchRadius)
        {
            if (parent == null || S.balls.Count(x => !x.dead && !x.banished) >= 256) return null;
            var definition = sim.Catalog.Ball(type);
            if (definition == null || !FindPlacement(targetX, targetY, definition.radius, 0,
                searchRadius, preferredAngle, out float x, out float y)) return null;
            var child = sim.Spawn(parent.owner, type, x, y);
            child.maxHp = maxHp;
            child.hp = Math.Min(hp, maxHp);
            // Summoned Standards and hidden fragments are both generated tokens.
            // They must not enter the graveyard or trigger non-token RETURNS.
            child.generated = true;
            child.spawnGrace = .35f;
            child.angle = parent.angle;
            S.replayedIds.Add(child.id);
            return child;
        }

        void ReinforcementTurn(BallRuntime b)
        {
            if (b.type != "commander" && b.type != "quartermaster") return;
            if (b.lastReinforcementTurn == S.turnNumber) return;
            b.lastReinforcementTurn = S.turnNumber;
            if (b.type == "commander")
            {
                foreach (var ally in Living().Where(x => x.owner == b.owner && x.type == "normal" && x.shield < 10))
                    sim.Shield(ally, 5, 10);
            }
            else if (b.type == "quartermaster")
            {
                // Deliberately not ownTurnCounter: blocked summon is retried next turn.
                b.quartermasterTurnCounter++;
                if (b.quartermasterTurnCounter < 2) return;
                float angle = b.angle + (S.turnNumber % 2 == 0 ? -(float)Math.PI * .55f : (float)Math.PI * .55f);
                float distance = b.radius + sim.Catalog.Ball("normal").radius + 10;
                var child = GenerateAt(b, "normal", 10, 10,
                    b.x + (float)Math.Cos(angle) * distance,
                    b.y + (float)Math.Sin(angle) * distance, angle, 180);
                if (child == null) { b.quartermasterTurnCounter = 1; return; }
                b.quartermasterTurnCounter = 0;
                sim.Emit("REINFORCEMENT", child, "Standard token +1", b.id);
            }
        }

        void ReinforcementStop(BallRuntime b)
        {
            if (b.type == "armorer")
            {
                foreach (var ally in Near(b, 165, true).Where(x => x.type == "normal" && x.shield < 15))
                    sim.Shield(ally, 5, 15);
            }
            else if (b.type == "splitter") SplitOnStop(b);
        }

        void SplitOnStop(BallRuntime b)
        {
            if (b.dead || b.splitDone) return;
            var fragment = sim.Catalog.Ball("shard");
            if (fragment == null) return;
            int limit = Living().Count(x => x.owner == b.owner) >= 11 ? 1 : 2;
            float perp = b.angle + (float)Math.PI / 2;
            float distance = b.radius + fragment.radius + 9;
            int made = 0;
            for (int i = 0; i < limit; i++)
            {
                float angle = perp + (i == 0 ? 0 : (float)Math.PI);
                var child = GenerateAt(b, "shard", fragment.hp, fragment.hp,
                    b.x + (float)Math.Cos(angle) * distance,
                    b.y + (float)Math.Sin(angle) * distance, angle, 148);
                if (child != null) made++;
            }
            if (made == 0) return; // No legal placement: retry on later STOP.
            b.splitDone = true;
            // V148 splits replace the parent; this is not a DEATH trigger and
            // must not grant graveyard, RETURN, DEATH or on-kill rewards.
            b.dead = true;
            b.vx = b.vy = 0;
            b.moving = false;
            sim.Emit("SPLIT", b, "Shards x" + made);
        }

        // V148 Egg Sac uses four radial target positions rather than repeated
        // attempts at the corpse centre. Existing DEATH/repeat semantics stay.
        void SpawnEggSacBroodlings(BallRuntime b)
        {
            var definition = sim.Catalog.Ball("broodling");
            if (definition == null) return;
            float distance = b.radius + definition.radius + 8;
            for (int i = 0; i < 4; i++)
            {
                float angle = b.angle + i * (float)Math.PI / 2;
                var child = GenerateAt(b, "broodling", 5, 5,
                    b.x + (float)Math.Cos(angle) * distance,
                    b.y + (float)Math.Sin(angle) * distance, angle, 120);
                if (child != null) sim.Emit("REINFORCEMENT", child, "Egg Sac broodling", b.id);
            }
        }
    }
}
