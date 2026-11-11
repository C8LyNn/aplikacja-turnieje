using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using CoreClash.Core;
using CoreClash.Input;
using CoreClash.Presentation;
using UnityEngine;

namespace CoreClash.Testing
{
    // Opt-in visual showcase for before/after comparisons:
    //   CoreClash.exe --cc-visual-showcase --cc-output <absolute directory>
    // Never runs in ordinary play. It uses only the public app/simulation API, so the
    // same file builds against older presentation code. Scenes are staged by the driver
    // (direct Spawn plus the real status/damage/explosion calls of the simulation); the
    // launch recorded in clip/ goes through the normal pointer gesture.
    public sealed class VisualShowcaseDriver : MonoBehaviour
    {
        const string DeckA = "featured_status_reactor", DeckB = "featured_gravity_trap";
        static readonly string[] DenseTypes = {
            "normal","fire","ice","mine","timebomb","web","plague","leech","medic","shield","magnet","anchor","ram","phase",
            "dart","splitter","colossus","tesla","quake","glue","pulse","breaker","bomb","regen","normal","mine","timebomb","fire" };
        CoreClashApp app;
        string output = "";
        float started;
        int repaints, lastRepaint = -1;
        bool finished;
        readonly List<string> captures = new List<string>();

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Attach()
        {
            if (!Environment.GetCommandLineArgs().Contains("--cc-visual-showcase")) return;
            var target = UnityEngine.Object.FindAnyObjectByType<CoreClashApp>();
            if (target == null) { Debug.LogError("CC_VISUAL_SHOWCASE_FAIL no CoreClashApp in the scene"); Application.Quit(1); return; }
            if (target.GetComponent<VisualShowcaseDriver>() == null) target.gameObject.AddComponent<VisualShowcaseDriver>();
        }

        void Start()
        {
            started = Time.realtimeSinceStartup;
            app = GetComponent<CoreClashApp>();
            string[] args = Environment.GetCommandLineArgs();
            int index = Array.IndexOf(args, "--cc-output");
            if (index < 0 || index + 1 >= args.Length || !Path.IsPathRooted(args[index + 1])) { Fail("--cc-output must name an absolute directory"); return; }
            output = Path.GetFullPath(args[index + 1]);
            Directory.CreateDirectory(output);
            StartCoroutine(Guarded());
        }

        void OnGUI()
        {
            if (Event.current.type != EventType.Repaint || lastRepaint == Time.frameCount) return;
            lastRepaint = Time.frameCount; repaints++;
        }

        // Flattens nested steps so every exception and the time limit are handled in one place.
        IEnumerator Guarded()
        {
            var stack = new Stack<IEnumerator>();
            stack.Push(Run());
            while (stack.Count > 0 && !finished)
            {
                bool more;
                try { more = stack.Peek().MoveNext(); }
                catch (Exception exception) { Fail(exception.ToString()); yield break; }
                if (!more) { stack.Pop(); continue; }
                if (stack.Peek().Current is IEnumerator child) { stack.Push(child); continue; }
                if (Time.realtimeSinceStartup - started > 280) { Fail("showcase exceeded 280 seconds"); yield break; }
                yield return null;
            }
        }

