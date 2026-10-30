using CoreClash.Core;
namespace CoreClash.Presentation
{
    // Source of a legal UI selection. Stock is intentionally checked FIRST,
    // exactly as in GameSimulation.TryCommand(CommandKind.Spawn).
    public enum BallSelectionSource { None, Stock, Hand }

    public static class BallSelection
    {
        public static BallSelectionSource Source(GameSimulation simulation,int owner,string type)
        {
            if(simulation==null||simulation.State==null||string.IsNullOrEmpty(type)||
                owner<0||owner>1||owner!=simulation.State.turn)return BallSelectionSource.None;

            if(simulation.Stock(owner,type)>0)return BallSelectionSource.Stock;
            if(type!="phoenix"||simulation.State.phoenixHand==null)return BallSelectionSource.None;

            int ownerTurns=simulation.State.players[owner].ownerTurns;
            foreach(var hand in simulation.State.phoenixHand)
                if(hand!=null&&hand.owner==owner&&hand.ready&&
                   hand.createdOwnerTurns<ownerTurns&&hand.lastProcessedOwnerTurns>=ownerTurns)
                    return BallSelectionSource.Hand;
            return BallSelectionSource.None;
        }

        public static bool CanSelect(GameSimulation simulation,int owner,string type)=>
            Source(simulation,owner,type)!=BallSelectionSource.None;

        // Stock cannot be incremented for a returned Phoenix: the label describes
        // a hand opportunity, never an extra deck copy.
        public static string StockLabel(GameSimulation simulation,int owner,string type)
        {
            var source=Source(simulation,owner,type);
            if(source==BallSelectionSource.Stock)return "x"+simulation.Stock(owner,type);
            return source==BallSelectionSource.Hand?"HAND READY":"EMPTY";
        }

        public static string ForTurn(GameSimulation simulation,string selected)=>
            simulation!=null&&CanSelect(simulation,simulation.State.turn,selected)?selected:"normal";
    }
    // Pure presentation copy: relative "YOUR" belongs to the local connected seat,
    // never to whichever owner happens to be the current authoritative turn.
    // Keeps gameplay turn, local identity and network connection as separate inputs.
    public static class LocalTurnPresentation
    {
        public static string Status(GameState state,int localOwner,bool multiplayer,bool connected)
        {
            if(state==null)return "WAITING FOR MATCH";
            if(state.phase==MatchPhase.Over)
                return state.winner<0?"MATCH COMPLETE / DRAW":"PLAYER "+(state.winner+1)+" WINS";
            string turn="TURN "+state.turnNumber+" / 50     PLAYER "+(state.turn+1);
            if(state.phase==MatchPhase.Moving)return turn+" / RESOLVING";
            if(multiplayer&&!connected)return turn+" / WAITING FOR CONNECTION";
            if(multiplayer&&state.turn!=localOwner)
                return turn+" / WAITING FOR PLAYER "+(state.turn+1);
            return turn+(state.bonusPending?" / BONUS SHOT":multiplayer?" / YOUR SHOT":" / AIMING");
        }

        public static string CompactStatus(GameState state,int localOwner,bool multiplayer,bool connected)
        {
            if(state==null)return "WAIT";
            if(state.phase==MatchPhase.Over)return state.winner<0?"DRAW":"P"+(state.winner+1)+" WINS";
            if(state.phase==MatchPhase.Moving)return "MOVING";
            if(multiplayer&&!connected)return "OFFLINE";
            if(multiplayer)return state.turn==localOwner?"YOUR SHOT":"WAIT P"+(state.turn+1);
            return "P"+(state.turn+1)+(state.bonusPending?" BONUS":" AIM");
        }
    }

    // A10-approved power UI: feedback depends on the unchanged 18-world-unit
    // LaunchGesture.Release threshold, never on a second strength bar/percent.
    public static class AimUiStatus
    {
        public static bool Ready(bool active,float dragX,float dragY)=>
            active&&GameSimulation.Finite(dragX)&&GameSimulation.Finite(dragY)&&
            (double)dragX*dragX+(double)dragY*dragY>=18d*18d;

        public static string Hint(bool active,float dragX,float dragY)=>
            !active?"DRAG FROM LAUNCHER":Ready(active,dragX,dragY)?"RELEASE TO LAUNCH":"DRAG TO BUILD POWER";
    }

}
