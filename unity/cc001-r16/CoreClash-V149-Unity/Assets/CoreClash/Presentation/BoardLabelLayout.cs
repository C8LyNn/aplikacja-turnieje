using System;
namespace CoreClash.Presentation
{
    // CC-001 W19-04: board labels (EST. STOP, Replay counter, base report) must
    // stay inside the VISIBLE field. Seen on the real a40e4a0 Windows Player:
    // "EST. STOP · ENEMY HALF" was cut at the right wall because labels were
    // clamped to the whole board rect, which is wider than the clipped field.
    public static class BoardLabelLayout
    {
        // Field corners in board-view space (either perspective) -> rectangle.
        public static UiBox Field(float ax,float ay,float bx,float by)=>new UiBox(Math.Min(ax,bx),Math.Min(ay,by),Math.Abs(bx-ax),Math.Abs(by-ay));

        // A label of preferred width centred on cx, placed at preferredY (top
        // edge) or, when that would leave the field, at fallbackY; then clamped
        // inside the field with `margin`. Width shrinks only if the field is
        // narrower than the label.
        public static UiBox Fit(UiBox field,float cx,float preferredY,float fallbackY,float width,float height,float margin=4)
        {
            float w=Math.Max(1,Math.Min(width,field.width-2*margin)),h=Math.Max(1,Math.Min(height,field.height-2*margin));
            float minX=field.x+margin,maxX=field.Right-margin-w,minY=field.y+margin,maxY=field.Bottom-margin-h;
            float y=preferredY;if(y<minY||y>maxY)y=fallbackY;
            return new UiBox(Clamp(cx-w/2,minX,maxX),Clamp(y,minY,maxY),w,h);
        }
        static float Clamp(float v,float min,float max)=>max<min?min:Math.Max(min,Math.Min(max,v));
    }
}
