using System.Collections.Generic;
using System.Globalization;
using UnityEngine;
namespace CoreClash.Presentation
{
    // CC-001 W20: one simple symbol per ball state, generated once from a tiny shape
    // list (no art assets, same look at every size). A glyph is a white alpha mask;
    // the caller tints it. Shapes use a -1..1 box, y down:
    //   C x y r            disc              R x y r w          ring
    //   L x1 y1 x2 y2 w    rounded line      P x1 y1 x2 y2 ...  convex polygon
    // '+' adds a shape, '-' cuts it out.
    public static class Glyphs
    {
        const int Size=48;
        static readonly Dictionary<StatusKind,Texture2D> Cache=new Dictionary<StatusKind,Texture2D>();
        const string ShieldShape="+P -.72 -.8 .72 -.8 .72 .1 0 .92 -.72 .1";

        static string Spec(StatusKind kind)
        {
            switch(kind)
            {
                case StatusKind.Fire:return "+C 0 .3 .55;+P -.12 -.98 .5 .16 -.52 .2;+P .42 -.52 .6 .34 .1 .3;-C -.02 .5 .2";
                case StatusKind.Ice:return "+L -.85 0 .85 0 .26;+L -.43 -.74 .43 .74 .26;+L .43 -.74 -.43 .74 .26";
                case StatusKind.Toxin:return "+C 0 -.42 .42;+C -.4 .3 .42;+C .4 .3 .42;-C 0 .05 .17";
                case StatusKind.Frozen:return "+C 0 0 .96;-L -.6 0 .6 0 .2;-L -.3 -.52 .3 .52 .2;-L .3 -.52 -.3 .52 .2";
                case StatusKind.Rooted:return "+L -.55 -.78 .55 -.78 .26;+L 0 -.78 0 .3 .26;+L 0 .2 -.62 .8 .24;+L 0 .2 .62 .8 .24;+L 0 .2 0 .88 .22";
                case StatusKind.Shield:return ShieldShape;
                case StatusKind.Divine:return ShieldShape+";-L 0 -.5 0 .45 .2;-L -.38 -.15 .38 -.15 .2";
                case StatusKind.Frostguard:return ShieldShape+";-L -.4 -.1 .4 -.1 .16;-L -.2 -.45 .2 .25 .16;-L .2 -.45 -.2 .25 .16";
                case StatusKind.Armed:return "+C 0 0 .5;+L -.92 0 .92 0 .2;+L 0 -.92 0 .92 .2;+L -.65 -.65 .65 .65 .2;+L .65 -.65 -.65 .65 .2;-C 0 0 .2";
                case StatusKind.Fuse:return "+R 0 .14 .64 .24;+L 0 .14 0 -.28 .2;+L 0 .14 .3 .14 .2;+L 0 -.98 0 -.7 .34";
                case StatusKind.Jammed:return "+R 0 0 .76 .24;+L -.5 -.5 .5 .5 .24";
                case StatusKind.Sticky:return "+C 0 -.25 .62;+C -.45 .5 .3;+C .38 .62 .24;+L -.45 .1 -.45 .5 .5;+L .38 .1 .38 .6 .4";
                case StatusKind.Phased:return "+R 0 0 .72 .26;-L -1 0 1 0 .34;-L 0 -1 0 1 .34";
                case StatusKind.Token:return "+P 0 -.92 .66 0 0 .92 -.66 0;-P 0 -.48 .34 0 0 .48 -.34 0";
                case StatusKind.Ancestral:return "+P -.82 .1 .82 .1 .82 .68 -.82 .68;+P -.82 .12 -.82 -.55 -.3 .12;+P -.42 .12 0 -.8 .42 .12;+P .3 .12 .82 -.55 .82 .12";
                case StatusKind.Veteran:return "+L -.62 -.1 0 -.62 .28;+L 0 -.62 .62 -.1 .28;+L -.62 .56 0 .04 .28;+L 0 .04 .62 .56 .28";
                case StatusKind.Split:return "+C -.42 0 .44;+C .42 0 .44";
                default:return "+R 0 0 .72 .24;+C 0 0 .24";
            }
        }

        public static void Paint(Rect rect,StatusKind kind,Color color)
        {
            if(!Cache.TryGetValue(kind,out var texture)||texture==null){texture=Build(Spec(kind));Cache[kind]=texture;}
            var old=GUI.color;GUI.color=color;GUI.DrawTexture(rect,texture);GUI.color=old;
        }

        static Texture2D Build(string spec)
        {
            var distance=new float[Size*Size];
            for(int i=0;i<distance.Length;i++)distance[i]=9f;
            foreach(string part in spec.Split(';'))
            {
                string[] token=part.Split(' ');
                bool add=token[0][0]=='+';char shape=token[0][1];
                var a=new float[token.Length-1];
                for(int i=1;i<token.Length;i++)a[i-1]=float.Parse(token[i],NumberStyles.Float,CultureInfo.InvariantCulture);
                for(int py=0;py<Size;py++)
                for(int px=0;px<Size;px++)
                {
                    float x=(px+.5f)/Size*2-1,y=(py+.5f)/Size*2-1;
                    float d=Shape(shape,a,x,y);
                    int index=py*Size+px;
                    distance[index]=add?Mathf.Min(distance[index],d):Mathf.Max(distance[index],-d);
                }
            }
            var texture=new Texture2D(Size,Size,TextureFormat.RGBA32,false){name="Core Clash state glyph",filterMode=FilterMode.Bilinear,wrapMode=TextureWrapMode.Clamp,hideFlags=HideFlags.HideAndDontSave};
            var pixels=new Color[Size*Size];
            // Texture rows start at the bottom; the shape list is written y-down.
            for(int py=0;py<Size;py++)
            for(int px=0;px<Size;px++)
                pixels[(Size-1-py)*Size+px]=new Color(1,1,1,Mathf.Clamp01(.5f-distance[py*Size+px]*Size*.5f));
            texture.SetPixels(pixels);texture.Apply(false,true);
            return texture;
        }

        static float Shape(char shape,float[] a,float x,float y)
        {
            switch(shape)
            {
                case 'C':return Mathf.Sqrt((x-a[0])*(x-a[0])+(y-a[1])*(y-a[1]))-a[2];
                case 'R':return Mathf.Abs(Mathf.Sqrt((x-a[0])*(x-a[0])+(y-a[1])*(y-a[1]))-a[2])-a[3]*.5f;
                case 'L':
                {
                    float dx=a[2]-a[0],dy=a[3]-a[1],length=dx*dx+dy*dy;
                    float t=length<=0?0:Mathf.Clamp01(((x-a[0])*dx+(y-a[1])*dy)/length);
                    float qx=x-(a[0]+t*dx),qy=y-(a[1]+t*dy);
                    return Mathf.Sqrt(qx*qx+qy*qy)-a[4]*.5f;
                }
                case 'P':
                {
                    int n=a.Length/2;float area=0;
                    for(int i=0;i<n;i++){int j=(i+1)%n;area+=a[2*i]*a[2*j+1]-a[2*j]*a[2*i+1];}
                    float sign=area>0?1:-1,d=-9f;
                    for(int i=0;i<n;i++)
                    {
                        int j=(i+1)%n;float ex=a[2*j]-a[2*i],ey=a[2*j+1]-a[2*i+1],edge=Mathf.Sqrt(ex*ex+ey*ey);
                        if(edge<=0)continue;
                        d=Mathf.Max(d,sign*((x-a[2*i])*ey-(y-a[2*i+1])*ex)/edge);
                    }
                    return d;
                }
                default:return 9f;
            }
        }
    }
}
