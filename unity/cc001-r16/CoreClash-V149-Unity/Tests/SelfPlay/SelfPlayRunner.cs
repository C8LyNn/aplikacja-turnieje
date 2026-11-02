using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using CoreClash.Core;
using CoreClash.Data;

// CC-001 W19-03 (#291): headless, deterministic self-play over the REAL
// authoritative GameSimulation. Every action is a PlayerCommand that goes
// through GameSimulation.TryCommand; the match advances only with
// GameSimulation.Step(1/120). Nothing here changes rules, physics, stats,
// catalog or decks: GameSimulation, MatchRules, TurnSystem and the data files
// are read-only inputs. Results are raw material for owner decisions Q3-Q7,
// not automatic balance verdicts.
namespace CoreClash.SelfPlay
{
    // Own seeded stream (splitmix64). Independent of the gameplay RNG
    // (GameState.randomState stays at its real start value 149) and of
    // string.GetHashCode, which is randomized per process in .NET.
    public sealed class SelfPlayRng
    {
        ulong state;
        public SelfPlayRng(ulong seed){state=seed;}
        public ulong NextU64(){ulong z=state+=0x9E3779B97F4A7C15UL;z=(z^(z>>30))*0xBF58476D1CE4E5B9UL;z=(z^(z>>27))*0x94D049BB133111EBUL;return z^(z>>31);}
        public double NextDouble()=>(NextU64()>>11)*(1.0/9007199254740992.0);
        public int Next(int count){if(count<=0)throw new ArgumentOutOfRangeException(nameof(count));return (int)(NextU64()%(ulong)count);}
        public double Range(double min,double max)=>min+(max-min)*NextDouble();
        public static ulong Mix(ulong a,ulong b){var r=new SelfPlayRng(a^(b*0xD1B54A32D192ED03UL));r.NextU64();return r.NextU64();}
    }

    public interface ISelfPlayStrategy
    {
        string Name{get;}
        // Proposes the next command for `owner`. The runner validates it with
        // TryCommand; an illegal proposal is counted, never silently applied.
        PlayerCommand Choose(GameSimulation sim,int owner,SelfPlayRng rng);
    }

    public static class SelfPlayAim
    {
        public const float LauncherX=270,ArenaWidth=540,ArenaHeight=900;
        public static float LauncherY(int owner)=>owner==0?853:47;
        public static float Forward(int owner)=>owner==0?-1:1;
        // Specials with stock left (deck order), then Standard (unlimited).
        public static List<string> SpawnOptions(GameSimulation sim,int owner)
        {
            var list=sim.State.players[owner].stock.Where(x=>x.remaining>0&&sim.Catalog.Ball(x.id)!=null).Select(x=>x.id).ToList();
            list.Add("normal");return list;
        }
        public static List<BallRuntime> Replayable(GameSimulation sim)=>sim.State.balls.Where(sim.CanReplay).ToList();
        public static PlayerCommand Spawn(GameSimulation sim,int owner,string type,double angleDeg,double power)
        {
            double a=angleDeg*Math.PI/180;
            return new PlayerCommand{owner=owner,turnNumber=sim.State.turnNumber,kind=CommandKind.Spawn,ballType=type,dx=(float)Math.Sin(a),dy=(float)(Math.Cos(a)*Forward(owner)),power=(float)power};
        }
        public static PlayerCommand SpawnToward(GameSimulation sim,int owner,string type,double tx,double ty,double power)
        {
            double dx=tx-LauncherX,dy=ty-LauncherY(owner);
            if(dx*dx+dy*dy<1)return Spawn(sim,owner,type,0,power);
            return new PlayerCommand{owner=owner,turnNumber=sim.State.turnNumber,kind=CommandKind.Spawn,ballType=type,dx=(float)dx,dy=(float)dy,power=(float)power};
        }
        public static PlayerCommand ReplayToward(GameSimulation sim,BallRuntime ball,double tx,double ty,double power)
        {
            double dx=tx-ball.x,dy=ty-ball.y;
            if(dx*dx+dy*dy<1){dx=0;dy=Forward(ball.owner);}
            return new PlayerCommand{owner=ball.owner,turnNumber=sim.State.turnNumber,kind=CommandKind.Replay,ballId=ball.id,dx=(float)dx,dy=(float)dy,power=(float)power};
        }
        public static PlayerCommand ReplayAngle(GameSimulation sim,BallRuntime ball,double angleDeg,double power)
        {
            double a=angleDeg*Math.PI/180;
            return new PlayerCommand{owner=ball.owner,turnNumber=sim.State.turnNumber,kind=CommandKind.Replay,ballId=ball.id,dx=(float)Math.Sin(a),dy=(float)(Math.Cos(a)*Forward(ball.owner)),power=(float)power};
        }
        public static double Clamp(double v,double min,double max)=>Math.Max(min,Math.Min(max,v));
    }

