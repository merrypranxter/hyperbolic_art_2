import { ATLAS_COMMON, ENGINE_BY_ID } from './engines';
import { UNIFORM_KEYS } from '../state';

export const QUAD_VS = /* glsl */ `#version 300 es
layout(location = 0) in vec2 a_pos;
out vec2 vUv;
void main() { vUv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const HEADER = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec2  uRes;
uniform float uTime;
uniform float uClock;
uniform vec2  uMouse;
uniform vec3  uPal[8];
uniform int   uPalN;
uniform vec3  uBg;
${UNIFORM_KEYS.map((k) => `uniform float u_${k};`).join('\n')}

#define PI  3.14159265359
#define TAU 6.28318530718
#define PHI 1.61803398875

// The source files each named these knobs differently; alias them all onto the shared set.
#define uSymmetry     u_sym
#define uDepth        u_depth
#define uOctaves      u_depth
#define uDetailFreq   u_freq
#define uDensity      u_freq
#define uTension      u_tension
#define uTwist        u_tension
#define uInkWeight    u_ink
#define uContourCarve u_ink

float safePow(float b, float e) { return pow(max(abs(b), 1e-6), e); }
vec3  safePow3(vec3 b, float e) { return pow(max(abs(b), vec3(1e-6)), vec3(e)); }
float safeAtan(float y, float x) { float sx = (abs(x) + abs(y) < 1e-6) ? 1e-6 : x; return atan(y, sx); }
vec3  safeTanh3(vec3 x) { vec3 c = clamp(x, 0.0, 10.0); return c * (27.0 + c * c) / (27.0 + 9.0 * c * c); }
mat2  rot2D(float a) { float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2  hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / max(k, 1e-4), 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
vec2  cMul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
vec2  cDiv(vec2 a, vec2 b) { float d = max(dot(b, b), 1e-9); return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / d; }
vec2  foldDihedral(vec2 p, float nSides) {
    float r = length(p);
    float a = safeAtan(p.y, p.x);
    float sector = TAU / clamp(nSides, 2.0, 24.0);
    a = mod(a + 0.5 * sector, sector) - 0.5 * sector;
    a = sqrt(a * a + 1e-5);
    return vec2(cos(a), sin(a)) * r;
}
float valueNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x), f.y);
}
float streamPotential(vec2 p, float t) {
    return valueNoise(p * 3.2 + vec2(t * 0.35, -t * 0.28)) + valueNoise(p * 6.8 - vec2(t * 0.55, t * 0.42)) * 0.5;
}
vec2 curlVelocity(vec2 p, float t) {
    float e = 0.01;
    float dy = (streamPotential(p + vec2(0.0, e), t) - streamPotential(p - vec2(0.0, e), t)) / (2.0 * e);
    float dx = (streamPotential(p + vec2(e, 0.0), t) - streamPotential(p - vec2(e, 0.0), t)) / (2.0 * e);
    return vec2(dy, -dx);
}
`;

