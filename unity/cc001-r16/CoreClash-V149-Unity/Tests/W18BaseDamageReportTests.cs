using System;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using CoreClash.Core;
using CoreClash.Presentation;

// CC-001 W18-03 (#288): the base-damage turn report must equal the
// authoritative HP change and never invent a reason.
public static partial class Program
{
    // Soft launch by the acting player, then Step until the turn ends,
    // observing the tracker every frame like BoardView does.
    static (BaseDamageTracker tracker,int[] loss) W18TurnReport(GameSimulation s,Action<GameSimulation,BallRuntime> afterLaunch=null)
    {
        var t=new BaseDamageTracker();t.Observe(s.State);
        int[] before={s.State.players[0].hp,s.State.players[1].hp};int owner=s.State.turn,turn=s.State.turnNumber;
        True(s.TryCommand(new PlayerCommand{owner=owner,turnNumber=turn,kind=CommandKind.Spawn,ballType="normal",dx=30,dy=owner==0?-60:60,power=150},out string why),why);
        afterLaunch?.Invoke(s,s.State.balls.Last());t.Observe(s.State);
        for(int i=0;i<6000&&s.State.turnNumber==turn&&s.State.phase!=MatchPhase.Over;i++){s.Step(1f/120);t.Observe(s.State);}
        return (t,new[]{before[0]-s.State.players[0].hp,before[1]-s.State.players[1].hp});
    }
    static BaseDamageKind[] W18Kinds(BaseDamageTracker t,int baseOwner)=>t.Latest.Entries.Where(e=>e.Base==baseOwner).Select(e=>e.Kind).ToArray();

