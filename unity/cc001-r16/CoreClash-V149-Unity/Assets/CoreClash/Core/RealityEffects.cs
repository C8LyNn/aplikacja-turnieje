using System;
using System.Linq;
namespace CoreClash.Core
{
    public sealed partial class AbilityResolver
    {
        bool RealityContact(BallRuntime a,BallRuntime b,bool hit,bool source)
        {
            if(a.owner==b.owner)return false;
            switch(a.type){
                case "traitor":if(a.identityUsed)return false;int owner=a.owner;a.owner=b.owner;b.owner=owner;Transmute(a,"normal");a.identityUsed=true;sim.Emit("OWNERSHIP",a,"Traitor exchanged sides",b.id);return true;
                case "doppelganger":if(a.identityUsed)return false;Transmute(a,b.type,b);a.identityUsed=true;sim.Emit("COPY",a,"Copied enemy identity",b.id);return true;
                case "mimic":if(a.identityUsed)return false;Transmute(a,b.type,b);Transmute(b,"normal");a.identityUsed=true;sim.Emit("TRANSFORM",a,"Stole enemy identity",b.id);return true;
                case "assimilator":if(a.identityUsed)return false;Transmute(b,"assimilator");b.hp=Math.Min(b.maxHp,a.hp);a.identityUsed=true;sim.Emit("TRANSFORM",b,"Assimilated; owner retained");return true;
                case "banish":if(a.hitUsed)return false;a.hitUsed=true;b.banished=true;b.banishedUntilTurn=S.turnNumber+3;b.vx=b.vy=0;sim.Emit("BANISH",b,"Exiled for three turns");return true;
            }
            return false;
        }
        void Transmute(BallRuntime b,string type,BallRuntime template=null)
        {
            var definition=sim.Catalog.Ball(type);float ratio=Math.Max(.15f,(float)b.hp/Math.Max(1,b.maxHp));
            int maxHp=template?.maxHp??definition.hp;float radius=template?.radius??definition.radius,mass=template?.mass??definition.mass,restitution=template?.restitution??definition.restitution,wall=template?.wallRestitution??definition.wallRestitution,maxSpeed=template?.maxSpeed??definition.maxSpeed;
            b.type=type;b.maxHp=maxHp;b.hp=Math.Min(maxHp,Math.Max(5,GameSimulation.Round(maxHp*ratio/5)*5));b.radius=radius;b.mass=mass;b.restitution=restitution;b.wallRestitution=wall;b.maxSpeed=maxSpeed;
            b.lastRamAction=-1;b.lastElementalTurn=-1;b.frostguardAnchored=false;
            b.quartermasterTurnCounter=0;b.lastReinforcementTurn=-1;b.splitDone=false;
            b.hatcheryTurnCounter=0;b.hatcherySpawnCount=0;b.replicatorTurnCounter=0;b.lastEvolutionTurn=-1;b.mitosisSplit=false;b.veteranUpgrades=0;
            b.timeBombArmed=false;b.timeBombCounter=0;b.timeBombLastTickTurn=-1;b.exploded=false;
            ClearFire(b);ClearIce(b);ClearToxin(b);b.rooted=false;b.sticky=0;b.jammed=0;b.anchorStacks=0;b.growthStage=0;b.packFury=0;b.huntTargetId=0;b.mineArmed=false;b.phased=false;b.divineShield=type=="halo";b.abilityUsed=false;b.affectedIds.Clear();b.turnAffectedIds.Clear();b.collection.Clear();b.chronoSave=b.paradoxSave=null;
            S.virulence.RemoveAll(v=>v.sourceLineage==b.lineageId||v.targetLineage==b.lineageId);
            sim.Emit("IDENTITY",b,definition.name);
        }
        void RealityStop(BallRuntime b)
        {
            switch(b.type){
                case "timeshift":case "swap":var enemy=Near(b,100,false).FirstOrDefault();if(enemy!=null){float x=b.x,y=b.y;b.x=enemy.x;b.y=enemy.y;enemy.x=x;enemy.y=y;sim.Emit("SWAP",b,"Positions exchanged",enemy.id);}break;
                case "chronomancer":if(b.chronoSave==null){b.chronoSave=Save(b);sim.Emit("SAVE",b,"Chronomancer saved state");}else{Restore(b,b.chronoSave);b.chronoSave=null;}break;
                case "paradox":if(b.paradoxSave!=null)Restore(b,b.paradoxSave);break;
                case "wildcard":var pool=sim.Catalog.Data.balls.Where(d=>!d.hidden&&d.id!="normal"&&d.id!=b.type&&d.tier!="unique").ToArray();if(pool.Length>0)Transmute(b,pool[RandomIndex(pool.Length)].id);break;
                case "echo":foreach(var target in Near(b,165).Where(x=>x.type!="echo"&&(sim.Catalog.Ability(sim.Catalog.Ball(x.type).abilityId)?.events??Array.Empty<string>()).Contains("STOP")))Stop(target,true);sim.Emit("ECHO",b,"Repeated nearby STOP effects");break;
                case "collector":CollectSignature(b);break;
            }
        }
        void CollectSignature(BallRuntime collector)
        {
            if(collector.collection.Count==0){sim.Shield(collector,5,10);return;}
            string type=collector.collection[RandomIndex(collector.collection.Count)];sim.Emit("SIGNATURE",collector,"Collected: "+sim.Catalog.Ball(type).name);
            var target=Near(collector,230,false).FirstOrDefault();
            if(type=="ice"||type=="chainfrost"||type=="frostgrave"){if(target!=null)ApplyIce(target,collector.owner);return;}
            if(type=="fire"||type=="kindler"||type=="furnace"){if(target!=null)ApplyFire(target,collector.owner);return;}
            if(type=="plague"||type=="plagueleech"||type=="blightpool"||type=="vector"){if(target!=null)ApplyToxin(target,collector.owner);return;}
            var proxy=new BallRuntime{id=collector.id,owner=collector.owner,type=type,x=collector.x,y=collector.y,hp=collector.hp,maxHp=collector.maxHp,radius=collector.radius,mass=collector.mass,maxSpeed=collector.maxSpeed,lineageId=collector.lineageId,angle=collector.angle};
            if(DeathSupported(type)){TriggerDeathEffect(proxy);return;}
            if((sim.Catalog.Ability(sim.Catalog.Ball(type).abilityId)?.events??Array.Empty<string>()).Contains("STOP")&&type!="collector"&&type!="echo"){Stop(proxy,true);return;}
            sim.Emit("DATA_ONLY_SIGNATURE",collector,type+" signature not migrated");
        }
    }
}
