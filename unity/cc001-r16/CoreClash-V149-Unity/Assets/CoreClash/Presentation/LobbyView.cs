using System;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Networking;
using UnityEngine;
namespace CoreClash.Presentation
{
    // CC-001 W24 (the brief of the owner's course project, 2026-11-25: "a lobby where the players
    // get ready; the game starts only when everybody has confirmed; the host controls the start").
    // A network game opens in a room. Each player brings their own deck - the one they play as
    // Player 1 on their own device - and says "ready"; the host starts the match when both have.
    // After a match the result card leads back here (ResultView). The room itself, its rules and
    // what goes over the wire are in Networking/MatchLobby and NgoGameSession; this is the screen.
    public sealed partial class CoreClashApp
    {
        bool inLobby,remoteMatchPending;
        // The deck this player last told the room about.
        DeckDefinition lobbyDeckSent;
        // Test hook: a made-up room, drawn without a session (screenshots of the screen).
        LobbyState lobbyPreview;int lobbyPreviewOwner;
        NgoGameSession Room=>GetComponent<NgoGameSession>();
        public bool InNetworkLobby=>setup&&inLobby;
        // The deck this player brings to a network game.
        public DeckDefinition LocalDeck=>chosen[0];
        // The host's room takes the decks this game offers: in normal play, balls of the active roster.
        public MatchLobby NewRoom()=>new MatchLobby(Catalog,ActiveRosterOnly);

        public void BeginNetworkLobby(IUnityNetworkLink link)
        {
            deckGuide=null;hintShown=false;aiMatch=false;exitGuard.Reset();remoteBallSmoother.Reset();
            NetworkLink=link;networkNotice=link.Status;lobbyPreview=null;lobbyDeckSent=chosen[0];
            inLobby=true;remoteMatchPending=false;setup=true;builder=library=boardInspection=false;phoneMenu=false;CancelPointer();CloseBallDetails();
            MatchSetup.UseColorsFor(link.LocalOwner);
            Debug.Log("CORE_CLASH_LOBBY_OPEN owner="+link.LocalOwner);
        }
        // Back in the room: after a match, or because the host took everybody back.
        public void ShowNetworkLobby()
        {
            if(NetworkLink==null||(setup&&inLobby&&!remoteMatchPending))return;
            deckGuide=null;hintShown=false;exitGuard.Reset();remoteBallSmoother.Reset();
            inLobby=true;remoteMatchPending=false;setup=true;builder=library=boardInspection=false;phoneMenu=false;CancelPointer();CloseBallDetails();DeveloperOverlay=false;
            Debug.Log("CORE_CLASH_LOBBY_SHOWN owner="+NetworkLink.LocalOwner);
        }
        // A match of the room: the host's deck against the guest's.
        public void BeginNetworkMatch(IUnityNetworkLink link,DeckDefinition hostDeck,DeckDefinition guestDeck)
        {
            // The match plays the two decks of the room; this player's own choices stay as they were.
            var first=chosen[0];var second=chosen[1];chosen[0]=hostDeck;chosen[1]=guestDeck;
            try{StartMatchState();}finally{chosen[0]=first;chosen[1]=second;}
            NetworkLink=link;networkNotice=link.Status;
            // A guest stays in the room until the host's first state of the match is here.
            remoteMatchPending=!link.IsAuthority;inLobby=remoteMatchPending;setup=remoteMatchPending;
        }
        public void PreviewLobby(LobbyState state,int owner)
        {
            lobbyPreview=state;lobbyPreviewOwner=owner;inLobby=state!=null;setup=true;builder=library=false;
            if(state!=null&&SeatColors.Valid(state.host.color,state.guest.color,Theme.PlayerColors.Length))Theme.SetPlayerColors(state.host.color,state.guest.color);
        }

