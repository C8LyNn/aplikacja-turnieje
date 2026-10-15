import test from 'node:test';
import assert from 'node:assert/strict';
import * as pack from '../tournament-exp-pack-03-lib.mjs';

function lines(...items) { return items.join('\n'); }

test('role home exposes semantic role hooks only for Experimental', () => {
  assert.equal(typeof pack.patchTournamentHome, 'function');
  const source = lines(
    '<div className={`min-h-screen bg-background px-4 py-12 text-foreground dark ${isExperimental ? "experimental-tournament-entry" : ""}`}>',
    '              onClick={() => selectRole(item)}',
    '              className={`group relative min-h-56 rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 ${item.cardHover} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isExperimental ? "experimental-entry-card" : ""}`}',
  );
  const out = pack.patchTournamentHome(source);
  assert.match(out, /experimental-role-home/);
  assert.match(out, /data-exp-role=\{isExperimental \? item\.id : undefined\}/);
});

test('support entry gains scoped support surfaces without changing login behavior', () => {
  assert.equal(typeof pack.patchSupportEntry, 'function');
  const source = lines(
    '<div className={`min-h-screen bg-background text-foreground dark flex flex-col ${isExperimental ? "experimental-tournament-entry" : ""}`}>',
    'className="w-full text-left border border-border rounded-xl p-4 bg-card hover:border-green-500/50 hover:bg-green-500/5 transition-all"',
    '<div className="border border-border rounded-xl p-6 bg-card space-y-5">',
    'navigate(tournamentHref(selectedId, isExperimental, "/host"));',
  );
  const out = pack.patchSupportEntry(source);
  assert.match(out, /experimental-support-entry/);
  assert.match(out, /experimental-support-tournament-card/);
  assert.match(out, /experimental-support-login-panel/);
  assert.match(out, /tournamentHref\(selectedId, isExperimental, "\/host"\)/);
});

test('fan entry marks cards by tournament status', () => {
  assert.equal(typeof pack.patchFanView, 'function');
  const source = lines(
    '<div className={`min-h-screen bg-background text-foreground dark flex flex-col ${isExperimental ? "experimental-tournament-entry" : ""}`}>',
    '<div className="rounded-xl border border-border bg-card hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer group p-5 flex flex-col gap-3">',
  );
  const out = pack.patchFanView(source);
  assert.match(out, /experimental-fan-entry/);
  assert.match(out, /data-exp-tournament-status=\{isExperimental \? t\.status : undefined\}/);
  assert.match(out, /experimental-fan-card/);
});

test('projector hooks remain Experimental-only and preserve URL/preset behavior', () => {
  assert.equal(typeof pack.patchProjector, 'function');
  const source = lines(
    '  const { id } = useTournamentRoute("projector");',
    '    <div style={containerStyle} data-theme={effectiveSettings.colorPreset ?? undefined}>',
    '          className="flex flex-col items-center justify-center gap-1 border-b border-white/10"',
    '      <div',
    '        style={{',
    '          padding,',
    '          ...(forceAspect ? {} : { transform: `scale(${zoom})`, transformOrigin: "top left" }),',
    '        }}',
    '      >',
    '  const preset = sp.get("preset") ?? "classic";',
  );
  const out = pack.patchProjector(source);
  assert.match(out, /const \{ id, isExperimental \} = useTournamentRoute\("projector"\)/);
  assert.match(out, /experimental-projector-view/);
  assert.match(out, /data-exp-preset=\{isExperimental \? preset : undefined\}/);
  assert.match(out, /experimental-projector-header/);
  assert.match(out, /experimental-projector-canvas/);
  assert.match(out, /sp\.get\("preset"\)/);
});

test('create chooser exposes a scoped grid hook', () => {
  assert.equal(typeof pack.patchCreateChoice, 'function');
  const out = pack.patchCreateChoice('<div className="grid gap-4 md:grid-cols-2">');
  assert.match(out, /experimental-create-choice-grid/);
});

test('player rows expose status without changing status labels', () => {
  assert.equal(typeof pack.patchTournamentDetail, 'function');
  const source = lines(
    '<div key={p.id} className={`flex flex-col border rounded bg-background ${isExperimental ? "experimental-player-row" : ""}`}>',
    '{PLAYER_STATUS_LABELS[p.status ?? ""] ?? "Nieznany"}',
  );
  const out = pack.patchTournamentDetail(source);
  assert.match(out, /data-exp-player-status=\{isExperimental \? p\.status \?\? "unknown" : undefined\}/);
  assert.match(out, /PLAYER_STATUS_LABELS\[p\.status \?\? ""\]/);
});

test('checklist and dashboard dialogs expose dedicated visual surfaces', () => {
  assert.equal(typeof pack.patchChecklist, 'function');
  assert.equal(typeof pack.patchDashboardDialogs, 'function');
  const checklist = pack.patchChecklist(lines(
    '<DialogContent className="flex max-h-[86vh] max-w-xl flex-col gap-0 p-0">',
    '<button key={item.id} type="button" aria-pressed={active} onClick={() => toggle(item.id)}',
    '                className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${active ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:bg-muted/30"}`}>',
  ));
  assert.match(checklist, /experimental-checklist-dialog/);
  assert.match(checklist, /data-exp-checked=\{active \? "true" : "false"\}/);
  assert.match(checklist, /experimental-checklist-item/);

  const dialogs = pack.patchDashboardDialogs(lines(
    '<DialogContent className="max-w-md">',
    '<DialogContent className="max-w-md border-destructive/45">',
  ));
  assert.match(dialogs, /experimental-test-data-dialog/);
  assert.match(dialogs, /experimental-delete-dialog/);
});

test('dashboard and player toolbar publish filter state for visual hierarchy', () => {
  assert.equal(typeof pack.patchDashboardToolbar, 'function');
  assert.equal(typeof pack.patchPlayerToolbar, 'function');
  const dash = pack.patchDashboardToolbar(lines(
    '<section',
    '      aria-label="Filtrowanie turniejów"',
    '      className="experimental-dashboard-toolbar rounded-xl border border-border/80 bg-card/50 p-3"',
  ));
  assert.match(dash, /data-exp-status-filter=\{status\}/);
  const players = pack.patchPlayerToolbar('<section aria-label="Filtrowanie listy graczy" className="experimental-player-toolbar rounded-xl border border-border/80 bg-card/50 p-3">');
  assert.match(players, /data-exp-status-filter=\{status\}/);
  assert.match(players, /data-exp-sort=\{sort\}/);
});
