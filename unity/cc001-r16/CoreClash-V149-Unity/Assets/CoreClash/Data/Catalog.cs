using System;
using System.Collections.Generic;
using System.Linq;

namespace CoreClash.Data
{
    public sealed class Catalog
    {
        public readonly CatalogData Data;
        public readonly DeckDefinition[] Featured;
        private readonly Dictionary<string,BallDefinition> balls;
        private readonly Dictionary<string,AbilityDefinition> abilities;
        public Catalog(CatalogData data, FeaturedDeckData featured)
        {
            Data=data ?? throw new ArgumentNullException(nameof(data));
            balls=(data.balls ?? Array.Empty<BallDefinition>()).ToDictionary(x=>x.id);
            abilities=(data.abilities ?? Array.Empty<AbilityDefinition>()).ToDictionary(x=>x.id);
            foreach(var ability in abilities.Values)ability.portStatus=AbilitySupport.Status(ability.ballId);
            Featured=featured?.decks ?? Array.Empty<DeckDefinition>();
            foreach(var deck in AllDecks) ValidateDeck(deck);
            if(!balls.ContainsKey("normal")) throw new ArgumentException("Standard is required.");
        }
        public BallDefinition Ball(string id) => balls.TryGetValue(id ?? "",out var value)?value:null;
        public AbilityDefinition Ability(string id) => abilities.TryGetValue(id ?? "",out var value)?value:null;
        public IEnumerable<DeckDefinition> AllDecks => Featured.Concat(Data.decks ?? Array.Empty<DeckDefinition>());
        public DeckDefinition Deck(string id) => AllDecks.FirstOrDefault(x=>x.id==id);
        public void ValidateDeck(DeckDefinition deck)
        {
            if(deck==null || deck.balls==null || deck.balls.Length!=9 || deck.balls.Distinct().Count()!=9)
                throw new ArgumentException("Deck requires nine unique ball IDs.");
            foreach(string id in deck.balls) if(!balls.ContainsKey(id)) throw new ArgumentException("Unknown ball: "+id);
        }
    }
}
