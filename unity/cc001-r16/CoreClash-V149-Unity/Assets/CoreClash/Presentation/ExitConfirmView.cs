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
            Draw.Rect(new Rect(0,0,UiWidth,UiHeight),Theme.A(Theme.Scrim,.62f));
            var d=RectOf(l.Dialog);Draw.Card(d,null,null,.4f);
            Draw.Text(RectOf(l.Title),Lang.T("Leave match?","Wyjść z meczu?"),20,Theme.Text,TextAnchor.MiddleLeft,true);
            Draw.Text(RectOf(l.Body),NetworkLink!=null?Lang.T("You will disconnect and this match will end for both players.","Rozłączysz się, a mecz skończy się dla obu graczy."):Lang.T("The current match will be lost.","Ten mecz przepadnie."),13,Draw.Muted);
            if(Draw.Button(RectOf(l.Cancel),Lang.T("Stay","Zostań"),Draw.Cyan,size:13))CancelLeaveMatch();
            if(Draw.Button(RectOf(l.Leave),Lang.T("Leave","Wyjdź"),Theme.Damage,true,true,13))ConfirmLeaveMatch();
        }
    }
}
