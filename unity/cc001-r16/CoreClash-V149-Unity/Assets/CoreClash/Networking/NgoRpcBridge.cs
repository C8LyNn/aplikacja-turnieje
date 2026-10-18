using Unity.Netcode;

namespace CoreClash.Networking
{
    // The NetworkObject is authored in the scene by ConfigureScene; no player prefab is needed.
    public sealed class NgoRpcBridge : NetworkBehaviour
    {
        NgoGameSession session;
        public override void OnNetworkSpawn(){session=GetComponent<NgoGameSession>();session.BridgeSpawned(this);if(!IsServer)ReadyRpc();}
        [Rpc(SendTo.Server,InvokePermission=RpcInvokePermission.Everyone)]
        public void IntentRpc(string commandJson,RpcParams context=default){if(IsServer)session.ReceiveIntent(context.Receive.SenderClientId,commandJson);}
        [Rpc(SendTo.Server,InvokePermission=RpcInvokePermission.Everyone)]
        void ReadyRpc(RpcParams context=default){if(IsServer)session.PeerReady(context.Receive.SenderClientId);}
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
