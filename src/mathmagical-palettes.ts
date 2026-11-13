import type { Palette } from './palettes';

// Original MathMAGICAL! palette library (26 It's a Moiré + 5 Automatart).
// Preserve all source stops here. Acid Loom's GLSL takes a maximum of eight
// palette colors; the selection adapter samples each original ramp evenly.
export const MATHMAGICAL_ORIGINALS = [
  {
    "id": "itsamoire/spectrum",
    "name": "Full-spectrum seizure",
    "source": "itsamoire",
    "colors": [
      "#ff0000",
      "#ff7f00",
      "#ffff00",
      "#7fff00",
      "#00ff00",
      "#00ff7f",
      "#00ffff",
      "#007fff",
      "#0000ff",
      "#7f00ff",
      "#ff00ff",
      "#ff007f"
    ]
  },
  {
    "id": "itsamoire/acid",
    "name": "Acid bath",
    "source": "itsamoire",
    "colors": [
      "#fe0aaf",
      "#ff6c00",
      "#ffe900",
      "#b9ff00",
      "#39ff00",
      "#00ffa2",
      "#00efff",
      "#008bff",
      "#5421ff",
      "#d000ff",
      "#ff00a9",
      "#ff3458"
    ]
  },
  {
    "id": "itsamoire/ultraviolet",
    "name": "UV candy",
    "source": "itsamoire",
    "colors": [
      "#fdff22",
      "#fc00fb",
      "#9700ff",
      "#3925ff",
      "#00b4ff",
      "#00fbfd",
      "#00ffb8",
      "#aaff00",
      "#ffdf00",
      "#ff8200",
      "#ff397c",
      "#a300e8"
    ]
  },
  {
    "id": "itsamoire/candy",
    "name": "Alien bubblegum",
    "source": "itsamoire",
    "colors": [
      "#fc4acc",
      "#ff94d8",
      "#fcf248",
      "#a7fb42",
      "#34ebbc",
      "#74dffb",
      "#3e7afc",
      "#aa7afc",
      "#fe77e2",
      "#ff8679",
      "#ffbb59",
      "#e6fe7d"
    ]
  },
  {
    "id": "itsamoire/mono",
    "name": "Blacklight ink",
    "source": "itsamoire",
    "colors": [
      "#030007",
      "#160024",
      "#32005c",
      "#5800a2",
      "#8915da",
      "#c539fb",
      "#ff40e8",
      "#e43ffb",
      "#a824e8",
      "#6300ab",
      "#30005f",
      "#0c001b"
    ]
  },
  {
    "id": "itsamoire/toxic",
    "name": "Toxic slime",
    "source": "itsamoire",
    "colors": [
      "#f6ff00",
      "#d8ff00",
      "#93ff00",
      "#39ff14",
      "#00ff66",
      "#00ffb7",
      "#00fff0",
      "#00cfff",
      "#0088ff",
      "#3f3dff",
      "#9a00ff",
      "#ff00d4"
    ]
  },
  {
    "id": "itsamoire/phosphor",
    "name": "CRT phosphor",
    "source": "itsamoire",
    "colors": [
      "#00ff66",
      "#32ff7a",
      "#6dff95",
      "#b6ffb7",
      "#e8ffe8",
      "#7bffd9",
      "#32ffd9",
      "#00fff7",
      "#00ddff",
      "#00aaff",
      "#0077ff",
      "#1238ff"
    ]
  },
  {
    "id": "itsamoire/opal",
    "name": "Opal prism",
    "source": "itsamoire",
    "colors": [
      "#ffffff",
      "#e8f6ff",
      "#d4fffb",
      "#cffff0",
      "#e5ffd1",
      "#fff9b8",
      "#ffd8ff",
      "#f2c7ff",
      "#d5c8ff",
      "#c8dcff",
      "#b8f3ff",
      "#f7dfff"
    ]
  },
  {
    "id": "itsamoire/chromeCandy",
    "name": "Chrome candy",
    "source": "itsamoire",
    "colors": [
      "#f3f7ff",
      "#d7ecff",
      "#a6d8ff",
      "#7cf2ff",
      "#98fffa",
      "#d6fff7",
      "#ffe6fb",
      "#ffb8f2",
      "#ff74de",
      "#d84cff",
      "#7a6cff",
      "#3eb8ff"
    ]
  },
  {
    "id": "itsamoire/pinkViolence",
    "name": "Pink/cyan violence",
    "source": "itsamoire",
    "colors": [
      "#ff0080",
      "#ff00b7",
      "#ff38ff",
      "#d000ff",
      "#8600ff",
      "#2f3cff",
      "#00a2ff",
      "#00ecff",
      "#00ffd5",
      "#35ff87",
      "#d6ff00",
      "#fff000"
    ]
  },
  {
    "id": "itsamoire/highlighter",
    "name": "Highlighter demon",
    "source": "itsamoire",
    "colors": [
      "#fbff12",
      "#d8ff12",
      "#97ff12",
      "#53ff12",
      "#12ff67",
      "#12ffb6",
      "#12f3ff",
      "#12b6ff",
      "#126bff",
      "#5c12ff",
      "#b112ff",
      "#ff12c8"
    ]
  },
  {
    "id": "itsamoire/cobaltFire",
    "name": "Cobalt fire",
    "source": "itsamoire",
    "colors": [
      "#f8ff24",
      "#ffb300",
      "#ff6a00",
      "#ff2d55",
      "#ff00b3",
      "#b100ff",
      "#5a32ff",
      "#114cff",
      "#0088ff",
      "#00d4ff",
      "#00ffd9",
      "#b8ff3d"
    ]
  },
  {
    "id": "itsamoire/laserLemon",
    "name": "Laser lemon",
    "source": "itsamoire",
    "colors": [
      "#fff200",
      "#f6ff00",
      "#d1ff00",
      "#9dff00",
      "#55ff00",
      "#00ff66",
      "#00ffb7",
      "#00f5ff",
      "#00b4ff",
      "#006dff",
      "#5f33ff",
      "#ff00f5"
    ]
  },
  {
    "id": "itsamoire/ultravioletPop",
    "name": "Ultraviolet pop",
    "source": "itsamoire",
    "colors": [
      "#ffe600",
      "#ffb000",
      "#ff6eff",
      "#ff29ff",
      "#f000ff",
      "#a400ff",
      "#5d00ff",
      "#243cff",
      "#00a8ff",
      "#00f6ff",
      "#00ffcc",
      "#89ff00"
    ]
  },
  {
    "id": "itsamoire/slimeParty",
    "name": "Slime party",
    "source": "itsamoire",
    "colors": [
      "#d6ff00",
      "#b2ff00",
      "#7dff00",
      "#32ff00",
      "#00ff3d",
      "#00ff7a",
      "#00ffbd",
      "#00ffff",
      "#00b8ff",
      "#0072ff",
      "#6723ff",
      "#ff00c3"
    ]
  },
  {
    "id": "itsamoire/deepSpaceNeon",
    "name": "Deep-space neon",
    "source": "itsamoire",
    "colors": [
      "#02030f",
      "#12002f",
      "#2a0068",
      "#4b00a8",
      "#7a00ff",
      "#b100ff",
      "#ff00f0",
      "#00e1ff",
      "#00a4ff",
      "#0057ff",
      "#00ffb3",
      "#d8ff00"
    ]
  },
  {
    "id": "itsamoire/bubbleRuin",
    "name": "Bubblegum ruin",
    "source": "itsamoire",
    "colors": [
      "#ff76d8",
      "#ff98ea",
      "#ffc2f4",
      "#ffe06b",
      "#fff48a",
      "#c4ff75",
      "#79ff9c",
      "#62ffe2",
      "#7edfff",
      "#8ca8ff",
      "#c18cff",
      "#ff8fa1"
    ]
  },
  {
    "id": "itsamoire/prismAttack",
    "name": "Prism attack",
    "source": "itsamoire",
    "colors": [
      "#ff1744",
      "#ff6d00",
      "#ffd600",
      "#aeea00",
      "#00e676",
      "#1de9b6",
      "#00e5ff",
      "#2979ff",
      "#651fff",
      "#d500f9",
      "#ff4081",
      "#ffffff"
    ]
  },
  {
    "id": "itsamoire/freezerBurn",
    "name": "Freezer burn",
    "source": "itsamoire",
    "colors": [
      "#ffffff",
      "#dff6ff",
      "#bff4ff",
      "#87edff",
      "#47deff",
      "#00cfff",
      "#00b5ff",
      "#0098ff",
      "#6b8cff",
      "#a09bff",
      "#d6d5ff",
      "#f7f3ff"
    ]
  },
  {
    "id": "itsamoire/starBruise",
    "name": "Star bruise",
    "source": "itsamoire",
    "colors": [
      "#0a001f",
      "#22004a",
      "#430084",
      "#6b00c7",
      "#9700ff",
      "#d100ff",
      "#ff3bc1",
      "#ff6f91",
      "#5b8cff",
      "#23c2ff",
      "#6effff",
      "#e9ff66"
    ]
  },
  {
    "id": "itsamoire/candyCore",
    "name": "Candy core meltdown",
    "source": "itsamoire",
    "colors": [
      "#ff4fa3",
      "#ff6ed1",
      "#ff95f4",
      "#d2a8ff",
      "#9cb8ff",
      "#69d8ff",
      "#5dfff2",
      "#72ffbf",
      "#b4ff72",
      "#fff36a",
      "#ffbe59",
      "#ff7a59"
    ]
  },
  {
    "id": "itsamoire/ozone",
    "name": "Ozone scream",
    "source": "itsamoire",
    "colors": [
      "#f7ff00",
      "#a8ff00",
      "#00ff94",
      "#00ffd9",
      "#00f0ff",
      "#00b0ff",
      "#0064ff",
      "#4636ff",
      "#9f00ff",
      "#f000ff",
      "#ff00aa",
      "#ff5f5f"
    ]
  },
  {
    "id": "itsamoire/astralJelly",
    "name": "Astral jelly",
    "source": "itsamoire",
    "colors": [
      "#ff00aa",
      "#ff53d1",
      "#ff9ff1",
      "#d6b4ff",
      "#9fc6ff",
      "#69e2ff",
      "#63fff2",
      "#89ffcf",
      "#c9ff86",
      "#fff36f",
      "#ffc66b",
      "#ff8f9d"
    ]
  },
  {
    "id": "itsamoire/silverRainbow",
    "name": "Silver rainbow",
    "source": "itsamoire",
    "colors": [
      "#f8fbff",
      "#e7efff",
      "#d6e7ff",
      "#d5f7ff",
      "#e3fff8",
      "#f7fff0",
      "#fff8e9",
      "#ffeef8",
      "#f5e6ff",
      "#e8dcff",
      "#dce3ff",
      "#edf7ff"
    ]
  },
  {
    "id": "itsamoire/glitchAngel",
    "name": "Glitch angel",
    "source": "itsamoire",
    "colors": [
      "#ffffff",
      "#d7fbff",
      "#8cf7ff",
      "#2de7ff",
      "#00b4ff",
      "#2962ff",
      "#7c4dff",
      "#ea00ff",
      "#ff4fd8",
      "#ff8aa8",
      "#f5ff66",
      "#7dff7d"
    ]
  },
  {
    "id": "itsamoire/vampireDiscotheque",
    "name": "Vampire discotheque",
    "source": "itsamoire",
    "colors": [
      "#130016",
      "#3a003f",
      "#7a007f",
      "#c1009b",
      "#ff00b8",
      "#ff4d8e",
      "#ff7959",
      "#ffbf00",
      "#f0ff00",
      "#6dff00",
      "#00ff9f",
      "#00d4ff"
    ]
  },
  {
    "id": "automatart/radioactive-candy",
    "name": "RADIOACTIVE CANDY",
    "source": "automatart",
    "colors": [
      "#ff24b9",
      "#fdf428",
      "#13f8d8",
      "#7b30fa",
      "#ff7527",
      "#169dff"
    ]
  },
  {
    "id": "automatart/astral-jewelry",
    "name": "ASTRAL JEWELRY",
    "source": "automatart",
    "colors": [
      "#240b7e",
      "#d8fa24",
      "#ed18dd",
      "#2beefa",
      "#ffffff",
      "#9c3df8"
    ]
  },
  {
    "id": "automatart/technicolor-infection",
    "name": "TECHNICOLOR INFECTION",
    "source": "automatart",
    "colors": [
      "#fa1c53",
      "#ff8e1c",
      "#faf21b",
      "#29ee70",
      "#1689ef",
      "#c026ff"
    ]
  },
  {
    "id": "automatart/deep-ultraviolet",
    "name": "DEEP ULTRAVIOLET",
    "source": "automatart",
    "colors": [
      "#21104c",
      "#5130c8",
      "#ff32db",
      "#14a9f6",
      "#bb70fa",
      "#ffffff"
    ]
  },
  {
    "id": "automatart/void-bone",
    "name": "VOID & BONE",
    "source": "automatart",
    "colors": [
      "#ffffff",
      "#d9d0ff",
      "#aaa2da",
      "#8573a6",
      "#534774",
      "#f3f0e7"
    ]
  }
] as const;

function resample(stops: readonly string[], count = 8): string[] {
  if (stops.length <= count) return [...stops];
  const rgb = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const hex = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return Array.from({ length: count }, (_, i) => {
    const pos = (i * (stops.length - 1)) / (count - 1);
    const a = Math.floor(pos), b = Math.min(stops.length - 1, a + 1), t = pos - a;
    const lo = rgb(stops[a]), hi = rgb(stops[b]);
    return '#' + lo.map((v, j) => hex(v * (1 - t) + hi[j] * t)).join('');
  });
}

export const MATHMAGICAL_PALETTES: Palette[] = MATHMAGICAL_ORIGINALS.map((item) => ({
  name: item.name,
  group: 'MathMAGICAL! · ' + (item.source === 'itsamoire' ? "It's a Moiré" : 'Automatart'),
  bg: '#04010a',
  colors: resample(item.colors),
}));
