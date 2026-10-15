import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REL = "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-organizer-guard.tsx";
const FILE = path.join(ROOT, REL);
const BACKUP = path.join(ROOT, ".tournament-exp-pack-02-test-hotfix-v4-backup.tsx");

if (!fs.existsSync(FILE)) {
  console.error(`[Pack 02 test hotfix v4] FAIL — brak ${REL}`);
  process.exit(1);
}

const original = fs.readFileSync(FILE, "utf8");
const usesCrlf = original.includes("\r\n");
let source = original.replace(/\r\n/g, "\n");

try {
  if (!fs.existsSync(BACKUP)) {
    fs.writeFileSync(BACKUP, original, "utf8");
  }

  // The same guard is used by both the stable version-choice page and the
  // Experimental create route. Redirects must therefore depend on the current
  // namespace instead of always forcing /experimental/tournaments.
  source = source.replace(
    /const \[, navigate\] = useLocation\(\);/,
    'const [location, navigate] = useLocation();',
  );

  source = source.replace(
    /const redirectTo =\s*role === "organizer"\s*\?\s*null\s*:\s*getRoleHomePath\(role,\s*"\/experimental\/tournaments",\s*true\);/m,
    `const isExperimentalRoute = location.startsWith("/experimental/tournaments");
  const redirectTo =
    role === "organizer"
      ? null
      : getRoleHomePath(
          role,
          isExperimentalRoute ? "/experimental/tournaments" : "/",
          isExperimentalRoute,
        );`,
  );

  // Support the original/base version too, in case a previous rollback left it.
  source = source.replace(
    /const redirectTo = role === "organizer" \? null : getRoleHomePath\(role, "\/"\);/,
    `const isExperimentalRoute = location.startsWith("/experimental/tournaments");
  const redirectTo =
    role === "organizer"
      ? null
      : getRoleHomePath(
          role,
          isExperimentalRoute ? "/experimental/tournaments" : "/",
          isExperimentalRoute,
        );`,
  );

  const checks = [
    ["location-aware hook", source.includes("const [location, navigate] = useLocation();")],
    ["namespace detection", source.includes('location.startsWith("/experimental/tournaments")')],
    ["stable fallback", source.includes('isExperimentalRoute ? "/experimental/tournaments" : "/"')],
    ["mode-aware role home", source.includes("isExperimentalRoute,")],
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

  console.log("[Pack 02 test hotfix v4] PATCH PASS");
  for (const [name] of checks) console.log(`- ${name}: OK`);
  console.log("");
  console.log("Naprawiono guard używany jednocześnie przez Stable chooser i Experimental create.");
  console.log("Teraz uruchom:");
  console.log("node tournament-exp-pack-02-verify.mjs");
} catch (error) {
  console.error("[Pack 02 test hotfix v4] PATCH FAIL");
  console.error(error?.message ?? error);
  if (fs.existsSync(BACKUP)) {
    fs.copyFileSync(BACKUP, FILE);
    console.error("Zmiany hotfixa zostały cofnięte.");
  }
  process.exitCode = 1;
}
