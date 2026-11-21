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
    public sealed class W24MotionProbe : MonoBehaviour
    {
        CoreClashApp app; string path; readonly StringBuilder log = new StringBuilder("frame,dtMs,steps,repaints,id,x,y,vx,vy,lead,drawX,drawY\n");
        int lastSimFrame, repaints;

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
            Application.runInBackground = true;
        }

        void OnGUI() { if (Event.current.type == EventType.Repaint) repaints++; }

        void LateUpdate()
        {
            var sim = app.Simulation; if (sim == null) return;
            int steps = sim.State.frame - lastSimFrame; lastSimFrame = sim.State.frame;
            int painted = repaints; repaints = 0;
            if (sim.State.phase != MatchPhase.Moving) return;
            var ball = sim.State.balls.Where(b => !b.dead && b.moving).OrderByDescending(b => b.vx * b.vx + b.vy * b.vy).FirstOrDefault();
            if (ball == null) return;
            float lead = BoardView.VisualLead;
            var c = CultureInfo.InvariantCulture;
            log.Append(Time.frameCount).Append(',').Append((Time.unscaledDeltaTime * 1000).ToString("0.00", c)).Append(',').Append(steps).Append(',').Append(painted).Append(',')
               .Append(ball.id).Append(',').Append(ball.x.ToString("0.00", c)).Append(',').Append(ball.y.ToString("0.00", c)).Append(',')
               .Append(ball.vx.ToString("0.0", c)).Append(',').Append(ball.vy.ToString("0.0", c)).Append(',').Append((lead * 1000).ToString("0.00", c)).Append(',')
               .Append((ball.x + ball.vx * lead).ToString("0.00", c)).Append(',').Append((ball.y + ball.vy * lead).ToString("0.00", c)).Append('\n');
        }

        void OnApplicationQuit()
        {
            var display = Screen.mainWindowDisplayInfo;
            string head = "# display=" + display.name + " refresh=" + display.refreshRate.value.ToString("0.0", CultureInfo.InvariantCulture) + " vsync=" + QualitySettings.vSyncCount + " target=" + Application.targetFrameRate + " api=" + SystemInfo.graphicsDeviceType + " gpu=" + SystemInfo.graphicsDeviceName + '\n';
            try { File.WriteAllText(path, head + log); } catch (Exception) { }
        }
    }
}
