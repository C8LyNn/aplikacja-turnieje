using System.Collections.Generic;
using CoreClash.Core;
using UnityEngine;

namespace CoreClash.Presentation
{
    // CC-001 W24: game feel. Presentation only. Every effect starts from something the
    // simulation really did: a GameEvent (damage, heal, explosion, death, return, swap,
    // portal, rewind, pull, freeze ...) or a real change of a ball's velocity (a contact).
    // Nothing here writes to the simulation, and nothing is spawned for plain movement.
    //
    //   particles  small pooled sprites in arena units (540 x 900), drawn by Render()
    //   effects    a few procedural shapes: shock rings, streaks, converging rings, swirls
    //   tracks     per-ball memory for the body: hit pop, lost-HP flash, arrival pop
    //
    // Reduced motion (Settings in the menu, saved in PlayerPrefs) keeps the information
    // (numbers, rings, state marks) and drops particles, shake, squash and long trails.
    public static class Fx
    {
        const string PrefKey = "cc.reducedMotion";
        public static bool ReducedMotion { get; private set; }
        static bool loaded;
        public static void Load() { if (loaded) return; loaded = true; ReducedMotion = PlayerPrefs.GetInt(PrefKey, 0) == 1; }
        public static void SetReducedMotion(bool value)
        {
            ReducedMotion = value; loaded = true;
            PlayerPrefs.SetInt(PrefKey, value ? 1 : 0); PlayerPrefs.Save();
            if (value) { particleCount = 0; shakeUntil = 0; }
            Debug.Log("CORE_CLASH_REDUCED_MOTION " + value);
        }

        // ---- shapes used by particles (same mini-language as Glyphs) ----
        public const string Shard = "+P 0 -1 .46 0 0 1 -.46 0";
        public const string Star = "+P 0 -1 .24 0 0 1 -.24 0;+P -1 0 0 -.24 1 0 0 .24";
        public const string Plus = "+L 0 -.62 0 .62 .46;+L -.62 0 .62 0 .46";
        public const string Bubble = "+R 0 0 .74 .3";
        public const string Flame = "+C 0 .34 .5;+P -.1 -.98 .46 .2 -.48 .24";
        public const string Snow = "+L -.85 0 .85 0 .24;+L -.43 -.74 .43 .74 .24;+L .43 -.74 -.43 .74 .24";
        public const string Chevron = "+L -.7 .45 0 -.45 .34;+L 0 -.45 .7 .45 .34";
        static readonly Color Spark = new Color(1, .86f, .28f), Volt = new Color(1f, .9f, .2f), Magnetic = new Color(.24f, .3f, .92f);
        public const string Confetti = "+P -.9 -.4 .9 -.4 .9 .4 -.9 .4";

        struct Particle
        {
            public float x, y, vx, vy, born, life, size, grow, gravity, drag;
            public Color color;
            public string spec; // null = round dot
            public bool screen; // true = HUD space (confetti), false = arena units
        }
        const int MaxParticles = 320;
        static Particle[] particles = new Particle[MaxParticles];
        static int particleCount;

        enum Shape { Shock, Flash, Streak, Converge, Swirl, Column, Ripple, Bolt, Burst }
        struct Effect
        {
            public Shape shape; public float x, y, x2, y2, born, life, radius; public Color color; public int seed;
        }
        const int MaxEffects = 48;
        static Effect[] effects = new Effect[MaxEffects];
        static int effectCount;

        sealed class Track
        {
            public float x, y, vx, vy, hitAt = -9, healAt = -9, lostAt = -9, bornAt = -9, absorbAt = -9, hitStrength;
            public int hp, lostFrom, stamp; public bool moving;
        }
        static Dictionary<int, Track> tracks = new Dictionary<int, Track>();
        static readonly List<int> stale = new List<int>();
        // Where a ball last hit the wall of a base it hurts: the shards of that base fly from there.
        static float lastScoreX, lastScoreAt = -1;
        static GameState seen;
        static int cursor = -1, stamp;
        static float lastTick = -1, stepTime, shakeUntil, shakeStrength, emberClock;
        static uint random = 0x9e3779b9;

        // W24: effect state for a board that is not the match (the show on a ball card). Swap() puts
        // this state in place of the match's; a second Swap() puts the match's state back. Between
        // the two calls every Fx function works on the show only.
        public sealed class Stage
        {
            Particle[] heldParticles = new Particle[MaxParticles]; Effect[] heldEffects = new Effect[MaxEffects];
            Dictionary<int, Track> heldTracks = new Dictionary<int, Track>();
            GameState heldSeen; int heldParticleCount, heldEffectCount, heldCursor = -1, heldStamp;
            float heldLastTick = -1, heldStepTime, heldShakeUntil, heldShakeStrength, heldEmberClock;
            public void Swap()
            {
                (particles, heldParticles) = (heldParticles, particles); (effects, heldEffects) = (heldEffects, effects);
                (tracks, heldTracks) = (heldTracks, tracks); (seen, heldSeen) = (heldSeen, seen);
                (particleCount, heldParticleCount) = (heldParticleCount, particleCount); (effectCount, heldEffectCount) = (heldEffectCount, effectCount);
                (cursor, heldCursor) = (heldCursor, cursor); (stamp, heldStamp) = (heldStamp, stamp);
                (lastTick, heldLastTick) = (heldLastTick, lastTick); (stepTime, heldStepTime) = (heldStepTime, stepTime);
                (shakeUntil, heldShakeUntil) = (heldShakeUntil, shakeUntil); (shakeStrength, heldShakeStrength) = (heldShakeStrength, shakeStrength);
                (emberClock, heldEmberClock) = (heldEmberClock, emberClock);
            }
        }

        static float Rand() { random ^= random << 13; random ^= random >> 17; random ^= random << 5; return (random & 0xffffff) / 16777216f; }
        static float Rand(float from, float to) => from + (to - from) * Rand();

        public static void Reset() { particleCount = effectCount = 0; tracks.Clear(); seen = null; cursor = -1; shakeUntil = 0; }

