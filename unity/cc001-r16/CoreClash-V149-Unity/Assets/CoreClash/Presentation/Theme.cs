using UnityEngine;
namespace CoreClash.Presentation
{
    // CC-001 W20: the one place that defines how the game looks.
    // CC-001 W24: bright mobile look ("Candy Arena"). A saturated sky backdrop, a light
    // arena tray, white cards with soft shadows, navy text, candy buttons.
    // Colour still says what a thing IS, so the same hue never means two things:
    //   neutral board   light blue-greys       active objects  the two team colours
    //   selection       amber                  threat          hazard orange
    //   result          damage red / heal green / shield sky blue (never a team colour)
    // Sizes are in arena units (540 x 900) unless noted; times are seconds.
    public static class Theme
    {
        static Color C(string hex)=>ColorUtility.TryParseHtmlString(hex,out var color)?color:Color.white;
        public static Color A(Color color,float alpha)=>new Color(color.r,color.g,color.b,alpha);

        // Teams. Colour is never the only cue. On a ball the cue is the owner pip (W21): a small
        // triangle on the ring that points the way the ball's side attacks. Launchers, zones
        // and structures keep the W20 ring pattern: P1 solid, P2 segmented.
        public static readonly Color P1=C("#2f7bff"),P2=C("#ff4f7a");
        public static Color Team(int owner)=>owner==0?P1:P2;
        // Darker team shade: button lips, text on white.
        public static Color TeamDeep(int owner)=>owner==0?C("#1c56c9"):C("#d42c5a");
        public const int P2RingSegments=8;
        public const float P2RingFill=.62f;

        // Surfaces and text (HUD). Panel = white card, PanelLight = a cell inside a card.
        public static readonly Color Background=C("#5d93ff"),BackdropTop=C("#55b9ff"),BackdropBottom=C("#9a6cf5"),Header=C("#3550c8"),
            Panel=C("#ffffff"),PanelLight=C("#eef3ff"),PanelRaised=C("#dfe8ff"),
            Edge=C("#d3dcf5"),EdgeStrong=C("#9eb0e6"),Plate=C("#ffffff"),Scrim=C("#141c44");
        public static readonly Color Text=C("#1b2550"),TextSoft=C("#3a4678"),Muted=C("#6c78a6"),Disabled=C("#a9b2d0"),Ink=C("#1a1530"),
            OnColor=C("#ffffff"),PlateText=C("#1b2550"),PlateSoft=C("#6c78a6");
        public const int FontTitle=17,FontBody=13,FontSmall=11,FontTiny=9;

        // Meaning. Select is the bright amber for rings and fills; SelectInk is its text shade on white.
        public static readonly Color Select=C("#ffb81f"),SelectInk=C("#a86400"),Threat=C("#ff8a1f"),Damage=C("#ef3b54"),Heal=C("#1fb872"),Shield=C("#35a7ff"),Info=C("#8a63ff");

        // Arena: a deep tray, a light floor, white rim.
        public static readonly Color BoardOuter=C("#5a44b8"),BoardLip=C("#7c66dd"),FloorEdge=C("#ffeccb"),FloorCentre=C("#fff9ec"),Rim=C("#ffffff"),Centre=C("#e3a13a");
        public const float ZoneFillNear=.42f,ZoneFillFar=.12f,ZonePattern=0f,ZoneEdge=.9f,ZoneLabel=.75f;
        public const float CentreRing=.7f,CentreFill=.75f,CentreLabel=0f,MidLine=0f,RimAlpha=1f;

        // Balls.
        public const float OwnerGap=.6f,SelectionRing=8f,BodyDark=.38f,BodyHighlight=.9f,ShadowAlpha=.3f;
        public const float WakeLength=64f,WakeAlpha=.3f;
        public const int WakeSteps=5;
        // W21: HP ring around the body, one segment per 5 HP (lost segments stay as a dim track).
        public const float HpRing=4.4f,HpTrack=.55f,IconSize=1.42f;
        public static readonly Color HpGood=C("#ffffff"),HpHurt=C("#ffe07a"),HpCritical=C("#ffd0d6");
        // W24 (owner decision): a ball's HP is read from its ring only; no number under the ball.
        // The exact value stays in the ball details. Set to true to bring the number plate back.
        public static readonly bool ShowHpNumber=false;
        // W24 (owner decision): the arena speaks in pictures. The acting player's zone lights up, the
        // turn number is painted in the centre, base HP is a bar on each wall; word labels on the
        // arena (turn pill, base report, Replay counter, STOP caption, state words) are off.
        public static readonly bool BoardCaptions=false;
        // W24 cartoon look: ink outline width in HUD units, hard shadow offset.
        public const float InkLine=2.5f,HardShadow=4f;
        public const float HpHurtBelow=.6f,HpCriticalBelow=.3f,PlateAlpha=.95f;

        // Statuses: one colour per kind, used by the chip, its glyph and its feedback.
        public static Color Status(StatusKind kind)
        {
            switch(kind)
            {
                case StatusKind.Fire:return C("#ff6a1f");
                case StatusKind.Ice:return C("#22c3f0");
                case StatusKind.Frozen:return C("#8fe2ff");
                case StatusKind.Frostguard:return C("#4fc4ee");
                case StatusKind.Toxin:return C("#6fcf22");
                case StatusKind.Rooted:return C("#c98a45");
                case StatusKind.Shield:return Shield;
                case StatusKind.Divine:return C("#ffd45a");
                case StatusKind.Armed:case StatusKind.Fuse:return Threat;
                case StatusKind.Jammed:return C("#b58cff");
                case StatusKind.Sticky:return C("#e0b548");
                case StatusKind.Phased:return C("#a79cff");
                case StatusKind.Veteran:case StatusKind.Ancestral:return Select;
                default:return C("#a9bccb");
            }
        }

        // Effects. Strength scales every effect's opacity; set to 0 to silence them.
        public const float EffectStrength=1f;
        public const float NumberRise=34f,ImpactFlash=.18f,ImpactRadius=30f;
        public const float ExplosionFlash=.3f,ExplosionRadius=104f,ExplosionSparks=12;
        public const float StatusPop=.32f,ShieldPop=.45f,TurnCue=1.05f,BaseFlash=.7f;
        // W24 interface motion (seconds). Short on purpose: nothing here delays input.
        public const float ScreenFade=.22f,SelectPop=.2f,ResultRise=.45f;

        // Aim.
        public const float AimUnderlay=.6f,AimPull=.45f;
    }
}
