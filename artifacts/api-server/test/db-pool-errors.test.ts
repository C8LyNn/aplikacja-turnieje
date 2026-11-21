// Release rehearsal (21.11): when the database closed an idle connection (restart, failover, Neon suspending its
// compute — 57P01) the pool emitted 'error' with no listener and the whole API process exited. The pool must handle it.
import assert from "node:assert/strict";
import { test } from "node:test";

test("an idle connection closed by the database does not crash the API process", async () => {
  process.env.DATABASE_URL ??= "postgresql://rehearsal:unused@127.0.0.1:1/unused"; // the pool connects lazily; nothing is opened here
  const { pool } = await import("@workspace/db");
  assert.ok(pool.listenerCount("error") >= 1, "the shared pool has an 'error' listener");
  const warn = console.warn;
  const logged: string[] = [];
  console.warn = (line: string) => { logged.push(String(line)); };
  try {
    assert.doesNotThrow(() => pool.emit("error", Object.assign(new Error("terminating connection due to administrator command"), { code: "57P01" })));
  } finally {
    console.warn = warn;
  }
  assert.equal(logged.length, 1);
  assert.match(logged[0]!, /57P01/);
  assert.doesNotMatch(logged[0]!, /postgresql:\/\//, "the connection string is never logged");
  await pool.end();
});