        // ---------------------------------------------------------------- director
        // Call once per frame with the state being shown. Reads events past the cursor and
        // compares every ball with what it looked like on the previous call.
        public static void Observe(GameSimulation simulation, float now)
        {
            Load();
            var state = simulation?.State;
            if (state == null) return;
            if (!ReferenceEquals(state, seen) && (seen == null || state.eventSerial < cursor || state.turnNumber < 2 && cursor > state.eventSerial))
            {
                Reset();
            }
            bool first = cursor < 0 || state.eventSerial < cursor;
            if (first) { Reset(); cursor = state.eventSerial; }
            seen = state;
            stamp++;

            // Contacts first, from the velocity each ball had on the previous call.
            foreach (var ball in state.balls)
            {
                if (ball == null || ball.dead || ball.banished) continue;
                if (!tracks.TryGetValue(ball.id, out var track))
                {
                    track = new Track { x = ball.x, y = ball.y, vx = ball.vx, vy = ball.vy, hp = ball.hp, moving = ball.moving, bornAt = first ? -9 : now };
                    tracks[ball.id] = track;
                }
                else
                {
                    float dvx = ball.vx - track.vx, dvy = ball.vy - track.vy, change = Mathf.Sqrt(dvx * dvx + dvy * dvy);
                    float jump = (ball.x - track.x) * (ball.x - track.x) + (ball.y - track.y) * (ball.y - track.y);
                    // A real contact changes velocity sharply without moving the ball far in one frame.
                    if (change > 110 && jump < 60 * 60 && (ball.moving || track.moving)) Contact(state, ball, dvx, dvy, change, now);
                    if (ball.hp < track.hp) { track.lostFrom = track.hp; track.lostAt = now; }
                    else if (ball.hp > track.hp) track.healAt = now;
                }
                track.stamp = stamp;
            }

            foreach (var e in state.events)
            {
                if (e == null || e.id <= cursor) continue;
                BallRuntime ball = null, other = null;
                foreach (var candidate in state.balls)
                {
                    if (candidate == null) continue;
                    if (candidate.id == e.ballId) ball = candidate; else if (e.otherId > 0 && candidate.id == e.otherId) other = candidate;
                }
                React(simulation, e, ball, other, now);
            }
            cursor = state.eventSerial;

            stale.Clear();
            foreach (var pair in tracks)
            {
                var track = pair.Value;
                if (track.stamp != stamp) { stale.Add(pair.Key); continue; }
            }
            foreach (int id in stale) tracks.Remove(id);
            foreach (var ball in state.balls)
            {
                if (ball == null || !tracks.TryGetValue(ball.id, out var track)) continue;
                track.x = ball.x; track.y = ball.y; track.vx = ball.vx; track.vy = ball.vy; track.hp = ball.hp; track.moving = ball.moving;
            }

            // Burning balls shed a few embers; frozen ones a little frost. Rate-limited, real state only.
            if (!ReducedMotion && now - emberClock > .09f)
            {
                emberClock = now;
                foreach (var ball in state.balls)
                {
                    if (ball == null || ball.dead || ball.banished) continue;
                    if (ball.fireStacks > 0 && Rand() < .28f + .12f * ball.fireStacks)
                        Add(ball.x + Rand(-.6f, .6f) * ball.radius, ball.y - ball.radius * Rand(.2f, .9f), Rand(-14, 14), Rand(-70, -38), Rand(.45f, .8f), Rand(4.5f, 7.5f), Color.Lerp(Theme.Status(StatusKind.Fire), new Color(1, .86f, .3f), Rand()), Flame, 0, .6f, -.5f);
                    if (ball.toxinTurns > 0 && Rand() < .16f)
                        Add(ball.x + Rand(-.8f, .8f) * ball.radius, ball.y - ball.radius * Rand(.1f, .8f), Rand(-8, 8), Rand(-42, -24), Rand(.6f, .95f), Rand(4, 7), Theme.A(Theme.Status(StatusKind.Toxin), .9f), Bubble, 0, .4f, .25f);
                    if (ball.frozen > 0 && Rand() < .14f)
                        Add(ball.x + Rand(-1, 1) * ball.radius, ball.y + Rand(-1, 1) * ball.radius, Rand(-8, 8), Rand(6, 22), Rand(.5f, .9f), Rand(3.5f, 6), Theme.A(Color.white, .95f), Star, 0, .5f, -.2f);
                }
            }
        }

        static Color BallColor(GameSimulation simulation, BallRuntime ball)
        {
            var definition = ball == null ? null : simulation.Catalog.Ball(ball.type);
            return definition == null || string.IsNullOrEmpty(definition.color) ? Color.white : Draw.Hex(definition.color);
        }

        // A sharp velocity change: sparks at the touching point, sized by how hard it was.
        static void Contact(GameState state, BallRuntime ball, float dvx, float dvy, float change, float now)
        {
            float strength = Mathf.Clamp01((change - 110) / 900f);
            float cx = ball.x, cy = ball.y; bool pair = false;
            foreach (var other in state.balls)
            {
                if (other == null || other == ball || other.dead || other.banished) continue;
                float dx = other.x - ball.x, dy = other.y - ball.y, reach = other.radius + ball.radius + 7;
                if (dx * dx + dy * dy > reach * reach) continue;
                // Both balls of a pair notice the same contact: the lower id draws it.
                if (other.id < ball.id && tracks.TryGetValue(other.id, out var seenOther) && (Mathf.Abs(other.vx - seenOther.vx) + Mathf.Abs(other.vy - seenOther.vy)) > 110) return;
                float t = ball.radius / (ball.radius + other.radius);
                cx = ball.x + dx * t; cy = ball.y + dy * t; pair = true; break;
            }
            if (!pair)
            {
                float length = Mathf.Max(1, change);
                cx = ball.x - dvx / length * ball.radius; cy = ball.y - dvy / length * ball.radius;
            }
            Push(Shape.Flash, cx, cy, cx, cy, now, .16f + .08f * strength, 13 + 24 * strength, Spark, ball.id);
            if (strength > .4f) Push(Shape.Ripple, cx, cy, cx, cy, now, .3f + .1f * strength, 16 + 26 * strength, Color.white, ball.id);
            if (ReducedMotion) return;
            int count = 2 + Mathf.RoundToInt(9 * strength);
            for (int i = 0; i < count; i++)
            {
                float angle = Rand(0, Mathf.PI * 2), speed = Rand(60, 150) + 240 * strength * Rand();
                Add(cx, cy, Mathf.Cos(angle) * speed, Mathf.Sin(angle) * speed, Rand(.22f, .42f), Rand(4, 6) + 4 * strength, i % 3 == 0 ? Theme.Threat : Theme.Select, i % 2 == 0 ? Star : null, 0, 3.2f, -.6f);
            }
        }

