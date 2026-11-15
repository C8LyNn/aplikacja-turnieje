import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { cleanup, render, screen } from "@testing-library/react";
import { PrototypeHtml } from "./prototype-html";

afterEach(cleanup);

test("L51: keeps a titled iframe and opens the same source in a new tab", () => {
  render(<PrototypeHtml title="Test sceny" relativePath="prototypes/example.html" backHref="/" />);
  const frame = screen.getByTitle("Test sceny") as HTMLIFrameElement;
  const link = screen.getByRole("link", { name: /Otwórz sam HTML/ });
  assert.ok(frame.getAttribute("src")?.endsWith("/prototypes/example.html"));
  assert.equal(link.getAttribute("href"), frame.getAttribute("src"));
  assert.equal(link.getAttribute("target"), "_blank");
  assert.match(link.className, /focus-visible:ring-2/);
  assert.match(link.className, /min-h-11/);
});

test("L51: responsive frame preserves desktop sizing while reducing mobile min-height", () => {
  render(<PrototypeHtml title="Widok" relativePath="/demo.html" backHref="/" />);
  const frame = screen.getByTitle("Widok");
  assert.match(frame.className, /min-h-\[400px\]/);
  assert.match(frame.className, /sm:min-h-\[720px\]/);
  assert.match(frame.className, /sm:h-\[calc\(100vh-190px\)\]/);
});
