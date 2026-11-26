using System;
using System.IO;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Physics;
using CoreClash.Presentation;
using CoreClash.SelfPlay;

// CC-001 W24 (owner decisions, 2026-11-24): "strengthen magnetism and electricity" (Dynamo, the deck
// of those two groups, was the weakest ready deck) and "the player who starts and the other one are
// to win as often as each other, whatever the decks". Match rules and roster numbers again: the
// reference rules, which every older test in this suite runs, are untouched.
public static partial class Program
{
    static void W24DynamoSeatsTests()
    {
        Test("W24 dynamo and seats: the new rules are off by default; the roster's balance switches them on for the game, the demos and the lab",()=>{
            var plain=new GameState();
            False(plain.chainLightning);Eq(0,plain.shortCircuit);Eq(0,plain.mineDamage);Eq(0,plain.anchorShield);Eq(0,plain.openingBonusHp);
            var applied=new GameState();RosterBalance.Apply(applied);
            Eq(RosterBalance.ChainLightning,applied.chainLightning);Eq(RosterBalance.ShortCircuit,applied.shortCircuit);
            Eq(RosterBalance.MineDamage,applied.mineDamage);Eq(RosterBalance.AnchorShield,applied.anchorShield);Eq(RosterBalance.OpeningBonusHp,applied.openingBonusHp);
            Eq(RosterBalance.LightningTouch,applied.lightningTouch);Eq(RosterBalance.BatteryStart,applied.batteryStart);Eq(RosterBalance.ShockTrapDamage,applied.shockTrapDamage);Eq(RosterBalance.CompassDashHurt,applied.compassDashHurt);
            Eq(5,plain.lightningTouch);Eq(1,plain.batteryStart);Eq(5,plain.shockTrapDamage);Eq(100,plain.compassDashHurt);
            var c=W22Catalog(out _);var lab=AiLab.NewMatch(c,c.Roster.Decks[0],c.Roster.Decks[1],1,out _).State;
            Eq(RosterBalance.ChainLightning,lab.chainLightning);Eq(RosterBalance.OpeningBonusHp,lab.openingBonusHp);Eq(RosterBalance.MineDamage,lab.mineDamage);
        });

        Test("W24 chain lightning: the bolt goes on from enemy to enemy while the next one stands within reach; one Lightning shocks each enemy once a turn",()=>{
            GameSimulation Row(bool chain,out BallRuntime bolt,out BallRuntime[] row,out BallRuntime far,out BallRuntime own)
            {
                var s=W24Plain();s.State.chainLightning=chain;bolt=s.Spawn(0,"tesla",150,450);
                row=new[]{s.Spawn(1,"normal",200,450),s.Spawn(1,"normal",290,450),s.Spawn(1,"normal",380,450),s.Spawn(1,"normal",470,450)};
                far=s.Spawn(1,"normal",200,700);own=s.Spawn(0,"normal",290,520);return s;
            }
            // Reference: one jump, to the nearest enemy next to the one it touched.
            var old=Row(false,out var b0,out var r0,out _,out _);W24Touch(old,b0,r0[0]);
            Eq(25,r0[0].hp);Eq(25,r0[1].hp);Eq(30,r0[2].hp);Eq(30,r0[3].hp);
            // The rule: down the whole row, 5 each; not the enemy standing apart, never its own team.
            var s=Row(true,out var bolt,out var row,out var far,out var own);W24Touch(s,bolt,row[0]);
            True(row.All(b=>b.hp==25),string.Join(",",row.Select(b=>b.hp)));Eq(30,far.hp);Eq(30,own.hp);
            var zaps=s.State.events.Where(e=>e.kind=="ZAP").ToArray();Eq(4,zaps.Length);
            // Every jump is drawn from the ball before it.
            Eq(bolt.id,zaps[0].otherId);Eq(row[0].id,zaps[1].otherId);Eq(row[1].id,zaps[2].otherId);Eq(row[2].id,zaps[3].otherId);
            // The same Lightning touches another ball of that row in the same turn: every one of them has had its shock.
            W24Touch(s,bolt,row[2]);True(row.All(b=>b.hp==25));
            // Next turn it works again, from wherever it touches.
            foreach(var b in s.State.balls)b.turnAffectedIds.Clear();
            W24Touch(s,bolt,row[3]);True(row.All(b=>b.hp==20),string.Join(",",row.Select(b=>b.hp)));
            // Another Lightning keeps its own count.
            var twin=s.Spawn(0,"tesla",150,500);W24Touch(s,twin,row[0]);True(row.All(b=>b.hp==15));
            // A gap wider than the bolt's reach stops it.
            var gap=W24Plain();gap.State.chainLightning=true;var g=gap.Spawn(0,"tesla",150,450);
            var a=gap.Spawn(1,"normal",200,450);var next=gap.Spawn(1,"normal",290,450);var beyond=gap.Spawn(1,"normal",290+AbilityResolver.ZapJump+5,450);
            W24Touch(gap,g,a);Eq(25,a.hp);Eq(25,next.hp);Eq(30,beyond.hp);
            // A ball the bolt kills still passes it on.
            var dying=W24Plain();dying.State.chainLightning=true;var d=dying.Spawn(0,"tesla",150,450);
            var weak=dying.Spawn(1,"normal",200,450);weak.hp=5;var behind=dying.Spawn(1,"normal",290,450);
            W24Touch(dying,d,weak);True(weak.dead);Eq(25,behind.hp);
        });

        Test("W24 short circuit: a ball whose power is switched off takes 5 more from every bolt",()=>{
            // Reference: a bolt is 5 either way.
            var old=W24Plain();old.Spawn(0,"chainshock",270,450);var t0=old.Spawn(1,"normal",270,560);old.Abilities.Jam(t0);
            old.Abilities.OnTurnStart(0);Eq(25,t0.hp);
            // The Storm.
            var s=W24Plain();s.State.shortCircuit=5;s.Spawn(0,"chainshock",270,450);var target=s.Spawn(1,"normal",270,560);
            s.Abilities.OnTurnStart(0);Eq(25,target.hp);
            s.Abilities.Jam(target);s.Abilities.OnTurnStart(0);Eq(15,target.hp);
            // The Lightning and its jump.
            var l=W24Plain();l.State.shortCircuit=5;var bolt=l.Spawn(0,"tesla",200,450);var on=l.Spawn(1,"normal",250,450);var off=l.Spawn(1,"normal",330,450);
            l.Abilities.Jam(off);W24Touch(l,bolt,on);Eq(25,on.hp);Eq(20,off.hp);
            // The Battery: 5 for every charge, and 5 more.
            var b=W24Plain();b.State.shortCircuit=5;var battery=b.Spawn(0,"capacitor",270,450);b.Abilities.OnTurnStart(0);Eq(2,battery.charge);
            var live=b.Spawn(1,"normal",330,450);var dead=b.Spawn(1,"normal",210,450);b.Abilities.Jam(dead);
            b.Abilities.OnStop(battery);Eq(20,live.hp);Eq(15,dead.hp);
            // The shock trap switches a ball off after its own bolt: 5 from a ball whose power was on, 10 from one that was off already.
            var t=W24Plain();t.State.shortCircuit=5;var trapper=t.Spawn(0,"staticfield",270,450);t.Abilities.OnStop(trapper);trapper.x=450;
            var fresh=t.Spawn(1,"normal",270,455);t.Abilities.OnStep(1f/120);Eq(25,fresh.hp);True(fresh.jammed>0);
            fresh.x=100;trapper.x=270;trapper.y=250;t.Abilities.OnStop(trapper);trapper.x=450;
            var offAlready=t.Spawn(1,"normal",270,255);t.Abilities.Jam(offAlready);t.Abilities.OnStep(1f/120);Eq(20,offAlready.hp);
        });

        Test("W24 magnet mine: under the rule its blast takes the same, whole amount from every enemy in the field and nothing from its owner's balls",()=>{
            // Reference: less at the edge, and from everybody.
            var old=W24Plain();var m0=old.Spawn(0,"gravitymine",270,450);var mine0=old.Spawn(0,"normal",270,400);old.Abilities.OnStop(m0);
            var e0=old.Spawn(1,"normal",360,450);old.Abilities.OnStep(1f/120);
            True(m0.dead);Eq(20,e0.hp);True(mine0.hp<30);
            var s=W24Plain();s.State.mineDamage=15;var mine=s.Spawn(0,"gravitymine",270,450);var own=s.Spawn(0,"normal",270,400);s.Abilities.OnStop(mine);
            var edge=s.Spawn(1,"normal",360,450);var close=s.Spawn(1,"normal",300,480);var outside=s.Spawn(1,"normal",270,600);
            s.Abilities.OnStep(1f/120);
            True(mine.dead);Eq(15,edge.hp);Eq(15,close.hp);Eq(30,outside.hp);Eq(30,own.hp);
            // Everybody in the field is still thrown outwards.
            True(own.vy<0);True(edge.vx>0);Eq(0f,outside.vy);
            True(s.State.events.Any(e=>e.kind=="EXPLOSION"));
            False(s.State.zones.Any(z=>!z.dead&&z.kind=="gravitymine"));
        });

        Test("W24 anchor: under the rule dropping anchor gives it a shield, brought back up each time it stops and never above the rule's number",()=>{
            var old=W24Plain();var a0=old.Spawn(0,"anchor",270,450);old.Abilities.OnStop(a0);Eq(0,a0.shield);Eq(3,a0.anchorStacks);
            var s=W24Plain();s.State.anchorShield=10;var anchor=s.Spawn(0,"anchor",270,450);Eq(0,anchor.shield);
            s.Abilities.OnStop(anchor);Eq(10,anchor.shield);Eq(3,anchor.anchorStacks);
            s.Abilities.OnStop(anchor);Eq(10,anchor.shield);
            int hp=anchor.hp;
            s.Damage(anchor,5);Eq(5,anchor.shield);Eq(hp,anchor.hp);
            s.Damage(anchor,15);Eq(0,anchor.shield);Eq(hp-10,anchor.hp);
            s.Abilities.OnStop(anchor);Eq(10,anchor.shield);Eq(hp-10,anchor.hp);
            // Switched off, it drops no anchor and gets no shield.
            var off=W24Plain();off.State.anchorShield=10;var jammed=off.Spawn(0,"anchor",270,450);off.Abilities.Jam(jammed);off.Abilities.OnStop(jammed);
            Eq(0,jammed.shield);Eq(0,jammed.anchorStacks);
        });

        Test("W24 compass: under the rule a collision on its second shot costs it only the rule's share - and only then",()=>{
            GameSimulation Dash(int hurt,out BallRuntime compass,out BallRuntime target)
            {
                var s=W24Plain();s.State.compassDashHurt=hurt;s.State.bonusUsed=true;s.State.phase=MatchPhase.Moving;
                compass=s.Spawn(0,"fluxmine",270,600);target=s.Spawn(1,"normal",270,450);
                // A hit on its first flight costs it the whole amount whatever the rule says.
                s.Damage(compass,3,true);Eq(22,compass.hp);
                s.Abilities.OnStop(compass);True(compass.compassDash);True(compass.vy<-300);
                Settle(s);return s;
            }
            Eq(100,new GameState().compassDashHurt);
            // Reference: the second hit costs the Compass about as much as its target.
            Dash(100,out var c0,out var t0);True(t0.hp<30,"the Compass did not reach its target");int whole=22-c0.hp;True(whole>=4,"reference dash cost "+whole);
            // Half: the target is hurt just the same, the Compass half as much.
            var s=Dash(50,out var compass,out var target);Eq(t0.hp,target.hp);Eq(GameSimulation.Round(whole*.5f),22-compass.hp);
            // None at all.
            Dash(0,out var safe,out var t2);Eq(t0.hp,t2.hp);Eq(22,safe.hp);
            // The second shot is over when everything has come to rest: the next hit costs the whole amount again.
            False(compass.compassDash);int before=compass.hp;s.Damage(compass,4,true);Eq(before-4,compass.hp);
            // Stopped by anything at all - switched off on the way, say - it is still over at the end of the action.
            var odd=W24Plain();odd.State.compassDashHurt=0;odd.State.bonusUsed=true;var stuck=odd.Spawn(0,"fluxmine",270,600);stuck.compassDash=true;odd.Abilities.Jam(stuck);
            odd.State.phase=MatchPhase.Moving;odd.Turns.ResolveAction();False(stuck.compassDash);
            // A new launch never starts as a second shot.
            var again=W24Plain();again.State.bonusUsed=true;var parked=again.Spawn(0,"fluxmine",270,860);parked.compassDash=true;
            True(again.TryCommand(new PlayerCommand{owner=0,turnNumber=again.State.turnNumber,kind=CommandKind.Replay,ballId=parked.id,dx=0,dy=-1,power=300},out string why),why);False(parked.compassDash);
            // Only collisions are softened: a bolt takes its whole 5 from a Compass on its second shot.
            var zap=W24Plain();zap.State.compassDashHurt=0;var flying=zap.Spawn(0,"fluxmine",270,600);flying.compassDash=true;zap.Damage(flying,5);Eq(20,flying.hp);
        });

        Test("W24 opening: under the rule Player 2's extra opening ball comes in with the rule's HP - that ball only",()=>{
            // Without the rule the extra ball is a whole one.
            var old=Sim();old.State.standardOpeningBonus=true;
            True(old.TryCommand(Shot(old),out _));Settle(old);True(old.TryCommand(Shot(old,1),out _));Settle(old);
            True(old.OpeningExtraShot);True(old.TryCommand(Shot(old,1),out _));Eq(30,old.State.balls.Last().hp);
            var s=Sim();s.State.standardOpeningBonus=true;s.State.openingBonusHp=15;
            False(s.OpeningExtraShot);True(s.TryCommand(Shot(s),out _));Eq(30,s.State.balls.Last().hp);Settle(s);
            False(s.OpeningExtraShot);True(s.TryCommand(Shot(s,1),out _));Eq(30,s.State.balls.Last().hp);Settle(s);
            True(s.OpeningExtraShot);True(s.TryCommand(Shot(s,1),out _));
            var extra=s.State.balls.Last();Eq(15,extra.hp);Eq(30,extra.maxHp);Eq(1,extra.owner);Eq("normal",extra.type);Settle(s);
            // Afterwards every ball is whole again - the second ball of a double turn too.
            False(s.OpeningExtraShot);True(s.TryCommand(Shot(s),out _));Eq(30,s.State.balls.Last().hp);Settle(s);
            s.State.bonusPending=true;False(s.OpeningExtraShot);True(s.TryCommand(Shot(s,1),out _));Eq(30,s.State.balls.Last().hp);
            // A number above a ball's HP changes nothing.
            var high=Sim();high.State.openingBonusHp=99;
            True(high.TryCommand(Shot(high),out _));Settle(high);True(high.TryCommand(Shot(high,1),out _));Settle(high);
            True(high.TryCommand(Shot(high,1),out _));Eq(30,high.State.balls.Last().hp);
        });
    }
}