        static bool NineBalls(string[] balls)=>balls!=null&&balls.Length==9;
        string SeatDeckName(LobbyState state,int owner)
        {
            var deck=MatchLobby.DeckOf(state,owner,Catalog);
            return deck.id.StartsWith("custom_")?Lang.T("Custom deck","Własna talia"):DeckName(deck);
        }

        void RenderLobby()
        {
            var room=lobbyPreview!=null?null:Room;var state=lobbyPreview??room?.Lobby;
            int me=lobbyPreview!=null?lobbyPreviewOwner:NetworkLink!=null?NetworkLink.LocalOwner:0;
            bool shortView=UiHeight<440;
            float width=Math.Min(shortView?980:760,UiWidth-(UiWidth<500?24:40)),left=(UiWidth-width)/2;
            bool wide=!shortView&&width>=600;
            float top=shortView?62:70;
            Heading(new Rect(left,top,width-116,32),Lang.T("Lobby","Poczekalnia"),shortView?18:wide?24:20);
            if(Draw.Button(new Rect(left+width-104,top-2,104,shortView?36:UiViewport.TargetSize),Lang.T("Leave","Wyjdź"),size:13)){ReturnToSetup();return;}
            if(state==null)
            {
                // A guest on the way in: the host has not answered yet.
                Draw.Text(new Rect(left,top+44,width,26),Lang.T("Connecting to the game…","Łączę z grą…"),16,Theme.OnColor,TextAnchor.MiddleLeft,true);
                return;
            }
            // This player picked another deck (here, or in the builder): the room hears of it.
            if(room!=null&&!state.inMatch&&!ReferenceEquals(lobbyDeckSent,chosen[0])){lobbyDeckSent=chosen[0];room.LobbySetDeck(chosen[0]);}
            float y=top+(shortView?40:38);
            if(!shortView)
            {
                string about=(state.roomName.Length>0?state.roomName+"  ·  ":"")+Lang.T("The match starts when both players are ready. The host gives the start.","Mecz zaczyna się, gdy obaj gracze są gotowi. Start daje gospodarz.");
                float aboutH=Math.Max(20,Draw.TextHeight(about,width,wide?13:12,true));
                Draw.Text(new Rect(left,y,width,aboutH),about,wide?13:12,OnBackdropSoft,TextAnchor.UpperLeft,true);y+=aboutH+6;
            }
            Rect controls;
            if(shortView)
            {
                float half=(width-14)/2,cardH=Math.Min(104,(UiHeight-y-18)/2);
                LobbySeatCard(new Rect(left,y,half,cardH),state,0,me,room);LobbySeatCard(new Rect(left,y+cardH+8,half,cardH),state,1,me,room);
                controls=new Rect(left+half+14,y,half,UiHeight-y-10);
            }
            else if(wide)
            {
                float half=(width-14)/2,cardH=118;
                LobbySeatCard(new Rect(left,y,half,cardH),state,0,me,room);LobbySeatCard(new Rect(left+half+14,y,half,cardH),state,1,me,room);
                controls=new Rect(left,y+cardH+14,width,UiHeight-(y+cardH+14)-12);
            }
            else
            {
                float cardH=UiHeight<720?84:100;
                LobbySeatCard(new Rect(left,y,width,cardH),state,0,me,room);LobbySeatCard(new Rect(left,y+cardH+8,width,cardH),state,1,me,room);
                controls=new Rect(left,y+2*cardH+18,width,UiHeight-(y+2*cardH+18)-12);
            }
            LobbyControls(controls,state,me,room,shortView);
        }

