using System;
using System.Collections.Generic;
using System.IO;
using CoreClash.Presentation;
using Unity.Netcode;
using Unity.Netcode.Transports.UTP;
using UnityEngine;

namespace CoreClash.Networking
{
    // The lobby selects transport and creates invitations. All players enter NgoGameSession's authority boundary.
    [DefaultExecutionOrder(100)]
    public sealed class NgoLanLobby : MonoBehaviour
    {
        const ushort DefaultGamePort=7777;
        [SerializeField] string internetBrowserUrl="";
        CoreClashApp app;
        NgoGameSession link;
        NetworkManager manager;
        bool open,joinTab,advanced,internetMode=true,hostServicesAttempted,wasConnected;
        string roomName="My Core Clash Game",invitation="",manualHost="",manualPort="7777",notice="",joinUrl="",webStatus="";
        float nextAdvertisement,copiedUntil;
        Vector2 scroll;
        GUIStyle fieldStyle;
        public bool IsOpen=>open;
        public string JoinUrl=>link!=null&&link.UsingInternet?OnlineJoinAddress.Create(internetBrowserUrl,link.Internet?.Code):joinUrl;
        public string RoomName=>roomName;
        public string InternetBrowserUrl {get=>internetBrowserUrl;set=>internetBrowserUrl=value??"";}
        bool Active=>manager!=null&&manager.IsListening||link!=null&&link.Internet!=null&&(link.Internet.Busy||link.Internet.HasSession);
#if !UNITY_WEBGL
        LanDiscoveryClient discovery;
        LanDiscoveryPublisher publisher;
        LanStaticHttpServer webServer;
#endif
        [Serializable] sealed class BrowserSettings {public string browserGameUrl;}
        void Awake(){app=GetComponent<CoreClashApp>();link=GetComponent<NgoGameSession>();}
        void Start()
        {
            manager=UnityEngine.Object.FindAnyObjectByType<NetworkManager>();
            var settings=Resources.Load<TextAsset>("Data/network-settings");
            if(settings!=null){try{internetBrowserUrl=JsonUtility.FromJson<BrowserSettings>(settings.text)?.browserGameUrl??internetBrowserUrl;}catch(ArgumentException){}}
            if(string.IsNullOrEmpty(internetBrowserUrl)&&Application.platform==RuntimePlatform.WebGLPlayer)internetBrowserUrl=Application.absoluteURL;
            // Internet codes and direct LAN invitations are independent of the opt-in development smoke query.
            if(OnlineJoinAddress.TryParse(Application.absoluteURL,out var code)){
                open=true;joinTab=true;internetMode=true;invitation=code;
                notice=link.Internet!=null&&link.Internet.Join(code)?Lang.T("Joining the invited Internet game as Player 2…","Dołączasz do gry przez Internet jako Gracz 2…"):Lang.T("Could not start the Internet connection. Please try again.","Nie udało się połączyć przez Internet. Spróbuj ponownie.");
            } else if(LanJoinAddress.TryParse(Application.absoluteURL,out var host,out var port)){
                open=true;joinTab=true;internetMode=false;
                if(link.Join(host,port)){notice=Lang.T("Joining the invited LAN game as Player 2…","Dołączasz do gry w sieci lokalnej jako Gracz 2…");Debug.Log("CC_LAN_INVITATION_JOIN host="+host+" port="+port);}
                else notice=Lang.T("Could not start the invited connection. Please try again.","Nie udało się połączyć z zaproszenia. Spróbuj ponownie.");
            }
        }
        void Update()
        {
            if(link!=null&&link.NeedsRecovery&&link.CanStart){
                string message=link.FailureMessage;bool hosting=link.Hosting;internetMode=link.UsingInternet;
                app.ReturnToSetup();open=true;joinTab=!hosting;advanced=false;scroll=Vector2.zero;notice=message;
                Debug.Log("CC_LAN_CONNECTION_RECOVERED setup="+app.IsSetup+" mode="+(hosting?"create":"join"));
            }
            if(open&&UnityEngine.Input.GetKeyDown(KeyCode.Escape))open=false;
            if(link!=null&&link.IsConnected&&!wasConnected){if(open)open=false;Debug.Log("CC_LAN_PLAYER_CONNECTED owner="+link.LocalOwner);}
            wasConnected=link!=null&&link.IsConnected;
            app?.SetExternalModal(open&&!app.IsModalOpen);
#if !UNITY_WEBGL
            bool directHost=manager!=null&&manager.IsListening&&link.IsAuthority&&!link.UsingInternet;
            if(directHost){
                if(!hostServicesAttempted)StartHostServices();
                if(publisher!=null&&Time.unscaledTime>=nextAdvertisement){nextAdvertisement=Time.unscaledTime+1;try{publisher.Broadcast(roomName,GamePort(),link.LobbyPlayerCount);}catch(Exception e){notice=Lang.T("Game is running; LAN broadcast could not be sent.","Gra działa, ale nie udało się jej ogłosić w sieci lokalnej.");Debug.LogWarning("CC_LAN_ADVERT_ERROR "+e.Message);}}
            } else if(hostServicesAttempted)StopHostServices();
            bool searching=open&&!internetMode&&joinTab&&!Active;
            if(searching&&discovery==null){try{discovery=new LanDiscoveryClient();}catch(Exception e){notice=Lang.T("LAN discovery is unavailable. Use an invitation or Advanced.","Wyszukiwanie w sieci lokalnej jest niedostępne. Użyj zaproszenia albo opcji zaawansowanych.");Debug.LogWarning("CC_LAN_DISCOVERY_UNAVAILABLE "+e.Message);}}
            else if(!searching&&discovery!=null){discovery.Dispose();discovery=null;}
#endif
        }
        ushort GamePort(){var utp=manager==null?null:manager.GetComponent<UnityTransport>();return utp==null?DefaultGamePort:utp.ConnectionData.Port;}
#if !UNITY_WEBGL
        void StartHostServices()
        {
            hostServicesAttempted=true;nextAdvertisement=0;
            try{publisher=new LanDiscoveryPublisher();}catch(Exception e){notice=Lang.T("Game is running; LAN broadcast is unavailable.","Gra działa, ale ogłaszanie w sieci lokalnej jest niedostępne.");Debug.LogWarning("CC_LAN_ADVERT_ERROR "+e.Message);}
            try{
                string hostIp=LanNativeAddress.SelectPrivateIPv4();
                string webRoot=Path.Combine(Path.GetDirectoryName(Application.dataPath)??"","WebRoot");
                webServer=new LanStaticHttpServer(webRoot);
                if(hostIp!=null){joinUrl=LanJoinAddress.Create(hostIp,webServer.Port,GamePort());webStatus=Lang.T("Open this invitation on another device on the same Wi-Fi / LAN.","Otwórz to zaproszenie na innym urządzeniu w tej samej sieci Wi-Fi / LAN.");Debug.Log("CC_LAN_JOIN_URL "+joinUrl);}
                else webStatus=Lang.T("Connect this PC to a private Wi-Fi / LAN to generate a browser invitation.","Podłącz ten komputer do prywatnej sieci Wi-Fi / LAN, żeby utworzyć zaproszenie do przeglądarki.");
            }catch(Exception e){webStatus=Lang.T("Browser invitation unavailable: include the WebRoot folder beside the game. Native players can still use Join Game.","Zaproszenie do przeglądarki niedostępne: obok gry musi być folder WebRoot. Gracze z aplikacją nadal mogą dołączyć do gry.");Debug.LogWarning("CC_LAN_HTTP_UNAVAILABLE "+e.Message);}
        }
        void StopHostServices(){publisher?.Dispose();publisher=null;webServer?.Dispose();webServer=null;joinUrl="";webStatus="";hostServicesAttempted=false;}
#endif
        void OnDestroy()
        {
            app?.SetExternalModal(false);
#if !UNITY_WEBGL
            discovery?.Dispose();StopHostServices();
#endif
        }
        public void OpenCreate(){open=true;joinTab=false;advanced=false;scroll=Vector2.zero;}
        public void OpenJoin(){open=true;joinTab=true;advanced=false;scroll=Vector2.zero;}
        public void Close(){open=false;if(app!=null)app.SetExternalModal(false);}
        // CoreClashApp wraps the lobby with its logical safe-area GUI matrix exactly once.
        public void Render()
        {
            app?.SetExternalModal(open&&!app.IsModalOpen);
            if(app==null||app.Catalog==null||app.IsModalOpen)return;
            float sw=UiViewport.Width,sh=UiViewport.Height;
            // W24: in a match on an upright phone the top bar belongs to the score strip, so the entry is an icon.
            bool compact=!app.IsSetup&&(UiViewport.Profile==DeviceProfile.Phone||UiViewport.Profile==DeviceProfile.Tablet)&&sw<sh;
            // There is no top bar there at all, so the entry is offered from the deck screen only.
            if(compact&&!open)return;
            if(compact?Draw.IconButton(new Rect(sw-52,8,44,44),"+C -.4 -.38 .3;+C .4 -.38 .3;+C -.4 .56 .42;+C .4 .56 .42",Draw.Cyan,open):Draw.Button(new Rect(sw-168,8,150,44),Lang.T("MULTIPLAYER","GRA W SIECI"),Draw.Cyan,open)){open=!open;app.SetExternalModal(open);}
            if(!open)return;
            Draw.Backdrop(new Rect(0,0,sw,sh));
            float width=Mathf.Min(660,sw-20),height=Mathf.Min(730,sh-20),x=(sw-width)/2,y=(sh-height)/2;
            var modal=new Rect(x,y,width,height);Draw.Surface(modal,Draw.Panel,Draw.Edge);
            Draw.Text(new Rect(x+20,y+12,width-90,34),Lang.T("PLAY TOGETHER","GRAJCIE RAZEM"),23,Theme.Text,TextAnchor.MiddleLeft,true);
            if(Draw.Button(new Rect(x+width-64,y+10,44,44),"×",Draw.Pink)){open=false;app.SetExternalModal(false);return;}
            Draw.Text(new Rect(x+20,y+51,width-40,35),Lang.T("Two players · Windows host · the same game on every device","Dwóch graczy · grę zakłada komputer z Windows · ta sama gra na każdym urządzeniu"),12,Draw.Muted);
            bool active=Active;float top=y+94;
            if(!active){
                float half=(width-48)/2;
                if(Draw.Button(new Rect(x+20,top,half,44),Lang.T("CREATE GAME","STWÓRZ GRĘ"),Draw.Cyan,!joinTab)){joinTab=false;scroll=Vector2.zero;}
                if(Draw.Button(new Rect(x+28+half,top,half,44),Lang.T("JOIN GAME","DOŁĄCZ DO GRY"),Draw.Pink,joinTab)){joinTab=true;scroll=Vector2.zero;}
                top+=56;
                if(Draw.Button(new Rect(x+20,top,half,44),"INTERNET",Draw.Cyan,internetMode)){internetMode=true;advanced=false;notice="";scroll=Vector2.zero;}
                if(Draw.Button(new Rect(x+28+half,top,half,44),Lang.T("SAME WI-FI / LAN","TA SAMA SIEĆ WI-FI"),Draw.Pink,!internetMode)){internetMode=false;advanced=false;notice="";scroll=Vector2.zero;}
                top+=58;
            }
            var view=new Rect(x+20,top,width-40,Mathf.Max(34,modal.yMax-top-16));
            int rooms=0;
#if !UNITY_WEBGL
            if(discovery!=null)rooms=discovery.Rooms.Count;
#endif
            float contentHeight=active?570:joinTab?(internetMode?450:490+rooms*72):450;
            if(advanced)contentHeight+=330;
            scroll=Draw.ScrollView(view,scroll,new Rect(0,0,view.width-20,contentHeight));float w=view.width-22;
            if(active)RenderActive(w);else if(joinTab)RenderJoin(w);else RenderCreate(w);
            GUI.EndScrollView();
            if(Event.current.isMouse&&Event.current.type!=EventType.Repaint&&Event.current.type!=EventType.Layout)Event.current.Use();
            app.SetExternalModal(open);
        }
        void RenderCreate(float width)
        {
#if UNITY_WEBGL || UNITY_ANDROID
            Draw.Text(new Rect(0,0,width,40),Lang.T("CREATE ON A WINDOWS PC","GRĘ ZAKŁADA KOMPUTER Z WINDOWS"),18,Draw.Cyan,TextAnchor.UpperLeft,true);
            Draw.Text(new Rect(0,48,width,105),Lang.T("The Windows game hosts the match. Ask the host to create an Internet game and send its game code, or choose LAN on the same Wi-Fi.","Mecz prowadzi gra na Windows. Poproś gospodarza, żeby założył grę przez Internet i podał kod, albo wybierz sieć lokalną w tym samym Wi-Fi."),15,Theme.Text);
            if(Draw.Button(new Rect(0,167,width,44),Lang.T("JOIN GAME","DOŁĄCZ DO GRY"),Draw.Pink)){joinTab=true;scroll=Vector2.zero;}
            if(notice.Length>0)Draw.Text(new Rect(0,224,width,95),notice,13,Draw.Gold);
            RenderAdvanced(width,325);
#else
            Draw.Text(new Rect(0,0,width,44),internetMode?Lang.T("PLAY ACROSS THE INTERNET","GRA PRZEZ INTERNET"):Lang.T("PLAY ON THE SAME NETWORK","GRA W TEJ SAMEJ SIECI"),17,Theme.Text,TextAnchor.MiddleLeft,true);
            Draw.Text(new Rect(0,51,width,65),internetMode?Lang.T("You play as Player 1. Choose both decks in Match Setup, then share the game code with Player 2.","Grasz jako Gracz 1. Wybierz obie talie na ekranie głównym, potem podaj kod gry Graczowi 2."):Lang.T("Your game appears on the same Wi-Fi / LAN. Choose both decks in Match Setup; you play as Player 1.","Twoja gra pojawi się w tej samej sieci Wi-Fi / LAN. Wybierz obie talie na ekranie głównym; grasz jako Gracz 1."),13,Draw.Muted);
            Draw.Text(new Rect(0,125,width,25),Lang.T("ROOM NAME  ·  OPTIONAL","NAZWA GRY  ·  NIEOBOWIĄZKOWA"),11,Draw.Cyan,TextAnchor.MiddleLeft,true);
            roomName=Field(new Rect(0,156,width,44),roomName,LanDiscoveryProtocol.MaxNameLength);
            bool valid=LanDiscoveryProtocol.ValidName(string.IsNullOrWhiteSpace(roomName)?"My Core Clash Game":roomName.Trim());
            if(Draw.Button(new Rect(0,216,width,46),Lang.T("CREATE GAME","STWÓRZ GRĘ"),Draw.Cyan,false,app.IsSetup&&link.CanStart&&valid,15))CreateGame();
            Draw.Text(new Rect(0,276,width,105),notice.Length>0?notice:app.IsSetup?(internetMode?Lang.T("Internet play uses a private game code. Player 2 can join from Windows, Android or a browser.","Gra przez Internet używa prywatnego kodu. Gracz 2 może dołączyć z Windows, Androida albo przeglądarki."):Lang.T("Player 2 can join from Available Games or open your browser invitation.","Gracz 2 może dołączyć z listy dostępnych gier albo otworzyć twoje zaproszenie w przeglądarce.")):Lang.T("Return to Match Setup to create a new game.","Wróć na ekran główny, żeby założyć nową grę."),13,notice.Length>0?Draw.Gold:Draw.Muted);
            RenderAdvanced(width,388);
#endif
        }
        void RenderJoin(float width)
        {
            float y=0;
            if(internetMode){
                Draw.Text(new Rect(0,y,width,34),Lang.T("ENTER A GAME CODE","WPISZ KOD GRY"),18,Draw.Pink,TextAnchor.MiddleLeft,true);y+=45;
                Draw.Text(new Rect(0,y,width,67),Lang.T("Ask the Windows host for the six-character code, or paste its Internet invitation link.","Poproś gospodarza o sześcioznakowy kod albo wklej link z zaproszeniem."),14,Theme.Text);y+=78;
                invitation=Field(new Rect(0,y,width,44),invitation,2048);y+=58;
                bool valid=OnlineJoinAddress.TryParse(invitation,out _);
                if(Draw.Button(new Rect(0,y,width,46),Lang.T("JOIN GAME","DOŁĄCZ DO GRY"),Draw.Pink,false,app.IsSetup&&link.CanStart&&valid))JoinInternet();y+=60;
            }else{
#if UNITY_WEBGL
                Draw.Text(new Rect(0,y,width,34),Lang.T("JOIN WITH A LAN INVITATION","DOŁĄCZ Z ZAPROSZENIA"),17,Draw.Pink,TextAnchor.MiddleLeft,true);y+=45;
                Draw.Text(new Rect(0,y,width,78),Lang.T("Open the host’s LAN invitation on the same Wi-Fi. Browsers cannot search the local network.","Otwórz zaproszenie gospodarza w tym samym Wi-Fi. Przeglądarka nie potrafi przeszukać sieci lokalnej."),14,Theme.Text);y+=90;
#else
                Draw.Text(new Rect(0,y,width,34),Lang.T("AVAILABLE LAN GAMES","GRY W TWOJEJ SIECI"),17,Draw.Pink,TextAnchor.MiddleLeft,true);y+=45;
                List<LanRoom> rooms=discovery==null?new List<LanRoom>():discovery.Rooms;
                if(rooms.Count==0){Draw.Text(new Rect(0,y,width,72),discovery==null?Lang.T("Looking for games… Paste a LAN invitation below, or use Advanced.","Szukam gier… Wklej zaproszenie poniżej albo użyj opcji zaawansowanych."):Lang.T("Searching your local network…\nThe host should create a LAN game on the same Wi-Fi.","Przeszukuję sieć lokalną…\nGospodarz powinien założyć grę w tym samym Wi-Fi."),13,Draw.Muted);y+=84;}
                foreach(var room in rooms){
                    Draw.Surface(new Rect(0,y,width,64),Draw.PanelLight);
                    Draw.Text(new Rect(10,y+6,width-105,27),room.Name,15,Theme.Text,TextAnchor.MiddleLeft,true);
                    Draw.Text(new Rect(10,y+35,width-105,20),room.PlayerCount+" / 2 players",11,Draw.Muted);
                    if(Draw.Button(new Rect(width-88,y+10,80,44),room.PlayerCount<2?Lang.T("JOIN","DOŁĄCZ"):Lang.T("FULL","PEŁNA"),Draw.Pink,false,app.IsSetup&&link.CanStart&&room.PlayerCount<2))JoinGame(room.Host,room.Port);
                    y+=72;
                }
#endif
                Draw.Text(new Rect(0,y,width,25),Lang.T("PASTE A LAN INVITATION","WKLEJ ZAPROSZENIE"),11,Draw.Muted,TextAnchor.MiddleLeft,true);y+=32;
                invitation=Field(new Rect(0,y,width,44),invitation,2048);y+=57;
                bool valid=LanJoinAddress.TryParse(invitation,out var invitedHost,out var invitedPort);
                if(Draw.Button(new Rect(0,y,width,44),Lang.T("JOIN LAN GAME","DOŁĄCZ DO GRY W SIECI"),Draw.Pink,false,app.IsSetup&&link.CanStart&&valid))JoinGame(invitedHost,invitedPort);y+=57;
            }
            if(!app.IsSetup){Draw.Text(new Rect(0,y,width,42),Lang.T("Return to Match Setup to join a new game.","Wróć na ekran główny, żeby dołączyć do nowej gry."),12,Draw.Muted);y+=47;}
            if(notice.Length>0){Draw.Text(new Rect(0,y,width,95),notice,12,Draw.Gold);y+=102;}
            RenderAdvanced(width,y+10);
        }
        void RenderActive(float width)
        {
            bool hosting=link.Hosting,online=link.UsingInternet;
            bool listening=manager!=null&&manager.IsListening;
            Draw.Text(new Rect(0,0,width,61),hosting?(link.IsConnected?Lang.T("PLAYER 2 CONNECTED","GRACZ 2 POŁĄCZONY"):listening?Lang.T("WAITING FOR PLAYER 2","CZEKAM NA GRACZA 2"):Lang.T("PREPARING YOUR GAME…","PRZYGOTOWUJĘ GRĘ…")):(link.IsConnected?Lang.T("CONNECTED AS PLAYER 2","POŁĄCZONO JAKO GRACZ 2"):Lang.T("CONNECTING TO GAME…","ŁĄCZĘ Z GRĄ…")),19,hosting?Draw.Cyan:Draw.Pink,TextAnchor.MiddleLeft,true);
            Draw.Text(new Rect(0,70,width,70),online?link.Status:hosting?roomName+"  ·  "+link.LobbyPlayerCount+" / 2 players":link.Status,14,Theme.Text);
            float bottom=155;
            if(hosting&&listening){
                if(online){
                    string code=link.Internet?.Code??"";
                    Draw.Text(new Rect(0,149,width,28),Lang.T("INTERNET GAME CODE","KOD GRY"),11,Draw.Muted,TextAnchor.MiddleLeft,true);
                    Field(new Rect(0,183,width,48),code.Length>0?code:Lang.T("Preparing code…","Przygotowuję kod…"),16);
                    if(Draw.Button(new Rect(0,243,width,44),Time.unscaledTime<copiedUntil?Lang.T("COPIED","SKOPIOWANO"):Lang.T("COPY GAME CODE","KOPIUJ KOD GRY"),Draw.Cyan,false,code.Length>0)){GUIUtility.systemCopyBuffer=code;copiedUntil=Time.unscaledTime+2;}
                    string url=JoinUrl;
                    if(!string.IsNullOrEmpty(url)){
                        Field(new Rect(0,301,width,44),url,2048);
                        if(Draw.Button(new Rect(0,357,width,44),Lang.T("COPY INTERNET JOIN LINK","KOPIUJ LINK DO GRY"),Draw.Cyan)){GUIUtility.systemCopyBuffer=url;copiedUntil=Time.unscaledTime+2;}
                        bottom=422;
                    }else{
                        Draw.Text(new Rect(0,301,width,78),Lang.T("Player 2 chooses Internet and enters this code. A published browser game URL enables a shareable Internet link.","Gracz 2 wybiera Internet i wpisuje ten kod. Po podaniu adresu gry w przeglądarce można też wysłać link."),13,Draw.Muted);bottom=396;
                    }
                }else{
                    Draw.Text(new Rect(0,149,width,60),Lang.T("Player 2 can choose LAN in the app or open this browser invitation on the same Wi-Fi.","Gracz 2 może wybrać sieć lokalną w aplikacji albo otworzyć to zaproszenie w przeglądarce w tym samym Wi-Fi."),13,Draw.Muted);
                    if(!string.IsNullOrEmpty(joinUrl)){
                        Field(new Rect(0,224,width,44),joinUrl,2048);
                        if(Draw.Button(new Rect(0,280,width,44),Time.unscaledTime<copiedUntil?Lang.T("LINK COPIED","LINK SKOPIOWANY"):Lang.T("COPY LAN JOIN LINK","KOPIUJ LINK DO GRY W SIECI"),Draw.Cyan)){GUIUtility.systemCopyBuffer=joinUrl;copiedUntil=Time.unscaledTime+2;}
                    }
                    Draw.Text(new Rect(0,339,width,70),webStatus.Length>0?webStatus:Lang.T("Preparing the browser invitation…","Przygotowuję zaproszenie do przeglądarki…"),12,Draw.Muted);bottom=424;
                }
            }
            if(!listening||(!hosting&&!link.IsConnected)){
                if(Draw.Button(new Rect(0,bottom,width,44),Lang.T("CANCEL CONNECTING","ANULUJ ŁĄCZENIE"),Draw.Pink)){CancelConnection();}return;
            }
            if(Draw.Button(new Rect(0,bottom,width,44),link.IsConnected?Lang.T("RETURN TO MATCH","WRÓĆ DO MECZU"):Lang.T("KEEP WAITING","CZEKAJ DALEJ"),Draw.Cyan))open=false;
            if(Draw.Button(new Rect(0,bottom+58,width,44),Lang.T("DISCONNECT","ROZŁĄCZ"),Draw.Pink)){app.ReturnToSetup();open=true;joinTab=!hosting;notice="";}
        }
        void RenderAdvanced(float width,float y)
        {
            if(Draw.Button(new Rect(0,y,width,44),advanced?Lang.T("ADVANCED  ▴","ZAAWANSOWANE  ▴"):Lang.T("ADVANCED  ▾","ZAAWANSOWANE  ▾"),Draw.Muted,advanced,true,11))advanced=!advanced;
            if(!advanced)return;y+=57;
            Draw.Text(new Rect(0,y,width,29),Lang.T("DIRECT LAN CONNECTION","BEZPOŚREDNIE POŁĄCZENIE W SIECI"),12,Draw.Muted,TextAnchor.MiddleLeft,true);y+=36;
            float addressWidth=Mathf.Max(90,width-100);
            manualHost=Field(new Rect(0,y,addressWidth,44),manualHost,255);manualPort=Field(new Rect(addressWidth+10,y,90,44),manualPort,5);y+=51;
            Draw.Text(new Rect(0,y,width,25),Lang.T("Host IP address                 Gameplay port","Adres IP gospodarza          Port gry"),11,Draw.Muted);y+=34;
            bool valid=ushort.TryParse(manualPort,out var port)&&LanEndpoint.TryNormalize(manualHost,port,out _);
            if(Draw.Button(new Rect(0,y,width,44),Lang.T("CONNECT DIRECTLY","POŁĄCZ BEZPOŚREDNIO"),Draw.Pink,false,app.IsSetup&&link.CanStart&&valid))JoinGame(manualHost.Trim(),port);y+=59;
            if(internetMode&&!joinTab){
                Draw.Text(new Rect(0,y,width,44),Lang.T("PUBLISHED BROWSER GAME URL · OPTIONAL","ADRES GRY W PRZEGLĄDARCE · NIEOBOWIĄZKOWY"),11,Draw.Muted,TextAnchor.MiddleLeft,true);y+=48;
                internetBrowserUrl=Field(new Rect(0,y,width,44),internetBrowserUrl,2048);
            }
        }
        string Field(Rect rect,string text,int maxLength)
        {
            if(fieldStyle==null){fieldStyle=new GUIStyle(GUI.skin.textField){fontSize=15,padding=new RectOffset(10,10,10,8)};fieldStyle.normal.textColor=Theme.Text;fieldStyle.focused.textColor=Theme.Text;}
            Draw.Surface(rect,Draw.Background,Draw.Edge);return Draw.TextField(Draw.Inset(rect,2),text,maxLength,fieldStyle);
        }
        void CreateGame()
        {
            roomName=string.IsNullOrWhiteSpace(roomName)?"My Core Clash Game":roomName.Trim();notice="";
            bool started=internetMode?link.Internet!=null&&link.Internet.Create(roomName):link.Host("127.0.0.1",DefaultGamePort);
            if(started){open=true;scroll=Vector2.zero;}else notice=Lang.T("The game could not be created. Return to Match Setup and try again.","Nie udało się założyć gry. Wróć na ekran główny i spróbuj ponownie.");
        }
        void JoinInternet(){if(link.Internet!=null&&link.Internet.Join(invitation)){open=true;joinTab=true;scroll=Vector2.zero;notice="";}else notice=Lang.T("The Internet connection could not start. Check the code and try again.","Nie udało się połączyć przez Internet. Sprawdź kod i spróbuj ponownie.");}
        void JoinGame(string host,ushort port){internetMode=false;if(link.Join(host,port)){open=true;joinTab=true;scroll=Vector2.zero;notice="";}else notice=Lang.T("The LAN connection could not start. Please try again.","Nie udało się połączyć w sieci lokalnej. Spróbuj ponownie.");}
        void CancelConnection(){link.Disconnect();app.ReturnToSetup();open=true;joinTab=true;notice=Lang.T("Connection canceled. Choose a game or close this panel to play locally.","Połączenie anulowane. Wybierz grę albo zamknij to okno, żeby grać lokalnie.");Debug.Log("CC_LAN_JOIN_CANCELED setup="+app.IsSetup);}
    }
}
