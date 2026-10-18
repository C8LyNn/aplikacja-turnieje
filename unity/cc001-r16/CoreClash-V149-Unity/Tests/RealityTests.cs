using CoreClash.Core;
using System.Linq;
public static partial class Program
{
    static void RealityTests()
    {
        Test("Mimic steals type while keeping both owners",()=>{var s=Sim();var a=s.Spawn(0,"mimic",200,450);var b=s.Spawn(1,"ice",260,450);s.Abilities.OnContact(a,b,false,true,40);Eq("ice",a.type);Eq("normal",b.type);Eq(0,a.owner);Eq(1,b.owner);});
        Test("Doppelganger copies enemy type without changing enemy",()=>{var s=Sim();var a=s.Spawn(0,"doppelganger",200,450);var b=s.Spawn(1,"bonfire",260,450);s.Abilities.OnContact(a,b,false,true,40);Eq("bonfire",a.type);Eq("bonfire",b.type);Eq(25,b.hp);Eq(0,a.owner);});
        Test("Traitor converts enemy and changes sides as Standard",()=>{var s=Sim();var a=s.Spawn(0,"traitor",200,450);var b=s.Spawn(1,"ice",260,450);s.Abilities.OnContact(a,b,false,true,40);Eq("normal",a.type);Eq(1,a.owner);Eq("ice",b.type);Eq(0,b.owner);});
        Test("Wildcard transforms to existing non-unique identity",()=>{var s=Sim();var a=s.Spawn(0,"wildcard",200,450);s.Abilities.OnStop(a);True(a.type!="wildcard");True(catalog.Ball(a.type)!=null);True(catalog.Ball(a.type).tier!="unique");});
        Test("Collector records enemy death and replays collected elemental signature",()=>{var s=Sim();var c=s.Spawn(0,"collector",180,450);var dead=s.Spawn(1,"ice",300,450);s.Kill(dead);var target=s.Spawn(1,"normal",260,450);True(c.collection.Contains("ice"));s.Abilities.OnStop(c);Eq(1,target.iceStacks);});
        Test("Echo can repeat an enemy STOP ability",()=>{var s=Sim();var e=s.Spawn(0,"echo",180,450);var enemy=s.Spawn(1,"chronomancer",270,450);s.Abilities.OnStop(e);True(enemy.chronoSave!=null);});
        Test("Time Shift swaps with nearest enemy in short range",()=>{var s=Sim();var a=s.Spawn(0,"timeshift",200,450);var b=s.Spawn(1,"normal",270,450);s.Abilities.OnStop(a);Near(270,a.x);Near(200,b.x);});
        Test("Chronomancer alternates save and one consumed restore",()=>{var s=Sim();var a=s.Spawn(0,"chronomancer",200,450);s.Abilities.OnStop(a);a.x=330;a.hp=5;s.Abilities.OnStop(a);Near(200,a.x);Eq(25,a.hp);True(a.chronoSave==null);});
        Test("Paradox restores beginning-of-turn state without consuming it",()=>{var s=Sim();var a=s.Spawn(0,"paradox",200,450);s.Abilities.OnTurnStart(0);a.x=330;a.hp=5;s.Abilities.OnStop(a);Near(200,a.x);Eq(25,a.hp);True(a.paradoxSave!=null);});
        Test("Requiem repeats Bonfire without killing it",()=>{var s=Sim();var a=s.Spawn(0,"requiem",180,450);var fire=s.Spawn(0,"bonfire",240,450);var enemy=s.Spawn(1,"normal",290,450);s.Abilities.OnStop(a);False(fire.dead);Eq(20,enemy.hp);Eq(1,enemy.fireStacks);});
        Test("Reclaimer pays HP once to revive oldest eligible ally",()=>{var s=Sim();var dead=s.Spawn(0,"bonfire",100,300);s.Kill(dead);var a=s.Spawn(0,"reclaimer",300,500);int hp=a.hp;s.Abilities.OnStop(a);var returned=s.State.balls.Last();Eq("bonfire",returned.type);Eq(15,returned.hp);Eq(hp-10,a.hp);s.Abilities.OnStop(a);Eq(3,s.State.balls.Count);});
    }
}
