using System;
using System.Collections.Generic;
using System.Globalization;
using CoreClash.Core;
namespace CoreClash.Presentation
{
    public struct BadgeChip { public StatusKind Kind;public string Text;public UiBox Box; }
    public sealed class BallBadgeLayout
    {
        public UiBox Hp,Shield,Threat,Replay,Overflow,Bounds;
        public bool HasShield,HasThreat,HasReplay,Above;
        public BadgeChip[] Chips=Array.Empty<BadgeChip>();
        public int Hidden,Font;
        public float RowHeight;
    }

    // CC-001 W20: everything drawn AROUND a ball, never on its body: the HP plate,
    // the shield plate, status chips, the threat badge (armed Mine / Time Bomb fuse)
    // and the Replay chip. Pure geometry in board-view space, shared by BallView,
    // the overlay planner (keep-outs) and the managed tests.
    public static class BallBadges
    {
        public const int MaxChips=3;
        // Fixed order = stable placement: the same state is always in the same relative slot.
        static readonly StatusKind[] Order={StatusKind.Frozen,StatusKind.Rooted,StatusKind.Fire,StatusKind.Ice,StatusKind.Toxin,StatusKind.Divine,
            StatusKind.Jammed,StatusKind.Sticky,StatusKind.Phased,StatusKind.Frostguard,StatusKind.Counter,StatusKind.Veteran,StatusKind.Split,StatusKind.Ancestral,StatusKind.Token};
        // Very small boards (phone landscape): smaller plates and symbol-only chips, so the
        // plates of one ball do not bury its neighbours.
        public static bool Compact(float scale)=>scale<.45f;
        public static float RowHeight(float scale)=>Compact(scale)?10f:Math.Max(12f,14f*scale);
        public static int Font(float scale)=>Compact(scale)?8:Math.Max(9,(int)Math.Round(11*scale));
        // W24: the ball is drawn larger than its rules radius (gauge inside, rim and outline outside),
        // so everything placed around it starts further out.
        public static float RingOut(float scale)=>Math.Max(4f,8.5f*scale);
        // W21 owner pip: a triangle on the ring, at the top of the viewer's own balls and at the
        // bottom of the opponent's. PipSize is its box, PipOut how far it sticks out of the ring.
        public static float PipSize(float scale)=>Compact(scale)?5f:Math.Max(6f,7.5f*scale);
        public static float PipOut(float scale)=>PipSize(scale)*.62f;
        public static int PipSide(int owner,int localOwner)=>owner==localOwner?-1:1;
        // One segment per 5 HP; very large pools switch to 10 HP segments so arcs stay readable.
        public static int HpUnit(int maxHp)=>maxHp>60?10:5;
        public static int HpSegments(int maxHp)=>Math.Max(1,(Math.Max(1,maxHp)+HpUnit(maxHp)-1)/HpUnit(maxHp));
        public static int HpLit(int hp,int maxHp)=>hp<=0?0:Math.Min(HpSegments(maxHp),(hp+HpUnit(maxHp)-1)/HpUnit(maxHp));
        public static float ReplayPulse(float scale)=>11.2f*scale;
        public static float ReplayChip(float scale)=>Compact(scale)?10f:Math.Max(12f,14f*scale);
        public static float ThreatSize(float scale)=>Compact(scale)?11f:Math.Max(14f,17f*scale);

        // Status chips under the HP plate. Shield has its own plate next to HP; an
        // armed Mine and a Time Bomb fuse use the larger threat badge instead.
        public static BallStateLabel[] Chips(BallRuntime ball)
        {
            var all=BallInspection.Statuses(ball);var list=new List<BallStateLabel>();
            foreach(var kind in Order)foreach(var state in all)if(state.Kind==kind)list.Add(state);
            return list.ToArray();
        }
        public static BallStateLabel Threat(BallRuntime ball)
        {
            foreach(var state in BallInspection.Statuses(ball))if(state.Kind==StatusKind.Armed||state.Kind==StatusKind.Fuse)return state;
            return null;
        }

        public static BallBadgeLayout Layout(BallRuntime ball,float cx,float cy,float scale,bool replay,UiBox field,int localOwner=0)
            =>ball==null?new BallBadgeLayout():Layout(cx,cy,ball.radius*scale,scale,ball.hp,ball.shield,Chips(ball),Threat(ball)!=null,replay,field,PipSide(ball.owner,localOwner));

