using System;
using System.Globalization;
using CoreClash.Core;
using UnityEngine;
namespace CoreClash.Presentation
{
    // CC-001 W24 (owner decisions): what the player sets before a match - the rules of the match -
    // and how the match is shown. The rules go into GameState when a match starts (the reference
    // rules are the defaults there, so tests and demos are untouched); what is only shown never
    // reaches the simulation.
    public static class MatchSetup
    {
        public const string RandomMap = "random";
        public static MapDefinition[] Maps => MatchMaps.All;
        public static readonly float[] BallScales = { 1f, 1.5f, 2f };

        // ---- rules of the match
        public static float BallScale = 2f;
        public static bool DoubleTurn = true;
        public static string Map = RandomMap;
        // ---- how the match is shown
        // Damage numbers over the balls take the eye off the collision itself: off unless asked for.
        public static bool DamageNumbers = false;

        public static MapDefinition MapById(string id) => MatchMaps.ById(id);
        public static string MapName(string id) => id == RandomMap ? Lang.T("Random", "Losowa") : (MapById(id) is MapDefinition named ? Lang.T(named.NameEn, named.NamePl) : Lang.T("Open", "Otwarta"));

        public static void Load()
        {
            BallScale = Mathf.Clamp(PlayerPrefs.GetFloat("cc.rule.ballScale", 2f), .5f, 3f);
            DoubleTurn = PlayerPrefs.GetInt("cc.rule.doubleTurn", 1) == 1;
            Map = PlayerPrefs.GetString("cc.rule.map", RandomMap);
            if (Map != RandomMap && MapById(Map) == null) Map = RandomMap;
            DamageNumbers = PlayerPrefs.GetInt("cc.show.damageNumbers", 0) == 1;
            Theme.ShowHpNumber = PlayerPrefs.GetInt("cc.show.hpNumbers", 0) == 1;
            BoardView.ShowStopEstimate = PlayerPrefs.GetInt("cc.show.stopMark", 1) == 1;
            // Test hooks: "--cc-ball-scale <n>", "--cc-map <id>", "--cc-double-turn <0|1>".
            var args = Environment.GetCommandLineArgs();
            int at = Array.IndexOf(args, "--cc-ball-scale");
            if (at >= 0 && at + 1 < args.Length && float.TryParse(args[at + 1], NumberStyles.Float, CultureInfo.InvariantCulture, out float scale)) BallScale = Mathf.Clamp(scale, .5f, 3f);
            at = Array.IndexOf(args, "--cc-map");
            if (at >= 0 && at + 1 < args.Length && (args[at + 1] == RandomMap || MapById(args[at + 1]) != null)) Map = args[at + 1];
            at = Array.IndexOf(args, "--cc-double-turn");
            if (at >= 0 && at + 1 < args.Length) DoubleTurn = args[at + 1] == "1";
        }
        public static void Save()
        {
            PlayerPrefs.SetFloat("cc.rule.ballScale", BallScale);
            PlayerPrefs.SetInt("cc.rule.doubleTurn", DoubleTurn ? 1 : 0);
            PlayerPrefs.SetString("cc.rule.map", Map);
            PlayerPrefs.SetInt("cc.show.damageNumbers", DamageNumbers ? 1 : 0);
            PlayerPrefs.SetInt("cc.show.hpNumbers", Theme.ShowHpNumber ? 1 : 0);
            PlayerPrefs.SetInt("cc.show.stopMark", BoardView.ShowStopEstimate ? 1 : 0);
            PlayerPrefs.Save();
        }

        // Puts the chosen rules into a match that has just been created (before its first shot).
        public static void Apply(GameSimulation simulation)
        {
            if (simulation == null) return;
            var state = simulation.State;
            state.ballScale = BallScale;
            state.comebackRule = DoubleTurn;
            var map = Map == RandomMap ? Maps[UnityEngine.Random.Range(0, Maps.Length)] : MapById(Map) ?? Maps[0];
            MatchMaps.Apply(simulation, map);
        }
    }
}
