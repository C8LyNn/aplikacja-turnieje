using System;
using System.Collections.Generic;
using System.Globalization;
using CoreClash.Core;
namespace CoreClash.Presentation
{
    // CC-001 W20: what a real simulation event means on screen. Presentation only:
    // it reads the event kind/text and never invents a cause the event does not carry.
    public enum FeedbackClass { Damage, Absorbed, Heal, Shield, Defeat, Explosion, Fire, Ice, Toxin, Freeze, Root, Cleanse, BaseDamage, Armed, Fuse, Disarm, Structure, Info }
    public static class FeedbackStyle
    {
        public static FeedbackClass Classify(string kind,string text)
        {
            switch(kind)
            {
                case "DAMAGE":return text=="Shield"?FeedbackClass.Absorbed:FeedbackClass.Damage;
                case "HEAL":return FeedbackClass.Heal;
                case "SHIELD":return FeedbackClass.Shield;
                case "DEATH":return FeedbackClass.Defeat;
                case "EXPLOSION":return FeedbackClass.Explosion;
                case "FIRE":return FeedbackClass.Fire;
                case "ICE":return FeedbackClass.Ice;
                case "TOXIN":return FeedbackClass.Toxin;
                case "FREEZE":return FeedbackClass.Freeze;
                case "ROOTED":return FeedbackClass.Root;
                case "CLEANSE":return FeedbackClass.Cleanse;
                case "BASE_DAMAGE":return FeedbackClass.BaseDamage;
                case "ARMED":return FeedbackClass.Armed;
                case "FUSE":return FeedbackClass.Fuse;
                case "DISARM":return FeedbackClass.Disarm;
                case "STRUCTURE":case "STRUCTURE_REPAIR":case "STRUCTURE_HIT":case "STRUCTURE_BREAK":return FeedbackClass.Structure;
                default:return FeedbackClass.Info;
            }
        }
        // The words on the label. Damage and heal keep the authoritative amount.
        public static string Label(string kind,string text)
        {
            switch(kind)
            {
                case "DAMAGE":return text=="Shield"?"ABSORBED":text??"";
                case "HEAL":return text??"";
                case "DEATH":return "DEFEATED";
                case "RETURN":return "RETURN";
                case "ROOTED":return "ROOTED";
                case "CLEANSE":return "CLEANSED";
                case "CONSUME":return "CONSUMED";
                case "TRANSFORM":return "TRANSFORM";
                default:return (text??"").ToUpperInvariant();
            }
        }
        public static bool IsNumber(FeedbackClass kind)=>kind==FeedbackClass.Damage||kind==FeedbackClass.Heal;
        // Amount of a "-12" / "+5" label, 0 when the text is not a number.
        public static int Amount(string text)
        {
            if(string.IsNullOrEmpty(text)||text.Length<2||(text[0]!='-'&&text[0]!='+'))return 0;
            return int.TryParse(text.Substring(1),NumberStyles.None,CultureInfo.InvariantCulture,out int value)?value:0;
        }
    }

    public static class FeedbackLabels
    {
        // Overlapping labels are separated, not dropped: each wanted box moves to the
        // nearest free slot (up first, then down) inside the field. Returns one box
        // per input; width 0 only when no slot exists within maxSteps.
        public static UiBox[] Stack(IReadOnlyList<UiBox> wanted,UiBox field,float step,int maxSteps=8)
        {
            var placed=new UiBox[wanted.Count];var taken=new List<UiBox>();
            for(int i=0;i<wanted.Count;i++)
            {
                var want=wanted[i];
                float w=Math.Min(want.width,Math.Max(1,field.width-2)),h=want.height;
                float x=Math.Max(field.x+1,Math.Min(field.Right-1-w,want.x));
                bool found=false;
                for(int k=0;k<=2*maxSteps&&!found;k++)
                {
                    float offset=k==0?0:(k%2==1?-(k+1)/2:k/2)*step;
                    var box=new UiBox(x,want.y+offset,w,h);
                    if(box.y<field.y+1||box.Bottom>field.Bottom-1)continue;
                    bool hit=false;
                    foreach(var other in taken)if(BoardLabelLayout.Overlaps(box,other)){hit=true;break;}
                    if(hit)continue;
                    placed[i]=box;taken.Add(box);found=true;
                }
                if(!found)placed[i]=new UiBox(x,want.y,0,0);
            }
            return placed;
        }
    }

