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
        // Match rule "double turn" (see GameState.comebackRule): armed when this base first falls
        // below 10 HP, spent on this player's next turn. Once a match.
        public bool comebackArmed,comebackUsed;
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
        // W24 (owner decisions): rules chosen for one match. The defaults are the reference rules,
        // so a match that sets none of them - every test, every demo - plays exactly as before.
        //   ballScale     every ball's radius is multiplied by it
        //   comebackRule  a player whose base falls below 10 HP plays two balls on their next turn
        //   mapId         the map: its obstacles are structures of kind StructureSystem.Obstacle
        //   centreRadius  the radius of the centre a player holds; a map that blocks part of the
        //                 centre makes it larger (owner's terrain rule)
        public float ballScale=1,centreRadius=112;
        // W24 match rule (off = the reference rules): every ball has only the power written on
        // its card - the hidden passives of the old archetypes do not run, and a switched-off
        // power stays off for a time instead of for one use.
        public bool plainPowers;
        // W24 match rule (off = the reference rules): one place on the board holds one field - fields
        // of one element join, a newer field of another element exists only outside the older one.
        public bool exclusiveFields;
        // W24 match rule (off = the reference rules; owner decision 2026-11-24, after the lab's
        // measurement): the extra ball Player 2 gets on the opening turn must be a Standard one.
        // Measured, computer against computer: with any ball as the extra one the first player
        // wins 39% of matches, with no extra ball 64%, with a Standard one 47%.
        public bool standardOpeningBonus;
        // W24 match rule (0 = the reference rules: the extra ball is a whole one; owner direction
        // 2026-11-24: "the player who starts and the other one are to win as often as each other,
        // whatever the decks"). Player 2's extra ball of the opening turn enters with this many HP.
        // Measured, computer against computer, every pair of ready decks: no extra ball - the first
        // player wins 64%; a whole Standard ball - 42%; one with 20 HP - 46%; with 15 HP - 49%. The
        // game's number is in RosterBalance.
        public int openingBonusHp;
        // W24 match rule (off = the reference rules; owner decision 2026-11-24 "strengthen the ice
        // balls", after the lab's measurement: the two decks with ice were the two weakest). In the
        // reference rules a freeze lasts 2.4 seconds of motion - it is over before the other player
        // aims. With this rule a frozen ball is out of the game for freezeTurns turns after the one
        // it was frozen in (two = one turn of each player: its owner cannot use it, and the player
        // who froze it gets a turn to break the ice): it does not move, its power does not work, it
        // does not press the base or count for the centre. A frozen ball takes no more chills. Also:
        // the ice trap freezes outright, and the Shatterer takes 5 HP for every chill it breaks (15
        // from a frozen ball).
        public bool deepFreeze;
        public int freezeTurns=2;
        // W24 match rules, ice again (off / 0 = as above; owner decision 2026-11-24 "strengthen ice":
        // after the second balance pass ice was the weakest group, 46%, and the two ready decks with
        // ice the two weakest. The lab: ice chills 13 times and freezes 4 balls a match but kills the
        // fewest, and decks did better WITHOUT the Shatterer - its hit set the frozen ball free.)
        //   shatterKeepsIce  the Shatterer's hit leaves the ice where it is: a frozen ball stays
        //                    frozen, a chilled one keeps its chills. Once a turn for each enemy.
        //   freezeDamage     HP a ball loses at the moment it freezes
        //   brittleBonus     HP a hard hit takes on top from a frozen ball
        public bool shatterKeepsIce;
        public int freezeDamage,brittleBonus;
        // W24 match rule (off = the reference rules): Venom's bite into an already poisoned enemy
        // (5 HP from it, 5 HP back to Venom) works once a turn for each enemy, like the Lightning
        // and the Cactus - in the reference rules every touch counts.
        public bool venomOncePerTurn;
        // W24 match rules, numbers of the poison group (the defaults are the reference numbers; owner
        // decision 2026-11-24 "weaken the Jungle deck", after the lab's measurement: poison was the
        // strongest group and the Leech its strongest ball - one touch took 25 HP and gave 10 back).
        //   poisonTurns  how many turns a poison lasts (5 HP a turn)
        //   leechDrain   HP the Leech takes from its poisoned target in each turn of its owner, on top
        //                of the poison; 0 = it takes nothing more and only heals itself (5 HP a turn)
        //   poolRadius   the radius of the Poison Pool's field
        public int poisonTurns=3,leechDrain=5;
        // W24 match rule, fire (off = the reference rules; fourth balance pass, 2026-11-25: with powers
        // that work on touch valued properly Fire Pit won 62% of its matches against the other
        // ready decks). A burning ball loses 5 HP a turn however many fires are on it - in the
        // reference rules 5 for each, so a second touch made 40 HP of fire, more than a ball has.
        // A second fire still makes the ball burn longer, and a third bursts.
        public bool fireFlat;
        // W24 match rule (off = the reference rules; owner rule 2026-11-26, "an important rule:
        // your own balls must not hurt your other balls"). A player's ball never hurts another ball of
        // the same player: an explosion (the Bomb, a mine, a time bomb) and any other power takes
        // no HP from its owner's other balls - it still throws them back - and a player's own fire,
        // ice or poison does not land on that player's balls (own fire still thaws, own ice still
        // puts a fire out). A black hole leaves its owner's balls alone. What a ball does to itself
        // (the Bomb is gone when it explodes) and what an enemy's fire does on your ball stay as
        // they were. In the reference rules a blast hurts everybody in range.
        public bool noFriendlyFire;
        public float poolRadius=165;
        // W24 match rules, magnetism and electricity (off / 0 = the reference rules; owner decision
        // 2026-11-24 "strengthen magnetism and electricity", after the lab's measurement: Dynamo, the
        // deck of these two groups, was the weakest ready deck and killed the fewest balls).
        //   chainLightning  the Lightning's bolt goes on from enemy to enemy for as long as the next
        //                   one stands within reach of the last - not to one more enemy only. One
        //                   Lightning shocks each enemy once a turn, touched or reached by the bolt.
        //   shortCircuit    HP a bolt takes on top from a ball whose power is switched off
        //   mineDamage      above 0: the Magnet Mine's blast takes exactly this much from every enemy
        //                   in its field and nothing from its owner's balls (reference: 10-15 by
        //                   distance, from everybody)
        //   anchorShield    the shield the Anchor has after it drops anchor
        //   compassDashHurt how much of a collision's damage the Compass takes during its second
        //                   shot, in percent (100 = the reference rules, where each of its two hits
        //                   costs it as much as its target and the lab's decks did better without the
        //                   ball; 0 = none - measured: far too strong)
        //   lightningTouch  HP the Lightning takes from the enemy it touches (its jumps stay at 5)
        //   batteryStart    charges the Battery comes with
        //   shockTrapDamage HP the shock trap takes
        public bool chainLightning;
        public int compassDashHurt=100;
        public int shortCircuit,mineDamage,anchorShield;
        public int lightningTouch=5,batteryStart=1,shockTrapDamage=5;
        // W24 match rules (0 / off = the reference rules; owner direction after playing, 2026-11-24:
        // "traps are to be bigger and must not lie on one another").
        //   trapRadius  the radius of an element trap and of the shock trap. The reference 14 was
        //               sized for the reference balls; the game's balls are one and a half times
        //               bigger, so the traps looked like crumbs beside them.
        //   trapsApart  a trap is never laid over another trap, whoever owns it: it goes down beside
        //               it, and is not laid at all when there is no room near.
        public float trapRadius;
        public bool trapsApart;
        // W24 match rule (off = the reference rules; owner direction after playing, 2026-11-25: "a
        // ball must not be able to generate things every turn, or even several times a turn - only
        // the first time"). By turn 41 of one of his matches the board held some thirty shoots and
        // twenty poison traps: a trap ball laid a new trap every time it came to rest, knocked or
        // not. With this rule a ball puts its thing down once - its trap, its shoots, its field -
        // at the first stop where it can; after that it is a ball like any other.
        public bool placeOnce;
        public bool comebackRule,comebackActive;
        public string mapId="";
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
        public float x,y,vx,vy,radius,mass,restitution,wallRestitution,maxSpeed,stopHold,frozen,spawnGrace,angle=-1.5707963f,motionPeak,portalCooldown,sticky,phoenixEntryTimer;
        public bool dead,moving,phased,mineArmed,exploded,splitDone,abilityUsed,resurrected,generated,hitUsed,wallUsed,launchImmune,rooted,ancestral,divineShield,banished,identityUsed;
        public int banishedUntilTurn,jammed;
        // W24 six groups: battery charge; the owner turn in which a switched-off power comes back.
        public int charge,jamExpiresOwnerTurn=-1;
        // Match rule deepFreeze: the number of the turn at whose end this ball thaws (-1 = not frozen that way).
        public int thawTurn=-1;
        // The Compass is on its second shot (from the moment it fires until it stops).
        public bool compassDash;
        // Match rule placeOnce: this ball has put its trap, its shoots or its field down.
        public bool placed;
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
