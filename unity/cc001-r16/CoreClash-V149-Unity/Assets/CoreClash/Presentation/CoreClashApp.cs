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
        public bool IsModalOpen=>inspect.Length>0||builder||exitGuard.Open||deckGuide!=null||settingsOpen;
        public bool IsExitConfirmOpen=>exitGuard.Open;
        public bool DeveloperOverlay {get;private set;}
        // W22: normal play offers only the active roster. The developer roster (F2, or the button
        // in the F1 overlay) also offers frozen balls and the legacy decks for testing.
        public bool DeveloperRoster {get;private set;}
        public bool ActiveRosterOnly=>Catalog?.Roster!=null&&!DeveloperRoster;
        DeckDefinition[] SetupDecks=>Catalog.Roster==null?Catalog.Featured:ActiveRosterOnly?Catalog.Roster.Decks:Catalog.Roster.Decks.Concat(Catalog.Featured).ToArray();
        DeckDefinition[] LibraryDecks=>Catalog.Roster==null?decks:ActiveRosterOnly?Catalog.Roster.Decks:Catalog.Roster.Decks.Concat(decks).ToArray();
        public void OpenDeckBuilder(int owner){if(setup&&(owner==0||owner==1))OpenBuilder(owner);}
        public void SetDeveloperRoster(bool value)
        {
            if(Catalog?.Roster==null||DeveloperRoster==value)return;
            DeveloperRoster=value;setupScroll=presetScroll=rosterScroll=Vector2.zero;
            // Leaving the developer roster never leaves a frozen deck selected.
            if(!value)for(int owner=0;owner<2;owner++)if(!Catalog.Roster.IsActiveDeck(chosen[owner])){chosen[owner]=Catalog.Roster.Decks[owner%Catalog.Roster.Decks.Length];if(builder&&builderOwner==owner)custom=chosen[owner].balls.ToList();}
            Debug.Log("CORE_CLASH_DEVELOPER_ROSTER "+value);
        }
        public bool IsBoardInspection=>boardInspection;
        // The rectangle the 540 x 900 world of the rules is drawn in (BoardView.FieldBoard), on screen.
        public Rect ArenaRect=>UiViewport.ToScreen(BoardView.FieldBoard(board));
        public Rect UiArenaRect=>board;
        public float UiWidth=>UiViewport.Width;
        public float UiHeight=>UiViewport.Height;
        NetworkGameSession session;
        // W24: optional computer opponent in the Player 2 seat of a local match.
        readonly AiOpponent ai=new AiOpponent();bool aiMatch;
        // The level is fixed when the match starts: changing the option mid-match takes effect in the next one.
        AiLevel aiLevel=AiLevel.Normal;
        public AiLevel MatchAiLevel=>aiLevel;
        public bool VersusAi{get;private set;}
        // remember=false changes it for this run only (test drivers), leaving the player's saved choice alone.
        public void SetVersusAi(bool value,bool remember=true){VersusAi=value;if(remember)PlayerPrefs.SetInt("cc.versusAi",value?1:0);}
        bool AiTurn=>aiMatch&&NetworkLink==null&&Simulation.State.turn==1;
        int? LocalSeat=>NetworkLink!=null?NetworkLink.LocalOwner:aiMatch?0:(int?)null;
        FeedbackTimeline feedback=new FeedbackTimeline();
        readonly RemoteBallSmoother remoteBallSmoother=new RemoteBallSmoother();
        bool receivedRemoteState;
        readonly LaunchGesture gesture=new LaunchGesture();
        readonly MatchExitGuard exitGuard=new MatchExitGuard();
        readonly DeckDefinition[] chosen=new DeckDefinition[2];
        readonly Dictionary<string,BallCopy> ballCopy=new Dictionary<string,BallCopy>();
        readonly Dictionary<string,DeckCopy> deckCopy=new Dictionary<string,DeckCopy>();
        Rect board,side;
        MatchLayout layout;
        bool setup=true,builder,library,initialized,externalModal,boardInspection;
        int builderOwner,replayId,sequence,pointerReadyFrame,inspectBallId,remoteLastEventId,remoteLastRevision;
        float accumulator,selectedAt=-9,screenAt=-9;
        int screenShown=-1;
        string selected="normal",notice="",search="",inspect="",fatal="",networkNotice="";
        Vector2 setupScroll,presetScroll,rosterScroll,infoScroll,matchScroll,trayScroll;
        List<string> custom=new List<string>();
        DeckDefinition[] decks;
        int ViewOwner=>NetworkLink!=null?NetworkLink.LocalOwner:0;
        bool CanChoose=>Simulation.State.phase==MatchPhase.Aiming&&!AiTurn&&(NetworkLink==null||(NetworkLink.IsConnected&&Simulation.State.turn==NetworkLink.LocalOwner));
        void Awake(){Initialize();}
        public void Initialize()
        {
            if(initialized)return;initialized=true;VersusAi=PlayerPrefs.GetInt("cc.versusAi",0)==1;LoadLanguage();LoadArena();MatchSetup.Load();BallView.Warm();Application.targetFrameRate=60;QualitySettings.vSyncCount=1;
            try{
                var source=Resources.Load<TextAsset>("Data/catalog");var featured=Resources.Load<TextAsset>("Data/featured-decks");
                if(source==null||featured==null)throw new Exception("Game data could not be loaded.");
                string featuredJson=featured.text;
                if(Application.platform!=RuntimePlatform.WebGLPlayer){string path=Path.Combine(Application.persistentDataPath,"featured-decks.json");if(File.Exists(path))featuredJson=File.ReadAllText(path);}
                Catalog=new Catalog(JsonUtility.FromJson<CatalogData>(source.text),JsonUtility.FromJson<FeaturedDeckData>(featuredJson));decks=Catalog.AllDecks.ToArray();chosen[0]=decks[0];chosen[1]=decks[1];
                var rosterSource=Resources.Load<TextAsset>("Data/roster");
                if(rosterSource!=null){
                    var rosterData=JsonUtility.FromJson<RosterData>(rosterSource.text);Catalog.UseRoster(rosterData);
                    foreach(var deck in rosterData.decks??Array.Empty<RosterDeck>())deckCopy[deck.id]=new DeckCopy{id=deck.id,identity=deck.identity,accent=deck.accent};
                    if(Catalog.Roster.Decks.Length>=2){chosen[0]=Catalog.Roster.Decks[0];chosen[1]=Catalog.Roster.Decks[1];}
                }
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
        // A drag in progress is dropped when the game loses the focus. A capture or probe run drives
        // itself and must keep going when the owner clicks into another window (IgnoreDeviceInput).
        void OnApplicationFocus(bool focused){if(!focused&&!IgnoreDeviceInput)CancelPointer();}
        void OnApplicationPause(bool paused){if(paused&&!IgnoreDeviceInput)CancelPointer();}
        public void SetDeviceProfile(string value)
        {
            if(!Enum.TryParse<DeviceProfile>(value,true,out var profile))profile=DeviceProfile.Auto;
            UiViewport.SelectProfile(profile);CancelPointer();Layout();trayScroll=matchScroll=Vector2.zero;
            Debug.Log("CC_DEVICE_PROFILE requested="+profile+" effective="+UiViewport.Profile+" logical="+UiWidth+"x"+UiHeight);
        }
        // W24: draw at the refresh rate of the screen the window is on. A fixed 60 on a 100 or 144 Hz
        // screen shows every frame for an uneven number of refreshes, which reads as stutter.
        float displayRateCheckedAt=-9;int displayRateFrame;
        readonly System.Collections.Generic.List<DisplayInfo> displayLayout=new System.Collections.Generic.List<DisplayInfo>();
        void FollowDisplayRate()
        {
#if UNITY_STANDALONE
            float span=Time.unscaledTime-displayRateCheckedAt;if(span<1)return;
            int frames=Time.frameCount-displayRateFrame;displayRateCheckedAt=Time.unscaledTime;displayRateFrame=Time.frameCount;
            int rate=(int)Math.Round(Screen.mainWindowDisplayInfo.refreshRate.value);if(rate<30)return;
            // Some windowed setups ignore v-sync and the game then runs flat out with uneven frames.
            // When that is measured, fall back to a frame cap, which always holds. A cap is not locked
            // to the display, so it is set to a multiple of the refresh rate (at least 240): every
            // refresh then shows a frame that is at most a few milliseconds old, instead of sometimes
            // showing one frame twice.
            // On a desk with monitors of different refresh rates the compositor times a window's
            // frames by the fastest monitor, so a game on the 60 Hz one may run at 240 with v-sync on.
            // That is still locked to the display and smooth: v-sync counts as ignored only when the
            // game runs faster than any monitor could ask for. (Dropping it too eagerly left an
            // unlocked frame cap, and the balls then seemed to twitch back and forth in motion.)
            float fastest=rate;Screen.GetDisplayLayout(displayLayout);
            foreach(var display in displayLayout)fastest=Mathf.Max(fastest,(float)display.refreshRate.value);
            if(QualitySettings.vSyncCount>0&&span<5&&frames/span>fastest*1.3f)QualitySettings.vSyncCount=0;
            int wanted=QualitySettings.vSyncCount>0?rate:rate*Mathf.Max(2,Mathf.CeilToInt(240f/rate));
            if(Application.targetFrameRate!=wanted)Application.targetFrameRate=wanted;
#endif
        }
        void Update()
        {
            if(Catalog==null)return;if(UiViewport.Refresh()){CancelPointer();Layout();}
            FollowDisplayRate();
            if(GetKeyDown(KeyCode.F1))SetDeveloperOverlay(!DeveloperOverlay);
            // F6: the next arena look (court, night, turf). Presentation only.
            if(GetKeyDown(KeyCode.F6)){Theme.SetArena(Theme.NextArena());PlayerPrefs.SetString("cc.arena",Theme.Arena.Id);PlayerPrefs.Save();Debug.Log("CORE_CLASH_ARENA "+Theme.Arena.Id);}
            if(GetKeyDown(KeyCode.F2)&&setup)SetDeveloperRoster(!DeveloperRoster);
            if(exitGuard.Open&&!externalModal&&(GetKeyDown(KeyCode.Return)||GetKeyDown(KeyCode.KeypadEnter)||GetKeyDown(KeyCode.JoystickButton0)))ConfirmLeaveMatch();
            else if(exitGuard.Open&&!externalModal&&(GetKeyDown(KeyCode.Escape)||GetKeyDown(KeyCode.JoystickButton1)))CancelLeaveMatch();
            else if(GetKeyDown(KeyCode.Escape)&&!externalModal){if(inspect.Length>0)CloseBallDetails();else if(deckGuide!=null)deckGuide=null;else if(DeveloperOverlay)SetDeveloperOverlay(false);else if(phoneMenu)phoneMenu=false;else if(boardInspection)SetBoardInspection(false);else if(builder)builder=false;else if(library)library=false;else if(!setup)RequestLeaveMatch();}
            if(setup)return;
            BoardView.VisualLead=0;
            if(MatchExitGuard.PausesSimulation(exitGuard.Open,NetworkLink!=null))accumulator=0;
            else if(NetworkLink==null||NetworkLink.IsAuthority){accumulator=Math.Min(accumulator+Time.unscaledDeltaTime,.1f);while(accumulator>=1f/120){Simulation.Step(1f/120);accumulator-=1f/120;}BoardView.VisualLead=accumulator;}
            feedback.Observe(Simulation.State,Time.unscaledTime);
            BoardView.ComputerThinking=AiTurn&&Simulation.State.phase==MatchPhase.Aiming;
            if(AiTurn&&Simulation.State.phase==MatchPhase.Aiming&&!exitGuard.Open&&ai.Think(Simulation,chosen[0],chosen[1],aiLevel,Time.unscaledTime,AiOpponent.FrameBudget(aiLevel,Application.targetFrameRate),out var aiCommand))
            {
                aiCommand.sequence=++sequence;
                if(session.Submit(aiCommand.owner,aiCommand,out var aiReason))Debug.Log("CORE_CLASH_AI_LAUNCH level="+aiLevel+" kind="+aiCommand.kind+" type="+aiCommand.ballType);else Debug.LogWarning("AI shot rejected: "+aiReason);
            }
            if(Simulation.State.phase==MatchPhase.Aiming)selected=BallSelection.ForTurn(Simulation,selected);
            if(inspect.Length>0||DeveloperOverlay||externalModal||exitGuard.Open||phoneMenu){gesture.Active=false;return;}
            if(CanChoose){
                if(GetKeyDown(KeyCode.Alpha0)||GetKeyDown(KeyCode.Keypad0))SelectBall("normal");
                for(int i=0;i<Simulation.State.players[Simulation.State.turn].stock.Count&&i<9;i++)if(GetKeyDown((KeyCode)((int)KeyCode.Alpha1+i))||GetKeyDown((KeyCode)((int)KeyCode.Keypad1+i)))SelectBall(Simulation.State.players[Simulation.State.turn].stock[i].id);
            }
            if(GetKeyDown(KeyCode.I))SetBoardInspection(!boardInspection);
            if(GetKeyDown(KeyCode.E))ToggleStopEstimate();
            if(IgnoreDeviceInput)return;
            if(UnityEngine.Input.touchCount==0&&UnityEngine.Input.GetMouseButtonDown(1)&&InspectAt(UnityEngine.Input.mousePosition))return;
            if(TouchInput.Read(out var pointer)||DesktopInput.Read(out pointer))HandlePointer(pointer);
        }
        // A capture or probe run drives the game itself. The owner's own mouse and keyboard must not
        // reach it, and it must not drop its drag when its window loses the focus: about one run in
        // fifteen failed because the owner clicked into another window while it ran.
        public static bool IgnoreDeviceInput;
        static bool GetKeyDown(KeyCode key)=>!IgnoreDeviceInput&&UnityEngine.Input.GetKeyDown(key);
        public void PresentationPointer(PointerSample pointer){if(!setup&&!IsModalOpen&&!DeveloperOverlay&&!externalModal&&!phoneMenu)HandlePointer(pointer);}
        void HandlePointer(PointerSample p)
        {
            if(p.canceled){gesture.Cancel(p.id);return;}
            if(boardInspection){gesture.Active=false;if(p.down)InspectAt(p.position);return;}
            if(!CanChoose||Time.frameCount<=pointerReadyFrame){gesture.Active=false;return;}
            Vector2 screen=UiViewport.PointerToLogical(p.position);
            if(p.down&&hintShown&&layout.PhonePortrait&&hintRect.Contains(screen)){gesture.Active=false;ShowBallDetails(selected);return;}
            var world540=BoardView.FieldBoard(board);
            float viewX=(screen.x-world540.x)*540/world540.width,viewY=(screen.y-world540.y)*540/world540.width;
            Vector2 world=new Vector2(MatchPerspective.SimulationX(viewX,ViewOwner),MatchPerspective.SimulationY(viewY,ViewOwner));
            if(p.down&&board.Contains(screen)){
                var near=Simulation.State.balls.Where(b=>!b.dead&&!b.banished).OrderBy(b=>(b.x-world.x)*(b.x-world.x)+(b.y-world.y)*(b.y-world.y)).FirstOrDefault();replayId=0;
                if(near!=null&&Vector2.Distance(world,new Vector2(near.x,near.y))<=near.radius+10){if(Simulation.CanReplay(near)){replayId=near.id;gesture.Begin(p.id,near.x,near.y);}else ShowRuntimeBallDetails(near.id);}
                else{float py=Simulation.State.turn==0?853:47;if(Vector2.Distance(world,new Vector2(270,py))<=85)gesture.Begin(p.id,270,py);}
            }
            if(p.held||p.up)gesture.Move(p.id,world.x,world.y);
            if(p.up&&gesture.Release(p.id,Simulation.State.turn,Simulation.State.turnNumber,selected,replayId,out var command)){
                command.sequence=++sequence;bool accepted=NetworkLink!=null?NetworkLink.Submit(command,out notice):session.Submit(command.owner,command,out notice);
                if(!accepted){Debug.LogWarning("Intent rejected: "+notice);notice=Lang.T("This shot could not be played. Try again.","Tego strzału nie dało się wykonać. Spróbuj ponownie.");}
                else{notice="";Debug.Log("CORE_CLASH_LAUNCH owner="+command.owner+" type="+command.ballType);}
            }
        }
        public void SelectDeck(int owner,string id){if(owner<0||owner>1)return;var deck=Catalog.Deck(id);if(deck!=null)chosen[owner]=deck;}
        public void StartLocalMatch()
        {
            NetworkLink?.Disconnect();GetComponent<NgoGameSession>()?.Disconnect();StartMatchState();aiMatch=VersusAi;aiLevel=MatchSetup.AiLevel;
            // W24: the computer's colour is drawn for every match; two players keep the colours they chose.
            if(VersusAi)MatchSetup.DrawComputerColor();else MatchSetup.UseChosenColors();
        }
        void StartMatchState(){deckGuide=null;hintShown=false;aiMatch=false;ai.Reset();remoteBallSmoother.Reset();remoteLastEventId=remoteLastRevision=0;NetworkLink=null;Simulation=new GameSimulation(Catalog,chosen[0],chosen[1]);
            // W24: the rules the player set for the match (ball size, double turn, map).
            MatchSetup.Apply(Simulation);
            // W22: a match between two active decks keeps random type picks inside the active roster.
            // A match with a frozen deck (developer roster, tests, drivers) runs exactly as before.
            Simulation.ActiveRosterOnly=Catalog.Roster!=null&&Catalog.Roster.IsActiveDeck(chosen[0])&&Catalog.Roster.IsActiveDeck(chosen[1]);
            session=new NetworkGameSession(Simulation);feedback=new FeedbackTimeline();feedback.Observe(Simulation.State,Time.unscaledTime);Fx.Reset();resultHidden=false;phoneMenu=false;receivedRemoteState=false;sequence=0;setup=false;exitGuard.Reset();builder=library=boardInspection=false;inspectBallId=0;selected="normal";CancelPointer();notice="";trayScroll=matchScroll=Vector2.zero;Debug.Log("CORE_CLASH_MATCH_START "+chosen[0].id+" vs "+chosen[1].id+(Simulation.ActiveRosterOnly?" roster=active":""));}
        public void SelectBall(string id){if(CanChoose&&Catalog.Ball(id)!=null&&BallSelection.CanSelect(Simulation,Simulation.State.turn,id)){if(selected!=id)selectedAt=Time.unscaledTime;selected=id;gesture.Active=false;Debug.Log("CORE_CLASH_SELECT "+id);}}
        public void ShowBallDetails(string id){if(Catalog.Ball(id)!=null){inspect=id;inspectBallId=0;boardInspection=false;infoScroll=Vector2.zero;gesture.Active=false;Debug.Log("CORE_CLASH_DETAILS "+id+" developer="+DeveloperOverlay);}}
        public void ShowRuntimeBallDetails(int id){var current=BallInspection.Read(Simulation?.State,id);if(current!=null&&Catalog.Ball(current.Type)!=null){ShowBallDetails(current.Type);inspectBallId=id;boardInspection=false;}}
        public void CloseBallDetails(){inspect="";inspectBallId=0;demo=null;}
        public void SetBoardInspection(bool value){boardInspection=value;gesture.Active=false;}
        bool InspectAt(Vector2 position)
        {
            var screen=UiViewport.PointerToLogical(position);if(!board.Contains(screen))return false;
            var world540=BoardView.FieldBoard(board);
            float viewX=(screen.x-world540.x)*540/world540.width,viewY=(screen.y-world540.y)*540/world540.width;
            var ball=BallInspection.At(Simulation.State,MatchPerspective.SimulationX(viewX,ViewOwner),MatchPerspective.SimulationY(viewY,ViewOwner));
            if(ball==null)return false;ShowRuntimeBallDetails(ball.id);return true;
        }
        public void SetDeveloperOverlay(bool value){DeveloperOverlay=value;gesture.Active=false;Debug.Log("CORE_CLASH_DEVELOPER_OVERLAY "+value);}
        public void SetExternalModal(bool value){externalModal=value;if(value)gesture.Active=false;}
        // W17-03 (#285): every in-match exit control goes through the confirmation guard.
        public void RequestLeaveMatch()
        {
            var decision=exitGuard.Request(setup,Simulation.State.phase,NetworkLink!=null,NetworkLink==null||NetworkLink.IsConnected);
            if(decision==MatchExitDecision.LeaveNow)ReturnToSetup();
            else if(decision==MatchExitDecision.AskConfirm){CancelPointer();Debug.Log("CORE_CLASH_LEAVE_CONFIRM_OPEN phase="+Simulation.State.phase);}
        }
        public void ConfirmLeaveMatch(){if(exitGuard.Confirm()){Debug.Log("CORE_CLASH_LEAVE_CONFIRMED");ReturnToSetup();}}
        public void CancelLeaveMatch(){if(exitGuard.Open){exitGuard.Cancel();CancelPointer();Debug.Log("CORE_CLASH_LEAVE_CANCELED");}}
        public void ReturnToSetup(){deckGuide=null;hintShown=false;exitGuard.Reset();remoteBallSmoother.Reset();NetworkLink?.Disconnect();GetComponent<NgoGameSession>()?.Disconnect();NetworkLink=null;setup=true;builder=library=boardInspection=false;CancelPointer();CloseBallDetails();DeveloperOverlay=false;}
        public void BeginNetworkGame(IUnityNetworkLink link){StartMatchState();NetworkLink=link;networkNotice=link.Status;MatchSetup.UseColorsFor(link.LocalOwner);}
        public void ReceiveNetworkState(GameState state,int snapshotRevision)
        {
            if(NetworkLink!=null&&!NetworkLink.IsAuthority&&state!=null){
                // A30 W11: prevent stale/duplicate/unversioned packets from modifying
                // the client authoritative state, event cursor, or visual cache.
                if(!RemoteSnapshotEvents.IsFreshRevision(remoteLastRevision,snapshotRevision))return;
                remoteLastRevision=snapshotRevision;
                var instantBallIds=RemoteSnapshotEvents.InstantBallIds(state,remoteLastEventId,out var latestEventId);
                remoteLastEventId=latestEventId;
                remoteBallSmoother.Observe(state,Time.unscaledTime,instantBallIds,snapshotRevision);
                Simulation.State=state;setup=false;
                if(!receivedRemoteState){feedback=new FeedbackTimeline();feedback.Observe(state,Time.unscaledTime);receivedRemoteState=true;}
            }
        }
        public void SetNetworkNotice(string text){networkNotice=text;}
        void OnGUI()
        {
            if(UiViewport.Refresh()){CancelPointer();Layout();}
            // W24: no GUI.matrix. The views work in logical units and Draw turns them into screen
            // pixels (see Draw.Px), so text and edges are made for the pixels they land on. The one
            // group puts the origin at the corner of the safe area.
            var safe=UiViewport.Current.SafeArea;
            GUI.BeginGroup(new Rect(safe.x,safe.y,safe.width,safe.height));
            try{RenderUi();}finally{GUI.EndGroup();}
        }
        // The arena look: "--cc-arena <id>" on the command line, else the saved choice, else the first one.
        void LoadArena()
        {
            var args=Environment.GetCommandLineArgs();int at=Array.IndexOf(args,"--cc-arena");
            Theme.SetArena(at>=0&&at+1<args.Length?args[at+1]:PlayerPrefs.GetString("cc.arena",Theme.Arenas[0].Id));
            foreach(string probe in new[]{"--cc-w24-showcase","--cc-ai-probe","--cc-guide-probe"})if(Array.IndexOf(args,probe)>=0)IgnoreDeviceInput=true;
            // Test hook: start with the rules-and-options sheet open, for screenshots.
            if(Array.IndexOf(args,"--cc-open-settings")>=0)settingsOpen=true;
            at=Array.IndexOf(args,"--cc-ui-density");
            if(at>=0&&at+1<args.Length&&float.TryParse(args[at+1],System.Globalization.NumberStyles.Float,System.Globalization.CultureInfo.InvariantCulture,out float density))UiViewport.DensityOverride=density;
        }
        void RenderUi()
        {
            GUI.skin.button.fontSize=14;GUI.skin.label.fontSize=14;GUI.skin.textField.fontSize=16;
            Fx.Load();Draw.StyleTextField();GUI.skin.settings.cursorColor=Theme.Ink;
            Draw.Backdrop(new Rect(0,0,UiWidth,UiHeight));
            // Top bar: the logo, except in a match on an upright phone, where the score strip takes its place.
            bool stripInBar=!setup&&layout.PhonePortrait;
            if(!stripInBar)
            {
                bool small=UiWidth<500;float x=small?14:24;int size=UiWidth<360?17:small?23:27;
                Draw.Circle(new Rect(x,17,22,22),Theme.Ink);Draw.Circle(new Rect(x+2,19,18,18),Theme.PlayerColors[0]);
                Draw.Circle(new Rect(x+14,21,22,22),Theme.Ink);Draw.Circle(new Rect(x+16,23,18,18),Theme.PlayerColors[1]);
                Draw.Inked(new Rect(x+44,11,UiWidth<360?130:small?190:330,30),"CORE CLASH",size,Theme.Select,TextAnchor.MiddleLeft,2f);
            }
            if(fatal.Length>0){Draw.Text(new Rect(30,100,UiWidth-60,200),fatal,18,Theme.OnColor);return;}if(Catalog==null)return;
            int screen=setup?(builder?1:library?2:0):3;
            if(screen!=screenShown){screenShown=screen;screenAt=Time.unscaledTime;}
            bool prior=GUI.enabled;GUI.enabled=!externalModal&&inspect.Length==0&&!DeveloperOverlay&&deckGuide==null;
            GUI.enabled=GUI.enabled&&!exitGuard.Open&&!settingsOpen;
            if(setup){if(builder)RenderBuilder();else if(library)RenderLibrary();else RenderSetup();}else RenderMatch();GUI.enabled=prior;
            // Screen change: the new screen fades in from the backdrop. Input is never held back.
            float fade=Fx.ReducedMotion?0:1-Mathf.Clamp01((Time.unscaledTime-screenAt)/Theme.ScreenFade);
            if(fade>0&&Event.current.type==EventType.Repaint)Draw.Rect(new Rect(0,60,UiWidth,UiHeight-60),Theme.A(Color.Lerp(Theme.BackdropTop,Theme.BackdropBottom,.5f),fade*fade));
            if(exitGuard.Open&&!setup)RenderExitConfirm();
            if(settingsOpen)RenderSettings();
            if(deckGuide!=null){bool enabled=GUI.enabled;GUI.enabled=enabled&&inspect.Length==0;RenderDeckGuide();GUI.enabled=enabled;}
            if(inspect.Length>0)RenderInfo();if(DeveloperOverlay)RenderDeveloper();
            GetComponent<NgoLanLobby>()?.Render();
        }
        BallCopy Copy(string id)=>ballCopy.TryGetValue(id,out var text)?text:null;
        string Cue(string id)=>Copy(id)?.cue??Lang.T("Special power","Moc specjalna");
        string Quick(string id)=>Copy(id)?.quick??(AbilitySupport.Status(id)=="DATA_ONLY"?"A physical ball for your custom deck.":Catalog.Ball(id).description);
        string AbilityText(string id)=>AbilitySupport.Status(id)=="DATA_ONLY"?"Launches and collides normally. Its special power is unavailable in this class demo.":Copy(id)?.ability??Catalog.Ball(id).description;
        string Identity(DeckDefinition deck)=>Lang.Polish&&DeckText.IdentityPl(deck.id)!=null?DeckText.IdentityPl(deck.id):deckCopy.TryGetValue(deck.id,out var text)?text.identity:Lang.T("Nine special balls. Find your setup, then create the payoff.","Dziewięć kulek specjalnych. Przygotuj zagranie, a potem je wykorzystaj.");
        string DeckName(DeckDefinition deck)=>deck==null?"":Lang.Polish&&DeckText.NamePl(deck.id)!=null?DeckText.NamePl(deck.id):deck.name;
        Color DeckAccent(DeckDefinition deck)=>deckCopy.TryGetValue(deck.id,out var text)?Theme.Vivid(Draw.Hex(text.accent)):Draw.Gold;
    }
    [Serializable] public sealed class PresentationCopy { public BallCopy[] balls;public DeckCopy[] decks; }
    [Serializable] public sealed class BallCopy {public string id,cue,quick,ability,condition,role;}
    [Serializable] public sealed class DeckCopy {public string id,identity,accent;}
}
