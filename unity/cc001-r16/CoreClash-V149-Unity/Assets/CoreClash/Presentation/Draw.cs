using UnityEngine;
using System.Collections.Generic;
namespace CoreClash.Presentation
{
    public static class Draw
    {
        static int scrollDragId;
        static Vector2 scrollStart,scrollLast;
        static bool scrolling;
        static Texture2D disc;
        static readonly Dictionary<int,GUIStyle> labels=new Dictionary<int,GUIStyle>();
        // W20: every colour comes from Theme (one place to retune the look).
        public static Color Cyan=Theme.P1,Pink=Theme.P2,Muted=Theme.Muted,Gold=Theme.SelectInk;
        public static Color Background=Theme.Background,Panel=Theme.Panel,PanelLight=Theme.PanelLight,Edge=Theme.Edge;
        public static Color Owner(int owner)=>Theme.Team(owner);
        public static Color Hex(string text){return ColorUtility.TryParseHtmlString(text,out var c)?c:Color.white;}
        // A flat rectangle: its edges land on whole screen pixels, and a hairline never falls
        // between two pixels and vanishes.
        public static void Rect(Rect r,Color c)
        {
            if(r.width<=0||r.height<=0)return;
            float s=UiViewport.Scale,x0=Mathf.Floor(r.x*s+.5f),y0=Mathf.Floor(r.y*s+.5f),x1=Mathf.Floor(r.xMax*s+.5f),y1=Mathf.Floor(r.yMax*s+.5f);
            if(x1<=x0)x1=x0+1;if(y1<=y0)y1=y0+1;
            var old=GUI.color;GUI.color=c;GUI.DrawTexture(new Rect(x0,y0,x1-x0,y1-y0),Texture2D.whiteTexture);GUI.color=old;
        }
        // W24 (owner direction: clean edges): the interface is laid out in logical units, and every
        // shape and every line of text is drawn straight in the pixels of the screen. It used to be
        // drawn at its logical size and stretched by GUI.matrix, which on a scaled display (4K at
        // 150%, a phone) blurred all text and every rounded edge. These few calls are the only place
        // that turns logical units into pixels; nothing else may call GUI with a rectangle.
        public static Rect Px(Rect r){float s=UiViewport.Scale;return s==1?r:new Rect(r.x*s,r.y*s,r.width*s,r.height*s);}
        // A length snapped to whole screen pixels (for bars and gaps that must come out equal).
        public static float Snap(float length){float s=UiViewport.Scale;return Mathf.Floor(length*s+.5f)/s;}
        // W24 (owner direction: layers must fit): the width of an outline or a border, as a whole
        // number of screen pixels and never less than one. A band 1.5 px wide came out one pixel
        // wide on one side of a card and two on the other.
        public static float Line(float thickness){float s=UiViewport.Scale;return Mathf.Max(1,Mathf.Floor(thickness*s+.5f))/s;}
        // The same rectangle with every edge on a whole screen pixel.
        public static Rect SnapRect(Rect r){float s=UiViewport.Scale,x0=Mathf.Floor(r.x*s+.5f),y0=Mathf.Floor(r.y*s+.5f),x1=Mathf.Floor(r.xMax*s+.5f),y1=Mathf.Floor(r.yMax*s+.5f);return new Rect(x0/s,y0/s,Mathf.Max(0,x1-x0)/s,Mathf.Max(0,y1-y0)/s);}
        public static Rect Grow(Rect r,float amount)=>new Rect(r.x-amount,r.y-amount,Mathf.Max(0,r.width+amount*2),Mathf.Max(0,r.height+amount*2));
        // The same rectangle moved onto whole screen pixels (a plate that carries text: text is always
        // set on whole pixels, so the plate has to be too, or the text sits off-centre in it).
        public static Rect SnapOrigin(Rect r){r.x=Snap(r.x);r.y=Snap(r.y);return r;}
        public static float SnapDown(float length){float s=UiViewport.Scale;return Mathf.Floor(length*s+.001f)/s;}
        // One screen pixel, in logical units.
        public static float Pixel=>1/UiViewport.Scale;
        public static Vector2 Mouse{get{float s=UiViewport.Scale;var p=Event.current.mousePosition;return s==1?p:p/s;}}
        public static void Tex(Rect r,Texture texture){GUI.DrawTexture(Px(r),texture);}
        public static void Tex(Rect r,Texture texture,Rect coords){GUI.DrawTextureWithTexCoords(Px(r),texture,coords);}
        // A group starts on a whole pixel, so whatever is snapped inside it is snapped on the screen.
        public static void BeginGroup(Rect r){var p=Px(r);GUI.BeginGroup(new Rect(Mathf.Floor(p.x+.5f),Mathf.Floor(p.y+.5f),p.width,p.height));}
        public static void EndGroup(){GUI.EndGroup();}
        // An invisible button: true when the rectangle is clicked.
        public static bool Hit(Rect r)=>GUI.Button(Px(r),GUIContent.none,GUIStyle.none);
        public static string TextField(Rect r,string text,int maxLength=-1,GUIStyle style=null)
        {
            style=style??GUI.skin.textField;float s=UiViewport.Scale;
            if(s==1)return maxLength>=0?GUI.TextField(r,text,maxLength,style):GUI.TextField(r,text,style);
            int size=style.fontSize;var padding=style.padding;
            style.fontSize=FontPx(size);style.padding=new RectOffset(Mathf.RoundToInt(padding.left*s),Mathf.RoundToInt(padding.right*s),Mathf.RoundToInt(padding.top*s),Mathf.RoundToInt(padding.bottom*s));
            try{return maxLength>=0?GUI.TextField(Px(r),text,maxLength,style):GUI.TextField(Px(r),text,style);}
            finally{style.fontSize=size;style.padding=padding;}
        }
        // A type size in screen pixels. Rounded down unless it is almost the next size, so a line
        // never grows wider than the box it was measured for.
        static int FontPx(int size)=>Mathf.Max(1,Mathf.FloorToInt(size*UiViewport.Scale+.25f));
        // W24 (owner direction: clean edges): a rounded rectangle whose edge is computed for the
        // pixels it is drawn on (the engine's own rounded-rectangle shader), so a disc, a ring or a
        // card corner is exact at any size instead of being a small sprite stretched over it.
        // border = 0 fills the shape; otherwise only a band that wide along the edge is drawn.
        static void Exact(Rect r,Color color,float radius,float border=0)
        {
            if(Event.current.type!=EventType.Repaint||color.a<=0||r.width<=0||r.height<=0)return;
            var old=GUI.color;GUI.color=Color.white;float s=UiViewport.Scale;
            GUI.DrawTexture(Px(r),Texture2D.whiteTexture,ScaleMode.StretchToFill,true,0,color,border*s,Mathf.Min(radius,Mathf.Min(r.width,r.height)*.5f)*s);
            GUI.color=old;
        }
        // A plate with a different radius at each corner (0 = square): a part that has to fill one
        // corner or one side of a rounded card exactly. Its edges sit on whole pixels.
        public static void Corners(Rect r,Color color,float topLeft,float topRight,float bottomRight,float bottomLeft)
        {
            if(Event.current.type!=EventType.Repaint||color.a<=0)return;
            r=SnapRect(r);if(r.width<=0||r.height<=0)return;
            float s=UiViewport.Scale,most=Mathf.Min(r.width,r.height);
            var old=GUI.color;GUI.color=Color.white;
            GUI.DrawTexture(Px(r),Texture2D.whiteTexture,ScaleMode.StretchToFill,true,0,color,Vector4.zero,new Vector4(Mathf.Clamp(topLeft,0,most)*s,Mathf.Clamp(topRight,0,most)*s,Mathf.Clamp(bottomRight,0,most)*s,Mathf.Clamp(bottomLeft,0,most)*s));
            GUI.color=old;
        }
        // Inset by a whole number of screen pixels, so a plate inside a plate has the same margin on every side.
        public static Rect Inset(Rect r,float amount)
        {
            if(amount!=0){float whole=Line(Mathf.Abs(amount));amount=amount<0?-whole:whole;}
            return new Rect(r.x+amount,r.y+amount,Mathf.Max(0,r.width-amount*2),Mathf.Max(0,r.height-amount*2));
        }
        // The corner of every card and button.
        public const float Corner=11.5f;
        // A rounded plate. Its edges sit on whole screen pixels.
        public static void Round(Rect r,Color color,float radius=Corner)
        {
            if(r.width<10||r.height<10){Rect(r,color);return;}
            if(r.width<24||r.height<24)radius=Mathf.Min(radius,4.5f);
            Exact(SnapRect(r),color,Mathf.Max(1,radius));
        }
        public static void Surface(Rect r,Color fill,Color? border=null)
        {
            r=SnapRect(r);float band=Line(border.HasValue?2:1);
            Round(r,border??Edge);Round(Grow(r,-band),fill,Corner-band);
        }
        // W24 (owner direction: layers must fit): a raised plate - the one construction behind every
        // card and button. The ink outline, the lip showing under the face, the face's border and its
        // fill are all cut from one rectangle that sits on whole pixels, so each band is the same
        // width on every side, and the corners of all the layers share their centres (an inner
        // corner is rounder by exactly the width of the band round it). Before, each view stacked
        // its own rounded rectangles with the same corner and fractional offsets, and the bands came
        // out uneven: thicker in the corners, a pixel wider on one side than the other.
        // `r` is the face with its lip; the ink outline lies outside it.
        public static void Plate(Rect r,Color fill,Color border,Color lipColor,float lip=3,float band=2,float ink=0,float radius=Corner)
        {
            if(Event.current.type!=EventType.Repaint)return;
            r=SnapRect(r);
            float outline=ink>0?Line(ink):0,under=lip>0?Line(lip):0,edge=band>0?Line(band):0;
            if(outline>0)Round(Grow(r,outline),Theme.Ink,radius+outline);
            if(under>0)Round(new Rect(r.x,r.y+under,r.width,r.height-under),lipColor,radius);
            var top=new Rect(r.x,r.y,r.width,r.height-under);
            Round(top,edge>0?border:fill,radius);
            if(edge>0)Round(Grow(top,-edge),fill,radius-edge);
        }
        // The fill of that plate and its corner: for whatever is laid exactly over it.
        public static Rect PlateFill(Rect r,float lip=3,float band=2){r=SnapRect(r);float under=lip>0?Line(lip):0,edge=band>0?Line(band):0;return Grow(new Rect(r.x,r.y,r.width,r.height-under),-edge);}
        public static float PlateCorner(float band=2,float radius=Corner)=>radius-(band>0?Line(band):0);
        // W24: the shadow under a card or a button.
        public static void Shadow(Rect r,float alpha=.2f,float spread=10,float drop=4)
        {
            if(Event.current.type!=EventType.Repaint||alpha<=0)return;
            // W24 cartoon look: a flat ink shadow, shifted down-right, instead of a blur.
            float shift=Mathf.Min(Theme.HardShadow,drop+1);r=SnapRect(r);
            Round(new Rect(r.x+Line(shift*.6f),r.y+Line(shift),r.width,r.height),new Color(Theme.Ink.r,Theme.Ink.g,Theme.Ink.b,Mathf.Clamp01(alpha*2.2f+.12f)));
        }
        // W24: the console the match controls lie on - the same dark rail as the phone tray, with an
        // ink outline and a light line along its top edge. Light cards and buttons stand out on it.
        public static void Rail(Rect r)
        {
            r=SnapRect(r);Shadow(r,.28f);
            float ink=Line(Theme.InkLine),corner=Corner-ink;
            Round(r,Theme.Ink);
            var face=Grow(r,-ink);
            Round(face,Theme.RailBottom,corner);
            Round(new Rect(face.x,face.y,face.width,Mathf.Min(face.height,40)),Theme.RailTop,corner);
            if(face.height>48)VGradient(new Rect(face.x,face.y+16,face.width,face.height-32),Theme.RailTop,Theme.RailBottom);
            Rect(new Rect(face.x+12,face.y+Line(3),face.width-24,Line(1.5f)),new Color(1,1,1,.22f));
        }
        // W24: a white card with a soft shadow. `r` is the outside of its ink outline.
        public static void Card(Rect r,Color? fill=null,Color? border=null,float shadowAlpha=.18f)
        {
            r=SnapRect(r);Shadow(r,shadowAlpha);
            Round(r,Theme.Ink);
            var face=CardFace(r);float corner=CardCorner;
            if(border.HasValue){float band=Line(2);Round(face,border.Value,corner);Round(Grow(face,-band),fill??Panel,corner-band);}else Round(face,fill??Panel,corner);
        }
        // The face of that card inside its outline, and the corner of the face.
        public static Rect CardFace(Rect r)=>Grow(SnapRect(r),-Line(Theme.InkLine));
        public static float CardCorner=>Corner-Line(Theme.InkLine);
        // W24: soft round glow / contact shadow (smooth falloff).
        static Texture2D glow;
        // The same soft falloff stretched into an ellipse (a shadow lying on the floor).
        public static void Glow(Rect area,Color color)
        {
            if(area.width<=0||area.height<=0||color.a<=0)return;
            if(glow==null)Glow(new Vector2(-9999,-9999),1,new Color(0,0,0,.001f));
            var old=GUI.color;GUI.color=color;Tex(area,glow);GUI.color=old;
        }
        public static void Glow(Vector2 center,float radius,Color color)
        {
            if(radius<=0||color.a<=0)return;
            if(glow==null){const int n=64;glow=new Texture2D(n,n,TextureFormat.RGBA32,false){filterMode=FilterMode.Bilinear,wrapMode=TextureWrapMode.Clamp,hideFlags=HideFlags.HideAndDontSave};for(int y=0;y<n;y++)for(int x=0;x<n;x++){float d=Vector2.Distance(new Vector2(x+.5f,y+.5f),new Vector2(n*.5f,n*.5f))/(n*.5f);float a=Mathf.Clamp01(1-d);glow.SetPixel(x,y,new Color(1,1,1,a*a*(3-2*a)));}glow.Apply();}
            var old=GUI.color;GUI.color=color;Tex(new Rect(center.x-radius,center.y-radius,radius*2,radius*2),glow);GUI.color=old;
        }
        // W24: full-screen backdrop, blue to violet. A light behind the top of the screen with a fan
        // of faint rays (a still picture, nothing moves), and darker corners, so whatever lies on it
        // stands out.
        static Texture2D rays;
        public static void Backdrop(Rect r)
        {
            VGradient(r,Theme.BackdropTop,Theme.BackdropBottom);
            if(Event.current.type!=EventType.Repaint)return;
            float unit=Mathf.Max(r.width,r.height);
            if(rays==null)
            {
                const int n=256;rays=new Texture2D(n,n,TextureFormat.RGBA32,true){name="Core Clash backdrop rays",filterMode=FilterMode.Trilinear,wrapMode=TextureWrapMode.Clamp,hideFlags=HideFlags.HideAndDontSave};
                var pixels=new Color[n*n];
                for(int y=0;y<n;y++)
                for(int x=0;x<n;x++)
                {
                    float dx=(x+.5f-n*.5f)/(n*.5f),dy=(y+.5f-n*.5f)/(n*.5f),distance=Mathf.Sqrt(dx*dx+dy*dy);
                    if(distance>=1)continue;
                    // Fourteen rays; the edge of a ray stays about one texel soft at any distance.
                    float turn=(Mathf.Atan2(dy,dx)/(2*Mathf.PI)+1)*14;turn-=Mathf.Floor(turn);
                    float ray=Mathf.Clamp01((.25f-Mathf.Abs(turn-.5f))*distance*n*.5f*2*Mathf.PI/14+.5f);
                    pixels[y*n+x]=new Color(1,1,1,ray*Mathf.Pow(1-distance,1.3f)*Mathf.Clamp01(distance*6));
                }
                rays.SetPixels(pixels);rays.Apply(true,true);
            }
            var light=new Vector2(r.x+r.width*.5f,r.y+r.height*.12f);
            var old=GUI.color;GUI.color=new Color(1,1,1,.085f);Tex(new Rect(light.x-unit*.95f,light.y-unit*.95f,unit*1.9f,unit*1.9f),rays);GUI.color=old;
            Glow(light,unit*.62f,new Color(1,1,1,.2f));
            Glow(new Vector2(r.x+r.width*.95f,r.y+r.height*.85f),unit*.5f,new Color(1,.5f,.85f,.14f));
            var corner=new Color(.06f,.03f,.26f,.34f);
            EdgeShade(new Rect(r.x,r.y,r.width*.22f,r.height),corner,0);EdgeShade(new Rect(r.xMax-r.width*.22f,r.y,r.width*.22f,r.height),corner,1);
            EdgeShade(new Rect(r.x,r.yMax-r.height*.2f,r.width,r.height*.2f),corner,3);
        }
        // W24: a soft shade that is strongest along one edge of the rectangle and fades out across
        // it (0 left, 1 right, 2 top, 3 bottom): the shadow a wall throws on the floor.
        static Texture2D fadeAcross,fadeDown;
        public static void EdgeShade(Rect r,Color color,int side)
        {
            if(Event.current.type!=EventType.Repaint||r.width<=0||r.height<=0)return;
            if(fadeAcross==null)
            {
                const int n=32;
                fadeAcross=new Texture2D(n,1,TextureFormat.RGBA32,false){name="Core Clash fade across",filterMode=FilterMode.Bilinear,wrapMode=TextureWrapMode.Clamp,hideFlags=HideFlags.HideAndDontSave};
                fadeDown=new Texture2D(1,n,TextureFormat.RGBA32,false){name="Core Clash fade down",filterMode=FilterMode.Bilinear,wrapMode=TextureWrapMode.Clamp,hideFlags=HideFlags.HideAndDontSave};
                for(int i=0;i<n;i++){float alpha=Mathf.Pow(1-i/(n-1f),1.7f);fadeAcross.SetPixel(i,0,new Color(1,1,1,alpha));fadeDown.SetPixel(0,i,new Color(1,1,1,alpha));}
                fadeAcross.Apply();fadeDown.Apply();
            }
            var old=GUI.color;GUI.color=color;
            // fadeAcross is strongest on its left; fadeDown on its first row, which is drawn at the bottom.
            if(side==0)Tex(r,fadeAcross,new Rect(0,0,1,1));
            else if(side==1)Tex(r,fadeAcross,new Rect(1,0,-1,1));
            else if(side==3)Tex(r,fadeDown,new Rect(0,0,1,1));
            else Tex(r,fadeDown,new Rect(0,1,1,-1));
            GUI.color=old;
        }
        // W20: small rounded plate for HP, status chips and board labels.
        public static void Chip(Rect r,Color color)=>Round(r,color,4.5f);
        public static void Chip(Rect r,Color fill,Color border){r=SnapRect(r);float band=Line(1);Chip(r,border);Round(Grow(r,-band),fill,Mathf.Max(1,4.5f-band));}
        // W20: vertical two-colour gradient (one stretched 1x2 texture per colour pair).
        static readonly Dictionary<long,Texture2D> gradients=new Dictionary<long,Texture2D>();
        public static void VGradient(Rect r,Color top,Color bottom)
        {
            Color32 a=top,b=bottom;
            long key=((long)a.r<<56)|((long)a.g<<48)|((long)a.b<<40)|((long)a.a<<32)|((long)b.r<<24)|((long)b.g<<16)|((long)b.b<<8)|(long)b.a;
            if(!gradients.TryGetValue(key,out var texture)||texture==null){texture=new Texture2D(1,2,TextureFormat.RGBA32,false){filterMode=FilterMode.Bilinear,wrapMode=TextureWrapMode.Clamp,hideFlags=HideFlags.HideAndDontSave};texture.SetPixel(0,0,bottom);texture.SetPixel(0,1,top);texture.Apply();gradients[key]=texture;}
            var old=GUI.color;GUI.color=Color.white;Tex(SnapRect(r),texture,new Rect(0,.25f,1,.5f));GUI.color=old;
        }
        // W20: repeating pattern fill (zone textures); tile is the on-screen size of one repeat.
        public static void Tile(Rect r,Texture2D texture,float tile,Color color)
        {
            if(texture==null||tile<=0||r.width<=0||r.height<=0)return;
            var old=GUI.color;GUI.color=color;Tex(r,texture,new Rect(0,0,r.width/tile,r.height/tile));GUI.color=old;
        }
        // W20: shared ring sprites. segments>0 gives a broken ring (P2 ownership, threat pulse).
        static readonly Dictionary<long,Texture2D> rings=new Dictionary<long,Texture2D>();
        public static void Ring(Vector2 center,float radius,Color color,float width,int segments=0,float fill=1)
        {
            if(radius<=0||width<=0)return;
            if(segments<=0){Exact(new Rect(center.x-radius,center.y-radius,radius*2,radius*2),color,radius,Mathf.Min(width,radius));return;}
            int thickness=Mathf.Clamp(Mathf.RoundToInt(width/radius*2048),1,2048);
            long key=thickness+((long)segments<<16)+((long)Mathf.RoundToInt(fill*100)<<24);
            if(!rings.TryGetValue(key,out var sprite)||sprite==null)
            {
                const int size=128;
                sprite=new Texture2D(size,size,TextureFormat.RGBA32,true){name="Core Clash ring",filterMode=FilterMode.Trilinear,wrapMode=TextureWrapMode.Clamp,hideFlags=HideFlags.HideAndDontSave};
                float inner=size*.5f-Mathf.Max(.6f,thickness/2048f*size*.5f);
                var pixels=new Color[size*size];
                for(int y=0;y<size;y++)
                for(int x=0;x<size;x++)
                {
                    float dx=x+.5f-size*.5f,dy=y+.5f-size*.5f,distance=Mathf.Sqrt(dx*dx+dy*dy);
                    float alpha=Mathf.Clamp01(size*.5f-distance)*Mathf.Clamp01(distance-inner+1);
                    if(segments>0&&alpha>0)
                    {
                        // Position inside one segment, 0..1; soft ends so the dashes stay round at small sizes.
                        float turn=(Mathf.Atan2(dy,dx)/(2*Mathf.PI)+1.0625f)*segments;turn-=Mathf.Floor(turn);
                        float edge=Mathf.Min(turn,fill-turn)*distance*2*Mathf.PI/segments;
                        alpha*=Mathf.Clamp01(edge+.5f);
                    }
                    pixels[y*size+x]=new Color(1,1,1,alpha);
                }
                sprite.SetPixels(pixels);sprite.Apply(true,true);rings[key]=sprite;
            }
            var old=GUI.color;GUI.color=color;Tex(new Rect(center.x-radius,center.y-radius,radius*2,radius*2),sprite);GUI.color=old;
        }
        // W21: HP ring. `segments` equal arcs starting at the top, clockwise; the first `lit`
        // are drawn (pass lit=segments for the whole track). One cached sprite per shape.
        static readonly Dictionary<long,Texture2D> arcs=new Dictionary<long,Texture2D>();
        // W24: a smooth arc for round gauges. It starts at the top and runs clockwise for `fraction`
        // of the circle, with round ends. `radius` is the outer edge, `width` goes inwards.
        // One cached sprite per thickness and per 1/48 of the circle.
        const int ArcSteps=48;
        static readonly Dictionary<long,Texture2D> smoothArcs=new Dictionary<long,Texture2D>();
        public static void Arc(Vector2 center,float radius,Color color,float width,float fraction)
        {
            if(radius<=0||width<=0||fraction<=0)return;
            if(fraction>=1){Ring(center,radius,color,width);return;}
            int step=Mathf.Clamp(Mathf.RoundToInt(fraction*ArcSteps),1,ArcSteps-1),thickness=Mathf.Clamp(Mathf.RoundToInt(width/radius*64),1,64);
            var sprite=ArcSprite(thickness,step);
            var old=GUI.color;GUI.color=color;Tex(new Rect(center.x-radius,center.y-radius,radius*2,radius*2),sprite);GUI.color=old;
            // Round ends.
            float middle=radius-width*.5f,end=step/(float)ArcSteps*2*Mathf.PI,cap=width*.5f;
            Circle(new Rect(center.x-cap,center.y-middle-cap,width,width),color);
            Circle(new Rect(center.x+Mathf.Sin(end)*middle-cap,center.y-Mathf.Cos(end)*middle-cap,width,width),color);
        }
        // Builds every arc sprite for one ring proportion now, so none has to be built in the middle
        // of a shot (building one takes a few milliseconds, which shows as a hitch in the motion).
        public static void WarmArcs(float widthOverRadius)
        {
            int thickness=Mathf.Clamp(Mathf.RoundToInt(widthOverRadius*64),1,64);
            for(int step=1;step<ArcSteps;step++)ArcSprite(thickness,step);
        }
        static Texture2D ArcSprite(int thickness,int step)
        {
            long key=thickness+((long)step<<8);
            if(!smoothArcs.TryGetValue(key,out var sprite)||sprite==null)
            {
                const int size=128;
                sprite=new Texture2D(size,size,TextureFormat.RGBA32,true){name="Core Clash arc",filterMode=FilterMode.Trilinear,wrapMode=TextureWrapMode.Clamp,hideFlags=HideFlags.HideAndDontSave};
                float inner=size*.5f-Mathf.Max(1.5f,thickness/64f*size*.5f),share=step/(float)ArcSteps;
                var pixels=new Color[size*size];
                for(int y=0;y<size;y++)
                for(int x=0;x<size;x++)
                {
                    // Texture rows start at the bottom, so +dy is up on screen.
                    float dx=x+.5f-size*.5f,dy=y+.5f-size*.5f,distance=Mathf.Sqrt(dx*dx+dy*dy);
                    float alpha=Mathf.Clamp01(size*.5f-distance)*Mathf.Clamp01(distance-inner+1);
                    if(alpha>0)
                    {
                        float turn=Mathf.Atan2(dx,dy)/(2*Mathf.PI);if(turn<0)turn+=1;
                        // Soft edge at both ends of the arc (in pixels along the circle).
                        float along=distance*2*Mathf.PI;
                        alpha*=Mathf.Clamp01(Mathf.Min(turn,share-turn)*along+.5f);
                    }
                    pixels[y*size+x]=new Color(1,1,1,alpha);
                }
                sprite.SetPixels(pixels);sprite.Apply(true,true);smoothArcs[key]=sprite;
            }
            return sprite;
        }
        // W24: thin marks across a ring, one at every boundary between `segments` equal parts
        // (the first at the top). Drawn over an Arc they split it into countable parts.
        static readonly Dictionary<long,Texture2D> tickRings=new Dictionary<long,Texture2D>();
        public static void Ticks(Vector2 center,float radius,Color color,float width,int segments,float gap=2.2f)
        {
            if(radius<=0||width<=0||segments<=1)return;
            int thickness=Mathf.Clamp(Mathf.RoundToInt(width/radius*64),1,64),gapKey=Mathf.Clamp(Mathf.RoundToInt(gap/radius*256),1,255);
            long key=thickness+((long)segments<<8)+((long)gapKey<<20);
            if(!tickRings.TryGetValue(key,out var sprite)||sprite==null)
            {
                const int size=128;
                sprite=new Texture2D(size,size,TextureFormat.RGBA32,true){name="Core Clash ring ticks",filterMode=FilterMode.Trilinear,wrapMode=TextureWrapMode.Clamp,hideFlags=HideFlags.HideAndDontSave};
                float inner=size*.5f-Mathf.Max(1.5f,thickness/64f*size*.5f),half=gapKey/256f*size*.25f;
                var pixels=new Color[size*size];
                for(int y=0;y<size;y++)
                for(int x=0;x<size;x++)
                {
                    float dx=x+.5f-size*.5f,dy=y+.5f-size*.5f,distance=Mathf.Sqrt(dx*dx+dy*dy);
                    float alpha=Mathf.Clamp01(size*.5f-distance)*Mathf.Clamp01(distance-inner+1);
                    if(alpha>0)
                    {
                        float turn=Mathf.Atan2(dx,dy)/(2*Mathf.PI);if(turn<0)turn+=1;
                        float at=turn*segments,nearest=Mathf.Abs(at-Mathf.Round(at))/segments*distance*2*Mathf.PI;
                        alpha*=Mathf.Clamp01(half-nearest+.5f);
                    }
                    pixels[y*size+x]=new Color(1,1,1,alpha);
                }
                sprite.SetPixels(pixels);sprite.Apply(true,true);tickRings[key]=sprite;
            }
            var old=GUI.color;GUI.color=color;Tex(new Rect(center.x-radius,center.y-radius,radius*2,radius*2),sprite);GUI.color=old;
        }
        public static void Segments(Vector2 center,float radius,Color color,float width,int segments,int lit,float fill=.82f)
        {
            if(radius<=0||width<=0||segments<=0||lit<=0)return;
            lit=Mathf.Min(lit,segments);
            int thickness=Mathf.Clamp(Mathf.RoundToInt(width/radius*64),1,64);
            long key=thickness+((long)segments<<8)+((long)lit<<16)+((long)Mathf.RoundToInt(fill*100)<<24);
            if(!arcs.TryGetValue(key,out var sprite)||sprite==null)
            {
                const int size=128;
                sprite=new Texture2D(size,size,TextureFormat.RGBA32,true){name="Core Clash HP ring",filterMode=FilterMode.Trilinear,wrapMode=TextureWrapMode.Clamp,hideFlags=HideFlags.HideAndDontSave};
                float inner=size*.5f-Mathf.Max(1.5f,thickness/64f*size*.5f);
                var pixels=new Color[size*size];
                for(int y=0;y<size;y++)
                for(int x=0;x<size;x++)
                {
                    // Texture rows start at the bottom, so +dy is up on screen.
                    float dx=x+.5f-size*.5f,dy=y+.5f-size*.5f,distance=Mathf.Sqrt(dx*dx+dy*dy);
                    float alpha=Mathf.Clamp01(size*.5f-distance)*Mathf.Clamp01(distance-inner+1);
                    if(alpha>0&&segments>1)
                    {
                        float turn=Mathf.Atan2(dx,dy)/(2*Mathf.PI);if(turn<0)turn+=1;
                        float at=turn*segments;int index=Mathf.Min(segments-1,(int)at);
                        if(index>=lit)alpha=0;
                        else
                        {
                            float inside=at-index-(1-fill)*.5f;
                            float edge=Mathf.Min(inside,fill-inside)*distance*2*Mathf.PI/segments;
                            alpha*=Mathf.Clamp01(edge+.5f);
                        }
                    }
                    pixels[y*size+x]=new Color(1,1,1,alpha);
                }
                sprite.SetPixels(pixels);sprite.Apply(true,true);arcs[key]=sprite;
            }
            var old=GUI.color;GUI.color=color;Tex(new Rect(center.x-radius,center.y-radius,radius*2,radius*2),sprite);GUI.color=old;
        }
        // W20: text with a soft dark edge so it reads on any arena background.
        public static void Label(Rect r,string text,int size,Color color,TextAnchor align=TextAnchor.MiddleCenter,bool bold=true)
        {
            Text(new Rect(r.x,r.y+1,r.width,r.height),text,size,new Color(.01f,.03f,.05f,.85f*color.a),align,bold);
            Text(r,text,size,color,align,bold);
        }
        // W24 candy button: a face on a darker lip. Selected = filled with the accent (white text);
        // an accent without selection = white face with accent text; no accent = neutral white.
        // W24: light text field (search) instead of the dark default skin.
        static Texture2D fieldTexture;
        public static void StyleTextField()
        {
            if(fieldTexture==null){const int n=16;fieldTexture=new Texture2D(n,n,TextureFormat.RGBA32,false){hideFlags=HideFlags.HideAndDontSave};for(int y=0;y<n;y++)for(int x=0;x<n;x++){bool edge=x<2||y<2||x>=n-2||y>=n-2;fieldTexture.SetPixel(x,y,edge?Theme.Ink:Color.white);}fieldTexture.Apply();}
            var style=GUI.skin.textField;if(style.normal.background==fieldTexture)return;
            style.border=new RectOffset(4,4,4,4);style.padding=new RectOffset(12,12,6,6);style.alignment=TextAnchor.MiddleLeft;
            style.normal.background=style.hover.background=style.focused.background=style.active.background=fieldTexture;
            style.normal.textColor=style.hover.textColor=style.focused.textColor=style.active.textColor=Theme.Ink;
        }
        // W24 cartoon look: text with an ink outline (four offset copies under the fill).
        public static void Inked(Rect r,string text,int size,Color color,TextAnchor align=TextAnchor.MiddleCenter,float width=1.5f)
        {
            var ink=new Color(Theme.Ink.r,Theme.Ink.g,Theme.Ink.b,color.a);float slant=width*.7071f;
            Text(new Rect(r.x-width,r.y,r.width,r.height),text,size,ink,align,true);Text(new Rect(r.x+width,r.y,r.width,r.height),text,size,ink,align,true);
            Text(new Rect(r.x,r.y-width,r.width,r.height),text,size,ink,align,true);Text(new Rect(r.x,r.y+width+1,r.width,r.height),text,size,ink,align,true);
            Text(new Rect(r.x-slant,r.y-slant,r.width,r.height),text,size,ink,align,true);Text(new Rect(r.x+slant,r.y-slant,r.width,r.height),text,size,ink,align,true);
            Text(new Rect(r.x-slant,r.y+slant+1,r.width,r.height),text,size,ink,align,true);Text(new Rect(r.x+slant,r.y+slant+1,r.width,r.height),text,size,ink,align,true);
            Text(r,text,size,color,align,true);
        }
        // Same idea for a glyph: the shape in ink, slightly larger, under the coloured shape.
        public static void InkedGlyph(Rect r,string spec,Color color,float width=1.5f)
        {
            var ink=new Color(Theme.Ink.r,Theme.Ink.g,Theme.Ink.b,color.a);
            Glyphs.Paint(new Rect(r.x-width,r.y-width,r.width,r.height),spec,ink);Glyphs.Paint(new Rect(r.x+width,r.y-width,r.width,r.height),spec,ink);
            Glyphs.Paint(new Rect(r.x-width,r.y+width,r.width,r.height),spec,ink);Glyphs.Paint(new Rect(r.x+width,r.y+width,r.width,r.height),spec,ink);
            Glyphs.Paint(r,spec,color);
        }
        public static bool Button(Rect r,string text,Color? accent=null,bool selected=false,bool enabled=true,int size=13)
        {
            Color tint=accent??Cyan;bool hover=r.Contains(Mouse)&&enabled&&GUI.enabled;
            // One rectangle on whole pixels; every layer of the button is cut from it (see Plate).
            r=SnapRect(r);
            float pixel=Pixel,lip=Line(r.height>=40?4:3);
            // Held down: the face sinks onto its lip at once, and comes back up on release.
            bool held=hover&&UnityEngine.Input.GetMouseButton(0);
            float sink=held?lip-pixel:hover?pixel:0;
            var face=new Rect(r.x,r.y+sink,r.width,r.height-lip);
            Color fill,edge,ink;
            if(!enabled){fill=new Color(.9f,.92f,.97f);edge=new Color(.8f,.83f,.92f);ink=Theme.Disabled;}
            else if(selected){fill=hover?Color.Lerp(tint,Color.white,.12f):tint;edge=Color.Lerp(tint,Theme.Ink,.32f);ink=Theme.OnColor;}
            else{fill=hover?Theme.PanelLight:Theme.Panel;edge=accent.HasValue?Color.Lerp(tint,Color.white,.35f):Theme.EdgeStrong;ink=accent.HasValue?Color.Lerp(tint,Theme.Ink,.28f):Theme.Text;}
            if(Event.current.type==EventType.Repaint)
            {
                if(enabled&&!held)Shadow(r,.12f,6,3);
                // Ink outline around the whole button, then the lip and the face.
                float outline=Line(1.5f),band=Line(accent.HasValue?2:1.5f);
                Round(Grow(new Rect(r.x,r.y+sink,r.width,r.height-sink),outline),enabled?Theme.Ink:new Color(.6f,.63f,.75f),Corner+outline);
                Round(new Rect(r.x,r.y+lip,r.width,r.height-lip),edge);
                Round(face,selected||!enabled?fill:edge);
                if(!selected&&enabled)Round(Grow(face,-band),fill,Corner-band);
                if(selected&&face.height>=24){float side=Line(3);Round(new Rect(face.x+side,face.y+Line(2),face.width-side*2,Mathf.Min(face.height*.42f,16)),new Color(1,1,1,.16f),Corner-side);}
            }
            bool prior=GUI.enabled;GUI.enabled=prior&&enabled;bool click=Hit(r);GUI.enabled=prior;
            if(selected&&enabled)Text(new Rect(face.x+4,face.y+1,face.width-8,face.height),text,size,new Color(0,0,0,.22f),TextAnchor.MiddleCenter,true);
            Text(new Rect(face.x+4,face.y,face.width-8,face.height),text,size,ink,TextAnchor.MiddleCenter,true);return click;
        }
        // W24: icon button (a Glyphs shape instead of a word). `on` fills it with the accent.
        public static bool IconButton(Rect r,string spec,Color? accent=null,bool on=false,bool enabled=true)
        {
            bool click=Button(r,"",accent,on,enabled);
            float lip=r.height>=40?4:3,size=Mathf.Min(r.width,r.height-lip)*.5f;
            var box=new Rect(r.center.x-size/2,r.y+(r.height-lip-size)/2,size,size);
            Glyphs.Paint(box,spec,!enabled?Theme.Disabled:on?Theme.OnColor:accent.HasValue?Color.Lerp(accent.Value,Theme.Ink,.28f):Theme.Text);
            return click;
        }
        public static Vector2 ScrollView(Rect view,Vector2 scroll,Rect content,bool horizontal=false)
        {
            int id=GUIUtility.GetControlID(FocusType.Passive);var e=Event.current;
            {
                if(e.type==EventType.MouseDown&&e.button==0&&view.Contains(Mouse)){scrollDragId=id;scrollStart=scrollLast=Mouse;scrolling=false;}
                else if(scrollDragId==id&&e.type==EventType.MouseDrag){
                    if(scrolling||Vector2.Distance(scrollStart,Mouse)>8){
                        scrolling=true;var delta=Mouse-scrollLast;scrollLast=Mouse;
                        if(horizontal)scroll.x=Mathf.Clamp(scroll.x-delta.x,0,Mathf.Max(0,content.width-view.width));
                        else scroll.y=Mathf.Clamp(scroll.y-delta.y,0,Mathf.Max(0,content.height-view.height));
                        GUIUtility.hotControl=0;e.Use();
                    }
                }else if(scrollDragId==id&&e.rawType==EventType.MouseUp){if(scrolling){GUIUtility.hotControl=0;e.Use();}scrollDragId=0;scrolling=false;}
            }
            // W24: no skin scrollbars. Lists move by drag or wheel; a slim thumb shows the position.
            if(!horizontal&&content.height>view.height+1&&e.type==EventType.Repaint){float track=view.height-8,size=Mathf.Max(28,track*view.height/content.height),at=(track-size)*Mathf.Clamp01(scroll.y/(content.height-view.height));Chip(new Rect(view.xMax-6,view.y+4+at,5,size),new Color(1,1,1,.7f));}
            float s=UiViewport.Scale;
            if(s==1)return GUI.BeginScrollView(view,scroll,content,false,false,GUIStyle.none,GUIStyle.none);
            // The wheel moves a list by the same logical distance on every display.
            if(e.type==EventType.ScrollWheel&&view.Contains(Mouse))
            {
                scroll.x=Mathf.Clamp(scroll.x+e.delta.x*20,0,Mathf.Max(0,content.width-view.width));
                scroll.y=Mathf.Clamp(scroll.y+e.delta.y*20,0,Mathf.Max(0,content.height-view.height));e.Use();
            }
            return GUI.BeginScrollView(Px(view),scroll*s,Px(content),false,false,GUIStyle.none,GUIStyle.none)/s;
        }
        public static void Circle(Rect r,Color c)
        {
            if(Mathf.Abs(r.width-r.height)<=.01f*Mathf.Max(r.width,r.height)){Exact(r,c,r.width*.5f);return;}
            if(disc==null){disc=new Texture2D(128,128,TextureFormat.RGBA32,true){filterMode=FilterMode.Trilinear,wrapMode=TextureWrapMode.Clamp};for(int y=0;y<128;y++)for(int x=0;x<128;x++){float d=Vector2.Distance(new Vector2(x+.5f,y+.5f),new Vector2(64,64));disc.SetPixel(x,y,new Color(1,1,1,Mathf.Clamp01(63-d)));}disc.Apply(true);}
            var old=GUI.color;GUI.color=c;Tex(r,disc);GUI.color=old;
        }
        public static void Line(Vector2 a,Vector2 b,Color color,float width=2)
        {
            if(Mathf.Abs(a.x-b.x)<.01f){Rect(new Rect(a.x-width/2,Mathf.Min(a.y,b.y),width,Mathf.Abs(b.y-a.y)),color);return;}
            if(Mathf.Abs(a.y-b.y)<.01f){Rect(new Rect(Mathf.Min(a.x,b.x),a.y-width/2,Mathf.Abs(b.x-a.x),width),color);return;}
            Stroke(a,b,color,width);
        }

