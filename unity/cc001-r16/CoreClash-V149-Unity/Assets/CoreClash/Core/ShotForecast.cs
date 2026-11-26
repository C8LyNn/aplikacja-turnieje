using System;
using System.Collections.Generic;

namespace CoreClash.Core
{
    // CC-001 W24 (owner direction after playing, 2026-11-24: "the prediction is to take the balls
    // into account too"). The shot being aimed is played ahead in a private copy of the match by
    // the rules themselves - the same GameSimulation.Step(1/120) the match runs - so the path bends
    // where the ball will really hit another ball, a trap goes off where it will go off, and the
    // other balls end where they will end. Nothing is decided here and the match is never touched.
    // The work comes in slices (Advance), so the screen that asks for it never waits for it.
    public sealed class ForecastBall
    {
        public int Id,Owner;
        public float FromX,FromY,ToX,ToY,Radius;
        // The shot destroys it.
        public bool Dies;
    }

    // How far ahead a forecast is played (owner, the next day: "I want several levels of it, from
    // nothing up to this detailed"): to the first thing the ball touches, to the first BALL it
    // touches, or the whole shot. The first two stop as soon as they know - they are cheaper too.
    public enum ForecastDetail { FirstTouch, FirstBall, Whole }

    public sealed class ShotForecast
    {
        public const float Dt=1f/120;
        public const int MaxSteps=3600,PathEvery=6;
        // A ball counts as moved by the shot when it ends at least this far from where it stood.
        public const float MovedBy=6;
        // A change of direction of more than about three degrees between two steps is a bounce.
        const float TurnCos=.9986f;

        public bool Valid{get;private set;}
        public bool Finished{get;private set;}
        public ForecastDetail Detail{get;private set;}
        public int MoverId,Owner,Steps;
        public string MoverType;
        public float Radius,StopX,StopY;
        // The shot destroys the launched ball itself (a Bomb, or a ball that dies of what it hits).
        public bool MoverDies;
        // Stopped where the asked-for detail ends (the first touch, the first ball): the path's last
        // point is that contact, not the place where the ball comes to rest.
        public bool EndsAtContact;
        // Centre of the launched ball: where it starts, where it is at every bounce (touching what it
        // bounces off), a point every few steps in between, and where it ends.
        public readonly List<float> PathX=new List<float>(),PathY=new List<float>();
        // Which points of the path are bounces - off a wall, an obstacle or a ball.
        public readonly List<int> Bounces=new List<int>();
        // The point of the path where the ball first touches anything, and where it first touches
        // another ball (-1: it never does).
        public int FirstTouchAt=-1,FirstBallAt=-1;
        // Every other ball the shot moves or destroys (whole forecasts only).
        public readonly List<ForecastBall> Others=new List<ForecastBall>();

        GameSimulation sandbox;GameState state;BallRuntime mover;
        float headingX,headingY;int sincePoint,eventCursor;
        readonly List<ForecastBall> watched=new List<ForecastBall>();
        readonly HashSet<int> lostInMotion=new HashSet<int>();

        // `copy` is a private copy of the match as it stands (it is played on and thrown away);
        // `command` is the shot exactly as releasing the drag would send it. Not Valid when the
        // rules refuse that shot.
        public static ShotForecast Begin(GameSimulation sandbox,GameState copy,PlayerCommand command,ForecastDetail detail=ForecastDetail.Whole)
        {
            var f=new ShotForecast{Detail=detail};
            if(sandbox==null||copy==null||command==null)return f;
            sandbox.State=copy;
            foreach(var b in copy.balls)if(!b.dead&&!b.banished)f.watched.Add(new ForecastBall{Id=b.id,Owner=b.owner,FromX=b.x,FromY=b.y,ToX=b.x,ToY=b.y,Radius=b.radius});
            int firstNew=copy.nextId;
            if(!sandbox.TryCommand(command,out _))return f;
            BallRuntime launched=null;
            foreach(var b in copy.balls)if(command.kind==CommandKind.Replay?b.id==command.ballId:b.id==firstNew){launched=b;break;}
            if(launched==null)return f;
            f.sandbox=sandbox;f.state=copy;f.mover=launched;f.eventCursor=copy.eventSerial;
            f.MoverId=launched.id;f.Owner=launched.owner;f.MoverType=launched.type;f.Radius=launched.radius;
            f.watched.RemoveAll(w=>w.Id==launched.id);
            f.StopX=launched.x;f.StopY=launched.y;
            f.Point(launched.x,launched.y);f.Heading();
            f.Valid=true;return f;
        }

