using System;
using System.IO;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Presentation;

// CC-001 W24, the fifth balance pass (2026-11-26, owner: "balance it with the numbers"). The three
// strong ready decks were the ones with fire and poison. Taken: a second fire burns longer and no
// harder, a fire and a poisoning last 2 turns, Venom's bite gives nothing back, the Bomb takes
// 5-10, the Mushroom's cloud reaches 130, Player 2's extra opening ball has 10 HP. On the seats
// run the spread between the ready decks fell from 22 points to 6.5 and the first player wins 50.2%.
public static partial class Program
{
    static void W24BalanceFiveTests()
    {
        Test("W24 fifth balance pass: every number is a match rule whose default is the reference rule, set for the game in one place",()=>{
            var plain=new GameState();
            Eq(3,plain.fireLasts);Eq(0,plain.bombDamage);Eq(3,plain.poisonTurns);Eq(5,plain.venomHeal);Eq(100f,plain.sporeRadius);False(plain.fireFlat);
            var game=new GameState();RosterBalance.Apply(game);
            Eq(RosterBalance.FireLasts,game.fireLasts);Eq(RosterBalance.BombDamage,game.bombDamage);Eq(RosterBalance.PoisonTurns,game.poisonTurns);
            Eq(RosterBalance.VenomHeal,game.venomHeal);Eq(RosterBalance.SporeRadius,game.sporeRadius);Eq(RosterBalance.FireFlat,game.fireFlat);
            Eq(RosterBalance.OpeningBonusHp,game.openingBonusHp);
            // The numbers the pass settled on.
            True(RosterBalance.FireFlat);Eq(2,RosterBalance.FireLasts);Eq(2,RosterBalance.PoisonTurns);Eq(0,RosterBalance.VenomHeal);
            Eq(12,RosterBalance.BombDamage);Eq(130f,RosterBalance.SporeRadius);Eq(10,RosterBalance.OpeningBonusHp);
            // Numbers the pass tried and did not keep are not left in the state.
            string state=File.ReadAllText(Path.Combine(projectRoot,"Assets/CoreClash/Core/GameState.cs"));
            False(state.Contains("acornReturns"));False(state.Contains("webCount"));
        });

        Test("W24 fifth balance pass: in the game one fire takes 10 HP over 2 turns, a second fire only adds a turn, a third still bursts",()=>{
            // The reference rules: 5 HP a turn for 3 turns.
            var old=W24Plain();var a=old.Spawn(1,"normal",200,450);
            old.Abilities.ApplyFire(a,0);Eq(3,a.burnTurns);for(int turn=0;turn<5;turn++)old.Abilities.OnTurnStart(1);Eq(15,a.hp);
            // The game.
            var s=W24Plain();RosterBalance.Apply(s.State);var b=s.Spawn(1,"normal",200,450);
            s.Abilities.ApplyFire(b,0);Eq(2,b.burnTurns);for(int turn=0;turn<5;turn++)s.Abilities.OnTurnStart(1);Eq(20,b.hp);Eq(0,b.fireStacks);
            var two=W24Plain();RosterBalance.Apply(two.State);var c=two.Spawn(1,"normal",200,450);
            two.Abilities.ApplyFire(c,0);two.Abilities.ApplyFire(c,0);Eq(2,c.fireStacks);Eq(3,c.burnTurns);
            for(int turn=0;turn<5;turn++)two.Abilities.OnTurnStart(1);Eq(15,c.hp);
            var three=W24Plain();RosterBalance.Apply(three.State);var d=three.Spawn(1,"normal",200,450);
            for(int i=0;i<3;i++)three.Abilities.ApplyFire(d,0);Eq(0,d.fireStacks);Eq(25,d.hp);
        });

        Test("W24 fifth balance pass: in the game a poisoning takes 10 HP over 2 turns and Venom's bite gives nothing back",()=>{
            var s=W24Plain();RosterBalance.Apply(s.State);var foe=s.Spawn(1,"normal",200,450);
            s.Abilities.ApplyToxin(foe,0);Eq(2,foe.toxinTurns);for(int turn=0;turn<5;turn++)s.Abilities.OnTurnStart(1);Eq(20,foe.hp);Eq(0,foe.toxinTurns);
            // Venom: the first touch poisons; a touch on a poisoned enemy takes 5 HP at once.
            var bite=W24Plain();RosterBalance.Apply(bite.State);var venom=bite.Spawn(0,"venom",200,450);var prey=bite.Spawn(1,"normal",240,450);venom.hp=20;
            bite.Abilities.OnContact(venom,prey,true,true,200);True(prey.toxinTurns>0);Eq(30,prey.hp);
            bite.State.turnNumber++;venom.turnAffectedIds.Clear();
            bite.Abilities.OnContact(venom,prey,true,true,200);Eq(25,prey.hp);Eq(20,venom.hp);
            // The reference rule gives Venom 5 HP back for that bite.
            var old=W24Plain();var oldVenom=old.Spawn(0,"venom",200,450);var oldPrey=old.Spawn(1,"normal",240,450);oldVenom.hp=20;
            old.Abilities.OnContact(oldVenom,oldPrey,true,true,200);old.Abilities.OnContact(oldVenom,oldPrey,true,true,200);Eq(25,oldPrey.hp);Eq(25,oldVenom.hp);
        });

        Test("W24 fifth balance pass: in the game the Bomb takes 10 next to it and 5 at its edge, stopped or destroyed",()=>{
            int Hit(float distance,bool destroyed)
            {
                var s=W24Plain();RosterBalance.Apply(s.State);var bomb=s.Spawn(0,"bomb",270,450);var foe=s.Spawn(1,"normal",270+distance,450);
                if(destroyed)s.Kill(bomb);else s.Abilities.OnStop(bomb);
                return 30-foe.hp;
            }
            Eq(10,Hit(43,false));Eq(5,Hit(160,false));Eq(0,Hit(170,false));
            Eq(10,Hit(43,true));Eq(5,Hit(160,true));
            True(W24Fact("bomb",0).StartsWith("5–10"),W24Fact("bomb",0));True(W24Fact("bomb",0,true).StartsWith("5–10"),W24Fact("bomb",0,true));
        });

        Test("W24 fifth balance pass: in the game the Mushroom's cloud reaches 130, and its card and its cloud on the screen say so",()=>{
            var old=W24Plain();var oldShroom=old.Spawn(0,"plagueburst",270,450);var oldFar=old.Spawn(1,"normal",390,450);old.Kill(oldShroom);Eq(0,oldFar.toxinTurns);
            var s=W24Plain();RosterBalance.Apply(s.State);var shroom=s.Spawn(0,"plagueburst",270,450);var far=s.Spawn(1,"normal",390,450);var out_=s.Spawn(1,"normal",270,590);
            s.Kill(shroom);True(far.toxinTurns>0);Eq(0,out_.toxinTurns);
            Eq(RosterBalance.SporeRadius,BallGuide.For("plagueburst").Range);
            string fx=File.ReadAllText(Path.Combine(projectRoot,"Assets/CoreClash/Presentation/Fx.cs"));
            True(fx.Contains("RosterBalance.SporeRadius"));
        });

        Test("W24 fifth balance pass: the cards say the game's numbers",()=>{
            string turnsEn=RosterBalance.FireLasts+" turns",turnsPl=RosterBalance.FireLasts+" tury";
            True(W24Fact("fire",0).Contains("5 HP × "+turnsEn),W24Fact("fire",0));True(W24Fact("fire",0,true).Contains("5 HP × "+turnsPl),W24Fact("fire",0,true));
            True(W24Fact("venom",0).Contains("5 HP × "+RosterBalance.PoisonTurns+" turns"),W24Fact("venom",0));
            // Fire: the second fire burns longer, and no card speaks of 10 HP a turn any more.
            var fire=BallGuide.For("fire");
            Eq(RosterBalance.FireFlat,fire.TipPl.Contains("o turę dłużej"));Eq(!RosterBalance.FireFlat,fire.TipPl.Contains("10 HP co turę"));
            Eq(RosterBalance.FireFlat,fire.TipEn.Contains("a turn longer"));
            // Venom: no word of healing when the bite gives nothing back.
            var venom=BallGuide.For("venom");
            Eq(RosterBalance.VenomHeal>0,venom.TipPl.Contains("odzyskuje"));Eq(RosterBalance.VenomHeal>0,venom.TipEn.Contains("back"));
            True(venom.TipPl.Contains("traci 5 HP"));
        });
    }
}