    // Uniformly random legal-looking play: random ball, forward cone +-80 deg,
    // power 60..590; 25% Replay when a friendly ball may be replayed.
    public sealed class RandomStrategy:ISelfPlayStrategy
    {
        public string Name=>"random";
        public PlayerCommand Choose(GameSimulation sim,int owner,SelfPlayRng rng)
        {
            var replay=SelfPlayAim.Replayable(sim);
            if(replay.Count>0&&rng.NextDouble()<.25)return SelfPlayAim.ReplayAngle(sim,replay[rng.Next(replay.Count)],rng.Range(-80,80),rng.Range(60,590));
            var options=SelfPlayAim.SpawnOptions(sim,owner);
            return SelfPlayAim.Spawn(sim,owner,options[rng.Next(options.Count)],rng.Range(-80,80),rng.Range(60,590));
        }
    }

    // Constant power and angle (straight ahead, 420); only the ball choice is
    // seeded. Never replays.
    public sealed class FixedStrategy:ISelfPlayStrategy
    {
        public const double Power=420,Angle=0;
        public string Name=>"fixed";
        public PlayerCommand Choose(GameSimulation sim,int owner,SelfPlayRng rng)
        {
            var options=SelfPlayAim.SpawnOptions(sim,owner);
            return SelfPlayAim.Spawn(sim,owner,options[rng.Next(options.Count)],Angle,Power);
        }
    }

    // Simple positional heuristic: hit the enemy ball deepest in our half;
    // otherwise replay a friendly ball (50%) or launch into the enemy zone.
    // Ball choice: heaviest available special when defending, most remaining
    // stock when attacking. Small seeded aim noise (+-3 deg).
    public sealed class HeuristicStrategy:ISelfPlayStrategy
    {
        public string Name=>"heuristic";
        public PlayerCommand Choose(GameSimulation sim,int owner,SelfPlayRng rng)
        {
            float ly=SelfPlayAim.LauncherY(owner);
            var threats=sim.State.balls.Where(x=>!x.dead&&!x.banished&&x.owner!=owner&&(owner==0?x.y>450:x.y<450)).ToList();
            var options=SelfPlayAim.SpawnOptions(sim,owner);
            double noise=rng.Range(-3,3);
            if(threats.Count>0)
            {
                var t=threats.OrderBy(x=>Math.Abs(x.y-ly)).ThenBy(x=>x.id).First();
                string type=options.OrderByDescending(id=>sim.Catalog.Ball(id).mass).ThenBy(id=>options.IndexOf(id)).First();
                double dist=Math.Sqrt((t.x-SelfPlayAim.LauncherX)*(t.x-SelfPlayAim.LauncherX)+(t.y-ly)*(t.y-ly));
                return Rotate(SelfPlayAim.SpawnToward(sim,owner,type,t.x,t.y,SelfPlayAim.Clamp(260+dist*.6,60,590)),noise);
            }
            double tx=SelfPlayAim.LauncherX+rng.Range(-150,150),ty=owner==0?110:790;
            var replay=SelfPlayAim.Replayable(sim);
            if(replay.Count>0&&rng.NextDouble()<.5)
            {
                var b=replay[rng.Next(replay.Count)];
                double dist=Math.Sqrt((tx-b.x)*(tx-b.x)+(ty-b.y)*(ty-b.y));
                return Rotate(SelfPlayAim.ReplayToward(sim,b,tx,ty,SelfPlayAim.Clamp(220+dist*.5,60,590)),noise);
            }
            var stock=sim.State.players[owner].stock;
            string attack=options.OrderByDescending(id=>id=="normal"?-1:stock.First(x=>x.id==id).remaining).ThenBy(id=>options.IndexOf(id)).First();
            double d=Math.Abs(ty-ly);
            return Rotate(SelfPlayAim.SpawnToward(sim,owner,attack,tx,ty,SelfPlayAim.Clamp(220+d*.5,60,590)),noise);
        }
        static PlayerCommand Rotate(PlayerCommand c,double deg)
        {
            double a=deg*Math.PI/180,cos=Math.Cos(a),sin=Math.Sin(a);
            float dx=(float)(c.dx*cos-c.dy*sin),dy=(float)(c.dx*sin+c.dy*cos);c.dx=dx;c.dy=dy;return c;
        }
    }

