using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Presentation;

// CC-001 W18-01 (#286): estimated free-roll STOP vs the REAL authoritative
// GameSimulation.Step(1/120) on an empty arena.
public static partial class Program
{
    struct W18Real{public float X,Y;public int Frames,EnemyBaseLoss;public bool Guard;}
    struct W18Case{public int Owner;public string Type;public float Angle,Length;public string Name=>$"P{Owner+1} {Type} {Angle:0}deg drag {Length:0}";}

    static GameSimulation W18Sim()
    {
        var d=new DeckDefinition{id="w18_stop_fixture",balls=new[]{"dart","bounce","titan","warp","fire","ice","plague","medic","shield"}};
        return new GameSimulation(catalog,d,d);
    }
    // Drag vector of `length` at `angle` degrees from the owner's forward direction.
    static (float dx,float dy) W18Drag(int owner,float angle,float length)
    {
        double a=angle*Math.PI/180;
        return ((float)(Math.Sin(a)*length),(float)(Math.Cos(a)*length*(owner==0?-1:1)));
    }
    static W18Real W18RunUntilStop(GameSimulation s,BallRuntime b,int owner)
    {
        int before=b.stopCount,frames=0,enemyHp=s.State.players[1-owner].hp;
        while(b.stopCount==before&&frames<5000){s.Step(1f/120);frames++;if(s.State.phase!=MatchPhase.Moving&&b.stopCount==before)break;}
        return new W18Real{X=b.x,Y=b.y,Frames=frames,EnemyBaseLoss=enemyHp-s.State.players[1-owner].hp,Guard=s.State.events.Any(e=>e.kind=="MOTION_GUARD")};
    }
    static W18Real W18RealSpawn(W18Case c)
    {
        var s=W18Sim();if(c.Owner==1)s.State.turn=1;
        var (dx,dy)=W18Drag(c.Owner,c.Angle,c.Length);True(StopPredictor.GesturePower(dx,dy,out float power),"drag too short");
        True(s.TryCommand(new PlayerCommand{owner=c.Owner,turnNumber=s.State.turnNumber,kind=CommandKind.Spawn,ballType=c.Type,dx=dx,dy=dy,power=power},out string why),c.Name+": "+why);
        return W18RunUntilStop(s,s.State.balls[s.State.balls.Count-1],c.Owner);
    }
    static StopEstimate W18PredictSpawn(W18Case c)
    {
        var (dx,dy)=W18Drag(c.Owner,c.Angle,c.Length);StopPredictor.GesturePower(dx,dy,out float power);
        return StopPredictor.Predict(StopPredictor.Spawn(catalog.Ball(c.Type),c.Owner,dx,dy,power));
    }
    static List<W18Case> W18Cases()
    {
        var list=new List<W18Case>();
        foreach(int owner in new[]{0,1})foreach(float angle in new[]{-75f,-40f,-10f,0f,20f,50f,80f})foreach(float length in new[]{25f,70f,120f,175f})
            list.Add(new W18Case{Owner=owner,Type="normal",Angle=angle,Length=length});
        foreach(var type in new[]{"dart","bounce","titan","warp"})
        {
            list.Add(new W18Case{Owner=0,Type=type,Angle=60,Length=175});
            list.Add(new W18Case{Owner=1,Type=type,Angle=-70,Length=150});
            list.Add(new W18Case{Owner=0,Type=type,Angle=0,Length=175});
        }
        return list;
    }
    static float W18Err(StopEstimate e,W18Real r)=>(float)Math.Sqrt((e.StopX-r.X)*(e.StopX-r.X)+(e.StopY-r.Y)*(e.StopY-r.Y));

