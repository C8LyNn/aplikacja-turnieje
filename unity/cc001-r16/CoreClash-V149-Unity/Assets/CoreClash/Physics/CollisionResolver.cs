using System;
using System.Collections.Generic;
using CoreClash.Core;
namespace CoreClash.Physics
{
    public sealed class CollisionResolver
    {
        readonly GameSimulation sim;
        readonly Dictionary<long,int> contacts=new Dictionary<long,int>();
        public CollisionResolver(GameSimulation s){sim=s;}
        public static int ImpactDamage(float impact){if(impact<=90)return 0;float t=GameSimulation.Clamp((impact-90)/340,0,1);return Math.Max(1,GameSimulation.Round(1+15*(float)Math.Pow(t,1.18)));}
        // Mirror V148: real Earth stacks take precedence over the defensive
        // Frostguard anchor for force resistance; a plain anchor yields 0.30.
        public static float ForceScale(BallRuntime b)=>b.rooted?0:b.anchorStacks>0?Math.Max(.34f,1-b.anchorStacks*.22f):b.frostguardAnchored ? 0.30f : 1f;
        // Keep the existing >=3 Earth-stack mass effect while honoring the
        // independent defensive Frostguard anchor without synthetic stacks.
        public static float Mass(BallRuntime b)=>b.mass*(b.frostguardAnchored||b.anchorStacks>=3?2f:1f)*(1+b.anchorStacks*.35f);
        float SizeForce(BallRuntime b){string k=sim.Catalog.Ball(b.type).size;return k=="small"?.8f:k=="large"?1.28f:1;}
        public void Resolve(BallRuntime a,BallRuntime b)
        {
            if(a.dead||b.dead||a.banished||b.banished||a.phased||b.phased||a.spawnGrace>0||b.spawnGrace>0)return;
            float dx=b.x-a.x,dy=b.y-a.y,r=a.radius+b.radius,d2=dx*dx+dy*dy;if(d2>=r*r)return;
            float d=(float)Math.Sqrt(d2),nx=d>.0001f?dx/d:1,ny=d>.0001f?dy/d:0,avx=a.vx,avy=a.vy,bvx=b.vx,bvy=b.vy,closing=Math.Max(0,(avx-bvx)*nx+(avy-bvy)*ny);
            long key=((long)Math.Min(a.id,b.id)<<32)|(uint)Math.Max(a.id,b.id);bool fresh=!contacts.TryGetValue(key,out int seen)||seen<sim.State.frame-1;contacts[key]=sim.State.frame;
            float ma=Mass(a),mb=Mass(b),overlap=r-d;
            if(a.rooted&&!b.rooted){b.x+=nx*overlap;b.y+=ny*overlap;}else if(b.rooted&&!a.rooted){a.x-=nx*overlap;a.y-=ny*overlap;}else if(!a.rooted&&!b.rooted){a.x-=nx*overlap*mb/(ma+mb);a.y-=ny*overlap*mb/(ma+mb);b.x+=nx*overlap*ma/(ma+mb);b.y+=ny*overlap*ma/(ma+mb);}
            if(closing>0){float e=Math.Min(1.18f,Math.Max(a.restitution,b.restitution)),j=(1+e)*closing/(1/ma+1/mb);a.vx-=j*nx/ma;a.vy-=j*ny/ma;b.vx+=j*nx/mb;b.vy+=j*ny/mb;BallPhysics.ClampSpeed(a);BallPhysics.ClampSpeed(b);}
            if(fresh){bool hit=closing>=90,aSource=Math.Max(0,avx*nx+avy*ny)>=Math.Max(0,-bvx*nx-bvy*ny);sim.Emit(hit?"HIT":"TOUCH",a,hit?"Strong contact":"Contact",b.id);sim.Abilities.OnPairContact(a,b,hit,aSource,closing);}
            if(a.owner!=b.owner&&closing>90){int damage=ImpactDamage(closing),da=Math.Max(1,Math.Min(20,GameSimulation.Round(damage*GameSimulation.Clamp(mb/ma,.72f,1.38f)*SizeForce(b)))),db=Math.Max(1,Math.Min(20,GameSimulation.Round(damage*GameSimulation.Clamp(ma/mb,.72f,1.38f)*SizeForce(a))));sim.Damage(a,da,true,b.id);sim.Damage(b,db,true,a.id);}
        }
    }
}
