using System;
using System.Linq;

namespace CoreClash.Core
{
    public sealed partial class AbilityResolver
    {
        void ExplosiveStop(BallRuntime b)
        {
            switch(b.type){
                case "mine":b.mineArmed=true;sim.Emit("ARMED",b,"Mine armed");break;
                case "timebomb":b.timeBombArmed=true;b.timeBombCounter=0;b.timeBombLastTickTurn=S.turnNumber;sim.Emit("FUSE",b,"Fuse: 2 own turns");break;
                case "bomb":Detonate(b,165,19,455);break;
            }
        }
        public void OnPairContact(BallRuntime a,BallRuntime b,bool hit,bool aSource,float impact)
        {
            if(a.dead||b.dead||a.banished||b.banished)return;
            bool first=MineContactTrigger(a,b,out bool suppressA),second=MineContactTrigger(b,a,out bool suppressB);
            // Capture and consume both triggers before a blast or identity change can mutate the pair.
            if(first){a.exploded=true;a.mineArmed=false;}
            if(second){b.exploded=true;b.mineArmed=false;}
            if(first){Explode(a,100,14,330);sim.Kill(a);}
            if(second){Explode(b,100,14,330);sim.Kill(b);}
            if(!a.dead && !b.dead) EvolutionPairContact(a,b);
            if(!suppressA)OnContact(a,b,hit,aSource,impact);
            if(!suppressB)OnContact(b,a,hit,!aSource,impact);
        }
        bool MineContactTrigger(BallRuntime mine,BallRuntime other,out bool suppressed)
        {
            suppressed=false;if(mine.type!="mine"||!mine.mineArmed||mine.owner==other.owner)return false;
            if(other.type=="ice"){DisarmMine(mine,other);return false;}
            if(mine.jammed>0){mine.jammed--;suppressed=true;return false;}
            return true;
        }
        void DisarmMine(BallRuntime mine,BallRuntime frost)
        {
            mine.mineArmed=false;ApplyIce(mine,frost.owner);sim.Emit("DISARM",mine,"Mine disarmed by Frost");
        }
        void ExplosiveTurn(BallRuntime b)
        {
            if(b.type!="timebomb"||!b.timeBombArmed||b.timeBombLastTickTurn==S.turnNumber)return;
            b.timeBombLastTickTurn=S.turnNumber;
            if(b.jammed>0){b.jammed--;sim.Emit("FUSE",b,"Fuse suppressed this turn");return;}
            if(++b.timeBombCounter>=2)Detonate(b,165,14,390);
            else sim.Emit("FUSE",b,"Fuse: 1 own turn");
        }
        void ExplosiveStep()
        {
            foreach(var mine in Living().Where(b=>b.type=="mine"&&b.mineArmed)){
                var frost=Living().FirstOrDefault(b=>b.type=="ice"&&b.owner!=mine.owner&&Dist(b,mine)<mine.radius+b.radius+13);
                if(frost!=null)DisarmMine(mine,frost);
            }
        }
        void Detonate(BallRuntime b,float radius,int damage,float force)
        {
            if(b.dead||b.exploded)return;
            // Consume the trigger before any area damage can recurse through death observers.
            b.exploded=true;b.mineArmed=b.timeBombArmed=false;Explode(b,radius,damage,force);sim.Kill(b);
        }
    }
}