        IEnumerator Run()
        {
            while (!UnityEngine.Rendering.SplashScreen.isFinished || Time.realtimeSinceStartup - started < 3 || repaints < 3) yield return null;
            Require(app != null && app.Catalog != null && app.Simulation != null && app.IsSetup, "the app did not open on deck selection");
            app.SetDeveloperOverlay(false);
            app.SelectDeck(0, DeckA); app.SelectDeck(1, DeckB);
            yield return Capture("00-deck-selection");

            // Sparse arena.
            app.StartLocalMatch();
            var sim = app.Simulation;
            Place(sim, 0, "normal", 170, 640); Place(sim, 0, "fire", 372, 560);
            Place(sim, 1, "normal", 300, 250); Place(sim, 1, "ice", 150, 330); Place(sim, 1, "shield", 410, 215);
            yield return Seconds(1.4f);
            yield return Capture("01-arena-sparse");
            var stock = sim.State.players[0].stock.FirstOrDefault(entry => entry.remaining > 0);
            if (stock != null) app.SelectBall(stock.id);
            yield return Capture("02-hud-special-selected");

            Vector2 launcher = ScreenPoint(270, 853), aim = ScreenPoint(318, 660);
            app.PresentationPointer(new PointerSample { id = 77, position = launcher, down = true, held = true });
            app.PresentationPointer(new PointerSample { id = 77, position = aim, held = true });
            yield return Capture("03-aim");
            app.PresentationPointer(new PointerSample { id = 77, position = aim, canceled = true });

            // Clip frames: aim, launch, resolution and turn change through the normal pointer gesture.
            app.SelectBall("normal");
            yield return null;
            string clip = Path.Combine(output, "clip");
            Directory.CreateDirectory(clip);
            var times = new StringBuilder("frame,unscaledTime,phase,turn\n");
            int frame = 0, action = sim.State.actionSerial;
            Time.captureFramerate = 30;
            Vector2 target = ScreenPoint(296, 640);
            for (int i = 0; i < 12; i++) { Shot(clip, times, sim, ref frame); yield return null; }
            app.PresentationPointer(new PointerSample { id = 78, position = launcher, down = true, held = true });
            for (int i = 1; i <= 34; i++)
            {
                float t = i / 34f; t = t * t * (3 - 2 * t);
                app.PresentationPointer(new PointerSample { id = 78, position = Vector2.Lerp(launcher, target, t), held = true });
                Shot(clip, times, sim, ref frame); yield return null;
            }
            for (int i = 0; i < 14; i++)
            {
                app.PresentationPointer(new PointerSample { id = 78, position = target, held = true });
                Shot(clip, times, sim, ref frame); yield return null;
            }
            app.PresentationPointer(new PointerSample { id = 78, position = target, up = true });
            Require(sim.State.actionSerial == action + 1, "the pointer gesture did not launch a ball");
            for (int i = 0; i < 420 && sim.State.phase == MatchPhase.Moving; i++) { Shot(clip, times, sim, ref frame); yield return null; }
            for (int i = 0; i < 50; i++) { Shot(clip, times, sim, ref frame); yield return null; }
            Time.captureFramerate = 0;
            File.WriteAllText(Path.Combine(clip, "times.csv"), times.ToString());
            Debug.Log("CC_VISUAL_CLIP frames=" + frame);
            yield return Seconds(1.2f);
            yield return Capture("04-after-shot-turn-change");

            // Status, shield and damage feedback produced by the real simulation calls.
            var live = sim.State.balls.Where(ball => !ball.dead && !ball.banished).ToList();
            Require(live.Count >= 5, "sparse scene lost its balls");
            sim.Abilities.ApplyFire(live[0], 1 - live[0].owner); sim.Abilities.ApplyFire(live[0], 1 - live[0].owner);
            sim.Abilities.ApplyIce(live[1], 1 - live[1].owner);
            sim.Abilities.ApplyToxin(live[2], 1 - live[2].owner);
            sim.Shield(live[3], 10);
            sim.Damage(live[4], 5, true);
            yield return Seconds(.25f);
            yield return Capture("05-status-shield-damage-feedback");
            yield return Seconds(1.4f);
            yield return Capture("06-statuses-settled");

            var victim = sim.State.balls.FirstOrDefault(ball => !ball.dead && !ball.banished && ball.owner == 1);
            if (victim != null)
            {
                var bomb = sim.Spawn(0, Type("bomb"), Mathf.Clamp(victim.x + 54, 60, 480), Mathf.Clamp(victim.y + 34, 60, 840));
                yield return Seconds(.6f);
                sim.Abilities.OnStop(bomb);
                Still(sim);
                yield return Seconds(.1f);
                yield return Capture("07-explosion");
            }

            // Dense board: 28 balls, mixed owners, types and states.
            app.StartLocalMatch();
            sim = app.Simulation;
            uint seed = 20261111; int placed = 0;
            for (int row = 0; row < 6; row++)
            for (int column = 0; column < 5; column++)
            {
                if ((row == 0 || row == 5) && column == 2) continue; // keep both launchers free
                seed = seed * 1664525u + 1013904223u; float jitterX = ((seed >> 16) % 33) - 16f;
                seed = seed * 1664525u + 1013904223u; float jitterY = ((seed >> 16) % 33) - 16f;
                int owner = row < 3 ? 1 : 0;
                if ((row * 5 + column) % 7 == 3) owner = 1 - owner;
                Place(sim, owner, DenseTypes[placed % DenseTypes.Length], 70 + column * 100 + jitterX, 112 + row * 135 + jitterY);
                placed++;
            }
            var dense = sim.State.balls.Where(ball => !ball.dead && !ball.banished).ToList();
            for (int i = 0; i < dense.Count; i++)
            {
                var ball = dense[i];
                if (ball.dead) continue;
                if (ball.type == "mine" || ball.type == "timebomb") { sim.Abilities.OnStop(ball); continue; }
                if (i % 4 == 0) { sim.Abilities.ApplyFire(ball, 1 - ball.owner); if (i % 8 == 0) sim.Abilities.ApplyFire(ball, 1 - ball.owner); }
                if (i % 5 == 1) sim.Abilities.ApplyIce(ball, 1 - ball.owner);
                if (i % 6 == 2) sim.Abilities.ApplyToxin(ball, 1 - ball.owner);
                if (i % 7 == 3) sim.Shield(ball, 10);
                if (i % 3 == 1) sim.Damage(ball, 10, true);
                if (i % 9 == 4) sim.Abilities.Root(ball);
            }
            Still(sim);
            yield return Seconds(1.6f);
            yield return Capture("08-dense-board");
            foreach (var ball in dense.Where(ball => !ball.dead).Take(8)) sim.Damage(ball, 5, true);
            foreach (var ball in dense.Where(ball => !ball.dead).Skip(8).Take(3)) sim.Heal(ball, 5);
            Still(sim);
            yield return Seconds(.25f);
            yield return Capture("09-dense-overlapping-feedback");
            yield return Seconds(1.4f);

            app.SelectBall("normal");
            app.PresentationPointer(new PointerSample { id = 79, position = launcher, down = true, held = true });
            app.PresentationPointer(new PointerSample { id = 79, position = ScreenPoint(215, 610), held = true });
            yield return Capture("10-dense-aim");
            app.PresentationPointer(new PointerSample { id = 79, position = launcher, canceled = true });
            var replay = sim.State.balls.FirstOrDefault(ball => sim.CanReplay(ball));
            if (replay != null)
            {
                Vector2 grab = ScreenPoint(replay.x, replay.y);
                app.PresentationPointer(new PointerSample { id = 80, position = grab, down = true, held = true });
                app.PresentationPointer(new PointerSample { id = 80, position = ScreenPoint(replay.x + 40, replay.y - 190), held = true });
                yield return Capture("11-dense-replay-aim");
                app.PresentationPointer(new PointerSample { id = 80, position = grab, canceled = true });
            }
            var inspected = sim.State.balls.Where(ball => !ball.dead && !ball.banished).OrderByDescending(ball => BallInspection.Statuses(ball).Length).First();
            app.ShowRuntimeBallDetails(inspected.id);
            yield return Capture("12-ball-details");
            app.CloseBallDetails();

            File.WriteAllText(Path.Combine(output, "showcase.txt"),
                "unity=" + Application.unityVersion + "\nscreen=" + Screen.width + "x" + Screen.height + "\ndpi=" + Screen.dpi.ToString(CultureInfo.InvariantCulture) +
                "\ndenseBalls=" + dense.Count + "\nclipFrames=" + frame + "\ncaptures=" + string.Join(",", captures) + "\n");
            finished = true;
            Debug.Log("CC_VISUAL_SHOWCASE_PASS captures=" + captures.Count + " clipFrames=" + frame + " size=" + Screen.width + "x" + Screen.height);
            Application.Quit(0);
        }