    public static class SelfPlayStrategies
    {
        public static readonly string[] Names={"random","fixed","heuristic"};
        public static ISelfPlayStrategy Create(string name)=>name switch{"random"=>new RandomStrategy(),"fixed"=>new FixedStrategy(),"heuristic"=>new HeuristicStrategy(),_=>throw new ArgumentException("Unknown strategy: "+name)};
    }

    public sealed class SelfPlayConfig
    {
        public ulong Seed=20261102;
        public int PerCell=21;                 // 3 strategies x 16 ordered deck pairs x 21 = 1008 matches
        public string[] Strategies=SelfPlayStrategies.Names;
        public string[] DeckIds;               // null = the four featured decks
        public float Dt=1f/120;
        public int MaxFramesPerAction=4000;    // the in-game motion guard settles by 28 s = 3360 frames
        public int MaxActions=2000;            // hang guard: 50 turns x (1 spawn + one Replay per ball) stays far below this
        public int Threads=1;                  // matches are independent; results are stored by index, so thread count cannot change them
        public int MaxTurnNumber=51;           // MatchRules ends the match at turn 50
    }

    public sealed class MatchRecord
    {
        public int index,cell,repeat;
        public string seed,strategyP1,strategyP2,deckP1,deckP2;
        public string status="OK",failure="";
        public int winner=-2;
        public string winnerSide="NONE",endReason="",endClass="";
        public int turns,actions,spawns,frames,motionGuards,illegalProposals;
        public int[] replays=new int[2],baseHp=new int[2],alive=new int[2],graveyard=new int[2],spawnsBy=new int[2];
        public SortedDictionary<string,int> ballsP1=new SortedDictionary<string,int>(StringComparer.Ordinal),ballsP2=new SortedDictionary<string,int>(StringComparer.Ordinal);
        public string finalStateHash="";
        // Wall time is the only field excluded from determinism comparison.
        public double wallMs;

        public string DeterministicLine()=>string.Join(",",new[]{
            index.ToString(CultureInfo.InvariantCulture),cell.ToString(CultureInfo.InvariantCulture),repeat.ToString(CultureInfo.InvariantCulture),seed,strategyP1,strategyP2,deckP1,deckP2,status,Csv(failure),
            winner.ToString(CultureInfo.InvariantCulture),winnerSide,Csv(endReason),endClass,I(turns),I(actions),I(spawns),I(replays[0]),I(replays[1]),I(baseHp[0]),I(baseHp[1]),I(alive[0]),I(alive[1]),I(graveyard[0]),I(graveyard[1]),
            I(frames),I(motionGuards),I(illegalProposals),Balls(ballsP1),Balls(ballsP2),finalStateHash});
        public const string CsvHeader="index,cell,repeat,seed,strategy_p1,strategy_p2,deck_p1,deck_p2,status,failure,winner,winner_side,end_reason,end_class,turns,actions,spawns,replays_p1,replays_p2,base_hp_p1,base_hp_p2,alive_p1,alive_p2,graveyard_p1,graveyard_p2,frames,motion_guards,illegal_proposals,balls_p1,balls_p2,final_state_sha256_16";
        static string I(int v)=>v.ToString(CultureInfo.InvariantCulture);
        static string Balls(SortedDictionary<string,int> d)=>string.Join(";",d.Select(kv=>kv.Key+":"+kv.Value.ToString(CultureInfo.InvariantCulture)));
        static string Csv(string s)=>s==null?"":s.IndexOfAny(new[]{',','"','\n','\r'})>=0?"\""+s.Replace("\"","\"\"").Replace("\r"," ").Replace("\n"," ")+"\"":s;
    }

    public static class SelfPlayRunner
    {
        static readonly JsonSerializerOptions StateJson=new JsonSerializerOptions{IncludeFields=true,NumberHandling=System.Text.Json.Serialization.JsonNumberHandling.AllowNamedFloatingPointLiterals};

        public static DeckDefinition[] Decks(Catalog catalog,string[] ids)
        {
            if(ids==null||ids.Length==0)return catalog.Featured.ToArray();
            return ids.Select(id=>catalog.Deck(id)??throw new ArgumentException("Unknown deck: "+id)).ToArray();
        }