const SCENE_MAIN = /* glsl */ `
// ---------------- PALETTE ----------------
vec3 pal(float t) {
    t = fract(t + u_palOffset + uTime * u_palCycle * 0.1);
    if (u_reverseOn > 0.5) t = 1.0 - t;
    float s = t;
    float x = t * float(uPalN);
    int i = int(floor(x));
    float f = fract(x);
    f = u_hardOn > 0.5 ? 0.0 : smoothstep(0.0, 1.0, f);
    vec3 c = mix(uPal[i % uPalN], uPal[(i + 1) % uPalN], f);
    if (u_rainbowOn > 0.5) c = mix(c, 0.5 + 0.5 * cos(TAU * (s + vec3(0.0, 0.33, 0.67))), u_rainbow);
    return c;
}

// Anti-whiteout lock: strip the achromatic floor, normalise by peak channel, rational overdrive.
vec3 lockAcidNeon(vec3 col, float overdrive) {
    vec3 c = clamp(col, 0.0, 12.0);
    float whiteFloor = min(c.r, min(c.g, c.b));
    c = max(c - whiteFloor * 0.86, vec3(0.0));
    float peak = max(c.r, max(c.g, max(c.b, 1e-5)));
    vec3 pureHue = safePow3(c / peak, 1.16);
    float energy = 1.0 - exp(-peak * overdrive * 1.25);
    return safeTanh3(pureHue * energy * (0.95 + 0.38 * overdrive));
}

// ---------------- SPACE WARPS ----------------
vec2 applyMobiusField(vec2 z, float t, vec2 pole, float warpAmt) {
    if (warpAmt <= 0.001) return z;
    vec2 a = vec2(cos(t * 0.21), sin(t * 0.17) * 0.4);
    vec2 b = pole * 0.75 * warpAmt + vec2(sin(t * 0.31), cos(t * 0.29)) * 0.22 * warpAmt;
    vec2 c = (pole.yx * 0.65 + vec2(sin(t * 0.19), -cos(t * 0.23)) * 0.45) * warpAmt;
    vec2 d = vec2(1.0, 0.18 * cos(t * 0.13));
    vec2 mobiusZ = cDiv(cMul(a, z) + b, cMul(c, z) + d);
    float r = max(length(mobiusZ), 1e-4);
    float theta = atan(mobiusZ.y, mobiusZ.x);
    vec2 logPolar = vec2(log(r) + t * 0.15, theta * (1.0 + 0.25 * sin(t * 0.1)));
    vec2 spiralZ = mix(mobiusZ, sin(logPolar * 1.5), clamp((warpAmt - 1.2) * 0.35, 0.0, 0.65));
    return mix(z, spiralZ, clamp(warpAmt, 0.0, 1.0));
}

vec2 warp(vec2 p, float t) {
    vec2 w = rot2D(u_rot) * p / clamp(u_zoom, 0.05, 20.0);
    if (u_liquidOn > 0.5) w += curlVelocity(w * 0.9, t) * 0.07 * u_liquid;
    if (u_mobiusOn > 0.5) w = applyMobiusField(w, t, uMouse, u_mobius);
    if (u_kaleidoOn > 0.5) w = foldDihedral(w, floor(u_kaleido));
    if (u_tunnelOn > 0.5) {
        float r = max(length(w), 1e-4);
        w = vec2(log(r) * 1.2 + t * 0.12, abs(atan(w.y, w.x)) / PI * 2.0 - 1.0) * u_tunnel;
    }
    return w;
}

// ---------------- ENGINE ROUTER ----------------
vec4 field(vec2 p, float t) {
    vec2 w = warp(p, t);
#ifdef HAS_B
  #if BLEND_MODE == 0
    return mix(ENGINE_A(w, t), ENGINE_B(w, t), smoothstep(0.0, 1.0, u_morph));
  #elif BLEND_MODE == 1
    vec4 b = ENGINE_B(w, t);
    vec2 off = vec2(sin(b.x * 3.0 + b.y * 2.0), cos(b.x * 3.0 - b.y * 2.0)) * 0.3 * u_morph;
    vec4 a = ENGINE_A(w + off, t);
    a.w = mix(a.w, b.w, 0.5 * u_morph);
    return a;
  #elif BLEND_MODE == 2
    vec4 a = ENGINE_A(w, t);
    vec4 b = ENGINE_B(w, t);
    a.z *= mix(1.0, b.z, u_morph);
    a.x += b.x * 0.35 * u_morph;
    return a;
  #elif BLEND_MODE == 3
    vec4 a = ENGINE_A(w, t);
    vec4 b = ENGINE_B(w, t);
    a.y += b.x * 1.5 * u_morph;
    a.x += b.x * 0.5 * u_morph;
    return a;
  #else
    vec4 a = ENGINE_A(w, t);
    vec4 b = ENGINE_B(w, t);
    return mix(a, b, smoothstep(-0.12, 0.12, b.x - a.x + (u_morph - 0.5) * 2.0));
  #endif
#else
    return ENGINE_A(w, t);
#endif
}

void main() {
    vec2 uv = vUv;
    vec2 p = uv * 2.0 - 1.0;
    float aspect = uRes.x / max(uRes.y, 1.0);
    p.x *= aspect;
    float t = uTime;

    // VHS horizontal sync tear + head-switch wobble
    if (u_vhsOn > 0.5) {
        float band = floor(uv.y * 44.0 - uClock * 6.5);
        float rnd = hash12(vec2(band, floor(uClock * 14.0)));
        float tearMask = step(0.91 - min(u_vhs, 1.2) * 0.15, rnd);
        p.x += (hash12(vec2(uv.y * 85.0, uClock)) - 0.5) * 0.11 * u_vhs * tearMask;
        p.x += sin(uv.y * 32.0 + uClock * 9.5) * 0.005 * u_vhs;
    }

    vec4 S = field(p, t);
    float h0 = S.x;

    // Surface normal from the height field
#ifdef FD_NORMALS
    float eps = 0.004;
    vec2 grad = vec2(field(p + vec2(eps, 0.0), t).x - h0, field(p + vec2(0.0, eps), t).x - h0) / eps;
#else
    vec2 grad = vec2(dFdx(h0), dFdy(h0)) * uRes.y * 0.5;
#endif
    grad = clamp(grad, -400.0, 400.0);
    vec3 normal  = normalize(vec3(-grad * 0.075 * u_relief, 1.0));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float slope  = length(normal.xy);
    float fresnel = 1.0 - normal.z;

    // Birefringent phase -> palette, split into three dispersed bands
    float basePhase = S.y * u_colorFreq + fresnel * 0.5 * u_gloss + h0 * 0.25;
    vec3 col;
    if (u_prismOn > 0.5) {
        float d = (0.03 + slope * 0.085) * u_prism;
        col = vec3(pal(basePhase + d).r, pal(basePhase).g, pal(basePhase - d).b);
    } else {
        col = pal(basePhase);
    }
    if (u_iridOn > 0.5) col = mix(col, pal(basePhase + 0.42), clamp(abs(S.w) * 0.42, 0.0, 0.65));

    if (u_embossOn > 0.5) col *= 0.38 + 0.68 * max(dot(normal, normalize(vec3(-0.5, 0.7, 1.0))), 0.0);

    if (u_specOn > 0.5) {
        vec3 L1 = normalize(vec3(cos(t * 0.7) * 0.75, sin(t * 0.5) * 0.75, 0.85));
        vec3 L2 = normalize(vec3(-sin(t * 0.6) * 0.80, cos(t * 0.8) * 0.80, 0.70));
        float spec1 = safePow(max(dot(normal, normalize(L1 + viewDir)), 0.0), 32.0);
        float spec2 = safePow(max(dot(normal, normalize(L2 + viewDir)), 0.0), 20.0);
        // tinted with shifted palette stops so highlights stay coloured
        col += pal(basePhase + 0.25) * spec1 * 0.95 * u_gloss;
        col += pal(basePhase + 0.62) * spec2 * 0.70 * u_gloss;
    }

    // Iridescent fresnel rim: glows along steep micro-slopes and filigree crests
    if (u_rimOn > 0.5) col += pal(basePhase + 0.42) * (pow(fresnel, 2.5) * 1.35 + abs(S.w) * 0.55) * u_rim;

    // Tone curve
    if (u_neonOn > 0.5) col = lockAcidNeon(col, u_acid);
    else col = vec3(1.0) - exp(-max(col, 0.0) * u_acid * 0.9);

    // Structural ink trenches down to the substrate colour
    float inkMask = 1.0;
    if (u_inkOn > 0.5) {
        float ridgeInk = smoothstep(0.95, 0.12, slope * u_ink * 0.75);
        inkMask = mix(1.0, clamp(S.z * mix(0.38, 1.0, ridgeInk), 0.0, 1.0), u_inkDepth);
    }
    if (u_engraveOn > 0.5) {
        vec2 m = (uv - 0.5) * vec2(aspect, 1.0);
        float lpi = 48.0 + u_freq * 3.4;
        float guilloche = sin((m.x * cos(0.4) + m.y * sin(0.4) + h0 * 0.18) * lpi * PI);
        float engraveMask = smoothstep(-0.35 * u_ink, 0.35, guilloche);
        inkMask *= mix(1.0, clamp(0.08 + engraveMask, 0.0, 1.0), u_engrave);
    }
    col = mix(uBg, col, inkMask);

    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

export interface SceneKey { a: string; b: string; blend: number; fd: boolean; }

export function sceneKey(k: SceneKey) {
  return `${k.a}|${k.b}|${k.b === 'none' ? 0 : k.blend}|${k.fd ? 1 : 0}`;
}

export function buildSceneFS(k: SceneKey): string {
  const A = ENGINE_BY_ID[k.a];
  const B = k.b !== 'none' ? ENGINE_BY_ID[k.b] : undefined;
  const engines = B && B.id !== A.id ? [A, B] : [A];
  const heavy = engines.some((e) => e.heavy);
  const defines = [
    `#define ENGINE_A ${A.fn}`,
    B ? `#define HAS_B\n#define ENGINE_B ${B.fn}\n#define BLEND_MODE ${k.blend}` : '',
    k.fd && !heavy ? '#define FD_NORMALS' : '',
  ].join('\n');
  return [
    HEADER,
    engines.some((e) => e.atlas) ? ATLAS_COMMON : '',
    ...engines.map((e) => e.src),
    defines,
    SCENE_MAIN,
  ].join('\n');
}

