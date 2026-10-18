using System;
using System.Linq;
using System.Text.Json;
using CoreClash.Core;
using CoreClash.Physics;
using CoreClash.Networking;

public static partial class Program
{
    static void MomentumTests()
    {
        Test("Pinballer STOP places a five-charge bumper by the nearest edge",()=>{
            var s=Sim();var p=s.Spawn(0,"pinballer",100,450);s.Abilities.OnStop(p);
            Eq(1,s.State.structures.Count);var g=s.State.structures[0];Eq("bumper",g.kind);Eq(p.id,g.sourceId);Eq(5,g.hp);Near(20,g.radius);Near(1.42f,g.restitution);Near(ZoneResolver.Left+25,g.x);True(Math.Abs(g.y-p.y)<120);
        });
        Test("Pinballer respects occupied edge points and the fourteen-structure cap",()=>{
            var s=Sim();var p=s.Spawn(0,"pinballer",100,450);var ally=s.Spawn(0,"normal",ZoneResolver.Left+30,450);s.Abilities.OnStop(p);
            Eq(1,s.State.structures.Count);var g=s.State.structures[0];True(Math.Sqrt(Math.Pow(g.x-ally.x,2)+Math.Pow(g.y-ally.y,2))>=g.radius+ally.radius);
            for(int i=1;i<14;i++)s.State.structures.Add(new StructureRuntime{id=s.State.nextId++,x=300,y=50+i*50,radius=2,hp=1});
            s.Abilities.OnStop(p);Eq(14,s.State.structures.Count);s.State.structures[1].dead=true;s.Abilities.OnStop(p);Eq(14,s.State.structures.Count(x=>!x.dead));
        });
        Test("Pinballer no-space placement fails cleanly and source death preserves its bumper",()=>{
            var s=Sim();var p=s.Spawn(0,"pinballer",100,450);s.State.structures.Add(new StructureRuntime{id=s.State.nextId++,x=270,y=450,radius=1000,hp=3});s.Abilities.OnStop(p);Eq(1,s.State.structures.Count);
            var t=Sim();var caster=t.Spawn(0,"pinballer",100,450);t.Abilities.OnStop(caster);t.Kill(caster);False(t.State.structures.Single().dead);
        });
        Test("Bumper rebounds friendly balls without consuming charges",()=>{
            var s=Sim();var g=new StructureRuntime{id=s.State.nextId++,owner=0,kind="bumper",x=200,y=450,radius=25,hp=3,maxHp=3,restitution=1.42f};s.State.structures.Add(g);
            var b=s.Spawn(0,"normal",245,450,-200,0);s.Physics.Step(1f/120);True(b.vx>200);Eq(3,g.hp);
        });
        Test("Three distinct enemy impacts destroy a bumper and obey type speed caps",()=>{
            var s=Sim();var g=new StructureRuntime{id=s.State.nextId++,owner=0,kind="bumper",x=200,y=450,radius=25,hp=3,maxHp=3,restitution=1.42f};s.State.structures.Add(g);var b=s.Spawn(1,"normal",245,450,-600,0);
            for(int i=0;i<3;i++){b.x=245;b.y=450;b.vx=-600;s.Physics.Step(1f/120);True(BallPhysics.Speed(b)<=b.maxSpeed+.01f);b.x=350;b.y=450;b.vx=b.vy=0;s.Physics.Step(1f/120);}Eq(0,g.hp);True(g.dead);
        });
        Test("Slingshot gathers nearby allies and launches along its last heading",()=>{
            var s=Sim();var p=s.Spawn(0,"slingshot",270,450);p.angle=-(float)Math.PI/2;var a=s.Spawn(0,"normal",170,450);var b=s.Spawn(0,"normal",370,450);var enemy=s.Spawn(1,"normal",270,530);var far=s.Spawn(0,"normal",270,700);int action=s.State.actionSerial,stock=s.Stock(0,"fire");s.Abilities.OnStop(p);
            True(a.vy<-320&&b.vy<-320);Near(330,BallPhysics.Speed(a));True(Math.Abs(a.x-p.x)<100&&Math.Abs(b.x-p.x)<100);Near(0,enemy.vx);Near(0,enemy.vy);Near(0,far.vy);Eq(action,s.State.actionSerial);Eq(stock,s.Stock(0,"fire"));
        });
        Test("Slingshot respects root freeze force resistance and legal geometry",()=>{
            var s=Sim();var p=s.Spawn(0,"slingshot",140,400);p.angle=0;var root=s.Spawn(0,"normal",100,400);s.Abilities.Root(root);var ice=s.Spawn(0,"normal",140,500);ice.frozen=1;var earth=s.Spawn(0,"anchor",230,400);earth.anchorStacks=3;
            s.Abilities.OnStop(p);Near(100,root.x);Near(400,root.y);Near(0,BallPhysics.Speed(root));Near(140,ice.x);Near(500,ice.y);True(earth.vx>0&&BallPhysics.Speed(earth)<330);True(earth.x-earth.radius>=ZoneResolver.Left);
        });
        Test("Slingshot skips blocked placements without teleporting through structures",()=>{
            var s=Sim();var p=s.Spawn(0,"slingshot",270,450);var a=s.Spawn(0,"normal",270,550);s.State.structures.Add(new StructureRuntime{id=s.State.nextId++,x=270,y=450,radius=200,hp=3});s.Abilities.OnStop(p);Near(270,a.x);Near(550,a.y);Near(0,BallPhysics.Speed(a));
        });
        Test("A late Slingshot launch gets time to resolve instead of the old action timeout",()=>{
            var s=Sim();s.State.phase=MatchPhase.Moving;s.State.actionTime=13;var p=s.Spawn(0,"slingshot",270,450);p.angle=-(float)Math.PI/2;s.Spawn(0,"normal",170,450);s.Abilities.OnStop(p);
            for(int i=0;i<180&&s.State.phase==MatchPhase.Moving;i++)s.Step(1f/120);
            False(s.State.events.Any(e=>e.kind=="MOTION_GUARD"));
        });
        Test("Slingshot settling extensions stay bounded and the next command resets them",()=>{
            var s=Sim();s.State.phase=MatchPhase.Moving;s.State.actionTime=27;var p=s.Spawn(0,"slingshot",270,450);s.Spawn(0,"normal",170,450);s.Abilities.OnStop(p);Near(28,s.State.actionDeadline);
            s.State.phase=MatchPhase.Aiming;True(s.TryCommand(Shot(s),out _));Near(14,s.State.actionDeadline);
        });
        Test("Copying Ram clears any previous identity's action-use history",()=>{
            var s=Sim();var mimic=s.Spawn(0,"mimic",100,450);mimic.lastRamAction=s.State.actionSerial;var ram=s.Spawn(1,"ram",170,450);s.Abilities.OnContact(mimic,ram,true,true,200);Eq("ram",mimic.type);var enemy=s.Spawn(1,"normal",230,450);s.Abilities.OnContact(mimic,enemy,true,true,200);Eq(25,enemy.hp);
        });
        Test("Ram adds impact damage recoil and force on its first enemy HIT",()=>{
            var s=Sim();var a=s.Spawn(0,"ram",200,450);var b=s.Spawn(1,"normal",245,450);s.Abilities.OnContact(a,b,true,true,200);Eq(25,b.hp);Eq(29,a.hp);True(b.vx>0);True(BallPhysics.Speed(b)<=b.maxSpeed);
        });
        Test("Ram ignores TOUCH and allies and only fires once per action",()=>{
            var s=Sim();var a=s.Spawn(0,"ram",200,450);var enemy=s.Spawn(1,"normal",245,450);var ally=s.Spawn(0,"normal",200,520);s.Abilities.OnContact(a,enemy,false,true,50);Eq(30,enemy.hp);s.Abilities.OnContact(a,ally,true,true,200);Eq(30,ally.hp);
            s.Abilities.OnContact(a,enemy,true,false,200);Eq(25,enemy.hp);s.Abilities.OnContact(a,enemy,true,true,200);Eq(25,enemy.hp);s.State.actionSerial++;s.Abilities.OnContact(a,enemy,true,false,200);Eq(20,enemy.hp);
        });
        Test("Jammed Ram consumes suppression without applying its primary hit",()=>{
            var s=Sim();var a=s.Spawn(0,"ram",200,450);var enemy=s.Spawn(1,"normal",245,450);a.jammed=1;s.Abilities.OnContact(a,enemy,true,true,200);Eq(30,enemy.hp);Eq(0,a.jammed);s.Abilities.OnContact(a,enemy,true,true,200);Eq(25,enemy.hp);
        });
        Test("Echo repeats Pinballer STOP through the shared effect resolver",()=>{
            var s=Sim();var echo=s.Spawn(0,"echo",230,450);s.Spawn(0,"pinballer",100,450);s.Abilities.OnStop(echo);Eq(1,s.State.structures.Count(x=>x.kind=="bumper"&&!x.dead));
        });
        Test("Mimic copies a live Pinballer power and preserves player ownership",()=>{
            var s=Sim();var mimic=s.Spawn(0,"mimic",100,450);var target=s.Spawn(1,"pinballer",200,450);s.Abilities.OnContact(mimic,target,true,true,200);Eq("pinballer",mimic.type);Eq(0,mimic.owner);Eq("normal",target.type);s.Abilities.OnStop(mimic);Eq(1,s.State.structures.Count(x=>x.owner==0));
        });
        Test("New geometry and Ram action history survive an authoritative snapshot",()=>{
            var s=Sim();var p=s.Spawn(0,"pinballer",100,450);s.Abilities.OnStop(p);var ram=s.Spawn(0,"ram",270,450);var target=s.Spawn(1,"normal",320,450);s.Abilities.OnContact(ram,target,true,true,200);var json=new JsonSerializerOptions{IncludeFields=true};var session=new NetworkGameSession(s);var packet=session.Capture(state=>JsonSerializer.Serialize(state,json));var adapter=new NetworkGameStateAdapter();True(adapter.Apply(packet,text=>JsonSerializer.Deserialize<GameState>(text,json),out _));Eq(1,adapter.State.structures.Count);Near(1.42f,adapter.State.structures[0].restitution);
            var clone=Sim();clone.State=adapter.State;clone.Abilities.OnContact(clone.State.balls.Single(x=>x.id==ram.id),clone.State.balls.Single(x=>x.id==target.id),true,true,200);Eq(25,clone.State.balls.Single(x=>x.id==target.id).hp);
        });
        Test("Legal mixed-deck matches deploy all three newly ported identities and settle",()=>{
            var ids=new[]{"pinballer","slingshot","ram","web","gatekeeper","agony","bonfire","ward","anchor"};
            var deck=new CoreClash.Data.DeckDefinition{id="r8_test_only",balls=ids};var reports=new System.Collections.Generic.List<object>();var stalls=new System.Collections.Generic.List<object>();
            for(int seed=0;seed<3;seed++){
                var s=new GameSimulation(catalog,deck,deck);int[] next={0,0};var deployed=new System.Collections.Generic.HashSet<string>();int launches=0,guards=0;
                while(s.State.phase!=MatchPhase.Over&&launches<60){
                    int owner=s.State.turn;string type=ids[next[owner]++%ids.Length];if(s.Stock(owner,type)<=0)type="normal";
                    float angle=(new[]{-.72f,.43f,-.2f,.64f,0f})[(launches+seed)%5];
                    var shot=Shot(s,owner,type);shot.dx=(float)Math.Sin(angle);shot.dy=(float)Math.Cos(angle)*(owner==0?-1:1);shot.power=370+seed*35;
                    True(s.TryCommand(shot,out var reason),reason);deployed.Add(type);launches++;int last=s.State.eventSerial;
                    bool recorded=false;
                    for(int frame=0;frame<4000&&s.State.phase==MatchPhase.Moving;frame++){
                        if(s.State.actionTime>13.9f&&!recorded){recorded=true;stalls.Add(new{seed,action=s.State.actionSerial,launched=type,balls=s.State.balls.Where(b=>!b.dead&&BallPhysics.Speed(b)>14).Select(b=>new{b.id,b.type,b.x,b.y,b.vx,b.vy}).ToArray(),structures=s.State.structures.Where(g=>!g.dead).ToArray()});}
                        s.Step(1f/120);guards+=s.State.events.Count(e=>e.id>last&&e.kind=="MOTION_GUARD");last=s.State.eventSerial;
                    }
                    True(s.State.phase!=MatchPhase.Moving);True(s.State.structures.Count(g=>!g.dead)<=14);
                }
                if(stalls.Count>0)System.IO.File.WriteAllText(System.IO.Path.Combine(projectRoot,"Evidence/r8-motion-investigation.json"),JsonSerializer.Serialize(stalls,new JsonSerializerOptions{WriteIndented=true,IncludeFields=true}));
                Eq(MatchPhase.Over,s.State.phase);True(guards<=launches,"more than one safety settle per action");True(new[]{"pinballer","slingshot","ram"}.All(deployed.Contains));
                reports.Add(new{seed,launches,turns=s.State.turnNumber,guards,winner=s.State.winner,result=s.State.resultReason,deployed=deployed.OrderBy(x=>x).ToArray()});
            }
            System.IO.File.WriteAllText(System.IO.Path.Combine(projectRoot,"Evidence/r8-momentum-matches.json"),JsonSerializer.Serialize(new{testedAt=DateTime.UtcNow,pass=true,testOnlyDeck=ids,matches=reports},new JsonSerializerOptions{WriteIndented=true}));
        });
    }
}
