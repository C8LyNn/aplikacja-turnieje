using Unity.Netcode;

namespace CoreClash.Networking
{
    // The NetworkObject is authored in the scene by ConfigureScene; no player prefab is needed.
    public sealed class NgoRpcBridge : NetworkBehaviour
    {
        NgoGameSession session;
        public override void OnNetworkSpawn(){session=GetComponent<NgoGameSession>();session.BridgeSpawned(this);if(!IsServer)ReadyRpc(CoreClash.Presentation.MatchSetup.Color1);}
        [Rpc(SendTo.Server,InvokePermission=RpcInvokePermission.Everyone)]
        public void IntentRpc(string commandJson,RpcParams context=default){if(IsServer)session.ReceiveIntent(context.Receive.SenderClientId,commandJson);}
        [Rpc(SendTo.Server,InvokePermission=RpcInvokePermission.Everyone)]
        // W24: the guest says which colour they chose; the host answers with the two colours of the match.
        void ReadyRpc(int chosenColor,RpcParams context=default){if(IsServer)session.PeerReady(context.Receive.SenderClientId,chosenColor);}
        [Rpc(SendTo.NotServer,InvokePermission=RpcInvokePermission.Server)]
        public void ColorsRpc(int hostColor,int guestColor,RpcParams context=default)
        {
            if(!IsServer&&context.Receive.SenderClientId==Unity.Netcode.NetworkManager.ServerClientId)session.ReceiveColors(hostColor,guestColor);
        }
        // W24 lobby: the host's room to the guest; the guest's choice (deck, colour, ready) and its
        // requests to the host.
        [Rpc(SendTo.NotServer,InvokePermission=RpcInvokePermission.Server)]
        public void LobbyRpc(string json,RpcParams context=default)
        {
            if(!IsServer&&context.Receive.SenderClientId==Unity.Netcode.NetworkManager.ServerClientId)session.ReceiveLobby(json);
        }
        [Rpc(SendTo.Server,InvokePermission=RpcInvokePermission.Everyone)]
        public void LobbyChoiceRpc(string json,RpcParams context=default){if(IsServer)session.ReceiveLobbyChoice(context.Receive.SenderClientId,json);}
        [Rpc(SendTo.Server,InvokePermission=RpcInvokePermission.Everyone)]
        public void LobbyRequestRpc(int request,RpcParams context=default){if(IsServer)session.ReceiveLobbyRequest(context.Receive.SenderClientId,request);}
        [Rpc(SendTo.NotServer,InvokePermission=RpcInvokePermission.Server)]
        public void SnapshotChunkRpc(int revision,int index,int count,byte[] payload,RpcParams context=default)
        {
            if(!IsServer&&context.Receive.SenderClientId==Unity.Netcode.NetworkManager.ServerClientId)session.ReceiveChunk(revision,index,count,payload);
        }
        [Rpc(SendTo.NotServer,InvokePermission=RpcInvokePermission.Server)]
        public void IntentResultRpc(int sequence,bool accepted,string reason,RpcParams context=default)
        {
            if(!IsServer&&context.Receive.SenderClientId==Unity.Netcode.NetworkManager.ServerClientId)session.ReceiveResult(sequence,accepted,reason);
        }
    }
}
