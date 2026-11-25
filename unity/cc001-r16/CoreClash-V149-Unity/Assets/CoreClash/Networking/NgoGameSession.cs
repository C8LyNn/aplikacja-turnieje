using System;
using System.Linq;
using CoreClash.Core;
using CoreClash.Presentation;
using Unity.Netcode;
using Unity.Netcode.Transports.UTP;
using Unity.Services.Multiplayer;
using UnityEngine;

namespace CoreClash.Networking
{
    public sealed class NgoGameSession : MonoBehaviour,IUnityNetworkLink
    {
        const string FullRoomReason="This game already has a Player 2. Choose another room.";
        [SerializeField] NetworkManager manager;
        [SerializeField] UnityTransport transport;
        CoreClashApp app;
        NgoRpcBridge bridge;
        NetworkGameSession authority;
        NetworkGameStateAdapter adapter=new NetworkGameStateAdapter();
        NgoSnapshotAssembler assembler=new NgoSnapshotAssembler();
        readonly LanSeat seat=new LanSeat();
        bool hostRole,pendingIntent,failed,intentionalDisconnect=true,recoveryPending,internetMode;
        float nextSnapshot,connectDeadline,lastHostTraceAt=-1f,lastClientTraceAt=-1f;
        int pendingSequence;
        long skippedSnapshotRevisions;
        string status="Choose Create Game or Join Game",lastError="";
        public bool IsAuthority=>hostRole&&manager!=null&&manager.IsServer;
        // Connected: the host has its guest; the guest has heard from the host - the room, or a match.
        public bool IsConnected=>!failed&&manager!=null&&manager.IsListening&&bridge!=null&&bridge.IsSpawned&&(IsAuthority?seat.Connected.HasValue:manager.IsConnectedClient&&(lobbyKnown||ReceivedSnapshots>0));
        public int LocalOwner=>hostRole?0:1;
        public string Status=>status;
        public int ReceivedSnapshots {get;private set;}
        public int AcceptedRemoteIntents {get;private set;}
        public int RejectedRemoteIntents {get;private set;}
        public int AcceptedLocalIntents {get;private set;}
        public int RejectedLocalIntents {get;private set;}
        public int LastAppliedRevision {get;private set;}
        public int LastReceivedEvents {get;private set;}
        public int LobbyPlayerCount=>seat.Connected.HasValue||seat.Pending.HasValue?2:1;
        public bool NeedsRecovery=>recoveryPending;
        public bool Hosting=>hostRole;
        public bool CanStart=>TransportAvailable&&(Internet==null||Internet.CanStart);
        public bool UsingInternet=>internetMode;
        public NgoInternetSession Internet=>GetComponent<NgoInternetSession>();
        internal bool TransportAvailable=>manager!=null&&!manager.IsListening&&!manager.ShutdownInProgress;
        internal bool TransportConnected=>manager!=null&&manager.IsConnectedClient;
        internal bool TransportRunning=>manager!=null&&manager.IsListening;
        internal bool HasFailed=>failed;
        public string FailureMessage=>lastError;

