using System.Collections.Generic;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Input;
using UnityEngine;

namespace CoreClash.Presentation
{
    // CC-001 W20: the arena. Draw order = importance: calm floor and zones, then
    // launchers and zone effects, then ball bodies, then ball plates/chips, then
    // short event feedback, then board notes, then the aim guide on top.
    // Geometry (field, home zones, centre) is unchanged; colours and sizes come from Theme.
    public static class BoardView
    {
        const float Left = 24.3f, Right = 515.7f, Top = 16, Bottom = 884;
        const float ZoneP2Bottom = 198, ZoneP1Top = 702, CentreX = 270, CentreY = 450;
        // The centre of the match being drawn (match rule centreRadius; 112 in the reference rules).
        // Set by Render from the state, so the painted circle is the circle the rules use.
        public static float CentreRadius = CoreClash.Physics.ZoneResolver.CentreRadius;
        static int viewOwner;
        // W24: what the arena itself shows about the turn (set once per Render).
        static int actingOwner = -1, turnShown;
        static float turnSince;
        // The end-position marker is optional (HUD button or E). Default on.
        public static bool ShowStopEstimate = true;
        // Time already passed since the last simulation step, set by the app every frame.
        public static float VisualLead;
        static Texture2D stripes, dots;
        static readonly List<(BallRuntime ball,float x,float y,bool replay)> drawn=new List<(BallRuntime,float,float,bool)>();
        static readonly List<UiBox> wantedLabels=new List<UiBox>();
        static readonly List<(string text,FeedbackClass kind,int font,float age)> labelItems=new List<(string,FeedbackClass,int,float)>();

        // W24 (owner direction: "the bar is not a collider"): the walls of the rules are at y = 16 and
        // 884 and x = 24.3 and 515.7, but a base bar is 30 units thick, so it used to lie over the
        // first 14 units of the field and a ball at the wall ran under or over it. The world of the
        // rules is now drawn a little smaller, about the centre of the board, so that its walls land
        // exactly on the inner edges of the bars: what stops a ball is what is drawn. Nothing in the
        // rules moves; pointers are mapped back with the same rectangle (CoreClashApp).
        public const float FieldScale = (900 - 2 * BaseThick) / (Bottom - Top);
        public static Rect FieldBoard(Rect board)
            => new Rect(board.x + board.width * (1 - FieldScale) * .5f, board.y + board.height * (1 - FieldScale) * .5f, board.width * FieldScale, board.height * FieldScale);
        // The outside of the board's frame: from the outer edge of one wall to the other, the whole
        // height of the board.
        static float WallThick(float unit) => Draw.Line(3 * unit) + Draw.Line(2 * unit) * 2;
        static Rect Frame(Rect board)
        {
            var field = Draw.SnapRect(Box(FieldBoard(board), Left, Top, Right - Left, Bottom - Top));
            float thick = WallThick(board.width / 540);
            return Draw.SnapRect(new Rect(field.x - thick, board.y, field.width + thick * 2, board.height));
        }
        static Vector2 Point(Rect board,float x,float y)
        {
            var p=BoardSpace.ToView(x,y,viewOwner,board.x,board.y,board.width);
            return new Vector2(p.x,p.y);
        }
        static Rect Box(Rect board,float x,float y,float width,float height)
        {
            if(viewOwner==1)y=MatchPerspective.WorldHeight-y-height;
            return new Rect(board.x+x*board.width/540,board.y+y*board.width/540,width*board.width/540,height*board.width/540);
        }

        public static void Render(Rect rect,GameSimulation simulation,LaunchGesture aim,BallDefinition selected=null,
            FeedbackTimeline feedback=null,RemoteBallSmoother remoteVisual=null,int localOwner=0,int highlightBallId=0)
        {
            int previousViewOwner=viewOwner;viewOwner=localOwner==1?1:0;
            {
                var turnState=simulation.State;int acting=turnState.phase==MatchPhase.Aiming?turnState.turn:-1;
                if(acting!=actingOwner||turnState.turnNumber!=turnShown){actingOwner=acting;turnShown=turnState.turnNumber;turnSince=Time.unscaledTime;}
            }
            var state = simulation.State;
            bool dragging = aim != null && aim.Active;
            float now = Time.unscaledTime;
            if (Event.current.type == EventType.Repaint) Fx.Observe(simulation, now);
            // W24: the arena is a tray lying on the backdrop; a hard hit nudges it for a moment.
            var shake = Fx.ShakeOffset(now, rect.width / 540f);
            rect = new Rect(rect.x + shake.x, rect.y + shake.y, rect.width, rect.height);
            // W24 (owner direction: "purple strips at the sides - the board is to take the whole width"):
            // there is no tray round the board. Its own frame - the two walls and the two base bars -
            // is its edge, with one hard shadow under it.
            {
                var outline = Frame(rect);
                Draw.Rect(new Rect(outline.x + Draw.Line(3), outline.y + Draw.Line(5), outline.width, outline.height), Theme.A(Theme.Ink, .42f));
            }
            Draw.BeginGroup(rect);
            var board = new Rect(0, 0, rect.width, rect.height);
            // inner: where the world of the rules is drawn (see FieldBoard). The frame uses `board`.
            var inner = FieldBoard(board);
            // Who holds the centre by two balls or more (that costs the other base HP when a turn ends).
            CentreRadius = state.centreRadius > 0 ? state.centreRadius : CoreClash.Physics.ZoneResolver.CentreRadius;
            {
                int lead = 0;
                foreach (var ball in state.balls) if (!ball.dead && !ball.banished && CoreClash.Physics.ZoneResolver.TouchesCenter(ball, CentreRadius)) lead += ball.owner == 0 ? 1 : -1;
                centreHolder = lead >= 2 ? 0 : lead <= -2 ? 1 : -1;
            }
            RenderArena(inner);

            // Clip gameplay glows and effects to the actual field, as in the V148 canvas.
            Rect field = Draw.SnapRect(Box(inner, Left, Top, Right - Left, Bottom - Top));
            var clippedBoard = new Rect(inner.x - field.x, inner.y - field.y, inner.width, inner.height);
            // W24: the base walls go down before anything that lies on the field: the launch dish is
            // built into the base's plate and sits on top of it (see RenderBaseBar, RenderLauncher).
            for (int owner = 0; owner < 2; owner++) RenderBaseBar(board, field, state, feedback, owner, board.width / 540);
            Draw.BeginGroup(field);
            var visible = BoardOverlayPlanner.Field(viewOwner, clippedBoard.x, clippedBoard.y, clippedBoard.width);
            for (int owner = 0; owner < 2; owner++) RenderLauncher(clippedBoard, state, owner, aim, selected);
            RenderZones(clippedBoard, state);
            RenderTurnSweep(clippedBoard, state, feedback, dragging);
            RenderStructures(clippedBoard, state);
            Fx.RenderUnder(clippedBoard, viewOwner, now);
            // Pass 1: bodies. Pass 2: plates and chips, so no ball hides another ball's information.
            drawn.Clear();
            foreach (var ball in state.balls)
                if (!ball.dead && !ball.banished)
                {
                    float renderX=ball.x,renderY=ball.y;
                    // W24: the simulation advances in fixed 1/120 s steps, a frame rarely lands on one.
                    // Draw a moving ball where it is at this frame's time (view only, state untouched).
                    if(remoteVisual==null&&state.phase==MatchPhase.Moving&&ball.moving&&VisualLead>0)
                    {
                        renderX=Mathf.Clamp(ball.x+ball.vx*VisualLead,Left+ball.radius,Right-ball.radius);
                        renderY=Mathf.Clamp(ball.y+ball.vy*VisualLead,Top+ball.radius,Bottom-ball.radius);
                    }
                    if(state.phase==MatchPhase.Moving&&remoteVisual!=null&&remoteVisual.TryGetPosition(ball.id,Time.unscaledTime,out var px,out var py)){renderX=px;renderY=py;}
                    bool replay=ReplayAffordance.Advertise(simulation,ball);
                    RenderThreat(clippedBoard,ball,renderX,renderY);
                    BallView.Render(clippedBoard,ball,simulation.Catalog.Ball(ball.type),replay,renderX,renderY,viewOwner,ball.id==highlightBallId);
                    drawn.Add((ball,renderX,renderY,replay));
                }
            foreach (var item in drawn) BallView.RenderBadges(clippedBoard,item.ball,item.replay,item.x,item.y,viewOwner,visible);
            Fx.RenderOver(clippedBoard, viewOwner, now);
            RenderEvents(clippedBoard,feedback,dragging);
            // W19-05: banner first, then counter; both avoid balls, chips, launchers, structures and each other.
            marginNotes.Clear();var keepOut=BoardKeepOuts(clippedBoard,state);
            RenderBaseReport(clippedBoard,simulation,aim,keepOut);
            RenderReplayCounter(clippedBoard,simulation,aim,keepOut);
            RenderTurnCue(clippedBoard,state,feedback,dragging,keepOut);
            if (state.phase == MatchPhase.Aiming && dragging) RenderAim(clippedBoard, state, aim,selected,simulation.Catalog);
            Draw.EndGroup();

            RenderWalls(board, field);
            RenderPressureMarks(board, field, state, board.width / 540);
            RenderMarginNotes(board);
            Draw.EndGroup();
            viewOwner=previousViewOwner;
        }