    static void W18BaseDamageReportTests()
    {
        Test("W18-03 report equals the authoritative HP change: zone, centre, own-base centre, zone+centre mix, back wall, P2 turn",()=>{
            // zone only (P1 acting): single turn-end event against the defender -> honest ZONE OR CENTRE
            var s=W18Sim();s.Spawn(0,"normal",100,150);s.Spawn(0,"normal",440,150);
            var (t,loss)=W18TurnReport(s);True(t.Visible);Eq(2,loss[1]);Eq(0,loss[0]);Eq(loss[1],t.Latest.Total(1));Eq(0,t.Latest.Total(0));
            True(W18Kinds(t,1).SequenceEqual(new[]{BaseDamageKind.TurnEndPressure}));
            // centre lead of P2 during P1's turn hits P1's own base -> definitively CENTRE LEAD
            s=W18Sim();s.Spawn(1,"normal",250,450);s.Spawn(1,"normal",300,470);s.Spawn(1,"normal",270,400);
            (t,loss)=W18TurnReport(s);True(loss[0]>0,"no centre damage happened");Eq(loss[0],t.Latest.Total(0));Eq(loss[1],t.Latest.Total(1));
            True(W18Kinds(t,0).All(k=>k==BaseDamageKind.CentreLead));
            // zone + centre by P1 in one turn end -> two consecutive events: BALLS IN ZONE then CENTRE LEAD
            s=W18Sim();s.Spawn(0,"normal",100,150);s.Spawn(0,"normal",440,150);s.Spawn(0,"normal",230,450);s.Spawn(0,"normal",310,450);s.Spawn(0,"normal",270,400);
            (t,loss)=W18TurnReport(s);Eq(loss[1],t.Latest.Total(1));
            True(W18Kinds(t,1).SequenceEqual(new[]{BaseDamageKind.BallsInZone,BaseDamageKind.CentreLead}),string.Join(",",W18Kinds(t,1)));
            Eq(2,t.Latest.Entries.First(e=>e.Kind==BaseDamageKind.BallsInZone).Amount);
            // back wall: the launched ball is sent into P2's back wall, then rests in P2's zone
            s=W18Sim();
            (t,loss)=W18TurnReport(s,(sim,b)=>{b.x=150;b.y=90;b.vx=0;b.vy=-520;b.launchImmune=false;});
            True(loss[1]>=2,"no wall damage");Eq(loss[1],t.Latest.Total(1));
            var wall=t.Latest.Entries.Where(e=>e.Kind==BaseDamageKind.BackWall).ToList();True(wall.Count>=1);Eq("normal",wall[0].Detail);
            True(t.Latest.Entries.Where(e=>e.Base==1).All(e=>e.Kind!=BaseDamageKind.Unrecorded));
            // P2 acting: P2 balls in P1's zone damage P1, never P2
            s=W18Sim();s.State.turn=1;s.State.turnNumber=2;s.Spawn(1,"normal",100,760);s.Spawn(1,"normal",440,760);
            (t,loss)=W18TurnReport(s);Eq(2,loss[0]);Eq(0,loss[1]);Eq(2,t.Latest.Total(0));Eq(0,t.Latest.Total(1));
            Eq(0,BaseDamageTracker.Lines(t.Latest,1).Length);True(BaseDamageTracker.Lines(t.Latest,0)[0].StartsWith("P1 BASE -2 · TURN 2"));
        });
        Test("W18-03 event classification: wall, horizon, zone+centre pair, own-base centre, ambiguous single, unparsable",()=>{
            GameState S(params GameEvent[] ev){var st=new GameState();st.events.AddRange(ev);st.eventSerial=ev.Max(e=>e.id);return st;}
            GameEvent E(int id,string kind,string text,int turn=3,int ball=0)=>new GameEvent{id=id,kind=kind,text=text,turn=turn,ballId=ball};
            var t=new BaseDamageTracker();t.Observe(S(E(10,"TURN","Player 1")));
            var st=S(E(10,"TURN","Player 1"),E(11,"WALL_HIT","top",3,7),E(12,"BASE_DAMAGE","P2 base -2"),E(13,"BASE_DAMAGE","P2 base -1"),E(14,"HORIZON","x"),
                E(20,"BASE_DAMAGE","P2 base -2"),E(21,"BASE_DAMAGE","P1 base -1"),E(22,"TURN","Player 2",4));
            st.balls.Add(new BallRuntime{id=7,owner=0,type="bomb"});
            t.Observe(st);True(t.Visible);False(t.Latest.Incomplete);
            True(t.Latest.Entries.Select(e=>e.Kind).SequenceEqual(new[]{BaseDamageKind.BackWall,BaseDamageKind.HorizonRelay,BaseDamageKind.BallsInZone,BaseDamageKind.CentreLead}),string.Join(",",t.Latest.Entries.Select(e=>e.Kind)));
            Eq("bomb",t.Latest.Entries[0].Detail);Eq(5,t.Latest.Total(1));Eq(1,t.Latest.Total(0));
            var lines=BaseDamageTracker.Lines(t.Latest,1,x=>x=="bomb"?"Bomb":x);Eq("P2 BASE -5 · TURN 3",lines[0]);True(lines[1].Contains("BACK WALL (Bomb) -2")&&lines[1].Contains("HORIZON RELAY -1")&&lines[1].Contains("BALLS IN ZONE -2"));
            // P2 acting (turn 4): own base hit alone = centre; defender hit alone = ambiguous, never "zone"
            var u=new BaseDamageTracker();u.Observe(S(E(30,"TURN","x",4)));
            u.Observe(S(E(30,"TURN","x",4),E(31,"BASE_DAMAGE","P2 base -1",4),E(32,"STOP","",4),E(33,"BASE_DAMAGE","P1 base -3",4),E(34,"TURN","x",5)));
            Eq(BaseDamageKind.CentreLead,u.Latest.Entries[0].Kind);Eq(BaseDamageKind.TurnEndPressure,u.Latest.Entries[1].Kind);
            True(BaseDamageTracker.Lines(u.Latest,0)[1].Contains("ZONE OR CENTRE"));
            int b,a;False(BaseDamageTracker.TryParse("P3 base -1",out b,out a));False(BaseDamageTracker.TryParse("P1 base -x",out b,out a));False(BaseDamageTracker.TryParse(null,out b,out a));
            True(BaseDamageTracker.TryParse("P2 base -12",out b,out a));Eq(1,b);Eq(12,a);
            var v=new BaseDamageTracker();v.Observe(S(E(40,"TURN","x")));v.Observe(S(E(40,"TURN","x"),E(41,"BASE_DAMAGE","garbled"),E(42,"TURN","x",4)));True(v.Latest.Incomplete);Eq(0,v.Latest.Entries.Count);
        });
        Test("W18-03 no stale or stacked report: hidden at the next launch, replaced next turn, reset on reconnect/new match, missing events flagged",()=>{
            var s=W18Sim();s.Spawn(0,"normal",100,150);s.Spawn(0,"normal",440,150);
            var t=new BaseDamageTracker();t.Observe(s.State);
            True(s.TryCommand(new PlayerCommand{owner=0,turnNumber=1,kind=CommandKind.Spawn,ballType="normal",dx=30,dy=-60,power=150},out _));
            for(int i=0;i<6000&&s.State.turnNumber==1;i++){s.Step(1f/120);t.Observe(s.State);}
            True(t.Visible);var first=t.Latest;
            True(s.TryCommand(new PlayerCommand{owner=1,turnNumber=2,kind=CommandKind.Spawn,ballType="normal",dx=-20,dy=60,power=150},out string why),why);t.Observe(s.State);True(!t.Visible,"report survived the next launch");
            for(int i=0;i<6000&&s.State.phase==MatchPhase.Moving;i++){s.Step(1f/120);t.Observe(s.State);}
            True(ReferenceEquals(first,t.Latest)||t.Latest.Turn>first.Turn,"older report replaced a newer one");
            var reconnect=new GameState();reconnect.eventSerial=3;t.Observe(reconnect);False(t.Visible);True(t.Latest==null);
            var g=new BaseDamageTracker();var st=new GameState();st.events.Add(new GameEvent{id=5,kind="TURN"});st.eventSerial=5;g.Observe(st);
            st.events.Clear();st.events.Add(new GameEvent{id=9,kind="BASE_DAMAGE",text="P2 base -1",turn=3});st.events.Add(new GameEvent{id=10,kind="TURN",turn=4});st.eventSerial=10;g.Observe(st);
            True(g.Latest.Incomplete);True(BaseDamageTracker.Lines(g.Latest,1)[1].Contains("SOME EVENTS MISSING"));
        });
        Test("W18-03 every MatchRules.DamageBase caller is classified (wall, turn pressure x2, horizon) and the report is read-only",()=>{
            int calls=0;
            foreach(var f in Directory.GetFiles(Path.Combine(projectRoot,"Assets/CoreClash"),"*.cs",SearchOption.AllDirectories))
            {
                string text=File.ReadAllText(f);
                calls+=Regex.Matches(text,@"DamageBase\(").Count-Regex.Matches(text,@"void DamageBase\(").Count;
            }
            Eq(5,calls); // BallPhysics.Wall x2 (top/bottom), ApplyTurnPressure x2, Horizon Relay x1 (definition excluded)
            string board=File.ReadAllText(Path.Combine(projectRoot,"Assets/CoreClash/Presentation/BoardView.cs"));
            True(board.Contains("baseReport.Observe(state)")&&board.Contains("BaseDamageTracker.Lines("),"BoardView does not show the base damage report");
            string src=Regex.Replace(File.ReadAllText(Path.Combine(projectRoot,"Assets/CoreClash/Presentation/BaseDamageReport.cs")),@"//[^\n]*","");
            Eq(0,Regex.Matches(src,@"\.hp\s*[-+]?=|\.events\.(Add|Remove|Clear)|eventSerial\s*=").Count);
        });
    }
}
