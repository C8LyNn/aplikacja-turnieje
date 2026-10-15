import { readdir } from "node:fs/promises";
import path from "node:path";

export async function discoverTests(directory: string): Promise<{ unit: string[]; integration: string[] }> {
  const result = { unit: [] as string[], integration: [] as string[] };
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await discoverTests(file);
      result.unit.push(...nested.unit);
      result.integration.push(...nested.integration);
    } else if (entry.name.endsWith(".test.ts")) {
      result[entry.name.endsWith(".integration.test.ts") ? "integration" : "unit"].push(file);
    }
  }
  result.unit.sort();
  result.integration.sort();
  return result;
}
