using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using CoreClash.Input;
using CoreClash.Networking;
using UnityEngine;
namespace CoreClash.Presentation
{
    public sealed partial class CoreClashApp : MonoBehaviour
    {
        public Catalog Catalog {get;private set;}
        public GameSimulation Simulation {get;private set;}
        public IUnityNetworkLink NetworkLink {get;private set;}
        public bool IsSetup=>setup;
        public bool IsModalOpen=>inspect.Length>0||builder;
        public bool DeveloperOverlay {get;private set;}
        public bool IsBoardInspection=>boardInspection;
        public Rect ArenaRect=>UiViewport.ToScreen(board);
        public Rect UiArenaRect=>board;
        public float UiWidth=>UiViewport.Width;
        public float UiHeight=>UiViewport.Height;
        NetworkGameSession session;
        FeedbackTimeline feedback=new FeedbackTimeline();
        bool receivedRemoteState;
        readonly LaunchGesture gesture=new LaunchGesture();
        readonly DeckDefinition[] chosen=new DeckDefinition[2];
        readonly Dictionary<string,BallCopy> ballCopy=new Dictionary<string,BallCopy>();
        readonly Dictionary<string,DeckCopy> deckCopy=new Dictionary<string,DeckCopy>();
        Rect board,side;
        MatchLayout layout;
        bool setup=true,builder,library,initialized,externalModal,boardInspection;
        int builderOwner,replayId,sequence,pointerReadyFrame,inspectBallId;
        float accumulator,releasedAt=-100,lastPower;
        string selected="normal",notice="",search="",inspect="",fatal="",networkNotice="";
        Vector2 setupScroll,presetScroll,rosterScroll,infoScroll,matchScroll,trayScroll;
        List<string> custom=new List<string>();
        DeckDefinition[] decks;
        bool CanChoose=>Simulation.State.phase==MatchPhase.Aiming&&(NetworkLink==null||(NetworkLink.IsConnected&&Simulation.State.turn==NetworkLink.LocalOwner));
        void Awake(){Initialize();}
        public void Initialize()
        {
            if(initialized)return;initialized=true;Application.targetFrameRate=60;
            try{
                var source=Resources.Load<TextAsset>("Data/catalog");var featured=Resources.Load<TextAsset>("Data/featured-decks");
                if(source==null||featured==null)throw new Exception("Game data could not be loaded.");
                string featuredJson=featured.text;
                if(Application.platform!=RuntimePlatform.WebGLPlayer){string path=Path.Combine(Application.persistentDataPath,"featured-decks.json");if(File.Exists(path))featuredJson=File.ReadAllText(path);}
                Catalog=new Catalog(JsonUtility.FromJson<CatalogData>(source.text),JsonUtility.FromJson<FeaturedDeckData>(featuredJson));decks=Catalog.AllDecks.ToArray();chosen[0]=decks[0];chosen[1]=decks[1];
                BallView.SetIdentity(new BallIdentity(Catalog.Data.balls));
                var copy=Resources.Load<TextAsset>("Data/presentation-copy");if(copy!=null){var data=JsonUtility.FromJson<PresentationCopy>(copy.text);foreach(var item in data.balls??Array.Empty<BallCopy>())ballCopy[item.id]=item;foreach(var item in data.decks??Array.Empty<DeckCopy>())deckCopy[item.id]=item;}
                Simulation=new GameSimulation(Catalog,chosen[0],chosen[1]);session=new NetworkGameSession(Simulation);Layout();
                Debug.Log("CORE_CLASH_READY V149 catalog="+Catalog.Data.balls.Length+" canonicalDecks="+Catalog.Data.decks.Length+" featured="+Catalog.Featured.Length);
            }catch(Exception e){fatal=e.Message;Debug.LogException(e);}
        }
        static Rect RectOf(UiBox r)=>new Rect(r.x,r.y,r.width,r.height);
        void Layout(){UiViewport.Refresh();layout=MatchLayout.For(UiWidth,UiHeight,UiViewport.Profile);board=RectOf(layout.Board);side=RectOf(layout.Panel);}
        void CancelPointer(){gesture.Active=false;TouchInput.Reset();pointerReadyFrame=Time.frameCount+1;}
        public void CancelPresentationInput(){CancelPointer();}
        void OnApplicationFocus(bool focused){if(!focused)CancelPointer();}
        void OnApplicationPause(bool paused){if(paused)CancelPointer();}
        public void SetDeviceProfile(string value)
        {
            if(!Enum.TryParse<DeviceProfile>(value,true,out var profile))profile=DeviceProfile.Auto;
            UiViewport.SelectProfile(profile);CancelPointer();Layout();trayScroll=matchScroll=Vector2.zero;
            Debug.Log("CC_DEVICE_PROFILE requested="+profile+" effective="+UiViewport.Profile+" logical="+UiWidth+"x"+UiHeight);
        }
        void Update()
        {
            if(Catalog==null)return;if(UiViewport.Refresh()){CancelPointer();Layout();}
            if(UnityEngine.Input.GetKeyDown(KeyCode.F1))SetDeveloperOverlay(!DeveloperOverlay);
            if(UnityEngine.Input.GetKeyDown(KeyCode.Escape)&&!externalModal){if(inspect.Length>0)CloseBallDetails();else if(DeveloperOverlay)SetDeveloperOverlay(false);else if(boardInspection)SetBoardInspection(false);else if(builder)builder=false;else if(library)library=false;else if(!setup)ReturnToSetup();}
            if(setup)return;
            if(NetworkLink==null||NetworkLink.IsAuthority){accumulator=Math.Min(accumulator+Time.unscaledDeltaTime,.1f);while(accumulator>=1f/120){Simulation.Step(1f/120);accumulator-=1f/120;}}
            feedback.Observe(Simulation.State,Time.unscaledTime);
            if(Simulation.State.phase==MatchPhase.Aiming)selected=BallSelection.ForTurn(Simulation,selected);
            if(inspect.Length>0||DeveloperOverlay||externalModal){gesture.Active=false;return;}
            if(CanChoose){
                if(UnityEngine.Input.GetKeyDown(KeyCode.Alpha0)||UnityEngine.Input.GetKeyDown(KeyCode.Keypad0))SelectBall("normal");
                for(int i=0;i<Simulation.State.players[Simulation.State.turn].stock.Count&&i<9;i++)if(UnityEngine.Input.GetKeyDown((KeyCode)((int)KeyCode.Alpha1+i))||UnityEngine.Input.GetKeyDown((KeyCode)((int)KeyCode.Keypad1+i)))SelectBall(Simulation.State.players[Simulation.State.turn].stock[i].id);
            }
            if(UnityEngine.Input.GetKeyDown(KeyCode.I))SetBoardInspection(!boardInspection);
            if(UnityEngine.Input.touchCount==0&&UnityEngine.Input.GetMouseButtonDown(1)&&InspectAt(UnityEngine.Input.mousePosition))return;
            if(TouchInput.Read(out var pointer)||DesktopInput.Read(out pointer))HandlePointer(pointer);
        }
        public void PresentationPointer(PointerSample pointer){if(!setup&&!IsModalOpen&&!DeveloperOverlay&&!externalModal)HandlePointer(pointer);}
        void HandlePointer(PointerSample p)
        {
            if(p.canceled){gesture.Cancel(p.id);return;}
            if(boardInspection){gesture.Active=false;if(p.down)InspectAt(p.position);return;}
            if(!CanChoose||Time.frameCount<=pointerReadyFrame){gesture.Active=false;return;}
            Vector2 screen=UiViewport.PointerToLogical(p.position),world=new Vector2((screen.x-board.x)*540/board.width,(screen.y-board.y)*540/board.width);
            if(p.down&&board.Contains(screen)){
                var near=Simulation.State.balls.Where(b=>!b.dead&&!b.banished).OrderBy(b=>(b.x-world.x)*(b.x-world.x)+(b.y-world.y)*(b.y-world.y)).FirstOrDefault();replayId=0;
                if(near!=null&&Vector2.Distance(world,new Vector2(near.x,near.y))<=near.radius+10){if(Simulation.CanReplay(near)){replayId=near.id;gesture.Begin(p.id,near.x,near.y);}else ShowRuntimeBallDetails(near.id);}
                else{float py=Simulation.State.turn==0?853:47;if(Vector2.Distance(world,new Vector2(270,py))<=85)gesture.Begin(p.id,270,py);}
            }
            if(p.held||p.up)gesture.Move(p.id,world.x,world.y);
            if(p.up&&gesture.Release(p.id,Simulation.State.turn,Simulation.State.turnNumber,selected,replayId,out var command)){
                command.sequence=++sequence;bool accepted=NetworkLink!=null?NetworkLink.Submit(command,out notice):session.Submit(command.owner,command,out notice);
                if(!accepted){Debug.LogWarning("Intent rejected: "+notice);notice="This shot could not be played. Try again.";}
                else{releasedAt=Time.unscaledTime;lastPower=command.power/590;notice="";Debug.Log("CORE_CLASH_LAUNCH owner="+command.owner+" type="+command.ballType);}
            }
        }
        public void SelectDeck(int owner,string id){if(owner<0||owner>1)return;var deck=Catalog.Deck(id);if(deck!=null)chosen[owner]=deck;}
        public void StartLocalMatch(){NetworkLink?.Disconnect();GetComponent<NgoGameSession>()?.Disconnect();StartMatchState();}
        void StartMatchState(){NetworkLink=null;Simulation=new GameSimulation(Catalog,chosen[0],chosen[1]);session=new NetworkGameSession(Simulation);feedback=new FeedbackTimeline();feedback.Observe(Simulation.State,Time.unscaledTime);receivedRemoteState=false;sequence=0;setup=false;builder=library=boardInspection=false;inspectBallId=0;selected="normal";CancelPointer();notice="";releasedAt=-100;trayScroll=matchScroll=Vector2.zero;Debug.Log("CORE_CLASH_MATCH_START "+chosen[0].id+" vs "+chosen[1].id);}
        public void SelectBall(string id){if(CanChoose&&Catalog.Ball(id)!=null&&Simulation.Stock(Simulation.State.turn,id)>0){selected=id;gesture.Active=false;Debug.Log("CORE_CLASH_SELECT "+id);}}
        public void ShowBallDetails(string id){if(Catalog.Ball(id)!=null){inspect=id;inspectBallId=0;boardInspection=false;infoScroll=Vector2.zero;gesture.Active=false;Debug.Log("CORE_CLASH_DETAILS "+id+" developer="+DeveloperOverlay);}}
        public void ShowRuntimeBallDetails(int id){var current=BallInspection.Read(Simulation?.State,id);if(current!=null&&Catalog.Ball(current.Type)!=null){ShowBallDetails(current.Type);inspectBallId=id;boardInspection=false;}}
        public void CloseBallDetails(){inspect="";inspectBallId=0;}
        public void SetBoardInspection(bool value){boardInspection=value;gesture.Active=false;}
        bool InspectAt(Vector2 position)
        {
            var screen=UiViewport.PointerToLogical(position);if(!board.Contains(screen))return false;
            var ball=BallInspection.At(Simulation.State,(screen.x-board.x)*540/board.width,(screen.y-board.y)*540/board.width);
            if(ball==null)return false;ShowRuntimeBallDetails(ball.id);return true;
        }
        public void SetDeveloperOverlay(bool value){DeveloperOverlay=value;gesture.Active=false;Debug.Log("CORE_CLASH_DEVELOPER_OVERLAY "+value);}
        public void SetExternalModal(bool value){externalModal=value;if(value)gesture.Active=false;}
        public void ReturnToSetup(){NetworkLink?.Disconnect();GetComponent<NgoGameSession>()?.Disconnect();NetworkLink=null;setup=true;builder=library=boardInspection=false;CancelPointer();CloseBallDetails();DeveloperOverlay=false;}
        public void BeginNetworkGame(IUnityNetworkLink link){StartMatchState();NetworkLink=link;networkNotice=link.Status;}
        public void ReceiveNetworkState(GameState state){if(NetworkLink!=null&&!NetworkLink.IsAuthority&&state!=null){Simulation.State=state;setup=false;if(!receivedRemoteState){feedback=new FeedbackTimeline();feedback.Observe(state,Time.unscaledTime);receivedRemoteState=true;}}}
        public void SetNetworkNotice(string text){networkNotice=text;}
        void OnGUI()
        {
            if(UiViewport.Refresh()){CancelPointer();Layout();}
            var previousMatrix=GUI.matrix;GUI.matrix=UiViewport.GuiMatrix;
            try{RenderUi();}finally{GUI.matrix=previousMatrix;}
        }
        void RenderUi()
        {
            GUI.skin.button.fontSize=14;GUI.skin.label.fontSize=14;GUI.skin.textField.fontSize=16;
            Draw.Rect(new Rect(0,0,UiWidth,UiHeight),Draw.Background);Draw.Rect(new Rect(0,0,UiWidth,60),new Color(.027f,.047f,.075f));Draw.Rect(new Rect(0,59,UiWidth,1),Draw.Edge);
            Draw.Text(new Rect(UiWidth<500?16:24,11,UiWidth<360?130:UiWidth<500?190:310,28),"CORE CLASH",UiWidth<360?16:UiWidth<500?23:25,Color.white,TextAnchor.MiddleLeft,true);if(UiWidth>700)Draw.Text(new Rect(228,16,170,23),"CLASS DEMO  /  V149",11,Draw.Gold,TextAnchor.MiddleLeft,true);
            if(fatal.Length>0){Draw.Text(new Rect(30,100,UiWidth-60,200),fatal,18,Draw.Pink);return;}if(Catalog==null)return;
            bool prior=GUI.enabled;GUI.enabled=!externalModal&&inspect.Length==0&&!DeveloperOverlay;
            if(setup){if(builder)RenderBuilder();else if(library)RenderLibrary();else RenderSetup();}else RenderMatch();GUI.enabled=prior;
            if(inspect.Length>0)RenderInfo();if(DeveloperOverlay)RenderDeveloper();
            GetComponent<NgoLanLobby>()?.Render();
        }
        BallCopy Copy(string id)=>ballCopy.TryGetValue(id,out var text)?text:null;
        string Cue(string id)=>Copy(id)?.cue??"Special power";
        string Quick(string id)=>Copy(id)?.quick??(AbilitySupport.Status(id)=="DATA_ONLY"?"A physical ball for your custom deck.":Catalog.Ball(id).description);
        string AbilityText(string id)=>AbilitySupport.Status(id)=="DATA_ONLY"?"Launches and collides normally. Its special power is unavailable in this class demo.":Copy(id)?.ability??Catalog.Ball(id).description;
        string Identity(DeckDefinition deck)=>deckCopy.TryGetValue(deck.id,out var text)?text.identity:"Nine special balls. Find your setup, then create the payoff.";
        Color DeckAccent(DeckDefinition deck)=>deckCopy.TryGetValue(deck.id,out var text)?Draw.Hex(text.accent):Draw.Gold;
    }
    [Serializable] public sealed class PresentationCopy { public BallCopy[] balls;public DeckCopy[] decks; }
    [Serializable] public sealed class BallCopy {public string id,cue,quick,ability,condition,role;}
    [Serializable] public sealed class DeckCopy {public string id,identity,accent;}
}