        // W24: the show on a ball card. A cropped, quiet view of another simulation: floor, zones,
        // structures, balls with their plates, and effects. No launch prompts, notes, turn cue or
        // aim guide. Its effects live in their own Fx.Stage, so the match on the board is untouched.
        // worldTop..worldBottom is the filmed part of the board; lead is the time since the last step.
        public static float StageHeight(float width,float worldTop,float worldBottom)=>Mathf.Round(width*(worldBottom-worldTop)/(Right-Left));
        public static void RenderStage(Rect rect,GameSimulation simulation,FeedbackTimeline feedback,Fx.Stage effects,float worldTop,float worldBottom,float lead)
        {
            if(simulation==null||effects==null||rect.width<=0||rect.height<=0)return;
            int previousViewOwner=viewOwner,previousActing=actingOwner,previousTurn=turnShown;float previousSince=turnSince;
            var state=simulation.State;float now=Time.unscaledTime,scale=rect.width/(Right-Left);
            viewOwner=0;actingOwner=-1;turnShown=state.turnNumber;centreHolder=-1;CentreRadius=state.centreRadius>0?state.centreRadius:CoreClash.Physics.ZoneResolver.CentreRadius;
            effects.Swap();
            try
            {
                if(Event.current.type==EventType.Repaint)Fx.Observe(simulation,now);
                Draw.BeginGroup(rect);
                var board=new Rect(-Left*scale,-worldTop*scale,540*scale,900*scale);
                RenderArena(board);
                Rect field=Box(board,Left,Top,Right-Left,Bottom-Top);
                Draw.BeginGroup(field);
                var clippedBoard=new Rect(board.x-field.x,board.y-field.y,board.width,board.height);
                var visible=BoardOverlayPlanner.Field(viewOwner,clippedBoard.x,clippedBoard.y,clippedBoard.width);
                RenderZones(clippedBoard,state);
                RenderStructures(clippedBoard,state);
                Fx.RenderUnder(clippedBoard,viewOwner,now);
                drawn.Clear();
                foreach(var ball in state.balls)
                    if(!ball.dead&&!ball.banished)
                    {
                        float x=ball.x,y=ball.y;
                        if(state.phase==MatchPhase.Moving&&ball.moving&&lead>0)
                        {
                            x=Mathf.Clamp(ball.x+ball.vx*lead,Left+ball.radius,Right-ball.radius);
                            y=Mathf.Clamp(ball.y+ball.vy*lead,Top+ball.radius,Bottom-ball.radius);
                        }
                        RenderThreat(clippedBoard,ball,x,y);
                        BallView.Render(clippedBoard,ball,simulation.Catalog.Ball(ball.type),false,x,y,viewOwner,false);
                        drawn.Add((ball,x,y,false));
                    }
                foreach(var item in drawn)BallView.RenderBadges(clippedBoard,item.ball,false,item.x,item.y,viewOwner,visible);
                Fx.RenderOver(clippedBoard,viewOwner,now);
                RenderEvents(clippedBoard,feedback,false);
                Draw.EndGroup();
                RenderFrame(board,field,state,feedback);
                Draw.EndGroup();
            }
            finally
            {
                effects.Swap();
                viewOwner=previousViewOwner;actingOwner=previousActing;turnShown=previousTurn;turnSince=previousSince;
            }
        }

        // W24 (owner direction: look at how similar games look): the floor is a pitch. From the bottom
        // up: its surface, the two painted end zones, mown stripes across all of it, light in the
        // middle, the painted centre circle with the turn number, and the shadow of the walls.
        const int Bands = 10;
        // The player who holds the centre (-1: nobody). Set by Render; a demo stage shows none.
        static int centreHolder = -1;
        static void RenderArena(Rect board)
        {
            var look = Theme.Arena;
            Rect field = Box(board, Left, Top, Right - Left, Bottom - Top);
            float scale = board.width / 540;
            Draw.Rect(field, look.Floor);
            RenderHomeZone(board, 1, Top, ZoneP2Bottom);
            RenderHomeZone(board, 0, ZoneP1Top, Bottom);
            float band = (Bottom - Top) / Bands;
            for (int i = 0; i < Bands; i++)
                Draw.Rect(Box(board, Left, Top + i * band, Right - Left, band), i % 2 == 0 ? new Color(1, 1, 1, look.Stripe) : new Color(0, 0, 0, look.Stripe));
            Draw.Glow(new Rect(field.x, field.y + field.height * .1f, field.width, field.height * .8f), new Color(1, 1, 1, look.Light));

            // Centre: neutral (never a team colour). The ring is the rules' centre radius.
            Vector2 centre = Point(board, CentreX, CentreY);
            Color mark = Theme.A(look.Line, .55f);
            Line(board, Left, CentreY, CentreX - CentreRadius, CentreY, mark, 3f);
            Line(board, CentreX + CentreRadius, CentreY, Right, CentreY, mark, 3f);
            Draw.Circle(Box(board, CentreX - CentreRadius, CentreY - CentreRadius, CentreRadius * 2, CentreRadius * 2), Theme.A(Color.white, look.CentreFill));
            // On a light floor white paint is weak: the circle gets a darker edge of the floor's own
            // colour, and the turn number is painted in that darker tone instead of white.
            bool lightFloor = look.Floor.r * .299f + look.Floor.g * .587f + look.Floor.b * .114f > .6f;
            Color floorDeep = Theme.Shade(look.Floor, 1.3f, .68f);
            if (lightFloor) Draw.Ring(centre, (CentreRadius + 2f) * scale, Theme.A(floorDeep, .8f), Mathf.Max(3.6f, 8.5f * scale));
            // The ring takes the colour of the player who holds the centre by two balls or more.
            Draw.Ring(centre, CentreRadius * scale, centreHolder < 0 ? look.Ring : Draw.Owner(centreHolder), Mathf.Max(2.2f, (centreHolder < 0 ? 4.5f : 7f) * scale));
            // The turn number, painted on the floor like a court marking.
            if (turnShown > 0) Draw.Text(new Rect(centre.x - 100 * scale, centre.y - 60 * scale, 200 * scale, 120 * scale), turnShown.ToString(), Mathf.Max(20, Mathf.RoundToInt(78 * scale)), lightFloor ? Theme.A(floorDeep, .85f) : Theme.A(look.Ring, .5f), TextAnchor.MiddleCenter, true);
            int font = Mathf.Max(8, Mathf.RoundToInt(10 * scale));
            if (Theme.CentreLabel > 0) Draw.Text(new Rect(centre.x - 100 * scale, centre.y + (CentreRadius + 5) * scale, 200 * scale, font + 8), Lang.T("CENTRE","CENTRUM"), font,
                Theme.A(look.Ring, Theme.CentreLabel), TextAnchor.MiddleCenter, true);

            // The walls throw a shadow on the floor: a broad soft one and a short darker one.
            float reach = Mathf.Max(8, 26 * scale), wide = Mathf.Max(24, 86 * scale);
            Color near = new Color(.07f, .04f, .23f, look.Shade), far = new Color(.07f, .04f, .23f, look.Shade * .45f);
            Draw.EdgeShade(new Rect(field.x, field.y, wide, field.height), far, 0);
            Draw.EdgeShade(new Rect(field.xMax - wide, field.y, wide, field.height), far, 1);
            Draw.EdgeShade(new Rect(field.x, field.y, field.width, wide), far, 2);
            Draw.EdgeShade(new Rect(field.x, field.yMax - wide, field.width, wide), far, 3);
            Draw.EdgeShade(new Rect(field.x, field.y, reach, field.height), near, 0);
            Draw.EdgeShade(new Rect(field.xMax - reach, field.y, reach, field.height), near, 1);
            Draw.EdgeShade(new Rect(field.x, field.y, field.width, reach), near, 2);
            Draw.EdgeShade(new Rect(field.x, field.yMax - reach, field.width, reach), near, 3);
        }

        // Home zone: the floor painted in the team's colour, deeper towards the base wall, with a
        // painted boundary line. The acting player's zone is lit.
        static void RenderHomeZone(Rect board, int owner, float top, float bottom)
        {
            Color team = Draw.Owner(owner);
            var look = Theme.Arena;
            float scale = board.width / 540;
            Rect zone = Box(board, Left, top, Right - Left, bottom - top);
            bool baseAtViewTop = BoardOverlayPlanner.AtViewTop(owner, viewOwner);
            Draw.Rect(zone, Color.Lerp(look.Floor, team, look.Zone));
            Color deep = Theme.A(Theme.TeamDeep(owner), .42f), none = Theme.A(Theme.TeamDeep(owner), 0f);
            Draw.VGradient(zone, baseAtViewTop ? deep : none, baseAtViewTop ? none : deep);
            // W24: "your turn" without words. The acting player's zone lights up (a quick flash when the
            // turn starts, then a calm breathing glow) and its boundary becomes a bright bar; the
            // waiting player's zone sits a little darker.
            bool acting = actingOwner == owner;
            if (acting)
            {
                float since = Time.unscaledTime - turnSince, flashIn = Fx.ReducedMotion ? 0 : Mathf.Clamp01(1 - since / .5f);
                float breathe = Fx.ReducedMotion ? .5f : .5f + .5f * Mathf.Sin(Time.unscaledTime * 3.2f);
                Draw.Rect(zone, new Color(1, 1, 1, .1f + .07f * breathe + .4f * flashIn));
            }
            else if (actingOwner >= 0) Draw.Rect(zone, new Color(.06f, .03f, .22f, .16f));
            Draw.Tile(zone, Pattern(owner == 0), Mathf.Max(20, 30 * scale), Theme.A(team, Theme.ZonePattern));
            float edge = owner == 0 ? top : bottom;
            Line(board, Left, edge, Right, edge, Theme.A(look.Line, acting ? 1f : .85f), acting ? 7f : 4.5f);
            Vector2 corner = Point(board, Left, edge);
            int font = Mathf.Max(8, Mathf.RoundToInt(9 * scale));
            float height = font + 6;
            var label = new Rect(corner.x + 7 * scale, baseAtViewTop ? corner.y - 3 * scale - height : corner.y + 3 * scale, Mathf.Max(96, 150 * scale), height);
            if (Theme.ZonePattern > 0) Draw.Text(label, Lang.T("P","G") + (owner + 1) + Lang.T(" HOME ZONE"," STREFA DOMOWA"), font, Theme.A(Theme.TeamDeep(owner), Theme.ZoneLabel), TextAnchor.MiddleLeft, true);
        }

