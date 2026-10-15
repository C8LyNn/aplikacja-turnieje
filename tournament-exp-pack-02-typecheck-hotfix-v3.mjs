import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REL = "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-overview.tsx";
const FILE = path.join(ROOT, REL);
const BACKUP = path.join(ROOT, ".tournament-exp-pack-02-typecheck-hotfix-v3-backup.tsx");

if (!fs.existsSync(FILE)) {
  console.error(`[Pack 02 typecheck hotfix v3] FAIL — brak ${REL}`);
  process.exit(1);
}

const original = fs.readFileSync(FILE, "utf8");
const usesCrlf = original.includes("\r\n");
let source = original.replace(/\r\n/g, "\n");

try {
  if (!fs.existsSync(BACKUP)) {
    fs.writeFileSync(BACKUP, original, "utf8");
  }

  source = source.replace(
    /type OverviewPlayer = \{\s*id\?: number;\s*name: string;\s*matchWins: number;\s*matchLosses: number;\s*gameDiff\?: number \| null;\s*\};/m,
    `type OverviewPlayer = {
  id?: number;
  name?: string;
  matchWins?: number;
  matchLosses?: number;
  gameDiff?: number | null;
};`,
  );

  source = source.replace(
    /key=\{player\.id \?\? `\$\{player\.name\}-\$\{index\}`\}/g,
    'key={player.id ?? `${player.name ?? "player"}-${index}`}',
  );

  source = source.replace(
    /\{player\.name\}/g,
    '{player.name ?? "Nieznany gracz"}',
  );

  source = source.replace(
    /\{player\.matchWins\}W \/ \{player\.matchLosses\}L/g,
    '{player.matchWins ?? 0}W / {player.matchLosses ?? 0}L',
  );

  const checks = [
    ["optional name", source.includes("name?: string;")],
    ["optional matchWins", source.includes("matchWins?: number;")],
    ["optional matchLosses", source.includes("matchLosses?: number;")],
    ["safe name render", source.includes('player.name ?? "Nieznany gracz"')],
    ["safe record render", source.includes("{player.matchWins ?? 0}W / {player.matchLosses ?? 0}L")],
  ];

  const failed = checks.filter(([, ok]) => !ok);
  if (failed.length) {
    throw new Error(`Kontrola po patchu nie przeszła: ${failed.map(([name]) => name).join(", ")}`);
  }

  fs.writeFileSync(
    FILE,
    usesCrlf ? source.replace(/\n/g, "\r\n") : source,
    "utf8",
  );

  console.log("[Pack 02 typecheck hotfix v3] PATCH PASS");
  for (const [name] of checks) console.log(`- ${name}: OK`);
  console.log("");
  console.log("Teraz uruchom:");
  console.log("node tournament-exp-pack-02-verify.mjs");
} catch (error) {
  console.error("[Pack 02 typecheck hotfix v3] PATCH FAIL");
  console.error(error?.message ?? error);
  if (fs.existsSync(BACKUP)) {
    fs.copyFileSync(BACKUP, FILE);
    console.error("Zmiany hotfixa zostały cofnięte.");
  }
  process.exitCode = 1;
}