        // One match. Never throws: any exception, illegal state or hang is
        // returned as status FAILED with a reason so it shows up in the report.
        public static MatchRecord RunMatch(Catalog catalog,DeckDefinition p1,DeckDefinition p2,ISelfPlayStrategy s1,ISelfPlayStrategy s2,ulong seed,SelfPlayConfig config=null)
        {
            config??=new SelfPlayConfig();
            var r=new MatchRecord{seed=seed.ToString("x16",CultureInfo.InvariantCulture),strategyP1=s1.Name,strategyP2=s2.Name,deckP1=p1.id,deckP2=p2.id};
            var watch=Stopwatch.StartNew();
            GameSimulation sim=null;
            try
            {
                sim=new GameSimulation(catalog,p1,p2);
                var rng=new[]{new SelfPlayRng(SelfPlayRng.Mix(seed,1)),new SelfPlayRng(SelfPlayRng.Mix(seed,2))};
                var strategies=new[]{s1,s2};
                int lastEvent=sim.State.eventSerial;
                while(sim.State.phase!=MatchPhase.Over)
                {
                    if(r.actions>=config.MaxActions)throw new SelfPlayFailure("ACTION_LIMIT","more than "+config.MaxActions+" actions");
                    if(sim.State.turnNumber>config.MaxTurnNumber)throw new SelfPlayFailure("TURN_LIMIT","turn "+sim.State.turnNumber+" without a result");
                    if(sim.State.phase!=MatchPhase.Aiming)throw new SelfPlayFailure("PHASE","unexpected phase "+sim.State.phase);
                    int owner=sim.State.turn;
                    var command=strategies[owner].Choose(sim,owner,rng[owner]);
                    if(command==null||!Legal(sim,command))
                    {
                        // Counted, then replaced by the simplest legal action so the
                        // match still measures the rules rather than the bot bug.
                        r.illegalProposals++;
                        command=SelfPlayAim.Spawn(sim,owner,"normal",0,300);
                    }
                    command.sequence=r.actions+1;
                    if(!sim.TryCommand(command,out string reason))throw new SelfPlayFailure("REJECTED","TryCommand rejected a pre-validated command: "+reason);
                    r.actions++;
                    if(command.kind==CommandKind.Replay)r.replays[owner]++;
                    else{r.spawns++;r.spawnsBy[owner]++;var balls=owner==0?r.ballsP1:r.ballsP2;balls.TryGetValue(command.ballType,out int n);balls[command.ballType]=n+1;}
                    int frames=0;
                    while(sim.State.phase==MatchPhase.Moving)
                    {
                        if(++frames>config.MaxFramesPerAction)throw new SelfPlayFailure("ACTION_HANG","action did not resolve in "+config.MaxFramesPerAction+" frames");
                        sim.Step(config.Dt);
                        lastEvent=CountEvents(sim,lastEvent,r);
                    }
                    r.frames+=frames;
                    lastEvent=CountEvents(sim,lastEvent,r);
                    CheckInvariants(sim);
                }
                r.winner=sim.State.winner;
                r.endReason=sim.State.resultReason??"";
                r.endClass=Classify(r.endReason);
                if(r.winner<-1||r.winner>1)throw new SelfPlayFailure("RESULT","match over without a valid winner ("+r.winner+")");
                if(r.endClass=="UNKNOWN")throw new SelfPlayFailure("RESULT","unknown end reason '"+r.endReason+"'");
                r.winnerSide=r.winner==0?"P1":r.winner==1?"P2":"DRAW";
            }
            catch(Exception e)
            {
                r.status="FAILED";
                r.failure=(e is SelfPlayFailure f)?f.Code+": "+f.Message:"EXCEPTION: "+e.GetType().Name+": "+e.Message+" @ "+(e.TargetSite?.DeclaringType?.Name+"."+e.TargetSite?.Name);
                r.endClass="FAILED";
            }
            finally
            {
                if(sim!=null)
                {
                    r.turns=sim.State.turnNumber;
                    for(int o=0;o<2;o++)
                    {
                        r.baseHp[o]=sim.State.players[o].hp;
                        r.alive[o]=sim.State.balls.Count(b=>!b.dead&&!b.banished&&b.owner==o);
                        r.graveyard[o]=sim.State.graveyard.Count(g=>g.owner==o);
                    }
                    try{r.finalStateHash=Hash(JsonSerializer.Serialize(sim.State,StateJson));}catch(Exception e){r.finalStateHash="UNSERIALIZABLE:"+e.GetType().Name;}
                }
                watch.Stop();r.wallMs=watch.Elapsed.TotalMilliseconds;
            }
            return r;
        }

