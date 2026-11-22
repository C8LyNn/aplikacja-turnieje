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
        Test("W24 maps: terrain stays out of the bases, and out of the centre unless the map makes the centre larger; every map is fair after a half turn",()=>{
            True(MatchMaps.All.Length>=5&&MatchMaps.All[0].Id=="open"&&MatchMaps.All[0].Obstacles.Length==0,"the first map is the open board");
            Eq(MatchMaps.All.Length,MatchMaps.All.Select(m=>m.Id).Distinct().Count());
            Eq(CoreClash.Physics.ZoneResolver.CentreRadius,MatchMaps.CentreRadius);
            True(MatchMaps.All.Any(m=>m.CentreRadius>0),"no map shows the owner's exception (a changed centre)");
            foreach(var map in MatchMaps.All)
            {
                var o=map.Obstacles;Eq(0,o.Length%3);
                bool changesCentre=map.CentreRadius>0;double blocked=0;
                if(changesCentre)True(map.CentreRadius>MatchMaps.CentreRadius,map.Id+": a map that changes the centre has to make it larger");
                for(int i=0;i<o.Length;i+=3)
                {
                    float x=o[i],y=o[i+1],r=o[i+2];
                    True(r>=16&&r<=60,map.Id+": obstacle size");
                    True(y-r>=MatchMaps.BaseZoneBottomOfTop&&y+r<=MatchMaps.BaseZoneTopOfBottom,map.Id+": terrain reaches into a base");
                    double away=Math.Sqrt((x-MatchMaps.CentreX)*(x-MatchMaps.CentreX)+(y-MatchMaps.CentreY)*(y-MatchMaps.CentreY));
                    float centre=changesCentre?map.CentreRadius:MatchMaps.CentreRadius;
                    if(away-r<centre)
                    {
                        // Only a map that changes the centre may put a block in it: one that lies
                        // wholly inside the centre and is smaller than the reference centre.
                        True(changesCentre,map.Id+": terrain reaches into the centre");
                        True(away+r<=centre&&r<MatchMaps.CentreRadius,map.Id+": the block in the centre is too large");
                        blocked+=Math.PI*r*r;
                    }
                    bool twin=false;
                    for(int j=0;j<o.Length;j+=3)if(Math.Abs(o[j]-(540-x))<.01f&&Math.Abs(o[j+1]-(900-y))<.01f&&Math.Abs(o[j+2]-r)<.01f)twin=true;
                    True(twin,map.Id+": not the same after a half turn");
                }
                if(changesCentre)True(Math.PI*map.CentreRadius*map.CentreRadius-blocked>Math.PI*MatchMaps.CentreRadius*MatchMaps.CentreRadius,map.Id+": less room for holding the centre than the reference rules give");
                var s=Sim();MatchMaps.Apply(s,map);Eq(map.Id,s.State.mapId);Eq(o.Length/3,s.State.structures.Count);
                Eq(changesCentre?map.CentreRadius:MatchMaps.CentreRadius,s.State.centreRadius);
            }
        });
        Test("W24 maps: a larger centre is the centre the rules count",()=>{
            var s=Sim();Eq(112f,s.State.centreRadius);
            // Two balls of Player 1, 140 units from the middle: outside the reference centre, inside a centre of 150.
            var a=s.Spawn(0,"normal",270-140,450);var b=s.Spawn(0,"normal",270+140,450);
            False(CoreClash.Physics.ZoneResolver.TouchesCenter(a));True(CoreClash.Physics.ZoneResolver.TouchesCenter(a,150));
            s.Rules.ApplyTurnPressure(0);Eq(20,s.State.players[1].hp);
            s.State.centreRadius=150;
            s.Rules.ApplyTurnPressure(0);Eq(19,s.State.players[1].hp);
        });
        Test("W24 maps: the stop estimate bounces off a map obstacle as the rules do",()=>{
            // The same shot, straight up the middle, on the open board and with a post in its way.
            var open=Sim();var blocked=Sim();blocked.Structures.AddObstacle(270,450,40);
            var (dx,dy)=W18Drag(0,0,175);CoreClash.Presentation.StopPredictor.GesturePower(dx,dy,out float power);
            var body=CoreClash.Presentation.StopPredictor.Spawn(catalog.Ball("normal"),0,dx,dy,power);
            var free=CoreClash.Presentation.StopPredictor.Predict(body,CoreClash.Presentation.StopPredictor.Obstacles(open.State,-1));
            var hit=CoreClash.Presentation.StopPredictor.Predict(body,CoreClash.Presentation.StopPredictor.Obstacles(blocked.State,-1));
            True(free.Valid&&hit.Valid);True(free.StopY<450-40,"this shot has to pass the middle on the open board");
            False(hit.Obstructed);True(hit.StopY>450+40-1,"the estimate went through the post");
            // And the rules agree: the real ball ends where the estimate says.
            True(blocked.TryCommand(new PlayerCommand{owner=0,turnNumber=1,kind=CommandKind.Spawn,ballType="normal",dx=dx,dy=dy,power=power},out _));Settle(blocked);
            var ball=blocked.State.balls[0];
            True(Math.Abs(ball.x-hit.StopX)<2&&Math.Abs(ball.y-hit.StopY)<2,"estimate "+hit.StopX+","+hit.StopY+" but the ball stopped at "+ball.x+","+ball.y);
        });
        Test("W24 balls: every ball has a label short enough for a tray card, in both languages",()=>{
            int count=0;
            foreach(string id in CoreClash.Presentation.BallGuide.Ids)
            {
                var g=CoreClash.Presentation.BallGuide.For(id);count++;
                foreach(bool polish in new[]{false,true})
                {
                    CoreClash.Presentation.Lang.Polish=polish;
                    True(g.Short.Length>0&&g.Short.Length<=CoreClash.Presentation.BallGuide.MaxShort,id+": tray label "+g.Short+" is longer than "+CoreClash.Presentation.BallGuide.MaxShort);
                }
            }
            CoreClash.Presentation.Lang.Polish=false;True(count>=31);
        });
        Test("W24 balls: the 30 special balls stand in six groups of five, each ball in one group",()=>{
            var groups=CoreClash.Presentation.BallGroups.All;
            Eq("ice,fire,poison,magnet,electric,plant",string.Join(",",groups.Select(g=>g.Id)));
            var seen=new System.Collections.Generic.HashSet<string>();
            foreach(var group in groups)
            {
                Eq(5,group.Balls.Length);
                True(group.NameEn.Length>0&&group.NamePl.Length>0&&group.PlanEn.Length>0&&group.PlanPl.Length>0,group.Id+": name and plan in both languages");
                foreach(string id in group.Balls)
                {
                    True(catalog.Ball(id)!=null&&CoreClash.Presentation.BallGuide.For(id)!=null,group.Id+": unknown ball "+id);
                    True(seen.Add(id),id+" stands in two groups");
                    Eq(group,CoreClash.Presentation.BallGroups.Of(id));
                }
            }
            Eq(30,seen.Count);False(seen.Contains("normal"));
            foreach(string id in CoreClash.Presentation.BallGuide.Ids)True(id=="normal"||seen.Contains(id),id+" has a guide but no group");
            True(CoreClash.Presentation.BallGroups.Order("ice")<CoreClash.Presentation.BallGroups.Order("fire"));
            True(CoreClash.Presentation.BallGroups.Order("fire")<CoreClash.Presentation.BallGroups.Order("furnace"));
            Eq(int.MaxValue,CoreClash.Presentation.BallGroups.Order("normal"));
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
