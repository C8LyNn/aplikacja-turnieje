using System;
namespace CoreClash.Presentation
{
    public struct UiBox
    {
        public float x,y,width,height;
        public UiBox(float x,float y,float width,float height){this.x=x;this.y=y;this.width=width;this.height=height;}
        public float Right=>x+width;
        public float Bottom=>y+height;
    }
    public sealed class MatchLayout
    {
        public UiBox Board,Panel;
        public bool Portrait;
        public static MatchLayout For(float width,float height)=>For(width,height,DeviceProfile.Desktop);
        public static MatchLayout For(float width,float height,DeviceProfile profile)
        {
            var layout=new MatchLayout{Portrait=profile==DeviceProfile.Phone?width<height:width<760||width<height*1.08f};
            if(layout.Portrait){
                float available=height-(profile==DeviceProfile.Tablet?420:350);
                float h=Math.Min(height>=600?available:(height-146)*.52f,(width-24)/.6f),w=h*.6f;
                layout.Board=new UiBox((width-w)/2,126,w,h);layout.Panel=new UiBox(12,layout.Board.Bottom+12,width-24,height-layout.Board.Bottom-24);
            }else{
                float panel=profile==DeviceProfile.Tablet?Math.Min(440,Math.Max(360,width*.32f)):profile==DeviceProfile.Phone?Math.Min(360,Math.Max(280,width*.43f)):Math.Min(520,Math.Max(360,width*.405f));
                float h=height-92,w=Math.Min(h*.6f,width-panel-56);h=w/.6f;float x=(width-w-panel-24)/2;
                layout.Board=new UiBox(x,74+(height-92-h)/2,w,h);layout.Panel=new UiBox(x+w+24,74,panel,height-92);
            }
            return layout;
        }
    }
}
