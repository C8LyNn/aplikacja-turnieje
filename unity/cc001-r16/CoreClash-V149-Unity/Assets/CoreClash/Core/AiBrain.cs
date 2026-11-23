using System;
using System.Collections.Generic;
using System.Linq;
using CoreClash.Physics;

namespace CoreClash.Core
{
    // CC-001 W24 (owner direction, 2026-11-22: "simulations that play a great many games, where the
    // balance is checked and the computer is taught to play; a solo player picks a difficulty").
    //
    // How the computer chooses a shot, with no engine code in it, so the game and the simulations
    // that play thousands of matches use the very same brain:
    //   - it plays by the rules a person plays by: it only produces an ordinary PlayerCommand;
    //   - it tries candidate shots in a private copy of the match, with the real rules, and keeps
    //     the one after which the position is best (Score);
    //   - what "best" means is a handful of numbers (AiWeights). Those are what gets learned:
    //     the lab (Tests/SelfPlay/AiLab.cs) lets sets of weights play each other and keeps the winner;
    //   - a difficulty level is how many shots it tries, how well it aims and whether it replays.

    // What the position is worth. Every number weighs one thing the computer can see on the board.
    [Serializable] public sealed class AiWeights
    {
        public float baseHp = 6f;        // my base HP minus the opponent's
        public float ownBall = 1.5f;     // each ball of mine on the board
        public float ownHp = 4.5f;       // ...and how healthy it is (0..1 of its gauge)
        public float enemyBall = 1.5f;   // each enemy ball on the board (counts against)
        public float enemyHp = 6f;       // ...and how healthy it is (counts against)
        public float attack = 1f;        // a ball of mine touching the enemy's zone (it scores at the end of my turn)
        public float defence = 1.5f;     // an enemy ball touching my zone (it scores at the end of theirs)
        public float centre = 1f;        // who holds the centre, by how many balls
        public float harm = .5f;         // fire, poison, ice, a snare or a switched-off power on enemy balls (mine count against)
        public float replayable = .2f;   // a ball of mine I will be able to play again
        public const int Count = 10;
        public float[] ToArray() => new[] { baseHp, ownBall, ownHp, enemyBall, enemyHp, attack, defence, centre, harm, replayable };
        public static AiWeights FromArray(float[] v) => new AiWeights { baseHp = v[0], ownBall = v[1], ownHp = v[2], enemyBall = v[3], enemyHp = v[4], attack = v[5], defence = v[6], centre = v[7], harm = v[8], replayable = v[9] };
        public static readonly string[] Names = { "baseHp", "ownBall", "ownHp", "enemyBall", "enemyHp", "attack", "defence", "centre", "harm", "replayable" };
    }

    public enum AiLevel { Easy, Normal, Hard }

    // How hard the computer tries.
    public sealed class AiLevelSettings
    {
        public AiLevel Level;
        public int Specials;            // how many different special balls it considers (Standard is always considered)
        public float[] Powers, Angles;  // the launches it tries with each of them
        public float AimNoise;          // its hand is this unsteady (radians, each way)
        public float ScoreNoise;        // and its judgement this unsure (points of Score)
        public bool Replays;            // does it play its balls again from its own zone
        public float[] ReplayPowers, ReplayAngles;
        public float MinThink, MaxThink;   // seconds it takes over a shot in the game

        static readonly float[] Wide = { -1.15f, -.85f, -.6f, -.38f, -.18f, 0, .18f, .38f, .6f, .85f, 1.15f };
        static readonly float[] Fine = { -1.2f, -1f, -.8f, -.62f, -.46f, -.3f, -.15f, 0, .15f, .3f, .46f, .62f, .8f, 1f, 1.2f };
        public static AiLevelSettings For(AiLevel level)
        {
            switch (level)
            {
                case AiLevel.Easy:
                    return new AiLevelSettings { Level = level, Specials = 1, Powers = new[] { 500f }, Angles = new[] { -.6f, -.3f, 0, .3f, .6f }, AimNoise = .2f, ScoreNoise = 9f,
                        Replays = false, ReplayPowers = new float[0], ReplayAngles = new float[0], MinThink = .9f, MaxThink = 2f };
                case AiLevel.Hard:
                    return new AiLevelSettings { Level = level, Specials = 9, Powers = new[] { 590f, 440f, 300f }, Angles = Fine, AimNoise = 0, ScoreNoise = 0,
                        Replays = true, ReplayPowers = new[] { 590f, 380f }, ReplayAngles = Wide, MinThink = .9f, MaxThink = 4.5f };
                default:
                    return new AiLevelSettings { Level = level, Specials = 3, Powers = new[] { 590f, 400f }, Angles = Wide, AimNoise = .06f, ScoreNoise = 1.5f,
                        Replays = true, ReplayPowers = new[] { 520f }, ReplayAngles = new[] { -.7f, -.35f, 0, .35f, .7f }, MinThink = .9f, MaxThink = 3.2f };
            }
        }
    }

