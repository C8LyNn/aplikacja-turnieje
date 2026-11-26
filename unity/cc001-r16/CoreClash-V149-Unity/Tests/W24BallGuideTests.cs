using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using CoreClash.Core;
using CoreClash.Presentation;

// CC-001 W24 ball guide: every active ball is explained in English and Polish, and the
// numbers printed on the cards are measured here against the rules, so a card cannot
// promise something the simulation does not do.
public static partial class Program
{
    static string W24Fact(string id,int index,bool polish=false)=>BallGuide.For(id).Facts[index].In(polish);

    static void W24BallGuideTests()
    {
        Test("W24 guide: every active ball is explained in English and Polish, and only active balls",()=>{
            var c=W22Catalog(out var data);
            True(new HashSet<string>(BallGuide.Ids).SetEquals(data.active),"guide entries are not exactly the active roster");
            foreach(string id in data.active)
            {
                var g=BallGuide.For(id);
                foreach(string text in new[]{g.NamePl,g.TagEn,g.TagPl,g.DoesEn,g.DoesPl,g.TipEn,g.TipPl})True(!string.IsNullOrWhiteSpace(text),"missing text: "+id);
                True(g.TagEn.Length<=BallGuide.MaxTag&&g.TagPl.Length<=BallGuide.MaxTag,"tile label too long: "+id);
                True(g.DoesEn.Length<=170&&g.DoesPl.Length<=170,"sentence too long: "+id);
                True(g.TipEn.Length<=140&&g.TipPl.Length<=140,"tip too long: "+id);
                True(g.Facts.Length<=3,"too many facts: "+id);
                foreach(var fact in g.Facts)True(fact.In(false).Length>0&&fact.In(false).Length<=26&&fact.In(true).Length>0&&fact.In(true).Length<=26,"fact text does not fit a row: "+id);
                // The banner says WHEN; the sentence must not say it again.
                False(g.DoesEn.StartsWith("When it stops")||g.DoesPl.StartsWith("Gdy się zatrzyma,"));
                True(g.Range>=0&&g.Range<=230);
            }
            True(BallGuide.For(null)==null&&BallGuide.For("ram")==null);
            // A power that happens on STOP in the rules is marked STOP on its card.
            foreach(string id in data.active)
            {
                var events=c.Ability(c.Ball(id).abilityId)?.events??Array.Empty<string>();
                if(BallGuide.For(id).When==GuideWhen.Stop)True(events.Contains("STOP"),"card says STOP, catalog does not: "+id);
                if(BallGuide.For(id).When==GuideWhen.Death)True(events.Contains("DEATH"),"card says DEATH, catalog does not: "+id);
            }
        });
        Test("W24 guide: Polish names are unique and fit a tile; English stays the default; other balls keep their names",()=>{
            var c=W22Catalog(out var data);
            False(Lang.Polish);
            Eq("Bomb",BallIcons.Name(c.Ball("bomb")));Eq("When it stops",BallGuide.WhenText(GuideWhen.Stop));
            Lang.Polish=true;
            try
            {
                var names=data.active.Select(id=>BallIcons.Name(c.Ball(id))).ToArray();
                Eq(names.Length,names.Distinct(StringComparer.OrdinalIgnoreCase).Count());
                Eq("Bomba",BallIcons.Name(c.Ball("bomb")));Eq("Ognisko",BallIcons.Name(c.Ball("furnace")));Eq("Mina magnesowa",BallIcons.Name(c.Ball("gravitymine")));
                foreach(string name in names)True(name.Length<=14&&name.Split(' ').All(word=>word.Length<=10),"Polish name too long for a tile: "+name);
                Eq(c.Ball("ram").name,BallIcons.Name(c.Ball("ram")));
                Eq("Gdy się zatrzyma",BallGuide.WhenText(GuideWhen.Stop));Eq("Tylko wrogowie",BallGuide.WhoText(GuideWho.Enemies));
                Eq("Wybuch",BallGuide.For("bomb").Tag);
            }
            finally{Lang.Polish=false;}
            Eq("Blast",BallGuide.For("bomb").Tag);Eq("Medium range",BallGuide.RangeText(165));Eq("",BallGuide.RangeText(0));
        });
        Test("W24 guide: blast numbers and reach on the cards are what the rules produce",()=>{
            int Blast(string type,float distance,Action<GameSimulation,BallRuntime,BallRuntime> trigger){var s=Sim();var b=s.Spawn(0,type,270,450);var t=s.Spawn(1,"normal",270+distance,450);trigger(s,b,t);return 30-t.hp;}
            // Bomb: 15 next to it, 10 further out, nothing beyond its reach; the same when it dies first.
            Eq(15,Blast("bomb",43,(s,b,t)=>s.Abilities.OnStop(b)));Eq(10,Blast("bomb",160,(s,b,t)=>s.Abilities.OnStop(b)));Eq(0,Blast("bomb",170,(s,b,t)=>s.Abilities.OnStop(b)));
            Eq(15,Blast("bomb",43,(s,b,t)=>s.Kill(b)));Eq(10,Blast("bomb",160,(s,b,t)=>s.Kill(b)));
            // (Those are the reference numbers. The card prints the game's: see the fifth balance pass.)
            True(W24Fact("bomb",0).StartsWith(RosterBalance.BombDamage==12?"5–10":"10–15"),W24Fact("bomb",0));Eq(165f,BallGuide.For("bomb").Range);
            // Mine and Time Bomb are outside the roster; their rules are still the reference ones.
            Eq(10,Blast("mine",43,(s,b,t)=>{s.Abilities.OnStop(b);s.Abilities.OnPairContact(b,t,false,false,30);}));
            Eq(0,Blast("timebomb",43,(s,b,t)=>{s.Abilities.OnStop(b);ExplosiveOwnTurn(s,0);}));
            Eq(10,Blast("timebomb",43,(s,b,t)=>{s.Abilities.OnStop(b);ExplosiveOwnTurn(s,0);ExplosiveOwnTurn(s,0);}));
            // Magnet Mine, reference rules: no field with another ball close by; with room it explodes for 10 when an enemy enters.
            {var s=Sim();var g=s.Spawn(0,"gravitymine",270,450);s.Spawn(1,"normal",330,450);s.Abilities.OnStop(g);False(s.State.zones.Any(z=>!z.dead&&z.kind=="gravitymine"));}
            {var s=Sim();var g=s.Spawn(0,"gravitymine",270,450);var e=s.Spawn(1,"normal",470,450);s.Abilities.OnStop(g);True(s.State.zones.Any(z=>!z.dead&&z.kind=="gravitymine"));e.x=360;s.Abilities.OnStep(1f/120);Eq(20,e.hp);True(g.dead);}
            // Plain powers (the rule the game plays by): the field always appears, as the card says.
            {var s=Sim();s.State.plainPowers=true;var g=s.Spawn(0,"gravitymine",270,450);s.Spawn(0,"normal",330,450);s.Abilities.OnStop(g);True(s.State.zones.Any(z=>!z.dead&&z.kind=="gravitymine"));}
            // The game plays by the roster's balance: the card prints its number, and that is what an enemy in the field loses.
            Eq(RosterBalance.MineDamage+" damage",W24Fact("gravitymine",0));
            {var s=Sim();s.State.plainPowers=true;RosterBalance.Apply(s.State);var g=s.Spawn(0,"gravitymine",270,450);s.Abilities.OnStop(g);var e=s.Spawn(1,"normal",360,450);s.Abilities.OnStep(1f/120);Eq(30-RosterBalance.MineDamage,e.hp);}
        });
        Test("W24 guide: fire, poison, ice and the support numbers on the cards are what the rules produce",()=>{
            // Fire and poison: 5 HP on each of the target's own turns, three times.
            {var s=Sim();var t=s.Spawn(1,"normal",200,300);s.Abilities.ApplyFire(t,0);for(int i=1;i<=3;i++){ExplosiveOwnTurn(s,1);Eq(30-5*i,t.hp);}ExplosiveOwnTurn(s,1);Eq(15,t.hp);Eq(0,t.fireStacks);}
            {var s=Sim();var t=s.Spawn(1,"normal",200,300);s.Abilities.ApplyToxin(t,0);for(int i=1;i<=3;i++){ExplosiveOwnTurn(s,1);Eq(30-5*i,t.hp);}ExplosiveOwnTurn(s,1);Eq(15,t.hp);Eq(0,t.toxinTurns);}
            // (Three turns is the reference rule. The cards print the game's numbers of turns.)
            True(W24Fact("fire",0).Contains("5 HP × "+RosterBalance.FireLasts+" turns")&&W24Fact("venom",0).Contains("5 HP × "+RosterBalance.PoisonTurns+" turns"));
            // Second fire: 10 a turn.
            {var s=Sim();var t=s.Spawn(1,"normal",200,300);s.Abilities.ApplyFire(t,0);s.Abilities.ApplyFire(t,0);ExplosiveOwnTurn(s,1);Eq(20,t.hp);}
            // The third chill freezes.
            {var s=Sim();var t=s.Spawn(1,"normal",200,300);s.Abilities.ApplyIce(t,0);s.Abilities.ApplyIce(t,0);True(t.frozen<=0);s.Abilities.ApplyIce(t,0);True(t.frozen>0);}
            // Shatterer: nothing on one chill, 5 extra on two, and the ice is used up.
            {var s=Sim();var sh=s.Spawn(0,"shatterer",270,450);var e=s.Spawn(1,"normal",312,450);s.Abilities.ApplyIce(e,0);s.Abilities.OnPairContact(sh,e,false,true,30);Eq(30,e.hp);s.Abilities.ApplyIce(e,0);s.Abilities.OnPairContact(sh,e,false,true,30);Eq(25,e.hp);Eq(0,e.iceStacks);}
            // Bonfire: 10 and fire to enemies, +5 to allies.
            {var s=Sim();var b=s.Spawn(0,"bonfire",270,450);var e=s.Spawn(1,"normal",330,450);var a=s.Spawn(0,"normal",210,450);a.hp=20;s.Kill(b);Eq(20,e.hp);Eq(1,e.fireStacks);Eq(25,a.hp);}
            // Venom: poisons a clean enemy; on a poisoned one takes 5 and heals 5.
            {var s=Sim();var v=s.Spawn(0,"venom",270,450);v.hp=10;var e=s.Spawn(1,"normal",312,450);s.Abilities.OnPairContact(v,e,false,true,30);Eq(3,e.toxinTurns);Eq(30,e.hp);s.Abilities.OnPairContact(v,e,false,true,30);Eq(25,e.hp);Eq(15,v.hp);}
            // Plague Leech: 5 out of the tied enemy and 5 into the Leech on its owner's turn.
            {var s=Sim();var l=s.Spawn(0,"plagueleech",270,450);l.hp=10;var e=s.Spawn(1,"normal",312,450);s.Abilities.OnPairContact(l,e,false,true,30);Eq(3,e.toxinTurns);ExplosiveOwnTurn(s,0);Eq(25,e.hp);Eq(15,l.hp);}
            // Vortex Medic: +5 for one enemy in reach, +10 for two, nothing without an enemy.
            {var s=Sim();var m=s.Spawn(0,"vortexmedic",270,450);var hurt=s.Spawn(0,"normal",270,520);hurt.hp=10;s.Abilities.OnStop(m);Eq(10,hurt.hp);s.Spawn(1,"normal",370,450);s.Abilities.OnStop(m);Eq(15,hurt.hp);s.Spawn(1,"normal",170,450);hurt.hp=10;s.Abilities.OnStop(m);Eq(20,hurt.hp);}
            // Ward: a clean ball with a shield of 5.
            {var s=Sim();var w=s.Spawn(0,"ward",270,450);var a=s.Spawn(0,"normal",330,450);s.Abilities.ApplyToxin(a,1);s.Abilities.OnStop(w);Eq(5,a.shield);Eq(0,a.toxinTurns);}
            // Halo: the first collision does nothing, the next one hurts.
            {var s=Sim();var h=s.Spawn(0,"halo",270,450);s.Damage(h,6,true);Eq(25,h.hp);s.Damage(h,6,true);Eq(19,h.hp);}
            // Cascade: 25 -> 10 -> 5 -> gone.
            {var s=Sim();var first=s.Spawn(0,"cascade",270,450);s.Kill(first);var second=s.State.balls.Single(b=>!b.dead&&b.type=="cascade");Eq(10,second.hp);s.Kill(second);var third=s.State.balls.Single(b=>!b.dead&&b.type=="cascade");Eq(5,third.hp);s.Kill(third);False(s.State.balls.Any(b=>!b.dead&&b.type=="cascade"));}
            // Reviver: pays 10, the fallen ball returns with 15, once.
            {var s=Sim();var f=s.Spawn(0,"fire",100,300);s.Kill(f);var r=s.Spawn(0,"reclaimer",270,450);s.Abilities.OnStop(r);Eq(20,r.hp);Eq(15,s.State.balls.Single(b=>!b.dead&&b.type=="fire").hp);s.Abilities.OnStop(r);Eq(20,r.hp);Eq(1,s.State.balls.Count(b=>!b.dead&&b.type=="fire"));}
            // Webber: four webs.
            {var s=Sim();var w=s.Spawn(0,"web",270,450);s.Abilities.OnStop(w);Eq(4,s.State.zones.Count(z=>!z.dead&&z.kind=="web"));}
        });
        Test("W24 source: the ball card is drawn from the guide and never drives the simulation",()=>{
            string dir=Path.Combine(projectRoot,"Assets/CoreClash/Presentation");
            string Code(string f)=>Regex.Replace(File.ReadAllText(Path.Combine(dir,f)),@"//[^\n]*","");
            string view=Code("BallGuideView.cs"),guide=Code("BallGuide.cs"),setup=Code("SetupView.cs");
            True(view.Contains("BallGuide.For(d.id)")&&view.Contains("BallGuide.WhenText(guide.When)")&&view.Contains("guide.Does")&&view.Contains("guide.Tip"));
            True(view.Contains("LanguageSwitch(")&&setup.Contains("LanguageSwitch(")&&view.Contains("PlayerPrefs.SetString(\"cc.lang\""));
            foreach(string code in new[]{view,guide})Eq(0,Regex.Matches(code,@"\.(TryCommand|Step|Damage|Kill|DamageBase|Emit|Heal|Shield|Spawn)\(").Count);
            False(guide.Contains("UnityEngine"));
        });
    }
}
