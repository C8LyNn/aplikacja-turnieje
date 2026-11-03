using System;
using System.Collections.Generic;
using System.Linq;
using CoreClash.Core;
namespace CoreClash.Presentation
{
    public enum BaseDamageKind { BackWall, BallsInZone, CentreLead, TurnEndPressure, HorizonRelay, Unrecorded }

    public sealed class BaseDamageEntry
    {
        public int EventId,Turn,Base,Amount;
        public BaseDamageKind Kind;
        public string Detail="";   // ball type for a back-wall hit
    }

    public sealed class BaseDamageReport
    {
        public int Turn;
        public bool Incomplete;    // events were missing between observations
        public readonly List<BaseDamageEntry> Entries=new List<BaseDamageEntry>();
        public int Total(int baseOwner)=>Entries.Where(e=>e.Base==baseOwner).Sum(e=>e.Amount);
    }

    // CC-001 W18-03 (#288): turn report of WHY a base lost HP, built only from
    // authoritative events (the same stream on host and client). Read-only.
    //
    // MatchRules.DamageBase is called from exactly three places (guarded by a
    // managed test): BallPhysics.Wall (back wall, BASE_DAMAGE right after the
    // WALL_HIT/WALL_TOUCH event), MatchRules.ApplyTurnPressure (zone first,
    // then centre lead, at turn end) and the Horizon Relay (BASE_DAMAGE right
    // before HORIZON). The event text carries only "Pn base -k", so a single
    // turn-end event against the defender cannot be split into zone vs centre:
    // it is reported as TURN-END PRESSURE (ZONE OR CENTRE), never guessed.
    public sealed class BaseDamageTracker
    {
        int cursor=-1;bool gap;
        readonly List<BaseDamageEntry> pending=new List<BaseDamageEntry>();
        public BaseDamageReport Latest{get;private set;}
        // Shown from the end of a turn until the next launch, reset or new match.
        public bool Visible{get;private set;}

        public void Observe(GameState state)
        {
            if(state?.events==null)return;
            if(cursor<0||state.eventSerial<cursor){cursor=state.eventSerial;pending.Clear();Latest=null;Visible=false;gap=false;return;}
            var fresh=state.events.Where(e=>e!=null&&e.id>cursor).OrderBy(e=>e.id).ToList();
            if(fresh.Count>0&&fresh[0].id>cursor+1)gap=true;
            foreach(var e in fresh)
            {
                if(e.kind=="LAUNCH")Visible=false;
                else if(e.kind=="BASE_DAMAGE")pending.Add(Classify(state,e));
                else if(e.kind=="TURN"||e.kind=="MATCH_END")
                {
                    if(pending.Count>0||gap){Latest=Finish(pending,gap);Visible=Latest.Entries.Count>0||Latest.Incomplete;}
                    pending.Clear();gap=false;
                }
            }
            cursor=state.eventSerial;
        }

        public static bool TryParse(string text,out int baseOwner,out int amount)
        {
            baseOwner=-1;amount=0;
            if(string.IsNullOrEmpty(text)||text.Length<9||(text[0]!='P')||(text[1]!='1'&&text[1]!='2')||!text.Substring(2).StartsWith(" base -",StringComparison.Ordinal))return false;
            if(!int.TryParse(text.Substring(9),System.Globalization.NumberStyles.None,System.Globalization.CultureInfo.InvariantCulture,out amount)||amount<=0)return false;
            baseOwner=text[1]=='1'?0:1;return true;
        }

