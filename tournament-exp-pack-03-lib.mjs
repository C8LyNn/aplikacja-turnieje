import fs from 'node:fs';
import path from 'node:path';

export const PACK03_MARKER = 'Pack 03 — Visual Hierarchy & Identity';
export const PACK03_SURFACE_MARKER = 'Pack 03.1 — Full Surface Coverage';
export const PACK03_EXPERIENCE_MARKER = 'Pack 03.2 — Entry, Player & Broadcast Polish';

function replaceRequired(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) {
    throw new Error(`Nie znaleziono markera Pack 03: ${label}`);
  }
  return source.replace(before, after);
}

export function patchCss(source) {
  let out = source;
  if (!out.includes(PACK03_MARKER)) {
    const blockPath = new URL('./templates/pack03-visual-hierarchy.css', import.meta.url);
    const block = fs.readFileSync(blockPath, 'utf8').replace(/^\uFEFF/, '');
    out = `${out.replace(/\s+$/, '')}\n\n${block.trim()}\n`;
  }
  if (!out.includes(PACK03_SURFACE_MARKER)) {
    const coveragePath = new URL('./templates/pack03-surface-coverage.css', import.meta.url);
    const coverage = fs.readFileSync(coveragePath, 'utf8').replace(/^\uFEFF/, '');
    out = `${out.replace(/\s+$/, '')}\n\n${coverage.trim()}\n`;
  }
  if (!out.includes(PACK03_EXPERIENCE_MARKER)) {
    const experiencePath = new URL('./templates/pack03-experience-polish.css', import.meta.url);
    const experience = fs.readFileSync(experiencePath, 'utf8').replace(/^\uFEFF/, '');
    out = `${out.replace(/\s+$/, '')}\n\n${experience.trim()}\n`;
  }
  return out;
}

export function patchExperimentalUi(source) {
  if (source.includes('export type ExperimentalTone =')) return source;
  let out = source;
  out = replaceRequired(
    out,
    'import { Link } from "wouter";\n',
    'import { Link } from "wouter";\n\nexport type ExperimentalTone = "neutral" | "primary" | "info" | "success" | "warning" | "danger" | "live";\n',
    'experimental-ui: tone type',
  );
  out = replaceRequired(out,
`export function ExperimentalMetricCard({
  label,
  value,
  meta,
  icon: Icon,
}: {`,
`export function ExperimentalMetricCard({
  label,
  value,
  meta,
  icon: Icon,
  tone = "neutral",
}: {`, 'experimental-ui: metric destructure');
  out = replaceRequired(out,
`  meta?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="experimental-metric-card rounded-xl border border-border/80 bg-card/55 p-4">`,
`  meta?: ReactNode;
  icon?: LucideIcon;
  tone?: ExperimentalTone;
}) {
  return (
    <div data-exp-tone={tone} className="experimental-metric-card rounded-xl border border-border/80 bg-card/55 p-4">`, 'experimental-ui: metric tone');
  out = replaceRequired(out,
`  tone?: "neutral" | "active" | "success" | "danger";
}) {`,
`  tone?: ExperimentalTone | "active";
}) {`, 'experimental-ui: pill tone type');
  out = replaceRequired(out,
`    <span
      className={\`inline-flex min-h-6`,
`    <span
      data-exp-tone={tone === "active" ? "primary" : tone}
      className={\`inline-flex min-h-6`, 'experimental-ui: pill data tone');
  out = replaceRequired(out,
`  tone?: "neutral" | "danger";
}) {
  return (
    <section
      role={tone === "danger" ? "alert" : undefined}`,
`  tone?: ExperimentalTone;
}) {
  return (
    <section
      data-exp-tone={tone}
      role={tone === "danger" ? "alert" : undefined}`, 'experimental-ui: state tone');
  out = replaceRequired(out,
`export function ExperimentalQuickLink({
  href,
  label,
  description,
  icon: Icon,
}: {`,
`export function ExperimentalQuickLink({
  href,
  label,
  description,
  icon: Icon,
  tone = "neutral",
}: {`, 'experimental-ui: quick link destructure');
  out = replaceRequired(out,
`  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}`,
`  description: string;
  icon: LucideIcon;
  tone?: ExperimentalTone;
}) {
  return (
    <Link
      data-exp-tone={tone}
      href={href}`, 'experimental-ui: quick link tone');
  return out;
}

