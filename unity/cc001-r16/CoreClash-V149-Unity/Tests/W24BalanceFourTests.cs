using System;
using System.IO;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Presentation;

// CC-001 W24, the fourth balance pass (2026-11-25), after the owner's place-once rule and the mended
// lookahead of the computer. On the bigger sample (300 matches a deck) the ready decks stood in two
// rows: Fire Pit 62%, Acid Rain 57%, Jungle 56% - Frozen Garden 45%, Dynamo 41%, Polar Storm 40%.
// Taken: a freeze costs 10 HP. Measured and waiting for the owner's word: the flat fire.
public static partial class Program
{
    static void W24BalanceFourTests()
    {
        Test("W24 fourth balance pass: a freeze costs the ball 10 HP in the game and nothing in the reference rules",()=>{
            Eq(10,RosterBalance.FreezeDamage);
            Eq(0,new GameState().freezeDamage);
            var applied=new GameState();RosterBalance.Apply(applied);Eq(10,applied.freezeDamage);
            // The third chill freezes the ball and takes the 10 HP once; a frozen ball takes no more chills.
            var s=W24Deep();RosterBalance.Apply(s.State);var ball=s.Spawn(1,"normal",270,450);
            s.Abilities.ApplyIce(ball,0);s.Abilities.ApplyIce(ball,0);Eq(30,ball.hp);
            s.Abilities.ApplyIce(ball,0);True(AbilityResolver.DeepFrozen(ball));Eq(20,ball.hp);
            s.Abilities.ApplyIce(ball,0);Eq(20,ball.hp);
            // A ball with 10 HP or less does not survive being frozen.
            var weak=s.Spawn(1,"normal",150,450);weak.hp=10;
            for(int i=0;i<3;i++)s.Abilities.ApplyIce(weak,0);
            True(weak.dead);
            // The cards of the ice balls say the game's number.
            string cost=RosterBalance.FreezeDamage.ToString();
            True(W24Fact("frosttrap",1,true).Contains(cost),W24Fact("frosttrap",1,true));
            True(W24Fact("frosttrap",1,false).Contains(cost),W24Fact("frosttrap",1,false));
            True(BallGuide.For("ice").DoesPl.Contains(cost+" HP"),BallGuide.For("ice").DoesPl);
            True(BallGuide.For("ice").DoesEn.Contains(cost+" HP"),BallGuide.For("ice").DoesEn);
        });

        Test("W24 flat fire: a match rule, off in the reference rules - a burning ball loses 5 HP a turn however many fires are on it",()=>{
            False(new GameState().fireFlat);
            // The reference rules: two fires burn 10 HP a turn for 4 turns - more than a ball has.
            var reference=W24Plain();var a=reference.Spawn(1,"normal",200,450);a.hp=a.maxHp=100;
            reference.Abilities.ApplyFire(a,0);reference.Abilities.ApplyFire(a,0);Eq(2,a.fireStacks);Eq(4,a.burnTurns);
            for(int turn=0;turn<6;turn++)reference.Abilities.OnTurnStart(1);
            Eq(60,a.hp);Eq(0,a.fireStacks);
            // Under the rule: the second fire makes it burn longer, not harder - 5 HP a turn for 4 turns.
            var ruled=W24Plain();ruled.State.fireFlat=true;var b=ruled.Spawn(1,"normal",200,450);b.hp=b.maxHp=100;
            ruled.Abilities.ApplyFire(b,0);Eq(3,b.burnTurns);
            ruled.Abilities.ApplyFire(b,0);Eq(2,b.fireStacks);Eq(4,b.burnTurns);
            for(int turn=0;turn<6;turn++)ruled.Abilities.OnTurnStart(1);
            Eq(80,b.hp);Eq(0,b.fireStacks);
            // One fire is the same under both: 5 HP a turn for 3 turns.
            var single=W24Plain();single.State.fireFlat=true;var c=single.Spawn(1,"normal",200,450);
            single.Abilities.ApplyFire(c,0);for(int turn=0;turn<5;turn++)single.Abilities.OnTurnStart(1);
            Eq(15,c.hp);
            // The third fire still bursts at once (5 HP) and leaves no fire behind.
            var third=W24Plain();third.State.fireFlat=true;var d=third.Spawn(1,"normal",200,450);
            for(int i=0;i<3;i++)third.Abilities.ApplyFire(d,0);
            Eq(0,d.fireStacks);Eq(25,d.hp);
        });

        Test("W24 flat fire: the game follows one switch, and the fire group's card follows it too",()=>{
            var applied=new GameState();RosterBalance.Apply(applied);Eq(RosterBalance.FireFlat,applied.fireFlat);
            var fire=BallGroups.All.First(g=>g.Id=="fire");
            Eq(RosterBalance.FireFlat,fire.PlanPl.Contains("dłużej"));Eq(!RosterBalance.FireFlat,fire.PlanPl.Contains("mocniej"));
            Eq(RosterBalance.FireFlat,fire.PlanEn.Contains("longer"));Eq(!RosterBalance.FireFlat,fire.PlanEn.Contains("harder"));
            // Rules the pass tried and did not keep are not left in the state.
            string state=File.ReadAllText(Path.Combine(projectRoot,"Assets/CoreClash/Core/GameState.cs"));
            False(state.Contains("fireTurns"));False(state.Contains("chillsToFreeze"));
        });
    }
}
