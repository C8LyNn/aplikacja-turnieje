using System;
using System.Collections.Generic;
using CoreClash.Core;

namespace CoreClash.Physics
{
    // Client presentation helper only. Never writes GameState, resolves physics,
    // predicts commands, or changes the Protocol 149 snapshot transport.
    // A presentation owner must explicitly wire this to client-only rendering.
    public sealed class RemoteBallPoseSmoother
    {
        sealed class Segment
        {
            public int owner;
            public string type;
            public float fromX, fromY, toX, toY, startAt, duration;
        }

        readonly Dictionary<int, Segment> tracks = new Dictionary<int, Segment>();
        readonly float fallbackSeconds, minSeconds, maxSeconds, snapDistanceSquared;
        bool hasReceipt;
        float lastReceipt;
        public int LastAcceptedRevision { get; private set; } = -1;
        public int TrackedCount => tracks.Count;

        // 0.20s matches the current moving-state broadcast cadence. The cap
        // handles delayed/coalesced network arrivals without endless animation.
        public RemoteBallPoseSmoother(float fallbackSeconds = .20f,
            float minSeconds = .05f, float maxSeconds = .35f, float snapDistance = 300f)
        {
            if (!Valid(fallbackSeconds) || !Valid(minSeconds) || !Valid(maxSeconds) ||
                !Valid(snapDistance) || minSeconds <= 0 || minSeconds > maxSeconds ||
                fallbackSeconds < minSeconds || fallbackSeconds > maxSeconds ||
                snapDistance <= 0)
                throw new ArgumentOutOfRangeException(nameof(fallbackSeconds));
            this.fallbackSeconds = fallbackSeconds;
            this.minSeconds = minSeconds;
            this.maxSeconds = maxSeconds;
            snapDistanceSquared = snapDistance * snapDistance;
        }

        static bool Valid(float f) => !float.IsNaN(f) && !float.IsInfinity(f);
        static float Clamp(float value, float min, float max) => Math.Max(min, Math.Min(max, value));

        static void Sample(Segment track, float now, out float x, out float y)
        {
            float t = Clamp((now - track.startAt) / track.duration, 0, 1);
            x = track.fromX + (track.toX - track.fromX) * t;
            y = track.fromY + (track.toY - track.fromY) * t;
        }

        // A new snapshot may mark genuine teleport-event IDs to snap immediately,
        // even if their displacement is below the distance threshold.
        // Only accepted, increasing *transport* snapshot revisions are allowed.
        // GameState.revision is not a per-physics-tick counter.
        public bool AcceptSnapshot(int snapshotRevision, GameState authoritative, float receivedAt,
            ISet<int> instantBallIds = null)
        {
            if (snapshotRevision <= LastAcceptedRevision || authoritative == null ||
                authoritative.balls == null || !Valid(receivedAt) ||
                (hasReceipt && receivedAt < lastReceipt))
                return false;

            float duration = hasReceipt ?
                Clamp(receivedAt - lastReceipt, minSeconds, maxSeconds) : fallbackSeconds;
            var next = new Dictionary<int, Segment>();

            foreach (BallRuntime ball in authoritative.balls)
            {
                if (ball == null || ball.dead || ball.banished ||
                    !Valid(ball.x) || !Valid(ball.y) || next.ContainsKey(ball.id))
                    continue;

                float fromX = ball.x, fromY = ball.y;
                if ((instantBallIds == null || !instantBallIds.Contains(ball.id)) &&
                    tracks.TryGetValue(ball.id, out Segment previous) &&
                    previous.owner == ball.owner && previous.type == ball.type)
                {
                    float dx = ball.x - previous.toX, dy = ball.y - previous.toY;
                    if (dx * dx + dy * dy < snapDistanceSquared)
                        Sample(previous, receivedAt, out fromX, out fromY);
                    // Large authoritative jumps (teleport/resets) are intentional.
                    // Never animate a reused ID, a different owner/type, or a new ball.
                }

                next[ball.id] = new Segment
                {
                    owner = ball.owner, type = ball.type,
                    fromX = fromX, fromY = fromY, toX = ball.x, toY = ball.y,
                    startAt = receivedAt, duration = duration
                };
            }

            tracks.Clear();
            foreach (var pair in next) tracks.Add(pair.Key, pair.Value);
            lastReceipt = receivedAt;
            hasReceipt = true;
            LastAcceptedRevision = snapshotRevision;
            return true;
        }

        // If a pose is missing, caller must use the authoritative position,
        // never a made-up interpolation. No velocity extrapolation is performed.
        public bool TryPose(int ballId, float renderAt, out float x, out float y)
        {
            x = y = 0;
            if (!Valid(renderAt) || !tracks.TryGetValue(ballId, out Segment track))
                return false;
            Sample(track, renderAt, out x, out y);
            return true;
        }

        public void Reset()
        {
            tracks.Clear();
            hasReceipt = false;
            lastReceipt = 0;
            LastAcceptedRevision = -1;
        }
    }
}
