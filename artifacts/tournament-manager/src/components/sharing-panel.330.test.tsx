// #330 · the sharing panel names the hidden mode "Ukryty" and does not offer it after the start (server: 409).
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { SharingPanel } from "./sharing-panel";

afterEach(() => cleanup());

function mount(status: string, visibility = "public_online") {
  const location = memoryLocation({ path: "/tournaments/7?tab=sharing" });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Router hook={location.hook}>
        <SharingPanel tournament={{ id: 7, name: "Puchar", visibility, status, hasViewerPassword: false }} orgToken="org-7" />
      </Router>
    </QueryClientProvider>,
  );
  return screen.getByRole("radio", { name: /Ukryty \(prywatny offline\)/ }) as HTMLInputElement;
}

test("#330: before the start the hidden mode can be chosen", () => {
  const hidden = mount("draft");
  assert.equal(hidden.disabled, false);
  assert.equal(screen.queryByText("Po rozpoczęciu turnieju nie można go ukryć."), null);
});

test("#330: after the start the hidden mode is locked with the reason, instead of failing on save", () => {
  const hidden = mount("active");
  assert.equal(hidden.disabled, true);
  assert.ok(screen.getByText("Po rozpoczęciu turnieju nie można go ukryć."));
  const password = screen.getByRole("radio", { name: /Prywatny online/ }) as HTMLInputElement;
  assert.equal(password.disabled, false, "other modes stay available");
});

test("#330: a tournament that is already hidden keeps its own option selectable", () => {
  const hidden = mount("active", "private_offline");
  assert.equal(hidden.disabled, false);
  assert.equal(hidden.checked, true);
});
