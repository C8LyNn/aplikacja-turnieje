using System;
using System.Collections.Generic;
using CoreClash.Core;
namespace CoreClash.Presentation
{
    // CC-001 W19-04: board labels (EST. STOP, Replay counter, base report) must
    // stay inside the VISIBLE field. Seen on the real a40e4a0 Windows Player:
    // "EST. STOP · ENEMY HALF" was cut at the right wall because labels were
    // clamped to the whole board rect, which is wider than the clipped field.
    public static class BoardLabelLayout
    {
        // Field corners in board-view space (either perspective) -> rectangle.
        public static UiBox Field(float ax,float ay,float bx,float by)=>new UiBox(Math.Min(ax,bx),Math.Min(ay,by),Math.Abs(bx-ax),Math.Abs(by-ay));

        // A label of preferred width centred on cx, placed at preferredY (top
        // edge) or, when that would leave the field, at fallbackY; then clamped
        // inside the field with `margin`. Width shrinks only if the field is
        // narrower than the label.
        public static UiBox Fit(UiBox field,float cx,float preferredY,float fallbackY,float width,float height,float margin=4)
        {
            float w=Math.Max(1,Math.Min(width,field.width-2*margin)),h=Math.Max(1,Math.Min(height,field.height-2*margin));
            float minX=field.x+margin,maxX=field.Right-margin-w,minY=field.y+margin,maxY=field.Bottom-margin-h;
            float y=preferredY;if(y<minY||y>maxY)y=fallbackY;
            return new UiBox(Clamp(cx-w/2,minX,maxX),Clamp(y,minY,maxY),w,h);
        }
        static float Clamp(float v,float min,float max)=>max<min?min:Math.Max(min,Math.Min(max,v));

        // W20: a label that would cover a ball or its plates moves to the first free
        // position instead: the preferred side, the fallback side, then further away from
        // the anchor in steps. `standard` (the plain Fit result) is kept when nothing is free.
        public static UiBox FitAvoiding(UiBox standard,UiBox field,float cx,float preferredY,float fallbackY,float width,float height,IReadOnlyList<UiBox> avoid,float step,int tries=6,float margin=4)
        {
            if(avoid==null||avoid.Count==0||step<=0)return standard;
            float w=Math.Max(1,Math.Min(width,field.width-2*margin)),h=Math.Max(1,Math.Min(height,field.height-2*margin));
            float minY=field.y+margin,maxY=field.Bottom-margin-h,x=Clamp(cx-w/2,field.x+margin,field.Right-margin-w);
            float away=preferredY>=fallbackY?1:-1;
            for(int k=0;k<=tries;k++)
                for(int side=0;side<2;side++)
                {
                    float y=side==0?preferredY+away*k*step:fallbackY-away*k*step;
                    if(y<minY||y>maxY)continue;
                    var box=new UiBox(x,y,w,h);bool hit=false;
                    foreach(var other in avoid)if(Overlaps(box,other)){hit=true;break;}
                    if(!hit)return box;
                }
            return standard;
        }

        // CC-001 W19-05: collision-aware slots for the base-damage banner and the
        // Replay counter. Seen on the real d95ae7a Player: the banner covered a
        // home ball and its Replay "R" chip, and the counter sat on the launcher.

        // Everything BallView draws around a ball (owner ring, Replay pulse and chip,
        // threat badge, HP plate and an optional status row below), in view space.
        // W20: conservative estimate for callers without the ball; KeepOuts uses the
        // exact BallBadges.Layout bounds of each ball.
        public static UiBox BallKeepOut(float cx,float cy,float radius,float scale,int statusRows)
        {
            float rowH=BallBadges.RowHeight(scale),ring=BallBadges.RingOut(scale),gap=Math.Max(1f,1.5f*scale),pad=4*scale;
            float reach=radius+ring+BallBadges.ReplayPulse(scale);
            float halfW=Math.Max(reach,Math.Max(radius*.3f+BallBadges.ReplayChip(scale),radius*.35f+BallBadges.ThreatSize(scale)));
            halfW=Math.Max(halfW,rowH*(statusRows>0?2.6f:1.9f));
            float top=Math.Max(reach,radius+Math.Max(BallBadges.ReplayChip(scale),BallBadges.ThreatSize(scale))*.55f);
            float bottom=Math.Max(reach,radius+ring+gap+(1+Math.Max(0,statusRows))*(rowH+gap));
            halfW+=pad;top+=pad;bottom+=pad;
            return new UiBox(cx-halfW,cy-top,halfW*2,top+bottom);
        }
        // A launcher (61-unit ring) in view space.
        public static UiBox LauncherKeepOut(float cx,float cy,float scale)=>new UiBox(cx-66*scale,cy-66*scale,132*scale,132*scale);

        public static bool Overlaps(UiBox a,UiBox b)=>a.x<b.Right&&b.x<a.Right&&a.y<b.Bottom&&b.y<a.Bottom;

        // Top-left candidates in rows from one field edge inward (nearTop: the
        // edge at the top of the view), each row trying the given x anchors
        // (0 = left, 0.5 = centre, 1 = right).
        public static List<AimPoint> BandSlots(UiBox field,float w,float h,bool nearTop,float step,float margin,params float[] anchors)
        {
            var list=new List<AimPoint>();
            if(w<=0||h<=0||step<=0||w>field.width-2*margin||h>field.height-2*margin)return list;
            float usable=field.height-2*margin-h;int rows=(int)Math.Floor(usable/step)+1;
            for(int k=0;k<rows;k++){
                float y=nearTop?field.y+margin+k*step:field.Bottom-margin-h-k*step;
                foreach(float a in anchors)list.Add(new AimPoint(field.x+margin+a*(field.width-2*margin-w),y));
            }
            return list;
        }

