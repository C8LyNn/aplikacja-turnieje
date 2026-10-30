using CoreClash.Core;
using CoreClash.Input;
using CoreClash.Presentation;

// CC-001 R17-W11 A10: design acceptance against actual managed view transform
// and actual LaunchGesture command creation. Test-only: no production changes.
internal static class A10W11Contract
{
    private static int passed;
    private static int failed;

    private static void Check(bool condition, string message)
    {
        if (!condition) throw new Exception(message);
    }

    private static void Near(float expected, float actual, float tolerance = .005f)
    {
        Check(float.IsFinite(actual) && MathF.Abs(expected - actual) <= tolerance,
            $"expected {expected}, got {actual}");
    }

    private static void Case(string name, Action action)
    {
        try
        {
            action();
            passed++;
            Console.WriteLine("PASS " + name);
        }
        catch (Exception ex)
        {
            failed++;
            Console.WriteLine("FAIL " + name + ": " + ex.Message);
        }
    }

    private static LaunchGesture DragFromView(
        int owner, float startX, float startY, float endX, float endY, int pointer = 7)
    {
        var gesture = new LaunchGesture();
        gesture.Begin(pointer,
            MatchPerspective.SimulationX(startX, owner),
            MatchPerspective.SimulationY(startY, owner));
        gesture.Move(pointer,
            MatchPerspective.SimulationX(endX, owner),
            MatchPerspective.SimulationY(endY, owner));
        return gesture;
    }

    private static PlayerCommand Release(
        LaunchGesture gesture, int owner, int replayId = 0, int pointer = 7)
    {
        Check(gesture.Release(pointer, owner, 2, "normal", replayId, out var command),
            "valid drag rejected by actual LaunchGesture");
        Check(command != null, "accepted gesture missing command");
        return command;
    }

    private static GameState State(int turn, MatchPhase phase = MatchPhase.Aiming,
        bool bonus = false)
    {
        return new GameState { turn = turn, turnNumber = 2,
            phase = phase, bonusPending = bonus };
    }