/** Pass 2: curl-noise advected ping-pong feedback (slit-scan persistence). */
export const FEEDBACK_FS = HEADER + /* glsl */ `
uniform sampler2D uCur;
uniform sampler2D uHist;
void main() {
    vec3 cur = clamp(texture(uCur, vUv).rgb, 0.0, 1.0);
    float fb = u_trails;
    vec2 centered = vUv - 0.5 - uMouse * 0.15;
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 curlVel = curlVelocity(vec2(centered.x * aspect, centered.y) * 1.45, uTime);
    float dist = length(centered);
    vec2 radialDrift = -centered * 0.0055;
    vec2 tangentDrift = vec2(-centered.y, centered.x) * 0.0038 * sin(dist * 8.0 - uTime);
    vec2 off = (curlVel * 0.0045 + radialDrift + tangentDrift) * (0.6 + 0.6 * fb);
    float trailDisp = 0.0018 * fb;
    vec3 hist = vec3(
        texture(uHist, clamp(vUv + off * 1.1 + vec2(trailDisp, 0.0), 0.002, 0.998)).r,
        texture(uHist, clamp(vUv + off, 0.002, 0.998)).g,
        texture(uHist, clamp(vUv + off * 0.9 - vec2(trailDisp, 0.0), 0.002, 0.998)).b
    );
    // energy-attenuated hue rotation: trails decay to colour, never to white
    vec3 rotated = vec3(dot(hist, vec3(0.82, 0.08, 0.00)), dot(hist, vec3(0.00, 0.82, 0.08)), dot(hist, vec3(0.08, 0.00, 0.82)));
    float histMin = min(rotated.r, min(rotated.g, rotated.b));
    rotated = max(rotated - histMin * 0.55, vec3(0.0));
    vec3 blended = mix(cur, max(cur, rotated * (0.90 * fb)), fb * 0.85);
    fragColor = vec4(clamp(blended, 0.0, 1.0), 1.0);
}
`;

