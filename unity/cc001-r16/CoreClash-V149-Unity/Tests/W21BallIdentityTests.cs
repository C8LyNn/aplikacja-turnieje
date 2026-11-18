using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using CoreClash.Core;
using CoreClash.Presentation;

// CC-001 W21 (ball identity): icons and short names for the first 24 balls, the
// segmented HP ring and the owner pip. Presentation only: no id, rule, physics or
// protocol value changes.
public static partial class Program
{
    static void W21BallIdentityTests()
    {
        Test("W21 icon batch: 24 catalog ids, valid distinct shape lists, catalog untouched",()=>{
            var ids=BallIcons.Ids.ToArray();
            Eq(BallIcons.BatchSize,ids.Length);
            foreach(string id in ids)
            {
                True(catalog.Ball(id)!=null,"icon for an id that is not in the catalog: "+id);
                True(BallIcons.Valid(BallIcons.Spec(id)),"malformed shape list: "+id);
            }
            Eq(ids.Length,ids.Select(BallIcons.Spec).Distinct(StringComparer.Ordinal).Count());
            // the two decks a first match opens with, plus Standard, are fully covered
            foreach(string deck in new[]{"featured_status_reactor","featured_gravity_trap"})
                foreach(string id in catalog.Deck(deck).balls)True(BallIcons.Has(id),deck+" ball without an icon: "+id);
            True(BallIcons.Has("normal"));
            // a ball outside the batch keeps its letter mark and catalog name
            var other=catalog.Data.balls.First(b=>!BallIcons.Has(b.id));
            True(BallIcons.Spec(other.id)==null);Eq(other.name,BallIcons.Name(other));
            True(BallIcons.Spec(null)==null&&BallIcons.Spec("missing")==null);Eq("",BallIcons.Name(null));
            False(BallIcons.Valid(""));False(BallIcons.Valid("+C 0 0"));False(BallIcons.Valid("-C 0 0 .5"));False(BallIcons.Valid("+X 0 0 1"));False(BallIcons.Valid("+P 0 0 1 1 0"));False(BallIcons.Valid("+C 0 0 nan"));
            Eq(227,catalog.Data.balls.Length);
        });
        Test("W21 display names: short, unique across the catalog, ids and catalog names unchanged",()=>{
            var shown=catalog.Data.balls.Select(BallIcons.Name).ToArray();
            Eq(shown.Length,shown.Distinct(StringComparer.OrdinalIgnoreCase).Count());
            int renamed=0;
            foreach(var ball in catalog.Data.balls)
            {
                string name=BallIcons.Name(ball);
                if(name==ball.name)continue;
                renamed++;
                True(BallIcons.Has(ball.id),"rename outside the icon batch: "+ball.id);
                True(name.Length<=10,"new name is too long for a card: "+ball.id);
                True(name.Split(' ').All(word=>word.Length<=9),"word too long for a card: "+name);
            }
            True(renamed>0&&renamed<=BallIcons.BatchSize);
            Eq("Portal",BallIcons.Name(catalog.Ball("gatekeeper")));Eq("Gatekeeper",catalog.Ball("gatekeeper").name);
            Eq("Standard",BallIcons.Name(catalog.Ball("normal")));
        });
        Test("W21 HP ring: one segment per 5 HP, lit segments follow current HP",()=>{
            Eq(6,BallBadges.HpSegments(30));Eq(7,BallBadges.HpSegments(35));Eq(11,BallBadges.HpSegments(55));Eq(4,BallBadges.HpSegments(20));Eq(1,BallBadges.HpSegments(0));Eq(1,BallBadges.HpSegments(3));
            Eq(6,BallBadges.HpLit(30,30));Eq(5,BallBadges.HpLit(25,30));Eq(5,BallBadges.HpLit(21,30));Eq(1,BallBadges.HpLit(1,30));Eq(0,BallBadges.HpLit(0,30));Eq(0,BallBadges.HpLit(-5,30));
            // healed above the type's pool: the ring is full, the plate still shows the exact number
            Eq(6,BallBadges.HpLit(45,30));
            // very large pools use 10 HP segments instead of unreadable slivers
            Eq(10,BallBadges.HpUnit(100));Eq(10,BallBadges.HpSegments(100));Eq(5,BallBadges.HpLit(41,100));Eq(5,BallBadges.HpUnit(60));Eq(12,BallBadges.HpSegments(60));
            foreach(var ball in catalog.Data.balls)True(BallBadges.HpSegments(ball.hp)>=1&&BallBadges.HpSegments(ball.hp)<=12,"too many segments: "+ball.id);
            for(int max=1;max<=120;max++)for(int hp=0;hp<=max;hp++)
            {
                int lit=BallBadges.HpLit(hp,max),all=BallBadges.HpSegments(max);
                True(lit>=0&&lit<=all&&(hp>0)==(lit>0)&&(hp==max?lit==all:true),"ring wrong at "+hp+"/"+max);
                if(hp>0)True(BallBadges.HpLit(hp-1,max)<=lit,"ring not monotonic at "+hp+"/"+max);
            }
        });
        Test("W21 owner pip: own balls point up, opponent's down, in both seats; rows never sit on the pip",()=>{
            Eq(-1,BallBadges.PipSide(0,0));Eq(1,BallBadges.PipSide(1,0));Eq(-1,BallBadges.PipSide(1,1));Eq(1,BallBadges.PipSide(0,1));
            var chips=new[]{W20Chip(StatusKind.Fire,"2"),W20Chip(StatusKind.Toxin,"3")};
            int cases=0;
            foreach(float scale in new[]{.4f,.565f,.7f,.86f,1f,1.3f,1.62f,2.4f})
            foreach(float worldRadius in new[]{17.5f,21.25f,25f})
            foreach(int pip in new[]{-1,1})
            foreach(int count in new[]{0,2})
            {
                var field=new UiBox(0,0,491.4f*scale,868*scale);float r=worldRadius*scale;
                foreach(var (cx,cy) in new[]{(field.width/2,field.height/2),(field.width/2,field.height-r-1),(field.width/2,r+1),(r+1,field.height/2)})
                {
                    var l=BallBadges.Layout(cx,cy,r,scale,30,10,chips.Take(count).ToArray(),true,true,field,pip);cases++;
                    float size=BallBadges.PipSize(scale),far=r+BallBadges.RingOut(scale)+BallBadges.PipOut(scale);
                    var mark=new UiBox(cx-size*.5f,pip<0?cy-far:cy+far-size,size,size);
                    string at=$"scale {scale} r {worldRadius} pip {pip} chips {count} at {cx:0},{cy:0}";
                    foreach(var box in W20Boxes(l))True(!BoardLabelLayout.Overlaps(mark,box),"plate on the owner pip: "+at);
                    True(mark.x>=l.Bounds.x-.01f&&mark.Right<=l.Bounds.Right+.01f&&mark.y>=l.Bounds.y-.01f&&mark.Bottom<=l.Bounds.Bottom+.01f,"bounds miss the pip: "+at);
                    // the same plates without a pip are never further from the ball
                    var plain=BallBadges.Layout(cx,cy,r,scale,30,10,chips.Take(count).ToArray(),true,true,field);
                    True(Math.Abs(l.Hp.y-cy)>=Math.Abs(plain.Hp.y-cy)-.001f||l.Above!=plain.Above,"pip pulled the plate closer: "+at);
                }
            }
            True(cases>300);
            // keep-outs include the pip of the seat that is looking at the board
            var ball=new BallRuntime{id=1,owner=1,type="normal",radius=21.25f,hp=30,maxHp=30};
            var f=new UiBox(0,0,540,900);
            True(BallBadges.Layout(ball,270,450,1,false,f,0).Hp.y>BallBadges.Layout(ball,270,450,1,false,f,1).Hp.y,"opponent's plate does not clear the pip");
        });
        Test("W21 source: icons, HP ring and pip are drawn by BallView; names go through BallIcons; nothing drives the simulation",()=>{
            string dir=Path.Combine(projectRoot,"Assets/CoreClash/Presentation");
            string Code(string f)=>Regex.Replace(File.ReadAllText(Path.Combine(dir,f)),@"//[^\n]*","");
            string ball=Code("BallView.cs"),match=Code("MatchView.cs"),details=Code("DetailsView.cs"),setup=Code("SetupView.cs"),board=Code("BoardView.cs");
            True(ball.Contains("BallIcons.Spec(")&&ball.Contains("Glyphs.Paint(box, spec"),"ball body does not draw the icon");
            True(ball.Contains("Draw.Segments(")&&ball.Contains("BallBadges.HpSegments(ball.maxHp)")&&ball.Contains("BallBadges.HpLit(ball.hp, ball.maxHp)"),"HP ring is not driven by current HP");
            True(ball.Contains("OwnerPip(")&&ball.Contains("BallBadges.PipSide(ball.owner, localOwner)"),"ownership has no non-colour cue");
            True(ball.Contains("ball.hp.ToString()"),"exact HP number is gone");
            True(!Regex.IsMatch(match+details,@"\bd\.name\b|Ball\((selected|id)\)\.name"),"a card or the details view still shows the raw catalog name");
            True(setup.Contains("BallIcons.Name(d)")&&board.Contains("BallIcons.Name("));
            foreach(string file in new[]{"BallIcons.cs","BallView.cs"})
                Eq(0,Regex.Matches(Code(file),@"\.(TryCommand|Step|Damage|Kill|DamageBase|Emit|Heal|Shield)\(").Count);
            // ids stay the catalog's: the table has no way to change them
            False(Code("BallIcons.cs").Contains(".id="));
        });
    }
}
