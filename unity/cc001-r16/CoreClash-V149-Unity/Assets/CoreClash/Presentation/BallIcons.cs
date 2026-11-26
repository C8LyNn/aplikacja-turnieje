using System;
using System.Collections.Generic;
using System.Globalization;
using CoreClash.Data;

namespace CoreClash.Presentation
{
    // CC-001 W21: real ball icons and short display names for Standard, five basics and the
    // four W21 featured decks (42 balls), plus the 8 W22 active-roster balls that had no icon
    // yet. Every active ball has an icon; frozen balls are not given new ones.
    // Keyed by the stable catalog id; ids, abilities, saves and the network protocol
    // never see this table. A ball without an entry keeps its letter mark and its
    // catalog name, so the batch can grow without touching anything else.
    //
    // One visual language (white mask, tinted by the caller, same shape list as Glyphs):
    //   a ball that applies a status wears that status' symbol (flame, snowflake, trefoil);
    //   a thin outer ring  = works in an area around the ball;
    //   an arrow / hook    = moves something (pull, pass on, relay);
    //   a shield outline   = protects;   a cross = heals;
    //   a skull            = works through DEATH effects;
    //   paired shapes      = identity or side changes (copy, steal, swap).
    // Shapes use a -1..1 box, y down:  C x y r | R x y r w | L x1 y1 x2 y2 w | P x1 y1 x2 y2 ... (convex)
    // '+' adds a shape, '-' cuts it out of what is already there.
    public static class BallIcons
    {
        public const int BatchSize=67;
        const string Shield="+P -.72 -.8 .72 -.8 .72 .1 0 .92 -.72 .1";
        const string Trefoil="+C 0 -.28 .26;+C -.26 .17 .26;+C .26 .17 .26";
        const string Flame="+C 0 .3 .55;+P -.12 -.98 .5 .16 -.52 .2;+P .42 -.52 .6 .34 .1 .3;-C -.02 .5 .2";
        const string Heart="+C -.36 -.28 .42;+C .36 -.28 .42;+P -.74 -.08 .74 -.08 0 .88";

        struct Entry{public string Spec,Name;}
        static readonly Dictionary<string,Entry> Entries=new Dictionary<string,Entry>(StringComparer.Ordinal);
        static void Add(string id,string spec,string name=null)=>Entries.Add(id,new Entry{Spec=spec,Name=name});

