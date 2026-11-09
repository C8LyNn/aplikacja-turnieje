import type {
  EffectSettings,
} from "../../core/types";

export interface Pack08Variant {
  id: string;
  name: string;
  description: string;
  settings:
    Partial<EffectSettings>;
}

const names:
  Record<
    string,
    readonly [
      string,
      string,
      string,
      string
    ]
  > = {
    "black-hole-accretion": [
      "Quiet Orbit",
      "Accretion",
      "Collapse",
      "Event Horizon",
    ],
    "orbital-debris": [
      "Sparse Orbit",
      "Debris Belt",
      "Collision Zone",
      "Orbital Storm",
    ],
    "star-tunnel": [
      "Cruise",
      "Star Drive",
      "Hyperspace",
      "Tunnel Overdrive",
    ],
    "energy-lattice": [
      "Soft Mesh",
      "Energy Grid",
      "Dense Lattice",
      "Grid Overdrive",
    ],
    "target-lock": [
      "Recon",
      "Tracking",
      "Combat Lock",
      "Full Lock",
    ],
    "scanner-beams": [
      "Slow Scan",
      "Sweep",
      "Multi Scan",
      "Scanner Overdrive",
    ],
    "digital-fragments": [
      "Sparse Data",
      "Fragmented",
      "Corruption",
      "Hard Break",
    ],
    "pixel-melt": [
      "Light Melt",
      "Digital Drip",
      "Collapse",
      "Pixel Flood",
    ],
    "wireframe-cubes": [
      "Sparse",
      "Wire Space",
      "Cube Field",
      "Wire Storm",
    ],
    "floating-polyhedra": [
      "Facets",
      "Poly Drift",
      "Crystal Field",
      "Poly Storm",
    ],
    "shockwave-rings": [
      "Soft Pulse",
      "Impact",
      "Bombardment",
      "Shock Overdrive",
    ],
    "electric-web": [
      "Static",
      "Electric Net",
      "Arc Web",
      "Voltage Storm",
    ],
    "ribbon-streamers": [
      "Soft Ribbons",
      "Festival",
      "Ribbon Flow",
      "Streamer Storm",
    ],
    "ink-clouds": [
      "Soft Ink",
      "Deep Water",
      "Ink Bloom",
      "Ink Flood",
    ],
  };

function create(
  labels:
    readonly [
      string,
      string,
      string,
      string
    ],
): Pack08Variant[] {
  return [
    {
      id: "soft",
      name: labels[0],
      description:
        "Subtelna wersja do spokojnych scen.",
      settings: {
        opacity: 52,
        density: 42,
        speed: 62,
        intensity: 62,
        brightness: 108,
      },
    },
    {
      id: "balanced",
      name: labels[1],
      description:
        "Zbalansowany wariant bazowy.",
      settings: {
        opacity: 76,
        density: 88,
        speed: 100,
        intensity: 100,
        brightness: 124,
      },
    },
    {
      id: "strong",
      name: labels[2],
      description:
        "Mocny wariant z większą gęstością.",
      settings: {
        opacity: 90,
        density: 180,
        speed: 165,
        intensity: 185,
        brightness: 142,
      },
    },
    {
      id: "overdrive",
      name: labels[3],
      description:
        "Bardzo intensywny preset wykorzystujący rozszerzony zakres.",
      settings: {
        opacity: 96,
        density: 340,
        speed: 320,
        intensity: 340,
        brightness: 160,
      },
    },
  ];
}

export const pack08VariantCatalog:
  Record<
    string,
    Pack08Variant[]
  > =
    Object.fromEntries(
      Object.entries(
        names,
      ).map(
        ([id, labels]) => [
          id,
          create(labels),
        ],
      ),
    );