        static void React(GameSimulation simulation, GameEvent e, BallRuntime ball, BallRuntime other, float now)
        {
            float x = ball != null && e.kind != "DEATH" ? ball.x : e.x, y = ball != null && e.kind != "DEATH" ? ball.y : e.y;
            tracks.TryGetValue(e.ballId, out var track);
            switch (e.kind)
            {
                case "DAMAGE":
                    if (e.text == "Shield") { if (track != null) track.absorbAt = now; Push(Shape.Ripple, x, y, x, y, now, .4f, (ball?.radius ?? 17) + 20, Theme.Shield, e.id); Burst(x, y, 5, Theme.Shield, Shard, 40, 110, .4f, 5); }
                    else
                    {
                        if (track != null) { track.hitAt = now; track.hitStrength = Mathf.Max(track.hitStrength, Mathf.Clamp01(.35f + FeedbackStyle.Amount(e.text) / 20f)); }
                        Burst(x, y, 3 + Mathf.Min(7, FeedbackStyle.Amount(e.text) / 2), Theme.Damage, null, 50, 150, .36f, 4.5f);
                    }
                    break;
                case "HEAL":
                    if (track != null) track.healAt = now;
                    Push(Shape.Converge, x, y, x, y, now, .5f, (ball?.radius ?? 17) + 26, Theme.Heal, e.id);
                    Rise(x, y, ball?.radius ?? 17, 5, Theme.Heal, Plus, 7);
                    break;
                case "SHIELD": case "DIVINE_SHIELD":
                    Push(Shape.Converge, x, y, x, y, now, .45f, (ball?.radius ?? 17) + 24, Theme.Shield, e.id);
                    Rise(x, y, ball?.radius ?? 17, 3, Theme.Shield, Shard, 6);
                    break;
                case "DEATH":
                {
                    // Break-up in the ball's own colour, plus a pale ghost ring where it stood.
                    Color colour = BallColor(simulation, ball);
                    float radius = ball?.radius ?? 17;
                    Push(Shape.Shock, x, y, x, y, now, .5f, radius + 34, Theme.A(colour, .9f), e.id);
                    Push(Shape.Flash, x, y, x, y, now, .22f, radius * 1.7f, Color.Lerp(colour, Color.white, .5f), e.id);
                    if (!ReducedMotion)
                    {
                        for (int i = 0; i < 14; i++)
                        {
                            float angle = i * Mathf.PI * 2 / 14 + Rand(-.2f, .2f), speed = Rand(70, 230);
                            Add(x + Mathf.Cos(angle) * radius * .5f, y + Mathf.Sin(angle) * radius * .5f, Mathf.Cos(angle) * speed, Mathf.Sin(angle) * speed, Rand(.45f, .8f), Rand(4, 8.5f), i % 4 == 0 ? Color.white : Color.Lerp(colour, Color.white, Rand(0, .35f)), i % 2 == 0 ? Shard : null, 260, 2.2f, -.7f);
                        }
                        for (int i = 0; i < 5; i++) Add(x + Rand(-8, 8), y + Rand(-8, 8), Rand(-18, 18), Rand(-46, -20), Rand(.6f, 1f), Rand(10, 17), Theme.A(Color.Lerp(colour, Color.white, .6f), .5f), null, 0, .8f, .9f);
                    }
                    break;
                }
                case "RETURN": case "REINFORCEMENT": case "HATCH": case "CLONE": case "SPLIT": case "MITOSIS": case "SWARM":
                {
                    // Arrival: a light column and rings closing on the spot, then a gold sparkle.
                    Color colour = e.kind == "RETURN" ? Theme.Select : BallColor(simulation, ball);
                    float radius = ball?.radius ?? 17;
                    if (track != null) track.bornAt = now;
                    Push(Shape.Converge, x, y, x, y, now, .5f, radius + 40, colour, e.id);
                    Burst(x, y, e.kind == "RETURN" ? 10 : 6, Color.Lerp(colour, Color.white, .3f), Star, 40, 130, .6f, 6);
                    break;
                }
                case "EXPLOSION": case "SOULBURST": case "VIRULENCE_BURST": case "FIRE_BURST":
                {
                    Color colour = e.kind == "SOULBURST" ? new Color(.69f, .45f, 1f) : e.kind == "VIRULENCE_BURST" ? Theme.Status(StatusKind.Toxin) : e.kind == "FIRE_BURST" ? Theme.Status(StatusKind.Fire) : Theme.Threat;
                    float size = e.kind == "EXPLOSION" ? Theme.ExplosionRadius : 84;
                    Push(Shape.Flash, x, y, x, y, now, .3f, size * .7f, Color.Lerp(colour, Spark, .6f), e.id);
                    Push(Shape.Shock, x, y, x, y, now, .55f, size, colour, e.id);
                    // A blast opens with a starburst: the one shape that says "explosion" at a glance.
                    if (e.kind == "EXPLOSION") Push(Shape.Burst, x, y, x, y, now, .3f, size * .56f, Color.Lerp(colour, Spark, .75f), e.id);
                    Shake(now, .22f, e.kind == "EXPLOSION" ? 3.5f : 2f);
                    if (ReducedMotion) break;
                    for (int i = 0; i < 22; i++)
                    {
                        float angle = i * Mathf.PI * 2 / 22 + Rand(-.15f, .15f), speed = Rand(120, 420);
                        Color tint = i % 5 == 0 ? Theme.Damage : i % 2 == 0 ? colour : Color.Lerp(colour, Spark, .7f);
                        Add(x, y, Mathf.Cos(angle) * speed, Mathf.Sin(angle) * speed, Rand(.35f, .75f), Rand(4.5f, 9), tint, i % 3 == 0 ? Star : null, 120, 2.6f, -.75f);
                    }
                    for (int i = 0; i < 6; i++) Add(x + Rand(-22, 22), y + Rand(-22, 22), Rand(-26, 26), Rand(-50, -12), Rand(.7f, 1.15f), Rand(18, 30), new Color(.3f, .32f, .5f, .4f), null, 0, 1.2f, .8f);
                    break;
                }
                case "FIREBRAND":
                    // The Volcano: a ring of fire as wide as its reach, flames thrown up from it.
                    Push(Shape.Flash, x, y, x, y, now, .26f, (ball?.radius ?? 17) * 2.2f, Color.Lerp(Theme.Status(StatusKind.Fire), Spark, .5f), e.id);
                    Push(Shape.Shock, x, y, x, y, now, .55f, 100, Theme.Status(StatusKind.Fire), e.id);
                    Burst(x, y, 14, Theme.Status(StatusKind.Fire), Flame, 90, 260, .6f, 9, -120);
                    Shake(now, .16f, 1.6f);
                    break;
                case "FIRE": case "BONFIRE": case "ASHCORE":
                    Burst(x, y - (ball?.radius ?? 17) * .4f, 7, Theme.Status(StatusKind.Fire), Flame, 30, 110, .55f, 8, -90);
                    Push(Shape.Ripple, x, y, x, y, now, .4f, (ball?.radius ?? 17) + 20, Theme.Status(StatusKind.Fire), e.id);
                    break;
                case "ICE": case "FROSTGUARD": case "ICE_CHAIN": case "CHAINFROST":
                    Burst(x, y, 6, Theme.Status(StatusKind.Ice), Snow, 26, 90, .6f, 7.5f);
                    Push(Shape.Ripple, x, y, x, y, now, .4f, (ball?.radius ?? 17) + 20, Theme.Status(StatusKind.Ice), e.id);
                    break;
                case "FREEZE": case "SHATTER":
                {
                    Color ice = Theme.Status(StatusKind.Frozen);
                    Push(Shape.Flash, x, y, x, y, now, .24f, (ball?.radius ?? 17) * 2f, ice, e.id);
                    Push(Shape.Shock, x, y, x, y, now, .45f, (ball?.radius ?? 17) + 30, ice, e.id);
                    if (!ReducedMotion)
                        for (int i = 0; i < 12; i++)
                        {
                            float angle = i * Mathf.PI * 2 / 12 + Rand(-.2f, .2f), speed = e.kind == "SHATTER" ? Rand(110, 260) : Rand(50, 150);
                            Add(x + Mathf.Cos(angle) * 10, y + Mathf.Sin(angle) * 10, Mathf.Cos(angle) * speed, Mathf.Sin(angle) * speed, Rand(.4f, .75f), Rand(5, 9.5f), i % 3 == 0 ? Color.white : Color.Lerp(ice, Theme.Status(StatusKind.Ice), Rand()), Shard, e.kind == "SHATTER" ? 240 : 40, 2.4f, -.6f);
                        }
                    break;
                }
                case "TOXIN": case "VENOM":
                    Burst(x, y, 6, Theme.Status(StatusKind.Toxin), Bubble, 24, 80, .7f, 7, -40);
                    Push(Shape.Ripple, x, y, x, y, now, .4f, (ball?.radius ?? 17) + 20, Theme.Status(StatusKind.Toxin), e.id);
                    break;
                case "ROOTED":
                    Push(Shape.Converge, x, y, x, y, now, .4f, (ball?.radius ?? 17) + 22, Theme.Status(StatusKind.Rooted), e.id);
                    break;
                case "CLEANSE":
                    Push(Shape.Ripple, x, y, x, y, now, .5f, (ball?.radius ?? 17) + 30, Color.white, e.id);
                    Rise(x, y, ball?.radius ?? 17, 6, Color.white, Star, 6);
                    break;
                case "ARMED": case "FUSE":
                    // Warning: two quick hazard rings, the standing threat ring stays on the ball.
                    Push(Shape.Shock, x, y, x, y, now, .35f, (ball?.radius ?? 17) + 26, Theme.Threat, e.id);
                    break;
                case "DISARM":
                    Push(Shape.Converge, x, y, x, y, now, .4f, (ball?.radius ?? 17) + 26, Theme.Muted, e.id);
                    break;
                // W24 six groups. A bolt runs from the ball that sent it (from above for a trap) into the target.
                case "ZAP":
                {
                    float reach = ball?.radius ?? 17;
                    if (other != null) Push(Shape.Bolt, other.x, other.y, x, y, now, .6f, reach, Volt, e.id);
                    else Push(Shape.Bolt, x + 26, y - 96, x, y, now, .6f, reach, Volt, e.id);
                    Push(Shape.Flash, x, y, x, y, now, .2f, reach * 1.9f, Volt, e.id);
                    Burst(x, y, 6, Volt, Star, 60, 180, .34f, 5);
                    break;
                }
                case "DISCHARGE":
                    Push(Shape.Shock, x, y, x, y, now, .45f, AbilityResolver.DischargeRange, Volt, e.id);
                    break;
                case "CHARGE":
                    Push(Shape.Converge, x, y, x, y, now, .45f, (ball?.radius ?? 17) + 24, Volt, e.id);
                    break;
                case "JAM":
                    Push(Shape.Converge, x, y, x, y, now, .45f, (ball?.radius ?? 17) + 26, Theme.Muted, e.id);
                    Burst(x, y, 5, Volt, Star, 40, 120, .4f, 5);
                    break;
                case "JAM_EXPIRED":
                    Push(Shape.Ripple, x, y, x, y, now, .45f, (ball?.radius ?? 17) + 22, Volt, e.id);
                    break;
                case "GROW":
                    Push(Shape.Ripple, x, y, x, y, now, .5f, (ball?.radius ?? 17) + 26, Theme.Heal, e.id);
                    Rise(x, y, ball?.radius ?? 17, 5, Theme.Heal, Plus, 7);
                    break;
                case "THORNS":
                    Burst(x, y, 7, Theme.Heal, Shard, 70, 190, .36f, 6);
                    break;
                case "DASH":
                    Push(Shape.Shock, x, y, x, y, now, .3f, (ball?.radius ?? 17) + 22, Theme.Info, e.id);
                    if (other != null) Push(Shape.Streak, x, y, other.x, other.y, now, .45f, -(ball?.radius ?? 17), Theme.Info, e.id + 3);
                    break;
                case "MAGNET":
                    // Two rings close in on the Magnet from the edge of its reach.
                    Push(Shape.Converge, x, y, x, y, now, .5f, 165, Magnetic, e.id);
                    Push(Shape.Converge, x, y, x, y, now + .14f, .5f, 165, Magnetic, e.id + 1);
                    break;
                case "PULSE":
                    // One ring runs out from the Pulse to the edge of its reach.
                    Push(Shape.Flash, x, y, x, y, now, .2f, (ball?.radius ?? 17) * 1.8f, Magnetic, e.id);
                    Push(Shape.Shock, x, y, x, y, now, .5f, 165, Magnetic, e.id);
                    break;
                case "ANCHOR":
                    Push(Shape.Shock, x, y, x, y, now, .3f, (ball?.radius ?? 17) + 20, Theme.Ink, e.id);
                    Shake(now, .12f, 1.2f);
                    break;
                case "SPORES":
                    Push(Shape.Shock, x, y, x, y, now, .6f, 100, Theme.Status(StatusKind.Toxin), e.id);
                    Burst(x, y, 16, Theme.Status(StatusKind.Toxin), Bubble, 50, 190, .8f, 8, -30);
                    break;
                case "BLOOM":
                    Push(Shape.Ripple, x, y, x, y, now, .6f, AbilityResolver.BloomRange, Theme.Heal, e.id);
                    break;
                case "TRAP_TRIGGER":
                {
                    // The trap goes off in the colour of what it holds.
                    string trap = e.text ?? "";
                    Color tone = trap.StartsWith("ember") ? Theme.Status(StatusKind.Fire) : trap.StartsWith("frost") ? Theme.Status(StatusKind.Ice) : trap.StartsWith("spore") ? Theme.Status(StatusKind.Toxin) : trap.StartsWith("shock") ? Volt : Theme.Threat;
                    Push(Shape.Flash, x, y, x, y, now, .2f, 30, Color.Lerp(tone, Color.white, .4f), e.id);
                    Push(Shape.Shock, x, y, x, y, now, .4f, 46, tone, e.id);
                    Burst(x, y, 8, tone, Star, 60, 170, .45f, 6);
                    break;
                }
                case "SWAP":
                {
                    // Both balls already stand on each other's place: one arc each way, in the two team colours.
                    if (ball == null || other == null) break;
                    Push(Shape.Streak, other.x, other.y, ball.x, ball.y, now, .5f, ball.radius, Theme.Team(ball.owner), e.id);
                    Push(Shape.Streak, ball.x, ball.y, other.x, other.y, now, .5f, other.radius, Theme.Team(other.owner), e.id + 7);
                    if (tracks.TryGetValue(ball.id, out var a)) a.bornAt = now;
                    if (tracks.TryGetValue(other.id, out var b)) b.bornAt = now;
                    break;
                }
                case "TELEPORT": case "PORTAL":
                {
                    // Entry is where the ball was on the previous frame, exit is where it is now.
                    Color colour = e.kind == "PORTAL" ? new Color(.62f, .42f, 1f) : Theme.Info;
                    float radius = ball?.radius ?? 17;
                    if (track != null && ball != null && (track.x - ball.x) * (track.x - ball.x) + (track.y - ball.y) * (track.y - ball.y) > 30 * 30)
                    {
                        Push(Shape.Ripple, track.x, track.y, track.x, track.y, now, .4f, radius + 22, colour, e.id);
                        Push(Shape.Streak, track.x, track.y, ball.x, ball.y, now, .42f, radius, colour, e.id);
                    }
                    Push(Shape.Ripple, x, y, x, y, now + .08f, .4f, radius + 22, colour, e.id + 5);
                    if (track != null) track.bornAt = now + .05f;
                    break;
                }
                case "REWIND":
                {
                    // Rewind: a ghost trail back to the saved place and rings turning backwards.
                    float radius = ball?.radius ?? 17;
                    if (track != null && ball != null) Push(Shape.Streak, track.x, track.y, ball.x, ball.y, now, .6f, radius, Theme.Select, e.id);
                    Push(Shape.Converge, x, y, x, y, now, .5f, radius + 36, Theme.Select, e.id);
                    Rise(x, y, radius, 6, Theme.Select, Star, 6);
                    if (track != null) track.bornAt = now;
                    break;
                }
                case "SAVE":
                    Push(Shape.Ripple, x, y, x, y, now, .5f, (ball?.radius ?? 17) + 22, Theme.Select, e.id);
                    break;
                case "PULL":
                {
                    // Pull: chevrons run ahead of the pulled ball along its real new velocity.
                    if (ball == null) break;
                    float speed = Mathf.Sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                    if (speed < 20) { Push(Shape.Converge, x, y, x, y, now, .4f, ball.radius + 24, Theme.Info, e.id); break; }
                    float reach = Mathf.Min(150, 40 + speed * .16f);
                    Push(Shape.Streak, x, y, x + ball.vx / speed * reach, y + ball.vy / speed * reach, now, .5f, -ball.radius, Theme.Info, e.id);
                    break;
                }
                case "RAM": case "SLINGSHOT": case "BOUNCE":
                    Push(Shape.Shock, x, y, x, y, now, .35f, (ball?.radius ?? 17) + 30, Theme.Select, e.id);
                    Burst(x, y, 8, Theme.Select, Star, 80, 220, .4f, 6);
                    break;
                case "COPY": case "TRANSFORM": case "IDENTITY": case "OWNERSHIP": case "UPGRADE": case "VETERAN": case "ECHO": case "SIGNATURE":
                    Push(Shape.Ripple, x, y, x, y, now, .45f, (ball?.radius ?? 17) + 22, Theme.Info, e.id);
                    if (track != null) track.bornAt = now;
                    break;
                case "WALL_HIT": case "WALL_TOUCH":
                {
                    // W24 (owner direction: show bounces): a ring spreads from the point of the wall the
                    // ball met - red on the wall of the base it has just hurt, white on any other.
                    if (ball == null) break;
                    float wx = x, wy = y; string side = e.text;
                    if (side == "left") wx = CoreClash.Physics.ZoneResolver.Left; else if (side == "right") wx = CoreClash.Physics.ZoneResolver.Right; else if (side == "top") wy = 16; else if (side == "bottom") wy = 884;
                    bool hard = e.kind == "WALL_HIT", scores = (side == "top" && ball.owner == 0) || (side == "bottom" && ball.owner == 1);
                    Push(Shape.Shock, wx, wy, wx, wy, now, hard ? .34f : .24f, hard ? ball.radius + 26 : ball.radius + 10, scores ? Theme.Damage : Color.white, e.id);
                    if (scores) { lastScoreX = wx; lastScoreAt = now; }
                    break;
                }
                case "BASE_DAMAGE":
                {
                    int owner = e.text != null && e.text.StartsWith("P1") ? 0 : 1;
                    float wall = owner == 0 ? 884 : 16;
                    Shake(now, .22f, 3.5f);
                    if (ReducedMotion) break;
                    for (int i = 0; i < 18; i++)
                        Add(lastScoreAt == now ? Mathf.Clamp(lastScoreX + Rand(-70, 70), 30, 510) : Rand(40, 500), wall, Rand(-60, 60), (owner == 0 ? -1 : 1) * Rand(60, 220), Rand(.4f, .8f), Rand(4, 8), i % 3 == 0 ? Color.white : Theme.Damage, i % 2 == 0 ? Shard : null, 0, 2.2f, -.6f);
                    break;
                }
                case "STRUCTURE_HIT": case "STRUCTURE_BREAK":
                    Burst(e.x, e.y, e.kind == "STRUCTURE_BREAK" ? 12 : 5, Theme.TextSoft, Shard, 60, 180, .5f, 6);
                    break;
            }
        }

