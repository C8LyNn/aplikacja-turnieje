using System;
using System.Linq;
namespace CoreClash.Core
{
    public sealed partial class AbilityResolver
    {
        public void EmitReturn(BallRuntime source,BallRuntime target)
        {
            if(target==null||Token(target))return;sim.Emit("RETURN",target,"Returned",source?.id??0);
            foreach(var b in Living().Where(x=>x.owner==target.owner)){
                if(b.type=="packheart"&&PerTargetTurn(b,target))sim.Shield(target,5);
                if(b.type!="gravehide"||b.lastReturnTurn==S.turnNumber)continue;
                b.lastReturnTurn=S.turnNumber;b.returnStacks=Math.Min(3,b.returnStacks+1);
                var line=S.lineages.FirstOrDefault(x=>x.id==b.lineageId);if(line==null){line=new LineageRecord{id=b.lineageId};S.lineages.Add(line);}line.returnStacks=b.returnStacks;
                if(b.returnStacks>=3&&!b.ancestral){b.ancestral=line.ancestral=true;b.maxHp+=10;b.hp=Math.Min(b.maxHp,b.hp+10);b.mass+=.2f;b.radius*=1.1f;sim.Emit("UPGRADE",b,"ANCESTRAL");}
            }
        }
        void DeathObservers(BallRuntime dead)
        {
            foreach(var listener in Living()){
                if(listener.type=="collector"&&!listener.collection.Contains(dead.type)){
                    listener.collection.Add(dead.type);listener.maxHp=Math.Min(40,sim.Catalog.Ball("collector").hp+Math.Min(20,((listener.collection.Count+2)/3)*5));sim.Heal(listener,5);sim.Emit("COLLECT",listener,dead.type);
                }
                if(listener.type=="vector"&&listener.owner!=dead.owner&&dead.toxinTurns>0&&listener.lastVectorTurn!=S.turnNumber){
                    var clean=Living().Where(x=>x.owner!=listener.owner&&x.toxinTurns==0&&Dist(x,dead)<=165).OrderBy(x=>Dist(x,dead)).FirstOrDefault();
                    if(clean!=null){listener.lastVectorTurn=S.turnNumber;ApplyToxin(clean,listener.owner);}
                }
            }
        }
        bool DeathSupported(string type)=>new[]{"bonfire","wildfire","soulburst","cascade","singularity","genesis","bomb","deathpulse","frostgrave","martyr","plagueburst","eggsac","swarmcore","conscriptor"}.Contains(type);
        bool TriggerDeathEffect(BallRuntime b)
        {
            if(!DeathSupported(b.type))return false;
            switch(b.type){
                case "bonfire":foreach(var t in Near(b,100)){if(t.owner==b.owner)sim.Heal(t,5);else{sim.Damage(t,10,false,b.id);ApplyFire(t,b.owner);}}sim.Emit("BONFIRE",b,"Heal allies / burn enemies");break;
                case "wildfire":CreateZone(b,"fire",104,3);break;
                case "soulburst":int damage=GameSimulation.Round(Math.Min(10,4+(b.maxHp-Math.Max(0,b.hp))*.30f));foreach(var t in Near(b,100,false))sim.Damage(t,damage,false,b.id);sim.Emit("SOULBURST",b,"Missing HP burst");break;
                case "cascade":CascadeReturn(b);break;
                case "singularity":var hole=CreateZone(b,"blackHole",34,-1);hole.coreRadius=12;hole.pull=690;break;
                case "genesis":CreateZone(b,"whiteHole",36,3);break;
                case "bomb":if(!b.dead||!b.exploded){if(b.dead)b.exploded=true;Explode(b,165,17,405);}break;
                case "deathpulse":foreach(var t in Near(b,100))Impulse(t,2*t.x-b.x,2*t.y-b.y,300);break;
                case "frostgrave":CreateZone(b,"ice",104,3);break;
                case "martyr":S.players[b.owner].hp=Math.Min(20,S.players[b.owner].hp+3);break;
                case "plagueburst":foreach(var t in Near(b,100,false))ApplyToxin(t,b.owner);break;
                case "eggsac":SpawnEggSacBroodlings(b);break;
                case "swarmcore":SpawnSwarmShards(b);break;
                case "conscriptor":ConscriptorDeath(b);break;
            }
            return true;
        }
        void LifecycleStop(BallRuntime b)
        {
            if(b.type=="requiem")foreach(var ally in Near(b,100,true).Where(x=>DeathSupported(x.type)).Take(3))TriggerDeathEffect(ally);
            if(b.type=="reclaimer"&&!b.abilityUsed&&b.hp>10){var grave=S.graveyard.FirstOrDefault(x=>x.owner==b.owner);if(grave!=null&&Revive(b,grave,15)!=null){b.abilityUsed=true;sim.Damage(b,10);}}
            if(b.type=="resurrector"&&!b.abilityUsed){var grave=S.graveyard.LastOrDefault(x=>x.owner==b.owner);if(grave!=null&&Revive(b,grave,10)!=null)b.abilityUsed=true;}
        }
        void LifecycleTurn(BallRuntime b)
        {
            if(b.type=="plagueleech"&&b.linkedTargetId>0){var target=Living().FirstOrDefault(x=>x.id==b.linkedTargetId&&x.owner!=b.owner&&x.toxinTurns>0);if(target==null){b.linkedTargetId=0;return;}int lost=Math.Min(5,target.hp);target.hp-=lost;b.hp=Math.Min(b.maxHp,b.hp+lost);sim.Emit("DRAIN",b,"Drain "+lost,target.id);if(target.hp<=0)sim.Kill(target);}
            if(b.type=="brood"&&b.spawnCount<5){if(Generate(b,"broodling",5,5,b.spawnCount*.7f)!=null){b.spawnCount++;b.hp=Math.Max(0,b.hp-5);if(b.spawnCount>=5)b.hp=0;if(b.hp<=0)sim.Kill(b);}}
            if(b.type=="necromancer"&&b.spawnCount<2&&b.ownTurnCounter%3==0){var grave=S.graveyard.Where(x=>x.owner==b.owner).ToArray();if(grave.Length>0&&Revive(b,grave[RandomIndex(grave.Length)],5)!=null)b.spawnCount++;}
        }
        BallRuntime CascadeReturn(BallRuntime parent)
        {
            int next=parent.maxHp>=20?10:parent.maxHp>=10?5:0;if(next==0)return null;
            var child=Generate(parent,"cascade",next,next);if(child==null)return null;child.lineageId=parent.lineageId;child.life=parent.life+1;child.generated=false;EmitReturn(parent,child);return child;
        }
        BallRuntime Generate(BallRuntime parent,string type,int hp,int maxHp,float offset=0)
        {
            if(Living().Length>=256)return null;var definition=sim.Catalog.Ball(type);if(definition==null)return null;
            if(!FindPlacement(parent.x,parent.y,definition.radius,0,180,parent.angle+offset,out float x,out float y))return null;
            var b=sim.Spawn(parent.owner,type,x,y);b.maxHp=maxHp;b.hp=Math.Min(hp,maxHp);b.generated=definition.hidden;b.spawnGrace=.32f;b.angle=parent.angle;S.replayedIds.Add(b.id);return b;
        }
        BallRuntime Revive(BallRuntime source,GraveRecord record,int hp)
        {
            var child=Generate(source,record.type,hp,record.maxHp);if(child==null)return null;child.lineageId=record.lineageId;child.life=record.life+1;child.reviveGeneration=1;child.generated=false;
            var saved=S.lineages.FirstOrDefault(x=>x.id==child.lineageId);if(saved!=null){child.returnStacks=saved.returnStacks;child.ancestral=saved.ancestral;if(child.ancestral){child.maxHp=Math.Max(child.maxHp,sim.Catalog.Ball(child.type).hp+10);child.mass+=.2f;child.radius*=1.1f;}}
            S.graveyard.Remove(record);EmitReturn(source,child);return child;
        }
        public void Consume(int owner,int sourceId,BallRuntime target)
        {
            if(target==null||target.dead||!S.balls.Remove(target))return;S.replayedIds.Remove(target.id);foreach(var z in S.zones)if(z.sourceId==target.id&&(z.kind=="portal"||z.trap))z.dead=true;
            S.virulence.RemoveAll(x=>x.sourceLineage==target.lineageId||x.targetLineage==target.lineageId);sim.Emit("CONSUME",target,"Consumed",sourceId);
            if(target.owner==owner||Token(target))return;
            foreach(var listener in Living().Where(b=>b.type=="horizonrelay"&&b.owner==owner))if(++listener.horizon>=3){listener.horizon=0;sim.Rules.DamageBase(1-owner,1);sim.Emit("HORIZON",listener,"Three consumes → base damage");}
        }
        void Explode(BallRuntime source,float radius,int damage,float force)
        {
            foreach(var b in Living()){
                if(b.id==source.id)continue;float d=Dist(source,b);if(d>=radius)continue;float fall=Math.Max(.2f,1-d/radius);Impulse(b,2*b.x-source.x,2*b.y-source.y,force*fall);sim.Damage(b,GameSimulation.Round(damage*(.45f+.55f*fall)),false,source.id);
            }
            sim.Emit("EXPLOSION",source,"Area explosion");
        }
    }
}
