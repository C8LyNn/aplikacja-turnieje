using System;
using System.Collections.Generic;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;

namespace CoreClash.Presentation
{
    // CC-001 W24: a short show for the ball card. Each show is a tiny scripted situation played
    // by a private copy of the real rules: balls are put on the board, launched with ordinary
    // commands, turns pass, and whatever happens is what the simulation computes. Nothing here
    // draws, and nothing here can reach the live match.
    public enum DemoStepKind { Launch, Wait, PassTurn }
    public sealed class DemoStep { public DemoStepKind Kind;public int Owner;public string Type;public float X,Y,Power,Pause; }
    public sealed class DemoPiece { public int Owner,Hp,Fire,Ice;public string Type;public float X,Y;public bool Poison,Fallen; }

    public sealed class BallDemoScript
    {
        public readonly string Id;
        // The part of the board the show is filmed in (simulation units, the board is 540 x 900).
        public float Top=265,Bottom=625;
        // The event that proves the power was shown. The managed tests require it in every run.
        public string Proof="";
        public readonly List<DemoPiece> Pieces=new List<DemoPiece>();
        public readonly List<DemoStep> Steps=new List<DemoStep>();
        public BallDemoScript(string id){Id=id;}
        public BallDemoScript Window(float top,float bottom){Top=top;Bottom=bottom;return this;}
        public BallDemoScript Shows(string eventKind){Proof=eventKind;return this;}
        // owner 0 = you (launches from the bottom), owner 1 = the opponent (from the top).
        public BallDemoScript Put(int owner,string type,float x,float y,int hp=0,int fire=0,int ice=0,bool poison=false,bool fallen=false)
        {
            Pieces.Add(new DemoPiece{Owner=owner,Type=type,X=x,Y=y,Hp=hp,Fire=fire,Ice=ice,Poison=poison,Fallen=fallen});return this;
        }
        // An ordinary launch from that player's base towards (x, y) with the given power.
        public BallDemoScript Launch(int owner,string type,float x,float y,float power,float pause=1f)
        {
            Steps.Add(new DemoStep{Kind=DemoStepKind.Launch,Owner=owner,Type=type,X=x,Y=y,Power=power,Pause=pause});return this;
        }
        public BallDemoScript Wait(float seconds){Steps.Add(new DemoStep{Kind=DemoStepKind.Wait,Pause=seconds});return this;}
        // The acting player's turn ends without a shot, so effects that work "every turn" can be seen.
        public BallDemoScript PassTurn(float pause=1.2f){Steps.Add(new DemoStep{Kind=DemoStepKind.PassTurn,Pause=pause});return this;}
        // Power that makes a free launch from a base stop after `distance` units (measured, see the tests).
        public static float PowerFor(float distance)=>Math.Max(60,Math.Min(590,(distance+14)/1.175f));
    }

    public sealed class BallDemoPlayer
    {
        public const float StepSeconds=1f/120;
        public readonly BallDemoScript Script;
        public readonly GameSimulation Simulation;
        // Every event kind the rules produced during the show (the event list itself is bounded).
        public readonly HashSet<string> Seen=new HashSet<string>(StringComparer.Ordinal);
        public bool Finished{get;private set;}
        public float Elapsed{get;private set;}
        // Time already passed since the last simulation step; lets the view draw moving balls smoothly.
        public float Lead=>accumulator;
        int step,cursor;float wait=.8f,accumulator,pauseAfterAction,newsAt;bool acting;
        const float QuietSeconds=2.2f;
        // Events that are only balls coming to rest; they do not keep the show open.
        static bool News(string kind)=>kind!="STOP"&&kind!="START"&&kind!="TOUCH"&&kind!="WALL_TOUCH"&&kind!="WALL_HIT"&&kind!="MOTION_GUARD"&&kind!="BASE_DAMAGE"&&kind!="TURN";
        void Collect()
        {
            var state=Simulation.State;
            foreach(var e in state.events)if(e.id>cursor){Seen.Add(e.kind);if(News(e.kind)||e.kind==Script.Proof)newsAt=Elapsed;}
            cursor=state.eventSerial;
        }

