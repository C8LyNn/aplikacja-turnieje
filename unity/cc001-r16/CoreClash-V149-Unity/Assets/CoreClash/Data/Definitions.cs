using System;

namespace CoreClash.Data
{
    [Serializable] public sealed class BallDefinition
    {
        public string id, name, color, size, archetype, description, counter, abilityId, tier, rawMetadata, originalMetadata;
        public int hp, typeHp, stockCopies;
        public float radius, mass, restitution, wallRestitution, maxSpeed;
        public bool hidden;
    }
    [Serializable] public sealed class AbilityDefinition
    {
        public string id, ballId, role, range, countJson, limitJson, effectJson, rawMetadata, portStatus;
        public string[] events, conditions;
    }
    [Serializable] public sealed class DeckDefinition
    {
        public string id, name, archetype, description, rawMetadata;
        public string[] balls;
        public bool provisional;
    }
    [Serializable] public sealed class ArchetypeDefinition
    {
        public string id, name, family, description, coreText;
        public string[] balls;
    }
    [Serializable] public sealed class CatalogData
    {
        public string version, sourceVersion, sourcePath, sourceSha256;
        public BallDefinition[] balls;
        public AbilityDefinition[] abilities;
        public DeckDefinition[] decks;
        public ArchetypeDefinition[] archetypes;
    }
    [Serializable] public sealed class FeaturedDeckData { public string version; public DeckDefinition[] decks; }
}
