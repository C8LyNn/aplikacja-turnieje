using CoreClash.Core;
namespace CoreClash.Input
{
    public sealed class LaunchGesture
    {
        public bool Active;
        public float OriginX,OriginY,AimX,AimY;
        int pointerId;
        public void Begin(int pointer,float x,float y){if(Active)return;Active=true;pointerId=pointer;OriginX=AimX=x;OriginY=AimY=y;}
        public void Move(int pointer,float x,float y){if(Active&&pointer==pointerId){AimX=x;AimY=y;}}
        public void Cancel(int pointer){if(pointer==pointerId)Active=false;}
        public bool Release(int pointer,int owner,int turn,string type,int replayId,out PlayerCommand command)
        {
            command=null;if(!Active||pointer!=pointerId)return false;Active=false;float dx=AimX-OriginX,dy=AimY-OriginY,length=(float)System.Math.Sqrt(dx*dx+dy*dy);
            if(length<18||!GameSimulation.Finite(length))return false;
            command=new PlayerCommand{owner=owner,turnNumber=turn,kind=replayId>0?CommandKind.Replay:CommandKind.Spawn,ballId=replayId,ballType=type,dx=dx,dy=dy,power=System.Math.Min(590,length*3.38f)};return true;
        }
    }
}
