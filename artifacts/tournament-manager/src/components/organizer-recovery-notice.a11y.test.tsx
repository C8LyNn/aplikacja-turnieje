import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { OrganizerRecoveryNotice } from "./organizer-recovery-notice";

afterEach(cleanup);
function mount(id: number) {
  const location = memoryLocation({ path: `/tournaments/${id}` });
  return render(<Router hook={location.hook} searchHook={location.searchHook}>
    <OrganizerRecoveryNotice tournamentId={id} />
  </Router>);
}

test("L15-RTL-01: warning exposes heading, description and security link", () => {
  const { container } = mount(81);
  const heading = screen.getByRole("heading", { name: "Zabezpiecz dostęp organizatora" });
  const region = screen.getByRole("region", { name: "Zabezpiecz dostęp organizatora" });
  assert.equal(region.getAttribute("aria-labelledby"), heading.id);
  const descriptionId = region.getAttribute("aria-describedby")!;
  assert.match(container.ownerDocument.getElementById(descriptionId)?.textContent ?? "", /nie ma hasła organizatora/);
  assert.match(screen.getByRole("link", { name: "Ustaw hasło organizatora" }).getAttribute("href") ?? "", /\/tournaments\/81\?tab=security$/);
});

test("L15-RTL-02: repeated notices do not duplicate heading IDs", () => {
  const location = memoryLocation({ path: "/tournaments/81" });
  const { container } = render(<Router hook={location.hook} searchHook={location.searchHook}>
    <OrganizerRecoveryNotice tournamentId={81} />
    <OrganizerRecoveryNotice tournamentId={82} />
  </Router>);
  const headings = [...container.querySelectorAll("h2")];
  assert.equal(headings.length, 2);
  assert.notEqual(headings[0].id, headings[1].id);
});
