using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Presentation;

// CC-001 W22 (active roster and freezer). The catalog keeps all 227 balls; the roster
// only decides what normal play offers. Every other test in this suite runs on a catalog
// without a roster, i.e. exactly as before W22.
public static partial class Program
{
    static Catalog W22Catalog(out RosterData data)
    {
        var json=new JsonSerializerOptions{IncludeFields=true};
        var c=new Catalog(JsonSerializer.Deserialize<CatalogData>(File.ReadAllText(Path.Combine(projectRoot,"Assets/Resources/Data/catalog.json")),json),JsonSerializer.Deserialize<FeaturedDeckData>(File.ReadAllText(Path.Combine(projectRoot,"Assets/Resources/Data/featured-decks.json")),json));
        data=JsonSerializer.Deserialize<RosterData>(File.ReadAllText(Path.Combine(projectRoot,"Assets/Resources/Data/roster.json")),json);
        c.UseRoster(data);
        return c;
    }

    static void Throws(Action action){bool thrown=false;try{action();}catch(ArgumentException){thrown=true;}True(thrown,"expected the roster to be rejected");}

    static void W22RosterTests()
    {
        Test("W22 roster: Standard + 30 implemented specials, nothing removed from the catalog",()=>{
            var c=W22Catalog(out var data);
            Eq(227,c.Data.balls.Length);Eq(36,c.Data.decks.Length);Eq(4,c.Featured.Length);
            Eq(31,data.active.Length);True(c.IsActive("normal"));
            foreach(string id in data.active)
            {
                True(c.Ball(id)!=null&&!c.Ball(id).hidden,"active id is not a pickable catalog ball: "+id);
                True(AbilitySupport.Status(id)!="DATA_ONLY","active ball has no working power: "+id);
                True(BallIcons.Has(id),"active ball without an icon: "+id);
            }
            Eq(RosterTier.Active,c.Roster.Tier(c,"bomb"));Eq(RosterTier.Rework,c.Roster.Tier(c,"wildcard"));Eq(RosterTier.Freezer,c.Roster.Tier(c,"plague"));
            Eq(RosterTier.Internal,c.Roster.Tier(c,"broodling"));Eq(RosterTier.Internal,c.Roster.Tier(c,"shard"));Eq(RosterTier.Freezer,c.Roster.Tier(c,"missing"));
            Eq(31,c.Data.balls.Count(b=>c.Roster.Tier(c,b.id)==RosterTier.Active));Eq(14,c.Data.balls.Count(b=>c.Roster.Tier(c,b.id)==RosterTier.Rework));
            Eq(180,c.Data.balls.Count(b=>c.Roster.Tier(c,b.id)==RosterTier.Freezer));Eq(2,c.Data.balls.Count(b=>c.Roster.Tier(c,b.id)==RosterTier.Internal));
            // every frozen ball is still a full definition with its ability
            foreach(var ball in c.Data.balls)True(c.Ball(ball.id)==ball&&c.Ability(ball.abilityId)!=null,"definition lost: "+ball.id);
            // without a roster nothing is frozen (the catalog every older test uses)
            True(catalog.Roster==null&&catalog.Data.balls.All(b=>catalog.IsActive(b.id)));False(catalog.IsActive("missing"));
        });
        Test("W22 roster decks: six legal decks of active balls that together use the whole roster",()=>{
            var c=W22Catalog(out var data);
            Eq(6,c.Roster.Decks.Length);
            var used=new HashSet<string>();
            foreach(var deck in c.Roster.Decks)
            {
                c.ValidateDeck(deck);True(c.Roster.IsActiveDeck(deck));True(c.Deck(deck.id)==deck,"roster deck is not reachable by id");
                False(deck.balls.Contains("normal"));foreach(string id in deck.balls)used.Add(id);
                var s=new GameSimulation(c,deck,deck);Eq(9,s.State.players[0].stock.Count);
            }
            True(used.SetEquals(data.active.Where(id=>id!="normal")),"a roster ball is in no ready-made deck");
            // none of the 40 older decks is fully active: they stay available by id and in the developer roster only
            Eq(0,c.AllDecks.Count(c.Roster.IsActiveDeck));True(c.Deck("featured_status_reactor")!=null&&c.Deck("fire_1")!=null);
        });
        Test("W22 roster data is rejected when it could break a match",()=>{
            var c=W22Catalog(out var good);
            RosterData With(Action<RosterData> change){var d=new RosterData{version="t",active=(string[])good.active.Clone(),rework=(string[])good.rework.Clone(),decks=good.decks.Select(k=>new RosterDeck{id=k.id,name=k.name,balls=(string[])k.balls.Clone()}).ToArray()};change(d);return d;}
            Throws(()=>c.UseRoster(With(d=>d.active[3]="no_such_ball")));
            Throws(()=>c.UseRoster(With(d=>d.active[3]="broodling")));
            Throws(()=>c.UseRoster(With(d=>d.active[3]=d.active[4])));
            Throws(()=>c.UseRoster(With(d=>d.active=d.active.Where(id=>id!="normal").ToArray())));
            Throws(()=>c.UseRoster(With(d=>d.rework[0]="bomb")));
            Throws(()=>c.UseRoster(With(d=>d.decks[0].balls[0]="plague")));
            Throws(()=>c.UseRoster(With(d=>d.decks[0].balls[0]=d.decks[0].balls[1])));
            Throws(()=>c.UseRoster(With(d=>d.decks[1].id="fire_1")));
            c.UseRoster(good);Eq(31,c.Roster.ActiveIds.Count());
            c.UseRoster(null);True(c.Roster==null&&c.IsActive("plague"));
        });
        Test("W22 deck builder: normal play lists only active specials; the developer roster lists everything as before",()=>{
            var c=W22Catalog(out var data);
            var normal=RosterReadiness.Visible(c,"",RosterReadinessFilter.All,true);
            Eq(30,normal.Length);True(normal.All(b=>c.IsActive(b.id)&&b.id!="normal"&&!b.hidden));
            var developer=RosterReadiness.Visible(c,"");
            Eq(224,developer.Length);True(developer.Select(b=>b.id).SequenceEqual(RosterReadiness.Visible(catalog,"").Select(b=>b.id)));
            Eq(30,RosterReadiness.Counts(c,"",true)[RosterReadinessFilter.All]);Eq(224,RosterReadiness.Counts(c,"")[RosterReadinessFilter.All]);
            Eq(0,RosterReadiness.Visible(c,"plague",RosterReadinessFilter.All,true).Count(b=>b.id=="plague"));
            True(RosterReadiness.Visible(c,"plague").Any(b=>b.id=="plague"));
            // search by the shown name still works inside the active roster
            True(RosterReadiness.Visible(c,"Tox Pool",RosterReadinessFilter.All,true).Any(b=>b.id=="blightpool"));
        });
        Test("W22 random type picks: unchanged by default, active-only when the match asks for it",()=>{
            var c=W22Catalog(out var data);
            var deck=c.Deck("featured_reality_hackers");
            // default policy: same result as a catalog without a roster, step for step
            var before=new GameSimulation(catalog,catalog.Deck("featured_reality_hackers"),catalog.Deck("featured_reality_hackers"));
            var after=new GameSimulation(c,deck,deck);
            False(after.ActiveRosterOnly);
            for(int i=0;i<300;i++)
            {
                var a=before.Spawn(0,"wildcard",100+(i%8)*45,300);var b=after.Spawn(0,"wildcard",100+(i%8)*45,300);
                before.Abilities.OnStop(a);after.Abilities.OnStop(b);
                Eq(a.type,b.type);Eq(before.State.randomState,after.State.randomState);
                a.dead=b.dead=true;
            }
            // active-only policy: thousands of rolls, never a frozen type
            var seen=new HashSet<string>();int frozenLegacy=0;
            for(int round=0;round<40;round++)
            {
                var s=new GameSimulation(c,c.Roster.Decks[0],c.Roster.Decks[1]){ActiveRosterOnly=true};
                var legacy=new GameSimulation(c,c.Roster.Decks[0],c.Roster.Decks[1]);
                s.State.randomState=legacy.State.randomState=(uint)(round*7919+17);
                for(int i=0;i<100;i++)
                {
                    var ball=s.Spawn(i%2,"wildcard",100+(i%8)*45,300);s.Abilities.OnStop(ball);
                    True(c.IsActive(ball.type)&&ball.type!="normal"&&ball.type!="wildcard","frozen type from Wildcard: "+ball.type);
                    seen.Add(ball.type);ball.dead=true;
                    var old=legacy.Spawn(i%2,"wildcard",100+(i%8)*45,300);legacy.Abilities.OnStop(old);if(!c.IsActive(old.type))frozenLegacy++;old.dead=true;
                }
            }
            // every active special that the rule allows (unique-tier balls were never in this pool)
            True(seen.SetEquals(data.active.Where(id=>id!="normal"&&id!="wildcard"&&c.Ball(id).tier!="unique")),"Wildcard does not reach the whole active pool");True(seen.Count>=25);True(frozenLegacy>3000,"the legacy pool should still reach frozen types");
            var sim=new GameSimulation(c,c.Roster.Decks[0],c.Roster.Decks[1]){ActiveRosterOnly=true};
            True(sim.InRandomPool("bomb"));False(sim.InRandomPool("plague"));sim.ActiveRosterOnly=false;True(sim.InRandomPool("plague"));
        });
        Test("W22 source: both random pools honour the policy; the app starts roster matches and keeps a developer roster",()=>{
            string Code(string f)=>Regex.Replace(File.ReadAllText(Path.Combine(projectRoot,f)),@"//[^\n]*","");
            string core=string.Concat(Directory.GetFiles(Path.Combine(projectRoot,"Assets/CoreClash/Core"),"*.cs").Select(f=>Regex.Replace(File.ReadAllText(f),@"//[^\n]*","")));
            // every draw from the whole catalog goes through the policy
            Eq(2,Regex.Matches(core,@"Catalog\.Data\.balls\.Where\(").Count);Eq(2,Regex.Matches(core,@"sim\.InRandomPool\(d\.id\)").Count);
            string app=Code("Assets/CoreClash/Presentation/CoreClashApp.cs"),setup=Code("Assets/CoreClash/Presentation/SetupView.cs"),state=Code("Assets/CoreClash/Core/GameState.cs");
            True(app.Contains("Simulation.ActiveRosterOnly=Catalog.Roster!=null&&Catalog.Roster.IsActiveDeck(chosen[0])&&Catalog.Roster.IsActiveDeck(chosen[1]);"),"match policy is not derived from the chosen decks");
            True(app.Contains("public void SetDeveloperRoster(bool value)")&&app.Contains("KeyCode.F2"),"no developer access to frozen balls");
            True(setup.Contains("RosterReadiness.Visible(Catalog,search,rosterFilter,activeOnly)")&&setup.Contains("var setupDecks=SetupDecks;")&&setup.Contains("var decks=LibraryDecks;"),"setup screens ignore the roster");
            // the policy is not gameplay state and not on the wire
            False(state.Contains("ActiveRosterOnly"));
            foreach(string file in Directory.GetFiles(Path.Combine(projectRoot,"Assets/CoreClash/Networking"),"*.cs"))False(File.ReadAllText(file).Contains("ActiveRosterOnly"));
        });
    }
}
