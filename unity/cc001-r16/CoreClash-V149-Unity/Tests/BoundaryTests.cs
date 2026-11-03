using CoreClash.Core;
using CoreClash.Input;
using CoreClash.Networking;
using System.Text.Json;
public static partial class Program
{
    static partial void ExtraTests()
    {
        AbilityTests();
        PresentationTests();
        W17AimGeometryTests();
        W18StopPredictionTests();
        W18ReplayAffordanceTests();
        SetupLayoutTests();
        W19ReadinessTests();
        IdentityPresentationTests();
        FeedbackTests();
        LanDiscoveryTests();
        ShowcaseTests();
        W19SelfPlayTests();
        Test("planning freezes physical state and continuous abilities until a launch",()=>{var s=Sim();var core=s.Spawn(0,"singularity",270,450);s.Kill(core);var target=s.Spawn(1,"normal",350,450,100,0);for(int i=0;i<120;i++)s.Step(1f/120);Near(350,target.x);Near(450,target.y);Near(100,target.vx);Eq(0,target.startCount);});
        Test("catalog ability status matches native support and preserves imported metadata",()=>{Eq("UNITY_READY",catalog.Ability("agony:primary").portStatus);Eq("PARTIAL",catalog.Ability("mimic:primary").portStatus);Eq("DATA_ONLY",catalog.Ability("tesla:primary").portStatus);True(catalog.Ability("agony:primary").rawMetadata.Length>0);});
        Test("thawed ice cannot consume Penitent transfer ahead of a live toxin",()=>{var s=Sim();var ally=s.Spawn(0,"normal",300,450);var p=s.Spawn(0,"penitent",200,450);for(int i=0;i<3;i++)s.Abilities.ApplyIce(ally,1);s.State.phase=MatchPhase.Moving;for(int i=0;i<310;i++)s.Physics.Step(1f/120);s.Abilities.ApplyToxin(ally,1);s.Abilities.OnContact(p,ally,false,true,40);Eq(0,ally.toxinTurns);Eq(3,p.toxinTurns);});
        Test("Gravity Mine explodes at its armed field even after the source is displaced",()=>{var s=Sim();var mine=s.Spawn(0,"gravitymine",200,450);s.Abilities.OnStop(mine);mine.x=400;mine.y=250;var enemy=s.Spawn(1,"normal",250,450);s.Abilities.OnStep(1f/120);True(mine.dead);True(enemy.hp<30,"enemy at armed trap was not damaged");});
        Test("canceled touch never launches",()=>{var g=new LaunchGesture();g.Begin(7,270,853);g.Move(7,270,600);g.Cancel(7);False(g.Release(7,0,1,"normal",0,out _));});
        Test("other finger cannot release active aim",()=>{var g=new LaunchGesture();g.Begin(7,270,853);g.Move(7,270,600);False(g.Release(8,0,1,"normal",0,out _));True(g.Release(7,0,1,"normal",0,out var c));Eq(590f,c.power);});
        Test("host rejects duplicate and spoofed intent",()=>{var s=Sim();var host=new NetworkGameSession(s);var c=Shot(s);c.sequence=1;False(host.Submit(1,c,out _));True(host.Submit(0,c,out _));Settle(s);False(host.Submit(0,c,out _));Eq(1,s.State.balls.Count);});
        Test("snapshot client retains state without advancing physics",()=>{var s=Sim();var b=s.Spawn(0,"normal",170,430,100,0);var host=new NetworkGameSession(s);var client=new NetworkGameStateAdapter();var opts=new JsonSerializerOptions{IncludeFields=true};var packet=host.Capture(x=>JsonSerializer.Serialize(x,opts));True(client.Apply(packet,x=>JsonSerializer.Deserialize<GameState>(x,opts),out _));Eq(20,client.State.players[0].hp);Eq(170f,client.State.balls[0].x);s.Step(1f/120);Eq(170f,client.State.balls[0].x);});
        MatchSmokeTests();
    }
}