        static BallIcons()
        {
            // W24 (owner direction, 2026-11-22): the roster is six groups of five, made icons first.
            // Each icon is a thing everybody knows; the power under it is what that thing does.
            // Ice.
            Add("ice","+L -.86 0 .86 0 .28;+L -.43 -.74 .43 .74 .28;+L .43 -.74 -.43 .74 .28");
            Add("blizzardcore","+L -.88 -.22 .44 -.22 .22;+L -.55 -.79 .11 .35 .22;+L .11 -.79 -.55 .35 .22;+L .3 .5 .94 .5 .15;+L .46 .22 .78 .78 .15;+L .78 .22 .46 .78 .15;+L .42 -.62 .9 -.62 .13;+L .54 -.83 .78 -.41 .13;+L .78 -.83 .54 -.41 .13","Blizzard");
            Add("frosttrap","+P 0 -.98 .98 0 0 .98 -.98 0;-L -.5 0 .5 0 .2;-L -.25 -.43 .25 .43 .2;-L .25 -.43 -.25 .43 .2","Ice Trap");
            Add("shatterer","+P -.6 -.9 .6 -.9 .95 -.3 0 .96 -.95 -.3;-L .12 -1 -.16 -.36 .17;-L -.16 -.36 .18 .1 .17;-L .18 .1 -.02 1 .17");
            Add("frostguard","+C 0 .44 .52;+C 0 -.3 .36;+P -.3 -.6 .3 -.6 .3 -.98 -.3 -.98;+L -.46 -.62 .46 -.62 .14;-C -.13 -.34 .07;-C .13 -.34 .07;-C 0 .3 .08;-C 0 .58 .08","Snowman");
            // Fire.
            Add("fire","+C 0 .3 .6;+P -.16 -.98 .56 .2 -.58 .24;+P .46 -.52 .62 .34 .08 .3;-C 0 .5 .22;-P -.2 .46 0 .06 .2 .46","Flame");
            Add("furnace","+C 0 -.04 .44;+P -.1 -.98 .42 -.12 -.42 -.09;-C -.02 .06 .16;+L -.7 .9 .7 .54 .26;+L -.7 .54 .7 .9 .26","Campfire");
            Add("embertrap","+P 0 -.98 .98 0 0 .98 -.98 0;-C 0 .2 .32;-P -.14 -.6 .3 .1 -.32 .14;-P .26 -.32 .34 .22 .04 .2","Fire Trap");
            Add("bomb","+C -.1 .22 .66;+L .34 -.3 .56 -.6 .28;+C .7 -.76 .21;-L -.46 .06 -.3 -.14 .15");
            Add("firebrand","+P -.98 .94 -.42 .1 .42 .1 .98 .94;-P -.3 .02 0 .4 .3 .02;+C 0 -.3 .3;+P -.08 -.98 .28 -.36 -.3 -.34;+P .24 -.7 .32 -.26 .02 -.28","Volcano");
            // Poison.
            Add("venom","+C 0 .3 .56;+P 0 -.98 .5 .06 -.5 .06;-C -.2 .4 .15");
            Add("blightpool","+L -.6 .64 .6 .64 .52;+C -.3 -.02 .3;+C .36 -.3 .22;+C -.02 -.74 .16","Tox Pool");
            Add("sporetrap","+P 0 -.98 .98 0 0 .98 -.98 0;-C 0 -.1 .36;-P -.2 .1 .2 .1 .2 .46 -.2 .46;+C -.15 -.12 .1;+C .15 -.12 .1;+L 0 .3 0 .5 .07","Tox Trap");
            Add("plagueburst","+C 0 -.08 .8;-P -1.2 0 1.2 0 1.2 1.2 -1.2 1.2;+P -.24 -.04 .24 -.04 .34 .92 -.34 .92;-C -.38 -.38 .15;-C .3 -.46 .13;-C 0 -.66 .09","Mushroom");
            Add("plagueleech","+L -.74 -.66 .74 -.66 .34;+P -.74 -.56 -.1 -.56 -.42 .7;+P .1 -.56 .74 -.56 .42 .7;+C 0 .72 .17;+P 0 .34 .15 .66 -.15 .66");
            // Magnetism.
            Add("magnet","+R 0 .12 .58 .36;-P -1.2 -1.2 1.2 -1.2 1.2 .12 -1.2 .12;+P -.76 -.8 -.4 -.8 -.4 .14 -.76 .14;+P .4 -.8 .76 -.8 .76 .14 .4 .14;-L -.9 -.44 -.26 -.44 .13;-L .26 -.44 .9 -.44 .13");
            Add("pulse","+P 0 -.98 .34 -.5 -.34 -.5;+P 0 .98 .34 .5 -.34 .5;+P -.98 0 -.5 .34 -.5 -.34;+P .98 0 .5 .34 .5 -.34;+C 0 0 .3");
            Add("fluxmine","+R 0 0 .88 .16;+P 0 -.62 .24 0 -.24 0;+P -.24 0 .24 0 0 .62;-P -.11 .1 .11 .1 0 .4;-C 0 0 .08","Compass");
            Add("gravitymine","+R 0 .3 .56 .3;-P -1.2 -1.2 1.2 -1.2 1.2 .3 -1.2 .3;+P -.71 -.36 -.41 -.36 -.41 .32 -.71 .32;+P .41 -.36 .71 -.36 .71 .32 .41 .32;+C 0 -.5 .24;+L -.44 -.5 .44 -.5 .13;+L 0 -.94 0 -.06 .13;+L -.31 -.81 .31 -.19 .13;+L .31 -.81 -.31 -.19 .13","Pull Mine");
            Add("anchor","+R 0 .1 .66 .22;-P -1.2 -1.2 1.2 -1.2 1.2 .2 -1.2 .2;+P -.98 .22 -.52 .22 -.76 -.12;+P .98 .22 .52 .22 .76 -.12;+L 0 -.44 0 .78 .24;+L -.42 -.2 .42 -.2 .2;+R 0 -.68 .2 .16");
            // Electricity.
            Add("tesla","+P .34 -.98 -.56 .16 .1 .16;+P -.1 -.16 .56 -.16 -.34 .98","Lightning");
            Add("chainshock","+C -.44 -.4 .32;+C .02 -.58 .4;+C .48 -.36 .3;+L -.44 -.2 .48 -.2 .36;+P .2 .08 -.3 .58 .04 .58;+P -.04 .44 .34 .44 -.12 .98","Storm");
            Add("capacitor","+P -.5 -.66 .5 -.66 .5 .94 -.5 .94;+P -.2 -.94 .2 -.94 .2 -.66 -.2 -.66;-P .16 -.42 -.3 .2 .04 .2;-P -.04 .08 .3 .08 -.16 .7","Battery");
            Add("staticfield","+P 0 -.98 .98 0 0 .98 -.98 0;-P .16 -.56 -.34 .1 .05 .1;-P -.05 -.1 .34 -.1 -.16 .56","Shock Trap");
            Add("jammer","+R 0 .1 .68 .26;-P -.34 -1.2 .34 -1.2 .34 -.2 -.34 -.2;+L 0 -.86 0 -.02 .26","Switch");
            // Plants.
            Add("web","+L -.48 .96 -.2 .34 .2;+L -.2 .34 .18 -.12 .2;+L .18 -.12 .1 -.66 .2;+P -.93 -.03 -.63 -.1 -.34 .09 -.27 .35 -.53 .42 -.84 .26;+P .96 -.1 .81 .18 .46 .29 .2 .18 .33 -.07 .67 -.21;+P -.59 -.74 -.29 -.76 -.03 -.52 -.01 -.26 -.28 -.23 -.56 -.44;+P .61 -.9 .57 -.68 .35 -.54 .15 -.58 .18 -.78 .38 -.94","Vine");
            Add("thornback","+L 0 -.6 0 .9 .5;+L -.64 -.14 -.64 .28 .26;+L -.64 .28 0 .28 .26;+L .64 -.44 .64 .06 .26;+L .64 .06 0 .06 .26","Cactus");
            Add("elderbloom","+C 0 -.56 .32;+C .53 -.17 .32;+C .33 .45 .32;+C -.33 .45 .32;+C -.53 -.17 .32;+C 0 0 .32;-C 0 0 .2","Flower");
            Add("cultivator","+L -.56 .86 .56 .86 .22;+L 0 .86 0 -.16 .2;+P -.92 -.74 -.52 -.8 -.13 -.53 -.04 -.18 -.39 -.12 -.81 -.35;+P .92 -.74 .81 -.35 .39 -.12 .04 -.18 .13 -.53 .52 -.8","Sprout");
            Add("cascade","+C 0 .16 .56;+P 0 .98 .44 .5 -.44 .5;-P -1.2 -1.2 1.2 -1.2 1.2 -.06 -1.2 -.06;+C 0 -.18 .7;-P -1.2 -.1 1.2 -.1 1.2 1.2 -1.2 1.2;+C 0 .16 .56;-P -1.2 -.1 1.2 -.1 1.2 -.02 -1.2 -.02;+L 0 -.98 0 -.8 .18","Acorn");
            // Balls outside the roster keep the icons they had.
            Add("normal","+R 0 0 .68 .3;+C 0 0 .25");
            Add("mine","+C 0 0 .54;+L -.88 0 .88 0 .27;+L 0 -.88 0 .88 .27;+L -.62 -.62 .62 .62 .27;+L .62 -.62 -.62 .62 .27;-C 0 0 .22");
            Add("medic","+L 0 -.72 0 .72 .44;+L -.72 0 .72 0 .44");
            // Status Reactor deck.
            Add("vector","+C -.5 .1 .24;+C -.72 .5 .24;+C -.28 .5 .24;+L -.1 .1 .6 -.6 .18;+P .92 -.92 .92 -.3 .3 -.92","Deathspore");
            Add("septiccore",Trefoil+";+L 0 -.95 0 -.72 .16;+L 0 .95 0 .72 .16;+L -.9 .55 -.7 .43 .16;+L .9 .55 .7 .43 .16;+L -.84 -.5 -.64 -.38 .16;+L .84 -.5 .64 -.38 .16","Tox Burst");
            Add("consecrator","+R 0 0 .88 .12;+P 0 -.62 .22 0 0 .62 -.22 0;+P -.62 0 0 -.22 .62 0 0 .22","Sanctum");
            Add("absolver",Shield+";-P 0 -.52 .13 -.05 0 .42 -.13 -.05;-P -.44 -.05 0 -.18 .44 -.05 0 .08");
            Add("penitent","+R -.15 .2 .5 .18;+L .85 -.8 .34 -.29 .18;+P .1 -.05 .54 -.12 .17 -.49","Scapegoat");
            Add("ward","+P -.76 -.84 .76 -.84 .76 .1 0 .94 -.76 .1;-L 0 -.5 0 .34 .24;-L -.38 -.14 .38 -.14 .24");
            Add("halo","+L -.44 -.68 .44 -.68 .28;+C 0 .36 .5");
            // Gravity Trap deck.
            Add("briarheart","+P 0 -.95 .34 .1 -.34 .1;+L 0 .1 -.6 .8 .2;+L 0 .1 .6 .8 .2;+L 0 .1 0 .88 .2","Rootstrike");
            Add("vinehook","+R -.12 .3 .4 .2;-P -1.2 -1.2 1.2 -1.2 1.2 .3 -1.2 .3;+L .28 -.9 .28 .3 .2;+P -.52 -.22 -.84 .34 -.2 .34");
            Add("singularity","+R 0 0 .8 .24;-L -1.2 1.2 1.2 -1.2 .74;+C 0 0 .42");
            Add("horizonrelay","+R 0 .34 .52 .16;+L 0 .34 0 -.5 .18;+P 0 -.98 .36 -.45 -.36 -.45");
            Add("gatekeeper","+C 0 -.22 .72;+P -.72 -.22 .72 -.22 .72 .92 -.72 .92;-C 0 -.16 .4;-P -.4 -.16 .4 -.16 .4 1.2 -.4 1.2;+C 0 .36 .2","Portal");
            Add("harpoon","+L -.8 .8 .4 -.4 .28;+P .98 -.98 .08 -.76 .76 -.08;+L -.8 .8 -.8 .36 .2;+L -.8 .8 -.36 .8 .2");
            Add("vortexmedic","+R 0 0 .86 .2;-P 0 0 1.25 -.7 1.25 .7;-P 0 0 -1.25 .7 -1.25 -.7;+L 0 -.42 0 .42 .36;+L -.42 0 .42 0 .36");
            // Death Engine deck. Skull = the ball works through DEATH effects.
            Add("agony","+C 0 -.18 .7;+P -.42 .2 .42 .2 .42 .88 -.42 .88;-C -.3 -.16 .21;-C .3 -.16 .21;-L 0 .56 0 1 .13","Deathcast");
            Add("requiem","+R 0 0 .92 .1;+C 0 -.12 .5;+P -.28 .22 .28 .22 .28 .62 -.28 .62;-C -.2 -.14 .15;-C .2 -.14 .15");
            Add("bonfire","+C 0 0 .46;+P -.1 -.98 .44 -.08 -.44 -.05;-C -.02 .1 .17;+L -.68 .9 .68 .56 .26;+L -.68 .56 .68 .9 .26");
            Add("wildfire","+R 0 0 .9 .12;+C 0 .2 .36;+P -.08 -.64 .33 .1 -.34 .13;-C -.01 .33 .13");
            Add("soulburst","+P 0 -.96 .2 0 0 .96 -.2 0;+P -.96 0 0 -.2 .96 0 0 .2;+P -.5 -.5 .12 -.12 .5 .5 -.12 .12;+P .5 -.5 .12 .12 -.5 .5 -.12 -.12");
            Add("reclaimer","+C -.38 -.3 .44;+C .38 -.3 .44;+P -.7 0 .7 0 0 .92;-L 0 -.34 0 .3 .22;-L -.32 -.02 .32 -.02 .22","Reviver");
            Add("gravehide","+P -.82 .1 .82 .1 .82 .68 -.82 .68;+P -.82 .12 -.82 -.55 -.3 .12;+P -.42 .12 0 -.8 .42 .12;+P .3 .12 .82 -.55 .82 .12");
            Add("packheart",Heart+";-P -.26 -.32 .26 -.32 .26 .04 0 .36 -.26 .04");
            // Reality Hackers deck. Paired shapes = identity or side changes.
            Add("mimic","+C -.4 0 .52;+C .4 0 .52;-C -.4 -.04 .2;-C .4 -.04 .2;-P -.3 .6 .3 .6 0 .14");
            Add("doppelganger","+R -.3 -.14 .5 .16;+C .32 .16 .5","Copycat");
            Add("wildcard","+P -.72 -.72 .72 -.72 .72 .72 -.72 .72;-C -.36 -.36 .16;-C 0 0 .16;-C .36 .36 .16");
            Add("collector","+L -.6 -.52 .6 -.52 .24;+L -.6 0 .6 0 .24;+L -.6 .52 .6 .52 .24");
            Add("echo","+R -.64 0 .68 .25;+R -.64 0 1.2 .25;-P -1.25 -1.25 -.3 -1.25 -.3 1.25 -1.25 1.25;-P -.64 0 .4 -1.25 -1.25 -1.25 -1.25 0;-P -.64 0 -1.25 0 -1.25 1.25 .4 1.25;+C -.64 0 .3");
            Add("timeshift","+L -.6 -.42 .3 -.42 .28;+P .98 -.42 .3 -.9 .3 .06;+L .6 .42 -.3 .42 .28;+P -.98 .42 -.3 -.06 -.3 .9","Swap");
            Add("chronomancer","+R 0 0 .76 .27;+L 0 0 0 -.38 .23;+L 0 0 .3 .16 .23","Rewind");
            Add("paradox","+R 0 .05 .66 .18;-P 0 .05 1.2 -1.15 1.2 .05;+P .66 -.5 .3 -.02 1.02 -.02","Snapback");
            // W22 active roster: the eight active balls that had no icon.
            Add("timebomb","+C -.1 .22 .66;+L .34 -.3 .56 -.6 .28;+C .7 -.76 .21;-L -.1 .24 -.1 -.2 .19;-L -.1 .24 .24 .24 .19");
            Add("slingshot","+L 0 .9 0 .2 .32;+L 0 .2 -.56 -.5 .3;+L 0 .2 .56 -.5 .3;+C 0 -.62 .24");
            Add("pinballer","+L -.82 .12 -.22 .72 .36;+L .82 .12 .22 .72 .36;+C 0 -.44 .32");
            Add("traitor","+P -.44 -.94 -.98 .14 .1 .14;+P .44 .94 -.1 -.14 .98 -.14");
        }

