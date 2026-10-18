namespace CoreClash.Networking
{
    public sealed class LanSeat
    {
        double expires;
        public ulong? Connected {get;private set;}
        public ulong? Pending {get;private set;}
        public bool TryReserve(ulong id,double now){if(!Valid(now)||id==0)return false;Expire(now);if(Connected.HasValue||Pending.HasValue)return false;Pending=id;expires=now+10;return true;}
        public bool Commit(ulong id,double now){if(!Valid(now))return false;Expire(now);if(Pending!=id||Connected.HasValue)return false;Connected=id;Pending=null;return true;}
        public bool Release(ulong id){if(Pending==id){Pending=null;return true;}if(Connected==id){Connected=null;return true;}return false;}
        public ulong? Expire(double now){if(Valid(now)&&Pending.HasValue&&now>=expires){var expired=Pending;Pending=null;return expired;}return null;}
        public bool Owns(ulong id)=>Connected==id;
        public void Reset(){Connected=Pending=null;expires=0;}
        static bool Valid(double now)=>!double.IsNaN(now)&&!double.IsInfinity(now);
    }
}
