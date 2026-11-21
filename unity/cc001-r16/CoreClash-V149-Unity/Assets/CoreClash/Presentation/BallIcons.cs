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
        public const int BatchSize=50;
        const string Shield="+P -.72 -.8 .72 -.8 .72 .1 0 .92 -.72 .1";
        const string Trefoil="+C 0 -.28 .26;+C -.26 .17 .26;+C .26 .17 .26";
        const string Flame="+C 0 .3 .55;+P -.12 -.98 .5 .16 -.52 .2;+P .42 -.52 .6 .34 .1 .3;-C -.02 .5 .2";
        const string Heart="+C -.36 -.28 .42;+C .36 -.28 .42;+P -.74 -.08 .74 -.08 0 .88";

        struct Entry{public string Spec,Name;}
        static readonly Dictionary<string,Entry> Entries=new Dictionary<string,Entry>(StringComparer.Ordinal);
        static void Add(string id,string spec,string name=null)=>Entries.Add(id,new Entry{Spec=spec,Name=name});

        static BallIcons()
        {
            // Basics.
            Add("normal","+R 0 0 .68 .3;+C 0 0 .25");
            Add("fire","+C 0 .3 .6;+P -.16 -.98 .56 .2 -.58 .24;+P .46 -.52 .62 .34 .08 .3;-C 0 .5 .22;-P -.2 .46 0 .06 .2 .46");
            Add("ice","+L -.86 0 .86 0 .28;+L -.43 -.74 .43 .74 .28;+L .43 -.74 -.43 .74 .28");
            Add("mine","+C 0 0 .54;+L -.88 0 .88 0 .27;+L 0 -.88 0 .88 .27;+L -.62 -.62 .62 .62 .27;+L .62 -.62 -.62 .62 .27;-C 0 0 .22");
            Add("bomb","+C -.1 .22 .66;+L .34 -.3 .56 -.6 .28;+C .7 -.76 .21;-L -.46 .06 -.3 -.14 .15");
            Add("medic","+L 0 -.72 0 .72 .44;+L -.72 0 .72 0 .44");
            // Status Reactor deck.
            Add("blightpool","+L -.6 .64 .6 .64 .52;+C -.3 -.02 .3;+C .36 -.3 .22;+C -.02 -.74 .16","Tox Pool");
            Add("plagueleech","+L -.74 -.66 .74 -.66 .34;+P -.74 -.56 -.1 -.56 -.42 .88;+P .1 -.56 .74 -.56 .42 .88");
            Add("vector","+C -.5 .1 .24;+C -.72 .5 .24;+C -.28 .5 .24;+L -.1 .1 .6 -.6 .18;+P .92 -.92 .92 -.3 .3 -.92","Deathspore");
            Add("septiccore",Trefoil+";+L 0 -.95 0 -.72 .16;+L 0 .95 0 .72 .16;+L -.9 .55 -.7 .43 .16;+L .9 .55 .7 .43 .16;+L -.84 -.5 -.64 -.38 .16;+L .84 -.5 .64 -.38 .16","Tox Burst");
            Add("consecrator","+R 0 0 .88 .12;+P 0 -.62 .22 0 0 .62 -.22 0;+P -.62 0 0 -.22 .62 0 0 .22","Sanctum");
            Add("absolver",Shield+";-P 0 -.52 .13 -.05 0 .42 -.13 -.05;-P -.44 -.05 0 -.18 .44 -.05 0 .08");
            Add("penitent","+R -.15 .2 .5 .18;+L .85 -.8 .34 -.29 .18;+P .1 -.05 .54 -.12 .17 -.49","Scapegoat");
            Add("ward","+P -.76 -.84 .76 -.84 .76 .1 0 .94 -.76 .1;-L 0 -.5 0 .34 .24;-L -.38 -.14 .38 -.14 .24");
            Add("halo","+L -.44 -.68 .44 -.68 .28;+C 0 .36 .5");
            // Gravity Trap deck.
            Add("web","+L -.4 -.86 -.4 .86 .27;+L .4 -.86 .4 .86 .27;+L -.86 -.4 .86 -.4 .27;+L -.86 .4 .86 .4 .27");
            Add("briarheart","+P 0 -.95 .34 .1 -.34 .1;+L 0 .1 -.6 .8 .2;+L 0 .1 .6 .8 .2;+L 0 .1 0 .88 .2","Rootstrike");
            Add("vinehook","+R -.12 .3 .4 .2;-P -1.2 -1.2 1.2 -1.2 1.2 .3 -1.2 .3;+L .28 -.9 .28 .3 .2;+P -.52 -.22 -.84 .34 -.2 .34");
            Add("gravitymine","+R 0 .12 .58 .36;-P -1.2 -1.2 1.2 -1.2 1.2 .12 -1.2 .12;+P -.76 -.8 -.4 -.8 -.4 .14 -.76 .14;+P .4 -.8 .76 -.8 .76 .14 .4 .14;-L -.9 -.44 -.26 -.44 .13;-L .26 -.44 .9 -.44 .13");
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
            Add("cascade","+C -.46 -.4 .46;+C .26 .22 .33;+C .7 .72 .21");
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
            Add("furnace","+P -.84 -.84 .84 -.84 .84 .88 -.84 .88;-P -.5 -.4 .5 -.4 .5 .9 -.5 .9;+C 0 .46 .32;+P -.08 -.3 .3 .4 -.3 .42");
            Add("shatterer","+P -.6 -.9 .6 -.9 .95 -.3 0 .96 -.95 -.3;-L .12 -1 -.16 -.36 .17;-L -.16 -.36 .18 .1 .17;-L .18 .1 -.02 1 .17");
            Add("frosttrap","+P 0 -.98 .98 0 0 .98 -.98 0;-L -.5 0 .5 0 .2;-L -.25 -.43 .25 .43 .2;-L .25 -.43 -.25 .43 .2");
            Add("venom","+C 0 -.42 .44;+C -.42 .3 .44;+C .42 .3 .44;-C 0 .06 .18");
            Add("pulse","+P 0 -.98 .34 -.5 -.34 -.5;+P 0 .98 .34 .5 -.34 .5;+P -.98 0 -.5 .34 -.5 -.34;+P .98 0 .5 .34 .5 -.34;+C 0 0 .3");
            Add("slingshot","+L 0 .9 0 .2 .32;+L 0 .2 -.56 -.5 .3;+L 0 .2 .56 -.5 .3;+C 0 -.62 .24");
            Add("pinballer","+L -.82 .12 -.22 .72 .36;+L .82 .12 .22 .72 .36;+C 0 -.44 .32");
            Add("traitor","+P -.44 -.94 -.98 .14 .1 .14;+P .44 .94 -.1 -.14 .98 -.14");
        }

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
