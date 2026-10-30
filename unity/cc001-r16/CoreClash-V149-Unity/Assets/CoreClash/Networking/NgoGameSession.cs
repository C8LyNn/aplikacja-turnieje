using System;
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
        float nextSnapshot,connectDeadline;
        int pendingSequence;
        string status="Choose Create Game or Join Game",lastError="";
        public bool IsAuthority=>hostRole&&manager!=null&&manager.IsServer;
        public bool IsConnected=>!failed&&manager!=null&&manager.IsListening&&bridge!=null&&bridge.IsSpawned&&(IsAuthority?seat.Connected.HasValue:manager.IsConnectedClient&&ReceivedSnapshots>0);
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
            nm.NetworkConfig.NetworkTransport=utp;nm.NetworkConfig.ProtocolVersion=149;nm.NetworkConfig.TickRate=20;
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
            ResetSession(true);transport.UseWebSockets=true;transport.UseEncryption=false;transport.SetConnectionData(true,hostAddress,port,"0.0.0.0");
            app.BeginNetworkGame(this);authority=new NetworkGameSession(app.Simulation);BindCallbacks();
            if(!manager.StartHost()){FailConnection("The game could not be created. Try Create Game again.");return false;}
            SetStatus("HOST P1 · WebSocket :"+port+" · waiting for P2");Debug.Log("CC_NET_HOST_READY port="+port);return true;
        }
        public bool Join(string hostAddress,ushort port)
        {
            if(!CanStart)return false;
            if(!LanEndpoint.TryNormalize(hostAddress,port,out hostAddress)){SetStatus("Use a valid host IP or paste an invitation.");return false;}
            ResetSession(false);transport.UseWebSockets=true;transport.UseEncryption=false;transport.SetConnectionData(true,hostAddress.Trim(),port);
            app.BeginNetworkGame(this);BindCallbacks();SetStatus("Joining the game as Player 2…");connectDeadline=Time.unscaledTime+20;
            if(!manager.StartClient()){FailConnection("The connection could not start. Choose a game and try again.");return false;}return true;
        }
        void ResetSession(bool hosting)
        {
            hostRole=hosting;internetMode=false;seat.Reset();pendingIntent=failed=recoveryPending=intentionalDisconnect=false;pendingSequence=0;authority=null;bridge=null;connectDeadline=0;
            adapter=new NetworkGameStateAdapter();assembler=new NgoSnapshotAssembler();ReceivedSnapshots=AcceptedRemoteIntents=RejectedRemoteIntents=AcceptedLocalIntents=RejectedLocalIntents=LastAppliedRevision=LastReceivedEvents=0;
            nextSnapshot=0;lastError="";
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
            app.BeginNetworkGame(this);if(hosting)authority=new NetworkGameSession(app.Simulation);BindCallbacks();
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
            }
            else if(!manager.IsServer)SetStatus("P2 connected · awaiting authoritative state");
        }
        void Disconnected(ulong id)
        {
            if(intentionalDisconnect||recoveryPending)return;
            if(hostRole){if(seat.Release(id)){pendingIntent=false;SetStatus("Player 2 disconnected. Waiting for a player to rejoin.");Debug.Log("CC_NET_SEAT_RELEASED id="+id);}}
            else if(id==manager.LocalClientId){
                Debug.LogWarning("CC_NET_DISCONNECT_DETAIL "+manager.DisconnectReason);
                string message=ReceivedSnapshots>0?"Connection to the host was lost. You can join again or play locally.":"Could not join the game. Check that the host is still running and try again.";
                FailConnection(manager.DisconnectReason==FullRoomReason?FullRoomReason:message);
            }
        }
        public void BridgeSpawned(NgoRpcBridge rpcBridge){bridge=rpcBridge;nextSnapshot=0;Debug.Log("CC_NET_BRIDGE_SPAWNED server="+manager.IsServer);}
        public void PeerReady(ulong sender){if(IsAuthority&&seat.Owns(sender))nextSnapshot=0;}
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
            try{
                if(!assembler.Add(revision,index,count,payload,out var json))return;
                var packet=JsonUtility.FromJson<SessionSnapshot>(json);
                if(packet==null||packet.revision!=revision||!adapter.Apply(packet,JsonUtility.FromJson<GameState>,out var reason)){SetStatus("Host state rejected by adapter.");return;}
                ReceivedSnapshots++;LastAppliedRevision=revision;LastReceivedEvents=adapter.State.events?.Count??0;app.ReceiveNetworkState(adapter.State);
                // Diagnostic-only, opt-in via F1. Times are local monotonic clocks,
                // not cross-machine timestamps; never derive one-way latency here.
                if(app!=null&&app.DeveloperOverlay)
                    Debug.Log("CC_NET_TRACE_RX rev="+revision+" serial="+adapter.State.actionSerial+
                        " tms="+(long)(Time.realtimeSinceStartupAsDouble*1000.0)+
                        " turn="+adapter.State.turn+" phase="+adapter.State.phase+" chunks="+count);
                if(ReceivedSnapshots==1){SetStatus("P2 · authoritative state received · your deck is chosen by host");Debug.Log("CC_NET_STATE_APPLIED revision="+revision+" owner=1");}
            }catch(Exception e){FailConnection("The host sent unusable game state. Try joining again.");Debug.LogError("CC_NET_SNAPSHOT_ERROR "+e.Message);}
        }
        void LateUpdate()
        {
            if(recoveryPending){if(manager!=null&&manager.IsListening&&!manager.ShutdownInProgress)manager.Shutdown();return;}
            if(!hostRole&&!failed&&connectDeadline>0){if(IsConnected)connectDeadline=0;else if(Time.unscaledTime>=connectDeadline){FailConnection("The game did not respond. Check the invitation and try again.");return;}}
            if(IsAuthority)ExpirePendingSeat();
            if(!IsAuthority||authority==null||!IsConnected||Time.unscaledTime<nextSnapshot)return;
            try{
                var packet=authority.Capture(JsonUtility.ToJson);
                var packed=NgoWireProtocol.Encode(JsonUtility.ToJson(packet));
                var chunks=NgoWireProtocol.Split(packed);
                for(int i=0;i<chunks.Length;i++)bridge.SnapshotChunkRpc(packet.revision,i,chunks.Length,chunks[i]);
                // Do not log every frame in release gameplay. F1 explicitly enables
                // per-authoritative-snapshot observation without modifying physics.
                if(app!=null&&app.DeveloperOverlay)
                    Debug.Log("CC_NET_TRACE_TX rev="+packet.revision+" serial="+app.Simulation.State.actionSerial+
                        " tms="+(long)(Time.realtimeSinceStartupAsDouble*1000.0)+
                        " turn="+app.Simulation.State.turn+" phase="+app.Simulation.State.phase+
                        " bytes="+packed.Length+" chunks="+chunks.Length);
                // Aimed/idle state refreshes twice per second; moving uses 12/8/4 Hz
                // based on compressed bytes, instead of the former fixed 5 Hz.
                // Never move the client simulation: the server stays authoritative.
                nextSnapshot=Time.unscaledTime+NetworkSnapshotRate.Interval(app.Simulation.State.phase,packed.Length);
            }catch(Exception e){FailConnection("The game could not send its state. Create a new game and try again.");Debug.LogError("CC_NET_SNAPSHOT_ERROR "+e.Message);}
        }
        void ExpirePendingSeat()
        {
            var expired=seat.Expire(Time.unscaledTime);
            if(expired.HasValue){manager.DisconnectClient(expired.Value);Debug.LogWarning("CC_NET_PENDING_SEAT_EXPIRED id="+expired.Value);}
        }
        void SetStatus(string value){status=value;app?.SetNetworkNotice(value);}
        void FailConnection(string message){failed=true;pendingIntent=false;recoveryPending=true;connectDeadline=0;lastError=message;SetStatus(message);Internet?.CancelAndLeave();Debug.LogWarning("CC_LAN_CONNECTION_FAILED "+message);}
        public void Disconnect(){intentionalDisconnect=true;recoveryPending=false;connectDeadline=0;Internet?.CancelAndLeave();if(manager!=null&&manager.IsListening&&!manager.ShutdownInProgress)manager.Shutdown();failed=true;pendingIntent=false;SetStatus("Disconnected");}
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
