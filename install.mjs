import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const V90_HTML_SHA = "19b2577719dea0551827c37e53299a8d03002e50a3b6c00b2f919d64e51dbbff";
const V91_HTML_SHA = "4fb05e732da5123710884b14a29468efc81c451ba1e67177527942df6479835d";
const V92_HTML_SHA = "d34f020855597b662631d860c26b19f510deb72427036224a8a3d93068212596";
const V90_ROUTE_SHA = "678c030db80c1c09298a6754bb803e55682c39fd86abfd8d93e932c093d35ff6";
const V91_ROUTE_SHA = "6a9bdc8fb39a757881fc4b5694fd9313d92425bac50585ae53cb038c5a4f5f97";
const V92_ROUTE_SHA = "6913e310301eae7e5a83c18c4bf9a42e89f2041504d646e433c7f97eeca3cf0b";
const explicit = process.argv[2] ? path.resolve(process.argv[2]) : null;
const cwd = process.cwd();
const packageRoot = path.dirname(fileURLToPath(import.meta.url));

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function findRepoRoot() {
  const starts = [explicit, cwd].filter(Boolean);
  const candidates = [];
  for (const start of starts) {
    candidates.push(start, path.resolve(start, ".."), path.resolve(start, "..", ".."), path.resolve(start, "..", "..", ".."));
  }
  for (const candidate of [...new Set(candidates)]) {
    if (
      fs.existsSync(path.join(candidate, "artifacts", "tournament-manager", "src", "App.tsx")) &&
      fs.existsSync(path.join(candidate, "artifacts", "api-server", "src", "app.ts"))
    ) return candidate;
  }
  throw new Error("Nie znaleziono root repo z artifacts/tournament-manager i artifacts/api-server.");
}

function backupIfExists(file, backupDir, backupName) {
  if (fs.existsSync(file)) fs.copyFileSync(file, path.join(backupDir, backupName));
}

const repo = findRepoRoot();
const tm = path.join(repo, "artifacts", "tournament-manager");
const api = path.join(repo, "artifacts", "api-server");
const files = {
  html: path.join(tm, "public", "prototypes", "minigames", "core-clash", "index.html"),
  apiIndex: path.join(api, "src", "routes", "index.ts"),
  apiApp: path.join(api, "src", "app.ts"),
  apiRoute: path.join(api, "src", "routes", "core-clash-multiplayer.ts"),
  apiTest: path.join(api, "test", "core-clash-multiplayer.test.ts"),
};

for (const [name, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) throw new Error(`Brak wymaganego pliku ${name}: ${file}`);
}

const htmlHash = sha256(files.html);
if (![V90_HTML_SHA, V91_HTML_SHA, V92_HTML_SHA].includes(htmlHash)) {
  throw new Error(`Core Clash HTML ma nieoczekiwany hash (${htmlHash}). Pack 02 oczekuje v90 Online Pack 01, v91 preview albo już v92.`);
}

const routeHash = sha256(files.apiRoute);
if (![V90_ROUTE_SHA, V91_ROUTE_SHA, V92_ROUTE_SHA].includes(routeHash)) {
  throw new Error(`Router multiplayer ma nieoczekiwany hash (${routeHash}). Instalacja zatrzymana, aby nie nadpisać ręcznych zmian.`);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(tm, `.core-clash-delayed-replay-pvp-pack-02-backup-${stamp}`);
fs.mkdirSync(backup, { recursive: true });
backupIfExists(files.html, backup, "core-clash-index.html");
backupIfExists(files.apiIndex, backup, "api-routes-index.ts");
backupIfExists(files.apiApp, backup, "api-app.ts");
backupIfExists(files.apiRoute, backup, "core-clash-multiplayer.ts");
backupIfExists(files.apiTest, backup, "core-clash-multiplayer.test.ts");
fs.writeFileSync(path.join(backup, "repo-root.txt"), repo, "utf8");

fs.copyFileSync(path.join(packageRoot, "payload", "core-clash-index.html"), files.html);
fs.copyFileSync(path.join(packageRoot, "payload", "core-clash-multiplayer.ts"), files.apiRoute);
fs.copyFileSync(path.join(packageRoot, "payload", "core-clash-multiplayer.test.ts"), files.apiTest);

const apiIndex = fs.readFileSync(files.apiIndex, "utf8");
const routeImport = 'import coreClashMultiplayerRouter from "./core-clash-multiplayer";';
const routeUse = "router.use(coreClashMultiplayerRouter);";
if (!apiIndex.includes(routeImport) || !apiIndex.includes(routeUse)) {
  throw new Error("Router Core Clash nie jest zamontowany w API. Najpierw zainstaluj Online PvP Pack 01.");
}

let apiApp = fs.readFileSync(files.apiApp, "utf8");
if (apiApp.includes('app.use(express.json({ limit: "2mb" }));')) {
  apiApp = apiApp.replace('app.use(express.json({ limit: "2mb" }));', 'app.use(express.json({ limit: "4mb" }));');
} else if (apiApp.includes("app.use(express.json());")) {
  apiApp = apiApp.replace("app.use(express.json());", 'app.use(express.json({ limit: "4mb" }));');
} else if (!apiApp.includes('app.use(express.json({ limit: "4mb" }));')) {
  throw new Error("Nie znaleziono oczekiwanej konfiguracji express.json().");
}
fs.writeFileSync(files.apiApp, apiApp, "utf8");

const html = fs.readFileSync(files.html, "utf8");
const route = fs.readFileSync(files.apiRoute, "utf8");
const app = fs.readFileSync(files.apiApp, "utf8");
const checks = [
  ["Core Clash v92 HTML", sha256(files.html) === V92_HTML_SHA],
  ["bufor replay 2 s", html.includes("ONLINE_REPLAY_BUFFER_MS=2000")],
  ["klatki replay 30 Hz", html.includes("ONLINE_REPLAY_FRAME_MS=1000/30")],
  ["odwrócona perspektywa gracza 2", html.includes("isOnlinePerspectiveFlipped") && html.includes("ctx.rotate(Math.PI)")],
  ["input odwrócony z widokiem", html.includes("x=W-x") && html.includes("y=H-y")],
  ["lokalny HUD gracza 2", html.includes("flippedHud") && html.includes("applyOnlineHudNames")],
  ["panel po meczu", html.includes('id="onlineRematch"') && html.includes('id="onlineChangeDeck"') && html.includes('id="onlineExitMatch"')],
  ["API replay", route.includes("replay-chunk") && route.includes('/core-clash/rooms/:roomId/replay')],
  ["API rewanż", route.includes('/core-clash/rooms/:roomId/rematch')],
  ["API zmiana talii", route.includes('/core-clash/rooms/:roomId/change-deck')],
  ["zamiana stron między rundami", route.includes("swapRoomSides")],
  ["limit jednego hostowanego serwera", route.includes("BROWSER_ROOM_LIMIT") && route.includes("ownerBrowserId")],
  ["Quick Match stale timeout", route.includes("MATCHMAKING_STALE_MS = 8_000")],
  ["JSON limit 4 MB", app.includes('app.use(express.json({ limit: "4mb" }));')],
];
let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) failed = true;
}
if (failed) throw new Error("Pack 02 nie przeszedł weryfikacji instalacji.");

console.log("");
console.log("OK: Core Clash Delayed Replay PvP Pack 02 został nałożony.");
console.log("Dodano wierny replay z buforem 2 s, perspektywę gracza 2, rewanż/zmianę talii/wyjście w tym samym serwerze, swap stron i limit jednego hostowanego serwera na przeglądarkę.");
console.log(`Backup: ${backup}`);
