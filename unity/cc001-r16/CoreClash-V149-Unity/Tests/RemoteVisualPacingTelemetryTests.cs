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
        Test("A34 W12 no future prediction and post-blend wait accounted per frame",()=>{
            var p=new RemoteVisualPacingTelemetry();
            p.AcceptSnapshot(1f,.05f);
            False(p.SampleFrame(1f,.01f,true,out _));
            False(p.SampleFrame(1.1f,.02f,true,out _));
            True(p.SampleFrame(6.1f,.01f,true,out var line));
            True(line.Contains("postBlendWaitMs=30"));
        });
        Test("A34 W12 invalid clocks cannot poison a valid pacing window",()=>{
            var p=new RemoteVisualPacingTelemetry();
            False(p.SampleFrame(float.NaN,.01f,true,out _));
            False(p.SampleFrame(1f,float.PositiveInfinity,true,out _));
            False(p.SampleFrame(1f,-.2f,true,out _));
            False(p.SampleFrame(1f,5f,true,out _));
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
