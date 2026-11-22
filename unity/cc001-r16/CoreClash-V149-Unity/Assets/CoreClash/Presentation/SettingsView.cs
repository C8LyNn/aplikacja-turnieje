using System;
using CoreClash.Core;
using UnityEngine;
namespace CoreClash.Presentation
{
    // CC-001 W24 (owner direction: "the player sets the rules of the match" and "more such
    // options"): one sheet with the rules of the next match (ball size, double turn, map) and with
    // how a match is shown (damage numbers, stop mark, effects, arena, language). Rules take effect
    // when the next match starts; what is only shown changes at once.
    public sealed partial class CoreClashApp
    {
        bool settingsOpen;
        Vector2 settingsScroll;
        public void OpenSettings(){settingsOpen=true;settingsScroll=Vector2.zero;gesture.Active=false;Debug.Log("CORE_CLASH_SETTINGS open");}
        public void CloseSettings(){settingsOpen=false;MatchSetup.Save();}

        void RenderSettings()
        {
            Draw.Rect(new Rect(0,0,UiWidth,UiHeight),Theme.A(Theme.Scrim,.62f));
            bool narrow=UiWidth<560;
            float w=Mathf.Min(620,UiWidth-(narrow?16:48)),pad=narrow?12:18,rowH=narrow?78:54,head=50,foot=64;
            int rows=VersusAi?13:12;float content=rows*rowH+3*30+8;
            float h=Mathf.Min(UiHeight-(narrow?16:48),head+content+foot),x=(UiWidth-w)/2,y=(UiHeight-h)/2;
            var card=new Rect(x,y,w,h);Draw.Card(card,null,null,.4f);
            var face=Draw.CardFace(card);
            Draw.Corners(new Rect(face.x,face.y,face.width,head-(face.y-card.y)),Theme.Info,Draw.CardCorner,Draw.CardCorner,0,0);
            Draw.Text(new Rect(x+pad,y,w-2*pad,head),Lang.T("Rules and options","Zasady i opcje"),narrow?18:20,Theme.OnColor,TextAnchor.MiddleLeft,true);
            var view=new Rect(x+pad,y+head+4,w-2*pad,h-head-foot-4);float inner=view.width-10;
            settingsScroll=Draw.ScrollView(view,settingsScroll,new Rect(0,0,inner,content));
            float at=0;
            Section(ref at,inner,Lang.T("Rules of the match","Zasady meczu"),Lang.T("from the next match","od następnego meczu"));
            // W24: who plays the second side. (The home screen has the same choice on Player 2's block,
            // but a phone held sideways has no room for that block.)
            int rival=Choice(ref at,inner,rowH,narrow,Lang.T("Opponent","Przeciwnik"),new[]{Lang.T("Player 2","Gracz 2"),Lang.T("Computer","Komputer")},VersusAi?1:0);
            if((rival==1)!=VersusAi)SetVersusAi(rival==1);
            int scale=Array.IndexOf(MatchSetup.BallScales,MatchSetup.BallScale);if(scale<0)scale=MatchSetup.BallScales.Length-1;
            int pick=Choice(ref at,inner,rowH,narrow,Lang.T("Ball size","Rozmiar kulek"),new[]{"×1","×1,5","×2"},scale);
            if(pick!=scale)MatchSetup.BallScale=MatchSetup.BallScales[pick];
            pick=Choice(ref at,inner,rowH,narrow,Lang.T("Double turn below 10 HP","Podwójna tura poniżej 10 HP"),OnOff,MatchSetup.DoubleTurn?0:1);
            MatchSetup.DoubleTurn=pick==0;
            // Map: random, or one of the maps.
            var maps=MatchSetup.Maps;int map=MatchSetup.Map==MatchSetup.RandomMap?0:1+Mathf.Max(0,Array.FindIndex(maps,m=>m.Id==MatchSetup.Map));
            int next=Stepper(ref at,inner,rowH,narrow,Lang.T("Map","Mapa"),MatchSetup.MapName(MatchSetup.Map),map,maps.Length+1);
            if(next!=map)MatchSetup.Map=next==0?MatchSetup.RandomMap:maps[next-1].Id;
            // W24 (owner decision): a solo player picks how hard the computer tries.
            if(VersusAi)
            {
                pick=Choice(ref at,inner,rowH,narrow,Lang.T("Computer's level","Poziom komputera"),new[]{MatchSetup.AiLevelName(AiLevel.Easy),MatchSetup.AiLevelName(AiLevel.Normal),MatchSetup.AiLevelName(AiLevel.Hard)},(int)MatchSetup.AiLevel);
                MatchSetup.AiLevel=(AiLevel)pick;
            }
            // W24 (owner decision): each player picks a colour; the computer's is drawn for every match.
            Section(ref at,inner,Lang.T("Players' colours","Kolory graczy"),"");
            int colour=Stepper(ref at,inner,rowH,narrow,Lang.T("Player 1","Gracz 1"),Theme.PlayerColorName(MatchSetup.Color1),MatchSetup.Color1,Theme.PlayerColors.Length,Theme.PlayerColors[MatchSetup.Color1]);
            if(colour!=MatchSetup.Color1)MatchSetup.SetColor(0,MatchSetup.NextColor(0,colour==(MatchSetup.Color1+1)%Theme.PlayerColors.Length?1:-1));
            if(VersusAi)Stepper(ref at,inner,rowH,narrow,Lang.T("Computer","Komputer"),Lang.T("Drawn each match","Losowany co mecz"),0,1,Theme.Muted);
            else
            {
                colour=Stepper(ref at,inner,rowH,narrow,Lang.T("Player 2","Gracz 2"),Theme.PlayerColorName(MatchSetup.Color2),MatchSetup.Color2,Theme.PlayerColors.Length,Theme.PlayerColors[MatchSetup.Color2]);
                if(colour!=MatchSetup.Color2)MatchSetup.SetColor(1,MatchSetup.NextColor(1,colour==(MatchSetup.Color2+1)%Theme.PlayerColors.Length?1:-1));
            }
            Section(ref at,inner,Lang.T("How the match is shown","Widok meczu"),"");
            pick=Choice(ref at,inner,rowH,narrow,Lang.T("Damage numbers over balls","Liczby obrażeń nad kulkami"),OnOff,MatchSetup.DamageNumbers?0:1);
            MatchSetup.DamageNumbers=pick==0;
            pick=Choice(ref at,inner,rowH,narrow,Lang.T("HP as a number on balls","Liczba HP na kulkach"),OnOff,Theme.ShowHpNumber?0:1);
            Theme.ShowHpNumber=pick==0;
            pick=Choice(ref at,inner,rowH,narrow,Lang.T("Mark where the ball will stop","Znacznik miejsca zatrzymania"),OnOff,BoardView.ShowStopEstimate?0:1);
            if((pick==0)!=BoardView.ShowStopEstimate)ToggleStopEstimate();
            pick=Choice(ref at,inner,rowH,narrow,Lang.T("Effects","Efekty"),new[]{Lang.T("Full","Pełne"),Lang.T("Calm","Spokojne")},Fx.ReducedMotion?1:0);
            if((pick==1)!=Fx.ReducedMotion)Fx.SetReducedMotion(pick==1);
            int arena=Mathf.Max(0,Array.IndexOf(Theme.Arenas,Theme.Arena));
            next=Stepper(ref at,inner,rowH,narrow,Lang.T("Arena","Arena"),ArenaName(Theme.Arena.Id),arena,Theme.Arenas.Length);
            if(next!=arena){Theme.SetArena(Theme.Arenas[next].Id);PlayerPrefs.SetString("cc.arena",Theme.Arena.Id);PlayerPrefs.Save();}
            pick=Choice(ref at,inner,rowH,narrow,Lang.T("Language","Język"),new[]{"Polski","English"},Lang.Polish?0:1);
            if((pick==0)!=Lang.Polish)SetLanguage(pick==0);
            GUI.EndScrollView();
            if(Draw.Button(new Rect(x+pad,y+h-foot+8,w-2*pad,46),Lang.T("Done","Gotowe"),Go,true,true,15))CloseSettings();
            var e=Event.current;if(GUI.enabled&&e.type==EventType.MouseDown&&!card.Contains(Draw.Mouse)){CloseSettings();e.Use();}
        }
        static string[] OnOff=>new[]{Lang.T("On","Wł."),Lang.T("Off","Wył.")};
        static string ArenaName(string id)=>id=="night"?Lang.T("Night","Nocna"):id=="turf"?Lang.T("Turf","Trawa"):Lang.T("Court","Piasek");

