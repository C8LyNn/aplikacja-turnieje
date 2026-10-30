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
    }
}
