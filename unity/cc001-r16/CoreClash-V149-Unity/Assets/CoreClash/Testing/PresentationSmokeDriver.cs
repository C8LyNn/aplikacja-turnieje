using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using CoreClash.Core;
using CoreClash.Input;
using CoreClash.Presentation;
using UnityEngine;
using UnityEngine.Rendering;

namespace CoreClash.Testing
{
    // Explicit, opt-in release-player automation. Never runs during ordinary play or NGO smoke runs.
    public sealed class PresentationSmokeDriver : MonoBehaviour
    {
        const string DeckA = "featured_gravity_trap", DeckB = "featured_status_reactor";
        const float StepSeconds = 1f / 120;
        enum Stage { Setup, StartMatch, Aim, Release, Settle, Details, DeveloperDetails, CompleteMatch, Finish }
        CoreClashApp app;
        Stage stage;
        bool running, finishing;
        string outputDirectory, capturePath, pendingException;
        string capturePrefix="r2-native";
        int stageFrame, captureFrame, lastEventId, nextA, nextB;
        int repaintFrames, lastRepaintFrame = -1;
        bool captureRequested;
        float deadline, startedRealtime;
        readonly RuntimeEvidence evidence = new RuntimeEvidence();
        readonly List<CaptureEvidence> captures = new List<CaptureEvidence>();
        readonly HashSet<string> deployedA = new HashSet<string>(), deployedB = new HashSet<string>();

        void Start()
        {
            string[] args = Environment.GetCommandLineArgs();
            if (!args.Contains("--cc-presentation-smoke")) return;
            running = true;
            startedRealtime = Time.realtimeSinceStartup;
            deadline = startedRealtime + 115;
            Application.logMessageReceived += OnLog;
            try
            {
                int outputIndex = Array.IndexOf(args, "--cc-output");
                if (outputIndex < 0 || outputIndex + 1 >= args.Length || !Path.IsPathRooted(args[outputIndex + 1]))
                    throw new InvalidOperationException("--cc-output must name an absolute evidence directory.");
                outputDirectory = Path.GetFullPath(args[outputIndex + 1]);
                int prefixIndex=Array.IndexOf(args,"--cc-presentation-prefix");
                if(prefixIndex>=0&&prefixIndex+1<args.Length&&(args[prefixIndex+1]=="r3-native"||args[prefixIndex+1]=="r4-native"||args[prefixIndex+1]=="r5-native"||args[prefixIndex+1]=="r6-native"))capturePrefix=args[prefixIndex+1];
                Directory.CreateDirectory(outputDirectory);
                evidence.startedUtc = DateTime.UtcNow.ToString("o");
                evidence.unityVersion = Application.unityVersion;
                evidence.platform = Application.platform.ToString();
                evidence.graphicsDevice = SystemInfo.graphicsDeviceName;
                evidence.graphicsApi = SystemInfo.graphicsDeviceType.ToString();
                evidence.developmentBuild = Debug.isDebugBuild;
                evidence.batchMode = Application.isBatchMode;
                evidence.automation = true;
                evidence.inputMethod = "Automated app presentation API and PointerSample gesture; no manual OS input testing.";
                evidence.matchMethod = "Same live app.Simulation; first launch through PresentationPointer, later legal TryCommand spawns and bounded fixed-step acceleration.";
                evidence.deckA = DeckA; evidence.deckB = DeckB;
                if (Application.platform != RuntimePlatform.WindowsPlayer)
                    throw new InvalidOperationException("This smoke requires the actual Windows player.");
                if (Debug.isDebugBuild)
                    throw new InvalidOperationException("A release player is required so captures have no Development Build watermark.");
                if (SystemInfo.graphicsDeviceType == GraphicsDeviceType.Null)
                    throw new InvalidOperationException("A real graphics device is required; do not pass -nographics.");
                app = GetComponent<CoreClashApp>();
                if (app == null || app.Catalog == null || app.Simulation == null)
                    throw new InvalidOperationException("CoreClashApp/catalog/simulation failed to bootstrap on the smoke GameObject.");
                if (!app.IsSetup) throw new InvalidOperationException("The release app did not open on deck selection.");
                evidence.defaultDeveloperOverlay = app.DeveloperOverlay;
                if (evidence.defaultDeveloperOverlay) throw new InvalidOperationException("Developer overlay must default off.");
                app.SetDeveloperOverlay(false);
                app.SelectDeck(0, DeckA); app.SelectDeck(1, DeckB);
                if (app.Catalog.Deck(DeckA) == null || app.Catalog.Deck(DeckB) == null)
                    throw new InvalidOperationException("Required featured decks are missing.");
                evidence.catalogRecords = app.Catalog.Data.balls.Length;
                evidence.canonicalDecks = app.Catalog.Data.decks.Length;
                evidence.featuredDecks = app.Catalog.Featured.Length;
                evidence.screenWidth = Screen.width; evidence.screenHeight = Screen.height;
                SetStage(Stage.Setup);
                Debug.Log("CC_R2_SMOKE_BOOTSTRAP release=true graphics=" + evidence.graphicsApi + " size=" + Screen.width + "x" + Screen.height);
            }
            catch (Exception exception) { Fail(exception.ToString()); }
        }

