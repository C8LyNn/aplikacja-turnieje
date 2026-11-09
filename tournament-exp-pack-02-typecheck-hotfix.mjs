import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BACKUP = path.join(ROOT, ".tournament-exp-pack-02-typecheck-hotfix-backup");

const files = {
  routing: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-routing.ts",
  create: "artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.tsx",
  audience: "artifacts/tournament-manager/src/pages/tournament-audience.tsx",
  detail: "artifacts/tournament-manager/src/pages/tournament-detail.tsx",
  overview: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-overview.tsx",
};

function abs(rel) {
  return path.join(ROOT, rel);
}

function read(rel) {
  if (!fs.existsSync(abs(rel))) {
    throw new Error(`Brak pliku: ${rel}`);
  }
  return fs.readFileSync(abs(rel), "utf8");
}

function writePreservingEol(rel, original, normalized) {
  const usesCrlf = original.includes("\r\n");
  fs.writeFileSync(
    abs(rel),
    usesCrlf ? normalized.replace(/\n/g, "\r\n") : normalized,
    "utf8",
  );
}

function normalize(text) {
  return text.replace(/\r\n/g, "\n");
}

function replaceOnce(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) {
    throw new Error(`Nie znaleziono markera: ${label}`);
  }
  return source.replace(from, to);
}

function backup() {
  if (fs.existsSync(BACKUP)) {
    throw new Error(
      "Backup hotfixa już istnieje. Jeśli poprzedni hotfix został wykonany poprawnie, nie uruchamiaj go ponownie.",
    );
  }
  for (const rel of Object.values(files)) {
    const src = abs(rel);
    const dst = path.join(BACKUP, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

function patchFile(rel, fn) {
  const original = read(rel);
  const before = normalize(original);
  const after = fn(before);
  writePreservingEol(rel, original, after);
}

try {
  backup();

  patchFile(files.routing, (s) =>
    replaceOnce(
      s,
      "  const params = experimentalMatch ? experimentalParams : stableParams;\n  const rawId = params?.id;",
      "  const params = experimentalMatch ? experimentalParams : stableParams;\n  const rawId = (params as Record<string, string | undefined> | null | undefined)?.id;",
      "routing params id",
    ),
  );

  patchFile(files.create, (s) =>
    replaceOnce(
      s,
      '<dd className="mt-1 font-semibold">{formatInfo.label}</dd>',
      '<dd className="mt-1 font-semibold">{FORMAT_INFO[format].label}</dd>',
      "create formatInfo",
    ),
  );

  patchFile(files.audience, (s) => {
    s = replaceOnce(
      s,
      '  const { id, isExperimental } = useTournamentRoute("audience");\n  const [searchParams] = useSearchParams();',
      '  const { id, isExperimental } = useTournamentRoute("audience");\n  const [searchParams] = useSearchParams();',
      "audience experimental route",
    );

    // Pack 02 correctly inserted useTournamentRoute but the old stable-derived id line
    // remained in this file on the user's checkout.
    const legacy = '  const id = params?.id ? parseInt(params.id, 10) : 0;\n';
    if (s.includes(legacy)) {
      s = s.replace(legacy, "");
    }
    return s;
  });

  patchFile(files.detail, (s) =>
    replaceOnce(
      s,
      `  const { data: stats } = useGetTournamentStats(id, {
    query: { enabled: !!id && readOk, queryKey: getGetTournamentStatsQueryKey(id) },
  });`,
      `  const statsQuery = useGetTournamentStats(id, {
    query: { enabled: !!id && readOk, queryKey: getGetTournamentStatsQueryKey(id) },
  });
  const { data: stats } = statsQuery;`,
      "detail statsQuery",
    ),
  );

  patchFile(files.overview, (s) => {
    s = replaceOnce(
      s,
      `type OverviewPlayer = {
  id: number;`,
      `type OverviewPlayer = {
  id?: number;`,
      "overview optional player id",
    );

    s = replaceOnce(
      s,
      `            {stats.topPlayers.map((player, index) => (
              <div
                key={player.id}`,
      `            {stats.topPlayers.map((player, index) => (
              <div
                key={player.id ?? \`\${player.name}-\${index}\`}`,
      "overview player fallback key",
    );

    return s;
  });

  console.log("[Pack 02 typecheck hotfix] PATCH PASS");
  console.log("Naprawiono:");
  console.log("- routing params id");
  console.log("- create formatInfo");
  console.log("- Audience duplicate id/params");
  console.log("- Detail statsQuery");
  console.log("- OverviewStats optional player id");
  console.log("");
  console.log("Teraz uruchom z katalogu repo:");
  console.log("node tournament-exp-pack-02-verify.mjs");
} catch (error) {
  console.error("[Pack 02 typecheck hotfix] PATCH FAIL");
  console.error(error?.message ?? error);

  if (fs.existsSync(BACKUP)) {
    for (const rel of Object.values(files)) {
      const src = path.join(BACKUP, rel);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, abs(rel));
      }
    }
    fs.rmSync(BACKUP, { recursive: true, force: true });
    console.error("Zmiany hotfixa zostały automatycznie cofnięte.");
  }

  process.exitCode = 1;
}
