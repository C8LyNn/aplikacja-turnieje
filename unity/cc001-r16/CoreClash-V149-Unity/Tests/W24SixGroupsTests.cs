using System;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.SelfPlay;

// CC-001 W24 (owner direction, 2026-11-22): six groups of five. The powers written for the roster
// (GroupPowers.cs) and the plain-powers match rule the game plays by. The rule is off by default:
// every older test in this suite runs the reference rules and still guards them.
public static partial class Program
{
    static GameSimulation W24Plain(){var s=Sim();s.State.plainPowers=true;return s;}
    static void W24Touch(GameSimulation s,BallRuntime a,BallRuntime b)=>s.Abilities.OnPairContact(a,b,false,true,10);

    static void W24SixGroupsTests()
    {
        Test("W24 six groups: plain powers is a match rule that is off by default; the roster sets how many copies a deck holds",()=>{
            False(Sim().State.plainPowers);
            var c=W22Catalog(out var data);
            Eq("W24-6x5-hp30",data.version);
            // Every active ball has the same HP; the catalog itself, without the roster, keeps each ball's own.
            Eq(30,data.hp);foreach(string id in data.active){Eq(30,c.Ball(id).hp);Eq(30,c.Ball(id).typeHp);}
            Eq(35,catalog.Ball("fire").hp);Eq(20,catalog.Ball("plagueburst").hp);Eq(35,catalog.Ball("anchor").hp);
            var uneven=new RosterData{version="t",hp=32,active=data.active,rework=data.rework,decks=data.decks};Throws(()=>c.UseRoster(uneven));
            Eq(5,c.Ball("tesla").stockCopies);Eq(2,c.Ball("chainshock").stockCopies);Eq(4,c.Ball("staticfield").stockCopies);Eq(3,c.Ball("anchor").stockCopies);
            // The catalog itself, without the roster, is untouched.
            Eq(1,catalog.Ball("tesla").stockCopies);Eq(7,catalog.Ball("anchor").stockCopies);
            var bad=new RosterData{version="t",active=data.active,rework=data.rework,decks=data.decks,stock=new[]{new RosterStock{id="plague",copies=3}}};
            Throws(()=>c.UseRoster(bad));
            bad.stock=new[]{new RosterStock{id="tesla",copies=0}};Throws(()=>c.UseRoster(bad));
        });
        Test("W24 lightning: 5 to the enemy it touches, 5 to one more enemy next to that one, once a turn",()=>{
            var s=W24Plain();var bolt=s.Spawn(0,"tesla",200,450);var hit=s.Spawn(1,"normal",250,450);var near=s.Spawn(1,"normal",330,450);var far=s.Spawn(1,"normal",250,600);var mine=s.Spawn(0,"normal",250,400);
            W24Touch(s,bolt,hit);
            Eq(25,hit.hp);Eq(25,near.hp);Eq(30,far.hp);Eq(30,mine.hp);
            W24Touch(s,bolt,hit);Eq(25,hit.hp);Eq(25,near.hp);
            foreach(var b in s.State.balls)b.turnAffectedIds.Clear();
            W24Touch(s,bolt,hit);Eq(20,hit.hp);Eq(20,near.hp);
            // Its own team is never shocked, and with nobody next to the target there is no jump.
            var alone=W24Plain();var b2=alone.Spawn(0,"tesla",200,450);var t2=alone.Spawn(1,"normal",250,450);var ally=alone.Spawn(0,"normal",250,500);
            W24Touch(alone,b2,t2);Eq(25,t2.hp);Eq(30,ally.hp);
        });
        Test("W24 storm: at the start of its owner's turn one bolt hits the nearest enemy in range",()=>{
            var s=W24Plain();var storm=s.Spawn(0,"chainshock",270,450);var near=s.Spawn(1,"normal",270,560);var other=s.Spawn(1,"normal",270,300);
            s.Abilities.OnTurnStart(1);Eq(30,near.hp);
            s.Abilities.OnTurnStart(0);Eq(25,near.hp);Eq(30,other.hp);
            var empty=W24Plain();empty.Spawn(0,"chainshock",270,450);var outOfReach=empty.Spawn(1,"normal",270,620);
            empty.Abilities.OnTurnStart(0);Eq(30,outOfReach.hp);
        });
        Test("W24 battery: starts with one charge, gains one a turn up to three, and fires them all where it stops next to enemies",()=>{
            var s=W24Plain();var battery=s.Spawn(0,"capacitor",270,450);
            Eq(1,battery.charge);
            s.Abilities.OnTurnStart(0);Eq(2,battery.charge);s.Abilities.OnTurnStart(0);s.Abilities.OnTurnStart(0);Eq(3,battery.charge);
            // Nobody to shock: the charge is kept.
            s.Abilities.OnStop(battery);Eq(3,battery.charge);
            var enemy=s.Spawn(1,"normal",330,450);var far=s.Spawn(1,"normal",270,600);var ally=s.Spawn(0,"normal",270,400);
            s.Abilities.OnStop(battery);
            Eq(15,enemy.hp);Eq(30,far.hp);Eq(30,ally.hp);Eq(0,battery.charge);
            s.Abilities.OnStop(battery);Eq(15,enemy.hp);
        });
        Test("W24 switch and shock trap: a switched-off ball has no power until the end of its next own turn",()=>{
            // Shock trap: 5 damage and power off for the first enemy that rolls over it; then the trap is gone.
            var s=W24Plain();var trapper=s.Spawn(0,"staticfield",270,450);s.Abilities.OnStop(trapper);
            Eq(1,s.State.zones.Count(z=>!z.dead&&z.kind=="shocktrap"));
            trapper.x=450;var bomb=s.Spawn(1,"bomb",270,455);
            s.Abilities.OnStep(1f/120);
            Eq(25,bomb.hp);True(bomb.jammed>0);Eq(0,s.State.zones.Count(z=>!z.dead&&z.kind=="shocktrap"));
            // Switched off: stopping does nothing, again and again.
            s.Abilities.OnStop(bomb);s.Abilities.OnStop(bomb);False(bomb.dead);True(bomb.jammed>0);
            // Not yet at the end of the turn it was switched off in; back at the end of its next own turn.
            s.Abilities.OnTurnEnd(1);True(bomb.jammed>0);
            s.State.players[1].ownerTurns++;s.Abilities.OnTurnEnd(0);True(bomb.jammed>0);
            s.Abilities.OnTurnEnd(1);Eq(0,bomb.jammed);
            s.Abilities.OnStop(bomb);True(bomb.dead);
            // Switch: by touch. A switched-off Campfire lights no field; a switched-off Acorn does not grow back.
            var t=W24Plain();var sw=t.Spawn(0,"jammer",200,450);var fire=t.Spawn(1,"furnace",250,450);var acorn=t.Spawn(1,"cascade",150,450);
            W24Touch(t,sw,fire);W24Touch(t,sw,acorn);True(fire.jammed>0&&acorn.jammed>0);
            t.Abilities.OnTurnStart(1);False(t.State.zones.Any(z=>z.kind=="furnaceFire"));
            t.Kill(acorn);Eq(0,t.State.balls.Count(b=>b.type=="cascade"&&!b.dead));
            // Its own balls are never switched off.
            var own=t.Spawn(0,"bomb",200,400);W24Touch(t,sw,own);Eq(0,own.jammed);
            // Reference rules are unchanged: a jam is used up by the first power it blocks.
            var r=Sim();var old=r.Spawn(1,"bomb",270,450);old.jammed=1;r.Abilities.OnStop(old);Eq(0,old.jammed);False(old.dead);r.Abilities.OnStop(old);True(old.dead);
        });
        Test("W24 compass: when it stops in its owner's turn it shoots once more, straight at the nearest enemy in range",()=>{
            var s=W24Plain();s.State.phase=MatchPhase.Moving;var compass=s.Spawn(0,"fluxmine",270,600);var near=s.Spawn(1,"normal",270,450);s.Spawn(1,"normal",100,600);
            s.Abilities.OnStop(compass);
            True(compass.vy<-300&&Math.Abs(compass.vx)<1,"no shot at the nearest enemy: "+compass.vx+","+compass.vy);
            // Once a turn.
            compass.vx=compass.vy=0;s.Abilities.OnStop(compass);Eq(0f,compass.vy);
            // Not in the opponent's turn, and not at an enemy out of reach.
            var other=W24Plain();other.State.phase=MatchPhase.Moving;other.State.turn=1;var c2=other.Spawn(0,"fluxmine",270,600);other.Spawn(1,"normal",270,450);
            other.Abilities.OnStop(c2);Eq(0f,c2.vy);
            var far=W24Plain();far.State.phase=MatchPhase.Moving;var c3=far.Spawn(0,"fluxmine",270,700);far.Spawn(1,"normal",270,400);
            far.Abilities.OnStop(c3);Eq(0f,c3.vy);
        });
        Test("W24 plants: the cactus stings, the flower heals, the sprout grows three times",()=>{
            var s=W24Plain();var cactus=s.Spawn(0,"thornback",200,450);var enemy=s.Spawn(1,"normal",250,450);var ally=s.Spawn(0,"normal",200,400);
            W24Touch(s,enemy,cactus);Eq(25,enemy.hp);
            W24Touch(s,cactus,enemy);Eq(25,enemy.hp);
            W24Touch(s,ally,cactus);Eq(30,ally.hp);
            foreach(var b in s.State.balls)b.turnAffectedIds.Clear();
            W24Touch(s,cactus,enemy);Eq(20,enemy.hp);

            var f=W24Plain();var flower=f.Spawn(0,"elderbloom",270,450);flower.hp=20;var hurt=f.Spawn(0,"normal",330,450);hurt.hp=10;var far=f.Spawn(0,"normal",270,600);far.hp=10;var foe=f.Spawn(1,"normal",300,500);foe.hp=10;
            f.Abilities.OnTurnStart(1);Eq(20,flower.hp);
            f.Abilities.OnTurnStart(0);Eq(25,flower.hp);Eq(15,hurt.hp);Eq(10,far.hp);Eq(10,foe.hp);

            var g=W24Plain();var sprout=g.Spawn(0,"cultivator",270,450);float radius=sprout.radius;sprout.hp=20;
            g.Abilities.OnTurnStart(0);Eq(1,sprout.growthStage);Eq(30,sprout.maxHp);Eq(25,sprout.hp);
            for(int i=0;i<4;i++)g.Abilities.OnTurnStart(0);
            Eq(3,sprout.growthStage);Eq(30,sprout.maxHp);Eq(30,sprout.hp);True(Math.Abs(sprout.radius-radius*1.12f*1.12f*1.12f)<.01f);
            // The Acorn under plain powers: it grows back hurt on the same gauge - 10 HP, then 5, then no more.
            var a=W24Plain();var acorn=a.Spawn(0,"cascade",270,450);int full=acorn.maxHp;
            a.Kill(acorn);var second=a.State.balls.Single(b=>b.type=="cascade"&&!b.dead);Eq(10,second.hp);Eq(full,second.maxHp);
            a.Kill(second);var third=a.State.balls.Single(b=>b.type=="cascade"&&!b.dead);Eq(5,third.hp);Eq(full,third.maxHp);
            a.Kill(third);Eq(0,a.State.balls.Count(b=>b.type=="cascade"&&!b.dead));
        });
        Test("W24 plain powers: the hidden passives of the old archetypes do not run; under the reference rules they still do",()=>{
            // Vegetation growth (more HP, healing, an extra web when it stops).
            var plain=W24Plain();var web=plain.Spawn(0,"web",270,450);for(int i=0;i<3;i++)plain.Abilities.OnTurnStart(0);
            Eq(0,web.growthStage);Eq(30,web.maxHp);
            var reference=Sim();var old=reference.Spawn(0,"web",270,450);for(int i=0;i<3;i++)reference.Abilities.OnTurnStart(0);
            Eq(3,old.growthStage);Eq(35,old.maxHp);
            // Hunting mark (5 extra damage on the second touch of the same enemy).
            var p=W24Plain();var bomb=p.Spawn(0,"bomb",200,450);var target=p.Spawn(1,"normal",250,450);
            W24Touch(p,bomb,target);W24Touch(p,bomb,target);Eq(30,target.hp);Eq(0,bomb.huntTargetId);
            var q=Sim();var oldBomb=q.Spawn(0,"bomb",200,450);var oldTarget=q.Spawn(1,"normal",250,450);
            W24Touch(q,oldBomb,oldTarget);W24Touch(q,oldBomb,oldTarget);Eq(25,oldTarget.hp);
            // The Magnet gathers: a ball rolls up to it instead of being thrown into it.
            var m=W24Plain();var magnet=m.Spawn(0,"magnet",270,450);var pulled=m.Spawn(1,"normal",270,330);
            m.Abilities.OnStop(magnet);float gentle=pulled.vy;
            var n=Sim();var oldMagnet=n.Spawn(0,"magnet",270,450);var thrown=n.Spawn(1,"normal",270,330);
            n.Abilities.OnStop(oldMagnet);
            True(gentle>40&&gentle<thrown.vy*.5f,"plain "+gentle+" reference "+thrown.vy);
        });
        Test("W24 six groups: whole matches between the ready-made decks run to an end under the rules the game plays by",()=>{
            var c=W22Catalog(out _);int finished=0,turns=0,matches=0;var seen=new System.Collections.Generic.HashSet<string>();
            for(int d=0;d<c.Roster.Decks.Length;d++)
            for(int variant=0;variant<2;variant++)
            {
                var a=c.Roster.Decks[d];var b=c.Roster.Decks[(d+1+variant)%c.Roster.Decks.Length];
                var s=new GameSimulation(c,a,b){ActiveRosterOnly=true};s.State.plainPowers=true;s.State.ballScale=1.5f;s.State.comebackRule=true;
                var rng=new SelfPlayRng((ulong)(1000+d*10+variant));
                ISelfPlayStrategy[] players={variant==0?new HeuristicStrategy():new RandomStrategy(),new HeuristicStrategy()};
                int guard=0;matches++;
                while(s.State.phase!=MatchPhase.Over&&guard++<400)
                {
                    var command=players[s.State.turn].Choose(s,s.State.turn,rng);
                    if(command==null||!s.TryCommand(command,out _))True(s.TryCommand(SelfPlayAim.Spawn(s,s.State.turn,"normal",0,420),out string why),"no legal shot: "+why);
                    int steps=0;while(s.State.phase==MatchPhase.Moving&&steps++<6000)s.Step(1f/120);
                    True(s.State.phase!=MatchPhase.Moving,"an action never settled");
                    foreach(var ball in s.State.balls)True(GameSimulation.Finite(ball.x)&&GameSimulation.Finite(ball.y)&&GameSimulation.Finite(ball.vx)&&ball.radius>0&&ball.hp>=0&&ball.charge>=0&&ball.charge<=AbilityResolver.ChargeMax,"broken ball state: "+ball.type);
                    foreach(var e in s.State.events)seen.Add(e.kind);
                }
                if(s.State.phase==MatchPhase.Over)finished++;turns+=s.State.turnNumber;
            }
            string[] powers={"ZAP","JAM","JAM_EXPIRED","CHARGE","DISCHARGE","GROW","THORNS","DASH","TRAP_TRIGGER","ROOTED","RETURN","FROSTGUARD_COUNTER","FIRE","ICE","TOXIN","FREEZE","EXPLOSION","DOUBLE_TURN"};
            Console.WriteLine("EVIDENCE W24 six groups self-play matches="+matches+" finished="+finished+" meanTurns="+(turns/(float)matches).ToString("0.0")+" seen="+string.Join(",",powers.Where(seen.Contains))+" never="+string.Join(",",powers.Where(k=>!seen.Contains(k))));
            True(finished>=matches-2,"only "+finished+" of "+matches+" matches ended");
            foreach(string kind in new[]{"ZAP","JAM","CHARGE","GROW","THORNS","TRAP_TRIGGER","FIRE","ICE","TOXIN"})True(seen.Contains(kind),"never happened in "+matches+" matches: "+kind);
        });
    }
}
