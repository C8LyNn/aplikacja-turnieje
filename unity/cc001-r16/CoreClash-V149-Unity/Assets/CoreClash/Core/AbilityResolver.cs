using System;
using System.Linq;
using CoreClash.Physics;
namespace CoreClash.Core
{
    public sealed partial class AbilityResolver
    {
        readonly GameSimulation sim;
        public AbilityResolver(GameSimulation s){sim=s;}
        int depth;
        GameState S=>sim.State;
        BallRuntime[] Living()=>S.balls.Where(b=>!b.dead&&!b.banished).OrderBy(b=>b.id).ToArray();
        static float Dist(BallRuntime a,BallRuntime b){float x=a.x-b.x,y=a.y-b.y;return (float)Math.Sqrt(x*x+y*y);}
        BallRuntime[] Near(BallRuntime b,float r,bool? ally=null)=>Living().Where(t=>t.id!=b.id&&Dist(b,t)<=r&&(!ally.HasValue||(t.owner==b.owner)==ally.Value)).OrderBy(t=>Dist(b,t)).ThenBy(t=>t.id).ToArray();
        bool Token(BallRuntime b)=>b.generated||sim.Catalog.Ball(b.type).hidden;
        bool Archetype(BallRuntime b,string id)=>sim.Catalog.Ball(b.type).archetype==id;
        bool PerTargetTurn(BallRuntime b,BallRuntime target){if(b.turnAffectedIds.Contains(target.id))return false;b.turnAffectedIds.Add(target.id);return true;}
        bool Enter(){if(depth>=8){sim.Emit("CHAIN_LIMIT",null,"Effect chain safely bounded");return false;}depth++;return true;}
        public void OnSpawn(BallRuntime b){b.divineShield=b.type=="halo";ArchetypeSpawn(b);if(b.type=="phoenix")PhoenixSpawn(b);}
        public void OnLaunch(BallRuntime b){b.paradoxSave=b.type=="paradox"?Save(b):b.paradoxSave;}
        public void OnContact(BallRuntime a,BallRuntime b,bool hit,bool source,float impact)
        {
            if(a.dead||b.dead||a.banished||b.banished||!Enter())return;
            try{if(a.jammed>0){a.jammed--;return;}EvolutionContact(a);if(RealityContact(a,b,hit,source))return;StatusContact(a,b,hit,source);StatusPayoffContact(a,b);ArchetypeContact(a,b,hit);ElementalContact(a,b,hit);MomentumContact(a,b,hit,impact);if(a.owner==b.owner&&a.type=="agony")TriggerDeathEffect(b);}
            finally{depth--;}
        }
        public void OnWall(BallRuntime b,string side,bool hit){if(b.type=="warp"&&(side=="left"||side=="right")){b.x=side=="left"?ZoneResolver.Right-b.radius-2:ZoneResolver.Left+b.radius+2;sim.Emit("TELEPORT",b,"Warp");}}
        public void OnStop(BallRuntime b){Stop(b,false);}
        void Stop(BallRuntime b,bool repeated)
        {
            if(b.dead||b.banished||!Enter())return;
            try{if(b.jammed>0){b.jammed--;return;}if(!repeated)ArchetypeStop(b);StatusStop(b);StatusPayoffStop(b);LifecycleStop(b);SpatialStop(b);MomentumStop(b);ConstructionStop(b);ReinforcementStop(b);ElementalStop(b);ExplosiveStop(b);if(!b.dead)RealityStop(b);}
            finally{depth--;}
        }
        public void OnTurnStart(int owner)
        {
            foreach(var b in S.balls.Where(b=>b.banished&&S.turnNumber>=b.banishedUntilTurn).ToArray()){b.banished=false;b.vx=b.vy=0;PlaceNear(b,b.x,b.y,180);sim.Emit("RETURN",b,"Exile ended");EmitReturn(b,b);}
            GlobalSpatialTurn();LifecycleHandTurn(owner);
            foreach(var b in Living()){
                if(b.owner!=owner||b.dead)continue;b.ownTurnCounter++;StatusTurn(b);if(b.dead)continue;ArchetypeTurn(b);LifecycleTurn(b);if(b.dead)continue;SpatialTurn(b);ConstructionTurn(b);ReinforcementTurn(b);EvolutionTurn(b);ElementalTurn(b);ExplosiveTurn(b);
                if(b.type=="paradox")b.paradoxSave=Save(b);
            }
        }
        public void OnTurnEnd(int owner){PeriodicZones();foreach(var b in Living())if(b.owner==owner&&b.rooted&&S.players[owner].ownerTurns>=b.rootExpiresOwnerTurn){b.rooted=false;sim.Emit("ROOT_EXPIRED",b,"Root expired");}}
        public void OnDeath(BallRuntime b)
        {
            if(!Enter())return;try{DeathObservers(b);ArchetypeDeath(b);foreach(var z in S.zones)if(z.sourceId==b.id&&z.kind=="portal")z.dead=true;TriggerDeathEffect(b);if(b.type=="phoenix")PhoenixDeathEffect(b);}finally{depth--;}
        }
        public void OnStep(float dt){LifecycleStep(dt);ExplosiveStep();SpatialStep(dt);}
        public bool BeforeDamage(BallRuntime b,bool kinetic){if(kinetic&&b.divineShield){b.divineShield=false;sim.Emit("DIVINE_SHIELD",b,"First impact blocked");return true;}return false;}
        void Impulse(BallRuntime target,float tx,float ty,float power){if(target.rooted||target.dead)return;float dx=tx-target.x,dy=ty-target.y,d=(float)Math.Sqrt(dx*dx+dy*dy);if(d<.001f)return;float p=power*CollisionResolver.ForceScale(target);target.vx+=dx/d*p;target.vy+=dy/d*p;BallPhysics.ClampSpeed(target);}
        SavedBallState Save(BallRuntime b)=>new SavedBallState{x=b.x,y=b.y,hp=b.hp,shield=b.shield,fireStacks=b.fireStacks,burnTurns=b.burnTurns,iceStacks=b.iceStacks,iceTurns=b.iceTurns,toxinTurns=b.toxinTurns,frozen=b.frozen,sticky=b.sticky,jammed=b.jammed,rooted=b.rooted,rootExpiresOwnerTurn=b.rootExpiresOwnerTurn,stamps=b.statusOrder.Select(x=>new StatusStamp{family=x.family,order=x.order,owner=x.owner}).ToArray()};
        void Restore(BallRuntime b,SavedBallState saved){if(saved==null)return;PlaceNear(b,saved.x,saved.y,116);b.hp=Math.Min(b.maxHp,saved.hp);b.shield=saved.shield;b.fireStacks=saved.fireStacks;b.burnTurns=saved.burnTurns;b.iceStacks=saved.iceStacks;b.iceTurns=saved.iceTurns;b.toxinTurns=saved.toxinTurns;b.frozen=saved.frozen;b.sticky=saved.sticky;b.jammed=saved.jammed;b.rooted=saved.rooted;b.rootExpiresOwnerTurn=saved.rootExpiresOwnerTurn;b.statusOrder.Clear();if(saved.stamps!=null)b.statusOrder.AddRange(saved.stamps.Select(x=>new StatusStamp{family=x.family,order=x.order,owner=x.owner}));b.vx=b.vy=0;sim.Emit("REWIND",b,"Saved state restored");}
    }
}
