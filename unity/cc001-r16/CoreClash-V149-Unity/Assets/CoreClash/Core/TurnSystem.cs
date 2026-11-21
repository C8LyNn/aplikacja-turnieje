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
            // Match rule "double turn": the player holding it plays a second ball before the turn ends
            // (the same extra spawn as Player 2's on the opening turn).
            if(s.comebackRule&&s.comebackActive&&s.actionKind=="spawn"){s.comebackActive=false;s.bonusPending=true;s.phase=MatchPhase.Aiming;s.actionKind=null;s.revision++;sim.Emit("DOUBLE_TURN",null,"Player "+(s.turn+1));return;}
            sim.Abilities.OnTurnEnd(s.turn);sim.Rules.ApplyTurnPressure(s.turn);sim.Rules.CheckVictory();sim.Rules.ResolveTurnLimit();if(s.phase==MatchPhase.Over)return;
            sim.Rules.ArmComeback();
            s.turn=1-s.turn;s.turnNumber++;s.players[s.turn].ownerTurns++;s.replayedIds.Clear();s.actionKind=null;s.phase=MatchPhase.Aiming;s.revision++;
            s.comebackActive=false;if(s.comebackRule&&s.players[s.turn].comebackArmed){s.players[s.turn].comebackArmed=false;s.comebackActive=true;}
            foreach(var b in s.balls)b.turnAffectedIds.Clear();sim.Abilities.OnTurnStart(s.turn);sim.Rules.CheckVictory();sim.Emit("TURN",null,"Player "+(s.turn+1));
        }
    }
}
