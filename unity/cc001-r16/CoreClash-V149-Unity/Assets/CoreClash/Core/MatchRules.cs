using System.Linq;
using CoreClash.Physics;
namespace CoreClash.Core
{
    public sealed class MatchRules
    {
        readonly GameSimulation sim;
        GameState S=>sim.State;
        public MatchRules(GameSimulation s){sim=s;}
        public void CheckVictory()
        {
            if(S.phase==MatchPhase.Over)return;
            if(S.players[0].hp<=0&&S.players[1].hp<=0)Finish(-1,"Both bases destroyed");
            else if(S.players[0].hp<=0)Finish(1,"Base destroyed");else if(S.players[1].hp<=0)Finish(0,"Base destroyed");
        }
        public void Finish(int winner,string reason){S.winner=winner;S.resultReason=reason;S.phase=MatchPhase.Over;S.revision++;sim.Emit("MATCH_END",null,reason);}
        public void ResolveTurnLimit()
        {
            if(S.turnNumber<50||S.phase==MatchPhase.Over)return;int diff=S.players[0].hp-S.players[1].hp;
            if(diff!=0){Finish(diff>0?0:1,"50 turns: base HP");return;}
            diff=S.balls.Count(x=>!x.dead&&!x.banished&&x.owner==0)-S.balls.Count(x=>!x.dead&&!x.banished&&x.owner==1);
            Finish(diff==0?-1:diff>0?0:1,diff==0?"50 turns: identical score":"50 turns: living ball count");
        }
        public void DamageBase(int owner,int amount){if(amount<=0)return;S.players[owner].hp=System.Math.Max(0,S.players[owner].hp-amount);sim.Emit("BASE_DAMAGE",null,"P"+(owner+1)+" base -"+amount);}
        public void ApplyTurnPressure(int owner)
        {
            DamageBase(1-owner,S.balls.Count(x=>!x.dead&&!x.banished&&x.owner==owner&&ZoneResolver.TouchesEnemyZone(x)));
            int diff=S.balls.Count(x=>!x.dead&&!x.banished&&x.owner==0&&ZoneResolver.TouchesCenter(x))-S.balls.Count(x=>!x.dead&&!x.banished&&x.owner==1&&ZoneResolver.TouchesCenter(x));
            if(System.Math.Abs(diff)>=2)DamageBase(diff>0?1:0,System.Math.Abs(diff)-1);
        }
    }
}
