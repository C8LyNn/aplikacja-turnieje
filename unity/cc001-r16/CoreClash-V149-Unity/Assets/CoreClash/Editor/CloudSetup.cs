using System;
using System.IO;
using System.Reflection;
using UnityEditor;
using UnityEngine;

namespace CoreClash.Editor
{
    // Account login and project linking stay in Unity's own Services settings.
    public sealed class CloudSetup : EditorWindow
    {
        // Calls the same native binding used by Unity's Services panel; no account tokens are read.
        public static void BindFromCommandLine()
        {
            var args=Environment.GetCommandLineArgs();
            string project=Argument(args,"--cc-cloud-project"),organization=Argument(args,"--cc-cloud-org"),name=Argument(args,"--cc-cloud-name");
            if(!Guid.TryParse(project,out var id)||id==Guid.Empty||string.IsNullOrWhiteSpace(organization)||string.IsNullOrWhiteSpace(name))throw new ArgumentException("A real Project ID, organization ID and project name are required.");
            var type=typeof(CloudProjectSettings).Assembly.GetType("UnityEditor.Connect.UnityConnect");
            var instance=type?.GetProperty("instance",BindingFlags.Static|BindingFlags.Public|BindingFlags.NonPublic)?.GetValue(null);
            var method=type?.GetMethod("BindProject",BindingFlags.Instance|BindingFlags.Public|BindingFlags.NonPublic,null,new[]{typeof(string),typeof(string),typeof(string)},null);
            if(instance==null||method==null)throw new InvalidOperationException("This Unity Editor does not expose project binding. Use Project Settings > Services.");
            method.Invoke(instance,new object[]{id.ToString(),name,organization});
            // BindProject updates Editor cloud metadata asynchronously. Persist the player ID explicitly
            // so batch builds cannot finish before that callback and ship an empty runtime ID.
            var setPlayerId=typeof(PlayerSettings).GetMethod("SetCloudProjectId",BindingFlags.Static|BindingFlags.NonPublic);
            if(setPlayerId==null)throw new InvalidOperationException("This Editor cannot persist the Cloud Project ID. Link it through Services settings.");
            setPlayerId.Invoke(null,new object[]{id.ToString()});AssetDatabase.SaveAssets();
            if(CloudProjectSettings.projectId!=id.ToString())throw new InvalidOperationException("Unity did not accept the project binding. Open Project Settings > Services to link it.");
            if(Application.cloudProjectId!=id.ToString())throw new InvalidOperationException("The player Cloud Project ID was not persisted; refusing to claim a successful binding.");
            Directory.CreateDirectory("Evidence");
            File.WriteAllText("Evidence/r6-cloud-binding.json",JsonUtility.ToJson(new BindingEvidence{checkedAt=DateTime.UtcNow.ToString("o"),projectId=CloudProjectSettings.projectId,organizationId=CloudProjectSettings.organizationId,projectBound=CloudProjectSettings.projectBound,runtimeProjectId=Application.cloudProjectId},true));
            Debug.Log("CC_CLOUD_PROJECT_CONFIGURED "+CloudProjectSettings.projectId+" bound="+CloudProjectSettings.projectBound);
        }
        static string Argument(string[] args,string key){int i=Array.IndexOf(args,key);return i>=0&&i+1<args.Length?args[i+1]:"";}
        [Serializable] sealed class BindingEvidence{public string checkedAt,projectId,organizationId,runtimeProjectId;public bool projectBound;}
        [MenuItem("Core Clash/Internet multiplayer setup")]
        public static void Open(){GetWindow<CloudSetup>("Core Clash Online").minSize=new Vector2(430,320);}
        void OnGUI()
        {
            GUILayout.Label("Internet crossplay setup",EditorStyles.boldLabel);
            EditorGUILayout.HelpBox("LAN works without Unity Cloud. Internet sessions require a linked Cloud project with Authentication and Multiplayer / Relay access.",MessageType.Info);
            EditorGUILayout.LabelField("Linked Project ID",string.IsNullOrEmpty(CloudProjectSettings.projectId)?"Not linked":CloudProjectSettings.projectId);
            EditorGUILayout.Space();
            GUILayout.Label("1. Sign into Unity Cloud and create Core Clash V149.",EditorStyles.wordWrappedLabel);
            GUILayout.Label("2. In Project Settings > Services, choose your organization and link that project.",EditorStyles.wordWrappedLabel);
            GUILayout.Label("3. Enable the required services in the Dashboard. Keep the same Project ID in every build.",EditorStyles.wordWrappedLabel);
            GUILayout.Label("4. Rebuild Windows, WebGL and Android; test Internet host + join code on two devices.",EditorStyles.wordWrappedLabel);
            EditorGUILayout.Space();
            if(GUILayout.Button("Open Unity Cloud",GUILayout.Height(34)))Application.OpenURL("https://cloud.unity.com/");
            if(GUILayout.Button("Open Project Settings / Services",GUILayout.Height(34)))SettingsService.OpenProjectSettings("Project/Services");
            if(GUILayout.Button("Open Unity setup guide",GUILayout.Height(34)))Application.OpenURL("https://docs.unity.com/en-us/services/getting-started");
        }
    }
}
