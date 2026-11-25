using System;
using System.Collections.Generic;

namespace CoreClash.Presentation
{
    // CC-001 W24: display language. English and Polish. Presentation only: ids, saves, the
    // simulation and the network protocol never see it.
    public static class Lang
    {
        public static bool Polish;
        public static string T(string english,string polish)=>Polish?polish:english;
    }

    // Polish names and one-line descriptions of the ready-made decks. Ids come from roster.json.
    public static class DeckText
    {
        static readonly System.Collections.Generic.Dictionary<string,string[]> Entries=new System.Collections.Generic.Dictionary<string,string[]>(System.StringComparer.Ordinal)
        {
            {"roster_fire_pit",new[]{"PALENISKO","Wciągaj wrogów w ogień i nie daj im zgasnąć."}},
            {"roster_frozen_garden",new[]{"ZIMOWY OGRÓD","Zatrzymaj ich, zamroź i przetrwaj dłużej."}},
            {"roster_acid_rain",new[]{"KWAŚNY DESZCZ","Zatruj, a osłabionych dobij piorunem."}},
            {"roster_dynamo",new[]{"DYNAMO","Ściągnij wrogów w jedno miejsce — resztę zrobi piorun."}},
            {"roster_polar_storm",new[]{"BURZA POLARNA","Zamroź ich w miejscu i wyłącz im moce."}},
            {"roster_jungle",new[]{"DŻUNGLA","Pnącza, kolce i trucizna: z tej dżungli nikt nie wychodzi cały."}},
        };
        public static string NamePl(string id)=>id!=null&&Entries.TryGetValue(id,out var text)?text[0]:null;
        public static string IdentityPl(string id)=>id!=null&&Entries.TryGetValue(id,out var text)?text[1]:null;
    }

    public enum GuideWhen { Always, Touch, Stop, Death, Turn }
    public enum GuideWho { Self, Enemies, Allies, Everyone }
    // Fire, Ice, Poison, Stuck and Frozen are drawn with the same symbol the state has on the board.
    public enum GuideFactKind { Damage, Heal, Shield, Time, Count, Fire, Ice, Poison, Stuck, Frozen }

    public sealed class GuideFact
    {
        public readonly GuideFactKind Kind;readonly string english,polish;
        public GuideFact(GuideFactKind kind,string english,string polish){Kind=kind;this.english=english;this.polish=polish;}
        public string Text=>Lang.T(english,polish);
        public string In(bool polishText)=>polishText?polish:english;
    }

    // What one ball does, in plain words: WHEN its power works, WHAT happens, WHO is affected,
    // the numbers that matter and one tip. Written from the simulation code, not from the
    // imported design notes, so it describes what this build really does.
    public sealed class BallGuideEntry
    {
        public string Id,NamePl,TagEn,TagPl,DoesEn,DoesPl,TipEn,TipPl;
        // What the ball does in one or two words, short enough to stand under its picture on a
        // card in the phone tray. The tag itself when that is short enough.
        public string ShortEn,ShortPl;
        public string Short=>Lang.T(ShortEn??TagEn,ShortPl??TagPl);
        public GuideWhen When;public GuideWho Who;
        // Reach of the power in simulation units (the board is 540 wide). 0 = contact or self.
        public float Range;
        public GuideFact[] Facts=Array.Empty<GuideFact>();
        public string Tag=>Lang.T(TagEn,TagPl);
        public string Does=>Lang.T(DoesEn,DoesPl);
        public string Tip=>Lang.T(TipEn,TipPl);
    }

