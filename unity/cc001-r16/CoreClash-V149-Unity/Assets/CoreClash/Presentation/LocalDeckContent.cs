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

        // Presentation must fail closed when a local/decoded state is incomplete.
        // The network adapter normally rejects missing player stock, but views may
        // also observe a provisional or independently constructed local state.
        static bool HasOwnerStock(GameSimulation simulation,int owner)
        {
            return simulation!=null&&simulation.State!=null&&
                simulation.State.players!=null&&owner>=0&&owner<=1&&
                owner<simulation.State.players.Length&&simulation.State.players[owner]!=null&&
                simulation.State.players[owner].stock!=null&&
                simulation.State.players[owner].stock.All(entry=>
                    entry!=null&&!string.IsNullOrEmpty(entry.id)&&entry.remaining>=0);
        }


        // Only IDs that are safe to dereference in Catalog.Ball may reach
        // MatchView's desktop, compact or phone card renderers.
        // Protocol149 accepts any nonempty stock ID structurally; this visual
        // filter never modifies the snapshot or invents a legal command.
        public static string[] RenderableStockIds(GameSimulation simulation,int owner)
        {
            if(!HasOwnerStock(simulation,owner)||simulation.Catalog==null)
                return System.Array.Empty<string>();
            var stock=simulation.State.players[owner].stock;
            // The source deck contract is exactly nine unique specials.
            if(stock.Count!=9)return System.Array.Empty<string>();
            var ids=new string[stock.Count];
            var seen=new System.Collections.Generic.HashSet<string>(StringComparer.Ordinal);
            for(int i=0;i<stock.Count;i++)
            {
                string id=stock[i].id;
                if(!seen.Add(id)||simulation.Catalog.Ball(id)==null)
                    return System.Array.Empty<string>();
                ids[i]=id;
            }
            return ids;
        }


        // A ready returned Phoenix may be playable from Hand even when it is NOT
        // among the nine original special cards (GameSimulation.TryCommand).
        // Never insert the hand into StockEntry or replace the authoritative deck.
        // Malformed nine-slot decks still render no special cards, including hand.
        public static string[] RenderableCardIds(GameSimulation simulation,int owner)
        {
            var specials=RenderableStockIds(simulation,owner);
            if(specials.Length!=9||simulation.Catalog.Ball("phoenix")==null||
                specials.Contains("phoenix")||
                DisplaySource(simulation,owner,"phoenix")!=BallSelectionSource.Hand)
                return specials;
            var withHand=new string[10];
            Array.Copy(specials,withHand,9);
            withHand[9]="phoenix";
            return withHand;
        }

        // The extra Hand card adds a fourth desktop/tablet grid row; the source
        // nine-special board keeps its original 3-row geometry.
        public static int DeckGridRows(int renderedCardCount)
        {
            return Math.Max(3,(Math.Max(0,renderedCardCount)+2)/3);
        }

        public static float DeckExtraContentHeight(int renderedCardCount,float cardHeight,float gap)
        {
            if(float.IsNaN(cardHeight)||float.IsInfinity(cardHeight)||cardHeight<0f||
                float.IsNaN(gap)||float.IsInfinity(gap)||gap<0f)return 0f;
            return Math.Max(0,DeckGridRows(renderedCardCount)-3)*(cardHeight+gap);
        }

        public static int Remaining(GameSimulation simulation,int owner,string id)
        {
            return !HasOwnerStock(simulation,owner)||string.IsNullOrEmpty(id)
                ?0:simulation.Stock(owner,id);
        }

        // W12: observational source for the LOCAL deck, also while the opponent aims.
        // This never authorizes actions. BallSelection.Source remains the turn-gated
        // command contract; do not expose DisplaySource to input or GameSimulation.
        public static BallSelectionSource DisplaySource(GameSimulation simulation,int owner,string id)
        {
            if(!HasOwnerStock(simulation,owner)||string.IsNullOrEmpty(id))
                return BallSelectionSource.None;
            if(simulation.State.turn==owner)return BallSelection.Source(simulation,owner,id);
            if(simulation.Stock(owner,id)>0)return BallSelectionSource.Stock;
            if(id!="phoenix"||simulation.State.phoenixHand==null)return BallSelectionSource.None;
            int ownerTurns=simulation.State.players[owner].ownerTurns;
            foreach(var hand in simulation.State.phoenixHand)
                if(hand!=null&&hand.owner==owner&&hand.ready&&
                    hand.createdOwnerTurns<ownerTurns&&hand.lastProcessedOwnerTurns>=ownerTurns)
                    return BallSelectionSource.Hand;
            return BallSelectionSource.None;
        }

        public static BallSelectionSource ActiveSource(GameSimulation simulation,int owner,string id)
        {
            return !HasOwnerStock(simulation,owner)||string.IsNullOrEmpty(id)||
                simulation.State.turn!=owner
                ?BallSelectionSource.None:BallSelection.Source(simulation,owner,id);
        }
        public static bool VisibleAsAvailable(GameSimulation simulation,int owner,string id)
        {
            return DisplaySource(simulation,owner,id)!=BallSelectionSource.None;
        }
        public static bool CanActivate(GameSimulation simulation,int owner,string id,bool localInputEnabled)
        {
            return localInputEnabled&&HasOwnerStock(simulation,owner)&&
                !string.IsNullOrEmpty(id)&&simulation.Catalog!=null&&
                simulation.Catalog.Ball(id)!=null&&simulation.State.turn==owner&&
                BallSelection.CanSelect(simulation,owner,id);
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
            var source=DisplaySource(simulation,owner,id);
            if(source==BallSelectionSource.Stock)return "x"+Remaining(simulation,owner,id);
            return source==BallSelectionSource.Hand?"HAND READY":"EMPTY";
        }
    }

}
