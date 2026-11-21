using System;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using UnityEngine;
namespace CoreClash.Presentation
{
    // CC-001 W24: the match HUD, designed for a phone held upright first.
    //   phone portrait   score strip in the top bar, the arena, then a tray: the selected ball,
    //                    four icon buttons and a 5 x 2 grid of icon cards (Standard + the nine
    //                    specials). Nothing scrolls; every target is at least 44 units.
    //   phone landscape  the fixed compact rows of MatchLayout: score, selected ball, one row
    //                    of nine icon cards, actions.
    //   tablet / desktop the fitted side panel of MatchPanelLayout with named cards.
    // Inputs and rules are unchanged; this file only decides where things are drawn.
    public sealed partial class CoreClashApp
    {
        // Icons for actions (Glyphs shape lists): details, inspect, STOP mark, leave.
        const string IconInfo="+C 0 -.66 .2;+L 0 -.14 0 .72 .36";
        const string IconInspect="+R -.16 -.16 .52 .24;+L .26 .26 .8 .8 .3";
        const string IconStop="+R 0 0 .78 .2;+C 0 0 .26";
        const string IconLeave="+L -.62 0 .72 0 .28;+L -.62 0 -.12 -.5 .28;+L -.62 0 -.12 .5 .28";
        const string IconEndless="+R -.42 0 .36 .22;+R .42 0 .36 .22";

        void RenderMatch()
        {
            var state=Simulation.State;if(state.phase==MatchPhase.Aiming)selected=BallSelection.ForTurn(Simulation,selected);
            int displayOwner=LocalDeckContent.DisplayOwner(state.turn,LocalSeat);
            int visualOwner=displayOwner>=0?displayOwner:state.turn;
            var remoteVisual=NetworkLink!=null&&!NetworkLink.IsAuthority&&NetworkLink.IsConnected?remoteBallSmoother:null;
            BoardView.Render(board,Simulation,gesture,Catalog.Ball(selected),feedback,remoteVisual,ViewOwner,gesture.Active?replayId:0);
            if(layout.CompactLandscape){RenderCompactLandscape();RenderResult();return;}
            if(layout.PhonePortrait){RenderPhoneTray();RenderResult();return;}
            if(layout.Portrait){ScoreStrip(new Rect(12,66,UiWidth-24,44));Draw.Label(new Rect(12,111,UiWidth-24,14),Soft(TurnText()),11,Theme.OnColor,TextAnchor.MiddleCenter,true);}
            RenderSidePanel(displayOwner,visualOwner);
            RenderResult();
        }

        // Both bases and the turn in one row. The acting player's pill is filled with their
        // colour; the other one is white. The bar is that base's 20 HP in quarters.
        void ScoreStrip(Rect r)
        {
            var state=Simulation.State;bool over=state.phase==MatchPhase.Over;
            float gap=6,mid=Mathf.Clamp(r.width*.2f,60,104),w=(r.width-mid-gap*2)/2;
            ScorePill(new Rect(r.x,r.y,w,r.height),0);
            ScorePill(new Rect(r.xMax-w,r.y,w,r.height),1);
            var badge=new Rect(r.x+w+gap,r.y,mid,r.height);
            Draw.Shadow(badge,.16f,6,3);Draw.Round(badge,Theme.Ink);
            Draw.Text(new Rect(badge.x,badge.y+3,badge.width,13),over?Lang.T("Result","Wynik"):Lang.T("Turn","Tura"),9,new Color(1,1,1,.75f),TextAnchor.MiddleCenter,true);
            string big=over?(state.winner<0?Lang.T("DRAW","REMIS"):Lang.T("P","G")+(state.winner+1)):state.turnNumber+"/50";
            Draw.Text(new Rect(badge.x,badge.y+14,badge.width,badge.height-16),big,badge.height>=44?16:14,over?Theme.Select:Theme.OnColor,TextAnchor.MiddleCenter,true);
        }
        void ScorePill(Rect cell,int owner)
        {
            var state=Simulation.State;Color team=Draw.Owner(owner),deep=Theme.TeamDeep(owner);int hp=state.players[owner].hp;
            bool acting=state.turn==owner&&state.phase!=MatchPhase.Over;
            float flash=0;
            foreach(var item in feedback.Items)if(item.kind=="BASE_DAMAGE"&&item.owner==owner)flash=Mathf.Max(flash,1-Mathf.Clamp01((Time.unscaledTime-item.born)/Theme.BaseFlash));
            Color fill=Color.Lerp(acting?team:Theme.Panel,Theme.Damage,flash*.55f);
            Draw.Shadow(cell,acting?.24f:.12f,7,3);
            Draw.Round(cell,acting?deep:Color.Lerp(team,Color.white,.45f));
            Draw.Round(new Rect(cell.x+2,cell.y+2,cell.width-4,cell.height-(acting?7:4)),fill);
            Color ink=acting||flash>.4f?Theme.OnColor:deep;
            float top=cell.y+2,rowH=cell.height-(acting?7:4)-10;
            Draw.Ring(new Vector2(cell.x+16,top+rowH*.5f),6.5f,ink,2.4f,owner==1?Theme.P2RingSegments:0,Theme.P2RingFill);
            bool you=NetworkLink!=null&&NetworkLink.LocalOwner==owner;
            string name=cell.width<150?Lang.T("P","G")+(owner+1)+(you?Lang.T(" YOU"," TY"):""):Lang.T("PLAYER ","GRACZ ")+(owner+1)+(you?Lang.T(" · YOU"," · TY"):"");
            Draw.Text(new Rect(cell.x+28,top,cell.width-28-50,rowH),name,cell.width<150?11:12,ink,TextAnchor.MiddleLeft,true);
            int numberSize=cell.height>=44?21:17;
            Draw.Text(new Rect(cell.xMax-58,top-1,48,rowH+2),hp.ToString(),numberSize,ink,TextAnchor.MiddleRight,true);
            // The same picture as on the base wall: a heart by the number and one pip for each HP.
            float heart=numberSize*.62f,heartX=cell.xMax-12-Draw.TextWidth(hp.ToString(),numberSize,true)-heart-3;
            if(heartX>cell.x+28+60)Glyphs.Paint(new Rect(heartX,top+(rowH-heart)*.5f+1,heart,heart),BoardView.HeartGlyph,ink);
            var bar=new Rect(cell.x+10,top+rowH,cell.width-20,7);float pipStep=bar.width/BoardView.BasePips;
            for(int i=0;i<BoardView.BasePips;i++)
                Draw.Rect(new Rect(bar.x+i*pipStep,bar.y,Mathf.Max(1.5f,pipStep-1.6f),bar.height),i<hp?(acting?Color.white:team):(acting?new Color(0,0,0,.25f):Theme.PanelRaised));
        }

