using System;
using System.Linq;
namespace CoreClash.Core
{
    public sealed partial class AbilityResolver
    {
        void ArchetypeSpawn(BallRuntime b){if(Archetype(b,"beasts")&&Living().Count(x=>x.owner==b.owner&&Archetype(x,"beasts")&&Dist(x,b)<=165)>=3)foreach(var ally in Near(b,165,true).Where(x=>Archetype(x,"beasts")))ally.packFury=b.packFury=1;}
        void ArchetypeDeath(BallRuntime b)
        {
            if(Archetype(b,"beasts"))foreach(var ally in Near(b,230,true).Where(x=>Archetype(x,"beasts")))ally.packFury=1;
            foreach(var hunter in Living().Where(x=>x.huntTargetId==b.id)){hunter.huntTargetId=0;sim.Heal(hunter,5);}
        }
        void ArchetypeStop(BallRuntime b)
        {
            if(Archetype(b,"earth"))b.anchorStacks=Math.Min(3,b.anchorStacks+1);
            if(Archetype(b,"vegetation")&&b.growthStage>=2){CreateTrap(b,"web",b.x-(float)Math.Cos(b.angle)*55,b.y-(float)Math.Sin(b.angle)*55,14);b.growthStage=Math.Max(1,b.growthStage-1);}
        }
        void ArchetypeTurn(BallRuntime b)
        {
            if(!Archetype(b,"vegetation"))return;int old=b.growthStage;b.growthStage=Math.Min(3,b.growthStage+1);
            if(old<2&&b.growthStage==2){b.maxHp+=5;sim.Heal(b,5);}
            if(b.growthStage>=3){var ally=Near(b,100,true).OrderBy(x=>(float)x.hp/x.maxHp).FirstOrDefault();sim.Heal(ally??b,5);}
        }
        void ArchetypeContact(BallRuntime a,BallRuntime b,bool hit)
        {
            if(a.owner==b.owner)return;
            if(Archetype(a,"hunting")){if(a.huntTargetId==0)a.huntTargetId=b.id;else if(a.huntTargetId==b.id&&!a.hitUsed){a.hitUsed=true;sim.Damage(b,5,false,a.id);}}
            if(Archetype(a,"beasts")&&a.packFury>0&&!a.hitUsed){a.hitUsed=true;a.packFury=0;sim.Damage(b,5,false,a.id);}
        }
    }
}