        static Texture2D Pattern(bool diagonal)
        {
            if (diagonal && stripes != null) return stripes;
            if (!diagonal && dots != null) return dots;
            const int size = 32;
            var texture = new Texture2D(size, size, TextureFormat.RGBA32, false)
            {
                name = "Core Clash zone pattern", filterMode = FilterMode.Bilinear,
                wrapMode = TextureWrapMode.Repeat, hideFlags = HideFlags.HideAndDontSave
            };
            var pixels = new Color[size * size];
            for (int y = 0; y < size; y++)
            for (int x = 0; x < size; x++)
            {
                float alpha;
                if (diagonal) alpha = Mathf.Clamp01(2.5f - Mathf.Abs((x + y) % 16 - 8));
                else { float dx = x % 16 - 7.5f, dy = y % 16 - 7.5f; alpha = Mathf.Clamp01(3f - Mathf.Sqrt(dx * dx + dy * dy)); }
                pixels[y * size + x] = new Color(1, 1, 1, alpha);
            }
            texture.SetPixels(pixels);
            texture.Apply(false, true);
            if (diagonal) stripes = texture; else dots = texture;
            return texture;
        }

        // Where a ball stands when it is put on its launcher: on the launcher of the rules, or
        // against the wall behind it when it is too large for that (the first step of the rules
        // moves it there).
        static float LaunchY(int owner, float ballRadius) => owner == 0 ? Mathf.Min(853, Bottom - ballRadius) : Mathf.Max(47, Top + ballRadius);
        static void RenderLauncher(Rect board, GameState state, int owner, LaunchGesture aim, BallDefinition selected)
        {
            float scale = board.width / 540;
            float y = owner == 0 ? 853 : 47;
            Color team = Draw.Owner(owner), deep = Theme.TeamDeep(owner);
            bool active = state.turn == owner && state.phase == MatchPhase.Aiming;
            var center = Point(board, 270, y);
            // W24 (owner direction: what is drawn is what collides, and "this still has to be put
            // right"): the dome is the launch protection of the rules - the circle of 61 units round
            // the launcher that every ball bounces off - in the colour of the base it grows out of
            // (RenderBaseBar opens the plate under it). One outline, one dish, nothing round it.
            // The field's clip cuts it at the wall.
            float body = DomeRadius * scale, outline = Draw.Line(2.5f * scale), dish = (DomeRadius - 9) * scale;
            Draw.Circle(new Rect(center.x - body, center.y - body, body * 2, body * 2), Theme.Ink);
            Draw.Circle(new Rect(center.x - body + outline, center.y - body + outline, (body - outline) * 2, (body - outline) * 2), team);
            Draw.Circle(new Rect(center.x - dish, center.y - dish, dish * 2, dish * 2), Color.Lerp(Color.white, team, active ? .14f : .5f));
            Draw.Ring(center, dish, Theme.A(deep, active ? .95f : .7f), Mathf.Max(1.5f, 2.4f * scale), owner == 1 ? Theme.P2RingSegments : 0, Theme.P2RingFill);
            if (!active) return;
            bool up = !BoardOverlayPlanner.AtViewTop(owner, viewOwner);
            for (int i = 0; i < 2; i++)
            {
                float travel = Fx.ReducedMotion ? 0 : Mathf.Repeat(Time.unscaledTime * 1.6f + i * .5f, 1);
                float size = 20 * scale, offset = (DomeRadius + 16 + i * 15 + travel * 6) * scale * (up ? -1 : 1);
                Glyphs.Paint(new Rect(center.x - size / 2, center.y + offset - size / 2, size, size), up ? Fx.Chevron : "+L -.7 -.45 0 .45 .34;+L 0 .45 .7 -.45 .34", Theme.A(team, .8f - i * .35f));
            }
            bool aimingHere = aim == null || !aim.Active || (Mathf.Abs(aim.OriginX - 270) < .1f && Mathf.Abs(aim.OriginY - y) < .1f);
            if (selected != null && aimingHere)
            {
                float rules = Mathf.Max(9, selected.radius * Mathf.Max(.5f, state.ballScale)), radius = rules + Theme.BallGrow, stand = LaunchY(owner, rules);
                BallView.Preview(Box(board, 270 - radius, stand - radius, radius * 2, radius * 2), selected, owner, true);
            }
        }

        const string ArrowUp = "+L -.7 .45 0 -.45 .36;+L 0 -.45 .7 .45 .36", ArrowDown = "+L -.7 -.45 0 .45 .36;+L 0 .45 .7 -.45 .36";
        const string ArrowLeft = "+L .45 -.7 -.45 0 .36;+L -.45 0 .45 .7 .36", ArrowRight = "+L -.45 -.7 .45 0 .36;+L .45 0 -.45 .7 .36";
        static void RenderZones(Rect board, GameState state)
        {
            float scale = board.width / 540;
            foreach (var zone in state.zones)
            {
                if (zone.dead) continue;
                bool fire = zone.kind == "embertrap" || zone.kind == "furnaceFire" || zone.kind.Contains("fire");
                bool ice = zone.kind == "frosttrap" || zone.kind.Contains("ice");
                bool toxin = zone.kind == "sporetrap" || zone.kind == "blight";
                Color color = fire ? Theme.Status(StatusKind.Fire) : ice ? Theme.Status(StatusKind.Ice) : toxin ? Theme.Status(StatusKind.Toxin)
                    : zone.kind == "consecrated" ? new Color(1, .76f, .1f)
                    : zone.kind == "web" ? new Color(.28f, .72f, .2f)
                    : zone.kind == "shocktrap" ? new Color(1f, .84f, .1f)
                    : zone.kind == "gravitymine" ? new Color(.36f, .42f, .96f)
                    : zone.kind == "portal" ? new Color(.6f, .4f, 1)
                    : zone.kind == "blackHole" ? new Color(.45f, .2f, .8f) : new Color(.42f, .56f, .8f);
                bool dense = zone.kind == "portal" || zone.kind == "blackHole";
                var center = Point(board, zone.x, zone.y);
                if (fire || ice || toxin)
                {
                    // W24 (owner direction: "an ice field is to be icy, poison poison, fire fire"): an
                    // element's field is a patch of that element - its own colours, a solid edge, and
                    // its symbol strewn over it (a still pattern, the same every frame).
                    float reach = zone.radius * scale;
                    var patch = new Rect(center.x - reach, center.y - reach, reach * 2, reach * 2);
                    StatusKind kind = fire ? StatusKind.Fire : ice ? StatusKind.Ice : StatusKind.Toxin;
                    Color pale = fire ? new Color(1f, .86f, .25f) : ice ? new Color(.92f, .98f, 1f) : new Color(.9f, .72f, 1f);
                    Color deep = Color.Lerp(color, Theme.Ink, fire ? .1f : ice ? .2f : .3f);
                    // The fill is light: a field must not hide the board, the balls or another field under it.
                    Draw.Circle(patch, Theme.A(color, ice ? .34f : .3f));
                    Draw.Circle(Draw.Grow(patch, -reach * .32f), Theme.A(pale, ice ? .2f : .15f));
                    Draw.Ring(center, reach, Theme.A(deep, .92f), Mathf.Max(2f, 3.4f * scale));
                    Draw.Ring(center, reach - Mathf.Max(2f, 3.4f * scale), Theme.A(pale, .55f), Mathf.Max(1f, 1.6f * scale));
                    Strew(board, zone, scale, kind, Theme.A(ice ? Color.white : fire ? Color.Lerp(pale, color, .35f) : deep, ice ? .85f : .7f));
                }
                else
                {
                Draw.Circle(Box(board, zone.x - zone.radius, zone.y - zone.radius, zone.radius * 2, zone.radius * 2), Theme.A(color, dense ? .6f : .26f));
                Draw.Ring(center, zone.radius * scale, Theme.A(Color.Lerp(color, Theme.Ink, .15f), dense ? .95f : .8f), Mathf.Max(1.5f, 2.4f * scale), dense ? 0 : 24, .62f);
                }
                if (zone.kind == "gravitymine")
                {
                    // The magnet mine's field: four arrowheads on its rim point at the mine.
                    float mark = Mathf.Max(11, 17 * scale), rim = zone.radius * scale * .74f; Color tint = Theme.A(Color.Lerp(color, Theme.Ink, .25f), .85f);
                    Glyphs.Paint(new Rect(center.x - mark / 2, center.y - rim - mark / 2, mark, mark), ArrowDown, tint);
                    Glyphs.Paint(new Rect(center.x - mark / 2, center.y + rim - mark / 2, mark, mark), ArrowUp, tint);
                    Glyphs.Paint(new Rect(center.x - rim - mark / 2, center.y - mark / 2, mark, mark), ArrowRight, tint);
                    Glyphs.Paint(new Rect(center.x + rim - mark / 2, center.y - mark / 2, mark, mark), ArrowLeft, tint);
                }
                if (dense && !Fx.ReducedMotion) Draw.Ring(center, zone.radius * scale * (.55f + .2f * Mathf.Sin(Time.unscaledTime * 3 + zone.id)), Theme.A(Color.white, .5f), Mathf.Max(1, 1.6f * scale), 6, .45f);
                if (dense)
                    Draw.Circle(Box(board, zone.x - zone.radius * .68f, zone.y - zone.radius * .68f, zone.radius * 1.36f, zone.radius * 1.36f), new Color(.14f, .08f, .32f));
                if (zone.kind == "web")
                {
                    // A shoot of the Vine: three leaves round a bud, lying on the floor in the owner's ring.
                    float sprig = Mathf.Max(16, 30 * scale); var box = new Rect(center.x - sprig / 2, center.y - sprig / 2, sprig, sprig);
                    Draw.Ring(center, (zone.radius + 3) * scale, Theme.A(Draw.Owner(zone.owner), .85f), Mathf.Max(1, 1.5f * scale), zone.owner == 1 ? Theme.P2RingSegments * 2 : 0, Theme.P2RingFill);
                    Glyphs.PaintOutline(box, BallIcons.Shoot, Theme.Shade(color, 1.1f, .3f));
                    Glyphs.Paint(box, BallIcons.Shoot, Color.Lerp(color, Color.white, .25f));
                }
                if(zone.kind=="embertrap"||zone.kind=="frosttrap"||zone.kind=="sporetrap"||zone.kind=="shocktrap")
                {
                    // Trap: the owner's ring pattern outside, the element symbol inside.
                    Draw.Ring(center,(zone.radius+3)*scale,Theme.A(Draw.Owner(zone.owner),.85f),Mathf.Max(1,1.5f*scale),zone.owner==1?Theme.P2RingSegments*2:0,Theme.P2RingFill);
                    float glyph=Mathf.Max(10,15*scale);
                    Draw.Circle(new Rect(center.x-glyph*.8f,center.y-glyph*.8f,glyph*1.6f,glyph*1.6f),Theme.Ink);
                    if(zone.kind=="shocktrap")Glyphs.Paint(new Rect(center.x-glyph/2,center.y-glyph/2,glyph,glyph),"+P .34 -.98 -.56 .16 .1 .16;+P -.1 -.16 .56 -.16 -.34 .98",color);
                    else Glyphs.Paint(new Rect(center.x-glyph/2,center.y-glyph/2,glyph,glyph),fire?StatusKind.Fire:ice?StatusKind.Ice:StatusKind.Toxin,color);
                }
            }
        }
        // The element's symbol strewn over its field: a still pattern made from the field's id.
        static void Strew(Rect board, ZoneRuntime zone, float scale, StatusKind kind, Color tint)
        {
            uint seed = (uint)zone.id * 2654435761u | 1u;
            int count = Mathf.Clamp(Mathf.RoundToInt(zone.radius * zone.radius / 1500f), 4, 10);
            for (int i = 0; i < count; i++)
            {
                seed ^= seed << 13; seed ^= seed >> 17; seed ^= seed << 5;
                float angle = (seed & 1023) / 1023f * Mathf.PI * 2 + i * 2.39996f;
                seed ^= seed << 13; seed ^= seed >> 17; seed ^= seed << 5;
                // The first one stands in the middle; the rest fill the field evenly out to its edge.
                float away = i == 0 ? 0 : Mathf.Sqrt((i + .35f) / count) * .8f * zone.radius;
                float size = Mathf.Max(9, (14 + (seed & 7)) * scale) * (i == 0 ? 1.35f : 1);
                var at = Point(board, zone.x + Mathf.Cos(angle) * away, zone.y + Mathf.Sin(angle) * away);
                Glyphs.Paint(new Rect(at.x - size * .5f, at.y - size * .5f, size, size), kind, tint);
            }
        }