export function patchOverview(source) {
  if (source.includes('tone="info"') && source.includes('experimental-lifecycle-step--done')) return source;
  let out = source;
  out = replaceRequired(out,
`  const statusTone =
    status === "active"
      ? "active"
      : status === "completed"
        ? "success"
        : "neutral";`,
`  const statusTone =
    status === "active"
      ? "live"
      : status === "completed"
        ? "success"
        : "neutral";`, 'overview: status tone');
  const tones = [
    ['label="Uczestnicy"', 'label="Uczestnicy"\n            tone="info"'],
    ['label="Mecze"', 'label="Mecze"\n            tone="primary"'],
    ['label="Postęp"', 'label="Postęp"\n            tone={status === "completed" ? "success" : "primary"}'],
    ['label="Format"', 'label="Format"\n            tone="info"'],
  ];
  for (const [before, after] of tones) out = replaceRequired(out, before, after, `overview: ${before}`);
  out = replaceRequired(out,
`              className={\`rounded-xl border p-3 \${
                step.done
                  ? "border-primary/25 bg-primary/5"
                  : "border-border/75 bg-background/25"
              }\`}`,
`              className={\`experimental-lifecycle-step rounded-xl border p-3 \${
                step.done
                  ? "experimental-lifecycle-step--done"
                  : "experimental-lifecycle-step--pending"
              }\`}`,
    'overview: lifecycle classes');
  out = replaceRequired(out,
`              <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">`,
`              <div className="experimental-next-step-panel rounded-xl border p-3">`,
    'overview: next step panel');
  return out;
}

export function patchHostCommandCenter(source) {
  if (source.includes('tone="live"') && source.includes('? "warning"')) return source;
  let out = source;
  out = replaceRequired(out,
`  const stateTone =
    dataError
      ? "danger"
      : isCompleted
        ? "success"
        : liveCount > 0 || readyCount > 0
          ? "active"
          : "neutral";`,
`  const stateTone =
    dataError
      ? "danger"
      : isCompleted
        ? "success"
        : liveCount > 0
          ? "live"
          : readyCount > 0
            ? "warning"
            : "neutral";`, 'host command: state tone');
  const tones = [
    ['label="Na żywo"', 'label="Na żywo"\n          tone="live"'],
    ['label="Gotowe"', 'label="Gotowe"\n          tone="warning"'],
    ['label="Zakończone"', 'label="Zakończone"\n          tone="success"'],
    ['label="Pozostałe"', 'label="Pozostałe"\n          tone="neutral"'],
    ['label="Następny krok"', 'label="Następny krok"\n          tone={nextStepTitle ? "primary" : "neutral"}'],
  ];
  for (const [before, after] of tones) out = replaceRequired(out, before, after, `host command: ${before}`);
  return out;
}

export function patchDashboard(source) {
  if (source.includes('experimental-dashboard-card--${tournament.status}')) return source;
  return replaceRequired(
    source,
    'className={`hover:border-primary/50 transition-colors cursor-pointer h-full flex flex-col group ${isExperimental ? "experimental-dashboard-card" : ""}`}',
    'className={`hover:border-primary/50 transition-colors cursor-pointer h-full flex flex-col group ${isExperimental ? `experimental-dashboard-card experimental-dashboard-card--${tournament.status}` : ""}`}',
    'dashboard: status card class',
  );
}

export function patchCreate(source) {
  if (source.includes('experimental-create-action-bar') && source.includes('experimental-readiness-item')) return source;
  let out = source;
  out = replaceRequired(out,
    '<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.85fr)]">',
    '<div className="experimental-create-layout grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.85fr)]">',
    'create: layout');
  out = replaceRequired(out,
    '<div className="space-y-7">',
    '<div className="experimental-create-form-stack space-y-7">',
    'create: form stack');
  out = replaceRequired(out,
    '<div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">',
    '<div className="experimental-create-action-bar flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">',
    'create: action bar');
  out = replaceRequired(out,
    '<div className="space-y-4 lg:sticky lg:top-4 lg:self-start">',
    '<div className="experimental-create-summary-column space-y-4 lg:sticky lg:top-4 lg:self-start">',
    'create: summary column');
  out = replaceRequired(out,
    '<div key={item.label} className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-background/25 px-3 py-2.5">',
    '<div key={item.label} data-ready={item.ready ? "true" : "false"} className="experimental-readiness-item flex items-start gap-2.5 rounded-xl border px-3 py-2.5">',
    'create: readiness item');
  return out;
}

