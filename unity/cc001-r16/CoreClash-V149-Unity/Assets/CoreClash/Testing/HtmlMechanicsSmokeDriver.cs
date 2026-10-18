using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using CoreClash.Core;
using UnityEngine;
using UnityEngine.Rendering;

namespace CoreClash.Testing
{
    // Explicit staged renderer fixture. Inert in ordinary play; never writes catalog/decks or game saves.
    public sealed class HtmlMechanicsSmokeDriver:MonoBehaviour
    {
        CoreClash.Presentation.CoreClashApp app;
        bool running,capturing;int stage,captureFrame;float started;string output,capture;
        readonly List<Capture> captures=new List<Capture>();
        readonly List<string> errors=new List<string>();
        [Serializable] sealed class Capture {public string file,sha256;public int bytes;}
        void Start()
        {
            var args=Environment.GetCommandLineArgs();if(!args.Contains("--cc-html-smoke"))return;
            int index=Array.IndexOf(args,"--cc-output");
            if(index<0||index+1>=args.Length||!Path.IsPathRooted(args[index+1])){Debug.LogError("CC_R8_HTML_FAIL output path required");Application.Quit(1);return;}
            output=Path.GetFullPath(args[index+1]);Directory.CreateDirectory(output);started=Time.realtimeSinceStartup;running=true;
            app=GetComponent<CoreClash.Presentation.CoreClashApp>();Application.logMessageReceived+=Log;
        }
        void Log(string message,string stack,LogType type){if(type==LogType.Exception)errors.Add(message);}
        void OnDestroy(){Application.logMessageReceived-=Log;}
        void Update()
        {
            if(!running)return;
            try{
                if(Time.realtimeSinceStartup-started>30)throw new Exception("Renderer fixture timed out");
                if(Time.realtimeSinceStartup-started<3||!SplashScreen.isFinished)return;
                if(SystemInfo.graphicsDeviceType==GraphicsDeviceType.Null)throw new Exception("A real renderer is required");
                if(capturing){
                    if(Time.frameCount<captureFrame+4||!File.Exists(capture)||new FileInfo(capture).Length<1024)return;
                    byte[] bytes=File.ReadAllBytes(capture);using(var digest=SHA256.Create())captures.Add(new Capture{file=Path.GetFileName(capture),bytes=bytes.Length,sha256=BitConverter.ToString(digest.ComputeHash(bytes)).Replace("-","").ToLowerInvariant()});
                    capturing=false;stage++;return;
                }
                if(stage==0){
                    app.StartLocalMatch();app.SetDeveloperOverlay(false);var s=app.Simulation;
                    var p=s.Spawn(0,"pinballer",100,450);s.Abilities.OnStop(p);
                    if(s.State.structures.Count!=1||s.State.structures[0].hp!=5)throw new Exception("Pinballer did not create the expected bumper");
                    CaptureFrame("r8-html-01-bumper.png");
                }else if(stage==1){
                    var s=app.Simulation;var sling=s.Spawn(0,"slingshot",270,570);sling.angle=-(float)Math.PI/2;
                    s.Spawn(0,"normal",150,570);s.Spawn(0,"normal",390,570);
                    var ram=s.Spawn(0,"ram",200,350);var target=s.Spawn(1,"normal",245,350);
                    s.State.phase=MatchPhase.Moving;s.State.actionSerial=1;s.Abilities.OnContact(ram,target,true,true,200);s.Abilities.OnStop(sling);
                    if(target.hp!=25||!s.State.events.Any(e=>e.kind=="SLINGSHOT"))throw new Exception("Staged Ram/Slingshot effects failed");
                    CaptureFrame("r8-html-02-launches.png");
                }else{
                    if(errors.Count>0)throw new Exception(string.Join("; ",errors));
                    File.WriteAllText(Path.Combine(output,"r8-html-native.json"),JsonUtility.ToJson(new Report{pass=true,platform=Application.platform.ToString(),graphics=SystemInfo.graphicsDeviceType.ToString(),captures=captures.ToArray(),scope="Staged native renderer fixture for bumper, Slingshot and Ram. Not a manually played or empty-board legal match."},true));
                    Debug.Log("CC_R8_HTML_PASS captures="+captures.Count);running=false;Application.Quit(0);
                }
            }catch(Exception e){File.WriteAllText(Path.Combine(output,"r8-html-native.json"),JsonUtility.ToJson(new Report{pass=false,error=e.ToString(),captures=captures.ToArray()},true));Debug.LogError("CC_R8_HTML_FAIL "+e.Message);running=false;Application.Quit(1);}
        }
        void CaptureFrame(string name){capture=Path.Combine(output,name);ScreenCapture.CaptureScreenshot(capture);captureFrame=Time.frameCount;capturing=true;}
        [Serializable] sealed class Report {public bool pass;public string platform,graphics,scope,error;public Capture[] captures;}
    }
}
