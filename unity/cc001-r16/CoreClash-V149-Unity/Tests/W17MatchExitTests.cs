using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using CoreClash.Core;
using CoreClash.Presentation;

// CC-001 W17-03 (#285): MATCH SETUP / SETUP / Escape ask before leaving a live match.
// Presentation state only: no change to rules, turns, lobby, network authority or Protocol149.
public static partial class Program
{
    static void W17MatchExitTests()
    {
        Test("W17-03 live local match asks before leaving in Aiming and Moving",()=>{
            foreach(var phase in new[]{MatchPhase.Aiming,MatchPhase.Moving}){
                var g=new MatchExitGuard();
                Eq(MatchExitDecision.AskConfirm,g.Request(false,phase,false,true));True(g.Open);
            }
        });
        Test("W17-03 finished match, setup screen and lost host leave without a question",()=>{
            var g=new MatchExitGuard();
            Eq(MatchExitDecision.LeaveNow,g.Request(false,MatchPhase.Over,false,true));False(g.Open);
            Eq(MatchExitDecision.Ignore,g.Request(true,MatchPhase.Aiming,false,true));False(g.Open);
            Eq(MatchExitDecision.LeaveNow,g.Request(false,MatchPhase.Moving,true,false));False(g.Open); // client already disconnected
            Eq(MatchExitDecision.AskConfirm,g.Request(false,MatchPhase.Aiming,true,true));True(g.Open);     // connected host or client
        });
        Test("W17-03 confirm releases the exit exactly once and repeated requests do not stack",()=>{
            var g=new MatchExitGuard();
            Eq(MatchExitDecision.AskConfirm,g.Request(false,MatchPhase.Aiming,false,true));
            Eq(MatchExitDecision.Ignore,g.Request(false,MatchPhase.Aiming,false,true)); // second click while open
            int leaves=0;for(int i=0;i<3;i++)if(g.Confirm())leaves++;
            Eq(1,leaves);False(g.Open);
            False(new MatchExitGuard().Confirm()); // nothing to confirm
        });
        Test("W17-03 cancel keeps the identical match snapshot (local match pauses while asking)",()=>{
            var s=Sim();True(s.TryCommand(Shot(s),out _));
            for(int i=0;i<30;i++)s.Step(1f/120);
            Eq(MatchPhase.Moving,s.State.phase);
            var json=new JsonSerializerOptions{IncludeFields=true};
            string before=JsonSerializer.Serialize(s.State,json);
            var g=new MatchExitGuard();
            Eq(MatchExitDecision.AskConfirm,g.Request(false,s.State.phase,false,true));
            // Same rule as CoreClashApp.Update: no stepping while a local question is open.
            for(int frame=0;frame<240;frame++)if(!MatchExitGuard.PausesSimulation(g.Open,false))s.Step(1f/120);
            g.Cancel();False(g.Open);
            Eq(before,JsonSerializer.Serialize(s.State,json));
            Settle(s);True(s.State.phase!=MatchPhase.Moving,"match resumes after cancel");
        });
        Test("W17-03 networked authority keeps simulating while its player is asked",()=>{
            True(MatchExitGuard.PausesSimulation(true,false));
            False(MatchExitGuard.PausesSimulation(true,true));
            False(MatchExitGuard.PausesSimulation(false,false));
        });
        Test("W17-03 confirmation dialog fits desktop, tablet and phone without overlapping buttons",()=>{
            var sizes=new[]{(1280f,900f,36f),(1920f,1080f,36f),(1366f,768f,36f),(1024f,768f,36f),(768f,1024f,44f),(390f,844f,44f),(320f,568f,44f),(844f,390f,44f)};
            foreach(var (w,h,target) in sizes){
                var l=ExitConfirmLayout.For(w,h,target);
                True(Inside(l.Dialog,new UiBox(0,0,w,h)),$"dialog off screen at {w}x{h}");
                foreach(var b in new[]{l.Title,l.Body,l.Cancel,l.Leave})True(Inside(b,l.Dialog),$"part outside dialog at {w}x{h}");
                True(l.Cancel.height>=target&&l.Leave.height>=target,$"touch target at {w}x{h}");
                False(Overlap(l.Cancel,l.Leave));False(Overlap(l.Body,l.Cancel));False(Overlap(l.Body,l.Leave));
                True(l.Cancel.y<l.Leave.y||l.Cancel.x<l.Leave.x,"Cancel is the first (safe) option");
            }
            True(ExitConfirmLayout.For(320,568,44).Stacked);False(ExitConfirmLayout.For(1280,900,36).Stacked);
        });
        Test("W17-03 every in-match exit control goes through the confirmation",()=>{
            var dir=Path.Combine(projectRoot,"Assets/CoreClash/Presentation");
            string Code(string f)=>string.Join("\n",File.ReadAllLines(Path.Combine(dir,f)).Select(l=>{int c=l.IndexOf("//",StringComparison.Ordinal);return c>=0?l.Substring(0,c):l;}));
            var view=Code("MatchView.cs");
            Eq(0,Regex.Matches(view,@"ReturnToSetup\s*\(").Count);
            Eq(3,Regex.Matches(view,@"RequestLeaveMatch\s*\(").Count);
            var app=Code("CoreClashApp.cs");
            True(Regex.IsMatch(app,@"else if\(!setup\)RequestLeaveMatch\(\);"),"Escape in a match must ask first");
            True(Regex.IsMatch(app,@"PausesSimulation\(exitGuard\.Open"),"local simulation pauses while asking");
        });
    }
    static bool Inside(UiBox a,UiBox outer)=>a.x>=outer.x-.01f&&a.y>=outer.y-.01f&&a.x+a.width<=outer.x+outer.width+.01f&&a.y+a.height<=outer.y+outer.height+.01f;
    static bool Overlap(UiBox a,UiBox b)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
}
