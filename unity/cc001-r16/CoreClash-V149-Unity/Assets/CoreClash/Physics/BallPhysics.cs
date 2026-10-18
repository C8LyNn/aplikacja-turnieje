using System;
using System.Linq;
using System.Collections.Generic;
using CoreClash.Core;
namespace CoreClash.Physics
{
    public sealed class BallPhysics
    {
        readonly GameSimulation sim;
        readonly HashSet<long> previousStructureContacts = new HashSet<long>();
        readonly HashSet<long> thisStructureContacts = new HashSet<long>();
        public BallPhysics(GameSimulation s){sim=s;}
        public static float Speed(BallRuntime b)=>(float)Math.Sqrt(b.vx*b.vx+b.vy*b.vy);
        public static void ClampSpeed(BallRuntime b){float v=Speed(b);if(v>b.maxSpeed){b.vx*=b.maxSpeed/v;b.vy*=b.maxSpeed/v;}}
        public void Step(float dt)
        {
            sim.Abilities.OnStep(dt);
            thisStructureContacts.Clear();
            foreach(var b in sim.State.balls.ToArray()){
                if(b.dead||b.banished)continue;b.spawnGrace=Math.Max(0,b.spawnGrace-dt);
                if(b.frozen>0){if(sim.State.phase==MatchPhase.Moving){b.frozen=Math.Max(0,b.frozen-dt);if(b.frozen==0)b.statusOrder.RemoveAll(x=>x.family=="ICE");}b.vx=b.vy=0;}
                if(b.rooted)b.vx=b.vy=0;
                float f=(float)Math.Pow(b.type=="dart"?.991:.986,dt*60);if(b.anchorStacks>=3)f*=(float)Math.Pow(.90,dt*60);
                if(b.sticky>0){b.sticky=Math.Max(0,b.sticky-dt);f*=(float)Math.Pow(.86,dt*60);}b.vx*=f;b.vy*=f;ClampSpeed(b);b.x+=b.vx*dt;b.y+=b.vy*dt;
                ResolveBounds(b);ResolveLaunchProtection(b);ResolveStructures(b);
            }
            previousStructureContacts.Clear();
            previousStructureContacts.UnionWith(thisStructureContacts);
            var balls=sim.State.balls.ToArray();for(int i=0;i<balls.Length;i++)for(int j=i+1;j<balls.Length;j++)sim.Collisions.Resolve(balls[i],balls[j]);
            foreach(var b in sim.State.balls.ToArray())if(!b.dead)UpdateMotion(b,dt);
        }
        public void UpdateMotion(BallRuntime b,float dt)
        {
            float speed=Speed(b);b.motionPeak=Math.Max(b.motionPeak,speed);
            if(!b.moving){if(speed>=18){b.moving=true;b.stopHold=0;b.startCount++;sim.Emit("START",b,"Motion");}return;}
            if(speed>14){b.stopHold=0;if(speed>18)b.angle=(float)Math.Atan2(b.vy,b.vx);return;}
            b.stopHold+=dt;if(b.stopHold<.12f)return;b.vx=b.vy=0;b.moving=false;b.stopHold=0;b.stopCount++;b.phased=false;sim.Emit("STOP",b,"Stop");sim.Abilities.OnStop(b);
        }
        void ResolveBounds(BallRuntime b)
        {
            if(b.x-b.radius<ZoneResolver.Left){b.x=ZoneResolver.Left+b.radius;if(b.vx<0)Wall(b,"left",Math.Abs(b.vx),true);}
            if(b.x+b.radius>ZoneResolver.Right){b.x=ZoneResolver.Right-b.radius;if(b.vx>0)Wall(b,"right",Math.Abs(b.vx),true);}
            if(b.y-b.radius<16){b.y=16+b.radius;if(b.vy<0)Wall(b,"top",Math.Abs(b.vy),false);}
            if(b.y+b.radius>884){b.y=884-b.radius;if(b.vy>0)Wall(b,"bottom",Math.Abs(b.vy),false);}
        }
        void Wall(BallRuntime b,string side,float impact,bool horizontal)
        {
            float restitution=b.wallRestitution;if(horizontal)b.vx=-b.vx*restitution;else b.vy=-b.vy*restitution;
            if(sim.State.frame-b.lastWallFrame>1){bool hit=impact>=90;sim.Emit(hit?"WALL_HIT":"WALL_TOUCH",b,side);if(side=="top"&&b.owner==0)sim.Rules.DamageBase(1,hit?2:1);if(side=="bottom"&&b.owner==1)sim.Rules.DamageBase(0,hit?2:1);sim.Abilities.OnWall(b,side,hit);}
            b.lastWallFrame=sim.State.frame;ClampSpeed(b);
        }
        void ResolveLaunchProtection(BallRuntime b)
        {
            for(int owner=0;owner<2;owner++){
                float py=owner==0?853:47,dx=b.x-270,dy=b.y-py,d=(float)Math.Sqrt(dx*dx+dy*dy),r=61+b.radius;
                if(owner==b.owner&&b.launchImmune){if(d>r+2)b.launchImmune=false;else continue;}
                if(d>=r||d<.001f)continue;float nx=dx/d,ny=dy/d,vel=b.vx*nx+b.vy*ny;b.x=270+nx*r;b.y=py+ny*r;if(vel<0){b.vx-=1.7f*vel*nx;b.vy-=1.7f*vel*ny;}
            }
        }
        void ResolveStructures(BallRuntime b)
        {
            if (b.phased) return;
            foreach (var g in sim.State.structures)
            {
                if (g.dead) continue;
                float dx = b.x - g.x, dy = b.y - g.y;
                float d = (float)Math.Sqrt(dx * dx + dy * dy), r = b.radius + g.radius;
                if (d >= r) continue;
                long key = ((long)g.id << 32) | (uint)b.id;
                thisStructureContacts.Add(key);
                bool fresh = !previousStructureContacts.Contains(key);
                float nx = d > .0001f ? dx / d : 1, ny = d > .0001f ? dy / d : 0;
                float vel = b.vx * nx + b.vy * ny;
                b.x = g.x + nx * r; b.y = g.y + ny * r;
                if (vel < 0)
                {
                    b.vx -= (1 + g.restitution) * vel * nx;
                    b.vy -= (1 + g.restitution) * vel * ny;
                    if (fresh && -vel >= 90 && b.owner != g.owner)
                        sim.Structures.Damage(g, 1, b);
                    if (fresh && g.kind == "bumper") sim.Emit("BOUNCE", b, "Bumper rebound");
                    ClampSpeed(b);
                }
            }
        }
    }
}
