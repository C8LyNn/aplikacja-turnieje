import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { installPack03, rollbackPack03, checkCompatibility, TARGETS } from '../tournament-exp-pack-03-installer-core.mjs';

function fixtureContent(kind) {
  const map = {
    css: '/* Pack 02 audited — full experimental tournament frontend */\r\n.experimental-dashboard-card { color: inherit; }\r\n',
    ui: [
      'import type { LucideIcon } from "lucide-react";',
      'import type { ReactNode } from "react";',
      'import { Link } from "wouter";',
      '',
      'export function ExperimentalMetricCard({', '  label,', '  value,', '  meta,', '  icon: Icon,', '}: {',
      '  label: string;', '  value: ReactNode;', '  meta?: ReactNode;', '  icon?: LucideIcon;', '}) {', '  return (',
      '    <div className="experimental-metric-card rounded-xl border border-border/80 bg-card/55 p-4">',
      '  );', '}',
      'export function ExperimentalStatusPill({', '  children,', '  tone = "neutral",', '}: {', '  children: ReactNode;',
      '  tone?: "neutral" | "active" | "success" | "danger";', '}) {', '  const toneClass = "x";', '  return (', '    <span',
      '      className={`inline-flex min-h-6 ${toneClass}`}', '    >{children}</span>', '  );', '}',
      'export function ExperimentalStatePanel({', '  title,', '  description,', '  icon: Icon,', '  action,', '  tone = "neutral",', '}: {',
      '  title: string;', '  description: string;', '  icon?: LucideIcon;', '  action?: ReactNode;', '  tone?: "neutral" | "danger";', '}) {', '  return (',
      '    <section', '      role={tone === "danger" ? "alert" : undefined}', '      className="x"', '    >x</section>', '  );', '}',
      'export function ExperimentalQuickLink({', '  href,', '  label,', '  description,', '  icon: Icon,', '}: {',
      '  href: string;', '  label: string;', '  description: string;', '  icon: LucideIcon;', '}) {', '  return (', '    <Link', '      href={href}',
      '      className="experimental-quick-link group"', '    >x</Link>', '  );', '}',
    ].join('\r\n'),
    overview: [
      '  const statusTone =', '    status === "active"', '      ? "active"', '      : status === "completed"', '        ? "success"', '        : "neutral";',
      '<ExperimentalMetricCard', '            label="Uczestnicy"', '<ExperimentalMetricCard', '            label="Mecze"', '<ExperimentalMetricCard', '            label="Postęp"', '<ExperimentalMetricCard', '            label="Format"',
      '              className={`rounded-xl border p-3 ${', '                step.done', '                  ? "border-primary/25 bg-primary/5"', '                  : "border-border/75 bg-background/25"', '              }`}',
      '              <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">',
    ].join('\r\n'),
    host: [
      '  const stateTone =', '    dataError', '      ? "danger"', '      : isCompleted', '        ? "success"', '        : liveCount > 0 || readyCount > 0', '          ? "active"', '          : "neutral";',
      '<ExperimentalMetricCard', '          label="Na żywo"', '<ExperimentalMetricCard', '          label="Gotowe"', '<ExperimentalMetricCard', '          label="Zakończone"', '<ExperimentalMetricCard', '          label="Pozostałe"', '<ExperimentalMetricCard', '          label="Następny krok"',
    ].join('\r\n'),
    dashboard: 'className={`hover:border-primary/50 transition-colors cursor-pointer h-full flex flex-col group ${isExperimental ? "experimental-dashboard-card" : ""}`}\r\n',
    create: [
      '<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.85fr)]">', '<div className="space-y-7">',
      '<div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">',
      '<div className="space-y-4 lg:sticky lg:top-4 lg:self-start">',
      '<div key={item.label} className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-background/25 px-3 py-2.5">',
    ].join('\r\n'),
    audience: [
      '<div className={`experimental-tournament-public`}>',
      '<div className={`bg-card/80 border rounded-2xl overflow-hidden transition-all duration-500 ${heroCardBorder}`}>',
      '<div key={m.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${',
      '<section className="w-full max-w-5xl" aria-label={title}>',
      '<div className="rounded-xl border border-dashed border-white/15 bg-white/3 px-6 py-14 text-center text-sm text-white/40">',
      '<article key={match.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[8rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl border border-white/8 bg-card px-3 py-2.5 md:px-4">',
      '<div key={standing.playerId} className="rounded-xl border border-white/8 bg-card p-4">',
      '<article key={player.id} className="rounded-xl border border-white/8 bg-card p-4">',
      '<div className="overflow-x-auto rounded-xl border border-white/8 bg-card p-4 text-foreground">',
      '<div className={`bg-card/80 border border-white/8 rounded-xl p-4 ${className}`}>',
    ].join('\r\n'),
    bracket: [
      '<div className={`${isSingleElimination ? "h-dvh" : "min-h-screen"} min-w-0 max-w-full bg-background text-foreground flex flex-col overflow-hidden ${isExperimental ? "experimental-tournament-stage-view" : ""}`} data-theme={presentationSettings.colorPreset || undefined}>',
      '<div className="flex-none py-5 px-8 flex flex-col items-center justify-center bg-card border-b border-border shadow-md z-10 relative">',
      'className="flex-1 min-h-0 min-w-0 w-full overflow-auto"',
    ].join('\r\n'),
    stages: [
      '            aria-pressed={selected}',
      '            className={`organizer-stage-card rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${',
      '<Card className="organizer-stage-detail">',
      '{selected.status === "planned" && <div aria-label="Gotowość etapu" className="organizer-readiness rounded-lg border bg-card p-4 space-y-2">',
    ].join('\r\n'),
    baskets: [
      '    <div',
      '      className={`organizer-basket rounded-md border px-3 py-2 text-sm space-y-2 ${color.bg} ${color.border} ${borderExtra} transition-all`}',
      '    <div',
      '      className="organizer-flow-stage rounded-lg border bg-card flex flex-col shrink-0"',
      '    <div className="min-w-0 max-w-full space-y-4">',
    ].join('\r\n'),
    'host-surface': [
      '<div onFocusCapture={() => { if (!hostPending && !dataError) setSelectedMatchId(focusedMatch.id); }} onPointerDownCapture={() => { if (!hostPending && !dataError) setSelectedMatchId(focusedMatch.id); }} className={`${isExperimental ? "experimental-host-primary" : ""} rounded-xl border-2 overflow-hidden transition-colors ${',
      '<div key={match.id} className={`flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3 ${match.status === "in_progress" ? "border-secondary/60" : ""}`}>',
    ].join('\r\n'),
    'role-home': [
      '<div className={`min-h-screen bg-background px-4 py-12 text-foreground dark ${isExperimental ? "experimental-tournament-entry" : ""}`}>',
      '              onClick={() => selectRole(item)}',
      '              className={`group relative min-h-56 rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 ${item.cardHover} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isExperimental ? "experimental-entry-card" : ""}`}',
    ].join('\r\n'),
    'support-entry': [
      '<div className={`min-h-screen bg-background text-foreground dark flex flex-col ${isExperimental ? "experimental-tournament-entry" : ""}`}>',
      'className="w-full text-left border border-border rounded-xl p-4 bg-card hover:border-green-500/50 hover:bg-green-500/5 transition-all"',
      '<div className="border border-border rounded-xl p-6 bg-card space-y-5">',
    ].join('\r\n'),
    'fan-entry': [
      '<div className={`min-h-screen bg-background text-foreground dark flex flex-col ${isExperimental ? "experimental-tournament-entry" : ""}`}>',
      '<div className="rounded-xl border border-border bg-card hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer group p-5 flex flex-col gap-3">',
    ].join('\r\n'),
    projector: [
      '  const { id } = useTournamentRoute("projector");',
      '    <div style={containerStyle} data-theme={effectiveSettings.colorPreset ?? undefined}>',
      '          className="flex flex-col items-center justify-center gap-1 border-b border-white/10"',
      '      <div',
      '        style={{',
      '          padding,',
      '          ...(forceAspect ? {} : { transform: `scale(${zoom})`, transformOrigin: "top left" }),',
      '        }}',
      '      >',
    ].join('\r\n'),
    'create-choice': '<div className="grid gap-4 md:grid-cols-2">\r\n',
    'detail-player-status': [
      '<div key={p.id} className={`flex flex-col border rounded bg-background ${isExperimental ? "experimental-player-row" : ""}`}>',
      '{PLAYER_STATUS_LABELS[p.status ?? ""] ?? "Nieznany"}',
    ].join('\r\n'),
    checklist: [
      '<DialogContent className="flex max-h-[86vh] max-w-xl flex-col gap-0 p-0">',
      '<button key={item.id} type="button" aria-pressed={active} onClick={() => toggle(item.id)}',
      '                className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${active ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:bg-muted/30"}`}>',
      'Checklista wydarzenia',
    ].join('\r\n'),
    'dashboard-dialogs': [
      'export function ExperimentalTestDataDialog() {}',
      '<DialogContent className="max-w-md">',
      '<DialogContent className="max-w-md border-destructive/45">',
    ].join('\r\n'),
    'dashboard-toolbar': [
      '<section',
      '      aria-label="Filtrowanie turniejów"',
      '      className="experimental-dashboard-toolbar rounded-xl border border-border/80 bg-card/50 p-3"',
    ].join('\r\n'),
    'player-toolbar': '<section aria-label="Filtrowanie listy graczy" className="experimental-player-toolbar rounded-xl border border-border/80 bg-card/50 p-3">\r\n',
  };
  return map[kind];
}

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pack03-fixture-'));
  for (const target of TARGETS) {
    const full = path.join(root, target.path);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, fixtureContent(target.kind), 'utf8');
  }
  return root;
}

