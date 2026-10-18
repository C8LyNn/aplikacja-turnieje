using System.Collections.Generic;
using System.Linq;
using CoreClash.Core;
namespace CoreClash.Presentation
{
    public sealed class FeedbackItem { public string kind,text;public float x,y,born;public int owner,ballId; }
    public sealed class FeedbackTimeline
    {
        public readonly List<FeedbackItem> Items=new List<FeedbackItem>();
        int cursor=-1;
        public void Observe(GameState state,float now)
        {
            if(state==null||!GameSimulation.Finite(now))return;
            Items.RemoveAll(e=>now-e.born>=1.15f);
            if(cursor<0||state.eventSerial<cursor){Items.Clear();cursor=state.eventSerial;return;}
            foreach(var e in state.events){
                if(e.id<=cursor||!Visible(e.kind))continue;
                var ball=state.balls.FirstOrDefault(b=>b.id==e.ballId);
                int owner=ball?.owner??state.turn;float x=e.x,y=e.y;
                if(e.kind=="BASE_DAMAGE"){owner=e.text!=null&&e.text.StartsWith("P1")?0:1;x=270;y=owner==0?824:76;}
                Items.Add(new FeedbackItem{kind=e.kind,text=e.text,x=x,y=y,owner=owner,ballId=e.ballId,born=now});
            }
            cursor=state.eventSerial;while(Items.Count>24)Items.RemoveAt(0);
        }
        static bool Visible(string kind)=>kind=="DAMAGE"||kind=="HEAL"||kind=="SHIELD"||kind=="DEATH"||kind=="RETURN"||kind=="UPGRADE"||kind=="CLEANSE"||kind=="CONSUME"||kind=="ROOTED"||kind=="SIGNATURE"||kind=="TRANSFORM"||kind=="PORTAL"||kind=="VIRULENCE_BURST"||kind=="BASE_DAMAGE"||kind=="RAM"||kind=="SLINGSHOT"||kind=="STRUCTURE"||kind=="STRUCTURE_REPAIR"||kind=="STRUCTURE_HIT"||kind=="STRUCTURE_BREAK"||kind=="BOUNCE"||kind=="PLACEMENT_BLOCKED"||kind=="ARMED"||kind=="FUSE"||kind=="DISARM"||kind=="EXPLOSION"||kind=="REINFORCEMENT"||kind=="SPLIT"||kind=="FIRE"||kind=="ICE"||kind=="TOXIN"||kind=="FREEZE"||kind=="TRAP_TRIGGER"||kind=="VENOM"||kind=="SHATTER"||kind=="HATCH"||kind=="CLONE"||kind=="MITOSIS"||kind=="SWARM"||kind=="VETERAN";
    }
}
