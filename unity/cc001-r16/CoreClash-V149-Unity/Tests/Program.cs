using CoreClash.Core;
using CoreClash.Data;
using System.Text.Json;

public static partial class Program
{
    static Catalog catalog;
    static int failed,passed;
    static string projectRoot;
    static readonly List<object> results=new List<object>();
    static void Main(string[] args)
    {
        string root=args.Length>0?args[0]:Path.GetFullPath(Path.Combine(AppContext.BaseDirectory,"../../../../"));
        projectRoot=root;
        var json=new JsonSerializerOptions{IncludeFields=true};
        catalog=new Catalog(JsonSerializer.Deserialize<CatalogData>(File.ReadAllText(Path.Combine(root,"Assets/Resources/Data/catalog.json")),json),JsonSerializer.Deserialize<FeaturedDeckData>(File.ReadAllText(Path.Combine(root,"Assets/Resources/Data/featured-decks.json")),json));
        Test("new match has source bases and distinct owners",()=>{var s=Sim();Eq(20,s.State.players[0].hp);Eq(20,s.State.players[1].hp);Eq(0,s.State.turn);Eq(1,s.State.turnNumber);});
        Test("wrong owner cannot consume stock or create a ball",()=>{var s=Sim();False(s.TryCommand(Shot(s,1,"fire"),out _));Eq(0,s.State.balls.Count);Eq(7,s.Stock(1,"fire"));});
        Test("NaN and infinite aim cannot mutate match",()=>{var s=Sim();var c=Shot(s);c.dx=float.NaN;False(s.TryCommand(c,out _));c.dx=0;c.power=float.PositiveInfinity;False(s.TryCommand(c,out _));Eq(0,s.State.balls.Count);});
        Test("launch consumes one special and follows owner forward direction",()=>{var s=Sim();True(s.TryCommand(Shot(s,0,"fire"),out _));Eq(6,s.Stock(0,"fire"));Eq(1,s.State.balls.Count);True(s.State.balls[0].vy<0);Eq(35,s.State.balls[0].hp);});
        Test("Standard has unlimited stock",()=>{var s=Sim();True(s.TryCommand(Shot(s),out _));True(s.Stock(0,"normal")>1000);});
        Test("unavailable special is rejected before spawn",()=>{var s=Sim();False(s.TryCommand(Shot(s,0,"genesis"),out _));Eq(0,s.State.balls.Count);});
        Test("replay stays in same turn and each ball replays once",()=>{var s=Sim();var b=s.Spawn(0,"normal",180,750);var c=Shot(s);c.kind=CommandKind.Replay;c.ballId=b.id;True(s.TryCommand(c,out _));Settle(s);Eq(0,s.State.turn);c.turnNumber=s.State.turnNumber;False(s.TryCommand(c,out _));});
        Test("second player gets exactly one extra spawn before turn advances",()=>{var s=Sim();True(s.TryCommand(Shot(s),out _));Settle(s);Eq(1,s.State.turn);True(s.TryCommand(Shot(s,1),out _));Settle(s);Eq(1,s.State.turn);True(s.State.bonusPending);True(s.TryCommand(Shot(s,1),out _));Settle(s);Eq(0,s.State.turn);Eq(3,s.State.turnNumber);False(s.State.bonusPending);});
        Test("enemy collision damage follows closing speed and not five-HP packets",()=>{var s=Sim();BallRuntime a=s.Spawn(0,"normal",220,450),b=s.Spawn(1,"normal",260,450);a.vx=200;s.Collisions.Resolve(a,b);Eq(25,a.hp);Eq(25,b.hp);True(b.vx>0);});
        Test("weak collision does not damage",()=>{var s=Sim();BallRuntime a=s.Spawn(0,"normal",220,450),b=s.Spawn(1,"normal",260,450);a.vx=50;s.Collisions.Resolve(a,b);Eq(30,a.hp);Eq(30,b.hp);});
        Test("friendly collision causes no kinetic HP loss",()=>{var s=Sim();BallRuntime a=s.Spawn(0,"normal",220,450),b=s.Spawn(0,"normal",260,450);a.vx=400;s.Collisions.Resolve(a,b);Eq(30,a.hp);Eq(30,b.hp);});
        Test("STOP requires hold and emits once until motion restarts",()=>{var s=Sim();var b=s.Spawn(0,"normal",270,450);b.moving=true;s.Physics.UpdateMotion(b,.05f);Eq(0,b.stopCount);s.Physics.UpdateMotion(b,.08f);Eq(1,b.stopCount);s.Physics.UpdateMotion(b,.2f);Eq(1,b.stopCount);});
        Test("shield absorbs exact kinetic damage before HP",()=>{var s=Sim();var b=s.Spawn(0,"normal",270,450);b.shield=7;s.Damage(b,10,true);Eq(27,b.hp);Eq(0,b.shield);});
        Test("simultaneous destroyed bases resolve as a draw",()=>{var s=Sim();s.State.players[0].hp=0;s.State.players[1].hp=0;s.Rules.CheckVictory();Eq(MatchPhase.Over,s.State.phase);Eq(-1,s.State.winner);});
        Test("50-turn tie-break uses base HP then board count then draw",()=>{var s=Sim();s.State.turnNumber=50;s.Rules.ResolveTurnLimit();Eq(-1,s.State.winner);var t=Sim();t.State.turnNumber=50;t.Spawn(1,"normal",120,400);t.Rules.ResolveTurnLimit();Eq(1,t.State.winner);});
        Test("enemy-zone pressure uses touching circumference",()=>{var s=Sim();s.Spawn(0,"normal",100,210);s.Spawn(0,"normal",400,100);s.Rules.ApplyTurnPressure(0);Eq(18,s.State.players[1].hp);});
        Test("center lead of two deals one and lead of four deals three",()=>{var s=Sim();s.Spawn(0,"normal",250,450);s.Spawn(0,"normal",290,450);s.Rules.ApplyTurnPressure(0);Eq(19,s.State.players[1].hp);s.Spawn(0,"normal",270,420);s.Spawn(0,"normal",270,480);s.Rules.ApplyTurnPressure(0);Eq(16,s.State.players[1].hp);});
        ExtraTests();
        LocalDeckContentTests();
        RemoteBallSmootherTests();
        NetworkSeatTests();
        OnlineSessionTests();
        DeviceTests();
        A21W11SecondaryHelpTests();
        MomentumTests();
        ExplosiveTests();
        ConstructionTests();
        ReinforcementTests();
        EvolutionTests();
        ElementalTests();
        IntegrationR14Tests();
        StabilityR15Tests();
        StabilityR16Tests();
        StatusPayoffTests();
        Console.WriteLine($"RESULT: {passed} passed, {failed} failed");Environment.ExitCode=failed==0?0:1;
        Directory.CreateDirectory(Path.Combine(root,"Evidence"));File.WriteAllText(Path.Combine(root,"Evidence/unity-tests.json"),JsonSerializer.Serialize(new{spec="V149 UNITY",testedAt=DateTime.UtcNow,passed,failed,results},new JsonSerializerOptions{WriteIndented=true}));
        var support=catalog.Data.balls.Select(b=>new{id=b.id,name=b.name,hidden=b.hidden,status=AbilitySupport.Status(b.id),featured=catalog.Featured.Any(d=>d.balls.Contains(b.id))}).ToArray();
        File.WriteAllText(Path.Combine(root,"Evidence/ability-support.json"),JsonSerializer.Serialize(new{testedAt=DateTime.UtcNow,categories=new[]{"UNITY_READY","PARTIAL","DATA_ONLY","NOT_PORTED"},counts=support.GroupBy(b=>b.status).ToDictionary(g=>g.Key,g=>g.Count()),balls=support},new JsonSerializerOptions{WriteIndented=true}));
    }
    static partial void ExtraTests();
    static GameSimulation Sim(){var d=new DeckDefinition{id="test_fixture",balls=new[]{"fire","ice","plague","rimeburst","pyrecore","medic","shield","cleanser","ward"}};return new GameSimulation(catalog,d,d);}
    static PlayerCommand Shot(GameSimulation s,int owner=0,string id="normal")=>new PlayerCommand{owner=owner,turnNumber=s.State.turnNumber,kind=CommandKind.Spawn,ballType=id,dx=0,dy=owner==0?-1:1,power=420};
    static void Settle(GameSimulation s){for(int i=0;i<4000&&s.State.phase==MatchPhase.Moving;i++)s.Step(1f/120);True(s.State.phase!=MatchPhase.Moving,"action did not settle");}
    static void Test(string n,Action a){try{a();passed++;results.Add(new{name=n,pass=true});Console.WriteLine("PASS "+n);}catch(Exception e){failed++;results.Add(new{name=n,pass=false,error=e.Message});Console.WriteLine("FAIL "+n+": "+e.Message);}}
    static void True(bool x,string m="expected true"){if(!x)throw new Exception(m);}static void False(bool x)=>True(!x,"expected false");
    static void Eq<T>(T want,T got){if(!EqualityComparer<T>.Default.Equals(want,got))throw new Exception($"expected {want}, got {got}");}
    static void Near(float want,float got,float tol=.01f){True(Math.Abs(want-got)<=tol,$"expected {want}, got {got}");}
}