    // CC-001 W20: one HUD line with the result of the latest action, from
    // authoritative events only (ball damage by side, defeats, base damage).
    public static class ActionSummary
    {
        public static string For(GameState state)
        {
            if(state?.events==null||state.balls==null)return "";
            for(int turn=state.turnNumber;turn>=Math.Max(1,state.turnNumber-1);turn--)
            {
                string line=ForTurn(state,turn);
                if(line.Length>0)return line;
            }
            return "";
        }
        public static string ForTurn(GameState state,int turn)
        {
            if(state?.events==null||state.balls==null)return "";
            int[] damage=new int[2],defeated=new int[2],baseLoss=new int[2];bool any=false;
            foreach(var e in state.events)
            {
                if(e==null||e.turn!=turn)continue;
                if(e.kind=="BASE_DAMAGE"){if(BaseDamageTracker.TryParse(e.text,out int owner,out int amount)){baseLoss[owner]+=amount;any=true;}continue;}
                if(e.kind!="DAMAGE"&&e.kind!="DEATH")continue;
                BallRuntime ball=null;
                foreach(var candidate in state.balls)if(candidate!=null&&candidate.id==e.ballId){ball=candidate;break;}
                if(ball==null||ball.owner<0||ball.owner>1)continue;
                if(e.kind=="DEATH"){defeated[ball.owner]++;any=true;}
                else{int hit=e.text!=null&&e.text.StartsWith("-")?FeedbackStyle.Amount(e.text):0;if(hit>0){damage[ball.owner]+=hit;any=true;}}
            }
            if(!any)return "";
            var parts=new List<string>();
            for(int owner=0;owner<2;owner++)
                if(damage[owner]>0||defeated[owner]>0)
                    parts.Add("P"+(owner+1)+" BALLS -"+damage[owner]+(defeated[owner]>0?" ("+defeated[owner]+" DEFEATED)":""));
            for(int owner=0;owner<2;owner++)if(baseLoss[owner]>0)parts.Add("P"+(owner+1)+" BASE -"+baseLoss[owner]);
            // The event buffer is bounded: say so instead of presenting a partial total as complete.
            bool partial=state.events.Count>=100&&state.events[0].turn>=turn;
            return "TURN "+turn+(partial?" (PARTIAL)":"")+" · "+string.Join(" · ",parts);
        }
    }

    // CC-001 W20: the desktop/tablet side panel as fixed rows that fit the visible
    // height (no hidden actions below a scroll edge). Coordinates are relative to the
    // panel's inner rectangle. Scrolls only when even the minimum card height does not fit.
    public sealed class MatchPanelLayout
    {
        public UiBox Turn,Hp1,Hp2,Selected,Heading,Standard,Hint;
        public UiBox[] Cards=new UiBox[9],Actions=new UiBox[4];
        public float Width,ContentHeight,CardHeight;
        public bool Scrolls,Tight,Scoreboard;
        public static MatchPanelLayout For(float innerWidth,float innerHeight,float target,bool scoreboard=true)
        {
            var layout=new MatchPanelLayout{Scoreboard=scoreboard};
            bool tight=innerHeight<(scoreboard?600:470);layout.Tight=tight;
            float gap=tight?6:10,turnH=scoreboard?(tight?34:42):0,hpH=scoreboard?(tight?46:58):0,selectedH=tight?52:68,headingH=16,hintH=tight?38:50,cardGap=6;
            float top=(scoreboard?turnH+gap+hpH+gap:0)+selectedH+gap+headingH+4;
            float bottom=gap+target+gap+target+gap+hintH;
            float free=innerHeight-top-bottom-2*cardGap;
            float card=(float)Math.Floor(Math.Max(54,Math.Min(112,free/3)));
            layout.Scrolls=top+3*card+2*cardGap+bottom>innerHeight+.5f;
            float w=Math.Max(120,layout.Scrolls?innerWidth-22:innerWidth);
            layout.Width=w;layout.CardHeight=card;
            float y=0;
            if(scoreboard)
            {
                layout.Turn=new UiBox(0,y,w,turnH);y+=turnH+gap;
                float half=(w-gap)/2;
                layout.Hp1=new UiBox(0,y,half,hpH);layout.Hp2=new UiBox(half+gap,y,half,hpH);y+=hpH+gap;
            }
            layout.Selected=new UiBox(0,y,w,selectedH);y+=selectedH+gap;
            layout.Heading=new UiBox(0,y,w,headingH);y+=headingH+4;
            float cardW=(w-2*cardGap)/3;
            for(int i=0;i<9;i++)layout.Cards[i]=new UiBox((i%3)*(cardW+cardGap),y+(i/3)*(card+cardGap),cardW,card);
            y+=3*card+2*cardGap+gap;
            layout.Standard=new UiBox(0,y,w,target);y+=target+gap;
            float actionW=(w-3*6)/4;
            for(int i=0;i<4;i++)layout.Actions[i]=new UiBox(i*(actionW+6),y,actionW,target);
            y+=target+gap;
            float extra=layout.Scrolls?0:Math.Max(0,innerHeight-(y+hintH));
            layout.Hint=new UiBox(0,y,w,hintH+Math.Min(extra,64));
            layout.ContentHeight=y+layout.Hint.height;
            return layout;
        }
    }
}
