using System;
using System.Collections;
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
    // Opt-in check of the computer opponent (W24):  CoreClash.exe --cc-ai-probe <absolute directory>
    // Starts a local match against the AI. Player 1 is driven by plain pointer gestures (a fixed
    // list of aims, no thinking); Player 2 must be played by the AI. Writes ai.txt with every
    // turn and two screenshots. Never runs in ordinary play.
    public sealed class W24AiProbe : MonoBehaviour
    {
        CoreClashApp app; string output; int pointerId = 500;
        readonly StringBuilder notes = new StringBuilder();

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Attach()
        {
            string[] args = Environment.GetCommandLineArgs();
            int index = Array.IndexOf(args, "--cc-ai-probe");
            if (index < 0 || index + 1 >= args.Length || !Path.IsPathRooted(args[index + 1])) return;
            var target = UnityEngine.Object.FindAnyObjectByType<CoreClashApp>();
            if (target == null) { Application.Quit(1); return; }
            var probe = target.gameObject.AddComponent<W24AiProbe>();
            probe.app = target; probe.output = args[index + 1];
        }

        IEnumerator Start()
        {
            Directory.CreateDirectory(output);
            Application.runInBackground = true;
            float begun = Time.realtimeSinceStartup;
            while (!UnityEngine.Rendering.SplashScreen.isFinished || Time.realtimeSinceStartup - begun < 3) yield return null;
            if (Mathf.Min(Screen.width, Screen.height) <= 480) { app.SetDeviceProfile("Phone"); yield return null; yield return null; }
            bool before = app.VersusAi;
            app.SetVersusAi(true);
            yield return Shot("ai-home");
            app.StartLocalMatch();
            var sim = app.Simulation;
            float[] aims = { -120, 90, -40, 150, 20, -170, 60, -80 };
            int humanShots = 0, aiShots = 0, lastSerial = sim.State.actionSerial; float longestThink = 0, turnStarted = Time.realtimeSinceStartup;
            float limit = Time.realtimeSinceStartup + 150; string failure = null;
            while (sim.State.phase != MatchPhase.Over && humanShots + aiShots < 16 && Time.realtimeSinceStartup < limit)
            {
                var state = sim.State;
                if (state.phase == MatchPhase.Aiming && state.turn == 0)
                {
                    yield return null; yield return null;
                    Vector2 from = ScreenPoint(270, 853), to = ScreenPoint(270 + aims[humanShots % aims.Length], 620);
                    Pointer(from, true, true, false);
                    for (int i = 1; i <= 12; i++) { Pointer(Vector2.Lerp(from, to, i / 12f), false, true, false); yield return null; }
                    Pointer(to, false, false, true); pointerId++;
                    if (sim.State.actionSerial != lastSerial + 1) { failure = "player 1 gesture did not launch"; break; }
                    lastSerial = sim.State.actionSerial; humanShots++;
                    notes.Append("turn ").Append(state.turnNumber).Append(" P1 launched by pointer\n");
                }
                else if (state.phase == MatchPhase.Aiming && state.turn == 1)
                {
                    // Pointer input on the computer's turn must not launch anything.
                    Vector2 from = ScreenPoint(270, 47), to = ScreenPoint(270, 300);
                    Pointer(from, true, true, false); Pointer(to, false, true, false); Pointer(to, false, false, true); pointerId++;
                    if (sim.State.actionSerial != lastSerial) { failure = "a pointer gesture launched a ball on the AI turn"; break; }
                    turnStarted = Time.realtimeSinceStartup;
                    while (sim.State.phase == MatchPhase.Aiming && sim.State.turn == 1 && sim.State.actionSerial == lastSerial && Time.realtimeSinceStartup - turnStarted < 12) yield return null;
                    if (sim.State.actionSerial != lastSerial + 1) { failure = "the AI did not shoot within 12 seconds"; break; }
                    float think = Time.realtimeSinceStartup - turnStarted; longestThink = Mathf.Max(longestThink, think);
                    lastSerial = sim.State.actionSerial; aiShots++;
                    var launched = sim.State.balls.LastOrDefault(b => b.owner == 1);
                    notes.Append("turn ").Append(state.turnNumber).Append(" AI launched ").Append(launched?.type ?? "?").Append(" after ").Append(think.ToString("0.00", CultureInfo.InvariantCulture)).Append(" s\n");
                    if (aiShots == 2) { yield return null; yield return Shot("ai-match"); }
                }
                else yield return null;
            }
            if (failure == null && aiShots < 3 && sim.State.phase != MatchPhase.Over) failure = "too few AI shots: " + aiShots;
            notes.Append("humanShots=").Append(humanShots).Append(" aiShots=").Append(aiShots).Append(" longestThinkSeconds=").Append(longestThink.ToString("0.00", CultureInfo.InvariantCulture))
                 .Append(" baseHp=").Append(sim.State.players[0].hp).Append('/').Append(sim.State.players[1].hp).Append(" phase=").Append(sim.State.phase).Append('\n');
            notes.Append(failure == null ? "RESULT=PASS\n" : "RESULT=FAIL " + failure + "\n");
            File.WriteAllText(Path.Combine(output, "ai.txt"), notes.ToString());
            Debug.Log(failure == null ? "CC_W24_AI_PASS humanShots=" + humanShots + " aiShots=" + aiShots : "CC_W24_AI_FAIL " + failure);
            app.SetVersusAi(before);
            Application.Quit(failure == null ? 0 : 1);
        }

        IEnumerator Shot(string name)
        {
            string path = Path.Combine(output, name + ".png");
            if (File.Exists(path)) File.Delete(path);
            yield return null; yield return null;
            ScreenCapture.CaptureScreenshot(path);
            float limit = Time.realtimeSinceStartup + 10;
            while ((!File.Exists(path) || new FileInfo(path).Length < 1024) && Time.realtimeSinceStartup < limit) yield return null;
        }

        void Pointer(Vector2 position, bool down, bool held, bool up)
            => app.PresentationPointer(new PointerSample { id = pointerId, position = position, down = down, held = held, up = up });

        Vector2 ScreenPoint(float worldX, float worldY)
        {
            Rect arena = app.ArenaRect; float scale = arena.width / 540;
            return new Vector2(arena.x + worldX * scale, Screen.height - (arena.y + worldY * scale));
        }
    }
}
