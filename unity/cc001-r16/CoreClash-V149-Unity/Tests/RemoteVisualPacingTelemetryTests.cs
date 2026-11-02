using CoreClash.Presentation;

public static partial class Program
{
    static void RemoteVisualPacingTelemetryTests()
    {
        Test("A34 W12 visual P2 samples wait for five seconds before emitting",()=>{
            var p=new RemoteVisualPacingTelemetry();
            p.AcceptSnapshot(1f,.05f);
            False(p.SampleFrame(1f,.016f,true,out _));
            False(p.SampleFrame(4.99f,.016f,true,out _));
            True(p.SampleFrame(6.01f,.016f,true,out var line));
            True(line.Contains("CC_W12_VISUAL_P2"));
            True(line.Contains("frames=3"));
            True(line.Contains("snapshots=1"));
            True(line.Contains("frameSamples=3"));
        });
        Test("A34 W12 accepted P2 snapshot gaps and frame p95 are reported",()=>{
            var p=new RemoteVisualPacingTelemetry();
            p.AcceptSnapshot(1f,.05f);
            p.AcceptSnapshot(1.05f,.05f);
            p.AcceptSnapshot(1.30f,.25f);
            False(p.SampleFrame(1.30f,.01f,true,out _));
            False(p.SampleFrame(1.40f,.04f,true,out _));
            True(p.SampleFrame(6.31f,.02f,true,out var line));
            True(line.Contains("snapshots=3"));
            True(line.Contains("maxRxGapMs=250"));
            True(line.Contains("frameP95ms=40"));
        });
        Test("A34 W14 zero-length visual snap never creates fake post-blend wait",()=>{
            var p=new RemoteVisualPacingTelemetry();
            p.AcceptSnapshot(1f,0f,10);
            False(p.SampleFrame(1f,.01f,true,out _));
            False(p.SampleFrame(1.1f,.02f,true,out _));
            True(p.SampleFrame(6.1f,.01f,true,out var line));
            True(line.Contains("postBlendWaitMs=0"));
            True(line.Contains("postBlendWaitFrames=0"));
            True(line.Contains("snapshots=1"));
        });
        Test("A34 W14 transitioning from motion to instant warp stops wait accrual",()=>{
            var p=new RemoteVisualPacingTelemetry();
            p.AcceptSnapshot(1f,.05f,10);
            False(p.SampleFrame(1f,.01f,true,out _));
            False(p.SampleFrame(1.1f,.02f,true,out _));
            p.AcceptSnapshot(1.15f,0f,10);
            False(p.SampleFrame(1.2f,.02f,true,out _));
            True(p.SampleFrame(6.1f,.01f,true,out var line));
            True(line.Contains("postBlendWaitMs=20"));
            True(line.Contains("postBlendWaitFrames=1"));
            True(line.Contains("snapshots=2"));
        });
        Test("A34 W12 no future prediction and post-blend wait accounted per frame",()=>{
            var p=new RemoteVisualPacingTelemetry();
            p.AcceptSnapshot(1f,.05f);
            False(p.SampleFrame(1f,.01f,true,out _));
            False(p.SampleFrame(1.1f,.02f,true,out _));
            True(p.SampleFrame(6.1f,.01f,true,out var line));
            True(line.Contains("postBlendWaitMs=30"));
        });
        Test("A34 W15 2.5-second frame freeze is counted and raises frame P95",()=>{
            var p=new RemoteVisualPacingTelemetry();
            False(p.SampleFrame(1f,.016f,true,out _));
            False(p.SampleFrame(3.5f,2.5f,true,out _));
            True(p.SampleFrame(6.1f,.016f,true,out var line));
            True(line.Contains("frames=3"));
            True(line.Contains("frameP95ms=2500"));
            True(line.Contains("frameSamples=3"));
        });
        Test("A34 W15 >1s frame stall remains visible at low sample count",()=>{
            var p=new RemoteVisualPacingTelemetry();
            False(p.SampleFrame(1f,1.25f,true,out _));
            True(p.SampleFrame(6.01f,.016f,true,out var line));
            True(line.Contains("frames=2"));
            True(line.Contains("frameP95ms=1250"));
        });
        Test("A34 W15 receiver clock rollback keeps the newly accepted snapshot",()=>{
            var p=new RemoteVisualPacingTelemetry();
            p.AcceptSnapshot(4f,.05f,8);
            p.AcceptSnapshot(3f,.05f,8); // actual accepted packet at rewound clock
            Eq(1,p.SnapshotCount);
            p.AcceptSnapshot(3.25f,.25f,8);
            Eq(2,p.SnapshotCount);
            False(p.SampleFrame(3.25f,.016f,true,out _));
            True(p.SampleFrame(8.26f,.016f,true,out var line));
            True(line.Contains("snapshots=2"));
            True(line.Contains("rxGaps=1"));
            True(line.Contains("maxRxGapMs=250"));
        });
        Test("A34 W12 invalid clocks cannot poison a valid pacing window",()=>{
            var p=new RemoteVisualPacingTelemetry();
            False(p.SampleFrame(float.NaN,.01f,true,out _));
            False(p.SampleFrame(1f,float.PositiveInfinity,true,out _));
            False(p.SampleFrame(1f,-.2f,true,out _));
            False(p.SampleFrame(1f,float.NaN,true,out _));
            p.AcceptSnapshot(float.NaN,.05f);
            p.AcceptSnapshot(1f,float.NaN);
            False(p.SampleFrame(1f,.016f,true,out _));
            True(p.SampleFrame(6.01f,.016f,true,out var line));
            True(line.Contains("snapshots=0"));
            True(line.Contains("frames=2"));
        });
        Test("A34 W12 sample ring is fixed size at high rendering density",()=>{
            var p=new RemoteVisualPacingTelemetry();
            p.AcceptSnapshot(0f,.05f);
            for(int i=0;i<650;i++){
                float now=i*.007f;
                False(p.SampleFrame(now,.007f,true,out _));
            }
            True(p.SampleFrame(5.10f,.007f,true,out var line));
            True(line.Contains("frames=651"));
            True(line.Contains("frameSamples=512"));
            True(line.Contains("frameP95ms=7"));
        });
        Test("A34 W12 end-moving and session reset clear stale timing",()=>{
            var p=new RemoteVisualPacingTelemetry();
            p.AcceptSnapshot(1f,.2f);
            p.EndMoving();
            False(p.SampleFrame(1f,.01f,false,out _));
            p.Reset();
            Eq(0,p.SnapshotCount);
            False(p.SampleFrame(2f,.016f,true,out _));
            True(p.SampleFrame(7.01f,.016f,true,out var line));
            True(line.Contains("snapshots=0"));
        });
        Test("A34 W13 regular 4Hz receiver gaps are legal, not long-gap alerts",()=>{
            var p=new RemoteVisualPacingTelemetry();
            p.AcceptSnapshot(1f,0f);
            p.AcceptSnapshot(1.25f,.25f);
            p.AcceptSnapshot(1.5f,.25f);
            p.AcceptSnapshot(1.75f,.25f);
            p.AcceptSnapshot(2f,.25f);
            False(p.SampleFrame(1f,.016f,true,out _));
            True(p.SampleFrame(6.01f,.016f,true,out var line));
            True(line.Contains("rxGapP95ms=250"));
            True(line.Contains("rxGapSamples=4"));
            True(line.Contains("rxGaps=4"));
            True(line.Contains("rxGapsOver300ms=0"));
        });
        Test("A34 W13 380ms receiver jitter recorded without claiming packet loss",()=>{
            var p=new RemoteVisualPacingTelemetry();
            p.AcceptSnapshot(1f,0f);
            p.AcceptSnapshot(1.25f,.25f);
            p.AcceptSnapshot(1.63f,.25f);
            p.AcceptSnapshot(1.9f,.25f);
            False(p.SampleFrame(1f,.016f,true,out _));
            True(p.SampleFrame(6.01f,.016f,true,out var line));
            True(line.Contains("rxGapP95ms=380"));
            True(line.Contains("rxGapsOver300ms=1"));
            True(line.Contains("rxGaps=3"));
        });
        Test("A34 W13 RX ring holds only last 256 gaps and retains full interval count",()=>{
            var p=new RemoteVisualPacingTelemetry();
            for(int i=0;i<300;i++)p.AcceptSnapshot(1f+i*.01f,.01f);
            False(p.SampleFrame(1f,.016f,true,out _));
            True(p.SampleFrame(6.01f,.016f,true,out var line));
            True(line.Contains("rxGapSamples=256"));
            True(line.Contains("rxGaps=299"));
            True(line.Contains("snapshots=300"));
        });
        Test("A34 W13 insufficient gap evidence reports NA, never fabricated zero",()=>{
            var p=new RemoteVisualPacingTelemetry();
            p.AcceptSnapshot(1f,0f);
            False(p.SampleFrame(1f,.016f,true,out _));
            True(p.SampleFrame(6.01f,.016f,true,out var line));
            True(line.Contains("rxGapP95ms=NA"));
            True(line.Contains("rxGapSamples=0"));
            True(line.Contains("rxGapsOver300ms=0"));
        });
        Test("A34 W13 fast action transition does not resemble RX stall",()=>{
            var p=new RemoteVisualPacingTelemetry();
            p.AcceptSnapshot(1f,.05f,4);
            p.AcceptSnapshot(1.25f,.25f,4);
            p.AcceptSnapshot(3f,0f,5); // new turn, still Moving
            False(p.SampleFrame(3f,.016f,true,out _));
            True(p.SampleFrame(8.01f,.016f,true,out var line));
            True(line.Contains("snapshots=3"));
            True(line.Contains("rxGaps=1"));
            True(line.Contains("rxGapsOver300ms=0"));
            True(line.Contains("maxRxGapMs=250"));
        });
        Test("A34 W13 end moving resets RX gap baseline between turns",()=>{
            var p=new RemoteVisualPacingTelemetry();
            p.AcceptSnapshot(1f,.05f);
            p.EndMoving();
            p.AcceptSnapshot(3f,0f);
            False(p.SampleFrame(3f,.016f,true,out _));
            True(p.SampleFrame(8.01f,.016f,true,out var line));
            True(line.Contains("rxGapSamples=0"));
            True(line.Contains("maxRxGapMs=0"));
        });
        Test("A34 W12 one summary per window and no network/private fields",()=>{
            var p=new RemoteVisualPacingTelemetry();
            p.AcceptSnapshot(1f,.05f);
            False(p.SampleFrame(1f,.016f,true,out _));
            True(p.SampleFrame(6.1f,.016f,true,out var line));
            False(line.Contains("peer"));False(line.Contains("ip="));
            False(line.Contains("room="));False(line.Contains("stateJson"));
            False(p.SampleFrame(6.2f,.016f,true,out _));
        });
    }
}
