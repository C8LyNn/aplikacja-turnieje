using System;
using System.Collections.Generic;
using System.Globalization;
using CoreClash.Data;

namespace CoreClash.Presentation
{
    // CC-001 W21: the first batch of real ball icons and short display names.
    // Keyed by the stable catalog id; ids, abilities, saves and the network protocol
    // never see this table. A ball without an entry keeps its letter mark and its
    // catalog name, so the batch can grow without touching anything else.
    //
    // One visual language (white mask, tinted by the caller, same shape list as Glyphs):
    //   a ball that applies a status wears that status' symbol (flame, snowflake, trefoil);
    //   a thin outer ring  = works in an area around the ball;
    //   an arrow / hook    = moves something (pull, pass on, relay);
    //   a shield outline   = protects;   a cross = heals.
    // Shapes use a -1..1 box, y down:  C x y r | R x y r w | L x1 y1 x2 y2 w | P x1 y1 x2 y2 ... (convex)
    // '+' adds a shape, '-' cuts it out of what is already there.
    public static class BallIcons
    {
        public const int BatchSize=24;
        const string Shield="+P -.72 -.8 .72 -.8 .72 .1 0 .92 -.72 .1";
        const string Trefoil="+C 0 -.28 .26;+C -.26 .17 .26;+C .26 .17 .26";

        struct Entry{public string Spec,Name;}
        static readonly Dictionary<string,Entry> Entries=new Dictionary<string,Entry>(StringComparer.Ordinal);
        static void Add(string id,string spec,string name=null)=>Entries.Add(id,new Entry{Spec=spec,Name=name});

        static BallIcons()
        {
            // Basics.
            Add("normal","+R 0 0 .68 .22;+C 0 0 .26");
            Add("fire","+C 0 .3 .55;+P -.12 -.98 .5 .16 -.52 .2;+P .42 -.52 .6 .34 .1 .3;-C -.02 .5 .2");
            Add("ice","+L -.85 0 .85 0 .26;+L -.43 -.74 .43 .74 .26;+L .43 -.74 -.43 .74 .26");
            Add("mine","+C 0 0 .5;+L -.92 0 .92 0 .2;+L 0 -.92 0 .92 .2;+L -.65 -.65 .65 .65 .2;+L .65 -.65 -.65 .65 .2;-C 0 0 .2");
            Add("bomb","+C -.1 .22 .6;+L .32 -.28 .58 -.62 .2;+C .7 -.8 .15");
            Add("medic","+L 0 -.72 0 .72 .44;+L -.72 0 .72 0 .44");
            // Status Reactor deck.
            Add("blightpool","+R 0 0 .86 .16;"+Trefoil,"Tox Pool");
            Add("plagueleech","+L -.8 -.7 .8 -.7 .24;+P -.72 -.6 -.12 -.6 -.42 .75;+P .12 -.6 .72 -.6 .42 .75");
            Add("vector","+C -.5 .1 .24;+C -.72 .5 .24;+C -.28 .5 .24;+L -.1 .1 .6 -.6 .18;+P .92 -.92 .92 -.3 .3 -.92","Carrier");
            Add("septiccore",Trefoil+";+L 0 -.95 0 -.72 .16;+L 0 .95 0 .72 .16;+L -.9 .55 -.7 .43 .16;+L .9 .55 .7 .43 .16;+L -.84 -.5 -.64 -.38 .16;+L .84 -.5 .64 -.38 .16","Tox Burst");
            Add("consecrator","+R 0 0 .86 .14;+P 0 -.6 .14 0 0 .6 -.14 0;+P -.6 0 0 -.14 .6 0 0 .14","Sanctum");
            Add("absolver",Shield+";-P 0 -.52 .13 -.05 0 .42 -.13 -.05;-P -.44 -.05 0 -.18 .44 -.05 0 .08");
            Add("penitent","+R -.15 .2 .5 .18;+L .85 -.8 .34 -.29 .18;+P .1 -.05 .54 -.12 .17 -.49","Scapegoat");
            Add("ward","+R 0 0 .9 .12;+P -.45 -.5 .45 -.5 .45 .05 0 .58 -.45 .05");
            Add("halo","+R 0 -.5 .4 .16;+C 0 .42 .36");
            // Gravity Trap deck.
            Add("web","+R 0 0 .8 .14;+R 0 0 .42 .14;+L -.9 0 .9 0 .12;+L 0 -.9 0 .9 .12;+L -.64 -.64 .64 .64 .12;+L .64 -.64 -.64 .64 .12");
            Add("briarheart","+P 0 -.95 .34 .1 -.34 .1;+L 0 .1 -.6 .8 .2;+L 0 .1 .6 .8 .2;+L 0 .1 0 .88 .2","Thorn");
            Add("vinehook","+R -.12 .3 .4 .2;-P -1.2 -1.2 1.2 -1.2 1.2 .3 -1.2 .3;+L .28 -.9 .28 .3 .2;+P -.52 -.22 -.84 .34 -.2 .34");
            Add("gravitymine","+R 0 0 .9 .12;+C 0 0 .32;+L -.6 0 .6 0 .16;+L 0 -.6 0 .6 .16;+L -.42 -.42 .42 .42 .16;+L .42 -.42 -.42 .42 .16");
            Add("singularity","+C 0 0 .45;+L -.9 -.25 -.3 -.75 .16;+L -.3 -.75 .35 -.8 .16;+L .9 .25 .3 .75 .16;+L .3 .75 -.35 .8 .16");
            Add("horizonrelay","+R 0 .34 .52 .16;+L 0 .34 0 -.5 .18;+P 0 -.98 .36 -.45 -.36 -.45");
            Add("gatekeeper","+R -.42 0 .42 .16;+R .42 0 .42 .16","Portal");
            Add("harpoon","+L -.8 .8 .5 -.5 .16;+P .95 -.95 .2 -.7 .7 -.2;+R -.74 .74 .2 .12");
            Add("vortexmedic","+R 0 0 .9 .13;+L 0 -.42 0 .42 .3;+L -.42 0 .42 0 .3");
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
