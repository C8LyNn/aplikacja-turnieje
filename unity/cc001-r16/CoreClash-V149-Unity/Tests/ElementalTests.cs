using System;
using System.Linq;
using System.Text.Json;
using CoreClash.Core;
using CoreClash.Networking;
using CoreClash.Presentation;

public static partial class Program
{
    static void ElementalTests()
    {
        Test("R13 Firebrand STOP burns enemies within 100 but never allies/outside", () => {
            var s=Sim();var fire=s.Spawn(0,"firebrand",200,450);
            var close=s.Spawn(1,"normal",290,450);var far=s.Spawn(1,"normal",340,450);var ally=s.Spawn(0,"normal",240,450);
            s.Abilities.OnStop(fire);Eq(1,close.fireStacks);Eq(0,far.fireStacks);Eq(0,ally.fireStacks);
            True(s.State.events.Any(e=>e.kind=="FIREBRAND"&&e.ballId==fire.id));
        });
        Test("R13 Firebrand cancels existing ICE without igniting immediately", () => {
            var s=Sim();var fire=s.Spawn(0,"firebrand",200,450);var target=s.Spawn(1,"normal",275,450);
            s.Abilities.ApplyIce(target,1);s.Abilities.OnStop(fire);Eq(0,target.iceStacks);Eq(0,target.fireStacks);
            s.Abilities.OnStop(fire);Eq(1,target.fireStacks);
        });
        Test("R13 Echo repeats Firebrand STOP using normal elemental rules", () => {
            var s=Sim();var echo=s.Spawn(0,"echo",100,450);s.Spawn(0,"firebrand",200,450);
            var target=s.Spawn(1,"normal",270,450);s.Abilities.OnStop(echo);Eq(1,target.fireStacks);
        });
        Test("R13 Chain Frost selects four successive, nonrepeating targets with two ranges", () => {
            var s=Sim();var chain=s.Spawn(0,"chainfrost",100,450);
            var a=s.Spawn(1,"normal",230,450);var b=s.Spawn(1,"normal",320,450);
            var c=s.Spawn(1,"normal",410,450);var d=s.Spawn(1,"normal",500,450);
            var outside=s.Spawn(1,"normal",100,700);
            s.Abilities.OnStop(chain);
            foreach(var hit in new[]{a,b,c,d})Eq(1,hit.iceStacks);
            Eq(0,outside.iceStacks);
            Eq(4,s.State.events.Count(e=>e.kind=="ICE_CHAIN"));
        });
        Test("R13 Chain Frost stops at gap larger than SHORT after first hop", () => {
            var s=Sim();var chain=s.Spawn(0,"chainfrost",100,450);
            var a=s.Spawn(1,"normal",240,450);var b=s.Spawn(1,"normal",370,450);
            s.Abilities.OnStop(chain);Eq(1,a.iceStacks);Eq(0,b.iceStacks);
        });
        Test("R13 Chain Frost never affects allies or picks the same enemy twice", () => {
            var s=Sim();var chain=s.Spawn(0,"chainfrost",100,450);
            var ally=s.Spawn(0,"normal",140,450);var enemy=s.Spawn(1,"normal",220,450);
            s.Abilities.OnStop(chain);Eq(0,ally.iceStacks);Eq(1,enemy.iceStacks);
            Eq(1,s.State.events.Count(e=>e.kind=="ICE_CHAIN"));
        });
        Test("R13 Ash Core gains at most 5 shield per distinct own turn and caps at 15", () => {
            var s=Sim();var ash=s.Spawn(0,"ashcore",150,450);var burning=s.Spawn(1,"normal",300,450);
            s.Abilities.ApplyFire(burning,0);s.Abilities.OnTurnStart(0);Eq(5,ash.shield);
            s.Abilities.OnTurnStart(0);Eq(5,ash.shield);
            for(int i=0;i<4;i++){s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);}
            Eq(15,ash.shield);
        });
        Test("R13 Ash Core does not gain shield for allied burn or cured enemies", () => {
            var s=Sim();var ash=s.Spawn(0,"ashcore",150,450);var ally=s.Spawn(0,"normal",220,450);
            s.Abilities.ApplyFire(ally,1);s.Abilities.OnTurnStart(0);Eq(0,ash.shield);
            var enemy=s.Spawn(1,"normal",300,450);s.Abilities.ApplyFire(enemy,0);
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);Eq(5,ash.shield);
            s.Abilities.ApplyIce(enemy,1);s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);Eq(5,ash.shield);
        });
        Test("R13 Furnace makes a single owner-bound 3-tick field and ignites at TURN END", () => {
            var s=Sim();var furnace=s.Spawn(0,"furnace",200,450);var enemy=s.Spawn(1,"normal",290,450);var ally=s.Spawn(0,"normal",240,450);
            s.Abilities.OnTurnStart(0);
            var zone=s.State.zones.Single(z=>!z.dead&&z.kind=="furnaceFire");
            Eq(104f,zone.radius);Eq(3,zone.turns);Eq(0,enemy.fireStacks);
            s.Abilities.OnTurnEnd(0);Eq(1,enemy.fireStacks);Eq(0,ally.fireStacks);Eq(2,zone.turns);
            s.State.turnNumber+=2;s.Abilities.OnTurnStart(0);
            Eq(1,s.State.zones.Count(z=>!z.dead&&z.kind=="furnaceFire"));Eq(3,zone.turns);
        });
        Test("R13 Furnace repeated own-turn callback does not duplicate zones", () => {
            var s=Sim();s.Spawn(0,"furnace",200,450);
            s.Abilities.OnTurnStart(0);s.Abilities.OnTurnStart(0);
            Eq(1,s.State.zones.Count(z=>!z.dead&&z.kind=="furnaceFire"));
        });
        Test("R13 Furnace respects FIRE versus ICE cancellation at turn end", () => {
            var s=Sim();s.Spawn(0,"furnace",200,450);var enemy=s.Spawn(1,"normal",275,450);
            s.Abilities.ApplyIce(enemy,1);s.Abilities.OnTurnStart(0);s.Abilities.OnTurnEnd(0);
            Eq(0,enemy.fireStacks);Eq(0,enemy.iceStacks);
        });
        Test("R13 Frostguard anchors on STOP, shields to cap and freezes only enemy HIT", () => {
            var s=Sim();var guard=s.Spawn(0,"frostguard",200,450);var enemy=s.Spawn(1,"normal",265,450);
            s.Abilities.OnStop(guard);True(guard.frostguardAnchored);Eq(0,guard.anchorStacks);Eq(10,guard.shield);
            s.Abilities.OnPairContact(guard,enemy,false,false,30);Eq(0,enemy.iceStacks);
            s.Abilities.OnPairContact(guard,enemy,true,false,110);Eq(1,enemy.iceStacks);
            s.Abilities.OnStop(guard);Eq(15,guard.shield);
            True(BallInspection.Statuses(guard).Any(x=>x.Code=="FRG"));
        });
        // R17-W4 A50 F02: carried forward from W3 as test-first golden
        // parity oracles. Run against frozen R16 first (expected RED), then
        // separately against the scoped W4 production patch.
        Test("R17 F02-G00 Frostguard STOP does not synthesize Earth anchor stacks", () => {
            var s=Sim();var guard=s.Spawn(0,"frostguard",270,450);
            Eq(0,guard.anchorStacks);guard.vx=80;guard.vy=-20;
            s.Abilities.OnStop(guard);
            True(guard.frostguardAnchored);Eq(0,guard.anchorStacks);
            Eq(0f,guard.vx);Eq(0f,guard.vy);Eq(10,guard.shield);
        });
        Test("R17 F02-G01 plain Frostguard anchor has V148 force and mass", () => {
            var s=Sim();var guard=s.Spawn(0,"frostguard",270,450);
            False(guard.rooted);Eq(0,guard.anchorStacks);
            s.Abilities.OnStop(guard);
            Near(.30f,CoreClash.Physics.CollisionResolver.ForceScale(guard));
            Near(2f*guard.mass,CoreClash.Physics.CollisionResolver.Mass(guard));
        });
        Test("R17 F02-G04 Frostguard replay clears anchor without residual Earth stacks", () => {
            var s=Sim();var guard=s.Spawn(0,"frostguard",270,805);
            s.Abilities.OnStop(guard);
            var cmd=Shot(s);cmd.kind=CommandKind.Replay;cmd.ballId=guard.id;
            True(s.TryCommand(cmd,out _));
            False(guard.frostguardAnchored);Eq(0,guard.anchorStacks);
            Near(1f,CoreClash.Physics.CollisionResolver.ForceScale(guard));
            Near(guard.mass,CoreClash.Physics.CollisionResolver.Mass(guard));
        });
        Test("R17 F02-G08 Frostguard STOP preserves independently existing Earth stacks", () => {
            var s=Sim();var guard=s.Spawn(0,"frostguard",270,450);
            guard.anchorStacks=2;s.Abilities.OnStop(guard);
            True(guard.frostguardAnchored);Eq(2,guard.anchorStacks);
        });
        Test("R17 F02 earth-status negative control retains normal stack physics", () => {
            var s=Sim();var ball=s.Spawn(0,"normal",270,450);
            ball.anchorStacks=2;
            Near(.56f,CoreClash.Physics.CollisionResolver.ForceScale(ball));
            Near(1.70f*ball.mass,CoreClash.Physics.CollisionResolver.Mass(ball));
        });
        Test("R17 F02-G09 existing Earth stacks combine with defensive Frostguard anchor", () => {
            var s=Sim();var guard=s.Spawn(0,"frostguard",270,450);
            guard.anchorStacks=2;s.Abilities.OnStop(guard);
            Eq(2,guard.anchorStacks);True(guard.frostguardAnchored);
            Near(.56f,CoreClash.Physics.CollisionResolver.ForceScale(guard));
            Near(3.40f*guard.mass,CoreClash.Physics.CollisionResolver.Mass(guard));
        });
        Test("R17 F02-G10 unrelated Earth stacks of three retain existing physics", () => {
            var s=Sim();var ball=s.Spawn(0,"normal",270,450);
            ball.anchorStacks=3;
            Near(.34f,CoreClash.Physics.CollisionResolver.ForceScale(ball));
            Near(4.10f*ball.mass,CoreClash.Physics.CollisionResolver.Mass(ball));
        });
        Test("R17 F02-G11 rooted Frostguard remains force-immune", () => {
            var s=Sim();var guard=s.Spawn(0,"frostguard",270,450);
            guard.rooted=true;s.Abilities.OnStop(guard);
            Eq(0,guard.anchorStacks);
            Near(0f,CoreClash.Physics.CollisionResolver.ForceScale(guard));
            Near(2f*guard.mass,CoreClash.Physics.CollisionResolver.Mass(guard));
        });
        Test("R17 F02-G12 unanchored Frostguard with real Earth stacks remains unanchored", () => {
            var s=Sim();var guard=s.Spawn(0,"frostguard",270,450);
            guard.anchorStacks=2;
            False(guard.frostguardAnchored);
            Near(.56f,CoreClash.Physics.CollisionResolver.ForceScale(guard));
            Near(1.70f*guard.mass,CoreClash.Physics.CollisionResolver.Mass(guard));
        });
        Test("R13 Frostguard counter-freeze never hits allied impacts", () => {
            var s=Sim();var guard=s.Spawn(0,"frostguard",200,450);var ally=s.Spawn(0,"normal",265,450);
            s.Abilities.OnStop(guard);s.Abilities.OnPairContact(guard,ally,true,false,110);Eq(0,ally.iceStacks);
        });
        Test("R13 Frostguard anchor deactivates on a normal launch", () => {
            var s=Sim();var guard=s.Spawn(0,"frostguard",270,805);s.Abilities.OnStop(guard);
            var cmd=Shot(s);cmd.kind=CommandKind.Replay;cmd.ballId=guard.id;
            True(s.TryCommand(cmd,out _));False(guard.frostguardAnchored);
            var enemy=s.Spawn(1,"normal",270,650);
            s.Abilities.OnPairContact(guard,enemy,true,true,110);Eq(0,enemy.iceStacks);
        });
        Test("R13 copying a Frostguard starts without the original anchor", () => {
            var s=Sim();var mimic=s.Spawn(0,"mimic",100,450);var guard=s.Spawn(1,"frostguard",200,450);
            s.Abilities.OnStop(guard);True(guard.frostguardAnchored);
            s.Abilities.OnContact(mimic,guard,true,true,110);Eq("frostguard",mimic.type);
            False(mimic.frostguardAnchored);False(guard.frostguardAnchored);
            Near(1f,CoreClash.Physics.CollisionResolver.ForceScale(mimic));
            Near(mimic.mass,CoreClash.Physics.CollisionResolver.Mass(mimic));
        });
        Test("R13 elemental runtime fields survive host snapshot", () => {
            var s=Sim();var furnace=s.Spawn(0,"furnace",200,450);var guard=s.Spawn(0,"frostguard",320,450);
            s.Abilities.OnTurnStart(0);s.Abilities.OnStop(guard);
            var opts=new JsonSerializerOptions{IncludeFields=true};
            var packet=new NetworkGameSession(s).Capture(state=>JsonSerializer.Serialize(state,opts));
            var adapter=new NetworkGameStateAdapter();
            True(adapter.Apply(packet,json=>JsonSerializer.Deserialize<GameState>(json,opts),out _));
            True(adapter.State.balls.Single(x=>x.id==guard.id).frostguardAnchored);Eq(0,adapter.State.balls.Single(x=>x.id==guard.id).anchorStacks);
            Eq(s.State.turnNumber,adapter.State.balls.Single(x=>x.id==furnace.id).lastElementalTurn);
            Eq(1,adapter.State.zones.Count(z=>!z.dead&&z.kind=="furnaceFire"));
        });
    }
}
