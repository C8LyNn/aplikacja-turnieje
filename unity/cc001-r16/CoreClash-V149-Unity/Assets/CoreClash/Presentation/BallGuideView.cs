using System;
using CoreClash.Core;
using CoreClash.Data;
using UnityEngine;
namespace CoreClash.Presentation
{
    // CC-001 W24: the ball card. One layout for every ball, so a player learns to read it once:
    //   1. a coloured banner: WHEN the power works (touch / stop / death / every turn / always);
    //   2. one or two plain sentences: WHAT happens;
    //   3. a short list: WHO is affected and the numbers that matter, next to a small picture
    //      of the board with the real reach of the power drawn to scale;
    //   4. one tip.
    // English and Polish. Text comes from BallGuide; nothing here reads or changes the rules.
    public sealed partial class CoreClashApp
    {
        const string GlyphTouch="+C -.48 .2 .42;+C .48 .2 .42;+L 0 -.96 0 -.52 .2;+L -.5 -.84 -.28 -.52 .17;+L .5 -.84 .28 -.52 .17";
        const string GlyphStop="+C .32 -.04 .52;+L -1 .78 1 .78 .24;+C -.42 .32 .15;+C -.74 .34 .11;+C -.98 .36 .08";
        const string GlyphDeath="+C 0 -.18 .7;+P -.42 .2 .42 .2 .42 .88 -.42 .88;-C -.3 -.16 .21;-C .3 -.16 .21;-L 0 .56 0 1 .13";
        const string GlyphTurn="+R 0 0 .7 .26;-P 0 0 1.25 -.62 1.25 .5;+P .28 -.36 1.06 -.36 .67 .2";
        const string GlyphAlways="+R -.42 0 .36 .22;+R .42 0 .36 .22";
        const string GlyphDamage="+P 0 -1 .24 0 0 1 -.24 0;+P -1 0 0 -.24 1 0 0 .24;+P -.68 -.68 .2 -.2 .68 .68 -.2 .2;+P .68 -.68 .2 .2 -.68 .68 -.2 -.2";
        const string GlyphHeal="+L 0 -.7 0 .7 .44;+L -.7 0 .7 0 .44";
        const string GlyphShield="+P -.72 -.8 .72 -.8 .72 .1 0 .92 -.72 .1";
        const string GlyphTime="+P -.62 -.82 .62 -.82 0 0;+P -.62 .82 .62 .82 0 0;+L -.74 -.88 .74 -.88 .2;+L -.74 .88 .74 .88 .2";
        const string GlyphCount="+L -.58 -.58 .58 .58 .32;+L .58 -.58 -.58 .58 .32";
        const string GlyphTip="+C 0 -.3 .56;+P -.3 .1 .3 .1 .3 .6 -.3 .6;-L -.34 .42 .34 .42 .1;+L -.16 .86 .16 .86 .2";
        const string GlyphRange="+R 0 0 .84 .2;+C 0 0 .3";

        public void SetLanguage(bool polish){Lang.Polish=polish;PlayerPrefs.SetString("cc.lang",polish?"pl":"en");PlayerPrefs.Save();Debug.Log("CORE_CLASH_LANGUAGE "+(polish?"pl":"en"));}
        void LoadLanguage(){string saved=PlayerPrefs.GetString("cc.lang","");Lang.Polish=saved.Length>0?saved=="pl":Application.systemLanguage==SystemLanguage.Polish;}

