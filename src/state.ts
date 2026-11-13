import { ENGINES } from './gl/engines';
import { PALETTES, randomPalette } from './palettes';

export interface ParamDef { label: string; min: number; max: number; step: number; def: number; }
export interface ToggleDef { label: string; def: boolean; }

/** Every numeric knob. Each becomes a `u_<key>` float uniform in every shader pass. */
export const PARAMS = {
  // engine mix
  morph:     { label: 'A ⇄ B amount', min: 0, max: 1, step: 0.01, def: 0.5 },
  // shared geometry knobs (meaning depends on the engine)
  sym:       { label: 'Symmetry order', min: 3, max: 24, step: 1, def: 7 },
  q:         { label: 'Secondary order q', min: 3, max: 8, step: 1, def: 3 },
  depth:     { label: 'Recursion depth', min: 2, max: 16, step: 1, def: 12 },
  freq:      { label: 'Detail frequency', min: 1, max: 30, step: 0.1, def: 11.25 },
  tension:   { label: 'Tension / twist', min: 0, max: 5, step: 0.01, def: 1 },
  shape:     { label: 'Shape', min: 0, max: 4, step: 0.01, def: 1.38 },
  grit:      { label: 'Biomineral grit (1 = raw sparkle)', min: 0, max: 1, step: 0.01, def: 0.3 },
  // view
  zoom:      { label: 'Zoom', min: 0.2, max: 6, step: 0.01, def: 0.74 },
  rot:       { label: 'Rotation', min: -3.142, max: 3.142, step: 0.01, def: 0 },
  speed:     { label: 'Morphogenesis speed', min: 0, max: 3, step: 0.01, def: 0.6 },
  // warps
  mobius:    { label: 'Amount', min: 0, max: 3, step: 0.01, def: 1 },
  kaleido:   { label: 'Sectors', min: 2, max: 24, step: 1, def: 6 },
  tunnel:    { label: 'Depth scale', min: 0.3, max: 3, step: 0.01, def: 1 },
  liquid:    { label: 'Amount', min: 0, max: 2, step: 0.01, def: 0.6 },
  vhs:       { label: 'Tear amount', min: 0, max: 1.5, step: 0.01, def: 0.15 },
  // colour
  colorFreq: { label: 'Fringe frequency', min: 0.1, max: 6, step: 0.01, def: 1 },
  palOffset: { label: 'Palette offset', min: 0, max: 1, step: 0.005, def: 0 },
  palCycle:  { label: 'Colour cycling', min: -2, max: 2, step: 0.01, def: 0 },
  rainbow:   { label: 'Amount', min: 0, max: 1, step: 0.01, def: 0.5 },
  hue:       { label: 'Hue rotate', min: 0, max: 1, step: 0.005, def: 0 },
  sat:       { label: 'Chroma', min: 0, max: 2, step: 0.01, def: 1 },
  acid:      { label: 'Acid overdrive', min: 0.5, max: 4, step: 0.01, def: 2.4 },
  // surface
  relief:    { label: 'Relief depth', min: 0, max: 3, step: 0.01, def: 1 },
  gloss:     { label: 'Gloss', min: 0, max: 3, step: 0.01, def: 1 },
  prism:     { label: 'Split', min: 0, max: 3, step: 0.01, def: 1 },
  rim:       { label: 'Glow', min: 0, max: 2.5, step: 0.01, def: 1 },
  ink:       { label: 'Line weight', min: 0.15, max: 2.2, step: 0.01, def: 1 },
  inkDepth:  { label: 'Trench depth', min: 0, max: 1, step: 0.01, def: 1 },
  engrave:   { label: 'Mix', min: 0, max: 1, step: 0.01, def: 0.4 },
  // finish
  trails:    { label: 'Persistence', min: 0, max: 1, step: 0.01, def: 0.42 },
  ca:        { label: 'Aberration', min: 0, max: 3, step: 0.01, def: 0.6 },
  halftone:  { label: 'Mix', min: 0, max: 1, step: 0.01, def: 0.5 },
  dots:      { label: 'Screen ruling', min: 20, max: 180, step: 1, def: 90 },
  grain:     { label: 'Amount', min: 0, max: 1, step: 0.01, def: 0.3 },
  poster:    { label: 'Levels', min: 2, max: 8, step: 1, def: 4 },
  pixel:     { label: 'Rows', min: 24, max: 320, step: 1, def: 120 },
  solar:     { label: 'Amount', min: 0, max: 1.5, step: 0.01, def: 0.6 },
  swarm:     { label: 'Density', min: 0.05, max: 1.5, step: 0.01, def: 0.85 },
} satisfies Record<string, ParamDef>;

