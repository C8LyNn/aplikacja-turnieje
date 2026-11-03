using System;
using System.Collections.Generic;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Physics;
namespace CoreClash.Presentation
{
    public enum StopReach { OwnZone, OwnHalf, Center, EnemyHalf, EnemyZone }

    public struct StopObstacle
    {
        public float X,Y,Radius;
        public StopObstacle(float x,float y,float radius){X=x;Y=y;Radius=radius;}
    }

    // Moving body for the free-roll estimate: the launched ball exactly as
    // GameSimulation.TryCommand leaves it (velocity, launch immunity, motion flag).
    public struct StopBody
    {
        public string Type;
        public int Owner;
        public float X,Y,Vx,Vy,Radius,MaxSpeed,WallRestitution,Sticky;
        public int AnchorStacks;
        public bool LaunchImmune,Moving;
    }

    public sealed class StopEstimate
    {
        public bool Valid;
        public StopBody Start;
        public float StopX,StopY,Seconds,TravelDistance;
        public int Frames,WallBounces,EnemyWallHits,EnemyWallDamage;
        public bool MotionGuard,Obstructed;
        public StopReach Reach;
        // Ball centre about every 1/15 s plus every wall contact, for drawing.
        public List<AimPoint> Path=new List<AimPoint>();
    }

    // CC-001 W18-01 (#286): estimated STOP point of a launch on an EMPTY arena.
    // Presentation only: it re-runs, for this one ball, the same per-frame free
    // roll as GameSimulation.Step(1/120) -> BallPhysics.Step/UpdateMotion
    // (friction, speed cap, walls and wall restitution, launcher rings, the
    // 14/.12 STOP rule, the 14 s motion guard). It does NOT predict collisions,
    // fields, structures or abilities triggered by other bodies: any of them on
    // the path marks the estimate Obstructed and the UI calls it approximate.
    // BallPhysics stays the only authority; managed tests compare both.
    public static class StopPredictor
    {
        public const float Dt=1f/120;
        public const float GuardSeconds=14;         // GameSimulation: min(28,max(14,actionDeadline)), deadline 14 at launch
        public const float StopSpeed=14,StartSpeed=18,StopHold=.12f;
        public const float BoardTop=16,BoardBottom=884;
        public const int PathEvery=8;

        // Same numbers as LaunchGesture.Release (float length, power cap 590).
        public static bool GesturePower(float dx,float dy,out float power)
        {
            float length=(float)Math.Sqrt(dx*dx+dy*dy);power=0;
            if(length<18||!GameSimulation.Finite(length))return false;
            power=Math.Min(590,length*3.38f);return true;
        }

        // A spawn from the owner's launcher, as TryCommand creates it.
        public static StopBody Spawn(BallDefinition d,int owner,float dx,float dy,float power)
        {
            float angle=(float)Math.Atan2(dx,owner==0?-dy:dy);angle=GameSimulation.Clamp(angle,-1.53589f,1.53589f);
            float vx=(float)Math.Sin(angle)*power,vy=(float)Math.Cos(angle)*power*(owner==0?-1:1);
            return new StopBody{Type=d.id,Owner=owner,X=270,Y=owner==0?853:47,Vx=vx,Vy=vy,Radius=d.radius,MaxSpeed=d.maxSpeed,WallRestitution=d.wallRestitution,
                LaunchImmune=true,Moving=Math.Sqrt(vx*vx+vy*vy)>=18};
        }

        // A Replay of an existing ball, as TryCommand applies it (earth balls lose
        // one anchor stack before the launch).
        public static StopBody Replay(BallRuntime b,string archetype,float dx,float dy,float power)
        {
            double length=Math.Sqrt((double)dx*dx+(double)dy*dy);
            if(length<.0001)length=1;
            return new StopBody{Type=b.type,Owner=b.owner,X=b.x,Y=b.y,Vx=(float)(dx/length*power),Vy=(float)(dy/length*power),Radius=b.radius,MaxSpeed=b.maxSpeed,WallRestitution=b.wallRestitution,
                Sticky=b.sticky,AnchorStacks=archetype=="earth"?Math.Max(0,b.anchorStacks-1):b.anchorStacks,LaunchImmune=true,Moving=b.moving};
        }

