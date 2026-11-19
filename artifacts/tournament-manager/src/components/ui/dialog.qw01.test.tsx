// QW-01 · a dialog taller than the screen (phone in landscape, on-screen keyboard) must scroll instead of cutting
// off its top and bottom. The cap is the default of the shared dialog parts; a caller's own size still wins.
import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { cleanup, render, screen } from "@testing-library/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "./alert-dialog";

afterEach(() => cleanup());

function dialog(className?: string) {
  render(
    <Dialog open>
      <DialogContent className={className} data-testid="content">
        <DialogTitle>Tytuł</DialogTitle>
        <DialogDescription>Opis</DialogDescription>
      </DialogContent>
    </Dialog>,
  );
  return screen.getByTestId("content").className.split(/\s+/);
}

test("QW-01: dialogs are capped to the dynamic viewport and scroll inside by default", () => {
  const classes = dialog();
  assert.ok(classes.includes("max-h-[calc(100dvh-2rem)]"));
  assert.ok(classes.includes("overflow-y-auto"));
});

test("QW-01: a caller's own height and overflow replace the defaults", () => {
  const classes = dialog("max-h-[92vh] overflow-hidden");
  assert.ok(classes.includes("max-h-[92vh]"));
  assert.ok(!classes.includes("max-h-[calc(100dvh-2rem)]"));
  assert.ok(classes.includes("overflow-hidden"));
  assert.ok(!classes.includes("overflow-y-auto"));
});

test("QW-01: alert dialogs get the same cap", () => {
  render(
    <AlertDialog open>
      <AlertDialogContent data-testid="alert">
        <AlertDialogTitle>Na pewno?</AlertDialogTitle>
        <AlertDialogDescription>Opis</AlertDialogDescription>
      </AlertDialogContent>
    </AlertDialog>,
  );
  const classes = screen.getByTestId("alert").className.split(/\s+/);
  assert.ok(classes.includes("max-h-[calc(100dvh-2rem)]"));
  assert.ok(classes.includes("overflow-y-auto"));
});