        // Mirrors the TryCommand admission rules without mutating the match, so
        // an illegal proposal is detected and counted instead of applied.
        public static bool Legal(GameSimulation sim,PlayerCommand c)
        {
            var s=sim.State;
            if(c.owner!=s.turn||c.turnNumber!=s.turnNumber||s.phase!=MatchPhase.Aiming)return false;
            if(!GameSimulation.Finite(c.dx)||!GameSimulation.Finite(c.dy)||!GameSimulation.Finite(c.power)||c.power<60||c.power>590)return false;
            if(Math.Sqrt((double)c.dx*c.dx+(double)c.dy*c.dy)<.0001)return false;
            if(c.kind==CommandKind.Replay)return sim.CanReplay(s.balls.FirstOrDefault(b=>b.id==c.ballId));
            if(c.kind!=CommandKind.Spawn||sim.Catalog.Ball(c.ballType)==null)return false;
            return c.ballType=="normal"||sim.Stock(c.owner,c.ballType)>0;
        }

        static void CheckInvariants(GameSimulation sim)
        {
            foreach(var p in sim.State.players)if(p.hp<0||p.hp>20)throw new SelfPlayFailure("INVARIANT","base HP "+p.hp+" outside 0..20");
            foreach(var b in sim.State.balls)if(!b.dead&&(!GameSimulation.Finite(b.x)||!GameSimulation.Finite(b.y)||!GameSimulation.Finite(b.vx)||!GameSimulation.Finite(b.vy)))throw new SelfPlayFailure("NON_FINITE","ball "+b.id+" ("+b.type+") has a non-finite position or velocity");
        }

        // Events are capped at 100 in GameState; read only the new tail.
        static int CountEvents(GameSimulation sim,int last,MatchRecord r)
        {
            var ev=sim.State.events;
            for(int i=ev.Count-1;i>=0&&ev[i].id>last;i--)if(ev[i].kind=="MOTION_GUARD")r.motionGuards++;
            return sim.State.eventSerial;
        }

        public static string Classify(string reason)
        {
            if(reason=="Base destroyed"||reason=="Both bases destroyed")return "BASE";
            if(reason!=null&&reason.StartsWith("50 turns:",StringComparison.Ordinal))return "TIEBREAK";
            return "UNKNOWN";
        }

        public static string Hash(string text)
        {
            using var sha=SHA256.Create();
            var bytes=sha.ComputeHash(Encoding.UTF8.GetBytes(text));
            return string.Concat(bytes.Take(8).Select(b=>b.ToString("x2",CultureInfo.InvariantCulture)));
        }

        public static ulong MatchSeed(ulong baseSeed,int cell,int repeat)=>SelfPlayRng.Mix(SelfPlayRng.Mix(baseSeed,(ulong)cell+1),(ulong)repeat+1);

        // All symmetric strategy pairings x all ordered pairs of the chosen
        // decks (including mirrors), PerCell seeds each. Deterministic order.
        public static List<MatchRecord> Run(Catalog catalog,SelfPlayConfig config,Action<MatchRecord> progress=null)
        {
            var decks=Decks(catalog,config.DeckIds);var jobs=new List<(int cell,int rep,string strategy,DeckDefinition a,DeckDefinition b)>();int cell=0;
            foreach(var name in config.Strategies)
            {
                SelfPlayStrategies.Create(name);
                foreach(var a in decks)
                    foreach(var b in decks)
                    {
                        for(int rep=0;rep<config.PerCell;rep++)jobs.Add((cell,rep,name,a,b));
                        cell++;
                    }
            }
            var results=new MatchRecord[jobs.Count];var gate=new object();
            void One(int i)
            {
                var j=jobs[i];
                var r=RunMatch(catalog,j.a,j.b,SelfPlayStrategies.Create(j.strategy),SelfPlayStrategies.Create(j.strategy),MatchSeed(config.Seed,j.cell,j.rep),config);
                r.index=i;r.cell=j.cell;r.repeat=j.rep;results[i]=r;
                if(progress!=null)lock(gate)progress(r);
            }
            if(config.Threads<=1)for(int i=0;i<jobs.Count;i++)One(i);
            else System.Threading.Tasks.Parallel.For(0,jobs.Count,new System.Threading.Tasks.ParallelOptions{MaxDegreeOfParallelism=config.Threads},One);
            return results.ToList();
        }