    // CC-001 W24 (owner decisions, 2026-11-22): the 30 balls are six groups of five - ice, fire,
    // poison, magnetism, electricity, plants ("six groups for now; more groups will come and the
    // groups will grow"). A group is one idea a player can say in a word, and its balls work
    // better together than apart; Plan says how, from what the rules really do. Nothing in the
    // code assumes six or five: add a group or a ball here and the screens follow.
    // Standard belongs to no group: every deck has it.
    public sealed class BallGroup
    {
        public string Id,NameEn,NamePl,PlanEn,PlanPl;
        public string[] Balls;
        public string Name=>Lang.T(NameEn,NamePl);
        public string Plan=>Lang.T(PlanEn,PlanPl);
    }
    public static class BallGroups
    {
        public static readonly BallGroup[] All=
        {
            new BallGroup{Id="ice",NameEn="Ice",NamePl="Lód",Balls=new[]{"ice","blizzardcore","frosttrap","shatterer","frostguard"},
                PlanEn=CoreClash.Core.RosterBalance.FreezeDamage>0
                    ?"Three chills freeze a ball: it loses "+CoreClash.Core.RosterBalance.FreezeDamage+" HP and does nothing for 2 turns. The Shatterer hurts chilled balls."
                    :"Three chills freeze a ball. A frozen ball does nothing for 2 turns, and the Shatterer breaks the ice for damage.",
                PlanPl=CoreClash.Core.RosterBalance.FreezeDamage>0
                    ?"Trzy mrozy zamrażają kulkę: traci "+CoreClash.Core.RosterBalance.FreezeDamage+" HP i przez 2 tury nic nie robi. Kruszyciel rani zmrożone kulki."
                    :"Trzy mrozy zamrażają kulkę. Zamrożona przez 2 tury nic nie robi, a Kruszyciel kruszy lód i rani."},
            new BallGroup{Id="fire",NameEn="Fire",NamePl="Ogień",Balls=new[]{"fire","furnace","embertrap","bomb","firebrand"},
                PlanEn=CoreClash.Core.RosterBalance.FireFlat
                    ?"Set them alight and keep adding: a second fire burns longer, a third bursts."
                    :"Set them alight and keep adding: every further fire on the same ball burns harder.",
                PlanPl=CoreClash.Core.RosterBalance.FireFlat
                    ?"Podpalaj i dokładaj: drugi ogień pali dłużej, a trzeci wybucha."
                    :"Podpalaj i dokładaj: każdy kolejny ogień na tej samej kulce pali mocniej."},
            new BallGroup{Id="poison",NameEn="Poison",NamePl="Trucizna",Balls=new[]{"venom","blightpool","sporetrap","plagueburst","plagueleech"},
                PlanEn="Poison first: Venom bites poisoned enemies harder and the Leech heals off them.",
                PlanPl="Najpierw zatruj: Jad mocniej kąsa zatrutych, a Pijawka się nimi żywi."},
            new BallGroup{Id="magnet",NameEn="Magnetism",NamePl="Magnetyzm",Balls=new[]{"magnet","pulse","fluxmine","gravitymine","anchor"},
                PlanEn="You decide where balls stand: pull enemies together, push them away, drag them onto the mine.",
                PlanPl="Ty decydujesz, gdzie stoją kulki: ściągaj wrogów w jedno miejsce, odpychaj ich, wciągaj na minę."},
            new BallGroup{Id="electric",NameEn="Electricity",NamePl="Elektryczność",Balls=new[]{"tesla","chainshock","capacitor","staticfield","jammer"},
                PlanEn="Lightning jumps along enemies standing close. A switched-off ball has no power, and bolts hurt it more.",
                PlanPl="Piorun skacze po wrogach stojących blisko. Wyłączona kulka nie ma mocy, a pioruny ranią ją mocniej."},
            new BallGroup{Id="plant",NameEn="Plants",NamePl="Rośliny",Balls=new[]{"web","thornback","elderbloom","cultivator","cascade"},
                PlanEn="Plants stay and grow: they hold enemies, sting whoever touches them, heal and grow back.",
                PlanPl="Rośliny stoją i rosną: trzymają wrogów, kłują przy dotyku, leczą i odrastają."},
        };
        public static BallGroup Of(string ballId){foreach(var group in All)foreach(string id in group.Balls)if(id==ballId)return group;return null;}
        // Place of a ball in the groups' order (group after group); a ball of no group comes last.
        public static int Order(string ballId)
        {
            for(int g=0;g<All.Length;g++)for(int i=0;i<All[g].Balls.Length;i++)if(All[g].Balls[i]==ballId)return g*1000+i;
            return int.MaxValue;
        }
    }

    public static class BallGuide
    {
        // Tile labels must fit a phone tile on one line.
        public const int MaxTag=14;
        // Labels under the pictures in the phone tray: one line of small type on a card 58 px wide.
        public const int MaxShort=10;
        static void Short(string id,string english,string polish){var entry=Entries[id];if(english!=null)entry.ShortEn=english;if(polish!=null)entry.ShortPl=polish;}
        static readonly Dictionary<string,BallGuideEntry> Entries=new Dictionary<string,BallGuideEntry>(StringComparer.Ordinal);
        public static IEnumerable<string> Ids=>Entries.Keys;
        public static BallGuideEntry For(string id)=>id!=null&&Entries.TryGetValue(id,out var entry)?entry:null;
        public static string NamePl(string id)=>For(id)?.NamePl;

