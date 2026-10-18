using System;
using System.Collections.Generic;
using System.Globalization;
using System.Net;
using System.Net.Sockets;
using System.Text;

namespace CoreClash.Networking
{
    // Invitations contain no game state, player identity, credentials, or gameplay commands.
    public sealed class LanRoom
    {
        public string Name {get;internal set;}
        public string Host {get;internal set;}
        public ushort Port {get;internal set;}
        public int PlayerCount {get;internal set;}
        internal double LastSeen;
    }
    public static class LanDiscoveryProtocol
    {
        public const string Identifier="CORECLASH_LAN";
        public const int Version=149,DiscoveryPort=47749,MaxNameLength=48,MaxPayloadBytes=512;
        static readonly UTF8Encoding Utf8=new UTF8Encoding(false,true);
        public static bool ValidName(string value)
        {
            if(string.IsNullOrWhiteSpace(value)||value.Length>MaxNameLength||value!=value.Trim())return false;
            foreach(char c in value)if(char.IsControl(c)||char.IsSurrogate(c))return false;
            return Utf8.GetByteCount(value)<=144;
        }
        public static byte[] Encode(string roomName,ushort gameplayPort,int playerCount)
        {
            if(!ValidName(roomName)||gameplayPort==0||playerCount<1||playerCount>2)throw new ArgumentException("Invalid LAN invitation.");
            return Utf8.GetBytes(Identifier+"\n"+Version+"\n"+Convert.ToBase64String(Utf8.GetBytes(roomName))+"\n"+gameplayPort.ToString(CultureInfo.InvariantCulture)+"\n"+playerCount);
        }
        public static bool TryDecode(byte[] payload,out LanRoom room)
        {
            room=null;if(payload==null||payload.Length==0||payload.Length>MaxPayloadBytes)return false;
            try {
                string[] parts=Utf8.GetString(payload).Split('\n');
                if(parts.Length!=5||parts[0]!=Identifier||parts[1]!="149"||!ushort.TryParse(parts[3],NumberStyles.None,CultureInfo.InvariantCulture,out var port)||port==0||!int.TryParse(parts[4],NumberStyles.None,CultureInfo.InvariantCulture,out var count)||count<1||count>2)return false;
                string name=Utf8.GetString(Convert.FromBase64String(parts[2]));if(!ValidName(name))return false;
                room=new LanRoom{Name=name,Port=port,PlayerCount=count};return true;
            } catch(FormatException){return false;}catch(DecoderFallbackException){return false;}
        }
    }
    public sealed class LanRoomDirectory
    {
        public const double TimeToLiveSeconds=4.5;
        const int MaxRooms=128;
        readonly Dictionary<string,LanRoom> rooms=new Dictionary<string,LanRoom>();
        public bool Observe(byte[] payload,string senderAddress,double now)
        {
            if(!IPAddress.TryParse(senderAddress,out var ip)||ip.AddressFamily!=AddressFamily.InterNetwork||!LanDiscoveryProtocol.TryDecode(payload,out var room))return false;
            string key=ip+":"+room.Port;Expire(now);if(!rooms.ContainsKey(key)&&rooms.Count>=MaxRooms)return false;
            room.Host=ip.ToString();room.LastSeen=now;rooms[key]=room;return true;
        }
        public List<LanRoom> Snapshot(double now){Expire(now);var result=new List<LanRoom>(rooms.Values);result.Sort((a,b)=>string.Compare(a.Name,b.Name,StringComparison.OrdinalIgnoreCase));return result;}
        void Expire(double now){var stale=new List<string>();foreach(var pair in rooms)if(now-pair.Value.LastSeen>TimeToLiveSeconds)stale.Add(pair.Key);foreach(string key in stale)rooms.Remove(key);}
    }
    public static class LanJoinAddress
    {
        public static string Create(string host,int webPort,ushort gamePort)=>"http://"+host+":"+webPort+"/?joinHost="+Uri.EscapeDataString(host)+"&joinPort="+gamePort;
        public static bool TryParse(string invitation,out string host,out ushort port)
        {
            host=null;port=0;if(string.IsNullOrEmpty(invitation)||invitation.Length>2048)return false;
            int question=invitation.IndexOf('?');if(question<0)return false;string query=invitation.Substring(question+1).Split('#')[0];string h=null,p=null;
            try {
                foreach(string part in query.Split('&')){var pair=part.Split(new[]{'='},2);if(pair.Length!=2)continue;string key=Uri.UnescapeDataString(pair[0]);if(key=="joinHost"){if(h!=null)return false;h=Uri.UnescapeDataString(pair[1]);}if(key=="joinPort"){if(p!=null)return false;p=Uri.UnescapeDataString(pair[1]);}}
                if(!IPAddress.TryParse(h,out var ip)||ip.AddressFamily!=AddressFamily.InterNetwork||IPAddress.Any.Equals(ip)||IPAddress.Broadcast.Equals(ip)||!ushort.TryParse(p,NumberStyles.None,CultureInfo.InvariantCulture,out port)||port==0)return false;
                host=ip.ToString();return true;
            } catch(UriFormatException){return false;}
        }
    }
}