export function patchAudience(source) {
  if (source.includes('experimental-audience-hero') && source.includes('data-exp-panel-title={title}')) return source;
  let out = source;
  out = replaceRequired(out,
    '<div className={`bg-card/80 border rounded-2xl overflow-hidden transition-all duration-500 ${heroCardBorder}`}>',
    '<div data-exp-match-state={heroMatch.status} className={`experimental-audience-hero bg-card/80 border rounded-2xl overflow-hidden transition-all duration-500 ${heroCardBorder}`}>',
    'audience: hero state');
  out = replaceRequired(out,
    '<div key={m.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${',
    '<div key={m.id} data-exp-match-state={m.status} className={`experimental-audience-match-row flex items-center gap-2 px-3 py-2 rounded-lg border ${',
    'audience: live round row');
  out = replaceRequired(out,
    '<section className="w-full max-w-5xl" aria-label={title}>',
    '<section className="experimental-audience-section-shell w-full max-w-5xl" aria-label={title}>',
    'audience: section shell');
  out = replaceRequired(out,
    '<div className="rounded-xl border border-dashed border-white/15 bg-white/3 px-6 py-14 text-center text-sm text-white/40">',
    '<div className="experimental-audience-empty-state rounded-xl border border-dashed border-white/15 bg-white/3 px-6 py-14 text-center text-sm text-white/40">',
    'audience: empty state');
  out = replaceRequired(out,
    '<article key={match.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[8rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl border border-white/8 bg-card px-3 py-2.5 md:px-4">',
    '<article key={match.id} data-exp-match-state={match.status} className="experimental-public-match-card grid min-w-0 grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[8rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl border border-white/8 bg-card px-3 py-2.5 md:px-4">',
    'audience: public match card');
  out = replaceRequired(out,
    '<div key={standing.playerId} className="rounded-xl border border-white/8 bg-card p-4">',
    '<div key={standing.playerId} className="experimental-public-standing-card rounded-xl border border-white/8 bg-card p-4">',
    'audience: standing card');
  out = replaceRequired(out,
    '<article key={player.id} className="rounded-xl border border-white/8 bg-card p-4">',
    '<article key={player.id} className="experimental-public-player-card rounded-xl border border-white/8 bg-card p-4">',
    'audience: player card');
  out = replaceRequired(out,
    '<div className="overflow-x-auto rounded-xl border border-white/8 bg-card p-4 text-foreground">',
    '<div className="experimental-public-bracket-surface overflow-x-auto rounded-xl border border-white/8 bg-card p-4 text-foreground">',
    'audience: bracket surface');
  out = replaceRequired(out,
    '<div className={`bg-card/80 border border-white/8 rounded-xl p-4 ${className}`}>',
    '<div data-exp-panel-title={title} className={`experimental-audience-panel bg-card/80 border border-white/8 rounded-xl p-4 ${className}`}>',
    'audience: panel tone hook');
  return out;
}

export function patchBracket(source) {
  if (source.includes('experimental-bracket-view') && source.includes('experimental-bracket-canvas')) return source;
  let out = source;
  out = replaceRequired(out,
    '${isExperimental ? "experimental-tournament-stage-view" : ""}`} data-theme={presentationSettings.colorPreset || undefined}>',
    '${isExperimental ? "experimental-tournament-stage-view experimental-bracket-view" : ""}`} data-exp-format={isExperimental ? publicStage?.format ?? "unknown" : undefined} data-exp-tournament-status={isExperimental ? tournament.status : undefined} data-theme={presentationSettings.colorPreset || undefined}>',
    'bracket: root hooks');
  out = replaceRequired(out,
    '<div className="flex-none py-5 px-8 flex flex-col items-center justify-center bg-card border-b border-border shadow-md z-10 relative">',
    '<div className="experimental-bracket-header flex-none py-5 px-8 flex flex-col items-center justify-center bg-card border-b border-border shadow-md z-10 relative">',
    'bracket: header');
  out = replaceRequired(out,
    'className="flex-1 min-h-0 min-w-0 w-full overflow-auto"',
    'className="experimental-bracket-canvas flex-1 min-h-0 min-w-0 w-full overflow-auto"',
    'bracket: canvas');
  return out;
}

