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
        const float ZoneP2Bottom = 198, ZoneP1Top = 702, CentreX = 270, CentreY = 450, CentreRadius = 112;
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
            float trayPad = Mathf.Max(3, 6 * rect.width / 540f);
            var tray = new Rect(rect.x - trayPad, rect.y - trayPad, rect.width + trayPad * 2, rect.height + trayPad * 2);
            Draw.Shadow(tray, .34f, 16, 8);
            Draw.Round(tray, Theme.BoardLip);
            Draw.Round(new Rect(tray.x, tray.y + trayPad * .5f, tray.width, tray.height - trayPad * .5f), Theme.BoardOuter);
            GUI.BeginGroup(rect);
            var board = new Rect(0, 0, rect.width, rect.height);
            RenderArena(board);

            // Clip gameplay glows and effects to the actual field, as in the V148 canvas.
            Rect field = Box(board, Left, Top, Right - Left, Bottom - Top);
            GUI.BeginGroup(field);
            var clippedBoard = new Rect(-field.x, -field.y, board.width, board.height);
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
            GUI.EndGroup();

            RenderFrame(board,state,feedback);
            RenderMarginNotes(board);
            GUI.EndGroup();
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
            viewOwner=0;actingOwner=-1;turnShown=state.turnNumber;
            effects.Swap();
            try
            {
                if(Event.current.type==EventType.Repaint)Fx.Observe(simulation,now);
                GUI.BeginGroup(rect);
                var board=new Rect(-Left*scale,-worldTop*scale,540*scale,900*scale);
                RenderArena(board);
                Rect field=Box(board,Left,Top,Right-Left,Bottom-Top);
                GUI.BeginGroup(field);
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
                GUI.EndGroup();
                RenderFrame(board,state,feedback);
                GUI.EndGroup();
            }
            finally
            {
                effects.Swap();
                viewOwner=previousViewOwner;actingOwner=previousActing;turnShown=previousTurn;turnSince=previousSince;
            }
        }

        static void RenderArena(Rect board)
        {
            Rect field = Box(board, Left, Top, Right - Left, Bottom - Top);
            float scale = board.width / 540;
            // Light floor: brightest across the middle, a touch deeper toward both base walls.
            Draw.VGradient(new Rect(field.x, field.y, field.width, field.height * .5f + .5f), Theme.FloorEdge, Theme.FloorCentre);
            Draw.VGradient(new Rect(field.x, field.y + field.height * .5f, field.width, field.height * .5f), Theme.FloorCentre, Theme.FloorEdge);
            // W24: no grid or dots on the floor. Two wide bands of light lie across it like on a
            // polished table, and the side walls cast a soft shadow, so the arena has depth.
            var old = GUI.color; GUI.color = new Color(1, 1, 1, .5f); GUI.DrawTexture(field, Sheen()); GUI.color = old;
            for (int i = 0; i < 5; i++)
            {
                float step = 3 * scale, shade = .11f * (1 - i / 5f);
                Draw.Rect(new Rect(field.x + i * step, field.y, step, field.height), Theme.A(Theme.Ink, shade));
                Draw.Rect(new Rect(field.xMax - (i + 1) * step, field.y, step, field.height), Theme.A(Theme.Ink, shade));
            }
            RenderHomeZone(board, 1, Top, ZoneP2Bottom);
            RenderHomeZone(board, 0, ZoneP1Top, Bottom);
            // Half-way line: short dashes from each wall to the centre ring.
            for (int side = -1; side <= 1; side += 2)
                for (int i = 0; i < 7; i++)
                {
                    float from = CentreX + side * (CentreRadius + 14 + i * 18), to = from + side * 9;
                    if (side < 0 ? to < Left + 4 : to > Right - 4) break;
                    Line(board, from, CentreY, to, CentreY, Theme.A(Theme.Centre, .5f), 3f);
                }

            // Centre: neutral (never a team colour). The ring is the rules' centre radius.
            Vector2 centre = Point(board, CentreX, CentreY);
            Color neutral = Theme.Centre;
            Line(board, Left, CentreY, CentreX - CentreRadius, CentreY, Theme.A(neutral, Theme.MidLine), 2f);
            Line(board, CentreX + CentreRadius, CentreY, Right, CentreY, Theme.A(neutral, Theme.MidLine), 2f);
            Draw.Circle(Box(board, CentreX - CentreRadius, CentreY - CentreRadius, CentreRadius * 2, CentreRadius * 2), Theme.A(Color.white, Theme.CentreFill));
            Draw.Ring(centre, (CentreRadius + 1.5f) * scale, Theme.Ink, Mathf.Max(4f, 7.5f * scale));
            Draw.Ring(centre, CentreRadius * scale, Color.Lerp(neutral, Color.white, .2f), Mathf.Max(2.2f, 4.5f * scale));
            Draw.Glow(centre, CentreRadius * 1.25f * scale, Theme.A(neutral, .18f));
            Draw.Ring(centre, (CentreRadius + 11) * scale, Theme.A(neutral, .5f), Mathf.Max(1.2f, 2.2f * scale), 40, .5f);
            // Two wide, faint rings on the floor and eight lights that travel round the centre.
            Draw.Ring(centre, 186 * scale, Theme.A(neutral, .16f), Mathf.Max(1.2f, 2.4f * scale));
            Draw.Ring(centre, 262 * scale, Theme.A(neutral, .1f), Mathf.Max(1.2f, 2.4f * scale));
            for (int i = 0; i < 8; i++)
            {
                float angle = i * Mathf.PI / 4 + (Fx.ReducedMotion ? .2f : Time.unscaledTime * .3f), dot = Mathf.Max(2.2f, 3.8f * scale);
                var p = centre + new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * (CentreRadius + 11) * scale;
                Draw.Circle(new Rect(p.x - dot - 1.2f, p.y - dot - 1.2f, (dot + 1.2f) * 2, (dot + 1.2f) * 2), Theme.A(Theme.Ink, .75f));
                Draw.Circle(new Rect(p.x - dot, p.y - dot, dot * 2, dot * 2), Color.Lerp(neutral, Color.white, .55f));
            }
            // The turn number, painted on the floor like a court marking.
            if (turnShown > 0) Draw.Text(new Rect(centre.x - 100 * scale, centre.y - 60 * scale, 200 * scale, 120 * scale), turnShown.ToString(), Mathf.Max(20, Mathf.RoundToInt(78 * scale)), Theme.A(neutral, .42f), TextAnchor.MiddleCenter, true);
            int font = Mathf.Max(8, Mathf.RoundToInt(10 * scale));
            RenderWallLamps(board);
            if (Theme.CentreLabel > 0) Draw.Text(new Rect(centre.x - 100 * scale, centre.y + (CentreRadius + 5) * scale, 200 * scale, font + 8), Lang.T("CENTRE","CENTRUM"), font,
                Theme.A(neutral, Theme.CentreLabel), TextAnchor.MiddleCenter, true);
        }

        // Home zone: team tint that is strongest at the base wall, a pattern that differs
        // per player (P1 stripes, P2 dots), a firm boundary line and a small name.
        static void RenderHomeZone(Rect board, int owner, float top, float bottom)
        {
            Color team = Draw.Owner(owner);
            float scale = board.width / 540;
            Rect zone = Box(board, Left, top, Right - Left, bottom - top);
            bool baseAtViewTop = BoardOverlayPlanner.AtViewTop(owner, viewOwner);
            Color near = Theme.A(team, Theme.ZoneFillNear), far = Theme.A(team, Theme.ZoneFillFar);
            // A white wash first, so the team tint stays a clean pastel on the warm floor.
            Draw.Rect(zone, new Color(1, 1, 1, .7f));
            // W24: "your turn" without words. The acting player's zone lights up (a quick flash when the
            // turn starts, then a calm breathing glow) and its boundary becomes a bright bar.
            bool acting = actingOwner == owner;
            if (acting)
            {
                float since = Time.unscaledTime - turnSince, flashIn = Fx.ReducedMotion ? 0 : Mathf.Clamp01(1 - since / .5f);
                float breathe = Fx.ReducedMotion ? .5f : .5f + .5f * Mathf.Sin(Time.unscaledTime * 3.2f);
                Draw.Rect(zone, Theme.A(team, .26f + .12f * breathe + .3f * flashIn));
                if (flashIn > 0) Draw.Rect(zone, new Color(1, 1, 1, .5f * flashIn));
            }
            Draw.VGradient(zone, baseAtViewTop ? near : far, baseAtViewTop ? far : near);
            Draw.Tile(zone, Pattern(owner == 0), Mathf.Max(20, 30 * scale), Theme.A(team, Theme.ZonePattern));
            // A runway of chevrons pointing at the opponent; it moves while that player is aiming.
            {
                bool towardsViewTop = !baseAtViewTop;
                float drift = acting && !Fx.ReducedMotion ? Mathf.Repeat(Time.unscaledTime * .7f, 1) : .5f, size = 26 * scale;
                for (int row = 0; row < 2; row++)
                    for (int i = 0; i < 6; i++)
                    {
                        float x = Left + (Right - Left) * (i + .5f) / 6f;
                        if (Mathf.Abs(x - 270) < 60) continue;
                        float depth = 46 + row * 44 + drift * 14, y = owner == 0 ? top + depth : bottom - depth;
                        var p = Point(board, x, y);
                        float alpha = (acting ? .34f : .16f) * (row == 0 ? 1 : .6f);
                        Glyphs.Paint(new Rect(p.x - size / 2, p.y - size / 2, size, size), towardsViewTop ? Fx.Chevron : "+L -.7 -.45 0 .45 .34;+L 0 .45 .7 -.45 .34", Theme.A(Color.Lerp(team, Color.white, .25f), alpha));
                    }
            }
            float edge = owner == 0 ? top : bottom, inner = owner == 0 ? 6 : -6;
            Line(board, Left, edge, Right, edge, Theme.Ink, acting ? 9f : 6f);
            Line(board, Left, edge, Right, edge, acting ? Color.Lerp(team, Color.white, .25f) : Color.Lerp(team, Color.white, .45f), acting ? 5.5f : 3f);
            // (W24: one soft boundary line is enough)
            Vector2 corner = Point(board, Left, edge);
            int font = Mathf.Max(8, Mathf.RoundToInt(9 * scale));
            float height = font + 6;
            var label = new Rect(corner.x + 7 * scale, baseAtViewTop ? corner.y - 3 * scale - height : corner.y + 3 * scale, Mathf.Max(96, 150 * scale), height);
            if (Theme.ZonePattern > 0) Draw.Text(label, Lang.T("P","G") + (owner + 1) + Lang.T(" HOME ZONE"," STREFA DOMOWA"), font, Theme.A(Theme.TeamDeep(owner), Theme.ZoneLabel), TextAnchor.MiddleLeft, true);
        }

        // W24: lamps set into the floor along both side walls, under the balls. While a player is
        // aiming, lit lamps run towards the opponent in that player's colour; otherwise they rest.
        // Still with calm effects.
        static void RenderWallLamps(Rect board)
        {
            const int count = 17;
            float unit = board.width / 540;
            bool aiming = actingOwner == 0 || actingOwner == 1;
            Color tone = aiming ? Draw.Owner(actingOwner) : Theme.Centre;
            float lamp = Mathf.Max(2.4f, 4.4f * unit), run = Fx.ReducedMotion ? 0 : Time.unscaledTime * 5.5f;
            for (int i = 0; i < count; i++)
            {
                float y = ZoneP2Bottom + 26 + (ZoneP1Top - ZoneP2Bottom - 52) * i / (count - 1f);
                // Player 1 shoots towards the top of the board (small y), player 2 towards the bottom.
                int order = actingOwner == 1 ? i : count - 1 - i;
                bool lit = aiming && Mathf.Repeat(order - run, 6) < 1.5f;
                Color fill = lit ? Color.Lerp(tone, Color.white, .35f) : Color.Lerp(Color.white, tone, aiming ? .35f : .2f);
                for (int side = 0; side < 2; side++)
                {
                    var p = Point(board, side == 0 ? Left + 11 : Right - 11, y);
                    if (lit) Draw.Glow(p, lamp * 3.2f, Theme.A(tone, .6f));
                    Draw.Circle(new Rect(p.x - lamp - 1.4f, p.y - lamp - 1.4f, (lamp + 1.4f) * 2, (lamp + 1.4f) * 2), Theme.A(Theme.Ink, .8f));
                    Draw.Circle(new Rect(p.x - lamp, p.y - lamp, lamp * 2, lamp * 2), fill);
                }
            }
        }

        // Two soft diagonal bands of light across the floor (one small texture, stretched).
        static Texture2D sheen;
        static Texture2D Sheen()
        {
            if (sheen != null) return sheen;
            const int size = 64;
            sheen = new Texture2D(size, size, TextureFormat.RGBA32, false) { name = "Core Clash floor sheen", filterMode = FilterMode.Bilinear, wrapMode = TextureWrapMode.Clamp, hideFlags = HideFlags.HideAndDontSave };
            var pixels = new Color[size * size];
            for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                {
                    float d = (x + y) / (2f * size);
                    float a = Mathf.Clamp01(1 - Mathf.Abs(d - .34f) / .09f), b = Mathf.Clamp01(1 - Mathf.Abs(d - .52f) / .035f);
                    pixels[y * size + x] = new Color(1, 1, 1, Mathf.Max(a * a * .55f, b * b * .4f));
                }
            sheen.SetPixels(pixels); sheen.Apply(false, true);
            return sheen;
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

        static void RenderLauncher(Rect board, GameState state, int owner, LaunchGesture aim, BallDefinition selected)
        {
            float scale = board.width / 540;
            float y = owner == 0 ? 853 : 47;
            Color team = Draw.Owner(owner);
            bool active = state.turn == owner && state.phase == MatchPhase.Aiming;
            var center = Point(board, 270, y);
            // A pad in the team colour: white dish, team ring (P2 segmented), chevrons into the field.
            Draw.Glow(new Vector2(center.x, center.y + 4 * scale), 52 * scale, new Color(.07f, .1f, .3f, .28f));
            Draw.Circle(Box(board, 270 - 41, y - 41, 82, 82), Theme.Ink);
            Draw.Circle(Box(board, 270 - 38, y - 38, 76, 76), active ? team : Color.Lerp(team, Color.white, .45f));
            Draw.Circle(Box(board, 270 - 31, y - 31, 62, 62), Color.Lerp(Color.white, team, .12f));
            Draw.Ring(center, 34.5f * scale, Theme.A(Theme.TeamDeep(owner), active ? .95f : .4f), Mathf.Max(1.5f, 2.4f * scale), owner == 1 ? Theme.P2RingSegments : 0, Theme.P2RingFill);
            bool up = !BoardOverlayPlanner.AtViewTop(owner, viewOwner);
            if (active)
            {
                float pulse = Fx.ReducedMotion ? 46 : 46 + Mathf.Sin(Time.unscaledTime * 3) * 3f;
                Draw.Ring(center, pulse * scale, Theme.A(team, .55f), Mathf.Max(1.5f, 2.6f * scale));
                Draw.Ring(center, (pulse + 7) * scale, Theme.A(team, .22f), Mathf.Max(1, 1.6f * scale));
                // Six lights circle the pad of the player who is aiming.
                for (int i = 0; i < 6; i++)
                {
                    float angle = i * Mathf.PI / 3 - (Fx.ReducedMotion ? 0 : Time.unscaledTime * 1.5f), dot = Mathf.Max(2, 3.4f * scale);
                    var p = center + new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * 55 * scale;
                    Draw.Circle(new Rect(p.x - dot - 1.2f, p.y - dot - 1.2f, (dot + 1.2f) * 2, (dot + 1.2f) * 2), Theme.Ink);
                    Draw.Circle(new Rect(p.x - dot, p.y - dot, dot * 2, dot * 2), Color.Lerp(team, Color.white, .45f));
                }
                for (int i = 0; i < 2; i++)
                {
                    float travel = Fx.ReducedMotion ? 0 : Mathf.Repeat(Time.unscaledTime * 1.6f + i * .5f, 1);
                    float size = 20 * scale, offset = (58 + i * 15 + travel * 6) * scale * (up ? -1 : 1);
                    Glyphs.Paint(new Rect(center.x - size / 2, center.y + offset - size / 2, size, size), up ? Fx.Chevron : "+L -.7 -.45 0 .45 .34;+L 0 .45 .7 -.45 .34", Theme.A(team, .8f - i * .35f));
                }
                bool aimingHere = aim == null || !aim.Active || (Mathf.Abs(aim.OriginX - 270) < .1f && Mathf.Abs(aim.OriginY - y) < .1f);
                if (selected != null && aimingHere)
                {
                    float radius = Mathf.Max(9, selected.radius) + Theme.BallGrow;
                    BallView.Preview(Box(board, 270 - radius, y - radius, radius * 2, radius * 2), selected, owner, true);
                }
            }
        }

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
                    : zone.kind == "web" ? new Color(.15f, .78f, .5f)
                    : zone.kind == "portal" ? new Color(.6f, .4f, 1)
                    : zone.kind == "blackHole" ? new Color(.45f, .2f, .8f) : new Color(.42f, .56f, .8f);
                bool dense = zone.kind == "portal" || zone.kind == "blackHole";
                var center = Point(board, zone.x, zone.y);
                Draw.Circle(Box(board, zone.x - zone.radius, zone.y - zone.radius, zone.radius * 2, zone.radius * 2), Theme.A(color, dense ? .6f : .26f));
                Draw.Ring(center, zone.radius * scale, Theme.A(Color.Lerp(color, Theme.Ink, .15f), dense ? .95f : .8f), Mathf.Max(1.5f, 2.4f * scale), dense ? 0 : 24, .62f);
                if (dense && !Fx.ReducedMotion) Draw.Ring(center, zone.radius * scale * (.55f + .2f * Mathf.Sin(Time.unscaledTime * 3 + zone.id)), Theme.A(Color.white, .5f), Mathf.Max(1, 1.6f * scale), 6, .45f);
                if (dense)
                    Draw.Circle(Box(board, zone.x - zone.radius * .68f, zone.y - zone.radius * .68f, zone.radius * 1.36f, zone.radius * 1.36f), new Color(.14f, .08f, .32f));
                if (zone.kind == "web") Draw.Text(Box(board, zone.x - 12, zone.y - 12, 24, 24), "+", 12, Theme.Ink, TextAnchor.MiddleCenter);
                if(zone.kind=="embertrap"||zone.kind=="frosttrap"||zone.kind=="sporetrap")
                {
                    // Trap: the owner's ring pattern outside, the element symbol inside.
                    Draw.Ring(center,(zone.radius+3)*scale,Theme.A(Draw.Owner(zone.owner),.85f),Mathf.Max(1,1.5f*scale),zone.owner==1?Theme.P2RingSegments*2:0,Theme.P2RingFill);
                    float glyph=Mathf.Max(10,15*scale);
                    Draw.Circle(new Rect(center.x-glyph*.8f,center.y-glyph*.8f,glyph*1.6f,glyph*1.6f),Theme.Ink);Glyphs.Paint(new Rect(center.x-glyph/2,center.y-glyph/2,glyph,glyph),fire?StatusKind.Fire:ice?StatusKind.Ice:StatusKind.Toxin,color);
                }
                else if(fire||ice||toxin)
                {
                    // Element field: the same symbol its status uses on a ball.
                    float glyph=Mathf.Max(11,18*scale);
                    Glyphs.Paint(new Rect(center.x-glyph/2,center.y-glyph/2,glyph,glyph),fire?StatusKind.Fire:ice?StatusKind.Ice:StatusKind.Toxin,Theme.A(Color.Lerp(color,Theme.Ink,.25f),.8f));
                }
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
            float beat = .5f + .5f * Mathf.Sin(Time.unscaledTime * (ball.mineArmed ? 5 : 3) + ball.id);
            float reach = (ball.radius + Theme.BallGrow + (ball.mineArmed ? 12 + beat * 3 : 12)) * scale;
            Draw.Circle(new Rect(center.x - reach, center.y - reach, reach * 2, reach * 2), Theme.A(Theme.Threat, .16f + beat * .1f));
            if (ball.mineArmed) Draw.Ring(center, reach, Theme.A(Theme.Threat, .6f + beat * .35f), Mathf.Max(1.5f, 2.4f * scale), 12, .5f);
            else Draw.Ring(center, reach, Theme.A(Theme.Threat, .55f + beat * .3f), Mathf.Max(1.5f, 2 * scale));
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
                Color tint=EffectColor(item.kind);var rect=RectOf(placed[i]);
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
            var preview=AimGuide.Preview(aim.OriginX,aim.OriginY,aim.AimX,aim.AimY,state.turn,fromLauncher?(selected?.radius??17):(replay?.radius??17));
            if (!GameSimulation.Finite(preview.Distance)) return;
            Color team = Draw.Owner(state.turn);
            Color vector = preview.Ready ? Color.Lerp(team, Color.white, .12f) : Alpha(Color.Lerp(team, Color.white, .35f), .7f);
            // W20: every aim stroke sits on a dark edge, so it reads on both home zones.
            Color under = Alpha(Theme.Ink, Theme.AimUnderlay);
            Draw.Ring(origin, 33 * scale, under, Mathf.Max(2.5f, 4.2f * scale));
            Draw.Ring(origin, 32 * scale, Alpha(team, .85f), Mathf.Max(1.2f, 2 * scale));

            if (preview.Distance > 1)
            {
                var path=preview.Path;
                if(!preview.Valid)return;
                // Strokes start outside the origin ring, so the ball being launched stays readable.
                float clear=(fromLauncher?37:(replay?.radius??17)+12)*scale;
                for(int i=1;i<path.Length;i++){
                    var from=Point(board,path[i-1].x,path[i-1].y);var to=Point(board,path[i].x,path[i].y);
                    if(i==1){float reach=(to-from).magnitude;if(reach<=clear+2)continue;from+=(to-from)/reach*clear;}
                    float bead=Mathf.Max(5,(i==1?9.5f:7f)*scale),step=Mathf.Max(8,(i==1?17f:15f)*scale);
                    Beads(from,to,Theme.Ink,bead+Mathf.Max(2.5f,3.6f*scale),step);
                    Beads(from,to,i==1?vector:Color.Lerp(vector,Color.white,.45f),bead,step);
                    if(i==1&&path.Length>2)Draw.Ring(to,6*scale,Alpha(vector,.9f),Mathf.Max(1,1.4f*scale));
                }
                Vector2 tip=Point(board,path[path.Length-1].x,path[path.Length-1].y),last=Point(board,path[path.Length-2].x,path[path.Length-2].y);Vector2 direction=(tip-last).normalized;
                Vector2 wing = new Vector2(-direction.y, direction.x);
                AimStroke(tip-direction*20*scale+wing*12*scale,tip,Theme.Ink,Mathf.Max(6,10*scale));
                AimStroke(tip-direction*20*scale-wing*12*scale,tip,Theme.Ink,Mathf.Max(6,10*scale));
                AimStroke(tip-direction*20*scale+wing*12*scale,tip,vector,Mathf.Max(3,5.5f*scale));
                AimStroke(tip-direction*20*scale-wing*12*scale,tip,vector,Mathf.Max(3,5.5f*scale));
                float pull=(finger-origin).magnitude;
                if(pull>clear+4)AimStroke(origin+(finger-origin)/pull*clear,finger,Alpha(team,Theme.AimPull),Mathf.Max(1,1.4f*scale),4*scale,5*scale);
                if(preview.Ready&&ShowStopEstimate)RenderStopEstimate(board,state,aim,selected,replay,catalog,vector,scale);
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
        static void RenderStopEstimate(Rect board,GameState state,LaunchGesture aim,BallDefinition selected,BallRuntime replay,Catalog catalog,Color vector,float scale)
        {
            float dx=aim.AimX-aim.OriginX,dy=aim.AimY-aim.OriginY;
            if(!StopPredictor.GesturePower(dx,dy,out float power))return;
            if(replay==null&&selected==null)return;
            string key=state.turn+"|"+state.revision+"|"+aim.OriginX+"|"+aim.OriginY+"|"+aim.AimX+"|"+aim.AimY+"|"+(replay!=null?"r"+replay.id:selected.id);
            if(key!=stopCacheKey)
            {
                var body=replay!=null?StopPredictor.Replay(replay,catalog?.Ball(replay.type)?.archetype,dx,dy,power):StopPredictor.Spawn(selected,state.turn,dx,dy,power);
                stopCache=StopPredictor.Predict(body,StopPredictor.Obstacles(state,replay?.id??-1));stopCacheKey=key;
            }
            var e=stopCache;if(e==null||!e.Valid)return;
            Color mark=Alpha(vector,e.Obstructed?.45f:.8f);
            for(int i=1;i<e.Path.Count;i++)AimStroke(Point(board,e.Path[i-1].x,e.Path[i-1].y),Point(board,e.Path[i].x,e.Path[i].y),Alpha(vector,.4f),Mathf.Max(1.2f,1.6f*scale),3*scale,6*scale);
            Vector2 stop=Point(board,e.StopX,e.StopY);float r=(e.Start.Radius+Theme.BallGrow)*scale;
            Draw.Circle(new Rect(stop.x-r,stop.y-r,r*2,r*2),Alpha(vector,e.Obstructed?.12f:.22f));
            Draw.Ring(stop,r+scale,Alpha(Theme.Ink,.55f),Mathf.Max(2.5f,3.8f*scale));
            Draw.Ring(stop,r,mark,Mathf.Max(1,1.6f*scale),12,.6f);
            AimStroke(stop-new Vector2(r*.45f,0),stop+new Vector2(r*.45f,0),mark,Mathf.Max(1,1.2f*scale));
            AimStroke(stop-new Vector2(0,r*.45f),stop+new Vector2(0,r*.45f),mark,Mathf.Max(1,1.2f*scale));
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
        static void RenderFrame(Rect board, GameState state, FeedbackTimeline feedback)
        {
            Line(board, Left, Top, Left, Bottom, Theme.Ink, 7f);
            Line(board, Right, Top, Right, Bottom, Theme.Ink, 7f);
            Line(board, Left, Top, Left, Bottom, Theme.Rim, 3f);
            Line(board, Right, Top, Right, Bottom, Theme.Rim, 3f);
            float unit = board.width / 540;
            for (int owner = 0; owner < 2; owner++) RenderBaseBar(board, state, feedback, owner, unit);
        }

        // W24: the base is its wall, and the wall is a health gauge. A badge with a heart and the
        // number, then twenty chunky pips, one for each HP. A lost pip goes dark; the pips just lost
        // flash on the real BASE_DAMAGE event. At 5 HP or less the badge and the pips turn to the
        // warning colour (steady, no blinking).
        public const string HeartGlyph = "+C -.36 -.28 .42;+C .36 -.28 .42;+P -.74 -.08 .74 -.08 0 .88";
        public const int BasePips = 20;
        static void RenderBaseBar(Rect board, GameState state, FeedbackTimeline feedback, int owner, float unit)
        {
            const float thick = 30, badgeWidth = 84, pad = 4.5f, gapWidth = 2.6f;
            Color team = Draw.Owner(owner), deep = Theme.TeamDeep(owner);
            int hp = Mathf.Clamp(state.players[owner].hp, 0, BasePips);
            bool low = hp <= 5;
            float top = owner == 0 ? 900 - thick : 0, flash = BaseLoss(feedback, owner, out int lost);
            var bar = Box(board, Left, top, Right - Left, thick);
            Draw.Rect(new Rect(bar.x, bar.y - 2.5f * unit, bar.width, bar.height + 5 * unit), Theme.Ink);
            Draw.Rect(bar, Color.Lerp(Theme.Ink, deep, .38f));
            // Badge: heart and number.
            var badge = new Rect(bar.x, bar.y, badgeWidth * unit, bar.height);
            Draw.Rect(badge, low ? Theme.Damage : team);
            Draw.Rect(new Rect(badge.x, badge.y, badge.width, badge.height * .42f), new Color(1, 1, 1, .2f));
            // The heart beats once when the base is hit.
            float icon = bar.height * .62f * (1 + .28f * flash * flash);
            var heart = new Rect(badge.x + 8 * unit + (bar.height * .62f - icon) * .5f, badge.center.y - icon * .5f + unit, icon, icon);
            Glyphs.Paint(new Rect(heart.x - 1.5f, heart.y - 1.5f, heart.width + 3, heart.height + 3), HeartGlyph, Theme.Ink);
            Glyphs.Paint(heart, HeartGlyph, Color.white);
            Draw.Inked(new Rect(heart.xMax + 2 * unit, badge.y - 1, badge.xMax - heart.xMax - 6 * unit, badge.height), hp.ToString(), Mathf.Max(11, Mathf.RoundToInt(21 * unit)), Color.white, TextAnchor.MiddleCenter, Mathf.Max(1.2f, 1.8f * unit));
            Draw.Rect(new Rect(badge.xMax, bar.y, 2.5f * unit, bar.height), Theme.Ink);
            // Pips.
            float x0 = badge.xMax + (2.5f + pad) * unit, room = bar.xMax - pad * unit - x0, step = room / BasePips;
            float width = step - gapWidth * unit, height = bar.height - 2 * pad * unit;
            Color lit = low ? Color.Lerp(team, Theme.Damage, .6f) : team;
            // Every few seconds a glint runs along the pips that are left.
            float glint = Fx.ReducedMotion ? -9 : Mathf.Repeat(Time.unscaledTime / 5f + owner * .5f, 1) * 4.2f - .3f;
            for (int i = 0; i < BasePips; i++)
            {
                var pip = new Rect(x0 + i * step, bar.y + pad * unit, width, height);
                if (i < hp)
                {
                    Draw.Chip(pip, lit);
                    Draw.Rect(new Rect(pip.x + 1, pip.y + 1, pip.width - 2, Mathf.Max(1, pip.height * .36f)), new Color(1, 1, 1, .34f));
                    float near = Mathf.Abs((i + .5f) / BasePips - glint);
                    if (near < .11f) Draw.Chip(pip, new Color(1, 1, 1, .55f * (1 - near / .11f)));
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

        // W24: evenly spaced round beads along a segment (the trajectory).
        static void Beads(Vector2 start,Vector2 end,Color color,float size,float step)
        {
            foreach(var p in AimGuide.StrokeStamps(new AimPoint(start.x,start.y),new AimPoint(end.x,end.y),size,0,0,step))
                Draw.Circle(new Rect(p.x-size*.5f,p.y-size*.5f,size,size),color);
        }
        // Aim-only stroke: field-local coordinates, no GUI.matrix rotation.
        static void AimStroke(Vector2 start,Vector2 end,Color color,float width,float dash=0,float gap=0)
        {
            foreach(var p in AimGuide.StrokeStamps(new AimPoint(start.x,start.y),new AimPoint(end.x,end.y),width,dash,gap))
                Draw.Circle(new Rect(p.x-width*.5f,p.y-width*.5f,width,width),color);
        }

        static Color Alpha(Color color, float alpha) => new Color(color.r, color.g, color.b, alpha);
        // W19-04: the clipped play field in board-view space (labels stay inside it).
        static UiBox VisibleField(Rect board){Vector2 a=Point(board,Left,Top),b=Point(board,Right,Bottom);return BoardLabelLayout.Field(a.x,a.y,b.x,b.y);}
        static Rect RectOf(UiBox r)=>new Rect(r.x,r.y,r.width,r.height);
    }
}
