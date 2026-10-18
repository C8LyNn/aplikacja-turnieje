using CoreClash.Core;
using System.Linq;
public static partial class Program
{
    static void ShowcaseTests()
    {
        Test("showcase Death primary: Agony Cascade RETURN Packheart Gravehide over three turns",()=>{
            var s=Sim();var agony=s.Spawn(0,"agony",180,560);var cascade=s.Spawn(0,"cascade",240,560);s.Spawn(0,"packheart",110,420);var grave=s.Spawn(0,"gravehide",430,420);int hp=grave.maxHp;
            for(int i=0;i<3;i++){s.State.turnNumber+=2;foreach(var b in s.State.balls)b.turnAffectedIds.Clear();s.Abilities.OnContact(agony,cascade,false,true,40);var child=s.State.balls.Last();Eq("cascade",child.type);Eq(5,child.shield);False(cascade.dead);}
            True(grave.ancestral);Eq(hp+10,grave.maxHp);
        });
        Test("showcase Death secondary: Requiem repeats Bonfire and Wildfire without their death",()=>{
            var s=Sim();var req=s.Spawn(0,"requiem",180,450);var fire=s.Spawn(0,"bonfire",240,450);var wild=s.Spawn(0,"wildfire",180,510);var enemy=s.Spawn(1,"normal",280,480);s.Abilities.OnStop(req);False(fire.dead);False(wild.dead);Eq(20,enemy.hp);Eq(1,enemy.fireStacks);True(s.State.zones.Any(z=>z.kind=="fire"&&!z.dead));
        });
        Test("showcase Death emergent: Reclaimer revive emits RETURN to Packheart and Gravehide",()=>{
            var s=Sim();var dead=s.Spawn(0,"bonfire",100,300);s.Kill(dead);s.Spawn(0,"packheart",100,500);var grave=s.Spawn(0,"gravehide",430,600);var reclaimer=s.Spawn(0,"reclaimer",250,550);s.Abilities.OnStop(reclaimer);var child=s.State.balls.Last();Eq("bonfire",child.type);Eq(15,child.hp);Eq(5,child.shield);Eq(1,grave.returnStacks);
        });
        Test("showcase Status primary: pool infection enables Septic burst and actual death enables Vector",()=>{
            var s=Sim();var pool=s.Spawn(0,"blightpool",200,450);var septic=s.Spawn(0,"septiccore",160,550);s.Spawn(0,"vector",100,300);var enemy=s.Spawn(1,"normal",300,450);var clean=s.Spawn(1,"normal",430,450);s.Abilities.OnStop(pool);s.Abilities.OnTurnEnd(0);Eq(3,enemy.toxinTurns);Eq(0,clean.toxinTurns);
            s.Abilities.OnContact(septic,enemy,true,true,120);Eq(1,s.State.virulence.Single().count);s.State.turnNumber+=2;septic.turnAffectedIds.Clear();enemy.hp=5;s.Abilities.OnContact(septic,enemy,true,true,120);True(enemy.dead);Eq(3,clean.toxinTurns);
        });
        Test("showcase Status secondary: Penitent transfer Consecrator cleanse Absolver shield",()=>{
            var s=Sim();var p=s.Spawn(0,"penitent",220,450);var ally=s.Spawn(0,"normal",300,450);var c=s.Spawn(0,"consecrator",140,450);s.Spawn(0,"absolver",100,600);s.Abilities.ApplyFire(ally,1);s.Abilities.OnContact(p,ally,false,true,40);Eq(0,ally.fireStacks);Eq(1,p.fireStacks);Eq(0,p.shield);s.Abilities.OnStop(c);s.Abilities.OnTurnEnd(0);Eq(0,p.fireStacks);Eq(5,p.shield);
        });
        Test("showcase Status emergent: Ward full native cleanse triggers Absolver once",()=>{
            var s=Sim();var ward=s.Spawn(0,"ward",180,450);s.Spawn(0,"absolver",100,300);var ally=s.Spawn(0,"normal",260,450);s.Abilities.ApplyFire(ally,1);s.Abilities.ApplyToxin(ally,1);s.Abilities.OnStop(ward);Eq(0,ally.fireStacks);Eq(0,ally.toxinTurns);Eq(10,ally.shield);
        });
        Test("showcase Gravity primary: Web root enables Briarheart HIT payoff",()=>{
            var s=Sim();var web=s.Spawn(0,"web",270,450);var briar=s.Spawn(0,"briarheart",420,550);s.Abilities.OnStop(web);var node=s.State.zones.First(z=>z.kind=="web");var enemy=s.Spawn(1,"normal",node.x,node.y);s.Abilities.OnStep(1f/120);True(enemy.rooted);s.Abilities.OnContact(briar,enemy,true,true,120);Eq(25,enemy.hp);
        });
        Test("showcase Gravity secondary: real hole consumes charge Horizon and skip death/RETURN",()=>{
            var s=Sim();s.Spawn(0,"horizonrelay",100,650);var core=s.Spawn(0,"singularity",270,450);s.Kill(core);var hole=s.State.zones.Single(z=>z.kind=="blackHole");int graves=s.State.graveyard.Count;for(int i=0;i<3;i++){s.Spawn(1,"cascade",hole.x,hole.y);s.Abilities.OnStep(1f/120);}Eq(3,hole.swallowed);Eq(19,s.State.players[1].hp);Eq(graves,s.State.graveyard.Count);Eq(0,s.State.balls.Count(b=>b.type=="cascade"));
        });
        Test("showcase Reality primary: Echo rewinds both temporal allies using their distinct saves",()=>{
            var s=Sim();var chrono=s.Spawn(0,"chronomancer",180,450);var paradox=s.Spawn(0,"paradox",320,450);var echo=s.Spawn(0,"echo",250,550);s.Abilities.OnTurnStart(0);s.Abilities.OnStop(chrono);chrono.x=150;chrono.hp=5;paradox.x=350;paradox.hp=5;s.Abilities.OnStop(echo);Near(180,chrono.x);Near(320,paradox.x);Eq(25,chrono.hp);Eq(25,paradox.hp);True(chrono.chronoSave==null);True(paradox.paradoxSave!=null);
        });
        Test("showcase Reality secondary: Traitor captures a STOP ability that Echo can repeat",()=>{
            var s=Sim();var traitor=s.Spawn(0,"traitor",150,450);var captured=s.Spawn(1,"chronomancer",250,450);var echo=s.Spawn(0,"echo",250,550);s.Abilities.OnContact(traitor,captured,false,true,40);Eq(0,captured.owner);Eq(1,traitor.owner);s.Abilities.OnStop(echo);True(captured.chronoSave!=null);
        });
        Test("showcase Reality emergent: Mimic current identity on death feeds Collector signature",()=>{
            var s=Sim();var mimic=s.Spawn(0,"mimic",180,450);var ice=s.Spawn(1,"ice",250,450);var collector=s.Spawn(0,"collector",350,450);s.Abilities.OnContact(mimic,ice,false,true,40);Eq("ice",mimic.type);Eq("normal",ice.type);s.Kill(mimic);True(collector.collection.Contains("ice"));s.Abilities.OnStop(collector);Eq(1,ice.iceStacks);
        });
    }
}