export function patchStages(source) {
  if (source.includes('data-exp-stage-status={stage.status}') && source.includes('data-exp-ready={readinessQuery.data?.ready ? "true" : "false"}')) return source;
  let out = source;
  out = replaceRequired(out,
    '            aria-pressed={selected}\n            className={`organizer-stage-card',
    '            aria-pressed={selected}\n            data-exp-stage-status={stage.status}\n            className={`organizer-stage-card',
    'stages: navigation status');
  out = replaceRequired(out,
    '<Card className="organizer-stage-detail">',
    '<Card data-exp-stage-status={selected.status} className="organizer-stage-detail">',
    'stages: selected detail status');
  out = replaceRequired(out,
    '{selected.status === "planned" && <div aria-label="Gotowość etapu" className="organizer-readiness rounded-lg border bg-card p-4 space-y-2">',
    '{selected.status === "planned" && <div aria-label="Gotowość etapu" data-exp-ready={readinessQuery.data?.ready ? "true" : "false"} className="organizer-readiness rounded-lg border bg-card p-4 space-y-2">',
    'stages: readiness state');
  return out;
}

export function patchBaskets(source) {
  if (source.includes('data-exp-basket-type={basket.type}') && source.includes('data-exp-locked={isLocked ? "true" : "false"}')) return source;
  let out = source;
  out = replaceRequired(out,
    '    <div\n      className={`organizer-basket rounded-md border px-3 py-2 text-sm space-y-2 ${color.bg} ${color.border} ${borderExtra} transition-all`}',
    '    <div\n      data-exp-basket-type={basket.type}\n      data-exp-locked={isLocked ? "true" : "false"}\n      className={`organizer-basket rounded-md border px-3 py-2 text-sm space-y-2 ${color.bg} ${color.border} ${borderExtra} transition-all`}',
    'baskets: basket type');
  out = replaceRequired(out,
    '    <div\n      className="organizer-flow-stage rounded-lg border bg-card flex flex-col shrink-0"',
    '    <div\n      data-exp-stage-status={stage.status}\n      data-exp-locked={isLocked ? "true" : "false"}\n      className="organizer-flow-stage rounded-lg border bg-card flex flex-col shrink-0"',
    'baskets: stage state');
  out = replaceRequired(out,
    '    <div className="min-w-0 max-w-full space-y-4">',
    '    <div data-exp-locked={isLocked ? "true" : "false"} className="min-w-0 max-w-full space-y-4">',
    'baskets: panel lock state');
  return out;
}

export function patchHostSurface(source) {
  if (source.includes('data-exp-match-state={isExperimental ? focusedMatch.status : undefined}') && source.includes('experimental-host-match')) return source;
  let out = source;
  out = replaceRequired(out,
    '<div onFocusCapture={() => { if (!hostPending && !dataError) setSelectedMatchId(focusedMatch.id); }} onPointerDownCapture={() => { if (!hostPending && !dataError) setSelectedMatchId(focusedMatch.id); }} className={`${isExperimental ? "experimental-host-primary" : ""} rounded-xl border-2 overflow-hidden transition-colors ${',
    '<div data-exp-match-state={isExperimental ? focusedMatch.status : undefined} onFocusCapture={() => { if (!hostPending && !dataError) setSelectedMatchId(focusedMatch.id); }} onPointerDownCapture={() => { if (!hostPending && !dataError) setSelectedMatchId(focusedMatch.id); }} className={`${isExperimental ? "experimental-host-primary" : ""} rounded-xl border-2 overflow-hidden transition-colors ${',
    'host surface: focused match');
  out = replaceRequired(out,
    '<div key={match.id} className={`flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3 ${match.status === "in_progress" ? "border-secondary/60" : ""}`}>',
    '<div key={match.id} data-exp-match-state={isExperimental ? match.status : undefined} className={`flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3 ${isExperimental ? "experimental-host-match" : ""} ${match.status === "in_progress" ? "border-secondary/60" : ""}`}>',
    'host surface: result match');
  return out;
}


export function patchTournamentHome(source) {
  if (source.includes('experimental-role-home') && source.includes('data-exp-role={isExperimental ? item.id : undefined}')) return source;
  let out = source;
  out = replaceRequired(out,
    '<div className={`min-h-screen bg-background px-4 py-12 text-foreground dark ${isExperimental ? "experimental-tournament-entry" : ""}`}>',
    '<div className={`min-h-screen bg-background px-4 py-12 text-foreground dark ${isExperimental ? "experimental-tournament-entry experimental-role-home" : ""}`}>',
    'role home: root');
  out = replaceRequired(out,
    '              onClick={() => selectRole(item)}\n              className={`group relative min-h-56 rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 ${item.cardHover} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isExperimental ? "experimental-entry-card" : ""}`}',
    '              onClick={() => selectRole(item)}\n              data-exp-role={isExperimental ? item.id : undefined}\n              className={`group relative min-h-56 rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 ${item.cardHover} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isExperimental ? "experimental-entry-card" : ""}`}',
    'role home: role hook');
  return out;
}