        // W20: desktop/tablet side panel. Rows come from MatchPanelLayout, so everything a
        // decision needs is visible without scrolling, in this order: whose turn, base HP,
        // the selected ball and its stock, the deck, actions, the result of the last action.
        void RenderSidePanel(int displayOwner,int visualOwner)
        {
            var state=Simulation.State;bool over=state.phase==MatchPhase.Over;
            // W24: the panel is a dark console, like the phone tray; text straight on it is light.
            Color active=over?Theme.Select:Color.Lerp(Draw.Owner(state.turn),Color.white,.62f);
            Draw.Rail(side);
            var inner=Draw.Inset(side,12);
            var rows=MatchPanelLayout.For(inner.width,inner.height,UiViewport.TargetSize,!layout.Portrait);
            if(rows.Scrolls)matchScroll=Draw.ScrollView(inner,matchScroll,new Rect(0,0,rows.Width,rows.ContentHeight));
            else{matchScroll=Vector2.zero;GUI.BeginGroup(inner);}
            if(rows.Scoreboard)
            {
                // Turn ribbon in the acting player's colour.
                var turn=RectOf(rows.Turn);Color ribbon=over?Theme.Select:Draw.Owner(state.turn);
                Draw.Round(turn,over?Theme.SelectInk:Theme.TeamDeep(state.turn));Draw.Round(new Rect(turn.x,turn.y,turn.width,turn.height-3),ribbon);
                string status=Soft(TurnText());int cut=status.IndexOf("     ",StringComparison.Ordinal);
                Color onRibbon=over?Theme.Ink:Theme.OnColor;
                if(cut<0)Draw.Text(new Rect(turn.x+14,turn.y,turn.width-26,turn.height-3),status,status.Length>22?13:17,onRibbon,TextAnchor.MiddleLeft,true);
                else
                {
                    string who=status.Substring(cut).Trim(),count=status.Substring(0,cut);
                    float countWidth=Mathf.Min(turn.width*.34f,count.Length*7.4f+8);
                    Draw.Text(new Rect(turn.x+14,turn.y,turn.width-countWidth-28,turn.height-3),who,who.Length>24?11:who.Length>17?13:rows.Tight?15:17,onRibbon,TextAnchor.MiddleLeft,true);
                    Draw.Text(new Rect(turn.xMax-countWidth-10,turn.y,countWidth,turn.height-3),count,Theme.FontSmall,Theme.A(onRibbon,.85f),TextAnchor.MiddleRight,true);
                }
                ScorePill(RectOf(rows.Hp1),0);ScorePill(RectOf(rows.Hp2),1);
            }
            var d=Catalog.Ball(selected);var strip=RectOf(rows.Selected);
            Draw.Round(strip,Theme.Select);Draw.Round(Draw.Inset(strip,2),Color.Lerp(Theme.Panel,Theme.Select,.1f));
            float orb=(strip.height-(rows.Tight?22:26))*SelectPulse();
            BallView.Preview(new Rect(strip.x+15+(strip.height-(rows.Tight?22:26)-orb)/2,strip.y+(strip.height-orb)/2,orb,orb),d,visualOwner,true);
            float textX=strip.x+(strip.height-(rows.Tight?22:26))+32,textWidth=strip.xMax-textX-10;
            Draw.Text(new Rect(textX,strip.y+(rows.Tight?5:7),textWidth,22),BallIcons.Name(d),rows.Tight?16:19,Theme.Text,TextAnchor.MiddleLeft,true);
            string stockText=selected=="normal"?Lang.T("unlimited","bez limitu"):LocalDeckContent.StockLabel(Simulation,displayOwner,selected);
            var chosenGuide=BallGuide.For(selected);
            string facts=(rows.Tight&&chosenGuide!=null?chosenGuide.Tag+"  ·  ":"")+d.hp+" HP  ·  "+stockText;
            Draw.Text(new Rect(textX,strip.y+(rows.Tight?27:30),textWidth,16),facts,Theme.FontSmall,Theme.SelectInk,TextAnchor.MiddleLeft,true);
            if(!rows.Tight)GuideLine(new Rect(textX,strip.y+46,textWidth,18),selected,Theme.FontSmall);
            string deckHeading=NetworkLink==null?Lang.T("Deck","Talia"):displayOwner<0?Lang.T("Deck unavailable","Talia niedostępna"):Lang.T("Your deck","Twoja talia");
            var heading=RectOf(rows.Heading);
            Draw.Text(heading,deckHeading,10,new Color(1,1,1,.82f),TextAnchor.MiddleLeft,true);
            if(!UiViewport.IsTouch&&heading.width>=330)Draw.Text(heading,Lang.T("Keys 1-9  ·  0 Standard","Klawisze 1-9  ·  0 Zwykła"),Theme.FontTiny,new Color(1,1,1,.55f),TextAnchor.MiddleRight,true);
            var ids=LocalDeckContent.StockIds(state,displayOwner);
            for(int i=0;i<ids.Length&&i<rows.Cards.Length;i++)BallCard(RectOf(rows.Cards[i]),ids[i]);
            bool normalSelected=selected=="normal";var standard=RectOf(rows.Standard);
            if(Draw.Button(standard,Lang.T("Standard  ·  unlimited","Zwykła  ·  bez limitu"),Draw.Owner(visualOwner),normalSelected,CanChoose,12))SelectBall("normal");
            BallView.Preview(new Rect(standard.x+13,standard.y+(standard.height-4-20)/2,20,20),Catalog.Ball("normal"),visualOwner,false);
            bool touch=UiViewport.TargetSize>=44;int actionFont=rows.Width<380?10:touch?12:11;
            if(Draw.Button(RectOf(rows.Actions[0]),Lang.T("Details","Opis"),size:actionFont))ShowBallDetails(selected);
            if(Draw.Button(RectOf(rows.Actions[1]),boardInspection?Lang.T("Cancel","Anuluj"):Lang.T("Inspect","Podgląd"),Theme.Info,boardInspection,true,actionFont))SetBoardInspection(!boardInspection);
            if(Draw.Button(RectOf(rows.Actions[2]),BoardView.ShowStopEstimate?Lang.T("Stop mark: on","Znacznik stopu: wł."):Lang.T("Stop mark: off","Znacznik stopu: wył."),Theme.Select,BoardView.ShowStopEstimate,true,actionFont))ToggleStopEstimate();
            if(Draw.Button(RectOf(rows.Actions[3]),Lang.T("Leave","Wyjdź"),size:actionFont))RequestLeaveMatch();
            string hint=boardInspection?Lang.T("TAP A BALL TO INSPECT","DOTKNIJ KULKI, ŻEBY JĄ OBEJRZEĆ"):over?(state.winner<0?Lang.T("DRAW","REMIS"):(Lang.T("PLAYER ","GRACZ ")+(state.winner+1)+Lang.T(" WINS"," WYGRYWA"))):
                LocalTurnPresentation.ActionHint(state,NetworkLink==null?-1:NetworkLink.LocalOwner,
                    NetworkLink!=null,NetworkLink==null||NetworkLink.IsConnected,gesture.Active,
                    gesture.AimX-gesture.OriginX,gesture.AimY-gesture.OriginY,Lang.T("DRAG FROM YOUR LAUNCHER TO AIM","PRZECIĄGNIJ OD WYRZUTNI, ŻEBY WYCELOWAĆ"));
            // Second line, most relevant first: result, inspection help, a rejected shot,
            // the last action's result from real events, then the standing tip.
            string summary=ActionSummary.For(state);bool result=false;string detail;
            if(over)detail=ResultReason(state.resultReason);
            else if(boardInspection)detail=Lang.T("Inspect either player's ball. Cancel to resume aiming.","Obejrzyj kulkę dowolnego gracza. Anuluj, żeby wrócić do celowania.");
            else if(notice.Length>0&&CanChoose)detail=notice;
            else if(summary.Length>0){detail=summary;result=true;}
            else detail=state.bonusPending?Lang.T("Player 2 gets one extra spawn on the opening turn.","Gracz 2 dostaje jeden dodatkowy strzał w pierwszej turze."):Lang.T("A glowing home ball can Replay before you spawn.","Świecącą kulkę w twojej strefie możesz wystrzelić ponownie przed nowym strzałem.");
            var hintBox=RectOf(rows.Hint);
            Draw.Round(hintBox,new Color(.03f,.02f,.16f,.42f));
            Draw.Text(new Rect(hintBox.x+10,hintBox.y+3,hintBox.width-20,17),Soft(hint),13,active,TextAnchor.MiddleLeft,true);
            Draw.Text(new Rect(hintBox.x+10,hintBox.y+20,hintBox.width-20,hintBox.height-22),detail??"",rows.Tight?10:11,result?Color.white:new Color(1,1,1,.74f),TextAnchor.UpperLeft,result);
            if(rows.Scrolls)GUI.EndScrollView();else GUI.EndGroup();
        }
        // A short pop of the selected orb right after a card is chosen.
        float SelectPulse()
        {
            float age=Time.unscaledTime-selectedAt;
            if(Fx.ReducedMotion||age<0||age>=Theme.SelectPop)return 1;
            float t=age/Theme.SelectPop;return 1+.16f*Mathf.Sin(t*Mathf.PI);
        }
        public void ToggleStopEstimate(){BoardView.ShowStopEstimate=!BoardView.ShowStopEstimate;Debug.Log("CORE_CLASH_STOP_MARK "+BoardView.ShowStopEstimate);}

