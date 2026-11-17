import assert from "node:assert/strict";
import { test } from "node:test";
import { inspect } from "node:util";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { TestAuthProvider } from "../../test/auth-provider";

// Guards the jsdom inspect hook in test/setup-dom.mjs: a failing assertion on a rendered element must stay
// cheap. Without the hook this single failure took ~86 s and +347 MB inside a real panel and could crash the suite.
test("failing assertions on rendered DOM nodes stay fast and readable", () => {
  render(<TestAuthProvider><label id="pw">Pierwsze hasło organizatora</label></TestAuthProvider>);
  const label = screen.getByText("Pierwsze hasło organizatora");
  const started = performance.now();
  let message = "";
  try {
    assert.equal(label, null);
  } catch (error) {
    message = (error as Error).message;
  }
  const elapsed = performance.now() - started;
  // Comparison semantics are unchanged for DOM nodes.
  assert.equal(label, label);
  assert.notEqual(label, null);
  assert.strictEqual(screen.queryByText("brak takiego tekstu"), null);
  assert.throws(() => assert.notStrictEqual(label, label), /notStrictEqual/);
  assert.throws(() => assert.equal(label, null, "własny komunikat"), /własny komunikat/);
  cleanup();
  assert.ok(message.includes('<label#pw> "Pierwsze hasło organizatora"'), message);
  assert.ok(elapsed < 1000, `assert took ${Math.round(elapsed)} ms`);
  assert.equal(inspect(document), "#document");
});