        // ---------------------------------------------------------------- spawners
        // W24 (owner direction: few effects, minimal and clean): nothing is scattered over the arena.
        // An event is answered by one plain shape - a ring, a flash or a streak. Only the result
        // screen keeps its confetti, which is drawn in screen space.
        static void Add(float x, float y, float vx, float vy, float life, float size, Color color, string spec, float gravity, float drag, float grow, bool screen = false)
        {
            if (ReducedMotion || !screen) return;
            int slot = particleCount < MaxParticles ? particleCount++ : (int)(Rand() * MaxParticles) % MaxParticles;
            particles[slot] = new Particle { x = x, y = y, vx = vx, vy = vy, born = Time.unscaledTime, life = life, size = size, grow = grow, gravity = gravity, drag = drag, color = color, spec = spec, screen = screen };
        }
        static void Burst(float x, float y, int count, Color color, string spec, float slow, float fast, float life, float size, float lift = 0)
        {
            if (ReducedMotion) return;
            for (int i = 0; i < count; i++)
            {
                float angle = Rand(0, Mathf.PI * 2), speed = Rand(slow, fast);
                Add(x, y, Mathf.Cos(angle) * speed, Mathf.Sin(angle) * speed + lift, life * Rand(.7f, 1.2f), size * Rand(.75f, 1.25f), i % 4 == 0 ? Color.Lerp(color, Color.white, .6f) : color, spec, 0, 2.4f, -.55f);
            }
        }
        static void Rise(float x, float y, float radius, int count, Color color, string spec, float size)
        {
            if (ReducedMotion) return;
            for (int i = 0; i < count; i++)
                Add(x + Rand(-1, 1) * radius, y + Rand(-.4f, .8f) * radius, Rand(-10, 10), Rand(-78, -40), Rand(.55f, .95f), size * Rand(.8f, 1.3f), color, spec, 0, .7f, -.35f);
        }
        static void Push(Shape shape, float x, float y, float x2, float y2, float born, float life, float radius, Color color, int seed)
        {
            int slot = effectCount < MaxEffects ? effectCount++ : 0;
            effects[slot] = new Effect { shape = shape, x = x, y = y, x2 = x2, y2 = y2, born = born, life = life, radius = radius, color = color, seed = seed };
        }
        static void Shake(float now, float time, float strength)
        {
            if (ReducedMotion) return;
            shakeUntil = now + time; shakeStrength = Mathf.Max(shakeStrength * (shakeUntil > now ? 1 : 0), strength);
        }
        // Small board offset in board pixels; zero when calm or in reduced motion.
        public static Vector2 ShakeOffset(float now, float scale)
        {
            if (ReducedMotion || now >= shakeUntil) { shakeStrength = 0; return Vector2.zero; }
            float left = Mathf.Clamp01((shakeUntil - now) / .28f), amount = shakeStrength * left * scale;
            return new Vector2(Mathf.Sin(now * 71f) * amount, Mathf.Cos(now * 83f) * amount * .8f);
        }

