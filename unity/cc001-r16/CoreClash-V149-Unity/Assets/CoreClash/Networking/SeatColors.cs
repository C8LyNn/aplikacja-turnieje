namespace CoreClash.Networking
{
    // CC-001 W24 (owner decision: "in PvP each player picks the colour they play in"). In a game over
    // the network the host is Player 1 and keeps the colour they chose. The guest sends their choice
    // when they join and plays in it - unless it is the host's colour, or not a colour at all: then
    // the guest gets the next colour after the host's. Both screens then show the same two colours.
    public static class SeatColors
    {
        public static int Host(int chosen,int count)=>count<1?0:((chosen%count)+count)%count;
        public static int Guest(int host,int wanted,int count)
        {
            if(count<2)return 0;
            host=Host(host,count);
            return wanted<0||wanted>=count||wanted==host?(host+1)%count:wanted;
        }
        // What a guest accepts from the host: two different colours that exist.
        public static bool Valid(int host,int guest,int count)=>host>=0&&host<count&&guest>=0&&guest<count&&host!=guest;
    }
}
