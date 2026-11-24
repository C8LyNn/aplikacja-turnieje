using System;
using System.Collections.Generic;

namespace CoreClash.Presentation
{
    // CC-001 W24 (owner, after playing: "the balls still stutter a little"). A frame that is locked
    // to the display is shown for exactly one refresh, but the clock that measures it wobbles by a
    // fraction of a millisecond either way, and a simulation fed with the wobbling time moves the
    // balls a little more in one frame and a little less in the next. This hands the simulation
    // whole frames instead: the measured time rounded to the display's period. What the rounding
    // leaves over is carried and paid back a twentieth at a time, so no time is lost or made up,
    // and two clocks that drift apart slowly (the display's and the computer's always do) never add
    // up to a frame given twice. When the game is not locked to a display (no period given) the
    // measured time passes through untouched.
    public sealed class FrameClock
    {
        // The share of what is owed that goes into each frame.
        public const double PayBack=.05;
        double owed;

        public float Next(float measured,float period)
        {
            if(!(measured>0)||float.IsInfinity(measured))return 0;
            // Not locked to a display, or a real pause (the window was dragged, a long hitch).
            if(!(period>0)||measured>period*6.5f){owed=0;return measured;}
            double want=measured+owed;
            // Well short of one period: the frames do not keep this period after all. Start again.
            if(want<period*.6){owed=0;return measured;}
            double frames=Math.Max(1,Math.Round(want/period)),given=frames*period;
            owed=want-given;
            double pay=owed*PayBack;owed-=pay;
            return (float)(given+pay);
        }

        // The period the game's frames are locked to: that of a display, or a whole multiple of it
        // when v-sync skips refreshes, which the measured frame rate matches within three percent.
        // 0 when it matches none - then the frames are not locked and must not be rounded.
        public static float LockedPeriod(float framesPerSecond,IEnumerable<float> displayRates)
        {
            if(!(framesPerSecond>1)||displayRates==null)return 0;
            float best=0,bestError=.03f;
            foreach(float rate in displayRates)
            {
                if(!(rate>=30))continue;
                for(int skip=1;skip<=4;skip++)
                {
                    float candidate=rate/skip,error=Math.Abs(framesPerSecond-candidate)/candidate;
                    if(error<bestError){bestError=error;best=skip/rate;}
                }
            }
            return best;
        }
    }
}