        // Screen-space confetti for the result card (HUD units, y down).
        public static void Celebrate(Rect area, Color a, Color b)
        {
            if (ReducedMotion) return;
            Color[] palette = { a, b, Theme.Select, Color.white, Theme.Heal };
            for (int i = 0; i < 70; i++)
                Add(area.x + Rand(0, area.width), area.y - Rand(0, 60), Rand(-40, 40), Rand(60, 190), Rand(1.6f, 2.8f), Rand(7, 12), palette[i % palette.Length], i % 3 == 0 ? Star : Confetti, 90, .3f, 0, true);
        }

        // ---------------------------------------------------------------- per-ball body cues
        // Scale of the ball body: a short squash-and-settle after a hit, a pop when it arrives.
        public static float BodyScale(int ballId, float now)
        {
            if (ReducedMotion || !tracks.TryGetValue(ballId, out var track)) return 1;
            float scale = 1, age = now - track.hitAt;
            if (age >= 0 && age < .34f) { float t = age / .34f; scale += Mathf.Sin(t * Mathf.PI * 3) * (1 - t) * (.07f + .1f * track.hitStrength); }
            age = now - track.bornAt;
            if (age >= 0 && age < .3f) { float t = age / .3f; scale *= .55f + .45f * (1 + 2.2f * Mathf.Pow(t - 1, 3) + 1.2f * Mathf.Pow(t - 1, 2)) ; }
            else if (age < 0 && age > -.2f) scale *= .55f;
            return Mathf.Clamp(scale, .4f, 1.35f);
        }
        // White flash over the body right after it lost HP (0..1).
        public static float HitFlash(int ballId, float now)
        {
            if (!tracks.TryGetValue(ballId, out var track)) return 0;
            float age = now - track.lostAt;
            return age >= 0 && age < .1f ? 1 - age / .1f : 0;
        }
        public static float HealGlow(int ballId, float now)
        {
            if (!tracks.TryGetValue(ballId, out var track)) return 0;
            float age = now - track.healAt;
            return age >= 0 && age < .5f ? 1 - age / .5f : 0;
        }
        public static float AbsorbGlow(int ballId, float now)
        {
            if (!tracks.TryGetValue(ballId, out var track)) return 0;
            float age = now - track.absorbAt;
            return age >= 0 && age < .4f ? 1 - age / .4f : 0;
        }
        // HP the ball had before its latest loss, while the lost ring segments are still flashing.
        public static bool LostHp(int ballId, float now, out int from, out float fade)
        {
            from = 0; fade = 0;
            if (!tracks.TryGetValue(ballId, out var track)) return false;
            float age = now - track.lostAt;
            if (age < 0 || age >= .18f) return false;
            from = track.lostFrom; fade = 1 - age / .18f; return true;
        }

