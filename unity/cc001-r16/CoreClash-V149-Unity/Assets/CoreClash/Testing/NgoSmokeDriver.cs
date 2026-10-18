using System;
using System.Collections.Generic;
using System.Linq;
using CoreClash.Core;
using CoreClash.Networking;
using CoreClash.Presentation;
using UnityEngine;

namespace CoreClash.Testing
{
    // Inert unless explicit smoke AND role flags are supplied, including in release validation builds.
    public sealed class NgoSmokeDriver : MonoBehaviour
    {
        NgoGameSession link;
        CoreClashApp app;
        bool enabledSmoke,host,started,sent,passed,spoofSent,duplicateSent,printedInternetCode;
        PlayerCommand submittedCommand;
        float deadline;
        string address="127.0.0.1";
        ushort port=7777;
        readonly Dictionary<string,string> options=new Dictionary<string,string>();
        void Start()
        {
            bool observeInvitation=false;
            link=GetComponent<NgoGameSession>();app=GetComponent<CoreClashApp>();
            string[] args=Environment.GetCommandLineArgs();
            for(int i=0;i<args.Length;i++)if(args[i].StartsWith("--cc-network-")){string key=args[i].Substring(13);options[key]=i+1<args.Length&&!args[i+1].StartsWith("--")?args[++i]:"1";}
            if(Application.platform==RuntimePlatform.WebGLPlayer){
                var query=Application.absoluteURL;int q=query.IndexOf('?');
                if(q>=0)foreach(string part in query.Substring(q+1).Split('&')){var pair=part.Split(new[]{'='},2);options[Uri.UnescapeDataString(pair[0])]=pair.Length==2?Uri.UnescapeDataString(pair[1]):"1";}
                if(options.ContainsKey("ccMomentum"))options["momentum"]="1";
                if(options.ContainsKey("ccExplosives"))options["explosives"]="1";
                if(options.ContainsKey("ccStatus"))options["status"]="1";
                if(options.ContainsKey("ccNetwork")){options[options["ccNetwork"]]="1";if(options.TryGetValue("ccAddress",out var a))options["address"]=a;if(options.TryGetValue("ccPort",out var p))options["port"]=p;if(options.ContainsKey("ccSmoke"))options["smoke"]="1";}
                if(options.ContainsKey("ccSmoke")&&LanJoinAddress.TryParse(Application.absoluteURL,out var invitedHost,out var invitedPort)){options["smoke"]="1";options["join"]="1";options["address"]=invitedHost;options["port"]=invitedPort.ToString();observeInvitation=true;}
                else if(options.ContainsKey("ccSmoke")&&OnlineJoinAddress.TryParse(Application.absoluteURL,out _)){options["smoke"]="1";options["join"]="1";observeInvitation=true;}
            }
            enabledSmoke=options.ContainsKey("smoke");host=options.ContainsKey("host");
            if(!enabledSmoke||!host&&!options.ContainsKey("join"))return;
            if(host&&options.ContainsKey("momentum")){
                app.SelectDeck(0,app.Catalog.Data.decks.First(d=>d.balls.Contains("pinballer")).id);
                app.SelectDeck(1,app.Catalog.Data.decks.First(d=>d.balls.Contains("slingshot")).id);
            }
            if(host&&options.ContainsKey("explosives")){
                string deck=app.Catalog.Data.decks.First(d=>d.balls.Contains("mine")&&d.balls.Contains("timebomb")).id;
                app.SelectDeck(0,deck);app.SelectDeck(1,deck);
            }
            if(host&&options.ContainsKey("status")){
                app.SelectDeck(0,app.Catalog.Data.decks.First(d=>d.balls.Contains("embertrap")).id);
                app.SelectDeck(1,app.Catalog.Data.decks.First(d=>d.balls.Contains("sporetrap")).id);
            }
            if(options.TryGetValue("address",out var addressValue))address=addressValue;
            if(options.TryGetValue("port",out var portValue)&&ushort.TryParse(portValue,out var number))port=number;
            if(observeInvitation){started=true;deadline=Time.unscaledTime+90;Debug.Log("CC_NET_SMOKE_OBSERVE_INVITATION");return;}
            var manager=UnityEngine.Object.FindAnyObjectByType<Unity.Netcode.NetworkManager>();
            if(options.ContainsKey("internet"))started=host?link.Internet.Create("Core Clash crossplay test"):link.Internet.Join(options.TryGetValue("code",out var code)?code:"");
            else started=manager!=null&&manager.IsListening|| (host?link.Host(address,port):link.Join(address,port));deadline=Time.unscaledTime+90;
            Debug.Log("CC_NET_AUTOSTART role="+(host?"host":"client")+" smoke="+enabledSmoke+" started="+started);
        }
        void Update()
        {
            if(!started||!enabledSmoke||passed)return;
            if(host&&!printedInternetCode&&link.UsingInternet&&OnlineJoinAddress.TryParse(link.Internet?.Code,out var code)){printedInternetCode=true;Debug.Log("CC_NET_INTERNET_SMOKE_CODE "+code);}
            if(Time.unscaledTime>deadline){passed=true;Debug.LogError("CC_NET_SMOKE_FAIL timeout role="+(host?"host":"client")+" status="+link.Status);return;}
            var state=app.Simulation.State;
            if(!host&&link.IsConnected&&!spoofSent){
                spoofSent=true;var forged=new PlayerCommand{owner=0,turnNumber=state.turnNumber,sequence=999,kind=CommandKind.Spawn,ballType="normal",dx=0,dy=-1,power=420};
                GetComponent<NgoRpcBridge>().IntentRpc(JsonUtility.ToJson(forged));Debug.Log("CC_NET_SMOKE_SPOOF_SENT owner=0 from=remote");
            }
            if(!sent&&link.IsConnected&&state.phase==MatchPhase.Aiming&&state.turn==link.LocalOwner){
                var command=new PlayerCommand{owner=link.LocalOwner,turnNumber=state.turnNumber,sequence=1,kind=CommandKind.Spawn,ballType=options.ContainsKey("status")?(host?"embertrap":"sporetrap"):options.ContainsKey("explosives")?(host?"mine":"timebomb"):options.ContainsKey("momentum")?(host?"pinballer":"slingshot"):"normal",dx=0,dy=host?-1:1,power=options.ContainsKey("explosives")||options.ContainsKey("status")?60:420};
                sent=link.Submit(command,out var reason);submittedCommand=command;Debug.Log("CC_NET_SMOKE_COMMAND role="+(host?"host":"client")+" acceptedOrSent="+sent+" reason="+reason);
            }
            if(!host&&sent&&link.AcceptedLocalIntents>=1&&!duplicateSent){duplicateSent=true;GetComponent<NgoRpcBridge>().IntentRpc(JsonUtility.ToJson(submittedCommand));Debug.Log("CC_NET_SMOKE_DUPLICATE_SENT seq=1");}
            bool geometryReady=!options.ContainsKey("momentum")||state.structures.Exists(g=>!g.dead&&g.kind=="bumper");
            if(options.ContainsKey("explosives"))geometryReady=geometryReady&&state.balls.Exists(b=>!b.dead&&b.type=="mine"&&b.mineArmed)&&state.balls.Exists(b=>!b.dead&&b.type=="timebomb"&&b.timeBombArmed&&b.timeBombCounter==0);
            if(options.ContainsKey("status"))geometryReady=geometryReady&&state.zones.Exists(z=>!z.dead&&z.kind=="embertrap"&&z.owner==0)&&state.zones.Exists(z=>!z.dead&&z.kind=="sporetrap"&&z.owner==1);
            if(geometryReady&&options.ContainsKey("status")&&state.actionSerial>=2)Debug.Log("CC_NET_STATUS_STATE role="+(host?"host":"client")+" ember=P1 spore=P2 rng="+state.randomState);
            if(geometryReady&&options.ContainsKey("explosives")&&state.actionSerial>=2)Debug.Log("CC_NET_EXPLOSIVE_STATE role="+(host?"host":"client")+" mineArmed=True fuse=2");
            if(host&&geometryReady&&link.AcceptedRemoteIntents>=1&&link.RejectedRemoteIntents>=2&&state.actionSerial>=2){passed=true;if(options.ContainsKey("momentum"))Debug.Log("CC_NET_MOMENTUM_STATE role=host bumpers="+state.structures.Count);Debug.Log("CC_NET_SMOKE_PASS role=host remoteIntents="+link.AcceptedRemoteIntents+" rejected="+link.RejectedRemoteIntents+" actionSerial="+state.actionSerial);}
            if(!host&&geometryReady&&sent&&link.AcceptedLocalIntents>=1&&link.RejectedLocalIntents>=2&&link.ReceivedSnapshots>=2&&state.actionSerial>=2){passed=true;if(options.ContainsKey("momentum"))Debug.Log("CC_NET_MOMENTUM_STATE role=client bumpers="+state.structures.Count);Debug.Log("CC_NET_SMOKE_PASS role=client snapshots="+link.ReceivedSnapshots+" revision="+link.LastAppliedRevision+" actionSerial="+state.actionSerial+" events="+link.LastReceivedEvents+" rejected="+link.RejectedLocalIntents);}
        }
    }
}
