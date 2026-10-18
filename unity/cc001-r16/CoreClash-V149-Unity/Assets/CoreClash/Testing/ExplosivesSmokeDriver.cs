using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using CoreClash.Core;
using CoreClash.Presentation;
using UnityEngine;
using UnityEngine.Rendering;

namespace CoreClash.Testing
{
    // Deliberately staged renderer fixture, inactive unless explicitly requested.
    public sealed class ExplosivesSmokeDriver:MonoBehaviour
    {
        CoreClashApp app;bool running,capturing;int stage,captureFrame;float started;string output,capture;
        BallRuntime mine,timer;readonly List<Capture> captures=new List<Capture>();readonly List<string> errors=new List<string>();
        [Serializable]sealed class Capture{public string file,sha256;public int bytes;}
        [Serializable]sealed class Report{public bool pass;public string platform,graphics,scope,error;public Capture[] captures;}
        void Start(){
            var args=Environment.GetCommandLineArgs();if(!args.Contains("--cc-explosive-smoke"))return;int index=Array.IndexOf(args,"--cc-output");
            if(index<0||index+1>=args.Length||!Path.IsPathRooted(args[index+1])){Debug.LogError("CC_R9_HTML_FAIL output path required");Application.Quit(1);return;}
            output=Path.GetFullPath(args[index+1]);Directory.CreateDirectory(output);started=Time.realtimeSinceStartup;running=true;app=GetComponent<CoreClashApp>();Application.logMessageReceived+=Log;
        }
        void Log(string message,string stack,LogType type){if(type==LogType.Exception)errors.Add(message);}
        void OnDestroy(){Application.logMessageReceived-=Log;}
        void Update(){
            if(!running)return;
            try{
                if(Time.realtimeSinceStartup-started>30)throw new Exception("Renderer fixture timed out");
                if(Time.realtimeSinceStartup-started<3||!SplashScreen.isFinished)return;
                if(SystemInfo.graphicsDeviceType==GraphicsDeviceType.Null)throw new Exception("A real renderer is required");
                if(capturing){if(Time.frameCount<captureFrame+4||!File.Exists(capture)||new FileInfo(capture).Length<1024)return;byte[] bytes=File.ReadAllBytes(capture);using(var h=SHA256.Create())captures.Add(new Capture{file=Path.GetFileName(capture),bytes=bytes.Length,sha256=BitConverter.ToString(h.ComputeHash(bytes)).Replace("-","").ToLowerInvariant()});capturing=false;stage++;return;}
                if(stage==0){
                    string deck=app.Catalog.Data.decks.First(d=>d.balls.Contains("timebomb")).id;app.SelectDeck(0,deck);app.StartLocalMatch();app.SetDeveloperOverlay(false);var s=app.Simulation;
                    mine=s.Spawn(0,"mine",160,380);timer=s.Spawn(0,"timebomb",360,470);s.Spawn(1,"normal",350,550);s.Abilities.OnStop(mine);s.Abilities.OnStop(timer);
                    if(!mine.mineArmed||!timer.timeBombArmed||timer.timeBombCounter!=0)throw new Exception("Arming failed");CaptureFrame("r9-html-01-armed.png");
                }else if(stage==1){
                    OwnTurn();if(timer.dead||timer.timeBombCounter!=1)throw new Exception("Fuse did not count one own turn");CaptureFrame("r9-html-02-fuse.png");
                }else if(stage==2){
                    OwnTurn();var s=app.Simulation;var bomb=s.Spawn(0,"bomb",270,610);s.Spawn(1,"normal",320,650);s.Abilities.OnStop(bomb);
                    if(!timer.dead||!bomb.dead||s.State.events.Count(e=>e.kind=="EXPLOSION")!=2)throw new Exception("Detonation separation failed");CaptureFrame("r9-html-03-blast.png");
                }else{if(errors.Count>0)throw new Exception(string.Join("; ",errors));Write(true);Debug.Log("CC_R9_HTML_PASS captures="+captures.Count);running=false;Application.Quit(0);}
            }catch(Exception e){Write(false,e.ToString());Debug.LogError("CC_R9_HTML_FAIL "+e.Message);running=false;Application.Quit(1);}
        }
        void OwnTurn(){var s=app.Simulation;s.State.turnNumber++;s.State.players[0].ownerTurns++;s.Abilities.OnTurnStart(0);}
        void CaptureFrame(string name){capture=Path.Combine(output,name);ScreenCapture.CaptureScreenshot(capture);captureFrame=Time.frameCount;capturing=true;}
        void Write(bool pass,string error=null){File.WriteAllText(Path.Combine(output,"r9-html-native.json"),JsonUtility.ToJson(new Report{pass=pass,error=error,platform=Application.platform.ToString(),graphics=SystemInfo.graphicsDeviceType.ToString(),captures=captures.ToArray(),scope="Staged renderer fixture: armed Mine, Time Bomb two/one-turn fuse and separate detonations. Not a manual or empty-board legal match."},true));}
    }
}