        // Balls of one group.
        const string GlyphGroup="+C 0 -.5 .4;+C -.5 .38 .4;+C .5 .38 .4";
        public static Color GroupColor(string id)
        {
            switch(id)
            {
                case "ice":return Draw.Hex("#1ea4d8");
                case "fire":return Draw.Hex("#f0711a");
                case "poison":return Draw.Hex("#a03fd0");
                case "magnet":return Draw.Hex("#4a5ae8");
                case "electric":return Draw.Hex("#d9a400");
                case "plant":return Draw.Hex("#3f9d1f");
                default:return Draw.Hex("#5b6aa0");
            }
        }
        static string WhenGlyph(GuideWhen when)=>when==GuideWhen.Touch?GlyphTouch:when==GuideWhen.Stop?GlyphStop:when==GuideWhen.Death?GlyphDeath:when==GuideWhen.Turn?GlyphTurn:GlyphAlways;
        // One colour per trigger, used on the banner, the reach picture and the tile label.
        static readonly Color WhenTouch=Draw.Hex("#f0711a"),WhenStop=Draw.Hex("#7a52f0"),WhenDeath=Draw.Hex("#3b2f63"),WhenTurn=Draw.Hex("#149a5e"),WhenAlways=Draw.Hex("#5b6aa0");
        static Color WhenColor(GuideWhen when)=>when==GuideWhen.Touch?WhenTouch:when==GuideWhen.Stop?WhenStop:when==GuideWhen.Death?WhenDeath:when==GuideWhen.Turn?WhenTurn:WhenAlways;
        static string FactGlyph(GuideFactKind kind)
        {
            switch(kind)
            {
                case GuideFactKind.Damage:return GlyphDamage;
                case GuideFactKind.Heal:return GlyphHeal;
                case GuideFactKind.Shield:return GlyphShield;
                case GuideFactKind.Time:return GlyphTime;
                case GuideFactKind.Fire:return Glyphs.Shape(StatusKind.Fire);
                case GuideFactKind.Ice:return Glyphs.Shape(StatusKind.Ice);
                case GuideFactKind.Poison:return Glyphs.Shape(StatusKind.Toxin);
                case GuideFactKind.Stuck:return Glyphs.Shape(StatusKind.Rooted);
                case GuideFactKind.Frozen:return Glyphs.Shape(StatusKind.Frozen);
                default:return GlyphCount;
            }
        }
        static Color FactColor(GuideFactKind kind)
        {
            switch(kind)
            {
                case GuideFactKind.Damage:return Theme.Damage;
                case GuideFactKind.Heal:return Theme.Heal;
                case GuideFactKind.Shield:return Theme.Shield;
                case GuideFactKind.Time:return Theme.SelectInk;
                case GuideFactKind.Fire:return Theme.Status(StatusKind.Fire);
                case GuideFactKind.Ice:return Theme.Status(StatusKind.Ice);
                case GuideFactKind.Poison:return Theme.Status(StatusKind.Toxin);
                case GuideFactKind.Stuck:return Theme.Status(StatusKind.Rooted);
                case GuideFactKind.Frozen:return Theme.Status(StatusKind.Frozen);
                default:return Theme.Info;
            }
        }
        // PL | EN: the active half is filled.
        void LanguageSwitch(Rect r)
        {
            float half=(r.width-6)/2;
            if(Draw.Button(new Rect(r.x,r.y,half,r.height),"PL",Theme.Info,Lang.Polish,true,13)&&!Lang.Polish)SetLanguage(true);
            if(Draw.Button(new Rect(r.x+half+6,r.y,half,r.height),"EN",Theme.Info,!Lang.Polish,true,13)&&Lang.Polish)SetLanguage(false);
        }

        // Tile label: the trigger symbol and one or two words, centred in r. Nothing for a ball without a guide.
        void GuideTag(Rect r,string id,int size,bool enabled=true)
        {
            var guide=BallGuide.For(id);if(guide==null)return;
            string text=guide.Tag;float icon=size+3,textW=Mathf.Min(r.width-icon-4,Draw.TextWidth(text,size,true)),x=r.x+(r.width-icon-4-textW)/2;
            Color tone=enabled?WhenColor(guide.When):Theme.Disabled;
            Glyphs.Paint(new Rect(x,r.y+(r.height-icon)/2,icon,icon),WhenGlyph(guide.When),tone);
            Draw.Text(new Rect(x+icon+4,r.y,textW+2,r.height),text,size,enabled?Color.Lerp(tone,Theme.Ink,.35f):Theme.Disabled,TextAnchor.MiddleLeft,true);
        }

