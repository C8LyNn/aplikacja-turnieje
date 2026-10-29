import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { drizzle, type NodePgClient } from "drizzle-orm/node-postgres";
import type { PgTransactionConfig } from "drizzle-orm/pg-core";

const ts = createRequire(import.meta.url)("typescript") as typeof import("typescript");

// Read the production call's literal options without importing its DB singleton.
// Changing accessMode to the unsupported readOnly flag must fail this contract.
function readinessTransactionOptions(): PgTransactionConfig {
  const source = ts.createSourceFile(
    "readiness.ts",
    readFileSync(new URL("../src/routes/tournament-se-correction-readiness.ts", import.meta.url), "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const options: Record<string, string>[] = [];
  function visit(node: import("typescript").Node): void {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
      && node.expression.expression.getText(source) === "db"
      && node.expression.name.text === "transaction") {
      const config = node.arguments[1];
      assert.ok(config && ts.isObjectLiteralExpression(config), "Snapshot options must be explicit");
      const entries = config.properties.map((property) => {
        assert.ok(ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer),
          "Snapshot options must be literal string properties");
        return [property.name.getText(source), property.initializer.text];
      });
      options.push(Object.fromEntries(entries));
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.equal(options.length, 1, "Readiness must use one explicit snapshot transaction");
  return options[0] as PgTransactionConfig;
}

test("production readiness options generate REPEATABLE READ READ ONLY in the installed Drizzle driver", async () => {
  const statements: string[] = [];
  // Fake transport only: no Pool, connection, SQL execution or database exists.
  const client = {
    async query(query: string | { text: string }) {
      statements.push(typeof query === "string" ? query : query.text);
      return { rows: [], rowCount: 0, command: "", fields: [], oid: 0 };
    },
  };
  const database = drizzle(client as unknown as NodePgClient);
  const result = await database.transaction(async () => "snapshot", readinessTransactionOptions());
  assert.equal(result, "snapshot");
  assert.deepEqual(statements, ["begin isolation level repeatable read read only", "commit"]);
});