        // First candidate that lies inside the field and touches none of `avoid`.
        public static bool TryPlace(UiBox field,float w,float h,IReadOnlyList<UiBox> avoid,IEnumerable<AimPoint> topLefts,float margin,out UiBox placed)
        {
            foreach(var p in topLefts){
                var box=new UiBox(p.x,p.y,w,h);
                if(box.x<field.x+margin-.01f||box.Right>field.Right-margin+.01f||box.y<field.y+margin-.01f||box.Bottom>field.Bottom-margin+.01f)continue;
                bool hit=false;foreach(var o in avoid)if(Overlaps(box,o)){hit=true;break;}
                if(!hit){placed=box;return true;}
            }
            placed=default;return false;
        }
    }

    public struct OverlayPlan
    {
        public bool Placed,TwoLines,Top;
        public UiBox Box;
        public int Font;
        public float LineHeight;
    }

    // CC-001 W19-05: pure planning of the base-damage banner and the Replay
    // counter on the board (view space). BoardView only draws the plans.
    public static class BoardOverlayPlanner
    {
        public const float WorldLeft=24.3f,WorldRight=515.7f,WorldTop=16,WorldBottom=884;
        public static float Scale(float boardWidth)=>boardWidth/MatchPerspective.WorldWidth;
        static AimPoint View(float x,float y,int viewOwner,float bx,float by,float bw)=>BoardSpace.ToView(x,y,viewOwner,bx,by,bw);
        public static UiBox Field(int viewOwner,float bx,float by,float bw){var a=View(WorldLeft,WorldTop,viewOwner,bx,by,bw);var b=View(WorldRight,WorldBottom,viewOwner,bx,by,bw);return BoardLabelLayout.Field(a.x,a.y,b.x,b.y);}
        // P2's base/launcher is at the top of the P1 view and at the bottom of the P2 view.
        public static bool AtViewTop(int owner,int viewOwner)=>(owner==1)==(viewOwner!=1);
        public static int StatusRows(BallRuntime b)=>BallBadges.Chips(b).Length>0?1:0;

        public static List<UiBox> KeepOuts(GameState s,int viewOwner,float bx,float by,float bw)
        {
            float scale=Scale(bw);var list=new List<UiBox>();
            for(int owner=0;owner<2;owner++){var c=View(270,owner==0?853:47,viewOwner,bx,by,bw);list.Add(BoardLabelLayout.LauncherKeepOut(c.x,c.y,scale));}
            var field=Field(viewOwner,bx,by,bw);
            if(s?.balls!=null)foreach(var b in s.balls)if(b!=null&&!b.dead&&!b.banished){var c=View(b.x,b.y,viewOwner,bx,by,bw);list.Add(BallBadges.Inflate(BallBadges.Layout(b,c.x,c.y,scale,true,field).Bounds,4*scale));}
            if(s?.structures!=null)foreach(var g in s.structures)if(g!=null&&!g.dead){var c=View(g.x,g.y,viewOwner,bx,by,bw);float r=(g.radius+6)*scale;list.Add(new UiBox(c.x-r,c.y-r,2*r,2*r));}
            return list;
        }

        public static int BaseFont(float scale)=>Math.Max(9,(int)Math.Round(11*scale));

        // Two lines in the first free slot from the damaged base's edge inward;
        // else the first line alone; else Placed=false (caller uses the frame band).
        public static OverlayPlan Banner(string[] lines,int baseOwner,int viewOwner,UiBox field,float scale,List<UiBox> avoid)
        {
            var plan=new OverlayPlan{Top=AtViewTop(baseOwner,viewOwner)};
            if(lines==null||lines.Length<2)return plan;
            int font=BaseFont(scale);int longest=Math.Max(lines[0].Length,lines[1].Length);
            float w=longest*font*.62f+16;
            if(w>field.width-16){font=Math.Max(8,(int)Math.Floor(font*(field.width-16)/w));w=longest*font*.62f+16;}
            w=Math.Min(w,field.width-16);float h=font+7,full=h*2+4;
            plan.Font=font;plan.LineHeight=h;
            if(BoardLabelLayout.TryPlace(field,w,full,avoid,BoardLabelLayout.BandSlots(field,w,full,plan.Top,8*scale,8,.5f,0f,1f),8,out var box)){plan.Placed=plan.TwoLines=true;plan.Box=box;avoid.Add(box);return plan;}
            float w1=Math.Min(lines[0].Length*font*.66f+16,field.width-16);
            if(BoardLabelLayout.TryPlace(field,w1,h,avoid,BoardLabelLayout.BandSlots(field,w1,h,plan.Top,6*scale,8,.5f,0f,1f),8,out var one)){plan.Placed=true;plan.Box=one;avoid.Add(one);}
            return plan;
        }

        // One line in the acting player's band, beside (never on) the launcher.
        public static OverlayPlan Counter(string label,int owner,int viewOwner,UiBox field,float scale,List<UiBox> avoid)
        {
            var plan=new OverlayPlan{Top=AtViewTop(owner,viewOwner)};
            if(string.IsNullOrEmpty(label))return plan;
            int font=BaseFont(scale);float w=Math.Min(label.Length*font*.7f+16,field.width-16),h=font+8;
            plan.Font=font;plan.LineHeight=h;
            if(BoardLabelLayout.TryPlace(field,w,h,avoid,BoardLabelLayout.BandSlots(field,w,h,plan.Top,8*scale,8,0f,1f,.5f),8,out var box)){plan.Placed=true;plan.Box=box;avoid.Add(box);}
            return plan;
        }
    }
}