        // One line: the trigger symbol, then "When it stops: blast". Left aligned. A ball without a
        // guide entry keeps its older cue text.
        void GuideLine(Rect r,string id,int size)
        {
            var guide=BallGuide.For(id);if(guide==null){Draw.Text(r,Cue(id),size,Theme.Muted,TextAnchor.MiddleLeft);return;}
            Color tone=WhenColor(guide.When);float icon=size+3;
            Glyphs.Paint(new Rect(r.x,r.y+(r.height-icon)/2,icon,icon),WhenGlyph(guide.When),tone);
            // One line, always: the whole sentence when it fits, in smaller type when that is enough,
            // and only what the ball does when it is not (the sign in front already says WHEN).
            float room=r.width-icon-5;string line=BallGuide.WhenText(guide.When)+": "+guide.Tag.ToLowerInvariant();int type=size;
            if(Draw.TextWidth(line,type,true)>room&&Draw.TextWidth(line,type-1,true)<=room)type--;
            if(Draw.TextWidth(line,type,true)>room){line=guide.Tag;type=size;}
            Draw.Text(new Rect(r.x+icon+5,r.y,room,r.height),line,type,Color.Lerp(tone,Theme.Ink,.35f),TextAnchor.MiddleLeft,true);
        }

        void RenderInfo()
        {
            var current=inspectBallId>0?BallInspection.Read(Simulation.State,inspectBallId):null;
            var d=Catalog.Ball(current?.Type??inspect);if(d==null){CloseBallDetails();return;}
            var guide=BallGuide.For(d.id);
            int owner=current?.Owner??(setup&&builder?builderOwner:setup?0:Simulation.State.turn);
            Draw.Rect(new Rect(0,0,UiWidth,UiHeight),Theme.A(Theme.Scrim,.74f));
            // "low" = a landscape phone: a wide card, with the buttons in the header instead of a footer.
            bool phone=UiWidth<500,low=UiHeight<500;
            float w=Math.Min(low?720:560,UiWidth-(phone?20:32)),pad=phone?16:26,inner=w-pad*2,head=low?66:phone?88:104,foot=low?4:68;
            float content=GuideContent(d,guide,current,owner,inner,false);
            float h=Math.Min(UiHeight-(low?20:phone?36:72),head+content+foot+8),x=(UiWidth-w)/2,y=(UiHeight-h)/2;
            var card=new Rect(x,y,w,h);
            Draw.Card(card,null,null,.4f);
            float orb=low?44:phone?56:72;
            BallView.Preview(new Rect(x+pad+6,y+(head-orb)/2+2,orb,orb),d,owner,true);
            float tx=x+pad+orb+24,tw=x+w-pad-tx-(low?232:0);
            string name=BallIcons.Name(d);
            Draw.Text(new Rect(tx,y+(low?6:phone?14:18),tw,low?30:phone?34:40),name,low?21:phone?(name.Length>12?21:25):31,Theme.Text,TextAnchor.MiddleLeft,true);
            string sub=current!=null?Lang.T("Player ","Gracz ")+(current.Owner+1)+"  ·  "+current.Hp+" / "+current.MaxHp+" HP"
                :inspectBallId>0?Lang.T("No longer on the board","Nie ma jej już na planszy")
                :d.hp+" HP  ·  "+(d.stockCopies<0?Lang.T("no limit","bez limitu"):d.stockCopies+Lang.T(" in a deck"," w talii"))+(d.size=="large"?Lang.T("  ·  big","  ·  duża"):"");
            Draw.Text(new Rect(tx,y+(low?35:phone?48:58),tw,24),sub,phone||low?13:15,Draw.Gold,TextAnchor.MiddleLeft,true);
            infoScroll=Draw.ScrollView(new Rect(x+pad,y+head,inner+8,h-head-foot-(low?8:0)),infoScroll,new Rect(0,0,inner,content));
            GuideContent(d,guide,current,owner,inner,true);
            GUI.EndScrollView();
            if(low)
            {
                LanguageSwitch(new Rect(x+w-pad-222,y+11,104,46));
                if(Draw.Button(new Rect(x+w-pad-108,y+11,108,46),Lang.T("Got it","Rozumiem"),Go,true,true,14))CloseBallDetails();
            }
            else
            {
                float fy=y+h-foot+8;
                LanguageSwitch(new Rect(x+pad,fy,112,50));
                if(Draw.Button(new Rect(x+pad+124,fy,inner-124,50),Lang.T("Got it","Rozumiem"),Go,true,true,phone?15:16))CloseBallDetails();
            }
            // A tap outside the card closes it as well.
            var e=Event.current;if(e.type==EventType.MouseDown&&!card.Contains(Draw.Mouse)){CloseBallDetails();e.Use();}
        }

