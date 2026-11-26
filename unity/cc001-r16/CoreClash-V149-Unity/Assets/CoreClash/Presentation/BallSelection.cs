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
            // W24 match rule: Player 2's extra opening ball must be a Standard one (as in TryCommand).
            if(type!="normal"&&simulation.StandardOnlyShot)return BallSelectionSource.None;

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
        public static string Status(GameState state,int localOwner,bool multiplayer,bool connected)
        {
            if(state==null)return Lang.T("WAITING FOR MATCH","CZEKAM NA MECZ");
            if(state.phase==MatchPhase.Over)
                return state.winner<0?Lang.T("MATCH COMPLETE / DRAW","KONIEC MECZU / REMIS"):Lang.T("PLAYER ","GRACZ ")+(state.winner+1)+Lang.T(" WINS"," WYGRYWA");
            string turn=Lang.T("TURN ","TURA ")+state.turnNumber+Lang.T(" / 50     PLAYER "," / 50     GRACZ ")+(state.turn+1);
            // A disconnected client must not look like a healthy resolving match.
            if(multiplayer&&!connected)return turn+Lang.T(" / WAITING FOR CONNECTION"," / CZEKAM NA POŁĄCZENIE");
            if(state.phase==MatchPhase.Moving)return turn+Lang.T(" / RESOLVING"," / RUCH KULEK");
            if(multiplayer&&state.turn!=localOwner)return turn+Lang.T(" / WAITING FOR PLAYER "," / CZEKAM NA GRACZA ")+(state.turn+1);
            if(multiplayer)return turn+(state.bonusPending?Lang.T(" / YOUR BONUS SHOT"," / TWÓJ DODATKOWY STRZAŁ"):Lang.T(" / YOUR SHOT"," / TWÓJ STRZAŁ"));
            return turn+(state.bonusPending?Lang.T(" / BONUS SHOT"," / DODATKOWY STRZAŁ"):Lang.T(" / AIMING"," / CELOWANIE"));
        }

        public static string ActionHint(GameState state,int localOwner,bool multiplayer,bool connected,
            bool dragging,float dx,float dy,string idleHint)
        {
            if(state==null)return Lang.T("WAITING FOR MATCH","CZEKAM NA MECZ");
            if(state.phase==MatchPhase.Over)return Lang.T("MATCH COMPLETE","KONIEC MECZU");
            if(multiplayer&&!connected)return Lang.T("WAITING FOR CONNECTION","CZEKAM NA POŁĄCZENIE");
            if(state.phase==MatchPhase.Moving)return Lang.T("SHOT RESOLVING","RUCH KULEK");
            if(multiplayer&&state.turn!=localOwner)return Lang.T("WAITING FOR PLAYER ","CZEKAM NA GRACZA ")+(state.turn+1);
            return dragging?AimUiStatus.Hint(true,dx,dy):idleHint;
        }

        // A stale failed-intent notice from a previous own turn must not override
        // connection or opponent-turn cues on either PC. Only an active local seat
        // may see its own action notice. No gameplay/authority change.
        public static string ActionMessage(GameState state,int localOwner,bool multiplayer,bool connected,
            bool dragging,float dx,float dy,string idleHint,string notice)
        {
            if(state!=null&&state.phase==MatchPhase.Aiming&&
                (!multiplayer||(connected&&(localOwner==0||localOwner==1)&&state.turn==localOwner))&&
                !System.String.IsNullOrEmpty(notice))
                return notice;
            return ActionHint(state,localOwner,multiplayer,connected,dragging,dx,dy,idleHint);
        }

        public static string CompactStatus(GameState state,int localOwner,bool multiplayer,bool connected)
        {
            if(state==null)return Lang.T("WAIT","CZEKAJ");
            if(state.phase==MatchPhase.Over)return state.winner<0?Lang.T("DRAW","REMIS"):Lang.T("P","G")+(state.winner+1)+Lang.T(" WINS"," WYGRYWA");
            if(multiplayer&&!connected)return "OFFLINE";
            if(state.phase==MatchPhase.Moving)return Lang.T("MOVING","RUCH");
            if(multiplayer&&state.turn!=localOwner)return Lang.T("WAIT P","CZEKAJ G")+(state.turn+1);
            if(multiplayer)return state.bonusPending?Lang.T("YOUR BONUS","TWÓJ BONUS"):Lang.T("YOUR SHOT","TWÓJ STRZAŁ");
            return Lang.T("P","G")+(state.turn+1)+(state.bonusPending?" BONUS":Lang.T(" AIM"," CEL"));
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
            !active?Lang.T("DRAG FROM LAUNCHER","PRZECIĄGNIJ OD WYRZUTNI"):Ready(active,dragX,dragY)?Lang.T("RELEASE TO LAUNCH","PUŚĆ, ŻEBY WYSTRZELIĆ"):Lang.T("DRAG TO BUILD POWER","CIĄGNIJ DALEJ, ŻEBY DODAĆ MOCY");
    }
}
