import type { EffectSettings } from "../../core/types";

export interface Pack06EffectVariant {
  id: string;
  name: string;
  description: string;
  settings: Partial<EffectSettings>;
}

const names: Record<string, readonly [string, string, string, string]> = {
  "wireframe-cube": ["Minimal","Neon","Heavy Grid","Glitch Cube"],
  "polyhedron": ["Quiet Facets","Prism","Crystal Storm","Void Poly"],
  "orbiting-core": ["Ambient","Reactor","Overdrive","Alien Core"],
  "neon-tunnel": ["Slow Drive","Synthwave","Hyperspace","Dense Grid"],
  "fractal-rings": ["Soft Rings","Recursive","Pulse Stack","Violet Fractal"],
  "particle-vortex": ["Gentle Spiral","Maelstrom","Energy Core","Wide Orbit"],
  "liquid-blobs": ["Calm Fluid","Lava Lamp","Reactive","Alien Goo"],
  "cell-division": ["Calm Colony","Rapid Growth","Microscope","Alien Cells"],
  "growing-vines": ["Sprout","Garden","Wild Growth","Arcane Vine"],
  "constellation-network": ["Sparse Sky","Constellation","Dense Network","Cyber Stars"],
  "shockwave-bursts": ["Soft Pulse","Impact","Bombardment","Violet Wave"],
  "data-nodes": ["Sparse","Tactical","Dense Mesh","Corrupted"],
  "spiral-galaxy": ["Distant","Milky","Starburst","Alien Galaxy"],
  "recursive-squares": ["Minimal","Infinite","Fast Zoom","Synth Grid"],
  "dna-helix": ["Scientific","Neon DNA","Dense Helix","Mutant"],
  "floating-cubes": ["Sparse","Matrix","Cube Storm","Violet Space"],
};

function createVariants(labels: readonly [string, string, string, string]): Pack06EffectVariant[] {
  return [
    { id:"soft", name:labels[0], description:"Subtelniejszy i spokojniejszy wariant.", settings:{ opacity:48, density:28, speed:55, intensity:55, scale:90, brightness:105 } },
    { id:"classic", name:labels[1], description:"Zbalansowana wersja efektu.", settings:{ opacity:74, density:58, speed:90, intensity:78, scale:100, brightness:125, blendMode:"screen" } },
    { id:"intense", name:labels[2], description:"Gęstszy, szybszy i mocniejszy wariant.", settings:{ opacity:92, density:100, speed:155, intensity:100, scale:110, brightness:160, blendMode:"screen" } },
    { id:"alt", name:labels[3], description:"Alternatywna wersja kolorystyczna.", settings:{ opacity:82, density:68, speed:105, intensity:86, scale:105, hue:95, brightness:150, blendMode:"screen" } },
  ];
}

export const pack06EffectVariantCatalog: Record<string, Pack06EffectVariant[]> =
  Object.fromEntries(Object.entries(names).map(([effectId, labels]) => [effectId, createVariants(labels)]));
