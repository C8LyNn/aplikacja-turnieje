using System;
using System.Linq;
using CoreClash.Physics;

namespace CoreClash.Core
{
    // CC-001 W24 (owner direction, 2026-11-22): the roster is six groups of five - fire, ice,
    // poison, magnetism, electricity, plants - made "icons first, then a power under each icon".
    // This file holds the powers of the roster balls that had no rules code before. Every ball
    // does the one thing its picture shows:
    //   lightning  touches an enemy: 5 damage, and the bolt jumps to one more enemy next to it
    //   storm      every turn of its owner: a bolt hits the nearest enemy in range
    //   battery    charges every turn (up to 3); when it stops next to enemies it shocks them all
    //   shock trap the first enemy to roll over it takes 5 damage and loses its power for a while
    //   switch     the enemy it touches loses its power until the end of that enemy's next turn
    //   compass    when it stops in its owner's turn, it shoots once more, straight at the nearest enemy
    //   cactus     an enemy that touches it takes 5 damage (once a turn for each enemy)
    //   flower     every turn of its owner: heals the owner's balls next to it (and itself)
    //   sprout     every turn of its owner: grows (bigger, heavier, 5 HP back), three times at most
    public sealed partial class AbilityResolver
    {
        public const int ZapDamage=5,ChargeMax=3,GrowthMax=3,ThornDamage=5,BloomHeal=5;
        public const float ZapJump=100,StormRange=165,DischargeRange=100,BloomRange=100,CompassRange=230,CompassSpeed=430,GrowthStep=1.12f;

        // Power switched off until the end of the target's next own turn.
        public void Jam(BallRuntime b)
        {
            if(b==null||b.dead)return;
            b.jammed=1;b.jamExpiresOwnerTurn=S.players[b.owner].ownerTurns+1;sim.Emit("JAM",b,"Power off");
        }
        // A bolt from `from` (a ball, or nothing for a trap) into `target`.
        void Zap(BallRuntime target,BallRuntime from,int amount,int sourceId)
        {
            if(target==null||target.dead)return;
            // Match rule shortCircuit: a ball whose power is switched off takes more from a bolt.
            if(target.jammed>0)amount+=Math.Max(0,S.shortCircuit);
            sim.Emit("ZAP",target,"-"+amount,from?.id??0);sim.Damage(target,amount,false,sourceId);
        }
        // Match rule chainLightning: from the enemy the Lightning touched, the bolt goes on to the
        // nearest enemy within reach, from that one to the next, and so on. An enemy this Lightning
        // has already shocked this turn is passed over, so "once a turn for each enemy" stays true.
        void ChainBolt(BallRuntime lightning,BallRuntime touched)
        {
            var last=touched;
            while(true)
            {
                var next=Living().Where(t=>t.owner!=lightning.owner&&!lightning.turnAffectedIds.Contains(t.id)&&Dist(last,t)<=ZapJump).OrderBy(t=>Dist(last,t)).ThenBy(t=>t.id).FirstOrDefault();
                if(next==null)return;
                lightning.turnAffectedIds.Add(next.id);Zap(next,last,ZapDamage,lightning.id);last=next;
            }
        }

        void GroupSpawn(BallRuntime b){if(b.type=="capacitor")b.charge=Math.Max(0,Math.Min(ChargeMax,S.batteryStart));}

        void GroupContact(BallRuntime a,BallRuntime b)
        {
            if(a.dead||b.dead||a.owner==b.owner)return;
            switch(a.type)
            {
                case "tesla":
                    if(!PerTargetTurn(a,b))break;
                    Zap(b,a,Math.Max(ZapDamage,S.lightningTouch),a.id);
                    if(S.chainLightning){ChainBolt(a,b);break;}
                    var next=Living().Where(t=>t.owner!=a.owner&&t.id!=b.id&&Dist(b,t)<=ZapJump).OrderBy(t=>Dist(b,t)).ThenBy(t=>t.id).FirstOrDefault();
                    if(next!=null)Zap(next,b,ZapDamage,a.id);
                    break;
                case "jammer":
                    if(b.jammed<=0)Jam(b);
                    break;
                case "thornback":
                    if(!PerTargetTurn(a,b))break;
                    sim.Emit("THORNS",b,"-"+ThornDamage,a.id);sim.Damage(b,ThornDamage,false,a.id);
                    break;
            }
        }

