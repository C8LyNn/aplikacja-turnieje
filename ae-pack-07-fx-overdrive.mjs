import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const here = path.dirname(fileURLToPath(import.meta.url));
const packName = 'Animated Effects Pack 07 - FX Overdrive';

function fail(message) {
  console.error('\nERROR:', message);
  process.exit(1);
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function write(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data, 'utf8');
}

if (!fs.existsSync(path.join(root, 'pnpm-workspace.yaml'))) {
  fail('Uruchom z głównego katalogu aplikacja-turnieje-live.');
}

const required = [
  'artifacts/animated-effects/src/style.css',
  'artifacts/animated-effects/src/effects/registry.ts',
  'artifacts/animated-effects/src/effects/variants.ts',
  'artifacts/animated-effects/src/effects/effectModules.ts',
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) {
    fail('Brak wymaganego pliku: ' + rel);
  }
}

const stylePath = path.join(root, 'artifacts/animated-effects/src/style.css');
const styleSource = read(stylePath);
if (styleSource.includes('AE_PACK_07_START')) {
  console.log('Pack 07 FX Overdrive jest już zainstalowany.');
  process.exit(0);
}

const moduleSourcePath = path.join(here, 'pack07Overdrive.ts');
const variantsSourcePath = path.join(here, 'pack07OverdriveVariants.ts');
if (!fs.existsSync(moduleSourcePath) || !fs.existsSync(variantsSourcePath)) {
  fail('Brakuje plików źródłowych paczki obok instalatora.');
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '');
const backupRoot = path.join(root, '.ae-pack-backup', `pack-07-fx-overdrive-${stamp}`);
const touched = [
  'artifacts/animated-effects/src/style.css',
  'artifacts/animated-effects/src/effects/registry.ts',
  'artifacts/animated-effects/src/effects/variants.ts',
  'artifacts/animated-effects/src/effects/modules/pack07Overdrive.ts',
  'artifacts/animated-effects/src/effects/modules/pack07OverdriveVariants.ts',
  'artifacts/animated-effects/AE_PACK_07.json',
];

const existed = [];
for (const rel of touched) {
  const source = path.join(root, rel);
  if (!fs.existsSync(source)) continue;
  existed.push(rel);
  const target = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}
fs.mkdirSync(backupRoot, { recursive: true });
write(path.join(backupRoot, 'backup-manifest.json'), JSON.stringify({ touched, existed, packName }, null, 2) + '\n');

const moduleTarget = path.join(root, 'artifacts/animated-effects/src/effects/modules/pack07Overdrive.ts');
const variantsTarget = path.join(root, 'artifacts/animated-effects/src/effects/modules/pack07OverdriveVariants.ts');
fs.mkdirSync(path.dirname(moduleTarget), { recursive: true });
fs.copyFileSync(moduleSourcePath, moduleTarget);
fs.copyFileSync(variantsSourcePath, variantsTarget);