        // Compact phone landscape does not use the 810-unit desktop scroll view.
        // Every critical control is drawn from testable MatchLayout rectangles.
        void RenderCompactLandscape()
        {
            var state=Simulation.State;
            int owner=state.turn;bool over=state.phase==MatchPhase.Over;
            Draw.Rail(side);
            Rect hud=RectOf(layout.CompactHud),choice=RectOf(layout.CompactChoice);
            Rect cards=RectOf(layout.CompactCards),actions=RectOf(layout.CompactActions);
            Rect feedbackRow=RectOf(layout.CompactFeedback);
            ScoreStrip(hud);
            int displayOwner=LocalDeckContent.DisplayOwner(state.turn,LocalSeat);
            int tintOwner=displayOwner>=0?displayOwner:owner;

            Draw.Round(choice,Theme.PanelLight);
            var d=Catalog.Ball(selected);float orb=28*SelectPulse();
            if(!over)BallView.Preview(new Rect(choice.x+22-orb/2,choice.center.y-orb/2,orb,orb),d,tintOwner,true);
            float textX=over?choice.x+10:choice.x+46;
            string name=over?TurnText():BallIcons.Name(d);
            Draw.Text(new Rect(textX,choice.y+2,choice.xMax-textX-136,22),name,14,Theme.Text,TextAnchor.MiddleLeft,true);
            string hint=over?ResultReason(state.resultReason):
                boardInspection?Lang.T("TAP BALL TO INSPECT","DOTKNIJ KULKI"):
                LocalTurnPresentation.ActionMessage(state,NetworkLink==null?-1:NetworkLink.LocalOwner,
                    NetworkLink!=null,NetworkLink==null||NetworkLink.IsConnected,gesture.Active,
                    gesture.AimX-gesture.OriginX,gesture.AimY-gesture.OriginY,Lang.T("DRAG FROM LAUNCHER","PRZECIĄGNIJ OD WYRZUTNI"),notice);
            Draw.Text(new Rect(textX,choice.y+23,choice.xMax-textX-136,19),Soft(hint),11,Theme.Muted,TextAnchor.MiddleLeft,true);
            if(Draw.Button(new Rect(choice.xMax-128,choice.y,128,44),Lang.T("Standard","Zwykła"),Draw.Owner(tintOwner),selected=="normal",CanChoose,12))SelectBall("normal");

            if(over){
                Draw.Round(cards,Color.Lerp(Theme.Panel,Theme.Select,.25f));
                Draw.Text(Draw.Inset(cards,6),ResultReason(state.resultReason).Length>0?ResultReason(state.resultReason):TurnText(),12,Theme.SelectInk,TextAnchor.MiddleCenter,true);
            }else{
                // Nine icon cards in one row: no arrows, no scrolling.
                var ids=LocalDeckContent.StockIds(state,displayOwner);
                float gap=5,cardW=(cards.width-gap*8)/9;
                for(int i=0;i<ids.Length&&i<9;i++)IconCard(new Rect(cards.x+i*(cardW+gap),cards.y,cardW,cards.height),ids[i],displayOwner);
            }

            float actionW=(actions.width-12)/4;
            if(Draw.Button(new Rect(actions.x,actions.y,actionW,44),Lang.T("Details","Opis"),size:12))ShowBallDetails(selected);
            if(Draw.Button(new Rect(actions.x+actionW+4,actions.y,actionW,44),boardInspection?Lang.T("Cancel","Anuluj"):Lang.T("Inspect","Podgląd"),Theme.Info,boardInspection,true,12))SetBoardInspection(!boardInspection);
            if(Draw.Button(new Rect(actions.x+2*(actionW+4),actions.y,actionW,44),BoardView.ShowStopEstimate?Lang.T("Stop: on","Stop: wł."):Lang.T("Stop: off","Stop: wył."),Theme.Select,BoardView.ShowStopEstimate,true,12))ToggleStopEstimate();
            if(Draw.Button(new Rect(actions.x+3*(actionW+4),actions.y,actionW,44),Lang.T("Leave","Wyjdź"),size:12))RequestLeaveMatch();
            if(feedbackRow.height>=20){
                string message=over?TurnText():
                    boardInspection?Lang.T("CANCEL INSPECT TO AIM","ANULUJ PODGLĄD, ŻEBY CELOWAĆ"):
                    LocalTurnPresentation.ActionMessage(state,NetworkLink==null?-1:NetworkLink.LocalOwner,
                        NetworkLink!=null,NetworkLink==null||NetworkLink.IsConnected,gesture.Active,
                        gesture.AimX-gesture.OriginX,gesture.AimY-gesture.OriginY,Lang.T("SELECT A BALL AND DRAG TO AIM","WYBIERZ KULKĘ I PRZECIĄGNIJ"),notice);
                Draw.Text(feedbackRow,Soft(message),12,over?Theme.Select:Color.Lerp(Draw.Owner(owner),Color.white,.62f),TextAnchor.MiddleLeft,true);
            }
        }