        void OnDestroy() { Application.logMessageReceived -= OnLog; }
        void OnGUI()
        {
            if (!running || finishing || !SplashScreen.isFinished || Event.current.type != EventType.Repaint || lastRepaintFrame == Time.frameCount) return;
            lastRepaintFrame = Time.frameCount;
            repaintFrames++;
        }
        void OnLog(string message, string stackTrace, LogType type)
        {
            if (running && !finishing && type == LogType.Exception) pendingException = message + "\n" + stackTrace;
        }
        void SetStage(Stage next) { stage = next; stageFrame = Time.frameCount; }

        void Update()
        {
            if (!running || finishing) return;
            try
            {
                if (pendingException != null) throw new InvalidOperationException("Player exception: " + pendingException);
                if (Time.realtimeSinceStartup > deadline) throw new TimeoutException("Native presentation smoke exceeded 115 seconds in " + stage + ".");
                if (!evidence.renderReady)
                {
                    if (!SplashScreen.isFinished) return;
                    if (!evidence.splashScreenFinished)
                    {
                        evidence.splashScreenFinished = true;
                        evidence.splashFinishedAfterSeconds = Time.realtimeSinceStartup - startedRealtime;
                    }
                    // The player can run thousands of Updates behind its startup splash before
                    // there is a presentation backbuffer. Require real time and actual GUI paints.
                    if (Time.realtimeSinceStartup - startedRealtime < 3 || repaintFrames < 3) return;
                    evidence.renderReady = true;
                    evidence.readyRepaintFrames = repaintFrames;
                    Debug.Log("CC_R2_RENDER_READY splashFinished=true elapsed=" + (Time.realtimeSinceStartup - startedRealtime) + " repaintFrames=" + repaintFrames);
                }
                ObserveState();
                // CaptureScreenshot schedules the player render. Poll on later Updates instead of
                // WaitForEndOfFrame, which can stall indefinitely in Unity batch mode.
                if (captureRequested)
                {
                    if (Time.frameCount < captureFrame + 3 || !File.Exists(capturePath) || new FileInfo(capturePath).Length < 1024) return;
                    var last = captures[captures.Count - 1];
                    last.bytes = new FileInfo(capturePath).Length;
                    ValidateCapture(last, File.ReadAllBytes(capturePath));
                    captureRequested = false;
                    Debug.Log("CC_R2_CAPTURE_PASS " + last.file + " bytes=" + last.bytes + " colors=" + last.distinctSampleColors + " sha256=" + last.sha256);
                    SetStage(stage);
                    return;
                }
                if (Time.frameCount < stageFrame + 3) return;
                switch (stage)
                {
                    case Stage.Setup:
                        Capture("r2-native-01-deck-selection.png", "Deck selection", Stage.StartMatch);
                        break;
                    case Stage.StartMatch:
                        app.StartLocalMatch();
                        Require(!app.IsSetup && app.Simulation.State.players[0].deckId == DeckA && app.Simulation.State.players[1].deckId == DeckB,
                            "The selected decks were not applied to the local match.");
                        app.SelectBall("gatekeeper");
                        SetStage(Stage.Aim);
                        break;
                    case Stage.Aim:
                        Require(app.Simulation.State.actionSerial == 0, "A launch occurred before the automated gesture.");
                        app.PresentationPointer(new PointerSample { id = 149, position = ScreenPoint(270, 853), down = true, held = true });
                        app.PresentationPointer(new PointerSample { id = 149, position = ScreenPoint(capturePrefix!="r2-native"?480:350, capturePrefix!="r2-native"?830:680), held = true });
                        evidence.pointerGestureStarted = true;
                        evidence.aimCapturedBeforeRelease = true;
                        Capture("r2-native-02-aim.png", "Gatekeeper aim before pointer release", Stage.Release);
                        break;
                    case Stage.Release:
                        Require(app.Simulation.State.actionSerial == 0, "The aim capture was not made before launch.");
                        app.PresentationPointer(new PointerSample { id = 149, position = ScreenPoint(capturePrefix!="r2-native"?480:350, capturePrefix!="r2-native"?830:680), up = true });
                        Require(app.Simulation.State.actionSerial == 1 && app.Simulation.State.balls.Any(b => b.owner == 0 && b.type == "gatekeeper"),
                            "The presentation pointer gesture did not launch Gatekeeper.");
                        evidence.pointerLaunchAccepted = true; evidence.launches = 1; deployedA.Add("gatekeeper");
                        SetStage(Stage.Settle);
                        break;
                    case Stage.Settle:
                        AdvanceSimulation(600, false);
                        if (app.Simulation.State.phase == MatchPhase.Moving) break;
                        evidence.portalPairsRendered = app.Simulation.State.zones.Count(z => !z.dead && z.kind == "portal") / 2;
                        Require(evidence.portalPairsRendered > 0, "The real Gatekeeper launch did not create a live portal pair.");
                        Capture("r2-native-03-gameplay.png", "Live match after Gatekeeper created portals", Stage.Details);
                        break;
                    case Stage.Details:
                        app.SetDeveloperOverlay(false);
                        if(capturePrefix=="r4-native"||capturePrefix=="r5-native"||capturePrefix=="r6-native"){
                            var keeper=app.Simulation.State.balls.First(b=>b.type=="gatekeeper"&&!b.dead);
                            int actions=app.Simulation.State.actionSerial;
                            app.SetBoardInspection(true);
                            app.PresentationPointer(new PointerSample{id=150,position=ScreenPoint(keeper.x,keeper.y),down=true});
                            Require(app.IsModalOpen&&!app.IsBoardInspection&&app.Simulation.State.actionSerial==actions,"Read-only instance inspection failed during P2's turn.");
                        }else app.ShowBallDetails("gatekeeper");
                        Capture("r2-native-04-ball-details.png", "Player ball details with developer overlay off", Stage.DeveloperDetails);
                        break;
                    case Stage.DeveloperDetails:
                        app.SetDeveloperOverlay(true);
                        Capture("r2-native-05-developer-details.png", "Optional developer details overlay", Stage.CompleteMatch);
                        break;
                    case Stage.CompleteMatch:
                        app.SetDeveloperOverlay(false); app.CloseBallDetails();
                        AdvanceSimulation(900, true);
                        if (app.Simulation.State.phase != MatchPhase.Over) break;
                        Require(evidence.launches > 2 && app.Simulation.State.turnNumber <= 50, "The full local match did not complete within the game rules.");
                        evidence.fullLocalMatchCompleted = true;
                        Capture("r2-native-06-match-result.png", "Completed actual local match", Stage.Finish);
                        break;
                    case Stage.Finish:
                        Require(captures.Count == 6 && captures.All(c => c.imageContentValidated), "A required player-rendered capture has no valid visual content.");
                        evidence.distinctCriticalCaptures = captures.Take(4).Select(c => c.sha256).Distinct().Count();
                        Require(evidence.distinctCriticalCaptures == 4, "Deck selection, aim, gameplay, and details must have different rendered images.");
                        evidence.captureImagesValidated = true;
                        Require(!app.DeveloperOverlay, "Developer overlay was left enabled.");
                        evidence.passed = true;
                        WriteEvidence("");
                        finishing = true;
                        Debug.Log("CC_R2_SMOKE_PASS launches=" + evidence.launches + " turns=" + evidence.turns + " winner=" + evidence.winner +
                            " bases=" + evidence.baseHp[0] + "," + evidence.baseHp[1] + " result=" + evidence.resultReason);
                        Application.Quit(0);
                        break;
                }
            }
            catch (Exception exception) { Fail(exception.ToString()); }
        }

