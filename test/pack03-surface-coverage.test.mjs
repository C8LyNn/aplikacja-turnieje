import test from 'node:test';
import assert from 'node:assert/strict';
import * as pack from '../tournament-exp-pack-03-lib.mjs';

function lines(...items) { return items.join('\n'); }

test('patchCss upgrades an already-installed Pack 03 with full-surface coverage', () => {
  const source = '/* Pack 03 — Visual Hierarchy & Identity */\n.experimental-tournament-public { color: white; }\n';
  const out = pack.patchCss(source);
  assert.match(out, /Pack 03\.1 — Full Surface Coverage/);
  assert.match(out, /experimental-audience-hero/);
  assert.match(out, /data-exp-match-state="in_progress"/);
  assert.match(out, /experimental-bracket-header/);
  assert.match(out, /data-exp-basket-type="input"/);
  assert.equal(pack.patchCss(out), out);
});

test('audience patch adds semantic hooks without changing match labels', () => {
  assert.equal(typeof pack.patchAudience, 'function');
  const source = lines(
    '<div className={`bg-card/80 border rounded-2xl overflow-hidden transition-all duration-500 ${heroCardBorder}`}>',
    '<div key={m.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${',
    '<section className="w-full max-w-5xl" aria-label={title}>',
    '<div className="rounded-xl border border-dashed border-white/15 bg-white/3 px-6 py-14 text-center text-sm text-white/40">',
    '<article key={match.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[8rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl border border-white/8 bg-card px-3 py-2.5 md:px-4">',
    '<div key={standing.playerId} className="rounded-xl border border-white/8 bg-card p-4">',
    '<article key={player.id} className="rounded-xl border border-white/8 bg-card p-4">',
    '<div className="overflow-x-auto rounded-xl border border-white/8 bg-card p-4 text-foreground">',
    '<div className={`bg-card/80 border border-white/8 rounded-xl p-4 ${className}`}>',
    '{MATCH_STATUS_LABELS[match.status] ?? match.status}',
  );
  const out = pack.patchAudience(source);
  assert.match(out, /experimental-audience-hero/);
  assert.match(out, /data-exp-match-state=\{heroMatch\.status\}/);
  assert.match(out, /experimental-audience-match-row/);
  assert.match(out, /experimental-public-match-card/);
  assert.match(out, /data-exp-panel-title=\{title\}/);
  assert.match(out, /MATCH_STATUS_LABELS\[match\.status\]/);
});

test('bracket patch adds presentation hooks without touching bracket data', () => {
  assert.equal(typeof pack.patchBracket, 'function');
  const source = lines(
    '<div className={`${isSingleElimination ? "h-dvh" : "min-h-screen"} min-w-0 max-w-full bg-background text-foreground flex flex-col overflow-hidden ${isExperimental ? "experimental-tournament-stage-view" : ""}`} data-theme={presentationSettings.colorPreset || undefined}>',
    '<div className="flex-none py-5 px-8 flex flex-col items-center justify-center bg-card border-b border-border shadow-md z-10 relative">',
    'className="flex-1 min-h-0 min-w-0 w-full overflow-auto"',
    '<BracketView',
    'bracket={bracket}',
  );
  const out = pack.patchBracket(source);
  assert.match(out, /experimental-tournament-stage-view experimental-bracket-view/);
  assert.match(out, /data-exp-format=\{isExperimental \? publicStage\?\.format \?\? "unknown" : undefined\}/);
  assert.match(out, /experimental-bracket-header/);
  assert.match(out, /experimental-bracket-canvas/);
  assert.match(out, /bracket=\{bracket\}/);
});

test('stages patch exposes lifecycle and readiness states for styling only', () => {
  assert.equal(typeof pack.patchStages, 'function');
  const source = lines(
    '            aria-pressed={selected}',
    '            className={`organizer-stage-card rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${',
    '<Card className="organizer-stage-detail">',
    '{selected.status === "planned" && <div aria-label="Gotowość etapu" className="organizer-readiness rounded-lg border bg-card p-4 space-y-2">',
    'readinessQuery.data?.ready',
  );
  const out = pack.patchStages(source);
  assert.match(out, /data-exp-stage-status=\{stage\.status\}/);
  assert.match(out, /data-exp-stage-status=\{selected\.status\}/);
  assert.match(out, /data-exp-ready=\{readinessQuery\.data\?\.ready \? "true" : "false"\}/);
});

test('baskets patch distinguishes inputs outputs stage status and locked mode', () => {
  assert.equal(typeof pack.patchBaskets, 'function');
  const source = lines(
    '    <div',
    '      className={`organizer-basket rounded-md border px-3 py-2 text-sm space-y-2 ${color.bg} ${color.border} ${borderExtra} transition-all`}',
    '    <div',
    '      className="organizer-flow-stage rounded-lg border bg-card flex flex-col shrink-0"',
    '    <div className="min-w-0 max-w-full space-y-4">',
  );
  const out = pack.patchBaskets(source);
  assert.match(out, /data-exp-basket-type=\{basket\.type\}/);
  assert.match(out, /data-exp-locked=\{isLocked \? "true" : "false"\}/);
  assert.match(out, /data-exp-stage-status=\{stage\.status\}/);
});

test('host surface patch annotates focused and result matches but keeps status source', () => {
  assert.equal(typeof pack.patchHostSurface, 'function');
  const source = lines(
    '<div onFocusCapture={() => { if (!hostPending && !dataError) setSelectedMatchId(focusedMatch.id); }} onPointerDownCapture={() => { if (!hostPending && !dataError) setSelectedMatchId(focusedMatch.id); }} className={`${isExperimental ? "experimental-host-primary" : ""} rounded-xl border-2 overflow-hidden transition-colors ${',
    '<div key={match.id} className={`flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3 ${match.status === "in_progress" ? "border-secondary/60" : ""}`}>',
    'MATCH_STATUS_LABELS[match.status]',
  );
  const out = pack.patchHostSurface(source);
  assert.match(out, /data-exp-match-state=\{isExperimental \? focusedMatch\.status : undefined\}/);
  assert.match(out, /experimental-host-match/);
  assert.match(out, /data-exp-match-state=\{isExperimental \? match\.status : undefined\}/);
  assert.match(out, /MATCH_STATUS_LABELS\[match\.status\]/);
});
