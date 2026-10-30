using System;
using CoreClash.Core;
using CoreClash.Input;
using CoreClash.Presentation;

// A10 R17-W12: design regression for the wall-only guide and P2 viewport.
// The source remains RC1/V148/Protocol149-compatible; no gameplay edits.
internal static class A10W12AimGuideContract
{
    private static int passed, failed;
    private const float Radius = 17f;
    private const float Height = MatchPerspective.WorldHeight;

    private static void Assert(bool condition, string message)
    {
        if (!condition) throw new Exception(message);
    }

    private static void Near(float expected, float actual, float tolerance = .025f)
    {
        Assert(float.IsFinite(actual) && MathF.Abs(actual - expected) <= tolerance,
            $"Expected {expected}, got {actual}");
    }

    private static void Case(string id, Action action)
    {
        try { action(); passed++; Console.WriteLine("PASS " + id); }
        catch (Exception ex) { failed++; Console.WriteLine("FAIL " + id + ": " + ex.Message); }
    }

    private static AimPoint[] Guide(float x, float y, float dx, float dy, float length, float radius=Radius)
        => AimGuide.Trace(x, y, dx, dy, radius, length);

    private static float SegmentLength(AimPoint a, AimPoint b)
        => MathF.Sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));

    private static void Inside(AimPoint[] points, float radius)
    {
        Assert(points.Length >= 2, "Expected at least one valid guide segment");
        foreach(var p in points)
        {
            Assert(float.IsFinite(p.x) && float.IsFinite(p.y), "Nonfinite guide point");
            Assert(p.x >= 24.3f+radius-.05f && p.x <= 515.7f-radius+.05f,
                "Guide point outside horizontal playable wall");
            Assert(p.y >= 16f+radius-.05f && p.y <= 884f-radius+.05f,
                "Guide point outside vertical playable wall");
        }
    }

    private static LaunchGesture DragP2(float dx, float visibleUp, int pointer=7)
    {
        var gesture=new LaunchGesture();
        gesture.Begin(pointer, MatchPerspective.SimulationX(270,1),
            MatchPerspective.SimulationY(853,1));
        gesture.Move(pointer, MatchPerspective.SimulationX(270+dx,1),
            MatchPerspective.SimulationY(853-visibleUp,1));
        return gesture;
    }

    private static PlayerCommand Release(LaunchGesture gesture, int owner, int replayId=0)
    {
        Assert(gesture.Release(7,owner,2,"normal",replayId,out var command),
            "Expected real LaunchGesture.Release to accept legal aim");
        Assert(command!=null, "Accepted real command missing");
        return command;
    }

    private static int Main()
    {
        Case("A10-W12-01 P1/P2 mirrored forward paths have identical local shape", () =>
        {
            var p1=Guide(270,853,0,-1,250);
            var p2=Guide(270,47,0,1,250);
            Assert(p1.Length==2 && p2.Length==2,"Unexpected straight guide segments");
            for(int i=0;i<p1.Length;i++)
            {
                Near(p1[i].x,MatchPerspective.ViewX(p2[i].x,1));
                Near(p1[i].y,MatchPerspective.ViewY(p2[i].y,1));
            }
        });

        Case("A10-W12-02 P2 visible upwards points into opponent field", () =>
        {
            var path=Guide(270,47,0,1,145);
            Inside(path,Radius);
            Assert(path[1].y>path[0].y,"P2 world path does not advance");
            Assert(MatchPerspective.ViewY(path[1].y,1)
                 <MatchPerspective.ViewY(path[0].y,1),"P2 guide appears downward");
        });

        Case("A10-W12-03 P1 forward guide remains unchanged", () =>
        {
            var path=Guide(270,853,0,-1,145);
            Inside(path,Radius);
            Assert(path[1].y<path[0].y,"P1 world guide changed orientation");
            Near(145,SegmentLength(path[0],path[1]));
        });

        Case("A10-W12-04 P2 near-right wall produces a bounded bounce", () =>
        {
            var path=Guide(480,220,1,.3f,200);
            Assert(path.Length==3,"Expected a bounce at right boundary");
            Inside(path,Radius);
            Near(515.7f-Radius,path[1].x);
            Assert(path[2].x<path[1].x,"Reflected segment still travels outside right wall");
            Assert(MatchPerspective.ViewX(path[1].x,1)==path[1].x,
                "P2 X must not be reversed");
        });

        Case("A10-W12-05 P2 view round-trip includes bounce points", () =>
        {
            var path=Guide(480,220,1,.3f,200);
            foreach(var point in path)
            {
                Near(point.x,MatchPerspective.SimulationX(MatchPerspective.ViewX(point.x,1),1));
                Near(point.y,MatchPerspective.SimulationY(MatchPerspective.ViewY(point.y,1),1));
            }
        });

        Case("A10-W12-06 radius-dependent walls never bleed out of field", () =>
        {
            foreach(float radius in new [] { 7f,17f,30f })
            {
                Inside(Guide(490,50,1,.25f,400,radius),radius);
                Inside(Guide(270,47,0,1,500,radius),radius);
            }
        });

        Case("A10-W12-07 clear-field preview length increases before a wall", () =>
        {
            var shortPath=Guide(270,47,0,1,40);
            var longPath=Guide(270,47,0,1,130);
            Assert(shortPath.Length==2&&longPath.Length==2,"Unexpected bounce in clear field");
            Near(40,SegmentLength(shortPath[0],shortPath[1]));
            Near(130,SegmentLength(longPath[0],longPath[1]));
        });

        Case("A10-W12-08 P2 right-and-up drag keeps true canonical direction", () =>
        {
            var cmd=Release(DragP2(60,80),1);
            Assert(cmd.owner==1 && cmd.kind==CommandKind.Spawn,"Wrong owner/kind");
            Near(60,cmd.dx);Near(80,cmd.dy);
            Near(100*3.38f,cmd.power);
            var guide=Guide(270,47,cmd.dx,cmd.dy,120);
            Inside(guide,Radius);
            Assert(guide[1].x>guide[0].x&&guide[1].y>guide[0].y,
                "Guide conflicts with actual command direction");
        });

        Case("A10-W12-09 aim ready and actual release threshold agree", () =>
        {
            foreach(float length in new [] { 17f,18f,19f,90f,174f,175f,300f })
            {
                var g=DragP2(0,length);
                var ready=AimUiStatus.Ready(g.Active,g.AimX-g.OriginX,g.AimY-g.OriginY);
                var accepted=g.Release(7,1,2,"normal",0,out var command);
                Assert(ready==accepted,"Readiness/release disagreement at "+length);
                if(accepted)
                {
                    Near(length,command.dy);
                    Near(MathF.Min(590,length*3.38f),command.power);
                }
                else Assert(command==null,"Rejected release emitted command");
            }
        });

        Case("A10-W12-10 P2 Replay maps same ball id without screen-side owner swap", () =>
        {
            var gesture=new LaunchGesture();
            gesture.Begin(7, MatchPerspective.SimulationX(490,1),
                MatchPerspective.SimulationY(400,1));
            gesture.Move(7, MatchPerspective.SimulationX(485,1),
                MatchPerspective.SimulationY(340,1));
            var command=Release(gesture,1,42);
            Assert(command.owner==1 && command.kind==CommandKind.Replay && command.ballId==42,
                "Replay ball or owner changed by presentation inversion");
            Near(-5,command.dx);Near(60,command.dy);
            Inside(Guide(490,500,command.dx,command.dy,120),Radius);
        });

        Case("A10-W12-11 guide refuses invalid numbers and impossible radii", () =>
        {
            Assert(Guide(270,47,float.NaN,1,80).Length==0,"NaN direction accepted");
            Assert(Guide(270,47,0,float.PositiveInfinity,80).Length==0,
                "Infinite direction accepted");
            Assert(Guide(270,47,0,1,80,-1).Length==0,"Negative radius accepted");
            Assert(Guide(270,47,0,1,80,101).Length==0,"Impossible radius accepted");
            Assert(Guide(270,47,0,1,0).Length==0,"Zero guide length accepted");
            Assert(Guide(270,47,0,0,90).Length==0,"Zero direction accepted");
        });

        Case("A10-W12-12 repeated guide sampling is deterministic", () =>
        {
            var first=Guide(480,220,1,.3f,200);
            var again=Guide(480,220,1,.3f,200);
            Assert(first.Length==again.Length,"Guide changed its segment count");
            for(int i=0;i<first.Length;i++)
            {
                Near(first[i].x,again[i].x,0);
                Near(first[i].y,again[i].y,0);
            }
        });

        Console.WriteLine($"A10 W12 AIM DESIGN CONTRACT: {passed} PASS / {failed} FAIL");
        return failed==0 ? 0 : 1;
    }
}
