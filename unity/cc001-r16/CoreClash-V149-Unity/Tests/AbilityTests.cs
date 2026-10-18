using CoreClash.Core;
using System.Linq;
public static partial class Program
{
    static void AbilityTests()
    {
        Test("fire and ice cancel the opposite status before adding stacks",()=>{var s=Sim();var b=s.Spawn(1,"normal",270,450);s.Abilities.ApplyFire(b,0);Eq(1,b.fireStacks);s.Abilities.ApplyIce(b,0);Eq(0,b.fireStacks);Eq(0,b.iceStacks);s.Abilities.ApplyIce(b,0);s.Abilities.ApplyIce(b,0);s.Abilities.ApplyIce(b,0);Near(2.4f,b.frozen);Eq(0,b.iceStacks);});
        Test("toxin ticks only on target owner turns",()=>{var s=Sim();var b=s.Spawn(1,"normal",270,450);s.Abilities.ApplyToxin(b,0);s.Abilities.OnTurnStart(0);Eq(30,b.hp);s.Abilities.OnTurnStart(1);Eq(25,b.hp);Eq(2,b.toxinTurns);});
        Test("blight zone infects at turn end and expires after three ticks",()=>{var s=Sim();var z=s.Spawn(0,"blightpool",200,450);var t=s.Spawn(1,"normal",280,450);s.Abilities.OnStop(z);Eq(1,s.State.zones.Count);Eq(0,t.toxinTurns);s.Abilities.OnTurnEnd(0);Eq(3,t.toxinTurns);s.State.turnNumber++;s.Abilities.OnTurnEnd(1);s.State.turnNumber++;s.Abilities.OnTurnEnd(0);True(s.State.zones[0].dead);});
        Test("consecrator cleanse emits an Absolver shield payoff",()=>{var s=Sim();var c=s.Spawn(0,"consecrator",200,450);s.Spawn(0,"absolver",100,450);var ally=s.Spawn(0,"normal",270,450);s.Abilities.ApplyToxin(ally,1);s.Abilities.OnStop(c);s.Abilities.OnTurnEnd(0);Eq(0,ally.toxinTurns);Eq(5,ally.shield);});
        Test("Ward cleans modeled negative statuses and adds cleanse payoff",()=>{var s=Sim();var w=s.Spawn(0,"ward",200,450);s.Spawn(0,"absolver",120,450);var a=s.Spawn(0,"normal",280,450);s.Abilities.ApplyToxin(a,1);s.Abilities.ApplyFire(a,1);s.Abilities.OnStop(w);Eq(0,a.fireStacks);Eq(0,a.toxinTurns);Eq(10,a.shield);});
        Test("Penitent transfers oldest eligible status rather than cleansing it",()=>{var s=Sim();var p=s.Spawn(0,"penitent",200,450);var a=s.Spawn(0,"normal",260,450);s.Abilities.ApplyToxin(a,1);s.Abilities.ApplyFire(a,1);s.Abilities.OnContact(p,a,false,true,40);Eq(3,p.toxinTurns);Eq(0,a.toxinTurns);Eq(1,a.fireStacks);});
        Test("Septic Core needs two qualified hits across per-target turn limits",()=>{var s=Sim();var a=s.Spawn(0,"septiccore",200,450);var b=s.Spawn(1,"normal",260,450);s.Abilities.ApplyToxin(b,0);s.Abilities.OnContact(a,b,true,true,120);Eq(30,b.hp);s.Abilities.OnContact(a,b,true,true,120);Eq(30,b.hp);s.State.turnNumber++;a.turnAffectedIds.Clear();s.Abilities.OnContact(a,b,true,true,120);Eq(25,b.hp);});
        Test("rooted enemies enable Briarheart and cannot be displaced",()=>{var s=Sim();var a=s.Spawn(0,"briarheart",200,450);var b=s.Spawn(1,"normal",260,450);s.Abilities.Root(b);s.Abilities.OnContact(a,b,true,true,120);Eq(25,b.hp);b.vx=300;s.Physics.Step(1f/120);Near(260,b.x);});
        Test("Bonfire copied death effect heals allies and burns enemies without killing source",()=>{var s=Sim();var a=s.Spawn(0,"agony",180,450);var f=s.Spawn(0,"bonfire",230,450);var ally=s.Spawn(0,"normal",280,450);ally.hp=20;var enemy=s.Spawn(1,"normal",250,480);s.Abilities.OnContact(a,f,false,true,40);False(f.dead);Eq(25,ally.hp);Eq(20,enemy.hp);Eq(1,enemy.fireStacks);});
        Test("Cascade return chain preserves lineage and has no fourth life",()=>{var s=Sim();var c=s.Spawn(0,"cascade",270,450);s.Kill(c);var c2=s.State.balls.Last();Eq(10,c2.maxHp);Eq(c.lineageId,c2.lineageId);s.Kill(c2);var c3=s.State.balls.Last();Eq(5,c3.maxHp);s.Kill(c3);Eq(0,s.State.balls.Count(b=>!b.dead));});
        Test("Packheart rewards returned ally once per target turn",()=>{var s=Sim();s.Spawn(0,"packheart",100,450);var c=s.Spawn(0,"cascade",270,450);s.Kill(c);var child=s.State.balls.Last();Eq(5,child.shield);s.Abilities.EmitReturn(c,child);Eq(5,child.shield);});
        Test("Gravehide upgrades after qualifying returns on three turns",()=>{var s=Sim();var g=s.Spawn(0,"gravehide",100,450);var c=s.Spawn(0,"normal",300,450);int max=g.maxHp;for(int i=0;i<3;i++){s.State.turnNumber++;s.Abilities.EmitReturn(c,c);}Eq(max+10,g.maxHp);Near(catalog.Ball("gravehide").mass+.2f,g.mass);});
        Test("singularity consume does not fire death or add graveyard records",()=>{var s=Sim();var source=s.Spawn(0,"singularity",100,450);var bomb=s.Spawn(1,"bonfire",270,450);s.Abilities.Consume(0,source.id,bomb);False(s.State.balls.Contains(bomb));Eq(0,s.State.graveyard.Count);Eq(20,s.State.players[0].hp);});
        // R17-W4 A40: test-first lifecycle/RETURN contract (authored assertions; execution is separately gated).
        Test("W4 A40 Den Mother makes one token SPAWN per instance per turn without RETURN",()=>{
            var s=Sim();var mother=s.Spawn(0,"denmother",100,450);var first=s.Spawn(0,"booster",250,450);
            int before=s.State.events.Count(e=>e.kind=="RETURN");
            s.Kill(first);var pups=s.State.balls.Where(b=>b.type=="broodling"&&!b.dead).ToArray();
            Eq(1,pups.Length);Eq(5,pups[0].hp);True(pups[0].generated);Eq(0,pups[0].owner);
            True(s.State.events.Any(e=>e.kind=="SPAWN"&&e.ballId==pups[0].id));
            Eq(before,s.State.events.Count(e=>e.kind=="RETURN"));
            var second=s.Spawn(0,"relay",360,450);s.Kill(second);
            Eq(1,s.State.balls.Count(b=>b.type=="broodling"&&!b.dead));
            s.State.turnNumber++;s.Kill(s.Spawn(0,"armorer",300,550));
            Eq(2,s.State.balls.Count(b=>b.type=="broodling"&&!b.dead));
            Eq(s.State.turnNumber,mother.lastDenMotherTurn);
        });
        Test("W4 A40 two Den Mothers independently observe eligible ally death",()=>{
            var s=Sim();s.Spawn(0,"denmother",70,270);s.Spawn(0,"denmother",470,270);
            s.Kill(s.Spawn(0,"booster",270,450));
            Eq(2,s.State.balls.Count(b=>b.type=="broodling"&&!b.dead));
        });
        Test("W4 A40 Den Mother ignores non-Beasts enemies and Beast tokens",()=>{
            var s=Sim();s.Spawn(0,"denmother",95,260);
            s.Kill(s.Spawn(0,"normal",240,450));
            s.Kill(s.Spawn(1,"booster",310,450));
            s.Kill(s.Spawn(0,"broodling",360,450));
            Eq(0,s.State.balls.Count(b=>b.type=="broodling"&&!b.dead));
        });
        Test("W4 A40 Dirge repeats remote nearest ally death body without second DEATH",()=>{
            var s=Sim();var dirge=s.Spawn(0,"dirge",90,300);
            var bonfire=s.Spawn(0,"bonfire",400,550);
            int deaths=s.State.events.Count(e=>e.kind=="DEATH");
            s.Kill(dirge);
            False(bonfire.dead);Eq(deaths+1,s.State.events.Count(e=>e.kind=="DEATH"));
            True(s.State.events.Any(e=>e.kind=="BONFIRE"&&e.ballId==bonfire.id));
            False(s.State.graveyard.Any(g=>g.ballId==bonfire.id));
        });
        Test("W4 A40 Revenant emits RETURN REVIVE not SPAWN and uses serialized RNG",()=>{
            var s=Sim();s.State.randomState=1234567;var rev=s.Spawn(0,"revenant",270,440);
            int n=s.State.events.Count;s.Kill(rev);
            var child=s.State.balls.Single(b=>!b.dead&&b.id!=rev.id);
            Eq(10,child.hp);Eq(0,child.owner);Eq(rev.lineageId,child.lineageId);Eq(rev.life+1,child.life);
            False(child.generated);False(child.type=="revenant"||child.type=="mirage");
            False(s.Catalog.Ball(child.type).hidden);False(s.Catalog.Ball(child.type).tier=="unique");
            False(s.State.graveyard.Any(g=>g.ballId==rev.id));
            True(s.State.replayedIds.Contains(child.id));
            False(s.State.events.Skip(n).Any(e=>e.kind=="SPAWN"&&e.ballId==child.id));
            True(s.State.events.Skip(n).Any(e=>e.kind=="RETURN"&&e.ballId==child.id&&e.text=="REVIVE"));
            True(s.State.events.Skip(n).Any(e=>e.kind=="DEATH"&&e.ballId==rev.id));
        });
        Test("W4 A40 Soul Anchor restores newest ally grave near recorded death position",()=>{
            var s=Sim();var older=s.Spawn(0,"normal",190,390);s.Kill(older);
            var newer=s.Spawn(0,"normal",355,530);s.Kill(newer);
            var anchor=s.Spawn(0,"soulanchor",110,270);int serial=s.State.eventSerial;s.Kill(anchor);
            var child=s.State.balls.Single(b=>!b.dead);
            Eq(10,child.hp);Eq(0,child.owner);Eq(newer.lineageId,child.lineageId);
            Eq(newer.life+1,child.life);Eq(1,child.reviveGeneration);
            True(System.Math.Abs(child.x-newer.x)<180&&System.Math.Abs(child.y-newer.y)<180);
            False(s.State.graveyard.Any(g=>g.ballId==newer.id));
            True(s.State.graveyard.Any(g=>g.ballId==older.id));
            True(s.State.graveyard.Any(g=>g.ballId==anchor.id));
            False(s.State.events.Any(e=>e.id>serial&&e.kind=="SPAWN"&&e.ballId==child.id));
            Eq(1,s.State.events.Count(e=>e.id>serial&&e.kind=="RETURN"&&e.ballId==child.id&&e.text=="REVIVE"));
            True(s.State.replayedIds.Contains(child.id));
        });
        Test("W4 A40 Phoenix death records replay-return hand and regenerates on next owner turn",()=>{
            var s=Sim();var p=s.Spawn(0,"phoenix",250,440);int eventId=s.State.eventSerial;s.Kill(p);
            Eq(1,s.State.phoenixHand.Count);
            var h=s.State.phoenixHand[0];Eq(p.owner,h.owner);Eq(5,h.hp);False(h.ready);
            False(s.State.graveyard.Any(g=>g.ballId==p.id));
            Eq(1,s.State.events.Count(e=>e.id>eventId&&e.kind=="RETURN"&&e.text=="REPLAY_RETURN"));
            s.State.players[0].ownerTurns++;s.Abilities.OnTurnStart(0);
            True(h.ready);Eq(10,h.hp);
            s.State.players[0].ownerTurns++;s.Abilities.OnTurnStart(0);
            Eq(15,h.hp);
        });
        RealityTests();SpatialTests();
        Test("Wildfire leaves a three-tick fire field after death",()=>{var s=Sim();var w=s.Spawn(0,"wildfire",200,450);var t=s.Spawn(1,"normal",260,450);s.Kill(w);Eq(1,s.State.zones.Count(z=>z.kind=="fire"&&!z.dead));s.Abilities.OnTurnEnd(0);Eq(1,t.fireStacks);});
        Test("Soulburst copied effect grows with missing HP",()=>{var s=Sim();var a=s.Spawn(0,"agony",170,450);var soul=s.Spawn(0,"soulburst",220,450);soul.hp=5;var enemy=s.Spawn(1,"normal",280,450);s.Abilities.OnContact(a,soul,false,true,40);Eq(20,enemy.hp);False(soul.dead);});
        Test("Plagueleech binds a clean enemy then drains on its own turn",()=>{var s=Sim();var a=s.Spawn(0,"plagueleech",200,450);a.hp=15;var b=s.Spawn(1,"normal",260,450);b.shield=10;s.Abilities.OnContact(a,b,false,true,40);Eq(b.id,a.linkedTargetId);Eq(3,b.toxinTurns);s.Abilities.OnTurnStart(0);Eq(25,b.hp);Eq(20,a.hp);Eq(10,b.shield);});
        Test("Vector spreads toxin when an infected enemy actually dies",()=>{var s=Sim();s.Spawn(0,"vector",100,450);var dead=s.Spawn(1,"normal",200,450);var clean=s.Spawn(1,"normal",260,450);s.Abilities.ApplyToxin(dead,0);s.Kill(dead);Eq(3,clean.toxinTurns);});
        Test("Halo blocks exactly the first kinetic damage instance",()=>{var s=Sim();var halo=s.Spawn(0,"halo",200,450);s.Damage(halo,10,true);Eq(25,halo.hp);s.Damage(halo,10,true);Eq(15,halo.hp);});
        Test("Gravity Mine arms at STOP and detonates on enemy entry",()=>{var s=Sim();var mine=s.Spawn(0,"gravitymine",200,450);s.Abilities.OnStop(mine);True(s.State.zones.Any(z=>z.kind=="gravitymine"&&!z.dead));var enemy=s.Spawn(1,"normal",250,450);s.Abilities.OnStep(1f/120);True(mine.dead);True(enemy.hp<30);});
        Test("ordinary native collisions do not create kinetic energy",()=>{var s=Sim();BallRuntime a=s.Spawn(0,"normal",220,450),b=s.Spawn(1,"normal",260,450);a.vx=200;float before=.5f*a.mass*200*200;s.Collisions.Resolve(a,b);float after=.5f*a.mass*(a.vx*a.vx+a.vy*a.vy)+.5f*b.mass*(b.vx*b.vx+b.vy*b.vy);True(after<=before+.01f,"ordinary collision gained energy");});
        Test("third fire stack spreads to nearby enemies without igniting allies",()=>{var s=Sim();var target=s.Spawn(1,"normal",250,450);var enemy=s.Spawn(1,"normal",290,450);var ally=s.Spawn(0,"normal",220,450);s.Abilities.ApplyFire(target,0);s.Abilities.ApplyFire(target,0);s.Abilities.ApplyFire(target,0);Eq(1,enemy.fireStacks);Eq(0,ally.fireStacks);Eq(25,target.hp);});
    }
}
