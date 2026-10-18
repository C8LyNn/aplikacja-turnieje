using System;
using System.Collections.Generic;
using System.Net;

namespace CoreClash.Networking
{
    public static class OnlineJoinAddress
    {
        public static bool TryParse(string input,out string code)
        {
            code="";
            if(string.IsNullOrWhiteSpace(input)||input.Length>2048)return false;
            string text=input.Trim();
            if(ValidCode(text)){code=text.ToUpperInvariant();return true;}
            if(!Uri.TryCreate(text,UriKind.Absolute,out var uri)||(uri.Scheme!="https"&&uri.Scheme!="http"))return false;
            bool found=false;
            try {
                foreach(string pair in uri.Query.TrimStart('?').Split('&')){
                    int split=pair.IndexOf('=');if(split<0)continue;
                    string key=Uri.UnescapeDataString(pair.Substring(0,split));
                    if(!key.Equals("joinCode",StringComparison.OrdinalIgnoreCase))continue;
                    if(found)return false;found=true;
                    string value=Uri.UnescapeDataString(pair.Substring(split+1));
                    if(!ValidCode(value))return false;code=value.ToUpperInvariant();
                }
            } catch(UriFormatException){return false;}
            return found;
        }
        public static string Create(string baseUrl,string code)
        {
            if(!ValidCode(code)||string.IsNullOrWhiteSpace(baseUrl)||baseUrl.Length>2048||!Uri.TryCreate(baseUrl,UriKind.Absolute,out var uri)||uri.Scheme!="https"||uri.IsLoopback||!string.IsNullOrEmpty(uri.UserInfo))return "";
            if(IPAddress.TryParse(uri.Host,out var ip)){
                var bytes=ip.GetAddressBytes();
                if(bytes.Length!=4||bytes[0]==0||bytes[0]==10||bytes[0]==127||bytes[0]>=224||(bytes[0]==172&&bytes[1]>=16&&bytes[1]<=31)||(bytes[0]==192&&bytes[1]==168)||(bytes[0]==169&&bytes[1]==254))return "";
            }
            var query=new List<string>();
            foreach(string pair in uri.Query.TrimStart('?').Split('&')){
                if(pair.Length==0)continue;
                int split=pair.IndexOf('=');string key=Uri.UnescapeDataString(split<0?pair:pair.Substring(0,split));
                if(key.Equals("joinCode",StringComparison.OrdinalIgnoreCase)||key.Equals("joinHost",StringComparison.OrdinalIgnoreCase)||key.Equals("joinPort",StringComparison.OrdinalIgnoreCase)||key.Equals("ccSmoke",StringComparison.OrdinalIgnoreCase))continue;
                query.Add(pair);
            }
            query.Add("joinCode="+code.ToUpperInvariant());
            return new UriBuilder(uri){Query=string.Join("&",query),Fragment=""}.Uri.AbsoluteUri;
        }
        static bool ValidCode(string code)
        {
            if(code==null||code.Length!=6)return false;
            foreach(char c in code)if(!((c>='A'&&c<='Z')||(c>='a'&&c<='z')||(c>='0'&&c<='9')))return false;
            return true;
        }
    }
    public sealed class OnlineOperationGate
    {
        int serial,active;
        bool canceled;
        public bool Busy=>active!=0;
        public bool TryBegin(out int ticket)
        {
            ticket=0;if(Busy)return false;
            if(++serial==0)++serial;
            active=ticket=serial;canceled=false;return true;
        }
        public bool IsCurrent(int ticket)=>ticket!=0&&ticket==active&&!canceled;
        // Cancellation invalidates callbacks immediately, but keeps the resource gate closed until cleanup ends.
        public void Cancel(){if(Busy)canceled=true;}
        public void Finish(int ticket){if(ticket!=0&&ticket==active){active=0;canceled=false;}}
    }
}
