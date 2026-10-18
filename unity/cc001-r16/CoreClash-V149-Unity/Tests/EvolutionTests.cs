using System;
using System.Linq;
using System.Text.Json;
using CoreClash.Core;
using CoreClash.Networking;
using CoreClash.Presentation;

public static partial class Program
{
    static void EvolutionTests()
    {
        Test("R12 Hatchery produces one 5HP Broodling after two distinct own turns", () => {
            var s=Sim();var h=s.Spawn(0,"hatchery",270,450);
            s.Abilities.OnTurnStart(0);Eq(1,h.hatcheryTurnCounter);
            Eq(0,s.State.balls.Count(x=>x.type=="broodling"));
            s.Abilities.OnTurnStart(0);Eq(1,h.hatcheryTurnCounter);
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);
            var child=s.State.balls.Single(x=>x.type=="broodling");
            Eq(5,child.hp);Eq(5,child.maxHp);True(child.generated);Eq(0,child.owner);
            Eq(1,h.hatcherySpawnCount);Eq(0,h.hatcheryTurnCounter);
            True(s.State.replayedIds.Contains(child.id));
        });
        Test("R12 Hatchery caps at three and never creates extra Broodlings", () => {
            var s=Sim();var h=s.Spawn(0,"hatchery",270,450);
            for(int i=0;i<10;i++){s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);}
            Eq(3,h.hatcherySpawnCount);Eq(3,s.State.balls.Count(x=>x.type=="broodling"));
            Eq(0,h.hatcheryTurnCounter);
        });
        Test("R12 Hatchery retries a blocked birth without using stock or progress", () => {
            var s=Sim();var h=s.Spawn(0,"hatchery",270,450);
            s.Abilities.OnTurnStart(0);
            for(int i=0;i<255;i++)s.State.balls.Add(new BallRuntime{id=s.State.nextId++,type="normal",owner=1,hp=5,maxHp=5,radius=1,x=30+i,y=120});
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);
            Eq(1,h.hatcheryTurnCounter);Eq(0,h.hatcherySpawnCount);
            foreach(var x in s.State.balls.Where(x=>x.id!=h.id))x.dead=true;
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);
            Eq(1,h.hatcherySpawnCount);Eq(0,h.hatcheryTurnCounter);
        });
        Test("R12 Replicator clones inherited current HP every two own turns", () => {
            var s=Sim();var p=s.Spawn(0,"replicator",270,450);p.hp=10;
            s.Abilities.OnTurnStart(0);Eq(1,p.replicatorTurnCounter);
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);
            var clone=s.State.balls.Single(x=>x.type=="replicator"&&x.id!=p.id);
            Eq(10,clone.hp);Eq(s.Catalog.Ball("replicator").hp,clone.maxHp);
            True(clone.generated);Eq(0,clone.replicatorTurnCounter);
            Eq(0,p.replicatorTurnCounter);
        });
        Test("R12 Replicator respects three living owners' replicas incl. generated", () => {
            var s=Sim();var p=s.Spawn(0,"replicator",270,450);
            var a=s.Spawn(0,"replicator",80,450);var b=s.Spawn(0,"replicator",460,450);
            for(int i=0;i<4;i++){s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);}
            Eq(3,s.State.balls.Count(x=>!x.dead&&x.owner==0&&x.type=="replicator"));
            s.Kill(a);
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);
            Eq(3,s.State.balls.Count(x=>!x.dead&&x.owner==0&&x.type=="replicator"));
        });
        Test("R12 Replicator timer resets on capacity block, no partial birth", () => {
            var s=Sim();var p=s.Spawn(0,"replicator",270,450);
            s.Abilities.OnTurnStart(0);
            for(int i=0;i<255;i++)s.State.balls.Add(new BallRuntime{id=s.State.nextId++,type="normal",owner=1,hp=5,maxHp=5,radius=1,x=30+i,y=120});
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);
            Eq(0,p.replicatorTurnCounter);Eq(1,s.State.balls.Count(x=>x.type=="replicator"));
        });
        Test("R12 Mitosis splits on weak ball contact and only once", () => {
            var s=Sim();var m=s.Spawn(0,"mitosis",270,450);var target=s.Spawn(1,"normal",325,450);
            s.Abilities.OnPairContact(m,target,false,true,25);
            Eq(2,s.State.balls.Count(x=>!x.dead&&x.type=="mitosis"));
            Eq(15,m.hp);Eq(15,m.maxHp);True(m.mitosisSplit);
            var child=s.State.balls.Single(x=>x.type=="mitosis"&&x.id!=m.id);
            Eq(15,child.hp);Eq(15,child.maxHp);True(child.mitosisSplit);True(child.generated);
            s.Abilities.OnPairContact(m,target,true,true,200);
            Eq(2,s.State.balls.Count(x=>x.type=="mitosis"));
        });
        Test("R12 Mitosis jam blocks one contact, next eligible contact splits", () => {
            var s=Sim();var m=s.Spawn(0,"mitosis",270,450);var target=s.Spawn(1,"normal",325,450);
            m.jammed=1;s.Abilities.OnPairContact(m,target,false,true,25);
            False(m.mitosisSplit);Eq(0,m.jammed);
            s.Abilities.OnPairContact(m,target,false,true,25);
            True(m.mitosisSplit);
        });
        Test("R12 Mitosis cannot split beyond global live-ball cap", () => {
            var s=Sim();var m=s.Spawn(0,"mitosis",270,450);var target=s.Spawn(1,"normal",325,450);
            for(int i=0;i<254;i++)s.State.balls.Add(new BallRuntime{id=s.State.nextId++,type="normal",owner=1,hp=5,maxHp=5,radius=1,x=30+i,y=120});
            s.Abilities.OnPairContact(m,target,false,true,25);False(m.mitosisSplit);Eq(35,m.hp);
            foreach(var x in s.State.balls.Where(x=>x.id!=m.id&&x.id!=target.id))x.dead=true;
            s.Abilities.OnPairContact(m,target,false,true,25);True(m.mitosisSplit);
        });
        Test("R12 Mitosis pair resolves before identity theft regardless of source order", () => {
            var s=Sim();var mimic=s.Spawn(0,"mimic",270,450);var m=s.Spawn(1,"mitosis",330,450);
            s.Abilities.OnPairContact(mimic,m,false,true,40);
            True(m.mitosisSplit || m.type!="mitosis");
            True(s.State.events.Any(x=>x.kind=="MITOSIS"));
        });
        Test("R12 Swarm Core DEATH summons three non-stock shard tokens", () => {
            var s=Sim();var core=s.Spawn(0,"swarmcore",270,450);
            s.Kill(core);
            var shards=s.State.balls.Where(x=>x.type=="shard"&&!x.dead).ToArray();
            Eq(3,shards.Length);True(shards.All(x=>x.hp==5&&x.maxHp==5&&x.generated));
            True(s.State.events.Any(x=>x.kind=="SWARM"));
            Eq(1,s.State.graveyard.Count(x=>x.ballId==core.id));
            s.Kill(core);Eq(3,s.State.balls.Count(x=>x.type=="shard"));
        });
        Test("R12 Agony can repeat Swarm Core death effect while source survives", () => {
            var s=Sim();var agony=s.Spawn(0,"agony",180,450);var source=s.Spawn(0,"swarmcore",270,450);
            s.Abilities.OnContact(agony,source,false,true,40);
            False(source.dead);Eq(3,s.State.balls.Count(x=>x.type=="shard"));
        });
        Test("R12 Conscriptor promotes nearest allied Standard within long range", () => {
            var s=Sim();var source=s.Spawn(0,"conscriptor",270,450);
            var near=s.Spawn(0,"normal",320,450);var far=s.Spawn(0,"normal",100,100);
            var enemy=s.Spawn(1,"normal",295,450);
            int hp=near.maxHp;float mass=near.mass,speed=near.maxSpeed;
            s.Kill(source);
            Eq(hp+10,near.maxHp);Eq(hp+10,near.hp);
            Near(Math.Min(1.5f,mass+.10f),near.mass);
            Near(Math.Min(860f,speed+40),near.maxSpeed);
            Eq(1,near.veteranUpgrades);Eq(30,far.maxHp);Eq(30,enemy.maxHp);
        });
        Test("R12 Conscriptor death repeats can upgrade token Standards, not distant ones", () => {
            var s=Sim();var source=s.Spawn(0,"conscriptor",270,450);
            var token=s.Spawn(0,"normal",310,450);token.generated=true;
            var far=s.Spawn(0,"normal",70,70);
            var agony=s.Spawn(0,"agony",260,520);
            s.Abilities.OnContact(agony,source,false,true,40);
            Eq(40,token.maxHp);Eq(1,token.veteranUpgrades);False(source.dead);
            s.Kill(source);Eq(50,token.maxHp);Eq(2,token.veteranUpgrades);
            Eq(30,far.maxHp);
        });
        Test("R12 Evolution counters and Veteran markers survive authoritative JSON snapshot", () => {
            var s=Sim();var hatch=s.Spawn(0,"hatchery",270,450);
            var rep=s.Spawn(0,"replicator",100,450);
            var con=s.Spawn(0,"conscriptor",400,450);
            var normal=s.Spawn(0,"normal",415,500);
            s.Abilities.OnTurnStart(0);s.Kill(con);
            var opts=new JsonSerializerOptions{IncludeFields=true};
            var packet=new NetworkGameSession(s).Capture(state=>JsonSerializer.Serialize(state,opts));
            var adapter=new NetworkGameStateAdapter();
            True(adapter.Apply(packet,json=>JsonSerializer.Deserialize<GameState>(json,opts),out _));
            var h=adapter.State.balls.Single(x=>x.id==hatch.id);
            Eq(1,h.hatcheryTurnCounter);
            var r=adapter.State.balls.Single(x=>x.id==rep.id);
            Eq(1,r.replicatorTurnCounter);
            True(adapter.State.balls.Single(x=>x.id==normal.id).veteranUpgrades>0);
        });
        Test("R12 Evolution status labels are readable", () => {
            var s=Sim();var h=s.Spawn(0,"hatchery",270,450);
            s.Abilities.OnTurnStart(0);
            True(BallInspection.Statuses(h).Any(x=>x.Code=="H0/3"));
            var m=s.Spawn(0,"mitosis",400,450);s.Abilities.OnContact(m,h,false,true,15);
            True(BallInspection.Statuses(m).Any(x=>x.Code=="DIV"));
            var con=s.Spawn(0,"conscriptor",270,550);var n=s.Spawn(0,"normal",290,560);
            s.Kill(con);True(BallInspection.Statuses(n).Any(x=>x.Code=="VET"));
        });
        Test("R12 identity changes clear counters so copied abilities start fresh", () => {
            var s=Sim();var mimic=s.Spawn(0,"mimic",100,450);var h=s.Spawn(1,"hatchery",250,450);
            h.hatcheryTurnCounter=1;h.hatcherySpawnCount=2;
            s.Abilities.OnContact(mimic,h,false,true,30);
            Eq("hatchery",mimic.type);Eq(0,mimic.hatcheryTurnCounter);Eq(0,mimic.hatcherySpawnCount);
            Eq("normal",h.type);Eq(0,h.hatcheryTurnCounter);
        });
    }
}
