using System;
using System.Globalization;
using System.Linq;
using System.Text;
using CoreClash.Core;

namespace CoreClash.Presentation
{
    // W14 A33: operator-only diagnostic sample of existing state and rendered poses.
    // A sample is not a state digest, physical-PC observation or network parity proof.
    public static class QaPoseEvidence
    {
        public const int MaxBallRows=24;

        static string Float(float value)=>value.ToString("R",CultureInfo.InvariantCulture);

        public static string Capture(GameState state,RemoteBallSmoother smoother,float unscaledTime,int focusBallId=0)
        {
            if(state==null)return "POSE_SAMPLE=UNAVAILABLE / NULL_STATE\nPOSE_PARITY_PROOF=NO";
            var live=(state.balls??new System.Collections.Generic.List<BallRuntime>())
                .Where(b=>b!=null&&!b.dead&&!b.banished)
                .OrderBy(b=>b.id).ToArray();
            int sampled=Math.Min(MaxBallRows,live.Length);
            // If the operator inspects a live ball outside the first 24 ids,
            // reserve one row for it. Do not silently drop the debug target.
            BallRuntime focused=focusBallId>0?live.FirstOrDefault(b=>b.id==focusBallId):null;
            bool focusOutsideFirst=focused!=null&&sampled>0&&!live.Take(sampled).Any(b=>b.id==focusBallId);
            var sampledBalls=focusOutsideFirst
                ?live.Take(sampled-1).Concat(new[]{focused}).OrderBy(b=>b.id).ToArray()
                :live.Take(sampled).ToArray();
            string focusStatus=focusBallId<=0?"NONE":focused==null?"NOT_ACTIVE":"INCLUDED";
            var sb=new StringBuilder(128+sampled*160);
            sb.Append("POSE_SAMPLE=CANONICAL_STATE_PLUS_LOCAL_RENDER / ADVISORY_ONLY")
                .Append("\nPHASE=").Append(state.phase)
                .Append(" / UNITY_UNSCALED_TIME=").Append(Float(unscaledTime))
                .Append("\nACTIVE_BALL_COUNT=").Append(live.Length)
                .Append(" / SAMPLED=").Append(sampled)
                .Append(" / TRUNCATED=").Append(live.Length-sampled)
                .Append(" / FOCUS_ID=").Append(focusBallId)
                .Append(" / FOCUS_STATUS=").Append(focusStatus);
            for(int i=0;i<sampled;i++)
            {
                var b=sampledBalls[i];
                float displayX=b.x,displayY=b.y;
                bool interpolated=state.phase==MatchPhase.Moving && smoother!=null &&
                    smoother.TryGetPosition(b.id,unscaledTime,out displayX,out displayY);
                if(!interpolated){displayX=b.x;displayY=b.y;}
                sb.Append("\nBALL ID=").Append(b.id)
                    .Append(" OWNER=").Append(b.owner)
                    .Append(" HP=").Append(b.hp)
                    .Append(" STATE_X=").Append(Float(b.x))
                    .Append(" STATE_Y=").Append(Float(b.y))
                    .Append(" RENDER_X=").Append(Float(displayX))
                    .Append(" RENDER_Y=").Append(Float(displayY))
                    .Append(" RENDER_MODE=").Append(interpolated?"SMOOTHED":"CANONICAL");
            }
            return sb.Append("\nRENDER_POSE_PARITY_PROOF=NO / COMPARE ONLY SAME ACCEPTED REVISION")
                .ToString();
        }
    }
}