        // Phone portrait tray (W24): only what a thumb needs. Two rows of six large cells, edge to
        // edge: Standard and the nine specials, then "about this ball" and one menu button. Everything
        // else (inspect, STOP mark, effects, leave) lives in the menu, so there is never a row of
        // small buttons to hit. No words: the chosen card lifts and glows.
        const string IconMenu="+C -.62 0 .22;+C 0 0 .22;+C .62 0 .22";
        bool phoneMenu;
        void RenderPhoneTray()
        {
            var state=Simulation.State;
            // W24: the cards lie on a dark rail, like the hand in other games, so they stand out.
            Draw.Rect(new Rect(side.x,side.y-3,side.width,3),Theme.Ink);
            Draw.VGradient(side,Theme.RailTop,Theme.RailBottom);
            Draw.Rect(new Rect(side.x,side.y+5,side.width,1.5f),new Color(1,1,1,.22f));
            int owner=LocalDeckContent.DisplayOwner(state.turn,LocalSeat);
            int tintOwner=owner>=0?owner:state.turn;
            // The tray carries the acting player's colour along its top edge.
            Draw.Rect(new Rect(side.x,side.y,side.width,5),state.phase==MatchPhase.Over?Theme.Select:Draw.Owner(state.turn));
            const int columns=6;const float gap=5,pad=6;
            var ids=LocalDeckContent.StockIds(state,owner);
            float cellW=(side.width-pad*2-gap*(columns-1))/columns,cellH=(side.height-9-pad-gap)/2;
            Rect Cell(int slot)=>new Rect(side.x+pad+(slot%columns)*(cellW+gap),side.y+9+(slot/columns)*(cellH+gap),cellW,cellH);
            IconCard(Cell(0),"normal",tintOwner);
            for(int i=0;i<ids.Length&&i<9;i++)IconCard(Cell(i+1),ids[i],owner);
            if(Draw.IconButton(Cell(10),IconInfo))ShowBallDetails(selected);
            if(Draw.IconButton(Cell(11),IconMenu,Theme.Info,phoneMenu))phoneMenu=!phoneMenu;
            RenderSelectionHint(owner>=0?owner:state.turn);
            if(phoneMenu)RenderPhoneMenu();
        }
        // W24: for a few seconds after a ball is tapped, a strip above the launch point says what it
        // is: its name and its short label. A tap on the strip, or a second tap on the same card,
        // opens the full card. The strip hides as soon as the player starts to aim.
        Rect hintRect;bool hintShown;string tappedId="";int tappedTurn=-1;
        public void TapTrayBall(string id){SelectBall(id);if(selected==id){tappedId=id;tappedTurn=Simulation.State.turnNumber;selectedAt=Time.unscaledTime;}}
        const float HintSeconds=4.5f;
        void RenderSelectionHint(int owner)
        {
            if(Event.current.type==EventType.Layout)hintShown=false;
            var d=Catalog.Ball(selected);var guide=BallGuide.For(selected);
            if(d==null||guide==null||!CanChoose||gesture.Active||phoneMenu||boardInspection||tappedId!=selected||tappedTurn!=Simulation.State.turnNumber||Time.unscaledTime-selectedAt>HintSeconds)return;
            string name=BallIcons.Name(d),tag=guide.Tag;
            float nameW=Draw.TextWidth(name,15,true),tagW=Draw.TextWidth(tag,13,true),icon=16,w=Mathf.Min(UiWidth-20,50+nameW+16+icon+5+tagW+40),h=46;
            float scale=board.width/540f,bottom=Mathf.Min(side.y-8,board.y+(853-21.25f-16)*scale);
            hintRect=new Rect((UiWidth-w)/2,bottom-h,w,h);hintShown=true;
            Draw.Card(hintRect,null,null,.3f);
            BallView.Preview(new Rect(hintRect.x+9,hintRect.y+8,30,30),d,owner);
            float x=hintRect.x+50;
            Draw.Text(new Rect(x,hintRect.y,nameW+4,h-2),name,15,Theme.Text,TextAnchor.MiddleLeft,true);x+=nameW+16;
            Color tone=WhenColor(guide.When);
            Glyphs.Paint(new Rect(x,hintRect.y+(h-2-icon)/2,icon,icon),WhenGlyph(guide.When),tone);x+=icon+5;
            Draw.Text(new Rect(x,hintRect.y,hintRect.xMax-36-x,h-2),tag,13,Color.Lerp(tone,Theme.Ink,.35f),TextAnchor.MiddleLeft,true);
            var more=new Rect(hintRect.xMax-33,hintRect.y+(h-2-24)/2,24,24);
            Draw.Circle(more,Theme.Info);Glyphs.Paint(new Rect(more.x+6,more.y+6,12,12),IconInfo,Theme.OnColor);
        }
        // Four large buttons above the tray. A tap anywhere else closes it.
        void RenderPhoneMenu()
        {
            if(GUI.Button(new Rect(0,0,UiWidth,side.y),GUIContent.none,GUIStyle.none)){phoneMenu=false;return;}
            Draw.Rect(new Rect(0,0,UiWidth,side.y),Theme.A(Theme.Scrim,.45f));
            float pad=12,gap=10,buttonH=64,w=UiWidth-pad*2,h=buttonH*2+gap+pad*2;
            var sheet=new Rect(pad,side.y-h-10,w,h);
            Draw.Card(sheet,null,null,.4f);
            float cell=(w-pad*2-gap)/2;
            Rect Slot(int i)=>new Rect(sheet.x+pad+(i%2)*(cell+gap),sheet.y+pad+(i/2)*(buttonH+gap),cell,buttonH);
            if(MenuButton(Slot(0),IconInspect,boardInspection?Lang.T("Stop inspecting","Koniec podglądu"):Lang.T("Inspect a ball","Obejrzyj kulkę"),Theme.Info,boardInspection)){SetBoardInspection(!boardInspection);phoneMenu=false;}
            if(MenuButton(Slot(1),IconStop,BoardView.ShowStopEstimate?Lang.T("Stop mark: on","Znacznik stopu: wł."):Lang.T("Stop mark: off","Znacznik stopu: wył."),Theme.Select,BoardView.ShowStopEstimate))ToggleStopEstimate();
            if(MenuButton(Slot(2),Fx.Star,Fx.ReducedMotion?Lang.T("Effects: calm","Efekty: spokojne"):Lang.T("Effects: full","Efekty: pełne"),Theme.Heal,!Fx.ReducedMotion))Fx.SetReducedMotion(!Fx.ReducedMotion);
            if(MenuButton(Slot(3),IconLeave,Lang.T("Leave match","Wyjdź z meczu"),Theme.Damage,false)){phoneMenu=false;RequestLeaveMatch();}
        }
        static bool MenuButton(Rect r,string icon,string label,Color accent,bool on)
        {
            bool click=Draw.Button(r,"",accent,on);
            float size=26;Color ink=on?Theme.OnColor:Color.Lerp(accent,Theme.Ink,.35f);
            Glyphs.Paint(new Rect(r.x+16,r.y+(r.height-4-size)/2,size,size),icon,ink);
            Draw.Text(new Rect(r.x+50,r.y,r.width-56,r.height-4),label,14,ink,TextAnchor.MiddleLeft,true);
            return click;
        }
        // W24: sentence case reads friendlier than capitals. Display only; the source strings are unchanged.
        static string Soft(string text)
        {
            if(string.IsNullOrEmpty(text))return text??"";
            var chars=text.ToLowerInvariant().ToCharArray();bool start=true;
            for(int i=0;i<chars.Length;i++)
            {
                if(start&&char.IsLetter(chars[i])){chars[i]=char.ToUpperInvariant(chars[i]);start=false;}
                else if(chars[i]=='·'||chars[i]=='.'||chars[i]=='!')start=true;
                else if(!char.IsWhiteSpace(chars[i]))start=false;
                if(chars[i]=='p'&&i+1<chars.Length&&(chars[i+1]=='1'||chars[i+1]=='2')&&(i==0||!char.IsLetter(chars[i-1])))chars[i]='P';
            }
            return new string(chars).Replace(" hp"," HP").Replace("player","Player").Replace("gracz","Gracz");
        }
        string TurnText()=>LocalTurnPresentation.Status(Simulation.State,NetworkLink==null?-1:NetworkLink.LocalOwner,
            NetworkLink!=null,NetworkLink==null||NetworkLink.IsConnected);