        static void Shot(string directory, StringBuilder times, GameSimulation sim, ref int frame)
        {
            frame++;
            ScreenCapture.CaptureScreenshot(Path.Combine(directory, "f" + frame.ToString("0000", CultureInfo.InvariantCulture) + ".png"));
            times.Append(frame).Append(',').Append(Time.unscaledTime.ToString("0.0000", CultureInfo.InvariantCulture)).Append(',')
                .Append(sim.State.phase).Append(',').Append(sim.State.turn).Append('\n');
        }

        IEnumerator Seconds(float seconds)
        {
            float end = Time.realtimeSinceStartup + seconds;
            while (Time.realtimeSinceStartup < end) yield return null;
        }

        IEnumerator Capture(string name)
        {
            string path = Path.Combine(output, name + ".png");
            if (File.Exists(path)) File.Delete(path);
            yield return null; yield return null; // let the staged state be painted first
            ScreenCapture.CaptureScreenshot(path);
            int requested = Time.frameCount; float limit = Time.realtimeSinceStartup + 12;
            while (Time.frameCount < requested + 3 || !File.Exists(path) || new FileInfo(path).Length < 1024)
            {
                if (Time.realtimeSinceStartup > limit) throw new InvalidOperationException("capture was not written: " + name);
                yield return null;
            }
            captures.Add(name + ".png");
            Debug.Log("CC_VISUAL_CAPTURE " + name + ".png " + Screen.width + "x" + Screen.height);
        }

        string Type(string id) => app.Catalog.Ball(id) != null ? id : "normal";
        BallRuntime Place(GameSimulation sim, int owner, string type, float x, float y)
        {
            var ball = sim.Spawn(owner, Type(type), x, y);
            ball.vx = ball.vy = 0; ball.moving = false;
            return ball;
        }
        static void Still(GameSimulation sim) { foreach (var ball in sim.State.balls) { ball.vx = ball.vy = 0; ball.moving = false; } }

        Vector2 ScreenPoint(float worldX, float worldY)
        {
            Rect arena = app.ArenaRect;
            Require(arena.width > 0 && arena.height > 0, "the arena has no layout");
            float scale = arena.width / 540;
            return new Vector2(arena.x + worldX * scale, Screen.height - (arena.y + worldY * scale));
        }

        static void Require(bool condition, string message) { if (!condition) throw new InvalidOperationException(message); }
        void Fail(string message)
        {
            if (finished) return;
            finished = true;
            Time.captureFramerate = 0;
            Debug.LogError("CC_VISUAL_SHOWCASE_FAIL " + message);
            Application.Quit(1);
        }
    }
}
