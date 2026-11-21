using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using UnityEngine;

namespace CoreClash.Presentation
{
    // CC-001 W24: a local computer opponent. It plays by the same rules as a person: it only
    // produces an ordinary PlayerCommand, which goes through the same Submit/TryCommand path.
    // To choose a shot it copies the current state into a private sandbox simulation, plays
    // candidate shots there with the real rules, and keeps the one with the best outcome.
    // The live match is never touched while it thinks. Local matches only.
    public sealed class AiOpponent
    {
        const int MaxSteps = 3600;              // 30 s of simulated time per candidate, more than any action lasts
        const float MinThink = .9f, MaxThink = 3.2f;
        static readonly float[] Angles = { -1.15f, -.85f, -.6f, -.38f, -.18f, 0, .18f, .38f, .6f, .85f, 1.15f };
        static readonly float[] Powers = { 590, 400 };

        readonly System.Random random = new System.Random();
        readonly Stopwatch watch = new Stopwatch();
        readonly List<PlayerCommand> candidates = new List<PlayerCommand>();
        GameSimulation live, sandbox;
        string snapshot;
        int planTurn = -1, planSerial = -1, next, steps;
        bool running;
        float startedAt, bestScore;
        PlayerCommand best;

        public void Reset() { live = null; planTurn = -1; running = false; candidates.Clear(); best = null; }

        // Call once per frame while it is the computer's turn to aim. Spends at most `budget`
        // seconds, returns true once with the chosen command.
        public bool Think(GameSimulation simulation, DeckDefinition deckA, DeckDefinition deckB, float now, float budget, out PlayerCommand command)
        {
            command = null;
            var state = simulation.State;
            if (state.phase != MatchPhase.Aiming) return false;
            if (!ReferenceEquals(live, simulation) || planTurn != state.turnNumber || planSerial != state.actionSerial) Begin(simulation, deckA, deckB, now);
            watch.Restart();
            while (next < candidates.Count || running)
            {
                if (!running)
                {
                    sandbox.State = JsonUtility.FromJson<GameState>(snapshot);
                    if (!sandbox.TryCommand(candidates[next], out _)) { next++; continue; }
                    running = true; steps = 0;
                }
                while (sandbox.State.phase == MatchPhase.Moving && steps < MaxSteps)
                {
                    sandbox.Step(1f / 120); steps++;
                    if ((steps & 15) == 0 && watch.Elapsed.TotalSeconds > budget) return false;
                }
                float score = Score(sandbox.State, state.turn) + (float)random.NextDouble() * 1.5f;
                if (best == null || score > bestScore) { best = candidates[next]; bestScore = score; }
                running = false; next++;
                if (now - startedAt > MaxThink) { next = candidates.Count; break; }
                if (watch.Elapsed.TotalSeconds > budget) return false;
            }
            if (now - startedAt < MinThink) return false;
            command = best ?? Fallback(state);
            planTurn = -1;
            return true;
        }

        void Begin(GameSimulation simulation, DeckDefinition deckA, DeckDefinition deckB, float now)
        {
            live = simulation; var state = simulation.State;
            planTurn = state.turnNumber; planSerial = state.actionSerial; startedAt = now; next = 0; running = false; best = null; bestScore = 0;
            snapshot = JsonUtility.ToJson(state);
            sandbox = new GameSimulation(simulation.Catalog, deckA, deckB) { ActiveRosterOnly = simulation.ActiveRosterOnly };
            // Standard plus up to three different specials that still have copies, in random order.
            var types = state.players[state.turn].stock.Where(entry => entry.remaining > 0).Select(entry => entry.id).OrderBy(_ => random.Next()).Take(3).ToList();
            types.Add("normal");
            candidates.Clear();
            foreach (string type in types)
                foreach (float power in Powers)
                    foreach (float angle in Angles)
                    {
                        float a = angle + ((float)random.NextDouble() - .5f) * .12f;
                        candidates.Add(new PlayerCommand { owner = state.turn, turnNumber = state.turnNumber, kind = CommandKind.Spawn, ballType = type,
                            dx = Mathf.Sin(a), dy = (state.turn == 0 ? -1 : 1) * Mathf.Cos(a), power = power });
                    }
            // Shuffle, so a thinking time cut short still covers different balls and directions.
            for (int i = candidates.Count - 1; i > 0; i--) { int j = random.Next(i + 1); var swap = candidates[i]; candidates[i] = candidates[j]; candidates[j] = swap; }
        }

        static PlayerCommand Fallback(GameState state)
            => new PlayerCommand { owner = state.turn, turnNumber = state.turnNumber, kind = CommandKind.Spawn, ballType = "normal", dx = 0, dy = state.turn == 0 ? -1 : 1, power = 500 };

        // How good the position is for `me` once the shot has played out.
        static float Score(GameState state, int me)
        {
            int enemy = 1 - me;
            if (state.phase == MatchPhase.Over) return state.winner == me ? 1000 : state.winner == enemy ? -1000 : 0;
            float score = (state.players[me].hp - state.players[enemy].hp) * 6f;
            foreach (var ball in state.balls)
            {
                if (ball.dead || ball.banished) continue;
                score += ball.owner == me ? 1.5f + ball.hp * .15f : -1.5f - ball.hp * .2f;
            }
            return score;
        }
    }
}
