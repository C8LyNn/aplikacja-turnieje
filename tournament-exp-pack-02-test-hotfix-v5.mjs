import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REL = "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-organizer-guard.tsx";
const FILE = path.join(ROOT, REL);
const BACKUP = path.join(ROOT, ".tournament-exp-pack-02-test-hotfix-v5-backup.tsx");

if (!fs.existsSync(FILE)) {
  console.error(`[Pack 02 test hotfix v5] FAIL — brak ${REL}`);
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
    /const \[location, navigate\] = useLocation\(\);/,
    'const [, navigate] = useLocation();',
  );

  source = source.replace(
    /const isExperimentalRoute = location\.startsWith\("\/experimental\/tournaments"\);\s*const redirectTo =\s*role === "organizer"\s*\?\s*null\s*:\s*getRoleHomePath\(\s*role,\s*isExperimentalRoute \? "\/experimental\/tournaments" : "\/",\s*isExperimentalRoute,\s*\);/m,
    'const redirectTo = role === "organizer" ? null : getRoleHomePath(role, "/");',
  );

  if (!source.includes('const redirectTo = role === "organizer" ? null : getRoleHomePath(role, "/");')) {
    source = source.replace(
      /const redirectTo =[\s\S]*?;\n\n  useEffect\(/m,
      'const redirectTo = role === "organizer" ? null : getRoleHomePath(role, "/");\n\n  useEffect(',
    );
  }

  const checks = [
    ["stable role redirect", source.includes('getRoleHomePath(role, "/")')],
    ["no experimental redirect", !source.includes('"/experimental/tournaments"')],
    ["no location-dependent guard", !source.includes("isExperimentalRoute")],
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

  console.log("[Pack 02 test hotfix v5] PATCH PASS");
  for (const [name] of checks) console.log(`- ${name}: OK`);
  console.log("");
  console.log("Guard respektuje istniejący model ról:");
  console.log("- fan -> /fan");
  console.log("- support -> /support");
  console.log("- anonymous -> /");
  console.log("");
  console.log("Teraz uruchom:");
  console.log("node tournament-exp-pack-02-verify.mjs");
} catch (error) {
  console.error("[Pack 02 test hotfix v5] PATCH FAIL");
  console.error(error?.message ?? error);
  if (fs.existsSync(BACKUP)) {
    fs.copyFileSync(BACKUP, FILE);
    console.error("Zmiany hotfixa zostały cofnięte.");
  }
  process.exitCode = 1;
}