    private static int Main()
    {
        Case("A10-W11-01 P2 launcher appears bottom, X stays canonical", () =>
        {
            Near(270, MatchPerspective.ViewX(270, 1));
            Near(853, MatchPerspective.ViewY(47, 1));
            Near(270, MatchPerspective.SimulationX(270, 1));
            Near(47, MatchPerspective.SimulationY(853, 1));
            Near(47, MatchPerspective.ViewY(853, 1));
        });

        Case("A10-W11-02 P2 visible upward drag creates positive world Y shot", () =>
        {
            var command = Release(DragFromView(1, 270, 853, 270, 700), 1);
            Check(command.owner == 1 && command.kind == CommandKind.Spawn, "wrong owner/kind");
            Check(command.turnNumber == 2 && command.ballType == "normal", "metadata changed");
            Near(0, command.dx);
            Near(153, command.dy);
            Near(153 * 3.38f, command.power);
        });

        Case("A10-W11-03 P1 visible upward drag still creates negative world Y shot", () =>
        {
            var command = Release(DragFromView(0, 270, 853, 270, 700), 0);
            Check(command.owner == 0, "wrong host seat");
            Near(0, command.dx);
            Near(-153, command.dy);
            Near(153 * 3.38f, command.power);
        });

        Case("A10-W11-04 P2 rightward aim is not mirrored horizontally", () =>
        {
            var command = Release(DragFromView(1, 270, 853, 360, 733), 1);
            Near(90, command.dx);
            Near(120, command.dy);
            Near(150 * 3.38f, command.power);
        });

        Case("A10-W11-05 P2 inverse transform holds across field edges", () =>
        {
            foreach (float x in new float[] { 25, 270, 515 })
                foreach (float y in new float[] { 18, 47, 450, 853, 882 })
                {
                    Near(x, MatchPerspective.SimulationX(MatchPerspective.ViewX(x, 1), 1));
                    Near(y, MatchPerspective.SimulationY(MatchPerspective.ViewY(y, 1), 1));
                }
        });

        Case("A10-W11-06 actual gesture rejects less than 18 world units", () =>
        {
            var gesture = DragFromView(1, 270, 853, 270, 835.5f);
            Check(!gesture.Release(7, 1, 2, "normal", 0, out var command),
                "sub-threshold shot accepted");
            Check(command == null && !gesture.Active, "rejected shot leaked command/gesture");
        });

        Case("A10-W11-07 actual gesture accepts 18 world units", () =>
        {
            var command = Release(DragFromView(1, 270, 853, 270, 835), 1);
            Near(18, command.dy);
            Near(18 * 3.38f, command.power);
        });

        Case("A10-W11-08 actual gesture caps power at 590 unchanged", () =>
        {
            var command = Release(DragFromView(1, 270, 853, 270, 553), 1);
            Near(300, command.dy);
            Near(590, command.power);
        });

        Case("A10-W11-09 P2 Replay maintains original canonical ball ID", () =>
        {
            // World (200,200) appears at P2 local-view (200,700).
            var command = Release(DragFromView(1, 200, 700, 200, 650), 1, 42);
            Check(command.kind == CommandKind.Replay && command.ballId == 42,
                "P2 replay identity changed");
            Near(50, command.dy);
        });

        Case("A10-W11-10 unrelated pointer cannot release P2 shot", () =>
        {
            var gesture = DragFromView(1, 270, 853, 270, 700);
            Check(!gesture.Release(8, 1, 2, "normal", 0, out var command),
                "different pointer accepted");
            Check(command == null && gesture.Active, "unrelated pointer modified active aim");
            Release(gesture, 1);
        });

        Case("A10-W11-11 P2 waiting on P1 never receives actionable hint", () =>
        {
            var state = State(0);
            string turn = LocalTurnPresentation.Status(state, 1, true, true);
            string hint = LocalTurnPresentation.ActionHint(state, 1, true, true,
                true, 100, 0, "DRAG FROM LAUNCHER");
            Check(!turn.Contains("YOUR SHOT") && turn.Contains("WAITING"), "wrong relative turn");
            Check(!hint.Contains("DRAG") && !hint.Contains("RELEASE")
                && hint.Contains("WAITING"), "remote P2 got a launch hint");
        });

        Case("A10-W11-12 only connected active P2 sees own bonus action", () =>
        {
            var state = State(1, MatchPhase.Aiming, true);
            Check(LocalTurnPresentation.Status(state, 1, true, true)
                .Contains("YOUR BONUS SHOT"), "P2 bonus not attributed");
            Check(LocalTurnPresentation.ActionHint(state, 1, true, true,
                true, 18, 0, "DRAG").Contains("RELEASE TO LAUNCH"),
                "active P2 lacks release instruction");
            Check(!LocalTurnPresentation.Status(state, 1, true, false)
                .Contains("YOUR"), "disconnected seat incorrectly actionable");
        });

        Case("A10-W11-13 offline hot-seat UI is neutral", () =>
        {
            var state = State(0);
            Check(!LocalTurnPresentation.Status(state, -1, false, true)
                .Contains("YOUR SHOT"), "hot-seat copied remote-only claim");
        });

        Case("A10-W11-14 Moving phase never permits an aim CTA", () =>
        {
            var state = State(1, MatchPhase.Moving);
            var hint = LocalTurnPresentation.ActionHint(state, 1, true, true,
                true, 200, 0, "DRAG");
            Check(!hint.Contains("DRAG") && !hint.Contains("RELEASE"),
                "moving phase exposes launch CTA");
        });

        Console.WriteLine($"A10 W11 INPUT DESIGN CONTRACT: {passed} PASS / {failed} FAIL");
        return failed == 0 ? 0 : 1;
    }
}
