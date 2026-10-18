using System;
using System.Collections.Generic;

namespace CoreClash.Core
{
    public enum MatchPhase { Aiming, Moving, Over }
    public enum CommandKind { Spawn, Replay }
    [Serializable] public sealed class PlayerCommand
    {
        public int owner, turnNumber, ballId, sequence;
        public CommandKind kind;
        public string ballType;
        public float dx,dy,power;
    }
    [Serializable] public sealed class StockEntry { public string id; public int remaining; }
    [Serializable] public sealed class PlayerState
    {
        public int owner,hp,ownerTurns;
        public string deckId;
        public List<StockEntry> stock=new List<StockEntry>();
    }
    [Serializable] public sealed class GameEvent
    {
        public int id,turn,ballId,otherId;
        public string kind,text;
        public float x,y,atTime;
    }
    [Serializable] public sealed class GameState
    {
        public int specVersion=149,turn,turnNumber=1,nextId=1,frame,revision,eventSerial,winner=-2,actionSerial,statusClock;
        // Serialized xorshift32 stream for host-owned wildcard/collector/revival outcomes.
        // Keep non-zero, including when importing older JSON snapshots.
        public uint randomState=149;
        public float time,actionTime,settledTime;
        public float actionDeadline=14;
        public bool bonusPending,bonusUsed;
        public string actionKind,resultReason;
        public MatchPhase phase=MatchPhase.Aiming;
        public PlayerState[] players=new[]{new PlayerState(),new PlayerState()};
        public List<BallRuntime> balls=new List<BallRuntime>();
        public List<StructureRuntime> structures=new List<StructureRuntime>();
        public List<ZoneRuntime> zones=new List<ZoneRuntime>();
        public List<GraveRecord> graveyard=new List<GraveRecord>();
        // Host-owned hand payload, distinct from normal stock and ordinary board SPAWN.
        public List<PhoenixHandEntry> phoenixHand=new List<PhoenixHandEntry>();
        public List<GameEvent> events=new List<GameEvent>();
        public List<int> replayedIds=new List<int>();
        public List<LineageRecord> lineages=new List<LineageRecord>();
        public List<VirulenceRecord> virulence=new List<VirulenceRecord>();
    }
    [Serializable] public sealed class BallRuntime
    {
        public int id,owner,hp,maxHp,shield,fireStacks,burnTurns,iceStacks,iceTurns,toxinTurns,stopCount,startCount,anchorStacks,windMomentum,growthStage,packFury,huntTargetId;
        public int ownTurnCounter,spawnCount,lineageId,life=1,reviveGeneration,lastAbilityTurn=-1,lastWallFrame=-100,lastDamageSourceId;
        public int rootExpiresOwnerTurn=-1,returnStacks,lastReturnTurn=-1,horizon,linkedTargetId,lastVectorTurn=-1,lastPenitentTurn=-1;
        public string type;
        public float x,y,vx,vy,radius,mass,restitution,wallRestitution,maxSpeed,stopHold,frozen,spawnGrace,angle=-1.5707963f,motionPeak,portalCooldown,sticky;
        public bool dead,moving,phased,mineArmed,exploded,splitDone,abilityUsed,resurrected,generated,hitUsed,wallUsed,launchImmune,rooted,ancestral,divineShield,banished,identityUsed;
        public int banishedUntilTurn,jammed;
        // Per-instance, serialized once-per-turn DEATH observer gate.
        public int lastDenMotherTurn=-1;
        public int lastRamAction=-1;
        public int lastElementalTurn=-1;
        public bool frostguardAnchored;
        public int quartermasterTurnCounter,lastReinforcementTurn=-1;
        public int hatcheryTurnCounter,hatcherySpawnCount,replicatorTurnCounter,lastEvolutionTurn=-1,veteranUpgrades;
        public bool mitosisSplit;
        public bool timeBombArmed;
        public int timeBombCounter,timeBombLastTickTurn=-1;
        public SavedBallState chronoSave,paradoxSave;
        public List<string> collection=new List<string>();
        public List<StatusStamp> statusOrder=new List<StatusStamp>();
        public List<int> affectedIds=new List<int>();
        public List<int> turnAffectedIds=new List<int>();
    }
    [Serializable] public sealed class StructureRuntime
    {
        public int id,owner,hp,maxHp,sourceId;
        public string kind;
        public float x,y,radius,restitution=1;
        public bool dead;
    }
    [Serializable] public sealed class ZoneRuntime
    {
        public int id,owner,sourceId,turns,createdTurn,swallowed,spawned,pairId;
        public string kind;
        public float x,y,radius,coreRadius,pull,exitX,exitY;
        public bool trap,dead;
        public List<int> inside=new List<int>();
    }
    [Serializable] public sealed class PhoenixHandEntry
    {
        public int owner,sourceBallId,lineageId,hp,maxHp,shield,createdOwnerTurns,lastProcessedOwnerTurns;
        public bool ready;
    }
    [Serializable] public sealed class GraveRecord
    {
        public int owner,ballId,maxHp,lineageId,life,turn;
        public string type;
        public float x,y;
    }
    [Serializable] public sealed class StatusStamp { public string family;public int order,owner; }
    [Serializable] public sealed class LineageRecord { public int id,returnStacks;public bool ancestral; }
    [Serializable] public sealed class VirulenceRecord { public int sourceLineage,targetLineage,count,sourceOwner,targetOwner; }
    [Serializable] public sealed class SavedBallState
    {
        public float x,y,frozen,sticky;public int hp,shield,fireStacks,burnTurns,iceStacks,iceTurns,toxinTurns,jammed,rootExpiresOwnerTurn;
        public bool rooted;public StatusStamp[] stamps;
    }
}
