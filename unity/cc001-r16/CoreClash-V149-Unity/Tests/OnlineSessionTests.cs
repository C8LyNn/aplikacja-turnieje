using CoreClash.Networking;

public static partial class Program
{
    static void OnlineSessionTests()
    {
        Test("Pinned MPS untyped full-room detail gives actionable guidance",()=>{
            Eq(OnlineServiceError.Full,OnlineServiceError.FromUntypedLobbyDetail("lobby is full"));
            Eq(OnlineServiceError.Full,OnlineServiceError.FromUntypedLobbyDetail("  Lobby is full  "));
            Eq("",OnlineServiceError.FromUntypedLobbyDetail("a lobby is full of surprises"));
            Eq("",OnlineServiceError.FromUntypedLobbyDetail(null));
        });
        Test("Invalid service code detail is translated without echoing service content",()=>{
            Eq(OnlineServiceError.InvalidCode,OnlineServiceError.FromUntypedLobbyDetail("lobby code '000000' contains an invalid character '0' (U+0030) at index 0"));
            Eq("",OnlineServiceError.FromUntypedLobbyDetail("transport full"));
            Eq("",OnlineServiceError.FromUntypedLobbyDetail("Some unrelated invalid character failure"));
        });
        Test("Internet invitation normalizes codes and reads only the explicit joinCode query",()=>{
            True(OnlineJoinAddress.TryParse(" ab12cd ",out var code));Eq("AB12CD",code);
            True(OnlineJoinAddress.TryParse("https://play.example/game/?joinCode=aB12cD",out code));Eq("AB12CD",code);
            False(OnlineJoinAddress.TryParse("https://play.example/AB12CD",out _));
            foreach(var bad in new[]{"", "ABC12", "AB12CD7", "AB 2CD", "AB12C\n", "ＡB12CD", "javascript:AB12CD", "https://play.example/?joinCode=AB12CD&joinCode=EF34GH", "https://play.example/?joinCode=AB12CD&join%43ode=EF34GH", "https://play.example/?joinCode=AB12CD%0A", "https://play.example/?joinCode=%ZZ1234"})
                False(OnlineJoinAddress.TryParse(bad,out _));
        });
        Test("Internet share URL preserves the hosted game path and removes old connection parameters",()=>{
            Eq("https://play.example/core/?quality=low&joinCode=AB12CD",OnlineJoinAddress.Create("https://play.example/core/?joinHost=192.168.1.2&joinPort=7777&quality=low&joinCode=OLD123#screen","ab12cd"));
            Eq("",OnlineJoinAddress.Create("","AB12CD"));
            Eq("",OnlineJoinAddress.Create("http://192.168.1.2:8080/","AB12CD"));
            Eq("",OnlineJoinAddress.Create("https://play.example/","invalid"));
        });
        Test("Canceled Internet creation cannot revive networking or unlock a later request",()=>{
            var gate=new OnlineOperationGate();True(gate.TryBegin(out int first));False(gate.TryBegin(out _));
            True(gate.IsCurrent(first));gate.Cancel();False(gate.IsCurrent(first));True(gate.Busy);
            False(gate.TryBegin(out _));gate.Finish(first);False(gate.Busy);
            True(gate.TryBegin(out int second));True(second!=first);True(gate.IsCurrent(second));
            gate.Finish(first);True(gate.Busy);True(gate.IsCurrent(second));
            gate.Cancel();gate.Cancel();False(gate.IsCurrent(second));gate.Finish(second);False(gate.Busy);
        });
    }
}
