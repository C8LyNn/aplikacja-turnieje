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
            // A show plays with balls of the size the game shows (the app's ball-size rule), not the reference size.
            var sized=new BallDemoPlayer(c,BallDemos.For("fire"));Eq(1.5f,BallDemoPlayer.DemoBallScale);Eq(1.5f,sized.Simulation.State.ballScale);
            True(sized.Simulation.State.balls.All(b=>Math.Abs(b.radius-c.Ball(b.type).radius*1.5f)<.01f));
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
            IEnumerable<BallRuntime> Enemies(BallDemoPlayer p)=>p.Simulation.State.balls.Where(b=>b.owner==1&&!b.dead);
            float Far(BallRuntime b,float x,float y)=>(float)Math.Sqrt((b.x-x)*(b.x-x)+(b.y-y)*(b.y-y));
            // --- Ice. Frost: the touched ball is frozen, its neighbours chilled once.
            var ice=W24RunShow(c,"ice");Eq(1,ice.Simulation.State.balls.Count(b=>b.owner==1&&b.frozen>0));Eq(2,ice.Simulation.State.balls.Count(b=>b.owner==1&&b.iceStacks==1));
            // Blizzard: both enemies standing in it are chilled turn after turn.
            True(Enemies(W24RunShow(c,"blizzardcore")).All(b=>b.iceStacks>=2||b.frozen>0),"Blizzard did not chill the enemies in it twice");
            // Ice trap: the enemy that rolled over it is frozen on the spot and the trap is gone.
            var iceTrap=W24RunShow(c,"frosttrap");True(AbilityResolver.DeepFrozen(W24Ball(iceTrap,1,"normal")),"the ice trap did not freeze");Eq(0,W24Ball(iceTrap,1,"normal").iceStacks);False(iceTrap.Simulation.State.zones.Any(z=>!z.dead&&z.kind=="frosttrap"));
            // Shatterer: the frozen ball loses 15 HP to the broken ice (and a little to the hit), and is frozen no more.
            var shatter=W24RunShow(c,"shatterer");True(W24Ball(shatter,1,"normal").hp<=15&&W24Ball(shatter,1,"normal").iceStacks==0&&W24Ball(shatter,1,"normal").frozen<=0,"shatter: hp "+W24Ball(shatter,1,"normal").hp);
            // Snowman: dug in with a shield; the ball that hit it is chilled.
            var snowman=W24RunShow(c,"frostguard");True(W24Ball(snowman,0,"frostguard").frostguardAnchored);Eq(1,W24Ball(snowman,1,"normal").iceStacks);True(snowman.Seen.Contains("SHIELD"));
            // --- Fire. Flame: the enemy burns; Campfire: both enemies in its field burn.
            True(W24Ball(W24RunShow(c,"fire"),1,"normal").fireStacks>=1);
            True(Enemies(W24RunShow(c,"furnace")).All(b=>b.fireStacks>=1));
            // Fire trap: the enemy that rolled over it burns.
            True(W24Ball(W24RunShow(c,"embertrap"),1,"normal").fireStacks>=1);
            // Bomb: gone after the blast; enemies took 10-15, and so did your own ball.
            var bomb=W24RunShow(c,"bomb");True(W24Ball(bomb,0,"bomb")==null);
            foreach(var ball in bomb.Simulation.State.balls.Where(b=>b.type=="normal"))True(ball.hp==15||ball.hp==20,"bomb damage "+(30-ball.hp));
            // Volcano: it is still there, both enemies next to it burn and have already lost 5 HP.
            var volcano=W24RunShow(c,"firebrand");True(W24Ball(volcano,0,"firebrand")!=null);True(Enemies(volcano).All(b=>b.fireStacks==1&&b.hp==25),"Volcano: "+string.Join(",",Enemies(volcano).Select(b=>b.fireStacks+"/"+b.hp)));
            // --- Poison. Venom: both steps, poison first and the extra 5 on the second touch.
            var venom=W24RunShow(c,"venom");True(venom.Seen.Contains("TOXIN")&&venom.Seen.Contains("VENOM"));
            True(Enemies(W24RunShow(c,"blightpool")).All(b=>b.toxinTurns>0));
            True(W24Ball(W24RunShow(c,"sporetrap"),1,"normal").toxinTurns>0);
            // Mushroom: dead, and both the ball that killed it and the one standing by are poisoned.
            var mushroom=W24RunShow(c,"plagueburst");True(W24Ball(mushroom,0,"plagueburst")==null);Eq(2,Enemies(mushroom).Count(b=>b.toxinTurns>0));
            // Leech: the drain happens on its owner's turn.
            var leech=W24RunShow(c,"plagueleech");True(leech.Seen.Contains("LINK")&&leech.Seen.Contains("DRAIN"));True(W24Ball(leech,1,"normal").toxinTurns>0,"the Leech's target is not poisoned");
            // It came in with 15 HP and fed twice; its target lost only the poison's 5 HP a turn.
            Eq(25,W24Ball(leech,0,"plagueleech").hp);Eq(20,W24Ball(leech,1,"normal").hp);
            // --- Magnetism. Magnet: every other ball ends closer to where the Magnet stopped.
            var magnet=W24RunShow(c,"magnet");
            foreach(var ball in magnet.Simulation.State.balls.Where(b=>b.type=="normal"))True(Far(ball,270,480)<75&&ball.hp==30,"Magnet did not gather a ball: "+Far(ball,270,480).ToString("0")+" hp "+ball.hp);
            Eq(30,W24Ball(magnet,0,"magnet").hp);
            // Pulse: every other ball ends far from where it stood, nobody is hurt.
            var pulse=W24RunShow(c,"pulse");True(pulse.Simulation.State.balls.Where(b=>b.type=="normal").All(b=>b.hp==30));
            True(pulse.Simulation.State.balls.Where(b=>b.type=="normal").All(b=>Math.Abs(b.y-480)>120||Math.Abs(b.x-270)>120),"Pulse pushed nothing away");
            // Compass: it stopped, went again by itself and hit the enemy.
            var compass=W24RunShow(c,"fluxmine");True(W24Ball(compass,1,"normal").hp<30,"the Compass did not reach the enemy");Eq(2,W24Ball(compass,0,"fluxmine").stopCount);
            // Magnet Mine is gone after its blast.
            True(W24Ball(W24RunShow(c,"gravitymine"),0,"gravitymine")==null);
            // Anchor: hit as hard as a ball can be hit, it ends close to where it stood.
            var anchor=W24RunShow(c,"anchor");True(Far(W24Ball(anchor,0,"anchor"),270,470)<45,"the Anchor was moved "+Far(W24Ball(anchor,0,"anchor"),270,470).ToString("0"));Eq(3,W24Ball(anchor,0,"anchor").anchorStacks);
            // --- Electricity. Lightning: the touched enemy and the one next to it both took the bolt.
            var bolt=W24RunShow(c,"tesla");True(Enemies(bolt).All(b=>b.hp<=25),"Lightning: "+string.Join(",",Enemies(bolt).Select(b=>b.hp)));True(Enemies(bolt).Any(b=>b.hp==25));
            // Storm: one bolt at the start of its owner's turn.
            Eq(25,W24Ball(W24RunShow(c,"chainshock"),1,"normal").hp);
            // Battery: its one charge went into both enemies next to it; a turn later it has one again.
            var battery=W24RunShow(c,"capacitor");True(battery.Seen.Contains("CHARGE"));Eq(1,W24Ball(battery,0,"capacitor").charge);
            True(Enemies(battery).All(b=>b.hp==25),"Battery: "+string.Join(",",Enemies(battery).Select(b=>b.hp)));
            // Shock trap: the Bomb that rolled over it lost 5 HP and its power: it stopped and did not explode.
            var shock=W24RunShow(c,"staticfield");True(shock.Seen.Contains("TRAP_TRIGGER"));False(shock.Seen.Contains("EXPLOSION"));True(W24Ball(shock,1,"bomb").hp<=25);True(W24Ball(shock,1,"bomb").jammed>0);
            // Switch: the enemy Bomb is switched off.
            True(W24Ball(W24RunShow(c,"jammer"),1,"bomb").jammed>0);
            // --- Plants. The Vine leaves the enemy stuck.
            True(W24Ball(W24RunShow(c,"web"),1,"normal").rooted);
            // Cactus: the ball that hit it was stung once.
            var cactus=W24RunShow(c,"thornback");True(W24Ball(cactus,1,"normal").hp<=25);
            // Flower: both hurt balls next to it got 5 HP back.
            var flower=W24RunShow(c,"elderbloom");True(flower.Simulation.State.balls.Any(b=>b.type=="normal"&&b.hp==15)&&flower.Simulation.State.balls.Any(b=>b.type=="normal"&&b.hp==20),"Flower: "+string.Join(",",flower.Simulation.State.balls.Select(b=>b.type+b.hp)));
            // Sprout: grew twice in its two turns: a bigger body, the same HP gauge as every ball.
            var sprout=W24Ball(W24RunShow(c,"cultivator"),0,"cultivator");Eq(2,sprout.growthStage);Eq(30,sprout.hp);Eq(30,sprout.maxHp);True(sprout.radius>c.Ball("cultivator").radius*1.2f);
            // Acorn: the first one is dead and a 10 HP one stands in its place.
            var acorn=W24RunShow(c,"cascade");True(W24Ball(acorn,0,"cascade",false)!=null);Eq(10,W24Ball(acorn,0,"cascade").hp);Eq(30,W24Ball(acorn,0,"cascade").maxHp);
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