        static void RenderStructures(Rect board, GameState state)
        {
            float scale = board.width / 540;
            foreach (var ball in state.balls)
            {
                if (ball.dead || ball.linkedTargetId <= 0) continue;
                var target = state.balls.FirstOrDefault(candidate => candidate.id == ball.linkedTargetId && !candidate.dead);
                if (target != null) Draw.Line(Point(board, ball.x, ball.y), Point(board, target.x, target.y), new Color(.65f, .9f, .3f, .6f), 2);
            }
            foreach (var structure in state.structures)
            {
                if (structure.dead) continue;
                if (structure.kind == StructureSystem.Obstacle)
                {
                    // A map's obstacle: a post of the same make as the walls - ink edge, light rim -
                    // with a dark top. Its outer edge is what the balls bounce off.
                    var post = Point(board, structure.x, structure.y);
                    float full = structure.radius * scale, edge = Draw.Line(2 * scale), rim = Draw.Line(3 * scale);
                    Draw.Circle(new Rect(post.x - full, post.y - full, full * 2, full * 2), Theme.Ink);
                    Draw.Circle(new Rect(post.x - full + edge, post.y - full + edge, (full - edge) * 2, (full - edge) * 2), Theme.Rim);
                    float top = Mathf.Max(1, full - edge - rim);
                    Draw.Circle(new Rect(post.x - top, post.y - top, top * 2, top * 2), Theme.Ink);
                    Draw.Circle(new Rect(post.x - top + edge, post.y - top + edge, Mathf.Max(0, top - edge) * 2, Mathf.Max(0, top - edge) * 2), Theme.Shade(Theme.BoardOuter, 1.05f, .5f));
                    // A block that stands on the middle of the board covers the turn number painted
                    // there, so it carries the number itself.
                    if (turnShown > 0 && (structure.x - CentreX) * (structure.x - CentreX) + (structure.y - CentreY) * (structure.y - CentreY) < structure.radius * structure.radius)
                        Draw.Text(new Rect(post.x - full, post.y - full, full * 2, full * 2), turnShown.ToString(), Mathf.Max(12, Mathf.RoundToInt(structure.radius * 1.05f * scale)), new Color(1, 1, 1, .82f), TextAnchor.MiddleCenter, true);
                    continue;
                }
                Color team = Draw.Owner(structure.owner);
                float radius = structure.radius;
                var center = Point(board, structure.x, structure.y);
                Draw.Circle(Box(board, structure.x - radius, structure.y - radius, radius * 2, radius * 2), Theme.Ink);
                Draw.Circle(Box(board, structure.x - radius + 2, structure.y - radius + 2, radius * 2 - 4, radius * 2 - 4), Color.white);
                Draw.Ring(center, radius * scale, Theme.A(team, .95f), Mathf.Max(1.5f, 2.4f * scale), structure.owner == 1 ? Theme.P2RingSegments : 0, Theme.P2RingFill);
                if(structure.kind=="bumper")Draw.Ring(center,(radius-5)*scale,new Color(1,.46f,.78f,.85f),Mathf.Max(1,scale));
                string symbol=structure.kind=="bumper"?"B":structure.kind=="engineerWall"?"E":"W";
                Draw.Text(Box(board, structure.x-radius,structure.y-radius+1,radius*2,12), symbol,
                    Mathf.Max(7,Mathf.RoundToInt(8*scale)),Theme.Muted,TextAnchor.MiddleCenter,true);
                Draw.Text(Box(board, structure.x-radius,structure.y-9,radius*2,18), structure.hp+"/"+structure.maxHp,
                    Mathf.Max(7,Mathf.RoundToInt(8*scale)),Theme.Text,TextAnchor.MiddleCenter,true);
            }
        }

        // Armed Mine: a broken hazard ring that breathes. Time Bomb: a steady hazard ring;
        // its countdown is the number on the ball's threat badge. Both read real ball state.
        static void RenderThreat(Rect board, BallRuntime ball, float x, float y)
        {
            if (!ball.mineArmed && !ball.timeBombArmed) return;
            float scale = board.width / 540;
            var center = Point(board, x, y);
            // W24 (minimal): one thin still ring - broken for an armed Mine, whole for a ticking Time Bomb.
            float reach = (ball.radius + Theme.BallGrow + 11) * scale;
            if (ball.mineArmed) Draw.Ring(center, reach, Theme.A(Theme.Threat, .95f), Mathf.Max(1.5f, 2.2f * scale), 12, .5f);
            else Draw.Ring(center, reach, Theme.A(Theme.Threat, .9f), Mathf.Max(1.5f, 2 * scale));
        }

