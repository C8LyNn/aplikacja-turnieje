using CoreClash.Core;
using CoreClash.Presentation;

// A84 R17-W12: isolated behavioral test additions. NO gameplay or HUD source edits.
// In a real net9.0 managed run, verify *both* local seats across all combinations;
// source-level checks alone do not certify Windows Player or two-device behavior.
public static partial class Program
{
    static void A84SeatCueMatrixTests()
    {
        const string staleNotice="A84_STALE_INTENT_NOTICE";

        // 2 active seats x 4 local seats x connected/offline x bonus/normal = 32 cases.
        // Negative seats model corrupt/uninitialized identity; they MUST fail closed.
        foreach(int active in new[]{0,1})
        foreach(int local in new[]{-1,0,1,2})
        foreach(bool connected in new[]{false,true})
        foreach(bool bonus in new[]{false,true})
        {
            Test($"A84 W12 aiming copy active={active} local={local} connected={connected} bonus={bonus}",()=>{
                var sim=Sim();var state=sim.State;
                state.turn=active;state.phase=MatchPhase.Aiming;state.bonusPending=bonus;
                int previousTurn=state.turn,previousRevision=state.revision,previousSerial=state.actionSerial;
                var title=LocalTurnPresentation.Status(state,local,true,connected);
                var compact=LocalTurnPresentation.CompactStatus(state,local,true,connected);
                var hint=LocalTurnPresentation.ActionHint(state,local,true,connected,true,30,0,"DRAG FROM LAUNCHER");
                var message=LocalTurnPresentation.ActionMessage(state,local,true,connected,true,30,0,"DRAG FROM LAUNCHER",staleNotice);
                bool mayAct=connected&&local==active;
                if(!connected)
                {
                    True(title.Contains("WAITING FOR CONNECTION"),"offline status masked");
                    Eq("OFFLINE",compact);
                    Eq("WAITING FOR CONNECTION",hint);
                    Eq("WAITING FOR CONNECTION",message);
                }
                else if(!mayAct)
                {
                    var waiting="WAITING FOR PLAYER "+(active+1);
                    True(title.Contains(waiting),"opponent/invalid seat not announced");
                    Eq("WAIT P"+(active+1),compact);
                    Eq(waiting,hint);Eq(waiting,message);
                }
                else
                {
                    True(title.Contains(bonus?"YOUR BONUS SHOT":"YOUR SHOT"),"local turn not identified");
                    Eq(bonus?"YOUR BONUS":"YOUR SHOT",compact);
                    Eq("RELEASE TO LAUNCH",hint);
                    Eq(staleNotice,message);
                }
                if(!mayAct)
                {
                    False(title.Contains("YOUR SHOT"),"false active seat");
                    False(title.Contains("YOUR BONUS"),"false bonus ownership");
                    False(compact.Contains("YOUR"),"compact falsely grants turn");
                    False(hint.Contains("DRAG")||hint.Contains("RELEASE"),"remote launcher hint");
                    False(message.Contains(staleNotice),"stale notice escaped local-seat guard");
                }
                Eq(previousTurn,state.turn);Eq(previousRevision,state.revision);
                Eq(previousSerial,state.actionSerial);
            });
        }

        // 2 x 4 x 2 = 16 cases: MOVING must never offer launch;
        // offline must take precedence over animated "RESOLVING".
        foreach(int active in new[]{0,1})
        foreach(int local in new[]{-1,0,1,2})
        foreach(bool connected in new[]{false,true})
        {
            Test($"A84 W12 moving does not grant input active={active} local={local} connected={connected}",()=>{
                var sim=Sim();var s=sim.State;s.turn=active;s.phase=MatchPhase.Moving;
                var title=LocalTurnPresentation.Status(s,local,true,connected);
                var shortStatus=LocalTurnPresentation.CompactStatus(s,local,true,connected);
                var hint=LocalTurnPresentation.ActionHint(s,local,true,connected,true,40,0,"DRAG FROM LAUNCHER");
                var msg=LocalTurnPresentation.ActionMessage(s,local,true,connected,true,40,0,"DRAG FROM LAUNCHER",staleNotice);
                if(!connected)
                {
                    True(title.Contains("WAITING FOR CONNECTION"));
                    Eq("OFFLINE",shortStatus);
                    Eq("WAITING FOR CONNECTION",hint);
                    Eq("WAITING FOR CONNECTION",msg);
                }
                else
                {
                    True(title.Contains("RESOLVING"));
                    Eq("MOVING",shortStatus);
                    Eq("SHOT RESOLVING",hint);
                    Eq("SHOT RESOLVING",msg);
                }
                False(title.Contains("YOUR SHOT"));
                False(hint.Contains("RELEASE")||hint.Contains("DRAG"));
                False(msg.Contains(staleNotice));
            });
        }

        // 2 winner identities x 4 local seats x connected/offline = 16 cases.
        // End results describe absolute winner, not the client's local identity.
        foreach(int winner in new[]{0,1})
        foreach(int local in new[]{-1,0,1,2})
        foreach(bool connected in new[]{false,true})
        {
            Test($"A84 W12 final result winner={winner} local={local} connected={connected}",()=>{
                var sim=Sim();var s=sim.State;s.turn=winner;s.phase=MatchPhase.Over;s.winner=winner;
                var title=LocalTurnPresentation.Status(s,local,true,connected);
                var shortStatus=LocalTurnPresentation.CompactStatus(s,local,true,connected);
                var action=LocalTurnPresentation.ActionMessage(s,local,true,connected,true,40,0,"DRAG FROM LAUNCHER",staleNotice);
                True(title.Contains("PLAYER "+(winner+1)+" WINS"));
                Eq("P"+(winner+1)+" WINS",shortStatus);
                Eq("MATCH COMPLETE",action);
                False(action.Contains(staleNotice));
                False(action.Contains("RELEASE"));
            });
        }

        // W13: hotseat mode MUST remain absolute player wording, even if a stale
        // network connectivity flag or remembered local seat is supplied by UI.
        // 2 active x 2 local identities x 2 connectivity flags x 2 bonus = 16.
        foreach(int active in new[]{0,1})
        foreach(int local in new[]{0,1})
        foreach(bool connected in new[]{false,true})
        foreach(bool bonus in new[]{false,true})
        {
            Test($"A84 W13 hotseat owner={active} local={local} connected={connected} bonus={bonus}",()=>{
                var sim=Sim();var s=sim.State;s.turn=active;
                s.phase=MatchPhase.Aiming;s.bonusPending=bonus;
                int revision=s.revision,serial=s.actionSerial;
                var title=LocalTurnPresentation.Status(s,local,false,connected);
                var compact=LocalTurnPresentation.CompactStatus(s,local,false,connected);
                var hint=LocalTurnPresentation.ActionHint(s,local,false,connected,true,30,0,"DRAG FROM LAUNCHER");
                var message=LocalTurnPresentation.ActionMessage(s,local,false,connected,true,30,0,"DRAG FROM LAUNCHER","");
                True(title.Contains("PLAYER "+(active+1)));
                True(title.Contains(bonus?"BONUS SHOT":"AIMING"));
                False(title.Contains("YOUR"),"hotseat must not claim relative remote identity");
                False(title.Contains("WAITING FOR CONNECTION"),"hotseat cannot be offline");
                Eq("P"+(active+1)+(bonus?" BONUS":" AIM"),compact);
                Eq("RELEASE TO LAUNCH",hint);
                Eq("RELEASE TO LAUNCH",message);
                Eq(revision,s.revision);Eq(serial,s.actionSerial);
            });
        }

        // W13: draw has no local winner or actionable hint on either LAN seat.
        // 2 local x connected/offline = 4 cases.
        foreach(int local in new[]{0,1})
        foreach(bool connected in new[]{false,true})
        {
            Test($"A84 W13 draw local={local} connected={connected}",()=>{
                var sim=Sim();var s=sim.State;s.phase=MatchPhase.Over;s.winner=-1;
                Eq("MATCH COMPLETE / DRAW",LocalTurnPresentation.Status(s,local,true,connected));
                Eq("DRAW",LocalTurnPresentation.CompactStatus(s,local,true,connected));
                Eq("MATCH COMPLETE",LocalTurnPresentation.ActionHint(s,local,true,connected,true,50,0,"DRAG FROM LAUNCHER"));
                Eq("MATCH COMPLETE",LocalTurnPresentation.ActionMessage(s,local,true,connected,true,50,0,"DRAG FROM LAUNCHER",staleNotice));
            });
        }

        // W14: 2 authoritative turns x 2 local seats x 2 LAN connection states x 6
        // drag vectors. A client must NEVER see RELEASE when disconnected, waiting,
        // or when the drag vector is too short / non-finite.
        var aimCases=new (string label,float dx,float dy,bool ready)[]{
            ("zero",0f,0f,false),
            ("below18",17.99f,0f,false),
            ("exact18",18f,0f,true),
            ("diagonal",13f,13f,true),
            ("nan",float.NaN,0f,false),
            ("infinite",float.PositiveInfinity,0f,false)
        };
        foreach(int active in new[]{0,1})
        foreach(int local in new[]{0,1})
        foreach(bool connected in new[]{false,true})
        foreach(var aimCase in aimCases)
        {
            Test($"A84 W14 aim affordance active={active} local={local} connected={connected} vector={aimCase.label}",()=>{
                var sim=Sim();var state=sim.State;
                state.turn=active;state.phase=MatchPhase.Aiming;
                int serial=state.actionSerial,revision=state.revision,turn=state.turn;
                bool ownTurn=connected&&active==local;
                string hint=LocalTurnPresentation.ActionHint(state,local,true,connected,
                    true,aimCase.dx,aimCase.dy,"DRAG FROM LAUNCHER");
                string message=LocalTurnPresentation.ActionMessage(state,local,true,connected,
                    true,aimCase.dx,aimCase.dy,"DRAG FROM LAUNCHER","");
                Eq(hint,message);
                if(!connected)Eq("WAITING FOR CONNECTION",hint);
                else if(!ownTurn)Eq("WAITING FOR PLAYER "+(active+1),hint);
                else Eq(aimCase.ready?"RELEASE TO LAUNCH":"DRAG TO BUILD POWER",hint);
                if(!ownTurn||!aimCase.ready)
                    False(hint.Contains("RELEASE"),"non-actionable aim must never offer release");
                Eq(turn,state.turn);Eq(serial,state.actionSerial);Eq(revision,state.revision);
            });
        }

        Test("A84 W12 no match state is never actionable",()=>{
            Eq("WAITING FOR MATCH",LocalTurnPresentation.Status(null,1,true,false));
            Eq("WAIT",LocalTurnPresentation.CompactStatus(null,1,true,false));
            Eq("WAITING FOR MATCH",LocalTurnPresentation.ActionMessage(null,1,true,false,true,40,0,"DRAG FROM LAUNCHER",staleNotice));
        });
        Test("A84 W12 turn copy remains read-only after repeated queries",()=>{
            var sim=Sim();var s=sim.State;
            s.turn=1;s.phase=MatchPhase.Aiming;s.bonusPending=true;
            int revision=s.revision,serial=s.actionSerial,turn=s.turn,turnNumber=s.turnNumber;
            for(int i=0;i<100;i++)
            {
                LocalTurnPresentation.Status(s,i%2,true,i%3!=0);
                LocalTurnPresentation.CompactStatus(s,i%2,true,i%3!=0);
                LocalTurnPresentation.ActionMessage(s,i%2,true,i%3!=0,true,30,0,"DRAG",staleNotice);
            }
            Eq(revision,s.revision);Eq(serial,s.actionSerial);Eq(turn,s.turn);
            Eq(turnNumber,s.turnNumber);True(s.bonusPending);
        });
    }
}
