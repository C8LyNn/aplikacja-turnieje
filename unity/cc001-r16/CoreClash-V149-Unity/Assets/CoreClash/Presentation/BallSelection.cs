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
}
