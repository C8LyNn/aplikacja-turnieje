using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Input;
using CoreClash.Presentation;

// CC-001 A10 R17-W13: real simulation launch vector/first-physics-tick
// acceptance. Distinct from W11 gesture-only and W12 AimGuide-only tests.
// No Unity graphics/network stubs; all commands use GameSimulation.TryCommand.
internal static class A10W13SpawnPhysicsContract
{
    private static int passed, failed;
    private static Catalog catalog = null!;

    private static void Assert(bool ok, string reason)
    {
        if (!ok) throw new InvalidOperationException(reason);
    }
    private static void Near(float expected, float actual, float tolerance = .06f)
    {
        Assert(float.IsFinite(actual) && MathF.Abs(expected-actual) <= tolerance,
            $"expected={expected}, actual={actual}");
    }
    private static void Case(string name, Action action)
    {
        try { action(); ++passed; Console.WriteLine("PASS "+name); }
        catch(Exception ex) { ++failed; Console.WriteLine("FAIL "+name+": "+ex.Message); }
    }

    // The runner reads actual frozen-catalog files; it never changes stock/HP.
    private static Catalog LoadCatalog()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while(dir != null)
        {
            string path=Path.Combine(dir.FullName,"Assets","Resources","Data");
            string catalogFile=Path.Combine(path,"catalog.json");
            string decksFile=Path.Combine(path,"featured-decks.json");
            if(File.Exists(catalogFile)&&File.Exists(decksFile))
            {
                var opts=new JsonSerializerOptions { IncludeFields=true };
                var data=JsonSerializer.Deserialize<CatalogData>(File.ReadAllText(catalogFile),opts);
                var featured=JsonSerializer.Deserialize<FeaturedDeckData>(File.ReadAllText(decksFile),opts);
                return new Catalog(data!,featured!);
            }
            dir=dir.Parent;
        }
        throw new FileNotFoundException("Expected real Assets/Resources/Data/catalog.json");
    }

    private static GameSimulation Sim(int owner)
    {
        var deck=new DeckDefinition
        {
            id="a10_w13_fixture",
            balls=new[]{"fire","ice","plague","rimeburst","pyrecore",
                        "medic","shield","cleanser","ward"}
        };
        var sim=new GameSimulation(catalog,deck,deck);
        sim.State.turn=owner;
        return sim;
    }

    private static LaunchGesture Drag(int owner,float dx,float localUp,int pointer=17)
    {
        float x=270,y=853;
        var gesture=new LaunchGesture();
        gesture.Begin(pointer,MatchPerspective.SimulationX(x,owner),
                              MatchPerspective.SimulationY(y,owner));
        gesture.Move(pointer,MatchPerspective.SimulationX(x+dx,owner),
                             MatchPerspective.SimulationY(y-localUp,owner));
        return gesture;
    }
    private static PlayerCommand Command(int owner,float dx,float localUp,int turn=1)
    {
        var gesture=Drag(owner,dx,localUp);
        Assert(gesture.Release(17,owner,turn,"normal",0,out var c),
            "A legal gesture was not released");
        Assert(c != null,"Release returned no PlayerCommand");
        return c!;
    }
    private static (GameSimulation sim,BallRuntime ball,PlayerCommand command)
        SpawnActual(int owner,float dx,float localUp)
    {
        var sim=Sim(owner);
        var c=Command(owner,dx,localUp,sim.State.turnNumber);
        Assert(sim.TryCommand(c,out var reason),"Authoritative TryCommand rejected: "+reason);
        Assert(sim.State.balls.Count==1,"One spawn must yield exactly one ball");
        var b=sim.State.balls.Single();
        Assert(b.owner==owner&&b.type=="normal"&&sim.State.phase==MatchPhase.Moving,
            "Wrong ball owner/type/phase");
        return (sim,b,c);
    }

    // W14 design probe: "backwards" stays inside the screen/world (30px).
    // Current V148-derived source allows the gesture; any future owner-selected
    // fix may either reject it or produce an intentional nonlateral direction.
    private static (bool accepted,float vx,float vy,float power) ProbeBackwards(int owner,float dx)
    {
        var sim=Sim(owner);
        var gesture=Drag(owner,dx,-30f);
        Assert(gesture.Release(17,owner,sim.State.turnNumber,"normal",0,out var command)
            && command!=null,"30-unit backward gesture unexpectedly rejected by input");
        Assert(owner==0?command.dy>0:command.dy<0,
            "Probe is not actually directed behind the player's launcher");
        bool accepted=sim.TryCommand(command,out _);
        if(!accepted)
        {
            Assert(sim.State.balls.Count==0 && sim.State.phase==MatchPhase.Aiming,
                "Rejected backward shot changed authoritative state");
            return (false,0f,0f,command.power);
        }
        Assert(sim.State.balls.Count==1,"Accepted backward shot created unexpected ball count");
        var ball=sim.State.balls.Single();
        return (true,ball.vx,ball.vy,command.power);
    }

    private static int Main()
    {
        catalog=LoadCatalog();

        Case("A10-W13-01 P2 local upward gesture spawns forward world ball",()=>
        {
            var (sim,ball,c)=SpawnActual(1,0,120);
            Near(270,ball.x);Near(47,ball.y);
            Near(0,ball.vx);Assert(ball.vy>0,"P2 ball went backwards");
            Near(c.power,MathF.Sqrt(ball.vx*ball.vx+ball.vy*ball.vy));
            Assert(sim.State.turn==1&&c.owner==1,"Host changed authenticated P2 seat");
        });

        Case("A10-W13-02 P1 local upward gesture still launches toward world top",()=>
        {
            var (_,ball,c)=SpawnActual(0,0,120);
            Near(270,ball.x);Near(853,ball.y);
            Near(0,ball.vx);Assert(ball.vy<0,"P1 ball went backwards");
            Near(c.power,MathF.Sqrt(ball.vx*ball.vx+ball.vy*ball.vy));
        });

        Case("A10-W13-03 same visible diagonal produces symmetric true spawn physics",()=>
        {
            var (_,p1,c1)=SpawnActual(0,60,80);
            var (_,p2,c2)=SpawnActual(1,60,80);
            Near(c1.power,c2.power);
            Near(p1.vx,p2.vx);Near(p1.vy,-p2.vy);
            Assert(p1.vx>0&&p1.vy<0&&p2.vx>0&&p2.vy>0,
                "P2 mistakenly mirrored horizontal motion");
        });

        Case("A10-W13-04 P2 visible left-up produces negative world X",()=>
        {
            var (_,b,c)=SpawnActual(1,-60,80);
            Assert(b.vx<0&&b.vy>0&&c.dx<0&&c.dy>0,
                "P2 left/right hand mapping reversed");
            Near(100*3.38f,c.power);
        });

        Case("A10-W13-05 near-horizontal P2 right shot is bounded forward",()=>
        {
            var (_,b,c)=SpawnActual(1,200,0);
            Assert(b.vx>0&&b.vy>0,"Near-horizontal P2 shot left legal forward cone");
            Near(590,c.power);
            Near(MathF.Sin(1.53589f),b.vx/c.power,.002f);
            Near(MathF.Cos(1.53589f),b.vy/c.power,.002f);
        });

        Case("A10-W13-06 near-horizontal P2 left shot remains bounded forward",()=>
        {
            var (_,b,c)=SpawnActual(1,-200,0);
            Assert(b.vx<0&&b.vy>0,"Near-horizontal left P2 shot reversed team forward");
            Near(-MathF.Sin(1.53589f),b.vx/c.power,.002f);
            Near(MathF.Cos(1.53589f),b.vy/c.power,.002f);
        });

        Case("A10-W13-07 near-horizontal P1/P2 edges mirror actual velocities",()=>
        {
            foreach(float dx in new[]{-200f,200f})
            {
                var (_,a,_ca)=SpawnActual(0,dx,0);
                var (_,b,_cb)=SpawnActual(1,dx,0);
                Near(a.vx,b.vx);
                Near(a.vy,-b.vy);
                Assert(a.vy<0&&b.vy>0,"Forward-only rule differs by seat");
            }
        });

        Case("A10-W13-08 P2 first physics tick still looks upward locally",()=>
        {
            var (sim,b,_)=SpawnActual(1,40,120);
            float initialViewY=MatchPerspective.ViewY(b.y,1);
            sim.Step(.016f);
            Assert(b.y>47,"P2 simulation failed to advance towards opponent");
            Assert(MatchPerspective.ViewY(b.y,1)<initialViewY,
                "P2 local camera shows legal shot moving backward");
            Assert(b.owner==1&&sim.State.turn==1,"Authoritative seat mutated during physics");
        });

        Case("A10-W13-09 P1/P2 first physics tick remains geometrically mirrored",()=>
        {
            var (a,ballA,_ca)=SpawnActual(0,40,120);
            var (b,ballB,_cb)=SpawnActual(1,40,120);
            a.Step(.016f);b.Step(.016f);
            Near(ballA.x,ballB.x,.1f);
            Near(ballA.y,MatchPerspective.ViewY(ballB.y,1),.1f);
            Assert(ballA.owner==0&&ballB.owner==1,"Simulation team identity swapped");
        });

        Case("A10-W13-10 P2 replay uses original ball and unrestricted vector",()=>
        {
            var sim=Sim(1);
            var ball=sim.Spawn(1,"normal",200,150);
            Assert(sim.CanReplay(ball),"Fixture ball not in own replay zone");
            var gesture=new LaunchGesture();
            gesture.Begin(17,MatchPerspective.SimulationX(200,1),
                             MatchPerspective.SimulationY(150,1));
            gesture.Move(17,MatchPerspective.SimulationX(180,1),
                            MatchPerspective.SimulationY(100,1));
            Assert(gesture.Release(17,1,sim.State.turnNumber,"normal",ball.id,out var c),
                "Replay gesture rejected");
            Assert(c != null && c.owner==1 && c.kind==CommandKind.Replay && c.ballId==ball.id,
                "Replay command lost canonical owner, kind or ball ID");
            Assert(sim.TryCommand(c,out var reason),"Authoritative replay rejected: "+reason);
            Assert(sim.State.balls.Count==1&&sim.State.replayedIds.Contains(ball.id),
                "Replay unexpectedly spawned a new ball or lost ID");
            Assert(ball.owner==1&&ball.vx<0&&ball.vy<0,
                "Replay incorrectly used launcher-only forward clamp");
        });

        Case("A10-W13-11 wrong-seat client command cannot create ball",()=>
        {
            var sim=Sim(1);
            var c=Command(1,30,100);c.owner=0;
            Assert(!sim.TryCommand(c,out _),"P2 authority accepted P1-spoofed command");
            Assert(sim.State.balls.Count==0&&sim.State.phase==MatchPhase.Aiming,
                "Spoofed command mutated match");
        });

        Case("A10-W13-12 stale-turn input cannot create P2 ball",()=>
        {
            var sim=Sim(1);
            var c=Command(1,30,100,sim.State.turnNumber+1);
            Assert(!sim.TryCommand(c,out _),"Stale P2 turn accepted");
            Assert(sim.State.balls.Count==0&&sim.State.phase==MatchPhase.Aiming,
                "Stale P2 command mutated match");
        });

        Case("A10-W13-13 Moving phase cannot accept second launch",()=>
        {
            var (sim,_,_first)=SpawnActual(1,20,100);
            int serial=sim.State.actionSerial;
            var second=Command(1,20,100,sim.State.turnNumber);
            Assert(!sim.TryCommand(second,out _),"Accepted second launch while moving");
            Assert(sim.State.actionSerial==serial&&sim.State.balls.Count==1,
                "Rejected moving-phase launch mutated match");
        });


        // W14 owner-decision P1 known issue: a pure backward screen drag with
        // dx=0 becomes an almost full-right shot due to Atan2(0,-Y)=PI,
        // then clamping to +1.53589. Tests 01..04 are EXPECTED RED on the
        // unchanged source. They allow either reject-or-safe, not a prescribed fix.
        Case("A10-W14-01 RED P1 directly backward never fires hard right",()=>
        {
            var shot=ProbeBackwards(0,0);
            if(shot.accepted)
                Assert(MathF.Abs(shot.vx)<=shot.power*.10f,
                    "Source reproduced: neutral backward P1 drag becomes near-max sideways velocity");
        });

        Case("A10-W14-02 RED P2 directly backward never fires hard right",()=>
        {
            var shot=ProbeBackwards(1,0);
            if(shot.accepted)
                Assert(MathF.Abs(shot.vx)<=shot.power*.10f,
                    "Source reproduced: neutral backward P2 drag becomes near-max sideways velocity");
        });

        Case("A10-W14-03 RED P1 tiny left/right jitter behind launcher is stable",()=>
        {
            var a=ProbeBackwards(0,-.001f);
            var b=ProbeBackwards(0,+.001f);
            if(a.accepted&&b.accepted)
                Assert(MathF.Abs(a.vx-b.vx)<=MathF.Max(a.power,b.power)*.20f,
                    "P1 near-zero horizontal jitter flips between near-max left and right");
        });

        Case("A10-W14-04 RED P2 tiny left/right jitter behind launcher is stable",()=>
        {
            var a=ProbeBackwards(1,-.001f);
            var b=ProbeBackwards(1,+.001f);
            if(a.accepted&&b.accepted)
                Assert(MathF.Abs(a.vx-b.vx)<=MathF.Max(a.power,b.power)*.20f,
                    "P2 near-zero horizontal jitter flips between near-max left and right");
        });

        Case("A10-W14-05 positive control forward micro-jitter stays near vertical",()=>
        {
            foreach(int owner in new[]{0,1})
            foreach(float dx in new[]{-.001f,.001f})
            {
                var (_,ball,command)=SpawnActual(owner,dx,30f);
                Assert(MathF.Abs(ball.vx)<=command.power*.10f,
                    "Forward micro-jitter unexpectedly shoots sideways");
                Assert(owner==0?ball.vy<0:ball.vy>0,
                    "Forward micro-jitter reversed world-Y");
            }
        });

        Console.WriteLine($"A10 W13+W14 AUTHORITATIVE SPAWN CONTRACT: {passed} PASS / {failed} FAIL");
        return failed==0?0:1;
    }
}
