using CoreClash.Core;
namespace CoreClash.Networking
{
    public interface IUnityNetworkLink
    {
        bool IsAuthority {get;}
        bool IsConnected {get;}
        int LocalOwner {get;}
        string Status {get;}
        bool Submit(PlayerCommand command,out string reason);
        void Disconnect();
    }
}