        // W24 (owner direction: clean edges): strokes and solid shapes at any angle, with a smooth
        // edge. A shape is the hull of discs of one radius at a few points: two points make a line
        // with round ends, three a triangle with round corners. It is drawn as triangles whose last
        // pixel fades out, in the coordinates of the current group. (W17-02, #284: still no
        // GUIUtility.RotateAroundPivot. Until W24 a slanted stroke was a row of stamped discs,
        // which read as a jagged chain of beads.) The engine's group clipping does not reach these
        // triangles, so they are only for marks that stay inside the field.
        static Material strokeMaterial;static bool strokeTried;
        static readonly Vector2[] pair=new Vector2[2],triple=new Vector2[3];
        static readonly List<Vector2> hullInner=new List<Vector2>(64),hullOuter=new List<Vector2>(64);
        static bool StrokeReady()
        {
            if(!strokeTried)
            {
                strokeTried=true;
                try
                {
                    var shader=Shader.Find("Hidden/Internal-Colored");
                    if(shader!=null)
                    {
                        strokeMaterial=new Material(shader){hideFlags=HideFlags.HideAndDontSave};
                        strokeMaterial.SetInt("_SrcBlend",(int)UnityEngine.Rendering.BlendMode.SrcAlpha);strokeMaterial.SetInt("_DstBlend",(int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
                        strokeMaterial.SetInt("_Cull",(int)UnityEngine.Rendering.CullMode.Off);strokeMaterial.SetInt("_ZWrite",0);strokeMaterial.SetInt("_ZTest",(int)UnityEngine.Rendering.CompareFunction.Always);
                    }
                }
                catch(System.Exception){strokeMaterial=null;}
            }
            return strokeMaterial!=null;
        }
        // A line with round ends; dash > 0 breaks it into dashes that long (between the centres of
        // their round ends) with `gap` between them.
        public static void Stroke(Vector2 a,Vector2 b,Color color,float width,float dash=0,float gap=0)
        {
            if(Event.current.type!=EventType.Repaint||color.a<=0||width<=0)return;
            float length=Vector2.Distance(a,b);
            if(float.IsNaN(length)||float.IsInfinity(length))return;
            if(length<.01f){Circle(new Rect(a.x-width*.5f,a.y-width*.5f,width,width),color);return;}
            bool dashed=dash>0&&gap>0;
            if(!StrokeReady())
            {
                // No shader for it on this device: the old stamped discs, set close together.
                foreach(var p in AimGuide.StrokeStamps(new AimPoint(a.x,a.y),new AimPoint(b.x,b.y),width,dashed?dash:0,dashed?gap:0,Mathf.Max(.5f,width*.3f),1024))
                    Circle(new Rect(p.x-width*.5f,p.y-width*.5f,width,width),color);
                return;
            }
            float s=UiViewport.Scale;Vector2 unit=(b-a)/length;
            strokeMaterial.SetPass(0);GL.Begin(GL.TRIANGLES);
            if(!dashed){pair[0]=a*s;pair[1]=b*s;EmitHull(pair,2,width*.5f*s,color);}
            else for(float at=0;at<length;at+=dash+gap)
            {
                pair[0]=(a+unit*at)*s;pair[1]=(a+unit*Mathf.Min(length,at+dash))*s;EmitHull(pair,2,width*.5f*s,color);
            }
            GL.End();
        }
        // A solid triangle whose corners are rounded by `radius` (it reaches that far past its points).
        public static void Triangle(Vector2 a,Vector2 b,Vector2 c,float radius,Color color)
        {
            if(Event.current.type!=EventType.Repaint||color.a<=0)return;
            if(!StrokeReady()){float width=Mathf.Max(1,radius*2);Stroke(a,b,color,width);Stroke(b,c,color,width);Stroke(c,a,color,width);Stroke((a+b)*.5f,c,color,width);return;}
            float s=UiViewport.Scale;triple[0]=a*s;triple[1]=b*s;triple[2]=c*s;
            strokeMaterial.SetPass(0);GL.Begin(GL.TRIANGLES);EmitHull(triple,3,Mathf.Max(0,radius)*s,color);GL.End();
        }
        // Writes the triangles of one hull, in screen pixels; GL.Begin(GL.TRIANGLES) is open.
        // The edge is one pixel of fading alpha centred on the true outline.
        static void EmitHull(Vector2[] points,int count,float radius,Color color)
        {
            float inner=Mathf.Max(0,radius-.5f),outer=radius+.5f;
            // Thinner than a pixel: fainter, since it cannot be narrower.
            if(radius<.5f)color.a*=2*radius/(radius+.5f);
            float area=0;Vector2 middle=Vector2.zero;
            for(int i=0;i<count;i++){var p=points[i];var q=points[(i+1)%count];area+=p.x*q.y-q.x*p.y;middle+=p;}
            middle/=count;
            hullInner.Clear();hullOuter.Clear();
            for(int k=0;k<count;k++)
            {
                // Walk so that the outward side of an edge (dx,dy) is (dy,-dx).
                int i=area<0?count-1-k:k,step=area<0?-1:1;
                Vector2 here=points[i],before=points[((i-step)%count+count)%count],after=points[((i+step)%count+count)%count];
                Vector2 arrive=here-before,leave=after-here;
                if(arrive.sqrMagnitude<1e-6f||leave.sqrMagnitude<1e-6f)continue;
                float from=Mathf.Atan2(-arrive.x,arrive.y),to=Mathf.Atan2(-leave.x,leave.y),sweep=Mathf.Repeat(to-from,2*Mathf.PI);
                if(sweep>Mathf.PI+.01f)sweep=0;
                int steps=Mathf.Clamp(Mathf.CeilToInt(sweep*outer/2.5f),1,24);
                for(int j=0;j<=steps;j++)
                {
                    float angle=from+sweep*j/steps;var direction=new Vector2(Mathf.Cos(angle),Mathf.Sin(angle));
                    hullInner.Add(here+direction*inner);hullOuter.Add(here+direction*outer);
                }
            }
            var clear=new Color(color.r,color.g,color.b,0);
            for(int j=0,n=hullInner.Count;j<n;j++)
            {
                int next=(j+1)%n;Vector2 a=hullInner[j],b=hullInner[next],c=hullOuter[j],d=hullOuter[next];
                GL.Color(color);
                if(inner>0){GL.Vertex3(middle.x,middle.y,0);GL.Vertex3(a.x,a.y,0);GL.Vertex3(b.x,b.y,0);}
                GL.Vertex3(a.x,a.y,0);GL.Color(clear);GL.Vertex3(c.x,c.y,0);GL.Vertex3(d.x,d.y,0);
                GL.Color(color);GL.Vertex3(a.x,a.y,0);GL.Color(clear);GL.Vertex3(d.x,d.y,0);GL.Color(color);GL.Vertex3(b.x,b.y,0);
            }
        }
        // W24: a rounded system typeface when the device has one; otherwise the built-in font.
        static Font friendly;static bool fontTried;
        static Font Friendly(){if(!fontTried){fontTried=true;try{var installed=new HashSet<string>(Font.GetOSInstalledFontNames());foreach(string name in new[]{"Arial Rounded MT Bold","Nunito","Varela Round","Quicksand","Segoe UI Semibold","Roboto Medium","Segoe UI"})if(installed.Contains(name)){friendly=Font.CreateDynamicFontFromOSFont(name,16);break;}}catch(System.Exception){friendly=null;}}return friendly;}
        static GUIStyle LabelStyle(int size,TextAnchor align,bool bold)
        {
            size=FontPx(size);
            int key=size*100+(int)align*2+(bold?1:0);if(!labels.TryGetValue(key,out var style)){style=new GUIStyle(GUI.skin.label){font=Friendly()??GUI.skin.label.font,fontSize=size,alignment=align,wordWrap=true,richText=false,fontStyle=bold?FontStyle.Bold:FontStyle.Normal,padding=new RectOffset(0,0,0,0)};labels[key]=style;}return style;
        }
        public static float TextWidth(string text,int size,bool bold=false)=>Mathf.Ceil(LabelStyle(size,TextAnchor.UpperLeft,bold).CalcSize(new GUIContent(text??"")).x/UiViewport.Scale);
        public static float TextHeight(string text,float width,int size,bool bold=false)=>Mathf.Ceil(LabelStyle(size,TextAnchor.UpperLeft,bold).CalcHeight(new GUIContent(text),Mathf.Max(1,width*UiViewport.Scale))/UiViewport.Scale)+3;
        public static void Text(Rect r,string text,int size,Color color,TextAnchor align=TextAnchor.UpperLeft,bool bold=false)
        {
            var style=LabelStyle(size,align,bold);style.normal.textColor=color;GUI.Label(Px(r),text,style);
        }
    }
}
