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
    // CC-001 W24: before/after showcase for the visual overhaul.
    //   CoreClash.exe --cc-w24-showcase --cc-output <absolute directory> [--cc-clips] [--cc-perf]
    // Never runs in ordinary play. It uses only the public app/simulation API that already
    // existed at the W22 base, so the very same file builds the BEFORE and the AFTER Player and
    // both show identical scenes. Scenes are staged with the simulation's own calls (Spawn,
    // Damage, Heal, Shield, status and ability hooks); every launch goes through the normal
    // pointer gesture. Nothing here is drawn by the driver itself.
    public sealed class W24ShowcaseDriver : MonoBehaviour
    {
        CoreClashApp app;
        string output = "", profile = "Desktop";
        float started;
        int repaints, lastRepaint = -1, pointerId = 300;
        bool finished, clips, perf;
        readonly List<string> captures = new List<string>();
        readonly StringBuilder notes = new StringBuilder();

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Attach()
        {
            if (!Environment.GetCommandLineArgs().Contains("--cc-w24-showcase")) return;
            var target = UnityEngine.Object.FindAnyObjectByType<CoreClashApp>();
            if (target == null) { Debug.LogError("CC_W24_SHOWCASE_FAIL no CoreClashApp in the scene"); Application.Quit(1); return; }
            if (target.GetComponent<W24ShowcaseDriver>() == null) target.gameObject.AddComponent<W24ShowcaseDriver>();
        }

        void Start()
        {
            started = Time.realtimeSinceStartup;
            // The window may open on another monitor without focus: keep running anyway.
            Application.runInBackground = true;
            app = GetComponent<CoreClashApp>();
            string[] args = Environment.GetCommandLineArgs();
            int index = Array.IndexOf(args, "--cc-output");
            if (index < 0 || index + 1 >= args.Length || !Path.IsPathRooted(args[index + 1])) { Fail("--cc-output must name an absolute directory"); return; }
            output = Path.GetFullPath(args[index + 1]);
            clips = args.Contains("--cc-clips"); perf = args.Contains("--cc-perf");
            Directory.CreateDirectory(output);
            StartCoroutine(Guarded());
        }

        void OnGUI()
        {
            if (Event.current.type != EventType.Repaint || lastRepaint == Time.frameCount) return;
            lastRepaint = Time.frameCount; repaints++;
        }

        IEnumerator Guarded()
        {
            var stack = new Stack<IEnumerator>();
            stack.Push(Run());
            while (stack.Count > 0 && !finished)
            {
                bool more; string error = null;
                try { more = stack.Peek().MoveNext(); }
                catch (Exception exception) { more = false; error = exception.ToString(); }
                if (error != null) { Fail(error); yield break; }
                if (!more) { stack.Pop(); continue; }
                if (stack.Peek().Current is IEnumerator child) { stack.Push(child); continue; }
                if (Time.realtimeSinceStartup - started > 420) { Fail("showcase exceeded 420 seconds"); yield break; }
                yield return null;
            }
        }

        IEnumerator Run()
        {
            while (!UnityEngine.Rendering.SplashScreen.isFinished || Time.realtimeSinceStartup - started < 3 || repaints < 3) yield return null;
            Require(app != null && app.Catalog != null && app.Simulation != null && app.IsSetup, "the app did not open on deck selection");
            Require(app.Catalog.Roster != null && app.Catalog.Roster.Decks.Length >= 4, "the active roster decks are missing");
            app.SetDeveloperOverlay(false);
            // Both seats are driven by the pointer here; the player's saved "versus AI" choice is not touched.
            app.SetVersusAi(false, false);
            int shortSide = Mathf.Min(Screen.width, Screen.height);
            profile = shortSide <= 480 ? "Phone" : (Screen.width == 1024 && Screen.height == 768) || (Screen.width == 768 && Screen.height == 1024) ? "Tablet" : "Desktop";
            if (profile != "Desktop") { app.SetDeviceProfile(profile); yield return null; yield return null; }
            var decks = app.Catalog.Roster.Decks;
            string[] active = app.Catalog.Roster.ActiveIds.ToArray();

            // 1-2. Home screen (the game opens on deck choice) and the deck builder.
            app.SelectDeck(0, decks[0].id); app.SelectDeck(1, decks[1].id);
            yield return Seconds(.6f);
            yield return Capture("01-home");
            app.OpenDeckBuilder(0);
            yield return Seconds(.4f);
            yield return Capture("02-deck-builder");
            app.ReturnToSetup();

            // 3. An ordinary match: every ball is chosen from the deck and launched by the pointer gesture.
            app.SelectDeck(0, decks[0].id); app.SelectDeck(1, decks[1].id);
            app.StartLocalMatch();
            var sim = app.Simulation;
            yield return Seconds(1.3f);
            yield return Capture("03-match-start");
            float[] offsets = { -150, 120, -60, 170, 30, -190 };
            for (int shot = 0; shot < offsets.Length && sim.State.phase != MatchPhase.Over; shot++)
            {
                int turn = sim.State.turn;
                var cards = sim.State.players[turn].stock.Where(entry => entry.remaining > 0).ToList();
                if (cards.Count > 0) app.SelectBall(cards[(shot / 2 * 2 + turn) % cards.Count].id);
                yield return null;
                Vector2 from = ScreenPoint(270, turn == 0 ? 853 : 47), to = ScreenPoint(270 + offsets[shot], turn == 0 ? 640 - shot * 22 : 260 + shot * 22);
                yield return Launch(sim, from, to, shot == 4 ? "04-match-aim" : null);
                yield return Settle(sim);
                yield return Seconds(.9f);
            }
            yield return Capture("05-match-after-6-shots");

            // 4. Dense board: every active ball for both players.
            app.StartLocalMatch();
            sim = app.Simulation;
            for (int i = 0; i < 40; i++)
            {
                int row = i / 5, column = i % 5;
                if ((row == 0 || row == 7) && column == 2) continue; // both launchers stay free
                float jitterX = ((i * 37) % 21) - 10f, jitterY = ((i * 53) % 21) - 10f;
                int owner = row < 4 ? 1 : 0;
                if (i % 7 == 3) owner = 1 - owner;
                Place(sim, owner, active[i % active.Length], 74 + column * 98 + jitterX, 106 + row * 98 + jitterY);
            }
            Still(sim);
            yield return Seconds(1.5f);
            yield return Capture("06-dense-board");
            if (perf) yield return Measure("dense-idle", 150);

            // 5. Reduced HP: the same types at full, three quarters, half and critical health.
            app.StartLocalMatch();
            sim = app.Simulation;
            string[] hpTypes = { "normal", "fire", "ice", "bomb", "magnet", "tesla" };
            for (int row = 0; row < 4; row++)
            for (int column = 0; column < hpTypes.Length; column++)
            {
                var ball = Place(sim, row < 2 ? 1 : 0, hpTypes[column], 62 + column * 83, 250 + row * 128);
                int lose = Mathf.Min(ball.hp - 1, Mathf.RoundToInt(ball.maxHp * (row == 0 ? 0 : row == 1 ? .25f : row == 2 ? .5f : .82f)));
                if (lose > 0) sim.Damage(ball, lose, true);
            }
            Still(sim);
            yield return Seconds(1.6f);
            yield return Capture("07-reduced-hp");

            // 6. Active statuses, shields, armed traps and ground zones from the real status calls.
            app.StartLocalMatch();
            sim = app.Simulation;
            var burning = Place(sim, 1, "normal", 110, 270); sim.Abilities.ApplyFire(burning, 0); sim.Abilities.ApplyFire(burning, 0);
            var chilled = Place(sim, 1, "normal", 220, 270); sim.Abilities.ApplyIce(chilled, 0);
            var frozen = Place(sim, 1, "normal", 330, 270); sim.Abilities.ApplyIce(frozen, 0); sim.Abilities.ApplyIce(frozen, 0); sim.Abilities.ApplyIce(frozen, 0);
            var poisoned = Place(sim, 1, "normal", 440, 270); sim.Abilities.ApplyToxin(poisoned, 0);
            var shielded = Place(sim, 0, "frostguard", 110, 420); sim.Abilities.OnStop(shielded);
            var rooted = Place(sim, 0, "normal", 220, 420); sim.Abilities.Root(rooted);
            var many = Place(sim, 0, "normal", 330, 420); sim.Abilities.ApplyFire(many, 1); sim.Abilities.ApplyToxin(many, 1); sim.Shield(many, 5); sim.Damage(many, 10, true);
            // W24 six groups: a switched-off Bomb and a Battery holding three charges.
            var off = Place(sim, 0, "bomb", 440, 420); sim.Abilities.Jam(off);
            var battery = Place(sim, 1, "capacitor", 110, 570); battery.charge = 3;
            var furnace = Place(sim, 0, "furnace", 220, 590); sim.Abilities.OnStop(furnace);
            var frostTrap = Place(sim, 1, "frosttrap", 345, 590); sim.Abilities.OnStop(frostTrap);
            var pool = Place(sim, 0, "blightpool", 455, 590); sim.Abilities.OnStop(pool);
            Still(sim);
            yield return Seconds(1.7f);
            yield return Capture("08-statuses");
            string clip = null;
            if (clips) { clip = BeginClip("clip-status"); yield return Frames(clip, sim, 8); }
            sim.Heal(many, 6); sim.Shield(chilled, 8); sim.Damage(poisoned, 7, true); sim.Abilities.ApplyFire(rooted, 1);
            if (clips) { yield return Frames(clip, sim, 42); EndClip(); }
            else yield return Seconds(.25f);
            if (!clips) yield return Capture("09-status-feedback");

            // 7. A strong collision, then an explosion and a defeat.
            app.StartLocalMatch();
            sim = app.Simulation;
            Place(sim, 1, "normal", 270, 520); Place(sim, 1, "ice", 232, 470); Place(sim, 1, "fire", 308, 470);
            Place(sim, 1, "thornback", 270, 420); Place(sim, 0, "normal", 150, 640); Place(sim, 0, "anchor", 400, 650);
            Still(sim);
            app.SelectBall("normal");
            yield return Seconds(1.3f);
            if (clips) clip = BeginClip("clip-impact");
            int serial = sim.State.actionSerial;
            Vector2 launcher = ScreenPoint(270, 853), pullTo = ScreenPoint(270, 560);
            Pointer(launcher, true, true, false);
            for (int i = 1; i <= 14; i++) { Pointer(Vector2.Lerp(launcher, pullTo, i / 14f), false, true, false); if (clips) Shot(clip, sim); yield return null; }
            Pointer(pullTo, false, false, true); pointerId++;
            Require(sim.State.actionSerial == serial + 1, "impact scene: the pointer gesture did not launch a ball");
            int eventsBefore = sim.State.eventSerial; bool shotTaken = false;
            for (int i = 0; i < 240 && sim.State.phase == MatchPhase.Moving; i++)
            {
                if (clips) Shot(clip, sim);
                // The moment of contact: a second ball starts to move (or, failing that, a fixed moment of the shot).
                if (!shotTaken && (sim.State.balls.Count(item => !item.dead && item.moving) >= 2 || sim.State.events.Any(e => e.id > eventsBefore && e.kind == "DAMAGE") || i == 70))
                { shotTaken = true; yield return null; yield return null; if (!clips) yield return Capture("10-strong-collision"); }
                yield return null;
            }
            if (clips) { yield return Frames(clip, sim, 20); EndClip(); }
            yield return Seconds(.8f);
            var target = sim.State.balls.Where(item => !item.dead && !item.banished && item.owner == 1).OrderBy(item => item.hp).FirstOrDefault();
            if (target != null)
            {
                var bomb = sim.Spawn(0, "bomb", Mathf.Clamp(target.x + 46, 60, 480), Mathf.Clamp(target.y + 30, 60, 840));
                bomb.vx = bomb.vy = 0; bomb.moving = false;
                yield return Seconds(.7f);
                if (clips) { clip = BeginClip("clip-explosion"); yield return Frames(clip, sim, 6); }
                sim.Abilities.OnStop(bomb);
                foreach (var ball in sim.State.balls.Where(item => !item.dead && item.owner == 1 && item.hp <= 12).Take(1).ToArray()) sim.Damage(ball, ball.hp + ball.shield, true);
                Still(sim);
                if (clips) { yield return Frames(clip, sim, 44); EndClip(); }
                else { yield return Seconds(.12f); yield return Capture("11-explosion"); }
            }
            if (perf) yield return Measure("after-explosion", 90);

            // 8. W24 six groups, through the balls' own ability hooks: lightning that jumps, a Magnet that
            // gathers, a Compass that goes for an enemy, a Sprout that grew, a shock trap and the shoots of a Vine.
            app.StartLocalMatch();
            sim = app.Simulation;
            var bolt = Place(sim, 0, "tesla", 150, 560); var struck = Place(sim, 1, "normal", 215, 520); Place(sim, 1, "normal", 290, 500);
            var magnetBall = Place(sim, 0, "magnet", 400, 620); Place(sim, 1, "normal", 430, 470); Place(sim, 1, "normal", 300, 660);
            var sprout = Place(sim, 0, "cultivator", 120, 720);
            var trapper = Place(sim, 1, "staticfield", 270, 300); var planter = Place(sim, 1, "web", 420, 300);
            var stormBall = Place(sim, 1, "chainshock", 130, 330); Place(sim, 0, "normal", 190, 410);
            Still(sim);
            yield return Seconds(1.2f);
            sim.Abilities.OnStop(trapper); sim.Abilities.OnStop(planter);
            trapper.x = 200; trapper.y = 250;
            for (int i = 0; i < 3; i++) { sim.State.turn = 0; sim.Abilities.OnTurnStart(0); }
            yield return Seconds(.5f);
            if (clips) { clip = BeginClip("clip-reality"); yield return Frames(clip, sim, 6); }
            sim.Abilities.OnPairContact(bolt, struck, false, true, 10);
            if (clips) yield return Frames(clip, sim, 22); else { yield return Seconds(.14f); yield return Capture("12-lightning"); yield return Seconds(.5f); }
            sim.State.phase = MatchPhase.Moving; sim.State.actionTime = 0; sim.State.settledTime = 0;
            sim.Abilities.OnStop(magnetBall);
            if (clips) yield return Frames(clip, sim, 26); else { yield return Seconds(.14f); yield return Capture("13-pull"); yield return Seconds(.9f); }
            Still(sim);
            sim.State.turn = 1; sim.Abilities.OnTurnStart(1);
            if (clips) { yield return Frames(clip, sim, 30); EndClip(); } else { yield return Seconds(.14f); yield return Capture("14-storm"); }
            yield return Seconds(.8f);
            yield return Capture("15-zones-and-portals");

            // 9. Result screen: the real end of a match (base HP reaches zero through the simulation).
            app.StartLocalMatch();
            sim = app.Simulation;
            Place(sim, 0, "normal", 200, 640); Place(sim, 1, "normal", 320, 280);
            Still(sim);
            yield return Seconds(.6f);
            sim.State.players[1].hp = 0; sim.Rules.Finish(0, "Base destroyed");
            yield return Seconds(1.2f);
            yield return Capture("16-match-result");

            // 10. Performance sample on a crowded board with effects running (Windows desktop only).
            if (perf)
            {
                app.StartLocalMatch();
                sim = app.Simulation;
                for (int i = 0; i < 40; i++)
                {
                    int row = i / 5, column = i % 5;
                    if ((row == 0 || row == 7) && column == 2) continue;
                    var ball = Place(sim, row < 4 ? 1 : 0, active[i % active.Length], 74 + column * 98, 106 + row * 98);
                    if (i % 3 == 0) sim.Abilities.ApplyFire(ball, 1 - ball.owner);
                    if (i % 4 == 1) sim.Abilities.ApplyIce(ball, 1 - ball.owner);
                    if (i % 5 == 2) sim.Shield(ball, 8);
                }
                Still(sim);
                yield return Seconds(1f);
                var crowd = sim.State.balls.Where(item => !item.dead).ToList();
                int tick = 0;
                yield return Measure("dense-effects", 180, () =>
                {
                    // A damage or heal event on a few balls every sixth frame keeps labels, bursts and particles busy.
                    if (++tick % 6 != 0) return;
                    for (int k = 0; k < 3; k++) { var ball = crowd[(tick + k * 7) % crowd.Count]; if (ball.dead) continue; if (k == 2) sim.Heal(ball, 2); else if (ball.hp > 3) sim.Damage(ball, 1, true); }
                });
            }

            File.WriteAllText(Path.Combine(output, "showcase.txt"),
                "unity=" + Application.unityVersion + "\nscreen=" + Screen.width + "x" + Screen.height + "\nprofile=" + profile +
                "\nlogical=" + app.UiWidth.ToString("0.#", CultureInfo.InvariantCulture) + "x" + app.UiHeight.ToString("0.#", CultureInfo.InvariantCulture) +
                "\ndpi=" + Screen.dpi.ToString(CultureInfo.InvariantCulture) + "\ncaptures=" + string.Join(",", captures) + "\n" + notes);
            finished = true;
            Debug.Log("CC_W24_SHOWCASE_PASS captures=" + captures.Count + " size=" + Screen.width + "x" + Screen.height);
            Application.Quit(0);
        }

        // One real launch: press on the launcher, drag to the aim point, release.
        IEnumerator Launch(GameSimulation sim, Vector2 from, Vector2 to, string captureAim)
        {
            int serial = sim.State.actionSerial;
            // The app ignores a press in the frame after it cancelled a pointer (a selection, a
            // change of layout): wait it out, as a finger would.
            yield return null; yield return null;
            Pointer(from, true, true, false);
            for (int i = 1; i <= 20; i++) { Pointer(Vector2.Lerp(from, to, i / 20f), false, true, false); yield return null; }
            if (captureAim != null) yield return Capture(captureAim);
            Pointer(to, false, false, true); pointerId++;
            Require(sim.State.actionSerial == serial + 1, "the pointer gesture did not launch a ball");
        }
        void Pointer(Vector2 position, bool down, bool held, bool up)
            => app.PresentationPointer(new PointerSample { id = pointerId, position = position, down = down, held = held, up = up });
        IEnumerator Settle(GameSimulation sim)
        {
            float limit = Time.realtimeSinceStartup + 25;
            while (sim.State.phase == MatchPhase.Moving && Time.realtimeSinceStartup < limit) yield return null;
        }

        // Frame time and managed allocation over `frames` rendered frames, with the frame cap lifted.
        IEnumerator Measure(string label, int frames, Action eachFrame = null)
        {
            int oldVsync = QualitySettings.vSyncCount, oldTarget = Application.targetFrameRate;
            QualitySettings.vSyncCount = 0; Application.targetFrameRate = -1;
            for (int i = 0; i < 20; i++) yield return null;
            var times = new List<float>(frames);
            GC.Collect();
            long memory = GC.GetTotalMemory(false); int collections = GC.CollectionCount(0);
            long allocated = 0;
            for (int i = 0; i < frames; i++)
            {
                eachFrame?.Invoke();
                yield return null;
                times.Add(Time.unscaledDeltaTime * 1000f);
                long now = GC.GetTotalMemory(false);
                if (now > memory) allocated += now - memory;
                memory = now;
            }
            collections = GC.CollectionCount(0) - collections;
            QualitySettings.vSyncCount = oldVsync; Application.targetFrameRate = oldTarget;
            times.Sort();
            float average = times.Average(), p95 = times[Mathf.Min(times.Count - 1, Mathf.FloorToInt(times.Count * .95f))], worst = times[times.Count - 1];
            string line = "perf." + label + "=frames:" + frames + " avgMs:" + average.ToString("0.00", CultureInfo.InvariantCulture) + " p95Ms:" + p95.ToString("0.00", CultureInfo.InvariantCulture) +
                " maxMs:" + worst.ToString("0.00", CultureInfo.InvariantCulture) + " avgFps:" + (1000f / average).ToString("0", CultureInfo.InvariantCulture) +
                " managedKBPerFrame:" + (allocated / 1024f / frames).ToString("0.0", CultureInfo.InvariantCulture) + " gen0Collections:" + collections;
            notes.Append(line).Append('\n');
            Debug.Log("CC_W24_PERF " + line);
        }

        string clipDirectory; int clipFrame; StringBuilder clipTimes;
        string BeginClip(string name)
        {
            clipDirectory = Path.Combine(output, name); Directory.CreateDirectory(clipDirectory);
            clipFrame = 0; clipTimes = new StringBuilder("frame,unscaledTime,phase,turn\n");
            Time.captureFramerate = 30;
            return clipDirectory;
        }
        void EndClip()
        {
            Time.captureFramerate = 0;
            File.WriteAllText(Path.Combine(clipDirectory, "times.csv"), clipTimes.ToString());
            notes.Append("clip." + Path.GetFileName(clipDirectory) + "=" + clipFrame + "\n");
        }
        void Shot(string directory, GameSimulation sim)
        {
            clipFrame++;
            ScreenCapture.CaptureScreenshot(Path.Combine(directory, "f" + clipFrame.ToString("0000", CultureInfo.InvariantCulture) + ".png"));
            clipTimes.Append(clipFrame).Append(',').Append(Time.unscaledTime.ToString("0.0000", CultureInfo.InvariantCulture)).Append(',').Append(sim.State.phase).Append(',').Append(sim.State.turn).Append('\n');
        }
        IEnumerator Frames(string directory, GameSimulation sim, int count)
        {
            for (int i = 0; i < count; i++) { Shot(directory, sim); yield return null; }
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
            yield return null; yield return null;
            ScreenCapture.CaptureScreenshot(path);
            int requested = Time.frameCount; float limit = Time.realtimeSinceStartup + 12;
            while (Time.frameCount < requested + 3 || !File.Exists(path) || new FileInfo(path).Length < 1024)
            {
                if (Time.realtimeSinceStartup > limit) throw new InvalidOperationException("capture was not written: " + name);
                yield return null;
            }
            captures.Add(name + ".png");
            Debug.Log("CC_W24_CAPTURE " + name + ".png " + Screen.width + "x" + Screen.height);
        }

        BallRuntime Place(GameSimulation sim, int owner, string type, float x, float y)
        {
            var ball = sim.Spawn(owner, app.Catalog.Ball(type) != null ? type : "normal", x, y);
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
            Debug.LogError("CC_W24_SHOWCASE_FAIL " + message);
            Application.Quit(1);
        }
    }
}
