using System;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Presentation;

// CC-001 W24, owner rule of 2026-11-26 ("an important rule: your own balls must not hurt your other
// balls"). Match rule GameState.noFriendlyFire, off in the reference rules and on in the game
// (RosterBalance): no power of a ball takes HP from another ball of the same player or puts fire,
// ice or poison on it. In the roster of six groups this changes the Bomb, whose blast hurt everybody.
public static partial class Program
{
    static GameSimulation W24Kind(){var s=W24Plain();s.State.noFriendlyFire=true;return s;}

    static void W24OwnBallsTests()
    {
        Test("W24 own balls: the rule is off in the reference rules and on in the game",()=>{
            False(new GameState().noFriendlyFire);
            True(RosterBalance.NoFriendlyFire);
            var applied=new GameState();RosterBalance.Apply(applied);True(applied.noFriendlyFire);
        });

        Test("W24 own balls: the Bomb's blast hurts enemies, throws everybody back and takes nothing from its owner's balls",()=>{
            // The reference rules: the blast hurts everybody in range.
            var old=W24Plain();var oldBomb=old.Spawn(0,"bomb",270,450);var oldMate=old.Spawn(0,"normal",330,450);var oldFoe=old.Spawn(1,"normal",210,450);
            old.Abilities.OnStop(oldBomb);True(oldBomb.dead);Eq(15,oldMate.hp);Eq(15,oldFoe.hp);
            // Under the rule.
            var s=W24Kind();var bomb=s.Spawn(0,"bomb",270,450);var mate=s.Spawn(0,"normal",330,450);var foe=s.Spawn(1,"normal",210,450);
            s.Abilities.OnStop(bomb);
            True(bomb.dead);Eq(30,mate.hp);Eq(15,foe.hp);
            // Both are thrown away from the blast, as before.
            True(mate.vx>0,"the owner's ball is still thrown back");True(foe.vx<0,"the enemy is thrown back");
            Eq(oldMate.vx,mate.vx);
            Eq(1,s.State.events.Count(e=>e.kind=="EXPLOSION"));
            False(s.State.events.Any(e=>e.kind=="DAMAGE"&&e.ballId==mate.id));
            // Destroyed before it stops, it explodes by the same rule.
            var early=W24Kind();var doomed=early.Spawn(0,"bomb",270,450);var near=early.Spawn(0,"normal",330,450);var target=early.Spawn(1,"normal",210,450);
            early.Kill(doomed);Eq(30,near.hp);Eq(15,target.hp);
        });

        Test("W24 own balls: no power's damage passes from a ball to another ball of the same player",()=>{
            var s=W24Kind();var a=s.Spawn(0,"normal",200,450);var mate=s.Spawn(0,"normal",300,450);var foe=s.Spawn(1,"normal",400,450);
            s.Damage(mate,10,false,a.id);Eq(30,mate.hp);
            s.Damage(foe,10,false,a.id);Eq(20,foe.hp);
            // What a ball does to itself stays, and so does damage with no ball behind it (a burn, a poison).
            s.Damage(a,10,false,a.id);Eq(20,a.hp);
            s.Damage(mate,10);Eq(20,mate.hp);
            // The reference rules let it through.
            var old=W24Plain();var x=old.Spawn(0,"normal",200,450);var y=old.Spawn(0,"normal",300,450);
            old.Damage(y,10,false,x.id);Eq(20,y.hp);
        });

        Test("W24 own balls: a player's own fire, ice and poison do not land on that player's balls - an enemy's still do",()=>{
            var s=W24Kind();s.State.deepFreeze=true;var mine=s.Spawn(0,"normal",200,450);var foe=s.Spawn(1,"normal",400,450);
            s.Abilities.ApplyFire(mine,0);Eq(0,mine.fireStacks);
            s.Abilities.ApplyIce(mine,0);Eq(0,mine.iceStacks);
            s.Abilities.ApplyToxin(mine,0);Eq(0,mine.toxinTurns);
            s.Abilities.FreezeNow(mine,0);Eq(0f,mine.frozen);Eq(30,mine.hp);
            s.Abilities.ApplyFire(foe,0);Eq(1,foe.fireStacks);
            // The part that helps stays: own ice puts out an enemy's fire, own fire melts an enemy's ice.
            s.Abilities.ApplyFire(mine,1);Eq(1,mine.fireStacks);
            s.Abilities.ApplyIce(mine,0);Eq(0,mine.fireStacks);Eq(0,mine.iceStacks);
            s.Abilities.ApplyIce(mine,1);Eq(1,mine.iceStacks);
            s.Abilities.ApplyFire(mine,0);Eq(0,mine.iceStacks);Eq(0,mine.fireStacks);
            // An enemy's fire and poison work on my ball as they always did.
            s.Abilities.ApplyFire(mine,1);s.Abilities.OnTurnStart(0);Eq(25,mine.hp);
            s.Abilities.ApplyToxin(mine,1);True(mine.toxinTurns>0);
            // The reference rules: own fire lands.
            var old=W24Plain();var own=old.Spawn(0,"normal",200,450);old.Abilities.ApplyFire(own,0);Eq(1,own.fireStacks);
        });

        Test("W24 own balls: outside the roster too - the Phoenix's fire and a black hole spare their owner's balls",()=>{
            var s=W24Kind();var mate=s.Spawn(0,"normal",300,450);var foe=s.Spawn(1,"normal",240,450);
            s.Spawn(0,"phoenix",270,450);s.Abilities.OnStep(1f/120);
            Eq(30,mate.hp);Eq(0,mate.fireStacks);Eq(25,foe.hp);Eq(1,foe.fireStacks);
            // A black hole: the reference rules swallow whoever is in its core.
            var old=W24Plain();old.Kill(old.Spawn(0,"singularity",270,650));var lost=old.Spawn(0,"normal",270,650);
            old.Abilities.OnStep(1f/120);False(old.State.balls.Contains(lost));
            var ruled=W24Kind();ruled.Kill(ruled.Spawn(0,"singularity",270,650));
            var kept=ruled.Spawn(0,"normal",270,650);var edge=ruled.Spawn(0,"normal",270,675);var prey=ruled.Spawn(1,"normal",272,650);
            ruled.Abilities.OnStep(1f/120);
            True(ruled.State.balls.Contains(kept));Eq(0f,edge.vy);False(ruled.State.balls.Contains(prey));
        });

        Test("W24 own balls: the Bomb's card says what the rule does",()=>{
            var bomb=BallGuide.For("bomb");
            Eq(RosterBalance.NoFriendlyFire,bomb.DoesPl.Contains("twoich nie rani"));Eq(!RosterBalance.NoFriendlyFire,bomb.DoesPl.Contains("twoje też"));
            Eq(RosterBalance.NoFriendlyFire,bomb.DoesEn.Contains("does not hurt yours"));Eq(!RosterBalance.NoFriendlyFire,bomb.DoesEn.Contains("yours too"));
        });
    }
}