        // ---------------------------------------------------------------- drawing
        static Vector2 View(Rect board, int viewOwner, float x, float y)
        {
            float scale = board.width / 540f;
            return new Vector2(board.x + x * scale, board.y + (viewOwner == 1 ? 900 - y : y) * scale);
        }

        // Shapes under the balls (shock rings, streaks). Arena units -> board view.
        public static void RenderUnder(Rect board, int viewOwner, float now)
        {
            float scale = board.width / 540f, strength = Theme.EffectStrength;
            if (strength <= 0) return;
            for (int i = effectCount - 1; i >= 0; i--)
            {
                var e = effects[i]; float age = now - e.born;
                if (age >= e.life) { effects[i] = effects[--effectCount]; continue; }
                if (age < 0) continue;
                float t = age / e.life; var at = View(board, viewOwner, e.x, e.y);
                switch (e.shape)
                {
                    case Shape.Shock:
                    {
                        float ease = 1 - (1 - t) * (1 - t), radius = (e.radius * (.2f + .8f * ease)) * scale;
                        if (t < .5f) Draw.Circle(new Rect(at.x - radius, at.y - radius, radius * 2, radius * 2), Theme.A(e.color, (.5f - t) * .5f * strength));
                        Draw.Ring(at, radius, Theme.A(e.color, (1 - t) * .95f * strength), Mathf.Max(2, (7 * (1 - t) + 1.5f) * scale));
                        Draw.Ring(at, radius + 3f * scale, Theme.A(Theme.Ink, (1 - t) * .9f * strength), Mathf.Max(1.5f, 2.4f * scale));
                        break;
                    }
                    case Shape.Ripple:
                    {
                        float radius = (e.radius * (.45f + .55f * t)) * scale;
                        Draw.Ring(at, radius, Theme.A(e.color, (1 - t) * .85f * strength), Mathf.Max(1.5f, 3.2f * (1 - t * .6f) * scale));
                        break;
                    }
                    case Shape.Converge:
                    {
                        float radius = (e.radius * (1 - .62f * t)) * scale;
                        Draw.Ring(at, radius, Theme.A(e.color, Mathf.Min(1, t * 4) * (1 - t * .55f) * strength), Mathf.Max(1.5f, 3 * scale), 10, .7f);
                        Draw.Ring(at, radius * .78f, Theme.A(e.color, Mathf.Min(1, t * 4) * (1 - t) * .5f * strength), Mathf.Max(1, 1.6f * scale));
                        break;
                    }
                    case Shape.Column:
                    {
                        float width = e.radius * 2 * (1 - t * .5f) * scale, height = (150 * (1 - t * .3f)) * scale;
                        Draw.VGradient(new Rect(at.x - width / 2, at.y - height, width, height), Theme.A(e.color, 0), Theme.A(e.color, (1 - t) * .75f * strength));
                        break;
                    }
                    case Shape.Streak:
                    {
                        // Dots travelling from the old place to the new one; radius < 0 = chevrons (pull).
                        var to = View(board, viewOwner, e.x2, e.y2); int steps = ReducedMotion ? 5 : 11;
                        for (int k = 0; k < steps; k++)
                        {
                            float along = Mathf.Clamp01(t * 1.5f - .5f + (k + 1f) / steps * .9f);
                            if (along <= 0 || along >= 1) continue;
                            var p = Vector2.Lerp(at, to, along); float size = Mathf.Max(3, (e.radius < 0 ? 11 : 4 + 7 * along) * scale);
                            Color tint = Theme.A(e.color, (1 - t) * (.35f + .6f * along) * strength);
                            if (e.radius < 0) Glyphs.Paint(new Rect(p.x - size / 2, p.y - size / 2, size, size), to.y < at.y ? Chevron : "+L -.7 -.45 0 .45 .34;+L 0 .45 .7 -.45 .34", tint);
                            else Draw.Circle(new Rect(p.x - size / 2, p.y - size / 2, size, size), tint);
                        }
                        break;
                    }
                    // Lightning is drawn above the balls (RenderOver), so the bolt is seen from its sender.
                    case Shape.Bolt: case Shape.Burst: break;
                    case Shape.Swirl:
                    {
                        // Dots spiralling inward: the shared sign for portals, swaps and identity changes.
                        int dots = ReducedMotion ? 6 : 10;
                        for (int k = 0; k < dots; k++)
                        {
                            float angle = k * Mathf.PI * 2 / dots + t * 5.5f + e.seed, radius = e.radius * (1.15f - .8f * t) * scale, size = Mathf.Max(2.5f, (6.5f - 3 * t) * scale);
                            var p = at + new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * radius;
                            Draw.Circle(new Rect(p.x - size / 2, p.y - size / 2, size, size), Theme.A(k % 2 == 0 ? e.color : Color.white, (1 - t) * .95f * strength));
                        }
                        Draw.Ring(at, e.radius * (1.15f - .8f * t) * scale, Theme.A(e.color, (1 - t) * .4f * strength), Mathf.Max(1, 1.5f * scale));
                        break;
                    }
                }
            }
        }

