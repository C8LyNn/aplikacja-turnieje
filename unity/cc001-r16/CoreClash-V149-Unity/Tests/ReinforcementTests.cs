using System;
using System.Linq;
using System.Text.Json;
using CoreClash.Core;
using CoreClash.Networking;
using CoreClash.Presentation;

public static partial class Program
{
    static void ReinforcementTests()
    {
        Test("R11 Commander shields only allied Standards, including generated tokens, to cap 10", () => {
            var s=Sim();var command=s.Spawn(0,"commander",270,450);
            var normal=s.Spawn(0,"normal",170,450);var brood=s.Spawn(0,"broodling",190,540);
            var enemy=s.Spawn(1,"normal",380,450);var distant=s.Spawn(0,"normal",70,100);
            s.Abilities.OnTurnStart(0);
            Eq(5,normal.shield);Eq(5,distant.shield);Eq(0,brood.shield);Eq(0,enemy.shield);
            s.Abilities.OnTurnStart(0);Eq(5,normal.shield); // repeated callback cannot pay twice
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);Eq(10,normal.shield);
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);Eq(10,normal.shield);
            Eq(0,command.shield);
        });
        Test("R11 Quartermaster creates Standard 10HP on every second distinct own turn without stock", () => {
            var s=Sim();var q=s.Spawn(0,"quartermaster",270,450);
            int before=s.Stock(0,"normal");
            s.Abilities.OnTurnStart(0);Eq(1,q.quartermasterTurnCounter);
            Eq(0,s.State.balls.Count(x=>x.generated&&x.type=="normal"));
            s.Abilities.OnTurnStart(0);Eq(1,q.quartermasterTurnCounter);
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);
            var token=s.State.balls.Single(x=>x.generated&&x.type=="normal");
            Eq(10,token.hp);Eq(10,token.maxHp);Eq(0,token.owner);
            True(s.State.replayedIds.Contains(token.id));Eq(before,s.Stock(0,"normal"));
            Eq(0,q.quartermasterTurnCounter);
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);Eq(1,q.quartermasterTurnCounter);
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);Eq(2,s.State.balls.Count(x=>x.generated&&x.type=="normal"));
        });
        Test("R11 blocked Quartermaster spawn keeps progress and retries once", () => {
            var s=Sim();var q=s.Spawn(0,"quartermaster",270,450);
            s.Abilities.OnTurnStart(0);Eq(1,q.quartermasterTurnCounter);
            for(int i=0;i<255;i++)s.State.balls.Add(new BallRuntime{ id=s.State.nextId++,owner=1,type="normal",hp=5,maxHp=5,radius=1,x=30+i,y=100});
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);
            Eq(1,q.quartermasterTurnCounter);Eq(0,s.State.balls.Count(x=>x.generated&&x.type=="normal"));
            foreach(var extra in s.State.balls.Where(x=>x.id!=q.id).ToArray())extra.dead=true;
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);
            Eq(0,q.quartermasterTurnCounter);Eq(1,s.State.balls.Count(x=>x.generated&&x.type=="normal"));
        });
        Test("R11 Quartermaster token is not put into normal graveyard and has no stock cost", () => {
            var s=Sim();s.Spawn(0,"quartermaster",270,450);
            s.Abilities.OnTurnStart(0);s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);
            var t=s.State.balls.Single(x=>x.generated&&x.type=="normal");s.Kill(t);
            False(s.State.graveyard.Any(x=>x.ballId==t.id));
        });
        Test("R11 Armorer STOP only shields nearby allied Standards to 15, Echo-compatible", () => {
            var s=Sim();var a=s.Spawn(0,"armorer",270,450);
            var near=s.Spawn(0,"normal",360,450);var far=s.Spawn(0,"normal",80,100);
            var brood=s.Spawn(0,"broodling",280,390);var enemy=s.Spawn(1,"normal",280,490);
            for(int i=0;i<4;i++)s.Abilities.OnStop(a);
            Eq(15,near.shield);Eq(0,far.shield);Eq(0,brood.shield);Eq(0,enemy.shield);
        });
        Test("R11 Splitter STOP replaces parent with two token shards, not a DEATH trigger", () => {
            var s=Sim();var split=s.Spawn(0,"splitter",270,450);split.angle=0;
            s.Abilities.OnStop(split);
            True(split.dead);True(split.splitDone);
            var children=s.State.balls.Where(b=>b.type=="shard"&&!b.dead).ToArray();
            Eq(2,children.Length);True(children.All(x=>x.generated&&x.owner==0));
            Eq(0,s.State.graveyard.Count);False(s.State.events.Any(x=>x.kind=="DEATH"&&x.ballId==split.id));
            True(children.All(x=>s.State.replayedIds.Contains(x.id)));
            s.Abilities.OnStop(split);Eq(2,s.State.balls.Count(x=>x.type=="shard"));
        });
        Test("R11 Splitter limits to one shard with eleven friendly living units", () => {
            var s=Sim();var b=s.Spawn(0,"splitter",270,450);b.angle=0;
            for(int i=0;i<10;i++)s.Spawn(0,"normal",50+i*40,120);
            s.Abilities.OnStop(b);
            Eq(1,s.State.balls.Count(x=>x.type=="shard"));True(b.dead);
        });
        Test("R11 Splitter does not self-destruct if no spawn capacity remains", () => {
            var s=Sim();var b=s.Spawn(0,"splitter",270,450);
            for(int i=0;i<255;i++)s.State.balls.Add(new BallRuntime{id=s.State.nextId++,owner=1,type="normal",hp=5,maxHp=5,radius=1,x=30+i,y=120});
            int next=s.State.nextId;s.Abilities.OnStop(b);
            False(b.dead);False(b.splitDone);Eq(next,s.State.nextId);
        });
        Test("R11 Egg Sac death makes four 5HP radial tokens without invalid overlaps", () => {
            var s=Sim();var egg=s.Spawn(0,"eggsac",270,450);egg.angle=0;s.Kill(egg);
            var brood=s.State.balls.Where(x=>x.type=="broodling"&&!x.dead).ToArray();Eq(4,brood.Length);
            True(brood.All(x=>x.hp==5&&x.maxHp==5&&x.generated));
            for(int i=0;i<brood.Length;i++)for(int j=i+1;j<brood.Length;j++){
                double dx=brood[i].x-brood[j].x,dy=brood[i].y-brood[j].y;
                True(Math.Sqrt(dx*dx+dy*dy)>=brood[i].radius+brood[j].radius);
            }
        });
        Test("R11 Brood Core dies after fifth successful 5HP birth despite V149 30HP", () => {
            var s=Sim();var core=s.Spawn(0,"brood",270,450);
            for(int i=0;i<5;i++){
                s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);
                Eq(i+1,core.spawnCount);
                Eq(i==4?0:30-(i+1)*5,core.hp);
            }
            True(core.dead);
            Eq(5,s.State.balls.Count(x=>x.type=="broodling"&&!x.dead));
            True(s.State.events.Any(x=>x.kind=="DEATH"&&x.ballId==core.id));
        });
        Test("R11 reinforcement and counters survive authoritative snapshot transport", () => {
            var s=Sim();var q=s.Spawn(0,"quartermaster",270,450);
            s.Abilities.OnTurnStart(0);s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);
            var token=s.State.balls.Single(x=>x.generated&&x.type=="normal");
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);Eq(1,q.quartermasterTurnCounter);
            var opts=new JsonSerializerOptions{IncludeFields=true};
            var packet=new NetworkGameSession(s).Capture(state=>JsonSerializer.Serialize(state,opts));
            var adapter=new NetworkGameStateAdapter();
            True(adapter.Apply(packet,json=>JsonSerializer.Deserialize<GameState>(json,opts),out _));
            var recovered=adapter.State.balls.Single(x=>x.id==q.id);
            Eq(q.quartermasterTurnCounter,recovered.quartermasterTurnCounter);
            Eq(q.lastReinforcementTurn,recovered.lastReinforcementTurn);
            True(adapter.State.balls.Single(x=>x.id==token.id).generated);
        });
        Test("R11 Ball Inspection exposes reinforcement progress", () => {
            var s=Sim();var q=s.Spawn(0,"quartermaster",270,450);
            s.Abilities.OnTurnStart(0);
            True(BallInspection.Statuses(q).Any(x=>x.Code=="Q1/2"));
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);
            var token=s.State.balls.Single(x=>x.generated&&x.type=="normal");
            True(BallInspection.Statuses(token).Any(x=>x.Code=="GEN"));
        });
        Test("R11 Echo repeats Armorer STOP for nearby Standard without double counting", () => {
            var s=Sim();var echo=s.Spawn(0,"echo",230,450);
            s.Spawn(0,"armorer",280,450);var standard=s.Spawn(0,"normal",320,450);
            s.Abilities.OnStop(echo);Eq(5,standard.shield);
            s.Abilities.OnStop(echo);Eq(10,standard.shield);
        });
        Test("R11 jam suppresses one Armorer STOP instead of shielding", () => {
            var s=Sim();var armorer=s.Spawn(0,"armorer",270,450);
            var unit=s.Spawn(0,"normal",310,450);
            armorer.jammed=1;s.Abilities.OnStop(armorer);Eq(0,unit.shield);Eq(0,armorer.jammed);
            s.Abilities.OnStop(armorer);Eq(5,unit.shield);
        });
    }
}
