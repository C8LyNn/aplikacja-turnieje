using System;
using System.Collections.Generic;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using UnityEngine;
namespace CoreClash.Presentation
{
    public sealed partial class CoreClashApp
    {
        // W24: text that sits directly on the backdrop (not on a card).
        static void Heading(Rect r,string text,int size,TextAnchor align=TextAnchor.MiddleLeft)
        {
            Draw.Inked(r,text,size,Theme.OnColor,align,size>=20?2f:1.5f);
        }
        static readonly Color OnBackdropSoft=new Color(1,1,1,.88f);
        static readonly Color Go=new Color(0f,.78f,.4f);
        void RenderSetup()
        {
            bool shortView=UiHeight<440;float width=Math.Min(1120,UiWidth-(UiWidth<500?24:40)),left=(UiWidth-width)/2;bool wide=width>700||(UiHeight<600&&width>520);int columns=wide?2:1;float gap=14,cardH=shortView?184:UiViewport.TargetSize>=44?214:UiHeight<700?170:198;
            float playersY=68,playersH=wide?76:140,titleY=playersY+playersH+12,listY=titleY+(wide?56:50);
            if(shortView){titleY=66;listY=118;}else{PlayerChoice(0,new Rect(left,playersY,wide?(width-16)/2:width,wide?76:64));PlayerChoice(1,new Rect(wide?left+(width+16)/2:left,wide?playersY:playersY+76,wide?(width-16)/2:width,wide?76:64));}
            Heading(new Rect(left,titleY,width-124,28),Lang.T("Pick your decks","Wybierz talie"),wide?24:19);
            Draw.Text(new Rect(left,titleY+(wide?31:27),width-124,22),DeveloperRoster?"DEVELOPER ROSTER (F2): frozen balls and legacy decks are available for testing.":Lang.T(wide?"Six ready-made decks, each built on one group. One deck for each player.":"One deck for each player.",wide?"Sześć gotowych talii, każda oparta na jednej grupie. Jedna talia dla każdego gracza.":"Jedna talia dla każdego gracza."),wide?13:12,DeveloperRoster?Theme.Select:OnBackdropSoft,TextAnchor.UpperLeft,true);
            LanguageSwitch(new Rect(left+width-112,titleY+(shortView?-2:0),112,46));
            var setupDecks=SetupDecks;
            float listH=Math.Max(32,UiHeight-listY-80),rows=(float)Math.Ceiling(setupDecks.Length/(float)columns);
            setupScroll=Draw.ScrollView(new Rect(left,listY,width,listH),setupScroll,new Rect(0,0,width-18,rows*(cardH+gap)+10));
            float cardW=(width-18-gap*(columns-1))/columns;
            for(int i=0;i<setupDecks.Length;i++)FeaturedCard(setupDecks[i],i,new Rect((i%columns)*(cardW+gap),4+(i/columns)*(cardH+gap),cardW,cardH));
            GUI.EndScrollView();
            // Footer: play, all decks, and the rules and options of the match.
            float foot=UiHeight-68,fxW=wide?188:52,primary=wide?Math.Min(440,width*.44f):(width-fxW-16)*.56f,rest=width-primary-fxW-16;
            if(Draw.Button(new Rect(left,foot,primary,52),Lang.T("Play!","Graj!"),Go,true,size:wide?17:14))StartLocalMatch();
            if(Draw.Button(new Rect(left+primary+8,foot,rest,52),wide?Lang.T("All decks & builder","Wszystkie talie i kreator"):Lang.T("All decks","Wszystkie talie"),size:wide?14:12)){library=true;presetScroll=Vector2.zero;}
            var fx=new Rect(left+width-fxW,foot,fxW,52);
            if(wide?Draw.Button(fx,Lang.T("Rules and options","Zasady i opcje"),Theme.Info,true,true,13):Draw.IconButton(fx,IconGear,Theme.Info,true))OpenSettings();
        }
        const string IconGear="+C 0 0 .62;+L -.95 0 .95 0 .3;+L 0 -.95 0 .95 .3;+L -.67 -.67 .67 .67 .3;+L .67 -.67 -.67 .67 .3;-C 0 0 .26";
        const string IconRobot="+P -.74 -.5 .74 -.5 .74 .74 -.74 .74;-C -.32 .02 .18;-C .32 .02 .18;-L -.26 .46 .26 .46 .12;+L 0 -.5 0 -.82 .18;+C 0 -.86 .16";
        const string IconSwitch="+L -.6 -.36 .3 -.36 .26;+P .96 -.36 .3 -.8 .3 .08;+L .6 .36 -.3 .36 .26;+P -.96 .36 -.3 -.08 -.3 .8";
        void PlayerChoice(int owner,Rect r)
        {
            // The computer has no colour yet: it is drawn when the match starts.
            var deck=chosen[owner];var color=owner==1&&VersusAi?Theme.Muted:Draw.Owner(owner);
            Draw.Card(r);
            // Team block on the left: the same colour and ring pattern as that player's balls.
            float block=Math.Min(58,r.height);
            // It is the left end of the card's own face, inside the same ink outline.
            var strip=Draw.CardFace(r);float stripCorner=Draw.CardCorner;
            Draw.Corners(new Rect(strip.x,strip.y,block-(strip.x-r.x),strip.height),color,stripCorner,0,0,stripCorner);
            // Player 2 can be the computer: tap the team block to switch.
            bool computer=owner==1&&VersusAi;
            if(computer)Glyphs.Paint(new Rect(r.x+block/2-12,r.y+r.height*.36f-13,24,24),IconRobot,Theme.OnColor);
            else Draw.Ring(new Vector2(r.x+block/2,r.y+r.height*.36f),9,Theme.OnColor,2.8f,owner==1?Theme.P2RingSegments:0,Theme.P2RingFill);
            // The computer's block names its level (the robot says it is the computer).
            Draw.Text(new Rect(r.x,r.y+r.height*.52f,block,18),computer?MatchSetup.AiLevelName(MatchSetup.AiLevel).ToUpperInvariant():Lang.T("P","G")+(owner+1),computer?10:14,Theme.OnColor,TextAnchor.MiddleCenter,true);
            if(owner==1)
            {
                Glyphs.Paint(new Rect(r.x+block/2-7,r.yMax-15,14,14),IconSwitch,Theme.A(Theme.OnColor,.85f));
                // A tap goes round: a second player, then the computer - easy, normal, hard.
                if(Draw.Hit(new Rect(r.x,r.y,block,r.height)))
                {
                    if(!VersusAi){MatchSetup.AiLevel=AiLevel.Easy;SetVersusAi(true);}
                    else if(MatchSetup.AiLevel==AiLevel.Hard)SetVersusAi(false);
                    else MatchSetup.AiLevel=(AiLevel)((int)MatchSetup.AiLevel+1);
                    MatchSetup.Save();
                }
            }
            else
            {
                // Player 1's block: a tap takes the next colour (three dots = "more colours").
                for(int dot=0;dot<3;dot++)Draw.Circle(new Rect(r.x+block/2-11+dot*8,r.yMax-13,6,6),Theme.A(Theme.OnColor,.85f));
                if(Draw.Hit(new Rect(r.x,r.y,block,r.height))){MatchSetup.SetColor(0,MatchSetup.NextColor(0,1));MatchSetup.Save();}
            }
            float x=r.x+block+12,actionW=98,actionH=UiViewport.TargetSize;
            Draw.Text(new Rect(x,r.y+8,r.xMax-x-actionW-18,22),DeckName(deck),r.width<420?14:16,Theme.Text,TextAnchor.MiddleLeft,true);
            float step=Math.Min(24,(r.xMax-x-actionW-22)/9);
            for(int i=0;i<9&&i<deck.balls.Length;i++)BallView.Preview(new Rect(x+2+i*step,r.y+(r.height>70?41:36),r.height>70?18:15,r.height>70?18:15),Catalog.Ball(deck.balls[i]),owner);
            if(Draw.Hit(new Rect(x-4,r.y+4,r.xMax-x-actionW-14,r.height-8)))OpenDeckGuide(deck,owner);
            if(Draw.Button(new Rect(r.xMax-actionW-10,r.y+(r.height-actionH)/2,actionW,actionH),Lang.T("Edit","Zmień"),color,size:12))OpenBuilder(owner);
        }
        void FeaturedCard(DeckDefinition deck,int index,Rect r)
        {
            Color accent=DeckAccent(deck);bool frozen=Catalog.Roster!=null&&!Catalog.Roster.IsActiveDeck(deck);
            Draw.Card(r);
            // Coloured header with the deck's name.
            float band=r.height<190?38:44;
            // The band lies inside the card's ink outline and follows its round top; the white body
            // cuts it off in a straight line.
            var face=Draw.CardFace(r);float faceCorner=Draw.CardCorner;
            Draw.Corners(new Rect(face.x,face.y,face.width,band-(face.y-r.y)),accent,faceCorner,faceCorner,0,0);
            Draw.Text(new Rect(r.x+16,r.y+1,r.width-110,band),DeckName(deck),r.width>430?20:17,new Color(0,0,0,.22f),TextAnchor.MiddleLeft,true);
            Draw.Text(new Rect(r.x+16,r.y,r.width-110,band),DeckName(deck),r.width>430?20:17,Theme.OnColor,TextAnchor.MiddleLeft,true);
            if(frozen)Draw.Text(new Rect(r.xMax-96,r.y,84,band),"FROZEN",10,new Color(1,1,1,.85f),TextAnchor.MiddleRight,true);
            else
            {
                // "What do these balls do?" - opens the list of the nine balls.
                var info=new Rect(r.xMax-band-2,r.y+4,band-8,band-8);
                Draw.Circle(new Rect(info.x-2,info.y-2,info.width+4,info.height+4),Theme.Ink);Draw.Circle(info,Theme.Panel);
                Glyphs.Paint(new Rect(info.center.x-8,info.center.y-8,16,16),IconInfo,Color.Lerp(accent,Theme.Ink,.45f));
                if(Draw.Hit(new Rect(r.xMax-band-10,r.y,band+10,band)))OpenDeckGuide(deck);
            }
            bool compact=r.height<190;
            Draw.Text(new Rect(r.x+16,r.y+band+(compact?4:8),r.width-32,compact?28:34),Identity(deck),compact?11:12,Theme.Muted);
            float actionH=UiViewport.TargetSize>=44?46:36;
            float orb=Math.Min(compact?30:38,(r.width-40)/9.6f),step=(r.width-32-orb)/8,orbY=r.yMax-actionH-18-orb-(compact?4:8);
            for(int i=0;i<9;i++)BallView.Preview(new Rect(r.x+16+i*step,orbY,orb,orb),Catalog.Ball(deck.balls[i]),0);
            // Which groups the deck is made of: a bar in the group's colour under its balls.
            for(int i=0;i<9;)
            {
                var family=BallGroups.Of(deck.balls[i]);int last=i;
                while(last+1<9&&BallGroups.Of(deck.balls[last+1])==family)last++;
                if(family!=null)Draw.Rect(new Rect(r.x+16+i*step+2,orbY+orb+3,(last-i)*step+orb-4,4),BallGuideView_GroupColor(family.Id));
                i=last+1;
            }
            if(Draw.Hit(new Rect(r.x+8,orbY-6,r.width-16,orb+12)))OpenDeckGuide(deck);
            float buttonW=(r.width-44)/2;
            if(Draw.Button(new Rect(r.x+16,r.yMax-actionH-12,buttonW,actionH),Lang.T("Player 1","Gracz 1"),Draw.Cyan,chosen[0].id==deck.id,size:13))SelectDeck(0,deck.id);
            if(Draw.Button(new Rect(r.x+28+buttonW,r.yMax-actionH-12,buttonW,actionH),VersusAi?Lang.T("Computer","Komputer"):Lang.T("Player 2","Gracz 2"),VersusAi?Theme.Muted:Draw.Pink,chosen[1].id==deck.id,size:13))SelectDeck(1,deck.id);
        }
        void OpenBuilder(int owner){builder=true;builderOwner=owner;custom=chosen[owner].balls.ToList();search="";rosterScroll=Vector2.zero;}
        // The deck just built goes to the player it was built for. In a network room that is this
        // player's own deck (chosen[0]), whichever seat of the room they sit in.
        void UseBuiltDeck()
        {
            int slot=inLobby?0:builderOwner;
            chosen[slot]=new DeckDefinition{id="custom_"+slot,name=inLobby?Lang.T("Custom deck","Własna talia"):Lang.T("Custom Deck / Player ","Własna talia / Gracz ")+(builderOwner+1),balls=custom.ToArray(),description=Lang.T("A deck you created.","Talia, którą stworzyłeś.")};
            builder=false;
        }
        void RenderLibrary()
        {
            bool shortView=UiHeight<440;float left=24,width=UiWidth-48;Heading(new Rect(left,78,width-(shortView?360:110),30),Lang.T("All decks","Wszystkie talie"),shortView?18:25);
            if(Draw.Button(new Rect(UiWidth-120,76,96,UiViewport.TargetSize),Lang.T("Back","Wróć")))library=false;
            var decks=LibraryDecks;
            string helper=ActiveRosterOnly?Lang.T("Ready-made decks from the active roster. Build your own nine-ball deck.","Gotowe talie. Możesz też zbudować własną z dziewięciu kulek."):"All canonical presets and every ball remain here. Build your own nine-ball deck.";
            float helperH=Math.Max(27,Draw.TextHeight(helper,width,13)),playersY=124+helperH+11;
            if(!shortView)Draw.Text(new Rect(left,124,width,helperH),helper,13,OnBackdropSoft,TextAnchor.UpperLeft,true);
            bool wide=width>700||(UiHeight<600&&width>520);float half=(width-14)/2;
            if(shortView){if(Draw.Button(new Rect(UiWidth-360,76,108,44),Lang.T("P1 BUILDER","KREATOR G1"),Draw.Cyan,size:11))OpenBuilder(0);if(Draw.Button(new Rect(UiWidth-242,76,108,44),Lang.T("P2 BUILDER","KREATOR G2"),Draw.Pink,size:11))OpenBuilder(1);}
            else{PlayerChoice(0,new Rect(left,playersY,wide?half:width,wide?76:64));PlayerChoice(1,new Rect(wide?left+half+14:left,wide?playersY:playersY+76,wide?half:width,wide?76:64));}
            float rowW=width-24,content=0;var rows=new SetupDeckRowLayout[decks.Length];
            for(int i=0;i<decks.Length;i++){rows[i]=SetupLayout.DeckRow(rowW,Draw.TextHeight(DeckName(decks[i]),SetupLayout.DeckNameWidth(rowW),16,true),UiViewport.TargetSize);content+=rows[i].Height+8;}
            float top=shortView?128:playersY+(wide?76:140)+17,h=UiHeight-top-82;presetScroll=Draw.ScrollView(new Rect(left,top,width,Math.Max(32,h)),presetScroll,new Rect(0,0,width-20,content));
            float y=0;
            for(int i=0;i<decks.Length;i++){
                var deck=decks[i];var row=rows[i];Draw.Round(new Rect(0,y,rowW,row.Height),Theme.Panel);Draw.Text(SetupRect(row.Name,y),DeckName(deck),16,Theme.Text,TextAnchor.MiddleLeft,true);
                for(int j=0;j<9;j++)BallView.Preview(SetupRect(row.Previews[j],y),Catalog.Ball(deck.balls[j]),0);
                if(Draw.Button(SetupRect(row.Player1,y),"P1",Draw.Cyan,chosen[0].id==deck.id))SelectDeck(0,deck.id);
                if(Draw.Button(SetupRect(row.Player2,y),"P2",Draw.Pink,chosen[1].id==deck.id))SelectDeck(1,deck.id);
                y+=row.Height+8;
            }GUI.EndScrollView();if(Draw.Button(new Rect(left,UiHeight-68,width,52),Lang.T("Play!","Graj!"),Go,true,size:16))StartLocalMatch();
        }
        static Rect SetupRect(UiBox box,float y)=>new Rect(box.x,box.y+y,box.width,box.height);
        static readonly RosterReadinessFilter[] RosterFilters={RosterReadinessFilter.All,RosterReadinessFilter.ReadyOnly,RosterReadinessFilter.ReadyOrPartial};
        RosterReadinessFilter rosterFilter=RosterReadinessFilter.All;
        static Color ReadinessColor(ReadinessLevel level)=>level==ReadinessLevel.Ready?new Color(.07f,.56f,.33f):level==ReadinessLevel.Partial?Draw.Gold:Draw.Muted;
        static void ReadinessChip(Rect r,ReadinessBadge badge)
        {
            Color c=ReadinessColor(badge.Level);
            Draw.Round(r,new Color(c.r,c.g,c.b,.16f));
            Draw.Text(r,badge.Label,Mathf.Max(8,Mathf.RoundToInt(r.height*.62f)),c,TextAnchor.MiddleCenter,true);
        }
        // Phone deck builder (W24): nine slots on top, then a grid of large ball tiles. Tap a ball to
        // put it in or take it out; tap its name to read what it does. No search box, no filter row.
        const string IconCheck="+L -.6 .02 -.18 .46 .34;+L -.18 .46 .62 -.42 .34";
        static Color BallGuideView_GroupColor(string id)=>GroupColor(id);
        void RenderPhoneBuilder(bool activeOnly)
        {
            float left=12,width=UiWidth-24;Color team=Draw.Owner(builderOwner);
            Heading(new Rect(left+4,62,width-112,40),Lang.T("Player ","Gracz ")+(builderOwner+1)+Lang.T(": pick 9",": wybierz 9"),20);
            if(Draw.Button(new Rect(UiWidth-108,60,96,UiViewport.TargetSize),Lang.T("Back","Wróć")))builder=false;
            // Nine slots show the deck so far. Tap a filled slot to take the ball out.
            float slotGap=4,slot=(width-slotGap*8)/9,slotY=116;
            Draw.Round(new Rect(left-4,slotY-6,width+8,slot+12),Theme.A(Theme.Ink,.22f));
            for(int i=0;i<9;i++)
            {
                var r=new Rect(left+i*(slot+slotGap),slotY,slot,slot);
                if(i>=custom.Count){Draw.Ring(r.center,slot*.36f,Theme.A(Theme.OnColor,.8f),2.4f,8,.55f);continue;}
                BallView.Preview(new Rect(r.x+slot*.14f,r.y+slot*.17f,slot*.72f,slot*.72f),Catalog.Ball(custom[i]),builderOwner);
                if(Draw.Hit(r)){custom.RemoveAt(i);break;}
            }
            var roster=RosterReadiness.Visible(Catalog,"",RosterReadinessFilter.All,activeOnly);
            // W24 (owner decision: six groups of five): a group is one block - its own card first
            // (name and what its balls do together), then its balls. Nothing here assumes five:
            // a bigger group simply takes more rows.
            const int columns=3;const float gap=8,nameH=48,blockGap=16;
            float top=slotY+slot+14,bottom=UiHeight-76,tileW=(width-gap*(columns-1))/columns,tileH=tileW+22;
            var blocks=new List<KeyValuePair<BallGroup,BallDefinition[]>>();
            foreach(var group in BallGroups.All)
            {
                var members=roster.Where(b=>BallGroups.Of(b.id)==group).OrderBy(b=>BallGroups.Order(b.id)).ToArray();
                if(members.Length>0)blocks.Add(new KeyValuePair<BallGroup,BallDefinition[]>(group,members));
            }
            var loose=roster.Where(b=>BallGroups.Of(b.id)==null).ToArray();
            if(loose.Length>0)blocks.Add(new KeyValuePair<BallGroup,BallDefinition[]>(null,loose));
            float content=0;
            foreach(var block in blocks)content+=((block.Value.Length+(block.Key!=null?1:0)+columns-1)/columns)*(tileH+gap)+blockGap;
            rosterScroll=Draw.ScrollView(new Rect(left,top,width,bottom-top),rosterScroll,new Rect(0,0,width,Math.Max(content,40)));
            float blockY=0;
            foreach(var block in blocks)
            {
                int lead=block.Key!=null?1:0,rows=(block.Value.Length+lead+columns-1)/columns;
                if(block.Key!=null)
                {
                    Color tone=BallGuideView_GroupColor(block.Key.Id);
                    // The block's ground, in the group's colour.
                    Draw.Round(new Rect(0,blockY,width,rows*(tileH+gap)-gap+4),Theme.A(tone,.3f),14);
                    var head=new Rect(1.5f,blockY+2,tileW-3,tileH-4);
                    Draw.Plate(head,tone,Color.Lerp(tone,Color.white,.3f),Theme.Shade(tone,1.05f,.5f),3,3,1.5f);
                    string title=block.Key.Name.ToUpperInvariant();int titleSize=Draw.TextWidth(title,15,true)<=head.width-12?15:Draw.TextWidth(title,13,true)<=head.width-12?13:11;
                    Draw.Text(new Rect(head.x+6,head.y+5,head.width-12,22),title,titleSize,Theme.OnColor,TextAnchor.MiddleCenter,true);
                    int picks=block.Value.Count(b=>custom.Contains(b.id));
                    float planTop=head.y+29,planH=head.height-29-6-3;
                    int planSize=Draw.TextHeight(block.Key.Plan,head.width-14,11,true)<=planH?11:Draw.TextHeight(block.Key.Plan,head.width-14,10,true)<=planH?10:9;
                    Draw.Text(new Rect(head.x+7,planTop,head.width-14,planH),block.Key.Plan,planSize,Theme.OnColor,TextAnchor.UpperLeft,true);
                    if(picks>0)
                    {
                        var count=new Rect(head.xMax-27,head.y+4,23,17);
                        Draw.Chip(count,Theme.Ink);Draw.Text(new Rect(count.x,count.y-1,count.width,count.height),picks.ToString(),11,Theme.OnColor,TextAnchor.MiddleCenter,true);
                    }
                }
                for(int i=0;i<block.Value.Length;i++)
                {
                    int cell=i+lead;
                    var d=block.Value[i];bool picked=custom.Contains(d.id),full=custom.Count>=9&&!picked;
                    var r=new Rect((cell%columns)*(tileW+gap)+1.5f,blockY+(cell/columns)*(tileH+gap)+2,tileW-3,tileH-4);
                    Draw.Plate(r,picked?Color.Lerp(Theme.Panel,team,.22f):Theme.Panel,picked?team:Theme.Edge,picked?Theme.TeamDeep(builderOwner):Theme.EdgeStrong,3,3,1.5f);
                    var ballZone=new Rect(r.x,r.y,r.width,r.height-3-nameH);
                    if(Draw.Hit(ballZone)){if(picked)custom.Remove(d.id);else if(custom.Count<9)custom.Add(d.id);}
                    float orb=Mathf.Min(ballZone.width-34,ballZone.height-18);
                    BallView.Preview(new Rect(ballZone.center.x-orb/2,ballZone.y+10+(ballZone.height-12-orb)/2,orb,orb),d,builderOwner,picked);
                    var nameZone=new Rect(r.x+3,ballZone.yMax,r.width-6,nameH-3);
                    if(Draw.Hit(nameZone))ShowBallDetails(d.id);
                    string shown=BallIcons.Name(d);
                    Draw.Text(new Rect(nameZone.x+1,nameZone.y-4,nameZone.width-2,22),shown,shown.Length>13?11:12,Theme.Text,TextAnchor.MiddleCenter,true);
                    GuideTag(new Rect(nameZone.x+2,nameZone.y+17,nameZone.width-4,18),d.id,10);
                    if(full)Draw.Round(Draw.PlateFill(r,3,3),new Color(1,1,1,.26f),Draw.PlateCorner(3));
                    if(picked)
                    {
                        var tick=new Rect(r.xMax-29,r.y+5,24,24);
                        Draw.Circle(new Rect(tick.x-2,tick.y-2,28,28),Theme.Ink);Draw.Circle(tick,Go);Glyphs.Paint(new Rect(tick.x+4,tick.y+4,16,16),IconCheck,Theme.OnColor);
                    }
                }
                blockY+=rows*(tileH+gap)+blockGap;
            }
            GUI.EndScrollView();
            if(Draw.Button(new Rect(left,UiHeight-68,width,56),custom.Count==9?Lang.T("Use this deck","Użyj tej talii"):custom.Count+" / 9",Go,true,custom.Count==9,16))UseBuiltDeck();
        }
        // W24 (owner decision: six groups): the deck builder of a wide screen. Each group is a panel
        // - its name and plan on a band in its colour, its balls as rows under it; the nine picks
        // stand next to the title. Click a row to put the ball in or take it out, "i" to read it.
        void RenderPanelBuilder()
        {
            float left=24,width=UiWidth-48;Color team=Draw.Owner(builderOwner);
            string title=Lang.T("PLAYER ","GRACZ ")+(builderOwner+1)+Lang.T(": PICK 9",": WYBIERZ 9");
            float titleW=Draw.TextWidth(title,22,true)+20;
            Heading(new Rect(left,70,titleW,40),title,22);
            if(Draw.Button(new Rect(UiWidth-120,68,96,UiViewport.TargetSize),Lang.T("Back","Wróć")))builder=false;
            // Nine slots show the deck so far. Click a filled slot to take the ball out.
            const float slot=40,slotGap=6;float slotsW=9*slot+8*slotGap,slotX=Mathf.Min(left+titleW+16,UiWidth-120-18-slotsW),slotY=70;
            Draw.Round(new Rect(slotX-7,slotY-5,slotsW+14,slot+10),Theme.A(Theme.Ink,.22f));
            for(int i=0;i<9;i++)
            {
                var r=new Rect(slotX+i*(slot+slotGap),slotY,slot,slot);
                if(i>=custom.Count){Draw.Ring(r.center,slot*.36f,Theme.A(Theme.OnColor,.8f),2.2f,8,.55f);continue;}
                BallView.Preview(new Rect(r.x+slot*.1f,r.y+slot*.12f,slot*.8f,slot*.8f),Catalog.Ball(custom[i]),builderOwner);
                if(Draw.Hit(r)){custom.RemoveAt(i);break;}
            }
            var roster=RosterReadiness.Visible(Catalog,"",RosterReadinessFilter.All,true);
            var blocks=new List<KeyValuePair<BallGroup,BallDefinition[]>>();
            foreach(var group in BallGroups.All)
            {
                var members=roster.Where(b=>BallGroups.Of(b.id)==group).OrderBy(b=>BallGroups.Order(b.id)).ToArray();
                if(members.Length>0)blocks.Add(new KeyValuePair<BallGroup,BallDefinition[]>(group,members));
            }
            var loose=roster.Where(b=>BallGroups.Of(b.id)==null).ToArray();
            if(loose.Length>0)blocks.Add(new KeyValuePair<BallGroup,BallDefinition[]>(null,loose));
            int columns=width>=900?3:2;const float gap=12,headH=64,rowH=42;
            float top=slotY+slot+18,bottom=UiHeight-80,panelW=(width-gap*(columns-1))/columns;
            int most=0;foreach(var block in blocks)most=Math.Max(most,block.Value.Length);
            float panelH=headH+most*rowH+8,content=((blocks.Count+columns-1)/columns)*(panelH+gap);
            rosterScroll=Draw.ScrollView(new Rect(left,top,width,bottom-top),rosterScroll,new Rect(0,0,width,Math.Max(content,40)));
            for(int index=0;index<blocks.Count;index++)
            {
                var block=blocks[index];
                var panel=new Rect((index%columns)*(panelW+gap),(index/columns)*(panelH+gap),panelW,panelH-4);
                Color tone=block.Key!=null?BallGuideView_GroupColor(block.Key.Id):Theme.Muted;
                Draw.Card(panel);
                var face=Draw.CardFace(panel);float corner=Draw.CardCorner;
                Draw.Corners(new Rect(face.x,face.y,face.width,headH-(face.y-panel.y)),tone,corner,corner,0,0);
                if(block.Key!=null)
                {
                    // The name, and under it what the group's balls do together.
                    Draw.Text(new Rect(panel.x+14,panel.y+5,panel.width-28,22),block.Key.Name.ToUpperInvariant(),16,Theme.OnColor,TextAnchor.MiddleLeft,true);
                    float planW=panel.width-28,planH=headH-30;
                    int planSize=Draw.TextHeight(block.Key.Plan,planW,11,true)<=planH+3?11:Draw.TextHeight(block.Key.Plan,planW,10,true)<=planH+3?10:9;
                    Draw.Text(new Rect(panel.x+14,panel.y+27,planW,planH),block.Key.Plan,planSize,new Color(1,1,1,.94f),TextAnchor.UpperLeft,true);
                }
                for(int i=0;i<block.Value.Length;i++)
                {
                    var d=block.Value[i];bool picked=custom.Contains(d.id),full=custom.Count>=9&&!picked;
                    var row=new Rect(face.x+4,panel.y+headH+3+i*rowH,face.width-8,rowH-3);
                    if(picked)Draw.Round(row,Color.Lerp(Theme.Panel,team,.26f),8);
                    if(Draw.Hit(new Rect(row.x,row.y,row.width-44,row.height))){if(picked)custom.Remove(d.id);else if(custom.Count<9)custom.Add(d.id);}
                    var orb=new Rect(row.x+6,row.y+(row.height-34)/2,34,34);
                    BallView.Preview(orb,d,builderOwner,picked);
                    if(picked)
                    {
                        // The tick sits on the ball's corner, so the text keeps its room.
                        var tick=new Rect(orb.xMax-13,orb.y-3,16,16);
                        Draw.Circle(new Rect(tick.x-2,tick.y-2,20,20),Theme.Ink);Draw.Circle(tick,Go);Glyphs.Paint(new Rect(tick.x+3,tick.y+3,10,10),IconCheck,Theme.OnColor);
                    }
                    string shown=BallIcons.Name(d);
                    float nameX=row.x+52,nameWidth=Mathf.Min(Draw.TextWidth(shown,14,true)+4,row.width*.44f);
                    Draw.Text(new Rect(nameX,row.y,nameWidth+2,row.height),shown,Draw.TextWidth(shown,14,true)<=nameWidth?14:12,full?Theme.Muted:Theme.Text,TextAnchor.MiddleLeft,true);
                    // What the ball does, in the same column for every row of the panel.
                    float lineX=row.x+52+Mathf.Min(120,row.width*.4f),lineW=row.xMax-42-lineX;
                    if(lineX<nameX+nameWidth+8){lineX=nameX+nameWidth+8;lineW=row.xMax-42-lineX;}
                    if(lineW>56)GuideLine(new Rect(lineX,row.y,lineW,row.height),d.id,11);
                    if(Draw.Button(new Rect(row.xMax-40,row.y+(row.height-34)/2,36,34),"i",size:14))ShowBallDetails(d.id);
                }
            }
            GUI.EndScrollView();
            if(Draw.Button(new Rect(left,UiHeight-66,width,50),custom.Count==9?Lang.T("Use this deck","Użyj tej talii"):custom.Count+" / 9",Go,true,custom.Count==9,15))UseBuiltDeck();
        }
        // The column layout needs every ball of the roster to be in a group (it has no place for others).
        bool ShortBuilderFits()=>RosterReadiness.Visible(Catalog,"",RosterReadinessFilter.All,true).All(b=>BallGroups.Of(b.id)!=null);
        // W24: the deck builder on a phone held sideways. No scrolling: the nine slots of the deck in
        // the title row, and under them a column for each group with its five balls. A tap on a
        // ball takes it or puts it back; the small "i" opens its card.
        void RenderShortBuilder()
        {
            float left=14,width=UiWidth-28,top=64;Color team=Draw.Owner(builderOwner);
            string title=Lang.T("P","G")+(builderOwner+1)+Lang.T(": PICK 9",": WYBIERZ 9");
            float titleW=Draw.TextWidth(title,18,true)+12,backW=88;
            Heading(new Rect(left,top,titleW,38),title,18);
            if(Draw.Button(new Rect(UiWidth-left-backW,top-1,backW,40),Lang.T("Back","Wróć"),size:13))builder=false;
            const float slotGap=5;float slot=Mathf.Clamp((UiWidth-left-backW-14-(left+titleW+14))/9-slotGap,24,34),slotsW=9*slot+8*slotGap,slotX=left+titleW+14,slotY=top+(38-slot)/2;
            Draw.Round(new Rect(slotX-6,slotY-4,slotsW+12,slot+8),Theme.A(Theme.Ink,.22f));
            for(int i=0;i<9;i++)
            {
                var r=new Rect(slotX+i*(slot+slotGap),slotY,slot,slot);
                if(i>=custom.Count){Draw.Ring(r.center,slot*.36f,Theme.A(Theme.OnColor,.8f),2f,8,.55f);continue;}
                BallView.Preview(new Rect(r.x+slot*.08f,r.y+slot*.1f,slot*.84f,slot*.84f),Catalog.Ball(custom[i]),builderOwner);
                if(Draw.Hit(r)){custom.RemoveAt(i);break;}
            }
            var roster=RosterReadiness.Visible(Catalog,"",RosterReadinessFilter.All,true);
            var groups=BallGroups.All;const float gap=6,headH=21;
            float colTop=top+46,colBottom=UiHeight-64,colW=(width-gap*(groups.Length-1))/groups.Length;
            for(int g=0;g<groups.Length;g++)
            {
                var members=roster.Where(b=>BallGroups.Of(b.id)==groups[g]).OrderBy(b=>BallGroups.Order(b.id)).ToArray();
                var panel=new Rect(left+g*(colW+gap),colTop,colW,colBottom-colTop-2);
                Draw.Card(panel);
                var face=Draw.CardFace(panel);float corner=Draw.CardCorner;
                Draw.Corners(new Rect(face.x,face.y,face.width,headH-(face.y-panel.y)),BallGuideView_GroupColor(groups[g].Id),corner,corner,0,0);
                string name=groups[g].Name.ToUpperInvariant();
                Draw.Text(new Rect(face.x,panel.y+1,face.width,headH-1),name,Draw.TextWidth(name,11,true)<=face.width-6?11:9,Theme.OnColor,TextAnchor.MiddleCenter,true);
                float rowH=(face.yMax-(panel.y+headH)-3)/Mathf.Max(5,members.Length);
                for(int i=0;i<members.Length;i++)
                {
                    var d=members[i];bool picked=custom.Contains(d.id),full=custom.Count>=9&&!picked;
                    var row=new Rect(face.x+2,panel.y+headH+2+i*rowH,face.width-4,rowH-2);
                    if(picked)Draw.Round(row,Color.Lerp(Theme.Panel,team,.26f),7);
                    const float info=26;
                    if(Draw.Hit(new Rect(row.x,row.y,row.width-info,row.height))){if(picked)custom.Remove(d.id);else if(custom.Count<9)custom.Add(d.id);}
                    float size=Mathf.Min(row.height-4,30);var orb=new Rect(row.x+3,row.y+(row.height-size)/2,size,size);
                    BallView.Preview(orb,d,builderOwner,picked);
                    if(picked)
                    {
                        var tick=new Rect(orb.xMax-11,orb.y-2,13,13);
                        Draw.Circle(new Rect(tick.x-1.5f,tick.y-1.5f,16,16),Theme.Ink);Draw.Circle(tick,Go);Glyphs.Paint(new Rect(tick.x+2.5f,tick.y+2.5f,8,8),IconCheck,Theme.OnColor);
                    }
                    // The name: as large as its longest word allows, on two lines when it has two words.
                    string shown=BallIcons.Name(d);float nameX=orb.xMax+5,nameW=row.xMax-info-nameX-3;
                    float widest=0;foreach(string word in shown.Split(' '))widest=Mathf.Max(widest,Draw.TextWidth(word,11,true));
                    int font=widest<=nameW?11:widest*10/11f<=nameW?10:9;
                    Draw.Text(new Rect(nameX,row.y,nameW,row.height),shown,font,full?Theme.Muted:Theme.Text,TextAnchor.MiddleLeft,true);
                    if(Draw.Button(new Rect(row.xMax-info+1,row.y+(row.height-Mathf.Min(row.height-2,30))/2,info-3,Mathf.Min(row.height-2,30)),"i",size:12))ShowBallDetails(d.id);
                }
            }
            if(Draw.Button(new Rect(left,UiHeight-58,width,46),custom.Count==9?Lang.T("Use this deck","Użyj tej talii"):custom.Count+" / 9",Go,true,custom.Count==9,15))UseBuiltDeck();
        }
        void RenderBuilder()
        {
            if(UiWidth<=600&&UiHeight>=440){if(ActiveRosterOnly)custom.RemoveAll(id=>!Catalog.IsActive(id));RenderPhoneBuilder(ActiveRosterOnly);return;}
            // W24: in normal play a wide screen shows the whole roster at once, a panel for each group.
            if(ActiveRosterOnly&&UiHeight>=440){custom.RemoveAll(id=>!Catalog.IsActive(id));RenderPanelBuilder();return;}
            // W24: a phone held sideways shows the whole roster on one screen, a column for each group.
            if(ActiveRosterOnly&&UiHeight<440&&UiWidth>=640&&ShortBuilderFits()){custom.RemoveAll(id=>!Catalog.IsActive(id));RenderShortBuilder();return;}
            bool shortView=UiHeight<440;float left=24,width=UiWidth-48;Color team=Draw.Owner(builderOwner);string title=Lang.T("PLAYER ","GRACZ ")+(builderOwner+1)+Lang.T(" / DECK BUILDER"," / KREATOR TALII");int titleSize=width<500?16:24;
            float titleH=Math.Max(32,Draw.TextHeight(title,width-120,titleSize,true));Heading(new Rect(left,77,width-120,titleH),title,titleSize);
            if(Draw.Button(new Rect(UiWidth-120,76,96,UiViewport.TargetSize),Lang.T("Back","Wróć")))builder=false;
            bool activeOnly=ActiveRosterOnly;
            // A deck carried over from the developer roster may hold frozen balls; normal play drops them.
            if(activeOnly)custom.RemoveAll(id=>!Catalog.IsActive(id));
            string helper=Lang.T("Choose nine different special balls. Standard is always available separately.","Wybierz dziewięć różnych kulek specjalnych. Zwykła jest zawsze dostępna osobno.");
            float helperY=Math.Max(124,77+titleH+7),helperH=Math.Max(24,Draw.TextHeight(helper,width,13)),searchY=Math.Max(153,helperY+helperH+13),selectedY=searchY+UiViewport.TargetSize+9,filterY=selectedY+31,rosterY=filterY+UiViewport.TargetSize+8;
            if(shortView){searchY=124;selectedY=134;filterY=174;rosterY=filterY+UiViewport.TargetSize+6;}
            // Normal play offers only working balls, so the readiness filter has nothing to sort out.
            if(activeOnly){rosterFilter=RosterReadinessFilter.All;rosterY=filterY;}
            if(!shortView)Draw.Text(new Rect(left,helperY,width,helperH),helper,13,OnBackdropSoft,TextAnchor.UpperLeft,true);
            float searchW=shortView?width*.62f:width;
            search=Draw.TextField(new Rect(left,searchY,searchW,UiViewport.TargetSize),search);
            // W19-01 (#289): optional readiness filter (ALL by default); it only changes visible tiles.
            var roster=RosterReadiness.Visible(Catalog,search,rosterFilter,activeOnly);
            // W24: in normal play the balls stand group after group, each with its group's colour on its edge.
            if(activeOnly)Array.Sort(roster,(x,y)=>{int a=BallGroups.Order(x.id),b=BallGroups.Order(y.id);return a!=b?a.CompareTo(b):string.CompareOrdinal(x.id,y.id);});
            int hiddenPicked=custom.Count(id=>!roster.Any(b=>b.id==id));
            Draw.Text(new Rect(shortView?left+searchW+12:left,selectedY,shortView?width-searchW-12:width,23),custom.Count+Lang.T(" / 9 SELECTED"," / 9 WYBRANYCH")+(hiddenPicked>0&&rosterFilter!=RosterReadinessFilter.All?"  ("+hiddenPicked+Lang.T(" hidden by filter)"," ukrytych przez filtr)"):""),14,Theme.OnColor,TextAnchor.MiddleLeft,true);
            float selectedStep=Math.Min(29,(width-144)/9);
            if(!shortView)for(int i=0;i<custom.Count;i++)BallView.Preview(new Rect(left+144+i*selectedStep,selectedY-1,Math.Min(22,selectedStep-1),Math.Min(22,selectedStep-1)),Catalog.Ball(custom[i]),builderOwner);
            var counts=RosterReadiness.Counts(Catalog,search,activeOnly);var filterBoxes=RosterReadinessLayout.FilterButtons(left,filterY,width,UiViewport.TargetSize);
            if(!activeOnly)for(int f=0;f<RosterFilters.Length;f++)if(Draw.Button(RectOf(filterBoxes[f]),RosterReadiness.FilterLabel(RosterFilters[f],counts[RosterFilters[f]]),team,rosterFilter==RosterFilters[f],true,width<420?10:12)){rosterFilter=RosterFilters[f];rosterScroll=Vector2.zero;}
            int columns=UiWidth>950?3:UiWidth>600?2:1;float cardW=(width-24-(columns-1)*10)/columns,cardH=shortView?78:86,content=(float)Math.Ceiling(roster.Length/(float)columns)*(cardH+10);
            rosterScroll=Draw.ScrollView(new Rect(left,rosterY,width,Math.Max(32,UiHeight-rosterY-(shortView?68:80))),rosterScroll,new Rect(0,0,width-22,Math.Max(content,40)));
            if(roster.Length==0)Draw.Text(new Rect(4,8,width-30,24),Lang.T("No balls match this search and filter.","Żadna kulka nie pasuje do wyszukiwania i filtra."),13,OnBackdropSoft,TextAnchor.UpperLeft,true);
            for(int i=0;i<roster.Length;i++){
                var d=roster[i];bool picked=custom.Contains(d.id);var r=new Rect((i%columns)*(cardW+10),(i/columns)*(cardH+10),cardW,cardH);Draw.Plate(r,picked?Color.Lerp(Theme.Panel,team,.1f):Theme.Panel,team,team,0,picked?3:0);
                if(Draw.Hit(new Rect(r.x,r.y,r.width-62,r.height))){if(picked)custom.Remove(d.id);else if(custom.Count<9)custom.Add(d.id);}
                var family=activeOnly?BallGroups.Of(d.id):null;
                if(family!=null)Draw.Corners(new Rect(r.x,r.y,7,r.height),BallGuideView_GroupColor(family.Id),Draw.Corner,0,0,Draw.Corner);
                var cl=RosterReadinessLayout.Card(new UiBox(r.x,r.y,r.width,r.height),shortView);
                BallView.Preview(RectOf(cl.Preview),d,builderOwner,picked);Draw.Text(RectOf(cl.Name),BallIcons.Name(d),14,Theme.Text,TextAnchor.MiddleLeft,true);Draw.Text(RectOf(cl.Stats),(activeOnly?"":d.hp+" HP  ·  ")+d.stockCopies+Lang.T(" in a deck"," w talii")+(Catalog.IsActive(d.id)?"":"  /  FROZEN"),11,Catalog.IsActive(d.id)?Draw.Muted:Draw.Gold);
                if(activeOnly&&BallGuide.For(d.id)!=null)GuideLine(new Rect(cl.Badge.x,cl.Badge.y-2,cl.Name.width,cl.Badge.height+4),d.id,11);
                else ReadinessChip(RectOf(cl.Badge),RosterReadiness.Badge(Catalog,d.id));
                if(Draw.Button(RectOf(cl.Info),"i",size:15))ShowBallDetails(d.id);
            }GUI.EndScrollView();
            if(Draw.Button(new Rect(left,UiHeight-66,width,50),Lang.T("Use this deck","Użyj tej talii"),Go,true,custom.Count==9,15))UseBuiltDeck();
        }
    }
}
