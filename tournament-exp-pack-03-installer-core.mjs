import fs from 'node:fs';
import path from 'node:path';
import {
  patchCss,
  patchExperimentalUi,
  patchOverview,
  patchHostCommandCenter,
  patchDashboard,
  patchCreate,
  patchAudience,
  patchBracket,
  patchStages,
  patchBaskets,
  patchHostSurface,
  patchTournamentHome,
  patchSupportEntry,
  patchFanView,
  patchProjector,
  patchCreateChoice,
  patchTournamentDetail,
  patchChecklist,
  patchDashboardDialogs,
  patchDashboardToolbar,
  patchPlayerToolbar,
  readTextPreserveEol,
  restoreEol,
  ensureDir,
} from './tournament-exp-pack-03-lib.mjs';

export const TARGETS = [
  {
    kind: 'css',
    path: 'artifacts/tournament-manager/src/experimental-tournaments.css',
    markers: ['Pack 02 audited — full experimental tournament frontend', 'Pack 03 — Visual Hierarchy & Identity'],
    patcher: patchCss,
  },
  {
    kind: 'ui',
    path: 'artifacts/tournament-manager/src/features/experimental-tournaments/experimental-ui.tsx',
    markers: ['export function ExperimentalStatusPill', 'export type ExperimentalTone ='],
    patcher: patchExperimentalUi,
  },
  {
    kind: 'overview',
    path: 'artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-overview.tsx',
    markers: ['const statusTone =', 'experimental-lifecycle-step--done'],
    patcher: patchOverview,
  },
  {
    kind: 'host',
    path: 'artifacts/tournament-manager/src/features/experimental-tournaments/experimental-host-command-center.tsx',
    markers: ['const stateTone =', 'tone="live"'],
    patcher: patchHostCommandCenter,
  },
  {
    kind: 'dashboard',
    path: 'artifacts/tournament-manager/src/pages/dashboard.tsx',
    markers: ['experimental-dashboard-card', 'experimental-dashboard-card--${tournament.status}'],
    patcher: patchDashboard,
  },
  {
    kind: 'create',
    path: 'artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.tsx',
    markers: ['lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.85fr)]', 'experimental-create-layout'],
    patcher: patchCreate,
  },
  {
    kind: 'audience',
    path: 'artifacts/tournament-manager/src/pages/tournament-audience.tsx',
    markers: ['experimental-tournament-public', 'experimental-audience-hero'],
    patcher: patchAudience,
  },
  {
    kind: 'bracket',
    path: 'artifacts/tournament-manager/src/pages/tournament-bracket.tsx',
    markers: ['experimental-tournament-stage-view', 'experimental-bracket-view'],
    patcher: patchBracket,
  },
  {
    kind: 'stages',
    path: 'artifacts/tournament-manager/src/components/tournament-stages-panel.tsx',
    markers: ['organizer-stage-card', 'data-exp-stage-status={stage.status}'],
    patcher: patchStages,
  },
  {
    kind: 'baskets',
    path: 'artifacts/tournament-manager/src/components/stage-baskets-panel.tsx',
    markers: ['organizer-basket', 'data-exp-basket-type={basket.type}'],
    patcher: patchBaskets,
  },
  {
    kind: 'host-surface',
    path: 'artifacts/tournament-manager/src/pages/tournament-host.tsx',
    markers: ['experimental-host-primary', 'data-exp-match-state={isExperimental ? focusedMatch.status : undefined}'],
    patcher: patchHostSurface,
  },
  {
    kind: 'role-home',
    path: 'artifacts/tournament-manager/src/pages/tournaments-home.tsx',
    markers: ['experimental-tournament-entry', 'experimental-role-home'],
    patcher: patchTournamentHome,
  },
  {
    kind: 'support-entry',
    path: 'artifacts/tournament-manager/src/pages/support-entry.tsx',
    markers: ['experimental-tournament-entry', 'experimental-support-entry'],
    patcher: patchSupportEntry,
  },
  {
    kind: 'fan-entry',
    path: 'artifacts/tournament-manager/src/pages/fan-view.tsx',
    markers: ['experimental-tournament-entry', 'experimental-fan-entry'],
    patcher: patchFanView,
  },
  {
    kind: 'projector',
    path: 'artifacts/tournament-manager/src/pages/tournament-projector.tsx',
    markers: ['const { id } = useTournamentRoute("projector");', 'experimental-projector-view'],
    patcher: patchProjector,
  },
  {
    kind: 'create-choice',
    path: 'artifacts/tournament-manager/src/pages/tournament-create-choice.tsx',
    markers: ['<div className="grid gap-4 md:grid-cols-2">', 'experimental-create-choice-grid'],
    patcher: patchCreateChoice,
  },
  {
    kind: 'detail-player-status',
    path: 'artifacts/tournament-manager/src/pages/tournament-detail.tsx',
    markers: ['experimental-player-row', 'data-exp-player-status={isExperimental ? p.status ?? "unknown" : undefined}'],
    patcher: patchTournamentDetail,
  },
  {
    kind: 'checklist',
    path: 'artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-checklist.tsx',
    markers: ['Checklista wydarzenia', 'experimental-checklist-dialog'],
    patcher: patchChecklist,
  },
  {
    kind: 'dashboard-dialogs',
    path: 'artifacts/tournament-manager/src/features/experimental-tournaments/experimental-dashboard-dialogs.tsx',
    markers: ['ExperimentalTestDataDialog', 'experimental-test-data-dialog'],
    patcher: patchDashboardDialogs,
  },
  {
    kind: 'dashboard-toolbar',
    path: 'artifacts/tournament-manager/src/features/experimental-tournaments/experimental-dashboard-toolbar.tsx',
    markers: ['experimental-dashboard-toolbar', 'data-exp-status-filter={status}'],
    patcher: patchDashboardToolbar,
  },
  {
    kind: 'player-toolbar',
    path: 'artifacts/tournament-manager/src/features/experimental-tournaments/experimental-player-toolbar.tsx',
    markers: ['experimental-player-toolbar', 'data-exp-sort={sort}'],
    patcher: patchPlayerToolbar,
  },
];

