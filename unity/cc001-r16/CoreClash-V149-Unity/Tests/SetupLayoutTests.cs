using CoreClash.Presentation;
public static partial class Program
{
    static void SetupLayoutTests()
    {
        foreach(float width in new[]{248f,318f,595f,888f}){
            Test("deck row separates its full name, all nine previews and player actions at width "+width,()=>{
                var row=SetupLayout.DeckRow(width,42);
                True(row.Name.height>=42,"wrapped name is clipped");
                Eq(9,row.Previews.Length);
                foreach(var box in row.Previews){
                    True(box.x>=0&&box.Right<=width&&box.y>=0&&box.Bottom<=row.Height,"preview leaves its row");
                    True(Separated(box,row.Name)&&Separated(box,row.Player1)&&Separated(box,row.Player2),"preview overlaps text or an action");
                }
                for(int i=1;i<row.Previews.Length;i++)True(Separated(row.Previews[i-1],row.Previews[i]),"neighboring previews overlap");
                foreach(var action in new[]{row.Player1,row.Player2}){
                    True(action.width>=62&&action.height>=36,"player action became too small");
                    True(action.x>=0&&action.Right<=width&&action.y>=0&&action.Bottom<=row.Height,"player action leaves its row");
                    True(Separated(action,row.Name),"player action overlaps the name");
                }
                True(Separated(row.Player1,row.Player2),"player actions overlap");
            });
        }
        Test("narrow rows give a nine-ball preview its own band before either player action",()=>{
            var row=SetupLayout.DeckRow(318,23);
            True(row.Previews[0].y>=row.Name.Bottom,"name covers the preview band");
            foreach(var preview in row.Previews)True(row.Player1.y>=preview.Bottom&&row.Player2.y>=preview.Bottom,"actions cover previews");
        });
        Test("wide library rows keep compact selection while allowing a wrapped name",()=>{
            var row=SetupLayout.DeckRow(595,23);
            True(row.Height<=74,"short landscape rows grew without wrapped text");
            True(row.Player1.x>=row.Previews[8].Right+8,"desktop actions lost separation");
        });
    }
    static bool Separated(UiBox a,UiBox b)=>a.Right<=b.x||b.Right<=a.x||a.Bottom<=b.y||b.Bottom<=a.y;
}
