using System;
using System.Collections.Generic;
using System.Linq;

namespace CoreClash.Data
{
    // CC-001 W22: the active roster and the freezer.
    // The catalog keeps every ball: ids, definitions and abilities are never removed, so
    // old states and any reference to a frozen type still resolve. The roster is one list
    // of ids the player can currently pick; everything else is frozen until it is restored.
    public enum RosterTier { Active, Rework, Freezer, Internal }

    [Serializable] public sealed class RosterDeck { public string id,name,description,identity,accent; public string[] balls; }
    // W24: how many copies of an active ball a deck holds, where the roster's design differs
    // from the catalog's (a ball that was a one-copy unique there and is a basic ball here).
    [Serializable] public sealed class RosterStock { public string id; public int copies; }
    // hp (W24, owner decision 2026-11-22: "every ball always has the same HP - less to keep in
    // mind, a simpler picture; the powers are what gets balanced"): the HP of every active ball.
    // 0 keeps each ball's own HP from the catalog.
    [Serializable] public sealed class RosterData { public string version; public int hp; public string[] active,rework; public RosterStock[] stock; public RosterDeck[] decks; }

    public sealed class Roster
    {
        public readonly RosterData Data;
        // Ready-made decks built only from active balls.
        public readonly DeckDefinition[] Decks;
        readonly HashSet<string> active,rework;

        public Roster(Catalog catalog,RosterData data)
        {
            if(catalog==null)throw new ArgumentNullException(nameof(catalog));
            Data=data??throw new ArgumentNullException(nameof(data));
            active=Ids(catalog,data.active,"active");rework=Ids(catalog,data.rework,"rework");
            if(!active.Contains("normal"))throw new ArgumentException("Standard must be active.");
            if(active.Overlaps(rework))throw new ArgumentException("A ball cannot be both active and a rework candidate.");
            if(data.hp!=0)
            {
                if(data.hp<5||data.hp>100||data.hp%5!=0)throw new ArgumentException("Roster HP must be a multiple of 5 between 5 and 100.");
                foreach(string id in active){var ball=catalog.Ball(id);ball.hp=ball.typeHp=data.hp;}
            }
            foreach(var entry in data.stock??Array.Empty<RosterStock>())
            {
                if(entry==null||!active.Contains(entry.id??"")||entry.id=="normal"||entry.copies<1||entry.copies>9)throw new ArgumentException("Roster stock entry is not an active special ball with 1-9 copies: "+entry?.id);
                catalog.Ball(entry.id).stockCopies=entry.copies;
            }
            var decks=new List<DeckDefinition>();
            foreach(var deck in data.decks??Array.Empty<RosterDeck>())
            {
                if(deck==null||string.IsNullOrEmpty(deck.id))throw new ArgumentException("Roster deck needs an id.");
                if(catalog.AllDecks.Any(x=>x.id==deck.id)||decks.Any(x=>x.id==deck.id))throw new ArgumentException("Duplicate deck id: "+deck.id);
                var definition=new DeckDefinition{id=deck.id,name=deck.name,description=deck.description,archetype="roster",balls=deck.balls};
                catalog.ValidateDeck(definition);
                foreach(string id in deck.balls)if(id=="normal"||!active.Contains(id))throw new ArgumentException("Roster deck "+deck.id+" uses a ball that is not an active special: "+id);
                decks.Add(definition);
            }
            Decks=decks.ToArray();
        }

        static HashSet<string> Ids(Catalog catalog,string[] ids,string list)
        {
            var set=new HashSet<string>(StringComparer.Ordinal);
            foreach(string id in ids??Array.Empty<string>())
            {
                var ball=catalog.Ball(id);
                if(ball==null)throw new ArgumentException("Roster "+list+" list names an unknown ball: "+id);
                if(ball.hidden)throw new ArgumentException("Roster "+list+" list names an internal token: "+id);
                if(!set.Add(id))throw new ArgumentException("Roster "+list+" list repeats: "+id);
            }
            return set;
        }

        public IEnumerable<string> ActiveIds=>Data.active;
        public bool IsActive(string id)=>id!=null&&active.Contains(id);
        public bool IsActiveDeck(DeckDefinition deck)=>deck?.balls!=null&&deck.balls.All(IsActive);
        public RosterTier Tier(Catalog catalog,string id)
        {
            if(IsActive(id))return RosterTier.Active;
            var ball=catalog.Ball(id);
            if(ball!=null&&ball.hidden)return RosterTier.Internal;
            return id!=null&&rework.Contains(id)?RosterTier.Rework:RosterTier.Freezer;
        }
    }
}
