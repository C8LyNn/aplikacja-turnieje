using System;
using System.Linq;
using CoreClash.Physics;
namespace CoreClash.Core
{
    public sealed partial class AbilityResolver
    {
        // The random stream is gameplay state, not transient resolver state.
        // A host-side saved state must continue the same sequence after restore.
        int RandomIndex(int count)
        {
            if (count <= 0) throw new ArgumentOutOfRangeException(nameof(count));
            uint value = S.randomState;
            if (value == 0) throw new InvalidOperationException("Invalid gameplay RNG state.");
            value ^= value << 13;
            value ^= value >> 17;
            value ^= value << 5;
            S.randomState = value;
            return (int)(value % (uint)count);
        }
        bool Free(float x,float y,float r,int ignore)
        {
            if(x-r<ZoneResolver.Left+2||x+r>ZoneResolver.Right-2||y-r<18||y+r>882)return false;
            if(Math.Sqrt((x-270)*(x-270)+(y-853)*(y-853))<r+61||Math.Sqrt((x-270)*(x-270)+(y-47)*(y-47))<r+61)return false;
            foreach(var b in Living())if(b.id!=ignore&&(b.x-x)*(b.x-x)+(b.y-y)*(b.y-y)<(b.radius+r+4)*(b.radius+r+4))return false;
            foreach(var g in S.structures)if(!g.dead&&(g.x-x)*(g.x-x)+(g.y-y)*(g.y-y)<(g.radius+r+4)*(g.radius+r+4))return false;
            return true;
        }
        bool FindPlacement(float x,float y,float r,int ignore,float search,float angle,out float px,out float py)
        {
            if(Free(x,y,r,ignore)){px=x;py=y;return true;}
            for(float ring=12;ring<=search;ring+=12)for(int i=0;i<16;i++){float a=angle+i*(float)Math.PI/8,tx=x+(float)Math.Cos(a)*ring,ty=y+(float)Math.Sin(a)*ring;if(Free(tx,ty,r,ignore)){px=tx;py=ty;return true;}}
            px=x;py=y;return false;
        }
        bool PlaceNear(BallRuntime b,float x,float y,float search)
        {
            if(!FindPlacement(x,y,b.radius,b.id,search,b.angle,out float px,out float py))return false;b.x=px;b.y=py;return true;
        }
        ZoneRuntime CreateTrap(BallRuntime b,string kind,float x,float y,float radius,float search=62)
        {
            if(S.zones.Count(z=>!z.dead)>=256||!FindPlacement(x,y,radius,b.id,search,b.angle,out float px,out float py))return null;
            var z=CreateZone(b,kind,radius,-1);z.x=px;z.y=py;z.trap=true;return z;
        }
        void SpatialStop(BallRuntime b)
        {
            switch(b.type){
                case "anchor":b.anchorStacks=3;b.vx=b.vy=0;break;
                case "vinehook":if(b.lastAbilityTurn!=S.turnNumber){var target=Near(b,165,false).FirstOrDefault(x=>x.anchorStacks<3);if(target!=null){b.lastAbilityTurn=S.turnNumber;Impulse(target,b.x,b.y,300);sim.Emit("PULL",target,"Vinehook");}}break;
                case "harpoon":var far=Near(b,230,false).LastOrDefault();if(far!=null){Impulse(far,b.x,b.y,690);sim.Emit("PULL",far,"Harpoon");}break;
                case "vortexmedic":var enemies=Near(b,165,false);foreach(var e in enemies)Impulse(e,b.x,b.y,390);var hurt=Living().Where(x=>x.owner==b.owner&&Dist(b,x)<=165&&x.hp<x.maxHp).OrderBy(x=>(float)x.hp/x.maxHp).FirstOrDefault();if(enemies.Length>0&&hurt!=null)sim.Heal(hurt,Math.Min(10,enemies.Length*5));break;
                case "web":CreateTrap(b,"web",b.x+55,b.y,14);CreateTrap(b,"web",b.x-55,b.y,14);CreateTrap(b,"web",b.x,b.y+55,14);CreateTrap(b,"web",b.x,b.y-55,14);break;
                case "gravitymine":foreach(var z in S.zones)if(z.sourceId==b.id&&z.kind=="gravitymine")z.dead=true;CreateTrap(b,"gravitymine",b.x,b.y,100);break;
                case "gatekeeper":CreatePortals(b);break;
                case "magnet":case "pulse":foreach(var t in Near(b,165)){float fall=.45f+.55f*(1-Dist(b,t)/165);Impulse(t,b.type=="magnet"?b.x:2*t.x-b.x,b.type=="magnet"?b.y:2*t.y-b.y,(b.type=="magnet"?520:500)*fall);}break;
            }
        }
        void CreatePortals(BallRuntime b)
        {
            foreach(var z in S.zones)if(z.sourceId==b.id&&z.kind=="portal")z.dead=true;
            float ax=b.x,ay=b.y,bx=540-b.x,by=900-b.y;
            if(!FindPlacement(ax,ay,25,0,82,b.angle,out ax,out ay))return;
            if(Math.Sqrt((ax-bx)*(ax-bx)+(ay-by)*(ay-by))<150){bx=270+(float)Math.Cos(b.angle)*157;by=450+(float)Math.Sin(b.angle)*225;}
            if(!FindPlacement(bx,by,25,0,120,b.angle,out bx,out by))return;
            var a=CreateZone(b,"portal",25,-1);a.x=ax;a.y=ay;a.exitX=bx;a.exitY=by;
            var c=CreateZone(b,"portal",25,-1);c.x=bx;c.y=by;c.exitX=ax;c.exitY=ay;a.pairId=c.id;c.pairId=a.id;
        }
        void GlobalSpatialTurn(){foreach(var z in S.zones.Where(x=>!x.dead&&x.kind=="blackHole")){z.radius*=1.2f;z.coreRadius*=1.1f;z.pull=Math.Min(1050,z.pull*1.035f);}}
        void SpatialTurn(BallRuntime b){}
        void SpatialStep(float dt)
        {
            foreach(var z in S.zones.Where(x=>!x.dead).ToArray()){
                if(z.kind=="portal"){
                    foreach(var b in Living()){
                        float dx=b.x-z.x,dy=b.y-z.y,r=z.radius+b.radius*.55f;if(b.portalCooldown>S.time||dx*dx+dy*dy>r*r)continue;
                        float angle=BallPhysics.Speed(b)>10?(float)Math.Atan2(b.vy,b.vx):b.angle;
                        if(!PlaceNear(b,z.exitX+(float)Math.Cos(angle)*(25+b.radius+5),z.exitY+(float)Math.Sin(angle)*(25+b.radius+5),110))continue;
                        b.vx*=.92f;b.vy*=.92f;b.portalCooldown=S.time+.48f;sim.Emit("PORTAL",b,"Portal transit");
                    }
                }else if(ElementTrap(z.kind)){
                    TriggerElementTrap(z);
                }else if(z.kind=="web"){
                    var target=Living().FirstOrDefault(b=>b.owner!=z.owner&&(b.x-z.x)*(b.x-z.x)+(b.y-z.y)*(b.y-z.y)<(z.radius+b.radius)*(z.radius+b.radius));if(target!=null){Root(target);z.dead=true;}
                }else if(z.kind=="gravitymine"){
                    foreach(var b in Living().Where(b=>b.id!=z.sourceId)){float d=(float)Math.Sqrt((b.x-z.x)*(b.x-z.x)+(b.y-z.y)*(b.y-z.y));if(d>z.radius)continue;Impulse(b,z.x,z.y,70*dt);if(b.owner!=z.owner){z.dead=true;var source=S.balls.FirstOrDefault(x=>x.id==z.sourceId);if(source!=null){var blast=new BallRuntime{id=source.id,owner=z.owner,type="gravitymine",x=z.x,y=z.y};Explode(blast,100,14,390);sim.Kill(source);}break;}}
                }else if(z.kind=="blackHole"){
                    foreach(var b in Living()){
                        float dx=z.x-b.x,dy=z.y-b.y,d=(float)Math.Sqrt(dx*dx+dy*dy),swallow=Math.Max(z.coreRadius,z.radius*.145f)+b.radius*.34f;
                        if(d<swallow){Consume(z.owner,z.sourceId,b);if(++z.swallowed>=10){z.dead=true;break;}}
                        else if(d<z.radius)Impulse(b,z.x,z.y,(.24f+.76f*(1-d/z.radius))*z.pull*dt);
                    }
                }
            }
        }
    }
}
