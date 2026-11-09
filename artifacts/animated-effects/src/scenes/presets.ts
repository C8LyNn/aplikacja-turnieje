import type { EffectSettings } from "../core/types";
export interface ScenePreset { id:string; name:string; effects:Array<{effectId:string;settings?:Partial<EffectSettings>}>; }
export const pack06ScenePresets: ScenePreset[] = [
  { id:"cyber-rain", name:"Cyber Rain", effects:[{effectId:"rainfall",settings:{hue:80,density:70,speed:125,blendMode:"screen"}},{effectId:"data-nodes",settings:{opacity:48,density:42}},{effectId:"hologram-scan",settings:{opacity:32}}] },
  { id:"winter-night", name:"Winter Night", effects:[{effectId:"snow",settings:{density:65,speed:62}},{effectId:"starfield",settings:{opacity:46,density:48}},{effectId:"fog",settings:{opacity:28,y:25}}] },
  { id:"arcane-ritual", name:"Arcane Ritual", effects:[{effectId:"magic-circle"},{effectId:"floating-symbols"},{effectId:"fractal-rings",settings:{opacity:42}}] },
  { id:"retro-crt", name:"Retro CRT", effects:[{effectId:"scanlines-plus"},{effectId:"vhs-static",settings:{opacity:34}},{effectId:"recursive-squares",settings:{opacity:30,hue:95}}] },
  { id:"cosmic-drift", name:"Cosmic Drift", effects:[{effectId:"spiral-galaxy"},{effectId:"meteor-shower",settings:{opacity:55}},{effectId:"orbiting-core",settings:{opacity:45}}] },
  { id:"ember-forge", name:"Ember Forge", effects:[{effectId:"embers"},{effectId:"sparks",settings:{opacity:58}},{effectId:"gears",settings:{opacity:35}}] },
  { id:"neon-city", name:"Neon City", effects:[{effectId:"city-lights"},{effectId:"traffic-trails"},{effectId:"neon-tunnel",settings:{opacity:28}}] },
  { id:"calm-ambient", name:"Calm Ambient", effects:[{effectId:"dust-motes",settings:{opacity:32}},{effectId:"liquid-blobs",settings:{opacity:28,speed:35}},{effectId:"starfield",settings:{opacity:24}}] },
];
