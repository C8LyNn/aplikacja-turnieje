using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using CoreClash.Core;
using CoreClash.Presentation;

// CC-001 W19-05: the base-damage banner and the Replay counter never cover a
// ball, its chips, a launcher or each other (both views, several board sizes).
// Regression for the real d95ae7a Player screenshots 04/05 (banner over the P2
// home ball and its R chip; counter on the P2 launcher).
public static partial class Program
{
    static readonly string[] W19BannerLines={"P2 BASE -1 · TURN 3","TURN-END PRESSURE (ZONE OR CENTRE) -1"};
    static readonly string[] W19BannerLinesP1={"P1 BASE -3 · TURN 8","BACK WALL (Standard) -2 · TURN-END PRESSURE (ZONE OR CENTRE) -1"};

    static void W19NoOverlap(UiBox box,UiBox field,List<UiBox> keepOuts,string what)
    {
        True(box.x>=field.x-.01f&&box.Right<=field.Right+.01f&&box.y>=field.y-.01f&&box.Bottom<=field.Bottom+.01f,what+" outside the field");
        foreach(var k in keepOuts)True(!BoardLabelLayout.Overlaps(box,k),$"{what} overlaps a ball/launcher/label at {k.x:0},{k.y:0}");
    }

    static GameState W19Screenshot04State()
    {
        // Positions read from 04-p2-replay-counter-and-base-banner.png (d95ae7a): P2 home ball
        // touching P2's zone, P1 ball beside it, one P2 ball on the right, P1 ball at home.
        var s=W18Sim();s.State.turn=1;s.State.turnNumber=4;
        s.Spawn(1,"normal",176,177);s.Spawn(0,"normal",269,194);s.Spawn(1,"normal",470,535);s.Spawn(0,"normal",340,770);
        return s.State;
    }