        Vector2 ScreenPoint(float worldX, float worldY)
        {
            Rect arena = app.ArenaRect;
            Require(arena.width > 0 && arena.height > 0, "The presentation arena has no layout.");
            float scale = arena.width / 540;
            return new Vector2(arena.x + worldX * scale, Screen.height - (arena.y + worldY * scale));
        }

        void Capture(string filename, string description, Stage next)
        {
            filename=filename.Replace("r2-native",capturePrefix);
            Require(evidence.renderReady && SplashScreen.isFinished, "A capture was requested before the native presentation render was ready.");
            capturePath = Path.Combine(outputDirectory, filename);
            if (File.Exists(capturePath)) File.Delete(capturePath);
            var state = app.Simulation.State;
            captures.Add(new CaptureEvidence {
                file = filename, description = description, width = Screen.width, height = Screen.height,
                frame = Time.frameCount, phase = state.phase.ToString(), turn = state.turnNumber, actionSerial = state.actionSerial,
                developerOverlay = app.DeveloperOverlay, liveBalls = state.balls.Count(b => !b.dead && !b.banished),
                livePortals = state.zones.Count(z => !z.dead && z.kind == "portal"),
                afterStartupSeconds = Time.realtimeSinceStartup - startedRealtime, repaintFrames = repaintFrames
            });
            if (captures.Count == 1) evidence.firstCaptureAfterSeconds = Time.realtimeSinceStartup - startedRealtime;
            SetStage(next); captureFrame = Time.frameCount; captureRequested = true;
            ScreenCapture.CaptureScreenshot(capturePath);
            Debug.Log("CC_R2_CAPTURE_REQUEST " + filename);
        }

