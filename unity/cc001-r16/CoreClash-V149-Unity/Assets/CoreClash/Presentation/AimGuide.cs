using System;
using System.Collections.Generic;
using CoreClash.Core;
namespace CoreClash.Presentation
{
    public struct AimPoint { public float x,y;public AimPoint(float x,float y){this.x=x;this.y=y;} }
    public static class AimGuide
    {
        // A geometric wall guide only: bodies, fields and abilities may change the actual shot.
        public static AimPoint[] Trace(float x,float y,float dx,float dy,float radius,float length)
        {
            if(!GameSimulation.Finite(x)||!GameSimulation.Finite(y)||!GameSimulation.Finite(dx)||!GameSimulation.Finite(dy)||!GameSimulation.Finite(radius)||!GameSimulation.Finite(length)||radius<0||radius>100||length<=0)return Array.Empty<AimPoint>();
            double magnitude=Math.Sqrt((double)dx*dx+(double)dy*dy);if(magnitude<.0001)return Array.Empty<AimPoint>();
            dx=(float)(dx/magnitude);dy=(float)(dy/magnitude);length=Math.Min(length,600);
            float minX=24.3f+radius,maxX=515.7f-radius,minY=16+radius,maxY=884-radius;
            x=GameSimulation.Clamp(x,minX,maxX);y=GameSimulation.Clamp(y,minY,maxY);var start=new AimPoint(x,y);
            float tx=Distance(x,dx,minX,maxX),ty=Distance(y,dy,minY,maxY),hit=Math.Min(tx,ty);
            if(hit>=length)return new[]{start,new AimPoint(x+dx*length,y+dy*length)};
            var bounce=new AimPoint(x+dx*hit,y+dy*hit);float remaining=length-hit;
            if(Math.Abs(tx-hit)<.01f)dx=-dx;if(Math.Abs(ty-hit)<.01f)dy=-dy;
            remaining=Math.Min(remaining,Math.Min(Distance(bounce.x,dx,minX,maxX),Distance(bounce.y,dy,minY,maxY)));
            return new[]{start,bounce,new AimPoint(bounce.x+dx*remaining,bounce.y+dy*remaining)};
        }
        static float Distance(float origin,float direction,float min,float max)=>Math.Abs(direction)<.00001f?float.PositiveInfinity:Math.Max(0,((direction>0?max:min)-origin)/direction);

        // W24 (owner direction after playing: "the prediction is to take the balls into account too"):
        // the same path, cut where a ball of `radius` rolling along it first touches one of the bodies
        // (other balls, obstacles). The last point is then the ball's centre at the moment of contact.
        // A body the ball already overlaps at the start of a stretch is not a contact.
        public static AimPoint[] ClipAtBodies(AimPoint[] path,float radius,IReadOnlyList<StopObstacle> bodies,out bool touched)
        {
            touched=false;
            if(path==null||path.Length<2||bodies==null||bodies.Count==0||!(radius>=0))return path;
            for(int i=1;i<path.Length;i++)
            {
                float ax=path[i-1].x,ay=path[i-1].y,dx=path[i].x-ax,dy=path[i].y-ay,length=(float)Math.Sqrt(dx*dx+dy*dy);
                if(length<.001f)continue;
                float ux=dx/length,uy=dy/length,first=length;bool hit=false;
                foreach(var body in bodies)
                {
                    float reach=radius+body.Radius,cx=body.X-ax,cy=body.Y-ay;
                    if(cx*cx+cy*cy<=reach*reach)continue;
                    float along=cx*ux+cy*uy;if(along<=0)continue;
                    float side=cx*cx+cy*cy-along*along;if(side>=reach*reach)continue;
                    float at=along-(float)Math.Sqrt(reach*reach-side);
                    if(at>=0&&at<first){first=at;hit=true;}
                }
                if(!hit)continue;
                var cut=new AimPoint[i+1];Array.Copy(path,cut,i);
                cut[i]=new AimPoint(ax+ux*first,ay+uy*first);touched=true;return cut;
            }
            return path;
        }

        // W17-02 (#284): the launcher is the authoritative spawn point used by
        // GameSimulation.TryCommand; the preview must start exactly there.
        public const float LauncherX=270f;
        public static float LauncherY(int owner)=>owner==0?853f:47f;
        public static bool IsLauncherOrigin(float originX,float originY,int owner)=>Math.Abs(originX-LauncherX)<.1f&&Math.Abs(originY-LauncherY(owner))<.1f;

