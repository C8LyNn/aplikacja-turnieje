using System;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Presentation;

public static partial class Program
{
    static void LocalDeckContentTests()
    {
        Test("A32 W10 offline deck follows active owner but LAN client pins local owner",()=>{
            Eq(0,LocalDeckContent.DisplayOwner(0,null));
            Eq(1,LocalDeckContent.DisplayOwner(1,null));
            Eq(0,LocalDeckContent.DisplayOwner(1,0));
            Eq(1,LocalDeckContent.DisplayOwner(0,1));
            Eq(-1,LocalDeckContent.DisplayOwner(1,2)); // invalid network owner fails closed
        });
        Test("A32 W10 invalid network seat cannot display opponent inventory or activate cards",()=>{
            var sim=new GameSimulation(catalog,catalog.Featured[0],catalog.Featured[1]);
            int owner=LocalDeckContent.DisplayOwner(sim.State.turn,7);
            Eq(-1,owner);
            Eq(0,LocalDeckContent.StockIds(sim.State,owner).Length);
            False(LocalDeckContent.VisibleAsAvailable(sim,owner,sim.State.players[0].stock[0].id));
            False(LocalDeckContent.CanActivate(sim,owner,sim.State.players[0].stock[0].id,true));
        });
        Test("A32 W10 P2 nine-special roster stays P2 during P1 turn",()=>{
            var sim=new GameSimulation(catalog,catalog.Featured[0],catalog.Featured[1]);
            sim.State.turn=0;
            int owner=LocalDeckContent.DisplayOwner(sim.State.turn,1);
            Eq(1,owner);
            var ids=LocalDeckContent.StockIds(sim.State,owner);
            Eq(9,ids.Length);
            True(ids.SequenceEqual(sim.State.players[1].stock.Select(x=>x.id)));
            True(ids.SequenceEqual(catalog.Featured[1].balls));
            False(ids.SequenceEqual(catalog.Featured[0].balls));
        });
        Test("A32 W10 P2 stock remains visible on P1 turn but never selectable",()=>{
            var sim=new GameSimulation(catalog,catalog.Featured[0],catalog.Featured[1]);
            sim.State.turn=0;
            string id=sim.State.players[1].stock[0].id;
            True(LocalDeckContent.Remaining(sim,1,id)>0);
            True(LocalDeckContent.VisibleAsAvailable(sim,1,id));
            True(LocalDeckContent.StockLabel(sim,1,id).StartsWith("x",StringComparison.Ordinal));
            Eq(BallSelectionSource.None,LocalDeckContent.ActiveSource(sim,1,id));
            False(LocalDeckContent.CanActivate(sim,1,id,true));
            False(LocalDeckContent.CanActivate(sim,0,id,false));
        });
        Test("A32 W10 P2 input is eligible only on the authoritative P2 turn",()=>{
            var sim=new GameSimulation(catalog,catalog.Featured[0],catalog.Featured[1]);
            string id=sim.State.players[1].stock[0].id;
            sim.State.turn=1;
            True(LocalDeckContent.CanActivate(sim,1,id,true));
            False(LocalDeckContent.CanActivate(sim,0,id,true));
            False(LocalDeckContent.CanActivate(sim,1,id,false));
            sim.State.players[1].stock[0].remaining=0;
            False(LocalDeckContent.VisibleAsAvailable(sim,1,id));
            Eq("EMPTY",LocalDeckContent.StockLabel(sim,1,id));
            False(LocalDeckContent.CanActivate(sim,1,id,true));
        });
        Test("A32 W10 local deck queries cannot mutate stock, turn, revision or serial",()=>{
            var sim=new GameSimulation(catalog,catalog.Featured[0],catalog.Featured[1]);
            var a=sim.State.players[0].stock.Select(x=>x.remaining).ToArray();
            var b=sim.State.players[1].stock.Select(x=>x.remaining).ToArray();
            int turn=sim.State.turn,revision=sim.State.revision,serial=sim.State.actionSerial;
            foreach(int owner in new[]{0,1})
                foreach(string id in LocalDeckContent.StockIds(sim.State,owner)){
                    LocalDeckContent.StockLabel(sim,owner,id);
                    LocalDeckContent.VisibleAsAvailable(sim,owner,id);
                    LocalDeckContent.CanActivate(sim,owner,id,true);
                }
            Eq(turn,sim.State.turn);Eq(revision,sim.State.revision);Eq(serial,sim.State.actionSerial);
            True(a.SequenceEqual(sim.State.players[0].stock.Select(x=>x.remaining)));
            True(b.SequenceEqual(sim.State.players[1].stock.Select(x=>x.remaining)));
        });

        Test("A32 W11 phone tray empty local seat never produces negative content width",()=>{
            float viewport=380f;
            Eq(viewport,LocalDeckContent.TrayContentWidth(0,96f,8f,viewport));
            Eq(viewport,LocalDeckContent.TrayContentWidth(-1,96f,8f,viewport));
            Eq(0f,LocalDeckContent.ClampTrayScroll(250f,viewport,viewport));
        });
        Test("A32 W11 phone tray nine-slot content and stale offset are bounded",()=>{
            float width=LocalDeckContent.TrayContentWidth(9,96f,8f,200f);
            Eq(928f,width);
            Eq(728f,LocalDeckContent.ClampTrayScroll(999f,width,200f));
            Eq(0f,LocalDeckContent.ClampTrayScroll(-10f,width,200f));
            Eq(40f,LocalDeckContent.ClampTrayScroll(40f,width,200f));
            Eq(0f,LocalDeckContent.ClampTrayScroll(float.NaN,width,200f));
        });
        Test("A32 W11 invalid phone dimensions fail closed to finite viewport",()=>{
            Eq(1f,LocalDeckContent.TrayContentWidth(0,96f,8f,float.NaN));
            Eq(1f,LocalDeckContent.TrayContentWidth(0,96f,8f,-4f));
            Eq(100f,LocalDeckContent.TrayContentWidth(4,float.PositiveInfinity,8f,100f));
            Eq(0f,LocalDeckContent.ClampTrayScroll(8f,float.PositiveInfinity,100f));
        });
        Test("A32 W11 transition from P2 roster to disconnected seat resets phone scroll",()=>{
            var sim=new GameSimulation(catalog,catalog.Featured[0],catalog.Featured[1]);
            int valid=LocalDeckContent.DisplayOwner(sim.State.turn,1);
            float liveWidth=LocalDeckContent.TrayContentWidth(LocalDeckContent.StockIds(sim.State,valid).Length,96f,8f,320f);
            True(liveWidth>320f);
            int disconnected=LocalDeckContent.DisplayOwner(sim.State.turn,-1);
            Eq(-1,disconnected);
            float emptyWidth=LocalDeckContent.TrayContentWidth(LocalDeckContent.StockIds(sim.State,disconnected).Length,96f,8f,320f);
            Eq(320f,emptyWidth);
            Eq(0f,LocalDeckContent.ClampTrayScroll(450f,emptyWidth,320f));
        });

        Test("A32 W12 P2 waiting retains ready Phoenix hand as deck content, not input",()=>{
            var s=A32ReadyPhoenixDeck();
            Eq(0,s.State.turn);
            Eq(BallSelectionSource.None,LocalDeckContent.ActiveSource(s,1,"phoenix"));
            Eq(BallSelectionSource.Hand,LocalDeckContent.DisplaySource(s,1,"phoenix"));
            True(LocalDeckContent.VisibleAsAvailable(s,1,"phoenix"));
            Eq("HAND READY",LocalDeckContent.StockLabel(s,1,"phoenix"));
            False(LocalDeckContent.CanActivate(s,1,"phoenix",true));
        });
        Test("A32 W12 Phoenix hand becomes selectable only with authoritative owner turn",()=>{
            var s=A32ReadyPhoenixDeck();
            False(LocalDeckContent.CanActivate(s,1,"phoenix",true));
            s.State.turn=1;
            Eq(BallSelectionSource.Hand,LocalDeckContent.DisplaySource(s,1,"phoenix"));
            Eq(BallSelectionSource.Hand,BallSelection.Source(s,1,"phoenix"));
            True(LocalDeckContent.CanActivate(s,1,"phoenix",true));
            False(LocalDeckContent.CanActivate(s,1,"phoenix",false));
        });
        Test("A32 W12 stale, unready or opponent-owned Phoenix hand never appears",()=>{
            var s=A32ReadyPhoenixDeck();
            var hand=s.State.phoenixHand[0];
            hand.ready=false;Eq(BallSelectionSource.None,LocalDeckContent.DisplaySource(s,1,"phoenix"));
            hand.ready=true;hand.createdOwnerTurns=s.State.players[1].ownerTurns;
            Eq(BallSelectionSource.None,LocalDeckContent.DisplaySource(s,1,"phoenix"));
            hand.createdOwnerTurns=1;hand.lastProcessedOwnerTurns=1;
            Eq(BallSelectionSource.None,LocalDeckContent.DisplaySource(s,1,"phoenix"));
            hand.lastProcessedOwnerTurns=3;hand.owner=0;
            Eq(BallSelectionSource.None,LocalDeckContent.DisplaySource(s,1,"phoenix"));
            Eq("EMPTY",LocalDeckContent.StockLabel(s,1,"phoenix"));
        });
        Test("A32 W12 P2 ordinary Phoenix stock is displayed before hand on P1 turn",()=>{
            var s=A32ReadyPhoenixDeck();
            s.State.players[1].stock.First(x=>x.id=="phoenix").remaining=2;
            Eq(BallSelectionSource.Stock,LocalDeckContent.DisplaySource(s,1,"phoenix"));
            Eq("x2",LocalDeckContent.StockLabel(s,1,"phoenix"));
            False(LocalDeckContent.CanActivate(s,1,"phoenix",true));
            Eq(BallSelectionSource.None,LocalDeckContent.DisplaySource(s,-1,"phoenix"));
            Eq(BallSelectionSource.None,LocalDeckContent.DisplaySource(s,3,"phoenix"));
        });
        Test("A32 W12 deck-display Phoenix queries cannot alter authoritative state or hand",()=>{
            var s=A32ReadyPhoenixDeck();
            int revision=s.State.revision,serial=s.State.actionSerial,turn=s.State.turn;
            int count=s.State.phoenixHand.Count,stock=s.State.players[1].stock.Last().remaining;
            var hand=s.State.phoenixHand[0];
            int handOwner=hand.owner,handTurn=hand.lastProcessedOwnerTurns;
            for(int i=0;i<4;i++){
                Eq(BallSelectionSource.Hand,LocalDeckContent.DisplaySource(s,1,"phoenix"));
                True(LocalDeckContent.VisibleAsAvailable(s,1,"phoenix"));
                Eq("HAND READY",LocalDeckContent.StockLabel(s,1,"phoenix"));
            }
            Eq(revision,s.State.revision);Eq(serial,s.State.actionSerial);Eq(turn,s.State.turn);
            Eq(count,s.State.phoenixHand.Count);Eq(stock,s.State.players[1].stock.Last().remaining);
            Eq(handOwner,hand.owner);Eq(handTurn,hand.lastProcessedOwnerTurns);
        });
    }
    static GameSimulation A32ReadyPhoenixDeck()
    {
        var s=Sim(); // Existing nine-special test deck; local read-only Phoenix is an extra fixture entry.
        s.State.players[1].stock.Add(new StockEntry{id="phoenix",remaining=0});
        s.State.players[1].ownerTurns=3;
        s.State.phoenixHand.Add(new PhoenixHandEntry{
            owner=1,ready=true,createdOwnerTurns=2,lastProcessedOwnerTurns=3,
            hp=10,maxHp=25
        });
        return s;
    }

}
