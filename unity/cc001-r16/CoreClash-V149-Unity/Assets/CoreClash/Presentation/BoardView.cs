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
        // The end-position marker is optional (HUD button or E). Default on.
        public static bool ShowStopEstimate = true;
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
            var state = simulation.State;
            bool dragging = aim != null && aim.Active;
            GUI.BeginGroup(rect);
            var board = new Rect(0, 0, rect.width, rect.height);
            Draw.Rect(board, Theme.BoardOuter);
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
            // Pass 1: bodies. Pass 2: plates and chips, so no ball hides another ball's information.
            drawn.Clear();
            foreach (var ball in state.balls)
                if (!ball.dead && !ball.banished)
                {
                    float renderX=ball.x,renderY=ball.y;
                    if(state.phase==MatchPhase.Moving&&remoteVisual!=null&&remoteVisual.TryGetPosition(ball.id,Time.unscaledTime,out var px,out var py)){renderX=px;renderY=py;}
                    bool replay=ReplayAffordance.Advertise(simulation,ball);
                    RenderThreat(clippedBoard,ball,renderX,renderY);
                    BallView.Render(clippedBoard,ball,simulation.Catalog.Ball(ball.type),replay,renderX,renderY,viewOwner,ball.id==highlightBallId);
                    drawn.Add((ball,renderX,renderY,replay));
                }
            foreach (var item in drawn) BallView.RenderBadges(clippedBoard,item.ball,item.replay,item.x,item.y,viewOwner,visible);
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

        static void RenderArena(Rect board)
        {
            Rect field = Box(board, Left, Top, Right - Left, Bottom - Top);
            float scale = board.width / 540;
            // Calm floor: darker toward both base walls, lighter at the centre line. No grid.
            Draw.VGradient(new Rect(field.x, field.y, field.width, field.height * .5f + .5f), Theme.FloorEdge, Theme.FloorCentre);
            Draw.VGradient(new Rect(field.x, field.y + field.height * .5f, field.width, field.height * .5f), Theme.FloorCentre, Theme.FloorEdge);
            RenderHomeZone(board, 1, Top, ZoneP2Bottom);
            RenderHomeZone(board, 0, ZoneP1Top, Bottom);

            // Centre: neutral (never a team colour). The ring is the rules' centre radius.
            Vector2 centre = Point(board, CentreX, CentreY);
            Color neutral = Theme.Centre;
            Line(board, Left, CentreY, CentreX - CentreRadius, CentreY, Theme.A(neutral, Theme.MidLine), 1.2f);
            Line(board, CentreX + CentreRadius, CentreY, Right, CentreY, Theme.A(neutral, Theme.MidLine), 1.2f);
            Draw.Circle(Box(board, CentreX - CentreRadius, CentreY - CentreRadius, CentreRadius * 2, CentreRadius * 2), Theme.A(neutral, Theme.CentreFill));
            Draw.Ring(centre, CentreRadius * scale, Theme.A(neutral, Theme.CentreRing), Mathf.Max(1.5f, 2.2f * scale));
            Draw.Ring(centre, (CentreRadius - 8) * scale, Theme.A(neutral, .12f), Mathf.Max(.8f, scale), 40, .5f);
            Draw.Circle(new Rect(centre.x - 3 * scale, centre.y - 3 * scale, 6 * scale, 6 * scale), Theme.A(neutral, .4f));
            int font = Mathf.Max(8, Mathf.RoundToInt(10 * scale));
            Draw.Text(new Rect(centre.x - 100 * scale, centre.y + (CentreRadius + 5) * scale, 200 * scale, font + 8), "CENTRE", font,
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
            Draw.VGradient(zone, baseAtViewTop ? near : far, baseAtViewTop ? far : near);
            Draw.Tile(zone, Pattern(owner == 0), Mathf.Max(20, 30 * scale), Theme.A(team, Theme.ZonePattern));
            float edge = owner == 0 ? top : bottom, inner = owner == 0 ? 5 : -5;
            Line(board, Left, edge, Right, edge, Theme.A(team, Theme.ZoneEdge), 2.2f);
            Line(board, Left, edge + inner, Right, edge + inner, Theme.A(team, .25f), 1);
            Vector2 corner = Point(board, Left, edge);
            int font = Mathf.Max(8, Mathf.RoundToInt(9 * scale));
            float height = font + 6;
            var label = new Rect(corner.x + 7 * scale, baseAtViewTop ? corner.y - 3 * scale - height : corner.y + 3 * scale, Mathf.Max(96, 150 * scale), height);
            Draw.Text(label, "P" + (owner + 1) + " HOME ZONE", font, Theme.A(team, Theme.ZoneLabel), TextAnchor.MiddleLeft, true);
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
            Draw.Circle(Box(board, 270 - 36, y - 36, 72, 72), Theme.A(Theme.Ink, .5f));
            Draw.Ring(center, 34 * scale, Theme.A(team, active ? .95f : .32f), Mathf.Max(1.5f, 2.2f * scale), owner == 1 ? Theme.P2RingSegments : 0, Theme.P2RingFill);
            if (active)
            {
                float pulse = 44 + Mathf.Sin(Time.unscaledTime * 3) * 2.5f;
                Draw.Ring(center, pulse * scale, Theme.A(team, .32f), Mathf.Max(1, 1.4f * scale));
                bool aimingHere = aim == null || !aim.Active || (Mathf.Abs(aim.OriginX - 270) < .1f && Mathf.Abs(aim.OriginY - y) < .1f);
                if (selected != null && aimingHere)
                {
                    float radius = Mathf.Max(9, selected.radius);
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
                    : zone.kind == "consecrated" ? new Color(1, .9f, .4f)
                    : zone.kind == "web" ? new Color(.4f, 1, .65f)
                    : zone.kind == "portal" ? new Color(.6f, .4f, 1)
                    : zone.kind == "blackHole" ? new Color(.45f, .2f, .8f) : new Color(.5f, .7f, .8f);
                bool dense = zone.kind == "portal" || zone.kind == "blackHole";
                var center = Point(board, zone.x, zone.y);
                Draw.Circle(Box(board, zone.x - zone.radius, zone.y - zone.radius, zone.radius * 2, zone.radius * 2), Theme.A(color, dense ? .45f : .17f));
                Draw.Ring(center, zone.radius * scale, Theme.A(color, dense ? .9f : .5f), Mathf.Max(1, 1.4f * scale));
                if (dense)
                    Draw.Circle(Box(board, zone.x - zone.radius * .68f, zone.y - zone.radius * .68f, zone.radius * 1.36f, zone.radius * 1.36f), new Color(.025f, .02f, .06f));
                if (zone.kind == "web") Draw.Text(Box(board, zone.x - 12, zone.y - 12, 24, 24), "+", 12, Color.white, TextAnchor.MiddleCenter);
                if(zone.kind=="embertrap"||zone.kind=="frosttrap"||zone.kind=="sporetrap")
                {
                    // Trap: the owner's ring pattern outside, the element symbol inside.
                    Draw.Ring(center,(zone.radius+3)*scale,Theme.A(Draw.Owner(zone.owner),.85f),Mathf.Max(1,1.5f*scale),zone.owner==1?Theme.P2RingSegments*2:0,Theme.P2RingFill);
                    float glyph=Mathf.Max(10,15*scale);
                    Glyphs.Paint(new Rect(center.x-glyph/2,center.y-glyph/2,glyph,glyph),fire?StatusKind.Fire:ice?StatusKind.Ice:StatusKind.Toxin,Theme.A(color,.95f));
                }
                else if(fire||ice||toxin)
                {
                    // Element field: the same symbol its status uses on a ball.
                    float glyph=Mathf.Max(11,18*scale);
                    Glyphs.Paint(new Rect(center.x-glyph/2,center.y-glyph/2,glyph,glyph),fire?StatusKind.Fire:ice?StatusKind.Ice:StatusKind.Toxin,Theme.A(color,.6f));
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
                Draw.Circle(Box(board, structure.x - radius + 2, structure.y - radius + 2, radius * 2 - 4, radius * 2 - 4), Theme.PanelRaised);
                Draw.Ring(center, radius * scale, Theme.A(team, .95f), Mathf.Max(1.5f, 2.4f * scale), structure.owner == 1 ? Theme.P2RingSegments : 0, Theme.P2RingFill);
                if(structure.kind=="bumper")Draw.Ring(center,(radius-5)*scale,new Color(1,.46f,.78f,.85f),Mathf.Max(1,scale));
                string symbol=structure.kind=="bumper"?"B":structure.kind=="engineerWall"?"E":"W";
                Draw.Text(Box(board, structure.x-radius,structure.y-radius+1,radius*2,12), symbol,
                    Mathf.Max(7,Mathf.RoundToInt(8*scale)),Theme.TextSoft,TextAnchor.MiddleCenter,true);
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
            float reach = (ball.radius + (ball.mineArmed ? 13 + beat * 3 : 13)) * scale;
            Draw.Circle(new Rect(center.x - reach, center.y - reach, reach * 2, reach * 2), Theme.A(Theme.Threat, .07f + beat * .06f));
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
            Line(board, Left, edge + travel, Right, edge + travel, Alpha(Draw.Owner(owner), alpha * .55f), 3);
        }
        static void RenderTurnCue(Rect board, GameState state, FeedbackTimeline feedback, bool dragging, List<UiBox> avoid)
        {
            if (!TurnCue(state, feedback, dragging, out float alpha, out _, out int owner)) return;
            float scale = board.width / 540;
            var field = BoardOverlayPlanner.Field(viewOwner, board.x, board.y, board.width);
            Color team = Draw.Owner(owner);
            string text = "PLAYER " + (owner + 1) + " · TURN " + feedback.TurnNumber;
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
            Draw.Chip(pill, Alpha(Theme.Plate, .88f * alpha), Alpha(team, alpha));
            Draw.Text(pill, text, font, Alpha(team, alpha), TextAnchor.MiddleCenter, true);
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
                case FeedbackClass.Defeat: case FeedbackClass.Structure: return Theme.TextSoft;
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
                Burst(kind==FeedbackClass.Damage?contact:origin,kind,age,scale,effect.ballId,veil);
                string text=FeedbackStyle.HasLabel(kind)?FeedbackStyle.Label(effect.kind,effect.text):"";
                if(text.Length==0)continue;
                bool number=FeedbackStyle.IsNumber(kind);
                int font=number?Mathf.Max(11,Mathf.RoundToInt((FeedbackStyle.Amount(effect.text)>=10?17:15)*scale)):Mathf.Max(9,Mathf.RoundToInt(11*scale));
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
                    Draw.Chip(rect,Theme.A(tint,.94f*fade),Theme.A(Theme.Ink,.9f*fade));
                    Draw.Text(rect,item.text,item.font,Theme.A(item.kind==FeedbackClass.Heal?Theme.Ink:Color.white,fade),TextAnchor.MiddleCenter,true);
                    continue;
                }
                Draw.Chip(rect,Theme.A(Theme.Plate,.88f*fade),Theme.A(tint,.85f*fade));
                float pad=0;
                if(EffectGlyph(item.kind,out var glyph))
                {
                    float size=rect.height-4;pad=size+2;
                    Glyphs.Paint(new Rect(rect.x+4,rect.y+2,size,size),glyph,Theme.A(tint,fade));
                }
                Draw.Text(new Rect(rect.x+pad,rect.y,rect.width-pad,rect.height),item.text,item.font,Theme.A(tint,fade),TextAnchor.MiddleCenter,true);
            }
        }

        static void Disc(Vector2 center,float radius,Color color){if(radius>0)Draw.Circle(new Rect(center.x-radius,center.y-radius,radius*2,radius*2),color);}
        static void Sparks(Vector2 origin,Color color,float age,float life,int count,float from,float to,float scale,int seed,float strength)
        {
            float t=Mathf.Clamp01(age/life);if(t>=1)return;
            float ease=1-(1-t)*(1-t),reach=(from+(to-from)*ease)*scale,size=Mathf.Max(2,3.2f*scale)*(1-t*.5f);
            for(int i=0;i<count;i++)
            {
                float angle=i*2*Mathf.PI/count+seed*.7f;
                var p=origin+new Vector2(Mathf.Cos(angle),Mathf.Sin(angle))*reach;
                Draw.Circle(new Rect(p.x-size/2,p.y-size/2,size,size),Theme.A(color,(1-t)*.9f*strength));
            }
        }
        static void Burst(Vector2 origin,FeedbackClass kind,float age,float scale,int seed,float strength)
        {
            Color tint=EffectColor(kind);
            switch(kind)
            {
                case FeedbackClass.Damage:
                {
                    // Contact: a white flash, then a tight red ring with a few sparks.
                    if(age<Theme.ImpactFlash){float flash=1-age/Theme.ImpactFlash;Disc(origin,(10+14*(1-flash))*scale,Theme.A(Color.white,.7f*flash*strength));}
                    float t=Mathf.Clamp01(age/.4f);
                    if(t<1){Draw.Ring(origin,(16+(Theme.ImpactRadius-16)*t)*scale,Theme.A(tint,(1-t)*.9f*strength),Mathf.Max(1.5f,2.6f*scale));Sparks(origin,tint,age,.4f,6,14,36,scale,seed,strength);}
                    break;
                }
                case FeedbackClass.Absorbed:
                case FeedbackClass.Shield:
                {
                    // Shield change: a segmented ring closes around the ball and lingers briefly.
                    float t=Mathf.Clamp01(age/Theme.ShieldPop),linger=Mathf.Clamp01((FeedbackTimeline.Life-age)/.5f);
                    Draw.Ring(origin,(42-14*t)*scale,Theme.A(tint,(t<1?.95f-.4f*t:.5f*linger)*strength),Mathf.Max(1.5f,2.5f*scale),6,.8f);
                    break;
                }
                case FeedbackClass.Heal:
                {
                    float t=Mathf.Clamp01(age/.5f);
                    if(t<1)Draw.Ring(origin,(40-16*t)*scale,Theme.A(tint,(1-t)*.8f*strength),Mathf.Max(1.5f,2.2f*scale));
                    break;
                }
                case FeedbackClass.Explosion:
                {
                    // Flash, then a shock ring with sparks. A stylised size: the event carries no radius.
                    if(age<Theme.ExplosionFlash)
                    {
                        float flash=1-age/Theme.ExplosionFlash;
                        Disc(origin,Theme.ExplosionRadius*(.35f+.65f*(1-flash))*scale,Theme.A(Theme.Threat,.45f*flash*strength));
                        Disc(origin,Theme.ExplosionRadius*.4f*(1-flash*.5f)*scale,Theme.A(Color.white,.7f*flash*strength));
                    }
                    float t=Mathf.Clamp01(age/.7f);
                    if(t<1)
                    {
                        float ease=1-(1-t)*(1-t);
                        Draw.Ring(origin,(20+(Theme.ExplosionRadius-20)*ease)*scale,Theme.A(Theme.Threat,(1-t)*strength),Mathf.Max(2,(1+5*(1-t))*scale));
                        Draw.Ring(origin,(10+(Theme.ExplosionRadius*.7f-10)*ease)*scale,Theme.A(Color.white,(1-t)*.5f*strength),Mathf.Max(1,2*scale));
                        Sparks(origin,Theme.Threat,age,.7f,(int)Theme.ExplosionSparks,20,Theme.ExplosionRadius*1.05f,scale,seed,strength);
                    }
                    break;
                }
                case FeedbackClass.Defeat:
                {
                    float t=Mathf.Clamp01(age/.6f);
                    if(t<1){Draw.Ring(origin,(28-18*t)*scale,Theme.A(Color.white,(1-t)*.8f*strength),Mathf.Max(1.5f,2*scale));Sparks(origin,tint,age,.6f,8,8,42,scale,seed,strength);}
                    break;
                }
                case FeedbackClass.BaseDamage:
                    break;
                default:
                {
                    // Status applied and other events: one ring in the event's colour.
                    float t=Mathf.Clamp01(age/.55f);
                    if(t<1)Draw.Ring(origin,(20+26*t)*scale,Theme.A(tint,(1-t)*.75f*strength),Mathf.Max(1.2f,2*scale));
                    break;
                }
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
            Color vector = preview.Ready ? Color.Lerp(team, Color.white, .45f) : Alpha(team, .5f);
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
                    AimStroke(from,to,under,Mathf.Max(4.5f,7.5f*scale));
                    AimStroke(from,to,i==1?vector:Alpha(vector,.6f),Mathf.Max(2,3.2f*scale),i==1?10*scale:5*scale,6*scale);
                    if(i==1&&path.Length>2)Draw.Ring(to,6*scale,Alpha(vector,.9f),Mathf.Max(1,1.4f*scale));
                }
                Vector2 tip=Point(board,path[path.Length-1].x,path[path.Length-1].y),last=Point(board,path[path.Length-2].x,path[path.Length-2].y);Vector2 direction=(tip-last).normalized;
                Vector2 wing = new Vector2(-direction.y, direction.x);
                AimStroke(tip-direction*13*scale+wing*7*scale,tip,under,Mathf.Max(4,6*scale));
                AimStroke(tip-direction*13*scale-wing*7*scale,tip,under,Mathf.Max(4,6*scale));
                AimStroke(tip-direction*13*scale+wing*7*scale,tip,vector,Mathf.Max(1.6f,2.8f*scale));
                AimStroke(tip-direction*13*scale-wing*7*scale,tip,vector,Mathf.Max(1.6f,2.8f*scale));
                float pull=(finger-origin).magnitude;
                if(pull>clear+4)AimStroke(origin+(finger-origin)/pull*clear,finger,Alpha(team,Theme.AimPull),Mathf.Max(1,1.4f*scale),4*scale,5*scale);
                if(preview.Ready&&ShowStopEstimate)RenderStopEstimate(board,state,aim,selected,replay,catalog,vector,scale);
            }
            Draw.Ring(finger, 11 * scale, under, Mathf.Max(2.5f, 3.8f * scale));
            Draw.Ring(finger, 10 * scale, Alpha(team, .9f), Mathf.Max(1.2f, 1.8f * scale));
            Draw.Circle(new Rect(finger.x - 2.5f * scale, finger.y - 2.5f * scale, 5 * scale, 5 * scale), new Color(.89f, .98f, 1, .95f));

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
            if(!baseReport.Visible||state.phase==MatchPhase.Moving||(aim!=null&&aim.Active))return;
            float scale=board.width/540;var field=VisibleField(board);
            for(int owner=0;owner<2;owner++)
            {
                var lines=BaseDamageTracker.Lines(baseReport.Latest,owner,type=>simulation.Catalog.Ball(type)?.name??type);if(lines.Length==0)continue;
                var plan=BoardOverlayPlanner.Banner(lines,owner,viewOwner,field,scale,avoid);
                if(!plan.Placed){marginNotes.Add((plan.Top,lines[0],Theme.Damage));continue;}
                var rect=RectOf(plan.Box);Draw.Chip(rect,Alpha(Theme.Plate,.9f),Alpha(Theme.Damage,.7f));
                if(plan.TwoLines)
                {
                    Draw.Text(new Rect(rect.x,rect.y+2,rect.width,plan.LineHeight),lines[0],plan.Font,Theme.Damage,TextAnchor.MiddleCenter,true);
                    Draw.Text(new Rect(rect.x,rect.y+plan.LineHeight+2,rect.width,plan.LineHeight),lines[1],Mathf.Max(8,plan.Font-1),Theme.Text,TextAnchor.MiddleCenter,false);
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
            string label=ReplayAffordance.CounterLabel(state.turn,ReplayAffordance.Eligible(simulation).Count);if(label.Length==0)return;
            var plan=BoardOverlayPlanner.Counter(label,state.turn,viewOwner,VisibleField(board),board.width/540,avoid);
            if(!plan.Placed){marginNotes.Add((plan.Top,label,Draw.Gold));return;}
            var rect=RectOf(plan.Box);
            Draw.Chip(rect,Alpha(Theme.Plate,.9f),Alpha(Draw.Gold,.7f));
            Draw.Text(rect,label,plan.Font,Draw.Gold,TextAnchor.MiddleCenter,true);
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
                Draw.Rect(rect,Alpha(Theme.Plate,.95f));Draw.Text(rect,n.text,font,n.color,TextAnchor.MiddleCenter,true);
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
            for(int i=1;i<e.Path.Count;i++)AimStroke(Point(board,e.Path[i-1].x,e.Path[i-1].y),Point(board,e.Path[i].x,e.Path[i].y),Alpha(vector,.2f),Mathf.Max(1,1.2f*scale),3*scale,6*scale);
            Vector2 stop=Point(board,e.StopX,e.StopY);float r=e.Start.Radius*scale;
            Draw.Ring(stop,r+scale,Alpha(Theme.Ink,.5f),Mathf.Max(2.5f,3.6f*scale));
            Draw.Ring(stop,r,mark,Mathf.Max(1,1.6f*scale),12,.6f);
            AimStroke(stop-new Vector2(r*.45f,0),stop+new Vector2(r*.45f,0),mark,Mathf.Max(1,1.2f*scale));
            AimStroke(stop-new Vector2(0,r*.45f),stop+new Vector2(0,r*.45f),mark,Mathf.Max(1,1.2f*scale));
            string label=StopPredictor.Label(e);int font=Mathf.Max(9,Mathf.RoundToInt(11*scale));
            float w=label.Length*font*.6f+12,h=font+8,room=VisibleField(board).width-8;
            // On a very small board the full label is wider than the field: two lines instead of a cut line.
            if(w>room){w=room;h=2*(font+2)+8;}
            // W20: the label keeps to the field (W19-04) and now also moves off balls and their plates.
            var standard=BoardLabelLayout.Fit(VisibleField(board),stop.x,stop.y+r+4,stop.y-r-4-h,w,h);
            var rect=RectOf(BoardLabelLayout.FitAvoiding(standard,VisibleField(board),stop.x,stop.y+r+4,stop.y-r-4-h,w,h,BoardKeepOuts(board,state),h+2));
            Draw.Chip(rect,Alpha(Theme.Plate,.82f));Draw.Text(rect,label,font,mark,TextAnchor.MiddleCenter,true);
        }

        // Frame: neutral side walls; each base wall carries its player's colour and that
        // base's HP bar in the outer band (flashes on a real BASE_DAMAGE event).
        static void RenderFrame(Rect board, GameState state, FeedbackTimeline feedback)
        {
            Color rim = Alpha(Theme.Rim, Theme.RimAlpha);
            Line(board, Left, Top, Left, Bottom, rim, 2.4f);
            Line(board, Right, Top, Right, Bottom, rim, 2.4f);
            for (int owner = 0; owner < 2; owner++)
            {
                Color team = Draw.Owner(owner);
                float wall = owner == 0 ? Bottom : Top, band = owner == 0 ? Bottom + 8 : Top - 8;
                float from = Left + 4, span = Right - Left - 8;
                Line(board, Left, wall, Right, wall, Alpha(team, .95f), 2.6f);
                Line(board, from, band, from + span, band, Alpha(team, .2f), 7);
                float hp = Mathf.Clamp01(state.players[owner].hp / 20f);
                if (hp > 0) Line(board, from, band, from + span * hp, band, Alpha(team, .95f), 7);
                for (int i = 1; i < 4; i++) Line(board, from + span * i / 4, band - 4, from + span * i / 4, band + 4, Theme.BoardOuter, 1.6f);
                float flash = BaseFlash(feedback, owner);
                if (flash > 0)
                {
                    Line(board, Left, wall, Right, wall, Alpha(Theme.Damage, flash), 6);
                    Line(board, from, band, from + span, band, Alpha(Color.white, flash * .6f), 7);
                }
            }
            // Corner brackets make the playable boundary unmistakable.
            foreach (float x in new[] { Left, Right })
            foreach (float y in new[] { Top, Bottom })
            {
                float inX = x == Left ? 20 : -20, inY = y == Top ? 20 : -20;
                Line(board, x, y, x + inX, y, Theme.Rim, 3.6f);
                Line(board, x, y, x, y + inY, Theme.Rim, 3.6f);
            }
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
