using System;
using System.Linq;
using CoreClash.Data;
using CoreClash.Physics;

namespace CoreClash.Core
{
    public sealed class GameSimulation
    {
        public GameState State=new GameState();
        public readonly Catalog Catalog;
        public readonly BallPhysics Physics;
        public readonly CollisionResolver Collisions;
        public readonly MatchRules Rules;
        public readonly TurnSystem Turns;
        public readonly AbilityResolver Abilities;
        public readonly StructureSystem Structures;
        public GameSimulation(Catalog c,DeckDefinition a,DeckDefinition b)
        {
            Catalog=c;c.ValidateDeck(a);c.ValidateDeck(b);
            for(int owner=0;owner<2;owner++){
                var deck=owner==0?a:b;var p=State.players[owner];p.owner=owner;p.hp=20;p.ownerTurns=owner==0?1:0;p.deckId=deck.id;
                foreach(string id in deck.balls)p.stock.Add(new StockEntry{id=id,remaining=c.Ball(id).stockCopies});
            }
            Structures=new StructureSystem(this);Abilities=new AbilityResolver(this);Physics=new BallPhysics(this);Collisions=new CollisionResolver(this);Rules=new MatchRules(this);Turns=new TurnSystem(this);
        }
        public static bool Finite(float n)=>!float.IsNaN(n)&&!float.IsInfinity(n);
        public static float Clamp(float n,float min,float max)=>Math.Max(min,Math.Min(max,n));
        public static int Round(float n)=>(int)Math.Floor(n+.5f);
        public int Stock(int owner,string type)
        {
            if(owner<0||owner>1)return 0;if(type=="normal")return int.MaxValue;
            return State.players[owner].stock.FirstOrDefault(x=>x.id==type)?.remaining??0;
        }
        public bool CanReplay(BallRuntime b)=>b!=null&&!b.dead&&!b.banished&&!b.rooted&&b.owner==State.turn&&!State.bonusPending&&!State.replayedIds.Contains(b.id)&&ZoneResolver.TouchesOwnZone(b)&&b.type!="titan"&&b.frozen<=0;
        public bool TryCommand(PlayerCommand c,out string reason)
        {
            reason="";
            if(c==null||c.owner!=State.turn||c.turnNumber!=State.turnNumber||State.phase!=MatchPhase.Aiming){reason="Wrong owner, stale turn, or action still resolving.";return false;}
            if(!Finite(c.dx)||!Finite(c.dy)||!Finite(c.power)||c.power<60||c.power>590){reason="Invalid launch vector or power.";return false;}
            double length=Math.Sqrt((double)c.dx*c.dx+(double)c.dy*c.dy);if(length<.0001||double.IsInfinity(length)){reason="Aim direction required.";return false;}
            BallRuntime ball;
            if(c.kind==CommandKind.Spawn){
                // V148 precedence: spend a genuine stock copy before a returned Phoenix
                // hand opportunity. A Phoenix in hand never grants an extra stock copy.
                var definition=Catalog.Ball(c.ballType);
                var stockEntry=c.ballType=="normal"?null:State.players[c.owner].stock.FirstOrDefault(x=>x.id==c.ballType);
                bool hasStock=c.ballType=="normal"||(stockEntry!=null&&stockEntry.remaining>0);
                var hand=c.ballType=="phoenix"
                    ?State.phoenixHand?.FirstOrDefault(x=>x.owner==c.owner&&x.ready&&
                        x.createdOwnerTurns<State.players[c.owner].ownerTurns&&
                        x.lastProcessedOwnerTurns>=State.players[c.owner].ownerTurns)
                    :null;
                if(definition==null&&c.ballType=="normal"){reason="That ball has no stock in this deck.";return false;}
                if(definition==null||(!hasStock&&hand==null)){reason="That ball has no stock in this deck.";return false;}
                float angle=(float)Math.Atan2(c.dx,c.owner==0?-c.dy:c.dy);angle=Clamp(angle,-1.53589f,1.53589f);
                float vx=(float)Math.Sin(angle)*c.power,vy=(float)Math.Cos(angle)*c.power*(c.owner==0?-1:1);
                ball=Spawn(c.owner,c.ballType,270,c.owner==0?853:47,vx,vy);
                if(hasStock){if(c.ballType!="normal")stockEntry.remaining--;}
                else{
                    // A normal SPAWN after a REPLAY_RETURN, not a second RETURN event.
                    ball.maxHp=Math.Min(ball.maxHp,hand.maxHp);
                    ball.hp=Math.Min(ball.maxHp,Math.Max(1,hand.hp));
                    ball.shield=Math.Max(0,hand.shield);
                    State.phoenixHand.Remove(hand);
                }
                ball.launchImmune=true;
                State.actionKind=State.bonusPending?"bonus":"spawn";if(State.bonusPending){State.bonusPending=false;State.bonusUsed=true;}
            }else if(c.kind==CommandKind.Replay){
                ball=State.balls.FirstOrDefault(x=>x.id==c.ballId);
                if(!CanReplay(ball)){reason="Replay requires an unused friendly ball touching your home zone.";return false;}
                ball.vx=(float)(c.dx/length*c.power);ball.vy=(float)(c.dy/length*c.power);ball.launchImmune=true;
                State.replayedIds.Add(ball.id);State.actionKind="replay";
            }else{reason="Unknown command.";return false;}
            ball.affectedIds.Clear();ball.hitUsed=false;ball.wallUsed=false;ball.mineArmed=false;if(Catalog.Ball(ball.type).archetype=="earth")ball.anchorStacks=Math.Max(0,ball.anchorStacks-1);ball.frostguardAnchored=false;
            ball.phased=ball.type=="phase";ball.angle=(float)Math.Atan2(ball.vy,ball.vx);ball.motionPeak=c.power;
            State.phase=MatchPhase.Moving;State.actionTime=0;State.actionDeadline=14;State.settledTime=0;State.actionSerial++;State.revision++;
            Emit("LAUNCH",ball,State.actionKind);Abilities.OnLaunch(ball);return true;
        }
        public BallRuntime Spawn(int owner,string type,float x,float y,float vx=0,float vy=0)
        {
            var d=Catalog.Ball(type)??throw new ArgumentException("Unknown ball: "+type);
            var b=new BallRuntime{id=State.nextId++,owner=owner,type=type,x=x,y=y,vx=vx,vy=vy,hp=d.hp,maxHp=d.hp,radius=d.radius,mass=d.mass,restitution=d.restitution,wallRestitution=d.wallRestitution,maxSpeed=d.maxSpeed};
            b.lineageId=b.id;b.moving=Math.Sqrt(vx*vx+vy*vy)>=18;State.balls.Add(b);Emit("SPAWN",b,d.name);Abilities.OnSpawn(b);return b;
        }
        public void Step(float dt)
        {
            if(State.phase==MatchPhase.Over||!Finite(dt)||dt<=0)return;dt=Math.Min(dt,1f/30);State.time+=dt;if(State.phase!=MatchPhase.Moving)return;State.frame++;
            Physics.Step(dt);Rules.CheckVictory();if(State.phase==MatchPhase.Over||State.phase!=MatchPhase.Moving)return;
            State.actionTime+=dt;bool any=State.balls.Any(x=>!x.dead&&(x.moving||x.vx*x.vx+x.vy*x.vy>196));
            if(State.actionTime>=Math.Min(28,Math.Max(14,State.actionDeadline))){
                foreach(var b in State.balls.ToArray())if(!b.dead){b.vx=b.vy=0;if(b.moving){b.moving=false;b.stopCount++;Abilities.OnStop(b);}}
                foreach(var b in State.balls){b.vx=b.vy=0;b.moving=false;}Emit("MOTION_GUARD",null,"Bounded safety settle");Turns.ResolveAction();return;
            }
            State.settledTime=any?0:State.settledTime+dt;if(State.settledTime>=.16f)Turns.ResolveAction();
        }
        public void Damage(BallRuntime b,int amount,bool kinetic=false,int sourceId=0)
        {
            if(b==null||b.dead||amount<=0)return;int damage=kinetic?amount:Math.Max(5,Round(amount/5f)*5),absorbed=Math.Min(b.shield,damage);
            if(Abilities.BeforeDamage(b,kinetic))return;
            b.shield-=absorbed;damage-=absorbed;b.hp=Math.Max(0,b.hp-damage);b.lastDamageSourceId=sourceId;Emit("DAMAGE",b,damage>0?"-"+damage:"Shield");if(b.hp<=0)Kill(b);
        }
        public void Heal(BallRuntime b,int amount){if(b==null||b.dead||amount<=0)return;int before=b.hp;b.hp=Math.Min(b.maxHp,b.hp+Math.Max(5,Round(amount/5f)*5));if(b.hp>before)Emit("HEAL",b,"+"+(b.hp-before));}
        public void Shield(BallRuntime b,int amount,int cap=int.MaxValue){if(b==null||b.dead)return;b.shield=Math.Min(cap,b.shield+amount);Emit("SHIELD",b,"Shield +"+amount);}
        public void Kill(BallRuntime b)
        {
            if(b==null||b.dead)return;b.dead=true;b.vx=b.vy=0;
            if(!b.generated&&b.reviveGeneration==0&&!Catalog.Ball(b.type).hidden&&Catalog.Ball(b.type).tier!="unique"){
                State.graveyard.Add(new GraveRecord{owner=b.owner,type=b.type,ballId=b.id,maxHp=b.maxHp,lineageId=b.lineageId,life=b.life,turn=State.turnNumber,x=b.x,y=b.y});
                while(State.graveyard.Count(x=>x.owner==b.owner)>18)State.graveyard.Remove(State.graveyard.First(x=>x.owner==b.owner));
            }
            Emit("DEATH",b,Catalog.Ball(b.type).name);Abilities.OnDeath(b);
        }
        public void Emit(string kind,BallRuntime b,string text,int otherId=0)
        {
            State.events.Add(new GameEvent{id=++State.eventSerial,turn=State.turnNumber,ballId=b?.id??0,otherId=otherId,kind=kind,text=text,x=b?.x??270,y=b?.y??450,atTime=State.time});if(State.events.Count>100)State.events.RemoveAt(0);
        }
    }
}
