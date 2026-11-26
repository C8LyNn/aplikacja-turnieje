using System;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using CoreClash.Core;
using CoreClash.Presentation;
using UnityEngine;

namespace CoreClash.Testing
{
    // Opt-in motion log (W24):  CoreClash.exe ... --cc-motion-log <absolute file>
    // One line per rendered frame while balls are moving: frame time, simulation steps run in
    // that frame, and where the fastest ball is in the state and on screen. Never runs in
    // ordinary play and never touches the simulation.
    // With --cc-motion-uncapped the run also drops v-sync, so the game draws as fast as its own
    // frame cap allows (a multiple of the refresh rate, at least 240): the frame times then show
    // what a frame really costs, which a 60 Hz test monitor otherwise hides.
    public sealed class W24MotionProbe : MonoBehaviour
    {
        CoreClashApp app; string path; readonly StringBuilder log = new StringBuilder("frame,dtMs,steps,repaints,id,x,y,vx,vy,lead,drawX,drawY,gc\n");
        int lastSimFrame, repaints; bool uncapped, noStopMark;
        // Frames of Player 1's own aiming turns (the probe's drags, with the shot forecast at work):
        // how many, how many ran long, and the longest. The computer's turns are left out - its
        // thinking takes its own share of a frame.
        // Forecast check.
        GameSimulation checkSandbox; int expectId = -1, checks, checkMisses, copyMismatches; float expectX, expectY, checkWorst; bool expectDies; GameState expectIn;
        readonly StringBuilder checkLog = new StringBuilder();
        void Expect(GameSimulation live, PlayerCommand command)
        {
            try
            {
                var copy = JsonUtility.FromJson<GameState>(JsonUtility.ToJson(live.State));
                // Does the copy carry every position and speed over exactly?
                for (int i = 0; i < live.State.balls.Count && i < copy.balls.Count; i++)
                {
                    var a = live.State.balls[i]; var b = copy.balls[i];
                    if (a.x != b.x || a.y != b.y || a.vx != b.vx || a.vy != b.vy || a.radius != b.radius || a.mass != b.mass) copyMismatches++;
                }
                copy.events.Clear();
                if (checkSandbox == null) { var deck = live.Catalog.AllDecks.First(); checkSandbox = new GameSimulation(live.Catalog, deck, deck) { ActiveRosterOnly = true }; }
                var forecast = ShotForecast.Begin(checkSandbox, copy, command);
                for (int guard = 0; guard < 400 && !forecast.Advance(64); guard++) { }
                if (!forecast.Valid) return;
                expectId = forecast.MoverId; expectX = forecast.StopX; expectY = forecast.StopY; expectDies = forecast.MoverDies; expectIn = live.State;
            }
            catch (Exception e) { checkLog.Append(" error:").Append(e.GetType().Name); }
        }
        void Compare(GameSimulation sim)
        {
            if (expectId < 0 || sim.State.phase == MatchPhase.Moving || !ReferenceEquals(sim.State, expectIn)) return;
            var ball = sim.State.balls.FirstOrDefault(b => b.id == expectId); int id = expectId; expectId = -1;
            checks++;
            bool gone = ball == null || ball.dead;
            float off = gone ? (expectDies ? 0 : 999) : expectDies ? 999 : Mathf.Sqrt((ball.x - expectX) * (ball.x - expectX) + (ball.y - expectY) * (ball.y - expectY));
            checkWorst = Mathf.Max(checkWorst, off);
            if (off > .01f) { checkMisses++; if (checkLog.Length < 400) checkLog.Append(' ').Append(off.ToString("0.00", CultureInfo.InvariantCulture)).Append("@ball").Append(id).Append("t").Append(sim.State.turnNumber); }
        }
        int aimFrames, aimLate; float aimSum, aimMax; readonly StringBuilder aimLong = new StringBuilder();

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Attach()
        {
            string[] args = Environment.GetCommandLineArgs();
            int index = Array.IndexOf(args, "--cc-motion-log");
            if (index < 0 || index + 1 >= args.Length || !Path.IsPathRooted(args[index + 1])) return;
            var target = UnityEngine.Object.FindAnyObjectByType<CoreClashApp>();
            if (target == null) return;
            var probe = target.gameObject.AddComponent<W24MotionProbe>();
            probe.app = target; probe.path = args[index + 1];
            probe.uncapped = Array.IndexOf(args, "--cc-motion-uncapped") >= 0;
            // --cc-motion-nostop: this run aims without the stop mark (and so without the forecast),
            // to tell what the forecast costs from what aiming costs anyway.
            probe.noStopMark = Array.IndexOf(args, "--cc-motion-nostop") >= 0;
            // --cc-forecast-check: before every shot of the local player the whole shot is forecast
            // from a copy of the match made the way the game makes it, and when the real shot has
            // come to rest the two are compared. Also counts numbers the copy does not carry over
            // exactly. The result is in the log's first line.
            if (Array.IndexOf(args, "--cc-forecast-check") >= 0) CoreClashApp.BeforeLocalShot = probe.Expect;
            Application.runInBackground = true;
        }