        // A shoot of the Vine as it lies on the board: three leaves round a bud.
        public const string Shoot="+P 0 -.96 .27 -.69 .24 -.27 0 -.04 -.24 -.27 -.27 -.69;+P .84 .49 .47 .59 .12 .36 .04 .03 .36 -.07 .74 .12;+P -.84 .49 -.74 .12 -.36 -.07 -.04 .03 -.12 .36 -.47 .59;+C 0 0 .2";
        public static IEnumerable<string> Ids=>Entries.Keys;
        public static bool Has(string id)=>id!=null&&Entries.ContainsKey(id);
        // Shape list for the ball's icon, or null when the ball has no icon yet.
        public static string Spec(string id)=>id!=null&&Entries.TryGetValue(id,out var entry)?entry.Spec:null;
        // Name shown to the player. Falls back to the catalog name. In Polish (W24) a ball with a
        // guide entry shows its Polish name; every other ball keeps the English one.
        public static string Name(BallDefinition definition)
            =>definition==null?"":Lang.Polish&&BallGuide.NamePl(definition.id)!=null?BallGuide.NamePl(definition.id):Entries.TryGetValue(definition.id??"",out var entry)&&entry.Name!=null?entry.Name:definition.name;

        // True when every part is a known shape with the right number of finite values
        // inside the drawing box. Shared by the managed tests, so a typo fails before the Player.
        public static bool Valid(string spec)
        {
            if(string.IsNullOrEmpty(spec))return false;
            foreach(string part in spec.Split(';'))
            {
                string[] token=part.Split(' ');
                if(token[0].Length!=2||token[0][0]!='+'&&token[0][0]!='-')return false;
                int values=token.Length-1;
                switch(token[0][1])
                {
                    case 'C':if(values!=3)return false;break;
                    case 'R':if(values!=4)return false;break;
                    case 'L':if(values!=5)return false;break;
                    case 'P':if(values<6||values%2!=0)return false;break;
                    default:return false;
                }
                for(int i=1;i<token.Length;i++)
                    if(!float.TryParse(token[i],NumberStyles.Float,CultureInfo.InvariantCulture,out float value)||float.IsNaN(value)||Math.Abs(value)>1.25f)return false;
            }
            return spec[0]=='+';
        }
    }
}