        float GuideContent(BallDefinition d,BallGuideEntry guide,BallInspection current,int owner,float width,bool draw)
        {
            float y=0;bool phone=UiWidth<500;
            if(inspectBallId>0)y=StateSection(current,width,draw,y);
            if(guide==null)return LegacyContent(d,width,draw,y);

            // 1. WHEN.
            Color tone=WhenColor(guide.When);const float bannerH=48;
            if(draw)
            {
                Draw.Plate(new Rect(0,y,width,bannerH),tone,Theme.Ink,Theme.Ink,2,2);
                Glyphs.Paint(new Rect(14,y+9,26,26),WhenGlyph(guide.When),Theme.OnColor);
                Draw.Text(new Rect(52,y,width-60,bannerH-4),BallGuide.WhenText(guide.When),phone?17:19,Theme.OnColor,TextAnchor.MiddleLeft,true);
            }
            y+=bannerH+12;

            // The show: on a wide card it stands to the right of the text, on a phone under the sentence.
            var script=BallDemos.For(guide.Id);
            bool side=script!=null&&width>=470;
            float stageW=script==null?0:side?Mathf.Min(300,width*.46f):width,stageH=script==null?0:BoardView.StageHeight(stageW-6,script.Top,script.Bottom)+6;
            float column=side?width-stageW-18:width,top=y;

            // 2. WHAT.
            int size=phone?17:19;float textH=Draw.TextHeight(guide.Does,column,size);
            if(draw)Draw.Text(new Rect(0,y,column,textH),guide.Does,size,Theme.Text);
            y+=textH+12;
            if(script!=null&&!side)
            {
                if(draw)DemoStage(new Rect(3,y+3,stageW-6,stageH-6),script);
                y+=stageH+12;
            }

            // 3. WHO and the numbers.
            y+=FactRow(0,y,column,null,BallGuide.WhoText(guide.Who),tone,draw,guide.Who,owner);
            foreach(var fact in guide.Facts)y+=FactRow(0,y,column,FactGlyph(fact.Kind),fact.Text,FactColor(fact.Kind),draw);
            if(guide.Range>0)y+=FactRow(0,y,column,GlyphRange,BallGuide.RangeText(guide.Range),tone,draw);
            // The group the ball belongs to; what the group does together is said in the tip box below.
            var group=BallGroups.Of(guide.Id);
            if(group!=null)y+=FactRow(0,y,column,GlyphGroup,Lang.T("Group: ","Grupa: ")+group.Name,GroupColor(group.Id),draw);
            if(side)
            {
                if(draw)DemoStage(new Rect(width-stageW+3,top+3,stageW-6,stageH-6),script);
                y=Mathf.Max(y,top+stageH);
            }
            y+=10;

            // 4. Tip.
            if(!string.IsNullOrEmpty(guide.Tip))
            {
                float tipW=width-54,tipH=Mathf.Max(30,Draw.TextHeight(guide.Tip,tipW,14,true)),box=tipH+18;
                if(draw)
                {
                    Draw.Round(new Rect(0,y,width,box),Color.Lerp(Theme.Panel,Theme.Select,.2f));
                    Glyphs.Paint(new Rect(14,y+(box-22)/2,22,22),GlyphTip,Theme.SelectInk);
                    Draw.Text(new Rect(46,y+9,tipW,tipH),guide.Tip,14,Theme.TextSoft,TextAnchor.MiddleLeft,true);
                }
                y+=box+6;
            }
            return y;
        }

