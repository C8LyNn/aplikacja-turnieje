using System;
using System.Threading.Tasks;
using Unity.Services.Authentication;
using Unity.Services.Core;
using Unity.Services.Multiplayer;
using UnityEngine;

namespace CoreClash.Networking
{
    // The session owns cloud membership; NgoGameSession retains the sole gameplay authority and RPC validation.
    public sealed class NgoInternetSession : MonoBehaviour
    {
        const string SessionType="core-clash-v149";
        readonly OnlineOperationGate operation=new OnlineOperationGate();
        NgoGameSession link;
        ISession session;
        Task cleanup=Task.CompletedTask;
        bool destroyed;
        public bool Busy=>operation.Busy||!cleanup.IsCompleted;
        public bool CanStart=>!destroyed&&!Busy&&session==null;
        public string Code=>session?.Code??"";
        public bool HasSession=>session!=null;
        void Awake(){link=GetComponent<NgoGameSession>();}
        public bool Create(string roomName)
        {
            if(Application.platform==RuntimePlatform.WebGLPlayer||Application.platform==RuntimePlatform.Android)return false;
            return Begin(true,roomName);
        }
        public bool Join(string invitation)
        {
            if(!OnlineJoinAddress.TryParse(invitation,out var code))return false;
            return Begin(false,code);
        }
        bool Begin(bool hosting,string value)
        {
            if(link==null||!link.CanStart||!operation.TryBegin(out int ticket))return false;
            link.InternetPending(hosting);_ = RunAsync(hosting,value,ticket);return true;
        }
        bool Current(int ticket)=>!destroyed&&operation.IsCurrent(ticket);
        async Task RunAsync(bool hosting,string value,int ticket)
        {
            ISession acquired=null;
            try {
                if(!Guid.TryParse(Application.cloudProjectId,out var project)||project==Guid.Empty)
                    throw new InternetSetupException("Internet play needs a linked Unity Cloud project. Link this project and enable Authentication, Lobby and Relay, then rebuild. LAN is ready to use.");
                link.InternetStatus("Connecting to Unity Gaming Services…");
                if(UnityServices.State!=ServicesInitializationState.Initialized)await UnityServices.InitializeAsync();
                if(!Current(ticket))return;
                if(!AuthenticationService.Instance.IsSignedIn)await AuthenticationService.Instance.SignInAnonymouslyAsync();
                if(!Current(ticket))return;
                link.InternetStatus(hosting?"Creating a private two-player Internet game…":"Finding the invited Internet game…");
                var handler=new SessionNetworkHandler(this,link,ticket,hosting);
                var network=new NetworkOptions{RelayProtocol=RelayProtocol.WSS};
                if(hosting){
                    var options=new SessionOptions{Name=value,Type=SessionType,MaxPlayers=2,IsPrivate=true}
                        .WithRelayNetwork().WithNetworkOptions(network).WithNetworkHandler(handler);
                    acquired=await MultiplayerService.Instance.CreateSessionAsync(options);
                } else {
                    var options=new JoinSessionOptions{Type=SessionType}.WithNetworkOptions(network).WithNetworkHandler(handler);
                    acquired=await MultiplayerService.Instance.JoinSessionByCodeAsync(value,options);
                }
                if(!Current(ticket))return;
                if(handler.Failure!=null)throw handler.Failure;
                session=acquired;acquired=null;
                session.RemovedFromSession+=SessionEnded;session.Deleted+=SessionEnded;
                Debug.Log("CC_NET_INTERNET_SESSION_READY role="+(hosting?"host":"client")+" seats=2 protocol=wss");
            } catch(Exception e){
                if(Current(ticket)){link.InternetFailure(FriendlyError(e));Debug.LogWarning("CC_NET_INTERNET_ERROR "+e.GetType().Name+(e is SessionException se?" "+se.Error:""));}
            } finally {
                // SDK 2.2 requests cannot be canceled in flight. Never start a replacement transport before their stale result is left.
                if(acquired!=null)await LeaveAsync(acquired);
                if(!Current(ticket))await StopTransportAsync();
                operation.Finish(ticket);
            }
        }
        public void CancelAndLeave()
        {
            operation.Cancel();
            if(session==null)return;
            var leaving=session;session=null;
            leaving.RemovedFromSession-=SessionEnded;leaving.Deleted-=SessionEnded;
            cleanup=LeaveAsync(leaving);
        }
        void SessionEnded()
        {
            if(destroyed||session==null)return;
            link.InternetFailure("This Internet game has ended. Create or join a new game, or play on LAN.");
        }
        async Task LeaveAsync(ISession leaving)
        {
            try {
                // A Windows host ends its authoritative match; the client cannot inherit authority or physics.
                if(leaving.IsHost)await leaving.AsHost().DeleteAsync();else await leaving.LeaveAsync();
            } catch(Exception e){Debug.LogWarning("CC_NET_INTERNET_CLEANUP "+e.GetType().Name);}
            await StopTransportAsync();
        }
        async Task StopTransportAsync()
        {
            if(link==null)return;
            link.StopInternetTransport();
            while(link!=null&&!link.TransportAvailable&&!destroyed)await Task.Yield();
        }
        static string FriendlyError(Exception error)
        {
            if(error is InternetSetupException)return error.Message;
            if(error is SessionException sessionError){
                // MPS 2.2.4's LobbyConverter drops both these reasons and their inner exceptions.
                // Match only the observed Lobby details, then keep the ordinary typed-error path.
                if(sessionError.Error==SessionError.Unknown){
                    string translated=OnlineServiceError.FromUntypedLobbyDetail(sessionError.Message);
                    if(translated.Length>0)return translated;
                }
                switch(sessionError.Error){
                    case SessionError.SessionNotFound:case SessionError.SessionDeleted:case SessionError.InvalidSessionIdentifier:
                        return "That game code has expired or could not be found. Ask the host for the current code.";
                    case SessionError.RateLimitExceeded:return "Too many connection attempts. Wait a moment, then try again.";
                    case SessionError.Forbidden:case SessionError.NotAuthorized:return "Internet services are not available for this game. Check the Unity Cloud project services, or choose LAN.";
                }
                // Lobby-full may be wrapped as a session conflict; show useful guidance without exposing service internals.
                if(sessionError.InnerException is Unity.Services.Lobbies.LobbyServiceException lobby){
                    if(lobby.Reason==Unity.Services.Lobbies.LobbyExceptionReason.LobbyFull)return OnlineServiceError.Full;
                    if(lobby.Reason==Unity.Services.Lobbies.LobbyExceptionReason.InvalidJoinCode)return OnlineServiceError.InvalidCode;
                }
            }
            return "Could not connect to the Internet game. Check your connection and game code, then try again. LAN is also available.";
        }
        void OnDestroy(){destroyed=true;CancelAndLeave();}
        sealed class InternetSetupException:Exception{public InternetSetupException(string message):base(message){}}

