using System.Collections.Generic;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Input;
using UnityEngine;

namespace CoreClash.Presentation
{
    public static class BoardView
    {
        const float Left = 24.3f, Right = 515.7f, Top = 16, Bottom = 884;
        static readonly Color Floor = new Color(.039f, .078f, .122f);
        static readonly Dictionary<int, Texture2D> RingSprites = new Dictionary<int, Texture2D>();
        static int viewOwner;

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
            FeedbackTimeline feedback=null,RemoteBallSmoother remoteVisual=null,int localOwner=0)
        {
            int previousViewOwner=viewOwner;viewOwner=localOwner==1?1:0;
            var state = simulation.State;
            GUI.BeginGroup(rect);
            var board = new Rect(0, 0, rect.width, rect.height);
            Draw.Rect(board, new Color(.025f, .045f, .075f));
            RenderArena(board);

            // Clip gameplay glows and effects to the actual field, as in the V148 canvas.
            Rect field = Box(board, Left, Top, Right - Left, Bottom - Top);
            GUI.BeginGroup(field);
            var clippedBoard = new Rect(-field.x, -field.y, board.width, board.height);
            for (int owner = 0; owner < 2; owner++) RenderLauncher(clippedBoard, state, owner, aim, selected);
            RenderZones(clippedBoard, state);
            RenderStructures(clippedBoard, state);
            foreach (var ball in state.balls)
                if (!ball.dead && !ball.banished)
                {
                    float renderX=ball.x,renderY=ball.y;
                    if(state.phase==MatchPhase.Moving&&remoteVisual!=null&&remoteVisual.TryGetPosition(ball.id,Time.unscaledTime,out var px,out var py)){renderX=px;renderY=py;}
                    if(ball.mineArmed)Ring(Point(clippedBoard,renderX,renderY),(ball.radius+11)*board.width/540,new Color(.79f,.31f,1,.82f),Mathf.Max(1,board.width/540));
                    if(ball.timeBombArmed)Ring(Point(clippedBoard,renderX,renderY),(ball.radius+9)*board.width/540,new Color(1,.65f,.25f,.85f),Mathf.Max(1.5f,2*board.width/540));
                    BallView.Render(clippedBoard,ball,simulation.Catalog.Ball(ball.type),ReplayAffordance.Advertise(simulation,ball),renderX,renderY,viewOwner);
                }
            RenderEvents(clippedBoard,feedback);
            RenderReplayCounter(clippedBoard,simulation);
            RenderBaseReport(clippedBoard,simulation);
            if (state.phase == MatchPhase.Aiming && aim != null && aim.Active) RenderAim(clippedBoard, state, aim,selected,simulation.Catalog);
            GUI.EndGroup();

            RenderFrame(board,state);
            GUI.EndGroup();
            viewOwner=previousViewOwner;
        }

        static void RenderArena(Rect board)
        {
            Draw.Rect(Box(board, Left, Top, Right - Left, Bottom - Top), Floor);
            for (int i = 0; i < 18; i++)
            {
                float y = Top + (Bottom - Top) * i / 18;
                float edge = Mathf.Abs((i + .5f) / 18 * 2 - 1);
                Draw.Rect(Box(board, Left, y, Right - Left, (Bottom - Top) / 18 + .5f),
                    Color.Lerp(Floor, new Color(.063f, .102f, .157f), edge * edge));
            }
            for (float x = Left + 36; x < Right; x += 36)
                Line(board, x, Top, x, Bottom, new Color(.59f, .75f, .86f, .028f), .6f);
            for (float y = Top + 36; y < Bottom; y += 36)
                Line(board, Left, y, Right, y, new Color(.59f, .75f, .86f, .028f), .6f);

            RenderHomeZone(board, 1, Top, 198);
            RenderHomeZone(board, 0, 702, Bottom);
            var center = Point(board, 270, 450);
            float scale = board.width / 540;
            Draw.Circle(Box(board, 140, 320, 260, 260), new Color(.65f, .84f, 1, .015f));
            Draw.Circle(Box(board, 160, 340, 220, 220), new Color(.65f, .84f, 1, .035f));
            Ring(center, 110 * scale, new Color(.84f, .94f, 1, .48f), Mathf.Max(1, 1.6f * scale));
            Ring(center, 79 * scale, new Color(.71f, .85f, .97f, .12f), Mathf.Max(.7f, scale));
            Ring(center, 46 * scale, new Color(.71f, .85f, .97f, .09f), Mathf.Max(.7f, scale));
            Ring(center, 17.6f * scale, new Color(.76f, .9f, 1, .18f), Mathf.Max(.7f, scale));
            DashedLine(Point(board, 160, 450), Point(board, 380, 450), new Color(.7f, .87f, 1, .1f), Mathf.Max(.7f, scale), 3 * scale, 7 * scale);
            DashedLine(Point(board, 270, 340), Point(board, 270, 560), new Color(.7f, .87f, 1, .1f), Mathf.Max(.7f, scale), 3 * scale, 7 * scale);
            Draw.Text(Box(board, 170, 571, 200, 24), "CORE CLASH", Mathf.Max(8, Mathf.RoundToInt(11 * scale)),
                new Color(.53f, .69f, .81f, .21f), TextAnchor.MiddleCenter, true);
        }

