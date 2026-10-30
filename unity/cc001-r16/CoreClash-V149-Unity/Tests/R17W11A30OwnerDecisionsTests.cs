using System;
using System.Linq;
using CoreClash.Core;

// CC-001 R17-W11 / A30: owner-approved gameplay invariants.
// These tests observe existing R16/V148 behavior; they DO NOT reconfigure balance.
public static partial class Program
{
    static void R17W11A30OwnerDecisionsTests()
    {
        Test("A30 W11 Mitosis wall impact preserves V148 ball-contact-only trigger",()=>{
            var s=Sim();
            var m=s.Spawn(0,"mitosis",35,450,-500,0);
            Eq(35,m.hp);False(m.mitosisSplit);
            s.Physics.Step(1f/120); // Actual left wall collision, not a mocked callback.
            False(m.mitosisSplit);
            Eq(35,m.hp);
            Eq(1,s.State.balls.Count(b=>!b.dead&&b.type=="mitosis"));
            False(s.State.events.Any(e=>e.kind=="MITOSIS"));
            True(s.State.events.Any(e=>e.kind=="WALL_HIT"&&e.ballId==m.id));
        });
        Test("A30 W11 Mitosis structure collision never becomes a split trigger",()=>{
            var s=Sim();
            var m=s.Spawn(0,"mitosis",270,450,200,0);
            s.State.structures.Add(new StructureRuntime{
                id=s.State.nextId++,owner=1,kind="wall",
                x=285,y=450,radius=20,hp=20,maxHp=20,restitution=.8f
            });
            s.Physics.Step(1f/120); // Real StructureSystem collision pipeline.
            False(m.mitosisSplit);
            Eq(1,s.State.balls.Count(b=>!b.dead&&b.type=="mitosis"));
            False(s.State.events.Any(e=>e.kind=="MITOSIS"));
        });
        Test("A30 W11 Furnace creates FIRE zone, not immediate direct damage",()=>{
            var s=Sim();
            var furnace=s.Spawn(0,"furnace",200,450);
            var enemy=s.Spawn(1,"normal",290,450);
            int originalHp=enemy.hp;
            s.Abilities.OnTurnStart(0);
            Eq(originalHp,enemy.hp);
            Eq(0,enemy.fireStacks);
            Eq(1,s.State.zones.Count(z=>!z.dead&&z.kind=="furnaceFire"&&z.sourceId==furnace.id));
            False(s.State.events.Any(e=>e.kind=="DAMAGE"&&e.ballId==enemy.id));
            s.Abilities.OnTurnEnd(0);
            Eq(1,enemy.fireStacks);
            Eq(originalHp,enemy.hp);
            s.Abilities.OnTurnStart(1); // Enemy's own turn is the existing FIRE DOT tick.
            Eq(originalHp-5,enemy.hp);
        });
        Test("A30 W11 R16 HP representative values are not retuned to V148",()=>{
            foreach(var item in new[]{("normal",30),("fire",35),("mitosis",35),
                                      ("furnace",35),("ward",25),("phoenix",20)})
            {
                var definition=catalog.Ball(item.Item1);
                True(definition!=null,"missing R16 catalog id "+item.Item1);
                Eq(item.Item2,definition.hp);
            }
        });
    }
}
