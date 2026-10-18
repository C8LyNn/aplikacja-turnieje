using System.Collections.Generic;
namespace CoreClash.Data
{
    public static class AbilitySupport
    {
        static readonly HashSet<string> ready=new HashSet<string>{"normal","agony","requiem","bonfire","wildfire","soulburst","reclaimer","gravehide","packheart","cascade","blightpool","plagueleech","vector","septiccore","consecrator","absolver","penitent","ward","halo","web","briarheart","vinehook","gravitymine","singularity","horizonrelay","gatekeeper","harpoon","vortexmedic","timeshift","chronomancer","paradox","traitor"};
        static readonly HashSet<string> partial=new HashSet<string>{"mimic","doppelganger","wildcard","collector","echo","assimilator","genesis","fire","ice","plague","shield","medic","cleanser","anchor","phase","warp","rimeburst","kindler","pyrecore","blizzardcore","magnet","pulse","resurrector","brood","necromancer","bomb","deathpulse","frostgrave","martyr","plagueburst","eggsac","banish"};
        // R16: five newly tested powers; candidate R10–R13 families have managed
        // coverage and builds, but broader native interaction acceptance is pending.
        static readonly HashSet<string> statusPayoffReady=new HashSet<string>{"embertrap","frosttrap","sporetrap","venom","shatterer"};
        static readonly HashSet<string> verifiedCandidates=new HashSet<string>{"wallmaker","barricade","repairpulse","engineer","bastion","commander","quartermaster","armorer","splitter","hatchery","replicator","mitosis","swarmcore","conscriptor","firebrand","chainfrost","ashcore","furnace","frostguard"};
        public static string Status(string type)=>type=="pinballer"||type=="slingshot"||type=="mine"||type=="timebomb"||type=="bomb"||statusPayoffReady.Contains(type)||ready.Contains(type)?"UNITY_READY":type=="ram"||partial.Contains(type)||verifiedCandidates.Contains(type)?"PARTIAL":"DATA_ONLY";
        public static string Label(string type)=>Status(type).Replace('_',' ');
    }
}
