using CoreClash.Core;
namespace CoreClash.Physics
{
    public static class ZoneResolver
    {
        public const float Left=24.3f,Right=515.7f;
        public static bool TouchesOwnZone(BallRuntime b)=>b.owner==0?b.y+b.radius>702:b.y-b.radius<198;
        public static bool TouchesEnemyZone(BallRuntime b)=>b.owner==0?b.y-b.radius<198:b.y+b.radius>702;
        // The centre of the reference rules. A map may change it for one match (GameState.centreRadius).
        public const float CentreRadius=112;
        public static bool TouchesCenter(BallRuntime b)=>TouchesCenter(b,CentreRadius);
        public static bool TouchesCenter(BallRuntime b,float centreRadius){float dx=b.x-270,dy=b.y-450,r=(centreRadius>0?centreRadius:CentreRadius)+b.radius;return dx*dx+dy*dy<=r*r;}
        public static string Zone(BallRuntime b)=>b.y<198?(b.owner==0?"ENEMY":"HOME"):b.y>702?(b.owner==0?"HOME":"ENEMY"):"NEUTRAL";
    }
}