        void OnGUI() { if (Event.current.type == EventType.Repaint) repaints++; }

        void LateUpdate()
        {
            if (uncapped && QualitySettings.vSyncCount != 0) QualitySettings.vSyncCount = 0;
            if (noStopMark) BoardView.AimHelp = 0;
            var sim = app.Simulation; if (sim == null) return;
            Compare(sim);
            int steps = sim.State.frame - lastSimFrame; lastSimFrame = sim.State.frame;
            int painted = repaints; repaints = 0;
            if (sim.State.phase == MatchPhase.Aiming && sim.State.turn == 0)
            {
                float ms = Time.unscaledDeltaTime * 1000; aimFrames++; aimSum += ms; aimMax = Mathf.Max(aimMax, ms);
                float period = 1000f / Mathf.Max(30, Application.targetFrameRate > 0 ? Application.targetFrameRate : 60);
                if (ms > period * 1.5f) { aimLate++; if (aimLong.Length < 600) aimLong.Append(' ').Append(ms.ToString("0.0", CultureInfo.InvariantCulture)).Append("@t").Append(sim.State.turnNumber).Append("f").Append(Time.frameCount); }
            }
            if (sim.State.phase != MatchPhase.Moving) return;
            var ball = sim.State.balls.Where(b => !b.dead && b.moving).OrderByDescending(b => b.vx * b.vx + b.vy * b.vy).FirstOrDefault();
            if (ball == null) return;
            float lead = BoardView.StepBlend / 120f; var drawn = BoardView.DrawnAt(ball);
            var c = CultureInfo.InvariantCulture;
            log.Append(Time.frameCount).Append(',').Append((Time.unscaledDeltaTime * 1000).ToString("0.00", c)).Append(',').Append(steps).Append(',').Append(painted).Append(',')
               .Append(ball.id).Append(',').Append(ball.x.ToString("0.00", c)).Append(',').Append(ball.y.ToString("0.00", c)).Append(',')
               .Append(ball.vx.ToString("0.0", c)).Append(',').Append(ball.vy.ToString("0.0", c)).Append(',').Append((lead * 1000).ToString("0.00", c)).Append(',')
               .Append(drawn.x.ToString("0.00", c)).Append(',').Append(drawn.y.ToString("0.00", c)).Append(',').Append(GC.CollectionCount(0)).Append('\n');
        }

        void OnApplicationQuit()
        {
            var display = Screen.mainWindowDisplayInfo;
            string head = "# display=" + display.name + " refresh=" + display.refreshRate.value.ToString("0.0", CultureInfo.InvariantCulture) + " vsync=" + QualitySettings.vSyncCount + " target=" + Application.targetFrameRate + " api=" + SystemInfo.graphicsDeviceType + " gpu=" + SystemInfo.graphicsDeviceName
                + " aimFrames=" + aimFrames + " aimMeanMs=" + (aimFrames > 0 ? aimSum / aimFrames : 0).ToString("0.00", CultureInfo.InvariantCulture) + " aimLate=" + aimLate + " aimMaxMs=" + aimMax.ToString("0.00", CultureInfo.InvariantCulture) + " aimLong=" + aimLong
                + " forecastChecks=" + checks + " forecastMisses=" + checkMisses + " forecastWorst=" + checkWorst.ToString("0.000", CultureInfo.InvariantCulture) + " copyMismatches=" + copyMismatches + " forecastOff=" + checkLog + '\n';
            try { File.WriteAllText(path, head + log); } catch (Exception) { }
        }
    }
}
