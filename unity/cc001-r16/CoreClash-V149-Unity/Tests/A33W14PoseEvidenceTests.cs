using System;
using System.Linq;
using CoreClash.Core;
using CoreClash.Presentation;

public static partial class Program
{
    static void A33W14PoseEvidenceTests()
    {
        Test("A33 W14 null state is explicitly not a parity proof",()=>{
            var text=QaPoseEvidence.Capture(null,null,0f);
            True(text.Contains("NULL_STATE")&&text.Contains("POSE_PARITY_PROOF=NO"));
        });
        Test("A33 W14 sample sorts ball ids independently of source order",()=>{
            var s=new GameState();
            s.balls.Add(new BallRuntime{id=42,owner=1,x=2f,y=3f,hp=11});
            s.balls.Add(new BallRuntime{id=3,owner=0,x=7.5f,y=9f,hp=20});
            var t=QaPoseEvidence.Capture(s,null,0f);
            True(t.IndexOf("BALL ID=3 ")<t.IndexOf("BALL ID=42 "),"unstable ball order");
            True(t.Contains("OWNER=0 HP=20 STATE_X=7.5 STATE_Y=9"));
        });
        Test("A33 W14 omits dead banished and null entries",()=>{
            var s=new GameState();
            s.balls.Add(null);
            s.balls.Add(new BallRuntime{id=1,dead=true});
            s.balls.Add(new BallRuntime{id=2,banished=true});
            s.balls.Add(new BallRuntime{id=3,owner=1,hp=8,x=1,y=2});
            var t=QaPoseEvidence.Capture(s,null,0);
            True(t.Contains("ACTIVE_BALL_COUNT=1 / SAMPLED=1 / TRUNCATED=0"));
            True(t.Contains("BALL ID=3 ")&&!t.Contains("BALL ID=2 ")&&!t.Contains("BALL ID=1 "));
        });
        Test("A33 W14 cap exposes exact truncated live row count",()=>{
            var s=new GameState();
            for(int i=1;i<=27;i++)s.balls.Add(new BallRuntime{id=i,owner=i%2});
            var t=QaPoseEvidence.Capture(s,null,0f);
            True(t.Contains("ACTIVE_BALL_COUNT=27 / SAMPLED=24 / TRUNCATED=3"));
            Eq(24,t.Split(new[]{"BALL ID="},StringSplitOptions.None).Length-1);
            False(t.Contains("BALL ID=25 "));
        });
        Test("A33 W14 read-only capture does not change positions or revision",()=>{
            var s=new GameState{revision=19,actionSerial=6,phase=MatchPhase.Moving};
            var b=new BallRuntime{id=9,owner=1,x=123.456f,y=789.123f,vx=30f,vy=-40f,hp=7};
            s.balls.Add(b);
            var beforeX=b.x;var beforeY=b.y;
            var t=QaPoseEvidence.Capture(s,null,12.34f);
            Eq(beforeX,b.x);Eq(beforeY,b.y);Eq(19,s.revision);Eq(6,s.actionSerial);
            True(t.Contains("RENDER_MODE=CANONICAL")&&t.Contains("RENDER_POSE_PARITY_PROOF=NO"));
        });
        Test("A33 W14 moving snapshot records smoother drawn pose separately",()=>{
            var s=new GameState{phase=MatchPhase.Moving,actionSerial=7,frame=1};
            var b=new BallRuntime{id=9,owner=1,type="normal",x=80f,y=100f,hp=10};
            s.balls.Add(b);
            var smoother=new RemoteBallSmoother();
            smoother.Observe(s,0f,null,1);
            s.frame=2;b.x=160f;
            smoother.Observe(s,0.1f,null,2);
            var t=QaPoseEvidence.Capture(s,smoother,0.15f);
            True(t.Contains("STATE_X=160"),"canonical snapshot position changed");
            True(t.Contains("RENDER_MODE=SMOOTHED"),"missing client draw pose");
            False(t.Contains("RENDER_X=160 RENDER_Y=100"),"intermediate pose must differ from canonical");
            Eq(160f,b.x);
        });
        Test("A33 W14 aiming phase cannot label a stale smoother as visible",()=>{
            var s=new GameState{phase=MatchPhase.Aiming};
            s.balls.Add(new BallRuntime{id=5,x=10f,y=20f});
            var t=QaPoseEvidence.Capture(s,new RemoteBallSmoother(),0.2f);
            True(t.Contains("RENDER_MODE=CANONICAL"));
            True(t.Contains("RENDER_X=10 RENDER_Y=20"));
        });
        // W15: with >24 balls the investigated runtime ball must never be
        // silently omitted by the lower-id bounded sample.
        Test("A33 W15 focused tail ball is retained without exceeding cap",()=>{
            var s=new GameState();
            for(int i=1;i<=27;i++)s.balls.Add(new BallRuntime{id=i,owner=i%2,hp=i,x=i*2f,y=i*3f});
            var text=QaPoseEvidence.Capture(s,null,0f,27);
            True(text.Contains("ACTIVE_BALL_COUNT=27 / SAMPLED=24 / TRUNCATED=3"));
            True(text.Contains("FOCUS_ID=27 / FOCUS_STATUS=INCLUDED"));
            Eq(24,text.Split(new[]{"BALL ID="},StringSplitOptions.None).Length-1);
            True(text.Contains("BALL ID=27 ")&&text.Contains("BALL ID=23 "));
            False(text.Contains("BALL ID=24 ")||text.Contains("BALL ID=25 ")||text.Contains("BALL ID=26 "));
            True(text.IndexOf("BALL ID=23 ")<text.IndexOf("BALL ID=27 "));
        });
        Test("A33 W15 focus already sampled does not duplicate ball",()=>{
            var s=new GameState();
            for(int i=1;i<=28;i++)s.balls.Add(new BallRuntime{id=i});
            var text=QaPoseEvidence.Capture(s,null,0f,5);
            True(text.Contains("FOCUS_ID=5 / FOCUS_STATUS=INCLUDED"));
            Eq(24,text.Split(new[]{"BALL ID="},StringSplitOptions.None).Length-1);
            Eq(1,text.Split(new[]{"BALL ID=5 "},StringSplitOptions.None).Length-1);
            True(text.Contains("BALL ID=24 "));False(text.Contains("BALL ID=25 "));
        });
        Test("A33 W15 missing focus is explicitly not active",()=>{
            var s=new GameState();
            for(int i=1;i<=26;i++)s.balls.Add(new BallRuntime{id=i});
            var text=QaPoseEvidence.Capture(s,null,0f,70);
            True(text.Contains("FOCUS_ID=70 / FOCUS_STATUS=NOT_ACTIVE"));
            True(text.Contains("BALL ID=24 "));False(text.Contains("BALL ID=70 "));
            Eq(24,text.Split(new[]{"BALL ID="},StringSplitOptions.None).Length-1);
        });
        Test("A33 W15 banished or dead focused ball is not falsely included",()=>{
            var s=new GameState();
            s.balls.Add(new BallRuntime{id=41,banished=true});
            s.balls.Add(new BallRuntime{id=42,dead=true});
            s.balls.Add(new BallRuntime{id=43,hp=5});
            var a=QaPoseEvidence.Capture(s,null,0f,41);
            var b=QaPoseEvidence.Capture(s,null,0f,42);
            True(a.Contains("FOCUS_STATUS=NOT_ACTIVE")&&b.Contains("FOCUS_STATUS=NOT_ACTIVE"));
            False(a.Contains("BALL ID=41 ")||b.Contains("BALL ID=42 "));
            True(b.Contains("BALL ID=43 "));
        });
        Test("A33 W15 no inspected ball retains original stable first 24",()=>{
            var s=new GameState();
            for(int i=30;i>=1;i--)s.balls.Add(new BallRuntime{id=i});
            var text=QaPoseEvidence.Capture(s,null,0f);
            True(text.Contains("FOCUS_ID=0 / FOCUS_STATUS=NONE"));
            Eq(24,text.Split(new[]{"BALL ID="},StringSplitOptions.None).Length-1);
            True(text.Contains("BALL ID=24 "));False(text.Contains("BALL ID=25 "));
        });
        Test("A33 W14 no hidden full-state or physical-PC parity claim",()=>{
            var s=new GameState();
            var t=QaPoseEvidence.Capture(s,null,0);
            True(t.Contains("ADVISORY_ONLY")&&t.Contains("RENDER_POSE_PARITY_PROOF=NO"));
            False(t.Contains("G3_STATUS=PASS"));
        });
    }
}