        public BallDemoPlayer(Catalog catalog,BallDemoScript script)
        {
            if(catalog==null)throw new ArgumentNullException(nameof(catalog));
            Script=script??throw new ArgumentNullException(nameof(script));
            var deck=catalog.AllDecks.First();
            Simulation=new GameSimulation(catalog,deck,deck);
            var state=Simulation.State;
            // The opening-turn bonus shot is not part of any show.
            state.bonusUsed=true;
            foreach(var piece in script.Pieces)
            {
                var ball=Simulation.Spawn(piece.Owner,piece.Type,piece.X,piece.Y);
                if(piece.Hp>0)ball.hp=Math.Min(ball.maxHp,piece.Hp);
                for(int i=0;i<piece.Fire;i++)Simulation.Abilities.ApplyFire(ball,1-piece.Owner);
                for(int i=0;i<piece.Ice;i++)Simulation.Abilities.ApplyIce(ball,1-piece.Owner);
                if(piece.Poison)Simulation.Abilities.ApplyToxin(ball,1-piece.Owner);
                if(piece.Fallen)Simulation.Kill(ball);
            }
            cursor=state.eventSerial;
        }

        public void Advance(float seconds)
        {
            if(!(seconds>0))return;
            accumulator=Math.Min(accumulator+seconds,.25f);
            while(accumulator>=StepSeconds){Tick();accumulator-=StepSeconds;}
        }

        void Tick()
        {
            Elapsed+=StepSeconds;
            var state=Simulation.State;
            Simulation.Step(StepSeconds);
            Collect();
            if(Finished)return;
            if(state.phase==MatchPhase.Moving)
            {
                if(step>=Script.Steps.Count&&Seen.Contains(Script.Proof)&&Elapsed-newsAt>QuietSeconds)Finished=true;
                return;
            }
            if(acting){acting=false;wait=pauseAfterAction;}
            if(wait>0){wait-=StepSeconds;return;}
            if(state.phase==MatchPhase.Over||step>=Script.Steps.Count){Finished=true;return;}
            var next=Script.Steps[step++];
            newsAt=Elapsed;
            switch(next.Kind)
            {
                case DemoStepKind.Wait:wait=next.Pause;break;
                case DemoStepKind.PassTurn:
                    state.actionKind=null;Simulation.Turns.ResolveAction();wait=next.Pause;
                    break;
                case DemoStepKind.Launch:
                    state.turn=next.Owner;
                    if(next.Type!="normal")
                    {
                        // The show's deck is not the point: make sure one copy of the launched ball is in stock.
                        var stock=state.players[next.Owner].stock.FirstOrDefault(entry=>entry.id==next.Type);
                        if(stock==null)state.players[next.Owner].stock.Add(new StockEntry{id=next.Type,remaining=1});
                        else if(stock.remaining<1)stock.remaining=1;
                    }
                    var command=new PlayerCommand{owner=next.Owner,turnNumber=state.turnNumber,kind=CommandKind.Spawn,ballType=next.Type,
                        dx=next.X-270,dy=next.Y-(next.Owner==0?853:47),power=next.Power};
                    if(Simulation.TryCommand(command,out _)){acting=true;pauseAfterAction=next.Pause;}
                    Collect();
                    break;
            }
        }
    }

