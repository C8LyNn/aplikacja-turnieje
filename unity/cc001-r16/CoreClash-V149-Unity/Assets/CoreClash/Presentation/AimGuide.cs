using System;
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
    }
}
