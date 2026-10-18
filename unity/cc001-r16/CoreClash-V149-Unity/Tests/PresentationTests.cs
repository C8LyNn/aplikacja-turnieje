using CoreClash.Presentation;
using CoreClash.Core;
using System.Linq;
public static partial class Program
{
    static void PresentationTests()
    {
        Test("new active player cannot inherit a ball outside their deck",()=>{var s=new GameSimulation(catalog,catalog.Featured[0],catalog.Featured[1]);s.State.turn=1;Eq("normal",BallSelection.ForTurn(s,"agony"));});
        Test("exhausted selection falls back to unlimited Standard",()=>{var s=new GameSimulation(catalog,catalog.Featured[0],catalog.Featured[1]);Eq("agony",BallSelection.ForTurn(s,"agony"));s.State.players[0].stock.First(x=>x.id=="agony").remaining=0;Eq("normal",BallSelection.ForTurn(s,"agony"));});
        foreach(var size in new[]{(1280,900),(960,600),(1920,1080),(390,844),(844,390)}){
            Test("presentation arena and controls remain usable at "+size.Item1+"x"+size.Item2,()=>{
                var layout=MatchLayout.For(size.Item1,size.Item2);var board=layout.Board;var panel=layout.Panel;
                True(board.width>140&&board.height>230,"arena became too small");Near(.6f,board.width/board.height,.001f);
                foreach(var r in new[]{board,panel})True(r.x>=0&&r.y>=60&&r.Right<=size.Item1&&r.Bottom<=size.Item2,"surface leaves viewport");
                True(board.Right<=panel.x||board.Bottom<=panel.y,"controls overlap arena");
                if(!layout.Portrait)True(panel.width>=360&&panel.width<=520,"desktop control column lost fixed width bounds");
            });
        }
    }
}
