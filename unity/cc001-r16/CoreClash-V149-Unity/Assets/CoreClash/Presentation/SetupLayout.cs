using System;
namespace CoreClash.Presentation
{
    public sealed class SetupDeckRowLayout
    {
        public UiBox Name,Player1,Player2;
        public UiBox[] Previews;
        public float Height;
    }
    public static class SetupLayout
    {
        public static float DeckNameWidth(float width)=>width<500?width-28:width-156;
        public static SetupDeckRowLayout DeckRow(float width,float measuredNameHeight)=>DeckRow(width,measuredNameHeight,36);
        public static SetupDeckRowLayout DeckRow(float width,float measuredNameHeight,float targetSize)
        {
            float actionH=Math.Max(36,targetSize);
            bool narrow=width<500;
            var row=new SetupDeckRowLayout{Name=new UiBox(14,9,DeckNameWidth(width),Math.Max(23,measuredNameHeight)),Previews=new UiBox[9]};
            float previewY=Math.Max(39,row.Name.Bottom+(narrow?10:7)),step=narrow?(width-51)/8:25;
            for(int i=0;i<9;i++)row.Previews[i]=new UiBox(16+i*step,previewY,19,19);
            if(narrow){
                float actionY=previewY+31,actionW=(width-38)/2;
                row.Player1=new UiBox(14,actionY,actionW,actionH);
                row.Player2=new UiBox(24+actionW,actionY,actionW,actionH);
                row.Height=row.Player1.Bottom+12;
            }else{
                row.Player1=new UiBox(width-142,18,62,actionH);
                row.Player2=new UiBox(width-70,18,62,actionH);
                row.Height=Math.Max(74,Math.Max(previewY+35,row.Player1.Bottom+12));
            }
            return row;
        }
    }
}
