using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.SelfPlay;

// CC-001 W19-03 (#291): the headless self-play runner drives the real
// GameSimulation only through TryCommand + Step and must be deterministic.
public static partial class Program
{
    sealed class W19IllegalStrategy:ISelfPlayStrategy
    {
        public string Name=>"illegal";
        public PlayerCommand Choose(GameSimulation sim,int owner,SelfPlayRng rng)=>SelfPlayAim.Spawn(sim,owner,"normal",0,9999);
    }
    sealed class W19CrashStrategy:ISelfPlayStrategy
    {
        public string Name=>"crash";
        public PlayerCommand Choose(GameSimulation sim,int owner,SelfPlayRng rng)
        {
            if(sim.State.turnNumber>=3)throw new InvalidOperationException("bot crashed on purpose");
            return SelfPlayAim.Spawn(sim,owner,"normal",0,300);
        }
    }

    static void W19SelfPlayChecks(MatchRecord r)
    {
        Eq("OK",r.status);Eq("",r.failure);Eq(0,r.illegalProposals);
        True(r.winner>=-1&&r.winner<=1,"winner "+r.winner);
        True(r.endClass=="BASE"||r.endClass=="TIEBREAK","end class "+r.endClass+" / "+r.endReason);
        True(r.turns>=1&&r.turns<=50,"turns "+r.turns);
        if(r.endClass=="BASE")True(r.baseHp[0]==0||r.baseHp[1]==0,"base end without a destroyed base");
        else Eq(50,r.turns);
        Eq(r.spawnsBy[0],r.ballsP1.Values.Sum());Eq(r.spawnsBy[1],r.ballsP2.Values.Sum());
        Eq(r.actions,r.spawns+r.replays[0]+r.replays[1]);
        True(r.finalStateHash.Length==16,"state hash "+r.finalStateHash);
    }

