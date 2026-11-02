using System;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using CoreClash.Core;
using CoreClash.Input;
using CoreClash.Presentation;

// CC-001 W17-02 (#284): aim origin, direction, P1/P2 view transform and
// rotation-free strokes. Presentation geometry only: no change to LaunchGesture,
// power, the +/-88 degree clamp, physics, catalog or Protocol149.
public static partial class Program
{
    static void W17AimGeometryTests()
    {
        Test("W17-02 P1 and P2 launcher previews start at the authoritative spawn point",()=>{
            var p1=AimGuide.Preview(270,853,270,700,0,21.25f);
            var p2=AimGuide.Preview(270,47,270,200,1,21.25f);
            True(p1.FromLauncher&&p2.FromLauncher);True(p1.Valid&&p2.Valid);
            Near(270,p1.Path[0].x,.001f);Near(853,p1.Path[0].y,.001f);
            Near(270,p2.Path[0].x,.001f);Near(47,p2.Path[0].y,.001f);
            True(p1.DirY<0,"P1 shoots towards the enemy at the top");True(p2.DirY>0,"P2 shoots towards the enemy at the bottom");
        });
        Test("W17-02 launcher preview direction equals the spawned ball velocity for both owners",()=>{
            float[][] drags={new[]{0f,-120f},new[]{80f,-80f},new[]{-60f,-150f},new[]{150f,-5f},new[]{40f,90f},new[]{-90f,30f},new[]{3f,-170f}};
            for(int owner=0;owner<2;owner++)foreach(var d in drags){
                float dy=owner==0?d[1]:-d[1];
                AssertPreviewMatchesCommand(owner,AimGuide.LauncherX,AimGuide.LauncherY(owner),d[0],dy,0);
            }
        });
        Test("W17-02 Replay preview starts at the ball and matches the replay velocity",()=>{
            for(int owner=0;owner<2;owner++){
                float y=owner==0?760:140;
                AssertPreviewMatchesCommand(owner,180,y,55,owner==0?-70:70,1);
                AssertPreviewMatchesCommand(owner,180,y,-40,owner==0?20:-20,1); // backwards replay is legal and unclamped
            }
        });
        Test("W17-02 preview readiness and length follow LaunchGesture power without changing it",()=>{
            var tiny=AimGuide.Preview(270,853,270,836,0,17);False(tiny.Ready);
            var g=new LaunchGesture();g.Begin(1,270,853);g.Move(1,270,836);False(g.Release(1,0,1,"normal",0,out _));
            var ok=AimGuide.Preview(270,853,270,834,0,17);True(ok.Ready);
            float max=38+590/3.38f*1.28f;
            Near(max,AimGuide.Preview(270,853,270,400,0,17).Length,.01f);
            Near(max,AimGuide.Preview(270,853,270,100,0,17).Length,.01f);
            True(AimGuide.Preview(270,853,270,800,0,17).Length<AimGuide.Preview(270,853,270,750,0,17).Length);
        });
        Test("W17-02 preview path never leaves the arena, including the wall bounce",()=>{
            for(int owner=0;owner<2;owner++)for(int a=-170;a<=170;a+=10){
                double rad=a*Math.PI/180;float dx=(float)Math.Sin(rad)*175,dy=(float)Math.Cos(rad)*175*(owner==0?-1:1);
                var p=AimGuide.Preview(270,AimGuide.LauncherY(owner),270+dx,AimGuide.LauncherY(owner)+dy,owner,25);
                True(p.Valid,"valid preview at "+a);
                foreach(var pt in p.Path){True(pt.x>=24.3f+25-.01f&&pt.x<=515.7f-25+.01f,"x inside at "+a);True(pt.y>=16+25-.01f&&pt.y<=884-25+.01f,"y inside at "+a);}
            }
        });
        Test("W17-02 non-finite drags produce no preview",()=>{
            False(AimGuide.Preview(270,853,float.NaN,700,0,17).Valid);
            True(float.IsNaN(AimGuide.Preview(270,853,float.NaN,700,0,17).Distance),"NaN drag must stop BoardView drawing");
            False(AimGuide.Preview(270,853,270,float.PositiveInfinity,0,17).Valid);
            Eq(0,AimGuide.Preview(270,853,270.5f,853,0,17).Path.Length);
        });
        Test("W17-02 board view transform is invertible and flips only Y for P2",()=>{
            foreach(var owner in new[]{0,1})foreach(var board in new[]{(x:0f,y:0f,w:540f),(x:37.5f,y:68f,w:402.4f),(x:12f,y:120f,w:311f)})
                for(float wx=24.3f;wx<=515.7f;wx+=61.4f)for(float wy=16;wy<=884;wy+=108.5f){
                    var v=BoardSpace.ToView(wx,wy,owner,board.x,board.y,board.w);
                    var w=BoardSpace.ToWorld(v.x,v.y,owner,board.x,board.y,board.w);
                    Near(wx,w.x,.01f);Near(wy,w.y,.01f);
                    // Same inverse as CoreClashApp.HandlePointer/InspectAt (viewX=(screen-board)*540/width).
                    float viewX=(v.x-board.x)*540/board.w,viewY=(v.y-board.y)*540/board.w;
                    Near(MatchPerspective.SimulationX(viewX,owner),w.x,.01f);Near(MatchPerspective.SimulationY(viewY,owner),w.y,.01f);
                }
            var b=(x:10f,y:20f,w:540f);
            var p1Launcher=BoardSpace.ToView(270,853,0,b.x,b.y,b.w);var p2Launcher=BoardSpace.ToView(270,47,1,b.x,b.y,b.w);
            Near(p1Launcher.x,p2Launcher.x,.001f);Near(p1Launcher.y,p2Launcher.y,.001f); // each player sees own launcher at the bottom
            True(BoardSpace.ToView(270,853,1,b.x,b.y,b.w).y<BoardSpace.ToView(270,450,1,b.x,b.y,b.w).y,"P1 launcher is at the top for P2");
        });
        Test("W17-02 launcher and aim origin stay inside the board rectangle on supported windows",()=>{
            var sizes=new[]{(1920f,1080f,DeviceProfile.Desktop),(1366f,768f,DeviceProfile.Desktop),(1024f,768f,DeviceProfile.Desktop),(768f,1024f,DeviceProfile.Tablet),(1280f,900f,DeviceProfile.Desktop),(390f,844f,DeviceProfile.Phone),(844f,390f,DeviceProfile.Phone)};
            foreach(var (w,h,profile) in sizes){
                var layout=MatchLayout.For(w,h,profile);var board=layout.Board;
                for(int owner=0;owner<2;owner++)for(int viewOwner=0;viewOwner<2;viewOwner++){
                    var o=BoardSpace.ToView(AimGuide.LauncherX,AimGuide.LauncherY(owner),viewOwner,board.x,board.y,board.width);
                    True(o.x>board.x&&o.x<board.x+board.width&&o.y>board.y&&o.y<board.y+board.height,$"launcher {owner} view {viewOwner} outside board at {w}x{h}");
                    var tip=AimGuide.Preview(270,AimGuide.LauncherY(owner),270,AimGuide.LauncherY(owner)+(owner==0?-175:175),owner,21.25f).Path.Last();
                    var t=BoardSpace.ToView(tip.x,tip.y,viewOwner,board.x,board.y,board.width);
                    True(t.x>=board.x&&t.x<=board.x+board.width&&t.y>=board.y&&t.y<=board.y+board.height,$"tip outside board at {w}x{h}");
                }
            }
        });
        Test("W17-02 stroke stamps are collinear, end-to-end, bounded and dash-aware",()=>{
            var a=new AimPoint(10,20);var b=new AimPoint(110,95);
            var solid=AimGuide.StrokeStamps(a,b,2,0,0,1,512);
            Near(a.x,solid.First().x,.001f);Near(a.y,solid.First().y,.001f);Near(b.x,solid.Last().x,.001f);Near(b.y,solid.Last().y,.001f);
            foreach(var p in solid)Near(0,(p.x-a.x)*(b.y-a.y)-(p.y-a.y)*(b.x-a.x),.05f); // collinear
            for(int i=1;i<solid.Count;i++)True(Math.Sqrt(Math.Pow(solid[i].x-solid[i-1].x,2)+Math.Pow(solid[i].y-solid[i-1].y,2))<=1.0001,"solid gap <= spacing");
            var dashed=AimGuide.StrokeStamps(a,b,2,7,7);True(dashed.Count>0&&dashed.Count<solid.Count,"dash removes stamps");
            Eq(513,AimGuide.StrokeStamps(new AimPoint(0,0),new AimPoint(10000,1),1,0,0,.5f,512).Count);
            Eq(0,AimGuide.StrokeStamps(a,a,2).Count);Eq(0,AimGuide.StrokeStamps(a,new AimPoint(float.NaN,1),2).Count);Eq(0,AimGuide.StrokeStamps(a,b,0).Count);
        });
        Test("W17-02 presentation code no longer rotates the GUI matrix for strokes",()=>{
            var dir=Path.Combine(projectRoot,"Assets/CoreClash/Presentation");
            foreach(var file in new[]{"Draw.cs","BoardView.cs","BallView.cs"}){
                var code=string.Join("\n",File.ReadAllLines(Path.Combine(dir,file)).Select(l=>{int c=l.IndexOf("//",StringComparison.Ordinal);return c>=0?l.Substring(0,c):l;}));
                False(Regex.IsMatch(code,@"RotateAroundPivot\s*\("));
            }
        });
    }