    static void W18StopPredictionTests()
    {
        const float boardLength=900,tolerance=boardLength*.03f; // AC: <= 3% of board length

        Test("W18-01 STOP estimate matches real Step on the empty arena within 3% of board length (68 launches, both sides, wall bounces)",()=>{
            var cases=W18Cases();True(cases.Count>=20);
            float worst=0,sum=0;int bounced=0;string worstName="";
            foreach(var c in cases)
            {
                var e=W18PredictSpawn(c);var r=W18RealSpawn(c);True(e.Valid,c.Name+" invalid");
                float err=W18Err(e,r);sum+=err;if(err>worst){worst=err;worstName=c.Name;}
                True(err<=tolerance,$"{c.Name}: estimate ({e.StopX:0.0},{e.StopY:0.0}) vs real ({r.X:0.0},{r.Y:0.0}) = {err:0.0} > {tolerance:0}");
                if(e.WallBounces>0)bounced++;
            }
            True(bounced>=3,"too few wall-bounce cases: "+bounced);
            Console.WriteLine($"EVIDENCE W18-01 spawn cases={cases.Count} wallBounceCases={bounced} maxErr={worst:0.000} ({worstName}) meanErr={sum/cases.Count:0.000} tolerance={tolerance:0}");
        });
        Test("W18-01 empty-arena estimate is frame-exact: same STOP point, frame and enemy-base wall damage as BallPhysics",()=>{
            foreach(var c in W18Cases())
            {
                var e=W18PredictSpawn(c);var r=W18RealSpawn(c);
                True(W18Err(e,r)<=.01f,$"{c.Name}: off by {W18Err(e,r):0.0000}");
                Eq(r.Frames,e.Frames);Eq(r.Guard,e.MotionGuard);Eq(r.EnemyBaseLoss,e.EnemyWallDamage);
            }
        });
        Test("W18-01 Replay estimate matches real Step: forward, sideways, backward into own launcher ring, earth anchor and sticky",()=>{
            var setups=new List<(string name,int owner,string type,float x,float y,float angle,float length,int anchor,float sticky)>{
                ("P1 normal forward",0,"normal",180,760,10,150,0,0),("P1 normal sideways wall",0,"normal",180,760,-85,175,0,0),
                ("P1 normal backward into launcher ring",0,"normal",270,760,180,90,0,0),("P2 normal forward",1,"normal",360,140,-25,160,0,0),
                ("P2 normal backward wall",1,"normal",360,140,170,120,0,0),("P1 earth anchor 3 (-1 at launch)",0,"anchor",200,780,5,175,3,0),
                ("P1 sticky ball",0,"normal",200,780,0,175,0,.5f),("P2 dart",1,"dart",120,130,30,175,0,0)};
            float worst=0;
            foreach(var t in setups)
            {
                var s=W18Sim();if(t.owner==1)s.State.turn=1;
                var b=s.Spawn(t.owner,t.type,t.x,t.y);b.anchorStacks=t.anchor;b.sticky=t.sticky;
                True(s.CanReplay(b),t.name+" cannot replay");
                var (dx,dy)=W18Drag(t.owner,t.angle,t.length);StopPredictor.GesturePower(dx,dy,out float power);
                var body=StopPredictor.Replay(b,catalog.Ball(t.type).archetype,dx,dy,power);
                Near(t.x,b.x);Near(t.y,b.y);Eq(t.anchor,b.anchorStacks); // building the estimate never mutates the ball
                var e=StopPredictor.Predict(body);
                True(s.TryCommand(new PlayerCommand{owner=t.owner,turnNumber=s.State.turnNumber,kind=CommandKind.Replay,ballId=b.id,dx=dx,dy=dy,power=power},out string why),t.name+": "+why);
                var r=W18RunUntilStop(s,b,t.owner);
                float err=W18Err(e,r);worst=Math.Max(worst,err);
                True(err<=tolerance,$"{t.name}: {err:0.0}");True(err<=.01f,$"{t.name}: not frame-exact, {err:0.0000}");Eq(r.Frames,e.Frames);
            }
            Console.WriteLine($"EVIDENCE W18-01 replay cases={setups.Count} maxErr={worst:0.000}");
        });
        Test("W18-01 anything on the path makes the estimate conditional; it never claims a hit",()=>{
            var s=W18Sim();var (dx,dy)=W18Drag(0,0,175);StopPredictor.GesturePower(dx,dy,out float power);var body=StopPredictor.Spawn(catalog.Ball("normal"),0,dx,dy,power);
            var clear=StopPredictor.Predict(body,StopPredictor.Obstacles(s.State,-1));False(clear.Obstructed);
            True(StopPredictor.Label(clear).StartsWith("EST. STOP · "));False(StopPredictor.Label(clear).Contains("IF PATH CLEAR"));
            var blocker=s.Spawn(1,"normal",270,450);var aside=s.Spawn(1,"normal",60,300);
            var blocked=StopPredictor.Predict(body,StopPredictor.Obstacles(s.State,-1));True(blocked.Obstructed);
            True(StopPredictor.Label(blocked).EndsWith("· IF PATH CLEAR"));Near(clear.StopX,blocked.StopX);Near(clear.StopY,blocked.StopY);
            blocker.dead=true;True(!StopPredictor.Predict(body,StopPredictor.Obstacles(s.State,-1)).Obstructed,"dead ball still obstructs");
            s.State.zones.Add(new ZoneRuntime{id=99,kind="gravity",x=270,y=500,radius=40});True(StopPredictor.Predict(body,StopPredictor.Obstacles(s.State,-1)).Obstructed,"field ignored");
            s.State.zones.Clear();s.State.structures.Add(new StructureRuntime{id=98,kind="bumper",x=270,y=600,radius=20});True(StopPredictor.Predict(body,StopPredictor.Obstacles(s.State,-1)).Obstructed,"structure ignored");
            s.State.structures.Clear();
            var mover=s.Spawn(0,"normal",270,780);Eq(0,StopPredictor.Obstacles(s.State,mover.id).Count(o=>o.X==270&&o.Y==780));
            foreach(StopReach reach in Enum.GetValues(typeof(StopReach)))False(StopPredictor.ReachLabel(reach).Contains("HIT"));
        });
        Test("W18-01 estimate moves continuously with the drag (no jumps) and is deterministic",()=>{
            AimPoint? last=null;float maxStep=0;
            for(float length=20;length<=175;length+=.5f)
            {
                var e=W18PredictSpawn(new W18Case{Owner=0,Type="normal",Angle=0,Length=length});
                if(last.HasValue){float d=(float)Math.Sqrt(Math.Pow(e.StopX-last.Value.x,2)+Math.Pow(e.StopY-last.Value.y,2));maxStep=Math.Max(maxStep,d);True(e.StopY<=last.Value.y+.01f,"straight shot came back at drag "+length);}
                last=new AimPoint(e.StopX,e.StopY);
            }
            True(maxStep<=6,"power step jump "+maxStep);
            last=null;float maxTurn=0;
            for(float angle=-88;angle<=88;angle+=1)
            {
                var e=W18PredictSpawn(new W18Case{Owner=1,Type="normal",Angle=angle,Length=120});
                if(last.HasValue)maxTurn=Math.Max(maxTurn,(float)Math.Sqrt(Math.Pow(e.StopX-last.Value.x,2)+Math.Pow(e.StopY-last.Value.y,2)));
                last=new AimPoint(e.StopX,e.StopY);
            }
            True(maxTurn<=20,"angle step jump "+maxTurn);
            var a=W18PredictSpawn(new W18Case{Owner=0,Type="bounce",Angle=60,Length=175});var b=W18PredictSpawn(new W18Case{Owner=0,Type="bounce",Angle=60,Length=175});
            Eq(a.StopX,b.StopX);Eq(a.StopY,b.StopY);Eq(a.Frames,b.Frames);Eq(a.Path.Count,b.Path.Count);
            Console.WriteLine($"EVIDENCE W18-01 continuity maxStepPerHalfUnitDrag={maxStep:0.00} maxStepPerDegree={maxTurn:0.00}");
        });
        Test("W18-01 W16 estimate checked on real Step: max-power straight shot rolls past the drawn 261-unit preview",()=>{
            var c=new W18Case{Owner=0,Type="normal",Angle=0,Length=175};var r=W18RealSpawn(c);var e=W18PredictSpawn(c);
            var (dx,dy)=W18Drag(0,0,175);var preview=AimGuide.Preview(270,853,270+dx,853+dy,0,21.25f);
            float real=853-r.Y;True(real>preview.Length+100,$"real roll {real:0} vs preview {preview.Length:0}");
            Eq(StopReach.EnemyZone,e.Reach);
            var shortShot=W18PredictSpawn(new W18Case{Owner=0,Type="normal",Angle=0,Length=25});True(shortShot.Reach==StopReach.OwnZone||shortShot.Reach==StopReach.OwnHalf,"short shot reach "+shortShot.Reach);
            Console.WriteLine($"EVIDENCE W18-01 maxPowerStraight realRoll={real:0.0} previewLength={preview.Length:0.0} predictedStopY={e.StopY:0.0} realStopY={r.Y:0.0} frames={r.Frames} reach={e.Reach}");
        });
        Test("W18-01 invalid input never produces an estimate; drag threshold matches LaunchGesture",()=>{
            False(StopPredictor.GesturePower(10,10,out _));False(StopPredictor.GesturePower(float.NaN,40,out _));
            True(StopPredictor.GesturePower(0,-18,out float p18));Near(18*3.38f,p18);True(StopPredictor.GesturePower(0,-400,out float pMax));Eq(590f,pMax);
            var bad=StopPredictor.Spawn(catalog.Ball("normal"),0,0,-100,300);bad.Vx=float.NaN;False(StopPredictor.Predict(bad).Valid);Eq("",StopPredictor.Label(StopPredictor.Predict(bad)));
        });
        Test("W18-01 board draws the estimate as a labelled approximation; predictor is presentation-only",()=>{
            string board=File.ReadAllText(Path.Combine(projectRoot,"Assets/CoreClash/Presentation/BoardView.cs"));
            string predictor=Regex.Replace(File.ReadAllText(Path.Combine(projectRoot,"Assets/CoreClash/Presentation/StopPrediction.cs")),@"//[^\n]*","");
            True(board.Contains("StopPredictor.Predict(")&&board.Contains("StopPredictor.Label(")&&board.Contains("StopPredictor.Obstacles("),"BoardView does not render the STOP estimate");
            Eq(0,Regex.Matches(predictor,@"\.(TryCommand|Step|Damage|Kill|DamageBase|Emit)\(").Count);
            Eq(0,Regex.Matches(predictor,@"\bState\.").Count);
            True(predictor.Contains("EST. STOP")&&predictor.Contains("IF PATH CLEAR"));
        });
    }
}