        void ValidateCapture(CaptureEvidence capture, byte[] png)
        {
            var texture = new Texture2D(2, 2, TextureFormat.RGBA32, false);
            try
            {
                Require(texture.LoadImage(png, false), "The captured PNG could not be decoded: " + capture.file);
                Require(texture.width == capture.width && texture.height == capture.height, "The captured PNG dimensions differ from the player render.");
                Color32[] pixels = texture.GetPixels32();
                int stride = Math.Max(1, Math.Min(texture.width, texture.height) / 100);
                var colors = new HashSet<int>();
                int minimum = 255, maximum = 0, bright = 0, samples = 0;
                for (int y = 0; y < texture.height; y += stride)
                    for (int x = 0; x < texture.width; x += stride)
                    {
                        Color32 pixel = pixels[y * texture.width + x];
                        int component = Math.Max(pixel.r, Math.Max(pixel.g, pixel.b));
                        colors.Add((pixel.r << 16) | (pixel.g << 8) | pixel.b);
                        minimum = Math.Min(minimum, component); maximum = Math.Max(maximum, component);
                        if (component > 32) bright++;
                        samples++;
                    }
                capture.distinctSampleColors = colors.Count; capture.sampleCount = samples;
                capture.minimumSampleBrightness = minimum; capture.maximumSampleBrightness = maximum;
                capture.brightSampleFraction = (float)bright / samples;
                using (var sha = SHA256.Create()) capture.sha256 = BitConverter.ToString(sha.ComputeHash(png)).Replace("-", "");
                Require(colors.Count >= 16 && maximum - minimum >= 24 && capture.brightSampleFraction >= .01f,
                    "Captured frame is black or visually flat: " + capture.file + " colors=" + colors.Count + " brightness=" + minimum + ".." + maximum + " brightFraction=" + capture.brightSampleFraction);
                capture.imageContentValidated = true;
            }
            finally { Destroy(texture); }
        }

        void AdvanceSimulation(int maximumSteps, bool submitCommands)
        {
            for (int i = 0; i < maximumSteps && app.Simulation.State.phase != MatchPhase.Over; i++)
            {
                var simulation = app.Simulation;
                var state = simulation.State;
                if (state.phase == MatchPhase.Aiming)
                {
                    if (!submitCommands) return;
                    Require(evidence.launches < 96, "Legal-command match exceeded its launch budget.");
                    int owner = state.turn;
                    var deck = app.Catalog.Deck(owner == 0 ? DeckA : DeckB);
                    int next = owner == 0 ? nextA : nextB;
                    string type = "normal";
                    for (int n = 0; n < deck.balls.Length; n++)
                    {
                        int candidate = (next + n) % deck.balls.Length;
                        if (simulation.Stock(owner, deck.balls[candidate]) <= 0) continue;
                        type = deck.balls[candidate]; next = (candidate + 1) % deck.balls.Length; break;
                    }
                    if (owner == 0) nextA = next; else nextB = next;
                    float targetX = 170 + evidence.launches * 73 % 200, targetY = owner == 0 ? 190 : 710;
                    var command = new PlayerCommand {
                        owner = owner, turnNumber = state.turnNumber, sequence = evidence.launches + 1,
                        kind = CommandKind.Spawn, ballType = type, dx = targetX - 270, dy = targetY - (owner == 0 ? 853 : 47), power = 520
                    };
                    Require(simulation.TryCommand(command, out string reason), "Legal match command rejected: " + reason);
                    (owner == 0 ? deployedA : deployedB).Add(type);
                    evidence.launches++;
                    Debug.Log("CC_R2_MATCH_LAUNCH owner=" + owner + " turn=" + state.turnNumber + " type=" + type + " action=" + state.actionSerial);
                }
                simulation.Step(StepSeconds); evidence.acceleratedSteps++;
                ObserveState();
                if (i % 60 == 0) ValidatePhysics();
            }
            ValidatePhysics();
        }