        public static StopEstimate Predict(StopBody start,IReadOnlyList<StopObstacle> obstacles=null)
        {
            var e=new StopEstimate{Start=start};
            if(!GameSimulation.Finite(start.X)||!GameSimulation.Finite(start.Y)||!GameSimulation.Finite(start.Vx)||!GameSimulation.Finite(start.Vy)||!GameSimulation.Finite(start.Radius)||start.Radius<=0||start.MaxSpeed<=0)return e;
            var b=start;float dt=Dt,stopHold=0,actionTime=0;int frame=0,lastWallFrame=-100;bool stopped=false;
            e.Path.Add(new AimPoint(b.X,b.Y));
            while(!stopped)
            {
                frame++;
                // BallPhysics.Step, per-ball part (empty arena: no frozen/rooted/structures).
                float f=(float)Math.Pow(b.Type=="dart"?.991:.986,dt*60);if(b.AnchorStacks>=3)f*=(float)Math.Pow(.90,dt*60);
                if(b.Sticky>0){b.Sticky=Math.Max(0,b.Sticky-dt);f*=(float)Math.Pow(.86,dt*60);}
                b.Vx*=f;b.Vy*=f;Clamp(ref b);b.X+=b.Vx*dt;b.Y+=b.Vy*dt;
                bool wall=Bounds(ref b,frame,ref lastWallFrame,e);
                LauncherRings(ref b);
                if(obstacles!=null&&!e.Obstructed)
                    foreach(var o in obstacles){float ox=b.X-o.X,oy=b.Y-o.Y,r=o.Radius+b.Radius;if(ox*ox+oy*oy<r*r){e.Obstructed=true;break;}}
                // BallPhysics.UpdateMotion
                float speed=(float)Math.Sqrt(b.Vx*b.Vx+b.Vy*b.Vy);
                if(!b.Moving){if(speed>=StartSpeed){b.Moving=true;stopHold=0;}}
                else if(speed>StopSpeed)stopHold=0;
                else{stopHold+=dt;if(stopHold>=StopHold){b.Vx=b.Vy=0;b.Moving=false;stopped=true;}}
                // GameSimulation.Step motion guard.
                actionTime+=dt;
                if(!stopped&&actionTime>=GuardSeconds){b.Vx=b.Vy=0;b.Moving=false;stopped=true;e.MotionGuard=true;}
                if(wall||stopped||frame%PathEvery==0)e.Path.Add(new AimPoint(b.X,b.Y));
                if(!b.Moving&&!stopped&&speed<StartSpeed&&frame>1){stopped=true;} // never started moving
            }
            e.Valid=true;e.StopX=b.X;e.StopY=b.Y;e.Frames=frame;e.Seconds=frame*dt;
            for(int i=1;i<e.Path.Count;i++){float dx=e.Path[i].x-e.Path[i-1].x,dy=e.Path[i].y-e.Path[i-1].y;e.TravelDistance+=(float)Math.Sqrt(dx*dx+dy*dy);}
            e.Reach=Reach(start.Owner,b.X,b.Y,b.Radius);
            return e;
        }

        // Which part of the arena the stopped ball touches (ZoneResolver rules).
        public static StopReach Reach(int owner,float x,float y,float radius)
        {
            var probe=new BallRuntime{owner=owner,x=x,y=y,radius=radius};
            if(ZoneResolver.TouchesEnemyZone(probe))return StopReach.EnemyZone;
            if(ZoneResolver.TouchesCenter(probe))return StopReach.Center;
            if(ZoneResolver.TouchesOwnZone(probe))return StopReach.OwnZone;
            bool enemyHalf=owner==0?y<450:y>450;
            return enemyHalf?StopReach.EnemyHalf:StopReach.OwnHalf;
        }

        public static string ReachLabel(StopReach r)=>r switch{StopReach.EnemyZone=>"ENEMY ZONE",StopReach.Center=>"CENTER",StopReach.EnemyHalf=>"ENEMY HALF",StopReach.OwnZone=>"YOUR ZONE",_=>"YOUR HALF"};

