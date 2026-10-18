using System.Linq;
public static partial class Program
{
    static void SpatialTests()
    {
        Test("Webber places four single-use root nodes",()=>{var s=Sim();var web=s.Spawn(0,"web",270,450);s.Abilities.OnStop(web);Eq(4,s.State.zones.Count(x=>!x.dead&&x.kind=="web"));var z=s.State.zones.First();var target=s.Spawn(1,"normal",z.x,z.y);s.Abilities.OnStep(1f/120);True(target.rooted);True(z.dead);});
        Test("Vinehook pulls nearest unanchored enemy",()=>{var s=Sim();var hook=s.Spawn(0,"vinehook",200,450);var enemy=s.Spawn(1,"normal",300,450);s.Abilities.OnStop(hook);Near(-300,enemy.vx);});
        Test("Harpoon selects the farthest enemy within long range",()=>{var s=Sim();var hook=s.Spawn(0,"harpoon",170,450);var near=s.Spawn(1,"normal",230,450);var far=s.Spawn(1,"normal",370,450);s.Abilities.OnStop(hook);Near(0,near.vx);True(far.vx<0);});
        Test("Vortex heals when a rooted enemy resists its pull",()=>{var s=Sim();var v=s.Spawn(0,"vortexmedic",200,450);v.hp-=5;var enemy=s.Spawn(1,"normal",300,450);s.Abilities.Root(enemy);s.Abilities.OnStop(v);Eq(v.maxHp,v.hp);Near(0,enemy.vx);});
        Test("Gatekeeper recast keeps one pair and death removes it",()=>{var s=Sim();var gate=s.Spawn(0,"gatekeeper",270,450);s.Abilities.OnStop(gate);Eq(2,s.State.zones.Count(z=>!z.dead&&z.kind=="portal"));s.Abilities.OnStop(gate);Eq(2,s.State.zones.Count(z=>!z.dead&&z.kind=="portal"));s.Kill(gate);Eq(0,s.State.zones.Count(z=>!z.dead&&z.kind=="portal"));});
        Test("Gatekeeper transit preserves most momentum with cooldown",()=>{var s=Sim();var gate=s.Spawn(0,"gatekeeper",270,450);s.Abilities.OnStop(gate);var z=s.State.zones.First(x=>x.kind=="portal");var ball=s.Spawn(1,"normal",z.x,z.y,100,0);s.Abilities.OnStep(1f/120);True(System.Math.Abs(ball.y-z.y)>100||System.Math.Abs(ball.x-z.x)>100);Near(92,ball.vx);True(ball.portalCooldown>0);});
        Test("Horizon Relay converts three enemy consumes to one base damage",()=>{var s=Sim();s.Spawn(0,"horizonrelay",100,450);for(int i=0;i<3;i++){var target=s.Spawn(1,"normal",300,450);s.Abilities.Consume(0,999,target);}Eq(19,s.State.players[1].hp);});
        Test("Singularity creates a growing bounded consumption field on death",()=>{var s=Sim();var core=s.Spawn(0,"singularity",270,450);s.Kill(core);var z=s.State.zones.Single(x=>x.kind=="blackHole");Near(34,z.radius);s.Abilities.OnTurnStart(1);Near(40.8f,z.radius);for(int i=0;i<10;i++){s.Spawn(1,"normal",z.x,z.y);s.Abilities.OnStep(1f/120);}True(z.dead);Eq(10,z.swallowed);Eq(0,s.State.graveyard.Count(g=>g.owner==1));});
    }
}