        static void RenderHomeZone(Rect board, int owner, float top, float bottom)
        {
            Color team = Draw.Owner(owner);
            const int bands = 12;
            for (int i = 0; i < bands; i++)
            {
                float progress = (i + .5f) / bands;
                float strength = owner == 0 ? progress : 1 - progress;
                Draw.Rect(Box(board, Left, top + (bottom - top) * i / bands, Right - Left, (bottom - top) / bands + .5f),
                    Alpha(team, .025f + strength * .11f));
            }
            float edge = owner == 0 ? top : bottom;
            Line(board, Left, edge, Right, edge, Alpha(team, .38f), 1.4f);
            float direction = owner == 0 ? -1 : 1;
            for (float x = Left + 18; x < Right - 12; x += 30)
            {
                Line(board, x - 5, edge - direction * 5, x, edge, Alpha(team, .2f), 1);
                Line(board, x, edge, x + 5, edge - direction * 5, Alpha(team, .2f), 1);
            }
        }

        static void RenderLauncher(Rect board, GameState state, int owner, LaunchGesture aim, BallDefinition selected)
        {
            float scale = board.width / 540;
            float y = owner == 0 ? 853 : 47;
            float wallY = owner == 0 ? Bottom : Top;
            Color team = Draw.Owner(owner);
            bool active = state.turn == owner && state.phase == MatchPhase.Aiming;
            var center = Point(board, 270, y);
            Draw.Rect(Box(board, 248, Mathf.Min(y, wallY), 44, Mathf.Abs(y - wallY)), Alpha(team, .055f));
            Line(board, 248, y, 248, wallY, Alpha(team, .23f), 1);
            Line(board, 292, y, 292, wallY, Alpha(team, .23f), 1);
            Draw.Circle(Box(board, 209, y - 61, 122, 122), Alpha(team, .035f));
            Ring(center, 61 * scale, Alpha(team, .13f), Mathf.Max(.7f, scale));
            Ring(center, 37 * scale, Alpha(team, active ? .29f : .11f), Mathf.Max(.7f, scale));
            Ring(center, 27 * scale, Alpha(team, active ? .88f : .21f), Mathf.Max(1, 1.5f * scale));
            float tickY = y + (owner == 0 ? -1 : 1) * 78;
            Line(board, 258, tickY, 282, tickY, Alpha(team, active ? .47f : .16f), 1);

            if (active)
            {
                float pulse = 42 + Mathf.Sin(Time.unscaledTime * 3) * 1.5f;
                Ring(center, pulse * scale, Alpha(team, .14f), Mathf.Max(.7f, scale));
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
            foreach (var zone in state.zones)
            {
                if (zone.dead) continue;
                Color color = (zone.kind == "embertrap" || zone.kind == "furnaceFire" || zone.kind.Contains("fire")) ? new Color(1, .25f, .1f, .25f)
                    : (zone.kind == "frosttrap" || zone.kind.Contains("ice")) ? new Color(.3f, .9f, 1, .25f)
                    : (zone.kind == "sporetrap" || zone.kind == "blight") ? new Color(.4f, .7f, .1f, .22f)
                    : zone.kind == "consecrated" ? new Color(1, .9f, .4f, .22f)
                    : zone.kind == "web" ? new Color(.4f, 1, .65f, .3f)
                    : zone.kind == "portal" ? new Color(.6f, .4f, 1, .55f)
                    : zone.kind == "blackHole" ? new Color(.45f, .2f, .8f, .4f) : new Color(.5f, .7f, .8f, .2f);
                Draw.Circle(Box(board, zone.x - zone.radius, zone.y - zone.radius, zone.radius * 2, zone.radius * 2), color);
                if (zone.kind == "portal" || zone.kind == "blackHole")
                    Draw.Circle(Box(board, zone.x - zone.radius * .68f, zone.y - zone.radius * .68f, zone.radius * 1.36f, zone.radius * 1.36f), new Color(.025f, .02f, .06f));
                if (zone.kind == "web") Draw.Text(Box(board, zone.x - 12, zone.y - 12, 24, 24), "+", 12, Color.white, TextAnchor.MiddleCenter);
                if(zone.kind=="embertrap"||zone.kind=="frosttrap"||zone.kind=="sporetrap")
                {
                    float scale=board.width/540;
                    Ring(Point(board,zone.x,zone.y),zone.radius*scale,Alpha(Draw.Owner(zone.owner),.8f),Mathf.Max(1,scale));
                    string mark=zone.kind=="embertrap"?"F":zone.kind=="frosttrap"?"I":"T";
                    Draw.Text(Box(board,zone.x-16,zone.y-12,32,24),mark+"1",Mathf.Max(8,Mathf.RoundToInt(11*scale)),Color.white,TextAnchor.MiddleCenter,true);
                }
            }
        }

        static void RenderStructures(Rect board, GameState state)
        {
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
                Draw.Circle(Box(board, structure.x - radius, structure.y - radius, radius * 2, radius * 2), Alpha(team, .72f));
                Draw.Circle(Box(board, structure.x - radius + 2, structure.y - radius + 2, radius * 2 - 4, radius * 2 - 4), new Color(.07f, .13f, .18f));
                if(structure.kind=="bumper")Ring(Point(board,structure.x,structure.y),(radius-5)*board.width/540,new Color(1,.46f,.78f,.85f),Mathf.Max(1,board.width/540));
                string symbol=structure.kind=="bumper"?"B":structure.kind=="engineerWall"?"E":"W";
                Draw.Text(Box(board, structure.x-radius,structure.y-radius+1,radius*2,12), "P"+(structure.owner+1),
                    Mathf.Max(7,Mathf.RoundToInt(8*board.width/540)),Color.white,TextAnchor.MiddleCenter,true);
                Draw.Text(Box(board, structure.x-radius,structure.y-9,radius*2,18), symbol+":"+structure.hp+"/"+structure.maxHp,
                    Mathf.Max(7,Mathf.RoundToInt(8*board.width/540)),Color.white,TextAnchor.MiddleCenter,true);
            }
        }