    // What one decision looked like; the balance report is built from these.
    public sealed class AiTrace
    {
        // For each ball type tried: the best position reached with it, minus the best reached with the Standard ball.
        public readonly Dictionary<string, float> EdgeOverStandard = new Dictionary<string, float>(StringComparer.Ordinal);
        public int Tried;
    }

    public static class AiBrain
    {
        public const int MaxSteps = 3600;          // 30 s of simulated time for one shot, more than any action lasts
        public const float ReplayMargin = 1f;      // a replay is worth it only when it improves the position by this much

        // The launches worth trying from this position: first the replays, when the level plays them,
        // then the new balls; each part shuffled, so thinking cut short still covers different balls
        // and directions.
        public static List<PlayerCommand> Candidates(GameSimulation simulation, AiLevelSettings level, Random random)
            => Candidates(simulation, level, random, out _);
        public static List<PlayerCommand> Candidates(GameSimulation simulation, AiLevelSettings level, Random random, out int replays)
        {
            var state = simulation.State; int me = state.turn; var list = new List<PlayerCommand>();
            float forward = me == 0 ? -1 : 1;
            if (level.Replays && !state.bonusPending)
                foreach (var ball in state.balls)
                {
                    if (!simulation.CanReplay(ball)) continue;
                    foreach (float power in level.ReplayPowers)
                        foreach (float angle in level.ReplayAngles)
                        {
                            float a = angle + Noise(random, level.AimNoise);
                            list.Add(new PlayerCommand { owner = me, turnNumber = state.turnNumber, kind = CommandKind.Replay, ballId = ball.id, dx = (float)Math.Sin(a), dy = forward * (float)Math.Cos(a), power = power });
                        }
                }
            replays = list.Count; Shuffle(list, 0, replays, random);
            // The extra opening ball under the Standard-only rule: no special balls to consider.
            var types = simulation.StandardOnlyShot ? new List<string>() : state.players[me].stock.Where(entry => entry.remaining > 0).Select(entry => entry.id).OrderBy(_ => random.Next()).Take(Math.Max(0, level.Specials)).ToList();
            types.Add("normal");
            foreach (string type in types)
                foreach (float power in level.Powers)
                    foreach (float angle in level.Angles)
                    {
                        float a = angle + Noise(random, level.AimNoise);
                        list.Add(new PlayerCommand { owner = me, turnNumber = state.turnNumber, kind = CommandKind.Spawn, ballType = type, dx = (float)Math.Sin(a), dy = forward * (float)Math.Cos(a), power = power });
                    }
            Shuffle(list, replays, list.Count, random);
            return list;
        }
        static void Shuffle(List<PlayerCommand> list, int from, int to, Random random)
        {
            for (int i = to - 1; i > from; i--) { int j = from + random.Next(i - from + 1); var swap = list[i]; list[i] = list[j]; list[j] = swap; }
        }
        public static float Noise(Random random, float amount) => amount <= 0 ? 0 : ((float)random.NextDouble() * 2 - 1) * amount;

        public static PlayerCommand Fallback(GameState state)
            => new PlayerCommand { owner = state.turn, turnNumber = state.turnNumber, kind = CommandKind.Spawn, ballType = "normal", dx = 0, dy = state.turn == 0 ? -1 : 1, power = 500 };

