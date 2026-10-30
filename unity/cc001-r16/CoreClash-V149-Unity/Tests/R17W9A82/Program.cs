using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Networking;

// A82 R17-W9: isolated source-linked mechanics regression suite.
// This runner exercises the existing authoritative game model and serialised snapshots.
// It does NOT simulate two physical computers or the Unity/NGO transport.
public static class R17W9A82
{
    static int passed, failed;
    static Catalog catalog;
    static readonly JsonSerializerOptions Json = new JsonSerializerOptions { IncludeFields = true };

    public static int Main(string[] args)
    {
        var root = args.Length > 0 ? Path.GetFullPath(args[0])
            : Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../../"));
        var data = Path.Combine(root, "Assets", "Resources", "Data");
        try
        {
            catalog = new Catalog(
                JsonSerializer.Deserialize<CatalogData>(File.ReadAllText(Path.Combine(data, "catalog.json")), Json),
                JsonSerializer.Deserialize<FeaturedDeckData>(File.ReadAllText(Path.Combine(data, "featured-decks.json")), Json));
        }
        catch(Exception error)
        {
            Console.Error.WriteLine("A82 fixture setup failed: " + error.Message);
            return 2;
        }

        Run("W9 A82 host owner 0 acts, P2 cannot act before host settles", TestHostFirst);
        Run("W9 A82 P2 command remains illegal during P1 moving phase", TestCannotActDuringPhysics);
        Run("W9 A82 P2 exactly-one accepted action and opening bonus", TestP2Bonus);
        Run("W9 A82 wrong connection owner, duplicate and stale intents are inert", TestOwnerAndReplay);
        Run("W9 A82 snapshots converge after P1/P2 actions on logical client", TestSnapshotParity);
        Run("W9 A82 stale snapshot cannot teleport logical client backwards", TestStaleSnapshot);
        Run("W9 A82 post-bonus turn returns to P1 and forbids P2 extra action", TestNextTurn);
        Console.WriteLine("R17-W9 A82: " + passed + " PASS; " + failed + " FAIL");
        return failed == 0 ? 0 : 1;
    }

    static GameSimulation Sim()
    {
        var deck = new DeckDefinition {
            id="w9_a82_fixture",
            balls=new[]{"fire","ice","plague","rimeburst","pyrecore","medic","shield","cleanser","ward"}
        };
        return new GameSimulation(catalog, deck, deck);
    }

    static PlayerCommand Spawn(GameSimulation sim, int owner, int sequence) => new PlayerCommand {
        owner=owner,
        sequence=sequence,
        turnNumber=sim.State.turnNumber,
        kind=CommandKind.Spawn,
        ballType="normal",
        dx=0f,
        dy=owner==0?-1f:1f,
        power=420f
    };

    static void Resolve(GameSimulation sim)
    {
        for (int n=0; n<4000 && sim.State.phase==MatchPhase.Moving; n++)
            sim.Step(1f/120f);
        Check(sim.State.phase != MatchPhase.Moving, "physics did not settle in fixture");
    }

    static SessionSnapshot Snapshot(NetworkGameSession authority) =>
        authority.Capture(state => JsonSerializer.Serialize(state, Json));

    static bool Apply(NetworkGameStateAdapter replica, SessionSnapshot snapshot) =>
        replica.Apply(snapshot, json => JsonSerializer.Deserialize<GameState>(json, Json), out _);

    static void SameState(GameState host, GameState replica)
    {
        Check(replica != null, "replica missing");
        Equal(host.specVersion, replica.specVersion, "protocol state version");
        Equal(host.actionSerial, replica.actionSerial, "authoritative actionSerial");
        Equal(host.turn, replica.turn, "authoritative turn owner");
        Equal(host.turnNumber, replica.turnNumber, "turn counter");
        Equal(host.phase, replica.phase, "phase");
        Equal(host.bonusPending, replica.bonusPending, "opening bonus");
        Equal(host.balls.Count, replica.balls.Count, "ball count");
        for(int i=0;i<host.balls.Count;i++)
        {
            var a=host.balls[i];
            var b=replica.balls.SingleOrDefault(ball=>ball.id==a.id);
            Check(b!=null, "missing replicated ball "+a.id);
            Equal(a.owner,b.owner, "ball owner");
            Equal(a.hp,b.hp, "ball hp");
            Equal(a.x,b.x, "ball x");
            Equal(a.y,b.y, "ball y");
            Equal(a.vx,b.vx, "ball vx");
            Equal(a.vy,b.vy, "ball vy");
        }
    }

    static void TestHostFirst()
    {
        var sim=Sim();var server=new NetworkGameSession(sim);
        var earlyP2=Spawn(sim,1,1);
        Check(!server.Submit(1,earlyP2,out _), "P2 acted before its turn");
        Equal(0,sim.State.actionSerial,"rejected P2 serial");
        Check(server.Submit(0,Spawn(sim,0,1),out _), "host P1 shot rejected");
        Equal(1,sim.State.actionSerial,"host serial");
        Equal(0,sim.State.turn,"P1 remains current during resolution");
        Resolve(sim);
        Equal(1,sim.State.turn,"turn must pass to P2");
    }