        // A jagged line from the sender into the target: ink outline, yellow body, white core. Its
        // kinks are fixed by the event (no flicker), it only fades.
        static void DrawBolt(Effect e, Rect board, int viewOwner, float t, float scale, float strength)
        {
            var at = View(board, viewOwner, e.x, e.y);
            var to = View(board, viewOwner, e.x2, e.y2); Vector2 along = to - at; float length = along.magnitude;
            if (length < 2) return;
            var across = new Vector2(-along.y, along.x) / length; int pieces = Mathf.Clamp(Mathf.RoundToInt(length / (26 * scale)), 3, 9);
            float fade = Mathf.Clamp01((1 - t) * 2.2f) * strength, width = Mathf.Max(2.5f, 5.5f * scale);
            for (int pass = 0; pass < 3; pass++)
            {
                Vector2 from = at;
                for (int k = 1; k <= pieces; k++)
                {
                    uint h = (uint)(e.seed * 7919 + k * 104729); h ^= h >> 13; h *= 0x5bd1e995; h ^= h >> 15;
                    float side = k == pieces ? 0 : ((h % 1000) / 500f - 1) * 12f * scale;
                    Vector2 next = at + along * (k / (float)pieces) + across * side;
                    Draw.Stroke(from, next, pass == 0 ? Theme.A(Theme.Ink, fade) : pass == 1 ? Theme.A(e.color, fade) : Theme.A(Color.white, fade), pass == 0 ? width + 4f * scale : pass == 1 ? width : width * .38f);
                    from = next;
                }
            }
        }
        // The opening of an explosion: a spiked star that jumps out and fades - ink outline, hot body,
        // white core. Its spikes are fixed by the event, so it does not flicker.
        static void DrawBurst(Effect e, Rect board, int viewOwner, float t, float scale, float strength)
        {
            var at = View(board, viewOwner, e.x, e.y);
            float grow = 1 - (1 - t) * (1 - t) * (1 - t), fade = Mathf.Clamp01((1 - t) * 2.4f) * strength;
            float outer = e.radius * (.4f + .6f * grow) * scale, inner = outer * .56f, turn = (e.seed % 9) * .35f;
            const int spikes = 11;
            for (int pass = 0; pass < 3; pass++)
            {
                float reach = pass == 0 ? outer + 4.5f * scale : pass == 1 ? outer : outer * .6f, waist = pass == 0 ? inner + 3.5f * scale : pass == 1 ? inner : inner * .6f;
                Color tint = pass == 0 ? Theme.A(Theme.Ink, fade) : pass == 1 ? Theme.A(e.color, fade) : Theme.A(Color.white, fade);
                for (int k = 0; k < spikes; k++)
                {
                    float angle = turn + k * Mathf.PI * 2 / spikes, half = Mathf.PI / spikes * 1.08f, length = reach * (k % 2 == 0 ? 1f : .8f);
                    Vector2 tip = at + new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * length;
                    Vector2 left = at + new Vector2(Mathf.Cos(angle - half), Mathf.Sin(angle - half)) * waist, right = at + new Vector2(Mathf.Cos(angle + half), Mathf.Sin(angle + half)) * waist;
                    Draw.Triangle(left, right, tip, .6f, tint);
                }
                Draw.Circle(new Rect(at.x - waist * 1.03f, at.y - waist * 1.03f, waist * 2.06f, waist * 2.06f), tint);
            }
        }
        // Flashes and particles above the balls.
        public static void RenderOver(Rect board, int viewOwner, float now)
        {
            float scale = board.width / 540f, strength = Theme.EffectStrength;
            if (strength <= 0) return;
            for (int i = 0; i < effectCount; i++)
            {
                var e = effects[i]; float age = now - e.born;
                if (e.shape == Shape.Bolt && age >= 0 && age < e.life) { DrawBolt(e, board, viewOwner, age / e.life, scale, strength); continue; }
                if (e.shape == Shape.Burst && age >= 0 && age < e.life) { DrawBurst(e, board, viewOwner, age / e.life, scale, strength); continue; }
                if (e.shape != Shape.Flash || age < 0 || age >= e.life) continue;
                float t = age / e.life; var at = View(board, viewOwner, e.x, e.y);
                float radius = e.radius * (.55f + .6f * t) * scale;
                Draw.Glow(at, radius * 1.9f, Theme.A(e.color, (1 - t) * .85f * strength));
                Draw.Circle(new Rect(at.x - radius * .62f, at.y - radius * .62f, radius * 1.24f, radius * 1.24f), Theme.A(e.color, (1 - t) * .75f * strength));
                Draw.Circle(new Rect(at.x - radius * .36f, at.y - radius * .36f, radius * .72f, radius * .72f), Theme.A(Color.white, (1 - t) * .95f * strength));
            }
            Particles(board, viewOwner, now, false, scale);
        }
        public static void RenderScreen(float now) => Particles(new Rect(0, 0, 540, 900), 0, now, true, 1);

