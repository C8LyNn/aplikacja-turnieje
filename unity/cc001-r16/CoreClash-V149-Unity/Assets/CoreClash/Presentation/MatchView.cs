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
            BoardView.Render(board,Simulation,gesture,Catalog.Ball(selected),feedback,remoteVisual,ViewOwner);
            if(layout.CompactLandscape){RenderCompactLandscape();return;}
            if(layout.Portrait){Hud(new Rect(12,68,UiWidth-24,48),true);Draw.Text(new Rect(12,118,UiWidth-24,17),TurnText(),11,Draw.Owner(state.turn),TextAnchor.MiddleCenter,true);}
            if(layout.Portrait&&UiViewport.Profile==DeviceProfile.Phone){RenderPhoneTray();return;}
            bool touch=UiViewport.TargetSize>=44;
            Draw.Surface(side,Draw.Panel);float w=side.width-46,y=0,cardH=layout.Portrait?80:98,content=layout.Portrait?590:810,actionH=UiViewport.TargetSize;
            matchScroll=Draw.ScrollView(Draw.Inset(side,12),matchScroll,new Rect(0,0,w,content));
            if(!layout.Portrait){Hud(new Rect(0,y,w,72),false);y+=82;Draw.Surface(new Rect(0,y,w,40),Draw.PanelLight,Draw.Owner(state.turn));Draw.Text(new Rect(12,y+4,w-24,32),TurnText(),w<330?12:w<370?14:17,Draw.Owner(state.turn),TextAnchor.MiddleLeft,true);y+=50;}
            var d=Catalog.Ball(selected);float orb=layout.Portrait?38:56,stripH=layout.Portrait?50:74;
            Draw.Surface(new Rect(0,y,w,stripH),Draw.PanelLight);BallView.Preview(new Rect(12,y+(stripH-orb)/2,orb,orb),d,visualOwner,true);
            Draw.Text(new Rect(orb+26,y+9,w-orb-40,24),d.name,layout.Portrait?16:21,Color.white,TextAnchor.MiddleLeft,true);
            if(!layout.Portrait)Draw.Text(new Rect(orb+26,y+39,w-orb-40,24),Cue(selected),13,Draw.Muted);y+=stripH+10;
            string deckHeading=NetworkLink==null?"ACTIVE DECK  /  NINE SPECIALS":displayOwner<0?"DECK UNAVAILABLE":"YOUR DECK  /  NINE SPECIALS";
            Draw.Text(new Rect(0,y,w,18),deckHeading,10,Draw.Muted,TextAnchor.MiddleLeft,true);y+=24;
            var ids=LocalDeckContent.StockIds(state,displayOwner);float cw=(w-16)/3;
            for(int i=0;i<ids.Length;i++)BallCard(new Rect((i%3)*(cw+8),y+(i/3)*(cardH+8),cw,cardH),ids[i]);
            y+=3*(cardH+8)+4;
            bool normalSelected=selected=="normal";var standard=new Rect(0,y,w,actionH);Draw.Surface(standard,normalSelected?Color.Lerp(Draw.PanelLight,Draw.Owner(visualOwner),.14f):Draw.Panel,normalSelected?Draw.Owner(visualOwner):Draw.Edge);
            if(Draw.Button(new Rect(40,y,w-40,actionH),"STANDARD  /  UNLIMITED",Draw.Owner(visualOwner),normalSelected,CanChoose,12))SelectBall("normal");BallView.Preview(new Rect(10,y+(actionH-22)/2,22,22),Catalog.Ball("normal"),visualOwner,normalSelected);y+=actionH+11;
            float actionW=(w-20)/3;
            if(Draw.Button(new Rect(0,y,actionW,actionH),"BALL DETAILS",size:touch?12:10))ShowBallDetails(selected);
            if(Draw.Button(new Rect(actionW+10,y,actionW,actionH),boardInspection?"CANCEL INSPECT":"INSPECT BOARD",selected:boardInspection,size:touch?12:10))SetBoardInspection(!boardInspection);
            if(Draw.Button(new Rect((actionW+10)*2,y,actionW,actionH),"MATCH SETUP",size:touch?12:10))ReturnToSetup();y+=actionH+11;
            string hint=boardInspection?"TAP A BALL TO INSPECT":state.phase==MatchPhase.Over?(state.winner<0?"DRAW":("PLAYER "+(state.winner+1)+" WINS")):
                LocalTurnPresentation.ActionHint(state,NetworkLink==null?-1:NetworkLink.LocalOwner,
                    NetworkLink!=null,NetworkLink==null||NetworkLink.IsConnected,gesture.Active,
                    gesture.AimX-gesture.OriginX,gesture.AimY-gesture.OriginY,"DRAG FROM YOUR LAUNCHER TO AIM");
            Draw.Text(new Rect(0,y,w,24),hint,12,state.phase==MatchPhase.Over?Draw.Gold:Draw.Owner(state.turn),TextAnchor.MiddleLeft,true);
            if(state.phase==MatchPhase.Over)Draw.Text(new Rect(0,y+27,w,40),state.resultReason,12,Draw.Muted);
            else if(boardInspection)Draw.Text(new Rect(0,y+27,w,38),"Inspect either player's ball. Cancel to resume aiming.",12,Draw.Muted);
            else Draw.Text(new Rect(0,y+27,w,38),SecondaryMatchHelp.Text(state,
                NetworkLink==null?-1:NetworkLink.LocalOwner,NetworkLink!=null,
                NetworkLink==null||NetworkLink.IsConnected,CanChoose,notice),12,Draw.Muted);
            GUI.EndScrollView();
        }
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
                notice.Length>0?notice:boardInspection?"TAP BALL TO INSPECT":
                LocalTurnPresentation.ActionHint(state,NetworkLink==null?-1:NetworkLink.LocalOwner,
                    NetworkLink!=null,NetworkLink==null||NetworkLink.IsConnected,gesture.Active,
                    gesture.AimX-gesture.OriginX,gesture.AimY-gesture.OriginY,"DRAG FROM LAUNCHER");
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
            if(Draw.Button(new Rect(actions.x+2*(actionW+4),actions.y,actionW,44),"SETUP",size:12))ReturnToSetup();
            if(feedbackRow.height>=20){
                string message=state.phase==MatchPhase.Over?TurnText():
                    notice.Length>0?notice:boardInspection?"CANCEL INSPECT TO AIM":
                    LocalTurnPresentation.ActionHint(state,NetworkLink==null?-1:NetworkLink.LocalOwner,
                        NetworkLink!=null,NetworkLink==null||NetworkLink.IsConnected,gesture.Active,
                        gesture.AimX-gesture.OriginX,gesture.AimY-gesture.OriginY,"SELECT A BALL AND DRAG TO AIM");
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
            Draw.Text(new Rect(inner.x,y,w-128,44),Catalog.Ball(selected).name,15,Color.white,TextAnchor.MiddleLeft,true);
            if(Draw.Button(new Rect(inner.xMax-120,y,120,44),"STANDARD",Draw.Owner(tintOwner),selected=="normal",CanChoose,12))SelectBall("normal");
            y+=48;float arrow=44,cardW=96,cardH=80;var ids=LocalDeckContent.StockIds(Simulation.State,owner);float viewW=w-arrow*2-12,fullW=ids.Length*(cardW+8)-8,max=Math.Max(0,fullW-viewW);
            if(Draw.Button(new Rect(inner.x,y,arrow,cardH),"<",enabled:trayScroll.x>0,size:25))trayScroll.x=Math.Max(0,trayScroll.x-(cardW+8)*2);
            if(Draw.Button(new Rect(inner.xMax-arrow,y,arrow,cardH),">",enabled:trayScroll.x<max,size:25))trayScroll.x=Math.Min(max,trayScroll.x+(cardW+8)*2);
            trayScroll=Draw.ScrollView(new Rect(inner.x+arrow+6,y,viewW,cardH),trayScroll,new Rect(0,0,fullW,cardH),true);
            for(int i=0;i<ids.Length;i++)BallCard(new Rect(i*(cardW+8),0,cardW,cardH),ids[i]);GUI.EndScrollView();y+=cardH+8;
            float actionW=(w-12)/3;
            if(Draw.Button(new Rect(inner.x,y,actionW,44),"DETAILS",size:12))ShowBallDetails(selected);
            if(Draw.Button(new Rect(inner.x+actionW+6,y,actionW,44),boardInspection?"CANCEL":"INSPECT",selected:boardInspection,size:12))SetBoardInspection(!boardInspection);
            if(Draw.Button(new Rect(inner.x+(actionW+6)*2,y,actionW,44),"SETUP",size:12))ReturnToSetup();
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
        void BallCard(Rect r,string id)
        {
            var d=Catalog.Ball(id);int owner=LocalDeckContent.DisplayOwner(Simulation.State.turn,NetworkLink==null?(int?)null:NetworkLink.LocalOwner),stock=LocalDeckContent.Remaining(Simulation,owner,id);
            var source=LocalDeckContent.ActiveSource(Simulation,owner,id);
            bool available=LocalDeckContent.VisibleAsAvailable(Simulation,owner,id),handReady=source==BallSelectionSource.Hand;
            bool canClick=LocalDeckContent.CanActivate(Simulation,owner,id,CanChoose),picked=canClick&&id==selected,compact=r.height<=80;
            Color team=Draw.Owner(owner);Draw.Surface(r,picked?Color.Lerp(Draw.PanelLight,team,.13f):Draw.PanelLight,picked?team:Draw.Edge);
            bool prior=GUI.enabled;GUI.enabled=prior&&canClick;if(GUI.Button(r,GUIContent.none,GUIStyle.none))SelectBall(id);GUI.enabled=prior;
            float orb=compact?29:45;BallView.Preview(new Rect(r.center.x-orb/2,r.y+7,orb,orb),d,owner,picked);
            Draw.Text(new Rect(r.x+7,r.y+7,44,20),d.hp+" HP",compact?8:10,Draw.Muted);
            Draw.Text(new Rect(r.xMax-36,r.y+7,29,20),handReady?"H":available?"x"+stock:"0",compact?10:12,handReady?Draw.Gold:available?Color.white:Draw.Muted,TextAnchor.MiddleRight,true);
            Draw.Text(new Rect(r.x+5,r.y+(compact?40:58),r.width-10,compact&&handReady?20:compact?35:23),d.name,compact?12:13,available?Color.white:Draw.Muted,TextAnchor.MiddleCenter,true);
            if(handReady)Draw.Text(new Rect(r.x+5,r.y+(compact?61:81),r.width-10,compact?18:14),LocalDeckContent.StockLabel(Simulation,owner,id),compact?10:9,Draw.Gold,TextAnchor.MiddleCenter,true);
            else if(!compact)Draw.Text(new Rect(r.x+5,r.y+81,r.width-10,14),available?Cue(id):"OUT OF STOCK",9,Draw.Muted,TextAnchor.MiddleCenter);
            if(!available)Draw.Round(Draw.Inset(r,2),new Color(.025f,.04f,.06f,.58f));
            if(picked)Draw.Round(new Rect(r.x+12,r.yMax-3,r.width-24,2),team);
        }
    }
}