        static BaseDamageEntry Classify(GameState state,GameEvent e)
        {
            var entry=new BaseDamageEntry{EventId=e.id,Turn=e.turn,Kind=BaseDamageKind.Unrecorded};
            if(!TryParse(e.text,out entry.Base,out entry.Amount)){entry.Base=-1;return entry;}
            var prev=state.events.FirstOrDefault(x=>x!=null&&x.id==e.id-1);
            var next=state.events.FirstOrDefault(x=>x!=null&&x.id==e.id+1);
            if(prev!=null&&(prev.kind=="WALL_HIT"||prev.kind=="WALL_TOUCH")&&((prev.text=="top"&&entry.Base==1)||(prev.text=="bottom"&&entry.Base==0))
               &&entry.Amount==(prev.kind=="WALL_HIT"?2:1))
            {
                entry.Kind=BaseDamageKind.BackWall;
                entry.Detail=state.balls?.FirstOrDefault(b=>b!=null&&b.id==prev.ballId)?.type??"";
            }
            else if(next!=null&&next.kind=="HORIZON"&&entry.Amount==1)entry.Kind=BaseDamageKind.HorizonRelay;
            return entry;
        }

        // Turn-end pressure: ApplyTurnPressure(acting) emits zone (against the
        // defender) and then centre lead (against either side), consecutively.
        static BaseDamageReport Finish(List<BaseDamageEntry> entries,bool gap)
        {
            var report=new BaseDamageReport{Incomplete=gap,Turn=entries.Count>0?entries[0].Turn:0};
            var open=entries.Where(e=>e.Kind==BaseDamageKind.Unrecorded&&e.Base>=0).OrderBy(e=>e.EventId).ToList();
            int i=0;
            while(i<open.Count)
            {
                int j=i;while(j+1<open.Count&&open[j+1].EventId==open[j].EventId+1)j++;
                var group=open.GetRange(i,j-i+1);int acting=((group[0].Turn-1)%2+2)%2;
                if(group.Count==2&&group[0].Base==1-acting&&group[0].Turn==group[1].Turn){group[0].Kind=BaseDamageKind.BallsInZone;group[1].Kind=BaseDamageKind.CentreLead;}
                else if(group.Count==1&&group[0].Base==acting)group[0].Kind=BaseDamageKind.CentreLead;
                else if(group.Count==1)group[0].Kind=BaseDamageKind.TurnEndPressure;
                i=j+1;
            }
            report.Entries.AddRange(entries.Where(e=>e.Base>=0).OrderBy(e=>e.EventId));
            if(entries.Any(e=>e.Base<0))report.Incomplete=true;
            return report;
        }

        public static string KindLabel(BaseDamageKind kind)=>kind switch{
            BaseDamageKind.BackWall=>"BACK WALL",BaseDamageKind.BallsInZone=>"BALLS IN ZONE",BaseDamageKind.CentreLead=>"CENTRE LEAD",
            BaseDamageKind.TurnEndPressure=>"TURN-END PRESSURE (ZONE OR CENTRE)",BaseDamageKind.HorizonRelay=>"HORIZON RELAY",_=>"UNRECORDED SOURCE"};

        // Two short lines for one damaged base; empty when that base lost nothing.
        public static string[] Lines(BaseDamageReport report,int baseOwner,Func<string,string> ballName=null)
        {
            if(report==null)return Array.Empty<string>();
            int total=report.Total(baseOwner);
            if(total<=0)return report.Incomplete?new[]{"P"+(baseOwner+1)+" BASE · TURN "+report.Turn,"SOME EVENTS MISSING · NO SOURCE SHOWN"}:Array.Empty<string>();
            var parts=report.Entries.Where(e=>e.Base==baseOwner).GroupBy(e=>(e.Kind,e.Detail))
                .Select(g=>KindLabel(g.Key.Kind)+(g.Key.Kind==BaseDamageKind.BackWall&&g.Key.Detail.Length>0?" ("+(ballName?.Invoke(g.Key.Detail)??g.Key.Detail)+")":"")+" -"+g.Sum(e=>e.Amount));
            return new[]{"P"+(baseOwner+1)+" BASE -"+total+" · TURN "+report.Turn,string.Join(" · ",parts)+(report.Incomplete?" · SOME EVENTS MISSING":"")};
        }
    }
}
