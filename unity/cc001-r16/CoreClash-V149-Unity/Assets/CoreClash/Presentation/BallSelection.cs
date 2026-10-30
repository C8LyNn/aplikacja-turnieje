using CoreClash.Core;
using System.Linq;
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

        public static string StockLabel(GameSimulation simulation,int owner,string type)
        {
            var source=Source(simulation,owner,type);
            if(source==BallSelectionSource.Stock)return "x"+simulation.Stock(owner,type);
            return source==BallSelectionSource.Hand?"HAND READY":"EMPTY";
        }

        public static string ForTurn(GameSimulation simulation,string selected)=>
            simulation!=null&&CanSelect(simulation,simulation.State.turn,selected)?selected:"normal";
    }

    // W10 selected from A20: relative wording is derived from the connected local seat,
    // never from whichever owner currently owns the authoritative turn.
    public static class LocalTurnPresentation
    {
        // A21/W11: a connected transport without a valid player seat is not an owned turn.
        public static bool HasPlayableSeat(int localOwner,bool multiplayer,bool connected) =>
            !multiplayer || (connected && (localOwner==0 || localOwner==1));

        // Pure display rule; never confers an input or network authority.
        public static string PlayerLabel(int owner,int localOwner,bool multiplayer,bool connected,bool compact)
        {
            string label=compact?"P"+(owner+1):"PLAYER "+(owner+1);
            return multiplayer && HasPlayableSeat(localOwner,true,connected) && owner==localOwner
                ?label+(compact?" YOU":" (YOU)"):label;
        }

        public static string Status(GameState state,int localOwner,bool multiplayer,bool connected)
        {
            if(state==null)return "WAITING FOR MATCH";
            if(state.phase==MatchPhase.Over)
                return state.winner<0?"MATCH COMPLETE / DRAW":"PLAYER "+(state.winner+1)+" WINS";
            string turn="TURN "+state.turnNumber+" / 50     PLAYER "+(state.turn+1);
            if(!HasPlayableSeat(localOwner,multiplayer,connected))return turn+" / WAITING FOR CONNECTION";
            if(state.phase==MatchPhase.Moving)return turn+" / RESOLVING";
            if(multiplayer&&state.turn!=localOwner)return turn+" / WAITING FOR PLAYER "+(state.turn+1);
            if(multiplayer)return turn+(state.bonusPending?" / YOUR BONUS SHOT":" / YOUR SHOT");
            return turn+(state.bonusPending?" / BONUS SHOT":" / AIMING");
        }

        public static string ActionHint(GameState state,int localOwner,bool multiplayer,bool connected,
            bool dragging,float dx,float dy,string idleHint)
        {
            if(state==null)return "WAITING FOR MATCH";
            if(state.phase==MatchPhase.Over)return "MATCH COMPLETE";
            if(!HasPlayableSeat(localOwner,multiplayer,connected))return "WAITING FOR CONNECTION";
            if(state.phase==MatchPhase.Moving)return "SHOT RESOLVING";
            if(multiplayer&&state.turn!=localOwner)return "WAITING FOR PLAYER "+(state.turn+1);
            return dragging?AimUiStatus.Hint(true,dx,dy):idleHint;
        }

        public static string CompactStatus(GameState state,int localOwner,bool multiplayer,bool connected)
        {
            if(state==null)return "WAIT";
            if(state.phase==MatchPhase.Over)return state.winner<0?"DRAW":"P"+(state.winner+1)+" WINS";
            if(!HasPlayableSeat(localOwner,multiplayer,connected))return "OFFLINE";
            if(state.phase==MatchPhase.Moving)return "MOVING";
            if(multiplayer&&state.turn!=localOwner)return "WAIT P"+(state.turn+1);
            if(multiplayer)return state.bonusPending?"YOUR BONUS":"YOUR SHOT";
            return "P"+(state.turn+1)+(state.bonusPending?" BONUS":" AIM");
        }
    }

    // A10-approved power UI: arrow/trajectory length remains the power cue. This helper
    // reuses the unchanged 18-world-unit LaunchGesture release threshold.
    public static class AimUiStatus
    {
        public static bool Ready(bool active,float dragX,float dragY)=>
            active&&GameSimulation.Finite(dragX)&&GameSimulation.Finite(dragY)&&
            (double)dragX*dragX+(double)dragY*dragY>=18d*18d;

        public static string Hint(bool active,float dragX,float dragY)=>
            !active?"DRAG FROM LAUNCHER":Ready(active,dragX,dragY)?"RELEASE TO LAUNCH":"DRAG TO BUILD POWER";
    }
}
