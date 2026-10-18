using System;
using System.Net;
using System.Net.Sockets;
namespace CoreClash.Networking
{
    public static class LanEndpoint
    {
        public static bool TryNormalize(string host,ushort port,out string address)
        {
            address=null;if(port==0||string.IsNullOrWhiteSpace(host)||host.Length>64)return false;
            host=host.Trim();if(host.Equals("localhost",StringComparison.OrdinalIgnoreCase))host="127.0.0.1";
            if(!IPAddress.TryParse(host,out var ip)||ip.AddressFamily!=AddressFamily.InterNetwork||ip.ToString()!=host)return false;
            byte first=ip.GetAddressBytes()[0];if(first==0||first>=224||IPAddress.Broadcast.Equals(ip))return false;
            address=ip.ToString();return true;
        }
    }
}