        // One seat of the room: whose it is, the deck it brings, whether its player is ready.
        void LobbySeatCard(Rect r,LobbyState state,int owner,int me,NgoGameSession room)
        {
            var seat=state.Seat(owner);bool mine=owner==me;Color color=seat.present?Draw.Owner(owner):Theme.Muted;
            Draw.Card(r);
            float block=Math.Min(58,r.height);
            var strip=Draw.CardFace(r);float corner=Draw.CardCorner;
            Draw.Corners(new Rect(strip.x,strip.y,block-(strip.x-r.x),strip.height),color,corner,0,0,corner);
            Draw.Ring(new Vector2(r.x+block/2,r.y+r.height*.36f),9,Theme.OnColor,2.8f,owner==1?Theme.P2RingSegments:0,Theme.P2RingFill);
            Draw.Text(new Rect(r.x,r.y+r.height*.52f,block,18),Lang.T("P","G")+(owner+1),14,Theme.OnColor,TextAnchor.MiddleCenter,true);
            if(mine&&!state.inMatch)
            {
                // This player's block: a tap takes the next colour the other player does not have.
                for(int dot=0;dot<3;dot++)Draw.Circle(new Rect(r.x+block/2-11+dot*8,r.yMax-13,6,6),Theme.A(Theme.OnColor,.85f));
                if(Draw.Hit(new Rect(r.x,r.y,block,r.height))&&room!=null)
                {
                    var other=state.Seat(1-owner);int count=Theme.PlayerColors.Length,next=seat.color;
                    for(int i=0;i<count;i++){next=(next+1)%count;if(!other.present||next!=other.color)break;}
                    MatchSetup.SetColor(0,next);MatchSetup.Save();room.LobbyColorChanged();
                }
            }
            float x=r.x+block+12,right=r.xMax-12,chipW=92,chipH=22;
            string role=(owner==0?Lang.T("HOST","GOSPODARZ"):Lang.T("GUEST","GOŚĆ"))+(mine?"  ·  "+Lang.T("YOU","TY"):"");
            Draw.Text(new Rect(x,r.y+7,right-x-chipW-6,18),role,10,seat.present?Theme.TeamDeep(owner):Theme.Muted,TextAnchor.MiddleLeft,true);
            if(!seat.present)
            {
                Draw.Text(new Rect(x,r.y+26,right-x,22),Lang.T("Waiting for Player 2…","Czekam na Gracza 2…"),r.width<420?14:16,Theme.Text,TextAnchor.MiddleLeft,true);
                // How the other player gets in: the code of an Internet game, or the same network.
                string code=room!=null&&room.UsingInternet?room.Internet?.Code??"":"";
                string way=code.Length>0?Lang.T("Game code: ","Kod gry: ")+code:room!=null&&room.UsingInternet?Lang.T("Preparing the game code…","Przygotowuję kod gry…"):Lang.T("The game shows up on the same Wi-Fi.","Gra jest widoczna w tej samej sieci Wi-Fi.");
                float inviteW=112,inviteH=Math.Min(UiViewport.TargetSize,r.height-56);
                Draw.Text(new Rect(x,r.y+50,right-x-inviteW-8,r.yMax-8-(r.y+50)),way,code.Length>0?14:12,code.Length>0?Theme.Text:Theme.Muted,TextAnchor.UpperLeft,code.Length>0);
                if(Draw.Button(new Rect(right-inviteW,r.yMax-8-inviteH,inviteW,inviteH),Lang.T("Invitation","Zaproszenie"),Draw.Cyan,size:12))GetComponent<NgoLanLobby>()?.OpenCreate();
                return;
            }
            // "Ready" - the one thing the other player waits for.
            var chip=new Rect(right-chipW,r.y+6,chipW,chipH);
            Draw.Chip(chip,seat.ready?Go:Theme.Disabled);
            Draw.Text(new Rect(chip.x,chip.y-1,chip.width,chip.height),seat.ready?Lang.T("READY","GOTOWY"):Lang.T("NOT READY","NIE GOTOWY"),10,Theme.OnColor,TextAnchor.MiddleCenter,true);
            bool deck=NineBalls(seat.balls),wins=state.round>0;float winsW=wins?chipW:0;
            Draw.Text(new Rect(x,r.y+26,right-x-winsW-(wins?6:0),22),deck?SeatDeckName(state,owner):Lang.T("Picking a deck…","Wybiera talię…"),r.width<420?14:16,deck?Theme.Text:Theme.Muted,TextAnchor.MiddleLeft,true);
            // The score of the session, once a match has been played: under the "ready" mark.
            if(wins)Draw.Text(new Rect(right-winsW,r.y+28,winsW,20),Lang.T("Wins: ","Wygrane: ")+seat.wins,12,Theme.TeamDeep(owner),TextAnchor.MiddleCenter,true);
            if(deck)
            {
                float size=r.height>=100?24:20,step=Math.Min(size+5,(right-x)/9),orbY=r.y+52+(r.yMax-8-(r.y+52)-size)/2;
                for(int i=0;i<9;i++)BallView.Preview(new Rect(x+2+i*step,orbY,size,size),Catalog.Ball(seat.balls[i]),owner);
                // A tap on the deck shows what its nine balls do - the other player's deck too.
                if(Draw.Hit(new Rect(x-4,r.y+24,right-x+4,r.yMax-4-(r.y+24))))OpenDeckGuide(MatchLobby.DeckOf(state,owner,Catalog),owner);
            }
        }