        // Turn change, from the real TURN event: a sweep line from the new player's zone edge
        // (under the balls) and a short pill in a free slot (never over a ball, its plates,
        // a launcher or another board note). Both end at once when a drag starts.
        static bool TurnCue(GameState state, FeedbackTimeline feedback, bool dragging, out float alpha, out float progress, out int owner)
        {
            alpha = progress = 0; owner = 0;
            if (feedback == null || feedback.TurnBorn < 0 || dragging || state.phase == MatchPhase.Over) return false;
            float age = Time.unscaledTime - feedback.TurnBorn;
            if (age < 0 || age >= Theme.TurnCue) return false;
            progress = age / Theme.TurnCue;
            alpha = Mathf.Clamp01(progress * 6) * Mathf.Clamp01((1 - progress) * 3) * Theme.EffectStrength;
            owner = feedback.TurnOwner == 1 ? 1 : 0;
            return alpha > 0;
        }
        static void RenderTurnSweep(Rect board, GameState state, FeedbackTimeline feedback, bool dragging)
        {
            if (!TurnCue(state, feedback, dragging, out float alpha, out float progress, out int owner)) return;
            float edge = owner == 0 ? ZoneP1Top : ZoneP2Bottom;
            float travel = (owner == 0 ? -1 : 1) * 90 * Mathf.SmoothStep(0, 1, progress);
            Line(board, Left, edge + travel, Right, edge + travel, Alpha(Draw.Owner(owner), alpha * .7f), 5);
        }
        static void RenderTurnCue(Rect board, GameState state, FeedbackTimeline feedback, bool dragging, List<UiBox> avoid)
        {
            if (!Theme.BoardCaptions) return;
            if (!TurnCue(state, feedback, dragging, out float alpha, out _, out int owner)) return;
            float scale = board.width / 540;
            var field = BoardOverlayPlanner.Field(viewOwner, board.x, board.y, board.width);
            Color team = Draw.Owner(owner);
            string text = Lang.T("PLAYER ","GRACZ ") + (owner + 1) + Lang.T(" · TURN "," · TURA ") + feedback.TurnNumber;
            int font = Mathf.Max(10, Mathf.RoundToInt(14 * scale));
            float width = Mathf.Min(field.width - 16, text.Length * font * .66f + 22), height = font + 12;
            // Rows from that player's zone edge toward the centre; centre first, then the sides.
            bool top = BoardOverlayPlanner.AtViewTop(owner, viewOwner);
            Vector2 edge = Point(board, CentreX, owner == 0 ? ZoneP1Top : ZoneP2Bottom);
            var slots = new List<AimPoint>();
            for (int row = 0; row < 16; row++)
            {
                float y = top ? edge.y + 8 * scale + row * height * .5f : edge.y - 8 * scale - height - row * height * .5f;
                foreach (float anchor in new[] { .5f, 0f, 1f }) slots.Add(new AimPoint(field.x + 8 + anchor * (field.width - 16 - width), y));
            }
            if (!BoardLabelLayout.TryPlace(field, width, height, avoid, slots, 8, out var box)) return;
            avoid.Add(box);
            var pill = RectOf(box);
            Draw.Chip(pill, Alpha(team, alpha), Alpha(Theme.Ink, .9f * alpha));
            Draw.Text(pill, text, font, Alpha(Theme.OnColor, alpha), TextAnchor.MiddleCenter, true);
        }

        static Color EffectColor(FeedbackClass kind)
        {
            switch (kind)
            {
                case FeedbackClass.Damage: case FeedbackClass.BaseDamage: return Theme.Damage;
                case FeedbackClass.Absorbed: case FeedbackClass.Shield: return Theme.Shield;
                case FeedbackClass.Heal: case FeedbackClass.Cleanse: return Theme.Heal;
                case FeedbackClass.Explosion: case FeedbackClass.Armed: case FeedbackClass.Fuse: return Theme.Threat;
                case FeedbackClass.Fire: return Theme.Status(StatusKind.Fire);
                case FeedbackClass.Ice: return Theme.Status(StatusKind.Ice);
                case FeedbackClass.Freeze: return Theme.Status(StatusKind.Frozen);
                case FeedbackClass.Toxin: return Theme.Status(StatusKind.Toxin);
                case FeedbackClass.Root: return Theme.Status(StatusKind.Rooted);
                case FeedbackClass.Defeat: case FeedbackClass.Structure: return Theme.PlateSoft;
                default: return Theme.Info;
            }
        }
        // The symbol shown inside a status label; false for events without a state symbol.
        static bool EffectGlyph(FeedbackClass kind, out StatusKind glyph)
        {
            switch (kind)
            {
                case FeedbackClass.Fire: glyph = StatusKind.Fire; return true;
                case FeedbackClass.Ice: glyph = StatusKind.Ice; return true;
                case FeedbackClass.Freeze: glyph = StatusKind.Frozen; return true;
                case FeedbackClass.Toxin: glyph = StatusKind.Toxin; return true;
                case FeedbackClass.Root: glyph = StatusKind.Rooted; return true;
                case FeedbackClass.Shield: case FeedbackClass.Absorbed: glyph = StatusKind.Shield; return true;
                case FeedbackClass.Armed: glyph = StatusKind.Armed; return true;
                case FeedbackClass.Fuse: glyph = StatusKind.Fuse; return true;
                default: glyph = StatusKind.Counter; return false;
            }
        }

        // Short feedback for real simulation events (FeedbackTimeline). Every event gets
        // a burst at its position and a label; overlapping labels are moved apart, never dropped.
        static void RenderEvents(Rect board,FeedbackTimeline feedback,bool dragging)
        {
            if(feedback==null||Theme.EffectStrength<=0)return;
            float scale=board.width/540,now=Time.unscaledTime,veil=(dragging?.35f:1f)*Theme.EffectStrength;
            var field=BoardOverlayPlanner.Field(viewOwner,board.x,board.y,board.width);
            wantedLabels.Clear();labelItems.Clear();int tallest=0;
            int first=Mathf.Max(0,feedback.Items.Count-12);
            for(int i=feedback.Items.Count-1;i>=first;i--)
            {
                var effect=feedback.Items[i];float age=now-effect.born;
                if(age<0||age>=FeedbackTimeline.Life)continue;
                var kind=FeedbackStyle.Classify(effect.kind,effect.text);
                // Base damage: the wall and the HUD flash (RenderFrame); its label sits beside the launcher.
                var origin=kind==FeedbackClass.BaseDamage?Point(board,412,effect.owner==0?850:50):Point(board,effect.x,effect.y);
                var contact=origin;
                // HP and state labels travel with their ball; the contact flash stays where it happened.
                if(FeedbackStyle.FollowsBall(kind))
                    foreach(var item in drawn)if(item.ball.id==effect.ballId){origin=Point(board,item.x,item.y);break;}
                string text=FeedbackStyle.HasLabel(kind)?FeedbackStyle.Label(effect.kind,effect.text):"";
                if(text.Length==0)continue;
                bool number=FeedbackStyle.IsNumber(kind);
                if(!number&&!Theme.BoardCaptions)continue;
                // W24 (owner direction): numbers over the balls take the eye off the collision itself.
                // They are off unless the player turns them on; the flash on a ball's HP ring already
                // shows what it lost. A base's own number stays.
                if(number&&kind!=FeedbackClass.BaseDamage&&!MatchSetup.DamageNumbers)continue;
                int font=number?Mathf.Max(12,Mathf.RoundToInt((FeedbackStyle.Amount(effect.text)>=10?20:17)*scale)):Mathf.Max(9,Mathf.RoundToInt(11*scale));
                float height=font+7,icon=EffectGlyph(kind,out _)?height-2:0;
                float width=Mathf.Min(field.width-4,text.Length*font*(number?.7f:.64f)+14+icon);
                float rise=(26+Theme.NumberRise*Mathf.Clamp01(age/FeedbackTimeline.Life))*scale;
                wantedLabels.Add(new UiBox(origin.x-width/2,origin.y-rise-height/2,width,height));
                labelItems.Add((text,kind,font,age));tallest=Mathf.Max(tallest,font);
            }
            if(wantedLabels.Count==0)return;
            var placed=FeedbackLabels.Stack(wantedLabels,field,tallest+9);
            for(int i=0;i<placed.Length;i++)
            {
                if(placed[i].width<=0)continue;
                var item=labelItems[i];
                float fade=Mathf.Clamp01((FeedbackTimeline.Life-item.age)/.4f)*Mathf.Clamp01(item.age/.08f+.3f)*veil;
                Color tint=EffectColor(item.kind);var rect=Draw.SnapOrigin(RectOf(placed[i]));
                if(FeedbackStyle.IsNumber(item.kind))
                {
                    // Damage and healing: a filled plate with the authoritative amount.
                    // A short pop on arrival, then it rises and fades.
                    float pop=Fx.ReducedMotion?1:1+.35f*Mathf.Clamp01(1-item.age/.14f);
                    var grown=new Rect(rect.center.x-rect.width*pop/2,rect.center.y-rect.height*pop/2,rect.width*pop,rect.height*pop);
                    Draw.Chip(grown,Theme.A(tint,.96f*fade),Theme.A(Theme.Ink,.92f*fade));
                    Draw.Text(new Rect(grown.x,grown.y+1,grown.width,grown.height),item.text,Mathf.RoundToInt(item.font*pop),Theme.A(Color.black,.25f*fade),TextAnchor.MiddleCenter,true);
                    Draw.Text(grown,item.text,Mathf.RoundToInt(item.font*pop),Theme.A(Color.white,fade),TextAnchor.MiddleCenter,true);
                    continue;
                }
                Draw.Chip(rect,Theme.A(Theme.Plate,.88f*fade),Theme.A(tint,.85f*fade));
                float pad=0;
                if(EffectGlyph(item.kind,out var glyph))
                {
                    float size=rect.height-4;pad=size+2;
                    Glyphs.Paint(new Rect(rect.x+4,rect.y+2,size,size),glyph,Theme.A(tint,fade));
                }
                Draw.Text(new Rect(rect.x+pad,rect.y,rect.width-pad,rect.height),item.text,item.font,Theme.A(Color.Lerp(tint,Theme.Ink,.45f),fade),TextAnchor.MiddleCenter,true);
            }
        }

