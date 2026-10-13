import test from 'node:test';
import assert from 'node:assert/strict';
import {
  patchCss,
  patchExperimentalUi,
  patchOverview,
  patchHostCommandCenter,
  patchDashboard,
  patchCreate,
} from '../tournament-exp-pack-03-lib.mjs';

function lines(...items) { return items.join('\n'); }

test('patchCss adds Pack 03 semantic visual system exactly once', () => {
  const once = patchCss('/* Pack 02 */\n');
  assert.match(once, /Pack 03 — Visual Hierarchy & Identity/);
  assert.match(once, /--exp-tone-warning:/);
  assert.match(once, /--exp-surface-4:/);
  assert.match(once, /prefers-reduced-motion: reduce/);
  assert.equal(patchCss(once), once);
});

test('patchExperimentalUi expands tone API and data markers', () => {
  const source = lines(
    'import { Link } from "wouter";',
    '',
    'export function ExperimentalMetricCard({',
    '  label,',
    '  value,',
    '  meta,',
    '  icon: Icon,',
    '}: {',
    '  label: string;',
    '  value: ReactNode;',
    '  meta?: ReactNode;',
    '  icon?: LucideIcon;',
    '}) {',
    '  return (',
    '    <div className="experimental-metric-card rounded-xl border border-border/80 bg-card/55 p-4">',
    '',
    'export function ExperimentalStatusPill({',
    '  children,',
    '  tone = "neutral",',
    '}: {',
    '  children: ReactNode;',
    '  tone?: "neutral" | "active" | "success" | "danger";',
    '}) {',
    '  const toneClass = "x";',
    '  return (',
    '    <span',
    '      className={`inline-flex min-h-6 ${toneClass}`}',
    '',
    'export function ExperimentalStatePanel({',
    '  title,',
    '  description,',
    '  icon: Icon,',
    '  action,',
    '  tone = "neutral",',
    '}: {',
    '  title: string;',
    '  description: string;',
    '  icon?: LucideIcon;',
    '  action?: ReactNode;',
    '  tone?: "neutral" | "danger";',
    '}) {',
    '  return (',
    '    <section',
    '      role={tone === "danger" ? "alert" : undefined}',
    '',
    'export function ExperimentalQuickLink({',
    '  href,',
    '  label,',
    '  description,',
    '  icon: Icon,',
    '}: {',
    '  href: string;',
    '  label: string;',
    '  description: string;',
    '  icon: LucideIcon;',
    '}) {',
    '  return (',
    '    <Link',
    '      href={href}',
    '      className="experimental-quick-link group"',
  );
  const out = patchExperimentalUi(source);
  assert.match(out, /export type ExperimentalTone =/);
  assert.match(out, /tone\?: ExperimentalTone/);
  assert.match(out, /data-exp-tone=\{tone\}/);
  assert.match(out, /"warning"/);
  assert.match(out, /"live"/);
});

test('patchOverview assigns varied tones while preserving textual status', () => {
  const source = lines(
    '  const statusTone =',
    '    status === "active"',
    '      ? "active"',
    '      : status === "completed"',
    '        ? "success"',
    '        : "neutral";',
    '',
    '<ExperimentalMetricCard',
    '            label="Uczestnicy"',
    '<ExperimentalMetricCard',
    '            label="Mecze"',
    '<ExperimentalMetricCard',
    '            label="Postęp"',
    '<ExperimentalMetricCard',
    '            label="Format"',
    '              className={`rounded-xl border p-3 ${',
    '                step.done',
    '                  ? "border-primary/25 bg-primary/5"',
    '                  : "border-border/75 bg-background/25"',
    '              }`}',
    '              <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">',
    '<ExperimentalStatusPill tone={statusTone}>',
    '            {STATUS_LABELS[status] ?? status}',
    '          </ExperimentalStatusPill>',
  );
  const out = patchOverview(source);
  assert.match(out, /\? "live"/);
  assert.match(out, /label="Uczestnicy"\n            tone="info"/);
  assert.match(out, /label="Mecze"\n            tone="primary"/);
  assert.match(out, /label="Format"\n            tone="info"/);
  assert.match(out, /experimental-lifecycle-step--done/);
  assert.match(out, /experimental-next-step-panel/);
  assert.match(out, /STATUS_LABELS\[status\] \?\? status/);
});

test('patchHostCommandCenter differentiates live ready completed and other metrics', () => {
  const source = lines(
    '  const stateTone =',
    '    dataError',
    '      ? "danger"',
    '      : isCompleted',
    '        ? "success"',
    '        : liveCount > 0 || readyCount > 0',
    '          ? "active"',
    '          : "neutral";',
    '<ExperimentalMetricCard',
    '          label="Na żywo"',
    '<ExperimentalMetricCard',
    '          label="Gotowe"',
    '<ExperimentalMetricCard',
    '          label="Zakończone"',
    '<ExperimentalMetricCard',
    '          label="Pozostałe"',
    '<ExperimentalMetricCard',
    '          label="Następny krok"',
  );
  const out = patchHostCommandCenter(source);
  assert.match(out, /liveCount > 0\n          \? "live"/);
  assert.match(out, /readyCount > 0\n            \? "warning"/);
  assert.match(out, /label="Na żywo"\n          tone="live"/);
  assert.match(out, /label="Gotowe"\n          tone="warning"/);
  assert.match(out, /label="Zakończone"\n          tone="success"/);
});

test('patchDashboard adds Experimental-only status data without changing stable path', () => {
  const source = 'className={`hover:border-primary/50 transition-colors cursor-pointer h-full flex flex-col group ${isExperimental ? "experimental-dashboard-card" : ""}`}';
  const out = patchDashboard(source);
  assert.match(out, /experimental-dashboard-card experimental-dashboard-card--\$\{tournament\.status\}/);
  assert.match(out, /isExperimental \?/);
});

test('patchCreate adds visual hooks without touching payload construction', () => {
  const source = lines(
    '<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.85fr)]">',
    '<div className="space-y-7">',
    '<div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">',
    '<div className="space-y-4 lg:sticky lg:top-4 lg:self-start">',
    '<div key={item.label} className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-background/25 px-3 py-2.5">',
    'const payload: TournamentInput = {',
  );
  const out = patchCreate(source);
  assert.match(out, /experimental-create-form-stack/);
  assert.match(out, /experimental-create-action-bar/);
  assert.match(out, /experimental-create-summary-column/);
  assert.match(out, /experimental-readiness-item/);
  assert.match(out, /const payload: TournamentInput = \{/);
});
