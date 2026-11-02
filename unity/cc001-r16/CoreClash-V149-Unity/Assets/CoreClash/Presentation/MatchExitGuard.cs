using System;
using CoreClash.Core;
namespace CoreClash.Presentation
{
    public enum MatchExitDecision { Ignore, LeaveNow, AskConfirm }

    // CC-001 W17-03 (#285): leaving an active match needs an explicit confirmation.
    // Pure presentation state (no UnityEngine) so it is covered by managed tests.
    // It never edits GameState, turns, lobby or network authority; confirming only
    // releases the existing CoreClashApp.ReturnToSetup path exactly once.
    public sealed class MatchExitGuard
    {
        public bool Open {get;private set;}

        // Nothing is lost when the match is already over, or when a network
        // client has already lost its host; leave immediately in those cases.
        public static bool MatchAtRisk(bool setup,MatchPhase phase,bool networked,bool connected)
            =>!setup&&phase!=MatchPhase.Over&&(!networked||connected);

        public MatchExitDecision Request(bool setup,MatchPhase phase,bool networked,bool connected)
        {
            if(setup||Open)return MatchExitDecision.Ignore;
            if(!MatchAtRisk(setup,phase,networked,connected))return MatchExitDecision.LeaveNow;
            Open=true;return MatchExitDecision.AskConfirm;
        }
        // True only for the first confirmation of an open dialog.
        public bool Confirm(){if(!Open)return false;Open=false;return true;}
        public void Cancel(){Open=false;}
        public void Reset(){Open=false;}

        // A local match pauses while the question is open, so "Cancel" returns to the
        // identical snapshot. A networked host keeps simulating (authority/pacing for
        // the remote player are unchanged); a client never simulates anyway.
        public static bool PausesSimulation(bool open,bool networked)=>open&&!networked;
    }

    // Logical-UI rectangles for the confirmation dialog (desktop, tablet and phone).
    public struct ExitConfirmLayout
    {
        public UiBox Dialog,Title,Body,Cancel,Leave;
        public bool Stacked;
        public static ExitConfirmLayout For(float uiWidth,float uiHeight,float target)
        {
            target=Math.Max(36,target);
            float w=Math.Max(200,Math.Min(440,uiWidth-32));
            bool stacked=w<320;
            float buttons=stacked?target*2+10:target;
            float h=24+30+8+44+16+buttons+24;
            float x=(uiWidth-w)/2,y=Math.Max(8,(uiHeight-h)/2);
            var l=new ExitConfirmLayout{Stacked=stacked,Dialog=new UiBox(x,y,w,h)};
            l.Title=new UiBox(x+24,y+24,w-48,30);
            l.Body=new UiBox(x+24,y+24+30+8,w-48,44);
            float by=y+24+30+8+44+16,bw=stacked?w-48:(w-48-12)/2;
            // Cancel is the safe default and comes first (left / top).
            l.Cancel=new UiBox(x+24,by,bw,target);
            l.Leave=stacked?new UiBox(x+24,by+target+10,bw,target):new UiBox(x+24+bw+12,by,bw,target);
            return l;
        }
    }
}
