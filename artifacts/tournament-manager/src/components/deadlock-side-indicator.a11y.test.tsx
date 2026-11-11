import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SideIndicator } from "./deadlock-side-indicator";

afterEach(() => cleanup());

test("L18 compact icon has one stable accessible side name before and after image failure", () => {
  const { container } = render(<SideIndicator side="archmother" showLabel={false} />);
  const indicator = screen.getByRole("img", { name: "Archmother" });
  assert.equal(indicator.tagName, "SPAN");
  const img = container.querySelector("img");
  assert.ok(img);
  assert.equal(img.getAttribute("alt"), "");
  fireEvent.error(img);
  assert.equal(container.querySelector("img"), null);
  assert.equal(screen.getByRole("img", { name: "Archmother" }), indicator);
  assert.match(indicator.getAttribute("style") ?? "", /deadlock-archmother/);
});

test("L18 different side attempts to load its own image even after previous side failed", () => {
  const { container, rerender } = render(<SideIndicator side="archmother" showLabel={false} />);
  const image = container.querySelector("img");
  assert.ok(image);
  fireEvent.error(image);
  assert.equal(container.querySelector("img"), null);
  rerender(<SideIndicator side="hidden_king" showLabel={false} />);
  const freshImage = container.querySelector("img");
  assert.ok(freshImage, "a new side should attempt its own asset");
  assert.match(freshImage.getAttribute("src") ?? "", /hidden-king\.png/);
  assert.equal(screen.getByRole("img", { name: "Hidden King" }).tagName, "SPAN");
});

test("L18 labeled pill exposes text once, image is decorative", () => {
  const { container } = render(<SideIndicator side="hidden_king" />);
  assert.ok(screen.getByText("Hidden King"));
  const asset = container.querySelector("img");
  assert.ok(asset);
  assert.equal(asset.getAttribute("alt"), "");
  assert.equal(asset.getAttribute("aria-hidden"), "true");
});

test("L18 null side has no marker", () => {
  const { container } = render(<SideIndicator side={null} />);
  assert.equal(container.innerHTML, "");
});