        public static string WhenText(GuideWhen when)
        {
            switch(when)
            {
                case GuideWhen.Touch:return Lang.T("When it touches a ball","Gdy dotknie kulki");
                case GuideWhen.Stop:return Lang.T("When it stops","Gdy się zatrzyma");
                case GuideWhen.Death:return Lang.T("When it dies","Gdy ginie");
                case GuideWhen.Turn:return Lang.T("Every turn","Co turę");
                default:return Lang.T("Always on","Działa zawsze");
            }
        }
        public static string WhoText(GuideWho who)
        {
            switch(who)
            {
                case GuideWho.Enemies:return Lang.T("Enemies only","Tylko wrogowie");
                case GuideWho.Allies:return Lang.T("Your balls only","Tylko twoje kulki");
                case GuideWho.Everyone:return Lang.T("Both teams","Obie drużyny");
                default:return Lang.T("Only itself","Tylko ona sama");
            }
        }
        public static string RangeText(float range)
            =>range<=0?"":range<=110?Lang.T("Short range","Mały zasięg"):range<=170?Lang.T("Medium range","Średni zasięg"):Lang.T("Long range","Duży zasięg");

        static GuideFact Damage(string en,string pl)=>new GuideFact(GuideFactKind.Damage,en,pl);
        static GuideFact Heal(string en,string pl)=>new GuideFact(GuideFactKind.Heal,en,pl);
        static GuideFact Shield(string en,string pl)=>new GuideFact(GuideFactKind.Shield,en,pl);
        static GuideFact Time(string en,string pl)=>new GuideFact(GuideFactKind.Time,en,pl);
        static GuideFact Count(string en,string pl)=>new GuideFact(GuideFactKind.Count,en,pl);
        static GuideFact Fact(GuideFactKind kind,string en,string pl)=>new GuideFact(kind,en,pl);
        // The lasting states, worded the same on every card.
        static GuideFact Burning=>Fact(GuideFactKind.Fire,"Fire: 5 HP × 3 turns","Ogień: 5 HP × 3 tury");
        static GuideFact Poisoned=>Fact(GuideFactKind.Poison,"Poison: 5 HP × 3 turns","Trucizna: 5 HP × 3 tury");
        static GuideFact Chilled=>Fact(GuideFactKind.Ice,"3 chills = frozen","3 mrozy = zamrożenie");
        static GuideFact FrozenFact=>Fact(GuideFactKind.Frozen,"Frozen for 2 turns","Zamrożona na 2 tury");
        // What freezing costs a ball under the roster's balance.
        static GuideFact FreezeCost=>Damage("Freezing: "+Hp(CoreClash.Core.RosterBalance.FreezeDamage)+" damage","Zamrożenie: "+Hp(CoreClash.Core.RosterBalance.FreezeDamage)+" obrażeń");
        static GuideFact[] IceTrapFacts=>CoreClash.Core.RosterBalance.FreezeDamage>0
            ?new[]{FrozenFact,FreezeCost,Count("Works once","Działa raz")}
            :new[]{FrozenFact,Count("Works once","Działa raz")};
        // The numbers of the roster's balance, as the cards print them.
        static string Hp(int amount)=>amount.ToString(System.Globalization.CultureInfo.InvariantCulture);
        // One number while the touch and the jumps take the same, two when the touch takes more.
        static GuideFact[] LightningFacts=>CoreClash.Core.RosterBalance.LightningTouch==CoreClash.Core.AbilityResolver.ZapDamage
            ?new[]{Damage("5 damage each","Po 5 obrażeń")}
            :new[]{Damage("Touch: "+Hp(CoreClash.Core.RosterBalance.LightningTouch)+" HP","Dotyk: "+Hp(CoreClash.Core.RosterBalance.LightningTouch)+" HP"),Damage("Each jump: 5 HP","Każdy skok: 5 HP")};
        static GuideFact ShortCircuit=>Damage("Bolts: "+Hp(CoreClash.Core.RosterBalance.ShortCircuit)+" HP more","Pioruny: "+Hp(CoreClash.Core.RosterBalance.ShortCircuit)+" HP więcej");

