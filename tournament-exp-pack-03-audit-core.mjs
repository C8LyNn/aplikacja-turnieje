import fs from 'node:fs';
import path from 'node:path';

const checks = [
  ['artifacts/tournament-manager/src/experimental-tournaments.css', [
    'Pack 03 — Visual Hierarchy & Identity',
    'Pack 03.1 — Full Surface Coverage',
    'Pack 03.2 — Entry, Player & Broadcast Polish',
    '--exp-tone-primary:',
    '--exp-tone-info:',
    '--exp-tone-success:',
    '--exp-tone-warning:',
    '--exp-tone-danger:',
    '--exp-tone-live:',
    '--exp-surface-4:',
    '@media (prefers-reduced-motion: reduce)',
  ]],
  ['artifacts/tournament-manager/src/features/experimental-tournaments/experimental-ui.tsx', [
    'export type ExperimentalTone =',
    'data-exp-tone={tone}',
    'tone?: ExperimentalTone',
  ]],
  ['artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-overview.tsx', [
    'tone="info"',
    'tone="primary"',
    'experimental-lifecycle-step--done',
    'experimental-next-step-panel',
  ]],
  ['artifacts/tournament-manager/src/features/experimental-tournaments/experimental-host-command-center.tsx', [
    'tone="live"',
    'tone="warning"',
    'tone="success"',
  ]],
  ['artifacts/tournament-manager/src/pages/dashboard.tsx', [
    'experimental-dashboard-card--${tournament.status}',
  ]],
  ['artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.tsx', [
    'experimental-create-layout',
    'experimental-create-form-stack',
    'experimental-create-summary-column',
    'experimental-readiness-item',
  ]],
  ['artifacts/tournament-manager/src/pages/tournament-audience.tsx', [
    'experimental-audience-hero',
    'experimental-public-match-card',
    'data-exp-panel-title={title}',
  ]],
  ['artifacts/tournament-manager/src/pages/tournament-bracket.tsx', [
    'experimental-bracket-view',
    'experimental-bracket-header',
    'experimental-bracket-canvas',
  ]],
  ['artifacts/tournament-manager/src/components/tournament-stages-panel.tsx', [
    'data-exp-stage-status={stage.status}',
    'data-exp-stage-status={selected.status}',
    'data-exp-ready={readinessQuery.data?.ready ? "true" : "false"}',
  ]],
  ['artifacts/tournament-manager/src/components/stage-baskets-panel.tsx', [
    'data-exp-basket-type={basket.type}',
    'data-exp-stage-status={stage.status}',
    'data-exp-locked={isLocked ? "true" : "false"}',
  ]],
  ['artifacts/tournament-manager/src/pages/tournament-host.tsx', [
    'data-exp-match-state={isExperimental ? focusedMatch.status : undefined}',
    'experimental-host-match',
  ]],
  ['artifacts/tournament-manager/src/pages/tournaments-home.tsx', [
    'experimental-role-home',
    'data-exp-role={isExperimental ? item.id : undefined}',
  ]],
  ['artifacts/tournament-manager/src/pages/support-entry.tsx', [
    'experimental-support-entry',
    'experimental-support-tournament-card',
    'experimental-support-login-panel',
  ]],
  ['artifacts/tournament-manager/src/pages/fan-view.tsx', [
    'experimental-fan-entry',
    'experimental-fan-card',
    'data-exp-tournament-status={isExperimental ? t.status : undefined}',
  ]],
  ['artifacts/tournament-manager/src/pages/tournament-projector.tsx', [
    'const { id, isExperimental } = useTournamentRoute("projector")',
    'experimental-projector-view',
    'experimental-projector-canvas',
  ]],
  ['artifacts/tournament-manager/src/pages/tournament-create-choice.tsx', [
    'experimental-create-choice-grid',
  ]],
  ['artifacts/tournament-manager/src/pages/tournament-detail.tsx', [
    'data-exp-player-status={isExperimental ? p.status ?? "unknown" : undefined}',
  ]],
  ['artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-checklist.tsx', [
    'experimental-checklist-dialog',
    'data-exp-checked={active ? "true" : "false"}',
  ]],
  ['artifacts/tournament-manager/src/features/experimental-tournaments/experimental-dashboard-dialogs.tsx', [
    'experimental-test-data-dialog',
    'experimental-delete-dialog',
  ]],
  ['artifacts/tournament-manager/src/features/experimental-tournaments/experimental-dashboard-toolbar.tsx', [
    'data-exp-status-filter={status}',
  ]],
  ['artifacts/tournament-manager/src/features/experimental-tournaments/experimental-player-toolbar.tsx', [
    'data-exp-status-filter={status}',
    'data-exp-sort={sort}',
  ]],
];

export function auditVisualContract(root) {
  const errors = [];
  for (const [rel, markers] of checks) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) {
      errors.push(`Brak pliku: ${rel}`);
      continue;
    }
    const text = fs.readFileSync(full, 'utf8');
    for (const marker of markers) {
      if (!text.includes(marker)) errors.push(`${rel}: brak markera ${marker}`);
    }
  }

  const cssPath = path.join(root, 'artifacts/tournament-manager/src/experimental-tournaments.css');
  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8');
    if (/(^|\n)\s*\.organizer-stage-card\s*[,{]/m.test(css)) {
      errors.push('experimental-tournaments.css: unscoped organizer-stage-card selector może wpływać na Stable.');
    }
  }

  const stableCreate = path.join(root, 'artifacts/tournament-manager/src/pages/create-tournament.tsx');
  if (fs.existsSync(stableCreate)) {
    const text = fs.readFileSync(stableCreate, 'utf8');
    if (text.includes('Pack 03 — Visual Hierarchy & Identity') || text.includes('experimental-create-layout')) {
      errors.push('Stable create page zawiera marker Pack 03.');
    }
  }

  return { ok: errors.length === 0, errors };
}
