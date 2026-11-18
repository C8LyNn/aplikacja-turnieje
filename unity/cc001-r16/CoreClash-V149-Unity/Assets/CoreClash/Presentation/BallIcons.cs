using System;
using System.Collections.Generic;
using System.Globalization;
using CoreClash.Data;

namespace CoreClash.Presentation
{
    // CC-001 W21: real ball icons and short display names for Standard, five basics and the
    // four featured decks (42 balls). The other 185 balls are deliberately left alone.
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
        public const int BatchSize=42;
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
            Add("normal","+R 0 0 .68 .22;+C 0 0 .26");
            Add("fire",Flame);
            Add("ice","+L -.85 0 .85 0 .26;+L -.43 -.74 .43 .74 .26;+L .43 -.74 -.43 .74 .26");
            Add("mine","+C 0 0 .5;+L -.92 0 .92 0 .2;+L 0 -.92 0 .92 .2;+L -.65 -.65 .65 .65 .2;+L .65 -.65 -.65 .65 .2;-C 0 0 .2");
            Add("bomb","+C -.1 .22 .6;+L .32 -.28 .58 -.62 .2;+C .7 -.8 .15");
            Add("medic","+L 0 -.72 0 .72 .44;+L -.72 0 .72 0 .44");
            // Status Reactor deck.
            Add("blightpool","+R 0 0 .86 .16;"+Trefoil,"Tox Pool");
            Add("plagueleech","+L -.8 -.7 .8 -.7 .24;+P -.72 -.6 -.12 -.6 -.42 .75;+P .12 -.6 .72 -.6 .42 .75");
            Add("vector","+C -.5 .1 .24;+C -.72 .5 .24;+C -.28 .5 .24;+L -.1 .1 .6 -.6 .18;+P .92 -.92 .92 -.3 .3 -.92","Deathspore");
            Add("septiccore",Trefoil+";+L 0 -.95 0 -.72 .16;+L 0 .95 0 .72 .16;+L -.9 .55 -.7 .43 .16;+L .9 .55 .7 .43 .16;+L -.84 -.5 -.64 -.38 .16;+L .84 -.5 .64 -.38 .16","Tox Burst");
            Add("consecrator","+R 0 0 .88 .12;+P 0 -.62 .22 0 0 .62 -.22 0;+P -.62 0 0 -.22 .62 0 0 .22","Sanctum");
            Add("absolver",Shield+";-P 0 -.52 .13 -.05 0 .42 -.13 -.05;-P -.44 -.05 0 -.18 .44 -.05 0 .08");
            Add("penitent","+R -.15 .2 .5 .18;+L .85 -.8 .34 -.29 .18;+P .1 -.05 .54 -.12 .17 -.49","Scapegoat");
            Add("ward","+R 0 0 .9 .12;+P -.45 -.5 .45 -.5 .45 .05 0 .58 -.45 .05");
            Add("halo","+R 0 -.5 .4 .16;+C 0 .42 .36");
            // Gravity Trap deck.
            Add("web","+R 0 0 .8 .14;+R 0 0 .42 .14;+L -.9 0 .9 0 .12;+L 0 -.9 0 .9 .12;+L -.64 -.64 .64 .64 .12;+L .64 -.64 -.64 .64 .12");
            Add("briarheart","+P 0 -.95 .34 .1 -.34 .1;+L 0 .1 -.6 .8 .2;+L 0 .1 .6 .8 .2;+L 0 .1 0 .88 .2","Rootstrike");
            Add("vinehook","+R -.12 .3 .4 .2;-P -1.2 -1.2 1.2 -1.2 1.2 .3 -1.2 .3;+L .28 -.9 .28 .3 .2;+P -.52 -.22 -.84 .34 -.2 .34");
            Add("gravitymine","+R 0 0 .9 .12;+C 0 0 .32;+L -.6 0 .6 0 .16;+L 0 -.6 0 .6 .16;+L -.42 -.42 .42 .42 .16;+L .42 -.42 -.42 .42 .16");
            Add("singularity","+C 0 0 .45;+L -.9 -.25 -.3 -.75 .16;+L -.3 -.75 .35 -.8 .16;+L .9 .25 .3 .75 .16;+L .3 .75 -.35 .8 .16");
            Add("horizonrelay","+R 0 .34 .52 .16;+L 0 .34 0 -.5 .18;+P 0 -.98 .36 -.45 -.36 -.45");
            Add("gatekeeper","+R -.46 -.42 .38 .16;+R .46 .42 .38 .16;+L -.14 -.12 .14 .12 .14","Portal");
            Add("harpoon","+L -.8 .8 .5 -.5 .16;+P .95 -.95 .2 -.7 .7 -.2;+R -.74 .74 .2 .12");
            Add("vortexmedic","+R 0 0 .88 .16;-P 0 0 1.25 -.55 1.25 .55;-P 0 0 -1.25 .55 -1.25 -.55;+L 0 -.42 0 .42 .3;+L -.42 0 .42 0 .3");
            // Death Engine deck. Skull = the ball works through DEATH effects.
            Add("agony","+P -.98 -.5 -.98 .5 -.4 0;+C .32 -.12 .5;+P .04 .25 .6 .25 .6 .72 .04 .72;-C .1 -.14 .14;-C .54 -.14 .14","Deathcast");
            Add("requiem","+R 0 0 .92 .1;+C 0 -.12 .5;+P -.28 .22 .28 .22 .28 .62 -.28 .62;-C -.2 -.14 .15;-C .2 -.14 .15");
            Add("bonfire","+C 0 .05 .45;+P -.1 -.98 .42 -.05 -.42 -.02;-C -.02 .2 .16;+L -.7 .92 .7 .6 .18;+L -.7 .6 .7 .92 .18");
            Add("wildfire","+R 0 0 .9 .12;+C 0 .2 .36;+P -.08 -.64 .33 .1 -.34 .13;-C -.01 .33 .13");
            Add("soulburst","+P 0 -.96 .2 0 0 .96 -.2 0;+P -.96 0 0 -.2 .96 0 0 .2;+P -.5 -.5 .12 -.12 .5 .5 -.12 .12;+P .5 -.5 .12 .12 -.5 .5 -.12 -.12");
            Add("reclaimer","+C 0 -.3 .56;+P -.56 -.3 .56 -.3 .56 .86 -.56 .86;-L 0 -.48 0 .28 .18;-L -.28 -.18 .28 -.18 .18","Reviver");
            Add("gravehide","+P -.82 .1 .82 .1 .82 .68 -.82 .68;+P -.82 .12 -.82 -.55 -.3 .12;+P -.42 .12 0 -.8 .42 .12;+P .3 .12 .82 -.55 .82 .12");
            Add("packheart",Heart+";-P -.26 -.32 .26 -.32 .26 .04 0 .36 -.26 .04");
            Add("cascade","+C -.48 -.42 .44;+C .2 .12 .3;+C .66 .62 .19");
            // Reality Hackers deck. Paired shapes = identity or side changes.
            Add("mimic","+C -.4 0 .52;+C .4 0 .52;-C -.4 -.04 .2;-C .4 -.04 .2;-P -.3 .6 .3 .6 0 .14");
            Add("doppelganger","+R -.3 -.14 .5 .16;+C .32 .16 .5","Copycat");
            Add("wildcard","+P -.72 -.72 .72 -.72 .72 .72 -.72 .72;-C -.36 -.36 .16;-C 0 0 .16;-C .36 .36 .16");
            Add("collector","+L -.6 -.52 .6 -.52 .24;+L -.6 0 .6 0 .24;+L -.6 .52 .6 .52 .24");
            Add("echo","+R -.55 0 .65 .16;+R -.55 0 1.15 .16;-P -1.25 -1.25 -.3 -1.25 -.3 1.25 -1.25 1.25;+C -.55 0 .24");
            Add("timeshift","+L -.6 -.36 .45 -.36 .18;+P .92 -.36 .4 -.72 .4 0;+L .6 .36 -.45 .36 .18;+P -.92 .36 -.4 0 -.4 .72","Swap");
            Add("chronomancer","+R 0 0 .8 .16;+L 0 0 0 -.5 .16;+L 0 0 .36 .2 .16","Rewind");
            Add("paradox","+R 0 .05 .66 .18;-P 0 .05 1.2 -1.15 1.2 .05;+P .66 -.5 .3 -.02 1.02 -.02","Snapback");
            Add("traitor","+P -.46 -.82 -.92 .2 0 .2;+P .46 .82 0 -.2 .92 -.2");
        }

        public static IEnumerable<string> Ids=>Entries.Keys;
        public static bool Has(string id)=>id!=null&&Entries.ContainsKey(id);
        // Shape list for the ball's icon, or null when the ball has no icon yet.
        public static string Spec(string id)=>id!=null&&Entries.TryGetValue(id,out var entry)?entry.Spec:null;
        // Name shown to the player. Falls back to the catalog name.
        public static string Name(BallDefinition definition)
            =>definition==null?"":Entries.TryGetValue(definition.id??"",out var entry)&&entry.Name!=null?entry.Name:definition.name;

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
