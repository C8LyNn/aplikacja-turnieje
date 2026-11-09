import type { EffectSettings } from "../../core/types";

export interface Pack07EffectVariant {
  id: string;
  name: string;
  description: string;
  settings: Partial<EffectSettings>;
}

function createVariants(theme: readonly [string, string, string, string]): Pack07EffectVariant[] {
  return [
    {
      id: "soft",
      name: theme[0],
      description: "Subtelniejsza, czytelna wersja efektu.",
      settings: { opacity: 52, density: 48, speed: 72, intensity: 72, scale: 90, brightness: 108 },
    },
    {
      id: "balanced",
      name: theme[1],
      description: "Zbalansowany wariant do codziennego użycia.",
      settings: { opacity: 74, density: 84, speed: 100, intensity: 100, scale: 100, brightness: 122 },
    },
    {
      id: "intense",
      name: theme[2],
      description: "Dużo mocniejszy, gęstszy i szybszy wariant.",
      settings: { opacity: 88, density: 165, speed: 165, intensity: 180, scale: 112, brightness: 140 },
    },
    {
      id: "overdrive",
      name: theme[3],
      description: "Wariant overdrive z gotowymi presetami bardzo wysokiej intensywności.",
      settings: { opacity: 96, density: 320, speed: 320, intensity: 320, scale: 126, brightness: 155 },
    },
  ];
}

const names: Record<string, readonly [string, string, string, string]> = {
  "gears": ["Workshop", "Machinery", "Forge Rush", "Titan Drive"],
  "comets": ["Sparse Sky", "Night Flight", "Meteor Rain", "Hyper Trail"],
  "fireworks": ["Celebration", "Festival", "Grand Finale", "Sky Overdrive"],
  "lightning-storm": ["Far Storm", "Tempest", "Voltage", "Cataclysm"],
  "liquid-blobs": ["Calm Fluid", "Reactive", "Mutagen", "Meta Flood"],
  "particle-vortex": ["Gentle Spiral", "Cyclone", "Maelstrom", "Singularity"],
  "portal-rings": ["Gateway", "Transit", "Quantum Gate", "Dimensional Breach"],
  "radar-sweep": ["Recon", "Tracking", "Combat Scan", "Full Spectrum"],
  "glitch-blocks": ["Signal Noise", "Decode", "Corruption", "Hard Desync"],
  "gravity-well": ["Orbit", "Collapse", "Accretion", "Event Horizon"],
  "hex-grid": ["Mesh", "Shield", "Pulse", "Lattice Storm"],
  "floating-cubes": ["Low Orbit", "Voxel Drift", "Cube Field", "Cube Storm"],
  "prism-drift": ["Glass", "Iridescent", "Crystal Bloom", "Prism Swarm"],
  "neon-shards": ["Trail", "Fragments", "Rift", "Shatter Burst"],
  "plasma-storm": ["Spark", "Flow", "Flux", "Overcharge"],
  "cube-swarm": ["Scout", "Formation", "Cloud", "Voxel Torrent"],
};

export const pack07OverdriveVariantCatalog: Record<string, Pack07EffectVariant[]> = Object.fromEntries(
  Object.entries(names).map(([id, labels]) => [id, createVariants(labels)]),
);