    public static class BallDemos
    {
        static readonly Dictionary<string,BallDemoScript> Scripts=new Dictionary<string,BallDemoScript>(StringComparer.Ordinal);
        public static IEnumerable<string> Ids=>Scripts.Keys;
        public static BallDemoScript For(string id)=>id!=null&&Scripts.TryGetValue(id,out var script)?script:null;
        static BallDemoScript Show(string id){var script=new BallDemoScript(id);Scripts.Add(id,script);return script;}
        // How long a show runs, in its own seconds. Measured once by playing it through (a few milliseconds).
        static readonly Dictionary<string,float> Lengths=new Dictionary<string,float>(StringComparer.Ordinal);
        public static float Length(Catalog catalog,BallDemoScript script)
        {
            if(script==null||catalog==null)return 0;
            if(Lengths.TryGetValue(script.Id,out float known))return known;
            var player=new BallDemoPlayer(catalog,script);
            for(int guard=0;!player.Finished&&guard<120*45;guard++)player.Advance(BallDemoPlayer.StepSeconds);
            return Lengths[script.Id]=player.Elapsed;
        }
        // Power for your launch (from the bottom base) that stops at height y on the centre line.
        static float Up(float y)=>BallDemoScript.PowerFor(853-y);
        // Power for the opponent's launch (from the top base) that stops at height y on the centre line.
        static float Down(float y)=>BallDemoScript.PowerFor(y-47);
        const float Hard=590;

