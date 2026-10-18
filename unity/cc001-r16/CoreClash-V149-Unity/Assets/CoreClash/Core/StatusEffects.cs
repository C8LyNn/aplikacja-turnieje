using System;
using System.Linq;
namespace CoreClash.Core
{
    public sealed partial class AbilityResolver
    {
        void Stamp(BallRuntime b,string family,int owner){var stamp=b.statusOrder.FirstOrDefault(x=>x.family==family);if(stamp==null)b.statusOrder.Add(new StatusStamp{family=family,order=++S.statusClock,owner=owner});else stamp.owner=owner;}
        void ClearFire(BallRuntime b){b.fireStacks=b.burnTurns=0;b.statusOrder.RemoveAll(x=>x.family=="FIRE");}
        void ClearIce(BallRuntime b){b.iceStacks=b.iceTurns=0;b.frozen=0;b.statusOrder.RemoveAll(x=>x.family=="ICE");}
        void ClearToxin(BallRuntime b){b.toxinTurns=0;b.statusOrder.RemoveAll(x=>x.family=="TOXIN");S.virulence.RemoveAll(x=>x.targetLineage==b.lineageId);}
        public void ApplyFire(BallRuntime b,int owner){ApplyFireChain(b,owner,new System.Collections.Generic.HashSet<int>());}
        void ApplyFireChain(BallRuntime b,int owner,System.Collections.Generic.HashSet<int> visited)
        {
            if(b.dead||!visited.Add(b.id)||!Enter())return;
            try{
                if(b.iceStacks>0||b.frozen>0){ClearIce(b);return;}Stamp(b,"FIRE",owner);b.fireStacks++;
                if(b.fireStacks>=3){ClearFire(b);sim.Damage(b,5);foreach(var other in Near(b,58).Where(t=>t.owner!=owner))ApplyFireChain(other,owner,visited);sim.Emit("FIRE_BURST",b,"Third fire stack");return;}
                b.burnTurns=b.fireStacks==1?3:4;sim.Emit("FIRE",b,"Fire "+b.fireStacks);
            }finally{depth--;}
        }
        public void ApplyIce(BallRuntime b,int owner)
        {
            if(b.dead)return;if(b.fireStacks>0){ClearFire(b);return;}Stamp(b,"ICE",owner);
            if(b.frozen>0){b.frozen=2.4f;return;}b.iceStacks++;
            if(b.iceStacks>=3){b.iceStacks=b.iceTurns=0;b.frozen=2.4f;b.vx=b.vy=0;sim.Emit("FREEZE",b,"Frozen");}
            else{b.iceTurns=b.iceStacks==1?3:4;sim.Emit("ICE",b,"Ice "+b.iceStacks);}
        }
        public void ApplyToxin(BallRuntime b,int owner){if(b.dead)return;Stamp(b,"TOXIN",owner);b.toxinTurns=3;sim.Emit("TOXIN",b,"Toxin 3");}
        public void Root(BallRuntime b){if(b.dead)return;b.rooted=true;b.rootExpiresOwnerTurn=S.players[b.owner].ownerTurns+1;b.vx=b.vy=0;sim.Emit("ROOTED",b,"Rooted until own turn ends");}
        void StatusTurn(BallRuntime b)
        {
            if(b.fireStacks>0){sim.Damage(b,b.fireStacks*5);if(--b.burnTurns<=0)ClearFire(b);}
            if(b.dead)return;if(b.toxinTurns>0){sim.Damage(b,5);if(--b.toxinTurns<=0)ClearToxin(b);}
            if(b.iceStacks>0&&--b.iceTurns<=0)ClearIce(b);
        }
        void StatusContact(BallRuntime a,BallRuntime b,bool hit,bool source)
        {
            if(a.owner==b.owner){
                if(a.type=="penitent"&&source&&a.lastPenitentTurn!=S.turnNumber&&TransferStatus(a,b))a.lastPenitentTurn=S.turnNumber;
                if(a.type=="shield"&&!a.affectedIds.Contains(b.id)){a.affectedIds.Add(b.id);b.shield=10;sim.Emit("SHIELD",b,"Shield 10");}
                return;
            }
            if(a.type=="fire"||a.type=="kindler")ApplyFire(b,a.owner);
            if(a.type=="ice"){bool frozen=b.frozen>0;ApplyIce(b,a.owner);if(frozen)sim.Damage(b,5);foreach(var t in Near(b,100).Where(x=>x.owner!=a.owner))ApplyIce(t,a.owner);}
            if(a.type=="plague")ApplyToxin(b,a.owner);
            if(a.type=="plagueleech"&&!a.hitUsed){a.hitUsed=true;a.linkedTargetId=b.id;ApplyToxin(b,a.owner);sim.Emit("LINK",a,"Toxic tether",b.id);}
            if(!hit||!source)return;
            if(a.type=="briarheart"&&b.rooted&&PerTargetTurn(a,b))sim.Damage(b,5,false,a.id);
            if(a.type=="septiccore"&&b.toxinTurns>0&&PerTargetTurn(a,b)){
                var entry=S.virulence.FirstOrDefault(x=>x.sourceLineage==a.lineageId&&x.targetLineage==b.lineageId);
                if(entry==null){entry=new VirulenceRecord{sourceLineage=a.lineageId,targetLineage=b.lineageId,sourceOwner=a.owner,targetOwner=b.owner};S.virulence.Add(entry);}
                if(++entry.count>=2){S.virulence.Remove(entry);sim.Damage(b,5,false,a.id);sim.Emit("VIRULENCE_BURST",b,"Virulence 2 → burst");}
            }
            if(a.type=="rimeburst"&&b.frozen>0&&PerTargetTurn(a,b)){ClearIce(b);foreach(var t in Near(b,100).Where(x=>x.owner!=a.owner).Take(2))ApplyIce(t,a.owner);}
        }
        bool TransferStatus(BallRuntime to,BallRuntime from)
        {
            from.statusOrder.RemoveAll(x=>!ActiveStatus(from,x.family));to.statusOrder.RemoveAll(x=>!ActiveStatus(to,x.family));
            var stamp=from.statusOrder.OrderBy(x=>x.order).FirstOrDefault(x=>!to.statusOrder.Any(y=>y.family==x.family));if(stamp==null)return false;
            switch(stamp.family){case "FIRE":to.fireStacks=from.fireStacks;to.burnTurns=from.burnTurns;ClearFire(from);break;case "ICE":to.iceStacks=from.iceStacks;to.iceTurns=from.iceTurns;to.frozen=from.frozen;ClearIce(from);break;case "TOXIN":to.toxinTurns=from.toxinTurns;ClearToxin(from);break;default:return false;}
            to.statusOrder.Add(new StatusStamp{family=stamp.family,order=stamp.order,owner=stamp.owner});sim.Emit("STATUS_TRANSFER",to,stamp.family+" transferred",from.id);return true;
        }
        bool ActiveStatus(BallRuntime b,string family)=>family=="FIRE"?b.fireStacks>0:family=="ICE"?b.iceStacks>0||b.frozen>0:family=="TOXIN"&&b.toxinTurns>0;
        int Cleanse(BallRuntime target,bool one)
        {
            int removed=0;
            if(target.fireStacks>0){ClearFire(target);removed++;if(one)return removed;}
            if(target.iceStacks>0||target.frozen>0){ClearIce(target);removed++;if(one)return removed;}
            if(target.toxinTurns>0){ClearToxin(target);removed++;if(one)return removed;}
            if(target.jammed>0){target.jammed=0;removed++;if(one)return removed;}
            if(target.sticky>0){target.sticky=0;removed++;if(one)return removed;}
            if(target.rooted){target.rooted=false;removed++;}return removed;
        }
        void EmitCleanse(BallRuntime source,BallRuntime target,int count)
        {
            if(count<=0)return;sim.Emit("CLEANSE",target,"Removed "+count);
            foreach(var a in Living().Where(x=>x.type=="absolver"&&x.owner==target.owner))if(PerTargetTurn(a,target))sim.Shield(target,5);
        }
        void StatusStop(BallRuntime b)
        {
            if(b.type=="blightpool"||b.type=="consecrator")CreateZone(b,b.type=="blightpool"?"blight":"consecrated",165,3);
            if(b.type=="ward"||b.type=="medic"||b.type=="cleanser")foreach(var ally in Living().Where(t=>t.owner==b.owner&&Dist(b,t)<=165)){
                int removed=Cleanse(ally,false);if(b.type=="medic")sim.Heal(ally,10);if(b.type=="ward")ally.shield=Math.Max(ally.shield,5);EmitCleanse(b,ally,removed);
            }
            if(b.type=="pyrecore"||b.type=="blizzardcore")CreateZone(b,b.type=="pyrecore"?"fire":"ice",165,3);
        }
        ZoneRuntime CreateZone(BallRuntime b,string kind,float radius,int turns)
        {
            var z=new ZoneRuntime{id=S.nextId++,owner=b.owner,sourceId=b.id,x=b.x,y=b.y,kind=kind,radius=radius,turns=turns,createdTurn=S.turnNumber};S.zones.Add(z);sim.Emit("ZONE_CREATED",b,kind);return z;
        }
        void PeriodicZones()
        {
            var seen=new System.Collections.Generic.HashSet<string>();
            foreach(var z in S.zones.Where(x=>!x.dead&&x.turns>0).ToArray()){
                if(z.kind!="blight"&&z.kind!="consecrated"&&z.kind!="fire"&&z.kind!="ice"&&z.kind!="furnaceFire")continue;
                var targets=Living().Where(t=>Math.Sqrt((t.x-z.x)*(t.x-z.x)+(t.y-z.y)*(t.y-z.y))<=z.radius+t.radius*.5f).ToArray();
                if(z.kind=="consecrated"){
                    var target=targets.Where(t=>t.owner==z.owner&&(t.fireStacks>0||t.iceStacks>0||t.toxinTurns>0||t.rooted||t.frozen>0||t.jammed>0||t.sticky>0)).OrderByDescending(t=>t.statusOrder.Count).ThenBy(t=>t.id).FirstOrDefault();
                    if(target!=null)EmitCleanse(S.balls.FirstOrDefault(t=>t.id==z.sourceId),target,Cleanse(target,true));
                }else foreach(var target in targets.Where(t=>t.owner!=z.owner)){
                    string key=z.sourceId+":"+z.kind+":"+target.id;if(!seen.Add(key))continue;
                    if(z.kind=="blight")ApplyToxin(target,z.owner);else if(z.kind=="fire"||z.kind=="furnaceFire")ApplyFire(target,z.owner);else ApplyIce(target,z.owner);
                }
                if(--z.turns<=0)z.dead=true;
            }
        }
    }
}
