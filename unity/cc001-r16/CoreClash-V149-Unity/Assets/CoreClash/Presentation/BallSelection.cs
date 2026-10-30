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

    // A32 R17-W9: presentation-only deck identity; NEVER changes turn or command ownership.
    public static class LocalDeckContent
    {
        public static int DisplayOwner(int activeOwner,int? networkOwner)
        {
            return networkOwner.HasValue&&(networkOwner.Value==0||networkOwner.Value==1)
                ?networkOwner.Value:activeOwner;
        }
        public static string[] StockIds(GameState state,int owner)
        {
            if(state==null||state.players==null||owner<0||owner>=state.players.Length||
                state.players[owner]==null||state.players[owner].stock==null)return System.Array.Empty<string>();
            return state.players[owner].stock.Where(s=>s!=null).Select(s=>s.id).ToArray();
        }
        public static int Remaining(GameSimulation simulation,int owner,string id)
        {
            return simulation==null||simulation.State==null||simulation.State.players==null||
                owner<0||owner>=simulation.State.players.Length||simulation.State.players[owner]==null||
                string.IsNullOrEmpty(id)?0:simulation.Stock(owner,id);
        }
        public static BallSelectionSource ActiveSource(GameSimulation simulation,int owner,string id)
        {
            return simulation==null||simulation.State==null||simulation.State.turn!=owner
                ?BallSelectionSource.None:BallSelection.Source(simulation,owner,id);
        }
        public static bool VisibleAsAvailable(GameSimulation simulation,int owner,string id)
        {
            return Remaining(simulation,owner,id)>0||ActiveSource(simulation,owner,id)==BallSelectionSource.Hand;
        }
        public static bool CanActivate(GameSimulation simulation,int owner,string id,bool localInputEnabled)
        {
            return localInputEnabled&&simulation!=null&&simulation.State!=null&&
                simulation.State.turn==owner&&BallSelection.CanSelect(simulation,owner,id);
        }
        public static string StockLabel(GameSimulation simulation,int owner,string id)
        {
            int remaining=Remaining(simulation,owner,id);
            if(remaining>0)return "x"+remaining;
            return ActiveSource(simulation,owner,id)==BallSelectionSource.Hand?"HAND READY":"EMPTY";
        }
    }

}
