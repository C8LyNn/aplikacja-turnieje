namespace CoreClash.Core
{
    // CC-001 W24 (owner decision, 2026-11-24: "strengthen the ice balls and weaken the Jungle deck by
    // the lab's report"). The numbers the six-group roster plays by, in one place: the game
    // (MatchSetup.Apply), the card demos (BallDemo) and the simulation lab (AiLab.NewMatch) all call
    // Apply, so they cannot drift apart. Each number is a match rule of GameState whose default is
    // the reference rule: a match that does not call this plays exactly as before.
    //
    // What changed, and why (the lab: computer against computer, Normal level):
    //   ice       a freeze lasted 2.4 seconds of motion, so it was over before the other player aimed.
    //             Now a frozen ball is out of the game for two turns (GameState.deepFreeze), the ice
    //             trap freezes outright, the Shatterer takes 5 HP for every chill it breaks.
    //   poison    the Leech no longer takes 5 HP a turn on top of its poison (one touch took 25 HP and
    //             gave 10 back; now 15 and it heals), the Poison Pool is smaller, Venom's bite into a
    //             poisoned enemy works once a turn for each enemy.
    // Measured with the same computer, every pair of groups, 600 matches a run (noise about 5 points):
    //   before    ice 42%  electricity 45%  magnetism 49%  plants 51%  poison 57%  fire 58%
    //   after     ice 49%  electricity 47%  magnetism 47%  plants 50%  poison 55%  fire 53%
    // The six ready decks, same computer and same draws, 432 matches a run:
    //   before    Frozen Garden 33%  Polar Storm 36%  Dynamo 43%  Fire Pit 55%  Acid Rain 62%  Jungle 71%
    //   after     Dynamo 43%  Frozen Garden 48%  Acid Rain 49%  Fire Pit 51%  Polar Storm 53%  Jungle 57%
    public static class RosterBalance
    {
        // The Poison Pool's field. (The Blizzard keeps the reference 165.)
        public const float PoolRadius=130;
        // What the Leech takes from its target each turn on top of its poison: nothing - it only heals itself.
        public const int LeechDrain=0;

        // A freeze lasts the next two turns - one of each player.
        public const int FreezeTurns=2;

        public static void Apply(GameState state)
        {
            if(state==null)return;
            state.deepFreeze=true;state.freezeTurns=FreezeTurns;
            state.venomOncePerTurn=true;
            state.leechDrain=LeechDrain;
            state.poolRadius=PoolRadius;
        }
    }
}
