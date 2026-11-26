using System;
using System.IO;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Physics;
using CoreClash.Presentation;
using CoreClash.SelfPlay;

// CC-001 W24 (owner decision, 2026-11-24: "strengthen the ice balls and weaken the Jungle deck by
// the lab's report"). The changes are match rules and roster numbers: the reference rules, which
// every older test in this suite runs, are untouched.
public static partial class Program
{
    static GameSimulation W24Deep(){var s=Sim();s.State.plainPowers=true;s.State.deepFreeze=true;return s;}
    static BallRuntime W24Frozen(GameSimulation s,int owner,string type,float x,float y)
    {
        var b=s.Spawn(owner,type,x,y);for(int i=0;i<3;i++)s.Abilities.ApplyIce(b,1-owner);return b;
    }

    static void W24BalanceTests()
    {
        Test("W24 deep freeze: a match rule that is off by default; the game, the card demos and the lab switch it on",()=>{
            False(Sim().State.deepFreeze);
            // The reference freeze is a matter of seconds of motion: it is gone after 2.4 s of an action.
            var old=Sim();var ball=old.Spawn(1,"normal",270,450);for(int i=0;i<3;i++)old.Abilities.ApplyIce(ball,0);
            True(ball.frozen>0);False(AbilityResolver.DeepFrozen(ball));Eq(-1,ball.thawTurn);
            old.State.phase=MatchPhase.Moving;for(int i=0;i<300;i++)old.Physics.Step(1f/120);
            Eq(0f,ball.frozen);
            // One place holds the roster's balance numbers; the game and the card demos apply it.
            var applied=new GameState();RosterBalance.Apply(applied);True(applied.deepFreeze);
            string setup=File.ReadAllText(Path.Combine(projectRoot,"Assets/CoreClash/Presentation/MatchSetup.cs"));
            True(setup.Contains("RosterBalance.Apply(state);"));
            string demo=File.ReadAllText(Path.Combine(projectRoot,"Assets/CoreClash/Presentation/BallDemo.cs"));
            True(demo.Contains("RosterBalance.Apply(state);"));
            var c=W22Catalog(out _);
            True(AiLab.NewMatch(c,c.Roster.Decks[0],c.Roster.Decks[1],1,out _).State.deepFreeze);
        });
        Test("W24 deep freeze: the third chill freezes a ball for the next two turns - one of each player - whoever froze it and when",()=>{
            Eq(2,new GameState().freezeTurns);
            var s=W24Deep();s.State.turnNumber=5;var ball=s.Spawn(1,"normal",270,450);
            s.Abilities.ApplyIce(ball,0);s.Abilities.ApplyIce(ball,0);False(ball.frozen>0);Eq(2,ball.iceStacks);
            s.Abilities.ApplyIce(ball,0);
            True(AbilityResolver.DeepFrozen(ball));Eq(0,ball.iceStacks);Eq(7,ball.thawTurn);
            // Time does not thaw it.
            s.State.phase=MatchPhase.Moving;for(int i=0;i<600;i++)s.Physics.Step(1f/120);s.State.phase=MatchPhase.Aiming;
            True(AbilityResolver.DeepFrozen(ball));
            // The turn it was frozen in ends, then the next one: still frozen. The second one ends: thawed.
            s.Abilities.OnTurnEnd(0);True(ball.frozen>0);
            s.State.turnNumber=6;s.Abilities.OnTurnEnd(1);True(ball.frozen>0);
            s.State.turnNumber=7;s.Abilities.OnTurnEnd(0);
            Eq(0f,ball.frozen);Eq(-1,ball.thawTurn);False(ball.statusOrder.Any(x=>x.family=="ICE"));
            True(s.State.events.Any(e=>e.kind=="THAW"&&e.ballId==ball.id));
            // A ball frozen by a field at the very end of a turn is frozen through the two turns after it.
            var late=W24Deep();late.State.turnNumber=8;var slow=late.Spawn(0,"normal",270,450);late.Abilities.ApplyIce(slow,1);late.Abilities.ApplyIce(slow,1);
            var storm=late.Spawn(1,"blizzardcore",270,470);late.Abilities.OnStop(storm);
            late.Abilities.OnTurnEnd(1);True(AbilityResolver.DeepFrozen(slow));Eq(10,slow.thawTurn);
            late.State.turnNumber=9;late.Abilities.OnTurnEnd(0);True(slow.frozen>0);
            late.State.turnNumber=10;late.Abilities.OnTurnEnd(1);Eq(0f,slow.frozen);
            // The length is the rule's number.
            var longer=W24Deep();longer.State.freezeTurns=3;longer.State.turnNumber=2;var third=W24Frozen(longer,1,"normal",270,450);Eq(5,third.thawTurn);
        });
        Test("W24 deep freeze: a frozen ball takes no more chills, so a freeze cannot be prolonged; fire still melts it",()=>{
            var s=W24Deep();var ball=W24Frozen(s,1,"normal",270,450);int until=ball.thawTurn;
            s.State.turnNumber+=1;
            s.Abilities.ApplyIce(ball,0);s.Abilities.ApplyIce(ball,0);
            Eq(until,ball.thawTurn);Eq(0,ball.iceStacks);
            s.Abilities.ApplyFire(ball,0);
            Eq(0f,ball.frozen);Eq(0,ball.fireStacks);Eq(-1,ball.thawTurn);
        });
        Test("W24 deep freeze: a frozen ball does not press the base and does not count for the centre",()=>{
            var s=W24Deep();var raider=s.Spawn(1,"normal",270,860);
            True(ZoneResolver.TouchesEnemyZone(raider));
            s.Rules.ApplyTurnPressure(1);Eq(19,s.State.players[0].hp);
            for(int i=0;i<3;i++)s.Abilities.ApplyIce(raider,0);
            s.Rules.ApplyTurnPressure(1);Eq(19,s.State.players[0].hp);
            // The centre: two of mine against none would cost the other base 1 HP - not while one of the two is frozen.
            var centre=W24Deep();var first=centre.Spawn(0,"normal",240,450);var second=centre.Spawn(0,"normal",300,450);
            centre.Rules.ApplyTurnPressure(0);Eq(19,centre.State.players[1].hp);
            for(int i=0;i<3;i++)centre.Abilities.ApplyIce(second,1);
            centre.Rules.ApplyTurnPressure(0);Eq(19,centre.State.players[1].hp);
            // In the reference rules a frozen ball presses as before.
            var old=Sim();var same=old.Spawn(1,"normal",270,860);for(int i=0;i<3;i++)old.Abilities.ApplyIce(same,0);
            old.Rules.ApplyTurnPressure(1);Eq(19,old.State.players[0].hp);
        });
        Test("W24 deep freeze: a frozen ball's power does not work - on touch, at the start of a turn, when it dies",()=>{
            var s=W24Deep();var cactus=W24Frozen(s,1,"thornback",270,450);var mine=s.Spawn(0,"normal",330,450);
            W24Touch(s,cactus,mine);W24Touch(s,mine,cactus);Eq(30,mine.hp);
            var storm=W24Frozen(s,1,"chainshock",270,300);var target=s.Spawn(0,"normal",270,380);
            s.Abilities.OnTurnStart(1);Eq(30,target.hp);
            // Thawed, both work again.
            s.State.turnNumber+=2;s.Abilities.OnTurnEnd(1);
            foreach(var b in s.State.balls)b.turnAffectedIds.Clear();
            W24Touch(s,cactus,mine);Eq(25,mine.hp);
            s.Abilities.OnTurnStart(1);Eq(25,target.hp);
            // An Acorn that dies frozen does not grow back.
            var grove=W24Deep();var acorn=W24Frozen(grove,1,"cascade",270,450);int before=grove.State.balls.Count;
            grove.Kill(acorn);Eq(0,grove.State.balls.Count(b=>!b.dead&&b.owner==1));Eq(before,grove.State.balls.Count);
            var warm=W24Deep();var alive=warm.Spawn(1,"cascade",270,450);warm.Kill(alive);Eq(1,warm.State.balls.Count(b=>!b.dead&&b.owner==1));
        });
        Test("W24 deep freeze: nothing moves a frozen ball, and it cannot be played again",()=>{
            var s=W24Deep();s.State.bonusUsed=true;
            var wall=W24Frozen(s,1,"normal",270,300);float x=wall.x,y=wall.y;
            True(CollisionResolver.Held(wall));Eq(0f,CollisionResolver.ForceScale(wall));
            True(s.TryCommand(new PlayerCommand{owner=0,turnNumber=1,kind=CommandKind.Spawn,ballType="normal",dx=0,dy=-1,power=590},out _));
            Settle(s);
            True(Math.Abs(wall.x-x)<.01f&&Math.Abs(wall.y-y)<.01f,"a frozen ball was moved");
            True(wall.hp<30,"the shot did not reach the frozen ball");
            // Its owner's turn: it stands in their own zone, and still cannot be played again.
            var home=W24Deep();var held=W24Frozen(home,0,"normal",270,860);var free=home.Spawn(0,"normal",150,860);
            False(home.CanReplay(held));True(home.CanReplay(free));
        });
        Test("W24 deep freeze: in whole matches a frozen ball stays where it is and thaws after its two turns",()=>{
            var c=W22Catalog(out _);var seen=new System.Collections.Generic.HashSet<string>();int freezes=0,matches=0;
            var decks=c.Roster.Decks.Where(d=>d.balls.Contains("ice")).ToArray();True(decks.Length>=2);
            for(int game=0;game<6;game++)
            {
                var s=AiLab.NewMatch(c,decks[game%decks.Length],decks[(game+1)%decks.Length],(ulong)(700+game),out _);matches++;
                var rng=new SelfPlayRng((ulong)(2000+game));ISelfPlayStrategy[] players={new HeuristicStrategy(),new HeuristicStrategy()};
                int guard=0,cursor=0;
                while(s.State.phase!=MatchPhase.Over&&guard++<400)
                {
                    var held=s.State.balls.Where(b=>!b.dead&&AbilityResolver.DeepFrozen(b)).ToDictionary(b=>b.id,b=>(b.x,b.y));
                    var command=players[s.State.turn].Choose(s,s.State.turn,rng);
                    if(command==null||!s.TryCommand(command,out _))True(s.TryCommand(SelfPlayAim.Spawn(s,s.State.turn,"normal",0,420),out string why),"no legal shot: "+why);
                    int steps=0;while(s.State.phase==MatchPhase.Moving&&steps++<6000)s.Step(1f/120);
                    True(s.State.phase!=MatchPhase.Moving,"an action never settled");
                    foreach(var e in s.State.events)if(e.id>cursor){seen.Add(e.kind);if(e.kind=="FREEZE")freezes++;}
                    cursor=s.State.eventSerial;
                    foreach(var ball in s.State.balls)
                    {
                        if(ball.dead)continue;
                        // Still frozen after the action: it has not moved by a hair.
                        if(AbilityResolver.DeepFrozen(ball)&&held.TryGetValue(ball.id,out var was))True(Math.Abs(ball.x-was.x)<.01f&&Math.Abs(ball.y-was.y)<.01f,"a frozen "+ball.type+" moved");
                        // No freeze outlives its two turns; every freeze of this rule has its end set.
                        if(ball.frozen>0){True(ball.thawTurn>=0,"a freeze without an end");True(s.State.turnNumber<=ball.thawTurn&&ball.thawTurn<=s.State.turnNumber+2,"a freeze that should have thawed: "+ball.type);}
                        else Eq(-1,ball.thawTurn);
                    }
                }
            }
            Console.WriteLine("EVIDENCE W24 deep freeze self-play matches="+matches+" freezes="+freezes+" thaw="+seen.Contains("THAW")+" shatter="+seen.Contains("SHATTER"));
            True(freezes>0,"no ball was frozen in "+matches+" matches");True(seen.Contains("THAW"),"no ball ever thawed");
        });
        Test("W24 ice trap: under the rule it freezes the enemy outright; a burning enemy is put out instead",()=>{
            var s=W24Deep();var cold=s.Spawn(1,"normal",270,450);
            s.Abilities.FreezeNow(cold,0);True(AbilityResolver.DeepFrozen(cold));Eq(0,cold.iceStacks);
            var hot=s.Spawn(1,"normal",270,600);s.Abilities.ApplyFire(hot,0);
            s.Abilities.FreezeNow(hot,0);Eq(0,hot.fireStacks);Eq(0f,hot.frozen);
            string payoff=File.ReadAllText(Path.Combine(projectRoot,"Assets/CoreClash/Core/StatusPayoffEffects.cs"));
            True(payoff.Contains("if(S.deepFreeze)FreezeNow(target,trap.owner);else ApplyIce(target,trap.owner);"));
        });
        Test("W24 Shatterer: under the rule it takes 5 HP for every chill it breaks, 15 from a frozen ball, and uses the ice up",()=>{
            Eq(5,AbilityResolver.ShatterPerChill);
            for(int chills=0;chills<=3;chills++){
                var s=W24Deep();var breaker=s.Spawn(0,"shatterer",200,450);var target=s.Spawn(1,"normal",250,450);
                for(int i=0;i<chills;i++)s.Abilities.ApplyIce(target,0);
                W24Touch(s,breaker,target);
                Eq(30-5*chills,target.hp);Eq(0,target.iceStacks);Eq(0f,target.frozen);
                // The ice is gone: a second touch finds nothing to break.
                W24Touch(s,breaker,target);Eq(30-5*chills,target.hp);
            }
            // The reference rules: nothing for one chill, 5 for two or a frozen ball.
            var old=W24Plain();var b0=old.Spawn(0,"shatterer",200,450);var one=old.Spawn(1,"normal",250,450);old.Abilities.ApplyIce(one,0);
            W24Touch(old,b0,one);Eq(30,one.hp);Eq(1,one.iceStacks);
            old.Abilities.ApplyIce(one,0);W24Touch(old,b0,one);Eq(25,one.hp);Eq(0,one.iceStacks);
        });
        Test("W24 Frost: under the rule it only chills - a frozen ball loses nothing to it, its neighbours are still chilled",()=>{
            var s=W24Deep();var frost=s.Spawn(0,"ice",200,450);var target=W24Frozen(s,1,"normal",250,450);var beside=s.Spawn(1,"normal",320,450);
            W24Touch(s,frost,target);
            Eq(30,target.hp);True(AbilityResolver.DeepFrozen(target));Eq(1,beside.iceStacks);
            // The reference rules: 5 HP from a ball that was already frozen.
            var old=W24Plain();var f0=old.Spawn(0,"ice",200,450);var t0=old.Spawn(1,"normal",250,450);for(int i=0;i<3;i++)old.Abilities.ApplyIce(t0,0);
            W24Touch(old,f0,t0);Eq(25,t0.hp);
        });
        Test("W24 AI: the computer does not count a frozen ball as an attacker, a defender's worry or a holder of the centre",()=>{
            var s=W24Deep();var raider=s.Spawn(1,"normal",270,860);var holder=s.Spawn(1,"normal",270,450);
            var f=new float[AiWeights.Count];
            AiBrain.Features(s.State,0,f);Eq(-1f,f[6]);Eq(-1f,f[7]);
            for(int i=0;i<3;i++){s.Abilities.ApplyIce(raider,0);s.Abilities.ApplyIce(holder,0);}
            AiBrain.Features(s.State,0,f);Eq(0f,f[6]);Eq(0f,f[7]);
            // Seen from the other side: its own frozen raider is no attack.
            AiBrain.Features(s.State,1,f);Eq(0f,f[5]);
        });
        Test("W24 AI: HP a ball is about to lose to fire or poison counts as lost; a chill on the way to a freeze counts for more under the rule",()=>{
            var s=W24Deep();var burning=s.Spawn(1,"normal",270,450);var f=new float[AiWeights.Count];
            AiBrain.Features(s.State,0,f);Eq(-1f,f[4]);
            s.Abilities.ApplyFire(burning,0);Eq(15,AiBrain.Pending(burning));
            AiBrain.Features(s.State,0,f);Eq(-.5f,f[4]);
            var poisoned=s.Spawn(1,"normal",270,300);s.Abilities.ApplyToxin(poisoned,0);Eq(15,AiBrain.Pending(poisoned));
            AiBrain.Features(s.State,0,f);Eq(-1f,f[4]);
            // A ball with less HP than it is about to lose is worth nothing, not less than nothing.
            poisoned.hp=5;AiBrain.Features(s.State,0,f);Eq(-.5f,f[4]);
            var plain=W24Plain();var cold=plain.Spawn(1,"normal",270,450);plain.Abilities.ApplyIce(cold,0);
            AiBrain.Features(plain.State,0,f);Eq(.5f,f[8]);
            var deep=W24Deep();var colder=deep.Spawn(1,"normal",270,450);deep.Abilities.ApplyIce(colder,0);
            AiBrain.Features(deep.State,0,f);Eq(1f,f[8]);
        });
        Test("W24 poison numbers: how long a poison lasts and what the Leech takes are match rules with the reference numbers as defaults",()=>{
            Eq(3,Sim().State.poisonTurns);Eq(5,Sim().State.leechDrain);
            var s=W24Plain();var target=s.Spawn(1,"normal",270,450);
            s.Abilities.ApplyToxin(target,0);Eq(3,target.toxinTurns);
            s.State.poisonTurns=2;s.Abilities.ApplyToxin(target,0);Eq(2,target.toxinTurns);
            // The reference Leech: its bite poisons, and in each turn of its owner it takes 5 HP more and heals by them.
            var old=W24Plain();var leech=old.Spawn(0,"plagueleech",200,450);var prey=old.Spawn(1,"normal",250,450);leech.hp=10;
            W24Touch(old,leech,prey);Eq(3,prey.toxinTurns);Eq(prey.id,leech.linkedTargetId);
            old.Abilities.OnTurnStart(0);Eq(25,prey.hp);Eq(15,leech.hp);
        });
        Test("W24 roster balance: one place holds the numbers the game plays by - the freeze rule, the Leech, the Poison Pool",()=>{
            var state=new GameState();
            Eq(165f,state.poolRadius);Eq(5,state.leechDrain);Eq(3,state.poisonTurns);False(state.deepFreeze);
            RosterBalance.Apply(state);
            True(state.deepFreeze);Eq(2,state.freezeTurns);True(state.venomOncePerTurn);Eq(0,state.leechDrain);Eq(130f,state.poolRadius);Eq(RosterBalance.PoisonTurns,state.poisonTurns);
            False(new GameState().venomOncePerTurn);
            Eq(RosterBalance.PoolRadius,state.poolRadius);Eq(RosterBalance.LeechDrain,state.leechDrain);
            RosterBalance.Apply(null);
            // The pool the rules lay is the pool the card and the aiming ring show.
            var s=W24Plain();RosterBalance.Apply(s.State);var pool=s.Spawn(0,"blightpool",270,450);s.Abilities.OnStop(pool);
            Eq(130f,s.State.zones.Single(z=>z.kind=="blight").radius);
            Eq(RosterBalance.PoolRadius,BallGuide.For("blightpool").Range);
            var old=W24Plain();var wide=old.Spawn(0,"blightpool",270,450);old.Abilities.OnStop(wide);
            Eq(165f,old.State.zones.Single(z=>z.kind=="blight").radius);
            // The Blizzard keeps its size.
            var cold=W24Plain();RosterBalance.Apply(cold.State);var storm=cold.Spawn(0,"blizzardcore",270,450);cold.Abilities.OnStop(storm);
            Eq(165f,cold.State.zones.Single(z=>z.kind=="ice").radius);
            // An enemy between the two radii is poisoned by the reference pool only.
            var far0=old.Spawn(1,"normal",270+150,450);old.Abilities.OnTurnEnd(0);True(far0.toxinTurns>0);
            var far1=s.Spawn(1,"normal",270+180,450);var near1=s.Spawn(1,"normal",270+120,450);s.Abilities.OnTurnEnd(0);Eq(0,far1.toxinTurns);True(near1.toxinTurns>0);
            // The lab plays by the same numbers as the game.
            var c=W22Catalog(out _);var lab=AiLab.NewMatch(c,c.Roster.Decks[0],c.Roster.Decks[1],1,out _).State;
            True(lab.deepFreeze);Eq(0,lab.leechDrain);Eq(130f,lab.poolRadius);
        });
        Test("W24 Venom: under the rule its bite into a poisoned enemy works once a turn for each enemy",()=>{
            var s=W24Plain();s.State.venomOncePerTurn=true;
            var venom=s.Spawn(0,"venom",200,450);var a=s.Spawn(1,"normal",250,450);var b=s.Spawn(1,"normal",200,500);venom.hp=10;
            // First touch poisons; the second, the same turn, bites: 5 from the enemy, 5 back.
            W24Touch(s,venom,a);Eq(30,a.hp);True(a.toxinTurns>0);
            W24Touch(s,venom,a);Eq(25,a.hp);Eq(15,venom.hp);
            // A third touch the same turn does nothing more - but another poisoned enemy can still be bitten.
            W24Touch(s,venom,a);Eq(25,a.hp);Eq(15,venom.hp);
            s.Abilities.ApplyToxin(b,0);W24Touch(s,venom,b);Eq(25,b.hp);Eq(20,venom.hp);
            // Next turn it bites again.
            foreach(var ball in s.State.balls)ball.turnAffectedIds.Clear();
            W24Touch(s,venom,a);Eq(20,a.hp);Eq(25,venom.hp);
            // The reference rules: every touch counts.
            var old=W24Plain();var v0=old.Spawn(0,"venom",200,450);var e0=old.Spawn(1,"normal",250,450);
            W24Touch(old,v0,e0);W24Touch(old,v0,e0);W24Touch(old,v0,e0);Eq(20,e0.hp);
        });
        Test("W24 Leech with leechDrain 0: the bite poisons; while that poison lasts the Leech heals 5 HP a turn and takes nothing more",()=>{
            var s=W24Plain();s.State.leechDrain=0;
            var leech=s.Spawn(0,"plagueleech",200,450);var prey=s.Spawn(1,"normal",250,450);leech.hp=10;
            W24Touch(s,leech,prey);Eq(3,prey.toxinTurns);Eq(prey.id,leech.linkedTargetId);
            s.Abilities.OnTurnStart(0);Eq(30,prey.hp);Eq(15,leech.hp);True(s.State.events.Any(e=>e.kind=="DRAIN"&&e.ballId==leech.id));
            // The poison itself still takes its 5 HP in each turn of the poisoned ball.
            s.Abilities.OnTurnStart(1);Eq(25,prey.hp);
            s.Abilities.OnTurnStart(0);Eq(25,prey.hp);Eq(20,leech.hp);
            s.Abilities.OnTurnStart(1);s.Abilities.OnTurnStart(1);Eq(15,prey.hp);Eq(0,prey.toxinTurns);
            // The poison is over: the Leech lets go and heals no more.
            s.Abilities.OnTurnStart(0);Eq(20,leech.hp);Eq(0,leech.linkedTargetId);
            // A Leech at full HP does not report a drain.
            var full=W24Plain();full.State.leechDrain=0;var fat=full.Spawn(0,"plagueleech",200,450);var other=full.Spawn(1,"normal",250,450);
            W24Touch(full,fat,other);int drains=full.State.events.Count(e=>e.kind=="DRAIN");full.Abilities.OnTurnStart(0);Eq(drains,full.State.events.Count(e=>e.kind=="DRAIN"));Eq(30,other.hp);
        });
    }
}