        public static void ConfigureScene(GameObject appObject)
        {
            var nm=UnityEngine.Object.FindAnyObjectByType<NetworkManager>();
            if(nm==null)nm=new GameObject("Core Clash NGO NetworkManager").AddComponent<NetworkManager>();
            if(nm.NetworkConfig==null)nm.NetworkConfig=new NetworkConfig();
            var utp=nm.GetComponent<UnityTransport>();if(utp==null)utp=nm.gameObject.AddComponent<UnityTransport>();
            utp.UseWebSockets=true;utp.MaxPayloadSize=4096;utp.MaxSendQueueSize=1024*1024;utp.SetConnectionData("127.0.0.1",7777,"0.0.0.0");
            // 150: W24, a session starts in a room (MatchLobby). A game of an older build expects the match
            // at once, so the two refuse each other at the door instead of waiting for one another.
            nm.NetworkConfig.NetworkTransport=utp;nm.NetworkConfig.ProtocolVersion=150;nm.NetworkConfig.TickRate=20;
            nm.NetworkConfig.ConnectionApproval=true;nm.NetworkConfig.EnableSceneManagement=true;nm.NetworkConfig.PlayerPrefab=null;
            if(appObject.GetComponent<NetworkObject>()==null)appObject.AddComponent<NetworkObject>();
            if(appObject.GetComponent<NgoRpcBridge>()==null)appObject.AddComponent<NgoRpcBridge>();
            var session=appObject.GetComponent<NgoGameSession>();if(session==null)session=appObject.AddComponent<NgoGameSession>();
            session.manager=nm;session.transport=utp;
            if(appObject.GetComponent<NgoInternetSession>()==null)appObject.AddComponent<NgoInternetSession>();
            if(appObject.GetComponent<NgoLanLobby>()==null)appObject.AddComponent<NgoLanLobby>();
#if UNITY_EDITOR
            if(appObject.GetComponent<CoreClash.Testing.NgoSmokeDriver>()==null)appObject.AddComponent<CoreClash.Testing.NgoSmokeDriver>();
#endif
        }
        void Awake(){app=GetComponent<CoreClashApp>();}
        void Start(){BindCallbacks();}
        void BindCallbacks()
        {
            if(manager==null)manager=UnityEngine.Object.FindAnyObjectByType<NetworkManager>();
            if(manager==null)return;
            manager.ConnectionApprovalCallback-=Approve;manager.ConnectionApprovalCallback+=Approve;
            manager.OnClientConnectedCallback-=Connected;manager.OnClientConnectedCallback+=Connected;
            manager.OnClientDisconnectCallback-=Disconnected;manager.OnClientDisconnectCallback+=Disconnected;
            manager.OnTransportFailure-=TransportFailed;manager.OnTransportFailure+=TransportFailed;
        }
        public bool Host(string hostAddress,ushort port)
        {
            if(Application.platform==RuntimePlatform.WebGLPlayer||Application.platform==RuntimePlatform.Android){SetStatus("Create the game on Windows; this device can join as Player 2.");return false;}
            if(!LanEndpoint.TryNormalize(hostAddress,port,out hostAddress)){SetStatus("Use a valid host address and gameplay port.");return false;}
            if(!CanStart)return false;
            ResetSession(true);transport.UseWebSockets=true;transport.UseEncryption=false;transport.SetConnectionData(true,hostAddress,port,hostAddress=="127.0.0.1"?"127.0.0.1":"0.0.0.0");
            OpenRoom();app.BeginNetworkLobby(this);BindCallbacks();
            if(!manager.StartHost()){FailConnection("The game could not be created. Try Create Game again.");return false;}
            SetStatus("HOST P1 · WebSocket :"+port+" · waiting for P2");Debug.Log("CC_NET_HOST_READY port="+port);return true;
        }
        public bool Join(string hostAddress,ushort port)
        {
            if(!CanStart)return false;
            if(!LanEndpoint.TryNormalize(hostAddress,port,out hostAddress)){SetStatus("Use a valid host IP or paste an invitation.");return false;}
            ResetSession(false);transport.UseWebSockets=true;transport.UseEncryption=false;transport.SetConnectionData(true,hostAddress.Trim(),port);
            OpenRoom();app.BeginNetworkLobby(this);BindCallbacks();SetStatus("Joining the game as Player 2…");connectDeadline=Time.unscaledTime+20;
            if(!manager.StartClient()){FailConnection("The connection could not start. Choose a game and try again.");return false;}return true;
        }
        void ResetSession(bool hosting)
        {
            hostRole=hosting;internetMode=false;seat.Reset();wishKnown=false;lobby=null;lobbyShown=null;lobbyKnown=false;choiceJson=null;pendingIntent=failed=recoveryPending=intentionalDisconnect=false;pendingSequence=0;authority=null;bridge=null;connectDeadline=0;
            adapter=new NetworkGameStateAdapter();assembler=new NgoSnapshotAssembler();ReceivedSnapshots=AcceptedRemoteIntents=RejectedRemoteIntents=AcceptedLocalIntents=RejectedLocalIntents=LastAppliedRevision=LastReceivedEvents=0;
            nextSnapshot=0;lastHostTraceAt=lastClientTraceAt=-1f;skippedSnapshotRevisions=0;lastError="";
        }
        internal void InternetPending(bool hosting)
        {
            ResetSession(hosting);internetMode=true;SetStatus(hosting?"Preparing your Internet game…":"Joining the Internet game…");
        }
        internal void InternetStatus(string message){SetStatus(message);}
        internal void InternetFailure(string message){FailConnection(message);}
        internal bool StartRelayNetwork(NetworkConfiguration configuration)
        {
            if(!TransportAvailable||configuration.Type!=NetworkType.Relay)return false;
            bool hosting=configuration.Role==NetworkRole.Host;
            if(configuration.Role!=NetworkRole.Host&&configuration.Role!=NetworkRole.Client)return false;
            if(hosting&&(Application.platform==RuntimePlatform.WebGLPlayer||Application.platform==RuntimePlatform.Android))return false;
            ResetSession(hosting);internetMode=true;
            transport.UseWebSockets=true;transport.UseEncryption=false;transport.SetRelayServerData(configuration.RelayServerData);
            // MPS calls this handler instead of its default NGO handler. Prepare authority before the one NGO start.
            OpenRoom();app.BeginNetworkLobby(this);BindCallbacks();
            SetStatus(hosting?"HOST P1 · Internet Relay · waiting for P2":"Joining Internet Relay as Player 2…");
            if(!hosting)connectDeadline=Time.unscaledTime+35;
            bool started=hosting?manager.StartHost():manager.StartClient();
            if(started)Debug.Log("CC_NET_RELAY_STARTED role="+(hosting?"host":"client")+" protocol=wss");
            return started;
        }
        internal void StopInternetTransport()
        {
            intentionalDisconnect=true;connectDeadline=0;pendingIntent=false;
            if(manager!=null&&manager.IsListening&&!manager.ShutdownInProgress)manager.Shutdown();
        }
        void TransportFailed(){if(!intentionalDisconnect)FailConnection(internetMode?"The Internet connection stopped. Check your connection, then create or join a game again.":"The local network connection stopped. Create or join a game again.");}
        void Approve(NetworkManager.ConnectionApprovalRequest request,NetworkManager.ConnectionApprovalResponse response)
        {
            ExpirePendingSeat();
            bool local=request.ClientNetworkId==Unity.Netcode.NetworkManager.ServerClientId;
            response.Approved=local||seat.TryReserve(request.ClientNetworkId,Time.unscaledTime);response.CreatePlayerObject=false;response.Pending=false;
            if(!response.Approved)response.Reason=FullRoomReason;
        }
        void Connected(ulong id)
        {
            if(manager.IsServer&&id!=Unity.Netcode.NetworkManager.ServerClientId){
                if(!seat.Commit(id,Time.unscaledTime)){manager.DisconnectClient(id);return;}
                authority?.ForgetConnection(1);SetStatus("HOST P1 · P2 connected · authoritative");nextSnapshot=0;Debug.Log("CC_NET_PEER_CONNECTED id="+id+" owner=1");
                lobby?.GuestJoined();SettleColors();
                // What the guest said before its seat was confirmed.
                if(choiceJson!=null&&choiceFrom==id){string kept=choiceJson;choiceJson=null;ReceiveLobbyChoice(id,kept);}
                SendLobby();
            }
            else if(!manager.IsServer)SetStatus("P2 connected · awaiting authoritative state");
        }
        void Disconnected(ulong id)
        {
            if(intentionalDisconnect||recoveryPending)return;
            if(hostRole){if(seat.Release(id)){pendingIntent=false;lobby?.GuestLeft();SetStatus("Player 2 disconnected. Waiting for a player to rejoin.");Debug.Log("CC_NET_SEAT_RELEASED id="+id);}}
            else if(id==manager.LocalClientId){
                Debug.LogWarning("CC_NET_DISCONNECT_DETAIL "+manager.DisconnectReason);
                string message=ReceivedSnapshots>0||lobbyKnown?"Connection to the host was lost. You can join again or play locally.":"Could not join the game. Check that the host is still running and try again.";
                FailConnection(manager.DisconnectReason==FullRoomReason?FullRoomReason:message);
            }
        }
        public void BridgeSpawned(NgoRpcBridge rpcBridge)
        {
            bridge=rpcBridge;nextSnapshot=0;Debug.Log("CC_NET_BRIDGE_SPAWNED server="+manager.IsServer);
            // The guest tells the host at once what it brings.
            if(!manager.IsServer)SendChoice();
        }

