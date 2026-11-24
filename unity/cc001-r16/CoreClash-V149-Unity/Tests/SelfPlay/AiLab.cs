using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Presentation;

namespace CoreClash.SelfPlay
{
    // CC-001 W24 (owner direction, 2026-11-22): the lab. It plays a great many whole matches with the
    // game's own rules and the game's own computer player (Core/AiBrain.cs), to do these things:
    //   balance   every ready deck plays every other; the report says who wins, how much the first
    //             move is worth, and how much better each ball's best shot is than the Standard ball's.
    //             "--opening any-bonus|none|standard-first" plays the same matches with another rule
    //             for the opening (the game's rule: the second player gets an extra Standard ball):
    //             the extra ball may be any ball (the reference rule); no extra ball; no extra ball
    //             and the first player's first ball must be a Standard one;
    //   balls     what each ball is worth to its deck over a whole match: the deck built on the
    //             ball's group plays itself without that ball, from both seats ("--group ice,poison"
    //             measures only those groups);
    //   groups    how strong each GROUP is: the six ready decks pair the groups one way only, so
    //             here every pair of groups meets (five balls of one group and four of another);
    //             the report also says what each group does to the other side in a match;
    //   levels    checks that Hard beats Normal and Normal beats Easy, and by how much;
    //   tune      teaches the computer by play: two copies of it, one with each weight of its
    //             judgement (AiWeights) pushed a little up or down at random and one pushed the
    //             opposite way, play each other from both seats; the weights then move a small step
    //             towards the side that won. Thousands of matches later the result has to beat the
    //             starting weights in fresh matches, or it is thrown away;
    //   train     the other way of learning, kept for the record: fit the weights to the positions
    //             of self-played matches and how they ended. Measured on 600 matches (2026-11-22):
    //             the fit predicted results a little better and played worse - it lost 94:146 to
    //             the weights it started from. What goes with winning is not what causes it.
    // Run it through the test program:
    //   dotnet run -c Release --project Tests/CoreClash.Tests.csproj -- . ailab <balance|balls|groups|levels|tune|train|bench> [--out folder] [--threads n]
    // An experiment: "--rule name=value,name=value" sets match rules (fields of GameState) after the
    // game's own, and "--name report" saves the report under another name. That is how a balance
    // number is tried before it goes into Core/RosterBalance.cs:
    //   ... ailab groups --games 600 --rule leechDrain=5,poolRadius=165 --name before
    public sealed class AiAgent { public AiLevelSettings Level; public AiWeights Weights; }

    // A position after a shot has played out, seen by the player who made it, and how the match ended for them.
    public sealed class LabSample { public float[] F; public int Mover, Game; public float Result; }

    public sealed class LabMatch
    {
        public string DeckA, DeckB, Map; public int Winner, Turns, BaseA, BaseB, Actions; public bool Finished;
        public readonly Dictionary<string, int> Launched = new Dictionary<string, int>(StringComparer.Ordinal);
        public readonly Dictionary<string, double> EdgeSum = new Dictionary<string, double>(StringComparer.Ordinal);
        public readonly Dictionary<string, int> EdgeCount = new Dictionary<string, int>(StringComparer.Ordinal);
        public List<LabSample> Samples;
        // With `trace`: how many events of each kind happened to the balls of each seat (Events[seat][kind]).
        public readonly Dictionary<string, int>[] Events = { new Dictionary<string, int>(StringComparer.Ordinal), new Dictionary<string, int>(StringComparer.Ordinal) };
    }

    public static class AiLab
    {
        static readonly JsonSerializerOptions Json = new JsonSerializerOptions { IncludeFields = true };