        void ObserveState()
        {
            if (app == null || app.Simulation == null) return;
            foreach (var item in app.Simulation.State.events)
            {
                if (item.id <= lastEventId) continue;
                if (item.kind == "MOTION_GUARD") evidence.motionGuards++;
                if (item.kind == "BASE_DAMAGE") evidence.baseDamageEvents++;
                lastEventId = Math.Max(lastEventId, item.id);
            }
        }
        void ValidatePhysics()
        {
            foreach (var ball in app.Simulation.State.balls)
                Require(GameSimulation.Finite(ball.x) && GameSimulation.Finite(ball.y) && GameSimulation.Finite(ball.vx) && GameSimulation.Finite(ball.vy),
                    "The live match produced non-finite physics for ball " + ball.id + ".");
        }
        static void Require(bool condition, string message) { if (!condition) throw new InvalidOperationException(message); }
        void WriteEvidence(string error)
        {
            evidence.error = error; evidence.finishedUtc = DateTime.UtcNow.ToString("o");
            evidence.captures = captures.ToArray();
            evidence.deployedA = deployedA.OrderBy(x => x).ToArray(); evidence.deployedB = deployedB.OrderBy(x => x).ToArray();
            if (app != null && app.Simulation != null)
            {
                var state = app.Simulation.State;
                evidence.phase = state.phase.ToString(); evidence.turns = state.turnNumber; evidence.winner = state.winner;
                evidence.resultReason = state.resultReason; evidence.baseHp = state.players.Select(p => p.hp).ToArray();
                evidence.actionSerial = state.actionSerial; evidence.simulationFrames = state.frame; evidence.simulationSeconds = state.time;
            }
            if (!string.IsNullOrEmpty(outputDirectory))
                File.WriteAllText(Path.Combine(outputDirectory, capturePrefix+"-runtime.json"), JsonUtility.ToJson(evidence, true));
        }
        void Fail(string message)
        {
            if (finishing) return;
            finishing = true; evidence.passed = false;
            try { WriteEvidence(message); } catch (Exception error) { Debug.LogError("CC_R2_EVIDENCE_WRITE_FAIL " + error.Message); }
            Debug.LogError("CC_R2_SMOKE_FAIL " + message);
            Application.Quit(1);
        }

        [Serializable] sealed class CaptureEvidence
        {
            public string file, description, phase, sha256;
            public int width, height, frame, turn, actionSerial, liveBalls, livePortals, repaintFrames, distinctSampleColors, sampleCount, minimumSampleBrightness, maximumSampleBrightness;
            public bool developerOverlay, imageContentValidated;
            public float afterStartupSeconds, brightSampleFraction;
            public long bytes;
        }
        [Serializable] sealed class RuntimeEvidence
        {
            public bool passed, automation, developmentBuild, batchMode, defaultDeveloperOverlay, pointerGestureStarted, aimCapturedBeforeRelease, pointerLaunchAccepted, fullLocalMatchCompleted, splashScreenFinished, renderReady, captureImagesValidated;
            public string startedUtc, finishedUtc, unityVersion, platform, graphicsDevice, graphicsApi, inputMethod, matchMethod, deckA, deckB, phase, resultReason, error;
            public int screenWidth, screenHeight, catalogRecords, canonicalDecks, featuredDecks, launches, turns, winner = -2, acceleratedSteps, simulationFrames, actionSerial, motionGuards, baseDamageEvents, portalPairsRendered, readyRepaintFrames, distinctCriticalCaptures;
            public float simulationSeconds, splashFinishedAfterSeconds, firstCaptureAfterSeconds;
            public int[] baseHp;
            public string[] deployedA, deployedB;
            public CaptureEvidence[] captures;
        }
    }
}