        // ------------------------------------------------------------ the lobby (W24, the course brief)
        // Before a match the players are in a room: each brings a deck and says "ready", and the host
        // starts the match when both have. After a match the host plays again, plays the next map or
        // takes everybody back to the room. The host's MatchLobby decides; the guest shows the
        // host's LobbyState and asks.
        MatchLobby lobby;LobbyState lobbyShown;LobbyChoice mine=new LobbyChoice();
        bool lobbyKnown;int sentLobbyRevision=-1,seenRound;float nextLobbySend;
        ulong choiceFrom;string choiceJson;
        // The room as this player sees it (null before a session, and for a guest until the host has sent it).
        public LobbyState Lobby=>hostRole?lobby?.State:lobbyShown;
        public bool InLobby=>Lobby!=null&&!Lobby.inMatch;
        public LobbyBlock LobbyBlocked=>hostRole&&lobby!=null?lobby.Blocked:MatchLobby.BlockOf(lobbyShown,balls=>balls!=null&&balls.Length==9);
        public bool LobbyCanStart=>IsAuthority&&lobby!=null&&bridge!=null&&lobby.CanStart;
        void OpenRoom()
        {
            lobby=hostRole?app.NewRoom():null;lobbyShown=null;lobbyKnown=false;sentLobbyRevision=-1;seenRound=0;nextLobbySend=0;choiceJson=null;
            mine=new LobbyChoice{color=MatchSetup.Color1};
            var deck=app.LocalDeck;
            if(hostRole)
            {
                int count=Theme.PlayerColors.Length,hostColor=SeatColors.Host(MatchSetup.Color1,count);
                lobby.SetDeck(0,deck.id,deck.name,deck.balls);lobby.SetColors(hostColor,SeatColors.Guest(hostColor,MatchSetup.Color2,count));PublishRules();
            }
            else{mine.deckId=deck.id;mine.deckName=deck.name;mine.balls=(string[])deck.balls.Clone();}
        }
        // The rules of the next match are the host's own settings.
        public void PublishRules(){if(hostRole&&lobby!=null)lobby.SetRules(MatchSetup.Map,MatchSetup.BallScale,MatchSetup.DoubleTurn);}
        public void SetRoomName(string name){if(hostRole&&lobby!=null)lobby.SetRoom(name);}
        // This player brings another deck.
        public void LobbySetDeck(CoreClash.Data.DeckDefinition deck)
        {
            if(deck==null||Lobby==null||Lobby.inMatch)return;
            if(hostRole)lobby.SetDeck(0,deck.id,deck.name,deck.balls);
            else{mine.deckId=deck.id;mine.deckName=deck.name;mine.balls=(string[])deck.balls.Clone();mine.ready=false;SendChoice();}
        }
        public void LobbySetReady(bool ready)
        {
            if(Lobby==null||Lobby.inMatch)return;
            if(hostRole)lobby.SetReady(0,ready);else{mine.ready=ready;SendChoice();}
        }
        // This player took another colour (MatchSetup.Color1). The host keeps its own; the guest
        // gets the one it asks for unless it is the host's.
        public void LobbyColorChanged()
        {
            if(Lobby==null||Lobby.inMatch)return;
            if(!hostRole){SendChoice();return;}
            if(wishKnown&&seat.Owns(wishFrom)){SettleColors();return;}
            int count=Theme.PlayerColors.Length,hostColor=SeatColors.Host(MatchSetup.Color1,count),guestColor=SeatColors.Guest(hostColor,MatchSetup.Color2,count);
            Theme.SetPlayerColors(hostColor,guestColor);lobby.SetColors(hostColor,guestColor);
        }
        void SendChoice()
        {
            if(hostRole||bridge==null||!bridge.IsSpawned)return;
            mine.color=MatchSetup.Color1;bridge.LobbyChoiceRpc(JsonUtility.ToJson(mine));
        }
        // The host starts the match the room agreed on.
        public bool LobbyStart()
        {
            if(!LobbyCanStart||!lobby.Start())return false;
            BeginMatch();return true;
        }
        // From the result screen (host): the same decks again, on the same map or on the next one.
        public bool LobbyRematch(bool nextMap)
        {
            if(!IsAuthority||lobby==null||!lobby.State.inMatch||app.Simulation.State.phase!=MatchPhase.Over)return false;
            lobby.Finish(app.Simulation.State.winner);
            if(!lobby.Rematch())return false;
            // "Next map": the one after the map just played, for this match only - the host's own
            // setting (a chosen map, or a random one every time) stays as it is.
            string setting=MatchSetup.Map;
            if(nextMap)MatchSetup.Map=MatchSetup.NextMap(app.Simulation.State.mapId);
            try{BeginMatch();}finally{MatchSetup.Map=setting;}
            return true;
        }
        // Back to the room. The host does it; a guest asks the host for it.
        public void LobbyReturn()
        {
            if(Lobby==null||!Lobby.inMatch)return;
            if(!hostRole){if(bridge!=null&&bridge.IsSpawned)bridge.LobbyRequestRpc(MatchLobby.RequestLobby);return;}
            if(app.Simulation.State.phase==MatchPhase.Over)lobby.Finish(app.Simulation.State.winner);
            lobby.ReturnToLobby();authority=null;pendingIntent=false;app.ShowNetworkLobby();SendLobby();
            Debug.Log("CC_NET_LOBBY_RETURN round="+lobby.State.round);
        }
        void BeginMatch()
        {
            Theme.SetPlayerColors(lobby.State.host.color,lobby.State.guest.color);
            app.BeginNetworkMatch(this,lobby.Deck(0),lobby.Deck(1));authority=new NetworkGameSession(app.Simulation);pendingIntent=false;
            // The room first, the match's state after it: the guest gets ready for a new match on the room's word.
            SendLobby();nextSnapshot=0;
            Debug.Log("CC_NET_LOBBY_START round="+lobby.State.round+" map="+app.Simulation.State.mapId);
        }
        void SendLobby()
        {
            if(!IsAuthority||lobby==null||bridge==null||!bridge.IsSpawned)return;
            sentLobbyRevision=lobby.State.revision;nextLobbySend=Time.unscaledTime+1;
            if(seat.Connected.HasValue)bridge.LobbyRpc(JsonUtility.ToJson(lobby.State));
        }
        public void ReceiveLobby(string json)
        {
            if(IsAuthority||failed||json==null||json.Length>MatchLobby.MaxWire)return;
            LobbyState state=null;try{state=JsonUtility.FromJson<LobbyState>(json);}catch(ArgumentException){}
            if(!MatchLobby.Admit(state,app.Catalog))return;
            bool first=!lobbyKnown,fromMatch=lobbyShown!=null&&lobbyShown.inMatch;lobbyShown=state;lobbyKnown=true;
            if(SeatColors.Valid(state.host.color,state.guest.color,Theme.PlayerColors.Length))Theme.SetPlayerColors(state.host.color,state.guest.color);
            if(first){SetStatus("P2 · in the lobby");Debug.Log("CC_NET_LOBBY_JOINED round="+state.round+" inMatch="+state.inMatch);}
            if(state.inMatch&&state.round!=seenRound)
            {
                // A new match of the session: nothing of the last one may be taken for it.
                seenRound=state.round;adapter=new NetworkGameStateAdapter();assembler=new NgoSnapshotAssembler();
                ReceivedSnapshots=LastAppliedRevision=LastReceivedEvents=0;skippedSnapshotRevisions=0;pendingIntent=false;pendingSequence=0;
                mine.ready=false;app.BeginNetworkMatch(this,ShownDeck(0),ShownDeck(1));Debug.Log("CC_NET_LOBBY_MATCH round="+state.round);
            }
            else if(!state.inMatch)
            {
                // Back from a match everybody confirms again.
                if(fromMatch)mine.ready=false;
                app.ShowNetworkLobby();
                // The host has no deck for this player (or another one): say again what is brought.
                if(mine.balls!=null&&mine.balls.Length==9&&!mine.balls.SequenceEqual(state.guest.balls)&&Time.unscaledTime>=nextLobbySend){nextLobbySend=Time.unscaledTime+1;SendChoice();}
            }
        }
        // A seat of the room the host sent, as a deck (this player's own deck if the host sent none).
        CoreClash.Data.DeckDefinition ShownDeck(int owner)
        {
            var deck=MatchLobby.DeckOf(lobbyShown,owner,app.Catalog);
            return deck.balls.Length==9?deck:app.LocalDeck;
        }
        public void ReceiveLobbyChoice(ulong sender,string json)
        {
            if(!IsAuthority||lobby==null||json==null||json.Length>MatchLobby.MaxWire)return;
            // Like the colour wish, the choice can arrive before the seat is confirmed: kept until it is.
            if(!seat.Owns(sender)){choiceFrom=sender;choiceJson=json;return;}
            LobbyChoice choice=null;try{choice=JsonUtility.FromJson<LobbyChoice>(json);}catch(ArgumentException){}
            if(choice==null)return;
            wishFrom=sender;wishColor=choice.color;wishKnown=true;SettleColors();
            lobby.Apply(choice);
        }
        public void ReceiveLobbyRequest(ulong sender,int request)
        {
            if(!IsAuthority||lobby==null||!seat.Owns(sender))return;
            // A guest may ask for the lobby once the match is over.
            if(request==MatchLobby.RequestLobby&&lobby.State.inMatch&&app.Simulation.State.phase==MatchPhase.Over)LobbyReturn();
        }
        // W24 (owner decision: in PvP each player picks their colour). The guest's ready message says
        // which colour they chose. It can arrive before the guest's seat is confirmed (measured: it
        // does), so the wish is kept and the colours are settled as soon as both are known: the host
        // keeps theirs, the guest gets the one they chose unless it is the host's (SeatColors), and
        // the host tells the guest, so both screens show the same two colours.
        ulong wishFrom;int wishColor;bool wishKnown;
        public void PeerReady(ulong sender,int chosenColor)
        {
            if(!IsAuthority)return;
            wishFrom=sender;wishColor=chosenColor;wishKnown=true;
            if(seat.Owns(sender)){nextSnapshot=0;SettleColors();}
        }
        void SettleColors()
        {
            if(!IsAuthority||!wishKnown||!seat.Owns(wishFrom))return;
            int count=Theme.PlayerColors.Length,hostColor=SeatColors.Host(MatchSetup.Color1,count),guestColor=SeatColors.Guest(hostColor,wishColor,count);
            Theme.SetPlayerColors(hostColor,guestColor);lobby?.SetColors(hostColor,guestColor);
            if(bridge!=null)bridge.ColorsRpc(hostColor,guestColor);
            Debug.Log("CC_NET_COLORS role=host host="+hostColor+" guest="+guestColor+" asked="+wishColor);
        }
        public void ReceiveColors(int hostColor,int guestColor)
        {
            if(IsAuthority||!SeatColors.Valid(hostColor,guestColor,Theme.PlayerColors.Length))return;
            Theme.SetPlayerColors(hostColor,guestColor);
            Debug.Log("CC_NET_COLORS role=client host="+hostColor+" guest="+guestColor);
        }
        public bool Submit(PlayerCommand command,out string reason)
        {
            reason="Network is not ready.";
            if(!IsConnected||command==null)return false;
            if(command.owner!=LocalOwner){reason="This connection cannot control the other player.";return false;}
            if(IsAuthority){bool accepted=authority.Submit(0,command,out reason);if(accepted){AcceptedLocalIntents++;nextSnapshot=0;Debug.Log("CC_NET_INTENT_ACCEPT owner=0 seq="+command.sequence);}return accepted;}
            if(pendingIntent){reason="Waiting for host acknowledgement.";return false;}
            pendingIntent=true;pendingSequence=command.sequence;bridge.IntentRpc(JsonUtility.ToJson(command));reason="Intent sent to host.";return true;
        }
        public void ReceiveIntent(ulong sender,string json)
        {
            if(failed||!IsAuthority||authority==null||bridge==null)return;
            string reason="Unassigned connection or malformed command.";PlayerCommand command=null;bool accepted=false;
            if(!seat.Owns(sender)){RejectedRemoteIntents++;Debug.LogWarning("CC_NET_INTENT_REJECT sender="+sender+" reason=Unassigned connection.");return;}
            if(json!=null&&json.Length<=1024){try{command=JsonUtility.FromJson<PlayerCommand>(json);}catch(ArgumentException){}}
            if(command!=null)accepted=authority.Submit(1,command,out reason);
            if(accepted){AcceptedRemoteIntents++;nextSnapshot=0;Debug.Log("CC_NET_INTENT_ACCEPT owner=1 seq="+command.sequence+" action="+app.Simulation.State.actionSerial);}
            else{RejectedRemoteIntents++;Debug.LogWarning("CC_NET_INTENT_REJECT sender="+sender+" reason="+reason);}
            bridge.IntentResultRpc(command?.sequence??0,accepted,reason??"");
        }
        public void ReceiveResult(int sequence,bool accepted,string reason)
        {
            if(!NetworkIntentReceipt.MatchesPending(pendingIntent,pendingSequence,sequence)){
                Debug.LogWarning("CC_NET_INTENT_RESULT_STALE sequence="+sequence+" pending="+pendingSequence);
                return;
            }
            pendingIntent=false;pendingSequence=0;
            if(accepted){AcceptedLocalIntents++;SetStatus("P2 · host accepted intent "+sequence);}
            else{RejectedLocalIntents++;SetStatus("Host rejected intent: "+reason);}
        }
        public void ReceiveChunk(int revision,int index,int count,byte[] payload)
        {
            if(IsAuthority||failed)return;
            // The state of a match counts only while the room says a match is on.
            if(!lobbyKnown||!lobbyShown.inMatch)return;
            try{
                if(!assembler.Add(revision,index,count,payload,out var json))return;
                var packet=JsonUtility.FromJson<SessionSnapshot>(json);
                if(packet==null||packet.revision!=revision||!adapter.Apply(packet,JsonUtility.FromJson<GameState>,out var reason)){SetStatus("Host state rejected by adapter.");return;}
                if(LastAppliedRevision>0&&revision>LastAppliedRevision+1)
                    skippedSnapshotRevisions+=(long)revision-LastAppliedRevision-1;
                ReceivedSnapshots++;LastAppliedRevision=revision;LastReceivedEvents=adapter.State.events?.Count??0;app.ReceiveNetworkState(adapter.State,revision);
                // Exact accepted wire payload; never hash resynthesized or smoothed poses.
                if(NetworkStateDigest.ShouldSample(revision)){
                    Debug.Log("CC_W11_STATE_RX revision="+revision+
                        " sha256="+NetworkStateDigest.Compute(packet.stateJson)+
                        " action="+adapter.State.actionSerial+" turn="+adapter.State.turn);
                }
                if(NetworkSnapshotTrace.Due(Time.unscaledTime,lastClientTraceAt)){
                    lastClientTraceAt=Time.unscaledTime;
                    Debug.Log("CC_W10_NET_CLIENT revision="+revision+" action="+adapter.State.actionSerial+
                        " turn="+adapter.State.turn+" phase="+adapter.State.phase+
                        " balls="+adapter.State.balls.Count+" received="+ReceivedSnapshots+
                        " skippedRevisions="+skippedSnapshotRevisions);
                }
                if(ReceivedSnapshots==1){SetStatus("P2 · authoritative state received");Debug.Log("CC_NET_STATE_APPLIED revision="+revision+" owner=1");}
            }catch(Exception e){FailConnection("The host sent unusable game state. Try joining again.");Debug.LogError("CC_NET_SNAPSHOT_ERROR "+e.Message);}
        }
        void LateUpdate()
        {
            if(recoveryPending){if(manager!=null&&manager.IsListening&&!manager.ShutdownInProgress)manager.Shutdown();return;}
            if(!hostRole&&!failed&&connectDeadline>0){if(IsConnected)connectDeadline=0;else if(Time.unscaledTime>=connectDeadline){FailConnection("The game did not respond. Check the invitation and try again.");return;}}
            if(IsAuthority)ExpirePendingSeat();
            if(IsAuthority&&lobby!=null)
            {
                if(lobby.State.inMatch&&app.Simulation.State.phase==MatchPhase.Over)lobby.Finish(app.Simulation.State.winner);
                if(!lobby.State.inMatch)PublishRules();
                if(seat.Connected.HasValue&&(lobby.State.revision!=sentLobbyRevision||Time.unscaledTime>=nextLobbySend))SendLobby();
            }
            if(!IsAuthority||authority==null||lobby==null||!lobby.State.inMatch||!IsConnected||Time.unscaledTime<nextSnapshot)return;
            try{
                var packet=authority.Capture(JsonUtility.ToJson);
                var packed=NgoWireProtocol.Encode(JsonUtility.ToJson(packet));
                var chunks=NgoWireProtocol.Split(packed);
                for(int i=0;i<chunks.Length;i++)bridge.SnapshotChunkRpc(packet.revision,i,chunks.Length,chunks[i]);
                // Same serialized state and revision that were sent to the client.
                // No raw JSON, session identifier, IP address or room code in logs.
                if(NetworkStateDigest.ShouldSample(packet.revision)){
                    var sentState=app.Simulation.State;
                    Debug.Log("CC_W11_STATE_TX revision="+packet.revision+
                        " sha256="+NetworkStateDigest.Compute(packet.stateJson)+
                        " action="+sentState.actionSerial+" turn="+sentState.turn);
                }
                // 20/12/8/4 Hz when moving, chosen by the ACTUAL compressed size;
                // at rest 4 Hz. Host state is the sole gameplay source of truth.
                float interval=NetworkSnapshotRate.Interval(app.Simulation.State.phase,packed.Length);
                nextSnapshot=Time.unscaledTime+interval;
                if(NetworkSnapshotTrace.Due(Time.unscaledTime,lastHostTraceAt)){
                    lastHostTraceAt=Time.unscaledTime;
                    var s=app.Simulation.State;
                    Debug.Log("CC_W10_NET_HOST revision="+packet.revision+" action="+s.actionSerial+
                        " turn="+s.turn+" phase="+s.phase+" balls="+s.balls.Count+
                        " packedBytes="+packed.Length+" chunks="+chunks.Length+
                        " periodMs="+(int)(interval*1000));
                }
            }catch(Exception e){FailConnection("The game could not send its state. Create a new game and try again.");Debug.LogError("CC_NET_SNAPSHOT_ERROR "+e.Message);}
        }
        void ExpirePendingSeat()
        {
            var expired=seat.Expire(Time.unscaledTime);
            if(expired.HasValue){manager.DisconnectClient(expired.Value);Debug.LogWarning("CC_NET_PENDING_SEAT_EXPIRED id="+expired.Value);}
        }
        void SetStatus(string value){status=value;app?.SetNetworkNotice(value);}
        void FailConnection(string message){failed=true;pendingIntent=false;recoveryPending=true;connectDeadline=0;lastError=message;SetStatus(message);Internet?.CancelAndLeave();Debug.LogWarning("CC_LAN_CONNECTION_FAILED "+message);}
        public void Disconnect(){lobby=null;lobbyShown=null;lobbyKnown=false;intentionalDisconnect=true;recoveryPending=false;connectDeadline=0;Internet?.CancelAndLeave();if(manager!=null&&manager.IsListening&&!manager.ShutdownInProgress)manager.Shutdown();failed=true;pendingIntent=false;SetStatus("Disconnected");}
        void OnDestroy()
        {
            Internet?.CancelAndLeave();if(manager==null)return;manager.ConnectionApprovalCallback-=Approve;manager.OnClientConnectedCallback-=Connected;manager.OnClientDisconnectCallback-=Disconnected;manager.OnTransportFailure-=TransportFailed;
        }
        void OnGUI()
        {
            // NgoLanLobby owns the public Create / Join UI. Transport and authority stay in this component.
        }
    }
}
