using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using CoreClash.Core;
using CoreClash.Presentation;

// CC-001 W20 (visual readability iteration): the pure parts of the new match-screen
// presentation. Everything here is presentation only; no rule, physics or protocol value
// is asserted to change.
public static partial class Program
{
    static BallStateLabel W20Chip(StatusKind kind,string shortText="")=>new BallStateLabel(kind.ToString(),kind.ToString(),kind,shortText);
    static List<UiBox> W20Boxes(BallBadgeLayout l)
    {
        var boxes=new List<UiBox>{l.Hp};
        if(l.HasShield)boxes.Add(l.Shield);
        boxes.AddRange(l.Chips.Select(c=>c.Box));
        if(l.Hidden>0)boxes.Add(l.Overflow);
        return boxes;
    }

    static void W20VisualTests()
    {
        Test("W20 HP plate, shield and status chips sit outside the ball, never overlap and stay inside the field",()=>{
            var pool=new[]{W20Chip(StatusKind.Fire,"2"),W20Chip(StatusKind.Rooted),W20Chip(StatusKind.Toxin,"3"),W20Chip(StatusKind.Counter,"1/2"),W20Chip(StatusKind.Divine),W20Chip(StatusKind.Token)};
            int cases=0;
            foreach(float scale in new[]{.4f,.565f,.7f,.86f,1f,1.3f,1.62f,2.4f})
            foreach(float worldRadius in new[]{17.5f,21.25f,25f})
            foreach(int hp in new[]{5,30,100})
            foreach(int shield in new[]{0,10})
            for(int count=0;count<=pool.Length;count++)
            foreach(bool corner in new[]{false,true})
            {
                var field=new UiBox(0,0,491.4f*scale,868*scale);float r=worldRadius*scale;
                var centres=new[]{(r+1,r+1),(field.width/2,field.height/2),(field.width-r-1,field.height-r-1),(field.width/2,field.height-r-1),(r+1,field.height/2),(field.width-r-1,r+1),(field.width/2,r+1)};
                foreach(var (cx,cy) in centres)
                {
                    var l=BallBadges.Layout(cx,cy,r,scale,hp,shield,pool.Take(count).ToArray(),corner,corner,field);cases++;
                    string at=$"scale {scale} r {worldRadius} hp {hp} shield {shield} chips {count} at {cx:0},{cy:0}";
                    True(l.Above?l.Hp.Bottom<=cy-r+.001f:l.Hp.y>=cy+r-.001f,"HP plate on the ball body: "+at);
                    var boxes=W20Boxes(l);
                    foreach(var b in boxes)True(b.x>=field.x-.01f&&b.Right<=field.Right+.01f&&b.y>=field.y-.01f&&b.Bottom<=field.Bottom+.01f,"plate outside the field: "+at);
                    var all=new List<UiBox>(boxes);if(l.HasThreat)all.Add(l.Threat);if(l.HasReplay)all.Add(l.Replay);
                    for(int i=0;i<all.Count;i++)for(int j=i+1;j<all.Count;j++)True(!BoardLabelLayout.Overlaps(all[i],all[j]),"badges overlap: "+at);
                    foreach(var b in all)True(b.x>=l.Bounds.x-.01f&&b.Right<=l.Bounds.Right+.01f&&b.y>=l.Bounds.y-.01f&&b.Bottom<=l.Bounds.Bottom+.01f,"bounds miss a badge: "+at);
                    True(l.Chips.Length<=BallBadges.MaxChips&&l.Chips.Length+l.Hidden==count,"chip count: "+at);
                    Eq(count>BallBadges.MaxChips,l.Hidden>0);
                    Eq(shield>0,l.HasShield);Eq(corner,l.HasThreat);Eq(corner,l.HasReplay);
                }
            }
            True(cases>10000,"matrix too small");
            // next to the bottom wall the rows move above the ball instead of leaving the field
            var bottom=BallBadges.Layout(200,690,20,1,30,0,pool.Take(2).ToArray(),false,false,new UiBox(0,0,400,700));
            True(bottom.Above&&bottom.Hp.Bottom<=670,"rows did not move above the ball at the bottom wall");
            var middle=BallBadges.Layout(200,300,20,1,30,0,pool.Take(2).ToArray(),false,false,new UiBox(0,0,400,700));
            True(!middle.Above&&middle.Hp.y>=320,"rows are not under the ball in the open field");
        });
        Test("W20 status chips keep one fixed order; shield and bomb threat have their own places; codes are unchanged",()=>{
            var ball=new BallRuntime{id=3,owner=1,type="mine",radius=21.25f,hp=20,maxHp=35,shield=12,fireStacks=2,burnTurns=4,iceStacks=1,iceTurns=3,toxinTurns=2,rooted=true,frozen=1,mineArmed=true,generated=true};
            var chips=BallBadges.Chips(ball);
            True(chips.Select(c=>c.Kind).SequenceEqual(new[]{StatusKind.Frozen,StatusKind.Rooted,StatusKind.Fire,StatusKind.Ice,StatusKind.Toxin,StatusKind.Token}),string.Join(",",chips.Select(c=>c.Kind)));
            True(chips.All(c=>c.Kind!=StatusKind.Shield&&c.Kind!=StatusKind.Armed&&c.Kind!=StatusKind.Fuse),"shield/threat duplicated in the chip row");
            Eq("2",chips.First(c=>c.Kind==StatusKind.Fire).Short);Eq("1",chips.First(c=>c.Kind==StatusKind.Ice).Short);Eq("2",chips.First(c=>c.Kind==StatusKind.Toxin).Short);
            Eq(StatusKind.Armed,BallBadges.Threat(ball).Kind);
            // a state that ends does not reorder the remaining ones
            ball.frozen=0;ball.toxinTurns=0;
            True(BallBadges.Chips(ball).Select(c=>c.Kind).SequenceEqual(new[]{StatusKind.Rooted,StatusKind.Fire,StatusKind.Ice,StatusKind.Token}));
            var bomb=new BallRuntime{id=4,owner=0,type="timebomb",radius=21.25f,hp=30,maxHp=30,timeBombArmed=true,timeBombCounter=0};
            Eq(StatusKind.Fuse,BallBadges.Threat(bomb).Kind);Eq("2",BallBadges.Threat(bomb).Short);bomb.timeBombCounter=1;Eq("1",BallBadges.Threat(bomb).Short);
            True(BallBadges.Threat(new BallRuntime{type="normal",radius=21.25f,hp=30,maxHp=30})==null);
            // the inspection codes and full texts used by the details view did not change
            var states=BallInspection.Statuses(ball);
            foreach(string code in new[]{"GEN","ROOT","S12","ARM","F2","I1"})True(states.Any(state=>state.Code==code),"missing code "+code);
            True(states.First(state=>state.Code=="F2").Text.Contains("4 own turns")&&states.First(state=>state.Code=="S12").Kind==StatusKind.Shield);
            Eq(0,BallBadges.Chips(null).Length);True(BallBadges.Threat(null)==null);
        });
        Test("W20 feedback: real event classes and labels; overlapping labels are moved apart, not dropped",()=>{
            Eq(FeedbackClass.Damage,FeedbackStyle.Classify("DAMAGE","-5"));Eq(FeedbackClass.Absorbed,FeedbackStyle.Classify("DAMAGE","Shield"));
            Eq(FeedbackClass.Explosion,FeedbackStyle.Classify("EXPLOSION","Area explosion"));Eq(FeedbackClass.BaseDamage,FeedbackStyle.Classify("BASE_DAMAGE","P2 base -2"));
            Eq(FeedbackClass.Fuse,FeedbackStyle.Classify("FUSE","Fuse: 1 own turn"));Eq(FeedbackClass.Armed,FeedbackStyle.Classify("ARMED","Mine armed"));
            Eq(FeedbackClass.Info,FeedbackStyle.Classify("SIGNATURE","x"));Eq(FeedbackClass.Info,FeedbackStyle.Classify(null,null));
            Eq("-5",FeedbackStyle.Label("DAMAGE","-5"));Eq("ABSORBED",FeedbackStyle.Label("DAMAGE","Shield"));Eq("+10",FeedbackStyle.Label("HEAL","+10"));
            Eq("FIRE 2",FeedbackStyle.Label("FIRE","Fire 2"));Eq("DEFEATED",FeedbackStyle.Label("DEATH","Standard"));Eq("P2 BASE -2",FeedbackStyle.Label("BASE_DAMAGE","P2 base -2"));Eq("",FeedbackStyle.Label("SHIELD",null));
            Eq(12,FeedbackStyle.Amount("-12"));Eq(5,FeedbackStyle.Amount("+5"));Eq(0,FeedbackStyle.Amount("Shield"));Eq(0,FeedbackStyle.Amount(null));Eq(0,FeedbackStyle.Amount("-x"));
            True(FeedbackStyle.IsNumber(FeedbackClass.Damage)&&FeedbackStyle.IsNumber(FeedbackClass.Heal)&&!FeedbackStyle.IsNumber(FeedbackClass.Absorbed));
            // the event text of a real damage/heal/absorb is exactly what the label shows
            var s=Sim();var a=s.Spawn(0,"normal",200,450);var view=new FeedbackTimeline();view.Observe(s.State,0);
            s.Damage(a,7,true);a.shield=20;s.Damage(a,5,true);view.Observe(s.State,.1f);
            True(view.Items.Select(item=>FeedbackStyle.Label(item.kind,item.text)).SequenceEqual(new[]{"-7","ABSORBED"}),string.Join(",",view.Items.Select(item=>item.text)));
            var field=new UiBox(0,0,400,700);
            var same=Enumerable.Repeat(new UiBox(100,300,60,20),10).ToList();
            var placed=FeedbackLabels.Stack(same,field,24);
            Eq(10,placed.Length);Eq(300f,placed[0].y);
            for(int i=0;i<placed.Length;i++)
            {
                True(placed[i].width>0,"a label was dropped: "+i);
                True(placed[i].x>=1&&placed[i].Right<=399&&placed[i].y>=1&&placed[i].Bottom<=699,"label outside the field");
                for(int j=i+1;j<placed.Length;j++)True(!BoardLabelLayout.Overlaps(placed[i],placed[j]),$"labels {i} and {j} overlap");
            }
            var edge=FeedbackLabels.Stack(new List<UiBox>{new UiBox(-30,-5,60,20),new UiBox(390,690,60,20)},field,24);
            True(edge[0].x>=1&&edge[0].y>=1&&edge[1].Right<=399&&edge[1].Bottom<=699&&edge[0].width>0&&edge[1].width>0,"edge labels not pulled into the field");
            var cramped=FeedbackLabels.Stack(Enumerable.Repeat(new UiBox(10,5,60,20),4).ToList(),new UiBox(0,0,100,30),24);
            True(cramped[0].width>0&&cramped.Skip(1).All(b=>b.width==0),"a label was drawn over another when no slot existed");
        });
        Test("W20 turn-change cue is stamped only by a real TURN event and is not a feedback label",()=>{
            var s=Sim();var view=new FeedbackTimeline();view.Observe(s.State,0);True(view.TurnBorn<0,"cue before any turn change");
            True(s.TryCommand(Shot(s),out _));view.Observe(s.State,.2f);True(view.TurnBorn<0,"cue at launch");
            for(int i=0;i<4000&&s.State.phase==MatchPhase.Moving;i++){s.Step(1f/120);view.Observe(s.State,.2f+i/120f);}
            Eq(1,s.State.turn);True(view.TurnBorn>.2f,"no cue after the turn changed");Eq(1,view.TurnOwner);Eq(s.State.turnNumber,view.TurnNumber);
            True(view.Items.All(item=>item.kind!="TURN"),"TURN leaked into the label list");
            var next=Sim();view.Observe(next.State,50);True(view.TurnBorn<0,"cue survived a new match");
            Eq(1.15f,FeedbackTimeline.Life);
        });
        Test("W20 last-action line is built from authoritative events only and is read-only",()=>{
            var s=Sim();Eq("",ActionSummary.For(s.State));Eq("",ActionSummary.For(null));
            var a=s.Spawn(1,"normal",200,300);var b=s.Spawn(0,"normal",300,600);
            s.Damage(a,7,true);Eq("TURN 1 · P2 BALLS -7",ActionSummary.For(s.State));
            s.Damage(b,4,true);s.Damage(a,3,true);Eq("TURN 1 · P1 BALLS -4 · P2 BALLS -10",ActionSummary.For(s.State));
            s.Rules.DamageBase(1,2);Eq("TURN 1 · P1 BALLS -4 · P2 BALLS -10 · P2 BASE -2",ActionSummary.For(s.State));
            b.shield=50;s.Damage(b,9,true);True(ActionSummary.For(s.State).Contains("P1 BALLS -4 ·"),"absorbed damage was counted as HP loss");
            s.Kill(a);True(ActionSummary.For(s.State).Contains("P2 BALLS -10 (1 DEFEATED)"),ActionSummary.For(s.State));
            Eq(20-2,s.State.players[1].hp);
            // the line follows the newest turn that has results, and keeps the previous one while aiming
            s.State.turnNumber=2;True(ActionSummary.For(s.State).StartsWith("TURN 1 · "));
            s.Damage(b,60,true);
            s.State.turnNumber=4;Eq("",ActionSummary.For(s.State));
            var json=new JsonSerializerOptions{IncludeFields=true};string before=JsonSerializer.Serialize(s.State,json);
            ActionSummary.For(s.State);ActionSummary.ForTurn(s.State,1);Eq(before,JsonSerializer.Serialize(s.State,json));
            // a full, bounded event buffer is reported as partial instead of as a complete total
            var full=Sim();var c=full.Spawn(1,"normal",200,300);c.hp=c.maxHp=5000;for(int i=0;i<120;i++)full.Damage(c,1,true);
            Eq(100,full.State.events.Count);True(ActionSummary.For(full.State).StartsWith("TURN 1 (PARTIAL) · P2 BALLS -100"),ActionSummary.For(full.State));
        });
        Test("W20 side panel fits 1920x1080 and 1366x768 without scrolling; rows never overlap; scroll remains the fallback",()=>{
            // (window, UI scale): 96, 120 and 144 dpi desktops as UiViewport computes them
            var screens=new[]{(1920f,1080f,1f),(1920f,1080f,1.25f),(1920f,1080f,1.5f),(1366f,768f,1f),(1366f,768f,1.25f),(1366f,768f,1.28f),(1280f,900f,1f),(3840f,2054f,1.9f),(2560f,1440f,1f)};
            foreach(var (w,h,density) in screens)
            {
                var match=MatchLayout.For(w/density,h/density);False(match.Portrait);
                float innerW=match.Panel.width-24,innerH=match.Panel.height-24;
                var rows=MatchPanelLayout.For(innerW,innerH,36);string at=$"{w}x{h} @{density}";
                True(!rows.Scrolls&&rows.ContentHeight<=innerH+.5f,"panel scrolls at "+at);
                Eq(innerW,rows.Width);True(rows.CardHeight>=54,"cards too short at "+at);
                W20PanelRows(rows,36,at);
                True(rows.Hint.Bottom<=innerH+.5f&&rows.Actions[3].Bottom<rows.Hint.y,"actions or result line below the fold at "+at);
            }
            // tablet landscape (44 px targets) also fits; a very short panel scrolls instead of squeezing
            var tablet=MatchLayout.For(1024,768,DeviceProfile.Tablet);var t=MatchPanelLayout.For(tablet.Panel.width-24,tablet.Panel.height-24,44);
            False(t.Scrolls);W20PanelRows(t,44,"tablet");
            var tiny=MatchPanelLayout.For(400,300,36);True(tiny.Scrolls&&tiny.ContentHeight>300,"short panel must scroll");Eq(378f,tiny.Width);Eq(54f,tiny.CardHeight);W20PanelRows(tiny,36,"tiny");
            // portrait (HP and turn are drawn above the board): no scoreboard rows
            var portrait=MatchPanelLayout.For(700,300,44,false);False(portrait.Scoreboard);Eq(0f,portrait.Turn.height);Eq(0f,portrait.Hp1.height);W20PanelRows(portrait,44,"portrait");
            // more height goes to the cards first, then to the result line; never to hidden space
            var roomy=MatchPanelLayout.For(496,964,36);Eq(112f,roomy.CardHeight);True(roomy.Hint.height>50&&roomy.ContentHeight<=964);
        });
        Test("W20 board source: HP outside the ball, no P1/P2 text over balls, two passes, optional STOP mark, one theme",()=>{
            string dir=Path.Combine(projectRoot,"Assets/CoreClash/Presentation");
            string Code(string f)=>Regex.Replace(File.ReadAllText(Path.Combine(dir,f)),@"//[^\n]*","");
            string ball=Code("BallView.cs"),board=Code("BoardView.cs"),draw=Code("Draw.cs"),theme=Code("Theme.cs"),match=Code("MatchView.cs"),app=Code("CoreClashApp.cs");
            False(ball.Contains("OwnerMark("));False(ball.Contains("hpBox"));
            True(ball.Contains("BallBadges.Layout(")&&ball.Contains("public static void RenderBadges("),"ball badges do not use the shared layout");
            True(ball.Contains("Theme.P2RingSegments"),"ownership has no non-colour pattern");
            int bodies=board.IndexOf("BallView.Render(clippedBoard",StringComparison.Ordinal),badges=board.IndexOf("BallView.RenderBadges(clippedBoard",StringComparison.Ordinal);
            True(bodies>0&&badges>bodies,"plates must be drawn after every ball body");
            True(board.Contains("if(preview.Ready&&ShowStopEstimate)RenderStopEstimate(")&&board.Contains("public static bool ShowStopEstimate = true;"),"STOP mark is not optional");
            True(match.Contains("ToggleStopEstimate()")&&app.Contains("GetKeyDown(KeyCode.E))ToggleStopEstimate();"),"no control for the STOP mark");
            True(board.Contains("FeedbackLabels.Stack(")&&!board.Contains("labels.Any(r=>r.Overlaps(label))"),"overlapping feedback labels are still dropped");
            True(board.Contains("RenderTurnCue(")&&board.Contains("feedback.TurnBorn"),"turn cue does not come from the TURN stamp");
            True(draw.Contains("Cyan=Theme.P1")&&draw.Contains("Pink=Theme.P2")&&theme.Contains("public const float EffectStrength"),"colours are not centralised in Theme");
            True(match.Contains("MatchPanelLayout.For(")&&match.Contains("ActionSummary.For(state)"),"side panel does not use the fitted layout or the result line");
            // presentation only: none of the new files drives the simulation
            foreach(string file in new[]{"BallBadges.cs","FeedbackStyle.cs","Theme.cs","Glyphs.cs"})
                Eq(0,Regex.Matches(Code(file),@"\.(TryCommand|Step|Damage|Kill|DamageBase|Emit|Heal|Shield)\(").Count);
        });
    }
    static void W20PanelRows(MatchPanelLayout rows,float target,string at)
    {
        var all=new List<UiBox>{rows.Selected,rows.Heading,rows.Standard,rows.Hint};
        if(rows.Scoreboard){all.Add(rows.Turn);all.Add(rows.Hp1);all.Add(rows.Hp2);}
        all.AddRange(rows.Cards);all.AddRange(rows.Actions);
        var frame=new UiBox(0,0,rows.Width,rows.ContentHeight);
        foreach(var b in all)True(b.width>0&&b.height>0&&Inside(b,frame),"row outside the panel at "+at);
        for(int i=0;i<all.Count;i++)for(int j=i+1;j<all.Count;j++)False(Overlap(all[i],all[j]));
        True(rows.Standard.height>=target&&rows.Actions.All(a=>a.height>=target),"button below the target size at "+at);
        True(rows.Cards.All(c=>c.width>=96),"cards too narrow at "+at);
    }
}
