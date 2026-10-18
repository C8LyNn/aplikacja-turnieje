using CoreClash.Networking;
using System.Net;
using System.Net.Sockets;
using System.Text;

public static partial class Program
{
    static void LanDiscoveryTests()
    {
        Test("LAN advertisement has only five bounded invitation fields",()=>{
            var payload=LanDiscoveryProtocol.Encode("My Core Clash Game",7777,1);
            True(LanDiscoveryProtocol.TryDecode(payload,out var room));Eq("My Core Clash Game",room.Name);Eq((ushort)7777,room.Port);Eq(1,room.PlayerCount);
            Eq(5,Encoding.UTF8.GetString(payload).Split('\n').Length);
            False(LanDiscoveryProtocol.TryDecode(Encoding.UTF8.GetBytes("OTHER\n149\nR2FtZQ==\n7777\n1"),out _));
            False(LanDiscoveryProtocol.TryDecode(Encoding.UTF8.GetBytes(LanDiscoveryProtocol.Identifier+"\n148\nR2FtZQ==\n7777\n1"),out _));
            foreach(var port in new[]{"0","65536","-1","7777x"})False(LanDiscoveryProtocol.TryDecode(Encoding.UTF8.GetBytes(LanDiscoveryProtocol.Identifier+"\n149\nR2FtZQ==\n"+port+"\n1"),out _));
            False(LanDiscoveryProtocol.TryDecode(Encoding.UTF8.GetBytes(LanDiscoveryProtocol.Identifier+"\n149\n"+Convert.ToBase64String(Encoding.UTF8.GetBytes(new string('a',49)))+"\n7777\n1"),out _));
            False(LanDiscoveryProtocol.TryDecode(Encoding.UTF8.GetBytes(LanDiscoveryProtocol.Identifier+"\n149\n"+Convert.ToBase64String(Encoding.UTF8.GetBytes("bad\nname"))+"\n7777\n1"),out _));
            False(LanDiscoveryProtocol.TryDecode(new byte[513],out _));
            False(LanDiscoveryProtocol.TryDecode(new byte[]{255,255,255},out _));
            False(LanDiscoveryProtocol.TryDecode(Encoding.UTF8.GetBytes(LanDiscoveryProtocol.Identifier+"\n149\nR2FtZQ==\n7777\n3"),out _));
        });
        Test("LAN rooms use actual sender address and expire",()=>{
            var rooms=new LanRoomDirectory();var payload=LanDiscoveryProtocol.Encode("LAN game",7777,1);
            True(rooms.Observe(payload,"192.168.1.42",10));Eq("192.168.1.42",rooms.Snapshot(12)[0].Host);Eq(1,rooms.Snapshot(12).Count);
            Eq(0,rooms.Snapshot(10+LanRoomDirectory.TimeToLiveSeconds+.01).Count);
        });
        Test("invitation query validates address and gameplay port",()=>{
            var url=LanJoinAddress.Create("192.168.1.5",8080,7777);
            True(LanJoinAddress.TryParse(url,out var host,out var port));Eq("192.168.1.5",host);Eq((ushort)7777,port);
            True(LanJoinAddress.TryParse("http://127.0.0.1:8080/?ccSmoke=1&joinHost=127.0.0.1&joinPort=7777",out _,out _));
            False(LanJoinAddress.TryParse("http://x/?joinHost=192.168.1.5&joinPort=0",out _,out _));
            False(LanJoinAddress.TryParse("http://x/?joinHost=bad%0Dhost&joinPort=7777",out _,out _));
            False(LanJoinAddress.TryParse("http://x/?joinHost=192.168.1.5&joinHost=192.168.1.6&joinPort=7777",out _,out _));
        });
        Test("WebRoot paths reject traversal and preserve Unity MIME types",()=>{
            string root=Path.Combine(Path.GetTempPath(),"cc-lan-test-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(root);
            try {
                True(LanStaticFiles.TryResolve(root,"/?joinHost=192.168.1.2",out var index));Eq(Path.Combine(root,"index.html"),index);
                foreach(string path in new[]{"/../secret","/%2e%2e/secret","/%252e%252e/secret","/a\\..\\secret","//server/share","/C:/secret","/%00bad"})False(LanStaticFiles.TryResolve(root,path,out _));
                Eq("application/wasm",LanStaticFiles.Mime("game.wasm.br"));Eq("application/javascript",LanStaticFiles.Mime("game.framework.js.gz"));Eq("br",LanStaticFiles.ContentEncoding("game.wasm.br"));
            } finally {Directory.Delete(root,true);}
        });
        Test("real loopback UDP advertisement reaches native room listener",()=>{
            using(var discovery=new LanDiscoveryClient(0))using(var sender=new UdpClient()){
                var bytes=LanDiscoveryProtocol.Encode("UDP loopback",7777,1);sender.Send(bytes,bytes.Length,new IPEndPoint(IPAddress.Loopback,discovery.Port));
                var deadline=DateTime.UtcNow.AddSeconds(2);while(discovery.Rooms.Count==0&&DateTime.UtcNow<deadline)Thread.Sleep(10);
                Eq(1,discovery.Rooms.Count);Eq("127.0.0.1",discovery.Rooms[0].Host);
            }
        });
        Test("real TcpListener serves only bounded read-only WebRoot files",()=>{
            string root=Path.Combine(Path.GetTempPath(),"cc-http-test-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(root);File.WriteAllText(Path.Combine(root,"index.html"),"LAN server works");File.WriteAllText(Path.Combine(root,"game.wasm"),"wasm");
            try {
                using(var server=new LanStaticHttpServer(root,0)){
                    string Request(string line){using(var client=new TcpClient("127.0.0.1",server.Port)){client.ReceiveTimeout=4000;var stream=client.GetStream();var request=Encoding.ASCII.GetBytes(line+"\r\nHost: localhost\r\n\r\n");stream.Write(request,0,request.Length);using(var reader=new StreamReader(stream))return reader.ReadToEnd();}}
                    True(Request("GET / HTTP/1.1").EndsWith("LAN server works"));True(Request("GET /game.wasm HTTP/1.1").Contains("Content-Type: application/wasm"));
                    True(Request("HEAD / HTTP/1.1").EndsWith("\r\n\r\n"));
                    True(Request("GET /%2e%2e/secret HTTP/1.1").StartsWith("HTTP/1.1 400"));True(Request("POST / HTTP/1.1").StartsWith("HTTP/1.1 405"));
                }
            } finally {Directory.Delete(root,true);}
        });
    }
}
