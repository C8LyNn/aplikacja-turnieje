using System;
using System.Linq;
using CoreClash.Core;
namespace CoreClash.Presentation
{
    // A32 R17-W10: presentation-only deck identity; NEVER changes turn or command ownership. Invalid network seats fail closed.
    public static class LocalDeckContent
    {
        public static int DisplayOwner(int activeOwner,int? networkOwner)
        {
            if(networkOwner.HasValue)return networkOwner.Value==0||networkOwner.Value==1?networkOwner.Value:-1;
            return activeOwner==0||activeOwner==1?activeOwner:-1;
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

        // Empty/unassigned local seats must not create a negative-sized phone ScrollView.
        // Presentation-only geometry; does not read or mutate authoritative game state.
        public static float TrayContentWidth(int count,float cardWidth,float gap,float viewportWidth)
        {
            float visible=viewportWidth>0f&&!float.IsNaN(viewportWidth)&&!float.IsInfinity(viewportWidth)
                ?viewportWidth:1f;
            if(count<=0||cardWidth<=0f||gap<0f||float.IsNaN(cardWidth)||
                float.IsInfinity(cardWidth)||float.IsNaN(gap)||float.IsInfinity(gap))return visible;
            float width=count*cardWidth+(count-1)*gap;
            return float.IsNaN(width)||float.IsInfinity(width)?visible:Math.Max(visible,width);
        }
        public static float ClampTrayScroll(float offset,float contentWidth,float viewportWidth)
        {
            if(float.IsNaN(offset)||float.IsInfinity(offset)||float.IsNaN(contentWidth)||
                float.IsInfinity(contentWidth)||float.IsNaN(viewportWidth)||
                float.IsInfinity(viewportWidth))return 0f;
            float limit=Math.Max(0f,contentWidth-Math.Max(1f,viewportWidth));
            return Math.Max(0f,Math.Min(offset,limit));
        }
        public static string StockLabel(GameSimulation simulation,int owner,string id)
        {
            int remaining=Remaining(simulation,owner,id);
            if(remaining>0)return "x"+remaining;
            return ActiveSource(simulation,owner,id)==BallSelectionSource.Hand?"HAND READY":"EMPTY";
        }
    }

}