        static void RenderEvents(Rect board,FeedbackTimeline feedback)
        {
            if(feedback==null)return;float scale=board.width/540;
            var labels=new List<Rect>();
            foreach(var effect in feedback.Items.TakeLast(8).Reverse()){
                float age=Time.unscaledTime-effect.born,fade=Mathf.Clamp01((1.15f-age)/.45f);
                Color color=effect.kind=="DAMAGE"||effect.kind=="BASE_DAMAGE"?Draw.Pink:effect.kind=="HEAL"||effect.kind=="ROOTED"||effect.kind=="CLEANSE"?new Color(.5f,1,.63f):effect.kind=="SHIELD"?Draw.Cyan:effect.kind=="CONSUME"||effect.kind=="TRANSFORM"||effect.kind=="PORTAL"?new Color(.77f,.57f,1):Draw.Gold;
                var origin=Point(board,effect.x,effect.y);float pulse=Mathf.Clamp01(age/.65f);
                Ring(origin,(18+48*pulse)*scale,Alpha(color,(1-pulse)*.7f),Mathf.Max(1,2*scale));
                if(age<.55f){
                    Draw.Circle(new Rect(origin.x-18*scale,origin.y-18*scale,36*scale,36*scale),Alpha(color,(1-age/.55f)*.18f));
                    for(int i=0;i<8;i++){float angle=i*Mathf.PI/4+effect.ballId*.3f,r=(15+age*65)*scale;var p=origin+new Vector2(Mathf.Cos(angle),Mathf.Sin(angle))*r;Draw.Circle(new Rect(p.x-1.5f,p.y-1.5f,3,3),Alpha(color,(1-age/.55f)*.8f));}
                }
                string text=effect.kind=="DEATH"?"DEFEATED":effect.kind=="RETURN"?"RETURN":effect.kind=="ROOTED"?"ROOTED":effect.kind=="CLEANSE"?"CLEANSED":effect.kind=="CONSUME"?"CONSUMED":effect.kind=="TRANSFORM"?"TRANSFORM":effect.text;
                var point=origin+new Vector2(0,-(25+age*28)*scale);
                int font=Mathf.Max(10,Mathf.RoundToInt(14*scale));float width=Mathf.Min(146,(text?.Length??0)*font*.62f+12);var label=new Rect(point.x-width/2,point.y-12,width,22);
                if(!labels.Any(r=>r.Overlaps(label))){labels.Add(label);Draw.Round(label,new Color(.018f,.035f,.055f,.64f*fade));Draw.Text(label,text,font,Alpha(color,fade),TextAnchor.MiddleCenter,true);}
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
            Color vector = preview.Ready ? Color.Lerp(team, Color.white, .36f) : Alpha(team, .42f);
            Ring(origin, 30 * scale, Alpha(team, .7f), Mathf.Max(1, 1.7f * scale));

            if (preview.Distance > 1)
            {
                var path=preview.Path;
                if(!preview.Valid)return;
                for(int i=1;i<path.Length;i++){
                    var from=Point(board,path[i-1].x,path[i-1].y);var to=Point(board,path[i].x,path[i].y);
                    AimStroke(from,to,Alpha(team,i==1?.13f:.07f),Mathf.Max(2,7*scale),7*scale,1*scale);
                    AimStroke(from,to,i==1?vector:Alpha(vector,.5f),Mathf.Max(1,2*scale),i==1?7*scale:4*scale,7*scale);
                    if(i==1&&path.Length>2)Ring(to,6*scale,Alpha(vector,.8f),Mathf.Max(1,scale));
                }
                Vector2 tip=Point(board,path[path.Length-1].x,path[path.Length-1].y),last=Point(board,path[path.Length-2].x,path[path.Length-2].y);Vector2 direction=(tip-last).normalized;
                Vector2 wing = new Vector2(-direction.y, direction.x);
                AimStroke(tip-direction*11*scale+wing*6*scale,tip,vector,Mathf.Max(1,2.2f*scale));
                AimStroke(tip-direction*11*scale-wing*6*scale,tip,vector,Mathf.Max(1,2.2f*scale));
                Draw.Circle(new Rect(tip.x-2.5f*scale,tip.y-2.5f*scale,5*scale,5*scale),vector);
                AimStroke(origin,finger,Alpha(team,.14f),Mathf.Max(.7f,scale));
                if(preview.Ready)RenderStopEstimate(board,state,aim,selected,replay,catalog,vector,scale);
            }
            Ring(finger, 10 * scale, Alpha(team, .65f), Mathf.Max(1, 1.5f * scale));
            Draw.Circle(new Rect(finger.x - 2.5f * scale, finger.y - 2.5f * scale, 5 * scale, 5 * scale), new Color(.89f, .98f, 1, .9f));

            // A10-approved W10 presentation: trajectory length/tint is the only board power cue.
            // Readiness wording lives in MatchView so the board remains unobscured.
        }

        // W18-03 (#288): why each base lost HP last turn (BaseDamageTracker reads
        // only authoritative events). Shown from the turn end until the next launch.
        static BaseDamageTracker baseReport;
        static GameSimulation baseReportSimulation;
        static void RenderBaseReport(Rect board,GameSimulation simulation)
        {
            if(!ReferenceEquals(simulation,baseReportSimulation)){baseReport=new BaseDamageTracker();baseReportSimulation=simulation;}
            var state=simulation.State;baseReport.Observe(state);
            if(!baseReport.Visible||state.phase==MatchPhase.Moving)return;
            float scale=board.width/540;int font=Mathf.Max(9,Mathf.RoundToInt(11*scale));float h=font+7;
            for(int owner=0;owner<2;owner++)
            {
                var lines=BaseDamageTracker.Lines(baseReport.Latest,owner,type=>simulation.Catalog.Ball(type)?.name??type);if(lines.Length==0)continue;
                Vector2 anchor=Point(board,270,owner==0?760:140);
                float w=Mathf.Min(board.width-16,Mathf.Max(lines[0].Length,lines[1].Length)*font*.58f+16);
                var rect=new Rect(Mathf.Clamp(anchor.x-w/2,board.x+8,board.xMax-w-8),anchor.y-h,w,h*2+4);
                Draw.Round(rect,new Color(.018f,.035f,.055f,.8f));
                Draw.Text(new Rect(rect.x,rect.y+2,w,h),lines[0],font,Draw.Pink,TextAnchor.MiddleCenter,true);
                Draw.Text(new Rect(rect.x,rect.y+h+2,w,h),lines[1],Mathf.Max(8,font-1),Color.white,TextAnchor.MiddleCenter,false);
            }
        }

        // W18-02 (#287): how many own balls the acting player may Replay now
        // (canonical CanReplay only), next to that player's launcher.
        static void RenderReplayCounter(Rect board,GameSimulation simulation)
        {
            var state=simulation.State;if(state.phase!=MatchPhase.Aiming)return;
            string label=ReplayAffordance.CounterLabel(state.turn,ReplayAffordance.Eligible(simulation).Count);if(label.Length==0)return;
            float scale=board.width/540;int font=Mathf.Max(9,Mathf.RoundToInt(11*scale));
            Vector2 anchor=Point(board,Left+8,state.turn==0?Bottom-26:Top+26);
            float w=Mathf.Min(board.width*.5f,label.Length*font*.58f+14),h=font+8;
            var rect=new Rect(anchor.x,anchor.y-h/2,w,h);
            Draw.Round(rect,new Color(.018f,.035f,.055f,.78f));
            Draw.Text(rect,label,font,Draw.Gold,TextAnchor.MiddleCenter,true);
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
            Color mark=Alpha(vector,e.Obstructed?.38f:.72f);
            for(int i=1;i<e.Path.Count;i++)AimStroke(Point(board,e.Path[i-1].x,e.Path[i-1].y),Point(board,e.Path[i].x,e.Path[i].y),Alpha(vector,.16f),Mathf.Max(1,1.2f*scale),3*scale,6*scale);
            Vector2 stop=Point(board,e.StopX,e.StopY);float r=e.Start.Radius*scale;
            Ring(stop,r,mark,Mathf.Max(1,1.6f*scale));
            AimStroke(stop-new Vector2(r*.45f,0),stop+new Vector2(r*.45f,0),mark,Mathf.Max(1,1.2f*scale));
            AimStroke(stop-new Vector2(0,r*.45f),stop+new Vector2(0,r*.45f),mark,Mathf.Max(1,1.2f*scale));
            string label=StopPredictor.Label(e);int font=Mathf.Max(9,Mathf.RoundToInt(11*scale));
            float w=Mathf.Min(board.width-8,label.Length*font*.6f+12),h=font+8;
            float lx=Mathf.Clamp(stop.x-w/2,board.x+4,board.xMax-w-4),ly=stop.y+r+4;if(ly+h>board.yMax-4)ly=stop.y-r-4-h;
            var rect=new Rect(lx,ly,w,h);
            Draw.Round(rect,new Color(.018f,.035f,.055f,.62f));Draw.Text(rect,label,font,mark,TextAnchor.MiddleCenter,true);
        }

        static void RenderFrame(Rect board, GameState state)
        {
            Color rim = new Color(.73f, .87f, .97f, .42f);
            Line(board, Left, Top, Right, Top, rim, 2);
            Line(board, Left, Bottom, Right, Bottom, rim, 2);
            Line(board, Left, Top, Left, Bottom, rim, 2);
            Line(board, Right, Top, Right, Bottom, rim, 2);
            Line(board, Left + 2, Top + 2, Left + 2, Bottom - 2, new Color(.33f, .5f, .64f, .27f), .8f);
            Line(board, Right - 2, Top + 2, Right - 2, Bottom - 2, new Color(.33f, .5f, .64f, .27f), .8f);
            for (int owner = 0; owner < 2; owner++)
            {
                float y = owner == 0 ? Bottom - 2 : Top + 2;
                Color team = Draw.Owner(owner);
                Line(board, Left + 5, y, Right - 5, y, Alpha(team, .16f), 5);
                float hp = Mathf.Clamp01(state.players[owner].hp / 20f);
                Line(board, Left + 5, y, Left + 5 + (Right - Left - 10) * hp, y, Alpha(team, .75f), 3);
            }
        }

        static void Line(Rect board, float x1, float y1, float x2, float y2, Color color, float width)
            => Draw.Line(Point(board, x1, y1), Point(board, x2, y2), color, Mathf.Max(.65f, width * board.width / 540));

        static void Ring(Vector2 center, float radius, Color color, float width)
        {
            if (radius <= 0) return;
            int key = Mathf.Max(1, Mathf.RoundToInt(width / radius * 2048));
            if (!RingSprites.TryGetValue(key, out var sprite))
            {
                const int size = 128;
                sprite = new Texture2D(size, size, TextureFormat.RGBA32, false)
                {
                    name = "Core Clash arena outline", filterMode = FilterMode.Bilinear,
                    wrapMode = TextureWrapMode.Clamp, hideFlags = HideFlags.HideAndDontSave
                };
                float inner = size * .5f - Mathf.Max(.6f, key / 2048f * size * .5f);
                var pixels = new Color[size * size];
                for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                {
                    float distance = Vector2.Distance(new Vector2(x + .5f, y + .5f), new Vector2(size * .5f, size * .5f));
                    pixels[y * size + x] = new Color(1, 1, 1, Mathf.Clamp01(size * .5f - distance) * Mathf.Clamp01(distance - inner + 1));
                }
                sprite.SetPixels(pixels);
                sprite.Apply(false, true);
                RingSprites.Add(key, sprite);
            }
            Color old = GUI.color;
            GUI.color = color;
            GUI.DrawTexture(new Rect(center.x - radius, center.y - radius, radius * 2, radius * 2), sprite);
            GUI.color = old;
        }

        // Aim-only stroke: field-local coordinates, no GUI.matrix rotation.
        static void AimStroke(Vector2 start,Vector2 end,Color color,float width,float dash=0,float gap=0)
        {
            foreach(var p in AimGuide.StrokeStamps(new AimPoint(start.x,start.y),new AimPoint(end.x,end.y),width,dash,gap))
                Draw.Circle(new Rect(p.x-width*.5f,p.y-width*.5f,width,width),color);
        }

        static void DashedLine(Vector2 start, Vector2 end, Color color, float width, float dash, float gap)
        {
            Vector2 delta = end - start;
            float length = delta.magnitude;
            if (length < .01f || dash <= 0) return;
            Vector2 direction = delta / length;
            for (float position = 0; position < length; position += dash + gap)
                Draw.Line(start + direction * position, start + direction * Mathf.Min(position + dash, length), color, width);
        }

        static Color Alpha(Color color, float alpha) => new Color(color.r, color.g, color.b, alpha);
    }
}
