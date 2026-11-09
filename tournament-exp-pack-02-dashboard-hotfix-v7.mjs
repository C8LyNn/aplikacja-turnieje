import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REL = "artifacts/tournament-manager/src/pages/dashboard.tsx";
const FILE = path.join(ROOT, REL);
const BACKUP = path.join(ROOT, ".tournament-exp-pack-02-dashboard-hotfix-v7-backup.tsx");

if (!fs.existsSync(FILE)) {
  console.error(`[Pack 02 dashboard hotfix v7] FAIL — brak ${REL}`);
  process.exit(1);
}

const original = fs.readFileSync(FILE, "utf8");
const usesCrlf = original.includes("\r\n");
let source = original.replace(/\r\n/g, "\n");

try {
  if (!fs.existsSync(BACKUP)) {
    fs.writeFileSync(BACKUP, original, "utf8");
  }

  // 1. Render the toolbar. The installer had already added imports/state/filter logic,
  // but omitted the JSX itself.
  if (!source.includes("<ExperimentalDashboardToolbar")) {
    const anchor = `        <BackupRestoreDialog
          open={showRestoreDialog}
          onClose={() => setShowRestoreDialog(false)}
        />`;

    const block = `        {isExperimental && (
          <ExperimentalDashboardToolbar
            query={tournamentSearch}
            onQueryChange={setTournamentSearch}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            counts={tournamentCounts}
          />
        )}

${anchor}`;

    if (!source.includes(anchor)) {
      throw new Error("Nie znaleziono miejsca na ExperimentalDashboardToolbar.");
    }
    source = source.replace(anchor, block);
  }

  // 2. Use filteredTournaments in the rendered grid and provide a filtered empty state.
  if (!source.includes("Brak turniejów pasujących do filtrów")) {
    const gridAnchor = `        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (`;

    const filteredGrid = `        ) : isExperimental && filteredTournaments.length === 0 ? (
          <ExperimentalStatePanel
            title="Brak turniejów pasujących do filtrów"
            description="Zmień status albo frazę wyszukiwania. Dane turniejów nie zostały usunięte."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(isExperimental ? filteredTournaments : tournaments).map((tournament) => (`;

    if (!source.includes(gridAnchor)) {
      throw new Error("Nie znaleziono gridu listy turniejów.");
    }
    source = source.replace(gridAnchor, filteredGrid);
  }

  const checks = [
    ["toolbar JSX", source.includes("<ExperimentalDashboardToolbar")],
    ["search binding", source.includes("query={tournamentSearch}")],
    ["status binding", source.includes("status={statusFilter}")],
    ["filtered empty state", source.includes("Brak turniejów pasujących do filtrów")],
    ["filtered grid", source.includes("(isExperimental ? filteredTournaments : tournaments).map")],
  ];

  const failed = checks.filter(([, ok]) => !ok);
  if (failed.length) {
    throw new Error(
      `Kontrola po patchu nie przeszła: ${failed.map(([name]) => name).join(", ")}`,
    );
  }

  fs.writeFileSync(
    FILE,
    usesCrlf ? source.replace(/\n/g, "\r\n") : source,
    "utf8",
  );

  console.log("[Pack 02 dashboard hotfix v7] PATCH PASS");
  for (const [name] of checks) console.log(`- ${name}: OK`);
  console.log("");
  console.log("Naprawiono brakujące renderowanie Dashboard Toolbar oraz użycie filtrów.");
  console.log("Teraz uruchom:");
  console.log("node tournament-exp-pack-02-verify.mjs");
} catch (error) {
  console.error("[Pack 02 dashboard hotfix v7] PATCH FAIL");
  console.error(error?.message ?? error);
  if (fs.existsSync(BACKUP)) {
    fs.copyFileSync(BACKUP, FILE);
    console.error("Zmiany hotfixa zostały cofnięte.");
  }
  process.exitCode = 1;
}
