import type {
  EffectSettings,
} from "../../core/types";

export interface ExtraVariant {
  id: string;
  name: string;
  description: string;
  settings:
    Partial<EffectSettings>;
}

const names: Record<
  string,
  readonly [string, string, string, string]
> = {
  fireworks:["Celebration","Night Sky","Finale","Violet Burst"],
  "radar-sweep":["Tactical","Slow Scan","Alert","Deep Space"],
  "warp-speed":["Cruise","Hyperspace","Overdrive","Violet Warp"],
  "hex-pulse":["Soft Shield","Tech Grid","Overcharge","Arcane Hex"],
  "circuit-traces":["Sparse PCB","Data Flow","Dense Board","Corrupted"],
  "light-leaks":["Warm Film","Dreamy","Bright Lens","Violet Leak"],
  "gravity-well":["Calm Orbit","Accretion","Singularity","Violet Well"],
  "pixel-storm":["Sparse Pixels","Digital Rain","Pixel Storm","Glitch Surge"],
};

function make(
  labels:
    readonly [string, string, string, string],
): ExtraVariant[] {
  return [
    { id:"soft", name:labels[0], description:"Spokojniejszy wariant.", settings:{ opacity:48,density:34,speed:62,intensity:55,brightness:110 } },
    { id:"balanced", name:labels[1], description:"Zbalansowany wariant.", settings:{ opacity:72,density:62,speed:95,intensity:78,brightness:125,blendMode:"screen" } },
    { id:"strong", name:labels[2], description:"Mocny i gęsty wariant.", settings:{ opacity:92,density:100,speed:145,intensity:110,brightness:160,blendMode:"screen" } },
    { id:"alt", name:labels[3], description:"Alternatywna wersja kolorystyczna.", settings:{ opacity:82,density:72,speed:105,intensity:90,hue:95,brightness:145,blendMode:"screen" } },
  ];
}

export const pack06ExtraVariantCatalog:
  Record<string, ExtraVariant[]> =
    Object.fromEntries(
      Object.entries(names).map(
        ([effectId, labels]) => [
          effectId,
          make(labels),
        ],
      ),
    );
