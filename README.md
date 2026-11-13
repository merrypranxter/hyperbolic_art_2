# Acid Loom

A hyperbolic shader studio. Every generator from the source synthesizers is pulled out as a
selectable **engine**, and everything that used to be hard-wired around them (warps, palettes,
lighting, ink, print and analog finishes) is a toggle with its own knobs.

```
npm install
npm run dev      # http://localhost:3000
npm run build    # one self-contained file: dist/index.html
```

## How a frame is made

```
screen ─▶ SPACE WARPS ─▶ ENGINE A (+ ENGINE B, 5 blend modes) ─▶ SURFACE + INK ─▶ FINISH
          VHS tear        each returns                            normals, prism     trails (feedback)
          liquid curl     (height, phase, ink, micro)             specular, rim      halftone rosette
          Möbius                                                  palette lookup     lens aberration
          kaleidoscope                                            neon lock          glyph swarm, glitter
          log-polar tunnel                                        ink trenches       solarize, posterize, …
```

- `src/gl/engines.ts` – the 21 engines (GLSL), one function each, sharing six knobs
  (symmetry, q, depth, frequency, tension, shape).
- `src/gl/shaders.ts` – scene shader assembler (only the selected engines are compiled in),
  feedback pass, finish pass, swarm.
- `src/gl/renderer.ts` – WebGL2 renderer, program cache, ping-pong buffers, PNG export.
- `src/palettes.ts` – 53 palettes + procedural generator. `src/presets.ts` – 31 looks.
- `src/state.ts` – every knob/toggle (each is a `u_<key>` uniform), recipes, randomisers.

## Engines

| Family | Engines |
| --- | --- |
| Biomineral | Photoelastic Biomineral (KIFS + Apollonian + gyroid) |
| Hyper-Weave | Poincaré Girih Lace, Catacaustic Neovius Gem, Jacquard Memphis Loom, BZ Scroll Mycelium |
| Astral-Loom | Calabi-Yau Quintic, Turing-Physarum Coral, Crop-Circle Zeta, Hopf Ferro-Foam |
| Quasicrystal | Penrose Quasicrystal |
| Cathedral | 4D Nematic Cathedral (raymarched) |
| Hyperbolic Atlas | Modular Jellyfish, Guilloché Ribbon, Schottky Lightning, Chainmail Orbifold, Binary Brickwork, Blaschke Bloom, Confocal Moiré, Dipole Whirlpool, Geodesic Times Table, Apollonian Proper |

Keys: `C` chaos · `M` mutate · `P` palette · `F` fx roll · `S` PNG · `Space` pause · `H` hide controls.
Scripting: `window.ACIDLOOM.getRecipe()` / `.loadRecipe(json)` / `.loadPreset(i)`.
