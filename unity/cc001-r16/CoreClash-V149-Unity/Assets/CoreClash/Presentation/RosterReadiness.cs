using System;
using System.Collections.Generic;
using System.Linq;
using CoreClash.Data;
namespace CoreClash.Presentation
{
    public enum ReadinessLevel { Ready, Partial, DataOnly, Unknown }
    public enum RosterReadinessFilter { All, ReadyOnly, ReadyOrPartial }

    public struct ReadinessBadge
    {
        public ReadinessLevel Level;
        public string Code,Label,Explanation;
    }

    // CC-001 W19-01 (#289): player-facing readiness of each special ball, read
    // ONLY from the existing AbilitySupport registry. Presentation state: the
    // filter changes which roster tiles are visible, never a deck, the catalog,
    // stats, deck legality or the default roster (Q2 is a design hold).
    public static class RosterReadiness
    {
        public static ReadinessBadge Badge(Catalog catalog,string id)
        {
            if(catalog==null||catalog.Ball(id)==null)
                return new ReadinessBadge{Level=ReadinessLevel.Unknown,Code="UNKNOWN",Label="UNKNOWN",Explanation="This ball is not in the catalog."};
            switch(AbilitySupport.Status(id))
            {
                case "UNITY_READY":return new ReadinessBadge{Level=ReadinessLevel.Ready,Code="UNITY_READY",Label="READY",Explanation="Special power works in this demo."};
                case "PARTIAL":return new ReadinessBadge{Level=ReadinessLevel.Partial,Code="PARTIAL",Label="PARTIAL",Explanation="Special power works with known limits."};
                default:return new ReadinessBadge{Level=ReadinessLevel.DataOnly,Code="DATA_ONLY",Label="DATA ONLY",Explanation="Launches and collides; special power not in this demo yet."};
            }
        }

        public static bool Passes(Catalog catalog,string id,RosterReadinessFilter filter)
        {
            var level=Badge(catalog,id).Level;
            switch(filter)
            {
                case RosterReadinessFilter.ReadyOnly:return level==ReadinessLevel.Ready;
                case RosterReadinessFilter.ReadyOrPartial:return level==ReadinessLevel.Ready||level==ReadinessLevel.Partial;
                default:return true;
            }
        }

        // The builder roster exactly as before W19-01 (visible specials, name or
        // archetype search) with the optional readiness filter applied on top.
        public static BallDefinition[] Visible(Catalog catalog,string search,RosterReadinessFilter filter=RosterReadinessFilter.All)
        {
            search=search??"";
            return catalog.Data.balls.Where(b=>!b.hidden&&b.id!="normal"&&
                (b.name.IndexOf(search,StringComparison.OrdinalIgnoreCase)>=0||b.archetype.IndexOf(search,StringComparison.OrdinalIgnoreCase)>=0)&&
                Passes(catalog,b.id,filter)).ToArray();
        }

        // Result counts shown on the filter buttons, for the current search text.
        public static Dictionary<RosterReadinessFilter,int> Counts(Catalog catalog,string search)
        {
            var all=Visible(catalog,search);
            return new Dictionary<RosterReadinessFilter,int>{
                {RosterReadinessFilter.All,all.Length},
                {RosterReadinessFilter.ReadyOnly,all.Count(b=>Passes(catalog,b.id,RosterReadinessFilter.ReadyOnly))},
                {RosterReadinessFilter.ReadyOrPartial,all.Count(b=>Passes(catalog,b.id,RosterReadinessFilter.ReadyOrPartial))}};
        }

        public static string FilterLabel(RosterReadinessFilter filter,int count)=>
            (filter==RosterReadinessFilter.ReadyOnly?"READY":filter==RosterReadinessFilter.ReadyOrPartial?"READY + PARTIAL":"ALL")+"  "+count;
    }

    public struct RosterCardLayout { public UiBox Preview,Name,Stats,Badge,Info; }

    // Builder rectangles for the filter row and the roster tile (logical UI units,
    // card-relative). Pure so the managed tests can check fit and overlap.
    public static class RosterReadinessLayout
    {
        public static UiBox[] FilterButtons(float left,float y,float width,float height)
        {
            const float gap=8;
            float w=(width-gap*2)/3;
            return new[]{new UiBox(left,y,w,height),new UiBox(left+w+gap,y,w,height),new UiBox(left+2*(w+gap),y,w,height)};
        }
        // Text column = name, HP/size, readiness badge; the 44-unit info button
        // stays on the right exactly where it was before W19-01.
        public static RosterCardLayout Card(UiBox card,bool shortView)
        {
            float x=card.x,y=card.y,text=Math.Max(40,card.width-140);
            return new RosterCardLayout{
                Preview=new UiBox(x+12,y+(shortView?15:18),48,48),
                Name=new UiBox(x+72,y+(shortView?6:8),text,shortView?30:34),
                Stats=new UiBox(x+72,y+(shortView?38:44),text,shortView?16:18),
                Badge=new UiBox(x+72,y+(shortView?58:64),Math.Min(112,text),shortView?14:16),
                Info=new UiBox(x+card.width-54,y+(shortView?17:21),44,44)};
        }
    }
}
