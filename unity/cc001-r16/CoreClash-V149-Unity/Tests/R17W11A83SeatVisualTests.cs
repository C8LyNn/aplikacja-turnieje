using CoreClash.Presentation;

public static partial class Program
{
    static void R17W11A83SeatVisualTests()
    {
        Test("A83 W11 local P1/P2 marker needs established connection", () => {
            True(LocalSeatVisuals.ShowLocalMarker(true,true,0,0));
            False(LocalSeatVisuals.ShowLocalMarker(true,true,0,1));
            True(LocalSeatVisuals.ShowLocalMarker(true,true,1,1));
            False(LocalSeatVisuals.ShowLocalMarker(true,true,1,0));
            False(LocalSeatVisuals.ShowLocalMarker(true,false,1,1));
            False(LocalSeatVisuals.ShowLocalMarker(true,false,0,0));
        });
        Test("A83 W11 no seat marker on unknown seat or offline hotseat", () => {
            foreach(var seat in new[]{-1,2})
                foreach(var player in new[]{0,1})
                    False(LocalSeatVisuals.ShowLocalMarker(true,true,seat,player));
            False(LocalSeatVisuals.ShowLocalMarker(false,true,0,0));
        });
        Test("A83 W11 remote P2 must not preview its own selected ball on P1 launcher", () => {
            False(LocalSeatVisuals.ShowSelectedPreview(true,true,1,0,false));
            False(LocalSeatVisuals.ShowSelectedPreview(true,true,1,0,true)); // fail closed even if future CanChoose regresses
            True(LocalSeatVisuals.ShowSelectedPreview(true,true,1,1,true));
            False(LocalSeatVisuals.ShowSelectedPreview(true,true,0,1,false));
            True(LocalSeatVisuals.ShowSelectedPreview(true,true,0,0,true));
        });
        Test("A83 W11 no selected launcher preview while disconnected or cannot choose", () => {
            foreach(var owner in new[]{0,1})
            {
                False(LocalSeatVisuals.ShowSelectedPreview(true,false,owner,owner,true));
                False(LocalSeatVisuals.ShowSelectedPreview(true,true,owner,owner,false));
            }
            False(LocalSeatVisuals.ShowSelectedPreview(true,true,-1,0,true));
            False(LocalSeatVisuals.ShowSelectedPreview(true,true,2,1,true));
        });
        Test("A83 W11 local hotseat preview follows active turn only", () => {
            True(LocalSeatVisuals.ShowSelectedPreview(false,true,-1,0,true));
            True(LocalSeatVisuals.ShowSelectedPreview(false,false,-1,1,true));
            False(LocalSeatVisuals.ShowSelectedPreview(false,true,-1,0,false));
            False(LocalSeatVisuals.ShowSelectedPreview(false,true,-1,2,true));
        });
    }
}