        public static string Digest(IEnumerable<MatchRecord> records)=>Hash(string.Join("\n",records.Select(r=>r.DeterministicLine())));

        public static string Csv(IEnumerable<MatchRecord> records)
        {
            var sb=new StringBuilder();sb.Append(MatchRecord.CsvHeader).Append('\n');
            foreach(var r in records)sb.Append(r.DeterministicLine()).Append('\n');
            return sb.ToString();
        }
        public static string TimingCsv(IEnumerable<MatchRecord> records)
        {
            var sb=new StringBuilder("index,wall_ms\n");
            foreach(var r in records)sb.Append(r.index.ToString(CultureInfo.InvariantCulture)).Append(',').Append(r.wallMs.ToString("0.###",CultureInfo.InvariantCulture)).Append('\n');
            return sb.ToString();
        }

        // Nearest-rank percentile (p in 0..1) on integers.
        public static int Percentile(IReadOnlyList<int> values,double p)
        {
            if(values==null||values.Count==0)return 0;
            var sorted=values.OrderBy(v=>v).ToArray();
            int rank=(int)Math.Ceiling(p*sorted.Length);
            return sorted[Math.Max(0,Math.Min(sorted.Length-1,rank-1))];
        }
    }

    public sealed class SelfPlayFailure:Exception
    {
        public readonly string Code;
        public SelfPlayFailure(string code,string message):base(message){Code=code;}
    }

    public sealed class SelfPlaySummary
    {
        public int total,completed,failed,p1Wins,p2Wins,draws,baseEnds,tiebreakEnds,illegalProposals,motionGuards;
        public double p1WinRate,p2WinRate,drawRate,tiebreakShare,replaysPerMatch;
        public int turnsMin,turnsMedian,turnsP90,turnsMax;
        public SortedDictionary<string,int> endReasons=new SortedDictionary<string,int>(StringComparer.Ordinal);
        public SortedDictionary<string,int> failures=new SortedDictionary<string,int>(StringComparer.Ordinal);
        public List<StrategyRow> strategies=new List<StrategyRow>();
        public List<CellRow> cells=new List<CellRow>();
        public List<BallRow> balls=new List<BallRow>();

        public sealed class StrategyRow{public string strategy;public int matches,p1Wins,p2Wins,draws,tiebreaks,turnsMedian,turnsP90,replays;}
        public sealed class CellRow{public string strategy,deckP1,deckP2;public int matches,p1Wins,p2Wins,draws,failed,tiebreaks,turnsMedian;}
        public sealed class BallRow{public string ball;public int launches,matchesUsed,sideWins,sideLosses,sideDraws;}

        static double Rate(int n,int d)=>d==0?0:Math.Round((double)n/d,4);