        // One line of the fact list: a tinted square with a symbol, then the text. Returns its height;
        // a text too long for the column wraps to a second line instead of being cut.
        float FactRow(float x,float y,float width,string glyph,string text,Color tone,bool draw,GuideWho who=GuideWho.Self,int owner=-1)
        {
            int size=UiWidth<500?14:15;float height=Mathf.Max(34,Draw.TextHeight(text,width-40,size,true)+8);
            if(!draw)return height;
            var r=new Rect(x,y,width,height);
            var box=new Rect(r.x,r.y+3,28,28);
            Draw.Chip(box,Color.Lerp(Theme.Panel,tone,.2f));
            if(glyph!=null)Glyphs.Paint(new Rect(box.x+6,box.y+6,16,16),glyph,Color.Lerp(tone,Theme.Ink,.2f));
            else
            {
                // WHO: your colour on the left, the opponent's on the right; the side the power ignores is grey.
                Color mine=Theme.Team(owner<0?0:owner),theirs=Theme.Team(owner<0?1:1-owner),off=Theme.Disabled;
                if(who==GuideWho.Self){Draw.Circle(new Rect(box.center.x-8,box.center.y-8,16,16),Theme.Ink);Draw.Circle(new Rect(box.center.x-6,box.center.y-6,12,12),mine);}
                else
                {
                    Draw.Circle(new Rect(box.x+3,box.center.y-6,12,12),who==GuideWho.Enemies?off:mine);
                    Draw.Circle(new Rect(box.xMax-15,box.center.y-6,12,12),who==GuideWho.Allies?off:theirs);
                }
            }
            Draw.Text(new Rect(r.x+38,r.y,r.width-40,r.height),text,size,Theme.Text,TextAnchor.MiddleLeft,true);
            return height;
        }

        // The show: a short scene played by a private copy of the rules (BallDemo) and drawn like the
        // real board. It advances once per drawn frame and starts over a moment after it ends.
        const float DemoSpeed=1.5f,DemoRest=1.5f;
        BallDemoPlayer demo;Fx.Stage demoFx;FeedbackTimeline demoFeedback;float demoClock,demoDoneAt;
        public bool DemoRunning=>demo!=null;
        public float DemoElapsed=>demo==null?0:demo.Elapsed;
        void DemoStage(Rect rect,BallDemoScript script)
        {
            float now=Time.unscaledTime;
            if(demo==null||demo.Script!=script||(demo.Finished&&demoDoneAt>=0&&now-demoDoneAt>DemoRest))
            {
                demo=new BallDemoPlayer(Catalog,script);demoFx=new Fx.Stage();demoFeedback=new FeedbackTimeline();demoClock=now;demoDoneAt=-1;
            }
            if(Event.current.type==EventType.Repaint)
            {
                demo.Advance(Mathf.Clamp(now-demoClock,0,.1f)*DemoSpeed);demoClock=now;
                demoFeedback.Observe(demo.Simulation.State,now);
                if(demo.Finished&&demoDoneAt<0)demoDoneAt=now;
            }
            Draw.Round(new Rect(rect.x-3,rect.y-3,rect.width+6,rect.height+6),Theme.Ink);
            BoardView.RenderStage(rect,demo.Simulation,demoFeedback,demoFx,script.Top,script.Bottom,demo.Lead);
            // A thin line along the bottom shows how far the show has run before it starts over.
            float length=BallDemos.Length(Catalog,script),done=length>0?Mathf.Clamp01(demo.Elapsed/length):0;
            Draw.Rect(new Rect(rect.x,rect.yMax-4,rect.width,4),Theme.A(Theme.Ink,.25f));
            Draw.Rect(new Rect(rect.x,rect.yMax-4,rect.width*done,4),Theme.Select);
        }