        sealed class SessionNetworkHandler:INetworkHandler
        {
            readonly NgoInternetSession owner;
            readonly NgoGameSession link;
            readonly int ticket;
            readonly bool hosting;
            public Exception Failure {get;private set;}
            public SessionNetworkHandler(NgoInternetSession owner,NgoGameSession link,int ticket,bool hosting){this.owner=owner;this.link=link;this.ticket=ticket;this.hosting=hosting;}
            public async Task StartAsync(NetworkConfiguration configuration)
            {
                if(!owner.Current(ticket))return;
                try {
                    if((configuration.Role==NetworkRole.Host)!=hosting||!link.StartRelayNetwork(configuration))throw new InvalidOperationException("Relay transport could not start.");
                    float deadline=Time.realtimeSinceStartup+30;
                    while(owner.Current(ticket)&&!link.HasFailed&&(hosting?!link.TransportRunning:!link.TransportConnected)&&Time.realtimeSinceStartup<deadline)await Task.Yield();
                    if(!owner.Current(ticket)){await owner.StopTransportAsync();return;}
                    if(link.HasFailed||(!hosting&&!link.TransportConnected))throw new TimeoutException("Relay connection timed out.");
                } catch(Exception e){
                    // Return the session handle to RunAsync even when NGO fails, so it can release its cloud membership.
                    Failure=e;await owner.StopTransportAsync();
                }
            }
            public Task StopAsync()=>owner.StopTransportAsync();
        }
    }
}
