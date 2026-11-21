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

        void RenderInfo()
        {
            var current=inspectBallId>0?BallInspection.Read(Simulation.State,inspectBallId):null;
            var d=Catalog.Ball(current?.Type??inspect);if(d==null){CloseBallDetails();return;}
            var guide=BallGuide.For(d.id);
            int owner=current?.Owner??(setup&&builder?builderOwner:setup?0:Simulation.State.turn);
            Draw.Rect(new Rect(0,0,UiWidth,UiHeight),Theme.A(Theme.Scrim,.74f));
            bool phone=UiWidth<500;
            float w=Math.Min(560,UiWidth-(phone?20:32)),pad=phone?16:26,inner=w-pad*2,head=phone?88:104,foot=68;
            float content=GuideContent(d,guide,current,owner,inner,false);
            float h=Math.Min(UiHeight-(phone?36:72),head+content+foot+8),x=(UiWidth-w)/2,y=(UiHeight-h)/2;
            var card=new Rect(x,y,w,h);
            Draw.Card(card,null,null,.4f);
            float orb=phone?56:72;
            BallView.Preview(new Rect(x+pad+6,y+(head-orb)/2+2,orb,orb),d,owner,true);
            float tx=x+pad+orb+24,tw=x+w-pad-tx;
            string name=BallIcons.Name(d);
            Draw.Text(new Rect(tx,y+(phone?14:18),tw,phone?34:40),name,phone?(name.Length>12?21:25):31,Theme.Text,TextAnchor.MiddleLeft,true);
            string sub=current!=null?Lang.T("Player ","Gracz ")+(current.Owner+1)+"  ·  "+current.Hp+" / "+current.MaxHp+" HP"
                :inspectBallId>0?Lang.T("No longer on the board","Nie ma jej już na planszy")
                :d.hp+" HP  ·  "+(d.stockCopies<0?Lang.T("no limit","bez limitu"):d.stockCopies+Lang.T(" in a deck"," w talii"))+(d.size=="large"?Lang.T("  ·  big","  ·  duża"):"");
            Draw.Text(new Rect(tx,y+(phone?48:58),tw,24),sub,phone?13:15,Draw.Gold,TextAnchor.MiddleLeft,true);
            infoScroll=Draw.ScrollView(new Rect(x+pad,y+head,inner+8,h-head-foot),infoScroll,new Rect(0,0,inner,content));
            GuideContent(d,guide,current,owner,inner,true);
            GUI.EndScrollView();
            float fy=y+h-foot+8;
            LanguageSwitch(new Rect(x+pad,fy,112,50));
            if(Draw.Button(new Rect(x+pad+124,fy,inner-124,50),Lang.T("Got it","Rozumiem"),Go,true,true,phone?15:16))CloseBallDetails();
            // A tap outside the card closes it as well.
            var e=Event.current;if(e.type==EventType.MouseDown&&!card.Contains(e.mousePosition)){CloseBallDetails();e.Use();}
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
                Draw.Round(new Rect(0,y,width,bannerH),Theme.Ink);Draw.Round(new Rect(2,y+2,width-4,bannerH-6),tone);
                Glyphs.Paint(new Rect(14,y+9,26,26),WhenGlyph(guide.When),Theme.OnColor);
                Draw.Text(new Rect(52,y,width-60,bannerH-4),BallGuide.WhenText(guide.When),phone?17:19,Theme.OnColor,TextAnchor.MiddleLeft,true);
            }
            y+=bannerH+12;

            // 2. WHAT.
            int size=phone?17:19;float textH=Draw.TextHeight(guide.Does,width,size);
            if(draw)Draw.Text(new Rect(0,y,width,textH),guide.Does,size,Theme.Text);
            y+=textH+12;

            // 3. WHO and the numbers; the reach picture sits to the right when the power has a reach.
            bool picture=guide.Range>0;float pictureW=phone?78:90,pictureH=pictureW/.6f,listW=picture?width-pictureW-14:width,top=y;
            y+=FactRow(0,y,listW,null,BallGuide.WhoText(guide.Who),tone,draw,guide.Who,owner);
            foreach(var fact in guide.Facts)y+=FactRow(0,y,listW,FactGlyph(fact.Kind),fact.Text,FactColor(fact.Kind),draw);
            if(picture)y+=FactRow(0,y,listW,GlyphRange,BallGuide.RangeText(guide.Range),tone,draw);
            if(picture)
            {
                if(draw)RangePicture(new Rect(width-pictureW,top,pictureW,pictureH),guide,owner);
                y=Mathf.Max(y,top+pictureH);
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

        // The board in miniature (540 x 900), your zone at the bottom, with the reach of the power to scale.
        void RangePicture(Rect r,BallGuideEntry guide,int owner)
        {
            Draw.Round(r,Theme.Ink);var floor=Draw.Inset(r,2.5f);Draw.Round(floor,Theme.FloorCentre);
            float scale=floor.width/540f,zone=198*scale;
            Draw.Chip(new Rect(floor.x+2,floor.y+2,floor.width-4,zone-2),Theme.A(Theme.Team(1-owner),.3f));
            Draw.Chip(new Rect(floor.x+2,floor.yMax-zone,floor.width-4,zone-2),Theme.A(Theme.Team(owner),.3f));
            var centre=floor.center;float reach=guide.Range*scale,ball=Mathf.Max(3.2f,21.25f*scale);Color tone=WhenColor(guide.When);
            Draw.Circle(new Rect(centre.x-reach,centre.y-reach,reach*2,reach*2),Theme.A(tone,.3f));
            Draw.Ring(centre,reach,tone,2f);
            Draw.Circle(new Rect(centre.x-ball-1.5f,centre.y-ball-1.5f,ball*2+3,ball*2+3),Theme.Ink);
            Draw.Circle(new Rect(centre.x-ball,centre.y-ball,ball*2,ball*2),Theme.Team(owner));
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
            bool phone=UiWidth<500;var balls=deckGuide.balls;
            float w=Math.Min(520,UiWidth-(phone?20:32)),pad=phone?14:22,inner=w-pad*2,head=60,foot=68,rowH=phone?54:58;
            float content=balls.Length*rowH,h=Math.Min(UiHeight-(phone?36:72),head+content+foot+8),x=(UiWidth-w)/2,y=(UiHeight-h)/2;
            var card=new Rect(x,y,w,h);Draw.Card(card,null,null,.4f);
            Color accent=DeckAccent(deckGuide);
            Draw.Round(new Rect(x+3,y+3,w-6,head-8),accent);
            Draw.Text(new Rect(x+pad+2,y+3,inner,head-8),DeckName(deckGuide),phone?18:21,Theme.OnColor,TextAnchor.MiddleLeft,true);
            deckGuideScroll=Draw.ScrollView(new Rect(x+pad,y+head,inner+8,h-head-foot),deckGuideScroll,new Rect(0,0,inner,content));
            for(int i=0;i<balls.Length;i++)
            {
                var d=Catalog.Ball(balls[i]);if(d==null)continue;var guide=BallGuide.For(d.id);
                var row=new Rect(0,i*rowH,inner,rowH-6);
                bool hover=GUI.enabled&&row.Contains(Event.current.mousePosition);
                Draw.Round(row,hover?Theme.PanelRaised:Theme.PanelLight);
                BallView.Preview(new Rect(row.x+8,row.y+(row.height-36)/2,36,36),d,deckGuideOwner);
                Draw.Text(new Rect(row.x+54,row.y+3,row.width-90,22),BallIcons.Name(d),phone?15:16,Theme.Text,TextAnchor.MiddleLeft,true);
                if(guide!=null)
                {
                    Color tone=WhenColor(guide.When);
                    Glyphs.Paint(new Rect(row.x+54,row.y+27,14,14),WhenGlyph(guide.When),tone);
                    Draw.Text(new Rect(row.x+73,row.y+24,row.width-110,20),BallGuide.WhenText(guide.When)+": "+guide.Tag.ToLowerInvariant(),12,Color.Lerp(tone,Theme.Ink,.35f),TextAnchor.MiddleLeft,true);
                }
                var more=new Rect(row.xMax-34,row.y+(row.height-24)/2,24,24);
                Draw.Circle(more,Theme.Info);Glyphs.Paint(new Rect(more.x+6,more.y+6,12,12),IconInfo,Theme.OnColor);
                if(GUI.Button(row,GUIContent.none,GUIStyle.none))ShowBallDetails(d.id);
            }
            GUI.EndScrollView();
            float fy=y+h-foot+8;
            LanguageSwitch(new Rect(x+pad,fy,112,50));
            if(Draw.Button(new Rect(x+pad+124,fy,inner-124,50),Lang.T("Close","Zamknij"),Go,true,true,phone?15:16))deckGuide=null;
            var e=Event.current;if(GUI.enabled&&e.type==EventType.MouseDown&&!card.Contains(e.mousePosition)){deckGuide=null;e.Use();}
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
