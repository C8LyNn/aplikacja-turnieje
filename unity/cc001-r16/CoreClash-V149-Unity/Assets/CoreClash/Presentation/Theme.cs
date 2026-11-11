using UnityEngine;
namespace CoreClash.Presentation
{
    // CC-001 W20: the one place that defines how the match screen looks.
    // Colour says what a thing IS, so the same hue never means two things:
    //   neutral board   slate blues            active objects  the two team colours
    //   selection       gold                   threat          hazard orange
    //   result          damage red / heal green / shield blue (never a team colour)
    // Sizes are in arena units (540 x 900) unless noted; times are seconds.
    public static class Theme
    {
        static Color C(string hex)=>ColorUtility.TryParseHtmlString(hex,out var color)?color:Color.white;
        public static Color A(Color color,float alpha)=>new Color(color.r,color.g,color.b,alpha);

        // Teams. Colour is never the only cue: P1 has a solid ring, P2 a segmented one.
        public static readonly Color P1=C("#4cc9f0"),P2=C("#ff5d73");
        public static Color Team(int owner)=>owner==0?P1:P2;
        public const int P2RingSegments=8;
        public const float P2RingFill=.62f;

        // Surfaces and text (HUD).
        public static readonly Color Background=C("#070d16"),Header=C("#0a121d"),Panel=C("#0d1826"),PanelLight=C("#132235"),PanelRaised=C("#1b3049"),
            Edge=C("#24384d"),EdgeStrong=C("#3a5670"),Plate=C("#050b13");
        public static readonly Color Text=C("#f3f7fb"),TextSoft=C("#c4d2de"),Muted=C("#8a9db0"),Disabled=C("#56677a"),Ink=C("#07111c");
        public const int FontTitle=17,FontBody=13,FontSmall=11,FontTiny=9;

        // Meaning.
        public static readonly Color Select=C("#ffd166"),Threat=C("#ff9f1c"),Damage=C("#ff4d4d"),Heal=C("#6fe08a"),Shield=C("#6fb8ff"),Info=C("#d9c7ff");

        // Arena.
        public static readonly Color BoardOuter=C("#04080f"),FloorEdge=C("#08121d"),FloorCentre=C("#0e1d2e"),Rim=C("#b9d6ea"),Centre=C("#dcecf8");
        public const float ZoneFillNear=.17f,ZoneFillFar=.04f,ZonePattern=.085f,ZoneEdge=.9f,ZoneLabel=.55f;
        public const float CentreRing=.6f,CentreFill=.04f,CentreLabel=.34f,MidLine=.13f,RimAlpha=.75f;

        // Balls.
        public const float OwnerRing=2.6f,OwnerGap=1f,SelectionRing=7f,BodyDark=.38f,BodyHighlight=.9f,ShadowAlpha=.5f;
        public const float WakeLength=64f,WakeAlpha=.2f;
        public const int WakeSteps=5;
        public static readonly Color HpGood=C("#8be28f"),HpHurt=C("#ffd166"),HpCritical=C("#ff5d5d");
        public const float HpHurtBelow=.6f,HpCriticalBelow=.3f,PlateAlpha=.93f;

        // Statuses: one colour per kind, used by the chip, its glyph and its feedback.
        public static Color Status(StatusKind kind)
        {
            switch(kind)
            {
                case StatusKind.Fire:return C("#ff7a2f");
                case StatusKind.Ice:return C("#7fdcff");
                case StatusKind.Frozen:return C("#d6f3ff");
                case StatusKind.Frostguard:return C("#9fe3ff");
                case StatusKind.Toxin:return C("#9bdc4a");
                case StatusKind.Rooted:return C("#c79a5b");
                case StatusKind.Shield:return Shield;
                case StatusKind.Divine:return C("#ffe9a8");
                case StatusKind.Armed:case StatusKind.Fuse:return Threat;
                case StatusKind.Jammed:return C("#b58cff");
                case StatusKind.Sticky:return C("#d9b45a");
                case StatusKind.Phased:return C("#a79cff");
                case StatusKind.Veteran:case StatusKind.Ancestral:return Select;
                default:return C("#a9bccb");
            }
        }

        // Effects. Strength scales every effect's opacity; set to 0 to silence them.
        public const float EffectStrength=1f;
        public const float NumberRise=30f,ImpactFlash=.18f,ImpactRadius=30f;
        public const float ExplosionFlash=.3f,ExplosionRadius=104f,ExplosionSparks=12;
        public const float StatusPop=.32f,ShieldPop=.45f,TurnCue=1.05f,BaseFlash=.7f;

        // Aim.
        public const float AimUnderlay=.55f,AimPull=.3f;
    }
}
