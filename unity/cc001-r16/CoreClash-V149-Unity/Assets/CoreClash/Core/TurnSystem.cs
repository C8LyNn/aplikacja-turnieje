namespace CoreClash.Core
{
    public sealed class TurnSystem
    {
        readonly GameSimulation sim;
        public TurnSystem(GameSimulation s){sim=s;}
        public void ResolveAction()
        {
            var s=sim.State;sim.Rules.CheckVictory();if(s.phase==MatchPhase.Over)return;
            if(s.actionKind=="replay"){s.phase=MatchPhase.Aiming;s.actionKind=null;s.revision++;return;}
            if(s.actionKind=="spawn"&&s.turn==1&&!s.bonusUsed&&s.players[1].ownerTurns==1){s.bonusPending=true;s.phase=MatchPhase.Aiming;s.actionKind=null;s.revision++;return;}
            sim.Abilities.OnTurnEnd(s.turn);sim.Rules.ApplyTurnPressure(s.turn);sim.Rules.CheckVictory();sim.Rules.ResolveTurnLimit();if(s.phase==MatchPhase.Over)return;
            s.turn=1-s.turn;s.turnNumber++;s.players[s.turn].ownerTurns++;s.replayedIds.Clear();s.actionKind=null;s.phase=MatchPhase.Aiming;s.revision++;
            foreach(var b in s.balls)b.turnAffectedIds.Clear();sim.Abilities.OnTurnStart(s.turn);sim.Rules.CheckVictory();sim.Emit("TURN",null,"Player "+(s.turn+1));
        }
    }
}
