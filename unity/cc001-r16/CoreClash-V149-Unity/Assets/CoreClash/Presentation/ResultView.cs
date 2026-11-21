using CoreClash.Core;
using UnityEngine;
namespace CoreClash.Presentation
{
    // CC-001 W24: the end of a match. A card rises over the arena with the winner's colour,
    // the real result reason from the simulation and the two base totals. It can be put away
    // to look at the final board. Leaving goes through the same exit guard as every other
    // exit control; "Play again" exists only for a local match.
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
            bool local=NetworkLink==null,draw=state.winner<0;
            Color tint=draw?Theme.Select:Draw.Owner(state.winner),deep=draw?Theme.SelectInk:Theme.TeamDeep(state.winner);
            float w=Mathf.Min(area.width-12,330),h=Mathf.Min(214,area.height-16);
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
            Draw.Text(new Rect(card.x+12,ribbon.yMax+6,card.width-24,20),ResultReason(state.resultReason),13,Theme.Text,TextAnchor.MiddleCenter,true);
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
            }
            float buttonY=card.yMax-5-44-10,buttonW=local?(card.width-36)/2:card.width-24;
            if(local&&Draw.Button(new Rect(card.x+12,buttonY,buttonW,44),Lang.T("Play again","Zagraj ponownie"),tint,true,true,14))StartLocalMatch();
            if(Draw.Button(new Rect(local?card.x+24+buttonW:card.x+12,buttonY,buttonW,44),local?Lang.T("Decks","Talie"):Lang.T("Leave","Wyjdź"),size:14))RequestLeaveMatch();
            if(Draw.Button(new Rect(card.xMax-40,card.y+6,32,24),"×",size:14))resultHidden=true;
        }
    }
}