function hasAnyMarker(text, markers) {
  return markers.some((marker) => text.includes(marker));
}

export function checkCompatibility(root) {
  const errors = [];
  const targets = [];
  for (const target of TARGETS) {
    const full = path.join(root, target.path);
    if (!fs.existsSync(full)) {
      errors.push(`${target.kind}: brak pliku ${target.path}`);
      continue;
    }
    const text = fs.readFileSync(full, 'utf8');
    if (!hasAnyMarker(text, target.markers)) {
      errors.push(`${target.kind}: plik nie pasuje do baseline Pack 02/03 (${target.path})`);
      continue;
    }
    targets.push({ kind: target.kind, path: target.path });
  }
  return { ok: errors.length === 0, errors, targets };
}

function makeBackupDir(root) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(root, `.tournament-exp-pack-03-backup-${stamp}-${process.pid}`);
}

function copyTargetToBackup(root, backupDir, rel) {
  const src = path.join(root, rel);
  const dst = path.join(backupDir, rel);
  ensureDir(path.dirname(dst));
  fs.copyFileSync(src, dst);
}

export function installPack03(root) {
  const compatibility = checkCompatibility(root);
  if (!compatibility.ok) {
    throw new Error(`Pack 03 CHECK FAIL\n${compatibility.errors.join('\n')}`);
  }

  const prepared = [];
  for (const target of TARGETS) {
    const full = path.join(root, target.path);
    const { raw, eol, lf } = readTextPreserveEol(full);
    const nextLf = target.patcher(lf);
    const next = restoreEol(nextLf, eol);
    prepared.push({ target, full, raw, next, changed: next !== raw });
  }

  const changed = prepared.filter((item) => item.changed);
  if (changed.length === 0) {
    return { changed: [], backupDir: null, alreadyInstalled: true };
  }

  const backupDir = makeBackupDir(root);
  ensureDir(backupDir);
  const manifest = {
    pack: '03-visual-hierarchy',
    createdAt: new Date().toISOString(),
    files: changed.map((item) => item.target.path),
  };

  for (const item of changed) copyTargetToBackup(root, backupDir, item.target.path);
  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  try {
    for (const item of changed) fs.writeFileSync(item.full, item.next, 'utf8');
  } catch (error) {
    rollbackPack03(root, backupDir);
    throw error;
  }

  return { changed: changed.map((item) => item.target.path), backupDir, alreadyInstalled: false };
}

export function rollbackPack03(root, backupDir) {
  if (!backupDir || !fs.existsSync(backupDir)) {
    throw new Error('Nie znaleziono katalogu backupu Pack 03.');
  }
  const manifestPath = path.join(backupDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Backup Pack 03 nie zawiera manifest.json.');
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!Array.isArray(manifest.files)) throw new Error('Nieprawidłowy manifest backupu Pack 03.');
  for (const rel of manifest.files) {
    const src = path.join(backupDir, rel);
    const dst = path.join(root, rel);
    if (!fs.existsSync(src)) throw new Error(`Brak pliku backupu: ${rel}`);
    ensureDir(path.dirname(dst));
    fs.copyFileSync(src, dst);
  }
  return { restored: [...manifest.files] };
}

export function findLatestBackup(root) {
  const names = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('.tournament-exp-pack-03-backup-'))
    .map((entry) => entry.name)
    .sort();
  return names.length ? path.join(root, names[names.length - 1]) : null;
}
