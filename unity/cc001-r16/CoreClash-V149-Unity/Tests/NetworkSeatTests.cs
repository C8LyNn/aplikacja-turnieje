using CoreClash.Core;
using CoreClash.Networking;

public static partial class Program
{
    static void NetworkSeatTests()
    {
        Test("LAN approval reserves the sole remote seat before connection completes",()=>{
            var seat=new LanSeat();False(seat.TryReserve(0,0));True(seat.TryReserve(11,0));
            False(seat.TryReserve(12,1));False(seat.Commit(12,1));True(seat.Commit(11,1));
            True(seat.Owns(11));False(seat.TryReserve(12,2));
        });
        Test("LAN disconnect frees P2 while late old callbacks cannot release the replacement",()=>{
            var seat=new LanSeat();True(seat.TryReserve(11,0));True(seat.Commit(11,1));True(seat.Release(11));
            True(seat.TryReserve(12,2));True(seat.Commit(12,3));False(seat.Owns(11));
            False(seat.Release(11));True(seat.Owns(12));
        });
        Test("aborted LAN joins release their reservation without granting authority",()=>{
            var seat=new LanSeat();True(seat.TryReserve(11,0));False(seat.Owns(11));
            True(seat.Release(11));True(seat.TryReserve(12,1));False(seat.Commit(11,2));True(seat.Commit(12,2));
        });
        Test("LAN reservation timeout rejects late completion but does not expire connected P2",()=>{
            var seat=new LanSeat();True(seat.TryReserve(11,0));Eq<ulong?>(11,seat.Expire(11));False(seat.Commit(11,12));
            True(seat.TryReserve(12,12));True(seat.Commit(12,13));Eq<ulong?>(null,seat.Expire(1000));True(seat.Owns(12));
            False(seat.TryReserve(13,double.NaN));
        });
        Test("LAN endpoints accept canonical unicast IPv4 and reject malformed connection input",()=>{
            True(LanEndpoint.TryNormalize("192.168.1.42",7777,out var address));Eq("192.168.1.42",address);
            True(LanEndpoint.TryNormalize("localhost",7777,out address));Eq("127.0.0.1",address);
            foreach(var bad in new[]{"", "0.0.0.0", "255.255.255.255", "239.1.2.3", "127.1", "http://192.168.1.2", "192.168.1.2:7777", "192.168.1.2\n127.0.0.1"})False(LanEndpoint.TryNormalize(bad,7777,out _));
            False(LanEndpoint.TryNormalize("192.168.1.42",0,out _));
        });
        Test("replacement P2 starts sequence one against the same match and still rejects duplicate and spoof",()=>{
            var sim=Sim();var authority=new NetworkGameSession(sim);var first=Shot(sim);first.sequence=1;
            True(authority.Submit(0,first,out _));Settle(sim);
            var oldP2=Shot(sim,1);oldP2.sequence=1;True(authority.Submit(1,oldP2,out _));Settle(sim);
            Eq(1,sim.State.turn);Eq(2,sim.State.actionSerial);False(authority.Submit(1,oldP2,out _));
            authority.ForgetConnection(1);var replacement=Shot(sim,1);replacement.sequence=1;
            var spoof=Shot(sim,0);spoof.sequence=999;False(authority.Submit(1,spoof,out _));
            True(authority.Submit(1,replacement,out _));Eq(3,sim.State.actionSerial);False(authority.Submit(1,replacement,out _));
            Eq(3,sim.State.balls.Count);
        });
    }
}