        // Deck guide: the nine balls of a deck as a list - symbol of WHEN, name, short label.
        // A row opens the full card; closing the card returns here.
        DeckDefinition deckGuide;int deckGuideOwner;Vector2 deckGuideScroll;
        void OpenDeckGuide(DeckDefinition deck,int owner=0){if(deck==null||deck.balls==null)return;deckGuide=deck;deckGuideOwner=owner;deckGuideScroll=Vector2.zero;Debug.Log("CORE_CLASH_DECK_GUIDE "+deck.id);}
        public void ShowDeckGuide(string id){OpenDeckGuide(Catalog.Deck(id));}
        public void CloseDeckGuide(){deckGuide=null;}
        void RenderDeckGuide()
        {
            Draw.Rect(new Rect(0,0,UiWidth,UiHeight),Theme.A(Theme.Scrim,.74f));
            bool phone=UiWidth<500,low=UiHeight<500;var balls=deckGuide.balls;
            float w=Math.Min(low?720:520,UiWidth-(phone?20:32)),pad=phone?14:22,inner=w-pad*2,head=60,foot=low?4:68,rowH=phone||low?54:58;
            int columns=low?2:1;float colW=(inner-(columns-1)*8)/columns;
            float content=(float)Math.Ceiling(balls.Length/(float)columns)*rowH,h=Math.Min(UiHeight-(low?20:phone?36:72),head+content+foot+8),x=(UiWidth-w)/2,y=(UiHeight-h)/2;
            var card=new Rect(x,y,w,h);Draw.Card(card,null,null,.4f);
            Color accent=DeckAccent(deckGuide);
            var deckFace=Draw.CardFace(card);Draw.Round(new Rect(deckFace.x,deckFace.y,deckFace.width,head-8),accent,Draw.CardCorner);
            Draw.Text(new Rect(x+pad+2,y+3,inner-(low?232:0),head-8),DeckName(deckGuide),phone?18:21,Theme.OnColor,TextAnchor.MiddleLeft,true);
            deckGuideScroll=Draw.ScrollView(new Rect(x+pad,y+head,inner+8,h-head-foot-(low?8:0)),deckGuideScroll,new Rect(0,0,inner,content));
            for(int i=0;i<balls.Length;i++)
            {
                var d=Catalog.Ball(balls[i]);if(d==null)continue;var guide=BallGuide.For(d.id);
                var row=new Rect((i%columns)*(colW+8),(i/columns)*rowH,colW,rowH-6);
                bool hover=GUI.enabled&&row.Contains(Draw.Mouse);
                Draw.Round(row,hover?Theme.PanelRaised:Theme.PanelLight);
                BallView.Preview(new Rect(row.x+8,row.y+(row.height-36)/2,36,36),d,deckGuideOwner);
                Draw.Text(new Rect(row.x+54,row.y+3,row.width-90,22),BallIcons.Name(d),phone?15:16,Theme.Text,TextAnchor.MiddleLeft,true);
                if(guide!=null)GuideLine(new Rect(row.x+54,row.y+24,row.width-92,20),d.id,12);
                var more=new Rect(row.xMax-34,row.y+(row.height-24)/2,24,24);
                Draw.Circle(more,Theme.Info);Glyphs.Paint(new Rect(more.x+6,more.y+6,12,12),IconInfo,Theme.OnColor);
                if(Draw.Hit(row))ShowBallDetails(d.id);
            }
            GUI.EndScrollView();
            if(low)
            {
                LanguageSwitch(new Rect(x+w-pad-222,y+7,104,44));
                if(Draw.Button(new Rect(x+w-pad-108,y+7,108,44),Lang.T("Close","Zamknij"),Go,true,true,14))deckGuide=null;
            }
            else
            {
                float fy=y+h-foot+8;
                LanguageSwitch(new Rect(x+pad,fy,112,50));
                if(Draw.Button(new Rect(x+pad+124,fy,inner-124,50),Lang.T("Close","Zamknij"),Go,true,true,phone?15:16))deckGuide=null;
            }
            var e=Event.current;if(GUI.enabled&&e.type==EventType.MouseDown&&!card.Contains(Draw.Mouse)){deckGuide=null;e.Use();}
        }

