using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Physics;
using CoreClash.Presentation;
using CoreClash.SelfPlay;

// CC-001 W24, the owner's notes after playing the build of 2026-11-24:
//   "the prediction is to take the balls into account too"   -> ShotForecast, AimGuide.ClipAtBodies
//   "traps are to be bigger and must not lie on one another" -> trapRadius, trapsApart
//   "the balls still stutter a little"                        -> FrameClock (and drawing between steps)
public static partial class Program
{
    static readonly JsonSerializerOptions W24CopyJson=new JsonSerializerOptions{IncludeFields=true};
    static GameState W24Copy(GameState state)=>JsonSerializer.Deserialize<GameState>(JsonSerializer.Serialize(state,W24CopyJson),W24CopyJson);
    static GameSimulation W24Sandbox(){var d=new DeckDefinition{id="test_fixture",balls=new[]{"fire","ice","plague","rimeburst","pyrecore","medic","shield","cleanser","ward"}};return new GameSimulation(catalog,d,d);}
    static PlayerCommand W24Aim(GameSimulation s,float dx,float dy,float power,string type="normal",int replayId=0)
        =>new PlayerCommand{owner=s.State.turn,turnNumber=s.State.turnNumber,kind=replayId>0?CommandKind.Replay:CommandKind.Spawn,ballId=replayId,ballType=type,dx=dx,dy=dy,power=power};
    static ShotForecast W24Forecast(GameSimulation live,PlayerCommand command,int slice=100000)
    {
        var forecast=ShotForecast.Begin(W24Sandbox(),W24Copy(live.State),command);
        for(int guard=0;guard<100000&&!forecast.Advance(slice);guard++){}
        return forecast;
    }
    static BallRuntime W24ById(GameSimulation s,int id)=>s.State.balls.FirstOrDefault(b=>b.id==id);