        public static SelfPlaySummary From(IReadOnlyList<MatchRecord> records)
        {
            var s=new SelfPlaySummary{total=records.Count};
            var ok=records.Where(r=>r.status=="OK").ToList();
            s.completed=ok.Count;s.failed=records.Count-ok.Count;
            s.p1Wins=ok.Count(r=>r.winner==0);s.p2Wins=ok.Count(r=>r.winner==1);s.draws=ok.Count(r=>r.winner==-1);
            s.p1WinRate=Rate(s.p1Wins,ok.Count);s.p2WinRate=Rate(s.p2Wins,ok.Count);s.drawRate=Rate(s.draws,ok.Count);
            s.baseEnds=ok.Count(r=>r.endClass=="BASE");s.tiebreakEnds=ok.Count(r=>r.endClass=="TIEBREAK");s.tiebreakShare=Rate(s.tiebreakEnds,ok.Count);
            s.illegalProposals=records.Sum(r=>r.illegalProposals);s.motionGuards=records.Sum(r=>r.motionGuards);
            s.replaysPerMatch=ok.Count==0?0:Math.Round(ok.Average(r=>(double)(r.replays[0]+r.replays[1])),3);
            var turns=ok.Select(r=>r.turns).ToList();
            s.turnsMin=turns.Count==0?0:turns.Min();s.turnsMax=turns.Count==0?0:turns.Max();
            s.turnsMedian=SelfPlayRunner.Percentile(turns,.5);s.turnsP90=SelfPlayRunner.Percentile(turns,.9);
            foreach(var r in ok){s.endReasons.TryGetValue(r.endReason,out int n);s.endReasons[r.endReason]=n+1;}
            foreach(var bad in records.Where(x=>x.status!="OK")){string key=bad.failure.Split(':')[0];s.failures.TryGetValue(key,out int n);s.failures[key]=n+1;}
            foreach(var g in ok.GroupBy(x=>x.strategyP1).OrderBy(grp=>Array.IndexOf(SelfPlayStrategies.Names,grp.Key)).ThenBy(grp=>grp.Key,StringComparer.Ordinal))
            {
                var t=g.Select(r=>r.turns).ToList();
                s.strategies.Add(new StrategyRow{strategy=g.Key,matches=g.Count(),p1Wins=g.Count(r=>r.winner==0),p2Wins=g.Count(r=>r.winner==1),draws=g.Count(r=>r.winner==-1),tiebreaks=g.Count(r=>r.endClass=="TIEBREAK"),turnsMedian=SelfPlayRunner.Percentile(t,.5),turnsP90=SelfPlayRunner.Percentile(t,.9),replays=g.Sum(r=>r.replays[0]+r.replays[1])});
            }
            foreach(var g in records.GroupBy(x=>x.cell).OrderBy(grp=>grp.Key))
            {
                var f=g.First();var good=g.Where(r=>r.status=="OK").ToList();
                s.cells.Add(new CellRow{strategy=f.strategyP1,deckP1=f.deckP1,deckP2=f.deckP2,matches=g.Count(),p1Wins=good.Count(r=>r.winner==0),p2Wins=good.Count(r=>r.winner==1),draws=good.Count(r=>r.winner==-1),failed=g.Count()-good.Count,tiebreaks=good.Count(r=>r.endClass=="TIEBREAK"),turnsMedian=SelfPlayRunner.Percentile(good.Select(r=>r.turns).ToList(),.5)});
            }
            var balls=new SortedDictionary<string,BallRow>(StringComparer.Ordinal);
            foreach(var r in ok)
                for(int side=0;side<2;side++)
                    foreach(var kv in side==0?r.ballsP1:r.ballsP2)
                    {
                        if(!balls.TryGetValue(kv.Key,out var row))balls[kv.Key]=row=new BallRow{ball=kv.Key};
                        row.launches+=kv.Value;row.matchesUsed++;
                        if(r.winner==side)row.sideWins++;else if(r.winner==-1)row.sideDraws++;else row.sideLosses++;
                    }
            s.balls=balls.Values.ToList();
            return s;
        }

