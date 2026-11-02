using System;
using System.Globalization;

namespace CoreClash.Presentation
{
    // A34 W12: client-only, bounded sampling for physical PC1/PC2 performance QA.
    // Never mutates authoritative game state and never stores peer or session IDs.
    public sealed class RemoteVisualPacingTelemetry
    {
        const float WindowSeconds=5f;
        const int Capacity=512;
        const int GapCapacity=256;
        const float LongRxGapSeconds=0.3f; // above A41's legal 4Hz 250ms period
        readonly float[] frameSeconds=new float[Capacity];
        readonly float[] sortBuffer=new float[Capacity];
        readonly float[] rxGaps=new float[GapCapacity];
        readonly float[] rxGapSort=new float[GapCapacity];
        int cursor,samples,frames,snapshots;
        int gapCursor,gapSamples,gapCount,longRxGaps,postBlendWaitFrames;
        float windowStart=-1f,lastSnapshot=-1f,blendSeconds,waitSeconds,maxGap,movingSeconds;
        int lastActionSerial=int.MinValue;

        public int SnapshotCount=>snapshots;
        public void Reset()
        {
            cursor=samples=frames=snapshots=0;gapCursor=gapSamples=gapCount=longRxGaps=postBlendWaitFrames=0;
            windowStart=lastSnapshot=-1f;lastActionSerial=int.MinValue;
            blendSeconds=waitSeconds=maxGap=movingSeconds=0f;
        }
        static bool Finite(float f)=>!float.IsNaN(f)&&!float.IsInfinity(f);
        public void EndMoving()
        {
            lastSnapshot=-1f;blendSeconds=0f;lastActionSerial=int.MinValue;
        }
        // Caller must first admit a monotonic Protocol149 revision.
        public void AcceptSnapshot(float now,float chosenBlendSeconds,int actionSerial=int.MinValue)
        {
            if(!Finite(now)||now<0||!Finite(chosenBlendSeconds)||chosenBlendSeconds<0)return;
            // A rapid action transition may not carry a non-Moving packet.
            // Never count time between separate actions as client RX jitter.
            if(actionSerial!=int.MinValue&&lastActionSerial!=int.MinValue&&actionSerial!=lastActionSerial)
                lastSnapshot=-1f;
            if(lastSnapshot>=0)
            {
                float interval=now-lastSnapshot;
                // Unity's clock can rewind on lifecycle changes. The snapshot is
                // already admitted by the caller; rebaseline and COUNT it, rather
                // than silently losing this valid receiver observation.
                if(interval<0)Reset();
                else
                {
                if(interval>maxGap)maxGap=interval;
                rxGaps[gapCursor]=interval;
                gapCursor=(gapCursor+1)%GapCapacity;
                if(gapSamples<GapCapacity)gapSamples++;
                gapCount++;
                if(interval>LongRxGapSeconds)longRxGaps++;
                }
            }
            lastSnapshot=now;blendSeconds=chosenBlendSeconds;
            if(actionSerial!=int.MinValue)lastActionSerial=actionSerial;
            snapshots++;
        }
        public bool SampleFrame(float now,float deltaSeconds,bool moving,out string evidence)
        {
            evidence=null;
            // Long frames are exactly the stutters this instrument must capture.
            // Reject invalid clocks, never valid >1s stalls (which previously
            // disappeared from P95/FPS and could mask severe PC2 freezes).
            if(!Finite(now)||now<0||!Finite(deltaSeconds)||deltaSeconds<=0)return false;
            if(windowStart<0)windowStart=now;
            if(now<windowStart){Reset();windowStart=now;}
            if(moving)
            {
                frameSeconds[cursor]=deltaSeconds;
                cursor=(cursor+1)%Capacity;
                if(samples<Capacity)samples++;
                frames++;
                movingSeconds+=deltaSeconds;
                // A34 W14: a zero-length blend means a hard snap or no visual
                // motion. It must not accrue any phantom "post-blend wait".
                if(lastSnapshot>=0&&blendSeconds>0f)
                {
                    float age=now-lastSnapshot;
                    // Time beyond the bounded interpolation interval, not "ball stopped".
                    // No clocks from different PCs are compared here.
                    if(age>blendSeconds){
                        waitSeconds+=Math.Min(deltaSeconds,age-blendSeconds);
                        postBlendWaitFrames++;
                    }
                }
            }
            float elapsed=now-windowStart;
            if(elapsed<WindowSeconds)return false;
            if(frames>0)
            {
                Array.Copy(frameSeconds,sortBuffer,samples);
                Array.Sort(sortBuffer,0,samples);
                int index=Math.Max(0,(int)Math.Ceiling(samples*0.95f)-1);
                float p95=sortBuffer[index]*1000f;
                float fps=movingSeconds>0?frames/movingSeconds:0f;
                string gapP95="NA";
                if(gapSamples>0){
                    Array.Copy(rxGaps,rxGapSort,gapSamples);
                    Array.Sort(rxGapSort,0,gapSamples);
                    int gapIndex=Math.Max(0,(int)Math.Ceiling(gapSamples*0.95f)-1);
                    gapP95=F(rxGapSort[gapIndex]*1000f);
                }
                // P95 is based on the most recent <=512 frames in the window.
                // No peer ID, IP, payload contents, deck or ball identity.
                evidence="CC_W12_VISUAL_P2 elapsed="+F(elapsed)+
                    " frames="+frames+" frameSamples="+samples+
                    " fps="+F(fps)+" frameP95ms="+F(p95)+
                    " snapshots="+snapshots+" maxRxGapMs="+F(maxGap*1000f)+
                    " rxGapP95ms="+gapP95+" rxGapSamples="+gapSamples+
                    " rxGaps="+gapCount+" rxGapsOver300ms="+longRxGaps+
                    " postBlendWaitMs="+F(waitSeconds*1000f)+
                    " postBlendWaitFrames="+postBlendWaitFrames;
            }
            windowStart=now;cursor=samples=frames=snapshots=0;
            gapCursor=gapSamples=gapCount=longRxGaps=postBlendWaitFrames=0;
            waitSeconds=maxGap=movingSeconds=0f;
            return evidence!=null;
        }
        static string F(float number)=>number.ToString("0.###",CultureInfo.InvariantCulture);
    }
}
