using CoreClash.Core;
using CoreClash.Presentation;
public static partial class Program
{
    static void FeedbackTests()
    {
        Test("wall guide reflects at the ball centre boundary",()=>{var p=AimGuide.Trace(450,450,1,0,20,100);Eq(3,p.Length);Near(495.7f,p[1].x,.001f);Near(441.4f,p[2].x,.001f);Near(450,p[2].y,.001f);});
        Test("wall guide preserves a direct shot before the wall",()=>{var p=AimGuide.Trace(270,450,0,-1,17,100);Eq(2,p.Length);Near(270,p[1].x);Near(350,p[1].y);});
        Test("corner guide reflects both axes and remains inside",()=>{var p=AimGuide.Trace(450,818.3f,1,1,20,150);Eq(3,p.Length);Near(495.7f,p[1].x,.01f);Near(864,p[1].y,.01f);True(p[2].x<p[1].x&&p[2].y<p[1].y);});
        Test("invalid aim guide cannot generate nonfinite drawing coordinates",()=>{Eq(0,AimGuide.Trace(270,450,float.NaN,1,17,100).Length);Eq(0,AimGuide.Trace(270,450,0,0,17,100).Length);});
        Test("feedback observes real damage once across repeated snapshots",()=>{var s=Sim();var b=s.Spawn(0,"normal",270,450);var view=new FeedbackTimeline();view.Observe(s.State,10);s.Damage(b,5,true);view.Observe(s.State,11);Eq(1,view.Items.Count);Eq("DAMAGE",view.Items[0].kind);Eq("-5",view.Items[0].text);view.Observe(s.State,11.2f);Eq(1,view.Items.Count);});
        Test("feedback expires on presentation time even after match ends",()=>{var s=Sim();var b=s.Spawn(0,"normal",270,450);var view=new FeedbackTimeline();view.Observe(s.State,0);s.Damage(b,5,true);view.Observe(s.State,1);Eq(1,view.Items.Count);s.Rules.Finish(0,"test");view.Observe(s.State,4);Eq(0,view.Items.Count);});
        Test("feedback never replays a stale joining snapshot",()=>{var s=Sim();var b=s.Spawn(0,"normal",270,450);s.Damage(b,5,true);var view=new FeedbackTimeline();view.Observe(s.State,10);Eq(0,view.Items.Count);s.Heal(b,5);view.Observe(s.State,11);Eq(1,view.Items.Count);Eq("HEAL",view.Items[0].kind);});
        Test("a burst of real effects cannot grow the presentation buffer without bound",()=>{var s=Sim();var b=s.Spawn(0,"normal",270,450);b.hp=b.maxHp=500;var view=new FeedbackTimeline();view.Observe(s.State,0);for(int i=0;i<40;i++)s.Damage(b,5,true);view.Observe(s.State,1);True(view.Items.Count<=24);True(view.Items.Count>0);Eq(300,b.hp);});
        Test("feedback resets for a new match with reused event IDs",()=>{var s=Sim();var b=s.Spawn(0,"normal",270,450);var view=new FeedbackTimeline();view.Observe(s.State,0);s.Damage(b,5,true);view.Observe(s.State,1);Eq(1,view.Items.Count);var next=Sim();view.Observe(next.State,2);Eq(0,view.Items.Count);var n=next.Spawn(1,"normal",200,450);next.Damage(n,5,true);view.Observe(next.State,3);Eq(1,view.Items.Count);Eq(1,view.Items[0].owner);});
    }
}
