using UnityEngine;
using System.Collections.Generic;
namespace CoreClash.Input
{
    public static class TouchInput
    {
        static readonly PrimaryPointer primary=new PrimaryPointer();
        static readonly List<TouchContact> contacts=new List<TouchContact>(8);
        public static void Reset(){primary.Reset();contacts.Clear();}
        public static bool Read(out PointerSample p)
        {
            contacts.Clear();for(int i=0;i<UnityEngine.Input.touchCount;i++){
                var t=UnityEngine.Input.GetTouch(i);ContactPhase phase=t.phase==TouchPhase.Began?ContactPhase.Began:t.phase==TouchPhase.Ended?ContactPhase.Ended:t.phase==TouchPhase.Canceled?ContactPhase.Canceled:t.phase==TouchPhase.Moved?ContactPhase.Moved:ContactPhase.Stationary;
                contacts.Add(new TouchContact{id=t.fingerId,x=t.position.x,y=t.position.y,phase=phase});
            }
            p=default;if(!primary.Read(contacts,out var contact))return false;
            p=new PointerSample{id=contact.id,position=new Vector2(contact.x,contact.y),down=contact.phase==ContactPhase.Began,held=contact.phase==ContactPhase.Moved||contact.phase==ContactPhase.Stationary,up=contact.phase==ContactPhase.Ended,canceled=contact.phase==ContactPhase.Canceled};return true;
        }
    }
}