/** Pass 3: print / lens / analog finish. */
export const POST_FS = HEADER + /* glsl */ `
uniform sampler2D uTex;

float halftoneDot(vec2 m, float angleDeg, float lpi, float v) {
    vec2 g = rot2D(angleDeg * (PI / 180.0)) * m * lpi;
    float dist = length(fract(g) - 0.5) * 1.41421356;
    float radius = sqrt(clamp(v, 0.0, 1.0)) * 0.78; // capped so the substrate always shows between dots
    return 1.0 - smoothstep(radius - 0.12, radius + 0.12, dist);
}

void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / max(uRes.y, 1.0);
    if (u_mirrorOn > 0.5) uv.x = 0.5 - abs(uv.x - 0.5);
    if (u_pixelOn > 0.5) {
        vec2 g = vec2(floor(u_pixel * aspect), floor(u_pixel));
        uv = (floor(uv * g) + 0.5) / g;
    }

    vec3 col;
    if (u_caOn > 0.5) {
        vec2 off = ((uv - 0.5) * 0.015 + vec2(0.005, 0.0)) * u_ca;
        col = vec3(texture(uTex, clamp(uv + off, 0.001, 0.999)).r, texture(uTex, uv).g, texture(uTex, clamp(uv - off, 0.001, 0.999)).b);
    } else {
        col = texture(uTex, uv).rgb;
    }

    // Spot-neon halftone rosette on the substrate, plus a moire interference web
    if (u_halftoneOn > 0.5) {
        vec2 m = (uv - 0.5) * vec2(aspect, 1.0);
        // dark ground: additive neon dots. light ground: subtractive ink dots, like real paper.
        float paper = step(0.45, dot(uBg, vec3(0.299, 0.587, 0.114)));
        vec3 v = mix(col, 1.0 - col, paper);
        vec3 dots = vec3(halftoneDot(m, 15.0, u_dots, v.r), halftoneDot(m, 75.0, u_dots, v.g), halftoneDot(m, 0.0, u_dots, v.b));
        vec3 inked = mix(min(col * 1.2 + 0.25, 1.0), col * 0.85, paper);
        vec3 print = mix(uBg, inked, dots);
        float moireX = sin((m.x * cos(0.26) - m.y * sin(0.26)) * u_dots * PI);
        float moireY = sin((m.x * cos(1.30) - m.y * sin(1.30)) * u_dots * PI);
        float web = smoothstep(-0.35, 0.45, moireX * moireY);
        print = mix(print * mix(0.4, 1.15, web), mix(print, uBg, (1.0 - web) * 0.25), paper);
        col = mix(col, print, u_halftone);
    }

    if (u_hue > 0.001) {
        float a = u_hue * TAU, c = cos(a), s = sin(a);
        vec3 k = vec3(0.57735);
        col = col * c + cross(k, col) * s + k * dot(k, col) * (1.0 - c);
    }
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = max(mix(vec3(luma), col, u_sat), 0.0);

    if (u_solarOn > 0.5) col = mix(col, abs(sin(col * PI * (0.5 + u_solar))), clamp(u_solar * 1.5, 0.0, 1.0));
    if (u_posterOn > 0.5) col = floor(col * u_poster + 0.5) / u_poster;

    if (u_glitterOn > 0.5) {
        float h = hash12(floor(gl_FragCoord.xy / 2.0));
        col += step(0.982, h) * pow(max(0.0, sin(uClock * 3.0 + h * 90.0)), 24.0) * (0.25 + luma) * vec3(1.0, 0.92, 1.0) * 1.6;
    }
    if (u_scanOn > 0.5) col *= 0.86 + 0.14 * sin(gl_FragCoord.y * PI);
    if (u_grainOn > 0.5) col += (hash12(gl_FragCoord.xy + fract(uClock * 17.3) * 100.0) - 0.5) * 0.14 * u_grain;
    if (u_vignetteOn > 0.5) col *= mix(0.72, 1.0, 1.0 - smoothstep(0.7, 1.68, length(vUv * 2.0 - 1.0)));
    col = clamp(col, 0.0, 1.0);
    if (u_invertOn > 0.5) col = 1.0 - col;
    fragColor = vec4(col, 1.0);
}
`;

