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
    //
    // Second pass, the same day (owner decisions: "strengthen magnetism and electricity" - Dynamo was
    // the weakest ready deck - and "the player who starts and the other one are to win as often as
    // each other, whatever the decks; one deck may counter another, but then from either seat"):
    //   seats        Player 2's extra Standard ball of the opening turn comes in with 15 HP, not 30.
    //                First player's share of wins over every pair of ready decks: no extra ball 64%,
    //                a whole ball 42% (1260 matches), 20 HP 46%, 15 HP 49% (840 matches each).
    //   magnetism    the Magnet Mine takes a whole 15 from every enemy in its field and nothing from
    //                its owner's balls (it took 10-15 by distance, from everybody); a collision on the
    //                Compass's second shot costs it half (each of its two hits used to cost it as
    //                much as its target, and decks did better without the ball).
    //   electricity  the Lightning's bolt goes on down a row of enemies instead of to one more; a
    //                switched-off ball takes 5 more from every bolt; the Battery comes with two
    //                charges; the shock trap takes 10.
    // Tried and dropped, because they overshot: the Compass taking no damage at all on its second
    // shot (magnetism 60%, Fire Pit 63%), the Lightning taking 10 from the enemy it touches
    // (electricity 52-55%, Acid Rain 58% twice), a shield of 10 for the Anchor (Dynamo 58%).
    // Measured as above (groups: 600 matches, noise about 5 points; ready decks: 432, about 9):
    //   groups, before  ice 49%  electricity 47%  magnetism 47%  plants 50%  fire 53%  poison 55%
    //   groups, after   ice 46%  electricity 47%  magnetism 50%  plants 50%  poison 52%  fire 54%
    //   decks, before   Dynamo 43%  Frozen Garden 48%  Acid Rain 49%  Fire Pit 51%  Polar Storm 53%  Jungle 57%
    //   decks, after    Frozen Garden 45%  Polar Storm 46%  Fire Pit 49%  Acid Rain 51%  Dynamo 53%  Jungle 56%
    // Electricity as a group did not move: only the Lightning's touch moves it, and 10 is too much.
    //
    // Third pass, the same day (owner decision: "strengthen ice" - the second pass had left ice the
    // weakest group, 46%, and the two ready decks with ice the two weakest). The lab showed what was
    // missing: ice chilled 13 times and froze 4 balls a match but killed the fewest, and the
    // Shatterer's hit set its frozen target free.
    //   Shatterer  its hit leaves the ice on the ball: a frozen ball stays frozen, a chilled one
    //              keeps its chills. Once a turn for each enemy.
    //   freezing   costs the ball 5 HP at the moment it freezes (third chill, field or ice trap).
    // Tried instead of the 5 HP: a frozen ball being brittle (a hard hit takes 5 more) - ice 49%,
    // much the same; the 5 HP is easier to say on a card and left ice caring less about its seat.
    // Measured as above:
    //   groups, before  ice 46%  electricity 47%  magnetism 50%  plants 50%  poison 52%  fire 54%
    //   groups, after   electricity 46%  magnetism 48%  ice 50%  plants 50%  poison 53%  fire 54%
    //   decks, before   Frozen Garden 45%  Polar Storm 46%  Fire Pit 49%  Acid Rain 51%  Dynamo 53%  Jungle 56%
    //   decks, after    Fire Pit 44%  Polar Storm 46%  Acid Rain 49%  Frozen Garden 52%  Dynamo 53%  Jungle 57%
    public static class RosterBalance
    {
        // The Poison Pool's field. (The Blizzard keeps the reference 165.)
        public const float PoolRadius=130;
        // What the Leech takes from its target each turn on top of its poison: nothing - it only heals itself.
        public const int LeechDrain=0;

        // A freeze lasts the next two turns - one of each player.
        public const int FreezeTurns=2;
        // Ice, third pass: the Shatterer's hit leaves the ice on its target; HP a ball loses at the
        // moment it freezes; HP a hard hit takes on top from a frozen ball (none: tried, see above).
        public const bool ShatterKeepsIce=true;
        public const int FreezeDamage=5;
        public const int BrittleBonus=0;

        // Electricity: the Lightning's bolt goes on down a row of enemies; a switched-off ball takes
        // this much more from every bolt.
        public const bool ChainLightning=true;
        public const int ShortCircuit=5;
        // What the Lightning takes from the enemy it touches (the reference 5, the same as a jump of
        // its bolt), the charges the Battery comes with, what the shock trap takes.
        public const int LightningTouch=5;
        public const int BatteryStart=2;
        public const int ShockTrapDamage=10;
        // Magnetism: the Magnet Mine takes this from every enemy in its field (and nothing from its
        // owner's balls). The Anchor's shield after it drops anchor: none (the rule exists, see above).
        public const int MineDamage=15;
        public const int AnchorShield=0;
        // On its second shot a collision costs the Compass this much of the usual, in percent.
        public const int CompassDashHurt=50;
        // The opening: HP of the extra Standard ball Player 2 plays on the first turn (0 = a whole ball).
        public const int OpeningBonusHp=15;

        public static void Apply(GameState state)
        {
            if(state==null)return;
            state.deepFreeze=true;state.freezeTurns=FreezeTurns;
            state.shatterKeepsIce=ShatterKeepsIce;state.freezeDamage=FreezeDamage;state.brittleBonus=BrittleBonus;
            state.venomOncePerTurn=true;
            state.leechDrain=LeechDrain;
            state.poolRadius=PoolRadius;
            state.chainLightning=ChainLightning;state.shortCircuit=ShortCircuit;
            state.lightningTouch=LightningTouch;state.batteryStart=BatteryStart;state.shockTrapDamage=ShockTrapDamage;
            state.mineDamage=MineDamage;state.anchorShield=AnchorShield;state.compassDashHurt=CompassDashHurt;
            state.openingBonusHp=OpeningBonusHp;
        }
    }
}
