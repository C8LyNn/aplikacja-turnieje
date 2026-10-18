using System;
using UnityEngine;
#if UNITY_WEBGL && !UNITY_EDITOR
using System.Runtime.InteropServices;
#endif
namespace CoreClash.Presentation
{
    // One transform for every IMGUI view, lobby and raw pointer sample.
    public static class UiViewport
    {
        public static DeviceViewport Current {get;private set;}=DeviceViewport.Create(1280,900,new UiBox(0,0,1280,900),1,false);
        static DeviceProfile requested=DeviceProfile.Auto;
        public static float Width=>Current.Width;
        public static float Height=>Current.Height;
        public static float Scale=>Current.Scale;
        public static DeviceProfile Profile=>Current.Profile;
        public static DeviceProfile RequestedProfile=>requested;
        public static bool IsTouch {get;private set;}
        public static float TargetSize=>IsTouch||Profile==DeviceProfile.Phone||Profile==DeviceProfile.Tablet?44:36;
        public static Matrix4x4 GuiMatrix=>Matrix4x4.TRS(new Vector3(Current.SafeArea.x,Current.SafeArea.y,0),Quaternion.identity,new Vector3(Scale,Scale,1));
#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")] static extern int CcTouchCapable();
        [DllImport("__Internal")] static extern float CcSafeInsetLeft();
        [DllImport("__Internal")] static extern float CcSafeInsetTop();
        [DllImport("__Internal")] static extern float CcSafeInsetRight();
        [DllImport("__Internal")] static extern float CcSafeInsetBottom();
#endif
        public static void SelectProfile(DeviceProfile profile){requested=profile;Refresh();}
        public static bool Refresh()
        {
            float width=Screen.width,height=Screen.height;var safe=Screen.safeArea;
            var area=new UiBox(safe.x,height-safe.yMax,safe.width,safe.height);
            bool touch=Application.isMobilePlatform;float density=1;
#if UNITY_WEBGL && !UNITY_EDITOR
            touch=CcTouchCapable()!=0;float left=CcSafeInsetLeft(),top=CcSafeInsetTop();
            area=new UiBox(left,top,width-left-CcSafeInsetRight(),height-top-CcSafeInsetBottom());
#else
            float dpi=Screen.dpi;
            if(touch)density=dpi>=72&&dpi<=1000?dpi/160:Mathf.Max(1,Mathf.Min(width,height)/390);
            else{
                float fitting=Mathf.Max(1,Mathf.Min(width/1920,height/1080));
                density=Mathf.Max(fitting,dpi>=72&&dpi<=400?dpi/96:1);
                density=Mathf.Min(density,Mathf.Max(1,Mathf.Min(width/960,height/600)));
            }
#endif
            var next=DeviceViewport.Create(width,height,area,density,touch,requested);var old=Current;
            bool changed=old.RawWidth!=next.RawWidth||old.RawHeight!=next.RawHeight||old.Scale!=next.Scale||old.Profile!=next.Profile||old.SafeArea.x!=next.SafeArea.x||old.SafeArea.y!=next.SafeArea.y||old.SafeArea.width!=next.SafeArea.width||old.SafeArea.height!=next.SafeArea.height||IsTouch!=touch;
            Current=next;IsTouch=touch;return changed;
        }
        public static Vector2 PointerToLogical(Vector2 pointer){var p=Current.PointerToLogical(pointer.x,pointer.y);return new Vector2(p.x,p.y);}
        public static Rect ToScreen(Rect logical){var r=Current.ToScreen(new UiBox(logical.x,logical.y,logical.width,logical.height));return new Rect(r.x,r.y,r.width,r.height);}
    }
}
