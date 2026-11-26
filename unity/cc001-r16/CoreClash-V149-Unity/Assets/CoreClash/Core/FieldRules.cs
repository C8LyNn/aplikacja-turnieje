using System;
using System.Linq;

namespace CoreClash.Core
{
    // CC-001 W24 (owner rule, 2026-11-22, with a sketch): "area effects are not to stack and not to
    // overlap. The same fields are to join; different area effects are to work so that a new one
    // cannot appear in the place where the old one was."
    //
    // One place on the board holds one field: the oldest one that covers it.
    //   - Two fields of one element lying on each other are one field with one shape. A ball standing
    //     in both gets that element once at the end of a turn, not once for each.
    //   - A newer field of another element exists only outside the older one. A ball standing where
    //     they overlap is in the older field alone. When the older field is gone, the place is the
    //     newer one's.
    // It is a match rule (GameState.exclusiveFields): off in the reference rules, set by the game.
    public sealed partial class AbilityResolver
    {
        // What a field is made of; null for a zone that is not a field (a trap, a portal...).
        public static string FieldElement(ZoneRuntime zone)
        {
            if(zone==null||zone.dead)return null;
            switch(zone.kind)
            {
                case "fire":case "furnaceFire":return "fire";
                case "ice":return "ice";
                case "blight":return "toxin";
                case "consecrated":return "holy";
                case "gravitymine":return "magnet";
                default:return null;
            }
        }
        // The field that holds this place: the oldest one that covers it (zone ids only grow, so the
        // lowest id was laid first). Null where there is no field.
        public static ZoneRuntime FieldAt(GameState state,float x,float y)
        {
            ZoneRuntime oldest=null;
            foreach(var zone in state.zones)
            {
                if(FieldElement(zone)==null)continue;
                float dx=x-zone.x,dy=y-zone.y;
                if(dx*dx+dy*dy>zone.radius*zone.radius)continue;
                if(oldest==null||zone.id<oldest.id)oldest=zone;
            }
            return oldest;
        }
        // Does this field act on a ball standing there? Always in the reference rules. Under the
        // rule: yes when the ball's place is held by a field of the same element (this one or one
        // joined with it), or by no field at all (a ball that only touches the field's edge).
        bool FieldReaches(ZoneRuntime zone,BallRuntime ball)
        {
            if(!S.exclusiveFields)return true;
            var here=FieldAt(S,ball.x,ball.y);
            return here==null||FieldElement(here)==FieldElement(zone);
        }
        // A field whose one source works alone (a magnet mine): the place must be held by this very field.
        bool FieldHolds(ZoneRuntime zone,BallRuntime ball)=>!S.exclusiveFields||FieldAt(S,ball.x,ball.y)==zone;
    }
}