        static void RenderAim(Rect board, GameState state, LaunchGesture aim,BallDefinition selected,Catalog catalog)
        {
            float scale = board.width / 540;
            Vector2 origin=Point(board,aim.OriginX,aim.OriginY);
            float clampedAimX=Mathf.Clamp(aim.AimX,Left,Right),clampedAimY=Mathf.Clamp(aim.AimY,Top,Bottom);
            Vector2 finger=Point(board,clampedAimX,clampedAimY);
            // W17-02 (#284): one pure world-space preview (AimGuide.Preview) shared
            // with the managed tests; it starts at the authoritative launcher or
            // Replay origin and uses the same direction rules as TryCommand.
            bool fromLauncher=AimGuide.IsLauncherOrigin(aim.OriginX,aim.OriginY,state.turn);
            var replay=fromLauncher?null:state.balls.FirstOrDefault(b=>!b.dead&&Mathf.Abs(b.x-aim.OriginX)<.1f&&Mathf.Abs(b.y-aim.OriginY)<.1f);
            var preview=AimGuide.Preview(aim.OriginX,aim.OriginY,aim.AimX,aim.AimY,state.turn,fromLauncher?(selected?.radius??17)*Mathf.Max(.5f,state.ballScale):(replay?.radius??17));
            if (!GameSimulation.Finite(preview.Distance)) return;
            Color team = Draw.Owner(state.turn);
            Color vector = preview.Ready ? Color.Lerp(team, Color.white, .12f) : Alpha(Color.Lerp(team, Color.white, .35f), .7f);
            // W20: every aim stroke sits on a dark edge, so it reads on both home zones.
            Color under = Alpha(Theme.Ink, Theme.AimUnderlay);
            // A ball shot again gets a ring round it; the launcher needs none (it is the dome).
            if (!fromLauncher && replay != null)
            {
                Draw.Ring(origin, (replay.radius + 5) * scale, under, Mathf.Max(2.5f, 4.2f * scale));
                Draw.Ring(origin, (replay.radius + 4) * scale, Alpha(team, .85f), Mathf.Max(1.2f, 2 * scale));
            }

            if (preview.Distance > 1)
            {
                var path=preview.Path;
                if(!preview.Valid)return;
                // Strokes start outside the origin ring, so the ball being launched stays readable.
                float clear=(fromLauncher?DomeRadius+5:(replay?.radius??17)+12)*scale;
                // W24 (owner direction: clean edges): the trajectory is one smooth arrow - a shaft with
                // round joints and a solid head, on an ink edge. The part after a bounce is paler and
                // thinner. Its points and its length are the same as before; only the stroke changed.
                float edge=Mathf.Max(1.5f,2.3f*scale),headLength=Mathf.Max(11,17*scale),headHalf=Mathf.Max(6.5f,10*scale),corner=Mathf.Max(1.2f,1.8f*scale);
                Vector2 tip=Point(board,path[path.Length-1].x,path[path.Length-1].y),last=Point(board,path[path.Length-2].x,path[path.Length-2].y);Vector2 direction=(tip-last).normalized;
                Vector2 wing = new Vector2(-direction.y, direction.x),back=tip-direction*headLength;
                Color ink=preview.Ready?Theme.Ink:Color.Lerp(Theme.Ink,vector,.4f),after=Color.Lerp(vector,Color.white,.45f);
                for(int pass=0;pass<2;pass++)
                {
                    for(int i=1;i<path.Length;i++){
                        var from=Point(board,path[i-1].x,path[i-1].y);var to=Point(board,path[i].x,path[i].y);
                        if(i==1){float reach=(to-from).magnitude;if(reach<=clear+2)continue;from+=(to-from)/reach*clear;}
                        // The shaft stops inside the head.
                        if(i==path.Length-1){float run=(to-from).magnitude;if(run<=1)continue;to-=(to-from)/run*Mathf.Min(headLength*.75f,run-1);}
                        float width=Mathf.Max(3.2f,(i==1?6.4f:4.6f)*scale);
                        Draw.Stroke(from,to,pass==0?ink:i==1?vector:after,pass==0?width+edge*2:width);
                    }
                    Draw.Triangle(tip-direction*corner,back+wing*headHalf,back-wing*headHalf,pass==0?corner+edge:corner,pass==0?ink:path.Length>2?after:vector);
                }
                for(int i=1;i<path.Length-1;i++)Draw.Ring(Point(board,path[i].x,path[i].y),6*scale,Alpha(vector,.9f),Mathf.Max(1,1.4f*scale));
                float pull=(finger-origin).magnitude;
                if(pull>clear+4)Draw.Stroke(origin+(finger-origin)/pull*clear,finger,Alpha(team,Theme.AimPull),Mathf.Max(1.2f,1.6f*scale),Mathf.Max(3,4*scale),Mathf.Max(4,6*scale));
                // The estimate is drawn from the end of the arrow on, not over it.
                float arrow=0;for(int i=1;i<path.Length;i++)arrow+=(Point(board,path[i].x,path[i].y)-Point(board,path[i-1].x,path[i-1].y)).magnitude;
                if(preview.Ready&&ShowStopEstimate)RenderStopEstimate(board,state,aim,selected,replay,catalog,vector,scale,arrow+edge+Mathf.Max(4,6*scale));
            }
            Draw.Ring(finger, 11 * scale, under, Mathf.Max(2.5f, 3.8f * scale));
            Draw.Ring(finger, 10 * scale, Alpha(team, .9f), Mathf.Max(1.2f, 1.8f * scale));
            Draw.Circle(new Rect(finger.x - 3f * scale, finger.y - 3f * scale, 6 * scale, 6 * scale), Color.white);

            // A10-approved W10 presentation: trajectory length/tint is the only board power cue.
            // Readiness wording lives in MatchView so the board remains unobscured.
        }

        // W18-03 (#288): why each base lost HP last turn (BaseDamageTracker reads
        // only authoritative events). Shown from the turn end until the next launch.
        // W19-05: placed in the first free slot from the damaged base's edge inward
        // (never over a ball, its chips, a launcher or a structure), hidden while a
        // drag is active; a one-line form and then the outer frame are fallbacks.
        static BaseDamageTracker baseReport;
        static GameSimulation baseReportSimulation;
        static readonly List<(bool top,string text,Color color)> marginNotes=new List<(bool,string,Color)>();
        static List<UiBox> BoardKeepOuts(Rect board,GameState state)=>BoardOverlayPlanner.KeepOuts(state,viewOwner,board.x,board.y,board.width);
        static void RenderBaseReport(Rect board,GameSimulation simulation,LaunchGesture aim,List<UiBox> avoid)
        {
            if(!ReferenceEquals(simulation,baseReportSimulation)){baseReport=new BaseDamageTracker();baseReportSimulation=simulation;}
            var state=simulation.State;baseReport.Observe(state);
            if(!Theme.BoardCaptions||!baseReport.Visible||state.phase==MatchPhase.Moving||(aim!=null&&aim.Active))return;
            float scale=board.width/540;var field=VisibleField(board);
            for(int owner=0;owner<2;owner++)
            {
                var lines=BaseDamageTracker.Lines(baseReport.Latest,owner,type=>simulation.Catalog.Ball(type)==null?type:BallIcons.Name(simulation.Catalog.Ball(type)));if(lines.Length==0)continue;
                var plan=BoardOverlayPlanner.Banner(lines,owner,viewOwner,field,scale,avoid);
                if(!plan.Placed){marginNotes.Add((plan.Top,lines[0],Theme.Damage));continue;}
                var rect=RectOf(plan.Box);Draw.Chip(rect,Alpha(Theme.Plate,.94f),Theme.Damage);
                if(plan.TwoLines)
                {
                    Draw.Text(new Rect(rect.x,rect.y+2,rect.width,plan.LineHeight),lines[0],plan.Font,Theme.Damage,TextAnchor.MiddleCenter,true);
                    Draw.Text(new Rect(rect.x,rect.y+plan.LineHeight+2,rect.width,plan.LineHeight),lines[1],Mathf.Max(8,plan.Font-1),Theme.PlateText,TextAnchor.MiddleCenter,false);
                }
                else Draw.Text(rect,lines[0],plan.Font,Theme.Damage,TextAnchor.MiddleCenter,true);
            }
        }

        // W18-02 (#287): how many own balls the acting player may Replay now
        // (canonical CanReplay only). W19-05: in the acting player's band but in a
        // free slot (never on the launcher, a ball or its chips), hidden while dragging.
        static void RenderReplayCounter(Rect board,GameSimulation simulation,LaunchGesture aim,List<UiBox> avoid)
        {
            var state=simulation.State;if(state.phase!=MatchPhase.Aiming||(aim!=null&&aim.Active))return;
            if(!Theme.BoardCaptions)return;
            string label=ReplayAffordance.CounterLabel(state.turn,ReplayAffordance.Eligible(simulation).Count);if(label.Length==0)return;
            var plan=BoardOverlayPlanner.Counter(label,state.turn,viewOwner,VisibleField(board),board.width/540,avoid);
            if(!plan.Placed){marginNotes.Add((plan.Top,label,Theme.SelectInk));return;}
            var rect=RectOf(plan.Box);
            Draw.Chip(rect,Alpha(Theme.Plate,.94f),Theme.Select);
            Draw.Text(rect,label,plan.Font,Theme.SelectInk,TextAnchor.MiddleCenter,true);
        }

        // Last resort when the field is full: a one-line note in the outer frame band.
        static void RenderMarginNotes(Rect board)
        {
            if(marginNotes.Count==0)return;
            float scale=board.width/540;Vector2 a=Point(board,Left,Top),b=Point(board,Right,Bottom);
            float fieldTop=Mathf.Min(a.y,b.y),fieldBottom=Mathf.Max(a.y,b.y),band=fieldTop-board.y;if(band<8)return;
            int font=Mathf.Max(7,Mathf.Min(Mathf.RoundToInt(10*scale),Mathf.FloorToInt(band-3)));
            for(int i=0;i<marginNotes.Count;i++){
                var n=marginNotes[i];bool sameSideBefore=false;for(int j=0;j<i;j++)if(marginNotes[j].top==n.top)sameSideBefore=true;
                float w=Mathf.Min(n.text.Length*font*.66f+12,board.width*.48f),x=sameSideBefore?board.xMax-w-4:board.x+4;
                var rect=new Rect(x,n.top?board.y+1:fieldBottom+1,w,band-2);
                Draw.Chip(rect,Alpha(Theme.Plate,.95f));Draw.Text(rect,n.text,font,n.color,TextAnchor.MiddleCenter,true);
            }
        }