export function patchSupportEntry(source) {
  if (source.includes('experimental-support-entry') && source.includes('experimental-support-login-panel')) return source;
  let out = source;
  out = replaceRequired(out,
    '<div className={`min-h-screen bg-background text-foreground dark flex flex-col ${isExperimental ? "experimental-tournament-entry" : ""}`}>',
    '<div className={`min-h-screen bg-background text-foreground dark flex flex-col ${isExperimental ? "experimental-tournament-entry experimental-support-entry" : ""}`}>',
    'support entry: root');
  out = replaceRequired(out,
    'className="w-full text-left border border-border rounded-xl p-4 bg-card hover:border-green-500/50 hover:bg-green-500/5 transition-all"',
    'className={`w-full text-left border border-border rounded-xl p-4 bg-card hover:border-green-500/50 hover:bg-green-500/5 transition-all ${isExperimental ? "experimental-support-tournament-card" : ""}`}',
    'support entry: tournament card');
  out = replaceRequired(out,
    '<div className="border border-border rounded-xl p-6 bg-card space-y-5">',
    '<div className={`border border-border rounded-xl p-6 bg-card space-y-5 ${isExperimental ? "experimental-support-login-panel" : ""}`}>',
    'support entry: login panel');
  return out;
}

export function patchFanView(source) {
  if (source.includes('experimental-fan-entry') && source.includes('experimental-fan-card')) return source;
  let out = source;
  out = replaceRequired(out,
    '<div className={`min-h-screen bg-background text-foreground dark flex flex-col ${isExperimental ? "experimental-tournament-entry" : ""}`}>',
    '<div className={`min-h-screen bg-background text-foreground dark flex flex-col ${isExperimental ? "experimental-tournament-entry experimental-fan-entry" : ""}`}>',
    'fan entry: root');
  out = replaceRequired(out,
    '<div className="rounded-xl border border-border bg-card hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer group p-5 flex flex-col gap-3">',
    '<div data-exp-tournament-status={isExperimental ? t.status : undefined} className={`rounded-xl border border-border bg-card hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer group p-5 flex flex-col gap-3 ${isExperimental ? "experimental-fan-card" : ""}`}>',
    'fan entry: tournament card');
  return out;
}

export function patchProjector(source) {
  if (source.includes('experimental-projector-view') && source.includes('experimental-projector-canvas')) return source;
  let out = source;
  out = replaceRequired(out,
    '  const { id } = useTournamentRoute("projector");',
    '  const { id, isExperimental } = useTournamentRoute("projector");',
    'projector: route mode');
  out = replaceRequired(out,
    '    <div style={containerStyle} data-theme={effectiveSettings.colorPreset ?? undefined}>',
    '    <div className={isExperimental ? "experimental-projector-view" : undefined} data-exp-format={isExperimental ? publicStage?.format ?? "unknown" : undefined} data-exp-tournament-status={isExperimental ? tournament.status : undefined} data-exp-preset={isExperimental ? preset : undefined} style={containerStyle} data-theme={effectiveSettings.colorPreset ?? undefined}>',
    'projector: root hooks');
  out = replaceRequired(out,
    '          className="flex flex-col items-center justify-center gap-1 border-b border-white/10"',
    '          className="experimental-projector-header flex flex-col items-center justify-center gap-1 border-b border-white/10"',
    'projector: header');
  out = replaceRequired(out,
`      <div
        style={{
          padding,
          ...(forceAspect ? {} : { transform: \`scale(\${zoom})\`, transformOrigin: "top left" }),
        }}
      >`,
`      <div
        className="experimental-projector-canvas"
        style={{
          padding,
          ...(forceAspect ? {} : { transform: \`scale(\${zoom})\`, transformOrigin: "top left" }),
        }}
      >`,
    'projector: canvas');
  return out;
}

