using System;
using System.Linq;
using CoreClash.Core;

// CC-001 W24 (owner decisions): rules a player may set for one match - ball size, the double
// turn, a map with obstacles. Left unset, a match plays by the reference rules.
public static partial class Program
{
    static void W24MatchRulesTests()
    {
        Test("W24 rules: a match that sets none plays by the reference rules",()=>{
            var s=Sim();Eq(1f,s.State.ballScale);False(s.State.comebackRule);Eq("",s.State.mapId);Eq(0,s.State.structures.Count);
            var b=s.Spawn(0,"normal",270,450);Eq(catalog.Ball("normal").radius,b.radius);
            s.State.players[0].hp=9;s.Rules.ArmComeback();False(s.State.players[0].comebackArmed);False(s.State.players[0].comebackUsed);
        });
        Test("W24 rules: ball size multiplies the radius of every ball put on the board",()=>{
            var s=Sim();s.State.ballScale=2;
            var b=s.Spawn(0,"normal",270,450);Eq(catalog.Ball("normal").radius*2,b.radius);
            True(s.TryCommand(Shot(s,0,"fire"),out _));Eq(catalog.Ball("fire").radius*2,s.State.balls.Last().radius);
            Settle(s);True(s.State.balls.All(x=>x.y-x.radius>=16-.01f&&x.y+x.radius<=884+.01f),"a large ball must stay inside the walls");
        });
        Test("W24 rules: a base below 10 HP gives its owner two balls on the next turn, once",()=>{
            var s=Sim();s.State.comebackRule=true;
            // Opening: P1 shoots, P2 shoots twice (the opening bonus), back to P1.
            True(s.TryCommand(Shot(s),out _));Settle(s);True(s.TryCommand(Shot(s,1),out _));Settle(s);True(s.TryCommand(Shot(s,1),out _));Settle(s);
            Eq(0,s.State.turn);False(s.State.comebackActive);
            // P2's base falls below 10 during P1's turn: P2 plays twice on the turn that follows.
            s.State.players[1].hp=9;
            True(s.TryCommand(Shot(s),out _));Settle(s);
            Eq(1,s.State.turn);True(s.State.comebackActive);True(s.State.players[1].comebackUsed);False(s.State.players[1].comebackArmed);
            int turn=s.State.turnNumber;
            True(s.TryCommand(Shot(s,1),out _));Settle(s);
            Eq(1,s.State.turn);Eq(turn,s.State.turnNumber);True(s.State.bonusPending);False(s.State.comebackActive);
            True(s.TryCommand(Shot(s,1),out _));Settle(s);
            Eq(0,s.State.turn);Eq(turn+1,s.State.turnNumber);False(s.State.bonusPending);
            // Once a match: the next time round P2 plays one ball.
            True(s.TryCommand(Shot(s),out _));Settle(s);Eq(1,s.State.turn);False(s.State.comebackActive);
            True(s.TryCommand(Shot(s,1),out _));Settle(s);Eq(0,s.State.turn);
        });
        Test("W24 rules: a base that falls below 10 on its owner's own turn pays out on the turn after",()=>{
            var s=Sim();s.State.comebackRule=true;
            True(s.TryCommand(Shot(s),out _));Settle(s);True(s.TryCommand(Shot(s,1),out _));Settle(s);True(s.TryCommand(Shot(s,1),out _));Settle(s);
            Eq(0,s.State.turn);s.State.players[0].hp=8;
            True(s.TryCommand(Shot(s),out _));Settle(s);
            Eq(1,s.State.turn);True(s.State.players[0].comebackArmed);False(s.State.comebackActive);
            True(s.TryCommand(Shot(s,1),out _));Settle(s);
            Eq(0,s.State.turn);True(s.State.comebackActive);False(s.State.players[0].comebackArmed);
        });
        Test("W24 maps: terrain stays out of the centre and the bases, and every map is fair after a half turn",()=>{
            True(MatchMaps.All.Length>=5&&MatchMaps.All[0].Id=="open"&&MatchMaps.All[0].Obstacles.Length==0,"the first map is the open board");
            Eq(MatchMaps.All.Length,MatchMaps.All.Select(m=>m.Id).Distinct().Count());
            foreach(var map in MatchMaps.All)
            {
                var o=map.Obstacles;Eq(0,o.Length%3);
                for(int i=0;i<o.Length;i+=3)
                {
                    float x=o[i],y=o[i+1],r=o[i+2];
                    True(r>=16&&r<=60,map.Id+": obstacle size");
                    True(y-r>=MatchMaps.BaseZoneBottomOfTop&&y+r<=MatchMaps.BaseZoneTopOfBottom,map.Id+": terrain reaches into a base");
                    True(Math.Sqrt((x-MatchMaps.CentreX)*(x-MatchMaps.CentreX)+(y-MatchMaps.CentreY)*(y-MatchMaps.CentreY))-r>=MatchMaps.CentreRadius,map.Id+": terrain reaches into the centre");
                    bool twin=false;
                    for(int j=0;j<o.Length;j+=3)if(Math.Abs(o[j]-(540-x))<.01f&&Math.Abs(o[j+1]-(900-y))<.01f&&Math.Abs(o[j+2]-r)<.01f)twin=true;
                    True(twin,map.Id+": not the same after a half turn");
                }
                var s=Sim();MatchMaps.Apply(s,map);Eq(map.Id,s.State.mapId);Eq(o.Length/3,s.State.structures.Count);
            }
        });
        Test("W24 rules: a map obstacle cannot be damaged, does not use up the structure limit, and stops a ball",()=>{
            var s=Sim();var rock=s.Structures.AddObstacle(270,450,30);
            Eq(StructureSystem.Obstacle,rock.kind);Eq(-1,rock.owner);Eq(0,s.Structures.ActiveCount);
            var b=s.Spawn(0,"normal",270,600);
            False(s.Structures.Damage(rock,5,b));Eq(1,rock.hp);False(rock.dead);
            b.vy=-500;b.moving=true;s.State.phase=MatchPhase.Moving;
            for(int i=0;i<600;i++)s.Step(1f/120);
            float dx=b.x-rock.x,dy=b.y-rock.y;True(Math.Sqrt(dx*dx+dy*dy)>=b.radius+rock.radius-.5f,"the ball went into the obstacle");
            True(b.y>450,"the ball passed through the obstacle");False(rock.dead);
        });
    }
}
