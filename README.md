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
- `src/palettes.ts` – 84 palettes (53 Acid Loom originals + 31 source-traced MathMAGICAL! ramps), plus a procedural generator. `src/presets.ts` – 31 looks.
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

## MathMAGICAL-style workspace (feature branch)

The artwork remains a full-screen WebGL2 canvas, with the existing engine/shader pipeline untouched.
The control rack can be hidden completely with **HIDE** and restored with **CONTROLS**.
Five tabs keep settings local instead of putting dozens of independent panels in one scroll: 
**CREATE** (presets and engines), **SHAPE** (geometry and warps),
**COLOUR** (palette bank and stops), **EFFECTS** (surface and finishing),
**EXPORT** (output and advanced tools). Expand families and effect controls only when needed.

The original **53** palettes are untouched. The **31** original MathMAGICAL palettes
(26 It's a Moiré and 5 Automatart) are preserved in
`src/mathmagical-palettes.ts` with all their original color stops.
Because the existing shader has eight slots (`uPal[8]`), 12-stop ramps are
resampled to eight for rendering—source colors are retained for future full-ramp support.

### Export

- **PNG**: screen size or output presets, up to 4096-square/4K if the GPU supports it.
- **GIF**: frame-sampled animation, 8/12/15 fps, 2–10 s; 256 colors per frame.
- **MP4**: H.264 encoding via Mediabunny/WebCodecs when supported,
  12/24/30/60 fps, 2–30 s, configurable bitrate 12–60 Mbps.
- Square, portrait, landscape, 3:4 and 4:3 dimensions available.
- During animation export the renderer temporarily uses the chosen output
  dimensions and steps shader time at fixed intervals, independent of
  live preview frame rate. Cancel is supported between frames.
- GIF and MP4 encoding depend on device memory and codec support; 4K/long outputs
  can fail on phones. MP4 requires AVC WebCodecs encoding support.
  The original **LIVE REC** is still available in Export → Advanced tools.
- Timeline capture is deterministic in timestamp spacing; exact seamless loops
  cannot be guaranteed for every procedural engine or feedback-trail effect.

To validate after installing: `npm ci && npm run lint && npm run build`.
No deployment is required to review this branch.

Keys: `C` chaos · `M` mutate · `P` palette · `F` fx roll · `S` PNG · `Space` pause · `H` hide controls.
Scripting: `window.ACIDLOOM.getRecipe()` / `.loadRecipe(json)` / `.loadPreset(i)`.