test('compatibility passes on Pack 02 marker fixtures', () => {
  const root = makeRepo();
  const result = checkCompatibility(root);
  assert.equal(result.ok, true);
  assert.equal(result.targets.length, TARGETS.length);
});

test('install preserves CRLF and creates rollback backup', () => {
  const root = makeRepo();
  const before = new Map(TARGETS.map(t => [t.path, fs.readFileSync(path.join(root, t.path), 'utf8')]));
  const result = installPack03(root);
  assert.equal(result.changed.length, TARGETS.length);
  for (const target of TARGETS) {
    const now = fs.readFileSync(path.join(root, target.path), 'utf8');
    assert.ok(now.includes('\r\n'), target.path + ' keeps CRLF');
    assert.ok(!/(^|[^\r])\n/.test(now), target.path + ' has no bare LF');
  }
  assert.ok(fs.existsSync(result.backupDir));
  rollbackPack03(root, result.backupDir);
  for (const target of TARGETS) {
    assert.equal(fs.readFileSync(path.join(root, target.path), 'utf8'), before.get(target.path));
  }
});

test('install is idempotent', () => {
  const root = makeRepo();
  const first = installPack03(root);
  const second = installPack03(root);
  assert.equal(first.changed.length, TARGETS.length);
  assert.equal(second.changed.length, 0);
});

