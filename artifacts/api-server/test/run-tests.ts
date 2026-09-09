import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { discoverTests } from "./test-discovery";

const group = process.argv[2];
if (group !== "unit" && group !== "integration") {
  throw new Error("Specify unit or integration.");
}
const tests = (await discoverTests(fileURLToPath(new URL("./", import.meta.url))))[group];
if (!tests.length) throw new Error(`No ${group} test files found.`);
console.log(`Running ${tests.length} ${group} test files.`);
const child = spawn(process.execPath, [
  "--import", "tsx", "--test",
  ...(group === "integration" ? ["--test-concurrency=1"] : []),
  ...tests,
], { stdio: "inherit" });
child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code) => { process.exitCode = code ?? 1; });
