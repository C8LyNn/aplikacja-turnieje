using UnityEngine;
namespace CoreClash.Input
{
    public struct PointerSample { public int id;public Vector2 position;public bool down,held,up,canceled; }
    public static class DesktopInput
    {
        public static bool Read(out PointerSample p)
        {
            p=new PointerSample{id=-1,position=UnityEngine.Input.mousePosition,down=UnityEngine.Input.GetMouseButtonDown(0),held=UnityEngine.Input.GetMouseButton(0),up=UnityEngine.Input.GetMouseButtonUp(0)};
            return UnityEngine.Input.touchCount==0&&(p.down||p.held||p.up);
        }
    }
}
