using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using CoreClash.Core;
using CoreClash.Networking;
using UnityEngine;
using UnityEngine.Rendering;

namespace CoreClash.Testing
{
    // Opt-in, staged real-player fixture. Inert during ordinary gameplay.
    public sealed class StatusPayoffSmokeDriver:MonoBehaviour
    {
        CoreClash.Presentation.CoreClashApp app;
        bool running,capturing;int stage,captureFrame,repaints,lastPaint=-1;float started;string output,capture;
        readonly List<Capture> captures=new List<Capture>();
        readonly List<string> errors=new List<string>();
        [Serializable] sealed class Capture{public string file,sha256;public int bytes;}
        void Start()
        {
            var args=Environment.GetCommandLineArgs();if(!args.Contains("--cc-r16-smoke"))return;
            int index=Array.IndexOf(args,"--cc-output");
            if(index<0||index+1>=args.Length||!Path.IsPathRooted(args[index+1])){Application.Quit(1);return;}
            output=Path.GetFullPath(args[index+1]);Directory.CreateDirectory(output);started=Time.realtimeSinceStartup;running=true;
            app=GetComponent<CoreClash.Presentation.CoreClashApp>();Application.logMessageReceived+=Log;
        }
        void Log(string message,string stack,LogType type){if(type==LogType.Exception)errors.Add(message);}
        void OnDestroy(){Application.logMessageReceived-=Log;}
        void OnGUI(){if(running&&SplashScreen.isFinished&&Event.current.type==EventType.Repaint&&lastPaint!=Time.frameCount){lastPaint=Time.frameCount;repaints++;}}
        static void Check(bool ok,string message){if(!ok)throw new Exception(message);}
        void Update()
        {
            if(!running)return;
            try
            {
                if(Time.realtimeSinceStartup-started>45)throw new Exception("R16 renderer fixture timed out");
                if(Time.realtimeSinceStartup-started<3||!SplashScreen.isFinished||repaints<3)return;
                Check(SystemInfo.graphicsDeviceType!=GraphicsDeviceType.Null,"Real renderer required");
                if(capturing)
                {
                    if(Time.frameCount<captureFrame+4||!File.Exists(capture)||new FileInfo(capture).Length<1024)return;
                    byte[] bytes=File.ReadAllBytes(capture);
                    var texture=new Texture2D(2,2);try{
                        Check(texture.LoadImage(bytes),"PNG decode");var pixels=texture.GetPixels32();var colors=new HashSet<int>();int min=255,max=0;
                        for(int i=0;i<pixels.Length;i+=Math.Max(1,pixels.Length/4000)){var p=pixels[i];colors.Add((p.r<<16)|(p.g<<8)|p.b);int bright=Math.Max(p.r,Math.Max(p.g,p.b));min=Math.Min(min,bright);max=Math.Max(max,bright);}
                        Check(colors.Count>=16&&max-min>=24,"Black or flat capture is not valid evidence");
                    }finally{Destroy(texture);}
                    using(var digest=SHA256.Create())captures.Add(new Capture{file=Path.GetFileName(capture),bytes=bytes.Length,sha256=BitConverter.ToString(digest.ComputeHash(bytes)).Replace("-","").ToLowerInvariant()});
                    capturing=false;stage++;return;
                }
                if(stage==0)
                {
                    app.StartLocalMatch();app.SetDeveloperOverlay(false);var s=app.Simulation;
                    var wall=s.Spawn(0,"wallmaker",270,400);s.Abilities.OnStop(wall);Check(s.Structures.ActiveCount==3,"Wallmaker row");
                    var g=s.State.structures[0];s.Structures.Damage(g,2,null);s.Spawn(0,"repairpulse",g.x+35,g.y);
                    s.Spawn(0,"quartermaster",120,560);s.Spawn(0,"commander",180,560);s.Spawn(0,"hatchery",400,550);
                    var furnace=s.Spawn(1,"furnace",340,220);s.Abilities.OnTurnStart(0);s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);s.Abilities.OnTurnStart(1);
                    Check(g.hp==5,"RepairPulse");Check(s.State.balls.Any(b=>b.generated&&b.type=="normal"&&b.shield==5),"Reinforcement shields");Check(s.State.balls.Any(b=>b.generated&&b.type=="broodling"),"Hatchery");Check(s.State.zones.Any(z=>z.kind=="furnaceFire"),"Furnace");
                    var packet=new NetworkGameSession(s).Capture(x=>JsonUtility.ToJson(x));var client=new NetworkGameStateAdapter();Check(client.Apply(packet,JsonUtility.FromJson<GameState>,out _),"Unity JsonUtility snapshot admission");
                    CaptureFrame("r16-01-construction-summons.png");
                }
                else if(stage==1)
                {
                    app.StartLocalMatch();var s=app.Simulation;int i=0;
                    foreach(string type in new[]{"embertrap","frosttrap","sporetrap"})
                    {
                        var b=s.Spawn(0,type,130+i++*140,450);s.Abilities.OnStop(b);b.y=560;
                    }
                    Check(s.State.zones.Count==3,"Three persistent traps");CaptureFrame("r16-02-traps-armed.png");
                }
                else if(stage==2)
                {
                    var s=app.Simulation;var victims=new List<BallRuntime>();
                    foreach(var z in s.State.zones)victims.Add(s.Spawn(1,"normal",z.x,z.y));
                    s.Abilities.OnStep(1f/120);Check(s.State.zones.All(z=>z.dead),"One charge consumed");
                    Check(victims[0].fireStacks==1&&victims[1].iceStacks==1&&victims[2].toxinTurns==3,"Elemental status effects");
                    var v=s.Spawn(0,"venom",victims[2].x,victims[2].y+38);v.hp=15;s.Collisions.Resolve(v,victims[2]);Check(victims[2].hp==25&&v.hp==20,"Venom physics TOUCH payoff");
                    s.Abilities.ApplyIce(victims[1],0);var sh=s.Spawn(0,"shatterer",victims[1].x,victims[1].y+38);s.Collisions.Resolve(sh,victims[1]);Check(victims[1].hp==25&&victims[1].iceStacks==0,"Shatterer physics TOUCH payoff");
                    var packet=new NetworkGameSession(s).Capture(x=>JsonUtility.ToJson(x));var client=new NetworkGameStateAdapter();Check(client.Apply(packet,JsonUtility.FromJson<GameState>,out _),"Spent traps JSON snapshot");
                    CaptureFrame("r16-03-status-payoffs.png");
                }
                else
                {
                    Check(errors.Count==0,string.Join("; ",errors));
                    Check(captures.Select(c=>c.sha256).Distinct().Count()==3,"Stage captures must differ");
                    File.WriteAllText(Path.Combine(output,"r16-native.json"),JsonUtility.ToJson(new Report{pass=true,platform=Application.platform.ToString(),graphics=SystemInfo.graphicsDeviceType.ToString(),captures=captures.ToArray(),scope="Staged native renderer and Unity JsonUtility checks R10–R16; five R16 powers including weak physical pair collisions. Not a manually played match."},true));
                    Debug.Log("CC_R16_SMOKE_PASS");running=false;Application.Quit(0);
                }
            }
            catch(Exception e){File.WriteAllText(Path.Combine(output,"r16-native.json"),JsonUtility.ToJson(new Report{pass=false,error=e.ToString(),captures=captures.ToArray()},true));Debug.LogError("CC_R16_SMOKE_FAIL "+e.Message);running=false;Application.Quit(1);}
        }
        void CaptureFrame(string name){capture=Path.Combine(output,name);if(File.Exists(capture))File.Delete(capture);ScreenCapture.CaptureScreenshot(capture);captureFrame=Time.frameCount;capturing=true;}
        [Serializable] sealed class Report{public bool pass;public string platform,graphics,scope,error;public Capture[] captures;}
    }
}
