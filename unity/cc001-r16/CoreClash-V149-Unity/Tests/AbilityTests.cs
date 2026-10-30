using CoreClash.Core;
using System.Linq;
public static partial class Program
{
    static void AbilityTests()
    {
        Test("fire and ice cancel the opposite status before adding stacks",()=>{var s=Sim();var b=s.Spawn(1,"normal",270,450);s.Abilities.ApplyFire(b,0);Eq(1,b.fireStacks);s.Abilities.ApplyIce(b,0);Eq(0,b.fireStacks);Eq(0,b.iceStacks);s.Abilities.ApplyIce(b,0);s.Abilities.ApplyIce(b,0);s.Abilities.ApplyIce(b,0);Near(2.4f,b.frozen);Eq(0,b.iceStacks);});
        Test("toxin ticks only on target owner turns",()=>{var s=Sim();var b=s.Spawn(1,"normal",270,450);s.Abilities.ApplyToxin(b,0);s.Abilities.OnTurnStart(0);Eq(30,b.hp);s.Abilities.OnTurnStart(1);Eq(25,b.hp);Eq(2,b.toxinTurns);});
        Test("blight zone infects at turn end and expires after three ticks",()=>{var s=Sim();var z=s.Spawn(0,"blightpool",200,450);var t=s.Spawn(1,"normal",280,450);s.Abilities.OnStop(z);Eq(1,s.State.zones.Count);Eq(0,t.toxinTurns);s.Abilities.OnTurnEnd(0);Eq(3,t.toxinTurns);s.State.turnNumber++;s.Abilities.OnTurnEnd(1);s.State.turnNumber++;s.Abilities.OnTurnEnd(0);True(s.State.zones[0].dead);});
        Test("consecrator cleanse emits an Absolver shield payoff",()=>{var s=Sim();var c=s.Spawn(0,"consecrator",200,450);s.Spawn(0,"absolver",100,450);var ally=s.Spawn(0,"normal",270,450);s.Abilities.ApplyToxin(ally,1);s.Abilities.OnStop(c);s.Abilities.OnTurnEnd(0);Eq(0,ally.toxinTurns);Eq(5,ally.shield);});
        Test("Ward cleans modeled negative statuses and adds cleanse payoff",()=>{var s=Sim();var w=s.Spawn(0,"ward",200,450);s.Spawn(0,"absolver",120,450);var a=s.Spawn(0,"normal",280,450);s.Abilities.ApplyToxin(a,1);s.Abilities.ApplyFire(a,1);s.Abilities.OnStop(w);Eq(0,a.fireStacks);Eq(0,a.toxinTurns);Eq(10,a.shield);});
        Test("Penitent transfers oldest eligible status rather than cleansing it",()=>{var s=Sim();var p=s.Spawn(0,"penitent",200,450);var a=s.Spawn(0,"normal",260,450);s.Abilities.ApplyToxin(a,1);s.Abilities.ApplyFire(a,1);s.Abilities.OnContact(p,a,false,true,40);Eq(3,p.toxinTurns);Eq(0,a.toxinTurns);Eq(1,a.fireStacks);});
        Test("Septic Core needs two qualified hits across per-target turn limits",()=>{var s=Sim();var a=s.Spawn(0,"septiccore",200,450);var b=s.Spawn(1,"normal",260,450);s.Abilities.ApplyToxin(b,0);s.Abilities.OnContact(a,b,true,true,120);Eq(30,b.hp);s.Abilities.OnContact(a,b,true,true,120);Eq(30,b.hp);s.State.turnNumber++;a.turnAffectedIds.Clear();s.Abilities.OnContact(a,b,true,true,120);Eq(25,b.hp);});
        Test("rooted enemies enable Briarheart and cannot be displaced",()=>{var s=Sim();var a=s.Spawn(0,"briarheart",200,450);var b=s.Spawn(1,"normal",260,450);s.Abilities.Root(b);s.Abilities.OnContact(a,b,true,true,120);Eq(25,b.hp);b.vx=300;s.Physics.Step(1f/120);Near(260,b.x);});
        Test("Bonfire copied death effect heals allies and burns enemies without killing source",()=>{var s=Sim();var a=s.Spawn(0,"agony",180,450);var f=s.Spawn(0,"bonfire",230,450);var ally=s.Spawn(0,"normal",280,450);ally.hp=20;var enemy=s.Spawn(1,"normal",250,480);s.Abilities.OnContact(a,f,false,true,40);False(f.dead);Eq(25,ally.hp);Eq(20,enemy.hp);Eq(1,enemy.fireStacks);});
        Test("Cascade return chain preserves lineage and has no fourth life",()=>{var s=Sim();var c=s.Spawn(0,"cascade",270,450);s.Kill(c);var c2=s.State.balls.Last();Eq(10,c2.maxHp);Eq(c.lineageId,c2.lineageId);s.Kill(c2);var c3=s.State.balls.Last();Eq(5,c3.maxHp);s.Kill(c3);Eq(0,s.State.balls.Count(b=>!b.dead));});
        Test("Packheart rewards returned ally once per target turn",()=>{var s=Sim();s.Spawn(0,"packheart",100,450);var c=s.Spawn(0,"cascade",270,450);s.Kill(c);var child=s.State.balls.Last();Eq(5,child.shield);s.Abilities.EmitReturn(c,child);Eq(5,child.shield);});
        Test("Gravehide upgrades after qualifying returns on three turns",()=>{var s=Sim();var g=s.Spawn(0,"gravehide",100,450);var c=s.Spawn(0,"normal",300,450);int max=g.maxHp;for(int i=0;i<3;i++){s.State.turnNumber++;s.Abilities.EmitReturn(c,c);}Eq(max+10,g.maxHp);Near(catalog.Ball("gravehide").mass+.2f,g.mass);});
        Test("singularity consume does not fire death or add graveyard records",()=>{var s=Sim();var source=s.Spawn(0,"singularity",100,450);var bomb=s.Spawn(1,"bonfire",270,450);s.Abilities.Consume(0,source.id,bomb);False(s.State.balls.Contains(bomb));Eq(0,s.State.graveyard.Count);Eq(20,s.State.players[0].hp);});
        // R17-W4 A40: test-first lifecycle/RETURN contract (authored assertions; execution is separately gated).
        Test("W4 A40 Den Mother makes one token SPAWN per instance per turn without RETURN",()=>{
            var s=Sim();var mother=s.Spawn(0,"denmother",100,450);var first=s.Spawn(0,"booster",250,450);
            int before=s.State.events.Count(e=>e.kind=="RETURN");
            s.Kill(first);var pups=s.State.balls.Where(b=>b.type=="broodling"&&!b.dead).ToArray();
            Eq(1,pups.Length);Eq(5,pups[0].hp);True(pups[0].generated);Eq(0,pups[0].owner);
            True(s.State.events.Any(e=>e.kind=="SPAWN"&&e.ballId==pups[0].id));
            Eq(before,s.State.events.Count(e=>e.kind=="RETURN"));
            var second=s.Spawn(0,"relay",360,450);s.Kill(second);
            Eq(1,s.State.balls.Count(b=>b.type=="broodling"&&!b.dead));
            s.State.turnNumber++;s.Kill(s.Spawn(0,"armorer",300,550));
            Eq(2,s.State.balls.Count(b=>b.type=="broodling"&&!b.dead));
            Eq(s.State.turnNumber,mother.lastDenMotherTurn);
        });
        Test("W4 A40 two Den Mothers independently observe eligible ally death",()=>{
            var s=Sim();s.Spawn(0,"denmother",70,270);s.Spawn(0,"denmother",470,270);
            s.Kill(s.Spawn(0,"booster",270,450));
            Eq(2,s.State.balls.Count(b=>b.type=="broodling"&&!b.dead));
        });
        Test("W4 A40 Den Mother ignores non-Beasts enemies and Beast tokens",()=>{
            var s=Sim();s.Spawn(0,"denmother",95,260);
            s.Kill(s.Spawn(0,"normal",240,450));
            s.Kill(s.Spawn(1,"booster",310,450));
            s.Kill(s.Spawn(0,"broodling",360,450));
            Eq(0,s.State.balls.Count(b=>b.type=="broodling"&&!b.dead));
        });
        Test("W4 A40 Dirge repeats remote nearest ally death body without second DEATH",()=>{
            var s=Sim();var dirge=s.Spawn(0,"dirge",90,300);
            var bonfire=s.Spawn(0,"bonfire",400,550);
            int deaths=s.State.events.Count(e=>e.kind=="DEATH");
            s.Kill(dirge);
            False(bonfire.dead);Eq(deaths+1,s.State.events.Count(e=>e.kind=="DEATH"));
            True(s.State.events.Any(e=>e.kind=="BONFIRE"&&e.ballId==bonfire.id));
            False(s.State.graveyard.Any(g=>g.ballId==bonfire.id));
        });
        Test("W4 A40 Revenant emits RETURN REVIVE not SPAWN and uses serialized RNG",()=>{
            var s=Sim();s.State.randomState=1234567;var rev=s.Spawn(0,"revenant",270,440);
            int n=s.State.events.Count;s.Kill(rev);
            var child=s.State.balls.Single(b=>!b.dead&&b.id!=rev.id);
            Eq(10,child.hp);Eq(0,child.owner);Eq(rev.lineageId,child.lineageId);Eq(rev.life+1,child.life);
            False(child.generated);False(child.type=="revenant"||child.type=="mirage");
            False(s.Catalog.Ball(child.type).hidden);False(s.Catalog.Ball(child.type).tier=="unique");
            False(s.State.graveyard.Any(g=>g.ballId==rev.id));
            True(s.State.replayedIds.Contains(child.id));
            False(s.State.events.Skip(n).Any(e=>e.kind=="SPAWN"&&e.ballId==child.id));
            True(s.State.events.Skip(n).Any(e=>e.kind=="RETURN"&&e.ballId==child.id&&e.text=="REVIVE"));
            True(s.State.events.Skip(n).Any(e=>e.kind=="DEATH"&&e.ballId==rev.id));
        });
        Test("W4 A40 Soul Anchor restores newest ally grave near recorded death position",()=>{
            var s=Sim();var older=s.Spawn(0,"booster",190,390);s.Kill(older);
            var newer=s.Spawn(0,"booster",355,530);s.Kill(newer);
            var anchor=s.Spawn(0,"soulanchor",110,270);int serial=s.State.eventSerial;s.Kill(anchor);
            var child=s.State.balls.Single(b=>!b.dead);
            Eq(10,child.hp);Eq(0,child.owner);Eq(newer.lineageId,child.lineageId);
            Eq(newer.life+1,child.life);Eq(1,child.reviveGeneration);
            True(System.Math.Abs(child.x-newer.x)<180&&System.Math.Abs(child.y-newer.y)<180);
            False(s.State.graveyard.Any(g=>g.ballId==newer.id));
            True(s.State.graveyard.Any(g=>g.ballId==older.id));
            True(s.State.graveyard.Any(g=>g.ballId==anchor.id));
            False(s.State.events.Any(e=>e.id>serial&&e.kind=="SPAWN"&&e.ballId==child.id));
            Eq(1,s.State.events.Count(e=>e.id>serial&&e.kind=="RETURN"&&e.ballId==child.id&&e.text=="REVIVE"));
            True(s.State.replayedIds.Contains(child.id));
        });
        Test("W4 A40 capped Revenant creates no child or false RETURN",()=>{
            var s=Sim();var rev=s.Spawn(0,"revenant",270,440);
            for(int i=0;i<256;i++)s.Spawn(0,"normal",150,390);
            int before=s.State.balls.Count;s.Kill(rev);
            Eq(before,s.State.balls.Count);
            False(s.State.events.Any(e=>e.kind=="RETURN"&&e.otherId==rev.id));
        });
        Test("W4 A40 Soul Anchor placement failure leaves allied grave intact",()=>{
            var s=Sim();var earlier=s.Spawn(0,"booster",250,450);s.Kill(earlier);
            var anchorBall=s.Spawn(0,"soulanchor",150,330);
            for(int i=0;i<256;i++)s.Spawn(0,"normal",150,390);
            s.Kill(anchorBall);
            True(s.State.graveyard.Any(g=>g.ballId==earlier.id));
            False(s.State.events.Any(e=>e.kind=="RETURN"&&e.otherId==anchorBall.id));
        });
        Test("W4 A40 Den Mother spends limit when legal observation hits living cap",()=>{
            var s=Sim();var mother=s.Spawn(0,"denmother",100,450);
            for(int i=0;i<255;i++)s.Spawn(0,"normal",140,430);
            var dead=s.Spawn(0,"booster",270,450);s.Kill(dead);
            Eq(s.State.turnNumber,mother.lastDenMotherTurn);
            False(s.State.balls.Any(b=>b.type=="broodling"));
            s.Kill(s.Spawn(0,"booster",350,450));
            False(s.State.balls.Any(b=>b.type=="broodling"));
        });
        Test("W4 A40 Dirge never substitutes distant supported ally for nearer unported body",()=>{
            var s=Sim();var dirge=s.Spawn(0,"dirge",150,450);
            s.Spawn(0,"deathshield",210,450);s.Spawn(0,"bonfire",450,450);
            s.Kill(dirge);
            False(s.State.events.Any(e=>e.kind=="BONFIRE"));
        });
        Test("W4 A40 Phoenix entry aura hits allies and enemies once per entry",()=>{
            var s=Sim();var phoenix=s.Spawn(0,"phoenix",270,450);
            var ally=s.Spawn(0,"normal",300,450);var enemy=s.Spawn(1,"normal",350,450);
            s.Abilities.OnStep(1f/120);
            Eq(25,ally.hp);Eq(25,enemy.hp);Eq(1,ally.fireStacks);Eq(1,enemy.fireStacks);
            s.Abilities.OnStep(1f/120);
            Eq(25,ally.hp);Eq(25,enemy.hp);
            True(phoenix.phoenixEntryTimer>0);
        });
        Test("W4 A40 lifecycle hand observer and RNG persist through JSON snapshot",()=>{
            var s=Sim();s.Spawn(0,"packheart",150,450);
            var phoenix=s.Spawn(0,"phoenix",270,440);s.Kill(phoenix);
            var den=s.Spawn(0,"denmother",100,250);s.Kill(s.Spawn(0,"booster",310,450));
            s.State.randomState=0xBEEF1234;
            var options=new System.Text.Json.JsonSerializerOptions{IncludeFields=true};
            string snapshot=System.Text.Json.JsonSerializer.Serialize(s.State,options);
            var restored=System.Text.Json.JsonSerializer.Deserialize<GameState>(snapshot,options);
            Eq(s.State.randomState,restored.randomState);
            Eq(1,restored.phoenixHand.Count);Eq(5,restored.phoenixHand[0].hp);
            Eq(5,restored.phoenixHand[0].shield);
            Eq(den.lastDenMotherTurn,restored.balls.Single(b=>b.id==den.id).lastDenMotherTurn);
        });
        Test("W4 A40 Phoenix death records replay-return hand and regenerates on next owner turn",()=>{
            var s=Sim();var p=s.Spawn(0,"phoenix",250,440);int eventId=s.State.eventSerial;s.Kill(p);
            Eq(1,s.State.phoenixHand.Count);
            var h=s.State.phoenixHand[0];Eq(p.owner,h.owner);Eq(5,h.hp);False(h.ready);
            False(s.State.graveyard.Any(g=>g.ballId==p.id));
            Eq(1,s.State.events.Count(e=>e.id>eventId&&e.kind=="RETURN"&&e.text=="REPLAY_RETURN"));
            s.State.players[0].ownerTurns++;s.Abilities.OnTurnStart(0);
            True(h.ready);Eq(10,h.hp);
            s.State.players[0].ownerTurns++;s.Abilities.OnTurnStart(0);
            Eq(15,h.hp);
        });
        Test("W4 A40 authorized Phoenix hand spawn consumes only ready hand and emits ordinary SPAWN",()=>{
            var s=Sim();var p=s.Spawn(0,"phoenix",270,440);s.Kill(p);
            Eq(0,s.Stock(0,"phoenix"));
            var command=Shot(s,0,"phoenix");
            int countBefore=s.State.balls.Count;
            int serial=s.State.eventSerial;
            False(s.TryCommand(command,out _));Eq(1,s.State.phoenixHand.Count);
            s.State.players[0].ownerTurns++;
            s.Abilities.OnTurnStart(0);
            Eq(10,s.State.phoenixHand.Single().hp);
            True(s.TryCommand(command,out _));
            var born=s.State.balls.Last();
            Eq(countBefore+1,s.State.balls.Count);
            Eq("phoenix",born.type);Eq(10,born.hp);
            Eq(0,s.Stock(0,"phoenix"));Eq(0,s.State.phoenixHand.Count);
            Eq(1,s.State.events.Count(e=>e.id>serial&&e.kind=="SPAWN"&&e.ballId==born.id));
            Eq(0,s.State.events.Count(e=>e.id>serial&&e.kind=="RETURN"));
            False(s.TryCommand(command,out _));
        });
        Test("W4 A40 Phoenix stored Shield transfers exactly once on deliberate hand spawn",()=>{
            var s=Sim();s.Spawn(0,"packheart",110,450);
            var p=s.Spawn(0,"phoenix",270,440);s.Kill(p);
            Eq(5,s.State.phoenixHand.Single().shield);
            s.State.players[0].ownerTurns++;s.Abilities.OnTurnStart(0);
            True(s.TryCommand(Shot(s,0,"phoenix"),out _));
            Eq(5,s.State.balls.Last().shield);
            Eq(0,s.State.phoenixHand.Count);
        });
        Test("W4 A40 Phoenix stock has precedence over ready hand as in V148",()=>{
            var s=Sim();var original=s.Spawn(0,"phoenix",270,440);s.Kill(original);
            s.State.players[0].stock.Add(new StockEntry{id="phoenix",remaining=1});
            s.State.players[0].ownerTurns++;s.Abilities.OnTurnStart(0);
            True(s.TryCommand(Shot(s,0,"phoenix"),out _));
            Eq(0,s.Stock(0,"phoenix"));
            Eq(1,s.State.phoenixHand.Count);
            Eq(s.Catalog.Ball("phoenix").hp,s.State.balls.Last().hp);
        });
        Test("W4 A40 non-Earth Frostguard replay preserves genuine Earth stacks",()=>{
            var s=Sim();var guard=s.Spawn(0,"frostguard",270,805);
            guard.anchorStacks=2;guard.frostguardAnchored=true;
            var cmd=Shot(s);cmd.kind=CommandKind.Replay;cmd.ballId=guard.id;
            True(s.TryCommand(cmd,out _));
            Eq(2,guard.anchorStacks);False(guard.frostguardAnchored);
        });
        Test("W4 A40 genuine Earth archetype replay spends exactly one Earth stack",()=>{
            var s=Sim();var earth=s.Spawn(0,"anchor",270,805);
            earth.anchorStacks=2;
            var cmd=Shot(s);cmd.kind=CommandKind.Replay;cmd.ballId=earth.id;
            True(s.TryCommand(cmd,out _));
            Eq(1,earth.anchorStacks);
        });
        Test("W4 A40 malformed Phoenix command cannot consume hand or stock",()=>{
            var s=Sim();var p=s.Spawn(0,"phoenix",270,440);s.Kill(p);
            s.State.players[0].ownerTurns++;s.Abilities.OnTurnStart(0);
            var cmd=Shot(s,0,"phoenix");cmd.dx=float.NaN;
            False(s.TryCommand(cmd,out _));
            Eq(1,s.State.phoenixHand.Count);
            cmd=Shot(s,1,"phoenix");False(s.TryCommand(cmd,out _));
            Eq(1,s.State.phoenixHand.Count);
        });
        Test("W4 A40 grave cap keeps newest allied record for Soul Anchor and DEATH precedes RETURN",()=>{
            var s=Sim();
            for(int i=0;i<18;i++){var b=s.Spawn(0,"booster",160,370);s.Kill(b);}
            var newest=s.Spawn(0,"booster",325,540);s.Kill(newest);
            Eq(18,s.State.graveyard.Count(g=>g.owner==0));
            var anchor=s.Spawn(0,"soulanchor",110,250);
            int after=s.State.eventSerial;s.Kill(anchor);
            var revived=s.State.balls.Last();
            Eq(newest.lineageId,revived.lineageId);
            // 18 records before Soul Anchor death, then its own record displaces
            // the oldest, and successful revive consumes the newest: 17 remain.
            Eq(17,s.State.graveyard.Count(g=>g.owner==0));
            int deathId=s.State.events.Where(e=>e.id>after&&e.kind=="DEATH"&&e.ballId==anchor.id).Select(e=>e.id).Single();
            int returnId=s.State.events.Where(e=>e.id>after&&e.kind=="RETURN"&&e.ballId==revived.id).Select(e=>e.id).Single();
            True(deathId<returnId);
        });
        Test("W5 A40 source-truth excluded grave types cannot become Soul Anchor candidates",()=>{
            var s=Sim();var valid=s.Spawn(0,"booster",230,470);s.Kill(valid);
            var standard=s.Spawn(0,"normal",160,350);s.Kill(standard);
            var cascade=s.Spawn(0,"cascade",355,430);s.Kill(cascade);
            var genesis=s.Spawn(0,"genesis",350,540);s.Kill(genesis);
            True(s.State.graveyard.Any(g=>g.ballId==valid.id));
            False(s.State.graveyard.Any(g=>g.ballId==standard.id));
            False(s.State.graveyard.Any(g=>g.ballId==cascade.id));
            False(s.State.graveyard.Any(g=>g.ballId==genesis.id));
            var anchor=s.Spawn(0,"soulanchor",90,250);s.Kill(anchor);
            var returned=s.State.balls.Single(b=>!b.dead&&b.lineageId==valid.lineageId);
            Eq(10,returned.hp);Eq(1,returned.reviveGeneration);
            False(s.State.graveyard.Any(g=>g.ballId==valid.id));
        });
        Test("W5 A40 excluded deaths cannot evict oldest eligible grave at cap 18",()=>{
            var s=Sim();int firstId=0;
            for(int i=0;i<18;i++){var b=s.Spawn(0,"booster",160,360);if(i==0)firstId=b.id;s.Kill(b);}
            Eq(18,s.State.graveyard.Count(g=>g.owner==0));
            s.Kill(s.Spawn(0,"normal",260,400));
            s.Kill(s.Spawn(0,"cascade",350,560));
            s.Kill(s.Spawn(0,"genesis",420,460));
            Eq(18,s.State.graveyard.Count(g=>g.owner==0));
            True(s.State.graveyard.Any(g=>g.ballId==firstId));
        });
        // R17-W9 A40: authoritative gameplay-seat invariants for genuine P1/P2 network play.
        // Tests exercise GameSimulation only; they do not falsely certify GUI or NGO transport.
        Test("W9 A40 P2 command cannot launch on P1 turn and P1 cannot act during P2 aim",()=>{
            var s=Sim();int beforeEvent=s.State.eventSerial;
            False(s.TryCommand(Shot(s,1,"fire"),out _));
            Eq(0,s.State.actionSerial);Eq(beforeEvent,s.State.eventSerial);
            Eq(7,s.Stock(1,"fire"));Eq(0,s.State.balls.Count);
            True(s.TryCommand(Shot(s,0),out _));Settle(s);
            Eq(1,s.State.turn);Eq(2,s.State.turnNumber);Eq(MatchPhase.Aiming,s.State.phase);
            int serial=s.State.eventSerial,action=s.State.actionSerial;
            False(s.TryCommand(Shot(s,0,"fire"),out _));
            Eq(serial,s.State.eventSerial);Eq(action,s.State.actionSerial);
            Eq(7,s.Stock(0,"fire"));
            True(s.TryCommand(Shot(s,1,"fire"),out _));
            Eq(action+1,s.State.actionSerial);Eq(7,s.Stock(0,"fire"));Eq(6,s.Stock(1,"fire"));
            var launched=s.State.balls.Last();
            Eq(1,launched.owner);Eq("fire",launched.type);
            Near(47f,launched.y);True(launched.vy>0,"P2 launch must travel from top towards board");
            True(s.State.events.Any(e=>e.kind=="LAUNCH"&&e.ballId==launched.id&&e.turn==s.State.turnNumber));
        });
        Test("W9 A40 P2 bonus remains P2 turn and cannot grant P1 a phantom shot",()=>{
            var s=Sim();True(s.TryCommand(Shot(s,0),out _));Settle(s);
            Eq(1,s.State.turn);Eq(2,s.State.turnNumber);
            Eq(1,s.State.players[1].ownerTurns);
            True(s.TryCommand(Shot(s,1,"fire"),out _));Settle(s);
            Eq(1,s.State.turn);Eq(2,s.State.turnNumber);
            Eq(1,s.State.players[1].ownerTurns);True(s.State.bonusPending);
            int serial=s.State.eventSerial,action=s.State.actionSerial;
            False(s.TryCommand(Shot(s,0),out _));
            Eq(serial,s.State.eventSerial);Eq(action,s.State.actionSerial);
            True(s.TryCommand(Shot(s,1,"ice"),out _));
            Eq(action+1,s.State.actionSerial);
            Eq(1,s.State.balls.Last().owner);
            False(s.State.bonusPending);True(s.State.bonusUsed);
            Settle(s);
            Eq(0,s.State.turn);Eq(3,s.State.turnNumber);
            Eq(2,s.State.players[0].ownerTurns);
            Eq(1,s.State.players[1].ownerTurns);
        });
        Test("W9 A40 P2 Replay validates owner and keeps seat turn without duplicate launch",()=>{
            var s=Sim();True(s.TryCommand(Shot(s,0),out _));Settle(s);
            Eq(1,s.State.turn);Eq(2,s.State.turnNumber);
            var ball=s.Spawn(1,"normal",270,90);
            True(s.CanReplay(ball));
            var wrong=Shot(s,0);wrong.kind=CommandKind.Replay;wrong.ballId=ball.id;
            int before=s.State.eventSerial,action=s.State.actionSerial;
            False(s.TryCommand(wrong,out _));
            Eq(before,s.State.eventSerial);Eq(action,s.State.actionSerial);
            False(s.State.replayedIds.Contains(ball.id));
            var replay=Shot(s,1);replay.kind=CommandKind.Replay;replay.ballId=ball.id;replay.power=60;
            True(s.TryCommand(replay,out _));
            Eq(action+1,s.State.actionSerial);True(s.State.replayedIds.Contains(ball.id));
            Eq(1,s.State.turn);
            Settle(s);
            Eq(1,s.State.turn);Eq(2,s.State.turnNumber);
            Eq(1,s.State.players[1].ownerTurns);
            before=s.State.eventSerial;action=s.State.actionSerial;
            False(s.TryCommand(replay,out _));
            Eq(before,s.State.eventSerial);Eq(action,s.State.actionSerial);
        });
        // R17-W10 A40: host-owned gameplay projection must roundtrip through the
        // existing Protocol149 snapshot codec without making client state authoritative.
        Test("W10 A40 P2 authoritative snapshot preserves moving ball owner position and action",()=>{
            var s=Sim();True(s.TryCommand(Shot(s,0),out _));Settle(s);
            Eq(1,s.State.turn);
            var authority=new CoreClash.Networking.NetworkGameSession(s);
            var intent=Shot(s,1,"fire");intent.sequence=1;
            True(authority.Submit(1,intent,out _));
            Eq(MatchPhase.Moving,s.State.phase);
            var json=new System.Text.Json.JsonSerializerOptions{IncludeFields=true};
            var replica=new CoreClash.Networking.NetworkGameStateAdapter();
            System.Func<string,GameState> decode=raw=>System.Text.Json.JsonSerializer.Deserialize<GameState>(raw,json);
            var initial=authority.Capture(state=>System.Text.Json.JsonSerializer.Serialize(state,json));
            True(replica.Apply(initial,decode,out _));
            Eq(149,replica.State.specVersion);Eq(s.State.turn,replica.State.turn);
            Eq(s.State.turnNumber,replica.State.turnNumber);
            Eq(s.State.actionSerial,replica.State.actionSerial);
            Eq(s.State.eventSerial,replica.State.eventSerial);
            var hostBall=s.State.balls.Last(),clientBall=replica.State.balls.Single(x=>x.id==hostBall.id);
            Eq(1,clientBall.owner);Eq("fire",clientBall.type);
            Near(hostBall.x,clientBall.x);Near(hostBall.y,clientBall.y);
            Near(hostBall.vx,clientBall.vx);Near(hostBall.vy,clientBall.vy);
            s.Step(1f/120f);
            var newer=authority.Capture(state=>System.Text.Json.JsonSerializer.Serialize(state,json));
            True(newer.revision>initial.revision);
            True(replica.Apply(newer,decode,out _));
            hostBall=s.State.balls.Single(x=>x.id==hostBall.id);
            clientBall=replica.State.balls.Single(x=>x.id==hostBall.id);
            Near(hostBall.x,clientBall.x);Near(hostBall.y,clientBall.y);
            Near(hostBall.vx,clientBall.vx);Near(hostBall.vy,clientBall.vy);
            int appliedSerial=replica.State.actionSerial,appliedEvents=replica.State.eventSerial;
            False(replica.Apply(initial,decode,out _));
            False(replica.Apply(newer,decode,out _));
            Eq(appliedSerial,replica.State.actionSerial);
            Eq(appliedEvents,replica.State.eventSerial);
            Near(hostBall.y,replica.State.balls.Single(x=>x.id==hostBall.id).y);
        });
        Test("W10 A40 P2 ready Phoenix hand is consumed exactly once by authoritative remote intent",()=>{
            var s=Sim();var dead=s.Spawn(1,"phoenix",450,450);
            s.Kill(dead);
            Eq(1,s.State.phoenixHand.Count);
            Eq(0,s.Stock(1,"phoenix"));
            var h=s.State.phoenixHand.Single();
            False(h.ready);Eq(1,h.owner);
            True(s.TryCommand(Shot(s,0),out _));Settle(s);
            Eq(1,s.State.turn);Eq(1,s.State.players[1].ownerTurns);
            True(h.ready);Eq(10,h.hp);
            var authority=new CoreClash.Networking.NetworkGameSession(s);
            var wrong=Shot(s,1,"phoenix");wrong.sequence=1;
            int eventsBefore=s.State.eventSerial,actionBefore=s.State.actionSerial;
            False(authority.Submit(0,wrong,out _));
            Eq(eventsBefore,s.State.eventSerial);
            Eq(actionBefore,s.State.actionSerial);Eq(1,s.State.phoenixHand.Count);
            True(authority.Submit(1,wrong,out _));
            var returned=s.State.balls.Last();
            Eq(1,returned.owner);Eq("phoenix",returned.type);
            Eq(10,returned.hp);Eq(0,s.Stock(1,"phoenix"));
            Eq(0,s.State.phoenixHand.Count);
            Eq(actionBefore+1,s.State.actionSerial);
            Eq(1,s.State.events.Count(e=>e.id>eventsBefore&&e.kind=="SPAWN"&&e.ballId==returned.id));
            Eq(0,s.State.events.Count(e=>e.id>eventsBefore&&e.kind=="RETURN"));
            False(authority.Submit(1,wrong,out _));
            Eq(0,s.State.phoenixHand.Count);
            var json=new System.Text.Json.JsonSerializerOptions{IncludeFields=true};
            var client=new CoreClash.Networking.NetworkGameStateAdapter();
            var snap=authority.Capture(state=>System.Text.Json.JsonSerializer.Serialize(state,json));
            True(client.Apply(snap,raw=>System.Text.Json.JsonSerializer.Deserialize<GameState>(raw,json),out _));
            Eq(0,client.State.phoenixHand.Count);
            Eq(s.State.actionSerial,client.State.actionSerial);
            Eq(s.State.eventSerial,client.State.eventSerial);
            var peer=client.State.balls.Single(x=>x.id==returned.id);
            Eq(1,peer.owner);Eq(returned.hp,peer.hp);
            Eq(returned.shield,peer.shield);
        });
        // R17-W11 A40: network seat-gated replay and post-settle snapshot on the
        // actually selected A70 source candidate; no NGO or UI ownership changed.
        Test("W11 A40 P2 network Replay snapshot preserves owner and single-use budget",()=>{
            var s=Sim();True(s.TryCommand(Shot(s,0),out _));Settle(s);
            Eq(1,s.State.turn);Eq(MatchPhase.Aiming,s.State.phase);
            var ball=s.Spawn(1,"normal",270,90);True(s.CanReplay(ball));
            var authority=new CoreClash.Networking.NetworkGameSession(s);
            var invalid=Shot(s,0);invalid.kind=CommandKind.Replay;invalid.ballId=ball.id;invalid.sequence=1;
            int action=s.State.actionSerial,events=s.State.eventSerial;
            False(authority.Submit(1,invalid,out _));
            Eq(action,s.State.actionSerial);Eq(events,s.State.eventSerial);
            var cmd=Shot(s,1);cmd.kind=CommandKind.Replay;cmd.ballId=ball.id;cmd.sequence=1;cmd.power=60;
            True(authority.Submit(1,cmd,out _));
            Eq(action+1,s.State.actionSerial);True(s.State.replayedIds.Contains(ball.id));
            Eq(1,s.State.turn);Eq(MatchPhase.Moving,s.State.phase);
            var options=new System.Text.Json.JsonSerializerOptions{IncludeFields=true};
            System.Func<string,GameState> decode=raw=>System.Text.Json.JsonSerializer.Deserialize<GameState>(raw,options);
            var receiver=new CoreClash.Networking.NetworkGameStateAdapter();
            var first=authority.Capture(x=>System.Text.Json.JsonSerializer.Serialize(x,options));
            True(receiver.Apply(first,decode,out _));
            Eq(1,receiver.State.turn);Eq(s.State.turnNumber,receiver.State.turnNumber);
            Eq(s.State.actionSerial,receiver.State.actionSerial);
            True(receiver.State.replayedIds.Contains(ball.id));
            var remote=receiver.State.balls.Single(x=>x.id==ball.id);
            Eq(1,remote.owner);Near(ball.x,remote.x);Near(ball.y,remote.y);
            Settle(s);
            Eq(1,s.State.turn);Eq(MatchPhase.Aiming,s.State.phase);
            var second=authority.Capture(x=>System.Text.Json.JsonSerializer.Serialize(x,options));
            True(second.revision>first.revision);
            True(receiver.Apply(second,decode,out _));
            Eq(1,receiver.State.turn);Eq(MatchPhase.Aiming,receiver.State.phase);
            True(receiver.State.replayedIds.Contains(ball.id));
            False(receiver.Apply(first,decode,out _));
            action=s.State.actionSerial;events=s.State.eventSerial;
            False(authority.Submit(1,cmd,out _));
            var duplicate=Shot(s,1);duplicate.kind=CommandKind.Replay;duplicate.ballId=ball.id;duplicate.sequence=2;
            False(authority.Submit(1,duplicate,out _));
            Eq(action,s.State.actionSerial);Eq(events,s.State.eventSerial);
            Eq(1,s.State.turn);
        });
        RealityTests();SpatialTests();
        Test("Wildfire leaves a three-tick fire field after death",()=>{var s=Sim();var w=s.Spawn(0,"wildfire",200,450);var t=s.Spawn(1,"normal",260,450);s.Kill(w);Eq(1,s.State.zones.Count(z=>z.kind=="fire"&&!z.dead));s.Abilities.OnTurnEnd(0);Eq(1,t.fireStacks);});
        Test("Soulburst copied effect grows with missing HP",()=>{var s=Sim();var a=s.Spawn(0,"agony",170,450);var soul=s.Spawn(0,"soulburst",220,450);soul.hp=5;var enemy=s.Spawn(1,"normal",280,450);s.Abilities.OnContact(a,soul,false,true,40);Eq(20,enemy.hp);False(soul.dead);});
        Test("Plagueleech binds a clean enemy then drains on its own turn",()=>{var s=Sim();var a=s.Spawn(0,"plagueleech",200,450);a.hp=15;var b=s.Spawn(1,"normal",260,450);b.shield=10;s.Abilities.OnContact(a,b,false,true,40);Eq(b.id,a.linkedTargetId);Eq(3,b.toxinTurns);s.Abilities.OnTurnStart(0);Eq(25,b.hp);Eq(20,a.hp);Eq(10,b.shield);});
        Test("Vector spreads toxin when an infected enemy actually dies",()=>{var s=Sim();s.Spawn(0,"vector",100,450);var dead=s.Spawn(1,"normal",200,450);var clean=s.Spawn(1,"normal",260,450);s.Abilities.ApplyToxin(dead,0);s.Kill(dead);Eq(3,clean.toxinTurns);});
        Test("Halo blocks exactly the first kinetic damage instance",()=>{var s=Sim();var halo=s.Spawn(0,"halo",200,450);s.Damage(halo,10,true);Eq(25,halo.hp);s.Damage(halo,10,true);Eq(15,halo.hp);});
        Test("Gravity Mine arms at STOP and detonates on enemy entry",()=>{var s=Sim();var mine=s.Spawn(0,"gravitymine",200,450);s.Abilities.OnStop(mine);True(s.State.zones.Any(z=>z.kind=="gravitymine"&&!z.dead));var enemy=s.Spawn(1,"normal",250,450);s.Abilities.OnStep(1f/120);True(mine.dead);True(enemy.hp<30);});
        Test("ordinary native collisions do not create kinetic energy",()=>{var s=Sim();BallRuntime a=s.Spawn(0,"normal",220,450),b=s.Spawn(1,"normal",260,450);a.vx=200;float before=.5f*a.mass*200*200;s.Collisions.Resolve(a,b);float after=.5f*a.mass*(a.vx*a.vx+a.vy*a.vy)+.5f*b.mass*(b.vx*b.vx+b.vy*b.vy);True(after<=before+.01f,"ordinary collision gained energy");});
        Test("third fire stack spreads to nearby enemies without igniting allies",()=>{var s=Sim();var target=s.Spawn(1,"normal",250,450);var enemy=s.Spawn(1,"normal",290,450);var ally=s.Spawn(0,"normal",220,450);s.Abilities.ApplyFire(target,0);s.Abilities.ApplyFire(target,0);s.Abilities.ApplyFire(target,0);Eq(1,enemy.fireStacks);Eq(0,ally.fireStacks);Eq(25,target.hp);});
    }
}