test('compatibility rejects missing baseline marker before mutation', () => {
  const root = makeRepo();
  const bad = path.join(root, TARGETS.find(t => t.kind === 'dashboard').path);
  fs.writeFileSync(bad, 'unexpected file', 'utf8');
  const result = checkCompatibility(root);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /dashboard/);
});

test('visual audit passes only after semantic contract is installed', async () => {
  const { auditVisualContract } = await import('../tournament-exp-pack-03-audit-core.mjs');
  const root = makeRepo();
  const before = auditVisualContract(root);
  assert.equal(before.ok, false);
  installPack03(root);
  const after = auditVisualContract(root);
  assert.equal(after.ok, true);
  assert.equal(after.errors.length, 0);
});

test('visual audit rejects unscoped Stable organizer selectors', async () => {
  const { auditVisualContract } = await import('../tournament-exp-pack-03-audit-core.mjs');
  const root = makeRepo();
  installPack03(root);
  const cssPath = path.join(root, 'artifacts/tournament-manager/src/experimental-tournaments.css');
  fs.appendFileSync(cssPath, '\n.organizer-stage-card { transform: none; }\n', 'utf8');
  const result = auditVisualContract(root);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /unscoped organizer-stage-card/);
});

test('visual audit covers entry player projector and dialog polish markers', async () => {
  const { auditVisualContract } = await import('../tournament-exp-pack-03-audit-core.mjs');
  const root = makeRepo();
  installPack03(root);
  const home = path.join(root, TARGETS.find(t => t.kind === 'role-home').path);
  fs.writeFileSync(home, fs.readFileSync(home, 'utf8').replace('experimental-role-home', 'missing-role-home'), 'utf8');
  const result = auditVisualContract(root);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /experimental-role-home/);
});
