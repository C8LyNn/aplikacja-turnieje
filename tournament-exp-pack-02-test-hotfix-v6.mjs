import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REL = "artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.test.tsx";
const FILE = path.join(ROOT, REL);
const BACKUP = path.join(ROOT, ".tournament-exp-pack-02-test-hotfix-v6-backup.tsx");

if (!fs.existsSync(FILE)) {
  console.error(`[Pack 02 test hotfix v6] FAIL — brak ${REL}`);
  process.exit(1);
}

const original = fs.readFileSync(FILE, "utf8");
const usesCrlf = original.includes("\r\n");
let source = original.replace(/\r\n/g, "\n");

try {
  if (!fs.existsSync(BACKUP)) {
    fs.writeFileSync(BACKUP, original, "utf8");
  }

  const oldExact =
    'assert.ok(screen.getByRole("button", { name: "Sprawdź ponownie" }));';
  const newExact =
    'assert.ok(screen.getByRole("button", { name: "Sprawdź połączenie ponownie" }));';

  if (source.includes(oldExact)) {
    source = source.replace(oldExact, newExact);
  }

  const checks = [
    [
      "health retry label",
      source.includes(
        'getByRole("button", { name: "Sprawdź połączenie ponownie" })',
      ),
    ],
    [
      "old label removed",
      !source.includes(
        'getByRole("button", { name: "Sprawdź ponownie" })',
      ),
    ],
  ];

  const failed = checks.filter(([, ok]) => !ok);
  if (failed.length) {
    throw new Error(
      `Kontrola po patchu nie przeszła: ${failed
        .map(([name]) => name)
        .join(", ")}`,
    );
  }

  fs.writeFileSync(
    FILE,
    usesCrlf ? source.replace(/\n/g, "\r\n") : source,
    "utf8",
  );

  console.log("[Pack 02 test hotfix v6] PATCH PASS");
  for (const [name] of checks) console.log(`- ${name}: OK`);
  console.log("");
  console.log("Zaktualizowano test do faktycznej etykiety przycisku retry.");
  console.log("Teraz uruchom:");
  console.log("node tournament-exp-pack-02-verify.mjs");
} catch (error) {
  console.error("[Pack 02 test hotfix v6] PATCH FAIL");
  console.error(error?.message ?? error);
  if (fs.existsSync(BACKUP)) {
    fs.copyFileSync(BACKUP, FILE);
    console.error("Zmiany hotfixa zostały cofnięte.");
  }
  process.exitCode = 1;
}