        // What is on this particular ball right now (opened from the board).
        float StateSection(BallInspection current,float width,bool draw,float y)
        {
            string title=Lang.T("ON THE BOARD NOW","TERAZ NA PLANSZY");
            if(draw)Draw.Text(new Rect(0,y,width,16),title,11,Draw.Cyan,TextAnchor.MiddleLeft,true);
            y+=22;
            if(current==null||!current.OnBoard)y=StateLine(null,StatusKind.Counter,Lang.T("This ball is no longer on the board.","Tej kulki nie ma już na planszy."),width,draw,y);
            else if(current.States.Length==0)y=StateLine(null,StatusKind.Counter,Lang.T("Nothing is affecting it right now.","Nic na nią teraz nie działa."),width,draw,y);
            else foreach(var state in current.States)y=StateLine(state,state.Kind,StateText(state),width,draw,y);
            if(draw)Draw.Rect(new Rect(0,y+4,width,2),Theme.Edge);
            return y+18;
        }
        float StateLine(BallStateLabel state,StatusKind kind,string text,float width,bool draw,float y)
        {
            float indent=state==null?0:28,height=Draw.TextHeight(text,width-indent,15);
            if(draw){if(state!=null)Glyphs.Paint(new Rect(0,y+1,18,18),kind,Theme.Status(kind));Draw.Text(new Rect(indent,y,width-indent,height),text,15,state==null?Draw.Muted:Theme.Text);}
            return y+height+6;
        }
        // Plain words for the states the active roster can produce; anything else keeps its own label.
        static string StateText(BallStateLabel state)
        {
            int n;int.TryParse(state.Short,out n);
            switch(state.Kind)
            {
                case StatusKind.Fire:return Lang.T("On fire: loses "+n*5+" HP each turn","Płonie: traci "+n*5+" HP co turę");
                case StatusKind.Ice:return Lang.T("Chilled "+n+" of 3 (3 = frozen)","Mróz "+n+" z 3 (3 = zamrożenie)");
                case StatusKind.Toxin:return Lang.T("Poisoned: loses 5 HP each turn ("+n+(n==1?" more turn)":" more turns)"),"Zatruta: traci 5 HP co turę (jeszcze "+n+(n==1?" tura)":n<5?" tury)":" tur)"));
                case StatusKind.Frozen:return Lang.T("Frozen: cannot move","Zamrożona: nie może się ruszyć");
                case StatusKind.Rooted:return Lang.T("Stuck in a web until its turn ends","Uwięziona w sieci do końca swojej tury");
                case StatusKind.Shield:return Lang.T("Shield: "+n,"Tarcza: "+n);
                case StatusKind.Divine:return Lang.T("Will block the next collision","Zablokuje najbliższe zderzenie");
                case StatusKind.Armed:return Lang.T("Armed: explodes when an enemy touches it","Uzbrojona: wybuchnie, gdy dotknie jej wróg");
                case StatusKind.Fuse:return Lang.T("Explodes in "+n+(n==1?" turn":" turns")+" of its owner","Wybuchnie za "+n+(n==1?" turę":" tury")+" swojego gracza");
                default:return state.Text;
            }
        }
    }
}
