import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(packageRoot, "src");

async function findTests(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return findTests(absolute);
    return /\.test\.(?:ts|tsx)$/.test(entry.name) ? [absolute] : [];
  }));
  return nested.flat();
}

const tests = (await findTests(sourceRoot)).sort();
console.log(`Detected ${tests.length} frontend test files:`);
for (const file of tests) console.log(`- ${path.relative(packageRoot, file)}`);
if (tests.length === 0) process.exit(1);

const child = spawn(
  process.execPath,
  ["--import", "tsx", "--import", "./test/setup-dom.mjs", "--test", ...tests],
  {
    cwd: packageRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      TSX_TSCONFIG_PATH: path.join(packageRoot, "test", "tsconfig.json"),
    },
  },
);
child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Frontend test runner stopped by ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
