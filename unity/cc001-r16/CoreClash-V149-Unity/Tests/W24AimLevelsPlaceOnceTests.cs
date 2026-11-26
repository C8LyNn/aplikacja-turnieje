using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Physics;
using CoreClash.Presentation;
using CoreClash.SelfPlay;

// CC-001 W24, the owner's notes of 2026-11-25 after playing with the full forecast:
//   "it probably helps too much - I want five levels of it, from nothing up to this detailed"
//       -> ForecastDetail (how far a forecast is played) and what it tells about its bounces
//   "a ball must not be able to generate things every turn ... only the first time"
//       -> match rule placeOnce
// and a fault found on the way: a simulation handed another state kept the contacts of the shot it
// had tried before, so powers that work on touch were lost in about half of the shots tried.
public static partial class Program
{
    static void W24AimLevelsPlaceOnceTests()
    {
        Test("W24 forecast detail: to the first touch - it ends against the wall it meets first, and plays no further",()=>{
            var live=W24Plain();live.State.bonusUsed=true;live.Spawn(1,"normal",400,300);
            var command=W24Aim(live,-120,-60,560);
            var whole=W24Forecast(live,command);
            var first=ShotForecast.Begin(W24Sandbox(),W24Copy(live.State),command,ForecastDetail.FirstTouch);while(!first.Advance(50)){}
            True(first.Valid&&first.Finished&&first.EndsAtContact);Eq(ForecastDetail.FirstTouch,first.Detail);
            True(first.Steps<whole.Steps,"it played the whole shot: "+first.Steps+" of "+whole.Steps);
            // The last point is the contact: the ball stands against the left wall there.
            int last=first.PathX.Count-1;Eq(last,first.FirstTouchAt);Eq(-1,first.FirstBallAt);Eq(1,first.Bounces.Count);Eq(last,first.Bounces[0]);
            True(Math.Abs(first.PathX[last]-(ZoneResolver.Left+first.Radius))<.6f,"not against the wall: x "+first.PathX[last]);
            Eq(first.PathX[last],first.StopX);Eq(first.PathY[last],first.StopY);Eq(0,first.Others.Count);
            // The whole forecast knows the same first touch, at the same place.
            False(whole.EndsAtContact);True(whole.FirstTouchAt>0);
            True(Math.Abs(whole.PathX[whole.FirstTouchAt]-first.PathX[last])<.01f&&Math.Abs(whole.PathY[whole.FirstTouchAt]-first.PathY[last])<.01f);
        });

        Test("W24 forecast detail: to the first ball - it bounces off the wall on the way and ends touching the ball",()=>{
            // Off the left wall, then into a ball standing on the way back.
            // Where the shot goes on an empty board: the ball is stood on its way a little after the wall.
            var empty=W24Plain();empty.State.bonusUsed=true;var free=W24Forecast(empty,W24Aim(empty,-200,-180,560));
            True(free.FirstTouchAt>0&&free.PathX.Count>free.FirstTouchAt+5,"the free shot never came off the wall");
            int ahead=free.FirstTouchAt+5;
            var live=W24Plain();live.State.bonusUsed=true;var target=live.Spawn(1,"normal",free.PathX[ahead],free.PathY[ahead]);
            var command=W24Aim(live,-200,-180,560);
            var toBall=ShotForecast.Begin(W24Sandbox(),W24Copy(live.State),command,ForecastDetail.FirstBall);while(!toBall.Advance(40)){}
            True(toBall.Valid&&toBall.EndsAtContact,"it never reached the ball");
            int last=toBall.PathX.Count-1;Eq(last,toBall.FirstBallAt);
            True(toBall.FirstTouchAt>0&&toBall.FirstTouchAt<last,"no wall bounce before the ball");
            True(toBall.Bounces.Count>=2&&toBall.Bounces[0]==toBall.FirstTouchAt&&toBall.Bounces[toBall.Bounces.Count-1]==last);
            // At the contact the two centres are the two radii apart: the ball's outline there touches the other ball.
            double apart=Math.Sqrt((toBall.StopX-target.x)*(toBall.StopX-target.x)+(toBall.StopY-target.y)*(toBall.StopY-target.y));
            True(Math.Abs(apart-(toBall.Radius+target.radius))<1.5,"centres "+apart.ToString("0.00")+" apart at the contact");
            // To the first touch it would have ended at the wall; the whole forecast goes on past the ball.
            var toTouch=ShotForecast.Begin(W24Sandbox(),W24Copy(live.State),command,ForecastDetail.FirstTouch);while(!toTouch.Advance(40)){}
            True(toTouch.Steps<toBall.Steps);Eq(-1,toTouch.FirstBallAt);
            var whole=W24Forecast(live,command);False(whole.EndsAtContact);True(whole.Steps>toBall.Steps);Eq(1,whole.Others.Count(o=>o.Id==target.id));
            True(whole.FirstBallAt>0&&Math.Abs(whole.PathX[whole.FirstBallAt]-toBall.StopX)<.01f);
        });

        Test("W24 forecast detail: a shot that touches nothing is played to its end on every level",()=>{
            var live=W24Plain();live.State.bonusUsed=true;var command=W24Aim(live,0,-100,300);
            var whole=W24Forecast(live,command);
            foreach(ForecastDetail detail in Enum.GetValues(typeof(ForecastDetail)))
            {
                var f=ShotForecast.Begin(W24Sandbox(),W24Copy(live.State),command,detail);while(!f.Advance(64)){}
                True(f.Valid);False(f.EndsAtContact);Eq(-1,f.FirstTouchAt);Eq(-1,f.FirstBallAt);Eq(0,f.Bounces.Count);
                Eq(whole.StopX,f.StopX);Eq(whole.StopY,f.StopY);
            }
        });

        Test("W24 a simulation handed another state remembers no contacts: a power that works on touch works in every shot tried in the same copy",()=>{
            var live=W24Plain();live.State.bonusUsed=true;live.Spawn(1,"normal",270,500);
            var sandbox=W24Sandbox();
            // The same shot three times over, as the computer and the aim forecast try shots: one simulation, a fresh copy each time.
            for(int run=0;run<3;run++)
            {
                var copy=W24Copy(live.State);sandbox.State=copy;
                True(sandbox.TryCommand(new PlayerCommand{owner=0,turnNumber=copy.turnNumber,kind=CommandKind.Spawn,ballType="fire",dx=0,dy=-150,power=520},out string why),why);
                for(int i=0;i<4000&&copy.phase==MatchPhase.Moving;i++)sandbox.Step(1f/120);
                var enemy=copy.balls.First(b=>b.owner==1);
                True(enemy.fireStacks>0||enemy.dead,"run "+run+": the Flame touched the ball and did not set it alight");
                True(copy.events.Count>0);
            }
            // And the forecast made in a simulation that has been used before is still the real shot.
            var command=W24Aim(live,0,-150,520,"fire");
            var shared=W24Sandbox();ShotForecast last=null;
            for(int run=0;run<3;run++){last=ShotForecast.Begin(shared,W24Copy(live.State),command);while(!last.Advance(200)){}}
            True(live.TryCommand(command,out _));var mover=live.State.balls.Last();Settle(live);
            Eq(mover.x,last.StopX);Eq(mover.y,last.StopY);
        });

        Test("W24 place once: off by default; under the rule a ball lays its trap at its first stop and never again",()=>{
            False(new GameState().placeOnce);var applied=new GameState();RosterBalance.Apply(applied);Eq(RosterBalance.PlaceOnce,applied.placeOnce);True(RosterBalance.PlaceOnce);
            // Reference: a trap at every stop.
            var old=W24Plain();old.State.trapsApart=true;var a0=old.Spawn(0,"sporetrap",270,450);
            old.Abilities.OnStop(a0);a0.x=120;a0.y=300;old.Abilities.OnStop(a0);a0.x=420;a0.y=600;old.Abilities.OnStop(a0);
            Eq(3,old.State.zones.Count(z=>!z.dead&&z.kind=="sporetrap"));
            // The rule, for every ball that lays a trap.
            foreach(string kind in new[]{"embertrap","frosttrap","sporetrap","staticfield"})
            {
                var s=W24Plain();s.State.placeOnce=true;s.State.trapsApart=true;var layer=s.Spawn(0,kind,270,450);False(layer.placed);
                s.Abilities.OnStop(layer);True(layer.placed,kind);
                layer.x=120;layer.y=300;s.Abilities.OnStop(layer);layer.x=420;layer.y=600;s.Abilities.OnStop(layer);
                var traps=s.State.zones.Where(z=>!z.dead&&z.trap).ToArray();Eq(1,traps.Length);Eq(270f,traps[0].x);Eq(450f,traps[0].y);
                // Another ball of the same kind has its own trap.
                var second=s.Spawn(0,kind,120,300);s.Abilities.OnStop(second);Eq(2,s.State.zones.Count(z=>!z.dead&&z.trap));
                // The trap went off: the ball that laid it still lays no new one.
                foreach(var z in s.State.zones)z.dead=true;s.Abilities.OnStop(layer);Eq(0,s.State.zones.Count(z=>!z.dead&&z.trap));
            }
        });

        Test("W24 place once: the Vine's shoots, the Magnet Mine's field, the Blizzard and the Poison Pool are made once too",()=>{
            var s=W24Plain();s.State.placeOnce=true;
            var vine=s.Spawn(0,"web",270,450);s.Abilities.OnStop(vine);Eq(4,s.State.zones.Count(z=>!z.dead&&z.kind=="web"));
            vine.x=150;vine.y=250;s.Abilities.OnStop(vine);Eq(4,s.State.zones.Count(z=>!z.dead&&z.kind=="web"));
            True(s.State.zones.Where(z=>z.kind=="web").All(z=>Math.Abs(z.x-270)<=56&&Math.Abs(z.y-450)<=56));
            // Reference: four more at every stop.
            var old=W24Plain();var v0=old.Spawn(0,"web",270,450);old.Abilities.OnStop(v0);v0.x=150;v0.y=250;old.Abilities.OnStop(v0);Eq(8,old.State.zones.Count(z=>!z.dead&&z.kind=="web"));
            // The Mine's field stays where the mine first stopped, wherever the mine is pushed afterwards.
            var m=W24Plain();m.State.placeOnce=true;var mine=m.Spawn(0,"gravitymine",270,450);m.Abilities.OnStop(mine);
            mine.x=120;mine.y=250;m.Abilities.OnStop(mine);
            var field=m.State.zones.Single(z=>!z.dead&&z.kind=="gravitymine");Eq(270f,field.x);Eq(450f,field.y);
            var m0=W24Plain();var mine0=m0.Spawn(0,"gravitymine",270,450);m0.Abilities.OnStop(mine0);mine0.x=120;mine0.y=250;m0.Abilities.OnStop(mine0);
            Eq(120f,m0.State.zones.Single(z=>!z.dead&&z.kind=="gravitymine").x);
            // One blizzard, one pool.
            foreach(var pair in new[]{("blizzardcore","ice"),("blightpool","blight")})
            {
                var f=W24Plain();f.State.placeOnce=true;var maker=f.Spawn(0,pair.Item1,270,450);f.Abilities.OnStop(maker);
                maker.x=120;maker.y=250;f.Abilities.OnStop(maker);
                var fields=f.State.zones.Where(z=>!z.dead&&z.kind==pair.Item2).ToArray();Eq(1,fields.Length);Eq(270f,fields[0].x);
                var f0=W24Plain();var maker0=f0.Spawn(0,pair.Item1,270,450);f0.Abilities.OnStop(maker0);maker0.x=120;maker0.y=250;f0.Abilities.OnStop(maker0);
                Eq(2,f0.State.zones.Count(z=>!z.dead&&z.kind==pair.Item2));
            }
        });

        Test("W24 place once: a stop at which nothing could be put down does not use the one time up",()=>{
            // Switched off at its first stop: the trap comes at the next one.
            var s=W24Plain();s.State.placeOnce=true;var layer=s.Spawn(0,"embertrap",270,450);s.Abilities.Jam(layer);
            s.Abilities.OnStop(layer);Eq(0,s.State.zones.Count(z=>z.trap));False(layer.placed);
            layer.jammed=0;s.Abilities.OnStop(layer);Eq(1,s.State.zones.Count(z=>!z.dead&&z.trap));True(layer.placed);
            // No room at its first stop (the floor round it is full of traps): it lays its trap where it stops next.
            var full=W24Plain();full.State.placeOnce=true;full.State.trapRadius=22;full.State.trapsApart=true;
            for(float x=110;x<=430;x+=40)for(float y=290;y<=610;y+=40)full.State.zones.Add(new ZoneRuntime{id=full.State.nextId++,owner=1,kind="sporetrap",x=x,y=y,radius=22,turns=-1,trap=true});
            var late=full.Spawn(0,"frosttrap",270,450);full.Abilities.OnStop(late);False(late.placed);Eq(0,full.State.zones.Count(z=>z.kind=="frosttrap"));
            late.x=270;late.y=760;full.Abilities.OnStop(late);True(late.placed);Eq(1,full.State.zones.Count(z=>z.kind=="frosttrap"));
            // The cards say it.
            foreach(string id in new[]{"embertrap","frosttrap","sporetrap","staticfield","web","gravitymine","blizzardcore","blightpool"})
                True(BallGuide.For(id).TipPl.Contains("raz")||BallGuide.For(id).TipPl.ToLowerInvariant().Contains("jedn"),id+": "+BallGuide.For(id).TipPl);
        });
    }
}