        // Icon card: the orb and how many are left. The name of the chosen ball is shown once,
        // next to the cards. Selection is amber (never a team colour) and lifts the card.
        void IconCard(Rect r,string id,int owner)
        {
            var d=Catalog.Ball(id);if(d==null)return;
            bool standard=id=="normal";
            int stock=standard?0:LocalDeckContent.Remaining(Simulation,owner,id);
            bool handReady=!standard&&LocalDeckContent.ActiveSource(Simulation,owner,id)==BallSelectionSource.Hand;
            bool available=standard||LocalDeckContent.VisibleAsAvailable(Simulation,owner,id);
            bool canClick=standard?CanChoose:LocalDeckContent.CanActivate(Simulation,owner,id,CanChoose),picked=canClick&&id==selected;
            bool hover=canClick&&GUI.enabled&&r.Contains(Event.current.mousePosition);
            // The card answers the finger: it sinks a little while it is held; the chosen one stays lifted.
            bool held=canClick&&GUI.enabled&&r.Contains(Event.current.mousePosition)&&UnityEngine.Input.GetMouseButton(0);
            var face=held?new Rect(r.x,r.y+2,r.width,r.height-2):picked?new Rect(r.x,r.y-3,r.width,r.height):r;
            Draw.Round(new Rect(face.x-1.5f,face.y-1.5f,face.width+3,face.height+3),Theme.Ink);
            Draw.Round(new Rect(face.x,face.y+3,face.width,face.height-3),picked?Theme.SelectInk:Theme.EdgeStrong);
            Draw.Round(new Rect(face.x,face.y,face.width,face.height-3),picked?Theme.Select:Theme.Edge);
            Draw.Round(new Rect(face.x+2,face.y+2,face.width-4,face.height-7),picked?Color.Lerp(Theme.Panel,Theme.Select,.16f):hover?Theme.PanelLight:Theme.Panel);
            bool prior=GUI.enabled;GUI.enabled=prior&&canClick;
            if(GUI.Button(r,GUIContent.none,GUIStyle.none))
            {
                int turnNumber=Simulation.State.turnNumber;
                if(picked&&layout.PhonePortrait&&tappedId==id&&tappedTurn==turnNumber)ShowBallDetails(id);
                else{SelectBall(id);if(selected==id){tappedId=id;tappedTurn=turnNumber;selectedAt=Time.unscaledTime;}}
            }
            GUI.enabled=prior;
            bool named=face.height>=72;
            float room=face.height-3-(named?22:8),orb=Mathf.Clamp(Mathf.Min(face.width-12,room-7),16,54);
            if(picked)orb*=SelectPulse();
            var body=new Rect(face.center.x-orb/2,face.y+4+(room-orb)/2,orb,orb);
            BallView.Preview(body,d,owner>=0?owner:0,picked);
            if(named)
            {
                string name=BallIcons.Name(d);int longest=0;foreach(string word in name.Split(' '))longest=Mathf.Max(longest,word.Length);
                Draw.Text(new Rect(face.x+2,face.yMax-25,face.width-4,20),name,face.width-4>=longest*6.2f&&name.Length<=11?10:9,available?Theme.Text:Theme.Muted,TextAnchor.MiddleCenter,true);
            }
            if(!available)Draw.Round(new Rect(face.x+2,face.y+2,face.width-4,face.height-7),new Color(1,1,1,.66f));
            // Stock badge in the corner: how many are left, a loop for the unlimited Standard, H for a ball in hand.
            var badge=new Rect(face.xMax-22,face.y+1,22,16);
            Draw.Chip(badge,handReady?Theme.Select:available?Theme.Ink:Theme.Disabled);
            if(standard)Glyphs.Paint(new Rect(badge.center.x-7,badge.center.y-7,14,14),IconEndless,Theme.OnColor);
            else Draw.Text(new Rect(badge.x,badge.y-1,badge.width,badge.height),handReady?"H":stock.ToString(),12,handReady?Theme.Ink:Theme.OnColor,TextAnchor.MiddleCenter,true);
        }