    static void AssertPreviewMatchesCommand(int owner,float originX,float originY,float dx,float dy,int replay)
    {
        var s=Sim();
        if(owner==1){True(s.TryCommand(Shot(s),out _));Settle(s);} // reach P2's turn legally
        int replayId=0;
        if(replay==1){var ball=s.Spawn(owner,"normal",originX,originY);replayId=ball.id;True(s.CanReplay(ball),"fixture ball must be replayable");}
        var g=new LaunchGesture();g.Begin(1,originX,originY);g.Move(1,originX+dx,originY+dy);
        True(g.Release(1,s.State.turn,s.State.turnNumber,"normal",replayId,out var command),"gesture must produce a command");
        var preview=AimGuide.Preview(originX,originY,originX+dx,originY+dy,owner,21.25f);
        Near(originX,preview.Path[0].x,.001f);Near(originY,preview.Path[0].y,.001f);
        True(s.TryCommand(command,out var reason),"authoritative command rejected: "+reason);
        var launched=replay==1?s.State.balls.First(b=>b.id==replayId):s.State.balls.Last();
        float speed=(float)Math.Sqrt(launched.vx*launched.vx+launched.vy*launched.vy);
        Near(launched.vx/speed,preview.DirX,.0005f);Near(launched.vy/speed,preview.DirY,.0005f);
    }
}
