using CoreClash.Core;
using System.Text.Json;
using System.Linq;
public static partial class Program
{
    static void MatchSmokeTests()
    {
        var matches=new List<object>();
        foreach(var featured in catalog.Featured){
            Test("complete local Unity match with "+featured.name,()=>{
                var opponent=catalog.Data.decks[0];var s=new GameSimulation(catalog,featured,opponent);var used=new HashSet<string>();int actions=0,steps=0,guards=0;int next=0;
                while(s.State.phase!=MatchPhase.Over&&actions<75){
                    int owner=s.State.turn;string type="normal";
                    if(owner==0){for(int n=0;n<featured.balls.Length;n++){string candidate=featured.balls[(next+n)%featured.balls.Length];if(s.Stock(0,candidate)>0){type=candidate;next=(next+n+1)%featured.balls.Length;break;}}used.Add(type);}
                    float targetX=170+(actions*73%200),targetY=owner==0?190:710,originY=owner==0?853:47;
                    var command=new PlayerCommand{owner=owner,turnNumber=s.State.turnNumber,kind=CommandKind.Spawn,ballType=type,dx=targetX-270,dy=targetY-originY,power=520};
                    True(s.TryCommand(command,out var reason),reason);actions++;int beforeEvent=s.State.eventSerial;
                    for(int i=0;i<4000&&s.State.phase==MatchPhase.Moving;i++){s.Step(1f/120);steps++;foreach(var b in s.State.balls)True(GameSimulation.Finite(b.x)&&GameSimulation.Finite(b.y)&&GameSimulation.Finite(b.vx)&&GameSimulation.Finite(b.vy),"non-finite physics state");}
                    guards+=s.State.events.Count(e=>e.id>beforeEvent&&e.kind=="MOTION_GUARD");True(s.State.phase!=MatchPhase.Moving,"action failed to settle");
                }
                Eq(MatchPhase.Over,s.State.phase);True(s.State.turnNumber<=50);True(actions>2);
                matches.Add(new{deck=featured.id,name=featured.name,actions,turns=s.State.turnNumber,steps,motionGuards=guards,result=s.State.resultReason,winner=s.State.winner,bases=s.State.players.Select(x=>x.hp).ToArray(),selectedTypesDeployed=used.ToArray(),allNineDeployed=featured.balls.All(used.Contains)});
            });
        }
        File.WriteAllText(Path.Combine(projectRoot,"Evidence/unity-featured-matches.json"),JsonSerializer.Serialize(new{testedAt=DateTime.UtcNow,matches},new JsonSerializerOptions{WriteIndented=true}));
    }
}
