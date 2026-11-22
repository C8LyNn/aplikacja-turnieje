using System;
using System.Linq;
using CoreClash.Core;

// CC-001 W24 (owner rule, 2026-11-22): one place on the board holds one field. Fields of one
// element join and act once; a newer field of another element exists only outside the older one.
// The rule is a match rule that is off by default, so every older test still runs the reference
// rules, where fields stack.
public static partial class Program
{
    static GameSimulation W24Fields(){var s=Sim();s.State.plainPowers=true;s.State.exclusiveFields=true;return s;}
    static ZoneRuntime W24Field(GameSimulation s,int owner,string type,float x,float y)
    {
        var ball=s.Spawn(owner,type,x,y);s.Abilities.OnStop(ball);
        return s.State.zones.Last(z=>!z.dead&&z.sourceId==ball.id);
    }

    static void W24FieldsTests()
    {
        Test("W24 fields: the rule is off by default; under it two fields of one element are one field and act once",()=>{
            False(Sim().State.exclusiveFields);
            // Reference rules: two fire fields from two sources set the ball alight twice in one turn.
            var r=Sim();W24Field(r,0,"pyrecore",100,450);W24Field(r,0,"pyrecore",300,450);var twice=r.Spawn(1,"normal",200,450);
            r.Abilities.OnTurnEnd(0);Eq(2,twice.fireStacks);
            // The rule: the same two fields are one field.
            var s=W24Fields();var a=W24Field(s,0,"pyrecore",100,450);var b=W24Field(s,0,"pyrecore",300,450);
            var both=s.Spawn(1,"normal",200,450);var left=s.Spawn(1,"normal",20,450);var right=s.Spawn(1,"normal",400,450);var none=s.Spawn(1,"normal",270,800);
            s.Abilities.OnTurnEnd(0);
            Eq(1,both.fireStacks);Eq(1,left.fireStacks);Eq(1,right.fireStacks);Eq(0,none.fireStacks);
            Eq("fire",AbilityResolver.FieldElement(a));Eq(a,AbilityResolver.FieldAt(s.State,200,450));Eq(b,AbilityResolver.FieldAt(s.State,400,450));
            True(AbilityResolver.FieldAt(s.State,270,800)==null);
            // A fire field and a campfire's field are the same element too.
            var camp=s.Spawn(0,"furnace",200,300);s.Abilities.OnTurnStart(0);
            Eq("fire",AbilityResolver.FieldElement(s.State.zones.Last(z=>z.sourceId==camp.id)));
            var joined=s.Spawn(1,"normal",200,330);s.Abilities.OnTurnEnd(0);Eq(1,joined.fireStacks);
        });
        Test("W24 fields: a newer field of another element exists only outside the older one",()=>{
            var s=W24Fields();var ice=W24Field(s,0,"blizzardcore",150,450);var fire=W24Field(s,0,"pyrecore",350,450);
            True(ice.id<fire.id);
            var overlap=s.Spawn(1,"normal",250,450);var fireOnly=s.Spawn(1,"normal",470,450);var iceOnly=s.Spawn(1,"normal",40,450);
            Eq(ice,AbilityResolver.FieldAt(s.State,250,450));Eq(fire,AbilityResolver.FieldAt(s.State,470,450));
            s.Abilities.OnTurnEnd(0);
            Eq(1,overlap.iceStacks);Eq(0,overlap.fireStacks);
            Eq(1,fireOnly.fireStacks);Eq(0,fireOnly.iceStacks);
            Eq(1,iceOnly.iceStacks);Eq(0,iceOnly.fireStacks);
            // Reference rules: both fields act on the ball in the overlap - the chill, then the fire that puts it out.
            var r=Sim();W24Field(r,0,"blizzardcore",150,450);W24Field(r,0,"pyrecore",350,450);var old=r.Spawn(1,"normal",250,450);
            r.Abilities.OnTurnEnd(0);Eq(0,old.iceStacks);Eq(0,old.fireStacks);
            // The older field is gone: the place is the newer one's.
            ice.dead=true;Eq(fire,AbilityResolver.FieldAt(s.State,250,450));
            var later=s.Spawn(1,"normal",250,450);s.Abilities.OnTurnEnd(0);Eq(1,later.fireStacks);
            // The order is the order of laying, whoever owns the field: the opponent's older pool keeps the place.
            var t=W24Fields();var pool=W24Field(t,1,"blightpool",150,450);var blaze=W24Field(t,0,"pyrecore",350,450);
            var mine=t.Spawn(0,"normal",250,450);var theirs=t.Spawn(1,"normal",250,470);
            t.Abilities.OnTurnEnd(0);
            True(mine.toxinTurns>0);Eq(0,theirs.fireStacks);
        });
        Test("W24 fields: a campfire carried into an older field is the newer field there",()=>{
            var s=W24Fields();var camp=s.Spawn(0,"furnace",100,450);s.Abilities.OnTurnStart(0);
            var first=s.State.zones.Single(z=>!z.dead&&z.kind=="furnaceFire");
            var ice=W24Field(s,0,"blizzardcore",350,450);
            True(first.id<ice.id);
            // Standing still, its field is refreshed in place and keeps its age.
            s.State.turnNumber++;s.Abilities.OnTurnStart(0);
            Eq(first,s.State.zones.Single(z=>!z.dead&&z.kind=="furnaceFire"));
            // Moved into the blizzard: a new field, laid after the ice.
            camp.x=300;s.State.turnNumber++;s.Abilities.OnTurnStart(0);
            var moved=s.State.zones.Single(z=>!z.dead&&z.kind=="furnaceFire");
            True(first.dead&&moved.id>ice.id);Eq(300f,moved.x);
            Eq(ice,AbilityResolver.FieldAt(s.State,300,450));
            var enemy=s.Spawn(1,"normal",300,480);s.Abilities.OnTurnEnd(0);Eq(1,enemy.iceStacks);Eq(0,enemy.fireStacks);
            // Reference rules: the same zone is moved, as before.
            var r=Sim();var oldCamp=r.Spawn(0,"furnace",100,450);r.Abilities.OnTurnStart(0);var zone=r.State.zones.Single(z=>z.kind=="furnaceFire");
            oldCamp.x=300;r.State.turnNumber++;r.Abilities.OnTurnStart(0);
            Eq(zone,r.State.zones.Single(z=>!z.dead&&z.kind=="furnaceFire"));Eq(300f,zone.x);
        });
        Test("W24 fields: a magnet mine pulls and goes off only where its field holds the place",()=>{
            var s=W24Fields();var ice=W24Field(s,0,"blizzardcore",200,450);
            var mine=s.Spawn(0,"gravitymine",400,450);s.Abilities.OnStop(mine);
            var field=s.State.zones.Single(z=>!z.dead&&z.kind=="gravitymine");
            Eq("magnet",AbilityResolver.FieldElement(field));
            // In the mine's circle, but the place is the older ice field's: nothing happens.
            var held=s.Spawn(1,"normal",330,450);
            Eq(ice,AbilityResolver.FieldAt(s.State,330,450));
            s.Abilities.OnStep(1f/120);False(mine.dead);Eq(0f,held.vx);
            // In the part that is the mine's own: it goes off.
            var caught=s.Spawn(1,"normal",460,450);
            Eq(field,AbilityResolver.FieldAt(s.State,460,450));
            s.Abilities.OnStep(1f/120);True(mine.dead);True(caught.hp<30);
            // Reference rules: the first ball would have set it off.
            var r=Sim();r.State.plainPowers=true;W24Field(r,0,"blizzardcore",200,450);var oldMine=r.Spawn(0,"gravitymine",400,450);r.Abilities.OnStop(oldMine);
            r.Spawn(1,"normal",330,450);r.Abilities.OnStep(1f/120);True(oldMine.dead);
        });
    }
}
