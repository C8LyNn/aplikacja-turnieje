using System;
using System.Linq;
using CoreClash.Data;
using UnityEngine;
namespace CoreClash.Presentation
{
    public sealed partial class CoreClashApp
    {
        // Balls without a guide entry (frozen balls in the developer roster) keep the older text card body.
        float LegacyContent(BallDefinition definition,float width,bool draw,float y)
        {
            Action<string,int,Color,bool> line=(text,size,color,bold)=>{
                if(string.IsNullOrEmpty(text))return;
                float height=Draw.TextHeight(text,width,size,bold);
                if(draw)Draw.Text(new Rect(0,y,width,height),text,size,color,TextAnchor.UpperLeft,bold);
                y+=height+12;
            };
            if(!string.IsNullOrEmpty(definition.archetype))line("ARCHETYPE  /  "+definition.archetype.ToUpperInvariant(),11,Draw.Muted,true);
            line(Quick(definition.id),19,Theme.Text,false);
            line("ABILITY",11,Draw.Cyan,true);
            line(AbilityText(definition.id),16,Theme.Text,false);
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
            float w=Math.Min(430,UiWidth-24),x=UiWidth-w-12,y=70,h=Math.Min(620,UiHeight-90);Draw.Surface(new Rect(x,y,w,h),Theme.Panel,Draw.Gold);
            Draw.Text(new Rect(x+18,y+12,w-100,26),"DEVELOPER OVERLAY / F1",14,Draw.Gold,TextAnchor.MiddleLeft,true);
            if(Draw.Button(new Rect(x+w-60,y+8,44,44),"×",Draw.Gold,size:22))SetDeveloperOverlay(false);
            // W22: the overlay disables the rest of the UI, so its own roster switch is re-enabled here.
            if(Catalog.Roster!=null&&setup){bool was=GUI.enabled;GUI.enabled=true;if(Draw.Button(new Rect(x+w-222,y+8,154,44),DeveloperRoster?"FROZEN: SHOWN":"FROZEN: HIDDEN",Draw.Gold,DeveloperRoster,true,11))SetDeveloperRoster(!DeveloperRoster);GUI.enabled=was;}
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