        // W18-01 (#286): estimated free-roll STOP on an empty arena (StopPredictor).
        // A discreet ring + "EST. STOP" label; when anything lies on the path the
        // label says the estimate only holds if the path is clear. Never a hit claim.
        static StopEstimate stopCache;
        static string stopCacheKey;
        static readonly List<Vector2> estimatePath=new List<Vector2>(128);
        static void RenderStopEstimate(Rect board,GameState state,LaunchGesture aim,BallDefinition selected,BallRuntime replay,Catalog catalog,Color vector,float scale,float skip=0)
        {
            float dx=aim.AimX-aim.OriginX,dy=aim.AimY-aim.OriginY;
            if(!StopPredictor.GesturePower(dx,dy,out float power))return;
            if(replay==null&&selected==null)return;
            string key=state.turn+"|"+state.revision+"|"+aim.OriginX+"|"+aim.OriginY+"|"+aim.AimX+"|"+aim.AimY+"|"+(replay!=null?"r"+replay.id:selected.id);
            if(key!=stopCacheKey)
            {
                var body=replay!=null?StopPredictor.Replay(replay,catalog?.Ball(replay.type)?.archetype,dx,dy,power):StopPredictor.Spawn(selected,state.turn,dx,dy,power);
                // A ball of this match's size (match rule ballScale).
                if(replay==null)body.Radius*=Mathf.Max(.5f,state.ballScale);
                stopCache=StopPredictor.Predict(body,StopPredictor.Obstacles(state,replay?.id??-1));
                // The zone it will stop in, by this match's centre.
                if(stopCache!=null&&stopCache.Valid)stopCache.Reach=StopPredictor.Reach(body.Owner,stopCache.StopX,stopCache.StopY,stopCache.Start.Radius,CentreRadius);stopCacheKey=key;
            }
            var e=stopCache;if(e==null||!e.Valid)return;
            Color mark=Alpha(vector,e.Obstructed?.45f:.8f);
            // W24 (owner direction: readability): the estimated path is a row of light dashes on a dark
            // edge, and the stop mark a pale ghost of the ball, so both read on the floor and on either
            // home zone. An estimate that something is in the way of stays fainter.
            float see=e.Obstructed?.5f:1f,dash=Mathf.Max(4.5f,6*scale),gap=Mathf.Max(7f,9.5f*scale),core=Mathf.Max(2f,2.8f*scale);
            Color pathEdge=Alpha(Theme.Ink,.5f*see),pathCore=Alpha(Color.Lerp(vector,Color.white,.6f),.95f*see);
            Vector2 stop=Point(board,e.StopX,e.StopY);float r=e.Start.Radius*scale-scale;
            // One dashed line for the whole path: it starts past the arrow and ends at the rim of
            // the stop mark, not at its centre.
            estimatePath.Clear();for(int i=0;i<e.Path.Count;i++)estimatePath.Add(Point(board,e.Path[i].x,e.Path[i].y));
            float rim=r+scale+Mathf.Max(2,3*scale);
            Draw.Dashes(estimatePath,pathEdge,core+Mathf.Max(1.6f,2.2f*scale),dash,gap,skip,rim);
            Draw.Dashes(estimatePath,pathCore,core,dash,gap,skip,rim);
            Draw.Circle(new Rect(stop.x-r,stop.y-r,r*2,r*2),Alpha(Color.Lerp(vector,Color.white,.7f),e.Obstructed?.2f:.42f));
            Draw.Ring(stop,r+scale,Alpha(Theme.Ink,.6f*see),Mathf.Max(2.5f,3.8f*scale));
            Draw.Ring(stop,r,Alpha(Color.Lerp(vector,Color.white,.35f),see),Mathf.Max(1.2f,2f*scale),12,.6f);
            Draw.Stroke(stop-new Vector2(r*.45f,0),stop+new Vector2(r*.45f,0),Alpha(Theme.Ink,.55f*see),Mathf.Max(1.2f,1.6f*scale));
            Draw.Stroke(stop-new Vector2(0,r*.45f),stop+new Vector2(0,r*.45f),Alpha(Theme.Ink,.55f*see),Mathf.Max(1.2f,1.6f*scale));
            // W24: a ball whose power works where it stands (on STOP, or every turn) also shows how far
            // that power reaches from the estimated stop. Same estimate, same on/off switch as the mark.
            var reachGuide=BallGuide.For(replay!=null?replay.type:selected.id);
            if(reachGuide!=null&&reachGuide.Range>0&&(reachGuide.When==GuideWhen.Stop||reachGuide.When==GuideWhen.Turn))
            {
                float reach=reachGuide.Range*scale;
                Draw.Circle(new Rect(stop.x-reach,stop.y-reach,reach*2,reach*2),Alpha(vector,e.Obstructed?.05f:.1f));
                Draw.Ring(stop,reach+scale,Alpha(Theme.Ink,.4f),Mathf.Max(2.4f,3.4f*scale),30,.5f);
                Draw.Ring(stop,reach,Alpha(vector,e.Obstructed?.5f:.9f),Mathf.Max(1.2f,1.9f*scale),30,.5f);
            }
            if(!Theme.BoardCaptions)return;
            string label=StopPredictor.Label(e);int font=Mathf.Max(9,Mathf.RoundToInt(11*scale));
            float w=label.Length*font*.6f+12,h=font+8,room=VisibleField(board).width-8;
            // On a very small board the full label is wider than the field: two lines instead of a cut line.
            if(w>room){w=room;h=2*(font+2)+8;}
            // W20: the label keeps to the field (W19-04) and now also moves off balls and their plates.
            var standard=BoardLabelLayout.Fit(VisibleField(board),stop.x,stop.y+r+4,stop.y-r-4-h,w,h);
            var rect=RectOf(BoardLabelLayout.FitAvoiding(standard,VisibleField(board),stop.x,stop.y+r+4,stop.y-r-4-h,w,h,BoardKeepOuts(board,state),h+2));
            Draw.Chip(rect,Alpha(Theme.Plate,.95f),Theme.Edge);Draw.Text(rect,label,font,Alpha(Color.Lerp(vector,Theme.Ink,.45f),e.Obstructed?.75f:1f),TextAnchor.MiddleCenter,true);
        }

        // Frame: neutral side walls; each base wall carries its player's colour and that
        // base's HP bar in the outer band (flashes on a real BASE_DAMAGE event).
        static void RenderFrame(Rect board, Rect field, GameState state, FeedbackTimeline feedback)
        {
            float unit = board.width / 540;
            for (int owner = 0; owner < 2; owner++) RenderBaseBar(board, field, state, feedback, owner, unit);
            RenderWalls(board, field);
        }
        // W24 (owner direction: layers must fit, and what is drawn is what collides): the two side
        // walls are posts that run the whole height of the board, and the base bars lie between
        // them, so wall and bar meet in a clean joint. A wall is a light rim with an ink edge of the
        // same whole number of pixels on each side. It stands wholly outside the field: its inner
        // edge is the wall of the rules, so a ball that touches it is drawn touching it.
        // W24 (owner direction: show better which zone a ball is in): what the zones do, shown where
        // it will happen. A ball that touches the enemy's zone costs that base 1 HP when its owner's
        // turn ends: a small red wedge stands on that base's bar under the ball. (The centre is told
        // by its ring: see RenderArena.) Read from the rules' own tests; nothing is decided here.
        static void RenderPressureMarks(Rect board, Rect field, GameState state, float unit)
        {
            float size = Mathf.Max(6, 9 * unit);
            foreach (var ball in state.balls)
            {
                if (ball.dead || ball.banished || !CoreClash.Physics.ZoneResolver.TouchesEnemyZone(ball)) continue;
                bool atTop = Box(board, 0, ball.owner == 0 ? 0 : 900 - BaseThick, 540, BaseThick).center.y < board.center.y;
                float x = Mathf.Clamp(Point(FieldBoard(board), ball.x, ball.y).x, field.x + size, field.xMax - size), y = atTop ? field.y : field.yMax;
                var tip = new Vector2(x, atTop ? y - size * .2f : y + size * .2f);
                float back = atTop ? y + size : y - size;
                Draw.Triangle(tip, new Vector2(x - size * .7f, back), new Vector2(x + size * .7f, back), Draw.Line(1.2f * unit) + 1, Theme.Ink);
                Draw.Triangle(tip, new Vector2(x - size * .7f, back), new Vector2(x + size * .7f, back), 1, Theme.Damage);
            }
        }
        static void RenderWalls(Rect board, Rect field)
        {
            float unit = board.width / 540, rim = Draw.Line(3 * unit), edge = Draw.Line(2 * unit), thick = WallThick(unit);
            for (int side = 0; side < 2; side++)
            {
                float x = side == 0 ? field.x - thick : field.xMax;
                Draw.Rect(new Rect(x, board.y, thick, board.height), Theme.Ink);
                Draw.Rect(new Rect(x + edge, board.y, rim, board.height), Theme.Rim);
            }
        }

