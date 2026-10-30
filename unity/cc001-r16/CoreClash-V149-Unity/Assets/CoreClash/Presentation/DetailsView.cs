using System;
using System.Linq;
using CoreClash.Data;
using UnityEngine;
namespace CoreClash.Presentation
{
    public sealed partial class CoreClashApp
    {
        void RenderInfo()
        {
            var current=inspectBallId>0?BallInspection.Read(Simulation.State,inspectBallId):null;
            var d=Catalog.Ball(current?.Type??inspect);if(d==null){CloseBallDetails();return;}
            Draw.Rect(new Rect(0,0,UiWidth,UiHeight),new Color(.018f,.032f,.052f,.97f));float w=Math.Min(640,UiWidth-32),h=Math.Min(700,UiHeight-80),x=(UiWidth-w)/2,y=(UiHeight-h)/2;
            bool narrow=w<440;Draw.Surface(new Rect(x,y,w,h),Draw.Panel);BallView.Preview(new Rect(x+28,y+27,narrow?52:76,narrow?52:76),d,current?.Owner??Simulation.State.turn,true);
            Draw.Text(new Rect(x+(narrow?96:125),y+(narrow?70:27),narrow?w-116:w-240,narrow?47:42),d.name,narrow?22:30,Color.white,TextAnchor.MiddleLeft,true);
            string health=current!=null?BallInspection.OwnerMark(current.Owner)+"  /  "+current.Hp+" / "+current.MaxHp+" HP":inspectBallId>0?"NO LONGER ON THE BOARD":d.hp+" HP  /  "+d.size.ToUpperInvariant();
            Draw.Text(new Rect(x+(narrow?96:126),y+(narrow?121:73),narrow?w-116:w-200,25),health,narrow?12:14,Draw.Gold,TextAnchor.MiddleLeft,true);
            if(Draw.Button(new Rect(x+w-92,y+16,76,44),"CLOSE",size:12))CloseBallDetails();
            float inner=w-88,content=InfoContent(d,current,inner,false);
            infoScroll=Draw.ScrollView(new Rect(x+28,y+(narrow?166:128),w-56,h-(narrow?192:154)),infoScroll,new Rect(0,0,w-78,content));
            InfoContent(d,current,inner,true);
            GUI.EndScrollView();
        }
        float InfoContent(BallDefinition definition,BallInspection current,float width,bool draw)
        {
            float y=0;
            Action<string,int,Color,bool> line=(text,size,color,bold)=>{
                if(string.IsNullOrEmpty(text))return;
                var style=new GUIStyle(GUI.skin.label){fontSize=size,wordWrap=true,fontStyle=bold?FontStyle.Bold:FontStyle.Normal,padding=new RectOffset(0,0,0,0)};
                float height=Mathf.Ceil(style.CalcHeight(new GUIContent(text),width))+3;
                if(draw)Draw.Text(new Rect(0,y,width,height),text,size,color,TextAnchor.UpperLeft,bold);
                y+=height+12;
            };
            if(inspectBallId>0){
                line("CURRENT STATE",11,Draw.Cyan,true);
                if(current==null||!current.OnBoard)line("This ball is no longer on the board.",15,Draw.Muted,false);
                if(current!=null){
                    if(current.Shield==0)line("Shield: 0",15,Color.white,false);
                    line(current.States.Length==0?"No active status.":string.Join("\n",current.States.Select(s=>s.Text)),15,Color.white,false);
                }
            }
            if(!string.IsNullOrEmpty(definition.archetype))line("ARCHETYPE  /  "+definition.archetype.ToUpperInvariant(),11,Draw.Muted,true);
            line(Quick(definition.id),19,Color.white,false);
            line("ABILITY",11,Draw.Cyan,true);
            line(AbilityText(definition.id),16,Color.white,false);
            var copy=Copy(definition.id);
            if(!string.IsNullOrEmpty(copy?.condition)){line("SETUP & PAYOFF",11,Draw.Gold,true);line(copy.condition,15,Draw.Muted,false);}
            line(copy?.role,12,Draw.Muted,false);
            return y;
        }
        // R17-W9 A33: developer-only instrumentation. Read-only data from the existing session.
        Vector2 w9DeveloperScroll;
        static string W9NetworkDiagnostics(bool networked,bool authority,bool connected,bool aiming,int localOwner,
            int activeOwner,int stateRevision,int snapshots,int appliedRevision,
            int acceptedLocal,int rejectedLocal,int acceptedRemote,int rejectedRemote)
        {
            if(!networked)return "MODE: LOCAL / HOTSEAT (NO NETWORK CONNECTION)";
            string role=authority?"HOST":"CLIENT";
            string local=localOwner==0?"P1 / CYAN":localOwner==1?"P2 / RED":"UNASSIGNED";
            string active=activeOwner==0?"P1 / CYAN":activeOwner==1?"P2 / RED":"UNKNOWN";
            string control=!connected?"WAITING FOR PEER / SNAPSHOT":
                !aiming?"NO AIM INPUT / SHOT RESOLVING OR MATCH ENDED":
                localOwner==activeOwner?"YOUR TURN / AIMING":"OPPONENT TURN";
            string snapshot=authority?"AUTHORITY STATE REVISION "+stateRevision:
                "RECEIVED SNAPSHOTS "+snapshots+" / APPLIED REVISION "+appliedRevision+
                " / CURRENT STATE REVISION "+stateRevision;
            return "ROLE: "+role+" / CONNECTION: "+(connected?"READY":"NOT READY")+
                "\nLOCAL SEAT: "+local+" / ACTIVE SEAT: "+active+
                "\nINPUT OWNERSHIP: "+control+
                "\n"+snapshot+
                "\nLOCAL COMMANDS: "+acceptedLocal+" ACCEPTED / "+rejectedLocal+" REJECTED"+
                "\nREMOTE COMMANDS: "+acceptedRemote+" ACCEPTED / "+rejectedRemote+" REJECTED"+
                "\nCOUNTERS ARE NOT PROOF OF TWO-PC STATE PARITY";
        }
        void RenderDeveloper()
        {
            float w=Math.Min(430,UiWidth-24),x=UiWidth-w-12,y=70,h=Math.Min(620,UiHeight-90);Draw.Surface(new Rect(x,y,w,h),new Color(.025f,.04f,.065f),Draw.Gold);
            Draw.Text(new Rect(x+18,y+12,w-100,26),"DEVELOPER OVERLAY / F1",14,Draw.Gold,TextAnchor.MiddleLeft,true);
            if(Draw.Button(new Rect(x+w-60,y+8,44,44),"×",Draw.Gold,size:22))SetDeveloperOverlay(false);
            string id=inspectBallId>0?BallInspection.Read(Simulation.State,inspectBallId)?.Type??inspect:inspect.Length>0?inspect:selected;var d=Catalog.Ball(id);var a=Catalog.Ability(d.abilityId);var s=Simulation.State;
            var ngo=NetworkLink==null?null:GetComponent<CoreClash.Networking.NgoGameSession>();
            string networkDebug=W9NetworkDiagnostics(NetworkLink!=null,NetworkLink!=null&&NetworkLink.IsAuthority,
                NetworkLink==null||NetworkLink.IsConnected,s.phase==CoreClash.Core.MatchPhase.Aiming,NetworkLink==null?s.turn:NetworkLink.LocalOwner,
                s.turn,s.revision,ngo==null?0:ngo.ReceivedSnapshots,ngo==null?0:ngo.LastAppliedRevision,
                ngo==null?0:ngo.AcceptedLocalIntents,ngo==null?0:ngo.RejectedLocalIntents,
                ngo==null?0:ngo.AcceptedRemoteIntents,ngo==null?0:ngo.RejectedRemoteIntents);
            string technical="BALL: "+id+"\nUNITY STATUS: "+AbilitySupport.Status(id)+"\n\nV148 DESIGN REFERENCE\n"+string.Join(" + ",a.events)+"\n"+a.role+"\n"+string.Join(" / ",a.conditions)+"\n\n"+"TURN "+s.turnNumber+" / REVISION "+s.revision+" / FRAME "+s.frame+"\n"+"BALLS "+s.balls.Count+" / ZONES "+s.zones.Count(z=>!z.dead)+"\n"+"CANONICAL DECKS "+Catalog.Data.decks.Length+" / ROSTER "+Catalog.Data.balls.Length+"\n\n"+"R17-W9 / PC1-PC2 NETWORK DIAGNOSTICS\n"+networkDebug+"\n\n"+networkNotice+"\n\nNative primary support is separate from the imported reference metadata. Full roster abilities are not all implemented.";
            var content=new Rect(x+12,y+55,w-24,h-70);
            w9DeveloperScroll=Draw.ScrollView(content,w9DeveloperScroll,new Rect(0,0,content.width-22,840));
            Draw.Text(new Rect(5,0,content.width-32,830),technical,13,Draw.Muted);
            GUI.EndScrollView();
        }
    }
}
