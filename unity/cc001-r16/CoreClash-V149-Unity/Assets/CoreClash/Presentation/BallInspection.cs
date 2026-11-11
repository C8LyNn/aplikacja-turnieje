using System;
using System.Collections.Generic;
using System.Linq;
using CoreClash.Core;

namespace CoreClash.Presentation
{
    // CC-001 W20: what a state IS (one symbol and colour per kind on the board);
    // Short is the number shown next to the symbol (stacks, turns or progress).
    public enum StatusKind { Counter, Token, Ancestral, Rooted, Frozen, Shield, Divine, Split, Veteran, Frostguard, Armed, Fuse, Fire, Ice, Toxin, Jammed, Sticky, Phased, Banished }
    public sealed class BallStateLabel
    {
        public readonly string Code,Text,Short;
        public readonly StatusKind Kind;
        public BallStateLabel(string code,string text,StatusKind kind=StatusKind.Counter,string shortText=""){Code=code;Text=text;Kind=kind;Short=shortText??"";}
    }
    public sealed class BallInspection
    {
        public readonly string Type;
        public readonly int Owner,Hp,MaxHp,Shield;
        public readonly bool OnBoard;
        public readonly BallStateLabel[] States;
        BallInspection(BallRuntime ball)
        {
            Type=ball.type;Owner=ball.owner;Hp=ball.hp;MaxHp=ball.maxHp;Shield=ball.shield;
            OnBoard=!ball.dead&&!ball.banished;States=Statuses(ball);
        }
        public static BallInspection Read(GameState state,int id)
        {
            var ball=state?.balls?.FirstOrDefault(b=>b.id==id);
            return ball==null?null:new BallInspection(ball);
        }
        // Read-only hit testing deliberately has no active-player or launch permission check.
        public static BallRuntime At(GameState state,float x,float y)
        {
            if(state?.balls==null||!GameSimulation.Finite(x)||!GameSimulation.Finite(y))return null;
            return state.balls.Where(b=>!b.dead&&!b.banished&&DistanceSquared(b,x,y)<=(b.radius+10)*(b.radius+10))
                .OrderBy(b=>DistanceSquared(b,x,y)).ThenBy(b=>b.id).FirstOrDefault();
        }
        static float DistanceSquared(BallRuntime ball,float x,float y)=>(ball.x-x)*(ball.x-x)+(ball.y-y)*(ball.y-y);
        public static BallStateLabel[] Statuses(BallRuntime ball)
        {
            if(ball==null)return Array.Empty<BallStateLabel>();
            var states=new List<BallStateLabel>();
            if(ball.generated)states.Add(new BallStateLabel("GEN","Summoned token (not a stock ball)",StatusKind.Token));
            if(ball.ancestral)states.Add(new BallStateLabel("ANC","Ancestral",StatusKind.Ancestral));
            if(ball.rooted)states.Add(new BallStateLabel("ROOT","Rooted until own turn ends",StatusKind.Rooted));
            if(ball.frozen>0)states.Add(new BallStateLabel("FRZ","Frozen",StatusKind.Frozen));
            if(ball.shield>0)states.Add(new BallStateLabel("S"+ball.shield,"Shield: "+ball.shield,StatusKind.Shield,ball.shield.ToString()));
            if(ball.divineShield)states.Add(new BallStateLabel("DIV","Divine shield",StatusKind.Divine));
            if(ball.type=="quartermaster")states.Add(new BallStateLabel("Q"+Math.Min(2,ball.quartermasterTurnCounter)+"/2","Quartermaster: "+Math.Min(2,ball.quartermasterTurnCounter)+"/2 own turns toward next Standard token",StatusKind.Counter,Math.Min(2,ball.quartermasterTurnCounter)+"/2"));
            if(ball.type=="brood")states.Add(new BallStateLabel("B"+ball.spawnCount+"/5","Broodling births: "+ball.spawnCount+"/5",StatusKind.Counter,ball.spawnCount+"/5"));
            if(ball.type=="hatchery")states.Add(new BallStateLabel("H"+ball.hatcherySpawnCount+"/3", "Hatchery: "+ball.hatcherySpawnCount+" of 3 Broodlings; turn "+ball.hatcheryTurnCounter+"/2",StatusKind.Counter,ball.hatcherySpawnCount+"/3"));
            if(ball.type=="replicator")states.Add(new BallStateLabel("C"+ball.replicatorTurnCounter+"/2", "Replicator: "+ball.replicatorTurnCounter+"/2 own turns toward clone",StatusKind.Counter,ball.replicatorTurnCounter+"/2"));
            if(ball.type=="mitosis" && ball.mitosisSplit)states.Add(new BallStateLabel("DIV", "Mitosis already split",StatusKind.Split));
            if(ball.veteranUpgrades>0)states.Add(new BallStateLabel("VET", "Veteran upgrades: "+ball.veteranUpgrades,StatusKind.Veteran,ball.veteranUpgrades>1?ball.veteranUpgrades.ToString():""));
            if(ball.frostguardAnchored)states.Add(new BallStateLabel("FRG","Frostguard anchored: counter-freeze on enemy HIT",StatusKind.Frostguard));
            if(ball.mineArmed)states.Add(new BallStateLabel("ARM","Armed",StatusKind.Armed));
            if(ball.timeBombArmed)states.Add(new BallStateLabel("FUSE"+Math.Max(0,2-ball.timeBombCounter),"Time Bomb: "+Math.Max(0,2-ball.timeBombCounter)+" own turns remaining; each STOP resets the fuse",StatusKind.Fuse,Math.Max(0,2-ball.timeBombCounter).ToString()));
            if(ball.fireStacks>0)states.Add(new BallStateLabel("F"+ball.fireStacks,"Fire: "+ball.fireStacks+" stacks / "+ball.burnTurns+" own turns remaining",StatusKind.Fire,ball.fireStacks.ToString()));
            if(ball.iceStacks>0)states.Add(new BallStateLabel("I"+ball.iceStacks,"Ice: "+ball.iceStacks+" stacks / "+ball.iceTurns+" own turns remaining",StatusKind.Ice,ball.iceStacks.ToString()));
            if(ball.toxinTurns>0)states.Add(new BallStateLabel("T"+ball.toxinTurns,"Toxin: "+ball.toxinTurns+" own turns remaining",StatusKind.Toxin,ball.toxinTurns.ToString()));
            if(ball.jammed>0)states.Add(new BallStateLabel("JAM","Jammed",StatusKind.Jammed,ball.jammed>1?ball.jammed.ToString():""));
            if(ball.sticky>0)states.Add(new BallStateLabel("STK","Sticky",StatusKind.Sticky));
            if(ball.phased)states.Add(new BallStateLabel("PHS","Phased",StatusKind.Phased));
            if(ball.banished)states.Add(new BallStateLabel("BAN","Banished",StatusKind.Banished));
            return states.ToArray();
        }
        public static string OwnerMark(int owner)=>owner==0?"P1":owner==1?"P2":"?";
    }
}
