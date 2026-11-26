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
    //
    // 2026-11-25, after the owner played: traps are bigger (22) and never one on another, and a ball
    // puts its thing down once - its trap, its shoots, its field (GameState.placeOnce). The same day
    // a fault in every simulation that tries shots in a copy of the match was mended (see
    // CollisionResolver): powers that work on touch had been lost in about half of the shots the
    // computer tried, so every number above was measured with a computer that undervalued them.
    // Measured with both in place - not yet rebalanced:
    //   groups (600)  ice 46%  electricity 46%  plants 49%  magnetism 50%  poison 53%  fire 56%
    //   decks (432)   Frozen Garden 38%  Polar Storm 47%  Dynamo 48%  Acid Rain 49%  Fire Pit 57%  Jungle 61%
    //   seats (1260)  the first player wins 48.5%; no pair of decks stands out
    // The Blizzard made a new field every time it was knocked; made once, ice chills a third less.
    //
    // Fourth pass, 2026-11-25 (the agent's work under the owner's standing "keep improving"; he had
    // been offered "even out the decks" as the next step). What the pass learnt first: the deck
    // report (432 matches, 120 a deck) moves a deck by about 9 points by chance - it showed Frozen
    // Garden going from 38% to 48% for a change the bigger sample did not see at all. From here on
    // decks are judged by the seats run: every pair of ready decks 60 times, 300 matches a deck
    // (about 6 points), the same draws with the seats swapped.
    //   as the game was          Fire Pit 62  Acid Rain 57  Jungle 56  Frozen Garden 45  Dynamo 41  Polar Storm 40
    //   freezing costs 10 HP     Fire Pit 62  Jungle 57  Acid Rain 55  Dynamo 43  Polar Storm 43  Frozen Garden 42
    //   ... and the flat fire    Fire Pit 56  Acid Rain 56  Jungle 55  Frozen Garden 46  Dynamo 44  Polar Storm 44
    // Taken: freezing costs 10 HP (little by itself: ice as a group 46% -> 48%; first player 49.7%).
    // Measured and waiting for the owner's word, because it changes what the fire group's card
    // says ("every further fire burns harder"): the flat fire (GameState.fireFlat, FireFlat below).
    // It is the one change that moved the strongest deck and nobody else: the spread between the
    // ready decks falls from 22 points to 12.
    // Tried and dropped (all on top of the 10 HP):
    //   poison lasting 2 turns           Acid Rain 40%, and Fire Pit up in the small sample
    //   the Lightning's touch taking 10  Polar Storm 58%, Jungle 45%
    //   fire burning 2 turns, not 3      nothing moved
    //   a freeze on the second chill     Frozen Garden 58%, Dynamo 37%; with a 5 HP or no cost it
    //                                    gave nothing over the third chill
    //   a shield of 10 for the Anchor    Dynamo +3, inside the noise
    //   shock trap 15, Battery 3 charges inside the noise; together the first player fell to 44%
    // Still true after the pass: three ready decks stand at 55-56% and three at 44-46%.
    //
    // Owner rule, 2026-11-26: "an important rule: your own balls must not hurt your other balls"
    // (GameState.noFriendlyFire, NoFriendlyFire below). In the roster only the Bomb did: its blast
    // took 10-15 HP from everybody in range, its owner's balls too. The seats run, same draws:
    //   before  Fire Pit 62.5  Jungle 56.5  Acid Rain 55  Dynamo 42.5  Polar Storm 42.5  Frozen Garden 42   first player 49.7%
    //   after   Fire Pit 63    Jungle 56.5  Acid Rain 55  Polar Storm 42.5  Frozen Garden 42  Dynamo 41     first player 49.3%
    // Nothing moved beyond the noise (about 6 points) - the computer seldom caught its own balls
    // in a blast - so nothing was retuned.
    //
    // Fifth pass, 2026-11-26 (owner: "balance it with the numbers"). The three strong decks were the
    // ones with fire and poison: one touch of either took 15 HP (5 a turn for 3 turns) and a second
    // fire doubled, while the other groups take 5-10 for a touch. Every run below is the seats run
    // (every pair of ready decks 60 times, 300 matches a deck), same draws, one after another:
    //                                         Fire Pit  Frozen G.  Acid Rain  Dynamo  Polar St.  Jungle   first  spread
    //   the game before the pass                63        42         55        41      42.5      56.5    49.3%   22
    //   flat fire, poison 2 turns               56        46         47        48.5    48        55      48.3%   10
    //   ... and fire 2 turns                    53        46         47.5      50.5    48        56      48.3%   10
    //   ... and Venom's bite gives nothing back 55.5      50.5       46.5      50.5    50        48      48.0%    9
    //   ... and Bomb 12, Mushroom 130,
    //       opening ball 10 HP  (the game now)  52.5      53         50        48      49.5      46.5    50.2%    6.5
    // Taken: a second fire burns a turn longer and no harder (FireFlat), a fire burns 2 turns, a
    // poisoning lasts 2 turns, Venom's bite into a poisoned enemy takes its 5 HP and gives none back
    // (the Jungle deck stood at 56% whatever else changed, and fell to 48% with this one number),
    // the Bomb takes 5-10 (only Fire Pit has it), the Mushroom's cloud reaches 130 (only Acid Rain
    // has it), and Player 2's extra opening ball has 10 HP - the slower fire and poison had moved
    // the first player's share down to 48%.
    // Tried in the same pass and not kept: the Acorn growing back once (Jungle 56% -> 56%), the Vine
    // putting out 2 shoots instead of 4 (Jungle 56% -> 54%, the ice decks moved as much by chance),
    // freezing for 15 HP (the ice decks +2 and +3, not needed once the Jungle came down).
    // A spread of 6.5 points is what chance alone gives six equal decks at 300 matches each
    // (about 7): tuning single points further cannot be measured at this sample.
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
        public const int FreezeDamage=10;
        public const int BrittleBonus=0;
        // Fire: a burning ball loses 5 HP a turn however many fires are on it (fifth pass, after the
        // owner's "balance it with the numbers"); the fire group's cards follow this switch.
        public const bool FireFlat=true;

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
        // Traps (owner direction after playing: bigger, and never one on another): the radius of an
        // element trap and of the shock trap - about the size of a reference ball, beside balls one
        // and a half times that - and no trap over another trap.
        public const float TrapRadius=22;
        public const bool TrapsApart=true;
        // A ball puts its thing down once (owner direction after playing): its trap, its shoots or
        // its field appears at its first stop and never again.
        public const bool PlaceOnce=true;
        // The opening: HP of the extra Standard ball Player 2 plays on the first turn (0 = a whole ball).
        public const int OpeningBonusHp=10;
        // Fifth pass (owner, 2026-11-26: "balance it with the numbers"): how many turns one fire and
        // one poisoning last (5 HP a turn; the reference 3), what the Bomb's blast takes at its
        // centre (the reference 19 and 17: 10-15 HP by distance; 12 gives 5-10), what Venom gets
        // back for a bite into a poisoned enemy (the reference 5), how far the Mushroom's cloud
        // reaches (the reference 100).
        public const int FireLasts=2;
        public const int PoisonTurns=2;
        public const int BombDamage=12;
        public const int VenomHeal=0;
        public const float SporeRadius=130;
        // Owner rule, 2026-11-26 ("an important rule: your own balls must not hurt your other
        // balls"): no power of a ball takes HP from another ball of the same player or puts fire,
        // ice or poison on it. In the roster this changes the Bomb, whose blast hurt everybody.
        public const bool NoFriendlyFire=true;

        public static void Apply(GameState state)
        {
            if(state==null)return;
            state.deepFreeze=true;state.freezeTurns=FreezeTurns;
            state.shatterKeepsIce=ShatterKeepsIce;state.freezeDamage=FreezeDamage;state.brittleBonus=BrittleBonus;
            state.venomOncePerTurn=true;state.fireFlat=FireFlat;
            state.leechDrain=LeechDrain;
            state.poolRadius=PoolRadius;
            state.chainLightning=ChainLightning;state.shortCircuit=ShortCircuit;
            state.lightningTouch=LightningTouch;state.batteryStart=BatteryStart;state.shockTrapDamage=ShockTrapDamage;
            state.mineDamage=MineDamage;state.anchorShield=AnchorShield;state.compassDashHurt=CompassDashHurt;
            state.openingBonusHp=OpeningBonusHp;
            state.trapRadius=TrapRadius;state.trapsApart=TrapsApart;state.placeOnce=PlaceOnce;
            state.noFriendlyFire=NoFriendlyFire;
            state.fireLasts=FireLasts;state.poisonTurns=PoisonTurns;state.bombDamage=BombDamage;
            state.venomHeal=VenomHeal;state.sporeRadius=SporeRadius;
        }
    }
}