        // What the computer sees in a position, as numbers, from the side of `me`: one number for each
        // weight of AiWeights, in the same order, each one larger when the position is better for `me`.
        // The score of a position is these numbers times the weights; the lab learns the weights from
        // the positions of whole matches and how those matches ended.
        public static void Features(GameState state, int me, float[] f)
        {
            int enemy = 1 - me;
            for (int i = 0; i < AiWeights.Count; i++) f[i] = 0;
            f[0] = state.players[me].hp - state.players[enemy].hp;
            float centreRadius = state.centreRadius > 0 ? state.centreRadius : ZoneResolver.CentreRadius;
            int centreMine = 0, centreTheirs = 0;
            foreach (var ball in state.balls)
            {
                if (ball.dead || ball.banished) continue;
                bool mine = ball.owner == me; float health = ball.maxHp > 0 ? Math.Min(1f, ball.hp / (float)ball.maxHp) : 0;
                float trouble = ball.fireStacks + (ball.toxinTurns > 0 ? 1 : 0) + ball.iceStacks * .5f + (ball.frozen > 0 ? 1.5f : 0) + (ball.rooted ? 1 : 0) + (ball.jammed > 0 ? 1 : 0);
                if (mine)
                {
                    f[1] += 1; f[2] += health; f[8] -= trouble;
                    if (ZoneResolver.TouchesEnemyZone(ball)) f[5] += 1;
                    if (ZoneResolver.TouchesOwnZone(ball) && ball.frozen <= 0 && !ball.rooted) f[9] += 1;
                }
                else
                {
                    f[3] -= 1; f[4] -= health; f[8] += trouble;
                    if (ZoneResolver.TouchesEnemyZone(ball)) f[6] -= 1;
                }
                if (ZoneResolver.TouchesCenter(ball, centreRadius)) { if (mine) centreMine++; else centreTheirs++; }
            }
            f[7] = Math.Max(-3, Math.Min(3, centreMine - centreTheirs));
        }

        // How good the position is for `me`.
        public static float Score(GameState state, int me, AiWeights w)
        {
            if (state.phase == MatchPhase.Over) return state.winner == me ? 1000 : state.winner == 1 - me ? -1000 : 0;
            var f = new float[AiWeights.Count]; Features(state, me, f);
            return f[0] * w.baseHp + f[1] * w.ownBall + f[2] * w.ownHp + f[3] * w.enemyBall + f[4] * w.enemyHp + f[5] * w.attack + f[6] * w.defence + f[7] * w.centre + f[8] * w.harm + f[9] * w.replayable;
        }

        // Plays one candidate in the sandbox and says how good the position is afterwards.
        public static bool Try(GameSimulation sandbox, GameState copy, PlayerCommand command, int me, AiWeights weights, out float score)
        {
            score = 0; sandbox.State = copy;
            if (!sandbox.TryCommand(command, out _)) return false;
            int steps = 0;
            while (sandbox.State.phase == MatchPhase.Moving && steps++ < MaxSteps) sandbox.Step(1f / 120);
            score = Score(sandbox.State, me, weights);
            return true;
        }

        // The whole choice at once (the simulations use this; the game spreads the same work over frames).
        // `copy` returns a fresh, private copy of the position each time it is called.
        public static PlayerCommand Decide(GameSimulation live, GameSimulation sandbox, AiLevelSettings level, AiWeights weights, Random random, Func<GameState> copy, AiTrace trace = null)
        {
            var state = live.State; int me = state.turn;
            var candidates = Candidates(live, level, random, out int replays);
            float baseline = Score(state, me, weights);
            PlayerCommand bestSpawn = null, bestReplay = null; float spawnScore = 0, replayScore = 0;
            Dictionary<string, float> byType = trace == null ? null : new Dictionary<string, float>(StringComparer.Ordinal);
            for (int index = 0; index < candidates.Count; index++)
            {
                // Every replay has been tried and one of them is worth playing: it is played now, and the
                // new ball is chosen afterwards, from the position the replay leaves.
                if (index == replays && trace == null && Pick(bestReplay, replayScore, null, 0, baseline) != null) return bestReplay;
                var candidate = candidates[index];
                if (!Try(sandbox, copy(), candidate, me, weights, out float score)) continue;
                if (trace != null) trace.Tried++;
                if (byType != null && candidate.kind == CommandKind.Spawn && (!byType.TryGetValue(candidate.ballType, out float known) || score > known)) byType[candidate.ballType] = score;
                score += Noise(random, level.ScoreNoise);
                if (candidate.kind == CommandKind.Replay) { if (bestReplay == null || score > replayScore) { bestReplay = candidate; replayScore = score; } }
                else if (bestSpawn == null || score > spawnScore) { bestSpawn = candidate; spawnScore = score; }
            }
            if (byType != null && byType.TryGetValue("normal", out float standard))
                foreach (var pair in byType) if (pair.Key != "normal") trace.EdgeOverStandard[pair.Key] = pair.Value - standard;
            return Pick(bestReplay, replayScore, bestSpawn, spawnScore, baseline) ?? Fallback(state);
        }
        // A replay does not end the turn, so it is taken first whenever it leaves the position better
        // than it is now; otherwise the best new ball. Null when there is neither (the caller falls back).
        public static PlayerCommand Pick(PlayerCommand bestReplay, float replayScore, PlayerCommand bestSpawn, float spawnScore, float baseline)
            => bestReplay != null && replayScore > baseline + ReplayMargin ? bestReplay : bestSpawn;
    }
}
