using CoreClash.Presentation;
using CoreClash.Input;
using CoreClash.Core;

public static partial class Program
{
    static void DeviceTests()
    {
        Test("phone portrait reserves a practical launcher board above its touch tray",()=>{
            var l=MatchLayout.For(390,844);
            True(l.Board.width>=270,"phone arena is too small to aim accurately");
            True(l.Panel.height>=190,"phone touch tray is clipped");
            True(Separated(l.Board,l.Panel));
        });
        foreach(var size in new[]{(667f,325f),(568f,270f),(844f,340f)}){
            Test("short landscape phone uses a bounded scrollable side panel at "+size.Item1+"x"+size.Item2,()=>{
                var l=MatchLayout.For(size.Item1,size.Item2,DeviceProfile.Phone);
                False(l.Portrait);
                True(l.Board.Right<=l.Panel.x,"landscape phone controls must sit beside the arena");
                True(l.Board.width>=100&&l.Board.height>=160,"landscape arena collapsed");
                True(l.Panel.width>=280&&l.Panel.height>=150,"landscape side panel collapsed");
                foreach(var r in new[]{l.Board,l.Panel})True(r.x>=0&&r.y>=60&&r.Right<=size.Item1&&r.Bottom<=size.Item2,"landscape phone surface leaves canvas");
                Near(.6f,l.Board.width/l.Board.height,.001f);
            });
        }
        Test("native phone density and safe area preserve readable logical coordinates",()=>{
            var v=DeviceViewport.Create(1080,2400,new UiBox(0,96,1080,2202),3,true);
            Eq(DeviceProfile.Phone,v.Profile);Near(360,v.Width);Near(734,v.Height);Near(3,v.Scale);
        });
        Test("tablet portrait and landscape use their extra board and tray space",()=>{
            foreach(var fixture in new[]{(820f,1180f,650f),(1366f,1024f,900f)}){
                var v=DeviceViewport.Create(fixture.Item1,fixture.Item2,new UiBox(0,0,fixture.Item1,fixture.Item2),1,true);
                Eq(DeviceProfile.Tablet,v.Profile);var l=MatchLayout.For(v.Width,v.Height,v.Profile);
                True(l.Board.height>=fixture.Item3,"tablet board wastes available height");
                True(l.Panel.width>=350&&l.Panel.height>=240,"tablet tray loses usable space");
                True(Separated(l.Board,l.Panel));True(l.Board.Bottom<=v.Height&&l.Panel.Bottom<=v.Height);
            }
        });
        Test("desktop high DPI keeps the same logical board and controls",()=>{
            var a=DeviceViewport.Create(1920,1080,new UiBox(0,0,1920,1080),1,false);
            var b=DeviceViewport.Create(3840,2160,new UiBox(0,0,3840,2160),2,false);
            Eq(DeviceProfile.Desktop,b.Profile);Near(a.Width,b.Width);Near(a.Height,b.Height);
            var x=MatchLayout.For(a.Width,a.Height,a.Profile);var y=MatchLayout.For(b.Width,b.Height,b.Profile);
            Near(x.Board.width,y.Board.width);Near(x.Panel.width,y.Panel.width);
        });
        Test("safe area pointer mapping and raw arena conversion agree in both origins",()=>{
            var v=DeviceViewport.Create(1080,2300,new UiBox(40,80,1000,2100),2,true);
            var p=v.PointerToLogical(540,1220);Near(250,p.x);Near(500,p.y);
            var q=v.ToLogical(540,1080);Near(250,q.x);Near(500,q.y);
            var r=v.ToScreen(new UiBox(20,40,200,300));Near(80,r.x);Near(160,r.y);Near(400,r.width);Near(600,r.height);
        });
        Test("invalid viewport geometry cannot create nonfinite or negative coordinates",()=>{
            var v=DeviceViewport.Create(0,float.NaN,new UiBox(-20,9,0,0),float.NaN,true);
            True(v.Width>=1&&v.Height>=1&&v.Scale>0);True(GameSimulation.Finite(v.Width)&&GameSimulation.Finite(v.Height));
            var clipped=DeviceViewport.Create(390,844,new UiBox(-10,40,420,900),1,true);
            Near(0,clipped.SafeArea.x);Near(40,clipped.SafeArea.y);Near(390,clipped.Width);Near(804,clipped.Height);
        });
        Test("profile overrides preserve transform and auto can be restored",()=>{
            var forced=DeviceViewport.Create(820,1180,new UiBox(0,0,820,1180),1,true,DeviceProfile.Phone);
            Eq(DeviceProfile.Phone,forced.Profile);Near(820,forced.Width);
            Eq(DeviceProfile.Tablet,DeviceViewport.Create(820,1180,new UiBox(0,0,820,1180),1,true).Profile);
        });
        Test("touch library rows allocate separate 44 point actions without covering previews",()=>{
            foreach(float width in new[]{248f,318f,595f,888f}){
                var row=SetupLayout.DeckRow(width,42,44);
                foreach(var action in new[]{row.Player1,row.Player2}){
                    True(action.height>=44&&action.width>=44);True(action.Bottom<=row.Height);
                    True(Separated(action,row.Name));foreach(var p in row.Previews)True(Separated(action,p));
                }
            }
        });
        Test("primary touch survives finger array reorder and cannot be released by another finger",()=>{
            var input=new PrimaryPointer();True(input.Read(new[]{Contact(7,ContactPhase.Began)},out var p));Eq(7,p.id);
            True(input.Read(new[]{Contact(8,ContactPhase.Began),Contact(7,ContactPhase.Moved)},out p));Eq(7,p.id);Eq(ContactPhase.Moved,p.phase);
            True(input.Read(new[]{Contact(8,ContactPhase.Ended),Contact(7,ContactPhase.Stationary)},out p));Eq(7,p.id);Eq(ContactPhase.Stationary,p.phase);
            True(input.Read(new[]{Contact(7,ContactPhase.Ended)},out p));Eq(ContactPhase.Ended,p.phase);
        });
        Test("missing primary cancels once and a held secondary never becomes a new drag",()=>{
            var input=new PrimaryPointer();input.Read(new[]{Contact(3,ContactPhase.Began)},out _);
            True(input.Read(new[]{Contact(4,ContactPhase.Moved)},out var p));Eq(3,p.id);Eq(ContactPhase.Canceled,p.phase);
            False(input.Read(new[]{Contact(4,ContactPhase.Stationary)},out _));False(input.Read(Array.Empty<TouchContact>(),out _));
            True(input.Read(new[]{Contact(9,ContactPhase.Began)},out p));Eq(9,p.id);
        });
        Test("focus or orientation reset cannot resume a held touch launch",()=>{
            var input=new PrimaryPointer();input.Read(new[]{Contact(6,ContactPhase.Began)},out _);input.Reset();
            False(input.Read(new[]{Contact(6,ContactPhase.Moved)},out _));
            True(input.Read(new[]{Contact(10,ContactPhase.Began)},out var p));Eq(10,p.id);
        });
        Test("desktop and safe area phone gestures submit identical world intents",()=>{
            PlayerCommand[] commands=new PlayerCommand[2];int i=0;
            foreach(var v in new[]{DeviceViewport.Create(1280,900,new UiBox(0,0,1280,900),1,false),DeviceViewport.Create(1170,2532,new UiBox(0,132,1170,2298),3,true)}){
                var b=MatchLayout.For(v.Width,v.Height,v.Profile).Board;var raw=v.ToScreen(b);var g=new LaunchGesture();
                var start=v.PointerToLogical(raw.x+270*raw.width/540,v.RawHeight-(raw.y+853*raw.width/540));
                var end=v.PointerToLogical(raw.x+350*raw.width/540,v.RawHeight-(raw.y+710*raw.width/540));
                g.Begin(7,(start.x-b.x)*540/b.width,(start.y-b.y)*540/b.width);g.Move(7,(end.x-b.x)*540/b.width,(end.y-b.y)*540/b.width);
                True(g.Release(7,0,1,"normal",0,out commands[i++]));
            }
            Near(commands[0].dx,commands[1].dx);Near(commands[0].dy,commands[1].dy);Near(commands[0].power,commands[1].power);
            Eq(commands[0].kind,commands[1].kind);Eq(commands[0].owner,commands[1].owner);
        });

        // A20 W14: active trajectories must disappear as soon as ownership is
        // revoked, even when no new mouse/touch event arrives on that frame.
        Test("A20-W14-01 own P1 aiming gesture remains active",()=>{
            var s=Sim();s.State.turn=0;s.State.phase=MatchPhase.Aiming;
            var g=new LaunchGesture();g.Begin(101,270,853);g.Move(101,270,700);
            LocalAimOwnership.Revoke(g,s.State,0,true);True(g.Active);
        });
        Test("A20-W14-02 own P2 aiming gesture remains active",()=>{
            var s=Sim();s.State.turn=1;s.State.phase=MatchPhase.Aiming;
            var g=new LaunchGesture();g.Begin(102,270,47);g.Move(102,270,190);
            LocalAimOwnership.Revoke(g,s.State,1,true);True(g.Active);
        });
        Test("A20-W14-03 opponent turn revokes active P2 trajectory and release",()=>{
            var s=Sim();s.State.turn=1;s.State.phase=MatchPhase.Aiming;
            var g=new LaunchGesture();g.Begin(103,270,47);g.Move(103,270,250);
            s.State.turn=0;
            LocalAimOwnership.Revoke(g,s.State,1,true);False(g.Active);
            False(g.Release(103,1,s.State.turnNumber,"normal",0,out _));
        });
        Test("A20-W14-04 connection drop revokes active P1 trajectory without pointer event",()=>{
            var s=Sim();s.State.turn=0;s.State.phase=MatchPhase.Aiming;
            var g=new LaunchGesture();g.Begin(104,270,853);g.Move(104,270,600);
            LocalAimOwnership.Revoke(g,s.State,0,false);False(g.Active);
        });
        Test("A20-W14-05 moving and game-over phases revoke previous gesture",()=>{
            var s=Sim();s.State.turn=0;
            foreach(var phase in new[]{MatchPhase.Moving,MatchPhase.Over}){
                var g=new LaunchGesture();g.Begin(105,270,853);g.Move(105,270,500);
                s.State.phase=phase;
                LocalAimOwnership.Revoke(g,s.State,0,true);False(g.Active);
            }
        });
        Test("A20-W14-06 invalid or unassigned network seat fails closed",()=>{
            var s=Sim();s.State.turn=0;s.State.phase=MatchPhase.Aiming;
            foreach(int seat in new[]{-1,2}){
                var g=new LaunchGesture();g.Begin(106,270,853);
                LocalAimOwnership.Revoke(g,s.State,seat,true);False(g.Active);
                False(LocalAimOwnership.CanAim(s.State,seat,true));
            }
        });
        Test("A20-W14-07 hotseat aim remains active without LAN",()=>{
            var s=Sim();s.State.phase=MatchPhase.Aiming;
            var g=new LaunchGesture();g.Begin(107,270,853);
            LocalAimOwnership.Revoke(g,s.State,null,false);True(g.Active);
            True(LocalAimOwnership.CanAim(s.State,null,false));
        });
        Test("A20-W14-08 missing authoritative state revokes a gesture safely",()=>{
            var g=new LaunchGesture();g.Begin(108,270,853);
            LocalAimOwnership.Revoke(g,null,0,true);False(g.Active);
            LocalAimOwnership.Revoke(null,null,0,false);
        });
        Test("A20-W14-09 stale touch cannot re-enter launch after revoked turn",()=>{
            var s=Sim();s.State.turn=1;s.State.phase=MatchPhase.Aiming;
            var g=new LaunchGesture();g.Begin(109,270,47);g.Move(109,270,350);
            s.State.turn=0;LocalAimOwnership.Revoke(g,s.State,1,true);
            g.Move(109,270,500);
            False(g.Release(109,1,s.State.turnNumber,"normal",0,out _));
        });
        Test("A20-W14-10 no-op revocation does not change an already idle gesture",()=>{
            var s=Sim();s.State.turn=1;s.State.phase=MatchPhase.Aiming;
            var g=new LaunchGesture();
            LocalAimOwnership.Revoke(g,s.State,0,true);False(g.Active);
            LocalAimOwnership.Revoke(g,s.State,1,true);False(g.Active);
        });
    }
    static TouchContact Contact(int id,ContactPhase phase)=>new TouchContact{id=id,x=100,y=200,phase=phase};
}
