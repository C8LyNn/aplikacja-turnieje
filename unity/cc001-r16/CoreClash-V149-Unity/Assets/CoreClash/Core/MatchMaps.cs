namespace CoreClash.Core
{
    // CC-001 W24 (owner decisions): maps. A map is a set of obstacles - round posts nothing can
    // damage, which balls bounce off as off a wall (StructureSystem.Obstacle).
    // Owner's rule for terrain (2026-11-21): a piece of terrain may not reach into the centre or
    // into a base, unless the map changes that area itself. No map here changes them, so every
    // obstacle lies wholly in the neutral band, clear of the centre circle. Every map is also the
    // same after a half turn round the centre (270, 450), so neither player has the better side.
    public sealed class MapDefinition
    {
        public string Id,NameEn,NamePl;
        // x, y, radius of each obstacle, in the 540 x 900 world of the rules.
        public float[] Obstacles;
    }
    public static class MatchMaps
    {
        // The areas terrain keeps out of (the same numbers as ZoneResolver and BoardView).
        public const float BaseZoneBottomOfTop=198,BaseZoneTopOfBottom=702,CentreX=270,CentreY=450,CentreRadius=112;
        public static readonly MapDefinition[] All=
        {
            new MapDefinition{Id="open",NameEn="Open",NamePl="Otwarta",Obstacles=new float[0]},
            new MapDefinition{Id="pillars",NameEn="Pillars",NamePl="Filary",Obstacles=new[]{135f,450,22, 405,450,22}},
            new MapDefinition{Id="gate",NameEn="Gate",NamePl="Brama",Obstacles=new[]{160f,330,24, 380,570,24, 380,330,24, 160,570,24}},
            new MapDefinition{Id="bumps",NameEn="Bumps",NamePl="Wypusty",Obstacles=new[]{24.3f,330,44, 515.7f,570,44, 515.7f,330,44, 24.3f,570,44}},
            new MapDefinition{Id="zigzag",NameEn="Zigzag",NamePl="Zygzak",Obstacles=new[]{150f,340,30, 390,560,30}},
            new MapDefinition{Id="corners",NameEn="Corners",NamePl="Narożniki",Obstacles=new[]{110f,250,24, 430,650,24, 430,250,24, 110,650,24}},
        };
        public static MapDefinition ById(string id){foreach(var map in All)if(map.Id==id)return map;return null;}
        // Puts a map's obstacles into a match that has just been created.
        public static void Apply(GameSimulation simulation,MapDefinition map)
        {
            if(simulation==null||map==null)return;
            simulation.State.mapId=map.Id;
            for(int i=0;i+2<map.Obstacles.Length;i+=3)simulation.Structures.AddObstacle(map.Obstacles[i],map.Obstacles[i+1],map.Obstacles[i+2]);
        }
    }
}
