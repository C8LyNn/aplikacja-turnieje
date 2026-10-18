using System;
using System.Linq;
using System.Text.Json;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Networking;
using CoreClash.Presentation;

public static partial class Program
{
    static void StatusPayoffTests()
    {
        foreach(string type in new[]{"embertrap","frosttrap","sporetrap"})
        {
            Test("R16 "+type+" STOP places persistent single enemy charge without stock cost",()=>{
                var s=Sim();var source=s.Spawn(0,type,270,450);int stock=s.Stock(0,"fire");
                s.Abilities.OnStop(source);var z=s.State.zones.Single();
                Eq(type,z.kind);Eq(source.id,z.sourceId);Eq(0,z.owner);Eq(-1,z.turns);True(z.trap);Near(14,z.radius);
                var friend=s.Spawn(0,"normal",z.x,z.y);s.Abilities.OnStep(1f/120);False(z.dead);Eq(0,friend.fireStacks+friend.iceStacks+friend.toxinTurns);
                var enemy=s.Spawn(1,"normal",z.x,z.y);s.Abilities.OnStep(1f/120);True(z.dead);
                Eq(type=="embertrap"?1:0,enemy.fireStacks);Eq(type=="frosttrap"?1:0,enemy.iceStacks);Eq(type=="sporetrap"?3:0,enemy.toxinTurns);
                s.Abilities.OnStep(1f/120);Eq(type=="embertrap"?1:0,enemy.fireStacks);Eq(stock,s.Stock(0,"fire"));
            });
            Test("R16 "+type+" ignores phased banished dead targets and survives source death",()=>{
                var s=Sim();var source=s.Spawn(0,type,270,450);s.Abilities.OnStop(source);var z=s.State.zones.Single();
                var e=s.Spawn(1,"normal",z.x,z.y);e.phased=true;s.Abilities.OnStep(.01f);False(z.dead);
                e.phased=false;e.banished=true;s.Abilities.OnStep(.01f);False(z.dead);
                e.banished=false;s.Kill(e);s.Kill(source);s.Abilities.OnStep(.01f);False(z.dead);
                var next=s.Spawn(1,"normal",z.x,z.y);s.Abilities.OnStep(.01f);True(z.dead);True(next.fireStacks+next.iceStacks+next.toxinTurns>0);
            });
        }
        Test("R16 elemental trap placement obeys geometry and 256 live zone cap",()=>{
            var s=Sim();var source=s.Spawn(0,"embertrap",270,450);
            s.State.structures.Add(new StructureRuntime{id=s.State.nextId++,kind="blocker",x=270,y=450,radius=1000,hp=5,maxHp=5});
            s.Abilities.OnStop(source);Eq(0,s.State.zones.Count);
            s.State.structures.Clear();for(int i=0;i<256;i++)s.State.zones.Add(new ZoneRuntime{id=s.State.nextId++,kind="web",radius=14});
            s.Abilities.OnStop(source);Eq(256,s.State.zones.Count);s.State.zones[0].dead=true;s.Abilities.OnStop(source);Eq(256,s.State.zones.Count(z=>!z.dead));
        });
        Test("R16 trap is consumed before FIRE ICE cancellation and never roots or explodes",()=>{
            var s=Sim();var source=s.Spawn(0,"embertrap",270,450);s.Abilities.OnStop(source);var z=s.State.zones.Single();
            var e=s.Spawn(1,"normal",z.x,z.y);s.Abilities.ApplyIce(e,0);s.Abilities.OnStep(.01f);
            True(z.dead);Eq(0,e.iceStacks);Eq(0,e.fireStacks);Eq(30,e.hp);False(e.rooted);False(s.State.events.Any(x=>x.kind=="EXPLOSION"));
        });
        Test("R16 Echo repeats trap STOP while jam suppresses one placement",()=>{
            var s=Sim();var source=s.Spawn(0,"frosttrap",200,450);source.jammed=1;s.Abilities.OnStop(source);Eq(0,s.State.zones.Count);
            var echo=s.Spawn(0,"echo",300,450);s.Abilities.OnStop(echo);Eq(1,s.State.zones.Count);s.Abilities.OnStop(source);Eq(2,s.State.zones.Count);
        });
        Test("R16 Venom TOUCH infects a clean enemy without damage or healing",()=>{
            var s=Sim();var v=s.Spawn(0,"venom",200,450);v.hp=15;var e=s.Spawn(1,"normal",245,450);
            s.Abilities.OnContact(v,e,false,true,20);Eq(3,e.toxinTurns);Eq(30,e.hp);Eq(15,v.hp);
        });
        Test("R16 Venom TOUCH pays off existing TOXIN and caps healing",()=>{
            var s=Sim();var v=s.Spawn(0,"venom",200,450);v.hp=v.maxHp-2;var e=s.Spawn(1,"normal",245,450);s.Abilities.ApplyToxin(e,0);
            s.Abilities.OnContact(v,e,false,false,20);Eq(25,e.hp);Eq(v.maxHp,v.hp);Eq(3,e.toxinTurns);
        });
        Test("R16 Venom ignores allies and Plague immunity on clean infection",()=>{
            var s=Sim();var v=s.Spawn(0,"venom",200,450);var ally=s.Spawn(0,"normal",245,450);var p=s.Spawn(1,"plague",300,450);
            s.Abilities.OnContact(v,ally,true,true,200);s.Abilities.OnContact(v,p,false,true,20);Eq(0,ally.toxinTurns);Eq(0,p.toxinTurns);
        });
        Test("R16 Cleanse removes Venom payoff; jam suppresses next contact",()=>{
            var s=Sim();var v=s.Spawn(0,"venom",200,450);var e=s.Spawn(1,"normal",245,450);var ward=s.Spawn(1,"ward",300,450);
            s.Abilities.ApplyToxin(e,0);s.Abilities.OnStop(ward);v.jammed=1;s.Abilities.OnContact(v,e,false,true,20);Eq(0,e.toxinTurns);
            s.Abilities.OnContact(v,e,false,true,20);Eq(3,e.toxinTurns);Eq(30,e.hp);
        });
        Test("R16 Shatterer consumes two ICE on TOUCH for five damage",()=>{
            var s=Sim();var sh=s.Spawn(0,"shatterer",200,450);var e=s.Spawn(1,"normal",245,450);s.Abilities.ApplyIce(e,0);s.Abilities.ApplyIce(e,0);
            s.Abilities.OnContact(sh,e,false,false,20);Eq(25,e.hp);Eq(0,e.iceStacks);Near(0,e.frozen);
            s.Abilities.OnContact(sh,e,true,true,200);Eq(25,e.hp);
        });
        Test("R16 Shatterer consumes full freeze but ignores one ICE and allies",()=>{
            var s=Sim();var sh=s.Spawn(0,"shatterer",200,450);var e=s.Spawn(1,"normal",245,450);s.Abilities.ApplyIce(e,0);
            s.Abilities.OnContact(sh,e,true,true,200);Eq(30,e.hp);Eq(1,e.iceStacks);
            s.Abilities.ApplyIce(e,0);s.Abilities.ApplyIce(e,0);s.Abilities.OnContact(sh,e,false,true,20);Eq(25,e.hp);Near(0,e.frozen);
            var ally=s.Spawn(0,"normal",200,530);for(int i=0;i<3;i++)s.Abilities.ApplyIce(ally,1);s.Abilities.OnContact(sh,ally,true,true,200);Eq(30,ally.hp);True(ally.frozen>0);
        });
        Test("R16 spore trap sets up Venom and Chain Frost sets up Shatterer",()=>{
            var s=Sim();var source=s.Spawn(0,"sporetrap",270,450);s.Abilities.OnStop(source);var z=s.State.zones.Single();var e=s.Spawn(1,"normal",z.x,z.y);
            s.Abilities.OnStep(.01f);var venom=s.Spawn(0,"venom",200,450);s.Abilities.OnContact(venom,e,false,true,20);Eq(25,e.hp);
            var frost=s.Spawn(0,"chainfrost",300,450);s.Abilities.OnStop(frost);s.Abilities.OnStop(frost);var sh=s.Spawn(0,"shatterer",370,450);s.Abilities.OnContact(sh,e,false,true,20);Eq(20,e.hp);Eq(0,e.iceStacks);
        });
        Test("R16 Mimic can acquire Venom without changing owner or copying status",()=>{
            var s=Sim();var m=s.Spawn(0,"mimic",200,450);var v=s.Spawn(1,"venom",260,450);s.Abilities.OnPairContact(m,v,false,true,20);Eq("venom",m.type);Eq("normal",v.type);Eq(0,m.owner);
            var e=s.Spawn(1,"normal",320,450);s.Abilities.OnContact(m,e,false,true,20);Eq(3,e.toxinTurns);
        });
        Test("R16 trap charges and toxin payoff survive authoritative JSON snapshot",()=>{
            var s=Sim();var source=s.Spawn(0,"sporetrap",270,450);s.Abilities.OnStop(source);var v=s.Spawn(0,"venom",150,450);
            var opts=new JsonSerializerOptions{IncludeFields=true};var packet=new NetworkGameSession(s).Capture(x=>JsonSerializer.Serialize(x,opts));var client=new NetworkGameStateAdapter();
            True(client.Apply(packet,x=>JsonSerializer.Deserialize<GameState>(x,opts),out _));var restored=Sim();restored.State=client.State;
            var z=restored.State.zones.Single();var e=restored.Spawn(1,"normal",z.x,z.y);restored.Abilities.OnStep(.01f);restored.Abilities.OnContact(restored.State.balls.Single(b=>b.id==v.id),e,false,true,20);Eq(25,e.hp);True(z.dead);
        });
        Test("R16 trap activation and status setup have visible read-only feedback",()=>{
            var s=Sim();var source=s.Spawn(0,"embertrap",270,450);var view=new FeedbackTimeline();view.Observe(s.State,0);s.Abilities.OnStop(source);var z=s.State.zones.Single();s.Spawn(1,"normal",z.x,z.y);s.Abilities.OnStep(.01f);view.Observe(s.State,.1f);
            True(view.Items.Any(e=>e.kind=="TRAP_TRIGGER"));True(view.Items.Any(e=>e.kind=="FIRE"));
        });
        Test("R16 two mixed elemental trap payoff matches finish with legal commands",()=>{
            var ids=new[]{"embertrap","frosttrap","sporetrap","venom","shatterer","chainfrost","firebrand","hatchery","wallmaker"};var d=new DeckDefinition{id="r16_test_only",balls=ids};var matches=new System.Collections.Generic.List<object>();
            for(int seed=0;seed<2;seed++){
                var s=new GameSimulation(catalog,d,d);int[] next={0,0};int shots=0,guards=0;var deployed=new System.Collections.Generic.HashSet<string>();
                while(s.State.phase!=MatchPhase.Over&&shots<65){int owner=s.State.turn;string type=ids[next[owner]++%9];if(s.Stock(owner,type)<=0)type="normal";var shot=Shot(s,owner,type);shot.dx=new[]{-.25f,.4f,-.6f,.1f}[(shots+seed)%4];shot.power=390+seed*30;True(s.TryCommand(shot,out var reason),reason);shots++;deployed.Add(type);int serial=s.State.eventSerial;
                    for(int frame=0;frame<4000&&s.State.phase==MatchPhase.Moving;frame++){s.Step(1f/120);guards+=s.State.events.Count(e=>e.id>serial&&e.kind=="MOTION_GUARD");serial=s.State.eventSerial;True(s.State.zones.Count(z=>!z.dead)<=256);}
                    True(s.State.phase!=MatchPhase.Moving);
                }
                Eq(MatchPhase.Over,s.State.phase);True(ids.Take(5).All(deployed.Contains));True(guards<=shots);
                matches.Add(new{seed,shots,turns=s.State.turnNumber,guards,deployed=deployed.ToArray(),winner=s.State.winner});
            }
            File.WriteAllText(Path.Combine(projectRoot,"Evidence/r16-mixed-matches.json"),JsonSerializer.Serialize(matches,new JsonSerializerOptions{WriteIndented=true}));
        });
    }
}