export const TOGGLES = {
  mobiusOn:   { label: 'Möbius warp', def: true },
  kaleidoOn:  { label: 'Kaleidoscope', def: false },
  tunnelOn:   { label: 'Log-polar tunnel', def: false },
  liquidOn:   { label: 'Liquid curl warp', def: false },
  vhsOn:      { label: 'VHS tracking tear', def: true },
  hardOn:     { label: 'Flat ink bands', def: false },
  reverseOn:  { label: 'Reverse order', def: false },
  rainbowOn:  { label: 'Acid rainbow mix', def: false },
  embossOn:   { label: 'Emboss lighting', def: false },
  specOn:     { label: 'Neon specular', def: true },
  prismOn:    { label: 'Prismatic dispersion', def: true },
  iridOn:     { label: 'Micro iridescence', def: true },
  rimOn:      { label: 'Fresnel rim glow', def: false },
  inkOn:      { label: 'Ink trenches', def: true },
  neonOn:     { label: 'Neon lock (no white)', def: true },
  engraveOn:  { label: 'Guilloché engraving', def: false },
  fdOn:       { label: 'Hi-fi normals (3× cost)', def: false },
  trailsOn:   { label: 'Feedback trails', def: false },
  caOn:       { label: 'Lens aberration', def: false },
  halftoneOn: { label: 'Halftone rosette', def: false },
  glitterOn:  { label: 'Glitter', def: false },
  scanOn:     { label: 'CRT scanlines', def: true },
  grainOn:    { label: 'Film grain', def: true },
  vignetteOn: { label: 'Vignette', def: true },
  posterOn:   { label: 'Posterize', def: false },
  pixelOn:    { label: 'Pixelate', def: false },
  solarOn:    { label: 'Solarize', def: false },
  mirrorOn:   { label: 'Mirror', def: false },
  invertOn:   { label: 'Invert', def: false },
  swarmOn:    { label: 'Glyph swarm', def: false },
} satisfies Record<string, ToggleDef>;

export type ParamKey = keyof typeof PARAMS;
export type ToggleKey = keyof typeof TOGGLES;

export const BLEND_MODES = ['Morph', 'Domain warp', 'Ink carve', 'Phase modulate', 'Height weave'] as const;
export const PROJECTIONS = ['Poincaré disk', 'Klein disk', 'Half-plane', 'Band'] as const;

export type State = Record<ParamKey, number> & Record<ToggleKey, boolean> & {
  engineA: string;
  engineB: string; // 'none' or engine id
  blendMode: number;
  proj: number;
  palette: string; // palette name or 'custom'
  bg: string;
  colors: string[];
};

export const UNIFORM_KEYS: string[] = [...Object.keys(PARAMS), ...Object.keys(TOGGLES), 'proj'];

export function defaultState(): State {
  const s: Record<string, unknown> = {};
  for (const [k, d] of Object.entries(PARAMS)) s[k] = d.def;
  for (const [k, d] of Object.entries(TOGGLES)) s[k] = d.def;
  const pal = PALETTES[0];
  return { ...(s as Record<ParamKey, number> & Record<ToggleKey, boolean>),
    engineA: 'biomineral', engineB: 'none', blendMode: 0, proj: 0,
    palette: pal.name, bg: pal.bg, colors: [...pal.colors] };
}

/** Validate + merge an untrusted recipe over defaults. */
export function sanitize(input: unknown): State {
  const base = defaultState();
  if (!input || typeof input !== 'object') return base;
  const r = input as Record<string, unknown>;
  const out = base as unknown as Record<string, unknown>;
  for (const [k, d] of Object.entries(PARAMS) as [string, ParamDef][]) {
    const v = r[k];
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = Math.min(d.max, Math.max(d.min, v));
  }
  for (const k of Object.keys(TOGGLES)) if (typeof r[k] === 'boolean') out[k] = r[k];
  const ids = new Set(ENGINES.map((e) => e.id));
  if (typeof r.engineA === 'string' && ids.has(r.engineA)) out.engineA = r.engineA;
  if (typeof r.engineB === 'string' && (ids.has(r.engineB) || r.engineB === 'none')) out.engineB = r.engineB;
  if (Number.isInteger(r.blendMode) && (r.blendMode as number) >= 0 && (r.blendMode as number) < BLEND_MODES.length) out.blendMode = r.blendMode;
  if (Number.isInteger(r.proj) && (r.proj as number) >= 0 && (r.proj as number) < 4) out.proj = r.proj;
  const hex = (c: unknown) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
  if (hex(r.bg)) out.bg = r.bg;
  if (Array.isArray(r.colors) && r.colors.length >= 2 && r.colors.length <= 8 && r.colors.every(hex)) out.colors = [...r.colors];
  if (typeof r.palette === 'string') out.palette = r.palette.slice(0, 60);
  return base;
}