        public string Markdown(SelfPlayConfig config,string digest,string environment,double totalSeconds)
        {
            var c=CultureInfo.InvariantCulture;var sb=new StringBuilder();
            string P(double v)=>(v*100).ToString("0.0",c)+"%";
            sb.Append("# CC-001 W19-03 self-play report\n\n");
            sb.Append("> Raw data for owner decisions Q3–Q7. Bots are simple (random / fixed power+angle / positional heuristic); results are **not** automatic balance verdicts.\n\n");
            sb.Append("| Field | Value |\n|---|---|\n");
            sb.Append("| seed | `").Append(config.Seed.ToString(c)).Append("` |\n| strategies | ").Append(string.Join(", ",config.Strategies)).Append(" (same strategy on both sides) |\n");
            sb.Append("| decks | ").Append(string.Join(", ",cells.Select(x=>x.deckP1).Distinct())).Append(" |\n| matches per cell | ").Append(config.PerCell.ToString(c)).Append(" |\n");
            sb.Append("| matches | ").Append(total.ToString(c)).Append(" (completed ").Append(completed.ToString(c)).Append(", **failed ").Append(failed.ToString(c)).Append("**) |\n");
            sb.Append("| determinism digest (wall time excluded) | `").Append(digest).Append("` |\n| environment | ").Append(environment).Append(" |\n| wall time | ").Append(totalSeconds.ToString("0.0",c)).Append(" s |\n\n");
            sb.Append("## Results\n\n| P1 win | P2 win | draw | base end | tiebreak (50 turns) | turns min / median / P90 / max | Replays per match | illegal proposals | motion guards |\n|---|---|---|---|---|---|---|---|---|\n");
            sb.Append("| ").Append(P(p1WinRate)).Append(" (").Append(p1Wins.ToString(c)).Append(") | ").Append(P(p2WinRate)).Append(" (").Append(p2Wins.ToString(c)).Append(") | ").Append(P(drawRate)).Append(" (").Append(draws.ToString(c)).Append(") | ")
              .Append(baseEnds.ToString(c)).Append(" | ").Append(P(tiebreakShare)).Append(" (").Append(tiebreakEnds.ToString(c)).Append(") | ")
              .Append(turnsMin.ToString(c)).Append(" / ").Append(turnsMedian.ToString(c)).Append(" / ").Append(turnsP90.ToString(c)).Append(" / ").Append(turnsMax.ToString(c)).Append(" | ")
              .Append(replaysPerMatch.ToString("0.00",c)).Append(" | ").Append(illegalProposals.ToString(c)).Append(" | ").Append(motionGuards.ToString(c)).Append(" |\n\n");
            sb.Append("### End reasons\n\n| reason | matches |\n|---|---|\n");
            foreach(var kv in endReasons)sb.Append("| ").Append(kv.Key).Append(" | ").Append(kv.Value.ToString(c)).Append(" |\n");
            if(failures.Count>0){sb.Append("\n### Failures\n\n| code | matches |\n|---|---|\n");foreach(var kv in failures)sb.Append("| ").Append(kv.Key).Append(" | ").Append(kv.Value.ToString(c)).Append(" |\n");}
            sb.Append("\n## By strategy\n\n| strategy | matches | P1 win | P2 win | draw | tiebreak | turns median / P90 | Replays |\n|---|---|---|---|---|---|---|---|\n");
            foreach(var r in strategies)sb.Append("| ").Append(r.strategy).Append(" | ").Append(r.matches.ToString(c)).Append(" | ").Append(P(Rate(r.p1Wins,r.matches))).Append(" | ").Append(P(Rate(r.p2Wins,r.matches))).Append(" | ").Append(P(Rate(r.draws,r.matches))).Append(" | ").Append(P(Rate(r.tiebreaks,r.matches))).Append(" | ").Append(r.turnsMedian.ToString(c)).Append(" / ").Append(r.turnsP90.ToString(c)).Append(" | ").Append(r.replays.ToString(c)).Append(" |\n");
            foreach(var strategy in cells.Select(x=>x.strategy).Distinct())
            {
                var rows=cells.Where(x=>x.strategy==strategy).ToList();var decks=rows.Select(x=>x.deckP1).Distinct().ToList();
                sb.Append("\n## Deck matrix — ").Append(strategy).Append("\n\nCell = P1 win / P2 win / draw (matches). Rows: P1 deck, columns: P2 deck.\n\n| P1 \\ P2 | ").Append(string.Join(" | ",decks.Select(Short))).Append(" |\n|---|").Append(string.Concat(decks.Select(_=>"---|"))).Append('\n');
                foreach(var a in decks)
                {
                    sb.Append("| ").Append(Short(a)).Append(" |");
                    foreach(var b in decks){var cellRow=rows.First(y=>y.deckP1==a&&y.deckP2==b);int n=cellRow.matches-cellRow.failed;sb.Append(' ').Append(cellRow.p1Wins.ToString(c)).Append(" / ").Append(cellRow.p2Wins.ToString(c)).Append(" / ").Append(cellRow.draws.ToString(c)).Append(" (").Append(n.ToString(c)).Append(cellRow.failed>0?", "+cellRow.failed.ToString(c)+" failed":"").Append(") |");}
                    sb.Append('\n');
                }
            }
            sb.Append("\n## Ball usage (all strategies)\n\nLaunches = spawns of that ball (Replays not included). Side result = result of the side that launched it at least once.\n\n| ball | launches | matches used | side W / L / D | side win % |\n|---|---|---|---|---|\n");
            foreach(var b in balls.OrderByDescending(x=>x.launches).ThenBy(x=>x.ball,StringComparer.Ordinal))
                sb.Append("| ").Append(b.ball).Append(" | ").Append(b.launches.ToString(c)).Append(" | ").Append(b.matchesUsed.ToString(c)).Append(" | ").Append(b.sideWins.ToString(c)).Append(" / ").Append(b.sideLosses.ToString(c)).Append(" / ").Append(b.sideDraws.ToString(c)).Append(" | ").Append(P(Rate(b.sideWins,b.matchesUsed))).Append(" |\n");
            return sb.ToString();
        }
        static string Short(string deck)=>deck.StartsWith("featured_",StringComparison.Ordinal)?deck.Substring(9):deck;
    }
}
