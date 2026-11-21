using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using CoreClash.Core;
using CoreClash.Presentation;

// CC-001 W24 shows on the ball cards. A show is a scripted situation played by a private copy
// of the real rules. These tests run every show to its end and require that the power the card
// talks about really happens in it, with the numbers the card prints.
public static partial class Program
{
    static BallDemoPlayer W24RunShow(CoreClash.Data.Catalog c,string id)
    {
        var player=new BallDemoPlayer(c,BallDemos.For(id));
        int guard=0;while(!player.Finished&&guard++<120*45)player.Advance(BallDemoPlayer.StepSeconds);
        return player;
    }
    static BallRuntime W24Ball(BallDemoPlayer player,int owner,string type,bool alive=true)
        =>player.Simulation.State.balls.FirstOrDefault(b=>b.owner==owner&&b.type==type&&b.dead!=alive);

    static void W24BallDemoTests()
    {
        Test("W24 shows: every active ball has one, it ends in reasonable time and its power really happens",()=>{
            var c=W22Catalog(out var data);
            True(new HashSet<string>(BallDemos.Ids).SetEquals(data.active),"shows are not exactly the active roster");
            foreach(string id in data.active)
            {
                var script=BallDemos.For(id);
                True(script.Proof.Length>0,"no proof event named: "+id);
                True(script.Bottom-script.Top>=300&&script.Bottom-script.Top<=420&&script.Top>=150&&script.Bottom<=700,"filmed window is off: "+id);
                // The featured ball is on stage at the start or is launched in the show.
                True(script.Pieces.Any(p=>p.Type==id)||script.Steps.Any(s=>s.Kind==DemoStepKind.Launch&&s.Type==id),"the ball itself never appears: "+id);
                foreach(var step in script.Steps.Where(s=>s.Kind==DemoStepKind.Launch))True(step.Power>=60&&step.Power<=590&&(step.Owner==0||step.Owner==1),"launch outside the rules: "+id);
                var player=W24RunShow(c,id);
                True(player.Finished,"show does not end: "+id);
                True(player.Seen.Contains(script.Proof),"the power is not shown ("+script.Proof+"): "+id);
                True(player.Elapsed>=2.5f&&player.Elapsed<=14f,"show length "+player.Elapsed.ToString("0.0")+" s: "+id);
                Eq(MatchPhase.Aiming==player.Simulation.State.phase||MatchPhase.Moving==player.Simulation.State.phase,true);
            }
            True(BallDemos.For(null)==null&&BallDemos.For("ram")==null);
        });
        Test("W24 shows: what happens in them is what the cards say",()=>{
            var c=W22Catalog(out _);
            // Bomb: gone after the blast; enemies took 10-15, and so did your own ball.
            var bomb=W24RunShow(c,"bomb");
            True(W24Ball(bomb,0,"bomb")==null);
            foreach(var ball in bomb.Simulation.State.balls.Where(b=>b.type=="normal"))True(ball.hp==15||ball.hp==20,"bomb damage "+(30-ball.hp));
            // Mine: armed first, 10 to the enemy that touched it.
            var mine=W24RunShow(c,"mine");True(mine.Seen.Contains("ARMED"));Eq(20,W24Ball(mine,1,"normal").hp);
            // Time Bomb: both enemies lose exactly 10, and only on the bomb owner's second turn after the stop.
            var time=W24RunShow(c,"timebomb");True(time.Seen.Contains("FUSE"));True(time.Simulation.State.balls.Where(b=>b.owner==1).All(b=>b.hp==20));Eq(5,time.Simulation.State.turnNumber);
            // Fire: the enemy burns; Furnace: both enemies in its field burn.
            True(W24Ball(W24RunShow(c,"fire"),1,"normal").fireStacks>=1);
            True(W24RunShow(c,"furnace").Simulation.State.balls.Where(b=>b.owner==1).All(b=>b.fireStacks>=1));
            // Bonfire: dead, enemies burn, the hurt ally got 5 HP back.
            var bonfire=W24RunShow(c,"bonfire");True(W24Ball(bonfire,0,"bonfire")==null);Eq(20,W24Ball(bonfire,0,"normal").hp);True(bonfire.Simulation.State.balls.Where(b=>b.owner==1).All(b=>b.fireStacks>=1));
            // Frost: the touched ball is frozen, its neighbours chilled once.
            var ice=W24RunShow(c,"ice");Eq(1,ice.Simulation.State.balls.Count(b=>b.owner==1&&b.frozen>0));Eq(2,ice.Simulation.State.balls.Count(b=>b.owner==1&&b.iceStacks==1));
            // Venom: both steps, poison first and the extra 5 on the second touch.
            var venom=W24RunShow(c,"venom");True(venom.Seen.Contains("TOXIN")&&venom.Seen.Contains("VENOM"));
            // Plague Leech: the drain happens on its owner's turn.
            True(W24RunShow(c,"plagueleech").Seen.Contains("LINK"));
            // Gravity Mine and Mine are gone after their blast; Webber leaves the enemy stuck.
            True(W24Ball(W24RunShow(c,"gravitymine"),0,"gravitymine")==null);
            True(W24Ball(W24RunShow(c,"web"),1,"normal").rooted);
            // Pulse: every other ball ends far from where it stood, nobody is hurt.
            var pulse=W24RunShow(c,"pulse");True(pulse.Simulation.State.balls.Where(b=>b.type=="normal").All(b=>b.hp==30));
            True(pulse.Simulation.State.balls.Where(b=>b.type=="normal").All(b=>Math.Abs(b.y-480)>120||Math.Abs(b.x-270)>120),"Pulse pushed nothing away");
            // Swap: the two balls traded places.
            var swap=W24RunShow(c,"timeshift");True(Math.Abs(W24Ball(swap,1,"normal").y-490)<3&&Math.Abs(W24Ball(swap,0,"timeshift").x-320)<3);
            // Portal: two portals stay open and a ball went through.
            Eq(2,W24RunShow(c,"gatekeeper").Simulation.State.zones.Count(z=>!z.dead&&z.kind=="portal"));
            // Pinballer: the bumper stands by the wall.
            Eq(1,W24RunShow(c,"pinballer").Simulation.State.structures.Count(g=>!g.dead&&g.kind=="bumper"));
            // Vortex Medic survives its own show and the hurt ball got 5 HP for the one enemy pulled.
            var medic=W24RunShow(c,"vortexmedic");True(W24Ball(medic,0,"vortexmedic")!=null);True(medic.Simulation.State.balls.Any(b=>b.owner==0&&b.type=="normal"&&b.hp==15));
            // Ward: no fire or poison left, a shield of 5 on each of your balls.
            True(W24RunShow(c,"ward").Simulation.State.balls.All(b=>b.shield==5&&b.fireStacks==0&&b.toxinTurns==0));
            // Halo: the collision that hurt the attacker did not hurt Halo.
            var halo=W24RunShow(c,"halo");Eq(25,W24Ball(halo,0,"halo").hp);True(W24Ball(halo,1,"normal").hp<30);
            // Cascade: the first one is dead and a 10 HP one stands in its place.
            var cascade=W24RunShow(c,"cascade");True(W24Ball(cascade,0,"cascade",false)!=null);Eq(10,W24Ball(cascade,0,"cascade").hp);
            // Deathcast: Bonfire's power went off and Bonfire is still alive.
            var agony=W24RunShow(c,"agony");True(W24Ball(agony,0,"bonfire")!=null);True(agony.Simulation.State.balls.Where(b=>b.owner==1).All(b=>b.hp<=20&&b.fireStacks>=1),"Deathcast: enemies were not hit by Bonfire's power");
            // Singularity: a black hole is open and has swallowed balls.
            var hole=W24RunShow(c,"singularity");Eq(1,hole.Simulation.State.zones.Count(z=>!z.dead&&z.kind=="blackHole"));False(hole.Simulation.State.balls.Any(b=>b.owner==1&&!b.dead));
            // Reviver: paid 10, the fallen Fire is back with 15.
            var reviver=W24RunShow(c,"reclaimer");Eq(20,W24Ball(reviver,0,"reclaimer").hp);Eq(15,W24Ball(reviver,0,"fire").hp);
            // Traitor: the Furnace is yours, the Traitor is the opponent's Standard.
            var traitor=W24RunShow(c,"traitor");True(W24Ball(traitor,0,"furnace")!=null&&W24Ball(traitor,1,"normal")!=null&&W24Ball(traitor,0,"traitor")==null);
            // Rewind: saved, hit, and back to full HP near the saved spot.
            var rewind=W24RunShow(c,"chronomancer");True(rewind.Seen.Contains("SAVE"));var back=W24Ball(rewind,0,"chronomancer");Eq(25,back.hp);True(Math.Abs(back.x-270)<70&&Math.Abs(back.y-480)<70);
            // Echo: the Ward that was already standing there worked again.
            var echo=W24RunShow(c,"echo");True(echo.Seen.Contains("ECHO"));True(echo.Simulation.State.balls.All(b=>b.shield==5&&b.fireStacks==0));
        });
        Test("W24 shows: the same show always plays the same way and never touches another simulation",()=>{
            var c=W22Catalog(out var data);
            var live=new GameSimulation(c,c.AllDecks.First(),c.AllDecks.First());
            string before=System.Text.Json.JsonSerializer.Serialize(live.State,new System.Text.Json.JsonSerializerOptions{IncludeFields=true});
            foreach(string id in data.active)
            {
                var a=W24RunShow(c,id);var b=W24RunShow(c,id);
                string Positions(BallDemoPlayer p)=>string.Join("|",p.Simulation.State.balls.Select(x=>x.type+x.owner+x.dead+x.hp+"@"+x.x.ToString("0.00")+","+x.y.ToString("0.00")));
                Eq(Positions(a),Positions(b));Eq(a.Elapsed,b.Elapsed);
                False(ReferenceEquals(a.Simulation,live));
            }
            Eq(before,System.Text.Json.JsonSerializer.Serialize(live.State,new System.Text.Json.JsonSerializerOptions{IncludeFields=true}));
            // PowerFor is the measured roll: a free launch stops where the script says, within a few units.
            foreach(float target in new float[]{420,470,520})
            {
                var s=Sim();s.TryCommand(new PlayerCommand{owner=0,turnNumber=s.State.turnNumber,kind=CommandKind.Spawn,ballType="normal",dx=0,dy=-1,power=BallDemoScript.PowerFor(853-target)},out _);
                int steps=0;while(s.State.phase==MatchPhase.Moving&&steps++<4000)s.Step(1f/120);
                True(Math.Abs(s.State.balls[0].y-target)<6,"roll calibration is off at "+target+": "+s.State.balls[0].y);
            }
        });
        Test("W24 source: shows are pure rules code, drawn by the board's own renderer with their own effect state",()=>{
            string dir=Path.Combine(projectRoot,"Assets/CoreClash/Presentation");
            string Code(string f)=>Regex.Replace(File.ReadAllText(Path.Combine(dir,f)),@"//[^\n]*","");
            string demo=Code("BallDemo.cs"),view=Code("BallGuideView.cs"),board=Code("BoardView.cs"),fx=Code("Fx.cs"),app=Code("CoreClashApp.cs");
            False(demo.Contains("UnityEngine"));
            True(demo.Contains("new GameSimulation(catalog,deck,deck)")&&demo.Contains("Simulation.TryCommand(command,out _)"),"a show does not play through its own simulation and ordinary commands");
            True(view.Contains("new BallDemoPlayer(Catalog,script)")&&view.Contains("BoardView.RenderStage(rect,demo.Simulation,demoFeedback,demoFx"));
            True(board.Contains("effects.Swap();")&&Regex.Matches(board,@"effects\.Swap\(\);").Count==2,"the show's effects are not swapped in and back out");
            True(fx.Contains("public sealed class Stage"));
            True(app.Contains("demo=null;"),"closing the card does not drop the show");
            // The show never reaches the live match: the view's only simulation calls go to the show's own player.
            Eq(0,Regex.Matches(view,@"\bSimulation\.(TryCommand|Step|Spawn|Kill|Damage)\(").Count);
        });
    }
}
