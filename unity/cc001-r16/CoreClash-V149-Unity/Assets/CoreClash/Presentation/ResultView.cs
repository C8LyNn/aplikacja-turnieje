using CoreClash.Core;
using UnityEngine;
namespace CoreClash.Presentation
{
    // CC-001 W24: the end of a match. A card rises over the arena with the winner's colour,
    // the real result reason from the simulation and the two base totals. It can be put away
    // to look at the final board. Leaving goes through the same exit guard as every other
    // exit control. W24 (the course brief: "a summary - results, statistics - and the players can
    // start again, play the next level or go back to the lobby"): the card also says how long the
    // match was and what each side has left and lost; a network match shows the score of the
    // session, and its host plays again, plays the next map or takes everybody back to the room -
    // a guest can ask for the room.
    public sealed partial class CoreClashApp
    {
        bool resultHidden;
        GameSimulation celebrated;
        float resultAt;
        // The reason comes from the rules in English; show it in the chosen language.
        static string ResultReason(string reason)
        {
            switch(reason??"")
            {
                case "":return Lang.T("Match over","Koniec meczu");
                case "Base destroyed":return Lang.T("Base destroyed","Baza zniszczona");
                case "Both bases destroyed":return Lang.T("Both bases destroyed","Obie bazy zniszczone");
                case "50 turns: base HP":return Lang.T("50 turns: more base HP","50 tur: więcej HP bazy");
                case "50 turns: identical score":return Lang.T("50 turns: identical score","50 tur: identyczny wynik");
                case "50 turns: living ball count":return Lang.T("50 turns: more balls alive","50 tur: więcej żywych kulek");
                default:return reason;
            }
        }
        void RenderResult()
        {
            var state=Simulation.State;
            if(state.phase!=MatchPhase.Over){celebrated=null;return;}
            float now=Time.unscaledTime;
            if(!ReferenceEquals(celebrated,Simulation))
            {
                celebrated=Simulation;resultAt=now;resultHidden=false;
                if(state.winner>=0)Fx.Celebrate(new Rect(0,0,UiWidth,UiHeight*.25f),Draw.Owner(state.winner),Theme.OnColor);
            }
            Fx.RenderScreen(now);
            // Small arenas (phone landscape) centre the card on the screen instead of the board.
            Rect area=board.width>=280?board:new Rect(0,60,UiWidth,UiHeight-60);
            if(resultHidden)
            {
                if(Draw.Button(new Rect(area.center.x-70,area.y+10,140,40),Lang.T("Show result","Pokaż wynik"),Theme.Select,true,true,12))resultHidden=false;
                return;
            }
            float t=Fx.ReducedMotion?1:Mathf.Clamp01((now-resultAt)/Theme.ResultRise),ease=1-(1-t)*(1-t)*(1-t);
            bool local=NetworkLink==null,draw=state.winner<0,hosting=!local&&NetworkLink.IsAuthority;
            var room=local?null:Room;var session=room?.Lobby;
            Color tint=draw?Theme.Select:Draw.Owner(state.winner),deep=draw?Theme.SelectInk:Theme.TeamDeep(state.winner);
            // The card grows by what it has to say: the two sides' balls, the session, the host's second row.
            float extra=18+(session!=null?22+(hosting?50:18):0);
            float w=Mathf.Min(area.width-12,330),h=Mathf.Min(214+extra,area.height-16);
            var card=new Rect(area.center.x-w/2,area.center.y-h/2+(1-ease)*46,w,h);
            Draw.Rect(new Rect(area.x,area.y,area.width,area.height),Theme.A(Theme.Scrim,.28f*ease));
            Draw.Shadow(card,.4f,18,10);
            Draw.Plate(card,Theme.Panel,Theme.Panel,Theme.EdgeStrong,5,0);
            // Three stars for a win, popping in one after another.
            if(!draw)for(int i=0;i<3;i++)
            {
                float pop=Fx.ReducedMotion?1:Mathf.Clamp01((now-resultAt-.18f-i*.12f)/.22f),size=(i==1?40:30)*(pop<1?pop*1.2f:1);
                if(size<=0)continue;
                var at=new Vector2(card.center.x+(i-1)*44,card.y+(i==1?4:10));
                Glyphs.Paint(new Rect(at.x-size/2-2,at.y-size/2-2,size+4,size+4),Fx.Star,Theme.Ink);
                Glyphs.Paint(new Rect(at.x-size/2,at.y-size/2,size,size),Fx.Star,Theme.Select);
            }
            var ribbon=new Rect(card.x-8,card.y+30,card.width+16,52);
            Draw.Shadow(ribbon,.22f,6,4);
            Draw.Plate(ribbon,tint,tint,deep,5,0);
            bool you=!local&&!draw&&NetworkLink.LocalOwner==state.winner;
            string title=draw?Lang.T("DRAW","REMIS"):aiMatch?(state.winner==0?Lang.T("YOU WIN!","WYGRYWASZ!"):Lang.T("AI WINS","WYGRYWA AI")):local?Lang.T("PLAYER ","GRACZ ")+(state.winner+1)+Lang.T(" WINS!"," WYGRYWA!"):you?Lang.T("YOU WIN!","WYGRYWASZ!"):Lang.T("PLAYER ","GRACZ ")+(state.winner+1)+Lang.T(" WINS"," WYGRYWA");
            Draw.Text(new Rect(ribbon.x,ribbon.y+1,ribbon.width,ribbon.height-5),title,w<280?20:24,new Color(0,0,0,.22f),TextAnchor.MiddleCenter,true);
            Draw.Text(new Rect(ribbon.x,ribbon.y-1,ribbon.width,ribbon.height-5),title,w<280?20:24,draw?Theme.Ink:Theme.OnColor,TextAnchor.MiddleCenter,true);
            // A match against the computer says on which level it was played, when that fits beside the reason.
            string reason=ResultReason(state.resultReason),versus=aiMatch?Lang.T("Computer: ","Komputer: ")+MatchSetup.AiLevelName(aiLevel).ToLowerInvariant():"";
            if(versus.Length>0)reason=reason.Length==0?versus:Draw.TextWidth(reason+"  ·  "+versus,13,true)<=card.width-24?reason+"  ·  "+versus:reason;
            // How long the match was, when that fits beside the reason.
            string length=Lang.T("turn ","tura ")+state.turnNumber;
            if(Draw.TextWidth(reason+"  ·  "+length,13,true)<=card.width-24)reason+="  ·  "+length;
            Draw.Text(new Rect(card.x+12,ribbon.yMax+6,card.width-24,20),reason,13,Theme.Text,TextAnchor.MiddleCenter,true);
            // Both bases, in their colours, with what is left of the 20 HP.
            float cellW=(card.width-36)/2,cellY=ribbon.yMax+30;
            for(int owner=0;owner<2;owner++)
            {
                var cell=new Rect(card.x+12+owner*(cellW+12),cellY,cellW,30);
                Draw.Round(cell,Color.Lerp(Theme.Panel,Draw.Owner(owner),.16f));
                Draw.Ring(new Vector2(cell.x+15,cell.center.y),6,Theme.TeamDeep(owner),2.2f,owner==1?Theme.P2RingSegments:0,Theme.P2RingFill);
                // The word "BASE" is dropped when it would run into the number.
                string seat=Lang.T("P","G")+(owner+1),label=seat+Lang.T(" BASE"," BAZA"),left=state.players[owner].hp+" / 20";
                if(Draw.TextWidth(label,10,true)+Draw.TextWidth(left,14,true)+8>cell.width-36)label=seat;
                Draw.Text(new Rect(cell.x+28,cell.y,cell.width-36,cell.height),label,10,Theme.TeamDeep(owner),TextAnchor.MiddleLeft,true);
                Draw.Text(new Rect(cell.x+28,cell.y,cell.width-36,cell.height),left,14,Theme.Text,TextAnchor.MiddleRight,true);
                // What the side has on the board and what it lost.
                int alive=0,lost=0;
                foreach(var ball in state.balls){if(ball.owner!=owner)continue;if(ball.dead)lost++;else if(!ball.banished)alive++;}
                Draw.Text(new Rect(cell.x,cell.yMax+2,cell.width,16),Lang.T("balls ","kulki ")+alive+"  ·  "+Lang.T("lost ","stracone ")+lost,10,Theme.Muted,TextAnchor.MiddleCenter,true);
            }
            float buttonY=card.yMax-5-44-10,buttonW=(card.width-36)/2,secondX=card.x+24+buttonW;
            if(local)
            {
                if(Draw.Button(new Rect(card.x+12,buttonY,buttonW,44),Lang.T("Play again","Zagraj ponownie"),tint,true,true,14))StartLocalMatch();
                if(Draw.Button(new Rect(secondX,buttonY,buttonW,44),Lang.T("Decks","Talie"),size:14))RequestLeaveMatch();
            }
            else
            {
                float lineY=cellY+30+20;
                if(session!=null)
                {
                    // The score of the session, each number in its player's colour.
                    string label=Lang.T("Session","Sesja");float labelW=Draw.TextWidth(label,11,true),scoreW=74,startX=card.center.x-(labelW+10+scoreW)/2;
                    Draw.Text(new Rect(startX,lineY,labelW+2,20),label,11,Theme.Muted,TextAnchor.MiddleLeft,true);
                    Draw.Text(new Rect(startX+labelW+10,lineY,30,20),session.host.wins.ToString(),16,Theme.TeamDeep(0),TextAnchor.MiddleRight,true);
                    Draw.Text(new Rect(startX+labelW+40,lineY,14,20),":",14,Theme.Text,TextAnchor.MiddleCenter,true);
                    Draw.Text(new Rect(startX+labelW+54,lineY,30,20),session.guest.wins.ToString(),16,Theme.TeamDeep(1),TextAnchor.MiddleLeft,true);
                    lineY+=21;
                }
                // The room goes on after the match. The host decides what is played next.
                bool again=hosting&&session!=null&&session.inMatch&&session.guest.present,back=session!=null&&session.inMatch;
                if(hosting)
                {
                    if(Draw.Button(new Rect(card.x+12,buttonY-50,buttonW,44),Lang.T("Rematch","Rewanż"),tint,true,again,14))room.LobbyRematch(false);
                    if(Draw.Button(new Rect(secondX,buttonY-50,buttonW,44),Lang.T("Next map","Następna mapa"),Theme.Info,false,again,13))room.LobbyRematch(true);
                }
                else if(session!=null)Draw.Text(new Rect(card.x+12,lineY,card.width-24,16),Lang.T("The host decides about a rematch.","O rewanżu decyduje gospodarz."),11,Theme.Muted,TextAnchor.MiddleCenter,true);
                if(Draw.Button(new Rect(card.x+12,buttonY,buttonW,44),Lang.T("Lobby","Poczekalnia"),hosting?(Color?)null:tint,!hosting,back,14))room.LobbyReturn();
                if(Draw.Button(new Rect(secondX,buttonY,buttonW,44),Lang.T("Leave","Wyjdź"),size:14))RequestLeaveMatch();
            }
            if(Draw.Button(new Rect(card.xMax-40,card.y+6,32,24),"×",size:14))resultHidden=true;
        }
    }
}