        void GroupStop(BallRuntime b)
        {
            switch(b.type)
            {
                case "capacitor":
                    var shocked=Near(b,DischargeRange,false);
                    // No enemy next to it: the charge is kept for later.
                    if(b.charge<=0||shocked.Length==0)break;
                    int power=b.charge;b.charge=0;
                    sim.Emit("DISCHARGE",b,"x"+power);
                    foreach(var target in shocked)Zap(target,b,ZapDamage*power,b.id);
                    break;
                case "staticfield":
                    if(CreateTrap(b,"shocktrap",b.x,b.y,TrapRadius,105)==null)sim.Emit("PLACEMENT_BLOCKED",b,"No room for a shock trap");
                    break;
                case "fluxmine":
                    Compass(b);
                    break;
            }
        }
        // One more shot, straight at the nearest enemy. Once a turn, and only in its owner's turn.
        void Compass(BallRuntime b)
        {
            // Whatever stops it, the second shot is over.
            b.compassDash=false;
            if(b.owner!=S.turn||b.lastAbilityTurn==S.turnNumber||S.phase!=MatchPhase.Moving)return;
            var target=Near(b,CompassRange,false).FirstOrDefault();if(target==null)return;
            float dx=target.x-b.x,dy=target.y-b.y,distance=(float)Math.Sqrt(dx*dx+dy*dy);if(distance<.001f)return;
            b.lastAbilityTurn=S.turnNumber;b.compassDash=true;
            float speed=CompassSpeed*CollisionResolver.ForceScale(b);
            b.vx=dx/distance*speed;b.vy=dy/distance*speed;b.angle=(float)Math.Atan2(b.vy,b.vx);BallPhysics.ClampSpeed(b);
            // A new launch late in an action needs its own settling window (same bound as Slingshot).
            S.actionDeadline=Math.Min(28,Math.Max(S.actionDeadline,S.actionTime+8));
            sim.Emit("DASH",b,"Compass",target.id);
        }

        void GroupTurn(BallRuntime b)
        {
            switch(b.type)
            {
                case "chainshock":
                    var struck=Near(b,StormRange,false).FirstOrDefault();
                    if(struck!=null)Zap(struck,b,ZapDamage,b.id);
                    break;
                case "capacitor":
                    if(b.charge<ChargeMax){b.charge++;sim.Emit("CHARGE",b,b.charge+"/"+ChargeMax);}
                    break;
                case "elderbloom":
                    var hurt=Living().Where(x=>x.owner==b.owner&&Dist(b,x)<=BloomRange&&x.hp<x.maxHp).ToArray();
                    if(hurt.Length>0)sim.Emit("BLOOM",b,"Heals x"+hurt.Length);
                    foreach(var ally in hurt)sim.Heal(ally,BloomHeal);
                    break;
                case "cultivator":
                    if(b.growthStage>=GrowthMax)break;
                    // Every ball has the same HP: the Sprout grows in body and gets 5 HP back, its gauge stays as it is.
                    b.growthStage++;b.radius*=GrowthStep;b.mass*=GrowthStep;
                    sim.Emit("GROW",b,"Bigger");
                    sim.Heal(b,5);
                    break;
            }
        }

        void TriggerShockTrap(ZoneRuntime trap)
        {
            var target=Living().FirstOrDefault(b=>b.owner!=trap.owner&&!b.phased&&
                (b.x-trap.x)*(b.x-trap.x)+(b.y-trap.y)*(b.y-trap.y)<(trap.radius+b.radius)*(trap.radius+b.radius));
            if(target==null)return;
            trap.dead=true;
            sim.Emit("TRAP_TRIGGER",target,trap.kind+" spent",trap.sourceId);
            Zap(target,null,Math.Max(ZapDamage,S.shockTrapDamage),trap.sourceId);
            if(!target.dead)Jam(target);
        }
    }
}
