using System;
using System.Linq;
using CoreClash.Physics;

namespace CoreClash.Core
{
    public sealed partial class AbilityResolver
    {
        void MomentumContact(BallRuntime a,BallRuntime b,bool hit,float impact)
        {
            if(a.type!="ram"||a.owner==b.owner||!hit||a.lastRamAction==S.actionSerial)return;
            a.lastRamAction=S.actionSerial;
            float bonus=Math.Min(7,2.5f+impact*.010f);
            sim.Damage(b,GameSimulation.Round(bonus),true,a.id);
            sim.Damage(a,GameSimulation.Round(bonus*.25f),true,a.id);
            Impulse(b,2*b.x-a.x,2*b.y-a.y,118);
            sim.Emit("RAM",a,"Ram impact",b.id);
        }

        void MomentumStop(BallRuntime b)
        {
            if(b.type=="pinballer")PlaceBumper(b);
            else if(b.type=="slingshot")LaunchAllies(b);
        }

        void PlaceBumper(BallRuntime b)
        {
            const float radius=20;
            if(sim.Structures.ActiveCount>=StructureSystem.MaxLive){sim.Emit("PLACEMENT_BLOCKED",b,"Structure limit reached");return;}
            var sides=new[]{0,1,2,3}.OrderBy(side=>side==0?b.x-ZoneResolver.Left:side==1?ZoneResolver.Right-b.x:side==2?b.y-16:884-b.y).ToArray();
            foreach(int side in sides)foreach(float inward in new[]{0f,10,22,36})foreach(float tangent in new[]{0f,30,-30,60,-60,90,-90,120,-120,180,-180,240,-240}){
                float x=side==0?ZoneResolver.Left+radius+5+inward:side==1?ZoneResolver.Right-radius-5-inward:b.x+tangent;
                float y=side==2?16+radius+5+inward:side==3?884-radius-5-inward:b.y+tangent;
                x=GameSimulation.Clamp(x,ZoneResolver.Left+radius+3,ZoneResolver.Right-radius-3);y=GameSimulation.Clamp(y,16+radius+3,884-radius-3);
                if(sim.Structures.IsFree(x,y,radius)){AddBumper(b,x,y);return;}
            }
            if(sim.Structures.FindPlacement(b.x,b.y,radius,b.id,160,b.angle+(float)Math.PI,out float px,out float py)){AddBumper(b,px,py);return;}
            sim.Emit("PLACEMENT_BLOCKED",b,"No room for a bumper");
        }
        void AddBumper(BallRuntime source,float x,float y)
        {
            sim.Structures.TryCreate(source,"bumper",x,y,20,5,1.42f);
        }

        void LaunchAllies(BallRuntime source)
        {
            var allies=Near(source,165,true).Where(b=>!b.rooted&&b.frozen<=0).OrderBy(b=>b.id).ToArray();
            int launched=0;
            for(int i=0;i<allies.Length;i++){
                var ally=allies[i];float ring=i*(float)Math.PI*2/allies.Length,distance=source.radius+ally.radius+8;
                float tx=source.x+(float)Math.Cos(ring)*distance,ty=source.y+(float)Math.Sin(ring)*distance;
                if(!FindPlacement(tx,ty,ally.radius,ally.id,32,ring,out float px,out float py))continue;
                float spread=(i-(allies.Length-1)/2f)*Math.Min(.09f,.38f/Math.Max(1,allies.Length)),angle=source.angle+spread;
                ally.x=px;ally.y=py;float power=330*CollisionResolver.ForceScale(ally);
                ally.vx=(float)Math.Cos(angle)*power;ally.vy=(float)Math.Sin(angle)*power;BallPhysics.ClampSpeed(ally);launched++;
            }
            if(launched>0){
                // A new physical launch late in an action needs its own settling window.
                // Preserve every STOP trigger; keep a hard cap so chained launchers cannot stall forever.
                if(S.phase==MatchPhase.Moving)S.actionDeadline=Math.Min(28,Math.Max(S.actionDeadline,S.actionTime+8));
                sim.Emit("SLINGSHOT",source,"Launched allies: "+launched);
            }
        }
    }
}
