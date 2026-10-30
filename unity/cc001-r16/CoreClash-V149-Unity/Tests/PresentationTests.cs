using CoreClash.Presentation;
using CoreClash.Core;
using System.Linq;
public static partial class Program
{
    static void PresentationTests()
    {
        A33W14PoseEvidenceTests();
        Test("new active player cannot inherit a ball outside their deck",()=>{var s=new GameSimulation(catalog,catalog.Featured[0],catalog.Featured[1]);s.State.turn=1;Eq("normal",BallSelection.ForTurn(s,"agony"));});
        Test("exhausted selection falls back to unlimited Standard",()=>{var s=new GameSimulation(catalog,catalog.Featured[0],catalog.Featured[1]);Eq("agony",BallSelection.ForTurn(s,"agony"));s.State.players[0].stock.First(x=>x.id=="agony").remaining=0;Eq("normal",BallSelection.ForTurn(s,"agony"));});
        foreach(var size in new[]{(1280,900),(960,600),(1920,1080),(390,844),(844,390)}){
            Test("presentation arena and controls remain usable at "+size.Item1+"x"+size.Item2,()=>{
                var layout=MatchLayout.For(size.Item1,size.Item2);var board=layout.Board;var panel=layout.Panel;
                True(board.width>140&&board.height>230,"arena became too small");Near(.6f,board.width/board.height,.001f);
                foreach(var r in new[]{board,panel})True(r.x>=0&&r.y>=60&&r.Right<=size.Item1&&r.Bottom<=size.Item2,"surface leaves viewport");
                True(board.Right<=panel.x||board.Bottom<=panel.y,"controls overlap arena");
                if(!layout.Portrait)True(panel.width>=360&&panel.width<=520,"desktop control column lost fixed width bounds");
            });
        }

        // R17-W3 A20 test-first compact landscape contract. Source edits follow separately.
        foreach(var size in new[]{(844f,340f),(667f,325f),(568f,270f),(844f,390f)}){
            Test("A20 compact phone landscape keeps fixed critical controls visible "+size.Item1+"x"+size.Item2,()=>{
                var l=MatchLayout.For(size.Item1,size.Item2,DeviceProfile.Phone);
                True(l.CompactLandscape,"compact landscape profile not selected");
                False(l.Portrait);
                Near(.6f,l.Board.width/l.Board.height,.001f);
                True(l.Board.y>=60,"board enters global header");
                True(l.Board.width>100&&l.Board.height>=190,"compact arena collapsed");
                True(l.Panel.width>=320&&l.Panel.height>=190,"compact side panel cannot fit actions");
                foreach(var r in new[]{l.Board,l.Panel,l.CompactHud,l.CompactChoice,l.CompactCards,l.CompactActions}){
                    True(r.width>=44&&r.height>=44,"required surface / touch target below 44");
                    True(r.x>=0&&r.y>=60&&r.Right<=size.Item1&&r.Bottom<=size.Item2,"surface leaves safe viewport");
                }
                True(Separated(l.Board,l.Panel),"panel obscures aiming arena");
                foreach(var r in new[]{l.CompactHud,l.CompactChoice,l.CompactCards,l.CompactActions}){
                    True(r.x>=l.Panel.x&&r.Right<=l.Panel.Right&&r.y>=l.Panel.y&&r.Bottom<=l.Panel.Bottom,"critical row outside panel");
                }
                True(l.CompactHud.Bottom<=l.CompactChoice.y&&l.CompactChoice.Bottom<=l.CompactCards.y&&l.CompactCards.Bottom<=l.CompactActions.y,"compact rows overlap");
                True(l.CompactActions.Bottom<=l.Panel.Bottom,"actions are not sticky within visible panel");
                if(l.CompactFeedback.height>=20)True(l.CompactFeedback.y>=l.CompactActions.Bottom&&l.CompactFeedback.Bottom<=l.Panel.Bottom,"feedback row overlaps actions");
            });
        }
        Test("A20 compact phone arena enlarges R16 board while keeping world aspect",()=>{
            foreach(var item in new[]{(844f,340f,148.8f),(667f,325f,139.8f),(568f,270f,106.8f)}){
                var l=MatchLayout.For(item.Item1,item.Item2,DeviceProfile.Phone);
                True(l.CompactLandscape&&l.Board.width>item.Item3,"no arena gain vs canonical R16");
                Near(.6f,l.Board.width/l.Board.height,.001f);
            }
        });
        Test("A20 compact layout leaves portrait, tablet, desktop unchanged",()=>{
            foreach(var item in new[]{(390f,844f,DeviceProfile.Phone),(820f,1180f,DeviceProfile.Tablet),(1366f,1024f,DeviceProfile.Tablet),(1280f,900f,DeviceProfile.Desktop)}){
                var a=MatchLayout.For(item.Item1,item.Item2,item.Item3);
                False(a.CompactLandscape);
                True(a.Board.width>100&&Separated(a.Board,a.Panel));
            }
        });
        Test("A20 compact eligibility refuses too-short height or narrow panel",()=>{
            False(MatchLayout.For(600,250,DeviceProfile.Phone).CompactLandscape);
            False(MatchLayout.For(400,330,DeviceProfile.Phone).CompactLandscape);
        });

        // R17-W9 A20: local turn messaging must use the actual LAN seat, never the active player alone.
        Test("NET-UX-01 P2 client never sees YOUR SHOT during P1 aiming",()=>{
            var s=Sim();s.State.turn=0;s.State.phase=MatchPhase.Aiming;
            string line=LocalTurnPresentation.Status(s.State,1,true,true);
            True(line.Contains("PLAYER 1"));True(line.Contains("WAITING"));False(line.Contains("YOUR SHOT"));
            Eq("WAIT P1",LocalTurnPresentation.CompactStatus(s.State,1,true,true));
        });
        Test("NET-UX-02 P2 client sees YOUR SHOT only in own aiming phase",()=>{
            var s=Sim();s.State.turn=1;s.State.phase=MatchPhase.Aiming;
            True(LocalTurnPresentation.Status(s.State,1,true,true).Contains("YOUR SHOT"));
            Eq("YOUR SHOT",LocalTurnPresentation.CompactStatus(s.State,1,true,true));
        });
        Test("NET-UX-03 P1 host and P2 client have opposite relative status",()=>{
            var s=Sim();s.State.turn=0;s.State.phase=MatchPhase.Aiming;
            True(LocalTurnPresentation.Status(s.State,0,true,true).Contains("YOUR SHOT"));
            False(LocalTurnPresentation.Status(s.State,1,true,true).Contains("YOUR SHOT"));
        });
        Test("NET-UX-04 moving is never YOUR SHOT for either LAN seat",()=>{
            var s=Sim();s.State.turn=1;s.State.phase=MatchPhase.Moving;
            False(LocalTurnPresentation.Status(s.State,1,true,true).Contains("YOUR SHOT"));
            Eq("MOVING",LocalTurnPresentation.CompactStatus(s.State,1,true,true));
        });
        Test("NET-UX-05 disconnected P2 does not imply input permission",()=>{
            var s=Sim();s.State.turn=1;s.State.phase=MatchPhase.Aiming;
            True(LocalTurnPresentation.Status(s.State,1,true,false).Contains("WAITING FOR CONNECTION"));
            Eq("OFFLINE",LocalTurnPresentation.CompactStatus(s.State,1,true,false));
        });
        Test("NET-UX-06 local hotseat announces active owner without remote YOU claim",()=>{
            var s=Sim();s.State.turn=0;s.State.phase=MatchPhase.Aiming;
            string line=LocalTurnPresentation.Status(s.State,0,false,true);
            True(line.Contains("PLAYER 1"));False(line.Contains("YOUR SHOT"));
            Eq("P1 AIM",LocalTurnPresentation.CompactStatus(s.State,0,false,true));
        });
        Test("NET-UX-07 game-over winner remains absolute owner",()=>{
            var s=Sim();s.State.phase=MatchPhase.Over;s.State.winner=0;
            True(LocalTurnPresentation.Status(s.State,1,true,true).Contains("PLAYER 1 WINS"));
            Eq("P1 WINS",LocalTurnPresentation.CompactStatus(s.State,1,true,true));
        });
        Test("NET-UX-08 P2 aim guide trace stays within world wall bounds",()=>{
            // Red P2's launcher is at world y=47 and shoots towards increasing y.
            var points=AimGuide.Trace(270,47,0,1,17,250);
            True(points.Length>=2);
            True(points[points.Length-1].y>points[0].y);
            foreach(var p in points)True(p.x>=24.3f&&p.x<=515.7f&&p.y>=16f&&p.y<=884f);
        });

        // R17-W10 / A20: A10-approved no-meter aim interaction contract.
        Test("NET-UX-09 invalid aim drag below 18 has no release cue",()=>{
            Eq("DRAG FROM LAUNCHER",AimUiStatus.Hint(false,0,0));
            False(AimUiStatus.Ready(true,17.99f,0));
            Eq("DRAG TO BUILD POWER",AimUiStatus.Hint(true,17.99f,0));
        });
        Test("NET-UX-10 threshold 18 and longer aim show release with same core rules",()=>{
            True(AimUiStatus.Ready(true,18,0));
            Eq("RELEASE TO LAUNCH",AimUiStatus.Hint(true,18,0));
            True(AimUiStatus.Ready(true,0,-120));
            Eq("RELEASE TO LAUNCH",AimUiStatus.Hint(true,0,-120));
        });
        Test("NET-UX-11 invalid aim floats cannot show release",()=>{
            False(AimUiStatus.Ready(true,float.NaN,20));
            False(AimUiStatus.Ready(true,float.PositiveInfinity,20));
            Eq("DRAG TO BUILD POWER",AimUiStatus.Hint(true,float.NaN,40));
        });

        Test("NET-UX-12 P2 waiting on P1 cannot see drag or launch action hint",()=>{
            var s=Sim();s.State.turn=0;s.State.phase=MatchPhase.Aiming;
            Eq("WAITING FOR PLAYER 1",LocalTurnPresentation.ActionHint(s.State,1,true,true,false,0,0,"DRAG FROM LAUNCHER"));
            Eq("WAITING FOR PLAYER 1",LocalTurnPresentation.ActionHint(s.State,1,true,true,true,30,0,"SELECT A BALL AND DRAG TO AIM"));
        });
        Test("NET-UX-13 disconnected P2 cannot see interactive action cue",()=>{
            var s=Sim();s.State.turn=1;s.State.phase=MatchPhase.Aiming;
            Eq("WAITING FOR CONNECTION",LocalTurnPresentation.ActionHint(s.State,1,true,false,true,50,0,"DRAG FROM LAUNCHER"));
        });
        Test("NET-UX-14 current P2 aim and insufficient drag use unchanged threshold",()=>{
            var s=Sim();s.State.turn=1;s.State.phase=MatchPhase.Aiming;
            Eq("DRAG TO BUILD POWER",LocalTurnPresentation.ActionHint(s.State,1,true,true,true,17,0,"DRAG FROM LAUNCHER"));
            Eq("RELEASE TO LAUNCH",LocalTurnPresentation.ActionHint(s.State,1,true,true,true,18,0,"DRAG FROM LAUNCHER"));
        });

        // R17-W10 A30: A10-approved provisional P2 own-bottom view is vertical-only.
        Test("NET-W10-01 P2 view keeps X canonical and flips Y only",()=>{
            Near(100f,MatchPerspective.ViewX(100f,1),.001f);
            Near(800f,MatchPerspective.ViewY(100f,1),.001f);
            Near(100f,MatchPerspective.ViewX(100f,0),.001f);
            Near(100f,MatchPerspective.ViewY(100f,0),.001f);
        });
        Test("NET-W10-02 P2 screen-to-world transform round-trips launcher and arbitrary point",()=>{
            Near(270f,MatchPerspective.SimulationX(MatchPerspective.ViewX(270f,1),1),.001f);
            Near(47f,MatchPerspective.SimulationY(MatchPerspective.ViewY(47f,1),1),.001f);
            float x=123.5f,y=678.25f;
            Near(x,MatchPerspective.SimulationX(MatchPerspective.ViewX(x,1),1),.001f);
            Near(y,MatchPerspective.SimulationY(MatchPerspective.ViewY(y,1),1),.001f);
        });
        Test("NET-W10-03 P2 own top-world launcher appears at bottom in local view",()=>{
            Near(853f,MatchPerspective.ViewY(47f,1),.001f);
            Near(47f,MatchPerspective.ViewY(853f,1),.001f);
        });

        // R17-W11 A20: stale notices must never mask disconnection/remote turn.
        Test("NET-UX-15 disconnected P2 during moving shows offline priority",()=>{
            var s=Sim();s.State.turn=1;s.State.phase=MatchPhase.Moving;
            True(LocalTurnPresentation.Status(s.State,1,true,false).Contains("WAITING FOR CONNECTION"));
            Eq("OFFLINE",LocalTurnPresentation.CompactStatus(s.State,1,true,false));
            Eq("WAITING FOR CONNECTION",LocalTurnPresentation.ActionMessage(s.State,1,true,false,false,0,0,"DRAG FROM LAUNCHER","Old failed shot"));
        });
        Test("NET-UX-16 P2 waiting on P1 masks old failed shot notice",()=>{
            var s=Sim();s.State.turn=0;s.State.phase=MatchPhase.Aiming;
            Eq("WAITING FOR PLAYER 1",LocalTurnPresentation.ActionMessage(s.State,1,true,true,true,40,0,"DRAG FROM LAUNCHER","This shot could not be played"));
        });
        Test("NET-UX-17 disconnected active P2 masks old failed shot notice",()=>{
            var s=Sim();s.State.turn=1;s.State.phase=MatchPhase.Aiming;
            Eq("WAITING FOR CONNECTION",LocalTurnPresentation.ActionMessage(s.State,1,true,false,true,40,0,"DRAG FROM LAUNCHER","Old failed shot"));
        });
        Test("NET-UX-18 connected P2 own aim may display its own rejection notice",()=>{
            var s=Sim();s.State.turn=1;s.State.phase=MatchPhase.Aiming;
            Eq("Try again",LocalTurnPresentation.ActionMessage(s.State,1,true,true,true,40,0,"DRAG FROM LAUNCHER","Try again"));
            Eq("RELEASE TO LAUNCH",LocalTurnPresentation.ActionMessage(s.State,1,true,true,true,40,0,"DRAG FROM LAUNCHER",""));
        });
        Test("NET-UX-19 moving or game over cannot surface old action notice",()=>{
            var s=Sim();s.State.turn=0;s.State.phase=MatchPhase.Moving;
            Eq("SHOT RESOLVING",LocalTurnPresentation.ActionMessage(s.State,0,true,true,true,30,0,"DRAG FROM LAUNCHER","Try again"));
            s.State.phase=MatchPhase.Over;
            Eq("MATCH COMPLETE",LocalTurnPresentation.ActionMessage(s.State,0,true,true,true,30,0,"DRAG FROM LAUNCHER","Try again"));
        });
        Test("NET-UX-20 invalid local seat never shows old action notice",()=>{
            var s=Sim();s.State.turn=0;s.State.phase=MatchPhase.Aiming;
            Eq("WAITING FOR PLAYER 1",LocalTurnPresentation.ActionMessage(s.State,-1,true,true,true,30,0,"DRAG FROM LAUNCHER","Try again"));
        });

        // R17-W6 / A20: Phoenix-hand selection parity with core TryCommand.
        Test("PHX-UI-01 ready Phoenix hand with exhausted stock can be selected",()=>{
            var s=PhoenixUiFixture();PhoenixUiHand(s);
            Eq(0,s.Stock(0,"phoenix"));
            Eq(BallSelectionSource.Hand,BallSelection.Source(s,0,"phoenix"));
            True(BallSelection.CanSelect(s,0,"phoenix"));
            Eq("phoenix",BallSelection.ForTurn(s,"phoenix"));
            Eq("HAND READY",BallSelection.StockLabel(s,0,"phoenix"));
        });
        Test("PHX-UI-02 exhausted Phoenix without ready hand falls back to Standard",()=>{
            var s=PhoenixUiFixture();
            Eq(BallSelectionSource.None,BallSelection.Source(s,0,"phoenix"));
            False(BallSelection.CanSelect(s,0,"phoenix"));
            Eq("normal",BallSelection.ForTurn(s,"phoenix"));
            Eq("EMPTY",BallSelection.StockLabel(s,0,"phoenix"));
        });
        Test("PHX-UI-03 genuine Phoenix stock takes priority over ready hand",()=>{
            var s=PhoenixUiFixture(1);PhoenixUiHand(s);
            Eq(BallSelectionSource.Stock,BallSelection.Source(s,0,"phoenix"));
            Eq("x1",BallSelection.StockLabel(s,0,"phoenix"));
            True(s.TryCommand(Shot(s,0,"phoenix"),out _));
            Eq(0,s.Stock(0,"phoenix"));Eq(1,s.State.phoenixHand.Count);
            Eq(BallSelectionSource.Hand,BallSelection.Source(s,0,"phoenix"));
        });
        Test("PHX-UI-04 unready Phoenix hand is unavailable",()=>{
            var s=PhoenixUiFixture();var h=PhoenixUiHand(s);h.ready=false;
            Eq(BallSelectionSource.None,BallSelection.Source(s,0,"phoenix"));
            Eq("normal",BallSelection.ForTurn(s,"phoenix"));
        });
        Test("PHX-UI-05 opponent-owned ready Phoenix hand is unavailable",()=>{
            var s=PhoenixUiFixture();var h=PhoenixUiHand(s);h.owner=1;
            Eq(BallSelectionSource.None,BallSelection.Source(s,0,"phoenix"));
            False(BallSelection.CanSelect(s,0,"phoenix"));
        });
        Test("PHX-UI-06 same-turn and stale-processed Phoenix hands are unavailable",()=>{
            var s=PhoenixUiFixture();var h=PhoenixUiHand(s);
            h.createdOwnerTurns=s.State.players[0].ownerTurns;
            Eq(BallSelectionSource.None,BallSelection.Source(s,0,"phoenix"));
            h.createdOwnerTurns=s.State.players[0].ownerTurns-1;
            h.lastProcessedOwnerTurns=s.State.players[0].ownerTurns-1;
            Eq(BallSelectionSource.None,BallSelection.Source(s,0,"phoenix"));
            h.lastProcessedOwnerTurns=s.State.players[0].ownerTurns+1;
            Eq(BallSelectionSource.Hand,BallSelection.Source(s,0,"phoenix"));
        });
        Test("PHX-UI-07 consuming last ready hand removes Phoenix availability",()=>{
            var s=PhoenixUiFixture();PhoenixUiHand(s);
            True(BallSelection.CanSelect(s,0,"phoenix"));
            True(s.TryCommand(Shot(s,0,"phoenix"),out _));
            Eq(0,s.Stock(0,"phoenix"));Eq(0,s.State.phoenixHand.Count);
            Eq(BallSelectionSource.None,BallSelection.Source(s,0,"phoenix"));
            Eq("normal",BallSelection.ForTurn(s,"phoenix"));
            Eq("EMPTY",BallSelection.StockLabel(s,0,"phoenix"));
        });
        Test("PHX-UI-08 exhausted non-Phoenix ball still falls back to Standard",()=>{
            var s=Sim();PhoenixUiHand(s); // A Phoenix hand must not unlock a different exhausted ball.
            var entry=s.State.players[0].stock.First(x=>x.id=="fire");entry.remaining=0;
            Eq(BallSelectionSource.None,BallSelection.Source(s,0,"fire"));
            False(BallSelection.CanSelect(s,0,"fire"));
            Eq("normal",BallSelection.ForTurn(s,"fire"));
            Eq("EMPTY",BallSelection.StockLabel(s,0,"fire"));
        });
        Test("PHX-UI-09 opponent turn never enables own Phoenix hand or stock",()=>{
            var s=PhoenixUiFixture(1);PhoenixUiHand(s);
            s.State.players[1].stock.Add(new StockEntry{id="phoenix",remaining=1});
            Eq(BallSelectionSource.None,BallSelection.Source(s,1,"phoenix"));
            False(BallSelection.CanSelect(s,1,"phoenix"));
        });
        Test("PHX-UI-10 one ready hand wins over an invalid earlier hand",()=>{
            var s=PhoenixUiFixture();var early=PhoenixUiHand(s);early.ready=false;
            PhoenixUiHand(s);
            Eq(BallSelectionSource.Hand,BallSelection.Source(s,0,"phoenix"));
        });
    }
    static GameSimulation PhoenixUiFixture(int stock=0)
    {
        var s=Sim();
        s.State.players[0].stock.Add(new StockEntry{id="phoenix",remaining=stock});
        return s;
    }
    static PhoenixHandEntry PhoenixUiHand(GameSimulation simulation)
    {
        var turns=simulation.State.players[0].ownerTurns;
        var hand=new PhoenixHandEntry{
            owner=0,ready=true,createdOwnerTurns=turns-1,
            lastProcessedOwnerTurns=turns,hp=10,maxHp=25,shield=0
        };
        simulation.State.phoenixHand.Add(hand);
        return hand;
    }

}
