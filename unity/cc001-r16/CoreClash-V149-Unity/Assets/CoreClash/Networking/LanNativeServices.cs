#if !UNITY_WEBGL
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text;
using System.Threading;

namespace CoreClash.Networking
{
    public sealed class LanDiscoveryClient : IDisposable
    {
        readonly UdpClient socket;
        readonly Thread worker;
        readonly LanRoomDirectory directory=new LanRoomDirectory();
        readonly object sync=new object();
        readonly Stopwatch clock=Stopwatch.StartNew();
        volatile bool running=true;
        public int Port {get;private set;}
        public List<LanRoom> Rooms {get {lock(sync)return directory.Snapshot(clock.Elapsed.TotalSeconds);}}
        public LanDiscoveryClient(int port=LanDiscoveryProtocol.DiscoveryPort)
        {
            socket=new UdpClient(AddressFamily.InterNetwork);
            try {
                socket.ExclusiveAddressUse=false;socket.Client.SetSocketOption(SocketOptionLevel.Socket,SocketOptionName.ReuseAddress,true);
                socket.Client.Bind(new IPEndPoint(IPAddress.Any,port));socket.Client.ReceiveTimeout=500;Port=((IPEndPoint)socket.Client.LocalEndPoint).Port;
                worker=new Thread(Receive){IsBackground=true,Name="Core Clash LAN discovery"};worker.Start();
            } catch {socket.Close();throw;}
        }
        void Receive()
        {
            while(running)try {var sender=new IPEndPoint(IPAddress.Any,0);byte[] payload=socket.Receive(ref sender);lock(sync)directory.Observe(payload,sender.Address.ToString(),clock.Elapsed.TotalSeconds);}
            catch(SocketException){if(!running)return;}catch(ObjectDisposedException){return;}
        }
        public void Dispose(){running=false;socket.Close();if(worker!=null&&worker.IsAlive)worker.Join(600);}
    }
    public sealed class LanDiscoveryPublisher : IDisposable
    {
        readonly UdpClient socket=new UdpClient(AddressFamily.InterNetwork);
        public LanDiscoveryPublisher(){socket.EnableBroadcast=true;}
        public void Broadcast(string name,ushort gameplayPort,int players)
        {
            byte[] payload=LanDiscoveryProtocol.Encode(name,gameplayPort,players);
            socket.Send(payload,payload.Length,new IPEndPoint(IPAddress.Broadcast,LanDiscoveryProtocol.DiscoveryPort));
        }
        public void Dispose(){socket.Close();}
    }
    public static class LanNativeAddress
    {
        public static bool IsPrivate(IPAddress ip)
        {
            if(ip==null||ip.AddressFamily!=AddressFamily.InterNetwork)return false;byte[] b=ip.GetAddressBytes();return b[0]==10||b[0]==172&&b[1]>=16&&b[1]<=31||b[0]==192&&b[1]==168;
        }
        public static string SelectPrivateIPv4()
        {
            string best=null;int bestScore=int.MinValue;
            foreach(var nic in NetworkInterface.GetAllNetworkInterfaces()){
                if(nic.OperationalStatus!=OperationalStatus.Up||nic.NetworkInterfaceType==NetworkInterfaceType.Loopback||nic.NetworkInterfaceType==NetworkInterfaceType.Tunnel)continue;
                var properties=nic.GetIPProperties();int score=nic.NetworkInterfaceType==NetworkInterfaceType.Wireless80211?100:80;
                foreach(var gateway in properties.GatewayAddresses)if(gateway.Address.AddressFamily==AddressFamily.InterNetwork&&!gateway.Address.Equals(IPAddress.Any)){score+=30;break;}
                string description=(nic.Name+" "+nic.Description).ToLowerInvariant();if(description.Contains("virtual")||description.Contains("vpn")||description.Contains("hyper-v")||description.Contains("wsl"))score-=80;
                foreach(var address in properties.UnicastAddresses)if(IsPrivate(address.Address)&&score>bestScore){best=address.Address.ToString();bestScore=score;}
            }
            return best;
        }
    }
    public static class LanStaticFiles
    {
        public const long MaxFileBytes=256L*1024*1024;
        public static bool TryResolve(string root,string requestTarget,out string path)
        {
            path=null;if(string.IsNullOrEmpty(root)||string.IsNullOrEmpty(requestTarget)||requestTarget.Length>2048||requestTarget[0]!='/'||requestTarget.StartsWith("//",StringComparison.Ordinal))return false;
            try {
                string relative=Uri.UnescapeDataString(requestTarget.Split('?')[0]);
                if(relative.IndexOfAny(new[]{'\\',':','\0','%','#'})>=0)return false;
                foreach(char c in relative)if(char.IsControl(c))return false;
                foreach(string segment in relative.Split('/'))if(segment==".."||segment==".")return false;
                string fullRoot=Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar,Path.AltDirectorySeparatorChar)+Path.DirectorySeparatorChar;
                if(Directory.Exists(root)&&(File.GetAttributes(root)&FileAttributes.ReparsePoint)!=0)return false;
                string result=Path.GetFullPath(Path.Combine(fullRoot,relative=="/"?"index.html":relative.TrimStart('/').Replace('/',Path.DirectorySeparatorChar)));
                if(!result.StartsWith(fullRoot,StringComparison.OrdinalIgnoreCase))return false;
                // Never follow junctions or symlinks outside the packaged WebRoot.
                string inspect=result;while(inspect!=null&&inspect.Length>=fullRoot.Length){if((File.Exists(inspect)||Directory.Exists(inspect))&&(File.GetAttributes(inspect)&FileAttributes.ReparsePoint)!=0)return false;inspect=Path.GetDirectoryName(inspect);}
                path=result;return true;
            } catch(ArgumentException){return false;}catch(UriFormatException){return false;}catch(NotSupportedException){return false;}catch(IOException){return false;}catch(UnauthorizedAccessException){return false;}
        }
        public static string ContentEncoding(string path)=>path.EndsWith(".br",StringComparison.OrdinalIgnoreCase)?"br":path.EndsWith(".gz",StringComparison.OrdinalIgnoreCase)?"gzip":null;
        public static string Mime(string path)
        {
            if(ContentEncoding(path)!=null)path=path.Substring(0,path.LastIndexOf('.'));
            switch(Path.GetExtension(path).ToLowerInvariant()){
                case ".html":return "text/html; charset=utf-8";case ".js":return "application/javascript";case ".wasm":return "application/wasm";case ".json":return "application/json";case ".css":return "text/css";
                case ".png":return "image/png";case ".jpg":case ".jpeg":return "image/jpeg";case ".svg":return "image/svg+xml";case ".ico":return "image/x-icon";case ".txt":return "text/plain; charset=utf-8";default:return "application/octet-stream";
            }
        }
    }
    // A small read-only static file server; no admin URL ACLs, upload, directory index, or game authority.
    public sealed class LanStaticHttpServer : IDisposable
    {
        readonly TcpListener listener;
        readonly Thread worker;
        readonly string root;
        volatile bool running=true;
        public int Port {get;private set;}
        public LanStaticHttpServer(string webRoot,int preferredPort=8080)
        {
            root=Path.GetFullPath(webRoot);if(!File.Exists(Path.Combine(root,"index.html")))throw new DirectoryNotFoundException("WebRoot/index.html is missing beside the Windows game.");
            listener=new TcpListener(IPAddress.Any,preferredPort);
            try {listener.Start(8);}catch(SocketException e){if(e.SocketErrorCode!=SocketError.AddressAlreadyInUse||preferredPort==0)throw;listener=new TcpListener(IPAddress.Any,0);listener.Start(8);}
            Port=((IPEndPoint)listener.LocalEndpoint).Port;worker=new Thread(Serve){IsBackground=true,Name="Core Clash WebRoot"};worker.Start();
        }
        void Serve()
        {
            while(running)try {using(var client=listener.AcceptTcpClient()){client.ReceiveTimeout=3000;client.SendTimeout=5000;Handle(client);}}
            catch(SocketException){if(!running)return;}catch(ObjectDisposedException){return;}catch(IOException){}catch(UnauthorizedAccessException){}
        }
        void Handle(TcpClient client)
        {
            using(var stream=client.GetStream()){
                var request=new StringBuilder();int next;while(request.Length<8192&&(next=stream.ReadByte())>=0){request.Append((char)next);if(request.Length>=4&&request.ToString(request.Length-4,4)=="\r\n\r\n")break;}
                string headers=request.ToString();if(!headers.EndsWith("\r\n\r\n",StringComparison.Ordinal)){Reply(stream,431,"Request Header Fields Too Large");return;}
                string[] line=headers.Split(new[]{"\r\n"},StringSplitOptions.None)[0].Split(' ');
                if(line.Length!=3||line[2]!="HTTP/1.1"&&line[2]!="HTTP/1.0"){Reply(stream,400,"Bad Request");return;}
                bool head=line[0]=="HEAD";if(line[0]!="GET"&&!head){Reply(stream,405,"Method Not Allowed");return;}
                if(!LanStaticFiles.TryResolve(root,line[1],out var path)){Reply(stream,400,"Bad Request");return;}
                if(!File.Exists(path)){Reply(stream,404,"Not Found");return;}
                using(var file=new FileStream(path,FileMode.Open,FileAccess.Read,FileShare.Read)){
                    if(file.Length>LanStaticFiles.MaxFileBytes){Reply(stream,413,"Content Too Large");return;}
                    string encoding=LanStaticFiles.ContentEncoding(path);
                    Write(stream,"HTTP/1.1 200 OK\r\nContent-Length: "+file.Length+"\r\nContent-Type: "+LanStaticFiles.Mime(path)+"\r\n"+(encoding==null?"":"Content-Encoding: "+encoding+"\r\n")+"Connection: close\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nCross-Origin-Opener-Policy: same-origin\r\nCross-Origin-Embedder-Policy: require-corp\r\n\r\n");
                    if(!head)file.CopyTo(stream,64*1024);
                }
            }
        }
        static void Reply(Stream stream,int code,string reason){Write(stream,"HTTP/1.1 "+code+" "+reason+"\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");}
        static void Write(Stream stream,string text){byte[] data=Encoding.ASCII.GetBytes(text);stream.Write(data,0,data.Length);}
        public void Dispose(){running=false;listener.Stop();if(worker!=null&&worker.IsAlive)worker.Join(200);}
    }
}
#endif