        static BallDemos()
        {
            Show("normal").Shows("HIT")
                .Put(1,"normal",270,420)
                .Launch(0,"normal",270,420,Hard);

            // Explosives.
            Show("bomb").Shows("EXPLOSION")
                .Put(1,"normal",205,400).Put(1,"normal",335,410).Put(0,"normal",180,520)
                .Launch(0,"bomb",270,460,Up(460),1.6f);
            Show("mine").Shows("EXPLOSION")
                .Launch(0,"mine",270,480,Up(480))
                .Launch(1,"normal",270,480,Down(520),1.6f);
            Show("timebomb").Shows("EXPLOSION")
                .Put(1,"normal",205,410).Put(1,"normal",335,420)
                .Launch(0,"timebomb",270,470,Up(470))
                .PassTurn().PassTurn().PassTurn(1.8f);

            // Fire.
            Show("fire").Shows("FIRE")
                .Put(1,"normal",270,420)
                .Launch(0,"fire",270,420,Up(375),1.4f)
                .PassTurn().PassTurn(1.4f);
            Show("furnace").Shows("FIRE")
                .Put(1,"normal",200,430).Put(1,"normal",345,440)
                .Launch(0,"furnace",270,480,Up(480))
                .PassTurn(1.4f).PassTurn(1.6f);
            Show("bonfire").Shows("BONFIRE")
                .Put(0,"bonfire",270,470,5).Put(0,"normal",200,520,15).Put(1,"normal",345,440)
                .Launch(1,"normal",270,470,Hard,1.8f);

            // Ice.
            Show("ice").Shows("FREEZE")
                .Put(1,"normal",270,410,0,0,2).Put(1,"normal",205,385).Put(1,"normal",335,385)
                .Launch(0,"ice",270,410,Up(400),1.8f);
            Show("shatterer").Shows("SHATTER")
                .Put(1,"normal",270,420,0,0,2)
                .Launch(0,"shatterer",270,420,Up(400),1.8f);
            Show("frosttrap").Shows("TRAP_TRIGGER")
                .Launch(0,"frosttrap",270,480,Up(480))
                .Launch(1,"normal",270,480,Hard,1.8f);

            // Poison.
            // The first Venom comes in off-centre, so it glances away and leaves the way open for the second.
            Show("venom").Shows("VENOM")
                .Put(1,"normal",270,420)
                .Launch(0,"venom",240,420,BallDemoScript.PowerFor(470),1.2f)
                .PassTurn(1f)
                .Launch(0,"venom",300,380,Hard,1.8f);
            Show("blightpool").Shows("TOXIN")
                .Put(1,"normal",190,400).Put(1,"normal",345,420)
                .Launch(0,"blightpool",270,480,Up(480),1.6f)
                .PassTurn(1.4f).PassTurn(1.4f);
            Show("plagueleech").Shows("DRAIN")
                .Put(1,"normal",270,420)
                .Launch(0,"plagueleech",270,420,Up(410),1.4f)
                .PassTurn(1.8f);

            // Traps and movement.
            Show("gravitymine").Shows("EXPLOSION")
                .Launch(0,"gravitymine",270,500,Up(500))
                .Launch(1,"normal",270,500,Down(430),1.8f);
            Show("web").Shows("ROOTED")
                .Launch(0,"web",270,500,Up(500))
                .Launch(1,"normal",270,500,Hard,1.8f);
            Show("harpoon").Window(230,630).Shows("PULL")
                .Put(1,"normal",150,330).Put(1,"normal",330,440)
                .Launch(0,"harpoon",270,520,Up(520),2f);
            // Pulse has no event of its own: the proof is the balls it sets in motion once it has stopped.
            Show("pulse").Shows("START")
                .Put(1,"normal",205,420).Put(1,"normal",335,430).Put(0,"normal",190,540)
                .Launch(0,"pulse",270,480,Up(480),1.8f);
            Show("timeshift").Shows("SWAP")
                .Put(1,"normal",320,420)
                .Launch(0,"timeshift",270,490,Up(490),1.8f);
            // Portals open next to the ball and at the mirrored spot; the second shot goes into the far one.
            Show("gatekeeper").Window(290,650).Shows("PORTAL")
                .Launch(0,"gatekeeper",150,560,BallDemoScript.PowerFor(317))
                .PassTurn(.6f)
                .Launch(0,"normal",390,340,BallDemoScript.PowerFor(760),1.8f);
            Show("slingshot").Window(200,600).Shows("SLINGSHOT")
                .Put(0,"normal",150,530).Put(0,"normal",390,530).Put(1,"normal",222,290).Put(1,"normal",318,290)
                .Launch(0,"slingshot",270,470,Up(470),1.8f);
            Show("pinballer").Shows("BOUNCE")
                .Launch(0,"pinballer",110,470,BallDemoScript.PowerFor(415))
                .PassTurn(.6f)
                .Launch(0,"normal",60,470,Hard,1.8f);

            // Support.
            Show("vortexmedic").Shows("HEAL")
                .Put(0,"normal",190,545,10).Put(0,"normal",326,441).Put(1,"normal",395,395)
                .Launch(0,"vortexmedic",270,480,Up(480),1.8f);
            Show("ward").Shows("CLEANSE")
                .Put(0,"normal",195,500,0,1).Put(0,"normal",345,500,0,0,0,true)
                .Launch(0,"ward",270,470,Up(470),1.8f);
            Show("halo").Shows("DIVINE_SHIELD")
                .Put(0,"halo",270,430)
                .Launch(1,"normal",270,430,BallDemoScript.PowerFor(520),2f);

            // Death powers.
            Show("cascade").Shows("RETURN")
                .Put(0,"cascade",270,470,5)
                .Launch(1,"normal",270,470,Hard,1.8f);
            Show("agony").Shows("BONFIRE")
                .Put(0,"bonfire",270,420).Put(1,"normal",205,385).Put(1,"normal",335,390).Put(0,"normal",195,480,15)
                .Launch(0,"agony",270,420,Up(410),1.8f);
            // The hole swallows the attacker, grows as turns pass, and takes the next balls that move near it.
            Show("singularity").Shows("CONSUME")
                .Put(0,"singularity",270,460,5).Put(1,"normal",222,442).Put(1,"normal",318,478)
                .Launch(1,"normal",270,460,Hard,1.2f)
                .PassTurn(1f).PassTurn(1f)
                .Launch(0,"normal",270,460,Up(540),1.8f);
            Show("reclaimer").Shows("RETURN")
                .Put(0,"fire",150,420,0,0,0,false,true)
                .Launch(0,"reclaimer",270,470,Up(470),2f);

            // Tricks.
            Show("traitor").Shows("OWNERSHIP")
                .Put(1,"furnace",270,410)
                .Launch(0,"traitor",270,410,Up(400),2f);
            Show("chronomancer").Shows("REWIND")
                .Launch(0,"chronomancer",270,480,Up(480),1.2f)
                .Launch(1,"normal",270,480,Hard,2f);
            // Echo stops next to a Ward that is already on the board: the Ward's power works again.
            Show("echo").Shows("CLEANSE")
                .Put(0,"ward",200,520).Put(0,"normal",150,440,0,1)
                .Launch(0,"echo",290,480,BallDemoScript.PowerFor(375),2f);
        }
    }
}