    static void W24ForecastTrapsTests()
    {
        Test("W24 forecast: on an empty board it ends exactly where the real shot ends, and the match it was made from is untouched",()=>{
            var live=W24Plain();live.State.bonusUsed=true;var command=W24Aim(live,-60,-120,470);
            int revision=live.State.revision,balls=live.State.balls.Count;
            var forecast=W24Forecast(live,command);
            True(forecast.Valid&&forecast.Finished);False(forecast.MoverDies);Eq(0,forecast.Others.Count);
            Eq(revision,live.State.revision);Eq(balls,live.State.balls.Count);Eq(MatchPhase.Aiming,live.State.phase);
            True(live.TryCommand(command,out string why),why);var ball=live.State.balls.Last();Eq(ball.id,forecast.MoverId);Settle(live);
            Eq(ball.x,forecast.StopX);Eq(ball.y,forecast.StopY);
            // The path starts at the launcher, ends at the stop and has the bounce off the side wall in it.
            Eq(270f,forecast.PathX[0]);Eq(853f,forecast.PathY[0]);Eq(forecast.StopX,forecast.PathX[forecast.PathX.Count-1]);Eq(forecast.StopY,forecast.PathY[forecast.PathY.Count-1]);
            True(forecast.PathX.Min()<ZoneResolver.Left+ball.radius+6,"no wall bounce in the path: "+forecast.PathX.Min());
        });

        Test("W24 forecast: a ball in the way bends the path, and both balls end where the real shot leaves them",()=>{
            GameSimulation Board(){var s=W24Plain();s.State.bonusUsed=true;s.Spawn(1,"normal",262,430);s.Spawn(1,"normal",120,200);return s;}
            var live=Board();var command=W24Aim(live,0,-150,520);
            var hit=live.State.balls[0];var far=live.State.balls[1];
            var forecast=W24Forecast(live,command);True(forecast.Valid);
            // The free-roll estimate knows nothing of the ball: it ends somewhere else.
            var free=StopPredictor.Predict(StopPredictor.Spawn(catalog.Ball("normal"),0,0,-150,520));
            True(Math.Abs(free.StopY-forecast.StopY)>30||Math.Abs(free.StopX-forecast.StopX)>30,"the forecast ignored the ball: "+forecast.StopX+","+forecast.StopY+" vs "+free.StopX+","+free.StopY);
            True(live.TryCommand(command,out _));var mover=live.State.balls.Last();Settle(live);
            Eq(mover.x,forecast.StopX);Eq(mover.y,forecast.StopY);
            // The ball that was hit is in the forecast, from where it stood to where it ends; the one far away is not.
            Eq(1,forecast.Others.Count);var other=forecast.Others[0];Eq(hit.id,other.Id);Eq(1,other.Owner);False(other.Dies);
            Eq(262f,other.FromX);Eq(430f,other.FromY);Eq(hit.x,other.ToX);Eq(hit.y,other.ToY);
            True(Math.Abs(far.x-120)<.01f&&Math.Abs(far.y-200)<.01f);
            // The path turns where the two balls meet: some point of it is a bounce, off the straight line up.
            True(forecast.PathX.Any(x=>Math.Abs(x-270)>3),"the path never left the straight line");
        });

        Test("W24 forecast: worked out in slices it is the same forecast",()=>{
            GameSimulation Board(){var s=W24Plain();s.State.bonusUsed=true;s.Spawn(1,"normal",250,420);s.Spawn(0,"normal",330,380);return s;}
            var whole=W24Forecast(Board(),W24Aim(Board(),10,-150,540));
            var live=Board();var sliced=ShotForecast.Begin(W24Sandbox(),W24Copy(live.State),W24Aim(live,10,-150,540));
            int calls=0;False(sliced.Finished);while(!sliced.Advance(7))calls++;True(calls>10,"only "+calls+" slices");
            Eq(whole.StopX,sliced.StopX);Eq(whole.StopY,sliced.StopY);Eq(whole.Steps,sliced.Steps);Eq(whole.PathX.Count,sliced.PathX.Count);Eq(whole.Others.Count,sliced.Others.Count);
            // Finished is final: more calls change nothing.
            True(sliced.Advance(50));Eq(whole.Steps,sliced.Steps);
        });

        Test("W24 forecast: a ball the shot destroys is marked - the launched Bomb, and the ball it kills - but not a ball that dies of the turn's end",()=>{
            var live=W24Plain();live.State.bonusUsed=true;
            var weak=live.Spawn(1,"normal",300,470);weak.hp=5;var strong=live.Spawn(1,"normal",215,455);
            // Burning with 5 HP left and far from everything: it dies when its owner's turn starts, not of this shot.
            var burning=live.Spawn(1,"normal",450,120);live.Abilities.ApplyFire(burning,0);burning.hp=5;
            var command=W24Aim(live,0,-100,BallDemoScript.PowerFor(853-480),"bomb");
            live.State.players[0].stock.Add(new StockEntry{id="bomb",remaining=1});
            var forecast=W24Forecast(live,command);True(forecast.Valid);True(forecast.MoverDies);
            True(Math.Abs(forecast.StopY-480)<25,"the Bomb's end "+forecast.StopY);
            var lost=forecast.Others.Single(o=>o.Id==weak.id);True(lost.Dies);
            var thrown=forecast.Others.Single(o=>o.Id==strong.id);False(thrown.Dies);True(Math.Abs(thrown.ToX-thrown.FromX)+Math.Abs(thrown.ToY-thrown.FromY)>ShotForecast.MovedBy);
            False(forecast.Others.Any(o=>o.Id==burning.id));
            // The real shot agrees on all three.
            True(live.TryCommand(command,out string why),why);Settle(live);
            True(weak.dead);False(strong.dead);Eq(strong.x,thrown.ToX);Eq(strong.y,thrown.ToY);True(burning.dead,"the burning ball was meant to die at its turn's start");
        });

        Test("W24 forecast: a ball played again from its owner's zone is forecast the same way; a shot the rules refuse gives no forecast",()=>{
            var live=W24Plain();live.State.bonusUsed=true;var parked=live.Spawn(0,"normal",200,840);live.Spawn(1,"normal",205,560);
            var command=W24Aim(live,0,-100,500,"normal",parked.id);
            var forecast=W24Forecast(live,command);True(forecast.Valid);Eq(parked.id,forecast.MoverId);Eq(200f,forecast.PathX[0]);Eq(840f,forecast.PathY[0]);Eq(1,forecast.Others.Count);
            True(live.TryCommand(command,out _));Settle(live);Eq(parked.x,forecast.StopX);Eq(parked.y,forecast.StopY);
            // Refused: too weak a pull, the other player's turn, a ball that is not in the deck.
            var s=W24Plain();s.State.bonusUsed=true;
            False(W24Forecast(s,W24Aim(s,0,-100,20)).Valid);
            var wrongTurn=W24Aim(s,0,-100,400);wrongTurn.owner=1;False(W24Forecast(s,wrongTurn).Valid);
            False(W24Forecast(s,W24Aim(s,0,-100,400,"tesla")).Valid);
            True(ShotForecast.Begin(null,null,null).Advance(10));False(ShotForecast.Begin(null,null,null).Valid);
            // A sandbox handed to a newer forecast: the older one ends without a result instead of mixing the two.
            var shared=W24Sandbox();var first=ShotForecast.Begin(shared,W24Copy(s.State),W24Aim(s,0,-100,400));True(first.Valid);
            var second=ShotForecast.Begin(shared,W24Copy(s.State),W24Aim(s,30,-100,400));
            True(first.Advance(10));False(first.Valid);while(!second.Advance(500)){}True(second.Valid);
        });

        Test("W24 aim arrow: it is cut where the ball first touches another ball or an obstacle",()=>{
            var straight=new[]{new AimPoint(270,850),new AimPoint(270,450)};
            var none=AimGuide.ClipAtBodies(straight,30,new List<StopObstacle>{new StopObstacle(400,600,30)},out bool touched);
            False(touched);True(ReferenceEquals(straight,none));
            // Head on: the arrow's tip is the ball's centre at the moment of contact, one sum of radii short of the body's centre.
            var cut=AimGuide.ClipAtBodies(straight,30,new List<StopObstacle>{new StopObstacle(270,600,32)},out touched);
            True(touched);Eq(2,cut.Length);Eq(270f,cut[1].x);Eq(662f,cut[1].y);
            // A glancing contact: the distance between the two centres at the tip is still the sum of the radii.
            var side=AimGuide.ClipAtBodies(straight,30,new List<StopObstacle>{new StopObstacle(310,600,32)},out touched);
            True(touched);True(Math.Abs(Math.Sqrt((side[1].x-310)*(side[1].x-310)+(side[1].y-600)*(side[1].y-600))-62)<.01,"contact distance");True(side[1].y>600);
            // Of two bodies on the way, the first one met.
            var two=AimGuide.ClipAtBodies(straight,30,new List<StopObstacle>{new StopObstacle(270,500,32),new StopObstacle(270,700,32)},out touched);
            Eq(762f,two[1].y);
            // A body the ball already overlaps at the start is not a contact; one behind it is not either.
            var from=AimGuide.ClipAtBodies(straight,30,new List<StopObstacle>{new StopObstacle(280,860,32)},out touched);False(touched);
            AimGuide.ClipAtBodies(straight,30,new List<StopObstacle>{new StopObstacle(270,950,32)},out touched);False(touched);
            // After a wall bounce: the second stretch is cut, the first is kept whole.
            var bounced=new[]{new AimPoint(270,850),new AimPoint(54,634),new AimPoint(254,434)};
            var second=AimGuide.ClipAtBodies(bounced,30,new List<StopObstacle>{new StopObstacle(154,534,32)},out touched);
            True(touched);Eq(3,second.Length);Eq(54f,second[1].x);True(second[2].x<154&&second[2].x>54);
            // Nothing to cut, nothing changed.
            True(ReferenceEquals(straight,AimGuide.ClipAtBodies(straight,30,null,out touched)));False(touched);
        });

        Test("W24 traps: bigger under the rule, and never one on another",()=>{
            var plain=new GameState();Eq(0f,plain.trapRadius);False(plain.trapsApart);
            var applied=new GameState();RosterBalance.Apply(applied);Eq(RosterBalance.TrapRadius,applied.trapRadius);Eq(RosterBalance.TrapsApart,applied.trapsApart);
            True(RosterBalance.TrapRadius>AbilityResolver.ReferenceTrapRadius);
            // Reference: 14, and a second trap goes down on top of the first.
            var old=W24Plain();var a0=old.Spawn(0,"embertrap",270,450);old.Abilities.OnStop(a0);a0.x=60;var b0=old.Spawn(0,"frosttrap",270,450);old.Abilities.OnStop(b0);
            var oldTraps=old.State.zones.Where(z=>!z.dead&&z.trap).ToArray();Eq(2,oldTraps.Length);Eq(14f,oldTraps[0].radius);Eq(oldTraps[0].x,oldTraps[1].x);Eq(oldTraps[0].y,oldTraps[1].y);
            // The rule: every kind of trap has the rule's radius...
            var s=W24Plain();s.State.trapRadius=22;s.State.trapsApart=true;
            string[] kinds={"embertrap","frosttrap","sporetrap","staticfield"};
            foreach(string kind in kinds){var layer=s.Spawn(0,kind,270,450);s.Abilities.OnStop(layer);layer.x=60;layer.y=60+Array.IndexOf(kinds,kind)*60;}
            var traps=s.State.zones.Where(z=>!z.dead&&z.trap).ToArray();Eq(4,traps.Length);True(traps.All(z=>z.radius==22f));
            // ...and no two of them overlap, with a clear gap between, though all four were laid on one spot.
            for(int i=0;i<traps.Length;i++)for(int j=i+1;j<traps.Length;j++)
            {
                double apart=Math.Sqrt((traps[i].x-traps[j].x)*(traps[i].x-traps[j].x)+(traps[i].y-traps[j].y)*(traps[i].y-traps[j].y));
                True(apart>=44+AbilityResolver.TrapGap-.01,"traps "+i+" and "+j+" are "+apart.ToString("0.0")+" apart");
            }
            // The first one lies where its ball stopped; the others close by.
            True(traps[0].x==270f&&traps[0].y==450f,"first trap at "+traps[0].x+","+traps[0].y);True(traps.All(z=>Math.Abs(z.x-270)<=106&&Math.Abs(z.y-450)<=106));
            // The other player's trap is in the way just the same.
            var enemy=s.Spawn(1,"sporetrap",270,450);s.Abilities.OnStop(enemy);
            var theirs=s.State.zones.Single(z=>!z.dead&&z.trap&&z.owner==1);
            True(traps.All(z=>Math.Sqrt((z.x-theirs.x)*(z.x-theirs.x)+(z.y-theirs.y)*(z.y-theirs.y))>=44+AbilityResolver.TrapGap-.01));
            // A bigger trap reaches further: an enemy 40 away from its centre sets it off, where the reference trap would not.
            foreach(float radius in new[]{0f,22f})
            {
                var t=W24Plain();t.State.trapRadius=radius;var layer=t.Spawn(0,"embertrap",270,450);t.Abilities.OnStop(layer);layer.x=60;
                var walker=t.Spawn(1,"normal",270,490);t.Abilities.OnStep(1f/120);
                Eq(radius>0,walker.fireStacks>0);
            }
            // The Vine's shoots keep their size, and a Magnet Mine's field is not a trap in the way.
            var v=W24Plain();v.State.trapRadius=22;v.State.trapsApart=true;var vine=v.Spawn(0,"web",270,450);v.Abilities.OnStop(vine);
            True(v.State.zones.Where(z=>z.kind=="web").All(z=>z.radius==14f));Eq(4,v.State.zones.Count(z=>z.kind=="web"));
            var m=W24Plain();m.State.trapRadius=22;m.State.trapsApart=true;var mine=m.Spawn(0,"gravitymine",270,450);m.Abilities.OnStop(mine);
            var onField=m.Spawn(0,"embertrap",270,450);mine.x=60;m.Abilities.OnStop(onField);
            var laid=m.State.zones.Single(z=>z.kind=="embertrap");True(laid.x==270f&&laid.y==450f,"trap on the mine field at "+laid.x+","+laid.y+" events "+string.Join(",",m.State.events.Select(e=>e.kind)));
        });

        Test("W24 traps: with no room near, the trap is not laid and the game says so",()=>{
            var s=W24Plain();s.State.trapRadius=22;s.State.trapsApart=true;
            // The floor round the spot is covered with traps already.
            for(float x=110;x<=430;x+=40)for(float y=290;y<=610;y+=40)s.State.zones.Add(new ZoneRuntime{id=s.State.nextId++,owner=1,kind="sporetrap",x=x,y=y,radius=22,turns=-1,trap=true});
            int before=s.State.zones.Count;
            var layer=s.Spawn(0,"embertrap",270,450);s.Abilities.OnStop(layer);
            Eq(before,s.State.zones.Count);True(s.State.events.Any(e=>e.kind=="PLACEMENT_BLOCKED"&&e.ballId==layer.id));
            // Without the rule it would have gone down anyway.
            s.State.trapsApart=false;s.Abilities.OnStop(layer);Eq(before+1,s.State.zones.Count);
        });

        Test("W24 frame clock: a frame locked to the display is handed to the simulation whole, and no time is lost",()=>{
            var clock=new FrameClock();
            // Not locked: the measured time as it is.
            Eq(.0123f,clock.Next(.0123f,0));Eq(0f,clock.Next(0,1f/240));Eq(0f,clock.Next(float.NaN,1f/240));
            // Locked at 240 Hz. The display shows a frame every period; the clock that measures it is
            // off by up to 15% of a period either way at every reading. Every frame is handed over
            // as one period, to within a hundredth...
            float period=1f/240;var random=new Random(7);double measured=0,given=0,lastStamp=0,worst=0;
            for(int i=1;i<=3000;i++)
            {
                double stamp=i*(double)period+(random.NextDouble()-.5)*.3*period;float delta=(float)(stamp-lastStamp);lastStamp=stamp;
                float step=clock.Next(delta,period);measured+=delta;given+=step;
                worst=Math.Max(worst,Math.Abs(step-period)/period);
                // ...and what was given never strays from what was measured by more than half a frame.
                True(Math.Abs(measured-given)<=period*.5,"drift "+(measured-given)*1000+" ms at frame "+i);
            }
            True(worst<.01,"a frame was "+(worst*100).ToString("0.0")+"% off its period");
            // The measured wobble itself was thirty times that.
            // Two clocks drifting apart (the display a fifth of a percent slower than its nominal rate):
            // every frame stays within a hundredth of a period - never a frame given twice - and the time adds up.
            var drifting=new FrameClock();measured=given=worst=0;
            for(int i=0;i<6000;i++){float delta=period*1.002f,step=drifting.Next(delta,period);measured+=delta;given+=step;worst=Math.Max(worst,Math.Abs(step-period)/period);}
            True(worst<.01,"drift made a frame "+(worst*100).ToString("0.0")+"% off");True(Math.Abs(measured-given)<=period*.5);
            // A missed refresh is two periods, not one and a bit.
            var late=new FrameClock();True(Math.Abs(late.Next(period*1.02f,period)-period)<period*.01f);True(Math.Abs(late.Next(period*1.97f,period)-2*period)<period*.01f);True(Math.Abs(late.Next(period*.99f,period)-period)<period*.01f);
            // A real pause passes through as it is and leaves nothing owed.
            var paused=new FrameClock();paused.Next(period*1.2f,period);Eq(.5f,paused.Next(.5f,period));Eq(period,paused.Next(period,period));
            // Frames that do not keep the period at all (twice as fast as claimed): the measured time, untouched.
            var wrong=new FrameClock();double sum=0;for(int i=0;i<200;i++)sum+=wrong.Next(period*.5f,period);
            True(Math.Abs(sum-200*period*.5)<period*4,"a wrong period was trusted: "+sum);
            // Which rhythm the frames keep: a display's refresh, or every second, third or fourth one.
            float[] desk={240,60};
            Eq(1f/240,FrameClock.LockedPeriod(239.2f,desk));Eq(1f/60,FrameClock.LockedPeriod(60.4f,desk));
            Eq(2f/240,FrameClock.LockedPeriod(120.5f,desk));Eq(3f/240,FrameClock.LockedPeriod(80f,desk));
            Eq(0f,FrameClock.LockedPeriod(97f,desk));Eq(0f,FrameClock.LockedPeriod(500f,desk));Eq(0f,FrameClock.LockedPeriod(60,null));Eq(0f,FrameClock.LockedPeriod(0,desk));
            Eq(1f/144,FrameClock.LockedPeriod(144.1f,new float[]{144}));
        });
    }
}
