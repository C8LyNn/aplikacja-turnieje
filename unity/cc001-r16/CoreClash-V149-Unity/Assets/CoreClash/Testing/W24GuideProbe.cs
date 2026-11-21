using System;
using System.Collections;
using System.IO;
using System.Linq;
using CoreClash.Core;
using CoreClash.Input;
using CoreClash.Presentation;
using UnityEngine;

namespace CoreClash.Testing
{
    // Opt-in screenshots of the ball guide (W24):
    //   CoreClash.exe --cc-guide-probe <absolute directory> [--cc-lang pl|en] [--cc-balls id,id,...]
    // Captures the home screen, the deck builder, the card of every active ball (or of the listed
    // ones), the match tray and the card of a ball that carries states on the board.
    // Never runs in ordinary play. The language chosen here is not saved.
    public sealed class W24GuideProbe : MonoBehaviour
    {
        CoreClashApp app; string output; string[] args;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Attach()
        {
            string[] args = Environment.GetCommandLineArgs();
            int index = Array.IndexOf(args, "--cc-guide-probe");
            if (index < 0 || index + 1 >= args.Length || !Path.IsPathRooted(args[index + 1])) return;
            var target = UnityEngine.Object.FindAnyObjectByType<CoreClashApp>();
            if (target == null) { Application.Quit(1); return; }
            var probe = target.gameObject.AddComponent<W24GuideProbe>();
            probe.app = target; probe.output = args[index + 1]; probe.args = args;
        }

        string Arg(string name) { int i = Array.IndexOf(args, name); return i >= 0 && i + 1 < args.Length ? args[i + 1] : null; }

        IEnumerator Start()
        {
            Directory.CreateDirectory(output);
            // The window opens on another monitor and usually has no focus: keep running anyway.
            Application.runInBackground = true;
            float begun = Time.realtimeSinceStartup;
            while (!UnityEngine.Rendering.SplashScreen.isFinished || Time.realtimeSinceStartup - begun < 3) yield return null;
            if (Mathf.Min(Screen.width, Screen.height) <= 480) { app.SetDeviceProfile("Phone"); yield return null; yield return null; }
            Debug.Log("CC_W24_GUIDE_DISPLAY " + Screen.mainWindowDisplayInfo.name + " " + Screen.width + "x" + Screen.height);
            bool polishBefore = Lang.Polish;
            Lang.Polish = (Arg("--cc-lang") ?? "en") == "pl";
            string[] ids = (Arg("--cc-balls") ?? string.Join(",", app.Catalog.Roster.ActiveIds)).Split(',');
            var decks = app.Catalog.Roster.Decks;
            app.SelectDeck(0, decks[0].id); app.SelectDeck(1, decks[1].id);
            yield return Shot("00-home");
            app.ShowDeckGuide(decks[0].id);
            yield return Shot("02-deck-guide");
            app.CloseDeckGuide();
            app.OpenDeckBuilder(0);
            yield return Wait(.5f);
            yield return Shot("01-builder");
            int number = 0;
            // --cc-demo-frames N: N frames of every card, taken at equal steps of the show's own clock.
            int frames = int.TryParse(Arg("--cc-demo-frames") ?? "", out int wanted) ? Mathf.Clamp(wanted, 0, 40) : 0;
            float every = float.TryParse(Arg("--cc-demo-step") ?? "", System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float stepSeconds) ? stepSeconds : 1.5f;
            foreach (string id in ids)
            {
                if (app.Catalog.Ball(id) == null) continue;
                app.ShowBallDetails(id);
                yield return Shot("card-" + (++number).ToString("00") + "-" + id);
                for (int frame = 1; frame <= frames && app.DemoRunning; frame++)
                {
                    // Stop taking frames once the show has ended and started over.
                    float limit = Time.realtimeSinceStartup + 20, last = app.DemoElapsed; bool restarted = false;
                    while (app.DemoElapsed < frame * every && Time.realtimeSinceStartup < limit)
                    {
                        if (app.DemoElapsed + .2f < last) { restarted = true; break; }
                        last = app.DemoElapsed; yield return null;
                    }
                    if (restarted) break;
                    yield return Shot("demo-" + number.ToString("00") + "-" + id + "-" + frame.ToString("00"));
                }
                app.CloseBallDetails();
            }
            app.ReturnToSetup();
            app.SelectDeck(0, decks[1].id); app.SelectDeck(1, decks[0].id);
            app.StartLocalMatch();
            var sim = app.Simulation;
            yield return Wait(.6f);
            app.TapTrayBall(sim.State.players[0].stock[1].id);
            yield return Shot("90-match-tray");
            // Aiming a Bomb: the estimated stop and the reach of the blast from there.
            app.SelectBall("bomb");
            yield return null;
            Vector2 from = ScreenPoint(270, 853), to = ScreenPoint(215, 600);
            Pointer(from, true, true, false, false);
            for (int i = 1; i <= 10; i++) { Pointer(Vector2.Lerp(from, to, i / 10f), false, true, false, false); yield return null; }
            yield return Shot("93-aim-reach");
            Pointer(to, false, false, false, true);
            yield return null;
            // A ball that is on fire, poisoned and shielded, and an armed Mine: both opened from the board.
            var burning = sim.Spawn(0, "normal", 200, 520);
            sim.Abilities.ApplyFire(burning, 1); sim.Abilities.ApplyToxin(burning, 1); sim.Shield(burning, 5);
            var mine = sim.Spawn(1, "mine", 340, 380); mine.mineArmed = true;
            app.ShowRuntimeBallDetails(burning.id);
            yield return Shot("91-card-on-board");
            app.ShowRuntimeBallDetails(mine.id);
            yield return Shot("92-card-armed-mine");
            app.CloseBallDetails();
            app.RequestLeaveMatch();
            yield return Shot("94-leave");
            app.CancelLeaveMatch();
            sim.Rules.Finish(0, "Base destroyed");
            yield return Wait(1.6f);
            yield return Shot("95-result");
            Lang.Polish = polishBefore;
            Debug.Log("CC_W24_GUIDE_PASS cards=" + number);
            Application.Quit(0);
        }

        static IEnumerator Wait(float seconds) { float until = Time.realtimeSinceStartup + seconds; while (Time.realtimeSinceStartup < until) yield return null; }

        void Pointer(Vector2 position, bool down, bool held, bool up, bool canceled)
            => app.PresentationPointer(new PointerSample { id = 700, position = position, down = down, held = held, up = up, canceled = canceled });

        Vector2 ScreenPoint(float worldX, float worldY)
        {
            Rect arena = app.ArenaRect; float scale = arena.width / 540;
            return new Vector2(arena.x + worldX * scale, Screen.height - (arena.y + worldY * scale));
        }

        IEnumerator Shot(string name)
        {
            string path = Path.Combine(output, name + ".png");
            if (File.Exists(path)) File.Delete(path);
            yield return null; yield return null; yield return null;
            ScreenCapture.CaptureScreenshot(path);
            float limit = Time.realtimeSinceStartup + 10;
            while ((!File.Exists(path) || new FileInfo(path).Length < 1024) && Time.realtimeSinceStartup < limit) yield return null;
            yield return null;
        }
    }
}
