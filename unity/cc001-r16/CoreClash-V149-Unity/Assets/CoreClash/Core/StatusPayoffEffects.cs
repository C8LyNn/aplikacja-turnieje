using System.Linq;

namespace CoreClash.Core
{
    public sealed partial class AbilityResolver
    {
        // V148 persistent one-charge elemental traps. No additional damage or
        // root is implied: they feed the existing shared status machine.
        static bool ElementTrap(string kind)=>kind=="embertrap"||kind=="frosttrap"||kind=="sporetrap";
        void StatusPayoffStop(BallRuntime source)
        {
            if(!ElementTrap(source.type))return;
            var trap=CreateTrap(source,source.type,source.x,source.y,14,105);
            if(trap==null)sim.Emit("PLACEMENT_BLOCKED",source,"No room for elemental trap");
        }
        void TriggerElementTrap(ZoneRuntime trap)
        {
            var target=Living().FirstOrDefault(b=>b.owner!=trap.owner&&!b.phased&&
                (b.x-trap.x)*(b.x-trap.x)+(b.y-trap.y)*(b.y-trap.y)<(trap.radius+b.radius)*(trap.radius+b.radius));
            if(target==null)return;
            // Spend first: status cascades may kill targets or create new units.
            trap.dead=true;
            if(trap.kind=="embertrap")ApplyFire(target,trap.owner);
            else if(trap.kind=="frosttrap")ApplyIce(target,trap.owner);
            else ApplyToxin(target,trap.owner);
            sim.Emit("TRAP_TRIGGER",target,trap.kind+" spent",trap.sourceId);
        }
        void StatusPayoffContact(BallRuntime source,BallRuntime target)
        {
            if(source.dead||target.dead||source.owner==target.owner)return;
            if(source.type=="venom")
            {
                if(target.toxinTurns>0)
                {
                    sim.Damage(target,5,false,source.id);sim.Heal(source,5);
                    sim.Emit("VENOM",source,"Toxin payoff +5 HP",target.id);
                }
                else if(target.type!="plague")ApplyToxin(target,source.owner);
            }
            else if(source.type=="shatterer"&&(target.frozen>0||target.iceStacks>=2))
            {
                sim.Damage(target,5,false,source.id);ClearIce(target);
                sim.Emit("SHATTER",target,"Ice consumed: +5 damage",source.id);
            }
        }
    }
}
