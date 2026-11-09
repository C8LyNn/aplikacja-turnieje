import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BACKUP = path.join(ROOT, ".tournament-exp-pack-02-typecheck-hotfix-v2-backup");

const P = {
  routing: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-routing.ts",
  create: "artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.tsx",
  audience: "artifacts/tournament-manager/src/pages/tournament-audience.tsx",
  detail: "artifacts/tournament-manager/src/pages/tournament-detail.tsx",
  overview: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-overview.tsx",
};

function file(rel) { return path.join(ROOT, rel); }
function norm(s) { return s.replace(/\r\n/g, "\n"); }
function read(rel) {
  if (!fs.existsSync(file(rel))) throw new Error(`Brak pliku: ${rel}`);
  return fs.readFileSync(file(rel), "utf8");
}
function write(rel, original, normalized) {
  const crlf = original.includes("\r\n");
  fs.writeFileSync(file(rel), crlf ? normalized.replace(/\n/g, "\r\n") : normalized, "utf8");
}
function backupAll() {
  if (fs.existsSync(BACKUP)) fs.rmSync(BACKUP, { recursive: true, force: true });
  for (const rel of Object.values(P)) {
    const dst = path.join(BACKUP, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(file(rel), dst);
  }
}
function restoreAll() {
  if (!fs.existsSync(BACKUP)) return;
  for (const rel of Object.values(P)) {
    const src = path.join(BACKUP, rel);
    if (fs.existsSync(src)) fs.copyFileSync(src, file(rel));
  }
}
function patch(rel, fn) {
  const original = read(rel);
  const before = norm(original);
  const after = fn(before);
  write(rel, original, after);
}
function requireChanged(before, after, label) {
  if (before === after) throw new Error(`Hotfix nie zmienił sekcji: ${label}`);
  return after;
}

try {
  backupAll();

  patch(P.routing, (s) => {
    if (s.includes("const rawId = (params as Record<string, string | undefined> | null | undefined)?.id;")) return s;
    const after = s.replace(
      /const rawId = params\?\.id;/,
      'const rawId = (params as Record<string, string | undefined> | null | undefined)?.id;',
    );
    return requireChanged(s, after, "routing/rawId");
  });

  patch(P.create, (s) => {
    if (!s.includes("formatInfo.label")) return s;
    const after = s.replace(/\{formatInfo\.label\}/g, "{FORMAT_INFO[format].label}");
    return requireChanged(s, after, "create/formatInfo");
  });

  patch(P.audience, (s) => {
    let out = s;

    // Remove any leftover Stable route parameter hook if the Pack already inserted useTournamentRoute.
    if (out.includes('useTournamentRoute("audience")')) {
      out = out.replace(
        /^\s*const \[, params\] = useRoute\("\/tournaments\/:id\/audience"\);\s*\n/m,
        "",
      );
      out = out.replace(
        /^\s*const id = params\?\.id \? parseInt\(params\.id, 10\) : 0;\s*\n/m,
        "",
      );
    }

    if (!out.includes('const { id, isExperimental } = useTournamentRoute("audience");')) {
      throw new Error("Audience nie zawiera oczekiwanego useTournamentRoute.");
    }
    if (/\bparams\?\.id\b/.test(out)) {
      throw new Error("Audience nadal zawiera params?.id po patchu.");
    }
    return out;
  });

  patch(P.detail, (s) => {
    if (s.includes("const statsQuery = useGetTournamentStats(")) return s;

    const re = /const \{ data: stats \} = useGetTournamentStats\(id, \{\s*query: \{ enabled: !!id && readOk, queryKey: getGetTournamentStatsQueryKey\(id\) \},\s*\}\);/m;
    const replacement = `const statsQuery = useGetTournamentStats(id, {
    query: { enabled: !!id && readOk, queryKey: getGetTournamentStatsQueryKey(id) },
  });
  const { data: stats } = statsQuery;`;
    const after = s.replace(re, replacement);
    return requireChanged(s, after, "detail/statsQuery");
  });

  patch(P.overview, (s) => {
    let out = s;

    // API allows id to be undefined in topPlayers; the view can safely render with a fallback React key.
    out = out.replace(
      /type OverviewPlayer = \{\s*id: number;/m,
      `type OverviewPlayer = {
  id?: number;`,
    );

    out = out.replace(
      /key=\{player\.id\}/g,
      'key={player.id ?? `${player.name}-${index}`}',
    );

    if (!/id\?: number;/.test(out)) {
      throw new Error("OverviewPlayer.id nie został ustawiony jako opcjonalny.");
    }
    return out;
  });

  // Post-patch assertions against the actual installed files.
  const routing = norm(read(P.routing));
  const create = norm(read(P.create));
  const audience = norm(read(P.audience));
  const detail = norm(read(P.detail));
  const overview = norm(read(P.overview));

  const checks = [
    ["routing cast", routing.includes("Record<string, string | undefined>")],
    ["create FORMAT_INFO", !create.includes("formatInfo.label")],
    ["audience one route id", (audience.match(/const \{ id, isExperimental \} = useTournamentRoute\("audience"\);/g) ?? []).length === 1],
    ["audience no params id", !audience.includes("params?.id")],
    ["detail statsQuery", detail.includes("const statsQuery = useGetTournamentStats(")],
    ["overview optional id", overview.includes("id?: number;")],
  ];

  const failed = checks.filter(([, ok]) => !ok);
  if (failed.length) {
    throw new Error(`Kontrola po patchu nie przeszła: ${failed.map(([name]) => name).join(", ")}`);
  }

  console.log("[Pack 02 typecheck hotfix v2] PATCH PASS");
  for (const [name] of checks) console.log(`- ${name}: OK`);
  console.log("");
  console.log("Teraz uruchom:");
  console.log("node tournament-exp-pack-02-verify.mjs");
} catch (error) {
  console.error("[Pack 02 typecheck hotfix v2] PATCH FAIL");
  console.error(error?.message ?? error);
  try {
    restoreAll();
    console.error("Zmiany hotfixa zostały automatycznie cofnięte.");
  } catch (rollbackError) {
    console.error("Rollback hotfixa nie powiódł się:", rollbackError?.message ?? rollbackError);
  }
  process.exitCode = 1;
}