export function patchCreateChoice(source) {
  if (source.includes('experimental-create-choice-grid')) return source;
  return replaceRequired(source,
    '<div className="grid gap-4 md:grid-cols-2">',
    '<div className="experimental-create-choice-grid grid gap-4 md:grid-cols-2">',
    'create choice: grid');
}

export function patchTournamentDetail(source) {
  if (source.includes('data-exp-player-status={isExperimental ? p.status ?? "unknown" : undefined}')) return source;
  return replaceRequired(source,
    '<div key={p.id} className={`flex flex-col border rounded bg-background ${isExperimental ? "experimental-player-row" : ""}`}>',
    '<div key={p.id} data-exp-player-status={isExperimental ? p.status ?? "unknown" : undefined} className={`flex flex-col border rounded bg-background ${isExperimental ? "experimental-player-row" : ""}`}>',
    'tournament detail: player status');
}

export function patchChecklist(source) {
  if (source.includes('experimental-checklist-dialog') && source.includes('data-exp-checked={active ? "true" : "false"}')) return source;
  let out = source;
  out = replaceRequired(out,
    '<DialogContent className="flex max-h-[86vh] max-w-xl flex-col gap-0 p-0">',
    '<DialogContent className="experimental-checklist-dialog flex max-h-[86vh] max-w-xl flex-col gap-0 p-0">',
    'checklist: dialog');
  out = replaceRequired(out,
    '<button key={item.id} type="button" aria-pressed={active} onClick={() => toggle(item.id)}\n                className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${active ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:bg-muted/30"}`}>',
    '<button key={item.id} type="button" aria-pressed={active} data-exp-checked={active ? "true" : "false"} onClick={() => toggle(item.id)}\n                className={`experimental-checklist-item flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${active ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:bg-muted/30"}`}>',
    'checklist: item state');
  return out;
}

export function patchDashboardDialogs(source) {
  if (source.includes('experimental-test-data-dialog') && source.includes('experimental-delete-dialog')) return source;
  let out = source;
  out = replaceRequired(out,
    '<DialogContent className="max-w-md">',
    '<DialogContent className="experimental-test-data-dialog max-w-md">',
    'dashboard dialogs: test data');
  out = replaceRequired(out,
    '<DialogContent className="max-w-md border-destructive/45">',
    '<DialogContent className="experimental-delete-dialog max-w-md border-destructive/45">',
    'dashboard dialogs: delete');
  return out;
}

export function patchDashboardToolbar(source) {
  if (source.includes('data-exp-status-filter={status}')) return source;
  return replaceRequired(source,
    '      aria-label="Filtrowanie turniejów"\n      className="experimental-dashboard-toolbar rounded-xl border border-border/80 bg-card/50 p-3"',
    '      aria-label="Filtrowanie turniejów"\n      data-exp-status-filter={status}\n      className="experimental-dashboard-toolbar rounded-xl border border-border/80 bg-card/50 p-3"',
    'dashboard toolbar: status');
}

export function patchPlayerToolbar(source) {
  if (source.includes('data-exp-status-filter={status}') && source.includes('data-exp-sort={sort}')) return source;
  return replaceRequired(source,
    '<section aria-label="Filtrowanie listy graczy" className="experimental-player-toolbar rounded-xl border border-border/80 bg-card/50 p-3">',
    '<section aria-label="Filtrowanie listy graczy" data-exp-status-filter={status} data-exp-sort={sort} className="experimental-player-toolbar rounded-xl border border-border/80 bg-card/50 p-3">',
    'player toolbar: filter state');
}

export function detectEol(text) {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

export function normalizeLf(text) {
  return text.replace(/\r\n/g, '\n');
}

export function restoreEol(text, eol) {
  return eol === '\r\n' ? text.replace(/\n/g, '\r\n') : text;
}

export function readTextPreserveEol(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return { raw, eol: detectEol(raw), lf: normalizeLf(raw) };
}

export function writePatched(filePath, patcher) {
  const { raw, eol, lf } = readTextPreserveEol(filePath);
  const nextLf = patcher(lf);
  if (nextLf === lf) return { changed: false, before: raw, after: raw };
  const next = restoreEol(nextLf, eol);
  fs.writeFileSync(filePath, next, 'utf8');
  return { changed: true, before: raw, after: next };
}

export function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
export function resolveRepoRoot(start = process.cwd()) {
  let dir = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(dir, 'artifacts', 'tournament-manager', 'src'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error('Nie znaleziono katalogu repozytorium aplikacja-turnieje.');
    dir = parent;
  }
}
