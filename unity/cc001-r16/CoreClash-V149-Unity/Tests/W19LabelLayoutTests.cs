using System.IO;
using CoreClash.Presentation;

// CC-001 W19-04: board labels stay inside the visible play field (found on the
// real a40e4a0 Windows Player: "EST. STOP · ENEMY HALF" cut at the right wall).
public static partial class Program
{
    static void W19LabelLayoutTests()
    {
        Test("W19-04 STOP/Replay/base labels are clamped inside the visible field, both perspectives",()=>{
            foreach(var field in new[]{BoardLabelLayout.Field(20,17,684,1190),BoardLabelLayout.Field(684,1190,20,17),BoardLabelLayout.Field(0,0,248,413)})
            {
                True(field.width>0&&field.height>0);
                foreach(float cx in new[]{field.x-50,field.x,field.x+field.width/2,field.Right,field.Right+80})
                foreach(float y in new[]{field.y-30,field.y+5,field.y+field.height/2,field.Bottom-5,field.Bottom+40})
                foreach(float w in new[]{60f,180f,420f,900f})
                {
                    var b=BoardLabelLayout.Fit(field,cx,y,y-60,w,22);
                    True(b.x>=field.x+3.99f&&b.Right<=field.Right-3.99f&&b.y>=field.y+3.99f&&b.Bottom<=field.Bottom-3.99f,$"label outside field: {b.x},{b.y},{b.width} in {field.x},{field.y},{field.width},{field.height}");
                    if(w<=field.width-8)Eq(w,b.width);
                }
            }
            var f=BoardLabelLayout.Field(0,0,500,800);
            var below=BoardLabelLayout.Fit(f,250,400,340,120,20);Eq(400f,below.y);Eq(190f,below.x);
            var flipped=BoardLabelLayout.Fit(f,250,790,740,120,20);Eq(740f,flipped.y);
            var right=BoardLabelLayout.Fit(f,495,300,250,180,20);Eq(f.Right-4-180,right.x); // the RC Player case: marker at the right wall
        });
        Test("W19-04 BoardView clamps every board label to the visible field",()=>{
            string board=File.ReadAllText(Path.Combine(projectRoot,"Assets/CoreClash/Presentation/BoardView.cs"));
            True(board.Contains("static UiBox VisibleField(Rect board)"),"no visible-field helper");
            // W19-05: STOP label uses Fit; banner and counter are planned inside VisibleField by BoardOverlayPlanner.
            True(System.Text.RegularExpressions.Regex.Matches(board,@"BoardLabelLayout\.Fit\(VisibleField\(board\)").Count>=1&&System.Text.RegularExpressions.Regex.Matches(board,@"VisibleField\(board\)").Count>=3,"labels do not use the visible field");
            False(board.Contains("board.xMax-w"));
        });
    }
}