        // The value between a "previous" and a "next" button. Returns the position picked.
        static int LobbyStepper(Rect r,string value,int current,int count,bool enabled)
        {
            float arrow=Mathf.Max(44,r.height);int picked=current;
            if(Draw.Button(new Rect(r.x,r.y,arrow,r.height),"‹",Theme.Info,false,enabled,18))picked=(current+count-1)%count;
            var plate=new Rect(r.x+arrow+6,r.y,r.width-2*arrow-12,r.height-3);
            Draw.Plate(plate,Color.Lerp(Theme.Panel,Theme.Info,.12f),Theme.Info,Theme.Info,0);
            Draw.Text(plate,value,Draw.TextWidth(value,14,true)<=plate.width-10?14:12,Theme.Text,TextAnchor.MiddleCenter,true);
            if(Draw.Button(new Rect(r.xMax-arrow,r.y,arrow,r.height),"›",Theme.Info,false,enabled,18))picked=(current+1)%count;
            return picked;
        }
        string LobbyRules(LobbyState state,bool withMap,bool twoLines=false)
        {
            string size="×"+state.ballScale.ToString("0.#",System.Globalization.CultureInfo.InvariantCulture).Replace('.',',');
            return (withMap?Lang.T("Map: ","Mapa: ")+MatchSetup.MapName(state.map)+"  ·  ":"")+Lang.T("Balls ","Kulki ")+size+(twoLines?"\n":"  ·  ")+Lang.T("Double turn: ","Podwójna tura: ")+(state.doubleTurn?Lang.T("on","wł."):Lang.T("off","wył."));
        }
        string LobbyStatus(LobbyState state,int me,LobbyBlock block)
        {
            bool hosting=me==0;var mine=state.Seat(me);var other=state.Seat(1-me);
            if(block==LobbyBlock.InMatch)return Lang.T("The match is starting…","Mecz się zaczyna…");
            if(block==LobbyBlock.NoGuest)return Lang.T("Waiting for Player 2 to join.","Czekam, aż dołączy Gracz 2.");
            if(!NineBalls(mine.balls))return Lang.T("Pick a deck of nine balls.","Wybierz talię z dziewięciu kulek.");
            if(!mine.ready)return other.ready?(hosting?Lang.T("Player 2 is ready. Confirm that you are, too.","Gracz 2 jest gotowy. Potwierdź też swoją gotowość."):Lang.T("The host is ready. Confirm that you are, too.","Gospodarz jest gotowy. Potwierdź też swoją gotowość.")):Lang.T("Pick your deck, then confirm that you are ready.","Wybierz talię i potwierdź gotowość.");
            if(!NineBalls(other.balls)||!other.ready)return hosting?Lang.T("Waiting for Player 2 to be ready.","Czekam, aż Gracz 2 potwierdzi gotowość."):Lang.T("Waiting for the host to be ready.","Czekam, aż gospodarz potwierdzi gotowość.");
            return hosting?Lang.T("Everybody is ready - start the match!","Wszyscy gotowi - rozpocznij mecz!"):Lang.T("Everybody is ready. The host starts the match.","Wszyscy gotowi. Mecz rozpoczyna gospodarz.");
        }

