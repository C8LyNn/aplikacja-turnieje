using System;
using System.Linq;
using CoreClash.Data;
using UnityEngine;
namespace CoreClash.Presentation
{
    public sealed partial class CoreClashApp
    {
        void RenderSetup()
        {
            bool shortView=UiHeight<440;float width=Math.Min(1120,UiWidth-40),left=(UiWidth-width)/2;bool wide=width>700||(UiHeight<600&&width>520);int columns=wide?2:1;float gap=16,cardH=shortView?184:UiViewport.TargetSize>=44?224:UiHeight<700?170:198;
            float playersY=68,playersH=wide?76:140,titleY=playersY+playersH+16,listY=titleY+56;
            if(shortView){titleY=68;listY=124;}else{PlayerChoice(0,new Rect(left,playersY,wide?(width-16)/2:width,wide?76:64));PlayerChoice(1,new Rect(wide?left+(width+16)/2:left,wide?playersY:playersY+76,wide?(width-16)/2:width,wide?76:64));}
            Draw.Text(new Rect(left,titleY,width,28),"CHOOSE YOUR SHOWCASE",wide?24:19,Color.white,TextAnchor.MiddleLeft,true);
            Draw.Text(new Rect(left,titleY+31,width,22),"Four ways to bend the rules. Pick a deck for each player.",13,Draw.Muted);
            float listH=Math.Max(32,UiHeight-listY-92),rows=(float)Math.Ceiling(Catalog.Featured.Length/(float)columns);
            setupScroll=Draw.ScrollView(new Rect(left,listY,width,listH),setupScroll,new Rect(0,0,width-18,rows*(cardH+gap)));
            float cardW=(width-18-gap*(columns-1))/columns;
            for(int i=0;i<Catalog.Featured.Length;i++)FeaturedCard(Catalog.Featured[i],i,new Rect((i%columns)*(cardW+gap),(i/columns)*(cardH+gap),cardW,cardH));
            GUI.EndScrollView();float foot=UiHeight-74,primary=wide?Math.Min(440,width*.48f):width*.49f;
            if(Draw.Button(new Rect(left,foot,primary,48),"START LOCAL MATCH",Draw.Cyan,true,size:wide?16:12))StartLocalMatch();
            if(Draw.Button(new Rect(left+primary+12,foot,width-primary-12,48),wide?"ALL DECKS / DECK BUILDER":"ALL DECKS / BUILDER",size:wide?14:11)){library=true;presetScroll=Vector2.zero;}
        }
        void PlayerChoice(int owner,Rect r)
        {
            var deck=chosen[owner];var color=Draw.Owner(owner);Draw.Surface(r,Draw.Panel,Color.Lerp(Draw.Edge,color,.5f));Draw.Round(new Rect(r.x+1,r.y+10,3,r.height-20),color);
            Draw.Text(new Rect(r.x+16,r.y+9,r.width-132,17),"PLAYER "+(owner+1),11,color,TextAnchor.MiddleLeft,true);
            Draw.Text(new Rect(r.x+16,r.y+29,r.width-135,23),deck.name,16,Color.white,TextAnchor.MiddleLeft,true);
            if(r.height>70)for(int i=0;i<9;i++)BallView.Preview(new Rect(r.x+16+i*21,r.y+55,13,13),Catalog.Ball(deck.balls[i]),owner);
            float actionH=UiViewport.TargetSize;
            if(Draw.Button(new Rect(r.xMax-112,r.y+(r.height-actionH)/2,98,actionH),"EDIT DECK",color,size:12))OpenBuilder(owner);
        }
        void FeaturedCard(DeckDefinition deck,int index,Rect r)
        {
            Color accent=DeckAccent(deck);Draw.Surface(r,Draw.Panel);Draw.Round(new Rect(r.x+12,r.y+12,3,r.height-24),accent);
            Draw.Text(new Rect(r.x+24,r.y+13,r.width-48,16),"FEATURED 0"+(index+1)+"  /  CLASS DEMO",10,accent,TextAnchor.MiddleLeft,true);
            bool compact=r.height<190;Draw.Text(new Rect(r.x+24,r.y+(compact?28:33),r.width-48,27),deck.name,r.width>430?23:19,Color.white,TextAnchor.MiddleLeft,true);
            Draw.Text(new Rect(r.x+24,r.y+(compact?54:65),r.width-48,compact?27:38),Identity(deck),compact?11:13,Draw.Muted);
            float actionH=UiViewport.TargetSize>=44?44:31;
            float orb=Math.Min(35,(r.width-64)/10),step=(r.width-56-orb)/8,orbY=compact?r.y+89:r.yMax-actionH-52;
            for(int i=0;i<9;i++)BallView.Preview(new Rect(r.x+26+i*step,orbY,orb,orb),Catalog.Ball(deck.balls[i]),0);
            float buttonW=(r.width-60)/2;
            if(Draw.Button(new Rect(r.x+24,r.yMax-actionH-12,buttonW,actionH),chosen[0].id==deck.id?"PLAYER 1  SELECTED":"SELECT FOR PLAYER 1",Draw.Cyan,chosen[0].id==deck.id,size:actionH>=44?12:10))SelectDeck(0,deck.id);
            if(Draw.Button(new Rect(r.x+36+buttonW,r.yMax-actionH-12,buttonW,actionH),chosen[1].id==deck.id?"PLAYER 2  SELECTED":"SELECT FOR PLAYER 2",Draw.Pink,chosen[1].id==deck.id,size:actionH>=44?12:10))SelectDeck(1,deck.id);
        }
        void OpenBuilder(int owner){builder=true;builderOwner=owner;custom=chosen[owner].balls.ToList();search="";rosterScroll=Vector2.zero;}
        void RenderLibrary()
        {
            bool shortView=UiHeight<440;float left=24,width=UiWidth-48;Draw.Text(new Rect(left,78,width-(shortView?360:110),30),"ALL DECKS",shortView?18:25,Color.white,TextAnchor.MiddleLeft,true);
            if(Draw.Button(new Rect(UiWidth-120,76,96,UiViewport.TargetSize),"BACK"))library=false;
            const string helper="All canonical presets and every ball remain here. Build your own nine-ball deck.";
            float helperH=Math.Max(27,Draw.TextHeight(helper,width,13)),playersY=124+helperH+11;
            if(!shortView)Draw.Text(new Rect(left,124,width,helperH),helper,13,Draw.Muted);
            bool wide=width>700||(UiHeight<600&&width>520);float half=(width-14)/2;
            if(shortView){if(Draw.Button(new Rect(UiWidth-360,76,108,44),"P1 BUILDER",Draw.Cyan,size:11))OpenBuilder(0);if(Draw.Button(new Rect(UiWidth-242,76,108,44),"P2 BUILDER",Draw.Pink,size:11))OpenBuilder(1);}
            else{PlayerChoice(0,new Rect(left,playersY,wide?half:width,wide?76:64));PlayerChoice(1,new Rect(wide?left+half+14:left,wide?playersY:playersY+76,wide?half:width,wide?76:64));}
            float rowW=width-24,content=0;var rows=new SetupDeckRowLayout[decks.Length];
            for(int i=0;i<decks.Length;i++){rows[i]=SetupLayout.DeckRow(rowW,Draw.TextHeight(decks[i].name,SetupLayout.DeckNameWidth(rowW),16,true),UiViewport.TargetSize);content+=rows[i].Height+8;}
            float top=shortView?128:playersY+(wide?76:140)+17,h=UiHeight-top-82;presetScroll=Draw.ScrollView(new Rect(left,top,width,Math.Max(32,h)),presetScroll,new Rect(0,0,width-20,content));
            float y=0;
            for(int i=0;i<decks.Length;i++){
                var deck=decks[i];var row=rows[i];Draw.Surface(new Rect(0,y,rowW,row.Height),Draw.Panel);Draw.Text(SetupRect(row.Name,y),deck.name,16,Color.white,TextAnchor.MiddleLeft,true);
                for(int j=0;j<9;j++)BallView.Preview(SetupRect(row.Previews[j],y),Catalog.Ball(deck.balls[j]),0);
                if(Draw.Button(SetupRect(row.Player1,y),"P1",Draw.Cyan,chosen[0].id==deck.id))SelectDeck(0,deck.id);
                if(Draw.Button(SetupRect(row.Player2,y),"P2",Draw.Pink,chosen[1].id==deck.id))SelectDeck(1,deck.id);
                y+=row.Height+8;
            }GUI.EndScrollView();if(Draw.Button(new Rect(left,UiHeight-65,width,44),"START LOCAL MATCH",Draw.Cyan,true))StartLocalMatch();
        }
        static Rect SetupRect(UiBox box,float y)=>new Rect(box.x,box.y+y,box.width,box.height);
        void RenderBuilder()
        {
            bool shortView=UiHeight<440;float left=24,width=UiWidth-48;Color team=Draw.Owner(builderOwner);string title="PLAYER "+(builderOwner+1)+" / DECK BUILDER";int titleSize=width<500?16:24;
            float titleH=Math.Max(32,Draw.TextHeight(title,width-120,titleSize,true));Draw.Text(new Rect(left,77,width-120,titleH),title,titleSize,team,TextAnchor.MiddleLeft,true);
            if(Draw.Button(new Rect(UiWidth-120,76,96,UiViewport.TargetSize),"BACK"))builder=false;
            const string helper="Choose nine different special balls. Standard is always available separately.";
            float helperY=Math.Max(124,77+titleH+7),helperH=Math.Max(24,Draw.TextHeight(helper,width,13)),searchY=Math.Max(153,helperY+helperH+13),selectedY=searchY+UiViewport.TargetSize+9,rosterY=selectedY+35;
            if(shortView){searchY=124;selectedY=134;rosterY=174;}else Draw.Text(new Rect(left,helperY,width,helperH),helper,13,Draw.Muted);
            float searchW=shortView?width*.62f:width;
            search=GUI.TextField(new Rect(left,searchY,searchW,UiViewport.TargetSize),search);Draw.Text(new Rect(shortView?left+searchW+12:left,selectedY,shortView?width-searchW-12:width,23),custom.Count+" / 9 SELECTED",14,team,TextAnchor.MiddleLeft,true);
            float selectedStep=Math.Min(29,(width-144)/9);
            if(!shortView)for(int i=0;i<custom.Count;i++)BallView.Preview(new Rect(left+144+i*selectedStep,selectedY-1,Math.Min(22,selectedStep-1),Math.Min(22,selectedStep-1)),Catalog.Ball(custom[i]),builderOwner);
            var roster=Catalog.Data.balls.Where(b=>!b.hidden&&b.id!="normal"&&(b.name.IndexOf(search,StringComparison.OrdinalIgnoreCase)>=0||b.archetype.IndexOf(search,StringComparison.OrdinalIgnoreCase)>=0)).ToArray();
            int columns=UiWidth>950?3:UiWidth>600?2:1;float cardW=(width-24-(columns-1)*10)/columns,cardH=shortView?78:86,content=(float)Math.Ceiling(roster.Length/(float)columns)*(cardH+10);
            rosterScroll=Draw.ScrollView(new Rect(left,rosterY,width,Math.Max(32,UiHeight-rosterY-(shortView?68:80))),rosterScroll,new Rect(0,0,width-22,content));
            for(int i=0;i<roster.Length;i++){
                var d=roster[i];bool picked=custom.Contains(d.id);var r=new Rect((i%columns)*(cardW+10),(i/columns)*(cardH+10),cardW,cardH);Draw.Surface(r,Draw.Panel,picked?team:Draw.Edge);
                if(GUI.Button(new Rect(r.x,r.y,r.width-62,r.height),GUIContent.none,GUIStyle.none)){if(picked)custom.Remove(d.id);else if(custom.Count<9)custom.Add(d.id);}
                BallView.Preview(new Rect(r.x+12,r.y+(shortView?15:18),48,48),d,builderOwner,picked);Draw.Text(new Rect(r.x+72,r.y+(shortView?8:10),r.width-140,shortView?30:42),d.name,14,Color.white,TextAnchor.MiddleLeft,true);Draw.Text(new Rect(r.x+72,r.y+(shortView?44:54),r.width-140,23),d.hp+" HP  /  "+d.size,11,Draw.Muted);
                if(Draw.Button(new Rect(r.xMax-54,r.y+(shortView?17:21),44,44),"i",size:15))ShowBallDetails(d.id);
            }GUI.EndScrollView();
            if(Draw.Button(new Rect(left,UiHeight-64,width,44),"USE THIS DECK",team,true,custom.Count==9,14)){chosen[builderOwner]=new DeckDefinition{id="custom_"+builderOwner,name="Custom Deck / Player "+(builderOwner+1),balls=custom.ToArray(),description="A deck you created."};builder=false;}
        }
    }
}