        // pip: -1 = owner pip on top of the ring, 1 = under it, 0 = none. Rows on the pip's side start past it.
        public static BallBadgeLayout Layout(float cx,float cy,float radius,float scale,int hp,int shield,BallStateLabel[] chips,bool threat,bool replay,UiBox field,int pip=0)
        {
            var layout=new BallBadgeLayout();
            if(chips==null)chips=Array.Empty<BallStateLabel>();
            float rowH=RowHeight(scale),ring=RingOut(scale),gap=Math.Max(1f,1.5f*scale);
            int font=Font(scale);float digit=font*.62f;
            layout.RowHeight=rowH;layout.Font=font;
            float hpW=Digits(hp)*digit+rowH*.8f;
            float shieldW=shield>0?rowH+Digits(shield)*digit+2:0;
            float firstRow=hpW+(shield>0?gap+shieldW:0);
            int shown=chips.Length>MaxChips?MaxChips-1:chips.Length;
            layout.Hidden=chips.Length-shown;
            var widths=new float[shown];float secondRow=0;
            for(int i=0;i<shown;i++)
            {
                string text=Compact(scale)?"":chips[i].Short??"";
                widths[i]=rowH+(text.Length>0?text.Length*digit+3:0);
                secondRow+=widths[i]+(i>0?gap:0);
            }
            float overflowW=layout.Hidden>0?(Digits(layout.Hidden)+1)*digit+rowH*.5f:0;
            if(layout.Hidden>0)secondRow+=overflowW+(shown>0?gap:0);
            int rows=secondRow>0?2:1;
            float pipOut=pip==0?0:PipOut(scale);
            float need=rows*rowH+(rows-1)*gap,below=cy+radius+ring+gap+(pip>0?pipOut:0),above=cy-radius-ring-gap-(pip<0?pipOut:0);
            // Rows normally sit under the ball; next to the bottom wall they move above it.
            layout.Above=below+need>field.Bottom-1&&above-need>=field.y+1;
            float y1=layout.Above?above-rowH:below;
            float y2=layout.Above?y1-gap-rowH:y1+rowH+gap;
            float x1=ClampX(cx-firstRow/2,firstRow,field);
            layout.Hp=new UiBox(x1,y1,hpW,rowH);
            if(shield>0){layout.HasShield=true;layout.Shield=new UiBox(x1+hpW+gap,y1,shieldW,rowH);}
            layout.Chips=new BadgeChip[shown];
            float x2=ClampX(cx-secondRow/2,secondRow,field);
            for(int i=0;i<shown;i++)
            {
                layout.Chips[i]=new BadgeChip{Kind=chips[i].Kind,Text=Compact(scale)?"":chips[i].Short??"",Box=new UiBox(x2,y2,widths[i],rowH)};
                x2+=widths[i]+gap;
            }
            if(layout.Hidden>0)layout.Overflow=new UiBox(x2,y2,overflowW,rowH);
            // Corner badges take the side opposite to the rows.
            if(threat){float size=ThreatSize(scale);layout.HasThreat=true;layout.Threat=new UiBox(cx+radius*.35f,layout.Above?cy+radius-size*.45f:cy-radius-size*.55f,size,size);}
            if(replay){float size=ReplayChip(scale);layout.HasReplay=true;layout.Replay=new UiBox(cx-radius*.3f-size,layout.Above?cy+radius-size*.45f:cy-radius-size*.55f,size,size);}
            float reach=radius+ring+(replay?ReplayPulse(scale):0);
            var bounds=new UiBox(cx-reach,cy-reach,2*reach,2*reach);
            if(pip!=0){float size=PipSize(scale),far=radius+ring+pipOut;bounds=Union(bounds,new UiBox(cx-size*.5f,pip<0?cy-far:cy+far-size,size,size));}
            bounds=Union(bounds,layout.Hp);
            if(layout.HasShield)bounds=Union(bounds,layout.Shield);
            for(int i=0;i<shown;i++)bounds=Union(bounds,layout.Chips[i].Box);
            if(layout.Hidden>0)bounds=Union(bounds,layout.Overflow);
            if(layout.HasThreat)bounds=Union(bounds,layout.Threat);
            if(layout.HasReplay)bounds=Union(bounds,layout.Replay);
            layout.Bounds=bounds;
            return layout;
        }

        static int Digits(int value)=>value.ToString(CultureInfo.InvariantCulture).Length;
        static float ClampX(float x,float width,UiBox field){float min=field.x+1,max=field.Right-1-width;return max<min?min:Math.Max(min,Math.Min(max,x));}
        public static UiBox Union(UiBox a,UiBox b){float x=Math.Min(a.x,b.x),y=Math.Min(a.y,b.y);return new UiBox(x,y,Math.Max(a.Right,b.Right)-x,Math.Max(a.Bottom,b.Bottom)-y);}
        public static UiBox Inflate(UiBox box,float pad)=>new UiBox(box.x-pad,box.y-pad,box.width+2*pad,box.height+2*pad);
    }
}