    static void W19HudCollisionTests()
    {
        Test("W19-05 ball keep-out covers the Replay pulse and chip, threat badge, HP plate and status row at every scale",()=>{
            // W20: the owner chip is gone (ownership is the ring); HP and states are plates around the ball.
            foreach(float scale in new[]{.46f,.86f,1f,1.62f,2.4f})
            foreach(int rows in new[]{0,1})
            {
                float x=300*scale,y=400*scale,r=21.25f*scale;var k=BoardLabelLayout.BallKeepOut(x,y,r,scale,rows);
                var chips=rows==0?new BallStateLabel[0]:new[]{new BallStateLabel("F2","",StatusKind.Fire,"2"),new BallStateLabel("I1","",StatusKind.Ice,"1"),new BallStateLabel("T3","",StatusKind.Toxin,"3")};
                var l=BallBadges.Layout(x,y,r,scale,30,10,chips,true,true,new UiBox(0,0,540*scale,900*scale));
                True(l.Bounds.x>=k.x&&l.Bounds.Right<=k.Right&&l.Bounds.y>=k.y&&l.Bounds.Bottom<=k.Bottom,$"badges outside keep-out at scale {scale} rows {rows}");
                float pulse=r+BallBadges.RingOut(scale)+BallBadges.ReplayPulse(scale);
                True(x-pulse>=k.x&&x+pulse<=k.Right&&y-pulse>=k.y&&y+pulse<=k.Bottom,"Replay pulse outside keep-out");
            }
            // the planner's keep-out of a real ball is the exact layout of that ball, padded
            var st=W18Sim();var ball=st.Spawn(1,"normal",176,177);ball.fireStacks=2;ball.burnTurns=4;ball.shield=5;
            foreach(float bw in new[]{305f,423f,1270f})
            {
                float scale=bw/540;var field=BoardOverlayPlanner.Field(0,0,0,bw);var p=BoardSpace.ToView(176,177,0,0,0,bw);
                var exact=BallBadges.Layout(ball,p.x,p.y,scale,true,field).Bounds;
                var keep=BoardOverlayPlanner.KeepOuts(st.State,0,0,0,bw);
                True(keep.Any(k=>k.x<=exact.x-3.9f*scale&&k.Right>=exact.Right+3.9f*scale&&k.y<=exact.y-3.9f*scale&&k.Bottom>=exact.Bottom+3.9f*scale),"planner keep-out does not cover the ball's plates");
            }
            True(BoardOverlayPlanner.AtViewTop(1,0)&&!BoardOverlayPlanner.AtViewTop(0,0)&&!BoardOverlayPlanner.AtViewTop(1,1)&&BoardOverlayPlanner.AtViewTop(0,1),"P1/P2 sides wrong");
            var f=new UiBox(0,0,400,700);var top=BoardLabelLayout.BandSlots(f,100,30,true,10,8,.5f);var bottom=BoardLabelLayout.BandSlots(f,100,30,false,10,8,.5f);
            Eq(8f,top[0].y);Eq(700f-8-30,bottom[0].y);True(top.All(p=>p.y>=8&&p.y+30<=692)&&bottom.All(p=>p.y>=8&&p.y+30<=692));
        });
        Test("W19-05 real-Player case 04: banner no longer covers the P2 home ball, counter no longer sits on the P2 launcher",()=>{
            var state=W19Screenshot04State();
            foreach(float bw in new[]{423f,1270f}) // board width in the 1280x900 and 3840x2054 captures
            {
                float scale=bw/540;var field=BoardOverlayPlanner.Field(0,0,0,bw);var keep=BoardOverlayPlanner.KeepOuts(state,0,0,0,bw);
                var homeBall=BoardLabelLayout.BallKeepOut(BoardSpace.ToView(176,177,0,0,0,bw).x,BoardSpace.ToView(176,177,0,0,0,bw).y,21.25f*scale,scale,0);
                // the d95ae7a placement (anchor 270,140, Fit inside the field)
                int font=Math.Max(9,(int)Math.Round(11*scale));float h=font+7;var anchor=BoardSpace.ToView(270,140,0,0,0,bw);
                var old=BoardLabelLayout.Fit(field,anchor.x,anchor.y-h,anchor.y-h,Math.Max(W19BannerLines[0].Length,W19BannerLines[1].Length)*font*.58f+16,h*2+4,8);
                True(BoardLabelLayout.Overlaps(old,homeBall),"regression scenario no longer reproduces the d95ae7a overlap");
                var oldLabel="P2 · REPLAY ×1 · DRAG A GLOWING BALL";float ow=oldLabel.Length*font*.7f+16,oh=font+8;var oa=BoardSpace.ToView(24.3f+8,16+26,0,0,0,bw);
                var oldCounter=BoardLabelLayout.Fit(field,oa.x+ow/2,oa.y-oh/2,oa.y-oh/2,ow,oh);var p2Launcher=BoardLabelLayout.LauncherKeepOut(BoardSpace.ToView(270,47,0,0,0,bw).x,BoardSpace.ToView(270,47,0,0,0,bw).y,scale);
                True(BoardLabelLayout.Overlaps(oldCounter,p2Launcher),"regression scenario no longer reproduces the d95ae7a counter overlap");
                var avoid=new List<UiBox>(keep);
                var banner=BoardOverlayPlanner.Banner(W19BannerLines,1,0,field,scale,avoid);True(banner.Placed&&banner.TwoLines,"banner not placed");W19NoOverlap(banner.Box,field,keep,"banner");
                var counter=BoardOverlayPlanner.Counter(ReplayAffordance.CounterLabel(1,1),1,0,field,scale,avoid);True(counter.Placed,"counter not placed");W19NoOverlap(counter.Box,field,keep,"counter");
                True(!BoardLabelLayout.Overlaps(banner.Box,counter.Box),"banner and counter overlap");
                True(banner.Box.Bottom<=field.y+field.height/2,"P2 banner left P2's half");True(counter.Box.Bottom<=field.y+field.height/2,"P2 counter left P2's half");
            }
        });
        Test("W19-05 crowded boards: both banners and the counter avoid every ball, chip and launcher in both views and sizes",()=>{
            var rng=new Random(1905);
            foreach(float bw in new[]{248f,423f,640f,880f,1270f})
            foreach(int view in new[]{0,1})
            foreach(int balls in new[]{6,14,22})
            {
                var s=W18Sim();
                for(int i=0;i<balls;i++){var b=s.Spawn(i%2,"normal",40+(float)rng.NextDouble()*460,40+(float)rng.NextDouble()*820);if(i%5==0)b.fireStacks=2;if(i%7==0){b.iceStacks=1;b.shield=3;}}
                float scale=bw/540;var field=BoardOverlayPlanner.Field(view,0,0,bw);var keep=BoardOverlayPlanner.KeepOuts(s.State,view,0,0,bw);var avoid=new List<UiBox>(keep);
                var placed=new List<UiBox>();
                foreach(var (lines,owner) in new[]{(W19BannerLines,1),(W19BannerLinesP1,0)}){var p=BoardOverlayPlanner.Banner(lines,owner,view,field,scale,avoid);if(p.Placed){W19NoOverlap(p.Box,field,keep,$"banner P{owner+1} view {view} w {bw} n {balls}");placed.Add(p.Box);}}
                foreach(int owner in new[]{0,1}){var p=BoardOverlayPlanner.Counter(ReplayAffordance.CounterLabel(owner,2),owner,view,field,scale,avoid);if(p.Placed){W19NoOverlap(p.Box,field,keep,$"counter P{owner+1} view {view} w {bw} n {balls}");placed.Add(p.Box);}}
                for(int i=0;i<placed.Count;i++)for(int j=i+1;j<placed.Count;j++)True(!BoardLabelLayout.Overlaps(placed[i],placed[j]),"two overlays overlap");
                if(balls<=6&&bw>=423)True(placed.Count==4,$"free space exists but an overlay was not placed (view {view} w {bw} n {balls}): {placed.Count}");
            }
        });
        Test("W19-05 a fully packed board falls back to the outer frame instead of covering balls",()=>{
            var s=W18Sim();for(float x=40;x<=500;x+=46)for(float y=40;y<=880;y+=46)s.Spawn(x<270?0:1,"normal",x,y);
            float bw=640,scale=bw/540;var field=BoardOverlayPlanner.Field(0,0,0,bw);var avoid=BoardOverlayPlanner.KeepOuts(s.State,0,0,0,bw);
            False(BoardOverlayPlanner.Banner(W19BannerLines,1,0,field,scale,avoid).Placed);False(BoardOverlayPlanner.Counter("P1 · REPLAY ×1",0,0,field,scale,avoid).Placed);
        });
        Test("W19-05 board source: overlays hidden while dragging, planned against keep-outs, frame fallback, short counter",()=>{
            string board=File.ReadAllText(Path.Combine(projectRoot,"Assets/CoreClash/Presentation/BoardView.cs"));
            Eq(2,Regex.Matches(board,@"\(aim!=null&&aim\.Active\)").Count);
            True(board.Contains("BoardOverlayPlanner.Banner(")&&board.Contains("BoardOverlayPlanner.Counter(")&&board.Contains("BoardOverlayPlanner.KeepOuts("),"overlays are not planned against keep-outs");
            True(board.Contains("RenderMarginNotes(board)"),"no frame fallback");
            False(board.Contains("Point(board,270,owner==0?760:140)"));False(board.Contains("Point(board,Left+8,state.turn==0?Bottom-26:Top+26)"));
            Eq("P2 · REPLAY ×1",ReplayAffordance.CounterLabel(1,1));Eq("",ReplayAffordance.CounterLabel(0,0));
        });
    }
}
