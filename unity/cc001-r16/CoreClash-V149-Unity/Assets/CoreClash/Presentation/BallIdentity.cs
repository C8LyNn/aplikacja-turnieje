using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using CoreClash.Data;

namespace CoreClash.Presentation
{
    public sealed class BallIdentity
    {
        readonly Dictionary<string,string> marks=new Dictionary<string,string>(StringComparer.Ordinal);
        public BallIdentity(IEnumerable<BallDefinition> balls)
        {
            if(balls==null)throw new ArgumentNullException(nameof(balls));
            // These are mnemonic labels, not mechanic categories or validated icon artwork.
            foreach(var group in balls.GroupBy(Stem,StringComparer.Ordinal)){
                var ordered=group.OrderBy(b=>b.id,StringComparer.Ordinal).ToArray();
                if(ordered.Length>36*36)throw new ArgumentException("Too many balls share one identity stem.");
                for(int i=0;i<ordered.Length;i++)marks.Add(ordered[i].id,group.Key+(ordered.Length==1?"":Base36(i)));
            }
        }
        public string Mark(string id)=>id!=null&&marks.TryGetValue(id,out var mark)?mark:"?";

        static string Stem(BallDefinition ball)
        {
            string text=Ascii(ball.name);if(text.Length<2)text=Ascii(ball.id);
            return text.PadRight(2,'X').Substring(0,2);
        }
        static string Ascii(string value)
        {
            var text=new StringBuilder();
            foreach(char ch in value??""){char c=char.ToUpperInvariant(ch);if(c>='A'&&c<='Z'||c>='0'&&c<='9')text.Append(c);}
            return text.ToString();
        }
        static string Base36(int value)
        {
            const string digits="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            return value<36?digits[value].ToString():digits[value/36].ToString()+digits[value%36];
        }
    }
}
