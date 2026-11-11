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
        public static Color Cyan=Theme.P1,Pink=Theme.P2,Muted=Theme.Muted,Gold=Theme.Select;
        public static Color Background=Theme.Background,Panel=Theme.Panel,PanelLight=Theme.PanelLight,Edge=Theme.Edge;
        public static Color Owner(int owner)=>Theme.Team(owner);
        public static Color Hex(string text){return ColorUtility.TryParseHtmlString(text,out var c)?c:Color.white;}
        public static void Rect(Rect r,Color c){var old=GUI.color;GUI.color=c;GUI.DrawTexture(r,Texture2D.whiteTexture);GUI.color=old;}
        public static Rect Inset(Rect r,float amount)=>new Rect(r.x+amount,r.y+amount,Mathf.Max(0,r.width-amount*2),Mathf.Max(0,r.height-amount*2));
        public static void Round(Rect r,Color color)
        {
            if(r.width<24||r.height<24){Rect(r,color);return;}
            if(rounded==null){var texture=new Texture2D(32,32,TextureFormat.RGBA32,false);for(int y=0;y<32;y++)for(int x=0;x<32;x++){float dx=Mathf.Max(Mathf.Abs(x-15.5f)-6,0),dy=Mathf.Max(Mathf.Abs(y-15.5f)-6,0);texture.SetPixel(x,y,new Color(1,1,1,Mathf.Clamp01(10-Mathf.Sqrt(dx*dx+dy*dy))));}texture.Apply();rounded=new GUIStyle{border=new RectOffset(12,12,12,12)};rounded.normal.background=texture;}
            var old=GUI.color;GUI.color=color;rounded.Draw(r,GUIContent.none,false,false,false,false);GUI.color=old;
        }
        public static void Surface(Rect r,Color fill,Color? border=null){Round(r,border??Edge);Round(Inset(r,1),fill);}
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
                sprite=new Texture2D(size,size,TextureFormat.RGBA32,false){name="Core Clash ring",filterMode=FilterMode.Bilinear,wrapMode=TextureWrapMode.Clamp,hideFlags=HideFlags.HideAndDontSave};
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
                sprite.SetPixels(pixels);sprite.Apply(false,true);rings[key]=sprite;
            }
            var old=GUI.color;GUI.color=color;GUI.DrawTexture(new Rect(center.x-radius,center.y-radius,radius*2,radius*2),sprite);GUI.color=old;
        }
        // W20: text with a soft dark edge so it reads on any arena background.
        public static void Label(Rect r,string text,int size,Color color,TextAnchor align=TextAnchor.MiddleCenter,bool bold=true)
        {
            Text(new Rect(r.x,r.y+1,r.width,r.height),text,size,new Color(.01f,.03f,.05f,.85f*color.a),align,bold);
            Text(r,text,size,color,align,bold);
        }
        public static bool Button(Rect r,string text,Color? accent=null,bool selected=false,bool enabled=true,int size=13)
        {
            Color tint=accent??Cyan;bool hover=r.Contains(Event.current.mousePosition)&&enabled;
            Surface(r,selected?Color.Lerp(Panel,tint,.24f):hover?PanelLight:Panel,selected?tint:hover?Color.Lerp(Edge,tint,.5f):Edge);
            bool prior=GUI.enabled;GUI.enabled=prior&&enabled;bool click=GUI.Button(r,GUIContent.none,GUIStyle.none);GUI.enabled=prior;
            Text(Inset(r,5),text,size,enabled?(selected?tint:Color.white):new Color(.36f,.43f,.5f),TextAnchor.MiddleCenter,true);return click;
        }
        public static Vector2 ScrollView(Rect view,Vector2 scroll,Rect content,bool horizontal=false)
        {
            int id=GUIUtility.GetControlID(FocusType.Passive);var e=Event.current;
            if(UiViewport.IsTouch||UiViewport.Profile==DeviceProfile.Phone||UiViewport.Profile==DeviceProfile.Tablet){
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
            return horizontal?GUI.BeginScrollView(view,scroll,content,false,false,GUIStyle.none,GUIStyle.none):GUI.BeginScrollView(view,scroll,content);
        }
        public static void Circle(Rect r,Color c)
        {
            if(disc==null){disc=new Texture2D(96,96,TextureFormat.RGBA32,false);for(int y=0;y<96;y++)for(int x=0;x<96;x++){float d=Vector2.Distance(new Vector2(x+.5f,y+.5f),new Vector2(48,48));disc.SetPixel(x,y,new Color(1,1,1,Mathf.Clamp01(48-d)));}disc.Apply();}
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
        static GUIStyle LabelStyle(int size,TextAnchor align,bool bold)
        {
            int key=size*100+(int)align*2+(bold?1:0);if(!labels.TryGetValue(key,out var style)){style=new GUIStyle(GUI.skin.label){fontSize=size,alignment=align,wordWrap=true,richText=false,fontStyle=bold?FontStyle.Bold:FontStyle.Normal,padding=new RectOffset(0,0,0,0)};labels[key]=style;}return style;
        }
        public static float TextHeight(string text,float width,int size,bool bold=false)=>Mathf.Ceil(LabelStyle(size,TextAnchor.UpperLeft,bold).CalcHeight(new GUIContent(text),Mathf.Max(1,width)))+3;
        public static void Text(Rect r,string text,int size,Color color,TextAnchor align=TextAnchor.UpperLeft,bool bold=false)
        {
            var style=LabelStyle(size,align,bold);style.normal.textColor=color;GUI.Label(r,text,style);
        }
    }
}