        // Always marked as an estimate; never as a sure hit.
        public static string Label(StopEstimate e)=>!e.Valid?"":("EST. STOP · "+ReachLabel(e.Reach)+(e.Obstructed?" · IF PATH CLEAR":""));

        // Everything else on the board that the free roll ignores.
        public static List<StopObstacle> Obstacles(GameState s,int moverId)
        {
            var list=new List<StopObstacle>();
            foreach(var x in s.balls)if(!x.dead&&!x.banished&&x.id!=moverId)list.Add(new StopObstacle(x.x,x.y,x.radius));
            foreach(var g in s.structures)if(!g.dead)list.Add(new StopObstacle(g.x,g.y,g.radius));
            foreach(var z in s.zones)if(!z.dead)list.Add(new StopObstacle(z.x,z.y,z.radius));
            return list;
        }

        static void Clamp(ref StopBody b){float v=(float)Math.Sqrt(b.Vx*b.Vx+b.Vy*b.Vy);if(v>b.MaxSpeed){b.Vx*=b.MaxSpeed/v;b.Vy*=b.MaxSpeed/v;}}

        static bool Bounds(ref StopBody b,int frame,ref int lastWallFrame,StopEstimate e)
        {
            bool any=false;
            if(b.X-b.Radius<ZoneResolver.Left){b.X=ZoneResolver.Left+b.Radius;if(b.Vx<0){Wall(ref b,"left",true,frame,ref lastWallFrame,e);any=true;}}
            if(b.X+b.Radius>ZoneResolver.Right){b.X=ZoneResolver.Right-b.Radius;if(b.Vx>0){Wall(ref b,"right",true,frame,ref lastWallFrame,e);any=true;}}
            if(b.Y-b.Radius<BoardTop){b.Y=BoardTop+b.Radius;if(b.Vy<0){Wall(ref b,"top",false,frame,ref lastWallFrame,e);any=true;}}
            if(b.Y+b.Radius>BoardBottom){b.Y=BoardBottom-b.Radius;if(b.Vy>0){Wall(ref b,"bottom",false,frame,ref lastWallFrame,e);any=true;}}
            return any;
        }

        static void Wall(ref StopBody b,string side,bool horizontal,int frame,ref int lastWallFrame,StopEstimate e)
        {
            float impact=Math.Abs(horizontal?b.Vx:b.Vy);
            if(horizontal)b.Vx=-b.Vx*b.WallRestitution;else b.Vy=-b.Vy*b.WallRestitution;
            e.WallBounces++;
            if(frame-lastWallFrame>1)
            {
                if((side=="top"&&b.Owner==0)||(side=="bottom"&&b.Owner==1)){e.EnemyWallHits++;e.EnemyWallDamage+=impact>=90?2:1;} // MatchRules.DamageBase via BallPhysics.Wall
                // AbilityResolver.OnWall: Warp crosses to the opposite side wall.
                if(b.Type=="warp"&&horizontal)b.X=side=="left"?ZoneResolver.Right-b.Radius-2:ZoneResolver.Left+b.Radius+2;
            }
            lastWallFrame=frame;Clamp(ref b);
        }

        // BallPhysics.ResolveLaunchProtection for both launcher rings.
        static void LauncherRings(ref StopBody b)
        {
            for(int owner=0;owner<2;owner++){
                float py=owner==0?853:47,dx=b.X-270,dy=b.Y-py,d=(float)Math.Sqrt(dx*dx+dy*dy),r=61+b.Radius;
                if(owner==b.Owner&&b.LaunchImmune){if(d>r+2)b.LaunchImmune=false;else continue;}
                if(d>=r||d<.001f)continue;float nx=dx/d,ny=dy/d,vel=b.Vx*nx+b.Vy*ny;b.X=270+nx*r;b.Y=py+ny*r;if(vel<0){b.Vx-=1.7f*vel*nx;b.Vy-=1.7f*vel*ny;}
            }
        }
    }
}
