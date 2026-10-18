using System;
namespace CoreClash.Presentation
{
    public enum DeviceProfile { Auto, Desktop, Phone, Tablet }
    public struct UiPoint { public float x,y;public UiPoint(float x,float y){this.x=x;this.y=y;} }
    public sealed class DeviceViewport
    {
        public float RawWidth {get;private set;}
        public float RawHeight {get;private set;}
        public float Width=>SafeArea.width/Scale;
        public float Height=>SafeArea.height/Scale;
        public float Scale {get;private set;}
        public UiBox SafeArea {get;private set;}
        public DeviceProfile Profile {get;private set;}
        public static DeviceViewport Create(float width,float height,UiBox safeArea,float pixelsPerPoint,bool touchCapable,DeviceProfile requested=DeviceProfile.Auto)
        {
            width=Positive(width)?Math.Max(1,width):1;height=Positive(height)?Math.Max(1,height):1;
            float scale=Positive(pixelsPerPoint)?Math.Max(.5f,Math.Min(8,pixelsPerPoint)):1;
            if(!Finite(safeArea.x)||!Finite(safeArea.y)||!Positive(safeArea.width)||!Positive(safeArea.height))safeArea=new UiBox(0,0,width,height);
            float left=Math.Max(0,safeArea.x),top=Math.Max(0,safeArea.y),right=Math.Min(width,safeArea.Right),bottom=Math.Min(height,safeArea.Bottom);
            if(right<=left||bottom<=top){left=top=0;right=width;bottom=height;}
            var safe=new UiBox(left,top,right-left,bottom-top);
            var profile=requested==DeviceProfile.Auto?(touchCapable?(Math.Min(safe.width,safe.height)/scale>=600?DeviceProfile.Tablet:DeviceProfile.Phone):DeviceProfile.Desktop):requested;
            return new DeviceViewport{RawWidth=width,RawHeight=height,Scale=scale,SafeArea=safe,Profile=profile};
        }
        static bool Finite(float n)=>!float.IsNaN(n)&&!float.IsInfinity(n);
        static bool Positive(float n)=>Finite(n)&&n>0;
        public UiPoint ToLogical(float topLeftX,float topLeftY)=>new UiPoint((topLeftX-SafeArea.x)/Scale,(topLeftY-SafeArea.y)/Scale);
        public UiPoint PointerToLogical(float bottomLeftX,float bottomLeftY)=>ToLogical(bottomLeftX,RawHeight-bottomLeftY);
        public UiBox ToScreen(UiBox logical)=>new UiBox(SafeArea.x+logical.x*Scale,SafeArea.y+logical.y*Scale,logical.width*Scale,logical.height*Scale);
    }
}
