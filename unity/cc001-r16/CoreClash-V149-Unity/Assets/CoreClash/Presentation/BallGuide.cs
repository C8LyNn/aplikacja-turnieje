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
            {"roster_element_storm",new[]{"BURZA ŻYWIOŁÓW","Podpalaj, mroź i truj. Nałóż stan, a potem go wykorzystaj."}},
            {"roster_demolition",new[]{"DEMOLKA","Zastawiaj pułapki, wpychaj w nie wroga i zmieniaj planszę."}},
            {"roster_afterlife",new[]{"ZAŚWIATY","Twoje kulki są warte więcej, gdy giną. Wywołuj to wtedy, kiedy chcesz."}},
            {"roster_trickster",new[]{"SZTUKMISTRZ","Zamieniaj miejsca, otwieraj portale, cofaj czas i przejmuj najlepszą kulkę wroga."}},
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
        public GuideWhen When;public GuideWho Who;
        // Reach of the power in simulation units (the board is 540 wide). 0 = contact or self.
        public float Range;
        public GuideFact[] Facts=Array.Empty<GuideFact>();
        public string Tag=>Lang.T(TagEn,TagPl);
        public string Does=>Lang.T(DoesEn,DoesPl);
        public string Tip=>Lang.T(TipEn,TipPl);
    }

    public static class BallGuide
    {
        // Tile labels must fit a phone tile on one line.
        public const int MaxTag=14;
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

            // Explosives.
            Add("bomb","Bomba",GuideWhen.Stop,GuideWho.Everyone,165,"Blast","Wybuch",
                "Explodes and is gone. The blast hurts and throws back every ball in range — yours too.",
                "Wybucha i znika. Wybuch rani i odrzuca wszystkie kulki w zasięgu — twoje też.",
                "Destroyed before it stops? It still explodes.",
                "Zniszczona, zanim się zatrzyma? I tak wybuchnie.",
                Damage("10–15 damage","10–15 obrażeń"));
            Add("mine","Mina",GuideWhen.Stop,GuideWho.Everyone,100,"Touch trap","Pułapka",
                "Arms itself. Later, when an enemy ball touches it, it explodes and is gone.",
                "Uzbraja się. Gdy potem dotknie jej kulka wroga, wybucha i znika.",
                "The blast hurts your balls too. An enemy Frost ball disarms it.",
                "Wybuch rani też twoje kulki. Wrogi Mróz ją rozbraja.",
                Damage("10 damage","10 obrażeń"));
            Add("timebomb","Bomba zegarowa",GuideWhen.Stop,GuideWho.Everyone,165,"2-turn fuse","Lont: 2 tury",
                "Starts ticking. At the start of your second turn after that, it explodes and is gone.",
                "Zaczyna tykać. Na początku twojej drugiej tury od tej chwili wybucha i znika.",
                "The blast hurts your balls too. If it is destroyed first, it never goes off.",
                "Wybuch rani też twoje kulki. Zniszczona wcześniej — nie wybuchnie.",
                Time("After 2 turns","Po 2 turach"),Damage("10 damage","10 obrażeń"));

            // Fire.
            Add("fire","Ogień",GuideWhen.Touch,GuideWho.Enemies,0,"Burn","Podpala",
                "Sets fire to every enemy it touches.",
                "Podpala każdego wroga, którego dotknie.",
                "Second fire on the same ball: 10 HP a turn. Third: a burst that ignites enemies next to it. Fire and ice cancel each other.",
                "Drugi ogień na tej samej kulce: 10 HP co turę. Trzeci: wybuch, który podpala wrogów obok. Ogień i lód znoszą się nawzajem.",
                Burning);
            Add("furnace","Piec",GuideWhen.Turn,GuideWho.Enemies,104,"Fire field","Pole ognia",
                "In each turn of yours it lights a field of fire around itself. At the end of every turn, enemies standing in the field catch fire.",
                "W każdej twojej turze rozpala wokół siebie pole ognia. Na koniec każdej tury wrogowie stojący w polu zaczynają płonąć.",
                "Big and heavy: hard to push away.",
                "Duża i ciężka: trudno ją odepchnąć.",
                Burning);
            Add("bonfire","Ognisko",GuideWhen.Death,GuideWho.Everyone,100,"Burn + heal","Pali i leczy",
                "Enemies nearby lose 10 HP and catch fire. Your balls nearby get 5 HP back.",
                "Wrogowie w pobliżu tracą 10 HP i zaczynają płonąć. Twoje kulki w pobliżu odzyskują 5 HP.",
                "Deathcast sets this off without killing Bonfire.",
                "Zew śmierci odpala ten efekt bez zabijania Ogniska.",
                Damage("10 to enemies","10 dla wrogów"),Burning,Heal("+5 HP to yours","+5 HP dla twoich"));

            // Ice.
            Add("ice","Mróz",GuideWhen.Touch,GuideWho.Enemies,100,"Freeze","Mrozi",
                "Chills the enemy it touches and other enemies near that one. The third chill freezes a ball.",
                "Mrozi wroga, którego dotknie, i innych wrogów obok niego. Trzeci mróz zamraża kulkę.",
                "Hitting a frozen ball deals 5 extra damage. Disarms enemy Mines. Ice and fire cancel each other.",
                "Uderzenie w zamrożoną kulkę: +5 obrażeń. Rozbraja wrogie Miny. Lód i ogień znoszą się nawzajem.",
                Chilled,Fact(GuideFactKind.Frozen,"Frozen: cannot move","Zamrożona: nie rusza się"));
            Add("shatterer","Kruszyciel",GuideWhen.Touch,GuideWho.Enemies,0,"Ice breaker","Kruszy lód",
                "Hits chilled enemies harder: a ball with 2 chills, or a frozen one, loses 5 extra HP.",
                "Mocniej bije zmrożonych: kulka z dwoma mrozami albo zamrożona traci dodatkowe 5 HP.",
                "The hit uses up the ice on the target. Chill first with Frost, then shatter.",
                "Cios zużywa lód na celu. Najpierw zmroź Mrozem, potem krusz.",
                Damage("+5 damage","+5 obrażeń"));
            Add("frosttrap","Lodowa pułapka",GuideWhen.Stop,GuideWho.Enemies,0,"Ice trap","Pułapka lodu",
                "Leaves an ice trap on that spot. The first enemy to roll over the trap gets chilled.",
                "Zostawia w tym miejscu lodową pułapkę. Pierwszy wróg, który na nią wjedzie, dostaje mróz.",
                "The trap works once.",
                "Pułapka działa raz.",
                Chilled,Count("Works once","Działa raz"));

            // Poison.
            Add("venom","Jad",GuideWhen.Touch,GuideWho.Enemies,0,"Poison","Zatruwa",
                "Poisons the enemy it touches.",
                "Zatruwa wroga, którego dotknie.",
                "Touch an enemy that is already poisoned: it loses 5 HP at once and Venom gets 5 HP back.",
                "Dotknij już zatrutego wroga: od razu traci 5 HP, a Jad odzyskuje 5 HP.",
                Poisoned);
            Add("blightpool","Trująca kałuża",GuideWhen.Stop,GuideWho.Enemies,165,"Poison pool","Kałuża jadu",
                "Spills a big pool of poison that lasts 3 turns. At the end of every turn, enemies standing in the pool get poisoned.",
                "Rozlewa dużą kałużę trucizny na 3 tury. Na koniec każdej tury wrogowie stojący w kałuży zostają zatruci.",
                "Push or pull enemies into the pool.",
                "Wepchnij albo wciągnij wrogów do kałuży.",
                Time("Pool lasts 3 turns","Kałuża trwa 3 tury"),Poisoned);
            Add("plagueleech","Pijawka",GuideWhen.Touch,GuideWho.Enemies,0,"Drain","Wysysa",
                "The first enemy it touches is poisoned and tied to the Leech. In each turn of yours, the Leech sucks 5 HP out of it and heals itself.",
                "Pierwszy wróg, którego dotknie, zostaje zatruty i związany z Pijawką. W każdej twojej turze Pijawka wysysa z niego 5 HP i sama się leczy.",
                "It lasts while the target is alive and still poisoned. The drain ignores shields.",
                "Trwa, dopóki cel żyje i jest zatruty. Wysysanie omija tarczę.",
                Poisoned,Heal("Drains 5 HP a turn","Wysysa 5 HP co turę"));

            // Traps and movement.
            Add("gravitymine","Grawimina",GuideWhen.Stop,GuideWho.Everyone,100,"Pull + blast","Wir i wybuch",
                "Makes a field that pulls balls towards it. When an enemy rolls into the field, the mine explodes and is gone.",
                "Tworzy pole, które przyciąga kulki. Gdy w pole wjedzie wróg, mina wybucha i znika.",
                "It needs room: with another ball close by, the field does not appear. The blast hurts your balls too.",
                "Potrzebuje miejsca: gdy inna kulka jest blisko, pole się nie pojawi. Wybuch rani też twoje kulki.",
                Damage("10 damage","10 obrażeń"));
            Add("web","Pająk",GuideWhen.Stop,GuideWho.Enemies,70,"Webs","Sieci",
                "Places 4 webs around itself. An enemy that rolls into a web is stuck there until the end of its next turn.",
                "Rozstawia wokół siebie 4 sieci. Wróg, który wjedzie w sieć, utyka w niej do końca swojej następnej tury.",
                "Each web works once. A stuck ball cannot be launched again.",
                "Każda sieć działa raz. Uwięzionej kulki nie da się wystrzelić ponownie.",
                Count("4 webs","4 sieci"),Fact(GuideFactKind.Stuck,"Stuck: cannot move","Uwięziona: nie rusza się"));
            Add("harpoon","Harpun",GuideWhen.Stop,GuideWho.Enemies,230,"Pull","Przyciąga",
                "Yanks the farthest enemy in range towards itself.",
                "Przyciąga do siebie najdalszego wroga w zasięgu.",
                "Drag an enemy onto a Mine, into a pool or away from your base.",
                "Ściągnij wroga na Minę, do kałuży albo spod twojej bazy.",
                Count("1 enemy","1 wróg"));
            Add("pulse","Impuls",GuideWhen.Stop,GuideWho.Everyone,165,"Push","Odpycha",
                "Shoves every ball in range away from itself — yours too. It deals no damage.",
                "Odpycha od siebie wszystkie kulki w zasięgu — twoje też. Nie zadaje obrażeń.",
                "The closer a ball is, the harder it is pushed.",
                "Im bliżej jest kulka, tym mocniej ją odpycha.");
            Add("timeshift","Zamiana",GuideWhen.Stop,GuideWho.Enemies,100,"Swap places","Zamiana miejsc",
                "Swaps places with the nearest enemy close by.",
                "Zamienia się miejscami z najbliższym wrogiem w pobliżu.",
                "The swap deals no damage. Use it to drop an enemy into danger.",
                "Zamiana nie rani. Użyj jej, żeby wrzucić wroga w kłopoty.",
                Count("1 enemy","1 wróg"));
            Add("gatekeeper","Portal",GuideWhen.Stop,GuideWho.Everyone,0,"Portals","Portale",
                "Opens two linked portals: one here and one on the opposite side of the board. A ball that rolls into one flies out of the other.",
                "Otwiera dwa połączone portale: jeden tutaj, drugi po przeciwnej stronie planszy. Kulka, która wjedzie w jeden, wylatuje z drugiego.",
                "Both players can use the portals. They close when this ball dies.",
                "Z portali korzystają obaj gracze. Znikają, gdy ta kulka zginie.",
                Count("2 portals","2 portale"));
            Add("slingshot","Proca",GuideWhen.Stop,GuideWho.Allies,165,"Launch yours","Strzela twoimi",
                "Gathers your balls from nearby and fires them all in the direction it was flying.",
                "Zbiera twoje kulki z pobliża i wystrzeliwuje je wszystkie w kierunku, w którym leciała.",
                "Frozen and stuck balls stay where they are.",
                "Zamrożone i uwięzione kulki zostają na miejscu.");
            Add("pinballer","Odbijak",GuideWhen.Stop,GuideWho.Everyone,0,"Bumper","Zderzak",
                "Puts a bumper by the nearest wall. Balls of both players bounce off the bumper faster than they came.",
                "Stawia zderzak przy najbliższej ścianie. Kulki obu graczy odbijają się od zderzaka szybciej, niż przyleciały.",
                "The bumper breaks after 5 hard enemy hits.",
                "Zderzak pęka po 5 mocnych uderzeniach wroga.",
                Shield("Bumper: 5 hits","Zderzak: 5 uderzeń"));

            // Support.
            Add("vortexmedic","Wir leczący",GuideWhen.Stop,GuideWho.Everyone,165,"Pull + heal","Wciąga i leczy",
                "Pulls nearby enemies in and heals your most hurt ball nearby: 5 HP for one enemy pulled, 10 HP for two or more.",
                "Przyciąga wrogów z pobliża i leczy twoją najbardziej ranną kulkę w pobliżu: 5 HP za jednego wroga, 10 HP za dwóch lub więcej.",
                "No enemy in range means no healing.",
                "Bez wroga w zasięgu nie ma leczenia.",
                Heal("+5 or +10 HP","+5 albo +10 HP"));
            Add("ward","Osłona",GuideWhen.Stop,GuideWho.Allies,165,"Protect","Chroni",
                "Clears fire, ice, poison and webs from your balls in range, and gives each of them a shield of 5.",
                "Zdejmuje ogień, lód, truciznę i sieci z twoich kulek w zasięgu i daje każdej tarczę 5.",
                "A shield soaks up damage before HP does.",
                "Tarcza przyjmuje obrażenia przed HP.",
                Shield("Shield 5","Tarcza 5"));
            Add("halo","Aureola",GuideWhen.Always,GuideWho.Self,0,"Blocks 1 hit","Blok 1 ciosu",
                "The first collision that would hurt it does nothing. After that it is an ordinary ball.",
                "Pierwsze zderzenie, które by ją zraniło, nic jej nie robi. Potem jest zwykłą kulką.",
                "Only collisions are blocked — not blasts, fire or poison.",
                "Blokuje tylko zderzenie — nie wybuch, ogień ani truciznę.",
                Shield("1 hit blocked","1 cios zablokowany"));

            // Death powers.
            Add("cascade","Kaskada",GuideWhen.Death,GuideWho.Self,0,"Comes back","Wraca 2 razy",
                "Comes back on the same spot with 10 HP. When that one dies, it comes back once more with 5 HP.",
                "Wraca w tym samym miejscu z 10 HP. Gdy zginie znowu, wraca jeszcze raz — z 5 HP.",
                "The third death is final.",
                "Trzecia śmierć jest ostatnia.",
                Heal("25 → 10 → 5 HP","25 → 10 → 5 HP"));
            Add("agony","Zew śmierci",GuideWhen.Touch,GuideWho.Allies,0,"Triggers","Wyzwala",
                "Touch one of your own balls that has a “when it dies” power: that power goes off at once, and the ball stays alive.",
                "Dotknij nią swojej kulki z mocą „gdy ginie”: ta moc zadziała od razu, a kulka przeżyje.",
                "Works with Bomb, Bonfire, Cascade and Singularity.",
                "Działa z Bombą, Ogniskiem, Kaskadą i Czarną dziurą.");
            Add("singularity","Czarna dziura",GuideWhen.Death,GuideWho.Everyone,0,"Swallows balls","Pożera kulki",
                "Leaves a black hole. The hole pulls in and swallows balls of both players, and it grows every turn.",
                "Zostawia czarną dziurę. Dziura wciąga i pożera kulki obu graczy i rośnie z każdą turą.",
                "It closes after swallowing 10 balls. A swallowed ball is gone: no death power, no coming back.",
                "Zamyka się po pożarciu 10 kulek. Pożarta kulka przepada: bez mocy śmierci i bez powrotu.",
                Count("Up to 10 balls","Do 10 kulek"),Time("Grows every turn","Rośnie co turę"));
            Add("reclaimer","Ożywiciel",GuideWhen.Stop,GuideWho.Allies,0,"Revive","Wskrzesza",
                "Pays 10 HP to bring back your ball that fell first, with 15 HP. It can do this only once.",
                "Oddaje 10 HP i przywraca twoją najdawniej poległą kulkę z 15 HP. Może to zrobić tylko raz.",
                "It needs more than 10 HP. Standard and Cascade cannot be brought back.",
                "Musi mieć ponad 10 HP. Zwykłej i Kaskady nie da się przywrócić.",
                Damage("Costs 10 HP","Koszt: 10 HP"),Heal("Returns with 15 HP","Wraca z 15 HP"),Count("Once","Raz"));

            // Tricks.
            Add("traitor","Zdrajca",GuideWhen.Touch,GuideWho.Enemies,0,"Steal","Przejmuje",
                "The first enemy it touches switches to your side. In return, the Traitor becomes a Standard ball of your opponent.",
                "Pierwszy wróg, którego dotknie, przechodzi na twoją stronę. W zamian Zdrajca staje się Zwykłą kulką przeciwnika.",
                "Aim at the enemy's most valuable ball.",
                "Celuj w najcenniejszą kulkę wroga.",
                Count("Once","Raz"));
            Add("chronomancer","Cofanie",GuideWhen.Stop,GuideWho.Self,0,"Save + return","Zapis i powrót",
                "The first time it stops, it remembers its place and HP. The next time it stops, it jumps back to that place with that HP.",
                "Gdy zatrzyma się pierwszy raz, zapamiętuje swoje miejsce i HP. Gdy zatrzyma się kolejny raz, wraca w to miejsce z tamtym HP.",
                "Then it starts over: save, return, save, return…",
                "Potem od nowa: zapis, powrót, zapis, powrót…");
            Add("echo","Echo",GuideWhen.Stop,GuideWho.Everyone,165,"Repeat","Powtarza",
                "Every ball in range repeats its “when it stops” power — enemy balls too.",
                "Każda kulka w zasięgu powtarza swoją moc „gdy się zatrzyma” — kulki wroga też.",
                "Stop it next to your balls and far from theirs. Echo does not repeat another Echo.",
                "Zatrzymaj je obok swoich kulek, z dala od wrogich. Echo nie powtarza innego Echa.");
        }
    }
}
