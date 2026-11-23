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
        // Owner decisions: twice the reference size (2026-11-21), then a quarter smaller (2026-11-22).
        public static float BallScale = 1.5f;
        public static bool DoubleTurn = true;
        public static string Map = RandomMap;
        // ---- how the match is shown
        // Damage numbers over the balls take the eye off the collision itself: off unless asked for.
        public static bool DamageNumbers = false;

        // ---- the computer's level (W24, owner decision 2026-11-22: "a solo player picks a difficulty")
        public static AiLevel AiLevel = AiLevel.Normal;
        public static string AiLevelName(AiLevel level) => level == AiLevel.Easy ? Lang.T("Easy", "Łatwy") : level == AiLevel.Hard ? Lang.T("Hard", "Trudny") : Lang.T("Normal", "Średni");

        // ---- players' colours (W24, owner decision): each player's own choice; the computer's is drawn.
        public static int Color1 = 0, Color2 = 1;
        // The next colour for that player that the other one has not taken.
        public static int NextColor(int owner, int step)
        {
            int count = Theme.PlayerColors.Length, mine = owner == 0 ? Color1 : Color2, other = owner == 0 ? Color2 : Color1, pick = mine;
            do pick = ((pick + step) % count + count) % count; while (pick == other);
            return pick;
        }
        public static void SetColor(int owner, int index)
        {
            if (owner == 0) Color1 = index; else Color2 = index;
            if (Color1 == Color2) { if (owner == 0) Color2 = NextColor(1, 1); else Color1 = NextColor(0, 1); }
            UseChosenColors();
        }
        public static void UseChosenColors() => Theme.SetPlayerColors(Color1, Color2);
        // A match against the computer: its colour is drawn from the ones the player did not take.
        public static void DrawComputerColor()
        {
            int count = Theme.PlayerColors.Length, pick = forcedComputer >= 0 ? forcedComputer : UnityEngine.Random.Range(0, count);
            if (pick == Color1) pick = (pick + 1 + UnityEngine.Random.Range(0, count - 1)) % count;
            if (pick == Color1) pick = (pick + 1) % count;
            Theme.SetPlayerColors(Color1, pick);
        }
        // A game over the network: the colour I chose is mine whichever seat I sit in. Until the two
        // players have exchanged their choices (NgoGameSession.PeerReady / ReceiveColors) I see the
        // other player in my own second colour.
        public static void UseColorsFor(int localOwner) { if (localOwner == 1) Theme.SetPlayerColors(Color2, Color1); else UseChosenColors(); }
        static int forcedComputer = -1;

        public static MapDefinition MapById(string id) => MatchMaps.ById(id);
        public static string MapName(string id) => id == RandomMap ? Lang.T("Random", "Losowa") : (MapById(id) is MapDefinition named ? Lang.T(named.NameEn, named.NamePl) : Lang.T("Open", "Otwarta"));

        public static void Load()
        {
            BallScale = Mathf.Clamp(PlayerPrefs.GetFloat("cc.rule.ballSize", 1.5f), .5f, 3f);
            DoubleTurn = PlayerPrefs.GetInt("cc.rule.doubleTurn", 1) == 1;
            Map = PlayerPrefs.GetString("cc.rule.map", RandomMap);
            if (Map != RandomMap && MapById(Map) == null) Map = RandomMap;
            DamageNumbers = PlayerPrefs.GetInt("cc.show.damageNumbers", 0) == 1;
            Theme.ShowHpNumber = PlayerPrefs.GetInt("cc.show.hpNumbers", 0) == 1;
            BoardView.ShowStopEstimate = PlayerPrefs.GetInt("cc.show.stopMark", 1) == 1;
            Color1 = Mathf.Clamp(PlayerPrefs.GetInt("cc.color.p1", 0), 0, Theme.PlayerColors.Length - 1);
            Color2 = Mathf.Clamp(PlayerPrefs.GetInt("cc.color.p2", 1), 0, Theme.PlayerColors.Length - 1);
            if (Color2 == Color1) Color2 = NextColor(1, 1);
            AiLevel = (AiLevel)Mathf.Clamp(PlayerPrefs.GetInt("cc.ai.level", (int)AiLevel.Normal), 0, 2);
            // Test hooks: "--cc-ball-scale <n>", "--cc-map <id>", "--cc-double-turn <0|1>",
            // "--cc-colors <first>,<second>" (indices into Theme.PlayerColors; also the computer's),
            // "--cc-ai-level <0|1|2>" (easy, normal, hard).
            var args = Environment.GetCommandLineArgs();
            int ai = Array.IndexOf(args, "--cc-ai-level");
            if (ai >= 0 && ai + 1 < args.Length && int.TryParse(args[ai + 1], out int wanted)) AiLevel = (AiLevel)Mathf.Clamp(wanted, 0, 2);
            int colors = Array.IndexOf(args, "--cc-colors");
            if (colors >= 0 && colors + 1 < args.Length)
            {
                var parts = args[colors + 1].Split(',');
                if (parts.Length == 2 && int.TryParse(parts[0], out int a) && int.TryParse(parts[1], out int b)) { Color1 = Mathf.Clamp(a, 0, Theme.PlayerColors.Length - 1); Color2 = Mathf.Clamp(b, 0, Theme.PlayerColors.Length - 1); forcedComputer = Color2; }
            }
            UseChosenColors();
            int at = Array.IndexOf(args, "--cc-ball-scale");
            if (at >= 0 && at + 1 < args.Length && float.TryParse(args[at + 1], NumberStyles.Float, CultureInfo.InvariantCulture, out float scale)) BallScale = Mathf.Clamp(scale, .5f, 3f);
            at = Array.IndexOf(args, "--cc-map");
            if (at >= 0 && at + 1 < args.Length && (args[at + 1] == RandomMap || MapById(args[at + 1]) != null)) Map = args[at + 1];
            at = Array.IndexOf(args, "--cc-double-turn");
            if (at >= 0 && at + 1 < args.Length) DoubleTurn = args[at + 1] == "1";
        }
        public static void Save()
        {
            PlayerPrefs.SetFloat("cc.rule.ballSize", BallScale);
            PlayerPrefs.SetInt("cc.rule.doubleTurn", DoubleTurn ? 1 : 0);
            PlayerPrefs.SetString("cc.rule.map", Map);
            PlayerPrefs.SetInt("cc.show.damageNumbers", DamageNumbers ? 1 : 0);
            PlayerPrefs.SetInt("cc.show.hpNumbers", Theme.ShowHpNumber ? 1 : 0);
            PlayerPrefs.SetInt("cc.show.stopMark", BoardView.ShowStopEstimate ? 1 : 0);
            PlayerPrefs.SetInt("cc.color.p1", Color1);
            PlayerPrefs.SetInt("cc.color.p2", Color2);
            PlayerPrefs.SetInt("cc.ai.level", (int)AiLevel);
            PlayerPrefs.Save();
        }

        // Puts the chosen rules into a match that has just been created (before its first shot).
        public static void Apply(GameSimulation simulation)
        {
            if (simulation == null) return;
            var state = simulation.State;
            state.ballScale = BallScale;
            state.comebackRule = DoubleTurn;
            // W24 six groups: a ball has only the power written on its card.
            state.plainPowers = true;
            // W24 (owner rule): one place on the board holds one field.
            state.exclusiveFields = true;
            // W24 (owner decision after the lab's measurement): Player 2's extra opening ball is a Standard one.
            state.standardOpeningBonus = true;
            var map = Map == RandomMap ? Maps[UnityEngine.Random.Range(0, Maps.Length)] : MapById(Map) ?? Maps[0];
            MatchMaps.Apply(simulation, map);
        }
    }
}