/* ---------------- randomisers ---------------- */
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const snap = (k: ParamKey, v: number) => {
  const d = PARAMS[k];
  return +Math.min(d.max, Math.max(d.min, Math.round(v / d.step) * d.step)).toFixed(4);
};
const GEO: ParamKey[] = ['sym', 'q', 'depth', 'freq', 'tension', 'shape'];

/** Nudge the current look: small jitter on geometry + colour phase. */
export function mutate(s: State, lockGeo: boolean, lockPal: boolean): State {
  const n = { ...s };
  if (!lockGeo) {
    for (const k of GEO) {
      const d = PARAMS[k];
      n[k] = snap(k, s[k] + (Math.random() - 0.5) * (d.max - d.min) * 0.3);
    }
    n.depth = Math.max(5, n.depth);
    n.mobius = snap('mobius', rnd(0.2, 2.2));
    n.zoom = snap('zoom', s.zoom * rnd(0.75, 1.3));
  }
  if (!lockPal) {
    n.palOffset = snap('palOffset', Math.random());
    n.colorFreq = snap('colorFreq', s.colorFreq * rnd(0.7, 1.4));
  }
  return n;
}

/** Roll the finish / warp toggles. */
export function fxRoll(s: State): State {
  const n = { ...s };
  const p = (k: ToggleKey, prob: number) => { n[k] = Math.random() < prob; };
  p('mobiusOn', 0.45); p('kaleidoOn', 0.35); p('tunnelOn', 0.14); p('liquidOn', 0.3); p('vhsOn', 0.3);
  p('embossOn', 0.4); p('rimOn', 0.3); p('specOn', 0.7); p('prismOn', 0.6); p('iridOn', 0.6); p('engraveOn', 0.2);
  p('trailsOn', 0.3); p('caOn', 0.3); p('halftoneOn', 0.25); p('glitterOn', 0.25); p('scanOn', 0.25);
  p('grainOn', 0.4); p('posterOn', 0.1); p('pixelOn', 0.05); p('solarOn', 0.12); p('mirrorOn', 0.12);
  p('swarmOn', 0.2); p('hardOn', 0.2); p('rainbowOn', 0.25);
  n.kaleido = snap('kaleido', rnd(3, 14)); n.mobius = snap('mobius', rnd(0.3, 2.4));
  n.liquid = snap('liquid', rnd(0.2, 1.4)); n.prism = snap('prism', rnd(0.4, 2.4));
  n.trails = snap('trails', rnd(0.25, 0.8)); n.halftone = snap('halftone', rnd(0.3, 0.9));
  n.dots = snap('dots', rnd(50, 150)); n.ca = snap('ca', rnd(0.3, 2)); n.solar = snap('solar', rnd(0.2, 1.2));
  n.rainbow = snap('rainbow', rnd(0.2, 0.7));
  return n;
}

/** Full roll of the dice: engines, geometry, palette and finish. */
export function chaos(s: State, lockGeo: boolean, lockPal: boolean): State {
  let n = fxRoll(s);
  n.invertOn = false;
  if (!lockGeo) {
    const light = ENGINES.filter((e) => !e.heavy);
    const pick = () => {
      const pool = Math.random() < 0.06 ? ENGINES : light;
      return pool[Math.floor(Math.random() * pool.length)].id;
    };
    n.engineA = pick();
    n.engineB = Math.random() < 0.4 ? light[Math.floor(Math.random() * light.length)].id : 'none';
    n.blendMode = Math.floor(Math.random() * BLEND_MODES.length);
    n.morph = snap('morph', rnd(0.25, 0.8));
    n.proj = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * 4);
    n.sym = snap('sym', rnd(3, 18)); n.q = snap('q', rnd(3, 7)); n.depth = snap('depth', rnd(7, 15));
    n.freq = snap('freq', rnd(4, 22)); n.tension = snap('tension', rnd(0.2, 3.2)); n.shape = snap('shape', rnd(0.3, 3.6));
    n.zoom = snap('zoom', rnd(0.6, 1.5)); n.rot = 0;
  }
  if (!lockPal) {
    if (Math.random() < 0.3) {
      const p = randomPalette();
      n.palette = 'custom'; n.bg = p.bg; n.colors = p.colors;
    } else {
      const p = PALETTES[Math.floor(Math.random() * PALETTES.length)];
      n.palette = p.name; n.bg = p.bg; n.colors = [...p.colors];
    }
    n.palOffset = snap('palOffset', Math.random());
    n.colorFreq = snap('colorFreq', rnd(0.5, 2.2));
    n.acid = snap('acid', rnd(1.6, 3.2));
    n.neonOn = Math.random() < 0.6;
  }
  n = { ...n, inkOn: Math.random() < 0.92 };
  return n;
}
