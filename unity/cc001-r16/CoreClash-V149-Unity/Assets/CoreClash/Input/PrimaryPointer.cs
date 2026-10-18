using System.Collections.Generic;
namespace CoreClash.Input
{
    public enum ContactPhase { Began, Moved, Stationary, Ended, Canceled }
    public struct TouchContact { public int id;public float x,y;public ContactPhase phase; }
    public sealed class PrimaryPointer
    {
        bool active;
        TouchContact primary;
        public bool Read(IReadOnlyList<TouchContact> contacts,out TouchContact contact)
        {
            contact=default;
            if(active){
                for(int i=0;i<contacts.Count;i++)if(contacts[i].id==primary.id){
                    contact=primary=contacts[i];
                    if(contact.phase==ContactPhase.Ended||contact.phase==ContactPhase.Canceled)active=false;
                    return true;
                }
                contact=primary;contact.phase=ContactPhase.Canceled;active=false;return true;
            }
            for(int i=0;i<contacts.Count;i++)if(contacts[i].phase==ContactPhase.Began){primary=contact=contacts[i];active=true;return true;}
            return false;
        }
        public void Reset(){active=false;primary=default;}
    }
}