        // W24 (owner direction): the base is one thing, not a gauge and a launcher put side by side.
        // Its wall is the health gauge, and the place the balls are shot from is built into the
        // middle of it: a plate in the team's colour with the heart on one side of the launch dish
        // and the HP number on the other, and ten chunky pips of wall to each side - one for each HP.
        // The wall is lost from its far ends towards the dish. A lost pip goes dark; the pips just
        // lost flash on the real BASE_DAMAGE event. At 5 HP or less the plate, the dome over the
        // dish and the pips turn to the warning colour (steady, no blinking).
        public const string HeartGlyph = "+C -.36 -.28 .42;+C .36 -.28 .42;+P -.74 -.08 .74 -.08 0 .88";
        public const int BasePips = 20;
        // LauncherInset: how far the launcher of the rules stands from its wall (853 to 884, 47 to 16).
        public const float BaseThick = 30;
        // DomeRadius is the launch protection of the rules (BallPhysics.ResolveLaunchProtection).
        const float PlateWidth = 212, DomeRadius = 61, LauncherInset = 31;
        // A base keeps its owner's colour whatever its HP: a red plate under the blue player read as
        // the other player's base. Low HP is told by the heart and the pips.
        static Color BaseColor(GameState state, int owner) => Draw.Owner(owner);
        static void RenderBaseBar(Rect board, Rect field, GameState state, FeedbackTimeline feedback, int owner, float unit)
        {
            const float pad = 4.5f, gapWidth = 2.6f, ink = 2.5f;
            Color team = Draw.Owner(owner), deep = Theme.TeamDeep(owner);
            int hp = Mathf.Clamp(state.players[owner].hp, 0, BasePips);
            bool low = hp <= 5;
            float top = owner == 0 ? 900 - BaseThick : 0, flash = BaseLoss(feedback, owner, out int lost);
            // The bar fills the strip between the edge of the board and the edge of the field, and
            // its ink lines lie inside it: its inner edge is the wall the balls bounce off.
            bool atTop = Box(board, 0, top, 540, BaseThick).center.y < board.center.y;
            var strip = Draw.SnapRect(atTop ? new Rect(field.x, board.y, field.width, field.y - board.y) : new Rect(field.x, field.yMax, field.width, board.yMax - field.yMax));
            float inkLine = Draw.Line(ink * unit);
            Draw.Rect(strip, Theme.Ink);
            var bar = new Rect(strip.x, strip.y + inkLine, strip.width, Mathf.Max(inkLine, strip.height - 2 * inkLine));
            Draw.Rect(bar, Color.Lerp(Theme.Ink, deep, .38f));
            // A base that is hit lights up along its whole length for a moment (real BASE_DAMAGE event).
            if (flash > 0) Draw.Rect(bar, Alpha(Color.Lerp(Theme.Damage, Color.white, Mathf.Clamp01(flash * 2 - 1)), .7f * flash * flash));
            // Plate: heart, launch dish, number. The dish itself is drawn by RenderLauncher, on top.
            // W24 (owner direction: clean edges): every pip is the same whole number of screen pixels
            // wide, with the same gap; the plate between them takes whatever is left over.
            const int side = BasePips / 2;
            float px = Draw.Pixel, gap = Mathf.Max(px, Draw.Snap(gapWidth * unit)), frame = inkLine + Draw.Line(pad * unit);
            float outerLeft = Draw.Snap(bar.x + pad * unit), outerRight = Draw.Snap(bar.xMax - pad * unit);
            float step = Mathf.Max(2 * px, Draw.SnapDown((bar.center.x - PlateWidth * .5f * unit - frame - outerLeft) / side)), width = Mathf.Max(px, step - gap);
            float leftEnd = outerLeft + side * step, rightStart = outerRight - side * step;
            var plate = new Rect(leftEnd + frame, bar.y, rightStart - leftEnd - 2 * frame, bar.height);
            Draw.Rect(new Rect(plate.x - inkLine, bar.y, plate.width + 2 * inkLine, bar.height), Theme.Ink);
            Draw.Rect(plate, BaseColor(state, owner));
            // The dome over the launch dish grows out of the plate: where it stands, the plate has no
            // ink line along the field (the dome's own outline ends on that line).
            float mouth = Mathf.Sqrt(DomeRadius * DomeRadius - LauncherInset * LauncherInset) * FieldScale * unit - Draw.Pixel;
            Draw.Rect(new Rect(bar.center.x - mouth, atTop ? bar.yMax : strip.y, mouth * 2, inkLine), BaseColor(state, owner));
            float wing = bar.center.x - DomeRadius * unit - plate.x;
            // The heart beats once when the base is hit.
            float icon = bar.height * .62f * (1 + .28f * flash * flash);
            var heart = new Rect(plate.x + wing * .5f - icon * .5f, plate.center.y - icon * .5f + unit, icon, icon);
            // Match rule "double turn": while this player holds it, a gold x2 stands in place of the heart.
            var owned = state.players[owner];
            bool twice = state.comebackRule && (owned.comebackArmed || (state.turn == owner && state.phase != MatchPhase.Over && (state.comebackActive || (state.bonusPending && owned.comebackUsed))));
            if (twice)
            {
                float span = Mathf.Min(wing - 2 * px, bar.height - 2 * px);
                var badge = Draw.SnapRect(new Rect(plate.x + wing * .5f - span * .5f, plate.center.y - span * .5f, span, span));
                Draw.Circle(badge, Theme.Ink); Draw.Circle(Draw.Grow(badge, -Draw.Line(1.5f * unit)), Theme.Select);
                Draw.Text(new Rect(badge.x, badge.y - px, badge.width, badge.height), "x2", Mathf.Max(9, Mathf.RoundToInt(13 * unit)), Theme.Ink, TextAnchor.MiddleCenter, true);
            }
            else
            {
                Glyphs.Paint(new Rect(heart.x - 1.5f, heart.y - 1.5f, heart.width + 3, heart.height + 3), HeartGlyph, Theme.Ink);
                Glyphs.Paint(heart, HeartGlyph, low ? Color.Lerp(Color.white, Theme.Damage, .25f + .75f * flash) : Color.white);
            }
            Draw.Inked(new Rect(plate.xMax - wing, plate.y - 1, wing, plate.height), hp.ToString(), Mathf.Max(11, Mathf.RoundToInt(21 * unit)), Color.white, TextAnchor.MiddleCenter, Mathf.Max(1.2f, 1.8f * unit));
            // Pips, counted from the left: the bar empties from its right end, so the right half goes
            // first and the left half after it (owner decision). The plate between the halves is the
            // 10 HP mark.
            float pipTop = Draw.Snap(bar.y + pad * unit), height = Mathf.Max(px, Draw.Snap(bar.height - 2 * pad * unit));
            Color lit = low ? Color.Lerp(team, Theme.Damage, .6f) : team;
            for (int i = 0; i < BasePips; i++)
            {
                float x = i < side ? outerLeft + i * step : rightStart + (i - side) * step + gap;
                var pip = new Rect(x, pipTop, width, height);
                if (i < hp)
                {
                    Draw.Chip(pip, lit);
                    float rim = Mathf.Max(px, Draw.Snap(1));
                    Draw.Rect(new Rect(pip.x + rim, pip.y + rim, pip.width - 2 * rim, Mathf.Max(px, Draw.Snap(pip.height * .36f))), new Color(1, 1, 1, .34f));
                }
                else
                {
                    Draw.Chip(pip, new Color(1, 1, 1, .09f));
                    if (flash > 0 && i < hp + lost) Draw.Chip(pip, Color.Lerp(Alpha(Theme.Damage, flash), Alpha(Color.white, flash), Mathf.Clamp01(flash * 2 - 1)));
                }
            }
        }
        // How strongly a base that was just hit should flash (0..1) and how many HP it lost in that moment.
        static float BaseLoss(FeedbackTimeline feedback, int owner, out int amount)
        {
            amount = 0;
            if (feedback == null) return 0;
            float best = 0, now = Time.unscaledTime;
            foreach (var item in feedback.Items)
            {
                if (item.kind != "BASE_DAMAGE" || item.owner != owner) continue;
                float age = now - item.born;
                if (age < 0 || age >= FeedbackTimeline.Life) continue;
                best = Mathf.Max(best, (1 - age / FeedbackTimeline.Life) * Theme.EffectStrength);
                int dash = item.text == null ? -1 : item.text.LastIndexOf('-');
                if (dash >= 0 && int.TryParse(item.text.Substring(dash + 1), out int value)) amount += value;
            }
            return best;
        }
        static float BaseFlash(FeedbackTimeline feedback, int owner)
        {
            if (feedback == null) return 0;
            float best = 0, now = Time.unscaledTime;
            foreach (var item in feedback.Items)
            {
                if (item.kind != "BASE_DAMAGE" || item.owner != owner) continue;
                float age = now - item.born;
                if (age >= 0 && age < Theme.BaseFlash) best = Mathf.Max(best, (1 - age / Theme.BaseFlash) * Theme.EffectStrength);
            }
            return best;
        }

        static void Line(Rect board, float x1, float y1, float x2, float y2, Color color, float width)
            => Draw.Line(Point(board, x1, y1), Point(board, x2, y2), color, Mathf.Max(.65f, width * board.width / 540));

        static Color Alpha(Color color, float alpha) => new Color(color.r, color.g, color.b, alpha);
        // W19-04: the clipped play field in board-view space (labels stay inside it).
        static UiBox VisibleField(Rect board){Vector2 a=Point(board,Left,Top),b=Point(board,Right,Bottom);return BoardLabelLayout.Field(a.x,a.y,b.x,b.y);}
        static Rect RectOf(UiBox r)=>new Rect(r.x,r.y,r.width,r.height);
    }
}
