using CoreClash.Core;
namespace CoreClash.Presentation
{
    public static class BallSelection
    {
        public static string ForTurn(GameSimulation simulation,string selected)=>simulation.Stock(simulation.State.turn,selected)>0?selected:"normal";
    }
}