    static void TestCannotActDuringPhysics()
    {
        var sim=Sim();var server=new NetworkGameSession(sim);
        Check(server.Submit(0,Spawn(sim,0,1),out _), "host action");
        int serial=sim.State.actionSerial, count=sim.State.balls.Count;
        Check(!server.Submit(1,Spawn(sim,1,1),out _),"P2 acted while P1 physics unresolved");
        Equal(serial,sim.State.actionSerial,"serial changed on premature P2 action");
        Equal(count,sim.State.balls.Count,"ball appeared during host resolution");
        Resolve(sim);
        Check(server.Submit(1,Spawn(sim,1,1),out _),"valid P2 action rejected after settling");
    }

    static void TestP2Bonus()
    {
        var sim=Sim();var server=new NetworkGameSession(sim);
        Check(server.Submit(0,Spawn(sim,0,1),out _),"P1");
        Resolve(sim);
        Check(server.Submit(1,Spawn(sim,1,1),out _),"P2 first");
        Check(!server.Submit(1,Spawn(sim,1,1),out _),"duplicate P2 applied");
        Resolve(sim);
        Check(sim.State.bonusPending,"P2 opening extra spawn unavailable");
        Equal(1,sim.State.turn,"P2 remains current for bonus");
        Check(server.Submit(1,Spawn(sim,1,2),out _),"P2 opening bonus rejected");
        Equal(3,sim.State.actionSerial,"exactly three accepted actions");
        Check(!server.Submit(1,Spawn(sim,1,2),out _),"bonus double applied");
    }

    static void TestOwnerAndReplay()
    {
        var sim=Sim();var server=new NetworkGameSession(sim);
        var wrong=Spawn(sim,0,800);
        Check(!server.Submit(1,wrong,out _),"connection P2 submitted spoofed P1");
        Equal(0,sim.State.actionSerial,"spoof mutated authority");
        Check(server.Submit(0,Spawn(sim,0,1),out _),"P1 rejected");
        Check(!server.Submit(0,Spawn(sim,0,1),out _),"P1 duplicate accepted");
        Resolve(sim);
        Check(!server.Submit(0,Spawn(sim,0,2),out _),"P1 acted on P2 turn");
        var legal=Spawn(sim,1,1);
        Check(server.Submit(1,legal,out _),"legal P2 rejected");
        Check(!server.Submit(1,legal,out _),"identical P2 retransmission accepted");
        Equal(2,sim.State.actionSerial,"duplicate applied a third action");
    }

    static void TestSnapshotParity()
    {
        var sim=Sim();var server=new NetworkGameSession(sim);
        var client=new NetworkGameStateAdapter();
        Check(Apply(client,Snapshot(server)),"initial snapshot");
        SameState(sim.State,client.State);
        Check(server.Submit(0,Spawn(sim,0,1),out _),"P1");
        Resolve(sim);
        Check(Apply(client,Snapshot(server)),"after host settle");
        SameState(sim.State,client.State);
        Check(server.Submit(1,Spawn(sim,1,1),out _),"P2");
        Resolve(sim);
        Check(Apply(client,Snapshot(server)),"after client settle");
        SameState(sim.State,client.State);
        Check(server.Submit(1,Spawn(sim,1,2),out _),"P2 bonus");
        Resolve(sim);
        Check(Apply(client,Snapshot(server)),"after P2 bonus settle");
        SameState(sim.State,client.State);
    }

    static void TestStaleSnapshot()
    {
        var sim=Sim();var server=new NetworkGameSession(sim);
        var replica=new NetworkGameStateAdapter();
        var old=Snapshot(server);
        Check(Apply(replica,old),"first snapshot");
        Check(server.Submit(0,Spawn(sim,0,1),out _),"host action");
        Resolve(sim);
        var latest=Snapshot(server);
        Check(Apply(replica,latest),"new snapshot");
        SameState(sim.State,replica.State);
        Check(!Apply(replica,old),"stale earlier host state accepted");
        Check(!Apply(replica,latest),"duplicate latest state accepted");
        SameState(sim.State,replica.State);
    }

    static void TestNextTurn()
    {
        var sim=Sim();var server=new NetworkGameSession(sim);
        Check(server.Submit(0,Spawn(sim,0,1),out _),"P1");
        Resolve(sim);
        Check(server.Submit(1,Spawn(sim,1,1),out _),"P2");
        Resolve(sim);
        Check(server.Submit(1,Spawn(sim,1,2),out _),"P2 bonus");
        Resolve(sim);
        Equal(0,sim.State.turn,"turn must return to P1");
        Check(!sim.State.bonusPending,"P2 extra spawn persisted");
        var illegal=Spawn(sim,1,3);
        Check(!server.Submit(1,illegal,out _),"P2 received a third consecutive action");
        Equal(3,sim.State.actionSerial,"illegal P2 action mutated actionSerial");
        Check(server.Submit(0,Spawn(sim,0,2),out _),"P1 could not resume after P2 bonus");
        Equal(4,sim.State.actionSerial,"P1 resumed serial");
    }

    static void Run(string title, Action action)
    {
        try { action(); passed++; Console.WriteLine("PASS " + title); }
        catch(Exception error) { failed++; Console.WriteLine("FAIL " + title + ": " + error); }
    }
    static void Check(bool value, string message) { if(!value) throw new Exception(message); }
    static void Equal<T>(T expected,T actual,string field)
    {
        if(!EqualityComparer<T>.Default.Equals(expected,actual))
            throw new Exception(field + ": expected " + expected + ", received " + actual);
    }
}
