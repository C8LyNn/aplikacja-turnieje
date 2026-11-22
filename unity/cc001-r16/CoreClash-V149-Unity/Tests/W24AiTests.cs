using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.SelfPlay;

// CC-001 W24 (owner direction, 2026-11-22): "simulations that play a great many games, where the
// balance is checked and the computer is taught to play; a solo player picks a difficulty".
// The computer's brain (Core/AiBrain.cs) is the same code in the game and in the lab
// (Tests/SelfPlay/AiLab.cs); these tests guard the brain, the three levels and the lab's own maths.
public static partial class Program
{
    static void W24AiTests()
    {
        Test("W24 AI: three levels - each tries more shots than the one below; Easy never replays, Hard leaves nothing to chance",()=>{
            var easy=AiLevelSettings.For(AiLevel.Easy);var normal=AiLevelSettings.For(AiLevel.Normal);var hard=AiLevelSettings.For(AiLevel.Hard);
            int Shots(AiLevelSettings l)=>(l.Specials+1)*l.Powers.Length*l.Angles.Length;
            True(Shots(easy)<Shots(normal));True(Shots(normal)<Shots(hard));
            False(easy.Replays);True(normal.Replays);True(hard.Replays);
            True(easy.AimNoise>normal.AimNoise&&normal.AimNoise>hard.AimNoise);True(easy.ScoreNoise>normal.ScoreNoise&&normal.ScoreNoise>hard.ScoreNoise);
            Eq(0f,hard.AimNoise);Eq(0f,hard.ScoreNoise);
            // A deck holds nine special balls: Hard considers every one of them.
            Eq(9,hard.Specials);
            Eq(AiWeights.Count,new AiWeights().ToArray().Length);Eq(AiWeights.Count,AiWeights.Names.Length);
            var round=AiWeights.FromArray(new AiWeights().ToArray());True(round.ToArray().SequenceEqual(new AiWeights().ToArray()));
        });

        Test("W24 AI: the lab plays by the game's rules; candidates are legal shots of the player to move, replays only on a level that replays",()=>{
            var c=W22Catalog(out _);var sim=AiLab.NewMatch(c,c.Roster.Decks[0],c.Roster.Decks[1],7,out string map);
            True(MatchMaps.ById(map)!=null);Eq(map,sim.State.mapId);
            True(sim.State.plainPowers);True(sim.State.exclusiveFields);True(sim.State.comebackRule);Eq(1.5f,sim.State.ballScale);True(sim.ActiveRosterOnly);
            var random=new Random(1);
            foreach(AiLevel level in Enum.GetValues(typeof(AiLevel))){
                var list=AiBrain.Candidates(sim,AiLevelSettings.For(level),random);
                True(list.Count>0);True(list.All(x=>x.owner==0&&x.kind==CommandKind.Spawn&&x.turnNumber==sim.State.turnNumber));
                True(list.All(x=>x.dy<0),"player 1 shoots up the board");
                True(list.All(x=>x.ballType=="normal"||sim.Stock(0,x.ballType)>0));
                True(list.Any(x=>x.ballType=="normal"));
                // Every one of them is a command the rules accept.
                foreach(var command in list.Take(6)){var copy=AiLab.NewMatch(c,c.Roster.Decks[0],c.Roster.Decks[1],7,out _);True(copy.TryCommand(command,out _));}
            }
            // A ball of mine in my own zone: Normal offers to play it again, Easy does not.
            var home=sim.Spawn(0,"normal",270,800);
            True(AiBrain.Candidates(sim,AiLevelSettings.For(AiLevel.Normal),random).Any(x=>x.kind==CommandKind.Replay&&x.ballId==home.id));
            False(AiBrain.Candidates(sim,AiLevelSettings.For(AiLevel.Easy),random).Any(x=>x.kind==CommandKind.Replay));
            var fallback=AiBrain.Fallback(sim.State);Eq("normal",fallback.ballType);Eq(0,fallback.owner);True(fallback.dy<0);
        });

        Test("W24 AI: both players see the same position, each from their own side; a finished match outweighs everything",()=>{
            var c=W22Catalog(out _);var sim=AiLab.NewMatch(c,c.Roster.Decks[0],c.Roster.Decks[1],3,out _);
            sim.Spawn(0,"normal",270,450);sim.Spawn(0,"fire",200,150);var hurt=sim.Spawn(1,"ice",270,760);hurt.hp=10;hurt.fireStacks=2;sim.State.players[1].hp=14;
            var a=new float[AiWeights.Count];var b=new float[AiWeights.Count];AiBrain.Features(sim.State,0,a);AiBrain.Features(sim.State,1,b);
            Eq(6f,a[0]);Eq(-6f,b[0]);                              // base HP
            Eq(2f,a[1]);Eq(-2f,b[3]);Eq(-1f,a[3]);Eq(1f,b[1]);     // balls on the board
            Eq(2f,a[2]);Eq(-2f,b[4]);True(Math.Abs(a[4]+1/3f)<.001f);True(Math.Abs(b[2]-1/3f)<.001f);   // their health
            Eq(1f,a[5]);Eq(-1f,b[6]);                              // my ball in the enemy's zone is the enemy's problem
            Eq(-1f,a[6]);Eq(1f,b[5]);                              // and theirs in mine is my problem
            Eq(1f,a[7]);Eq(-1f,b[7]);                              // the centre
            Eq(2f,a[8]);Eq(-2f,b[8]);                              // the enemy ball is on fire twice
            Eq(0f,a[9]);Eq(0f,b[9]);                               // nobody has a ball to play again
            // The score is those numbers times the weights.
            var w=new AiWeights();var values=w.ToArray();float sum=0;for(int i=0;i<values.Length;i++)sum+=values[i]*a[i];
            True(Math.Abs(sum-AiBrain.Score(sim.State,0,w))<.001f);
            sim.State.phase=MatchPhase.Over;sim.State.winner=1;Eq(-1000f,AiBrain.Score(sim.State,0,w));Eq(1000f,AiBrain.Score(sim.State,1,w));
            sim.State.winner=-1;Eq(0f,AiBrain.Score(sim.State,0,w));
        });

        Test("W24 AI: a replay is taken only when it leaves the position better than it is now",()=>{
            var replay=new PlayerCommand{kind=CommandKind.Replay};var spawn=new PlayerCommand{kind=CommandKind.Spawn};
            True(ReferenceEquals(replay,AiBrain.Pick(replay,5,spawn,9,3)));      // better than now: the replay first, it does not end the turn
            True(ReferenceEquals(spawn,AiBrain.Pick(replay,3.5f,spawn,2,3)));    // not better than now by the margin: the spawn
            True(ReferenceEquals(spawn,AiBrain.Pick(null,0,spawn,2,3)));True(AiBrain.Pick(replay,0,null,0,3)==null);True(AiBrain.Pick(null,0,null,0,0)==null);   // a replay that helps nothing is never the answer
            // The replays stand first in the list, so they are tried first and a good one is played at once.
            var c=W22Catalog(out _);var sim=AiLab.NewMatch(c,c.Roster.Decks[0],c.Roster.Decks[1],7,out _);sim.Spawn(0,"normal",270,800);sim.Spawn(0,"normal",120,820);
            var list=AiBrain.Candidates(sim,AiLevelSettings.For(AiLevel.Hard),new Random(2),out int replays);
            True(replays>0&&replays<list.Count);True(list.Take(replays).All(x=>x.kind==CommandKind.Replay));True(list.Skip(replays).All(x=>x.kind==CommandKind.Spawn));
            Eq(2,list.Take(replays).Select(x=>x.ballId).Distinct().Count());
        });

        Test("W24 AI: two computer players finish a whole match under the game's rules with legal shots only, and the lab is repeatable",()=>{
            var c=W22Catalog(out _);var decks=c.Roster.Decks;
            var easy=new AiAgent{Level=AiLevelSettings.For(AiLevel.Easy),Weights=new AiWeights()};
            var match=AiLab.Play(c,decks[0],decks[3],easy,easy,11,true,true);
            True(match.Finished,"the match did not finish: a shot was refused or a ball never stopped");
            True(match.Winner>=-1&&match.Winner<=1);True(match.Turns>=3&&match.Turns<=51);True(match.Actions>=match.Turns-1);
            True(match.Launched.Values.Sum()>=match.Turns-1);
            True(match.Samples.Count>0);True(match.Samples.All(s=>s.F.Length==AiWeights.Count&&(s.Result==0||s.Result==1||s.Result==.5f)));
            True(match.EdgeCount.Count>0);True(match.EdgeCount.Keys.All(id=>id!="normal"&&decks[0].balls.Concat(decks[3].balls).Contains(id)));
            var again=AiLab.Play(c,decks[0],decks[3],easy,easy,11);
            Eq(match.Winner,again.Winner);Eq(match.Turns,again.Turns);Eq(match.Actions,again.Actions);Eq(match.BaseA,again.BaseA);Eq(match.BaseB,again.BaseB);Eq(match.Map,again.Map);
        });

        Test("W24 AI: the fit finds what really decides matches, and refuses to learn from chance",()=>{
            // Matches in which a ball in the enemy's zone ("attack") is worth three HP of base, far more than the starting weights think.
            List<LabSample> Make(int games,int seed,bool chance){
                var random=new Random(seed);var list=new List<LabSample>();
                double Normal()=>Math.Sqrt(-2*Math.Log(1-random.NextDouble()))*Math.Cos(2*Math.PI*random.NextDouble());
                for(int game=0;game<games;game++){
                    double baseHp=Normal()*3,attack=Normal()*1.5;float result=chance?random.Next(2):baseHp+3*attack+Normal()*2>0?1:0;
                    for(int k=0;k<8;k++){
                        var f=new float[AiWeights.Count];f[0]=(float)(baseHp+Normal());f[5]=(float)(attack+Normal()*.5);
                        for(int i=1;i<AiWeights.Count;i++)if(i!=5)f[i]=(float)Normal();
                        list.Add(new LabSample{F=f,Game=game,Mover=0,Result=result});
                    }
                }
                return list;
            }
            var fitted=AiLab.Fit(Make(900,1,false),Make(250,2,false),new AiWeights(),out string note);
            True(fitted!=null,note);True(Math.Abs(fitted.baseHp-6)<.01f);
            True(fitted.attack>8,"attack should have risen from 1 towards 18, got "+fitted.attack);
            True(fitted.ToArray().All(v=>v>=0&&v<=60));
            // Results drawn by a coin: nothing predicts them, so there is nothing to learn.
            var fromChance=AiLab.Fit(Make(900,3,true),Make(250,4,true),new AiWeights(),out string chanceNote);
            True(fromChance==null||Math.Abs(fromChance.attack-1)<1.5f,"learned from chance: "+chanceNote);
            True(AiLab.Fit(Make(20,5,false),Make(5,6,false),new AiWeights(),out _)==null);   // too few positions
        });

        Test("W24 AI: the game and the lab share one brain; the level is the player's choice and is remembered",()=>{
            string Source(string path)=>File.ReadAllText(Path.Combine(projectRoot,path));
            string ai=Source("Assets/CoreClash/Presentation/AiOpponent.cs");
            True(ai.Contains("AiBrain.Candidates(")&&ai.Contains("AiBrain.Score(")&&ai.Contains("AiBrain.Pick("));
            True(!ai.Contains("static float Score("),"the game has a second copy of the judgement");
            False(Source("Assets/CoreClash/Core/AiBrain.cs").Contains("UnityEngine"));
            string setup=Source("Assets/CoreClash/Presentation/MatchSetup.cs");
            True(setup.Contains("PlayerPrefs.SetInt(\"cc.ai.level\"")&&setup.Contains("PlayerPrefs.GetInt(\"cc.ai.level\""));
            string app=Source("Assets/CoreClash/Presentation/CoreClashApp.cs");
            True(app.Contains("aiLevel=MatchSetup.AiLevel"));True(app.Contains("ai.Think(Simulation,chosen[0],chosen[1],aiLevel,"));
            True(Source("Assets/CoreClash/Presentation/SettingsView.cs").Contains("MatchSetup.AiLevel=(AiLevel)pick"));
            // Weights the lab saved, when it saved any.
            string path=Path.Combine(projectRoot,"Assets/Resources/Data/ai-weights.json");
            if(File.Exists(path)){
                var learned=JsonSerializer.Deserialize<AiWeights>(File.ReadAllText(path),new JsonSerializerOptions{IncludeFields=true});
                True(Math.Abs(learned.baseHp-6)<.01f);True(learned.ToArray().All(v=>v>=0&&v<=60));True(learned.ToArray().Count(v=>v>0)>=5);
            }
        });
    }
}
