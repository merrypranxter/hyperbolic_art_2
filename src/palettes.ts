import { MATHMAGICAL_PALETTES } from './mathmagical-palettes';

export interface Palette { name: string; group: string; bg: string; colors: string[]; }

const dark = (hex: string, k = 0.13) =>
  '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
const f2h = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');

const INK = '#04010a'; // the obsidian substrate every source file prints on

// Hyperbolic Acid Atlas palettes: first colour doubles as the (darkened) ground.
const atlas = (name: string, c: string[]): Palette => ({ name, group: 'Acid Atlas', bg: dark(c[0]), colors: c });

export const PALETTES: Palette[] = [
  // ---- lifted from the source synthesizers ----
  { name: 'Spectral Ring', group: 'Source', bg: INK, colors: [f2h(1, 0, 0.52), f2h(0, 0.96, 1), f2h(0.68, 1, 0), f2h(1, 0.88, 0), f2h(1, 0.25, 0), f2h(0.6, 0, 1)] },
  { name: 'Lisa Frank 1989', group: 'Source', bg: INK, colors: [f2h(1, 0, 0.52), f2h(0, 0.96, 1), f2h(0.72, 1, 0), f2h(1, 0.75, 0), f2h(0.62, 0, 1)] },
  { name: 'Birefringence', group: 'Source', bg: '#05020a', colors: ['#ff0594', '#00faff', '#faff0a', '#7a00ff', '#ff2a6d', '#39ff14'] },
  { name: 'Ultraviolet Biolume', group: 'Source', bg: INK, colors: [f2h(0.45, 0, 1), f2h(0, 1, 0.85), f2h(0.15, 1, 0.25), f2h(1, 0, 0.68), f2h(1, 0.28, 0)] },
  { name: 'Cyber-Ska Lime', group: 'Source', bg: INK, colors: [f2h(0.65, 1, 0), f2h(1, 0.92, 0), f2h(1, 0, 0.45), f2h(0, 0.65, 1), f2h(0.55, 0, 0.95)] },
  { name: 'Tokyo VHS Chrome', group: 'Source', bg: INK, colors: [f2h(1, 0.05, 0.38), f2h(0, 0.92, 1), f2h(1, 0.32, 0), f2h(0.7, 0, 1), f2h(1, 0.85, 0)] },
  { name: 'Radioactive Diatom', group: 'Source', bg: INK, colors: [f2h(0, 1, 0.45), f2h(0, 0.82, 1), f2h(1, 0, 0.75), f2h(1, 0.6, 0), f2h(0.42, 0, 1)] },
  { name: 'Nematic Schlieren', group: 'Source', bg: '#050109', colors: [f2h(1, 0, 0.55), f2h(0, 0.96, 1), f2h(0.55, 1, 0), f2h(1, 0.85, 0), f2h(1, 0.22, 0), f2h(0.62, 0, 1)] },
  { name: 'Thin-Film Quasi', group: 'Source', bg: '#060210', colors: ['#ff0080', '#00f0ff', '#ccff00', '#ff5500', '#8a2be2'] },
  atlas('Acid Sherbet', ['#1a0033', '#ff2fd0', '#ffe600', '#00ffc8', '#7a2bff']),
  atlas('Sticker Binder 1991', ['#12002b', '#ff0a8c', '#00e5ff', '#b8ff00', '#ffa800']),
  atlas('Blacklight Poster', ['#05000f', '#7b00ff', '#ff00aa', '#00ff66', '#fff200']),
  atlas('Mango UFO', ['#2b0a3d', '#ff6b00', '#ffd000', '#ff2e88', '#22e0ff']),
  atlas('Toxic Lagoon', ['#001a1f', '#00ffb3', '#c6ff00', '#ff3df2', '#2a6bff']),
  atlas('Bubblegum Plasma', ['#ffe3f6', '#ff4fd8', '#8a5cff', '#27e8ff', '#fff275']),
  atlas('Dayglo Riso', ['#fff6d6', '#ff3b6b', '#0057ff', '#00d68f', '#ff9d00']),
  atlas('Ultraviolet Citrus', ['#10002e', '#5b1bff', '#d400ff', '#ff7a00', '#eaff00']),
  atlas('Mermaid Chrome', ['#031033', '#00b3ff', '#7dffea', '#ff7de9', '#9a5bff']),
  atlas('Hot Lava Disco', ['#1f0010', '#ff003c', '#ff7b00', '#ffe100', '#ff00d4']),
  atlas('Alien Melon', ['#06210f', '#39ff14', '#ffef00', '#ff4d9d', '#00d0ff']),
  atlas('Candy Raver', ['#1b1035', '#ff5fa2', '#ffd166', '#06d6a0', '#4cc9f0']),
  atlas('Oil Slick', ['#0a0612', '#3d1cff', '#00f0c0', '#ffe14d', '#ff2f6d']),
  atlas('Tangerine Dreamcast', ['#240046', '#ff9e00', '#ff5400', '#00f5d4', '#f15bb5']),

  // ---- new: neon on black ----
  { name: 'DMT Hyperspace', group: 'Neon', bg: '#03000d', colors: ['#ff00e6', '#7300ff', '#00e1ff', '#00ff8c', '#f6ff00', '#ff5e00', '#ff005d'] },
  { name: 'Rave Flyer', group: 'Neon', bg: '#000000', colors: ['#fffb00', '#ff00a8', '#00ffea', '#ff5a00', '#7cff00'] },
  { name: 'Jellyfish Aurora', group: 'Neon', bg: '#01041a', colors: ['#0b2bff', '#00d4ff', '#5dffb1', '#d9ff6b', '#ff6bd6', '#8b3dff'] },
  { name: 'Poison Dart Frog', group: 'Neon', bg: '#020d05', colors: ['#00e5ff', '#001eff', '#fff200', '#ff6a00', '#00ff5e'] },
  { name: 'Peacock Mantis', group: 'Neon', bg: '#020a0c', colors: ['#00ffa2', '#00a6ff', '#ff2a00', '#ffb300', '#b300ff', '#00ffe1'] },
  { name: 'Bismuth Crystal', group: 'Neon', bg: '#07050f', colors: ['#ff4fa3', '#ffb347', '#f4ff61', '#4dffb8', '#3fa9ff', '#a35cff'] },
  { name: 'Vaporwave Mall', group: 'Neon', bg: '#12002e', colors: ['#ff71ce', '#01cdfe', '#05ffa1', '#b967ff', '#fffb96'] },
  { name: 'Cyberpunk Rain', group: 'Neon', bg: '#02030c', colors: ['#fcee0a', '#00f0ff', '#ff003c', '#711c91', '#ea00d9'] },
  { name: 'Plasma Globe', group: 'Neon', bg: '#05000f', colors: ['#2b00ff', '#a100ff', '#ff3df5', '#ffb8f9', '#6f8dff'] },
  { name: 'Lava Lamp', group: 'Neon', bg: '#17000a', colors: ['#ff0055', '#ff5d00', '#ffc400', '#ff2bd1', '#8a00ff'] },
  { name: 'Infrared Jungle', group: 'Neon', bg: '#12000b', colors: ['#ff0f7b', '#f89b29', '#ff3d00', '#ffe0f0', '#b0005d', '#ff66c4'] },
  { name: 'Glitch CMYK', group: 'Neon', bg: '#000000', colors: ['#00ffff', '#ff00ff', '#ffff00', '#00ffff', '#ff00ff'] },
  { name: 'Toxic Slime', group: 'Neon', bg: '#031200', colors: ['#aaff00', '#00ff6a', '#eaff00', '#00ffc3', '#5cff00'] },
  { name: 'Arcade Carpet', group: 'Neon', bg: '#0a0014', colors: ['#ff2e63', '#08d9d6', '#f9ed69', '#b83bff', '#ff8c00', '#3bff6f'] },
  { name: 'Deep Sea Vent', group: 'Neon', bg: '#000810', colors: ['#00ffd5', '#0077ff', '#ff3c00', '#ffd000', '#00ff73'] },
  { name: 'Northern Lights', group: 'Neon', bg: '#020814', colors: ['#00ff87', '#60efff', '#0061ff', '#b400ff', '#ff4ecd'] },
  { name: 'Solar Flare', group: 'Neon', bg: '#120300', colors: ['#fff700', '#ffae00', '#ff5200', '#ff0040', '#ffe9a8'] },
  { name: 'Synthwave Sunset', group: 'Neon', bg: '#0d0221', colors: ['#f6019d', '#ff6c11', '#fdf500', '#2de2e6', '#9700cc'] },
  { name: 'Opal Fire', group: 'Neon', bg: '#060612', colors: ['#49ffe0', '#3d7bff', '#ff59c7', '#ffb84d', '#a8ff5c', '#c56bff'] },
  { name: 'Beetle Shell', group: 'Neon', bg: '#020b08', colors: ['#00ff9d', '#00c2a8', '#c8ff00', '#ff7b00', '#7a00b8', '#00e5ff'] },
  { name: 'Hologram Foil', group: 'Neon', bg: '#0b0b14', colors: ['#ff9de2', '#9dfff0', '#fff59d', '#b79dff', '#9dffb0', '#ffb89d'] },
  { name: 'Electric Kool-Aid', group: 'Neon', bg: '#0f001f', colors: ['#ff0000', '#ff8800', '#ffee00', '#00ff22', '#0099ff', '#aa00ff', '#ff00aa'] },
  { name: 'Ultraviolet Only', group: 'Neon', bg: '#040010', colors: ['#3a00ff', '#8f00ff', '#d400ff', '#ff00c8', '#5e17eb'] },
  { name: 'Matrix Phosphor', group: 'Neon', bg: '#000500', colors: ['#00ff41', '#008f11', '#b6ff00', '#00ffa2', '#003b00'] },

  // ---- new: light / print grounds (turn Neon Lock off for these) ----
  { name: 'Risograph Zine', group: 'Paper', bg: '#f5efdc', colors: ['#ff48b0', '#0078bf', '#ffe800', '#00a95c', '#ff6c2f'] },
  { name: 'Pastel Goth', group: 'Paper', bg: '#1a1420', colors: ['#f7b2e6', '#b9a7ff', '#a7f0ff', '#c6ffd9', '#fff1a7'] },
  { name: 'Sherbet Float', group: 'Paper', bg: '#fff4ea', colors: ['#ff7eb6', '#ffb86b', '#fff275', '#7afcff', '#b28dff'] },
  { name: 'Blueprint Acid', group: 'Paper', bg: '#001a66', colors: ['#ffffff', '#00e5ff', '#ffe600', '#ff3ea5', '#7dff6b'] },
  { name: 'Mint Kimono', group: 'Paper', bg: '#e9fff5', colors: ['#00b894', '#ff5e78', '#ffc145', '#5f4bff', '#00c2ff'] },
  { name: 'Newsprint Fire', group: 'Paper', bg: '#efe9dd', colors: ['#111111', '#ff2a00', '#ffb000', '#111111', '#0044ff'] },
  ...MATHMAGICAL_PALETTES,
];

export const PALETTE_BY_NAME: Record<string, Palette> = Object.fromEntries(PALETTES.map((p) => [p.name, p]));

function hsl(h: number, s: number, l: number) {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}

/** Procedural acid palette: dark hue-tinted ground, 4–7 full-chroma stops on a hue walk. */
export function randomPalette(): { bg: string; colors: string[] } {
  const h0 = Math.random();
  const step = 0.11 + Math.random() * 0.24;
  const n = 4 + Math.floor(Math.random() * 4);
  const colors: string[] = [];
  for (let i = 0; i < n; i++) colors.push(hsl((h0 + 0.35 + i * step) % 1, 1, 0.5 + Math.random() * 0.14));
  return { bg: hsl(h0, 0.9, 0.03 + Math.random() * 0.04), colors };
}

export const hexToRgb = (hex: string): [number, number, number] =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
