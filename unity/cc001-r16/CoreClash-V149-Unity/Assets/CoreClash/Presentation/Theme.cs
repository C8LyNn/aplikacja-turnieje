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
        public static readonly Color P1=C("#1f7dff"),P2=C("#ff3b6b");
        public static Color Team(int owner)=>owner==0?P1:P2;
        // Darker team shade: button lips, text on white.
        public static Color TeamDeep(int owner)=>owner==0?C("#124dc4"):C("#d61c50");
        // W24 (owner decision): a cartoon look with vivid colours. Colours that come from data (ball
        // bodies, deck accents) are pushed the same way at draw time: more saturation, a touch more
        // light. Near-greys stay grey. The data itself is not changed.
        public static Color Vivid(Color color)
        {
            Color.RGBToHSV(color,out float hue,out float saturation,out float value);
            if(saturation<.16f)return color;
            var vivid=Color.HSVToRGB(hue,Mathf.Clamp01(saturation*1.28f+.12f),Mathf.Clamp01(value*1.02f+.02f));
            vivid.a=color.a;return vivid;
        }
        public const int P2RingSegments=8;
        public const float P2RingFill=.62f;

        // Surfaces and text (HUD). Panel = white card, PanelLight = a cell inside a card.
        public static readonly Color Background=C("#3f8cff"),BackdropTop=C("#1f9dff"),BackdropBottom=C("#5a2fe0"),Header=C("#2a47d6"),
            Panel=C("#ffffff"),PanelLight=C("#e8f2ff"),PanelRaised=C("#d2e4ff"),
            Edge=C("#c4d6fa"),EdgeStrong=C("#86a2f2"),Plate=C("#ffffff"),Scrim=C("#141c44");
        public static readonly Color Text=C("#1b2550"),TextSoft=C("#3a4678"),Muted=C("#6c78a6"),Disabled=C("#a9b2d0"),Ink=C("#1a1530"),
            OnColor=C("#ffffff"),PlateText=C("#1b2550"),PlateSoft=C("#6c78a6");
        public const int FontTitle=17,FontBody=13,FontSmall=11,FontTiny=9;

        // Meaning. Select is the bright amber for rings and fills; SelectInk is its text shade on white.
        public static readonly Color Select=C("#ffc400"),SelectInk=C("#b36a00"),Threat=C("#ff7a00"),Damage=C("#ff2d55"),Heal=C("#00c46c"),Shield=C("#1ea7ff"),Info=C("#7c4dff");

        // Arena: a deep tray, a light floor, white rim.
        public static readonly Color BoardOuter=C("#4326c9"),BoardLip=C("#6f52ff"),FloorEdge=C("#ffdb78"),FloorCentre=C("#fff1b8"),Rim=C("#ffffff"),Centre=C("#ff9500");
        public const float ZoneFillNear=.7f,ZoneFillFar=.42f,ZonePattern=0f,ZoneEdge=.9f,ZoneLabel=.75f;
        // W24 (owner direction: look at how similar games look): the board is a place made of
        // something - a pitch with mown stripes, painted end zones, white markings, light in the
        // middle and the shadow of its walls - not a flat sheet. An ArenaLook is one such place:
        // Floor is its surface, Line its painted markings, Ring the centre circle; Zone is how much
        // of a home zone is the team's colour, Stripe the strength of the mown bands, Light the glow
        // in the middle, Shade the shadow of the walls, CentreFill the lighter disc in the centre.
        // F6 switches between them; the choice is kept in PlayerPrefs "cc.arena".
        public sealed class ArenaLook{public string Id;public Color Floor,Line,Ring;public float Zone,Stripe,Light,Shade,CentreFill;}
        public static readonly ArenaLook[] Arenas=
        {
            new ArenaLook{Id="court",Floor=C("#f8d78d"),Line=Color.white,Ring=Color.white,Zone=.88f,Stripe=.035f,Light=.16f,Shade=.3f,CentreFill=.2f},
            new ArenaLook{Id="night",Floor=C("#3b2fb5"),Line=C("#c4d0ff"),Ring=C("#ffd21e"),Zone=.8f,Stripe=.045f,Light=.2f,Shade=.42f,CentreFill=.08f},
            new ArenaLook{Id="turf",Floor=C("#35c463"),Line=Color.white,Ring=Color.white,Zone=.9f,Stripe=.055f,Light=.14f,Shade=.34f,CentreFill=.12f},
        };
        public static ArenaLook Arena=Arenas[0];
        public static void SetArena(string id){foreach(var look in Arenas)if(look.Id==id)Arena=look;}
        public static string NextArena()=>Arenas[(System.Array.IndexOf(Arenas,Arena)+1)%Arenas.Length].Id;
        // The rail the phone tray's cards lie on.
        public static readonly Color RailTop=C("#3d2fc4"),RailBottom=C("#231a78");
        // How much white is laid under a home zone before its team colour (less = more saturated).
        public const float ZoneWash=.36f;
        public const float CentreRing=.7f,CentreFill=.75f,CentreLabel=0f,MidLine=0f,RimAlpha=1f;

        // Balls.
        public const float OwnerGap=.6f,SelectionRing=8f,BodyDark=.38f,BodyHighlight=.9f,ShadowAlpha=.3f;
        public const float WakeLength=64f,WakeAlpha=.3f;
        public const int WakeSteps=5;
        // W21: HP ring around the body, one segment per 5 HP (lost segments stay as a dim track).
        public const float HpRing=4.6f,HpTrack=.55f,IconSize=1.58f;
        // W24 (owner direction): a ball is read at a glance and looks like a piece from a game. One
        // colour per ball - the owner's: a glossy sphere with a bold outline, lit from the upper left,
        // with a shadow on the floor. One large white symbol in its middle says what the ball is.
        // The HP runs along its edge as a gauge in a dark bezel; its colour follows the HP that is
        // left (white, then yellow when hurt, then red when critical). Nothing else is drawn on a ball.
        // Outlines are a dark tone of the owner's colour, never black. The Standard ball is
        // plain: no symbol. The ball is drawn larger than its rules radius by BallGrow
        // (presentation only). Shares are parts of the drawn radius; LabelShare is the clear face
        // inside the gauge, which the symbol is sized from.
        public const float BallGrow=5.6f,BallInk=2.3f,LabelShare=.76f,HpOuterShare=.96f,HpWidthShare=.17f;
        // Gauge colour by the share of HP that is left; the steps are HpHurtBelow and HpCriticalBelow.
        public static readonly Color GaugeGood=C("#ffffff"),GaugeHurt=C("#ffd21e"),GaugeCritical=C("#ff5533");
        public static Color Gauge(float share)=>share<HpCriticalBelow?GaugeCritical:share<HpHurtBelow?GaugeHurt:GaugeGood;
        // Same hue, different saturation and brightness: used for the coloured outlines.
        public static Color Shade(Color color,float saturation,float value)
        {
            Color.RGBToHSV(color,out float hue,out float s,out float v);
            var shade=Color.HSVToRGB(hue,Mathf.Clamp01(s*saturation),Mathf.Clamp01(v*value));
            shade.a=color.a;return shade;
        }
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

        // The same status colour, deep enough to carry a white symbol and a white number: the fill of
        // the chips under the balls.
        public static Color StatusFill(StatusKind kind)
        {
            Color.RGBToHSV(Status(kind),out float hue,out float saturation,out float value);
            saturation=Mathf.Max(saturation,.62f);
            var color=Color.HSVToRGB(hue,saturation,value);
            for(int i=0;i<10&&color.r*.299f+color.g*.587f+color.b*.114f>.5f;i++){value*=.93f;color=Color.HSVToRGB(hue,saturation,value);}
            return color;
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