        static void Particles(Rect board, int viewOwner, float now, bool screen, float scale)
        {
            if (Event.current.type != EventType.Repaint) return;
            // One time step per frame, shared by the arena pass and the HUD pass (confetti).
            if (now != lastTick) { stepTime = lastTick < 0 ? 0 : Mathf.Clamp(now - lastTick, 0, .05f); lastTick = now; }
            float dt = stepTime;
            for (int i = particleCount - 1; i >= 0; i--)
            {
                if (particles[i].screen != screen) continue;
                float age = now - particles[i].born;
                if (age >= particles[i].life) { particles[i] = particles[--particleCount]; continue; }
                if (age < 0) continue;
                float slow = Mathf.Exp(-particles[i].drag * dt);
                particles[i].vx *= slow; particles[i].vy = particles[i].vy * slow + particles[i].gravity * dt * (viewOwner == 1 && !screen ? -1 : 1);
                particles[i].x += particles[i].vx * dt; particles[i].y += particles[i].vy * dt;
                float t = age / particles[i].life, size = Mathf.Max(1.5f, particles[i].size * (1 + particles[i].grow * t) * scale);
                Vector2 p = screen ? new Vector2(particles[i].x, particles[i].y) : View(board, viewOwner, particles[i].x, particles[i].y);
                Color tint = Theme.A(particles[i].color, particles[i].color.a * Mathf.Clamp01((1 - t) * 2.2f) * Theme.EffectStrength);
                var rect = new Rect(p.x - size / 2, p.y - size / 2, size, size);
                // Cartoon look: each particle carries a thin ink edge.
                var edge = new Rect(rect.x - 1.2f, rect.y - 1.2f, rect.width + 2.4f, rect.height + 2.4f); Color ink = Theme.A(Theme.Ink, tint.a * .85f);
                if (particles[i].spec == null) { if (size > 4) Draw.Circle(edge, ink); Draw.Circle(rect, tint); }
                else { if (size > 5) Glyphs.Paint(edge, particles[i].spec, ink); Glyphs.Paint(rect, particles[i].spec, tint); }
            }
        }

        public static int ParticleCount => particleCount;
        public static int EffectCount => effectCount;
    }
}
