using System;
using System.Linq;
using System.Text.Json;
using CoreClash.Core;
using CoreClash.Presentation;

public static partial class Program
{
    // These fixtures catch missing arming, crossed trigger families, double detonation,
    // stale copied state, and timers advanced by the opponent or duplicate callbacks.
    static void ExplosiveTests()
    {
        Test("Mine STOP arms without exploding or starting a timed fuse",()=>{
            var s=Sim();var m=s.Spawn(0,"mine",200,450);s.Abilities.OnStop(m);
            True(m.mineArmed);False(m.dead);False(s.State.events.Any(e=>e.kind=="EXPLOSION"));True(BallInspection.Statuses(m).Any(x=>x.Code=="ARM"));
            for(int i=0;i<3;i++)ExplosiveOwnTurn(s,0);False(m.dead);
        });
        Test("Unarmed Mine and friendly contact never trigger an explosion",()=>{
            var s=Sim();var m=s.Spawn(0,"mine",200,450);var enemy=s.Spawn(1,"normal",240,450);s.Abilities.OnPairContact(m,enemy,false,false,30);False(m.dead);Eq(30,enemy.hp);
            s.Abilities.OnStop(m);var ally=s.Spawn(0,"normal",240,500);s.Abilities.OnPairContact(m,ally,true,false,200);False(m.dead);True(m.mineArmed);Eq(30,ally.hp);
        });
        Test("Armed Mine reacts to weak enemy TOUCH and explodes only once",()=>{
            var s=Sim();var m=s.Spawn(0,"mine",200,450);var enemy=s.Spawn(1,"normal",245,450);var ally=s.Spawn(0,"normal",160,450);s.Abilities.OnStop(m);
            s.Abilities.OnPairContact(m,enemy,false,false,30);True(m.dead);False(m.mineArmed);True(enemy.hp<30&&ally.hp<30);True(enemy.vx>0&&ally.vx<0);
            s.Abilities.OnPairContact(m,enemy,true,true,200);s.Kill(m);Eq(1,s.State.events.Count(e=>e.kind=="EXPLOSION"));
        });
        Test("Frost disarms Mine before contact while an allied Frost cannot",()=>{
            var s=Sim();var m=s.Spawn(0,"mine",200,450);s.Abilities.OnStop(m);var frost=s.Spawn(0,"ice",250,450);s.Abilities.OnStep(1f/120);True(m.mineArmed);
            frost.owner=1;s.Abilities.OnStep(1f/120);False(m.mineArmed);False(m.dead);Eq(1,m.iceStacks);s.Abilities.OnStep(1f/120);Eq(1,m.iceStacks);
            s.Abilities.OnPairContact(m,frost,false,false,30);False(m.dead);False(s.State.events.Any(e=>e.kind=="EXPLOSION"));
        });
        Test("Destroyed Mine does not acquire a death explosion",()=>{
            var s=Sim();var m=s.Spawn(0,"mine",200,450);s.Abilities.OnStop(m);s.Kill(m);s.Abilities.OnStep(.01f);False(s.State.events.Any(e=>e.kind=="EXPLOSION"));
        });
        Test("A fast Frost crossing the ring between physics steps still disarms Mine",()=>{
            var s=Sim();var m=s.Spawn(0,"mine",200,450);s.Abilities.OnStop(m);s.Spawn(1,"ice",260,450,-600,0);s.Physics.Step(1f/30);
            False(m.dead);False(m.mineArmed);True(m.iceStacks>0);False(s.State.events.Any(e=>e.kind=="EXPLOSION"));
        });
        Test("Armed Mine detonates before Mimic or Traitor in either contact order",()=>{
            foreach(string type in new[]{"mimic","traitor"})foreach(bool mineFirst in new[]{false,true}){
                var s=Sim();BallRuntime m,enemy;if(mineFirst){m=s.Spawn(0,"mine",240,450);enemy=s.Spawn(1,type,200,450);}else{enemy=s.Spawn(1,type,200,450);m=s.Spawn(0,"mine",240,450);}
                s.Abilities.OnStop(m);enemy.vx=30;s.Collisions.Resolve(s.State.balls[0],s.State.balls[1]);True(m.dead);Eq(type,enemy.type);Eq(1,enemy.owner);Eq(1,s.State.events.Count(e=>e.kind=="EXPLOSION"));
            }
        });
        Test("Enemy armed Mines capture both contact triggers before either explodes",()=>{
            var s=Sim();var a=s.Spawn(0,"mine",200,450);var b=s.Spawn(1,"mine",240,450);s.Abilities.OnStop(a);s.Abilities.OnStop(b);a.vx=30;s.Collisions.Resolve(a,b);
            True(a.dead&&b.dead);Eq(2,s.State.events.Count(e=>e.kind=="EXPLOSION"));
        });
        Test("Replaying Mine disarms it until its next STOP",()=>{
            var s=Sim();var m=s.Spawn(0,"mine",150,730);s.Abilities.OnStop(m);True(m.mineArmed);var c=Shot(s);c.kind=CommandKind.Replay;c.ballId=m.id;
            True(s.TryCommand(c,out _));False(m.mineArmed);s.Abilities.OnStop(m);True(m.mineArmed);
        });
        Test("Time Bomb counts only two own turn starts and shows its fuse",()=>{
            var s=Sim();var b=s.Spawn(0,"timebomb",270,450);var enemy=s.Spawn(1,"normal",350,450);s.Abilities.OnStop(b);
            True(BallInspection.Statuses(b).Any(x=>x.Code=="FUSE2"));False(b.mineArmed);ExplosiveOwnTurn(s,1);True(BallInspection.Statuses(b).Any(x=>x.Code=="FUSE2"));
            ExplosiveOwnTurn(s,0);False(b.dead);True(BallInspection.Statuses(b).Any(x=>x.Code=="FUSE1"));s.Abilities.OnTurnStart(0);False(b.dead);
            ExplosiveOwnTurn(s,1);False(b.dead);ExplosiveOwnTurn(s,0);True(b.dead);True(enemy.hp<30);Eq(1,s.State.events.Count(e=>e.kind=="EXPLOSION"));
        });
        Test("Time Bomb enemy contact does not use Mine's touch trigger",()=>{
            var s=Sim();var b=s.Spawn(0,"timebomb",270,450);var enemy=s.Spawn(1,"normal",310,450);s.Abilities.OnStop(b);s.Abilities.OnPairContact(b,enemy,true,false,200);
            False(b.dead);Eq(30,enemy.hp);ExplosiveOwnTurn(s,0);False(b.dead);ExplosiveOwnTurn(s,0);True(b.dead);
        });
        Test("A repeated Time Bomb STOP resets the two-turn setup",()=>{
            var s=Sim();var b=s.Spawn(0,"timebomb",270,450);s.Abilities.OnStop(b);ExplosiveOwnTurn(s,0);s.Abilities.OnStop(b);
            ExplosiveOwnTurn(s,0);False(b.dead);ExplosiveOwnTurn(s,0);True(b.dead);
        });
        Test("Time Bomb killed before its fuse expires has no death explosion",()=>{
            var s=Sim();var b=s.Spawn(0,"timebomb",270,450);s.Abilities.OnStop(b);s.Kill(b);ExplosiveOwnTurn(s,0);ExplosiveOwnTurn(s,0);False(s.State.events.Any(e=>e.kind=="EXPLOSION"));
        });
        Test("Jammed STOP suppresses arming and a jammed timer turn spends no tick",()=>{
            var s=Sim();var m=s.Spawn(0,"mine",160,450);m.jammed=1;s.Abilities.OnStop(m);False(m.mineArmed);s.Abilities.OnStop(m);True(m.mineArmed);
            var b=s.Spawn(0,"timebomb",370,450);s.Abilities.OnStop(b);b.jammed=1;ExplosiveOwnTurn(s,0);Eq(0,b.jammed);ExplosiveOwnTurn(s,0);False(b.dead);ExplosiveOwnTurn(s,0);True(b.dead);
        });
        Test("Bomb STOP explodes and dies once with friendly fire",()=>{
            var s=Sim();var b=s.Spawn(0,"bomb",270,450);var ally=s.Spawn(0,"normal",330,450);var enemy=s.Spawn(1,"normal",210,450);s.Abilities.OnStop(b);
            True(b.dead);Eq(15,ally.hp);Eq(15,enemy.hp);s.Kill(b);s.Abilities.OnStop(b);Eq(1,s.State.events.Count(e=>e.kind=="EXPLOSION"));
        });
        Test("Bomb premature death retains its existing one-time death blast",()=>{
            var s=Sim();var b=s.Spawn(0,"bomb",270,450);var target=s.Spawn(1,"normal",330,450);s.Kill(b);Eq(15,target.hp);s.Kill(b);Eq(1,s.State.events.Count(e=>e.kind=="EXPLOSION"));
        });
        Test("Agony can repeat a living Bomb death payload without consuming the Bomb",()=>{
            var s=Sim();var a=s.Spawn(0,"agony",200,450);var b=s.Spawn(0,"bomb",270,450);var enemy=s.Spawn(1,"normal",330,450);enemy.hp=enemy.maxHp=60;
            s.Abilities.OnPairContact(a,b,false,true,30);s.Abilities.OnPairContact(a,b,false,true,30);False(b.dead);Eq(30,enemy.hp);Eq(2,s.State.events.Count(e=>e.kind=="EXPLOSION"));
        });
        Test("Echo arms nearby explosive STOP powers and detonates a Bomb",()=>{
            var s=Sim();var e=s.Spawn(0,"echo",270,450);var m=s.Spawn(0,"mine",160,450);var t=s.Spawn(0,"timebomb",380,450);var b=s.Spawn(0,"bomb",270,550);s.Abilities.OnStop(e);
            True(m.mineArmed);True(BallInspection.Statuses(t).Any(x=>x.Code=="FUSE2"));True(b.dead);Eq(1,s.State.events.Count(x=>x.kind=="EXPLOSION"));
        });
        Test("Mimic steals a timed identity without inheriting its running fuse",()=>{
            var s=Sim();var m=s.Spawn(0,"mimic",200,450);var b=s.Spawn(1,"timebomb",280,450);s.Abilities.OnStop(b);s.Abilities.OnPairContact(m,b,false,true,30);
            Eq("timebomb",m.type);Eq("normal",b.type);False(BallInspection.Statuses(m).Any(x=>x.Code.StartsWith("FUSE")));False(BallInspection.Statuses(b).Any(x=>x.Code.StartsWith("FUSE")));
            ExplosiveOwnTurn(s,1);ExplosiveOwnTurn(s,1);False(b.dead);s.Abilities.OnStop(m);ExplosiveOwnTurn(s,0);ExplosiveOwnTurn(s,0);True(m.dead);
        });
        Test("Authoritative snapshots retain armed Mine and remaining Time Bomb turns",()=>{
            var s=Sim();var m=s.Spawn(0,"mine",150,450);var b=s.Spawn(0,"timebomb",370,450);s.Abilities.OnStop(m);s.Abilities.OnStop(b);ExplosiveOwnTurn(s,0);
            var json=new JsonSerializerOptions{IncludeFields=true};var clone=Sim();clone.State=JsonSerializer.Deserialize<GameState>(JsonSerializer.Serialize(s.State,json),json);
            var mine=clone.State.balls.Single(x=>x.id==m.id);True(mine.mineArmed);True(BallInspection.Statuses(clone.State.balls.Single(x=>x.id==b.id)).Any(x=>x.Code=="FUSE1"));
            ExplosiveOwnTurn(clone,1);False(clone.State.balls.Single(x=>x.id==b.id).dead);ExplosiveOwnTurn(clone,0);True(clone.State.balls.Single(x=>x.id==b.id).dead);
        });
        Test("A bounded safety settle advances the action once without repeated guard events",()=>{
            var s=Sim();s.State.phase=MatchPhase.Moving;s.State.actionKind="spawn";s.State.actionTime=28;s.State.actionDeadline=28;var b=s.Spawn(0,"normal",200,450,200,0);
            s.Step(1f/120);Eq(MatchPhase.Aiming,s.State.phase);Eq(1,s.State.events.Count(e=>e.kind=="MOTION_GUARD"));Eq(1,s.State.turn);
            for(int i=0;i<30;i++)s.Step(1f/120);Eq(1,s.State.events.Count(e=>e.kind=="MOTION_GUARD"));Eq(1,s.State.turn);
        });
        Test("Three legal mixed explosive matches finish including bounded launch chains",()=>{
            var ids=new[]{"mine","timebomb","bomb","ice","agony","echo","slingshot","pinballer","ward"};var deck=new CoreClash.Data.DeckDefinition{id="r9_test_only",balls=ids};var reports=new System.Collections.Generic.List<object>();
            for(int seed=0;seed<3;seed++){
                var s=new GameSimulation(catalog,deck,deck);int[] next={0,0};var deployed=new System.Collections.Generic.HashSet<string>();int actions=0,guards=0,explosions=0;
                while(s.State.phase!=MatchPhase.Over&&actions<60){int owner=s.State.turn;var type=ids[next[owner]++%ids.Length];if(s.Stock(owner,type)<=0)type="normal";var c=Shot(s,owner,type);c.dx=new[]{-.45f,.3f,0f,.65f,-.7f}[(actions+seed)%5];c.power=370+seed*35;True(s.TryCommand(c,out var reason),reason);deployed.Add(type);actions++;int last=s.State.eventSerial;
                    for(int i=0;i<4000&&s.State.phase==MatchPhase.Moving;i++){
                        s.Step(1f/120);int added=s.State.events.Count(e=>e.id>last&&e.kind=="MOTION_GUARD");
                        explosions+=s.State.events.Count(e=>e.id>last&&e.kind=="EXPLOSION");
                        guards+=added;last=s.State.eventSerial;
                    }True(s.State.phase!=MatchPhase.Moving);
                }
                Eq(MatchPhase.Over,s.State.phase);True(guards<=actions);True(new[]{"mine","timebomb","bomb"}.All(deployed.Contains));
                True(explosions>0);reports.Add(new{seed,actions,turns=s.State.turnNumber,guards,explosions,winner=s.State.winner,deployed=deployed.OrderBy(x=>x).ToArray()});
            }
            System.IO.File.WriteAllText(System.IO.Path.Combine(projectRoot,"Evidence/r9-explosive-matches.json"),JsonSerializer.Serialize(new{testedAt=DateTime.UtcNow,pass=true,testOnlyDeck=ids,matches=reports},new JsonSerializerOptions{WriteIndented=true}));
        });
    }
    static void ExplosiveOwnTurn(GameSimulation s,int owner){s.State.turn=owner;s.State.turnNumber++;s.State.players[owner].ownerTurns++;s.Abilities.OnTurnStart(owner);}
}