        // Plays up to `steps` more steps of the shot. True when the forecast is complete.
        public bool Advance(int steps)
        {
            if(!Valid||Finished)return true;
            // The sandbox was given to another forecast: this one can never be completed.
            if(!ReferenceEquals(sandbox.State,state)){Valid=false;Finished=true;sandbox=null;return true;}
            for(int i=0;i<steps;i++)
            {
                if(state.phase!=MatchPhase.Moving||Steps>=MaxSteps)break;
                sandbox.Step(Dt);Steps++;
                // The step that brings everything to rest also ends the turn; what a turn's end
                // does (burning, poison, pressure on a base) is not this shot's doing.
                if(state.phase!=MatchPhase.Moving)break;
                Track();
                // Enough is known for the detail that was asked for.
                if((Detail==ForecastDetail.FirstTouch&&FirstTouchAt>=0)||(Detail==ForecastDetail.FirstBall&&FirstBallAt>=0)){Finish(true);return true;}
            }
            if(state.phase!=MatchPhase.Moving||Steps>=MaxSteps){Finish(false);return true;}
            return false;
        }

        int Point(float x,float y)
        {
            int n=PathX.Count;
            if(n>0&&Math.Abs(PathX[n-1]-x)<.01f&&Math.Abs(PathY[n-1]-y)<.01f)return n-1;
            PathX.Add(x);PathY.Add(y);sincePoint=0;return n;
        }
        bool Heading()
        {
            float speed=(float)Math.Sqrt(mover.vx*mover.vx+mover.vy*mover.vy);
            if(speed<1)return false;
            headingX=mover.vx/speed;headingY=mover.vy/speed;return true;
        }
        // Did the launched ball touch another ball in the step just played? (The rules say so
        // themselves: a HIT or a TOUCH between the two.)
        bool TouchedBall()
        {
            bool touched=false;var events=state.events;
            for(int i=events.Count-1;i>=0&&events[i].id>eventCursor;i--)
                if((events[i].kind=="HIT"||events[i].kind=="TOUCH")&&(events[i].ballId==mover.id||events[i].otherId==mover.id))touched=true;
            eventCursor=state.eventSerial;return touched;
        }
        void Track()
        {
            foreach(var b in state.balls)if(b.dead&&b.id!=mover.id)lostInMotion.Add(b.id);
            bool ball=TouchedBall();
            if(mover.dead)
            {
                if(!MoverDies){MoverDies=true;StopX=mover.x;StopY=mover.y;int end=Point(mover.x,mover.y);if(ball)Contact(end,true);}
                return;
            }
            sincePoint++;
            float oldX=headingX,oldY=headingY;
            bool turned=Heading()&&oldX*headingX+oldY*headingY<TurnCos;
            // After the step of a bounce the ball stands exactly against what it bounced off.
            if(ball||turned)Contact(Point(mover.x,mover.y),ball);
            else if(sincePoint>=PathEvery)Point(mover.x,mover.y);
        }
        void Contact(int at,bool ball)
        {
            if(Bounces.Count==0||Bounces[Bounces.Count-1]!=at)Bounces.Add(at);
            if(FirstTouchAt<0)FirstTouchAt=at;
            if(ball&&FirstBallAt<0)FirstBallAt=at;
        }
        void Finish(bool atContact)
        {
            Finished=true;EndsAtContact=atContact;
            if(atContact){StopX=mover.x;StopY=mover.y;}
            else
            {
                if(!MoverDies){StopX=mover.x;StopY=mover.y;Point(StopX,StopY);}
                foreach(var w in watched)
                {
                    BallRuntime now=null;
                    foreach(var b in state.balls)if(b.id==w.Id){now=b;break;}
                    if(now!=null){w.ToX=now.x;w.ToY=now.y;}
                    // Gone from the board, or destroyed while the shot was still playing.
                    if(now==null||lostInMotion.Contains(w.Id)){w.Dies=true;Others.Add(w);continue;}
                    float dx=w.ToX-w.FromX,dy=w.ToY-w.FromY;
                    if(dx*dx+dy*dy>=MovedBy*MovedBy)Others.Add(w);
                }
            }
            sandbox=null;state=null;mover=null;
        }
    }
}