        static void Add(string id,string namePl,GuideWhen when,GuideWho who,float range,string tagEn,string tagPl,
            string doesEn,string doesPl,string tipEn,string tipPl,params GuideFact[] facts)
            =>Entries.Add(id,new BallGuideEntry{Id=id,NamePl=namePl,When=when,Who=who,Range=range,TagEn=tagEn,TagPl=tagPl,
                DoesEn=doesEn,DoesPl=doesPl,TipEn=tipEn,TipPl=tipPl,Facts=facts??Array.Empty<GuideFact>()});

        static BallGuide()
        {
            // The banner on the card already says WHEN, so the sentences start with WHAT.
            Add("normal","Zwykła",GuideWhen.Always,GuideWho.Enemies,0,"Solid hit","Mocny cios",
                "No special power. A heavy ball: the harder it hits an enemy, the more HP that enemy loses.",
                "Bez specjalnej mocy. Ciężka kulka: im mocniej uderzy wroga, tym więcej HP mu zabierze.",
                "It never runs out. Every collision between enemy balls hurts both of them.",
                "Nigdy się nie kończy. Każde zderzenie wrogich kulek rani obie.",
                Count("No limit","Bez limitu"));

            // Ice.
            Add("ice","Mróz",GuideWhen.Touch,GuideWho.Enemies,100,"Freeze","Mrozi",
                "Chills the enemy it touches and other enemies near that one. The third chill freezes a ball"+(CoreClash.Core.RosterBalance.FreezeDamage>0?" and takes "+Hp(CoreClash.Core.RosterBalance.FreezeDamage)+" HP.":"."),
                "Mrozi wroga, którego dotknie, i innych wrogów obok niego. Trzeci mróz zamraża kulkę"+(CoreClash.Core.RosterBalance.FreezeDamage>0?" i zabiera jej "+Hp(CoreClash.Core.RosterBalance.FreezeDamage)+" HP.":"."),
                "A frozen ball cannot move, has no power and does not attack the base for 2 turns - yours and the enemy's.",
                "Zamrożona kulka przez 2 tury (twoją i wroga) nie rusza się, nie ma mocy i nie atakuje bazy.",
                Chilled);
            Add("blizzardcore","Zamieć",GuideWhen.Stop,GuideWho.Enemies,165,"Ice field","Pole lodu",
                "Starts a big blizzard that lasts 3 turns. At the end of every turn, enemies standing in it get chilled.",
                "Rozpętuje dużą zamieć na 3 tury. Na koniec każdej tury wrogowie stojący w zamieci dostają mróz.",
                "The blizzard starts once: where the ball first stops.",
                "Zamieć powstaje raz: tam, gdzie kulka stanie po raz pierwszy.",
                Time("Lasts 3 turns","Trwa 3 tury"),Chilled);
            Add("frosttrap","Pułapka lodu",GuideWhen.Stop,GuideWho.Enemies,0,"Freezes enemy","Zamraża wroga",
                "Leaves an ice trap on that spot. The first enemy to roll over the trap is frozen at once.",
                "Zostawia w tym miejscu lodową pułapkę. Pierwszy wróg, który na nią wjedzie, od razu zamarza.",
                "One trap for each ball. A burning enemy is only put out.",
                "Jedna pułapka na kulkę. Płonącego wroga tylko gasi.",
                IceTrapFacts);
            if(CoreClash.Core.RosterBalance.ShatterKeepsIce)
                Add("shatterer","Kruszyciel",GuideWhen.Touch,GuideWho.Enemies,0,"Ice breaker","Kruszy lód",
                    "Strikes the ice on the enemy it touches: 5 HP for every chill. A frozen ball loses 15 HP.",
                    "Bije w lód na wrogu, którego dotknie: zabiera 5 HP za każdy mróz. Zamrożona kulka traci 15 HP.",
                    "The ice stays: a frozen ball is still frozen. Once a turn for each enemy.",
                    "Lód zostaje: zamrożona kulka dalej jest zamrożona. Raz na turę na każdego wroga.",
                    Damage("5 HP per chill","5 HP za każdy mróz"),Damage("Frozen: 15 HP","Zamrożona: 15 HP"));
            else
                Add("shatterer","Kruszyciel",GuideWhen.Touch,GuideWho.Enemies,0,"Ice breaker","Kruszy lód",
                    "Breaks the ice on the enemy it touches: 5 HP for every chill. A frozen ball loses 15 HP.",
                    "Kruszy lód na wrogu, którego dotknie: zabiera 5 HP za każdy mróz. Zamrożona kulka traci 15 HP.",
                    "The hit uses up the ice: a frozen ball is free again. Chill first, then shatter.",
                    "Cios zużywa lód: zamrożona kulka znów jest wolna. Najpierw zmroź, potem krusz.",
                    Damage("5 HP per chill","5 HP za każdy mróz"),Damage("Frozen: 15 HP","Zamrożona: 15 HP"));
            Add("frostguard","Bałwan",GuideWhen.Stop,GuideWho.Enemies,0,"Cold to touch","Zimny w dotyku",
                "Digs in where it stops and gets a shield of 10. Every enemy that hits it gets chilled.",
                "Okopuje się tam, gdzie stanie, i dostaje tarczę 10. Każdy wróg, który w niego uderzy, dostaje mróz.",
                "Dug in, it is hard to push away.",
                "Okopanego trudno przesunąć.",
                Shield("Shield 10","Tarcza 10"),Chilled);

            // Fire.
            Add("fire","Płomień",GuideWhen.Touch,GuideWho.Enemies,0,"Burn","Podpala",
                "Sets fire to every enemy it touches.",
                "Podpala każdego wroga, którego dotknie.",
                "Second fire on the same ball: 10 HP a turn. Third: a burst that ignites enemies next to it. Fire and ice cancel each other.",
                "Drugi ogień na tej samej kulce: 10 HP co turę. Trzeci: wybuch, który podpala wrogów obok. Ogień i lód znoszą się nawzajem.",
                Burning);
            Add("furnace","Ognisko",GuideWhen.Turn,GuideWho.Enemies,104,"Fire field","Pole ognia",
                "In each turn of yours it lights a field of fire around itself. At the end of every turn, enemies standing in the field catch fire.",
                "W każdej twojej turze rozpala wokół siebie pole ognia. Na koniec każdej tury wrogowie stojący w polu zaczynają płonąć.",
                "Big and heavy. Where an older field lies, its fire does not work.",
                "Duże i ciężkie. W miejscu starszego pola jego ogień nie działa.",
                Burning);
            Add("embertrap","Pułapka ognia",GuideWhen.Stop,GuideWho.Enemies,0,"Sets alight","Podpala wroga",
                "Leaves a fire trap on that spot. The first enemy to roll over the trap catches fire.",
                "Zostawia w tym miejscu ognistą pułapkę. Pierwszy wróg, który na nią wjedzie, zaczyna płonąć.",
                "One trap for each ball, laid where it first stops.",
                "Kulka stawia jedną pułapkę: tam, gdzie stanie po raz pierwszy.",
                Burning,Count("Works once","Działa raz"));
            Add("bomb","Bomba",GuideWhen.Stop,GuideWho.Everyone,165,"Blast","Wybuch",
                "Explodes and is gone. The blast hurts and throws back every ball in range — yours too.",
                "Wybucha i znika. Wybuch rani i odrzuca wszystkie kulki w zasięgu — twoje też.",
                "Destroyed before it stops? It still explodes.",
                "Zniszczona, zanim się zatrzyma? I tak wybuchnie.",
                Damage("10–15 damage","10–15 obrażeń"));
            Add("firebrand","Wulkan",GuideWhen.Stop,GuideWho.Enemies,100,"Fire burst","Fala ognia",
                "Erupts: every enemy nearby catches fire.",
                "Wybucha ogniem: każdy wróg w pobliżu zaczyna płonąć.",
                "It stays on the board after the eruption. Stop it between several enemies.",
                "Po wybuchu zostaje na planszy. Zatrzymaj go między kilkoma wrogami.",
                Burning);

            // Poison.
            Add("venom","Jad",GuideWhen.Touch,GuideWho.Enemies,0,"Poison","Zatruwa",
                "Poisons the enemy it touches.",
                "Zatruwa wroga, którego dotknie.",
                "Touch an enemy that is already poisoned: it loses 5 HP at once and Venom gets 5 HP back. Once a turn for each enemy.",
                "Dotknij już zatrutego wroga: od razu traci 5 HP, a Jad odzyskuje 5 HP. Raz na turę na każdego wroga.",
                Poisoned);
            Add("blightpool","Trująca kałuża",GuideWhen.Stop,GuideWho.Enemies,CoreClash.Core.RosterBalance.PoolRadius,"Poison pool","Kałuża jadu",
                "Spills a pool of poison that lasts 3 turns. At the end of every turn, enemies standing in the pool get poisoned.",
                "Rozlewa kałużę trucizny na 3 tury. Na koniec każdej tury wrogowie stojący w kałuży zostają zatruci.",
                "The pool is spilled once: where the ball first stops.",
                "Kałuża powstaje raz: tam, gdzie kulka stanie po raz pierwszy.",
                Time("Pool lasts 3 turns","Kałuża trwa 3 tury"),Poisoned);
            Add("sporetrap","Pułapka jadu",GuideWhen.Stop,GuideWho.Enemies,0,"Poisons enemy","Zatruwa wroga",
                "Leaves a poison trap on that spot. The first enemy to roll over the trap is poisoned.",
                "Zostawia w tym miejscu trującą pułapkę. Pierwszy wróg, który na nią wjedzie, zostaje zatruty.",
                "One trap for each ball, laid where it first stops.",
                "Kulka stawia jedną pułapkę: tam, gdzie stanie po raz pierwszy.",
                Poisoned,Count("Works once","Działa raz"));
            Add("plagueburst","Grzyb",GuideWhen.Death,GuideWho.Enemies,100,"Spore cloud","Zarodniki",
                "Bursts into a cloud of spores: every enemy nearby is poisoned.",
                "Pęka i rozsiewa zarodniki: każdy wróg w pobliżu zostaje zatruty.",
                "Leave it where enemies will have to hit it.",
                "Zostaw go tam, gdzie wróg będzie musiał w niego uderzyć.",
                Poisoned);
            Add("plagueleech","Pijawka",GuideWhen.Touch,GuideWho.Enemies,0,"Feeds","Żywi się",
                "The first enemy it touches is poisoned and tied to the Leech. While that enemy stays poisoned, the Leech gets 5 HP back in each turn of yours.",
                "Pierwszy wróg, którego dotknie, zostaje zatruty i związany z Pijawką. Dopóki ten wróg jest zatruty, Pijawka w każdej twojej turze odzyskuje 5 HP.",
                "Poison its victim again and the Leech keeps healing.",
                "Zatruj jej ofiarę ponownie, a Pijawka będzie leczyć się dalej.",
                Poisoned,Heal("+5 HP a turn","+5 HP co turę"));

            // Magnetism.
            Add("magnet","Magnes",GuideWhen.Stop,GuideWho.Everyone,165,"Pull","Przyciąga",
                "Pulls every ball in range towards itself — yours too. It deals no damage.",
                "Przyciąga do siebie wszystkie kulki w zasięgu — twoje też. Nie zadaje obrażeń.",
                "The closer a ball is, the harder it is pulled. Pull enemies into a fire, a pool or a trap.",
                "Im bliżej jest kulka, tym mocniej ją ciągnie. Wciągaj wrogów w ogień, kałużę albo pułapkę.");
            Add("pulse","Impuls",GuideWhen.Stop,GuideWho.Everyone,165,"Push","Odpycha",
                "Shoves every ball in range away from itself — yours too. It deals no damage.",
                "Odpycha od siebie wszystkie kulki w zasięgu — twoje też. Nie zadaje obrażeń.",
                "The closer a ball is, the harder it is pushed.",
                "Im bliżej jest kulka, tym mocniej ją odpycha.");
            Add("fluxmine","Kompas",GuideWhen.Stop,GuideWho.Enemies,230,"Second shot","Drugi strzał",
                "Shoots once more after it has stopped in your turn — straight at the nearest enemy in range.",
                "Rusza jeszcze raz, gdy zatrzyma się w twojej turze — prosto w najbliższego wroga w zasięgu.",
                "On its second shot a collision hurts the Compass half as much. Stop it close to the ball you want to hit.",
                "W drugim strzale zderzenie rani Kompas o połowę słabiej. Zatrzymaj go blisko kulki, w którą chcesz trafić.",
                Count("Once a turn","Raz na turę"));
            Add("gravitymine","Mina magnesowa",GuideWhen.Stop,GuideWho.Everyone,100,"Pull + blast","Wir i wybuch",
                "Makes a field that pulls balls towards it. When an enemy rolls into the field, the mine explodes and is gone.",
                "Tworzy pole, które przyciąga kulki. Gdy w pole wjedzie wróg, mina wybucha i znika.",
                "The field is made once, where the mine first stops. The blast throws every ball away but hurts only enemies.",
                "Pole powstaje raz: tam, gdzie mina stanie po raz pierwszy. Wybuch odrzuca wszystkie kulki, a rani tylko wrogów.",
                Damage(Hp(CoreClash.Core.RosterBalance.MineDamage)+" damage",Hp(CoreClash.Core.RosterBalance.MineDamage)+" obrażeń"));
            // The Anchor's card names a shield only while the roster's balance gives it one.
            if(CoreClash.Core.RosterBalance.AnchorShield>0)
                Add("anchor","Kotwica",GuideWhen.Stop,GuideWho.Self,0,"Holds ground","Trzyma miejsce",
                    "Drops anchor where it stops and gets a shield of "+Hp(CoreClash.Core.RosterBalance.AnchorShield)+". Collisions, magnets and blasts barely move it.",
                    "Rzuca kotwicę tam, gdzie stanie, i dostaje tarczę "+Hp(CoreClash.Core.RosterBalance.AnchorShield)+". Zderzenia, magnesy i wybuchy ledwo ją przesuwają.",
                    "Big and heavy. Park it in the centre or in the enemy's zone.",
                    "Duża i ciężka. Postaw ją na środku albo w strefie wroga.",
                    Shield("Shield "+Hp(CoreClash.Core.RosterBalance.AnchorShield),"Tarcza "+Hp(CoreClash.Core.RosterBalance.AnchorShield)));
            else
                Add("anchor","Kotwica",GuideWhen.Stop,GuideWho.Self,0,"Holds ground","Trzyma miejsce",
                    "Drops anchor where it stops: collisions, magnets and blasts barely move it.",
                    "Rzuca kotwicę tam, gdzie stanie: zderzenia, magnesy i wybuchy ledwo ją przesuwają.",
                    "Big and heavy. Park it in the centre or in the enemy's zone.",
                    "Duża i ciężka. Postaw ją na środku albo w strefie wroga.");

            // Electricity.
            Add("tesla","Piorun",GuideWhen.Touch,GuideWho.Enemies,100,"Shock","Razi",
                "Shocks the enemy it touches, and the bolt jumps on along the enemies standing close to each other.",
                "Razi wroga, którego dotknie, a piorun skacze dalej po wrogach stojących blisko siebie.",
                "Each enemy can be shocked once a turn. Aim at enemies standing together.",
                "Każdego wroga razi raz na turę. Celuj w kulki stojące blisko siebie.",
                LightningFacts);
            Add("chainshock","Burza",GuideWhen.Turn,GuideWho.Enemies,165,"Bolt a turn","Piorun co turę",
                "At the start of each turn of yours, a bolt strikes the nearest enemy in range.",
                "Na początku każdej twojej tury piorun uderza w najbliższego wroga w zasięgu.",
                "Stop it near enemies that cannot easily get away.",
                "Zatrzymaj ją blisko wrogów, którym trudno uciec.",
                Damage("5 damage","5 obrażeń"));
            Add("capacitor","Bateria",GuideWhen.Stop,GuideWho.Enemies,100,"Charge + shock","Ładuje i razi",
                "Gains a charge in each turn of yours (3 at most, starts with "+Hp(CoreClash.Core.RosterBalance.BatteryStart)+"). When it stops next to enemies, it shocks them all and is empty again.",
                "Co turę zyskuje ładunek (najwyżej 3, zaczyna z "+Hp(CoreClash.Core.RosterBalance.BatteryStart)+"). Gdy stanie obok wrogów, razi ich wszystkich i znów jest pusta.",
                "No enemy nearby: the charge is kept. Knocked, it stops again — and fires.",
                "Bez wroga obok ładunek zostaje. Potrącona też stanie — i wypali.",
                Damage("5 per charge","5 za ładunek"));
            Add("staticfield","Pułapka prądu",GuideWhen.Stop,GuideWho.Enemies,0,"Shock + off","Razi i wyłącza",
                "Leaves a shock trap on that spot. The first enemy to roll over it takes "+Hp(CoreClash.Core.RosterBalance.ShockTrapDamage)+" damage and loses its power until the end of its next turn.",
                "Zostawia w tym miejscu pułapkę. Pierwszy wróg, który na nią wjedzie, traci "+Hp(CoreClash.Core.RosterBalance.ShockTrapDamage)+" HP i moc — do końca swojej następnej tury.",
                "One trap for each ball. Bolts hurt a switched-off ball more.",
                "Kulka stawia jedną pułapkę. Wyłączoną kulkę pioruny ranią mocniej.",
                Damage(Hp(CoreClash.Core.RosterBalance.ShockTrapDamage)+" damage",Hp(CoreClash.Core.RosterBalance.ShockTrapDamage)+" obrażeń"),Time("Power off: 1 turn","Bez mocy: 1 tura"),ShortCircuit);
            Add("jammer","Wyłącznik",GuideWhen.Touch,GuideWho.Enemies,0,"Power off","Wyłącza moc",
                "The enemy it touches loses its power until the end of that enemy's next turn.",
                "Wróg, którego dotknie, traci moc do końca swojej następnej tury.",
                "A switched-off ball does nothing when it touches, stops, starts a turn or dies.",
                "Wyłączona kulka nic nie robi: ani przy dotyku, ani gdy stanie, ani co turę, ani gdy ginie.",
                Time("Power off: 1 turn","Bez mocy: 1 tura"),ShortCircuit);

            // Plants.
            Add("web","Pnącze",GuideWhen.Stop,GuideWho.Enemies,70,"Tangle","Oplata",
                "Sends out 4 shoots around itself. An enemy that rolls into a shoot gets tangled and is stuck there until the end of its next turn.",
                "Wypuszcza wokół siebie 4 pędy. Wróg, który wjedzie w pęd, zostaje opleciony i utyka w nim do końca swojej następnej tury.",
                "The shoots grow once, at the Vine's first stop. Each shoot works once.",
                "Pędy wyrastają raz, przy pierwszym zatrzymaniu. Każdy pęd działa raz.",
                Count("4 shoots","4 pędy"),Fact(GuideFactKind.Stuck,"Stuck: cannot move","Uwięziona: nie rusza się"));
            Add("thornback","Kaktus",GuideWhen.Touch,GuideWho.Enemies,0,"Thorns","Kolce",
                "Every enemy that touches it takes 5 damage — whether it hits them or they hit it.",
                "Każdy wróg, który go dotknie, traci 5 HP — czy to on uderzy, czy w niego uderzą.",
                "Once a turn for each enemy. Stand it in the enemy's way.",
                "Raz na turę na każdego wroga. Postaw go wrogowi na drodze.",
                Damage("5 damage","5 obrażeń"));
            Add("elderbloom","Kwiat",GuideWhen.Turn,GuideWho.Allies,100,"Heals yours","Leczy twoje",
                "At the start of each turn of yours, it heals your balls next to it — and itself.",
                "Na początku każdej twojej tury leczy twoje kulki obok siebie — i siebie.",
                "Keep your hurt balls close to it.",
                "Trzymaj przy nim ranne kulki.",
                Heal("+5 HP a turn","+5 HP co turę"));
            Add("cultivator","Kiełek",GuideWhen.Turn,GuideWho.Self,0,"Grows","Rośnie",
                "At the start of each turn of yours it grows - bigger and heavier - and gets 5 HP back. Three times at most.",
                "Na początku każdej twojej tury rośnie — jest większy i cięższy — i odzyskuje 5 HP. Najwyżej 3 razy.",
                "A grown Sprout is hard to push away. Play it early.",
                "Wyrośniętego Kiełka trudno odepchnąć. Zagraj go wcześnie.",
                Heal("+5 HP a turn","+5 HP co turę"),Count("Grows 3 times","Rośnie 3 razy"));
            Add("cascade","Żołądź",GuideWhen.Death,GuideWho.Self,0,"Regrows","Odrasta",
                "Grows back on the same spot with 10 HP. When that one dies, it grows back once more with 5 HP.",
                "Odrasta w tym samym miejscu z 10 HP. Gdy zginie znowu, odrasta jeszcze raz — z 5 HP.",
                "The third death is final.",
                "Trzecia śmierć jest ostatnia.",
                Heal("30 → 10 → 5 HP","30 → 10 → 5 HP"));

            // Tray labels for the tags that are too long for a card.
            Short("frosttrap","Trap","Pułapka");
            Short("embertrap","Trap","Pułapka");
            Short("sporetrap","Trap","Pułapka");
            Short("staticfield","Trap","Pułapka");
            Short("shatterer","Ice break",null);
            Short("frostguard","Chills hit","Mrozi cios");
            Short("blightpool","Pool","Kałuża");
            Short("plagueburst","Spores",null);
            Short("fluxmine","Homes in","Namierza");
            Short("gravitymine","Pull+blast","Wir+wybuch");
            Short("anchor","Holds","Trzyma");
            Short("chainshock","Bolt/turn","Razi/turę");
            Short("capacitor","Charges","Ładuje się");
            Short("jammer",null,"Wyłącza");
            Short("elderbloom","Heals","Leczy");
        }
    }
}