        // Pure, world-space preview of the current drag. It mirrors LaunchGesture
        // (power = drag * 3.38, 18-unit threshold) and TryCommand (spawn angle clamp
        // of +/-88 degrees, replay uses the raw normalized drag). Presentation only.
        public static AimPreview Preview(float originX,float originY,float aimX,float aimY,int owner,float radius)
        {
            // Distance stays NaN for non-finite input so callers can skip drawing.
            var preview=new AimPreview{Origin=new AimPoint(originX,originY),Path=Array.Empty<AimPoint>(),Distance=float.NaN};
            float dx=aimX-originX,dy=aimY-originY;
            if(!GameSimulation.Finite(dx)||!GameSimulation.Finite(dy))return preview;
            float distance=(float)Math.Sqrt((double)dx*dx+(double)dy*dy);
            if(!GameSimulation.Finite(distance))return preview;
            preview.Distance=distance;preview.Ready=distance>=18;preview.FromLauncher=IsLauncherOrigin(originX,originY,owner);
            if(distance<=1)return preview;
            float dirX=dx/distance,dirY=dy/distance;
            if(preview.FromLauncher){
                float angle=(float)Math.Atan2(dx,owner==0?-dy:dy);
                angle=GameSimulation.Clamp(angle,-1.53589f,1.53589f);
                dirX=(float)Math.Sin(angle);dirY=(float)Math.Cos(angle)*(owner==0?-1:1);
            }
            preview.DirX=dirX;preview.DirY=dirY;
            preview.Length=38+Math.Min(distance,590/3.38f)*1.28f;
            preview.Path=Trace(originX,originY,dirX,dirY,radius,preview.Length);
            preview.Valid=preview.Path.Length>=2;
            return preview;
        }

        // Stamp centres for a stroke between two points in the CURRENT drawing
        // space. Drawing small discs at translated positions keeps every stroke in
        // the same coordinate path as balls and rings, without GUI matrix rotation
        // (GUIUtility.RotateAroundPivot misplaces strokes under the scaled
        // UiViewport.GuiMatrix; seen on RC1 as an aim line in the corner/off-board).
        // dash<=0 means a solid stroke; spacing<=0 keeps the W11 aim spacing
        // (max(2, 0.8*width)) so the existing aim look is unchanged.
        public static List<AimPoint> StrokeStamps(AimPoint start,AimPoint end,float width,float dash=0,float gap=0,float spacing=0,int maxSamples=256)
        {
            var stamps=new List<AimPoint>();
            float dx=end.x-start.x,dy=end.y-start.y;
            if(!GameSimulation.Finite(start.x)||!GameSimulation.Finite(start.y)||!GameSimulation.Finite(dx)||!GameSimulation.Finite(dy)||!GameSimulation.Finite(width)||width<=0||maxSamples<1)return stamps;
            float length=(float)Math.Sqrt((double)dx*dx+(double)dy*dy);
            if(!GameSimulation.Finite(length)||length<.01f)return stamps;
            if(!GameSimulation.Finite(spacing)||spacing<=0)spacing=Math.Max(2f,width*.8f);
            int samples=Math.Max(1,Math.Min(maxSamples,(int)Math.Ceiling(length/spacing)));
            float period=dash+gap;
            for(int i=0;i<=samples;i++){
                float t=i/(float)samples,along=length*t;
                if(dash>0&&period>0&&along%period>dash)continue;
                stamps.Add(new AimPoint(start.x+dx*t,start.y+dy*t));
            }
            return stamps;
        }
    }

    public struct AimPreview
    {
        public AimPoint Origin;
        public float DirX,DirY,Distance,Length;
        public bool Ready,FromLauncher,Valid;
        public AimPoint[] Path;
    }

    // W17-02 (#284): world (simulation) <-> board-local view space. P2 sees the
    // arena rotated by 180 degrees around the horizontal axis (MatchPerspective).
    // BoardView draws with ToView; CoreClashApp maps pointers with the same inverse.
    public static class BoardSpace
    {
        public static AimPoint ToView(float worldX,float worldY,int viewOwner,float boardX,float boardY,float boardWidth)
        {
            float s=boardWidth/MatchPerspective.WorldWidth;
            return new AimPoint(boardX+MatchPerspective.ViewX(worldX,viewOwner)*s,boardY+MatchPerspective.ViewY(worldY,viewOwner)*s);
        }
        public static AimPoint ToWorld(float viewX,float viewY,int viewOwner,float boardX,float boardY,float boardWidth)
        {
            float s=MatchPerspective.WorldWidth/boardWidth;
            return new AimPoint(MatchPerspective.SimulationX((viewX-boardX)*s,viewOwner),MatchPerspective.SimulationY((viewY-boardY)*s,viewOwner));
        }
    }
}