/** Overlay: phyllotaxis + Thomas-attractor glyph swarm, coloured from the live palette. */
export const SWARM_VS = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec4 a_particleData; // idFrac, goldenAngle, shellRadius, glyphType
uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;
uniform float uDpr;
uniform float u_zoom, u_sym, u_tension, u_swarm;
out float vGlyphType;
out float vColorSeed;
out float vAlpha;
#define PI  3.14159265359
#define TAU 6.28318530718
#define PHI 1.61803398875
void main() {
    float idFrac = a_particleData.x;
    float gAngle = a_particleData.y;
    float rShell = a_particleData.z;
    vGlyphType   = a_particleData.w;
    float t = uTime * 0.55;
    float nSym = clamp(u_sym, 3.0, 24.0);
    float dir = mod(floor(idFrac * 12000.0), 2.0) < 0.5 ? 1.0 : -1.0;
    float orbitAngle = gAngle + t * (0.35 + 0.65 * (1.0 - rShell)) * dir;
    float cymaticMod = 0.14 * sin(orbitAngle * nSym + t * 2.0 + u_tension);
    vec2 phylloPos = vec2(cos(orbitAngle), sin(orbitAngle)) * (0.08 + rShell * 1.15 + cymaticMod);
    float phase3D = idFrac * TAU * 29.0 + t * 1.2;
    vec3 thomas = vec3(
        sin(phase3D + sin(orbitAngle * 3.0)),
        sin(phase3D * PHI + cos(orbitAngle * 2.0)),
        cos(phase3D / PHI - sin(orbitAngle * 4.0)));
    vec2 attractorPos = thomas.xy * (0.55 + 0.35 * cos(thomas.z * PI + u_tension));
    vec2 pos = mix(phylloPos, attractorPos, 0.35 + 0.30 * sin(u_tension * 1.3));
    vec2 toMouse = pos - uMouse * 0.5;
    pos += vec2(-toMouse.y, toMouse.x) * (0.08 / (length(toMouse) + 0.15)) * sin(t * 2.0);
    vec2 screenPos = pos * clamp(u_zoom, 0.35, 3.5);
    screenPos.x /= uRes.x / max(uRes.y, 1.0);
    vColorSeed = fract(idFrac * 7.3 + rShell * 1.9 - t * 0.15);
    float mixAmt = min(u_swarm, 1.2);
    vAlpha = clamp(mixAmt * (0.45 + 0.45 * sin(idFrac * 150.0 + t * 3.5)), 0.0, 0.92);
    gl_Position = vec4(screenPos, 0.0, 1.0);
    gl_PointSize = clamp((3.2 + 5.8 * fract(idFrac * 97.1)) * mixAmt * uDpr, 1.0, 28.0);
}
`;

export const SWARM_FS = /* glsl */ `#version 300 es
precision highp float;
in float vGlyphType;
in float vColorSeed;
in float vAlpha;
out vec4 fragColor;
uniform vec3 uPal[8];
uniform int  uPalN;
uniform vec3 uBg;
void main() {
    if (vAlpha <= 0.01) discard;
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;
    float a = atan(p.y, p.x + 1e-6);
    float mask = 0.0;
    if (vGlyphType < 0.5) {            // 6-pointed diatom star
        float rays = abs(cos(a * 3.0));
        mask = smoothstep(rays, rays - 0.25, r);
    } else if (vGlyphType < 1.5) {     // moire target ring
        mask = max(smoothstep(0.18, 0.02, abs(r - 0.62)), smoothstep(0.28, 0.05, r));
    } else if (vGlyphType < 2.5) {     // stipple dot
        mask = smoothstep(0.85, 0.20, r);
    } else {                           // diamond reticle
        float d = abs(p.x) + abs(p.y);
        mask = smoothstep(0.20, 0.02, abs(d - 0.65)) + smoothstep(0.22, 0.05, r);
    }
    float outerRim = smoothstep(1.0, 0.55, r);
    if (outerRim < 0.05) discard;
    vec3 neon = uPal[int(floor(vColorSeed * float(uPalN))) % uPalN];
    // dark halo ring around each sprite keeps it legible on a busy field
    fragColor = vec4(mix(uBg, neon, clamp(mask, 0.0, 1.0)), outerRim * vAlpha * 0.85);
}
`;
