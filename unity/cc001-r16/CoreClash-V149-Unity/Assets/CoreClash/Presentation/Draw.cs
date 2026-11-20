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
        static GUIStyle rounded;
        static readonly Dictionary<int,GUIStyle> labels=new Dictionary<int,GUIStyle>();
        // W20: every colour comes from Theme (one place to retune the look).
        public static Color Cyan=Theme.P1,Pink=Theme.P2,Muted=Theme.Muted,Gold=Theme.SelectInk;
        public static Color Background=Theme.Background,Panel=Theme.Panel,PanelLight=Theme.PanelLight,Edge=Theme.Edge;
        public static Color Owner(int owner)=>Theme.Team(owner);
        public static Color Hex(string text){return ColorUtility.TryParseHtmlString(text,out var c)?c:Color.white;}
        public static void Rect(Rect r,Color c){var old=GUI.color;GUI.color=c;GUI.DrawTexture(r,Texture2D.whiteTexture);GUI.color=old;}
        public static Rect Inset(Rect r,float amount)=>new Rect(r.x+amount,r.y+amount,Mathf.Max(0,r.width-amount*2),Mathf.Max(0,r.height-amount*2));
        public static void Round(Rect r,Color color)
        {
            if(r.width<24||r.height<24){Chip(r,color);return;}
            if(rounded==null){const int n=48;var texture=new Texture2D(n,n,TextureFormat.RGBA32,false){filterMode=FilterMode.Bilinear,wrapMode=TextureWrapMode.Clamp,hideFlags=HideFlags.HideAndDontSave};for(int y=0;y<n;y++)for(int x=0;x<n;x++){float dx=Mathf.Max(Mathf.Abs(x-23.5f)-12,0),dy=Mathf.Max(Mathf.Abs(y-23.5f)-12,0);texture.SetPixel(x,y,new Color(1,1,1,Mathf.Clamp01(11.5f-Mathf.Sqrt(dx*dx+dy*dy))));}texture.Apply();rounded=new GUIStyle{border=new RectOffset(12,12,12,12)};rounded.normal.background=texture;}
            var old=GUI.color;GUI.color=color;rounded.Draw(r,GUIContent.none,false,false,false,false);GUI.color=old;
        }
        public static void Surface(Rect r,Color fill,Color? border=null){Round(r,border??Edge);Round(Inset(r,border.HasValue?2:1),fill);}
        // W24: soft drop shadow under a card or a button (one cached 9-slice texture).
        static GUIStyle shadow;
        public static void Shadow(Rect r,float alpha=.2f,float spread=10,float drop=4)
        {
            if(Event.current.type!=EventType.Repaint||alpha<=0)return;
            if(shadow==null){const int n=64;var texture=new Texture2D(n,n,TextureFormat.RGBA32,false){filterMode=FilterMode.Bilinear,wrapMode=TextureWrapMode.Clamp,hideFlags=HideFlags.HideAndDontSave};for(int y=0;y<n;y++)for(int x=0;x<n;x++){float dx=Mathf.Max(Mathf.Abs(x-31.5f)-10,0),dy=Mathf.Max(Mathf.Abs(y-31.5f)-10,0),d=Mathf.Clamp01(1-(Mathf.Sqrt(dx*dx+dy*dy)-2)/20f);texture.SetPixel(x,y,new Color(1,1,1,d*d*(3-2*d)));}texture.Apply();shadow=new GUIStyle{border=new RectOffset(24,24,24,24)};shadow.normal.background=texture;}
            // W24 cartoon look: a flat ink shadow, shifted down-right, instead of a blur.
            float shift=Mathf.Min(Theme.HardShadow,drop+1);
            Round(new Rect(r.x+shift*.6f,r.y+shift,r.width,r.height),new Color(Theme.Ink.r,Theme.Ink.g,Theme.Ink.b,Mathf.Clamp01(alpha*2.2f+.12f)));
        }
        // W24: a white card with a soft shadow.
        public static void Card(Rect r,Color? fill=null,Color? border=null,float shadowAlpha=.18f)
        {
            Shadow(r,shadowAlpha);
            Round(r,Theme.Ink);
            if(border.HasValue){Round(Inset(r,Theme.InkLine),border.Value);Round(Inset(r,Theme.InkLine+2),fill??Panel);}else Round(Inset(r,Theme.InkLine),fill??Panel);
        }
        // W24: soft round glow / contact shadow (smooth falloff).
        static Texture2D glow;
        public static void Glow(Vector2 center,float radius,Color color)
        {
            if(radius<=0||color.a<=0)return;
            if(glow==null){const int n=64;glow=new Texture2D(n,n,TextureFormat.RGBA32,false){filterMode=FilterMode.Bilinear,wrapMode=TextureWrapMode.Clamp,hideFlags=HideFlags.HideAndDontSave};for(int y=0;y<n;y++)for(int x=0;x<n;x++){float d=Vector2.Distance(new Vector2(x+.5f,y+.5f),new Vector2(n*.5f,n*.5f))/(n*.5f);float a=Mathf.Clamp01(1-d);glow.SetPixel(x,y,new Color(1,1,1,a*a*(3-2*a)));}glow.Apply();}
            var old=GUI.color;GUI.color=color;GUI.DrawTexture(new Rect(center.x-radius,center.y-radius,radius*2,radius*2),glow);GUI.color=old;
        }
        // W24: full-screen backdrop, sky blue to violet, with a few large soft lights.
        public static void Backdrop(Rect r)
        {
            VGradient(r,Theme.BackdropTop,Theme.BackdropBottom);
            if(Event.current.type!=EventType.Repaint)return;
            float unit=Mathf.Max(r.width,r.height);
            Glow(new Vector2(r.x+r.width*.12f,r.y+r.height*.1f),unit*.42f,new Color(1,1,1,.14f));
            Glow(new Vector2(r.x+r.width*.95f,r.y+r.height*.8f),unit*.5f,new Color(1,.55f,.85f,.16f));
            Glow(new Vector2(r.x+r.width*.75f,r.y+r.height*.05f),unit*.3f,new Color(.45f,1,.95f,.12f));
        }
        // W20: small rounded plate for HP, status chips and board labels (9-slice, crisp from 10 px up).
        static GUIStyle chip;
        public static void Chip(Rect r,Color color)
        {
            if(r.width<10||r.height<10){Rect(r,color);return;}
            if(chip==null){const int n=12;var texture=new Texture2D(n,n,TextureFormat.RGBA32,false);for(int y=0;y<n;y++)for(int x=0;x<n;x++){float dx=Mathf.Max(Mathf.Abs(x-5.5f)-1.5f,0),dy=Mathf.Max(Mathf.Abs(y-5.5f)-1.5f,0);texture.SetPixel(x,y,new Color(1,1,1,Mathf.Clamp01(5f-Mathf.Sqrt(dx*dx+dy*dy))));}texture.Apply();chip=new GUIStyle{border=new RectOffset(5,5,5,5)};chip.normal.background=texture;}
            var old=GUI.color;GUI.color=color;chip.Draw(r,GUIContent.none,false,false,false,false);GUI.color=old;
        }
        public static void Chip(Rect r,Color fill,Color border){Chip(r,border);Chip(Inset(r,1),fill);}
        // W20: vertical two-colour gradient (one stretched 1x2 texture per colour pair).
        static readonly Dictionary<long,Texture2D> gradients=new Dictionary<long,Texture2D>();
        public static void VGradient(Rect r,Color top,Color bottom)
        {
            Color32 a=top,b=bottom;
            long key=((long)a.r<<56)|((long)a.g<<48)|((long)a.b<<40)|((long)a.a<<32)|((long)b.r<<24)|((long)b.g<<16)|((long)b.b<<8)|(long)b.a;
            if(!gradients.TryGetValue(key,out var texture)||texture==null){texture=new Texture2D(1,2,TextureFormat.RGBA32,false){filterMode=FilterMode.Bilinear,wrapMode=TextureWrapMode.Clamp,hideFlags=HideFlags.HideAndDontSave};texture.SetPixel(0,0,bottom);texture.SetPixel(0,1,top);texture.Apply();gradients[key]=texture;}
            var old=GUI.color;GUI.color=Color.white;GUI.DrawTextureWithTexCoords(r,texture,new Rect(0,.25f,1,.5f));GUI.color=old;
        }
        // W20: repeating pattern fill (zone textures); tile is the on-screen size of one repeat.
        public static void Tile(Rect r,Texture2D texture,float tile,Color color)
        {
            if(texture==null||tile<=0||r.width<=0||r.height<=0)return;
            var old=GUI.color;GUI.color=color;GUI.DrawTextureWithTexCoords(r,texture,new Rect(0,0,r.width/tile,r.height/tile));GUI.color=old;
        }
        // W20: shared ring sprites. segments>0 gives a broken ring (P2 ownership, threat pulse).
        static readonly Dictionary<long,Texture2D> rings=new Dictionary<long,Texture2D>();
        public static void Ring(Vector2 center,float radius,Color color,float width,int segments=0,float fill=1)
        {
            if(radius<=0||width<=0)return;
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
            var old=GUI.color;GUI.color=color;GUI.DrawTexture(new Rect(center.x-radius,center.y-radius,radius*2,radius*2),sprite);GUI.color=old;
        }
        // W21: HP ring. `segments` equal arcs starting at the top, clockwise; the first `lit`
        // are drawn (pass lit=segments for the whole track). One cached sprite per shape.
        static readonly Dictionary<long,Texture2D> arcs=new Dictionary<long,Texture2D>();
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
            var old=GUI.color;GUI.color=color;GUI.DrawTexture(new Rect(center.x-radius,center.y-radius,radius*2,radius*2),sprite);GUI.color=old;
        }
        // W20: text with a soft dark edge so it reads on any arena background.
        public static void Label(Rect r,string text,int size,Color color,TextAnchor align=TextAnchor.MiddleCenter,bool bold=true)
        {
            Text(new Rect(r.x,r.y+1,r.width,r.height),text,size,new Color(.01f,.03f,.05f,.85f*color.a),align,bold);
            Text(r,text,size,color,align,bold);
        }
        // W24 candy button: a face on a darker lip. Selected = filled with the accent (white text);
        // an accent without selection = white face with accent text; no accent = neutral white.
        // W24 cartoon look: text with an ink outline (four offset copies under the fill).
        public static void Inked(Rect r,string text,int size,Color color,TextAnchor align=TextAnchor.MiddleCenter,float width=1.5f)
        {
            var ink=new Color(Theme.Ink.r,Theme.Ink.g,Theme.Ink.b,color.a);
            Text(new Rect(r.x-width,r.y,r.width,r.height),text,size,ink,align,true);Text(new Rect(r.x+width,r.y,r.width,r.height),text,size,ink,align,true);
            Text(new Rect(r.x,r.y-width,r.width,r.height),text,size,ink,align,true);Text(new Rect(r.x,r.y+width+1,r.width,r.height),text,size,ink,align,true);
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
            Color tint=accent??Cyan;bool hover=r.Contains(Event.current.mousePosition)&&enabled&&GUI.enabled;
            float lip=r.height>=40?4:3;
            var face=new Rect(r.x,r.y+(hover?1:0),r.width,r.height-lip);
            Color fill,edge,ink;
            if(!enabled){fill=new Color(.9f,.92f,.97f);edge=new Color(.8f,.83f,.92f);ink=Theme.Disabled;}
            else if(selected){fill=hover?Color.Lerp(tint,Color.white,.12f):tint;edge=Color.Lerp(tint,Theme.Ink,.32f);ink=Theme.OnColor;}
            else{fill=hover?Theme.PanelLight:Theme.Panel;edge=accent.HasValue?Color.Lerp(tint,Color.white,.35f):Theme.EdgeStrong;ink=accent.HasValue?Color.Lerp(tint,Theme.Ink,.28f):Theme.Text;}
            if(Event.current.type==EventType.Repaint)
            {
                if(enabled)Shadow(r,.12f,6,3);
                // Ink outline around the whole button, then the lip and the face.
                Round(new Rect(r.x-1.5f,r.y-1.5f+(hover?1:0),r.width+3,r.height+3-(hover?1:0)),enabled?Theme.Ink:new Color(.6f,.63f,.75f));
                Round(new Rect(r.x,r.y+lip,r.width,r.height-lip),edge);
                Round(face,selected||!enabled?fill:edge);
                if(!selected&&enabled)Round(Inset(face,accent.HasValue?2:1.5f),fill);
                if(selected&&face.height>=24)Round(new Rect(face.x+3,face.y+2,face.width-6,Mathf.Min(face.height*.42f,16)),new Color(1,1,1,.16f));
            }
            bool prior=GUI.enabled;GUI.enabled=prior&&enabled;bool click=GUI.Button(r,GUIContent.none,GUIStyle.none);GUI.enabled=prior;
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
                if(e.type==EventType.MouseDown&&e.button==0&&view.Contains(e.mousePosition)){scrollDragId=id;scrollStart=scrollLast=e.mousePosition;scrolling=false;}
                else if(scrollDragId==id&&e.type==EventType.MouseDrag){
                    if(scrolling||Vector2.Distance(scrollStart,e.mousePosition)>8){
                        scrolling=true;var delta=e.mousePosition-scrollLast;scrollLast=e.mousePosition;
                        if(horizontal)scroll.x=Mathf.Clamp(scroll.x-delta.x,0,Mathf.Max(0,content.width-view.width));
                        else scroll.y=Mathf.Clamp(scroll.y-delta.y,0,Mathf.Max(0,content.height-view.height));
                        GUIUtility.hotControl=0;e.Use();
                    }
                }else if(scrollDragId==id&&e.rawType==EventType.MouseUp){if(scrolling){GUIUtility.hotControl=0;e.Use();}scrollDragId=0;scrolling=false;}
            }
            // W24: no skin scrollbars. Lists move by drag or wheel; a slim thumb shows the position.
            if(!horizontal&&content.height>view.height+1&&e.type==EventType.Repaint){float track=view.height-8,size=Mathf.Max(28,track*view.height/content.height),at=(track-size)*Mathf.Clamp01(scroll.y/(content.height-view.height));Chip(new Rect(view.xMax-6,view.y+4+at,5,size),new Color(1,1,1,.7f));}
            return GUI.BeginScrollView(view,scroll,content,false,false,GUIStyle.none,GUIStyle.none);
        }
        public static void Circle(Rect r,Color c)
        {
            if(disc==null){disc=new Texture2D(128,128,TextureFormat.RGBA32,true){filterMode=FilterMode.Trilinear,wrapMode=TextureWrapMode.Clamp};for(int y=0;y<128;y++)for(int x=0;x<128;x++){float d=Vector2.Distance(new Vector2(x+.5f,y+.5f),new Vector2(64,64));disc.SetPixel(x,y,new Color(1,1,1,Mathf.Clamp01(63-d)));}disc.Apply(true);}
            var old=GUI.color;GUI.color=c;GUI.DrawTexture(r,disc);GUI.color=old;
        }
        public static void Line(Vector2 a,Vector2 b,Color color,float width=2)
        {
            if(Mathf.Abs(a.x-b.x)<.01f){Rect(new Rect(a.x-width/2,Mathf.Min(a.y,b.y),width,Mathf.Abs(b.y-a.y)),color);return;}
            if(Mathf.Abs(a.y-b.y)<.01f){Rect(new Rect(Mathf.Min(a.x,b.x),a.y-width/2,Mathf.Abs(b.x-a.x),width),color);return;}
            // W17-02 (#284): no GUIUtility.RotateAroundPivot here. Under the scaled
            // UiViewport.GuiMatrix (and nested groups) its pivot is misplaced, which on
            // RC1 drew diagonal strokes in the arena corner or outside the board.
            // Stamping discs along the segment uses the same transform as balls.
            foreach(var p in AimGuide.StrokeStamps(new AimPoint(a.x,a.y),new AimPoint(b.x,b.y),width,0,0,Mathf.Max(.5f,width*.5f),512))
                Circle(new Rect(p.x-width*.5f,p.y-width*.5f,width,width),color);
        }
        // W24: a rounded system typeface when the device has one; otherwise the built-in font.
        static Font friendly;static bool fontTried;
        static Font Friendly(){if(!fontTried){fontTried=true;try{var installed=new HashSet<string>(Font.GetOSInstalledFontNames());foreach(string name in new[]{"Arial Rounded MT Bold","Nunito","Varela Round","Quicksand","Segoe UI Semibold","Roboto Medium","Segoe UI"})if(installed.Contains(name)){friendly=Font.CreateDynamicFontFromOSFont(name,16);break;}}catch(System.Exception){friendly=null;}}return friendly;}
        static GUIStyle LabelStyle(int size,TextAnchor align,bool bold)
        {
            int key=size*100+(int)align*2+(bold?1:0);if(!labels.TryGetValue(key,out var style)){style=new GUIStyle(GUI.skin.label){font=Friendly()??GUI.skin.label.font,fontSize=size,alignment=align,wordWrap=true,richText=false,fontStyle=bold?FontStyle.Bold:FontStyle.Normal,padding=new RectOffset(0,0,0,0)};labels[key]=style;}return style;
        }
        public static float TextHeight(string text,float width,int size,bool bold=false)=>Mathf.Ceil(LabelStyle(size,TextAnchor.UpperLeft,bold).CalcHeight(new GUIContent(text),Mathf.Max(1,width)))+3;
        public static void Text(Rect r,string text,int size,Color color,TextAnchor align=TextAnchor.UpperLeft,bool bold=false)
        {
            var style=LabelStyle(size,align,bold);style.normal.textColor=color;GUI.Label(r,text,style);
        }
    }
}