const registryPath = path.join(root, 'artifacts/animated-effects/src/effects/registry.ts');
let registry = read(registryPath);
if (!registry.includes('pack07OverdriveEffectModules')) {
  const importAnchors = [
    /(import\s*\{\s*pack06ExtraEffectModules\s*,?\s*\}\s*from\s*["']\.\/modules\/pack06Extra["']\s*;?)/m,
    /(import\s*\{\s*pack06EffectModules\s*,?\s*\}\s*from\s*["']\.\/modules\/pack06["']\s*;?)/m,
    /(import\s*\{\s*effectModules\s*,\s*type EffectModule\s*\}\s*from\s*["']\.\/effectModules["']\s*;?)/m,
  ];
  let imported = false;
  for (const pattern of importAnchors) {
    const match = registry.match(pattern);
    if (!match) continue;
    registry = registry.replace(pattern, `${match[0]}\nimport {\n  pack07OverdriveEffectModules,\n} from "./modules/pack07Overdrive";`);
    imported = true;
    break;
  }
  if (!imported) fail('Nie znaleziono miejsca na import pack07OverdriveEffectModules w registry.ts.');

  const allPattern = /const\s+allEffectModules\s*:\s*EffectModule\[\]\s*=\s*\[([\s\S]*?)\];/m;
  const allMatch = registry.match(allPattern);
  if (!allMatch) fail('Nie znaleziono allEffectModules w registry.ts.');
  if (!allMatch[1].includes('pack07OverdriveEffectModules')) {
    registry = registry.replace(allPattern, (full, inner) => {
      const trimmed = inner.trim().replace(/,\s*$/, '');
      return `const allEffectModules: EffectModule[] = [${trimmed},\n  ...pack07OverdriveEffectModules,\n];`;
    });
  }
  write(registryPath, registry);
}

const variantsPath = path.join(root, 'artifacts/animated-effects/src/effects/variants.ts');
let variants = read(variantsPath);
if (!variants.includes('pack07OverdriveVariantCatalog')) {
  const importAnchors = [
    /(import\s*\{\s*pack06ExtraVariantCatalog\s*,?\s*\}\s*from\s*["']\.\/modules\/pack06ExtraVariants["']\s*;?)/m,
    /(import\s*\{\s*pack06EffectVariantCatalog\s*,?\s*\}\s*from\s*["']\.\/modules\/pack06Variants["']\s*;?)/m,
    /(import\s*type\s*\{\s*EffectSettings\s*\}\s*from\s*["']\.\.\/core\/types["']\s*;?)/m,
  ];
  let imported = false;
  for (const pattern of importAnchors) {
    const match = variants.match(pattern);
    if (!match) continue;
    variants = variants.replace(pattern, `${match[0]}\nimport {\n  pack07OverdriveVariantCatalog,\n} from "./modules/pack07OverdriveVariants";`);
    imported = true;
    break;
  }
  if (!imported) fail('Nie znaleziono miejsca na import pack07OverdriveVariantCatalog w variants.ts.');

  const replacements = [
    {
      pattern: /return\s+pack06ExtraVariantCatalog\[effectId\]\s*\?\?\s*pack06EffectVariantCatalog\[effectId\]\s*\?\?\s*effectVariantCatalog\[effectId\]\s*\?\?\s*\[\]\s*;/m,
      value: 'return pack07OverdriveVariantCatalog[effectId] ?? pack06ExtraVariantCatalog[effectId] ?? pack06EffectVariantCatalog[effectId] ?? effectVariantCatalog[effectId] ?? [];',
    },
    {
      pattern: /return\s+pack06EffectVariantCatalog\[effectId\]\s*\?\?\s*effectVariantCatalog\[effectId\]\s*\?\?\s*\[\]\s*;/m,
      value: 'return pack07OverdriveVariantCatalog[effectId] ?? pack06EffectVariantCatalog[effectId] ?? effectVariantCatalog[effectId] ?? [];',
    },
    {
      pattern: /return\s+effectVariantCatalog\[effectId\]\s*\?\?\s*\[\]\s*;/m,
      value: 'return pack07OverdriveVariantCatalog[effectId] ?? effectVariantCatalog[effectId] ?? [];',
    },
  ];
  let replaced = false;
  for (const item of replacements) {
    if (item.pattern.test(variants)) {
      variants = variants.replace(item.pattern, item.value);
      replaced = true;
      break;
    }
  }
  if (!replaced) fail('Nie znaleziono return getEffectVariants() w variants.ts.');
  write(variantsPath, variants);
}

const pack07Css = `
/* === AE_PACK_07_START === */
.ae-toolbar,.ae-topbar,.ae-header-actions{row-gap:8px}
.ae-effect-library-toolbar,.ae-library-toolbar{display:grid;grid-template-columns:minmax(0,1.2fr) repeat(3,minmax(110px,1fr));gap:8px}
.ae-effect-library-toolbar > *, .ae-library-toolbar > *{min-width:0}
.ae-effect-card,.ae-library-card{border-radius:14px;transition:border-color .16s ease, transform .16s ease, box-shadow .16s ease}
.ae-effect-card:hover,.ae-library-card:hover{transform:translateY(-1px);box-shadow:0 10px 26px rgba(0,0,0,.18)}
.ae-effect-card .ae-add-icon,.ae-effect-card .ae-pack06-minus,.ae-effect-card .ae-pack06-count{height:42px;border-radius:11px}
.ae-effect-card strong,.ae-library-card strong{letter-spacing:.01em}
.ae-inspector > section,.ae-panel--inspector > section,.ae-settings-panel > section{border-radius:16px;background:linear-gradient(180deg,rgba(27,35,53,.96),rgba(18,24,38,.94));box-shadow:inset 0 0 0 1px rgba(168,140,255,.14)}
.ae-inspector h3,.ae-inspector h4,.ae-settings-panel h3,.ae-settings-panel h4{letter-spacing:.01em}
.ae-preview,.effect-preview{box-shadow:inset 0 0 0 1px rgba(120,165,255,.14),0 18px 40px rgba(0,0,0,.18)}
.ae-media-export .ae-media-grid label{gap:6px;font-size:12px}
.ae-media-export .ae-media-section{background:linear-gradient(180deg,rgba(19,26,38,.94),rgba(14,20,31,.95));padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,.06)}
.ae-media-export .ae-media-actions{margin-top:10px}
.ae-media-export button{min-height:42px;border-radius:11px}
.ae-png-gif-modal .ae-gif-preview,.ae-gif-preview{border:1px solid rgba(255,255,255,.08)}
@media (max-width: 1320px){
  .ae-effect-library-toolbar,.ae-library-toolbar{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width: 980px){
  .ae-effect-library-toolbar,.ae-library-toolbar{grid-template-columns:minmax(0,1fr)}
}
/* === AE_PACK_07_END === */
`.trim();
write(stylePath, styleSource.trimEnd() + '\n\n' + pack07Css + '\n');

const manifest = {
  pack: packName,
  installedAt: new Date().toISOString(),
  backup: path.relative(root, backupRoot),
  features: [
    'Overrides and improves: gears, comets, fireworks, lightning-storm, liquid-blobs, particle-vortex, portal-rings, radar-sweep, glitch-blocks, gravity-well, hex-grid, floating-cubes',
    'Adds: prism-drift, neon-shards, plasma-storm, cube-swarm',
    'Adds Overdrive variants with ready presets up to 320% for density/speed/intensity',
    'Appends UI polish CSS for cards, inspector, preview and export modal',
  ],
};
write(path.join(root, 'artifacts/animated-effects/AE_PACK_07.json'), JSON.stringify(manifest, null, 2) + '\n');

const rollbackPath = path.join(root, 'ae-pack-07-fx-overdrive-rollback.mjs');
const rollbackSource = `import fs from "node:fs";\nimport path from "node:path";\nconst root = process.cwd();\nconst backupRoot = ${JSON.stringify(backupRoot)};\nconst manifestPath = path.join(backupRoot, "backup-manifest.json");\nif (!fs.existsSync(manifestPath)) { console.error("Brak backupu:", manifestPath); process.exit(1); }\nconst manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));\nconst existed = new Set(manifest.existed);\nfor (const rel of manifest.touched) {\n  const target = path.join(root, rel);\n  const backup = path.join(backupRoot, rel);\n  if (existed.has(rel)) {\n    if (!fs.existsSync(backup)) { console.error("Brak pliku backupu:", rel); process.exit(1); }\n    fs.mkdirSync(path.dirname(target), { recursive: true });\n    fs.copyFileSync(backup, target);\n  } else {\n    fs.rmSync(target, { recursive: true, force: true });\n  }\n}\nconsole.log("Pack 07 FX Overdrive cofnięty.");\n`;
write(rollbackPath, rollbackSource);

console.log('\n====================================================');
console.log(' Animated Effects Pack 07 - FX Overdrive INSTALLED');
console.log('====================================================');
console.log('Backup:', path.relative(root, backupRoot));
console.log('Rollback: .\\ae-pack-07-fx-overdrive-rollback.mjs');
console.log('\nPotem uruchom:');
console.log('  pnpm --filter animated-effects run typecheck');
console.log('  pnpm --filter animated-effects run build');
console.log('  $env:PORT="5173"');
console.log('  $env:BASE_PATH="/"');
console.log('  pnpm --filter "@workspace/tournament-manager" run dev');
console.log('\nUwaga: warianty Overdrive mają gotowe presety do 320%.');
