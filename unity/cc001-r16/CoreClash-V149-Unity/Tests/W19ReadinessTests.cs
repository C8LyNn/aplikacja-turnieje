using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using CoreClash.Data;
using CoreClash.Presentation;

// CC-001 W19-01 (#289): READY / PARTIAL / DATA_ONLY in the deck builder.
// Reads the existing AbilitySupport registry only; no catalog, deck, stats or
// default-roster change (Q2 design hold).
public static partial class Program
{
    static void W19ReadinessTests()
    {
        Test("W19-01 badges mirror AbilitySupport for chosen READY, PARTIAL, DATA_ONLY and unknown ids",()=>{
            foreach(var id in new[]{"agony","venom","mine","traitor"})Eq(ReadinessLevel.Ready,RosterReadiness.Badge(catalog,id).Level);
            foreach(var id in new[]{"mimic","ram","furnace","mitosis"})Eq(ReadinessLevel.Partial,RosterReadiness.Badge(catalog,id).Level);
            foreach(var id in new[]{"bounce","spike","dart","leech"})Eq(ReadinessLevel.DataOnly,RosterReadiness.Badge(catalog,id).Level);
            foreach(var id in new[]{"no_such_ball","",null})Eq(ReadinessLevel.Unknown,RosterReadiness.Badge(catalog,id).Level);
            Eq("READY",RosterReadiness.Badge(catalog,"agony").Label);Eq("PARTIAL",RosterReadiness.Badge(catalog,"mimic").Label);
            Eq("DATA ONLY",RosterReadiness.Badge(catalog,"bounce").Label);Eq("DATA_ONLY",RosterReadiness.Badge(catalog,"bounce").Code);
            True(RosterReadiness.Badge(catalog,"bounce").Explanation.Length>0);
        });
        Test("W19-01 every visible special has exactly the registry status (224 = 41 READY + 51 PARTIAL + 132 DATA_ONLY)",()=>{
            var specials=catalog.Data.balls.Where(b=>!b.hidden&&b.id!="normal").ToArray();
            Eq(224,specials.Length);
            foreach(var b in specials){
                string expected=AbilitySupport.Status(b.id);
                Eq(expected,RosterReadiness.Badge(catalog,b.id).Code);
            }
            Eq(41,specials.Count(b=>RosterReadiness.Badge(catalog,b.id).Level==ReadinessLevel.Ready));
            Eq(51,specials.Count(b=>RosterReadiness.Badge(catalog,b.id).Level==ReadinessLevel.Partial));
            Eq(132,specials.Count(b=>RosterReadiness.Badge(catalog,b.id).Level==ReadinessLevel.DataOnly));
        });
        Test("W19-01 ALL filter is the unchanged pre-W19 builder roster for any search",()=>{
            Eq(RosterReadinessFilter.All,default(RosterReadinessFilter));
            foreach(var search in new[]{"","fire","ICE","corruption","mi","zzz-none"}){
                var legacy=catalog.Data.balls.Where(b=>!b.hidden&&b.id!="normal"&&(b.name.IndexOf(search,StringComparison.OrdinalIgnoreCase)>=0||b.archetype.IndexOf(search,StringComparison.OrdinalIgnoreCase)>=0)).Select(b=>b.id).ToArray();
                True(legacy.SequenceEqual(RosterReadiness.Visible(catalog,search).Select(b=>b.id)),"ALL changed the roster for '"+search+"'");
                True(legacy.SequenceEqual(RosterReadiness.Visible(catalog,search,RosterReadinessFilter.All).Select(b=>b.id)));
            }
            Eq(224,RosterReadiness.Visible(catalog,null).Length);
        });
        Test("W19-01 filters nest, keep search, keep order and report matching counts",()=>{
            foreach(var search in new[]{"","fire","purity","zzz-none"}){
                var all=RosterReadiness.Visible(catalog,search);
                var ready=RosterReadiness.Visible(catalog,search,RosterReadinessFilter.ReadyOnly);
                var playable=RosterReadiness.Visible(catalog,search,RosterReadinessFilter.ReadyOrPartial);
                True(ready.All(b=>playable.Contains(b))&&playable.All(b=>all.Contains(b)),"filters must nest");
                True(ready.All(b=>RosterReadiness.Badge(catalog,b.id).Level==ReadinessLevel.Ready));
                True(playable.All(b=>RosterReadiness.Badge(catalog,b.id).Level!=ReadinessLevel.DataOnly));
                True(all.Where(b=>RosterReadiness.Passes(catalog,b.id,RosterReadinessFilter.ReadyOrPartial)).SequenceEqual(playable),"search then filter == filter on search, same order");
                var counts=RosterReadiness.Counts(catalog,search);
                Eq(all.Length,counts[RosterReadinessFilter.All]);Eq(ready.Length,counts[RosterReadinessFilter.ReadyOnly]);Eq(playable.Length,counts[RosterReadinessFilter.ReadyOrPartial]);
            }
            Eq(41,RosterReadiness.Counts(catalog,"")[RosterReadinessFilter.ReadyOnly]);
            Eq(92,RosterReadiness.Counts(catalog,"")[RosterReadinessFilter.ReadyOrPartial]);
            Eq("READY + PARTIAL  92",RosterReadiness.FilterLabel(RosterReadinessFilter.ReadyOrPartial,92));
        });
        Test("W19-01 filtering never changes a deck, the catalog or deck legality",()=>{
            var json=new JsonSerializerOptions{IncludeFields=true};
            string catalogBefore=JsonSerializer.Serialize(catalog.Data,json),featuredBefore=JsonSerializer.Serialize(catalog.Featured,json);
            var custom=new List<string>{"bounce","spike","dart","leech","agony","mimic","ram","venom","booster"};
            var copy=custom.ToList();
            foreach(var f in new[]{RosterReadinessFilter.ReadyOnly,RosterReadinessFilter.ReadyOrPartial,RosterReadinessFilter.All})
                foreach(var search in new[]{"","fire"}){RosterReadiness.Visible(catalog,search,f);RosterReadiness.Counts(catalog,search);}
            True(custom.SequenceEqual(copy),"custom deck changed");
            catalog.ValidateDeck(new DeckDefinition{id="w19_custom",balls=custom.ToArray()}); // DATA_ONLY balls stay legal
            Eq(catalogBefore,JsonSerializer.Serialize(catalog.Data,json));Eq(featuredBefore,JsonSerializer.Serialize(catalog.Featured,json));
            Eq(40,catalog.AllDecks.Count());
        });
        Test("W19-01 filter row and roster tile fit desktop, tablet and narrow phone without overlaps",()=>{
            foreach(var (uiWidth,target) in new[]{(1280f,36f),(1920f,36f),(1024f,36f),(768f,44f),(390f,44f),(320f,44f)}){
                float left=24,width=uiWidth-48;
                var buttons=RosterReadinessLayout.FilterButtons(left,200,width,target);
                Eq(3,buttons.Length);
                foreach(var b in buttons){True(b.x>=left-.01f&&b.Right<=left+width+.01f,"filter button outside row at "+uiWidth);True(b.width>=60&&b.height>=target,"filter button too small at "+uiWidth);}
                True(Separated(buttons[0],buttons[1])&&Separated(buttons[1],buttons[2]),"filter buttons overlap at "+uiWidth);
                int columns=uiWidth>950?3:uiWidth>600?2:1;float cardW=(width-24-(columns-1)*10)/columns;
                foreach(var shortView in new[]{false,true}){
                    float cardH=shortView?78:86;var card=new UiBox(10,500,cardW,cardH);var l=RosterReadinessLayout.Card(card,shortView);
                    foreach(var part in new[]{l.Preview,l.Name,l.Stats,l.Badge,l.Info})
                        True(part.x>=card.x-.01f&&part.Right<=card.Right+.01f&&part.y>=card.y-.01f&&part.Bottom<=card.Bottom+.01f,$"tile part outside card at {uiWidth} short={shortView}");
                    var parts=new[]{l.Preview,l.Name,l.Stats,l.Badge,l.Info};
                    for(int i=0;i<parts.Length;i++)for(int j=i+1;j<parts.Length;j++)True(Separated(parts[i],parts[j]),$"tile parts {i}/{j} overlap at {uiWidth} short={shortView}");
                    True(l.Badge.width>=40&&l.Badge.height>=14,"badge too small at "+uiWidth);
                }
            }
        });
    }
}
