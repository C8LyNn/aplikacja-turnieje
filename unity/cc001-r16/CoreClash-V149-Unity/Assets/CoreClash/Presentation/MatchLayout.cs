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
    // View-only multiplayer transform. Simulation/world coordinates remain canonical.
    // P2 uses a 180-degree board rotation: both X and Y are inverted.
    public static class MatchPerspective
    {
        public const float WorldWidth=540f,WorldHeight=900f;
        public static float ViewX(float simulationX,int localOwner)=>localOwner==1?WorldWidth-simulationX:simulationX;
        public static float ViewY(float simulationY,int localOwner)=>localOwner==1?WorldHeight-simulationY:simulationY;
        public static float SimulationX(float viewX,int localOwner)=>localOwner==1?WorldWidth-viewX:viewX;
        public static float SimulationY(float viewY,int localOwner)=>localOwner==1?WorldHeight-viewY:viewY;
    }

    public sealed class MatchLayout
    {
        public UiBox Board,Panel;
        public bool Portrait;
        // Compact phone landscape rows are absolute UI rectangles. MatchView uses the
        // same geometry that the managed presentation tests can inspect.
        public bool CompactLandscape;
        public UiBox CompactHud,CompactChoice,CompactCards,CompactActions,CompactFeedback;
        public static MatchLayout For(float width,float height)=>For(width,height,DeviceProfile.Desktop);
        public static MatchLayout For(float width,float height,DeviceProfile profile)
        {
            var layout=new MatchLayout{Portrait=profile==DeviceProfile.Phone?width<height:width<760||width<height*1.08f};
            // The 60-unit global title and the multiplayer entry are rendered by
            // CoreClashApp. This scoped fix starts below that header; hiding it
            // requires separate CoreClashApp ownership in a later wave.
            const float edge=12f,gap=12f,headerBottom=64f;
            float compactBoardHeight=height-headerBottom-8f;
            float compactBoardWidth=compactBoardHeight*.6f;
            float compactPanelX=edge+compactBoardWidth+gap;
            float compactPanelWidth=width-compactPanelX-edge;
            if(profile==DeviceProfile.Phone&&width>height&&height>=270&&height<440&&compactBoardHeight>=190&&compactPanelWidth>=320){
                layout.CompactLandscape=true;
                layout.Board=new UiBox(edge,headerBottom,compactBoardWidth,compactBoardHeight);
                layout.Panel=new UiBox(compactPanelX,headerBottom,compactPanelWidth,compactBoardHeight);
                float x=layout.Panel.x+4f,y=layout.Panel.y+4f,w=layout.Panel.width-8f;
                layout.CompactHud=new UiBox(x,y,w,44f);y+=46f;
                layout.CompactChoice=new UiBox(x,y,w,44f);y+=46f;
                float cards=layout.Panel.height>=230?74f:50f;
                layout.CompactCards=new UiBox(x,y,w,cards);y+=cards+2f;
                layout.CompactActions=new UiBox(x,y,w,44f);y+=48f;
                layout.CompactFeedback=new UiBox(x,y,w,Math.Max(0,layout.Panel.Bottom-4f-y));
                return layout;
            }
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
