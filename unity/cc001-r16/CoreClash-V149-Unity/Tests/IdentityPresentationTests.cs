using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Presentation;

public static partial class Program
{
    static void IdentityPresentationTests()
    {
        Test("every catalog ball has a unique short ASCII identity mark",()=>{
            var identity=new BallIdentity(catalog.Data.balls);
            var marks=catalog.Data.balls.Select(b=>identity.Mark(b.id)).ToArray();
            Eq(227,marks.Length);Eq(marks.Length,marks.Distinct(StringComparer.Ordinal).Count());
            True(marks.All(m=>m.Length>=2&&m.Length<=4&&m.All(c=>c>='A'&&c<='Z'||c>='0'&&c<='9')));
        });
        Test("identity marks do not depend on catalog order or current culture",()=>{
            var first=new BallIdentity(catalog.Data.balls);
            var prior=System.Globalization.CultureInfo.CurrentCulture;
            try{
                System.Globalization.CultureInfo.CurrentCulture=new System.Globalization.CultureInfo("tr-TR");
                var reverse=new BallIdentity(catalog.Data.balls.Reverse());
                foreach(var ball in catalog.Data.balls)Eq(first.Mark(ball.id),reverse.Mark(ball.id));
                True(first.Mark("mine")!=first.Mark("mimic"));
            }finally{System.Globalization.CultureInfo.CurrentCulture=prior;}
        });
        Test("identity marks tolerate punctuation and non ASCII names without aliases",()=>{
            var identity=new BallIdentity(new[]{new BallDefinition{id="first",name="!"},new BallDefinition{id="second",name="!"},new BallDefinition{id="third",name="Żółw"}});
            True(identity.Mark("first")!=identity.Mark("second"));
            True(new[]{"first","second","third"}.Select(identity.Mark).All(m=>m.Length>=2&&m.Length<=4&&m.All(c=>c<=127)));
            Eq("?",identity.Mark("missing"));
        });
        Test("runtime inspection binds exact instance and follows new snapshots read only",()=>{
            var state=new GameState();
            state.balls.Add(new BallRuntime{id=7,type="mine",owner=0,hp=17,maxHp=35,shield=5});
            state.balls.Add(new BallRuntime{id=8,type="mine",owner=1,hp=9,maxHp=40,shield=10});
            var before=BallInspection.Read(state,8);True(before!=null,"runtime instance is not inspectable");Eq(1,before.Owner);Eq(9,before.Hp);Eq(40,before.MaxHp);Eq(10,before.Shield);True(before.OnBoard);
            state.balls[1]=new BallRuntime{id=8,type="ice",owner=0,hp=12,maxHp=45,shield=3};
            var after=BallInspection.Read(state,8);Eq("ice",after.Type);Eq(0,after.Owner);Eq(12,after.Hp);Eq(3,after.Shield);
            Eq(1,before.Owner);Eq(9,before.Hp);Eq(17,state.balls[0].hp);Eq(0,state.events.Count);Eq(0,state.revision);
            state.balls[1].dead=true;False(BallInspection.Read(state,8).OnBoard);True(BallInspection.Read(state,999)==null);
        });
        Test("inspection retains simultaneous independent states and exact shield amount",()=>{
            var ball=new BallRuntime{ancestral=true,rooted=true,frozen=2.4f,shield=12,divineShield=true,mineArmed=true,fireStacks=2,burnTurns=4,iceStacks=1,iceTurns=3,toxinTurns=2};
            var states=BallInspection.Statuses(ball);
            foreach(string code in new[]{"ANC","ROOT","FRZ","S12","DIV","ARM","F2","I1","T2"})True(states.Any(s=>s.Code==code),"missing simultaneous state "+code);
            True(states.Any(s=>s.Text.Contains("12")&&s.Code=="S12"));
            True(states.Any(s=>s.Code=="F2"&&s.Text.Contains("4 own turns")));
            ball.ancestral=ball.rooted=ball.divineShield=ball.mineArmed=false;ball.frozen=0;ball.shield=ball.fireStacks=ball.iceStacks=ball.toxinTurns=0;ball.abilityUsed=true;
            Eq(0,BallInspection.Statuses(ball).Length);
        });
        Test("board inspection finds either owner without turn permission and ignores removed balls",()=>{
            var state=new GameState{turn=0,phase=MatchPhase.Moving};
            state.balls.Add(new BallRuntime{id=7,owner=1,x=100,y=200,radius=17});
            state.balls.Add(new BallRuntime{id=8,owner=0,x=100,y=200,radius=17,dead=true});
            Eq(7,BallInspection.At(state,105,205)?.id??0);True(BallInspection.At(state,200,200)==null);
            state.balls[0].banished=true;True(BallInspection.At(state,100,200)==null);
            Eq(0,state.events.Count);Eq(0,state.revision);Eq(MatchPhase.Moving,state.phase);
            Eq("P1",BallInspection.OwnerMark(0));Eq("P2",BallInspection.OwnerMark(1));
        });
    }
}