        void Section(ref float at,float width,string title,string note)
        {
            Draw.Text(new Rect(0,at+6,width,22),title.ToUpperInvariant(),11,Theme.Muted,TextAnchor.MiddleLeft,true);
            if(note.Length>0)Draw.Text(new Rect(0,at+6,width,22),note,11,Theme.Disabled,TextAnchor.MiddleRight,false);
            at+=30;
        }
        // One setting with a few values, the current one filled. Returns the value picked.
        int Choice(ref float at,float width,float rowH,bool narrow,string label,string[] options,int current)
        {
            float buttonH=Mathf.Max(38,UiViewport.TargetSize-4),area=narrow?width:Mathf.Min(width*.52f,options.Length*112),gap=6,each=(area-gap*(options.Length-1))/options.Length;
            float labelH=narrow?24:rowH-8,top=at+(narrow?26:(rowH-8-buttonH)*.5f),left=narrow?0:width-area;
            Draw.Text(new Rect(0,at,narrow?width:width-area-10,labelH),label,13,Theme.Text,TextAnchor.MiddleLeft,true);
            int picked=current;
            for(int i=0;i<options.Length;i++)
                if(Draw.Button(new Rect(left+i*(each+gap),top,each,buttonH),options[i],Theme.Info,i==current,true,13))picked=i;
            at+=rowH;return picked;
        }
        // One setting with many values: the current one between a "previous" and a "next" button.
        int Stepper(ref float at,float width,float rowH,bool narrow,string label,string value,int current,int count,Color? swatch=null)
        {
            float buttonH=Mathf.Max(38,UiViewport.TargetSize-4),area=narrow?width:Mathf.Min(width*.52f,336),arrow=Mathf.Max(44,buttonH);
            float labelH=narrow?24:rowH-8,top=at+(narrow?26:(rowH-8-buttonH)*.5f),left=narrow?0:width-area;
            Draw.Text(new Rect(0,at,narrow?width:width-area-10,labelH),label,13,Theme.Text,TextAnchor.MiddleLeft,true);
            int picked=current;
            if(Draw.Button(new Rect(left,top,arrow,buttonH),"‹",Theme.Info,false,true,18))picked=(current+count-1)%count;
            var plate=new Rect(left+arrow+6,top,area-2*arrow-12,buttonH-3);
            Draw.Plate(plate,Color.Lerp(Theme.Panel,Theme.Info,.12f),Theme.Info,Theme.Info,0);
            Draw.Text(plate,value,13,Theme.Text,TextAnchor.MiddleCenter,true);
            // A colour is shown as well as named.
            if(swatch.HasValue){var dot=new Rect(plate.x+10,plate.center.y-9,18,18);Draw.Circle(new Rect(dot.x-2,dot.y-2,22,22),Theme.Ink);Draw.Circle(dot,swatch.Value);}
            if(Draw.Button(new Rect(left+area-arrow,top,arrow,buttonH),"›",Theme.Info,false,true,18))picked=(current+1)%count;
            at+=rowH;return picked;
        }
    }
}
