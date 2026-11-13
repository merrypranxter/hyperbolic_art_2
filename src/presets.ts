import { PALETTE_BY_NAME } from './palettes';
import { defaultState, type State } from './state';

export interface Preset { name: string; from: string; s: Partial<State> & { palette: string }; }

// Shared baselines for each source family.
const DARK_PRINT: Partial<State> = { mobiusOn: false, neonOn: true, inkOn: true, specOn: true, prismOn: true, iridOn: true, scanOn: true, grainOn: false, zoom: 1, rainbowOn: false };
const BIO: Partial<State> = { engineA: 'biomineral', mobiusOn: true, neonOn: true, rainbowOn: false, vhsOn: true, scanOn: true, grainOn: true, grain: 0.2, tension: 1, sat: 1.25, rimOn: true, rim: 0.7, inkDepth: 1, grit: 0.3 };
const ATLAS: Partial<State> = { mobiusOn: false, vhsOn: false, scanOn: false, neonOn: false, iridOn: false, prismOn: false, specOn: false, embossOn: false, rainbowOn: false, grainOn: true, grain: 0.1, speed: 0.65, zoom: 1.03, gloss: 0.6 };

export const PRESETS: Preset[] = [
  // ---- Hyperbolic Photoelastic Biomineralization ----
  { name: 'Lisa Frank Radiolaria', from: 'Biomineral', s: { ...BIO, palette: 'Birefringence', sym: 7, depth: 12, shape: 1.38, freq: 11.25, colorFreq: 0.5, mobius: 1, acid: 2.4, prism: 1.1, palOffset: 0, speed: 0.6, vhs: 0.15, zoom: 0.74 } },
  { name: 'DMT Diatom Cathedral', from: 'Biomineral', s: { ...BIO, palette: 'DMT Hyperspace', sym: 16, depth: 15, shape: 0.93, freq: 19.5, colorFreq: 0.7, mobius: 0.55, acid: 2.95, prism: 1.6, palOffset: 0.28, speed: 0.45, vhs: 0.05, zoom: 0.91 } },
  { name: 'Bismuth Gyroid Foam', from: 'Biomineral', s: { ...BIO, palette: 'Bismuth Crystal', sym: 5, depth: 11, shape: 0.45, freq: 23.75, colorFreq: 0.9, mobius: 1.45, acid: 2.65, prism: 2, palOffset: 0.62, speed: 0.5, vhs: 0.08, zoom: 0.61 } },
  { name: 'Hyperbolic VHS Acid', from: 'Biomineral', s: { ...BIO, palette: 'Tokyo VHS Chrome', sym: 11, depth: 13, shape: 1.97, freq: 8.5, colorFreq: 0.6, mobius: 2.35, acid: 3.5, prism: 2.5, palOffset: 0.84, speed: 0.95, vhs: 0.65, zoom: 0.8, caOn: true, ca: 1.2 } },
  { name: '9-Fold Mandelbox Silica', from: 'Biomineral', s: { ...BIO, palette: 'Opal Fire', sym: 9, depth: 16, shape: 1.62, freq: 15.5, colorFreq: 0.45, mobius: 0.85, acid: 2.25, prism: 0.9, palOffset: 0.41, speed: 0.4, vhs: 0.12, zoom: 1.11 } },

  // ---- Hyper-Weave Pack II ----
  { name: 'Poincaré Girih Cathedral', from: 'Hyper-Weave', s: { ...DARK_PRINT, palette: 'Spectral Ring', engineA: 'girih', sym: 7, depth: 9, freq: 11.5, tension: 1.45, palOffset: 0, acid: 2.25, ink: 0.95, engraveOn: true, engrave: 0.32, vhsOn: true, vhs: 0.3, prism: 0.58, speed: 0.75, swarmOn: true, swarm: 0.85 } },
  { name: 'Abyssal Dichroic Caustic', from: 'Hyper-Weave', s: { ...DARK_PRINT, palette: 'Deep Sea Vent', engineA: 'caustic', sym: 9, depth: 10, freq: 13, tension: 2.15, palOffset: 0.18, acid: 2.55, ink: 1.1, engraveOn: true, engrave: 0.18, vhsOn: true, vhs: 0.48, prism: 0.76, speed: 0.85, swarmOn: true, swarm: 0.7 } },
  { name: 'Memphis Jacquard Brocade', from: 'Hyper-Weave', s: { ...DARK_PRINT, palette: 'Arcade Carpet', engineA: 'jacquard', sym: 8, depth: 8, freq: 12, tension: 1.25, palOffset: 0.42, acid: 2.6, ink: 1, inkDepth: 0.85, engraveOn: true, engrave: 0.45, vhsOn: true, vhs: 0.36, prism: 0.64, speed: 0.65 } },
  { name: 'Belousov Mycelial Lightning', from: 'Hyper-Weave', s: { ...DARK_PRINT, palette: 'Ultraviolet Biolume', engineA: 'bzmycelium', sym: 10, depth: 11, freq: 14, tension: 1.85, palOffset: 0.68, acid: 2.65, ink: 1.05, engraveOn: true, engrave: 0.25, vhsOn: true, vhs: 0.35, prism: 0.63, speed: 0.9, swarmOn: true, swarm: 1.1 } },
  { name: 'Non-Euclidean Halftone Rosette', from: 'Hyper-Weave', s: { ...DARK_PRINT, palette: 'Spectral Ring', engineA: 'girih', engineB: 'caustic', blendMode: 0, morph: 0.35, sym: 12, depth: 12, freq: 18, tension: 1.65, palOffset: 0.82, acid: 3, ink: 1.1, inkDepth: 0.8, halftoneOn: true, halftone: 0.7, dots: 110, engraveOn: true, engrave: 0.3, vhsOn: true, vhs: 0.62, prism: 0.9, speed: 0.6 } },
  { name: 'Hyper-Chromatic Caustic Loom', from: 'Hyper-Weave', s: { ...DARK_PRINT, palette: 'Lisa Frank 1989', engineA: 'caustic', engineB: 'jacquard', blendMode: 0, morph: 0.52, sym: 14, depth: 10, freq: 15, tension: 2.4, palOffset: 0.54, acid: 2.85, ink: 1.15, engraveOn: true, engrave: 0.52, vhsOn: true, vhs: 0.75, prism: 1.03, speed: 0.8 } },

  // ---- Astral-Loom ----
  { name: 'Calabi-Yau Quintic Bloom', from: 'Astral-Loom', s: { ...DARK_PRINT, palette: 'Lisa Frank 1989', engineA: 'calabi', sym: 7, depth: 6, freq: 10, tension: 1.2, gloss: 1.2, acid: 2.3, ink: 1, vhsOn: true, vhs: 0.25, prism: 0.6, speed: 0.7 } },
  { name: 'Turing Coral Lace', from: 'Astral-Loom', s: { ...DARK_PRINT, palette: 'Ultraviolet Biolume', engineA: 'turing', sym: 6, depth: 7, freq: 9, tension: 1.6, gloss: 1.4, acid: 2.4, ink: 1.1, vhsOn: false, prism: 0.6, speed: 0.6, halftoneOn: true, halftone: 0.25, dots: 85 } },
  { name: 'Crop-Circle Zeta Cymatics', from: 'Astral-Loom', s: { ...DARK_PRINT, palette: 'Cyber-Ska Lime', engineA: 'zeta', sym: 12, depth: 8, freq: 12, tension: 0.9, gloss: 1, acid: 2.5, ink: 0.9, vhsOn: false, prism: 0.5, speed: 0.7, swarmOn: true, swarm: 0.6 } },
  { name: 'Hopf Ferrofluid Foam', from: 'Astral-Loom', s: { ...DARK_PRINT, palette: 'Radioactive Diatom', engineA: 'hopf', sym: 8, depth: 6, freq: 13, tension: 1.4, gloss: 1.8, acid: 2.4, ink: 1, vhsOn: false, prism: 0.7, speed: 0.8 } },

  // ---- Hyper-Loom 4D Nematic Cathedral ----
  { name: 'Lisa Frank Cathedral', from: 'Cathedral', s: { ...DARK_PRINT, palette: 'Nematic Schlieren', engineA: 'cathedral', sym: 8, depth: 11, freq: 11.8, tension: 1.15, shape: 1.38, acid: 2.15, trailsOn: true, trails: 0.42, halftoneOn: true, halftone: 0.48, dots: 110, caOn: true, ca: 0.35, vhsOn: true, vhs: 0.35, prism: 0.8, speed: 0.5, specOn: false, iridOn: true, relief: 0.6, rimOn: true, rim: 0.5, sat: 1.3 } },

  // ---- 3D Quasicrystal ----
  { name: 'Penrose Moiré Quasicrystal', from: 'Quasicrystal', s: { ...DARK_PRINT, palette: 'Thin-Film Quasi', engineA: 'quasi', sym: 7, freq: 11, shape: 1.4, tension: 1, acid: 2.3, halftoneOn: true, halftone: 0.4, dots: 64, inkDepth: 0.8, caOn: true, ca: 0.9, vhsOn: true, vhs: 0.2, prism: 0.9, speed: 0.8, ink: 1, swarmOn: true, swarm: 0.5 } },

  // ---- OTHERSPACE II: Hyperbolic Acid Atlas ----
  { name: 'Modular Jellyfish', from: 'Acid Atlas', s: { ...ATLAS, palette: 'Acid Sherbet', engineA: 'os0', sym: 6, q: 3, depth: 13, freq: 7.1, shape: 0.6, tension: 1.4, ink: 1, relief: 0.9, acid: 2, embossOn: true, specOn: true, neonOn: true } },
  { name: 'Guilloché Ribbon', from: 'Acid Atlas', s: { ...ATLAS, palette: 'Mango UFO', engineA: 'os1', proj: 3, sym: 7, q: 5, depth: 11, freq: 11.1, shape: 1.2, tension: 2, ink: 1, relief: 0.6, acid: 2.1, hardOn: true, prismOn: true, prism: 1 } },
  { name: 'Schottky Lightning', from: 'Acid Atlas', s: { ...ATLAS, palette: 'Blacklight Poster', engineA: 'os2', sym: 5, q: 3, depth: 13, freq: 13.3, shape: 4, tension: 0, ink: 1.1, relief: 1.2, acid: 2.2, embossOn: true, specOn: true, glitterOn: true } },
  { name: 'Chainmail Orbifold', from: 'Acid Atlas', s: { ...ATLAS, palette: 'Mermaid Chrome', engineA: 'os3', sym: 7, q: 3, depth: 13, freq: 20, shape: 1, tension: 1.2, ink: 1.2, relief: 1.4, acid: 1.9, embossOn: true, specOn: true } },
  { name: 'Binary Brickwork', from: 'Acid Atlas', s: { ...ATLAS, palette: 'Dayglo Riso', engineA: 'os4', proj: 2, sym: 6, q: 4, depth: 11, freq: 6.7, shape: 1.5, tension: 1, ink: 1.3, relief: 0.5, acid: 2.2, hardOn: true, halftoneOn: true, halftone: 0.6, dots: 96 } },
  { name: 'Blaschke Bloom', from: 'Acid Atlas', s: { ...ATLAS, palette: 'Hot Lava Disco', engineA: 'os5', sym: 9, q: 3, depth: 11, freq: 11.1, shape: 3.4, tension: 1, ink: 1, relief: 1, acid: 2.2, embossOn: true, specOn: true, neonOn: true } },
  { name: 'Confocal Moiré', from: 'Acid Atlas', s: { ...ATLAS, palette: 'Toxic Lagoon', engineA: 'os6', sym: 9, q: 3, depth: 11, freq: 15.6, shape: 1.8, tension: 0.5, ink: 1.1, relief: 0.7, acid: 2.1, embossOn: true, hardOn: true } },
  { name: 'Dipole Whirlpool', from: 'Acid Atlas', s: { ...ATLAS, palette: 'Tangerine Dreamcast', engineA: 'os7', sym: 6, q: 4, depth: 11, freq: 7.8, shape: 2.2, tension: 1.6, ink: 1.1, relief: 1, acid: 2.1, embossOn: true, specOn: true, prismOn: true, prism: 1 } },
  { name: 'Geodesic Times Table', from: 'Acid Atlas', s: { ...ATLAS, palette: 'Ultraviolet Citrus', engineA: 'os8', sym: 12, q: 3, depth: 11, freq: 8.9, shape: 0, tension: 1, ink: 1, relief: 0.8, acid: 2.3, neonOn: true } },
  { name: 'Apollonian Proper', from: 'Acid Atlas', s: { ...ATLAS, palette: 'Oil Slick', engineA: 'os9', sym: 7, q: 3, depth: 15, freq: 6.7, shape: 1, tension: 0, ink: 1.2, relief: 1.3, acid: 2, embossOn: true, specOn: true } },

  // ---- New hybrids only this studio can make ----
  { name: 'Girih Melted by Coral', from: 'Hybrid', s: { ...DARK_PRINT, palette: 'Jellyfish Aurora', engineA: 'girih', engineB: 'turing', blendMode: 1, morph: 0.35, sym: 8, depth: 10, freq: 5, tension: 1.3, acid: 2.8, ink: 0.8, inkDepth: 0.75, vhsOn: false, trailsOn: true, trails: 0.35, speed: 0.6 } },
  { name: 'Zeta Stained Glass', from: 'Hybrid', s: { ...DARK_PRINT, palette: 'Electric Kool-Aid', engineA: 'zeta', engineB: 'hopf', blendMode: 2, morph: 0.85, sym: 10, depth: 8, freq: 12, tension: 1.1, acid: 2.6, ink: 1.2, vhsOn: false, kaleidoOn: true, kaleido: 10, embossOn: true, speed: 0.5 } },
  { name: 'Quasicrystal Wormhole', from: 'Hybrid', s: { ...DARK_PRINT, palette: 'Synthwave Sunset', engineA: 'quasi', engineB: 'calabi', blendMode: 3, morph: 0.5, sym: 9, depth: 6, freq: 9, tension: 1.4, shape: 1, acid: 2.4, ink: 1, vhsOn: true, vhs: 0.2, tunnelOn: true, tunnel: 1.1, caOn: true, ca: 1, speed: 0.9 } },
  { name: 'Mycelium Brocade Riso', from: 'Hybrid', s: { ...DARK_PRINT, palette: 'Risograph Zine', engineA: 'bzmycelium', engineB: 'jacquard', blendMode: 4, morph: 0.5, sym: 6, depth: 9, freq: 7, tension: 1.2, neonOn: false, acid: 1.6, ink: 1.1, vhsOn: false, scanOn: false, hardOn: true, halftoneOn: true, halftone: 0.5, dots: 70, vignetteOn: false, grainOn: true, grain: 0.45, speed: 0.5 } },
];

export function applyPreset(p: Preset): State {
  const pal = PALETTE_BY_NAME[p.s.palette];
  return { ...defaultState(), ...p.s, bg: pal.bg, colors: [...pal.colors] };
}
