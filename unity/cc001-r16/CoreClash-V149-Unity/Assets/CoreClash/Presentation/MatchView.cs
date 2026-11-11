using System;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using UnityEngine;
namespace CoreClash.Presentation
{
    public sealed partial class CoreClashApp
    {
        void RenderMatch()
        {
            var state=Simulation.State;if(state.phase==MatchPhase.Aiming)selected=BallSelection.ForTurn(Simulation,selected);
            int displayOwner=LocalDeckContent.DisplayOwner(state.turn,NetworkLink==null?(int?)null:NetworkLink.LocalOwner);
            int visualOwner=displayOwner>=0?displayOwner:state.turn;
            var remoteVisual=NetworkLink!=null&&!NetworkLink.IsAuthority&&NetworkLink.IsConnected?remoteBallSmoother:null;
            BoardView.Render(board,Simulation,gesture,Catalog.Ball(selected),feedback,remoteVisual,ViewOwner,gesture.Active?replayId:0);
            if(layout.CompactLandscape){RenderCompactLandscape();return;}
            if(layout.Portrait){Hud(new Rect(12,66,UiWidth-24,44),true);Draw.Text(new Rect(12,111,UiWidth-24,14),TurnText(),11,Draw.Owner(state.turn),TextAnchor.MiddleCenter,true);}
            if(layout.Portrait&&UiViewport.Profile==DeviceProfile.Phone){RenderPhoneTray();return;}
            RenderSidePanel(displayOwner,visualOwner);
        }
        // W20: desktop/tablet side panel. Rows come from MatchPanelLayout, so everything a
        // decision needs is visible without scrolling, in this order: whose turn, base HP,
        // the selected ball and its stock, the deck, actions, the result of the last action.
        void RenderSidePanel(int displayOwner,int visualOwner)
        {
            var state=Simulation.State;bool over=state.phase==MatchPhase.Over;
            Color active=over?Theme.Select:Draw.Owner(state.turn);
            Draw.Surface(side,Draw.Panel);
            var inner=Draw.Inset(side,12);
            var rows=MatchPanelLayout.For(inner.width,inner.height,UiViewport.TargetSize,!layout.Portrait);
            if(rows.Scrolls)matchScroll=Draw.ScrollView(inner,matchScroll,new Rect(0,0,rows.Width,rows.ContentHeight));
            else{matchScroll=Vector2.zero;GUI.BeginGroup(inner);}
            if(rows.Scoreboard)
            {
                var turn=RectOf(rows.Turn);
                Draw.Surface(turn,Color.Lerp(Theme.PanelLight,active,.16f),active);
                Draw.Rect(new Rect(turn.x+2,turn.y+7,4,turn.height-14),active);
                string status=TurnText();int cut=status.IndexOf("     ",StringComparison.Ordinal);
                if(cut<0)Draw.Text(new Rect(turn.x+16,turn.y,turn.width-28,turn.height),status,status.Length>22?13:17,active,TextAnchor.MiddleLeft,true);
                else
                {
                    string who=status.Substring(cut).Trim(),count=status.Substring(0,cut);
                    float countWidth=Mathf.Min(turn.width*.34f,count.Length*7.4f+8);
                    Draw.Text(new Rect(turn.x+16,turn.y,turn.width-countWidth-30,turn.height),who,who.Length>24?11:who.Length>17?13:rows.Tight?15:17,active,TextAnchor.MiddleLeft,true);
                    Draw.Text(new Rect(turn.xMax-countWidth-10,turn.y,countWidth,turn.height),count,Theme.FontSmall,Theme.TextSoft,TextAnchor.MiddleRight,true);
                }
                HpCell(RectOf(rows.Hp1),0);HpCell(RectOf(rows.Hp2),1);
            }
            var d=Catalog.Ball(selected);var strip=RectOf(rows.Selected);
            Draw.Surface(strip,Theme.PanelLight,Theme.A(Theme.Select,.6f));
            float orb=strip.height-(rows.Tight?20:24);
            BallView.Preview(new Rect(strip.x+15,strip.y+(strip.height-orb)/2,orb,orb),d,visualOwner,true);
            float textX=strip.x+orb+32,textWidth=strip.width-orb-42;
            Draw.Text(new Rect(textX,strip.y+(rows.Tight?5:7),textWidth,22),d.name,rows.Tight?16:19,Theme.Text,TextAnchor.MiddleLeft,true);
            string stockText=selected=="normal"?"UNLIMITED":LocalDeckContent.StockLabel(Simulation,displayOwner,selected);
            string facts=(string.IsNullOrEmpty(d.archetype)||d.archetype=="base"?"":d.archetype.ToUpperInvariant()+"  ·  ")+d.hp+" HP  ·  "+stockText;
            Draw.Text(new Rect(textX,strip.y+(rows.Tight?27:30),textWidth,16),facts,Theme.FontSmall,Theme.Select,TextAnchor.MiddleLeft,true);
            if(!rows.Tight)Draw.Text(new Rect(textX,strip.y+47,textWidth,16),Cue(selected),Theme.FontSmall,Theme.Muted,TextAnchor.MiddleLeft);
            string deckHeading=NetworkLink==null?"ACTIVE DECK  /  NINE SPECIALS":displayOwner<0?"DECK UNAVAILABLE":"YOUR DECK  /  NINE SPECIALS";
            var heading=RectOf(rows.Heading);
            Draw.Text(heading,deckHeading,10,Theme.Muted,TextAnchor.MiddleLeft,true);
            if(!UiViewport.IsTouch&&heading.width>=330)Draw.Text(heading,"KEYS 1-9  ·  0 STANDARD",Theme.FontTiny,Theme.Disabled,TextAnchor.MiddleRight,true);
            var ids=LocalDeckContent.StockIds(state,displayOwner);
            for(int i=0;i<ids.Length&&i<rows.Cards.Length;i++)BallCard(RectOf(rows.Cards[i]),ids[i]);
            bool normalSelected=selected=="normal";var standard=RectOf(rows.Standard);
            if(Draw.Button(standard,"STANDARD  ·  UNLIMITED",Draw.Owner(visualOwner),normalSelected,CanChoose,12))SelectBall("normal");
            BallView.Preview(new Rect(standard.x+11,standard.y+(standard.height-20)/2,20,20),Catalog.Ball("normal"),visualOwner,false);
            bool touch=UiViewport.TargetSize>=44;int actionFont=rows.Width<380?10:touch?12:11;
            if(Draw.Button(RectOf(rows.Actions[0]),"DETAILS",size:actionFont))ShowBallDetails(selected);
            if(Draw.Button(RectOf(rows.Actions[1]),boardInspection?"CANCEL":"INSPECT",selected:boardInspection,size:actionFont))SetBoardInspection(!boardInspection);
            if(Draw.Button(RectOf(rows.Actions[2]),BoardView.ShowStopEstimate?"STOP MARK ON":"STOP MARK OFF",Theme.Select,BoardView.ShowStopEstimate,true,actionFont))ToggleStopEstimate();
            if(Draw.Button(RectOf(rows.Actions[3]),"SETUP",size:actionFont))RequestLeaveMatch();
            string hint=boardInspection?"TAP A BALL TO INSPECT":over?(state.winner<0?"DRAW":("PLAYER "+(state.winner+1)+" WINS")):
                LocalTurnPresentation.ActionHint(state,NetworkLink==null?-1:NetworkLink.LocalOwner,
                    NetworkLink!=null,NetworkLink==null||NetworkLink.IsConnected,gesture.Active,
                    gesture.AimX-gesture.OriginX,gesture.AimY-gesture.OriginY,"DRAG FROM YOUR LAUNCHER TO AIM");
            // Second line, most relevant first: result, inspection help, a rejected shot,
            // the last action's result from real events, then the standing tip.
            string summary=ActionSummary.For(state);bool result=false;string detail;
            if(over)detail=state.resultReason;
            else if(boardInspection)detail="Inspect either player's ball. Cancel to resume aiming.";
            else if(notice.Length>0&&CanChoose)detail=notice;
            else if(summary.Length>0){detail=summary;result=true;}
            else detail=state.bonusPending?"Player 2 gets one extra spawn on the opening turn.":"A glowing home ball can Replay before you spawn.";
            var hintBox=RectOf(rows.Hint);
            Draw.Surface(hintBox,Theme.Panel,result?Theme.EdgeStrong:Theme.Edge);
            Draw.Text(new Rect(hintBox.x+10,hintBox.y+3,hintBox.width-20,17),hint,12,active,TextAnchor.MiddleLeft,true);
            Draw.Text(new Rect(hintBox.x+10,hintBox.y+20,hintBox.width-20,hintBox.height-22),detail??"",rows.Tight?10:11,result?Theme.Text:Theme.Muted,TextAnchor.UpperLeft,result);
            if(rows.Scrolls)GUI.EndScrollView();else GUI.EndGroup();
        }
        // One base: ownership sample (the same ring pattern as that player's balls), HP as a
        // number and a bar; flashes when a real BASE_DAMAGE event arrives.
        void HpCell(Rect cell,int owner)
        {
            var state=Simulation.State;Color team=Draw.Owner(owner);int hp=state.players[owner].hp;
            bool acting=state.turn==owner&&state.phase!=MatchPhase.Over,small=cell.height<52;
            float flash=0;
            foreach(var item in feedback.Items)if(item.kind=="BASE_DAMAGE"&&item.owner==owner)flash=Mathf.Max(flash,1-Mathf.Clamp01((Time.unscaledTime-item.born)/Theme.BaseFlash));
            Draw.Surface(cell,Color.Lerp(Theme.PanelLight,Theme.Damage,flash*.4f),flash>0?Color.Lerp(Theme.Edge,Theme.Damage,flash):acting?team:Theme.Edge);
            Draw.Ring(new Vector2(cell.x+17,cell.y+(small?14:17)),7,team,2.2f,owner==1?Theme.P2RingSegments:0,Theme.P2RingFill);
            bool you=NetworkLink!=null&&NetworkLink.LocalOwner==owner,narrow=cell.width<200;
            string name=cell.width<215?"P"+(owner+1)+(you?" · YOU":" BASE"):"P"+(owner+1)+" BASE"+(you?" · YOU":"");
            // Narrow cells drop the "/ 20" (the bar and its quarter ticks still show the share).
            float numberRight=narrow?12:42;
            Draw.Text(new Rect(cell.x+30,cell.y+(small?5:8),cell.width-30-numberRight-54,18),name,Theme.FontSmall,team,TextAnchor.MiddleLeft,true);
            Draw.Text(new Rect(cell.xMax-numberRight-54,cell.y+(small?1:3),54,small?26:30),hp.ToString(),small?19:24,flash>0?Theme.Damage:Theme.Text,TextAnchor.MiddleRight,true);
            if(!narrow)Draw.Text(new Rect(cell.xMax-39,cell.y+(small?7:11),30,18),"/ 20",Theme.FontSmall,Theme.Muted,TextAnchor.MiddleLeft,true);
            var bar=new Rect(cell.x+12,cell.yMax-(small?11:14),cell.width-24,small?5:7);
            Draw.Rect(bar,Theme.Plate);
            if(hp>0)Draw.Rect(new Rect(bar.x,bar.y,bar.width*Mathf.Clamp01(hp/20f),bar.height),team);
            for(int i=1;i<4;i++)Draw.Rect(new Rect(bar.x+bar.width*i/4-.5f,bar.y,1,bar.height),Theme.PanelLight);
        }
        public void ToggleStopEstimate(){BoardView.ShowStopEstimate=!BoardView.ShowStopEstimate;Debug.Log("CORE_CLASH_STOP_MARK "+BoardView.ShowStopEstimate);}
        // Compact phone landscape does not use the 810-unit desktop scroll view.
        // Every critical control is drawn from testable MatchLayout rectangles.
        void RenderCompactLandscape()
        {
            var state=Simulation.State;
            int owner=state.turn;
            Draw.Surface(side,Draw.Panel);
            Rect hud=RectOf(layout.CompactHud),choice=RectOf(layout.CompactChoice);
            Rect cards=RectOf(layout.CompactCards),actions=RectOf(layout.CompactActions);
            Rect feedbackRow=RectOf(layout.CompactFeedback);
            // Three short cells avoid the R16 Hud() 2-column label/HP collision
            // that occurs when a 44-high compact header is very narrow.
            float cellW=(hud.width-8)/3;
            for(int i=0;i<2;i++){
                float x=hud.x+i*(cellW+4);
                Draw.Surface(new Rect(x,hud.y,cellW,44),Draw.PanelLight,i==owner?Draw.Owner(i):Draw.Edge);
                int hp=state.players[i].hp;
                string compactPlayer="P"+(i+1)+(NetworkLink!=null&&i==ViewOwner?" · YOU":"");
                Draw.Text(new Rect(x+4,hud.y+4,cellW-8,26),compactPlayer+"  "+hp+"/20",14,Color.white,TextAnchor.MiddleCenter,true);
                Draw.Round(new Rect(x+8,hud.y+35,cellW-16,5),Draw.Edge);
                if(hp>0)Draw.Round(new Rect(x+8,hud.y+35,(cellW-16)*Mathf.Clamp01(hp/20f),5),Draw.Owner(i));
            }
            float turnX=hud.x+2*(cellW+4);
            Draw.Surface(new Rect(turnX,hud.y,cellW,44),Draw.PanelLight,Draw.Owner(owner));
            string phase=LocalTurnPresentation.CompactStatus(state,NetworkLink==null?-1:NetworkLink.LocalOwner,
                NetworkLink!=null,NetworkLink==null||NetworkLink.IsConnected);
            Draw.Text(new Rect(turnX+3,hud.y+3,cellW-6,18),state.phase==MatchPhase.Over?"RESULT":"TURN "+state.turnNumber+"/50",13,Draw.Owner(owner),TextAnchor.MiddleCenter,true);
            Draw.Text(new Rect(turnX+3,hud.y+22,cellW-6,19),phase,12,Color.white,TextAnchor.MiddleCenter,true);

            Draw.Surface(choice,Draw.PanelLight);
            string name=state.phase==MatchPhase.Over?TurnText():Catalog.Ball(selected).name;
            Draw.Text(new Rect(choice.x+8,choice.y+2,choice.width-138,22),name,14,Color.white,TextAnchor.MiddleLeft,true);
            string hint=state.phase==MatchPhase.Over?state.resultReason:
                boardInspection?"TAP BALL TO INSPECT":
                LocalTurnPresentation.ActionMessage(state,NetworkLink==null?-1:NetworkLink.LocalOwner,
                    NetworkLink!=null,NetworkLink==null||NetworkLink.IsConnected,gesture.Active,
                    gesture.AimX-gesture.OriginX,gesture.AimY-gesture.OriginY,"DRAG FROM LAUNCHER",notice);
            Draw.Text(new Rect(choice.x+8,choice.y+23,choice.width-138,20),hint,11,Draw.Muted,TextAnchor.MiddleLeft);
            if(Draw.Button(new Rect(choice.xMax-124,choice.y,124,44),"STANDARD",Draw.Owner(owner),selected=="normal",CanChoose,12))SelectBall("normal");

            if(state.phase==MatchPhase.Over){
                Draw.Surface(cards,Draw.PanelLight,Draw.Gold);
                Draw.Text(Draw.Inset(cards,6),state.resultReason.Length>0?state.resultReason:TurnText(),12,Draw.Gold,TextAnchor.MiddleCenter,true);
            }else{
                float arrow=44,cardW=106,gap=6;
                var ids=LocalDeckContent.StockIds(state,LocalDeckContent.DisplayOwner(state.turn,NetworkLink==null?(int?)null:NetworkLink.LocalOwner));
                float viewW=cards.width-arrow*2-12;
                float fullW=Math.Max(viewW,ids.Length*(cardW+gap)-gap);
                float max=Math.Max(0,fullW-viewW);
                trayScroll.x=Mathf.Clamp(trayScroll.x,0,max);
                if(Draw.Button(new Rect(cards.x,cards.y,arrow,cards.height),"<",enabled:trayScroll.x>0,size:22))trayScroll.x=Math.Max(0,trayScroll.x-(cardW+gap)*2);
                if(Draw.Button(new Rect(cards.xMax-arrow,cards.y,arrow,cards.height),">",enabled:trayScroll.x<max,size:22))trayScroll.x=Math.Min(max,trayScroll.x+(cardW+gap)*2);
                trayScroll=Draw.ScrollView(new Rect(cards.x+arrow+6,cards.y,viewW,cards.height),trayScroll,new Rect(0,0,fullW,cards.height),true);
                for(int i=0;i<ids.Length;i++)CompactBallCard(new Rect(i*(cardW+gap),0,cardW,cards.height),ids[i]);
                GUI.EndScrollView();
            }

            float actionW=(actions.width-8)/3;
            if(Draw.Button(new Rect(actions.x,actions.y,actionW,44),"DETAILS",size:12))ShowBallDetails(selected);
            if(Draw.Button(new Rect(actions.x+actionW+4,actions.y,actionW,44),boardInspection?"CANCEL":"INSPECT",selected:boardInspection,size:12))SetBoardInspection(!boardInspection);
            if(Draw.Button(new Rect(actions.x+2*(actionW+4),actions.y,actionW,44),"SETUP",size:12))RequestLeaveMatch();
            if(feedbackRow.height>=20){
                string message=state.phase==MatchPhase.Over?TurnText():
                    boardInspection?"CANCEL INSPECT TO AIM":
                    LocalTurnPresentation.ActionMessage(state,NetworkLink==null?-1:NetworkLink.LocalOwner,
                        NetworkLink!=null,NetworkLink==null||NetworkLink.IsConnected,gesture.Active,
                        gesture.AimX-gesture.OriginX,gesture.AimY-gesture.OriginY,"SELECT A BALL AND DRAG TO AIM",notice);
                Draw.Text(feedbackRow,message,12,state.phase==MatchPhase.Over?Draw.Gold:Draw.Owner(owner),TextAnchor.MiddleLeft,true);
            }
        }
        void CompactBallCard(Rect r,string id)
        {
            int owner=LocalDeckContent.DisplayOwner(Simulation.State.turn,NetworkLink==null?(int?)null:NetworkLink.LocalOwner);
            int stock=LocalDeckContent.Remaining(Simulation,owner,id);
            var source=LocalDeckContent.ActiveSource(Simulation,owner,id);
            bool available=LocalDeckContent.VisibleAsAvailable(Simulation,owner,id);
            bool canClick=LocalDeckContent.CanActivate(Simulation,owner,id,CanChoose),picked=canClick&&id==selected;
            var tint=Draw.Owner(owner);
            Draw.Surface(r,picked?Color.Lerp(Draw.PanelLight,tint,.2f):Draw.PanelLight,picked?tint:Draw.Edge);
            bool prior=GUI.enabled;GUI.enabled=prior&&canClick;
            if(GUI.Button(r,GUIContent.none,GUIStyle.none))SelectBall(id);
            GUI.enabled=prior;
            float orb=Math.Min(32,r.height-12);
            BallView.Preview(new Rect(r.x+5,r.y+(r.height-orb)/2,orb,orb),Catalog.Ball(id),owner,picked);
            Draw.Text(new Rect(r.x+orb+9,r.y+4,r.width-orb-13,Math.Min(36,r.height-29)),Catalog.Ball(id).name,10,available?Color.white:Draw.Muted,TextAnchor.MiddleLeft,true);
            bool handReady=source==BallSelectionSource.Hand;
            Draw.Text(new Rect(r.x+orb+9,r.yMax-19,r.width-orb-13,17),LocalDeckContent.StockLabel(Simulation,owner,id),handReady?9:11,handReady?Draw.Gold:available?tint:Draw.Muted,TextAnchor.MiddleLeft,true);
        }
        void RenderPhoneTray()
        {
            Draw.Surface(side,Draw.Panel);var inner=Draw.Inset(side,8);bool shortTray=inner.height<180;
            if(shortTray){matchScroll=Draw.ScrollView(inner,matchScroll,new Rect(0,0,inner.width-20,180));inner=new Rect(0,0,inner.width-20,180);}
            float w=inner.width,y=inner.y;int owner=LocalDeckContent.DisplayOwner(Simulation.State.turn,NetworkLink==null?(int?)null:NetworkLink.LocalOwner);
            int tintOwner=owner>=0?owner:Simulation.State.turn;
            Draw.Text(new Rect(inner.x,y,w-128,44),owner<0?"DECK UNAVAILABLE":Catalog.Ball(selected).name,15,Color.white,TextAnchor.MiddleLeft,true);
            if(Draw.Button(new Rect(inner.xMax-120,y,120,44),"STANDARD",Draw.Owner(tintOwner),selected=="normal",CanChoose,12))SelectBall("normal");
            y+=48;float arrow=44,cardW=96,cardH=80;var ids=LocalDeckContent.StockIds(Simulation.State,owner);
            float viewW=Math.Max(1f,w-arrow*2-12),fullW=LocalDeckContent.TrayContentWidth(ids.Length,cardW,8,viewW),max=Math.Max(0f,fullW-viewW);
            trayScroll.x=LocalDeckContent.ClampTrayScroll(trayScroll.x,fullW,viewW);
            if(Draw.Button(new Rect(inner.x,y,arrow,cardH),"<",enabled:trayScroll.x>0,size:25))trayScroll.x=Math.Max(0,trayScroll.x-(cardW+8)*2);
            if(Draw.Button(new Rect(inner.xMax-arrow,y,arrow,cardH),">",enabled:trayScroll.x<max,size:25))trayScroll.x=Math.Min(max,trayScroll.x+(cardW+8)*2);
            trayScroll=Draw.ScrollView(new Rect(inner.x+arrow+6,y,viewW,cardH),trayScroll,new Rect(0,0,fullW,cardH),true);
            for(int i=0;i<ids.Length;i++)BallCard(new Rect(i*(cardW+8),0,cardW,cardH),ids[i]);GUI.EndScrollView();y+=cardH+8;
            float actionW=(w-12)/3;
            if(Draw.Button(new Rect(inner.x,y,actionW,44),"DETAILS",size:12))ShowBallDetails(selected);
            if(Draw.Button(new Rect(inner.x+actionW+6,y,actionW,44),boardInspection?"CANCEL":"INSPECT",selected:boardInspection,size:12))SetBoardInspection(!boardInspection);
            if(Draw.Button(new Rect(inner.x+(actionW+6)*2,y,actionW,44),"SETUP",size:12))RequestLeaveMatch();
            if(shortTray)GUI.EndScrollView();
        }
        string TurnText()=>LocalTurnPresentation.Status(Simulation.State,NetworkLink==null?-1:NetworkLink.LocalOwner,
            NetworkLink!=null,NetworkLink==null||NetworkLink.IsConnected);
        void Hud(Rect r,bool compact)
        {
            float gap=10,w=(r.width-gap)/2;
            for(int owner=0;owner<2;owner++){
                var cell=new Rect(r.x+owner*(w+gap),r.y,w,r.height);Color team=Draw.Owner(owner);int hp=Simulation.State.players[owner].hp;
                Draw.Surface(cell,Draw.PanelLight,Simulation.State.turn==owner?Color.Lerp(Draw.Edge,team,.65f):Draw.Edge);
                bool stacked=!compact&&w<175;
                Draw.Text(new Rect(cell.x+12,cell.y+7,w-24,18),"PLAYER "+(owner+1)+(NetworkLink!=null&&NetworkLink.LocalOwner==owner?" (YOU)":""),compact?10:12,team,TextAnchor.MiddleLeft,true);
                if(stacked)Draw.Text(new Rect(cell.x+12,cell.y+25,w-24,25),hp+" / 20",21,Color.white,TextAnchor.MiddleLeft,true);
                else Draw.Text(new Rect(cell.x+w*.43f,cell.y+5,w*.57f-12,compact?20:30),hp+" / 20",compact?16:w<205?19:24,Color.white,TextAnchor.MiddleRight,true);
                Draw.Round(new Rect(cell.x+12,cell.yMax-16,w-24,8),new Color(.035f,.06f,.09f));if(hp>0)Draw.Round(new Rect(cell.x+12,cell.yMax-16,(w-24)*Mathf.Clamp01(hp/20f),8),team);
                if(!compact&&!stacked)Draw.Text(new Rect(cell.x+12,cell.y+32,w-24,16),"BASE HEALTH",9,Draw.Muted);
            }
        }
        // Deck card. Tall cards stack orb / name / cue; short ones put the orb on the left
        // so nine cards still fit the panel. Selection is gold, never a team colour.
        void BallCard(Rect r,string id)
        {
            var d=Catalog.Ball(id);int owner=LocalDeckContent.DisplayOwner(Simulation.State.turn,NetworkLink==null?(int?)null:NetworkLink.LocalOwner),stock=LocalDeckContent.Remaining(Simulation,owner,id);
            var source=LocalDeckContent.ActiveSource(Simulation,owner,id);
            bool available=LocalDeckContent.VisibleAsAvailable(Simulation,owner,id),handReady=source==BallSelectionSource.Hand;
            bool canClick=LocalDeckContent.CanActivate(Simulation,owner,id,CanChoose),picked=canClick&&id==selected;
            bool hover=canClick&&r.Contains(Event.current.mousePosition);
            Draw.Surface(r,picked?Color.Lerp(Theme.PanelLight,Theme.Select,.16f):hover?Theme.PanelRaised:Theme.PanelLight,picked?Theme.Select:hover?Theme.EdgeStrong:Theme.Edge);
            bool prior=GUI.enabled;GUI.enabled=prior&&canClick;if(GUI.Button(r,GUIContent.none,GUIStyle.none))SelectBall(id);GUI.enabled=prior;
            string count=handReady?"H":available?"x"+stock:"0";Color countColor=handReady?Theme.Select:available?Theme.Text:Theme.Muted;
            Color nameColor=available?Theme.Text:Theme.Muted;
            // Longest word decides the name size, so a name never breaks inside a word.
            int longest=0;foreach(string word in d.name.Split(' '))longest=Mathf.Max(longest,word.Length);
            bool side=r.width>=124?r.height<84:r.height<64;
            if(side)
            {
                float orb=Mathf.Min(r.height-22,34);
                BallView.Preview(new Rect(r.x+10,r.y+(r.height-orb)/2,orb,orb),d,owner,picked);
                float textX=r.x+orb+19,textWidth=r.xMax-textX-6;
                int nameFont=textWidth>=longest*7.2f?12:textWidth>=longest*6.6f?11:textWidth>=longest*6f?10:9;
                Draw.Text(new Rect(textX,r.y+4,textWidth,r.height-24),d.name,nameFont,nameColor,TextAnchor.MiddleLeft,true);
                Draw.Text(new Rect(textX,r.yMax-19,textWidth-30,15),handReady?LocalDeckContent.StockLabel(Simulation,owner,id):available?d.hp+" HP":"OUT",Theme.FontTiny,handReady?Theme.Select:Theme.Muted,TextAnchor.MiddleLeft,true);
                Draw.Text(new Rect(r.xMax-36,r.yMax-21,30,17),count,12,countColor,TextAnchor.MiddleRight,true);
            }
            else
            {
                float orb=Mathf.Min(46,r.height-48);bool cue=r.height>=100,slim=r.width<124;
                BallView.Preview(new Rect(r.center.x-orb/2,r.y+10,orb,orb),d,owner,picked);
                Draw.Text(new Rect(r.x+(slim?6:8),r.y+6,slim?r.center.x-orb/2-r.x-9:46,16),d.hp+" HP",slim?8:10,Theme.Muted,TextAnchor.MiddleLeft,true);
                Draw.Text(new Rect(r.xMax-(slim?30:40),r.y+5,slim?24:32,18),count,slim?12:13,countColor,TextAnchor.MiddleRight,true);
                float nameWidth=r.width-10;
                int nameFont=nameWidth>=longest*7.6f?13:nameWidth>=longest*7f?12:nameWidth>=longest*6.4f?11:10;
                Draw.Text(new Rect(r.x+5,r.y+orb+14,nameWidth,cue||handReady?20:r.height-orb-18),d.name,nameFont,nameColor,TextAnchor.MiddleCenter,true);
                if(handReady)Draw.Text(new Rect(r.x+5,r.yMax-19,r.width-10,14),LocalDeckContent.StockLabel(Simulation,owner,id),Theme.FontTiny,Theme.Select,TextAnchor.MiddleCenter,true);
                else if(cue)Draw.Text(new Rect(r.x+5,r.yMax-19,r.width-10,14),available?Cue(id):"OUT OF STOCK",Theme.FontTiny,Theme.Muted,TextAnchor.MiddleCenter);
            }
            if(!available)Draw.Round(Draw.Inset(r,2),new Color(.025f,.04f,.06f,.58f));
            if(picked)Draw.Round(new Rect(r.x+12,r.yMax-3,r.width-24,2),Theme.Select);
        }
    }
}
