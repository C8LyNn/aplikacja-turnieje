using System;
using System.Linq;
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
        static readonly Color Go=new Color(.12f,.76f,.45f);
        void RenderSetup()
        {
            bool shortView=UiHeight<440;float width=Math.Min(1120,UiWidth-(UiWidth<500?24:40)),left=(UiWidth-width)/2;bool wide=width>700||(UiHeight<600&&width>520);int columns=wide?2:1;float gap=14,cardH=shortView?184:UiViewport.TargetSize>=44?214:UiHeight<700?170:198;
            float playersY=68,playersH=wide?76:140,titleY=playersY+playersH+12,listY=titleY+(wide?56:50);
            if(shortView){titleY=66;listY=118;}else{PlayerChoice(0,new Rect(left,playersY,wide?(width-16)/2:width,wide?76:64));PlayerChoice(1,new Rect(wide?left+(width+16)/2:left,wide?playersY:playersY+76,wide?(width-16)/2:width,wide?76:64));}
            Heading(new Rect(left,titleY,width,28),"Pick your decks",wide?24:19);
            Draw.Text(new Rect(left,titleY+(wide?31:27),width,22),DeveloperRoster?"DEVELOPER ROSTER (F2): frozen balls and legacy decks are available for testing.":"Four ways to bend the rules. One deck for each player.",wide?13:12,DeveloperRoster?Theme.Select:OnBackdropSoft,TextAnchor.UpperLeft,true);
            var setupDecks=SetupDecks;
            float listH=Math.Max(32,UiHeight-listY-80),rows=(float)Math.Ceiling(setupDecks.Length/(float)columns);
            setupScroll=Draw.ScrollView(new Rect(left,listY,width,listH),setupScroll,new Rect(0,0,width-18,rows*(cardH+gap)+10));
            float cardW=(width-18-gap*(columns-1))/columns;
            for(int i=0;i<setupDecks.Length;i++)FeaturedCard(setupDecks[i],i,new Rect((i%columns)*(cardW+gap),4+(i/columns)*(cardH+gap),cardW,cardH));
            GUI.EndScrollView();
            // Footer: play, all decks, and the effects setting (full or reduced motion).
            float foot=UiHeight-68,fxW=wide?168:52,primary=wide?Math.Min(440,width*.44f):(width-fxW-16)*.56f,rest=width-primary-fxW-16;
            if(Draw.Button(new Rect(left,foot,primary,52),"Play!",Go,true,size:wide?17:14))StartLocalMatch();
            if(Draw.Button(new Rect(left+primary+8,foot,rest,52),wide?"All decks & builder":"All decks",size:wide?14:12)){library=true;presetScroll=Vector2.zero;}
            var fx=new Rect(left+width-fxW,foot,fxW,52);
            if(wide?Draw.Button(fx,Fx.ReducedMotion?"Effects: calm":"Effects: full",Theme.Info,!Fx.ReducedMotion,true,12):Draw.IconButton(fx,Fx.Star,Theme.Info,!Fx.ReducedMotion))Fx.SetReducedMotion(!Fx.ReducedMotion);
        }
        const string IconRobot="+P -.74 -.5 .74 -.5 .74 .74 -.74 .74;-C -.32 .02 .18;-C .32 .02 .18;-L -.26 .46 .26 .46 .12;+L 0 -.5 0 -.82 .18;+C 0 -.86 .16";
        const string IconSwitch="+L -.6 -.36 .3 -.36 .26;+P .96 -.36 .3 -.8 .3 .08;+L .6 .36 -.3 .36 .26;+P -.96 .36 -.3 -.08 -.3 .8";
        void PlayerChoice(int owner,Rect r)
        {
            var deck=chosen[owner];var color=Draw.Owner(owner);
            Draw.Card(r);
            // Team block on the left: the same colour and ring pattern as that player's balls.
            float block=Math.Min(58,r.height);
            Draw.Round(new Rect(r.x,r.y,block,r.height),color);Draw.Rect(new Rect(r.x+block-12,r.y,12,r.height),color);
            // Player 2 can be the computer: tap the team block to switch.
            bool computer=owner==1&&VersusAi;
            if(computer)Glyphs.Paint(new Rect(r.x+block/2-12,r.y+r.height*.36f-13,24,24),IconRobot,Theme.OnColor);
            else Draw.Ring(new Vector2(r.x+block/2,r.y+r.height*.36f),9,Theme.OnColor,2.8f,owner==1?Theme.P2RingSegments:0,Theme.P2RingFill);
            Draw.Text(new Rect(r.x,r.y+r.height*.52f,block,18),computer?"AI":"P"+(owner+1),14,Theme.OnColor,TextAnchor.MiddleCenter,true);
            if(owner==1)
            {
                Glyphs.Paint(new Rect(r.x+block/2-7,r.yMax-15,14,14),IconSwitch,Theme.A(Theme.OnColor,.85f));
                if(GUI.Button(new Rect(r.x,r.y,block,r.height),GUIContent.none,GUIStyle.none))SetVersusAi(!VersusAi);
            }
            float x=r.x+block+12,actionW=98,actionH=UiViewport.TargetSize;
            Draw.Text(new Rect(x,r.y+8,r.xMax-x-actionW-18,22),deck.name,r.width<420?14:16,Theme.Text,TextAnchor.MiddleLeft,true);
            float step=Math.Min(24,(r.xMax-x-actionW-22)/9);
            for(int i=0;i<9&&i<deck.balls.Length;i++)BallView.Preview(new Rect(x+2+i*step,r.y+(r.height>70?41:36),r.height>70?18:15,r.height>70?18:15),Catalog.Ball(deck.balls[i]),owner);
            if(Draw.Button(new Rect(r.xMax-actionW-10,r.y+(r.height-actionH)/2,actionW,actionH),"Edit",color,size:12))OpenBuilder(owner);
        }
        void FeaturedCard(DeckDefinition deck,int index,Rect r)
        {
            Color accent=DeckAccent(deck);bool frozen=Catalog.Roster!=null&&!Catalog.Roster.IsActiveDeck(deck);
            Draw.Card(r);
            // Coloured header with the deck's name.
            float band=r.height<190?38:44;
            Draw.Round(new Rect(r.x,r.y,r.width,band+12),accent);Draw.Rect(new Rect(r.x+2,r.y+band,r.width-4,14),Theme.Panel);
            Draw.Text(new Rect(r.x+16,r.y+1,r.width-110,band),deck.name,r.width>430?20:17,new Color(0,0,0,.22f),TextAnchor.MiddleLeft,true);
            Draw.Text(new Rect(r.x+16,r.y,r.width-110,band),deck.name,r.width>430?20:17,Theme.OnColor,TextAnchor.MiddleLeft,true);
            Draw.Text(new Rect(r.xMax-96,r.y,84,band),frozen?"FROZEN":"DECK "+(index+1),10,new Color(1,1,1,.85f),TextAnchor.MiddleRight,true);
            bool compact=r.height<190;
            Draw.Text(new Rect(r.x+16,r.y+band+(compact?4:8),r.width-32,compact?28:34),Identity(deck),compact?11:12,Theme.Muted);
            float actionH=UiViewport.TargetSize>=44?46:36;
            float orb=Math.Min(compact?28:34,(r.width-48)/10.5f),step=(r.width-32-orb)/8,orbY=r.yMax-actionH-18-orb-(compact?4:8);
            for(int i=0;i<9;i++)BallView.Preview(new Rect(r.x+16+i*step,orbY,orb,orb),Catalog.Ball(deck.balls[i]),0);
            float buttonW=(r.width-44)/2;
            if(Draw.Button(new Rect(r.x+16,r.yMax-actionH-12,buttonW,actionH),"Player 1",Draw.Cyan,chosen[0].id==deck.id,size:13))SelectDeck(0,deck.id);
            if(Draw.Button(new Rect(r.x+28+buttonW,r.yMax-actionH-12,buttonW,actionH),"Player 2",Draw.Pink,chosen[1].id==deck.id,size:13))SelectDeck(1,deck.id);
        }
        void OpenBuilder(int owner){builder=true;builderOwner=owner;custom=chosen[owner].balls.ToList();search="";rosterScroll=Vector2.zero;}
        void RenderLibrary()
        {
            bool shortView=UiHeight<440;float left=24,width=UiWidth-48;Heading(new Rect(left,78,width-(shortView?360:110),30),"All decks",shortView?18:25);
            if(Draw.Button(new Rect(UiWidth-120,76,96,UiViewport.TargetSize),"Back"))library=false;
            var decks=LibraryDecks;
            string helper=ActiveRosterOnly?"Ready-made decks from the active roster. Build your own nine-ball deck.":"All canonical presets and every ball remain here. Build your own nine-ball deck.";
            float helperH=Math.Max(27,Draw.TextHeight(helper,width,13)),playersY=124+helperH+11;
            if(!shortView)Draw.Text(new Rect(left,124,width,helperH),helper,13,OnBackdropSoft,TextAnchor.UpperLeft,true);
            bool wide=width>700||(UiHeight<600&&width>520);float half=(width-14)/2;
            if(shortView){if(Draw.Button(new Rect(UiWidth-360,76,108,44),"P1 BUILDER",Draw.Cyan,size:11))OpenBuilder(0);if(Draw.Button(new Rect(UiWidth-242,76,108,44),"P2 BUILDER",Draw.Pink,size:11))OpenBuilder(1);}
            else{PlayerChoice(0,new Rect(left,playersY,wide?half:width,wide?76:64));PlayerChoice(1,new Rect(wide?left+half+14:left,wide?playersY:playersY+76,wide?half:width,wide?76:64));}
            float rowW=width-24,content=0;var rows=new SetupDeckRowLayout[decks.Length];
            for(int i=0;i<decks.Length;i++){rows[i]=SetupLayout.DeckRow(rowW,Draw.TextHeight(decks[i].name,SetupLayout.DeckNameWidth(rowW),16,true),UiViewport.TargetSize);content+=rows[i].Height+8;}
            float top=shortView?128:playersY+(wide?76:140)+17,h=UiHeight-top-82;presetScroll=Draw.ScrollView(new Rect(left,top,width,Math.Max(32,h)),presetScroll,new Rect(0,0,width-20,content));
            float y=0;
            for(int i=0;i<decks.Length;i++){
                var deck=decks[i];var row=rows[i];Draw.Round(new Rect(0,y,rowW,row.Height),Theme.Panel);Draw.Text(SetupRect(row.Name,y),deck.name,16,Theme.Text,TextAnchor.MiddleLeft,true);
                for(int j=0;j<9;j++)BallView.Preview(SetupRect(row.Previews[j],y),Catalog.Ball(deck.balls[j]),0);
                if(Draw.Button(SetupRect(row.Player1,y),"P1",Draw.Cyan,chosen[0].id==deck.id))SelectDeck(0,deck.id);
                if(Draw.Button(SetupRect(row.Player2,y),"P2",Draw.Pink,chosen[1].id==deck.id))SelectDeck(1,deck.id);
                y+=row.Height+8;
            }GUI.EndScrollView();if(Draw.Button(new Rect(left,UiHeight-68,width,52),"Play!",Go,true,size:16))StartLocalMatch();
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
        void RenderPhoneBuilder(bool activeOnly)
        {
            float left=12,width=UiWidth-24;Color team=Draw.Owner(builderOwner);
            Heading(new Rect(left+4,62,width-112,40),"Player "+(builderOwner+1)+": pick 9",20);
            if(Draw.Button(new Rect(UiWidth-108,60,96,UiViewport.TargetSize),"Back"))builder=false;
            // Nine slots show the deck so far. Tap a filled slot to take the ball out.
            float slotGap=4,slot=(width-slotGap*8)/9,slotY=116;
            Draw.Round(new Rect(left-4,slotY-6,width+8,slot+12),Theme.A(Theme.Ink,.22f));
            for(int i=0;i<9;i++)
            {
                var r=new Rect(left+i*(slot+slotGap),slotY,slot,slot);
                if(i>=custom.Count){Draw.Ring(r.center,slot*.36f,Theme.A(Theme.OnColor,.8f),2.4f,8,.55f);continue;}
                BallView.Preview(new Rect(r.x+slot*.14f,r.y+slot*.17f,slot*.72f,slot*.72f),Catalog.Ball(custom[i]),builderOwner);
                if(GUI.Button(r,GUIContent.none,GUIStyle.none)){custom.RemoveAt(i);break;}
            }
            var roster=RosterReadiness.Visible(Catalog,"",RosterReadinessFilter.All,activeOnly);
            const int columns=3;const float gap=8,nameH=34;
            float top=slotY+slot+14,bottom=UiHeight-76,tileW=(width-gap*(columns-1))/columns,tileH=tileW+10;
            float content=(float)Math.Ceiling(roster.Length/(float)columns)*(tileH+gap);
            rosterScroll=Draw.ScrollView(new Rect(left,top,width,bottom-top),rosterScroll,new Rect(0,0,width,Math.Max(content,40)));
            for(int i=0;i<roster.Length;i++)
            {
                var d=roster[i];bool picked=custom.Contains(d.id),full=custom.Count>=9&&!picked;
                var r=new Rect((i%columns)*(tileW+gap)+1.5f,(i/columns)*(tileH+gap)+2,tileW-3,tileH-4);
                Draw.Round(new Rect(r.x-1.5f,r.y-1.5f,r.width+3,r.height+3),Theme.Ink);
                Draw.Round(new Rect(r.x,r.y+3,r.width,r.height-3),picked?Theme.TeamDeep(builderOwner):Theme.EdgeStrong);
                Draw.Round(new Rect(r.x,r.y,r.width,r.height-3),picked?team:Theme.Edge);
                Draw.Round(new Rect(r.x+3,r.y+3,r.width-6,r.height-9),picked?Color.Lerp(Theme.Panel,team,.22f):Theme.Panel);
                var ballZone=new Rect(r.x,r.y,r.width,r.height-3-nameH);
                if(GUI.Button(ballZone,GUIContent.none,GUIStyle.none)){if(picked)custom.Remove(d.id);else if(custom.Count<9)custom.Add(d.id);}
                float orb=Mathf.Min(ballZone.width-44,ballZone.height-26);
                BallView.Preview(new Rect(ballZone.center.x-orb/2,ballZone.y+10+(ballZone.height-12-orb)/2,orb,orb),d,builderOwner,picked);
                var nameZone=new Rect(r.x+3,ballZone.yMax,r.width-6,nameH-3);
                if(GUI.Button(nameZone,GUIContent.none,GUIStyle.none))ShowBallDetails(d.id);
                Draw.Text(new Rect(nameZone.x+2,nameZone.y-2,nameZone.width-4,nameZone.height),BallIcons.Name(d),12,Theme.Text,TextAnchor.MiddleCenter,true);
                if(full)Draw.Round(new Rect(r.x+3,r.y+3,r.width-6,r.height-9),new Color(1,1,1,.4f));
                if(picked)
                {
                    var tick=new Rect(r.xMax-29,r.y+5,24,24);
                    Draw.Circle(new Rect(tick.x-2,tick.y-2,28,28),Theme.Ink);Draw.Circle(tick,Go);Glyphs.Paint(new Rect(tick.x+4,tick.y+4,16,16),IconCheck,Theme.OnColor);
                }
            }
            GUI.EndScrollView();
            if(Draw.Button(new Rect(left,UiHeight-68,width,56),custom.Count==9?"Use this deck":custom.Count+" / 9",Go,true,custom.Count==9,16)){chosen[builderOwner]=new DeckDefinition{id="custom_"+builderOwner,name="Custom Deck / Player "+(builderOwner+1),balls=custom.ToArray(),description="A deck you created."};builder=false;}
        }
        void RenderBuilder()
        {
            if(UiWidth<=600&&UiHeight>=440){if(ActiveRosterOnly)custom.RemoveAll(id=>!Catalog.IsActive(id));RenderPhoneBuilder(ActiveRosterOnly);return;}
            bool shortView=UiHeight<440;float left=24,width=UiWidth-48;Color team=Draw.Owner(builderOwner);string title="PLAYER "+(builderOwner+1)+" / DECK BUILDER";int titleSize=width<500?16:24;
            float titleH=Math.Max(32,Draw.TextHeight(title,width-120,titleSize,true));Heading(new Rect(left,77,width-120,titleH),title,titleSize);
            if(Draw.Button(new Rect(UiWidth-120,76,96,UiViewport.TargetSize),"Back"))builder=false;
            bool activeOnly=ActiveRosterOnly;
            // A deck carried over from the developer roster may hold frozen balls; normal play drops them.
            if(activeOnly)custom.RemoveAll(id=>!Catalog.IsActive(id));
            const string helper="Choose nine different special balls. Standard is always available separately.";
            float helperY=Math.Max(124,77+titleH+7),helperH=Math.Max(24,Draw.TextHeight(helper,width,13)),searchY=Math.Max(153,helperY+helperH+13),selectedY=searchY+UiViewport.TargetSize+9,filterY=selectedY+31,rosterY=filterY+UiViewport.TargetSize+8;
            if(shortView){searchY=124;selectedY=134;filterY=174;rosterY=filterY+UiViewport.TargetSize+6;}else Draw.Text(new Rect(left,helperY,width,helperH),helper,13,OnBackdropSoft,TextAnchor.UpperLeft,true);
            float searchW=shortView?width*.62f:width;
            search=GUI.TextField(new Rect(left,searchY,searchW,UiViewport.TargetSize),search);
            // W19-01 (#289): optional readiness filter (ALL by default); it only changes visible tiles.
            var roster=RosterReadiness.Visible(Catalog,search,rosterFilter,activeOnly);
            int hiddenPicked=custom.Count(id=>!roster.Any(b=>b.id==id));
            Draw.Text(new Rect(shortView?left+searchW+12:left,selectedY,shortView?width-searchW-12:width,23),custom.Count+" / 9 SELECTED"+(hiddenPicked>0&&rosterFilter!=RosterReadinessFilter.All?"  ("+hiddenPicked+" hidden by filter)":""),14,Theme.OnColor,TextAnchor.MiddleLeft,true);
            float selectedStep=Math.Min(29,(width-144)/9);
            if(!shortView)for(int i=0;i<custom.Count;i++)BallView.Preview(new Rect(left+144+i*selectedStep,selectedY-1,Math.Min(22,selectedStep-1),Math.Min(22,selectedStep-1)),Catalog.Ball(custom[i]),builderOwner);
            var counts=RosterReadiness.Counts(Catalog,search,activeOnly);var filterBoxes=RosterReadinessLayout.FilterButtons(left,filterY,width,UiViewport.TargetSize);
            for(int f=0;f<RosterFilters.Length;f++)if(Draw.Button(RectOf(filterBoxes[f]),RosterReadiness.FilterLabel(RosterFilters[f],counts[RosterFilters[f]]),team,rosterFilter==RosterFilters[f],true,width<420?10:12)){rosterFilter=RosterFilters[f];rosterScroll=Vector2.zero;}
            int columns=UiWidth>950?3:UiWidth>600?2:1;float cardW=(width-24-(columns-1)*10)/columns,cardH=shortView?78:86,content=(float)Math.Ceiling(roster.Length/(float)columns)*(cardH+10);
            rosterScroll=Draw.ScrollView(new Rect(left,rosterY,width,Math.Max(32,UiHeight-rosterY-(shortView?68:80))),rosterScroll,new Rect(0,0,width-22,Math.Max(content,40)));
            if(roster.Length==0)Draw.Text(new Rect(4,8,width-30,24),"No balls match this search and filter.",13,OnBackdropSoft,TextAnchor.UpperLeft,true);
            for(int i=0;i<roster.Length;i++){
                var d=roster[i];bool picked=custom.Contains(d.id);var r=new Rect((i%columns)*(cardW+10),(i/columns)*(cardH+10),cardW,cardH);Draw.Round(r,picked?team:Theme.Panel);Draw.Round(Draw.Inset(r,picked?3:0),picked?Color.Lerp(Theme.Panel,team,.1f):Theme.Panel);
                if(GUI.Button(new Rect(r.x,r.y,r.width-62,r.height),GUIContent.none,GUIStyle.none)){if(picked)custom.Remove(d.id);else if(custom.Count<9)custom.Add(d.id);}
                var cl=RosterReadinessLayout.Card(new UiBox(r.x,r.y,r.width,r.height),shortView);
                BallView.Preview(RectOf(cl.Preview),d,builderOwner,picked);Draw.Text(RectOf(cl.Name),BallIcons.Name(d),14,Theme.Text,TextAnchor.MiddleLeft,true);Draw.Text(RectOf(cl.Stats),d.hp+" HP  /  "+d.size+(Catalog.IsActive(d.id)?"":"  /  FROZEN"),11,Catalog.IsActive(d.id)?Draw.Muted:Draw.Gold);
                ReadinessChip(RectOf(cl.Badge),RosterReadiness.Badge(Catalog,d.id));
                if(Draw.Button(RectOf(cl.Info),"i",size:15))ShowBallDetails(d.id);
            }GUI.EndScrollView();
            if(Draw.Button(new Rect(left,UiHeight-66,width,50),"Use this deck",Go,true,custom.Count==9,15)){chosen[builderOwner]=new DeckDefinition{id="custom_"+builderOwner,name="Custom Deck / Player "+(builderOwner+1),balls=custom.ToArray(),description="A deck you created."};builder=false;}
        }
    }
}
