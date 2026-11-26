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
        float deadline,nextLobbyStep,stageAt;
        // W24: a session starts in a room. The smoke says "ready" on both sides and the host starts.
        // "--cc-network-rounds 2" goes on after the first match: the host ends it (a test match is
        // two shots long), plays the next map from the result, ends that one too, and the guest asks
        // for the room. "--cc-network-shots <folder>" keeps a picture of each screen on the way.
        int round,rounds=1,baseLocal,baseRemote,baseRejected,stage;
        string shots="";
        void Picture(string name)
        {
            if(shots.Length==0)return;
            string path=System.IO.Path.Combine(shots,(host?"host-":"guest-")+name+".png");
            if(!System.IO.File.Exists(path)){ScreenCapture.CaptureScreenshot(path);Debug.Log("CC_NET_SMOKE_PICTURE "+name);}
        }
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
            // Each side brings its own deck to the room (its Player 1 deck). The decks of the older
            // smokes hold balls outside the active roster, so those runs use the developer roster.
            if(options.ContainsKey("momentum")||options.ContainsKey("explosives")||options.ContainsKey("status"))app.SetDeveloperRoster(true);
            if(options.ContainsKey("momentum"))app.SelectDeck(0,app.Catalog.Data.decks.First(d=>d.balls.Contains(host?"pinballer":"slingshot")).id);
            if(options.ContainsKey("explosives"))app.SelectDeck(0,app.Catalog.Data.decks.First(d=>d.balls.Contains("mine")&&d.balls.Contains("timebomb")).id);
            if(options.ContainsKey("status"))app.SelectDeck(0,app.Catalog.Data.decks.First(d=>d.balls.Contains(host?"embertrap":"sporetrap")).id);
            if(options.TryGetValue("deck",out var deckValue))app.SelectDeck(0,deckValue);
            if(options.TryGetValue("rounds",out var roundsValue)&&int.TryParse(roundsValue,out var wanted))rounds=Mathf.Clamp(wanted,1,2);
            if(options.TryGetValue("shots",out var shotsValue)&&System.IO.Path.IsPathRooted(shotsValue)){shots=shotsValue;System.IO.Directory.CreateDirectory(shots);}
            if(options.TryGetValue("address",out var addressValue))address=addressValue;
            if(options.TryGetValue("port",out var portValue)&&ushort.TryParse(portValue,out var number))port=number;
            if(observeInvitation){started=true;deadline=Time.unscaledTime+90;Debug.Log("CC_NET_SMOKE_OBSERVE_INVITATION");return;}
            var manager=UnityEngine.Object.FindAnyObjectByType<Unity.Netcode.NetworkManager>();
            if(options.ContainsKey("internet"))started=host?link.Internet.Create("Core Clash crossplay test"):link.Internet.Join(options.TryGetValue("code",out var code)?code:"");
            else started=manager!=null&&manager.IsListening|| (host?link.Host(address,port):link.Join(address,port));deadline=Time.unscaledTime+90;
            if(rounds>1)deadline=Time.unscaledTime+170;
            Debug.Log("CC_NET_AUTOSTART role="+(host?"host":"client")+" smoke="+enabledSmoke+" started="+started);
        }
        void Update()
        {
            if(!started||!enabledSmoke||passed)return;
            if(host&&!printedInternetCode&&link.UsingInternet&&OnlineJoinAddress.TryParse(link.Internet?.Code,out var code)){printedInternetCode=true;Debug.Log("CC_NET_INTERNET_SMOKE_CODE "+code);}
            if(Time.unscaledTime>deadline){passed=true;Debug.LogError("CC_NET_SMOKE_FAIL timeout role="+(host?"host":"client")+" status="+link.Status);return;}
            var state=app.Simulation.State;
            var room=link.Lobby;
            // A guest has no room until the host has answered.
            if(room==null)return;
            if(!room.inMatch)
            {
                // The room: each side confirms, then the host starts.
                if(stage>=4){if(stage==4){stage=5;stageAt=Time.unscaledTime;}if(Time.unscaledTime>=stageAt+1f)Picture("lobby-after");if(!passed&&Time.unscaledTime>=stageAt+2f){passed=true;Debug.Log("CC_NET_SMOKE_PASS role="+(host?"host":"client")+" rounds="+round+" lobby=returned score="+room.host.wins+":"+room.guest.wins+" ready="+room.host.ready+"/"+room.guest.ready);}return;}
                if(Time.unscaledTime<nextLobbyStep)return;
                nextLobbyStep=Time.unscaledTime+.6f;
                if(!room.guest.present)return;
                Picture(room.host.ready&&room.guest.ready?"lobby-ready":"lobby");
                if(!room.Seat(link.LocalOwner).ready){link.LobbySetReady(true);Debug.Log("CC_NET_SMOKE_READY role="+(host?"host":"client"));}
                else if(host&&link.LobbyCanStart){nextLobbyStep=Time.unscaledTime+1.2f;if(shots.Length==0||System.IO.File.Exists(System.IO.Path.Combine(shots,"host-lobby-ready.png"))){bool begun=link.LobbyStart();Debug.Log("CC_NET_SMOKE_LOBBY_START started="+begun);}}
                return;
            }
            if(app.IsSetup)return;
            if(room.round!=round)
            {
                // A new match of the session: the checks start again, from what the counters show now.
                round=room.round;sent=spoofSent=duplicateSent=false;stage=0;
                baseLocal=link.AcceptedLocalIntents;baseRemote=link.AcceptedRemoteIntents;baseRejected=link.RejectedRemoteIntents;
                Debug.Log("CC_NET_SMOKE_ROUND role="+(host?"host":"client")+" round="+round+" map="+state.mapId+" decks="+state.players[0].deckId+"/"+state.players[1].deckId);
            }
            if(stage>0){AfterMatch(state,room);return;}
            if(!host&&link.IsConnected&&!spoofSent){
                spoofSent=true;var forged=new PlayerCommand{owner=0,turnNumber=state.turnNumber,sequence=999,kind=CommandKind.Spawn,ballType="normal",dx=0,dy=-1,power=420};
                GetComponent<NgoRpcBridge>().IntentRpc(JsonUtility.ToJson(forged));Debug.Log("CC_NET_SMOKE_SPOOF_SENT owner=0 from=remote");
            }
            if(!sent&&link.IsConnected&&state.phase==MatchPhase.Aiming&&state.turn==link.LocalOwner){
                var command=new PlayerCommand{owner=link.LocalOwner,turnNumber=state.turnNumber,sequence=1,kind=CommandKind.Spawn,ballType=options.ContainsKey("status")?(host?"embertrap":"sporetrap"):options.ContainsKey("explosives")?(host?"mine":"timebomb"):options.ContainsKey("momentum")?(host?"pinballer":"slingshot"):"normal",dx=0,dy=host?-1:1,power=options.ContainsKey("explosives")||options.ContainsKey("status")?60:420};
                sent=link.Submit(command,out var reason);submittedCommand=command;Debug.Log("CC_NET_SMOKE_COMMAND role="+(host?"host":"client")+" acceptedOrSent="+sent+" reason="+reason);
            }
            if(!host&&sent&&link.AcceptedLocalIntents>=baseLocal+1&&!duplicateSent){duplicateSent=true;GetComponent<NgoRpcBridge>().IntentRpc(JsonUtility.ToJson(submittedCommand));Debug.Log("CC_NET_SMOKE_DUPLICATE_SENT seq=1");}
            bool geometryReady=!options.ContainsKey("momentum")||state.structures.Exists(g=>!g.dead&&g.kind=="bumper");
            if(options.ContainsKey("explosives"))geometryReady=geometryReady&&state.balls.Exists(b=>!b.dead&&b.type=="mine"&&b.mineArmed)&&state.balls.Exists(b=>!b.dead&&b.type=="timebomb"&&b.timeBombArmed&&b.timeBombCounter==0);
            if(options.ContainsKey("status"))geometryReady=geometryReady&&state.zones.Exists(z=>!z.dead&&z.kind=="embertrap"&&z.owner==0)&&state.zones.Exists(z=>!z.dead&&z.kind=="sporetrap"&&z.owner==1);
            if(geometryReady&&options.ContainsKey("status")&&state.actionSerial>=2)Debug.Log("CC_NET_STATUS_STATE role="+(host?"host":"client")+" ember=P1 spore=P2 rng="+state.randomState);
            if(geometryReady&&options.ContainsKey("explosives")&&state.actionSerial>=2)Debug.Log("CC_NET_EXPLOSIVE_STATE role="+(host?"host":"client")+" mineArmed=True fuse=2");
            if(host&&geometryReady&&link.AcceptedRemoteIntents>=baseRemote+1&&link.RejectedRemoteIntents>=baseRejected+2&&state.actionSerial>=2){if(options.ContainsKey("momentum"))Debug.Log("CC_NET_MOMENTUM_STATE role=host bumpers="+state.structures.Count);Debug.Log("CC_NET_SMOKE_"+(rounds>1?"MATCH":"PASS")+" role=host round="+round+" remoteIntents="+link.AcceptedRemoteIntents+" rejected="+link.RejectedRemoteIntents+" actionSerial="+state.actionSerial);if(rounds>1){stage=1;stageAt=Time.unscaledTime;}else passed=true;}
            // The forged and the repeated message get no answer the guest counts (their results are stale by
            // design since W11); that the host refused both is checked on the host's side (rejected=2).
            if(!host&&geometryReady&&sent&&spoofSent&&duplicateSent&&link.AcceptedLocalIntents>=baseLocal+1&&link.ReceivedSnapshots>=2&&state.actionSerial>=2){if(options.ContainsKey("momentum"))Debug.Log("CC_NET_MOMENTUM_STATE role=client bumpers="+state.structures.Count);Debug.Log("CC_NET_SMOKE_"+(rounds>1?"MATCH":"PASS")+" role=client round="+round+" snapshots="+link.ReceivedSnapshots+" revision="+link.LastAppliedRevision+" actionSerial="+state.actionSerial+" events="+link.LastReceivedEvents+" rejected="+link.RejectedLocalIntents);if(rounds>1){stage=1;stageAt=Time.unscaledTime;}else passed=true;}
        }
        // "--cc-network-rounds 2", after the two shots of a match. Stage 1: the match is on; the host
        // waits for the board to settle and ends it (the host's state is the match - the guest sees
        // the same end). Stage 2: the result is on both screens. After the first match the host
        // plays the next map; after the second the guest asks for the room.
        void AfterMatch(GameState state,LobbyState room)
        {
            if(stage==1)
            {
                Picture("match");
                if(state.phase==MatchPhase.Over){stage=2;stageAt=Time.unscaledTime;Debug.Log("CC_NET_SMOKE_RESULT role="+(host?"host":"client")+" round="+round+" winner="+state.winner);return;}
                if(host&&state.phase==MatchPhase.Aiming&&Time.unscaledTime>=stageAt+2f)
                {
                    int winner=round%2==1?0:1;state.players[1-winner].hp=0;state.winner=winner;state.resultReason="Base destroyed";state.phase=MatchPhase.Over;
                    Debug.Log("CC_NET_SMOKE_END round="+round+" winner="+winner);
                }
                return;
            }
            if(stage==2&&Time.unscaledTime>=stageAt+2.5f)
            {
                Picture("result-"+round);
                if(Time.unscaledTime<stageAt+4f)return;
                stage=3;
                if(round==1&&host){string before=state.mapId;bool again=link.LobbyRematch(true);Debug.Log("CC_NET_SMOKE_NEXT_MAP started="+again+" from="+before+" to="+app.Simulation.State.mapId+" score="+room.host.wins+":"+room.guest.wins);}
                if(round>=2&&!host){stage=4;stageAt=Time.unscaledTime;link.LobbyReturn();Debug.Log("CC_NET_SMOKE_ASK_LOBBY");}
                if(round>=2&&host){stage=4;stageAt=Time.unscaledTime;}
            }
        }
    }
}