        // The rules the game itself plays by (MatchSetup.Apply), with the map drawn by the seed.
        // anyBonusBall true: an experiment - the extra opening ball may be any ball (the reference rule).
        // openingBonus false: an experiment for the balance report - the second player does not get
        // the extra ball of the opening turn.
        // An experiment: match rules (fields of GameState) set by name after the game's own, e.g.
        // --rule deepFreeze=false. Empty = the game's rules.
        public static string RuleOverrides = "";
        static void Override(GameState state)
        {
            foreach (string part in RuleOverrides.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
            {
                string[] pair = part.Split('='); var field = typeof(GameState).GetField(pair[0].Trim());
                if (field == null || pair.Length != 2) throw new ArgumentException("Unknown match rule: " + part);
                field.SetValue(state, Convert.ChangeType(pair[1].Trim(), field.FieldType, CultureInfo.InvariantCulture));
            }
        }
        public static GameSimulation NewMatch(Catalog catalog, DeckDefinition a, DeckDefinition b, ulong seed, out string map, bool openingBonus = true, bool anyBonusBall = false)
        {
            var sim = new GameSimulation(catalog, a, b) { ActiveRosterOnly = true };
            var state = sim.State;
            state.ballScale = 1.5f; state.comebackRule = true; state.plainPowers = true; state.exclusiveFields = true;
            state.standardOpeningBonus = !anyBonusBall; RosterBalance.Apply(state);
            var picked = MatchMaps.All[(int)(SelfPlayRng.Mix(seed, 77) % (ulong)MatchMaps.All.Length)];
            MatchMaps.Apply(sim, picked); map = picked.Id;
            if (!openingBonus) state.bonusUsed = true;
            Override(state);
            return sim;
        }

        // One whole match between two computer players. `trace` collects what the balance report needs,
        // `samples` what the training needs.
        public static LabMatch Play(Catalog catalog, DeckDefinition a, DeckDefinition b, AiAgent first, AiAgent second, ulong seed, bool trace = false, bool samples = false, bool openingBonus = true, string[] drop = null, string opening = null)
        {
            var record = new LabMatch { DeckA = a.id, DeckB = b.id, Samples = samples ? new List<LabSample>() : null };
            var sim = NewMatch(catalog, a, b, seed, out record.Map, openingBonus, opening == "any-bonus");
            // drop[seat]: that player has no copies of this ball (a deck must hold nine, so the ball stays in it, empty).
            for (int seat = 0; drop != null && seat < 2; seat++)
                foreach (var entry in sim.State.players[seat].stock) if (entry.id == drop[seat]) entry.remaining = 0;
            var sandbox = new GameSimulation(catalog, a, b) { ActiveRosterOnly = true };
            var agents = new[] { first, second };
            var random = new[] { new Random(unchecked((int)SelfPlayRng.Mix(seed, 1))), new Random(unchecked((int)SelfPlayRng.Mix(seed, 2))) };
            int guard = 0, cursor = 0;
            while (sim.State.phase != MatchPhase.Over && guard++ < 600)
            {
                int owner = sim.State.turn; var agent = agents[owner]; var level = agent.Level;
                // An experiment with the opening: the first player's first ball may only be a Standard one.
                if (opening == "standard-first" && owner == 0 && sim.State.turnNumber == 1)
                    level = new AiLevelSettings { Level = level.Level, Specials = 0, Powers = level.Powers, Angles = level.Angles, AimNoise = level.AimNoise, ScoreNoise = level.ScoreNoise, Replays = false, ReplayPowers = level.ReplayPowers, ReplayAngles = level.ReplayAngles, MinThink = level.MinThink, MaxThink = level.MaxThink };
                // One private copy of the position per candidate, without the event history (the rules do not read it).
                var events = sim.State.events; sim.State.events = new List<GameEvent>();
                string snapshot = JsonSerializer.Serialize(sim.State, Json);
                sim.State.events = events;
                var seen = trace ? new AiTrace() : null;
                var command = AiBrain.Decide(sim, sandbox, level, agent.Weights, random[owner], () => JsonSerializer.Deserialize<GameState>(snapshot, Json), seen);
                if (!sim.TryCommand(command, out _) && !sim.TryCommand(AiBrain.Fallback(sim.State), out _)) break;
                record.Actions++;
                if (command.kind == CommandKind.Spawn) { record.Launched.TryGetValue(command.ballType, out int n); record.Launched[command.ballType] = n + 1; }
                if (seen != null)
                    foreach (var pair in seen.EdgeOverStandard)
                    {
                        record.EdgeSum.TryGetValue(pair.Key, out double sum); record.EdgeSum[pair.Key] = sum + pair.Value;
                        record.EdgeCount.TryGetValue(pair.Key, out int count); record.EdgeCount[pair.Key] = count + 1;
                    }
                int steps = 0;
                while (sim.State.phase == MatchPhase.Moving && steps++ < 6000) { sim.Step(1f / 120); if (trace && steps % 20 == 0) Count(sim.State, record, ref cursor); }
                if (trace) Count(sim.State, record, ref cursor);
                if (sim.State.phase == MatchPhase.Moving) break;
                if (record.Samples != null && sim.State.phase != MatchPhase.Over)
                {
                    var sample = new LabSample { F = new float[AiWeights.Count], Mover = owner };
                    AiBrain.Features(sim.State, owner, sample.F); record.Samples.Add(sample);
                }
            }
            record.Finished = sim.State.phase == MatchPhase.Over; record.Winner = record.Finished ? sim.State.winner : -1;
            record.Turns = sim.State.turnNumber; record.BaseA = sim.State.players[0].hp; record.BaseB = sim.State.players[1].hp;
            if (record.Samples != null)
            {
                if (!record.Finished) record.Samples.Clear();
                foreach (var sample in record.Samples) sample.Result = record.Winner < 0 ? .5f : record.Winner == sample.Mover ? 1 : 0;
            }
            return record;
        }

        // The event list keeps the last hundred: it is read every few steps.
        static void Count(GameState state, LabMatch record, ref int cursor)
        {
            foreach (var e in state.events)
            {
                if (e.id <= cursor || e.ballId == 0) continue;
                int owner = -1; foreach (var ball in state.balls) if (ball.id == e.ballId) { owner = ball.owner; break; }
                if (owner < 0) continue;
                record.Events[owner].TryGetValue(e.kind, out int n); record.Events[owner][e.kind] = n + 1;
            }
            cursor = state.eventSerial;
        }

        static Catalog LoadCatalog(string root)
        {
            var catalog = new Catalog(JsonSerializer.Deserialize<CatalogData>(File.ReadAllText(Path.Combine(root, "Assets/Resources/Data/catalog.json")), Json),
                JsonSerializer.Deserialize<FeaturedDeckData>(File.ReadAllText(Path.Combine(root, "Assets/Resources/Data/featured-decks.json")), Json));
            catalog.UseRoster(JsonSerializer.Deserialize<RosterData>(File.ReadAllText(Path.Combine(root, "Assets/Resources/Data/roster.json")), Json));
            return catalog;
        }
        public static string WeightsPath(string root) => Path.Combine(root, "Assets/Resources/Data/ai-weights.json");
        public static AiWeights LoadWeights(string root)
        {
            string path = WeightsPath(root);
            return File.Exists(path) ? JsonSerializer.Deserialize<AiWeights>(File.ReadAllText(path), Json) ?? new AiWeights() : new AiWeights();
        }
        static string Arg(string[] args, string name, string fallback) { int at = Array.IndexOf(args, name); return at >= 0 && at + 1 < args.Length ? args[at + 1] : fallback; }
        static int Int(string[] args, string name, int fallback) => int.TryParse(Arg(args, name, ""), out int value) ? value : fallback;
        static string Text(AiWeights weights) => string.Join(", ", AiWeights.Names.Zip(weights.ToArray(), (name, value) => name + "=" + value.ToString("0.00")));
        static double Share(int wins, int losses) => wins + losses > 0 ? wins * 100.0 / (wins + losses) : 50;

        // Agent `a` against agent `b` over `games` matches. Games come in twos: the same decks, the same
        // map and the same seed with the two agents changing seats, so neither the decks nor the first
        // move can favour one of them.
        static void Duel(Catalog catalog, AiAgent a, AiAgent b, int games, ulong seed, int threads, out int winsA, out int winsB, out int open)
        {
            var decks = catalog.Roster.Decks; int wa = 0, wb = 0, undecided = 0;
            Parallel.For(0, games, new ParallelOptions { MaxDegreeOfParallelism = threads }, i =>
            {
                int pair = i >> 1; bool swap = (i & 1) == 1;
                var first = decks[pair % decks.Length]; var second = decks[(pair / decks.Length + pair + 1) % decks.Length];
                var match = Play(catalog, first, second, swap ? b : a, swap ? a : b, SelfPlayRng.Mix(seed, (ulong)pair));
                if (!match.Finished || match.Winner < 0) Interlocked.Increment(ref undecided);
                else if ((match.Winner == 0) != swap) Interlocked.Increment(ref wa);
                else Interlocked.Increment(ref wb);
            });
            winsA = wa; winsB = wb; open = undecided;
        }

        public static int Main(string root, string[] args)
        {
            CultureInfo.DefaultThreadCurrentCulture = CultureInfo.InvariantCulture; CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;
            string mode = args.Length > 0 ? args[0] : "";
            var catalog = LoadCatalog(root);
            // Three quarters of the processors, at a low priority: the machine stays usable while the lab runs.
            int threads = Int(args, "--threads", Math.Max(1, Environment.ProcessorCount * 3 / 4));
            try { Process.GetCurrentProcess().PriorityClass = ProcessPriorityClass.BelowNormal; } catch (Exception) { }
            string output = Arg(args, "--out", Path.Combine(root, "Logs"));
            RuleOverrides = Arg(args, "--rule", "");
            if (RuleOverrides.Length > 0) Console.WriteLine("AILAB experiment, match rules: " + RuleOverrides);
            Directory.CreateDirectory(output);
            switch (mode)
            {
                case "bench": return Bench(catalog, root);
                case "train": return Train(catalog, root, args, threads, output);
                case "balance": return Balance(catalog, root, args, threads, output);
                case "levels": return Levels(catalog, root, args, threads, output);
                case "tune": return Tune(catalog, root, args, threads, output);
                case "balls": return Balls(catalog, root, args, threads, output);
                case "groups": return Groups(catalog, root, args, threads, output);
                default: Console.WriteLine("ailab: balance | balls | groups | levels | tune | train | bench"); return 2;
            }
        }

        static int Bench(Catalog catalog, string root)
        {
            var weights = LoadWeights(root); var decks = catalog.Roster.Decks;
            foreach (AiLevel level in Enum.GetValues(typeof(AiLevel)))
            {
                var agent = new AiAgent { Level = AiLevelSettings.For(level), Weights = weights };
                var watch = Stopwatch.StartNew(); var match = Play(catalog, decks[0], decks[1], agent, agent, 1234);
                Console.WriteLine("BENCH " + level + " one match " + watch.Elapsed.TotalSeconds.ToString("0.00") + " s, turns " + match.Turns + ", actions " + match.Actions + ", finished " + match.Finished);
            }
            return 0;
        }

        // ---------------------------------------------------------------- train
        // Fits the weights to the positions: a logistic regression of "the player who made this shot
        // won the match" on what AiBrain.Features saw after the shot.
        // All the positions of one match share one result, so even thousands of positions are only
        // hundreds of independent facts, and a free fit chases chance. So the fit starts from the
        // weights it is given and is held to them by a spring; how stiff the spring is, is chosen by
        // what predicts best the matches kept aside (which the fit never saw).
        // The result is scaled so that one HP of base difference keeps its weight, which keeps the
        // other numbers readable and the meaning of the levels' noise and of the replay margin.
        public static AiWeights Fit(List<LabSample> learn, List<LabSample> check, AiWeights prior, out string note)
        {
            int n = AiWeights.Count; note = "";
            if (learn.Count < 1500 || check.Count < 300) { note = "too few positions"; return null; }
            var scale = new double[n];
            for (int i = 0; i < n; i++) { double sum = 0; foreach (var s in learn) sum += s.F[i] * (double)s.F[i]; scale[i] = Math.Max(1e-3, Math.Sqrt(sum / learn.Count)); }
            double[][] Scaled(List<LabSample> list) => list.Select(s => { var x = new double[n]; for (int i = 0; i < n; i++) x[i] = s.F[i] / scale[i]; return x; }).ToArray();
            var xs = Scaled(learn); var ys = learn.Select(s => (double)s.Result).ToArray(); var checkXs = Scaled(check); var checkYs = check.Select(s => (double)s.Result).ToArray();
            double Loss(double[] w, double bias, double[][] x, double[] y)
            {
                double total = 0;
                for (int j = 0; j < x.Length; j++) { double z = bias; for (int i = 0; i < n; i++) z += w[i] * x[j][i]; double p = Math.Min(1 - 1e-9, Math.Max(1e-9, 1 / (1 + Math.Exp(-z)))); total -= y[j] * Math.Log(p) + (1 - y[j]) * Math.Log(1 - p); }
                return total / x.Length;
            }
            // The given weights in the fit's own units: how much of a win one point of their score is worth.
            var direction = prior.ToArray().Select((value, i) => value * scale[i]).ToArray();
            double k = 0, bias0 = 0, size = Math.Sqrt(direction.Sum(v => v * v)); if (size <= 0) { note = "empty prior"; return null; }
            for (int step = 0; step < 600; step++)
            {
                double gk = 0, gb = 0;
                for (int j = 0; j < xs.Length; j++) { double u = 0; for (int i = 0; i < n; i++) u += direction[i] * xs[j][i]; u /= size; double error = 1 / (1 + Math.Exp(-(k * u + bias0))) - ys[j]; gk += error * u; gb += error; }
                k -= .5 * gk / xs.Length; bias0 -= .5 * gb / xs.Length;
            }
            var home = direction.Select(v => v * k / size).ToArray(); double homeSize = Math.Max(1e-9, home.Sum(v => v * v));
            double priorLoss = Loss(home, bias0, checkXs, checkYs);
            double[] best = null; double bestLoss = double.MaxValue, bestSpring = 0; var gradient = new double[n];
            foreach (double spring in new[] { 30, 10, 3, 1, .3, .1, .03, .01 })
            {
                var w = (double[])home.Clone(); double bias = bias0, rate = 1 / (2.5 + 2 * spring / homeSize);
                for (int step = 0; step < 1500; step++)
                {
                    Array.Clear(gradient, 0, n); double gb = 0;
                    for (int j = 0; j < xs.Length; j++) { double z = bias; var x = xs[j]; for (int i = 0; i < n; i++) z += w[i] * x[i]; double error = 1 / (1 + Math.Exp(-z)) - ys[j]; for (int i = 0; i < n; i++) gradient[i] += error * x[i]; gb += error; }
                    for (int i = 0; i < n; i++) w[i] -= rate * (gradient[i] / xs.Length + 2 * spring * (w[i] - home[i]) / homeSize);
                    bias -= rate * gb / xs.Length;
                }
                double loss = Loss(w, bias, checkXs, checkYs);
                if (loss < bestLoss) { bestLoss = loss; best = w; bestSpring = spring; }
            }
            note = "spring " + bestSpring.ToString("0.##") + ", loss on matches kept aside " + priorLoss.ToString("0.0000") + " -> " + bestLoss.ToString("0.0000");
            if (bestLoss >= priorLoss) { note += " - no better than the weights it started from"; return null; }
            var raw = best.Select((value, i) => value / scale[i]).ToArray();
            if (raw[0] <= 1e-9) { note += " - base HP came out worthless, fit rejected"; return null; }
            double unit = new AiWeights().baseHp / raw[0]; var values = new float[n]; var cut = new List<string>();
            for (int i = 0; i < n; i++)
            {
                double value = raw[i] * unit;
                // Every number is defined so that more is better for the player; one that comes out negative is noise.
                if (value < 0) { cut.Add(AiWeights.Names[i] + " " + value.ToString("0.00")); value = 0; }
                values[i] = (float)Math.Min(60, value);
            }
            if (cut.Count > 0) note += "; came out below zero and were set to 0: " + string.Join(", ", cut);
            return AiWeights.FromArray(values);
        }
        // How often the weights call the result right: the share of positions in which the side they favour went on to win.
        static double Accuracy(List<LabSample> samples, AiWeights weights)
        {
            var w = weights.ToArray(); int right = 0, all = 0;
            foreach (var s in samples)
            {
                if (s.Result == .5f) continue;
                double z = 0; for (int i = 0; i < w.Length; i++) z += w[i] * s.F[i];
                if (z == 0) continue;
                all++; if ((z > 0) == (s.Result > .5f)) right++;
            }
            return all > 0 ? right * 100.0 / all : 0;
        }

        static int Train(Catalog catalog, string root, string[] args, int threads, string output)
        {
            int rounds = Int(args, "--rounds", 3), games = Int(args, "--games", 600), duel = Int(args, "--duel", 240), verify = Int(args, "--verify", 400);
            ulong seed = (ulong)Int(args, "--seed", 2026);
            var decks = catalog.Roster.Decks;
            // The matches the positions come from are played a little loosely, so the positions differ;
            // the matches that decide between two sets of weights are played without any chance in the choice.
            var loose = AiLevelSettings.For(AiLevel.Normal); loose.ScoreNoise = 3f;
            var strict = AiLevelSettings.For(AiLevel.Normal); strict.AimNoise = 0; strict.ScoreNoise = 0;
            var start = new AiWeights(); var champion = start; bool changed = false;
            var learn = new List<LabSample>(); var check = new List<LabSample>();
            var log = new StringBuilder(); var watch = Stopwatch.StartNew(); int played = 0;
            void Say(string line) { Console.WriteLine(line); log.AppendLine(line); File.WriteAllText(Path.Combine(output, "ailab-train.txt"), log.ToString()); }
            Say("AILAB train rounds=" + rounds + " games=" + games + " duel=" + duel + " verify=" + verify + " threads=" + threads + " seed=" + seed);
            Say("AILAB start    " + Text(start));
            for (int round = 1; round <= rounds; round++)
            {
                var results = new LabMatch[games]; var current = champion; int roundNumber = round;
                Parallel.For(0, games, new ParallelOptions { MaxDegreeOfParallelism = threads }, i =>
                {
                    // Every pair of decks in both seats; two games in three the champion plays itself, one in three the starting weights.
                    var a = new AiAgent { Level = loose, Weights = i % 3 == 1 ? start : current }; var b = new AiAgent { Level = loose, Weights = i % 3 == 2 ? start : current };
                    results[i] = Play(catalog, decks[i % decks.Length], decks[(i / decks.Length) % decks.Length], a, b, SelfPlayRng.Mix(seed, (ulong)(roundNumber * 100000 + i)), false, true);
                });
                for (int i = 0; i < games; i++)
                {
                    int game = played + i;
                    foreach (var sample in results[i].Samples) { sample.Game = game; (game % 5 == 4 ? check : learn).Add(sample); }   // every fifth match is kept aside to check the fit
                }
                played += games;
                // The positions are also written down, so a fit can be redone without replaying the matches.
                File.WriteAllLines(Path.Combine(output, "ailab-positions.csv"), new[] { "game,kept_aside,mover,result," + string.Join(",", AiWeights.Names) }.Concat(learn.Concat(check).Select(sample => sample.Game + "," + (sample.Game % 5 == 4 ? 1 : 0) + "," + sample.Mover + "," + sample.Result.ToString("0.0") + "," + string.Join(",", sample.F.Select(value => value.ToString("0.###"))))));
                var fitted = Fit(learn, check, champion, out string note);
                Say("AILAB round " + round + ": " + played + " matches, " + learn.Count + " positions to learn from, " + check.Count + " kept aside  [" + watch.Elapsed.TotalSeconds.ToString("0") + " s]");
                if (fitted == null) { Say("AILAB round " + round + ": no fit (" + note + ")"); continue; }
                Say("AILAB fitted   " + Text(fitted));
                Say("AILAB fit      " + note);
                Say("AILAB calls the winner right, on positions kept aside: start " + Accuracy(check, start).ToString("0.0") + "%, champion " + Accuracy(check, champion).ToString("0.0") + "%, fitted " + Accuracy(check, fitted).ToString("0.0") + "%");
                Duel(catalog, new AiAgent { Level = strict, Weights = fitted }, new AiAgent { Level = strict, Weights = champion }, duel, SelfPlayRng.Mix(seed, (ulong)(900000 + round)), threads, out int won, out int lost, out int open);
                // The fitted weights replace the champion only when they win the duel clearly.
                bool takes = Share(won, lost) >= 54;
                Say("AILAB round " + round + " duel fitted vs champion: " + won + ":" + lost + " (" + open + " drawn) = " + Share(won, lost).ToString("0.0") + "%" + (takes ? "  -> new champion" : "  -> champion stays") + "  [" + watch.Elapsed.TotalSeconds.ToString("0") + " s]");
                if (takes) { champion = fitted; changed = true; }
            }
            if (!changed) { Say("AILAB nothing saved: no fitted weights beat the starting ones clearly"); return 0; }
            Duel(catalog, new AiAgent { Level = strict, Weights = champion }, new AiAgent { Level = strict, Weights = start }, verify, SelfPlayRng.Mix(seed, 999983), threads, out int wins, out int losses, out int drawn);
            double share = Share(wins, losses);
            Say("AILAB verify champion vs starting weights on " + verify + " fresh matches: " + wins + ":" + losses + " (" + drawn + " drawn) = " + share.ToString("0.0") + "% of decided matches  [" + watch.Elapsed.TotalSeconds.ToString("0") + " s]");
            Say("AILAB champion " + Text(champion));
            // Kept only when really better: 55% of 400 matches is two standard deviations away from an even result.
            if (share >= 55)
            {
                File.WriteAllText(WeightsPath(root), JsonSerializer.Serialize(champion, new JsonSerializerOptions { IncludeFields = true, WriteIndented = true }) + "\n");
                Say("AILAB saved " + WeightsPath(root));
            }
            else Say("AILAB not saved: the champion is not clearly better than the starting weights");
            return 0;
        }

        // ---------------------------------------------------------------- tune
        // Learning by play (simultaneous perturbation). In every round each pair of matches draws a
        // random direction - every weight but the unit (base HP) either up or down by the same
        // share - and the computer with the weights pushed that way plays the computer with the
        // weights pushed the opposite way, once from each seat, on the same decks, map and seed.
        // The weights then move a small step along each direction, towards whichever side won.
        // One match says very little; thousands, each pulling a little, add up.
        static int Tune(Catalog catalog, string root, string[] args, int threads, string output)
        {
            int rounds = Int(args, "--rounds", 40), pairs = Int(args, "--pairs", 24), verify = Int(args, "--verify", 400);
            ulong seed = (ulong)Int(args, "--seed", 2026);
            const double push = .3, step = .15;
            var decks = catalog.Roster.Decks; int n = AiWeights.Count;
            var strict = AiLevelSettings.For(AiLevel.Normal); strict.AimNoise = 0; strict.ScoreNoise = 0;
            var start = new AiWeights(); var log = new StringBuilder(); var watch = Stopwatch.StartNew();
            void Say(string line) { Console.WriteLine(line); log.AppendLine(line); File.WriteAllText(Path.Combine(output, "ailab-tune.txt"), log.ToString()); }
            Say("AILAB tune rounds=" + rounds + " pairs=" + pairs + " (" + rounds * pairs * 2 + " matches) verify=" + verify + " threads=" + threads + " seed=" + seed);
            Say("AILAB start    " + Text(start));
            var theta = start.ToArray().Select(value => Math.Log(Math.Max(.02, value))).ToArray();
            var average = new double[n]; int averaged = 0; var random = new Random(unchecked((int)seed));
            AiWeights Weights(double[] logs, int[] direction, double sign) => AiWeights.FromArray(logs.Select((value, i) => (float)Math.Min(60, Math.Exp(value + (direction == null || i == 0 ? 0 : sign * push * direction[i])))).ToArray());
            for (int round = 1; round <= rounds; round++)
            {
                var directions = new int[pairs][]; var outcome = new int[pairs]; int roundNumber = round;
                for (int p = 0; p < pairs; p++) directions[p] = Enumerable.Range(0, n).Select(_ => random.Next(2) == 0 ? -1 : 1).ToArray();
                var current = (double[])theta.Clone();
                Parallel.For(0, pairs * 2, new ParallelOptions { MaxDegreeOfParallelism = threads }, i =>
                {
                    int p = i >> 1; bool swap = (i & 1) == 1; int game = (roundNumber - 1) * pairs + p;
                    var up = new AiAgent { Level = strict, Weights = Weights(current, directions[p], 1) }; var down = new AiAgent { Level = strict, Weights = Weights(current, directions[p], -1) };
                    var match = Play(catalog, decks[game % decks.Length], decks[(game / decks.Length + game + 1) % decks.Length], swap ? down : up, swap ? up : down, SelfPlayRng.Mix(seed, (ulong)(500000 + game)));
                    if (match.Finished && match.Winner >= 0) Interlocked.Add(ref outcome[p], (match.Winner == 0) != swap ? 1 : -1);
                });
                for (int i = 1; i < n; i++)
                {
                    double pull = 0; for (int p = 0; p < pairs; p++) pull += outcome[p] * directions[p][i];
                    theta[i] = Math.Max(Math.Log(.02), Math.Min(Math.Log(60), theta[i] + step * pull / pairs));
                }
                // The answer is the average of the second half of the walk, which is steadier than its last step.
                if (round > rounds / 2) { for (int i = 0; i < n; i++) average[i] += theta[i]; averaged++; }
                if (round % 5 == 0 || round == rounds) Say("AILAB round " + round + "  " + Text(Weights(theta, null, 0)) + "  [" + watch.Elapsed.TotalSeconds.ToString("0") + " s]");
            }
            var tuned = Weights(average.Select(value => value / Math.Max(1, averaged)).ToArray(), null, 0);
            Say("AILAB tuned    " + Text(tuned));
            Duel(catalog, new AiAgent { Level = strict, Weights = tuned }, new AiAgent { Level = strict, Weights = start }, verify, SelfPlayRng.Mix(seed, 999983), threads, out int wins, out int losses, out int drawn);
            double share = Share(wins, losses);
            Say("AILAB verify tuned vs starting weights on " + verify + " fresh matches: " + wins + ":" + losses + " (" + drawn + " drawn) = " + share.ToString("0.0") + "% of decided matches  [" + watch.Elapsed.TotalSeconds.ToString("0") + " s]");
            // Kept only when really better: 55% of 400 matches is two standard deviations away from an even result.
            if (share >= 55)
            {
                File.WriteAllText(WeightsPath(root), JsonSerializer.Serialize(tuned, new JsonSerializerOptions { IncludeFields = true, WriteIndented = true }) + "\n");
                Say("AILAB saved " + WeightsPath(root));
            }
            else Say("AILAB not saved: the tuned weights are not clearly better than the starting ones");
            return 0;
        }

        // ---------------------------------------------------------------- levels
        // What the game does: Easy judges with the plain starting weights, Normal and Hard with the learned ones.
        public static AiAgent GameAgent(AiLevel level, AiWeights learned) => new AiAgent { Level = AiLevelSettings.For(level), Weights = level == AiLevel.Easy ? new AiWeights() : learned };
        static int Levels(Catalog catalog, string root, string[] args, int threads, string output)
        {
            int games = Int(args, "--games", 120); var weights = LoadWeights(root); var log = new StringBuilder(); var watch = Stopwatch.StartNew();
            void Say(string line) { Console.WriteLine(line); log.AppendLine(line); File.WriteAllText(Path.Combine(output, "ailab-levels.txt"), log.ToString()); }
            Say("AILAB levels games=" + games + " weights " + Text(weights));
            foreach (var pair in new[] { (AiLevel.Normal, AiLevel.Easy), (AiLevel.Hard, AiLevel.Normal), (AiLevel.Hard, AiLevel.Easy) })
            {
                Duel(catalog, GameAgent(pair.Item1, weights), GameAgent(pair.Item2, weights), games, 4242, threads, out int wins, out int losses, out int open);
                Say("AILAB levels " + pair.Item1 + " vs " + pair.Item2 + ": " + wins + ":" + losses + " (" + open + " drawn) = " + Share(wins, losses).ToString("0.0") + "% for " + pair.Item1 + "  [" + watch.Elapsed.TotalSeconds.ToString("0") + " s]");
            }
            return 0;
        }

        // ---------------------------------------------------------------- balance
        static int Balance(Catalog catalog, string root, string[] args, int threads, string output)
        {
            int perPair = Int(args, "--per-pair", 12); var weights = LoadWeights(root); var decks = catalog.Roster.Decks;
            string opening = Array.IndexOf(args, "--no-bonus") >= 0 ? "none" : Arg(args, "--opening", "game");
            bool bonus = opening == "game" || opening == "any-bonus";
            var agent = GameAgent(AiLevel.Normal, weights);
            var jobs = new List<(int a, int b, int k)>();
            for (int a = 0; a < decks.Length; a++) for (int b = 0; b < decks.Length; b++) for (int k = 0; k < perPair; k++) jobs.Add((a, b, k));
            var results = new LabMatch[jobs.Count]; var watch = Stopwatch.StartNew(); int done = 0;
            Parallel.For(0, jobs.Count, new ParallelOptions { MaxDegreeOfParallelism = threads }, i =>
            {
                var job = jobs[i];
                results[i] = Play(catalog, decks[job.a], decks[job.b], agent, agent, SelfPlayRng.Mix(31337, (ulong)i), true, false, bonus, null, opening);
                int now = Interlocked.Increment(ref done);
                if (now % 100 == 0) Console.WriteLine("AILAB balance " + now + "/" + jobs.Count + " [" + watch.Elapsed.TotalSeconds.ToString("0") + " s]");
            });
            string path = Path.Combine(output, Arg(args, "--name", opening == "game" ? "balans" : opening == "none" ? "balans-bez-bonusu" : "balans-" + opening) + ".md");
            File.WriteAllText(path, BalanceReport(catalog, results, perPair, watch.Elapsed.TotalSeconds, weights, opening), new UTF8Encoding(false));
            Console.WriteLine("AILAB balance report " + path);
            return 0;
        }

        // ---------------------------------------------------------------- balls
        // The balance table of single shots cannot see what pays later (a trap, a field, a Sprout that
        // grows). This can: the deck built on the ball's group plays that same deck without the ball -
        // no copies of it, so eight special balls instead of nine - from both seats, on the same maps
        // and seeds. 50% = the deck loses nothing without it; well above = the ball carries the deck.
        public static DeckDefinition HomeDeck(Catalog catalog, string ball)
        {
            var group = BallGroups.Of(ball); var decks = catalog.Roster.Decks;
            return decks.FirstOrDefault(deck => group != null && group.Balls.All(deck.balls.Contains)) ?? decks.FirstOrDefault(deck => deck.balls.Contains(ball));
        }
        static int Balls(Catalog catalog, string root, string[] args, int threads, string output)
        {
            int games = Int(args, "--games", 80); var weights = LoadWeights(root); var agent = GameAgent(AiLevel.Normal, weights);
            // --group ice,poison: only the balls of those groups.
            string[] only = Arg(args, "--group", "").Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
            var balls = BallGroups.All.Where(group => only.Length == 0 || only.Contains(group.Id)).SelectMany(group => group.Balls).Where(id => HomeDeck(catalog, id) != null).ToArray();
            var wins = new int[balls.Length]; var losses = new int[balls.Length]; var watch = Stopwatch.StartNew(); int done = 0, total = balls.Length * games;
            Parallel.For(0, total, new ParallelOptions { MaxDegreeOfParallelism = threads }, i =>
            {
                int ball = i / games, k = i % games, pair = k >> 1; bool swap = (k & 1) == 1;
                var deck = HomeDeck(catalog, balls[ball]);
                var match = Play(catalog, deck, deck, agent, agent, SelfPlayRng.Mix(4711, (ulong)(ball * 1000 + pair)), false, false, true, swap ? new[] { balls[ball], null } : new[] { null, balls[ball] });
                if (match.Finished && match.Winner >= 0) { if ((match.Winner == 0) != swap) Interlocked.Increment(ref wins[ball]); else Interlocked.Increment(ref losses[ball]); }
                int now = Interlocked.Increment(ref done);
                if (now % 200 == 0) Console.WriteLine("AILAB balls " + now + "/" + total + " [" + watch.Elapsed.TotalSeconds.ToString("0") + " s]");
            });
            var text = new StringBuilder();
            text.AppendLine("# Core Clash - ile kulka daje swojej talii");
            text.AppendLine();
            text.AppendLine("- Dla każdej kulki: talia oparta na jej grupie gra **z tą samą talią bez tej kulki** (8 kulek specjalnych zamiast 9), " + games + " meczów, po połowie z każdego miejsca, te same mapy i losy dla obu stron.");
            text.AppendLine("- **Wygrane z kulką**: 50% = bez tej kulki talia gra tak samo; wyraźnie więcej = kulka niesie talię; wyraźnie mniej = talia gra lepiej bez niej (komputer sięga po nią, a ona mu szkodzi).");
            text.AppendLine("- Przy " + games + " meczach przypadek to około ±" + (100 / Math.Sqrt(games)).ToString("0") + " punktów procentowych; dopiero większe odchylenie od 50% coś znaczy.");
            text.AppendLine("- Mecze komputera z komputerem (poziom średni), czas liczenia " + watch.Elapsed.TotalSeconds.ToString("0") + " s.");
            text.AppendLine();
            text.AppendLine("| Kulka | Grupa | Talia | Wygrane z kulką | Mecze |");
            text.AppendLine("|---|---|---|---|---|");
            foreach (int ball in Enumerable.Range(0, balls.Length).OrderByDescending(b => Share(wins[b], losses[b])))
                text.AppendLine("| " + BallName(catalog, balls[ball]) + " | " + (BallGroups.Of(balls[ball])?.NamePl ?? "-") + " | " + (DeckText.NamePl(HomeDeck(catalog, balls[ball]).id) ?? HomeDeck(catalog, balls[ball]).name) + " | **" + Share(wins[ball], losses[ball]).ToString("0") + "%** | " + (wins[ball] + losses[ball]) + " |");
            text.AppendLine();
            text.AppendLine("| Grupa | Średnio wygranych z kulką |");
            text.AppendLine("|---|---|");
            foreach (var group in BallGroups.All)
            {
                var own = Enumerable.Range(0, balls.Length).Where(b => group.Balls.Contains(balls[b])).ToList(); if (own.Count == 0) continue;
                text.AppendLine("| " + group.NamePl + " | " + own.Average(b => Share(wins[b], losses[b])).ToString("0") + "% |");
            }
            if (RuleOverrides.Length > 0) { text.AppendLine(); text.AppendLine("**Eksperyment** - zasady meczu zmienione: `" + RuleOverrides + "`."); }
            string path = Path.Combine(output, Arg(args, "--name", "balans-kulki") + ".md");
            File.WriteAllText(path, text.ToString(), new UTF8Encoding(false));
            Console.WriteLine("AILAB balls report " + path);
            return 0;
        }

        // ---------------------------------------------------------------- groups
        // The six ready decks pair the groups one way only, and in a ring: from their results alone
        // nobody can tell which of the two groups of a strong deck is the strong one. Here every pair
        // of groups meets: a deck is the five balls of its main group and four of a second group (the
        // ball left out changes from match to match). Matches come in twos with the seats changed.
        public static DeckDefinition GroupDeck(BallGroup main, BallGroup second, int skip)
            => new DeckDefinition { id = main.Id + "+" + second.Id, name = main.NamePl + " + " + second.NamePl, balls = main.Balls.Concat(second.Balls.Where((_, i) => i != skip % second.Balls.Length)).ToArray() };
        static int Groups(Catalog catalog, string root, string[] args, int threads, string output)
        {
            int games = Int(args, "--games", 720); var weights = LoadWeights(root); var agent = GameAgent(AiLevel.Normal, weights);
            var groups = BallGroups.All; int kinds = groups.Length * (groups.Length - 1);
            (int main, int second) Kind(int index) { int main = index / (groups.Length - 1), second = index % (groups.Length - 1); return (main, second >= main ? second + 1 : second); }
            var results = new LabMatch[games]; var left = new (int a, int b, int skipA, int skipB)[games]; var watch = Stopwatch.StartNew(); int done = 0;
            Parallel.For(0, games, new ParallelOptions { MaxDegreeOfParallelism = threads }, i =>
            {
                int pair = i >> 1; bool swap = (i & 1) == 1; ulong seed = SelfPlayRng.Mix(90210, (ulong)pair);
                // Every kind of deck plays equally often; its opponent and the balls left out are drawn.
                int a = pair % kinds, b = (a + 1 + (int)(SelfPlayRng.Mix(seed, 3) % (ulong)(kinds - 1))) % kinds;
                int skipA = (int)(SelfPlayRng.Mix(seed, 4) % 5), skipB = (int)(SelfPlayRng.Mix(seed, 5) % 5);
                var deckA = GroupDeck(groups[Kind(a).main], groups[Kind(a).second], skipA); var deckB = GroupDeck(groups[Kind(b).main], groups[Kind(b).second], skipB);
                results[i] = swap ? Play(catalog, deckB, deckA, agent, agent, seed, true) : Play(catalog, deckA, deckB, agent, agent, seed, true);
                left[i] = swap ? (b, a, skipB, skipA) : (a, b, skipA, skipB);
                int now = Interlocked.Increment(ref done);
                if (now % 100 == 0) Console.WriteLine("AILAB groups " + now + "/" + games + " [" + watch.Elapsed.TotalSeconds.ToString("0") + " s]");
            });
            // One line per deck that played: which groups, which ball was left out, did it win.
            var rows = new List<(int main, int second, string skipped, bool won, bool first)>();
            // What happened to the balls of the OTHER side (and deaths on both), summed for each main group.
            string[] watched = { "DEATH", "ICE", "FREEZE", "SHATTER", "FIRE", "TOXIN", "ROOTED", "JAM", "ZAP", "THORNS" };
            var inflicted = new double[groups.Length, watched.Length]; var lost = new double[groups.Length]; var healed = new double[groups.Length]; var played = new int[groups.Length];
            for (int i = 0; i < games; i++)
            {
                var match = results[i]; if (match == null) continue;
                for (int seat = 0; seat < 2; seat++)
                {
                    int main = Kind(seat == 0 ? left[i].a : left[i].b).main; played[main]++;
                    for (int k = 0; k < watched.Length; k++) { match.Events[1 - seat].TryGetValue(watched[k], out int n); inflicted[main, k] += n; }
                    match.Events[seat].TryGetValue("DEATH", out int deaths); lost[main] += deaths;
                    match.Events[seat].TryGetValue("HEAL", out int heals); healed[main] += heals;
                }
            }
            for (int i = 0; i < games; i++)
            {
                var match = results[i]; if (match == null || !match.Finished || match.Winner < 0) continue;
                var a = Kind(left[i].a); var b = Kind(left[i].b);
                rows.Add((a.main, a.second, groups[a.second].Balls[left[i].skipA % groups[a.second].Balls.Length], match.Winner == 0, true));
                rows.Add((b.main, b.second, groups[b.second].Balls[left[i].skipB % groups[b.second].Balls.Length], match.Winner == 1, false));
            }
            string Won(IEnumerable<(int main, int second, string skipped, bool won, bool first)> part) { var list = part.ToList(); return list.Count == 0 ? "-" : (list.Count(r => r.won) * 100.0 / list.Count).ToString("0") + "%"; }
            var text = new StringBuilder();
            text.AppendLine("# Core Clash - siła grup kulek");
            text.AppendLine();
            text.AppendLine("- Każda para grup spotyka się tu z każdą: talia to 5 kulek grupy głównej i 4 kulki drugiej grupy (pomijana kulka zmienia się z meczu na mecz). Mecze parami, z zamianą miejsc.");
            text.AppendLine("- Mecze: **" + games + "**, rozstrzygnięte: " + rows.Count / 2 + ", zaczynający wygrywa " + Won(rows.Where(r => r.first)) + ", czas liczenia " + watch.Elapsed.TotalSeconds.ToString("0") + " s. Komputer z komputerem, poziom średni, zasady gry" + (RuleOverrides.Length > 0 ? " ze zmianą: `" + RuleOverrides + "`" : "") + ".");
            text.AppendLine("- 50% = grupa równa pozostałym. Przy tej liczbie meczów przypadek to około ±" + (100 / Math.Sqrt(Math.Max(1, rows.Count / 3))).ToString("0") + " punktów na grupę.");
            text.AppendLine();
            text.AppendLine("| Grupa | Wygrane talii z tą grupą | jako główna (5 kulek) | jako druga (4 kulki) | Talie |");
            text.AppendLine("|---|---|---|---|---|");
            for (int g = 0; g < groups.Length; g++)
                text.AppendLine("| " + groups[g].NamePl + " | **" + Won(rows.Where(r => r.main == g || r.second == g)) + "** | " + Won(rows.Where(r => r.main == g)) + " | " + Won(rows.Where(r => r.second == g)) + " | " + rows.Count(r => r.main == g || r.second == g) + " |");
            text.AppendLine();
            text.AppendLine("Każda talia osobno (wiersz = grupa główna, kolumna = druga grupa):");
            text.AppendLine();
            text.AppendLine("| główna \\ druga | " + string.Join(" | ", groups.Select(g => g.NamePl)) + " |");
            text.AppendLine("|---|" + string.Concat(groups.Select(_ => "---|")));
            for (int main = 0; main < groups.Length; main++)
                text.AppendLine("| " + groups[main].NamePl + " | " + string.Join(" | ", Enumerable.Range(0, groups.Length).Select(second => second == main ? "·" : Won(rows.Where(r => r.main == main && r.second == second)))) + " |");
            text.AppendLine();
            text.AppendLine("Kulka pominięta w talii, w której jej grupa jest drugą (wyraźnie powyżej średniej grupy = talia gra lepiej BEZ tej kulki; mało meczów, tylko wskazówka):");
            text.AppendLine();
            text.AppendLine("| Kulka | Grupa | Wygrane talii bez niej | Wygrane talii z nią | Mecze bez niej |");
            text.AppendLine("|---|---|---|---|---|");
            for (int g = 0; g < groups.Length; g++)
                foreach (string ball in groups[g].Balls)
                    text.AppendLine("| " + BallName(catalog, ball) + " | " + groups[g].NamePl + " | " + Won(rows.Where(r => r.second == g && r.skipped == ball)) + " | " + Won(rows.Where(r => r.second == g && r.skipped != ball)) + " | " + rows.Count(r => r.second == g && r.skipped == ball) + " |");
            text.AppendLine();
            text.AppendLine("Co talia robi przeciwnikowi, średnio na mecz (wiersz = grupa główna talii):");
            text.AppendLine();
            text.AppendLine("| Grupa główna | Zabite kulki wroga | Stracone własne | Mróz | Zamrożenie | Skruszenie | Ogień | Trucizna | Oplątanie | Wyłączenie | Piorun | Kolce | Własne leczenia |");
            text.AppendLine("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
            for (int g = 0; g < groups.Length; g++)
            {
                if (played[g] == 0) continue;
                text.AppendLine("| " + groups[g].NamePl + " | " + (inflicted[g, 0] / played[g]).ToString("0.0") + " | " + (lost[g] / played[g]).ToString("0.0") + " | "
                    + string.Join(" | ", Enumerable.Range(1, watched.Length - 1).Select(k => (inflicted[g, k] / played[g]).ToString("0.0"))) + " | " + (healed[g] / played[g]).ToString("0.0") + " |");
            }
            if (RuleOverrides.Length > 0) { text.AppendLine(); text.AppendLine("**Eksperyment** - zasady meczu zmienione: `" + RuleOverrides + "`."); }
            string path = Path.Combine(output, Arg(args, "--name", "balans-grupy") + ".md");
            File.WriteAllText(path, text.ToString(), new UTF8Encoding(false));
            Console.WriteLine("AILAB groups report " + path);
            return 0;
        }

        static string BallName(Catalog catalog, string id) => BallGuide.NamePl(id) ?? catalog.Ball(id)?.name ?? id;
        static string Percent(int part, int all) => all > 0 ? (part * 100.0 / all).ToString("0") + "%" : "-";
        static string BalanceReport(Catalog catalog, LabMatch[] matches, int perPair, double seconds, AiWeights weights, string opening)
        {
            string experiment = opening == "none" ? "gracz 2 NIE dostaje dodatkowego strzału w pierwszej turze"
                : opening == "any-bonus" ? "dodatkowy strzał gracza 2 w pierwszej turze może być dowolną kulką (reguła wzorcowa)"
                : opening == "standard-first" ? "gracz 2 NIE dostaje dodatkowego strzału, a pierwszy strzał gracza 1 może być tylko Zwykłą kulką" : null;
            var decks = catalog.Roster.Decks; var text = new StringBuilder();
            var decided = matches.Where(m => m.Finished && m.Winner >= 0).ToList();
            text.AppendLine("# Core Clash - raport balansu z symulacji" + (experiment == null ? "" : " (wariant otwarcia: " + opening + ")"));
            text.AppendLine();
            if (experiment != null) text.AppendLine("- **Eksperyment:** w tych meczach " + experiment + ". Reszta zasad bez zmian.");
            text.AppendLine("- Mecze: **" + matches.Length + "** (" + perPair + " na każdą parę talii w każdej kolejności), rozstrzygnięte: " + decided.Count + ", remisy: " + matches.Count(m => m.Finished && m.Winner < 0) + ", czas liczenia: " + seconds.ToString("0") + " s.");
            text.AppendLine("- Obie strony gra ten sam komputer (poziom średni), na zasadach gry: kulki ×1,5, podwójna tura poniżej 10 HP bazy, losowa mapa, każda kulka 30 HP, proste moce, jedno pole w jednym miejscu, dodatkowa kulka gracza 2 na otwarcie tylko Zwykła, zamrożenie trwa 2 tury (liczby balansu z 24.11.2026).");
            text.AppendLine("- To są mecze komputera z komputerem. Mówią, co jest mocne **w rękach tego komputera**; człowiek może grać kulką lepiej albo gorzej.");
            text.AppendLine();
            text.AppendLine("## Mecz");
            text.AppendLine();
            text.AppendLine("- Średnia długość: **" + matches.Average(m => m.Turns).ToString("0.0") + " tur** (najkrótszy " + matches.Min(m => m.Turns) + ", najdłuższy " + matches.Max(m => m.Turns) + ").");
            text.AppendLine("- Gracz zaczynający wygrywa **" + Percent(decided.Count(m => m.Winner == 0), decided.Count) + "** rozstrzygniętych meczów (50% = brak przewagi pierwszego ruchu).");
            text.AppendLine();
            text.AppendLine("| Mapa | Mecze | Wygrywa zaczynający | Średnio tur |");
            text.AppendLine("|---|---|---|---|");
            foreach (var map in MatchMaps.All)
            {
                var on = matches.Where(m => m.Map == map.Id).ToList(); if (on.Count == 0) continue;
                var onDecided = on.Where(m => m.Finished && m.Winner >= 0).ToList();
                text.AppendLine("| " + map.NamePl + " | " + on.Count + " | " + Percent(onDecided.Count(m => m.Winner == 0), onDecided.Count) + " | " + on.Average(m => m.Turns).ToString("0.0") + " |");
            }
            text.AppendLine();
            text.AppendLine("## Talie");
            text.AppendLine();
            text.AppendLine("Bez meczów talii z samą sobą. 50% = talia równa pozostałym.");
            text.AppendLine();
            text.AppendLine("| Talia | Wygrane | gdy zaczyna | gdy jest druga | Mecze |");
            text.AppendLine("|---|---|---|---|---|");
            foreach (var deck in decks)
            {
                var asFirst = decided.Where(m => m.DeckA == deck.id && m.DeckB != deck.id).ToList();
                var asSecond = decided.Where(m => m.DeckB == deck.id && m.DeckA != deck.id).ToList();
                int wonFirst = asFirst.Count(m => m.Winner == 0), wonSecond = asSecond.Count(m => m.Winner == 1);
                text.AppendLine("| " + (DeckText.NamePl(deck.id) ?? deck.name) + " | **" + Percent(wonFirst + wonSecond, asFirst.Count + asSecond.Count) + "** | " + Percent(wonFirst, asFirst.Count) + " | " + Percent(wonSecond, asSecond.Count) + " | " + (asFirst.Count + asSecond.Count) + " |");
            }
            text.AppendLine();
            text.AppendLine("Kto z kim (wiersz = talia zaczynająca, liczba = jej wygrane):");
            text.AppendLine();
            text.AppendLine("| zaczyna \\ druga | " + string.Join(" | ", decks.Select(d => DeckText.NamePl(d.id) ?? d.name)) + " |");
            text.AppendLine("|---|" + string.Concat(decks.Select(_ => "---|")));
            foreach (var a in decks)
                text.AppendLine("| " + (DeckText.NamePl(a.id) ?? a.name) + " | " + string.Join(" | ", decks.Select(b => { var pair = decided.Where(m => m.DeckA == a.id && m.DeckB == b.id).ToList(); return Percent(pair.Count(m => m.Winner == 0), pair.Count); })) + " |");
            text.AppendLine();

            // What each deck does to the other side, per match (mirror matches left out).
            string[] watched = { "DEATH", "FREEZE", "SHATTER", "FIRE", "TOXIN", "DRAIN", "ROOTED", "JAM", "ZAP", "THORNS" };
            text.AppendLine("Co talia robi przeciwnikowi, średnio na mecz:");
            text.AppendLine();
            text.AppendLine("| Talia | Zabite kulki wroga | Stracone własne | Zamrożenia | Skruszenia | Podpalenia | Zatrucia | Wyssania | Oplątania | Wyłączenia | Pioruny | Kolce | Własne leczenia |");
            text.AppendLine("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
            foreach (var deck in decks)
            {
                var sums = new double[watched.Length]; double lostOwn = 0, heals = 0; int count = 0;
                foreach (var match in matches)
                {
                    if (match.DeckA == match.DeckB || (match.DeckA != deck.id && match.DeckB != deck.id)) continue;
                    int seat = match.DeckA == deck.id ? 0 : 1; count++;
                    for (int k = 0; k < watched.Length; k++)
                    {
                        // A drain is the Leech's own event; everything else is counted on the ball it happened to.
                        match.Events[watched[k] == "DRAIN" ? seat : 1 - seat].TryGetValue(watched[k], out int n); sums[k] += n;
                    }
                    match.Events[seat].TryGetValue("DEATH", out int deaths); lostOwn += deaths;
                    match.Events[seat].TryGetValue("HEAL", out int healed); heals += healed;
                }
                if (count == 0) continue;
                text.AppendLine("| " + (DeckText.NamePl(deck.id) ?? deck.name) + " | " + (sums[0] / count).ToString("0.0") + " | " + (lostOwn / count).ToString("0.0") + " | "
                    + string.Join(" | ", Enumerable.Range(1, watched.Length - 1).Select(k => (sums[k] / count).ToString("0.0"))) + " | " + (heals / count).ToString("0.0") + " |");
            }
            text.AppendLine();
            if (RuleOverrides.Length > 0) { text.AppendLine("**Eksperyment** - zasady meczu zmienione: `" + RuleOverrides + "`."); text.AppendLine(); }

            var edge = new Dictionary<string, double>(); var seen = new Dictionary<string, int>(); var launched = new Dictionary<string, int>();
            foreach (var match in matches)
            {
                foreach (var pair in match.EdgeSum) { edge.TryGetValue(pair.Key, out double s); edge[pair.Key] = s + pair.Value; }
                foreach (var pair in match.EdgeCount) { seen.TryGetValue(pair.Key, out int c); seen[pair.Key] = c + pair.Value; }
                foreach (var pair in match.Launched) { launched.TryGetValue(pair.Key, out int c); launched[pair.Key] = c + pair.Value; }
            }
            double PerShot(string id) => edge.TryGetValue(id, out double sum) && seen.TryGetValue(id, out int n) && n > 0 ? sum / n / Math.Max(.01f, weights.baseHp) : 0;
            text.AppendLine("## Kulki");
            text.AppendLine();
            text.AppendLine("**Zysk nad Zwykłą** = o ile lepsza jest pozycja po najlepszym strzale tą kulką niż po najlepszym strzale Zwykłą w tej samej sytuacji, przeliczone na HP bazy (średnia ze wszystkich sytuacji, w których komputer brał kulkę pod uwagę). 0 = tyle co Zwykła; ujemne = Zwykła była lepsza.");
            text.AppendLine("**Wybierana** = jak często komputer ją wystrzelił, gdy brał ją pod uwagę.");
            text.AppendLine();
            text.AppendLine("Uwaga: komputer ocenia pozycję zaraz po strzale. Kulki, które płacą później (pułapki, miny, Kiełek, Kwiat, pola), wypadają tu słabiej, niż grają naprawdę; o nich lepiej mówi tabela talii.");
            text.AppendLine();
            text.AppendLine("| Kulka | Grupa | Zysk nad Zwykłą (HP bazy) | Wybierana | Sytuacje |");
            text.AppendLine("|---|---|---|---|---|");
            foreach (string id in edge.Keys.OrderByDescending(PerShot))
            {
                launched.TryGetValue(id, out int shots);
                text.AppendLine("| " + BallName(catalog, id) + " | " + (BallGroups.Of(id)?.NamePl ?? "-") + " | " + PerShot(id).ToString("+0.00;-0.00") + " | " + Percent(shots, seen[id]) + " | " + seen[id] + " |");
            }
            text.AppendLine();
            text.AppendLine("| Grupa | Średni zysk nad Zwykłą (HP bazy) | Najmocniejsza | Najsłabsza |");
            text.AppendLine("|---|---|---|---|");
            foreach (var group in BallGroups.All)
            {
                var known = group.Balls.Where(edge.ContainsKey).OrderByDescending(PerShot).ToList(); if (known.Count == 0) continue;
                text.AppendLine("| " + group.NamePl + " | " + known.Average(PerShot).ToString("+0.00;-0.00") + " | " + BallName(catalog, known.First()) + " " + PerShot(known.First()).ToString("+0.00;-0.00") + " | " + BallName(catalog, known.Last()) + " " + PerShot(known.Last()).ToString("+0.00;-0.00") + " |");
            }
            launched.TryGetValue("normal", out int standardShots);
            text.AppendLine();
            text.AppendLine("Zwykła kulka: " + standardShots + " z " + matches.Sum(m => m.Launched.Values.Sum()) + " wszystkich strzałów (" + Percent(standardShots, matches.Sum(m => m.Launched.Values.Sum())) + ").");
            text.AppendLine();
            text.AppendLine("Wagi oceny pozycji użyte w tych meczach: " + Text(weights) + ".");
            return text.ToString();
        }
    }
}
