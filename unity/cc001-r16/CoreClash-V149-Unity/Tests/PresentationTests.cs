using CoreClash.Presentation;
using CoreClash.Core;
using System.Linq;
public static partial class Program
{
    static void PresentationTests()
    {
        Test("new active player cannot inherit a ball outside their deck",()=>{var s=new GameSimulation(catalog,catalog.Featured[0],catalog.Featured[1]);s.State.turn=1;Eq("normal",BallSelection.ForTurn(s,"agony"));});
        Test("exhausted selection falls back to unlimited Standard",()=>{var s=new GameSimulation(catalog,catalog.Featured[0],catalog.Featured[1]);Eq("agony",BallSelection.ForTurn(s,"agony"));s.State.players[0].stock.First(x=>x.id=="agony").remaining=0;Eq("normal",BallSelection.ForTurn(s,"agony"));});
        foreach(var size in new[]{(1280,900),(960,600),(1920,1080),(390,844),(844,390)}){
            Test("presentation arena and controls remain usable at "+size.Item1+"x"+size.Item2,()=>{
                var layout=MatchLayout.For(size.Item1,size.Item2);var board=layout.Board;var panel=layout.Panel;
                True(board.width>140&&board.height>230,"arena became too small");Near(.6f,board.width/board.height,.001f);
                foreach(var r in new[]{board,panel})True(r.x>=0&&r.y>=60&&r.Right<=size.Item1&&r.Bottom<=size.Item2,"surface leaves viewport");
                True(board.Right<=panel.x||board.Bottom<=panel.y,"controls overlap arena");
                if(!layout.Portrait)True(panel.width>=360&&panel.width<=520,"desktop control column lost fixed width bounds");
            });
        }

        // R17-W3 A20 test-first compact landscape contract. Source edits follow separately.
        foreach(var size in new[]{(844f,340f),(667f,325f),(568f,270f),(844f,390f)}){
            Test("A20 compact phone landscape keeps fixed critical controls visible "+size.Item1+"x"+size.Item2,()=>{
                var l=MatchLayout.For(size.Item1,size.Item2,DeviceProfile.Phone);
                True(l.CompactLandscape,"compact landscape profile not selected");
                False(l.Portrait);
                Near(.6f,l.Board.width/l.Board.height,.001f);
                True(l.Board.y>=60,"board enters global header");
                True(l.Board.width>100&&l.Board.height>=190,"compact arena collapsed");
                True(l.Panel.width>=320&&l.Panel.height>=190,"compact side panel cannot fit actions");
                foreach(var r in new[]{l.Board,l.Panel,l.CompactHud,l.CompactChoice,l.CompactCards,l.CompactActions}){
                    True(r.width>=44&&r.height>=44,"required surface / touch target below 44");
                    True(r.x>=0&&r.y>=60&&r.Right<=size.Item1&&r.Bottom<=size.Item2,"surface leaves safe viewport");
                }
                True(Separated(l.Board,l.Panel),"panel obscures aiming arena");
                foreach(var r in new[]{l.CompactHud,l.CompactChoice,l.CompactCards,l.CompactActions}){
                    True(r.x>=l.Panel.x&&r.Right<=l.Panel.Right&&r.y>=l.Panel.y&&r.Bottom<=l.Panel.Bottom,"critical row outside panel");
                }
                True(l.CompactHud.Bottom<=l.CompactChoice.y&&l.CompactChoice.Bottom<=l.CompactCards.y&&l.CompactCards.Bottom<=l.CompactActions.y,"compact rows overlap");
                True(l.CompactActions.Bottom<=l.Panel.Bottom,"actions are not sticky within visible panel");
                if(l.CompactFeedback.height>=20)True(l.CompactFeedback.y>=l.CompactActions.Bottom&&l.CompactFeedback.Bottom<=l.Panel.Bottom,"feedback row overlaps actions");
            });
        }
        Test("A20 compact phone arena enlarges R16 board while keeping world aspect",()=>{
            foreach(var item in new[]{(844f,340f,148.8f),(667f,325f,139.8f),(568f,270f,106.8f)}){
                var l=MatchLayout.For(item.Item1,item.Item2,DeviceProfile.Phone);
                True(l.CompactLandscape&&l.Board.width>item.Item3,"no arena gain vs canonical R16");
                Near(.6f,l.Board.width/l.Board.height,.001f);
            }
        });
        Test("A20 compact layout leaves portrait, tablet, desktop unchanged",()=>{
            foreach(var item in new[]{(390f,844f,DeviceProfile.Phone),(820f,1180f,DeviceProfile.Tablet),(1366f,1024f,DeviceProfile.Tablet),(1280f,900f,DeviceProfile.Desktop)}){
                var a=MatchLayout.For(item.Item1,item.Item2,item.Item3);
                False(a.CompactLandscape);
                True(a.Board.width>100&&Separated(a.Board,a.Panel));
            }
        });
        Test("A20 compact eligibility refuses too-short height or narrow panel",()=>{
            False(MatchLayout.For(600,250,DeviceProfile.Phone).CompactLandscape);
            False(MatchLayout.For(400,330,DeviceProfile.Phone).CompactLandscape);
        });

        // R17-W6 / A20: Phoenix-hand selection parity with core TryCommand.
        Test("PHX-UI-01 ready Phoenix hand with exhausted stock can be selected",()=>{
            var s=PhoenixUiFixture();PhoenixUiHand(s);
            Eq(0,s.Stock(0,"phoenix"));
            Eq(BallSelectionSource.Hand,BallSelection.Source(s,0,"phoenix"));
            True(BallSelection.CanSelect(s,0,"phoenix"));
            Eq("phoenix",BallSelection.ForTurn(s,"phoenix"));
            Eq("HAND READY",BallSelection.StockLabel(s,0,"phoenix"));
        });
        Test("PHX-UI-02 exhausted Phoenix without ready hand falls back to Standard",()=>{
            var s=PhoenixUiFixture();
            Eq(BallSelectionSource.None,BallSelection.Source(s,0,"phoenix"));
            False(BallSelection.CanSelect(s,0,"phoenix"));
            Eq("normal",BallSelection.ForTurn(s,"phoenix"));
            Eq("EMPTY",BallSelection.StockLabel(s,0,"phoenix"));
        });
        Test("PHX-UI-03 genuine Phoenix stock takes priority over ready hand",()=>{
            var s=PhoenixUiFixture(1);PhoenixUiHand(s);
            Eq(BallSelectionSource.Stock,BallSelection.Source(s,0,"phoenix"));
            Eq("x1",BallSelection.StockLabel(s,0,"phoenix"));
            True(s.TryCommand(Shot(s,0,"phoenix"),out _));
            Eq(0,s.Stock(0,"phoenix"));Eq(1,s.State.phoenixHand.Count);
            Eq(BallSelectionSource.Hand,BallSelection.Source(s,0,"phoenix"));
        });
        Test("PHX-UI-04 unready Phoenix hand is unavailable",()=>{
            var s=PhoenixUiFixture();var h=PhoenixUiHand(s);h.ready=false;
            Eq(BallSelectionSource.None,BallSelection.Source(s,0,"phoenix"));
            Eq("normal",BallSelection.ForTurn(s,"phoenix"));
        });
        Test("PHX-UI-05 opponent-owned ready Phoenix hand is unavailable",()=>{
            var s=PhoenixUiFixture();var h=PhoenixUiHand(s);h.owner=1;
            Eq(BallSelectionSource.None,BallSelection.Source(s,0,"phoenix"));
            False(BallSelection.CanSelect(s,0,"phoenix"));
        });
        Test("PHX-UI-06 same-turn and stale-processed Phoenix hands are unavailable",()=>{
            var s=PhoenixUiFixture();var h=PhoenixUiHand(s);
            h.createdOwnerTurns=s.State.players[0].ownerTurns;
            Eq(BallSelectionSource.None,BallSelection.Source(s,0,"phoenix"));
            h.createdOwnerTurns=s.State.players[0].ownerTurns-1;
            h.lastProcessedOwnerTurns=s.State.players[0].ownerTurns-1;
            Eq(BallSelectionSource.None,BallSelection.Source(s,0,"phoenix"));
            h.lastProcessedOwnerTurns=s.State.players[0].ownerTurns+1;
            Eq(BallSelectionSource.Hand,BallSelection.Source(s,0,"phoenix"));
        });
        Test("PHX-UI-07 consuming last ready hand removes Phoenix availability",()=>{
            var s=PhoenixUiFixture();PhoenixUiHand(s);
            True(BallSelection.CanSelect(s,0,"phoenix"));
            True(s.TryCommand(Shot(s,0,"phoenix"),out _));
            Eq(0,s.Stock(0,"phoenix"));Eq(0,s.State.phoenixHand.Count);
            Eq(BallSelectionSource.None,BallSelection.Source(s,0,"phoenix"));
            Eq("normal",BallSelection.ForTurn(s,"phoenix"));
            Eq("EMPTY",BallSelection.StockLabel(s,0,"phoenix"));
        });
        Test("PHX-UI-08 exhausted non-Phoenix ball still falls back to Standard",()=>{
            var s=Sim();var entry=s.State.players[0].stock.First(x=>x.id=="fire");entry.remaining=0;
            Eq(BallSelectionSource.None,BallSelection.Source(s,0,"fire"));
            False(BallSelection.CanSelect(s,0,"fire"));
            Eq("normal",BallSelection.ForTurn(s,"fire"));
            Eq("EMPTY",BallSelection.StockLabel(s,0,"fire"));
        });
        Test("PHX-UI-09 opponent turn never enables own Phoenix hand or stock",()=>{
            var s=PhoenixUiFixture(1);PhoenixUiHand(s);
            Eq(BallSelectionSource.None,BallSelection.Source(s,1,"phoenix"));
            False(BallSelection.CanSelect(s,1,"phoenix"));
        });
        Test("PHX-UI-10 one ready hand wins over an invalid earlier hand",()=>{
            var s=PhoenixUiFixture();var early=PhoenixUiHand(s);early.ready=false;
            PhoenixUiHand(s);
            Eq(BallSelectionSource.Hand,BallSelection.Source(s,0,"phoenix"));
        });
    }
    static GameSimulation PhoenixUiFixture(int stock=0)
    {
        var s=Sim();
        s.State.players[0].stock.Add(new StockEntry{id="phoenix",remaining=stock});
        return s;
    }
    static PhoenixHandEntry PhoenixUiHand(GameSimulation simulation)
    {
        var turns=simulation.State.players[0].ownerTurns;
        var hand=new PhoenixHandEntry{
            owner=0,ready=true,createdOwnerTurns=turns-1,
            lastProcessedOwnerTurns=turns,hp=10,maxHp=25,shield=0
        };
        simulation.State.phoenixHand.Add(hand);
        return hand;
    }

}
