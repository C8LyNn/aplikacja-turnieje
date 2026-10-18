using System;
using System.IO;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Presentation;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace CoreClash.Editor
{
    public static class BuildTools
    {
        const string Scene="Assets/Scenes/CoreClash.unity";
        const string EvidenceRoot="Evidence/R16/Unity";
        [MenuItem("Core Clash/Setup and validate project")]
        public static void SetupAndSmoke()
        {
            PlayerSettings.companyName="Core Clash";PlayerSettings.productName="Core Clash V149 Class Demo";PlayerSettings.bundleVersion="149.0.0";
            PlayerSettings.defaultScreenWidth=1280;PlayerSettings.defaultScreenHeight=900;PlayerSettings.runInBackground=true;PlayerSettings.resizableWindow=true;
            PlayerSettings.fullScreenMode=FullScreenMode.Windowed;PlayerSettings.defaultInterfaceOrientation=UIOrientation.AutoRotation;
            PlayerSettings.SplashScreen.show=false;
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android,"com.coreclash.classdemo");
            PlayerSettings.Android.targetArchitectures=AndroidArchitecture.ARM64;PlayerSettings.Android.minSdkVersion=AndroidSdkVersions.AndroidApiLevel26;
            PlayerSettings.Android.forceInternetPermission=true;
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.Android,ScriptingImplementation.IL2CPP);
            PlayerSettings.WebGL.compressionFormat=WebGLCompressionFormat.Disabled;PlayerSettings.WebGL.decompressionFallback=false;
            PlayerSettings.WebGL.template="PROJECT:CoreClash";
            Directory.CreateDirectory("Assets/Scenes");
            var scene=File.Exists(Scene)?EditorSceneManager.OpenScene(Scene,OpenSceneMode.Single):EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);
            var camera=UnityEngine.Object.FindAnyObjectByType<Camera>();if(camera==null)camera=new GameObject("Camera").AddComponent<Camera>();camera.clearFlags=CameraClearFlags.SolidColor;camera.backgroundColor=new Color(.027f,.047f,.075f);camera.orthographic=true;
            var app=UnityEngine.Object.FindAnyObjectByType<CoreClashApp>();if(app==null)app=new GameObject("Core Clash V149").AddComponent<CoreClashApp>();
            if(app.GetComponent<CoreClash.Testing.PresentationSmokeDriver>()==null)app.gameObject.AddComponent<CoreClash.Testing.PresentationSmokeDriver>();
            if(app.GetComponent<CoreClash.Testing.HtmlMechanicsSmokeDriver>()==null)app.gameObject.AddComponent<CoreClash.Testing.HtmlMechanicsSmokeDriver>();
            if(app.GetComponent<CoreClash.Testing.ExplosivesSmokeDriver>()==null)app.gameObject.AddComponent<CoreClash.Testing.ExplosivesSmokeDriver>();
            if(app.GetComponent<CoreClash.Testing.StatusPayoffSmokeDriver>()==null)app.gameObject.AddComponent<CoreClash.Testing.StatusPayoffSmokeDriver>();
            var networkType=Type.GetType("CoreClash.Networking.NgoGameSession, Assembly-CSharp");networkType?.GetMethod("ConfigureScene",System.Reflection.BindingFlags.Public|System.Reflection.BindingFlags.Static)?.Invoke(null,new object[]{app.gameObject});
            EditorSceneManager.SaveScene(scene,Scene);
            EditorBuildSettings.scenes=new[]{new EditorBuildSettingsScene(Scene,true)};AssetDatabase.SaveAssets();
            app.Initialize();if(app.Catalog==null||app.Catalog.Data.balls.Length!=227||app.Catalog.Data.decks.Length!=36||app.Catalog.Featured.Length!=4)throw new Exception("Catalog smoke failed");
            var sim=app.Simulation;var c=new PlayerCommand{owner=0,turnNumber=1,kind=CommandKind.Spawn,ballType="normal",dx=0,dy=-1,power=420};if(!sim.TryCommand(c,out var reason))throw new Exception(reason);
            for(int i=0;i<4000&&sim.State.phase==MatchPhase.Moving;i++)sim.Step(1f/120);
            if(sim.State.turn!=1||sim.State.phase!=MatchPhase.Aiming)throw new Exception("Local launch/settle smoke failed");
            Directory.CreateDirectory(EvidenceRoot);File.WriteAllText(EvidenceRoot+"/unity-smoke.json","{\"editor\":\""+Application.unityVersion+"\",\"catalogRecords\":227,\"canonicalDecks\":36,\"featuredDecks\":4,\"launchSettledToPlayer2\":true}");
            Debug.Log("CORE_CLASH_UNITY_SMOKE_PASS");
        }
        [MenuItem("Core Clash/Build Windows")]
        public static void BuildWindows(){SetupAndSmoke();Build(BuildTarget.StandaloneWindows64,"Builds/Windows/CoreClash.exe");}
        [MenuItem("Core Clash/Build WebGL")]
        public static void BuildWebGL(){SetupAndSmoke();Build(BuildTarget.WebGL,"Builds/WebGL");PackageBrowserInvitation();}
        static void PackageBrowserInvitation()
        {
            if(!File.Exists("Builds/Windows/CoreClash.exe"))return;
            const string source="Builds/WebGL",target="Builds/Windows/WebRoot";
            foreach(string file in Directory.GetFiles(source,"*",SearchOption.AllDirectories)){string destination=Path.Combine(target,file.Substring(source.Length).TrimStart('/','\\'));Directory.CreateDirectory(Path.GetDirectoryName(destination));File.Copy(file,destination,true);}
            Debug.Log("CORE_CLASH_LAN_WEBROOT_PACKAGED");
        }
        [MenuItem("Core Clash/Build Android (requires installed module and SDK)")]
        public static void BuildAndroid(){SetupAndSmoke();if(!BuildPipeline.IsBuildTargetSupported(BuildTargetGroup.Android,BuildTarget.Android))throw new Exception("Android module/SDK unavailable; Windows and WebGL are independent.");Build(BuildTarget.Android,"Builds/Android/CoreClash.apk");}
        static void Build(BuildTarget target,string path)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(path));var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions{scenes=new[]{Scene},locationPathName=path,target=target,options=BuildOptions.None});
            File.WriteAllText(EvidenceRoot+"/build-"+target+".json",JsonUtility.ToJson(new BuildEvidence{target=target.ToString(),result=report.summary.result.ToString(),errors=report.summary.totalErrors,warnings=report.summary.totalWarnings,size=report.summary.totalSize.ToString(),time=report.summary.totalTime.ToString()},true));
            if(report.summary.result!=BuildResult.Succeeded)throw new Exception(target+" build failed");Debug.Log("CORE_CLASH_BUILD_PASS "+target);
        }
        [Serializable] sealed class BuildEvidence{public string target,result,size,time;public int errors,warnings;}
    }
}