    static void W19SelfPlayTests()
    {
        var json=new JsonSerializerOptions{IncludeFields=true};
        string catalogBefore=JsonSerializer.Serialize(catalog.Data,json)+JsonSerializer.Serialize(catalog.Featured,json);
        List<MatchRecord> first=null;

        Test("W19-03 same seed and config give bit-identical match records, also across thread counts",()=>{
            var config=new SelfPlayConfig{Seed=291,PerCell=1,Strategies=new[]{"random"},DeckIds=new[]{"featured_death_engine","featured_gravity_trap"},Threads=1};
            first=SelfPlayRunner.Run(catalog,config);
            var second=SelfPlayRunner.Run(catalog,new SelfPlayConfig{Seed=291,PerCell=1,Strategies=new[]{"random"},DeckIds=new[]{"featured_death_engine","featured_gravity_trap"},Threads=2});
            Eq(4,first.Count);Eq(4,second.Count);
            for(int i=0;i<first.Count;i++)Eq(first[i].DeterministicLine(),second[i].DeterministicLine());
            Eq(SelfPlayRunner.Csv(first),SelfPlayRunner.Csv(second));Eq(SelfPlayRunner.Digest(first),SelfPlayRunner.Digest(second));
            True(first.Select(r=>r.finalStateHash).Distinct().Count()>1,"different seeds/decks must not collapse to one game");
            Eq("featured_death_engine",first[0].deckP1);Eq("featured_gravity_trap",first[1].deckP2);Eq("featured_gravity_trap",first[2].deckP1);
        });
        Test("W19-03 built-in strategies play legal commands and every match ends by the real rules",()=>{
            foreach(var r in first)W19SelfPlayChecks(r);
            var a=catalog.Deck("featured_status_reactor");var b=catalog.Deck("featured_reality_hackers");
            foreach(var name in new[]{"fixed","heuristic"}){
                var r=SelfPlayRunner.RunMatch(catalog,a,b,SelfPlayStrategies.Create(name),SelfPlayStrategies.Create(name),SelfPlayRunner.MatchSeed(291,7,0));
                W19SelfPlayChecks(r);True(r.spawns>=2);
                if(name=="fixed")Eq(0,r.replays[0]+r.replays[1]);
            }
            True(first.Any(r=>r.replays[0]+r.replays[1]>0),"random strategy never used Replay");
        });
        Test("W19-03 an illegal proposal is counted and replaced by a legal Standard launch, never applied",()=>{
            var d=catalog.Deck("featured_death_engine");
            var r=SelfPlayRunner.RunMatch(catalog,d,d,new W19IllegalStrategy(),new HeuristicStrategy(),5);
            Eq("OK",r.status);Eq(r.spawnsBy[0],r.illegalProposals);True(r.illegalProposals>0);
            Eq(1,r.ballsP1.Count);Eq("normal",r.ballsP1.Keys.Single());
            var probe=new GameSimulation(catalog,d,d);
            False(SelfPlayRunner.Legal(probe,SelfPlayAim.Spawn(probe,0,"normal",0,9999)));
            False(SelfPlayRunner.Legal(probe,SelfPlayAim.Spawn(probe,1,"normal",0,300)));
            False(SelfPlayRunner.Legal(probe,SelfPlayAim.Spawn(probe,0,"genesis",0,300)));
            True(SelfPlayRunner.Legal(probe,SelfPlayAim.Spawn(probe,0,"agony",0,300)));
            Eq(0,probe.State.balls.Count);
        });
        Test("W19-03 a crashing bot or a hung action is a FAILED record in the report, not a skipped match",()=>{
            var d=catalog.Deck("featured_gravity_trap");
            var crash=SelfPlayRunner.RunMatch(catalog,d,d,new W19CrashStrategy(),new W19CrashStrategy(),9);
            Eq("FAILED",crash.status);True(crash.failure.StartsWith("EXCEPTION: InvalidOperationException: bot crashed on purpose"),crash.failure);Eq("FAILED",crash.endClass);Eq(3,crash.turns);
            var hung=SelfPlayRunner.RunMatch(catalog,d,d,new FixedStrategy(),new FixedStrategy(),9,new SelfPlayConfig{MaxFramesPerAction=1});
            Eq("FAILED",hung.status);True(hung.failure.StartsWith("ACTION_HANG"),hung.failure);
            var ok=SelfPlayRunner.RunMatch(catalog,d,d,new FixedStrategy(),new FixedStrategy(),9);
            var s=SelfPlaySummary.From(new List<MatchRecord>{crash,ok,hung});
            Eq(3,s.total);Eq(1,s.completed);Eq(2,s.failed);Eq(1,s.failures["EXCEPTION"]);Eq(1,s.failures["ACTION_HANG"]);
            True(SelfPlayRunner.Csv(new[]{crash,ok,hung}).Split('\n').Count(l=>l.Contains(",FAILED,"))==2,"failed rows missing from CSV");
        });
        Test("W19-03 summary math: winrates, nearest-rank median/P90, tiebreak share, deck matrix and ball usage",()=>{
            Eq(3,SelfPlayRunner.Percentile(new[]{5,1,3,2,4},.5));Eq(5,SelfPlayRunner.Percentile(new[]{5,1,3,2,4},.9));Eq(9,SelfPlayRunner.Percentile(Enumerable.Range(1,10).ToList(),.9));Eq(10,SelfPlayRunner.Percentile(Enumerable.Range(1,10).ToList(),.91));Eq(0,SelfPlayRunner.Percentile(new int[0],.5));
            MatchRecord R(int cell,int winner,string reason,int turns,string ball)=>new MatchRecord{cell=cell,strategyP1="random",strategyP2="random",deckP1="featured_a",deckP2=cell==0?"featured_a":"featured_b",winner=winner,endReason=reason,endClass=SelfPlayRunner.Classify(reason),turns=turns,ballsP1=new SortedDictionary<string,int>(StringComparer.Ordinal){{ball,2}}};
            var s=SelfPlaySummary.From(new List<MatchRecord>{R(0,0,"Base destroyed",20,"agony"),R(0,1,"Base destroyed",30,"agony"),R(1,-1,"50 turns: identical score",50,"web"),R(1,0,"50 turns: base HP",50,"web")});
            Eq(4,s.completed);Eq(2,s.p1Wins);Eq(1,s.p2Wins);Eq(1,s.draws);Near(.5f,(float)s.p1WinRate);Near(.5f,(float)s.tiebreakShare);
            Eq(30,s.turnsMedian);Eq(50,s.turnsP90);Eq(20,s.turnsMin);Eq(50,s.turnsMax);
            Eq(2,s.cells.Count);Eq(1,s.cells[0].p1Wins);Eq(1,s.cells[0].p2Wins);Eq(1,s.cells[1].draws);Eq(2,s.cells[1].tiebreaks);
            var agony=s.balls.Single(b=>b.ball=="agony");Eq(4,agony.launches);Eq(2,agony.matchesUsed);Eq(1,agony.sideWins);Eq(1,agony.sideLosses);
            Eq("UNKNOWN",SelfPlayRunner.Classify("Opponent left"));
            string md=s.Markdown(new SelfPlayConfig{PerCell=2},"abc","test",1);
            True(md.Contains("not** automatic balance verdicts")&&md.Contains("Deck matrix — random")&&md.Contains("| agony | 4 | 2 |"),"markdown report incomplete");
        });
        Test("W19-03 self-play acts only through TryCommand/Step and leaves catalog and decks unchanged",()=>{
            Eq(catalogBefore,JsonSerializer.Serialize(catalog.Data,json)+JsonSerializer.Serialize(catalog.Featured,json));
            string src=File.ReadAllText(Path.Combine(projectRoot,"Tests/SelfPlay/SelfPlayRunner.cs"));
            Eq(0,Regex.Matches(src,@"sim\.(Spawn|Damage|Kill|Heal|Shield)\(").Count);
            Eq(0,Regex.Matches(src,@"\.State\.[A-Za-z0-9_\[\]\.]+\s*(\+|-)?=[^=]").Count);
            Eq(0,Regex.Matches(src,@"\b(Physics|Collisions|Rules|Turns|Abilities|Structures)\.").Count);
            True(src.Contains("sim.TryCommand(command,out string reason)")&&src.Contains("sim.Step(config.Dt)"),"runner must use the authoritative entry points");
            Eq(0,Regex.Matches(src,@"new Random\(|DateTime|GetHashCode\(|Guid\.").Count);
        });
    }
}