        // What this player does in the room: their deck, the rules (the host sets them), "ready",
        // and for the host the start.
        void LobbyControls(Rect area,LobbyState state,int me,NgoGameSession room,bool shortView)
        {
            bool hosting=me==0,narrow=area.width<520,live=room!=null,open=!state.inMatch;var seat=state.Seat(me);
            const float pad=12;float w=area.width-2*pad;
            float stepH=Mathf.Max(38,UiViewport.TargetSize-4),capH=shortView?0:18,small=shortView?36:40,ruleH=hosting?Mathf.Max(30,small-6):22;
            float statusH=shortView?24:narrow?34:26,buttonH=shortView?44:50;
            float deckRows=narrow?capH+stepH+6+small+8:stepH+12;
            float ruleRows=narrow?(hosting?capH+stepH+6:0)+ruleH+6:stepH+12;
            float need=pad+deckRows+ruleRows+statusH+4+buttonH+pad;
            var card=new Rect(area.x,area.y,area.width,Mathf.Min(area.height,need));
            Draw.Card(card);
            float x=card.x+pad,at=card.y+pad;
            // ---- this player's deck
            var decks=SetupDecks;int current=Array.FindIndex(decks,d=>d.id==chosen[0].id);bool own=current<0;
            int shown=own?decks.Length:current,count=decks.Length+(own?1:0),picked;
            string deckName=own?Lang.T("Custom deck","Własna talia"):DeckName(chosen[0]);
            string build=Lang.T("Build your own","Zbuduj własną"),look=Lang.T("What do the balls do?","Co robią te kulki?");
            if(narrow)
            {
                if(capH>0)Draw.Text(new Rect(x,at,w,capH),Lang.T("YOUR DECK","TWOJA TALIA"),11,Theme.Muted,TextAnchor.MiddleLeft,true);
                at+=capH;
                picked=LobbyStepper(new Rect(x,at,w,stepH),deckName,shown,count,open);at+=stepH+6;
                float each=(w-8)/2;
                if(Draw.Button(new Rect(x,at,each,small),build,Draw.Owner(me),false,open,12))OpenLobbyBuilder(me);
                if(Draw.Button(new Rect(x+each+8,at,each,small),look,size:12))OpenDeckGuide(chosen[0],me);
                at+=small+8;
            }
            else
            {
                Draw.Text(new Rect(x,at,118,stepH),Lang.T("Your deck","Twoja talia"),13,Theme.Text,TextAnchor.MiddleLeft,true);
                float stepW=Mathf.Min(320,w*.42f);
                picked=LobbyStepper(new Rect(x+118,at,stepW,stepH),deckName,shown,count,open);
                float bx=x+118+stepW+10,each=(x+w-bx-8)/2;
                if(Draw.Button(new Rect(bx,at,each,stepH),build,Draw.Owner(me),false,open,12))OpenLobbyBuilder(me);
                if(Draw.Button(new Rect(bx+each+8,at,each,stepH),look,size:12))OpenDeckGuide(chosen[0],me);
                at+=stepH+12;
            }
            if(picked!=shown&&picked<decks.Length)chosen[0]=decks[picked];
            // ---- the rules of the match: the host's
            var maps=MatchSetup.Maps;int map=MatchSetup.Map==MatchSetup.RandomMap?0:1+Mathf.Max(0,Array.FindIndex(maps,m=>m.Id==MatchSetup.Map)),nextMap=map;
            string rulesLabel=Lang.T("Rules","Zasady");
            if(narrow)
            {
                if(hosting)
                {
                    if(capH>0)Draw.Text(new Rect(x,at,w,capH),Lang.T("MAP","MAPA"),11,Theme.Muted,TextAnchor.MiddleLeft,true);
                    at+=capH;
                    nextMap=LobbyStepper(new Rect(x,at,w,stepH),MatchSetup.MapName(state.map),map,maps.Length+1,open&&live);at+=stepH+6;
                }
                float rulesW=hosting?84:0;
                Draw.Text(new Rect(x,at,w-rulesW-(hosting?8:0),ruleH),LobbyRules(state,!hosting),12,Theme.TextSoft,TextAnchor.MiddleLeft,true);
                if(hosting&&Draw.Button(new Rect(x+w-rulesW,at,rulesW,ruleH),rulesLabel,Theme.Info,false,open,12))OpenSettings();
                at+=ruleH+6;
            }
            else
            {
                Draw.Text(new Rect(x,at,118,stepH),Lang.T("Map","Mapa"),13,Theme.Text,TextAnchor.MiddleLeft,true);
                float stepW=Mathf.Min(320,w*.42f);
                if(hosting)nextMap=LobbyStepper(new Rect(x+118,at,stepW,stepH),MatchSetup.MapName(state.map),map,maps.Length+1,open&&live);
                else
                {
                    var plate=new Rect(x+118,at,stepW,stepH-3);
                    Draw.Plate(plate,Color.Lerp(Theme.Panel,Theme.Info,.12f),Theme.Info,Theme.Info,0);
                    Draw.Text(plate,MatchSetup.MapName(state.map),14,Theme.Text,TextAnchor.MiddleCenter,true);
                }
                float bx=x+118+stepW+10,rulesW=hosting?150:0;
                Draw.Text(new Rect(bx,at,x+w-bx-rulesW-(hosting?8:0),stepH),LobbyRules(state,false,hosting),12,Theme.TextSoft,TextAnchor.MiddleLeft,true);
                if(hosting&&Draw.Button(new Rect(x+w-rulesW,at,rulesW,stepH),Lang.T("Rules and options","Zasady i opcje"),Theme.Info,false,open,12))OpenSettings();
                at+=stepH+12;
            }
            if(hosting&&live&&nextMap!=map){MatchSetup.Map=nextMap==0?MatchSetup.RandomMap:maps[nextMap-1].Id;MatchSetup.Save();room.PublishRules();}
            // ---- ready, and the host's start
            var block=live?room.LobbyBlocked:MatchLobby.BlockOf(state,NineBalls);
            float by=card.yMax-pad-buttonH;
            Draw.Text(new Rect(x,by-4-statusH,w,statusH),LobbyStatus(state,me,block),narrow?12:13,block==LobbyBlock.None?Theme.Heal:Theme.TextSoft,TextAnchor.MiddleCenter,true);
            bool canReady=open&&state.guest.present&&NineBalls(seat.balls);
            float readyW=hosting?(w-8)/2:w;
            if(Draw.Button(new Rect(x,by,readyW,buttonH),seat.ready?Lang.T("Not ready after all","Cofnij gotowość"):Lang.T("I am ready!","Jestem gotowy!"),Go,!seat.ready,canReady,narrow?14:15)&&live)room.LobbySetReady(!seat.ready);
            if(hosting&&Draw.Button(new Rect(x+readyW+8,by,readyW,buttonH),Lang.T("Start the match","Rozpocznij mecz"),Theme.Select,true,live?room.LobbyCanStart:block==LobbyBlock.None,narrow?14:15)&&live)room.LobbyStart();
        }
        // The builder for this player's own deck: drawn in their seat's colour, saved as their deck.
        void OpenLobbyBuilder(int seat){builder=true;builderOwner=seat;custom=chosen[0].balls.ToList();search="";rosterScroll=Vector2.zero;}
    }
}