        // Deck card. Tall cards stack orb / name / cue; short ones put the orb on the left
        // so nine cards still fit the panel. Selection is amber, never a team colour.
        void BallCard(Rect r,string id)
        {
            var d=Catalog.Ball(id);int owner=LocalDeckContent.DisplayOwner(Simulation.State.turn,LocalSeat),stock=LocalDeckContent.Remaining(Simulation,owner,id);
            var source=LocalDeckContent.ActiveSource(Simulation,owner,id);
            bool available=LocalDeckContent.VisibleAsAvailable(Simulation,owner,id),handReady=source==BallSelectionSource.Hand;
            bool canClick=LocalDeckContent.CanActivate(Simulation,owner,id,CanChoose),picked=canClick&&id==selected;
            bool hover=canClick&&GUI.enabled&&r.Contains(Event.current.mousePosition);
            if(picked)Draw.Shadow(r,.26f,8,5);
            Draw.Round(new Rect(r.x,r.y+3,r.width,r.height-3),picked?Theme.SelectInk:Theme.EdgeStrong);
            Draw.Round(new Rect(r.x,r.y,r.width,r.height-3),picked?Theme.Select:hover?Theme.EdgeStrong:Theme.Edge);
            Draw.Round(new Rect(r.x+2,r.y+2,r.width-4,r.height-7),picked?Color.Lerp(Theme.Panel,Theme.Select,.14f):hover?Theme.PanelLight:Theme.Panel);
            bool prior=GUI.enabled;GUI.enabled=prior&&canClick;if(GUI.Button(r,GUIContent.none,GUIStyle.none))SelectBall(id);GUI.enabled=prior;
            string count=handReady?"H":available?"x"+stock:"0";Color countColor=handReady?Theme.SelectInk:available?Theme.Text:Theme.Muted;
            Color nameColor=available?Theme.Text:Theme.Muted;
            // Longest word decides the name size, so a name never breaks inside a word.
            int longest=0;foreach(string word in BallIcons.Name(d).Split(' '))longest=Mathf.Max(longest,word.Length);
            bool side=r.width>=124?r.height<84:r.height<64;
            if(side)
            {
                float orb=Mathf.Min(r.height-25,34)*(picked?SelectPulse():1);
                BallView.Preview(new Rect(r.x+12,r.y+(r.height-3-orb)/2,orb,orb),d,owner,picked);
                float textX=r.x+Mathf.Min(r.height-25,34)+22,textWidth=r.xMax-textX-6;
                int nameFont=textWidth>=longest*7.2f?12:textWidth>=longest*6.6f?11:textWidth>=longest*6f?10:9;
                Draw.Text(new Rect(textX,r.y+4,textWidth,r.height-27),BallIcons.Name(d),nameFont,nameColor,TextAnchor.MiddleLeft,true);
                Draw.Text(new Rect(textX,r.yMax-22,textWidth-30,15),handReady?LocalDeckContent.StockLabel(Simulation,owner,id):available?d.hp+" HP":Lang.T("OUT","BRAK"),Theme.FontTiny,handReady?Theme.SelectInk:Theme.Muted,TextAnchor.MiddleLeft,true);
                Draw.Text(new Rect(r.xMax-36,r.yMax-24,30,17),count,12,countColor,TextAnchor.MiddleRight,true);
            }
            else
            {
                float baseOrb=Mathf.Min(46,r.height-52),orb=baseOrb*(picked?SelectPulse():1);bool cue=r.height>=100,slim=r.width<124;
                BallView.Preview(new Rect(r.center.x-orb/2,r.y+12+(baseOrb-orb)/2,orb,orb),d,owner,picked);
                Draw.Text(new Rect(r.x+(slim?6:8),r.y+6,slim?r.center.x-baseOrb/2-r.x-9:46,16),d.hp+" HP",slim?8:10,Theme.Muted,TextAnchor.MiddleLeft,true);
                Draw.Text(new Rect(r.xMax-(slim?30:40),r.y+5,slim?24:32,18),count,slim?12:13,countColor,TextAnchor.MiddleRight,true);
                float nameWidth=r.width-10;
                int nameFont=nameWidth>=longest*7.6f?13:nameWidth>=longest*7f?12:nameWidth>=longest*6.4f?11:10;
                Draw.Text(new Rect(r.x+5,r.y+baseOrb+17,nameWidth,cue||handReady?20:r.height-baseOrb-24),BallIcons.Name(d),nameFont,nameColor,TextAnchor.MiddleCenter,true);
                if(handReady)Draw.Text(new Rect(r.x+5,r.yMax-22,r.width-10,14),LocalDeckContent.StockLabel(Simulation,owner,id),Theme.FontTiny,Theme.SelectInk,TextAnchor.MiddleCenter,true);
                else if(cue&&available&&BallGuide.For(id)!=null)GuideTag(new Rect(r.x+5,r.yMax-24,r.width-10,16),id,Theme.FontTiny+1);
                else if(cue)Draw.Text(new Rect(r.x+5,r.yMax-22,r.width-10,14),available?Cue(id):Lang.T("OUT OF STOCK","BRAK"),Theme.FontTiny,Theme.Muted,TextAnchor.MiddleCenter);
            }
            if(!available)Draw.Round(new Rect(r.x+2,r.y+2,r.width-4,r.height-7),new Color(1,1,1,.62f));
        }
    }
}
