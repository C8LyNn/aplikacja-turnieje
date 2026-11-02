using UnityEngine;
namespace CoreClash.Presentation
{
    // CC-001 W17-03 (#285): modal "leave match?" confirmation drawn above the match.
    public sealed partial class CoreClashApp
    {
        void RenderExitConfirm()
        {
            var l=ExitConfirmLayout.For(UiWidth,UiHeight,UiViewport.TargetSize);
            // Controls underneath are disabled (GUI.enabled) and board input is
            // blocked in Update/PresentationPointer while the question is open.
            Draw.Rect(new Rect(0,0,UiWidth,UiHeight),new Color(.012f,.022f,.036f,.82f));
            var d=RectOf(l.Dialog);Draw.Surface(d,Draw.Panel,Draw.Pink);
            Draw.Text(RectOf(l.Title),"LEAVE MATCH?",20,Color.white,TextAnchor.MiddleLeft,true);
            Draw.Text(RectOf(l.Body),NetworkLink!=null?"You will disconnect and this match will end for both players.":"The current match will be lost.",13,Draw.Muted);
            if(Draw.Button(RectOf(l.Cancel),"CANCEL",Draw.Cyan,size:13))CancelLeaveMatch();
            if(Draw.Button(RectOf(l.Leave),"LEAVE MATCH",Draw.Pink,size:13))ConfirmLeaveMatch();
        }
    }
}
