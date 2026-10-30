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
        readonly float[] frameSeconds=new float[Capacity];
        readonly float[] sortBuffer=new float[Capacity];
        int cursor,samples,frames,snapshots;
        float windowStart=-1f,lastSnapshot=-1f,blendSeconds,waitSeconds,maxGap,movingSeconds;

        public int SnapshotCount=>snapshots;
        public void Reset()
        {
            cursor=samples=frames=snapshots=0;windowStart=lastSnapshot=-1f;
            blendSeconds=waitSeconds=maxGap=movingSeconds=0f;
        }
        static bool Finite(float f)=>!float.IsNaN(f)&&!float.IsInfinity(f);
        public void EndMoving()
        {
            lastSnapshot=-1f;blendSeconds=0f;
        }
        // Caller must first admit a monotonic Protocol149 revision.
        public void AcceptSnapshot(float now,float chosenBlendSeconds)
        {
            if(!Finite(now)||now<0||!Finite(chosenBlendSeconds)||chosenBlendSeconds<0)return;
            if(lastSnapshot>=0)
            {
                float interval=now-lastSnapshot;
                if(interval<0){Reset();return;}
                if(interval>maxGap)maxGap=interval;
            }
            lastSnapshot=now;blendSeconds=chosenBlendSeconds;
            snapshots++;
        }
        public bool SampleFrame(float now,float deltaSeconds,bool moving,out string evidence)
        {
            evidence=null;
            if(!Finite(now)||now<0||!Finite(deltaSeconds)||deltaSeconds<=0||deltaSeconds>1)return false;
            if(windowStart<0)windowStart=now;
            if(now<windowStart){Reset();windowStart=now;}
            if(moving)
            {
                frameSeconds[cursor]=deltaSeconds;
                cursor=(cursor+1)%Capacity;
                if(samples<Capacity)samples++;
                frames++;
                movingSeconds+=deltaSeconds;
                if(lastSnapshot>=0)
                {
                    float age=now-lastSnapshot;
                    // Time beyond the bounded interpolation interval, not "ball stopped".
                    // No clocks from different PCs are compared here.
                    if(age>blendSeconds)
                        waitSeconds+=Math.Min(deltaSeconds,age-blendSeconds);
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
                // P95 is based on the most recent <=512 frames in the window.
                // No peer ID, IP, payload contents, deck or ball identity.
                evidence="CC_W12_VISUAL_P2 elapsed="+F(elapsed)+
                    " frames="+frames+" frameSamples="+samples+
                    " fps="+F(fps)+" frameP95ms="+F(p95)+
                    " snapshots="+snapshots+" maxRxGapMs="+F(maxGap*1000f)+
                    " postBlendWaitMs="+F(waitSeconds*1000f);
            }
            windowStart=now;cursor=samples=frames=snapshots=0;
            waitSeconds=maxGap=movingSeconds=0f;
            return evidence!=null;
        }
        static string F(float number)=>number.ToString("0.###",CultureInfo.InvariantCulture);
    }
}
