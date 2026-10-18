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
        public static Color Cyan=new Color(.31f,.84f,1),Pink=new Color(1,.36f,.47f),Muted=new Color(.55f,.65f,.73f),Gold=new Color(1,.82f,.4f);
        public static Color Background=Hex("#09111c"),Panel=Hex("#0e1a29"),PanelLight=Hex("#122235"),Edge=Hex("#263b50");
        public static Color Owner(int owner)=>owner==0?Cyan:Pink;
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
            var matrix=GUI.matrix;Vector2 d=b-a;float angle=Mathf.Atan2(d.y,d.x)*Mathf.Rad2Deg;GUIUtility.RotateAroundPivot(angle,a);Rect(new Rect(a.x,a.y-width/2,d.magnitude,width),color);GUI.matrix=matrix;
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
