using System.Collections.Generic;
using System.Diagnostics;
using CoreClash.Core;
using CoreClash.Data;
using UnityEngine;

namespace CoreClash.Presentation
{
    // CC-001 W24: a local computer opponent. It plays by the same rules as a person: it only
    // produces an ordinary PlayerCommand, which goes through the same Submit/TryCommand path.
    // How it chooses is Core/AiBrain.cs - the very same code the simulation lab plays thousands of
    // matches with (Tests/SelfPlay/AiLab.cs). Here that work is only spread over frames: the brain
    // tries its candidate shots in a private sandbox copy of the match, a few milliseconds a frame,
    // and the live match is never touched while it thinks. Local matches only.
    // The player picks how hard it tries (MatchSetup.AiLevel): Easy, Normal or Hard.
    public sealed class AiOpponent
    {
        readonly System.Random random = new System.Random();
        readonly Stopwatch watch = new Stopwatch();
        List<PlayerCommand> candidates = new List<PlayerCommand>();
        GameSimulation live, sandbox;
        AiLevelSettings level;
        AiWeights weights;
        string snapshot;
        int planTurn = -1, planSerial = -1, next, steps, replays;
        bool running;
        float startedAt, baseline, spawnScore, replayScore;
        PlayerCommand bestSpawn, bestReplay;

        // What the lab learned (Resources/Data/ai-weights.json). Without that file: the plain weights.
        static AiWeights learned;
        public static AiWeights Learned
        {
            get
            {
                if (learned != null) return learned;
                var asset = Resources.Load<TextAsset>("Data/ai-weights");
                learned = asset != null ? JsonUtility.FromJson<AiWeights>(asset.text) ?? new AiWeights() : new AiWeights();
                return learned;
            }
        }
        // Easy judges a position with the plain weights; Normal and Hard with the learned ones.
        public static AiWeights WeightsFor(AiLevel difficulty) => difficulty == AiLevel.Easy ? new AiWeights() : Learned;
        // Seconds a frame the computer may think: a share of the frame, so the picture keeps its
        // rate while it thinks (the board stands still then). Hard tries five times as many shots,
        // so it gets the larger share.
        public static float FrameBudget(AiLevel difficulty, int targetFrameRate)
            => (difficulty == AiLevel.Hard ? .55f : .4f) / Mathf.Max(30, targetFrameRate);

        public void Reset() { live = null; planTurn = -1; running = false; candidates.Clear(); bestSpawn = bestReplay = null; }

        // Call once per frame while it is the computer's turn to aim. Spends at most `budget`
        // seconds, returns true once with the chosen command.
        public bool Think(GameSimulation simulation, DeckDefinition deckA, DeckDefinition deckB, AiLevel difficulty, float now, float budget, out PlayerCommand command)
        {
            command = null;
            var state = simulation.State;
            if (state.phase != MatchPhase.Aiming) return false;
            if (!ReferenceEquals(live, simulation) || planTurn != state.turnNumber || planSerial != state.actionSerial || level == null || level.Level != difficulty) Begin(simulation, deckA, deckB, difficulty, now);
            watch.Restart();
            while (next < candidates.Count || running)
            {
                // Every replay has been tried and one is worth playing: play it now; the new ball is
                // chosen afterwards, from the position the replay leaves.
                if (!running && next == replays && AiBrain.Pick(bestReplay, replayScore, null, 0, baseline) != null) { next = candidates.Count; break; }
                if (!running)
                {
                    sandbox.State = JsonUtility.FromJson<GameState>(snapshot);
                    if (!sandbox.TryCommand(candidates[next], out _)) { next++; continue; }
                    running = true; steps = 0;
                }
                while (sandbox.State.phase == MatchPhase.Moving && steps < AiBrain.MaxSteps)
                {
                    sandbox.Step(1f / 120); steps++;
                    if ((steps & 15) == 0 && watch.Elapsed.TotalSeconds > budget) return false;
                }
                float score = AiBrain.Score(sandbox.State, state.turn, weights) + AiBrain.Noise(random, level.ScoreNoise);
                var candidate = candidates[next];
                if (candidate.kind == CommandKind.Replay) { if (bestReplay == null || score > replayScore) { bestReplay = candidate; replayScore = score; } }
                else if (bestSpawn == null || score > spawnScore) { bestSpawn = candidate; spawnScore = score; }
                running = false; next++;
                // Out of time: the candidates are shuffled, so the ones tried so far cover different balls and directions.
                if (now - startedAt > level.MaxThink) { next = candidates.Count; break; }
                if (watch.Elapsed.TotalSeconds > budget) return false;
            }
            if (now - startedAt < level.MinThink) return false;
            command = AiBrain.Pick(bestReplay, replayScore, bestSpawn, spawnScore, baseline) ?? AiBrain.Fallback(state);
            planTurn = -1;
            return true;
        }

        void Begin(GameSimulation simulation, DeckDefinition deckA, DeckDefinition deckB, AiLevel difficulty, float now)
        {
            live = simulation; var state = simulation.State;
            level = AiLevelSettings.For(difficulty); weights = WeightsFor(difficulty);
            planTurn = state.turnNumber; planSerial = state.actionSerial; startedAt = now; next = 0; running = false;
            bestSpawn = bestReplay = null; spawnScore = replayScore = 0;
            baseline = AiBrain.Score(state, state.turn, weights);
            snapshot = JsonUtility.ToJson(state);
            sandbox = new GameSimulation(simulation.Catalog, deckA, deckB) { ActiveRosterOnly = simulation.ActiveRosterOnly };
            candidates = AiBrain.Candidates(simulation, level, random, out replays);
        }
    }
}
