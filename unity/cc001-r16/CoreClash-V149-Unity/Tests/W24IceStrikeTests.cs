using System;
using System.IO;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Physics;
using CoreClash.Presentation;
using CoreClash.SelfPlay;

// CC-001 W24 (owner decision, 2026-11-24: "strengthen ice" - after the second balance pass ice was
// the weakest group and the two ready decks with ice the two weakest). Match rules again; the
// reference rules and the first ice rule (deepFreeze on its own) play exactly as before.
public static partial class Program
{
    static void W24IceStrikeTests()
    {
        Test("W24 ice, third pass: the new rules are off by default; the roster's balance sets them for the game, the demos and the lab",()=>{
            var plain=new GameState();False(plain.shatterKeepsIce);Eq(0,plain.freezeDamage);Eq(0,plain.brittleBonus);
            var applied=new GameState();RosterBalance.Apply(applied);
            Eq(RosterBalance.ShatterKeepsIce,applied.shatterKeepsIce);Eq(RosterBalance.FreezeDamage,applied.freezeDamage);Eq(RosterBalance.BrittleBonus,applied.brittleBonus);
            var c=W22Catalog(out _);var lab=AiLab.NewMatch(c,c.Roster.Decks[0],c.Roster.Decks[1],1,out _).State;
            Eq(RosterBalance.ShatterKeepsIce,lab.shatterKeepsIce);Eq(RosterBalance.FreezeDamage,lab.freezeDamage);Eq(RosterBalance.BrittleBonus,lab.brittleBonus);
        });

        Test("W24 shatterer: under the rule its hit leaves the ice where it is - a frozen ball stays frozen - once a turn for each enemy",()=>{
            // Without the rule (deepFreeze alone) the hit sets the ball free.
            var old=W24Deep();var b0=old.Spawn(0,"shatterer",200,450);var f0=W24Frozen(old,1,"normal",250,450);
            W24Touch(old,b0,f0);Eq(15,f0.hp);Eq(0f,f0.frozen);
            // The rule: 15 HP from a frozen ball, and it is still frozen until the same turn as before.
            var s=W24Deep();s.State.shatterKeepsIce=true;var breaker=s.Spawn(0,"shatterer",200,450);var frozen=W24Frozen(s,1,"normal",250,450);int until=frozen.thawTurn;
            W24Touch(s,breaker,frozen);
            Eq(15,frozen.hp);True(AbilityResolver.DeepFrozen(frozen));Eq(until,frozen.thawTurn);
            True(s.State.events.Any(e=>e.kind=="SHATTER"&&e.ballId==frozen.id&&e.otherId==breaker.id));
            // The same Shatterer, the same enemy, the same turn: nothing more.
            W24Touch(s,breaker,frozen);Eq(15,frozen.hp);
            // Another Shatterer has its own count; next turn the first one strikes again.
            var second=s.Spawn(0,"shatterer",200,500);W24Touch(s,second,frozen);Eq(0,frozen.hp);True(frozen.dead);
            // A chilled ball: 5 HP for every chill, and the chills stay.
            var t=W24Deep();t.State.shatterKeepsIce=true;var hammer=t.Spawn(0,"shatterer",200,450);var cold=t.Spawn(1,"normal",250,450);
            t.Abilities.ApplyIce(cold,0);t.Abilities.ApplyIce(cold,0);int turns=cold.iceTurns;
            W24Touch(t,hammer,cold);Eq(20,cold.hp);Eq(2,cold.iceStacks);Eq(turns,cold.iceTurns);False(cold.frozen>0);
            foreach(var b in t.State.balls)b.turnAffectedIds.Clear();
            W24Touch(t,hammer,cold);Eq(10,cold.hp);Eq(2,cold.iceStacks);
            // No ice on the ball: nothing, and the turn's one strike is not used up.
            var n=W24Deep();n.State.shatterKeepsIce=true;var idle=n.Spawn(0,"shatterer",200,450);var warm=n.Spawn(1,"normal",250,450);
            W24Touch(n,idle,warm);Eq(30,warm.hp);n.Abilities.ApplyIce(warm,0);W24Touch(n,idle,warm);Eq(25,warm.hp);
            // Its own team is never struck.
            var own=W24Deep();own.State.shatterKeepsIce=true;var mine=own.Spawn(0,"shatterer",200,450);var friend=W24Frozen(own,0,"normal",250,450);
            W24Touch(own,mine,friend);Eq(30,friend.hp);
        });

        Test("W24 freezing costs HP under the rule - from the third chill, a field or the ice trap alike",()=>{
            // Without the rule a freeze takes no HP.
            var old=W24Deep();var f0=W24Frozen(old,1,"normal",270,450);Eq(30,f0.hp);
            var s=W24Deep();s.State.freezeDamage=5;var ball=s.Spawn(1,"normal",270,450);
            s.Abilities.ApplyIce(ball,0);s.Abilities.ApplyIce(ball,0);Eq(30,ball.hp);
            s.Abilities.ApplyIce(ball,0);True(AbilityResolver.DeepFrozen(ball));Eq(25,ball.hp);
            // Frozen already: another chill does nothing at all.
            s.Abilities.ApplyIce(ball,0);Eq(25,ball.hp);
            // The ice trap.
            var trapped=s.Spawn(1,"normal",270,300);s.Abilities.FreezeNow(trapped,0);True(trapped.frozen>0);Eq(25,trapped.hp);
            // A burning ball is only put out: no freeze, no cost.
            var burning=s.Spawn(1,"normal",100,300);s.Abilities.ApplyFire(burning,0);s.Abilities.FreezeNow(burning,0);Eq(30,burning.hp);False(burning.frozen>0);
            // A shield takes it first.
            var guarded=s.Spawn(1,"normal",400,300);guarded.shield=5;s.Abilities.FreezeNow(guarded,0);Eq(30,guarded.hp);Eq(0,guarded.shield);
            // The freeze can be the end of a ball - and a ball that dies frozen has no power: this Bomb does not go off.
            var bomb=s.Spawn(1,"bomb",270,600);bomb.hp=5;var near=s.Spawn(0,"normal",330,600);
            s.Abilities.FreezeNow(bomb,0);True(bomb.dead);Eq(30,near.hp);False(s.State.events.Any(e=>e.kind=="EXPLOSION"));
            // The reference freeze (seconds of motion) is not this rule's business.
            var reference=W24Plain();reference.State.freezeDamage=5;var r=reference.Spawn(1,"normal",270,450);for(int i=0;i<3;i++)reference.Abilities.ApplyIce(r,0);
            True(r.frozen>0);Eq(30,r.hp);
        });

        Test("W24 brittle: under the rule a hard hit takes more from a frozen ball - only a hit, only while frozen",()=>{
            var s=W24Deep();s.State.brittleBonus=5;var frozen=W24Frozen(s,1,"normal",270,450);var free=s.Spawn(1,"normal",270,300);
            s.Damage(frozen,6,true);Eq(19,frozen.hp);
            s.Damage(free,6,true);Eq(24,free.hp);
            // Fire, poison, bolts and blasts are not hits.
            s.Damage(frozen,5);Eq(14,frozen.hp);
            // Thawed, it is an ordinary ball again.
            s.State.turnNumber=frozen.thawTurn;s.Abilities.OnTurnEnd(0);False(frozen.frozen>0);s.Damage(frozen,6,true);Eq(8,frozen.hp);
            // A shield still takes the hit first, bonus and all.
            var guarded=W24Frozen(s,1,"normal",100,450);guarded.shield=10;s.Damage(guarded,6,true);Eq(0,guarded.shield);Eq(29,guarded.hp);
            // Without the rule, and under the reference freeze, a hit is a hit.
            var old=W24Deep();var f0=W24Frozen(old,1,"normal",270,450);old.Damage(f0,6,true);Eq(24,f0.hp);
            var reference=W24Plain();reference.State.brittleBonus=5;var r=reference.Spawn(1,"normal",270,450);for(int i=0;i<3;i++)reference.Abilities.ApplyIce(r,0);
            reference.Damage(r,6,true);Eq(24,r.hp);
            // In a real collision: the same shot at a frozen ball takes exactly the bonus more.
            int Hit(int bonus)
            {
                var m=W24Deep();m.State.brittleBonus=bonus;m.State.bonusUsed=true;var target=W24Frozen(m,1,"normal",270,500);
                True(m.TryCommand(new PlayerCommand{owner=0,turnNumber=m.State.turnNumber,kind=CommandKind.Spawn,ballType="normal",dx=0,dy=-1,power=560},out string why),why);
                Settle(m);return 30-target.hp;
            }
            int plainHit=Hit(0);True(plainHit>=3,"the shot did not hit hard: "+plainHit);Eq(plainHit+5,Hit(5));
        });
    }
}
