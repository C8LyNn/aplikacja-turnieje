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

// Optional file filters (`pnpm test -- src/components/x.test.tsx`) run selected files with the exact same
// loader, DOM setup and tsconfig as the full suite. Running `node --test file` directly skips
// TSX_TSCONFIG_PATH and fails with "React is not defined".
const filters = process.argv.slice(2).filter((arg) => arg !== "--").map((arg) => path.resolve(packageRoot, arg));
const allTests = (await findTests(sourceRoot)).sort();
const tests = filters.length === 0
  ? allTests
  : allTests.filter((file) => filters.some((filter) => file === filter || file.startsWith(filter + path.sep)));
if (filters.length > 0 && tests.length === 0) {
  console.error(`No frontend test files match: ${process.argv.slice(2).join(" ")}`);
  process.exit(1);
}
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
