/**
 * ENGINE REGISTRY
 * Every engine is a GLSL function `vec4 eng_xxx(vec2 p, float t)` returning
 *   x = height field (drives normals / relief / specular)
 *   y = colour phase (palette lookup)
 *   z = ink mask   (1 = lit neon, 0 = substrate ink trench)
 *   w = micro detail (drives iridescent harmonic colour)
 * All engines read the same shared knobs: u_sym, u_q, u_depth, u_freq,
 * u_tension, u_shape, u_ink, uMouse. The original per-file uniform names are
 * aliased to these in common.ts so the source math stays untouched.
 */

export interface EngineDef {
  id: string;
  name: string;
  family: string;
  tag: string;
  fn: string;
  src: string;
  /** needs the shared hyperbolic-atlas helper chunk */
  atlas?: boolean;
  /** raymarched: finite-difference normals are forced off */
  heavy?: boolean;
  /** what the shared knobs mean for this engine */
  knobs: Partial<Record<'sym' | 'q' | 'depth' | 'freq' | 'tension' | 'shape', string>>;
}

/* ------------------------------------------------------------------ */
/* FAMILY: BIOMINERAL  (Hyperbolic Photoelastic Biomineralization)     */
/* ------------------------------------------------------------------ */
const BIOMINERAL = /* glsl */ `
vec4 eng_biomineral(vec2 p2, float t) {
    vec2 z = foldDihedral(p2, u_sym);
    vec3 p = vec3(z, 0.35 * cos(length(z) * 2.5 - t * 0.45));
    float dr = 1.0;
    float trapAxes = 1e5, trapGyroid = 1e5;
    float silicaPores = 0.0, stressWave = 0.0, logJac = 0.0, resolved = 0.0, total = 0.0;
    float apo = 0.05 + u_shape * 0.29;
    float rMin2 = clamp(apo * apo, 0.0025, 1.04);
    float subSides = max(3.0, floor(u_sym * 0.5 + 1.5));
    float gDensity = u_freq * 0.4;
    // Band-limit: each recursion multiplies spatial frequency by dr. Once a layer is finer than
    // a pixel it only aliases into noise, so fade it out. Zooming in brings the layers back.
    // u_grit = 1 switches the filter off and gives the raw source math (pure sparkle).
    float pxWorld = 2.0 / (uRes.y * max(u_zoom, 0.05)) * 6.0 * (1.0 - u_grit) * (1.0 - u_grit);

    for (int i = 0; i < 16; i++) {
        float fi = float(i);
        if (fi >= u_depth) break;
        if (mod(fi, 2.0) < 0.5) p.xy = foldDihedral(p.xy, subSides);
        else p.xy = sqrt(p.xy * p.xy + 1e-5);

        vec3 boxLimit = vec3(0.92, 0.92, 0.78);
        p = clamp(p, -boxLimit, boxLimit) * 2.0 - p;

        float r2 = dot(p, p);
        float invFactor = max(1.38 / clamp(r2, rMin2, 1.05), 1.0);
        float lod = dr * pxWorld * 2.0;
        float fadeJ = 1.0 / (1.0 + lod * lod);
        p *= invFactor;
        dr = dr * invFactor + 1.0;
        logJac += log(invFactor) * fadeJ;

        float twistAngle = 0.28 * fi + t * 0.14 + (uMouse.x + uMouse.y) * 0.35 + (u_tension - 1.0) * 0.15;
        p.xy *= rot2D(twistAngle);
        p.yz *= rot2D(twistAngle * 0.618);
        p -= vec3(0.68, 0.52, 0.34);

        float g = dr * gDensity * pxWorld;
        float fade = 1.0 / (1.0 + g * g);

        vec3 gp = p * gDensity;
        float gyroid = sin(gp.x) * cos(gp.y) + sin(gp.y) * cos(gp.z) + sin(gp.z) * cos(gp.x);
        float chladni = cos(gp.x * PHI) * cos(gp.y / PHI) - cos(gp.x / PHI) * cos(gp.y * PHI);
        float poreShell = abs(gyroid) - 0.22 * abs(chladni);
        float iterWeight = pow(0.78, fi) * fade;

        resolved += iterWeight; total += pow(0.78, fi);
        silicaPores += cos(poreShell * TAU + t * 0.5) * iterWeight;
        stressWave  += (gyroid * chladni) * iterWeight;
        trapAxes   = min(trapAxes, mix(1.0, min(abs(p.x), abs(p.y)), fadeJ));
        trapGyroid = min(trapGyroid, mix(0.2, abs(poreShell) / max(dr * 0.02, 1.0), fade));
    }

    float logJacobian  = logJac * 0.32;
    float poreDetail   = log(1e-4 + trapGyroid * 6.0) * 0.28;
    float axisFiligree = exp(-trapAxes * 14.0);
    float stress = logJacobian * 0.85 + silicaPores * 0.38 - poreDetail * 0.45 + stressWave * 0.30 + axisFiligree * 0.25;

    float silicaRim  = smoothstep(0.02, 0.28 * u_ink, abs(sin(silicaPores * 3.5)));
    float poreCavity = smoothstep(0.0, 0.12, trapGyroid * 12.0);
    float ink = clamp(mix(0.22, 1.0, silicaRim * poreCavity) + axisFiligree * 0.5, 0.0, 1.0);
    // zones whose detail is entirely sub-pixel sink into the ink ground instead of averaging to grey
    ink *= mix(0.12, 1.0, smoothstep(0.12, 0.55, resolved / max(total, 1e-4)));
    return vec4(stress, stress * 1.375 - t * 0.12, ink, axisFiligree);
}
`;

/* ------------------------------------------------------------------ */
/* FAMILY: HYPER-WEAVE PACK II  (engines 05-08)                        */
/* ------------------------------------------------------------------ */
const GIRIH = /* glsl */ `
vec4 eng_girih(vec2 p, float t) {
    vec2 q = (p - uMouse * 0.45) * (0.85 + uDetailFreq * 0.06);
    vec2 cellWave = sin(q * 1.35 + vec2(sin(q.y * 0.9 + t * 0.25), cos(q.x * 0.9 - t * 0.2)));
    vec2 z = cellWave * 0.72;

    vec2 aMob = vec2(cos(t * 0.35), sin(t * 0.28)) * 0.32 * clamp(uTension * 0.4, 0.0, 0.75);
    vec2 conjA = vec2(aMob.x, -aMob.y);
    z = cDiv(z + aMob, vec2(1.0, 0.0) + cMul(conjA, z));

    float pSym = clamp(floor(uSymmetry), 5.0, 20.0);
    float qSym = 3.0 + mod(floor(uTension), 2.0);
    float angleP = PI / pSym;
    float angleQ = PI / qSym;
    float sinP = max(sin(angleP), 0.05);
    float cosQ = cos(angleQ);

    float centerDist = cosQ / sinP;
    float radiusSq = max(centerDist * centerDist - 1.0, 0.08);
    float radius = sqrt(radiusSq);
    vec2 invCenter = vec2(centerDist * (0.92 + 0.08 * sin(t * 0.3)), 0.0);

    float invCount = 0.0;
    float conformalScale = 1.0;
    float minGeodesicArc = 1e4;
    int maxIter = int(clamp(uDepth, 2.0, 14.0));

    for (int i = 0; i < 14; i++) {
        if (i >= maxIter) break;
        z = foldDihedral(z, pSym);
        vec2 diff = z - invCenter;
        float d2 = max(dot(diff, diff), 1e-5);
        minGeodesicArc = min(minGeodesicArc, abs(sqrt(d2) - radius));
        if (d2 < radiusSq) {
            float factor = radiusSq / d2;
            z = invCenter + diff * factor;
            conformalScale *= factor;
            invCount += 1.0;
        } else {
            break;
        }
    }

    vec2 localZ = (z - invCenter * 0.5) * (3.5 + uDetailFreq * 0.22);
    float strapA = sin((localZ.x + localZ.y * PHI) * PI);
    float strapB = sin((localZ.x * PHI - localZ.y) * PI);
    float girihRibbon = min(abs(strapA), abs(strapB));

    float crossingParity = sign(strapA * strapB) * (mod(invCount, 2.0) * 2.0 - 1.0);
    float strapHeight = cos(girihRibbon * PI * 2.0) * 0.55 + crossingParity * 0.25;

    float laceEyelet = abs(sin(length(localZ) * (8.0 + uDetailFreq * 0.4) - t * 1.2));
    float height = strapHeight + laceEyelet * 0.25;
    float phase = invCount * 0.19 + log(1.0 + conformalScale) * 0.22 + strapHeight * 0.35 - t * 0.12;

    float strapOutline = smoothstep(0.03 * uInkWeight, 0.22 * uInkWeight, abs(girihRibbon - 0.18));
    float geodesicLine = smoothstep(0.015 * uInkWeight, 0.09 * uInkWeight, minGeodesicArc);
    float lacePores    = smoothstep(0.08 * uInkWeight, 0.35 * uInkWeight, laceEyelet);
    float inkMask      = strapOutline * geodesicLine * mix(0.28, 1.0, lacePores);

    return vec4(height, phase, inkMask, strapA * strapB);
}
`;

const CAUSTIC = /* glsl */ `
vec3 causticJacobian(vec2 uvCoord, float t, float tension) {
    vec2 p = uvCoord;
    float totalCaustic = 0.0;
    float detAccum = 0.0;
    float amp = 1.0;
    float freq = 1.85;
    int maxOct = int(clamp(uDepth * 0.65, 2.0, 8.0));
    for (int i = 0; i < 8; i++) {
        if (i >= maxOct) break;
        float fi = float(i);
        vec2 q = rot2D(fi * 0.618 * PI + t * 0.08) * p * freq;
        float wx = q.x + sin(q.y * 1.3 + t * 0.9);
        float wy = q.y + cos(q.x * 1.3 - t * 0.8);
        float hxx = -cos(wx) - 1.69 * cos(wy) * sin(q.x * 1.3 - t * 0.8);
        float hyy = -cos(wy) - 1.69 * cos(wx) * cos(q.y * 1.3 + t * 0.9);
        float hxy = -1.3 * sin(wx) * cos(q.y * 1.3 + t * 0.9);
        float tau = 0.38 * tension;
        float detJ = (1.0 + tau * hxx) * (1.0 + tau * hyy) - (tau * tau * hxy * hxy);
        float causticSpike = 1.0 / (abs(detJ) + 0.085);
        totalCaustic += clamp(causticSpike * 0.14, 0.0, 2.4) * amp;
        detAccum += detJ * amp;
        p += vec2(sin(wx), sin(wy)) * 0.22 * amp;
        freq *= 1.52;
        amp *= 0.72;
    }
    return vec3(totalCaustic, detAccum, length(p));
}

vec4 eng_caustic(vec2 p, float t) {
    vec2 z = (p - uMouse * 0.4) * (1.2 + uDetailFreq * 0.09);
    z = foldDihedral(z, uSymmetry);

    vec3 gp = vec3(z * 2.2, sin(length(z) * 2.5 - t * 0.6) * 1.5);
    float cosX = cos(gp.x), cosY = cos(gp.y), cosZ = cos(gp.z);
    float neovius = 3.0 * (cosX + cosY + cosZ) + 4.0 * cosX * cosY * cosZ;
    float schwarzP = cosX + cosY + cosZ;
    float gemFacet = mix(neovius * 0.25, schwarzP * 0.45, 0.4);

    vec3 causticData = causticJacobian(z + gemFacet * 0.18, t, uTension);
    float photonWeb = causticData.x;
    float jacobianDet = causticData.y;

    float height = photonWeb * 0.65 + gemFacet * 0.35;
    float phase  = photonWeb * 0.42 - gemFacet * 0.30 + jacobianDet * 0.15 - t * 0.14;

    float facetEdge = smoothstep(0.03 * uInkWeight, 0.26 * uInkWeight, abs(fract(gemFacet * 1.5) - 0.5));
    float causticValley = smoothstep(0.32 * uInkWeight, 1.15, photonWeb);
    float inkMask = clamp(max(causticValley, facetEdge * 0.65) * facetEdge, 0.0, 1.0);

    return vec4(height, phase, inkMask, neovius);
}
`;

const JACQUARD = /* glsl */ `
vec4 eng_jacquard(vec2 p, float t) {
    vec2 q = p - uMouse * 0.35;
    if (uSymmetry > 4.5) {
        q = mix(q, foldDihedral(q, uSymmetry), 0.65);
    }

    float loomScale = 6.0 + uDetailFreq * 1.15;
    vec2 loomUV = q * loomScale;
    vec2 shearedUV = vec2(
        loomUV.x + sin(q.y * 8.0 + t * 1.2) * 0.35 * uTension,
        loomUV.y + cos(q.x * 8.0 - t * 1.0) * 0.35 * uTension
    );

    vec2 threadCell = floor(shearedUV);
    vec2 threadLocal = fract(shearedUV) - 0.5;

    float diamondDamask = abs(mod(threadCell.x + threadCell.y + floor(t * 2.0), 8.0) - 4.0)
                        + abs(mod(threadCell.x - threadCell.y, 8.0) - 4.0);
    float twillStep = mod(threadCell.x + threadCell.y * 2.0 + floor(uDepth), 4.0);
    float warpOnTop = step(2.0, mod(diamondDamask + twillStep, 4.0));

    float warpProfile = cos(threadLocal.x * PI);
    float weftProfile = cos(threadLocal.y * PI);
    float yarnCrown = mix(weftProfile, warpProfile, warpOnTop);

    float twistCoord = mix(
        shearedUV.x * 4.0 + threadLocal.y * 14.0,
        shearedUV.y * 4.0 - threadLocal.x * 14.0,
        warpOnTop
    );
    float microFiberPly = sin(twistCoord * PI + t * 2.0) * 0.5 + 0.5;

    vec2 memphisGrid = fract(q * (1.8 + uDepth * 0.15) + vec2(t * 0.08, -t * 0.06)) - 0.5;
    float ziggurat = floor(max(abs(memphisGrid.x), abs(memphisGrid.y)) * 8.0) / 8.0;
    float checker  = mod(floor(shearedUV.x * 0.5) + floor(shearedUV.y * 0.5), 2.0);
    float squiggle = sin(q.x * 18.0 + sin(q.y * 14.0 + t * 2.5) * 2.5);

    float height = yarnCrown * (0.65 + 0.25 * microFiberPly) + ziggurat * 0.35;
    float phase  = warpOnTop * 0.28 + ziggurat * 0.85 + checker * 0.18 + microFiberPly * 0.15 - t * 0.12;

    float threadGap = smoothstep(0.05 * uInkWeight, 0.32 * uInkWeight, yarnCrown);
    float plyGroove = mix(0.42, 1.0, smoothstep(0.1, 0.7, microFiberPly));
    float memphisBorder = smoothstep(0.02 * uInkWeight, 0.14 * uInkWeight, abs(fract(max(abs(memphisGrid.x), abs(memphisGrid.y)) * 6.0) - 0.5));
    float inkMask = threadGap * plyGroove * mix(0.35, 1.0, memphisBorder);

    return vec4(height, phase, inkMask, squiggle);
}
`;

const BZMYCELIUM = /* glsl */ `
vec4 eng_bzmycelium(vec2 p, float t) {
    vec2 q = (p - uMouse * 0.4) * (1.35 + uDetailFreq * 0.07);

    float spiralField = 0.0;
    int numCores = int(clamp(uSymmetry * 0.5, 3.0, 8.0));
    for (int k = 0; k < 8; k++) {
        if (k >= numCores) break;
        float fk = float(k);
        float coreAngle = fk * TAU / float(numCores) + t * 0.22;
        vec2 corePos = vec2(cos(coreAngle), sin(coreAngle)) * (0.65 + 0.2 * sin(t * 0.4 + fk));
        vec2 dVec = q - corePos;
        float rCore = sqrt(dot(dVec, dVec) + 0.008);
        float thetaCore = safeAtan(dVec.y, dVec.x);
        float chirality = (mod(fk, 2.0) < 0.5) ? 1.0 : -1.0;
        float wave = sin(rCore * (7.5 + uDetailFreq * 0.35) - chirality * thetaCore * 2.0 - t * 2.4);
        spiralField += wave / (1.0 + rCore * 1.15);
    }

    vec2 hyphaP = foldDihedral(q, max(3.0, floor(uSymmetry * 0.5))) * 1.8;
    float mycelium = 0.0;
    float amp = 0.65;
    float freq = 1.95;
    int maxOct = int(clamp(uDepth, 3.0, 11.0));

    for (int i = 0; i < 11; i++) {
        if (i >= maxOct) break;
        float fi = float(i);
        vec2 sp = hyphaP * freq + vec2(spiralField * 0.55 * uTension);
        float n1 = sin(sp.x + cos(sp.y * 1.35 + t * 0.5 + fi));
        float n2 = cos(sp.y - sin(sp.x * 1.35 - t * 0.4 - fi));
        float ridge = abs(n1 + n2 * 0.75);
        float branchCrest = 1.0 - smoothstep(0.0, 0.55, ridge);
        mycelium += branchCrest * amp;
        hyphaP = rot2D(0.68 + 0.15 * uTension) * (hyphaP + vec2(n2, -n1) * 0.28 * amp);
        freq *= 1.58;
        amp *= 0.72;
    }

    vec2 sporeGrid = fract(hyphaP * 3.5) - 0.5;
    float sporeDot = smoothstep(0.32, 0.06, length(sporeGrid));

    float height = spiralField * 0.45 + mycelium * 0.65 + sporeDot * 0.25;
    float phase  = spiralField * 0.55 + mycelium * 0.72 - t * 0.16 + sporeDot * 0.2;

    float bzFront = smoothstep(0.06 * uInkWeight, 0.38 * uInkWeight, abs(sin(spiralField * PI * 1.8)));
    float hyphaWall = smoothstep(0.02 * uInkWeight, 0.18 * uInkWeight, abs(mycelium - 0.35));
    float inkMask = clamp(mix(bzFront * hyphaWall, 1.0, sporeDot * 0.75), 0.0, 1.0);

    return vec4(height, phase, inkMask, mycelium);
}
`;

/* ------------------------------------------------------------------ */
/* FAMILY: ASTRAL-LOOM  (engines 01-04)                                */
/* ------------------------------------------------------------------ */
const CALABI = /* glsl */ `
vec4 eng_calabi(vec2 p, float t) {
    vec2 z = p - uMouse * 0.45;
    float r0 = length(z) + 1e-4;
    z = foldDihedral(z, uSymmetry);

    float nExp = clamp(floor(uSymmetry * 0.5 + 2.0), 3.0, 9.0);
    float scale = 1.6 + uDensity * 0.14;
    vec2 w = z * scale;

    float sheetAccum = 0.0;
    float branchPhase = 0.0;
    float ribbonEdge = 1e4;
    float maxSheets = clamp(uOctaves, 2.0, 8.0);

    for (int k = 0; k < 8; k++) {
        float fk = float(k);
        if (fk >= maxSheets) break;
        float sheetAngle = fk * TAU / nExp + uTwist * 0.65 + t * 0.22;
        vec2 wk = rot2D(sheetAngle) * w;
        float u = wk.x;
        float v = clamp(wk.y, -2.2, 2.2);
        float ch = 0.5 * (exp(v) + exp(-v));
        float sh = 0.5 * (exp(v) - exp(-v));
        vec2 cosZ = vec2(cos(u) * ch, -sin(u) * sh);
        vec2 sinZ = vec2(sin(u) * ch,  cos(u) * sh);
        float rad1 = safePow(length(cosZ), 2.0 / nExp);
        float ang1 = (safeAtan(cosZ.y, cosZ.x) + fk * TAU) / nExp;
        float rad2 = safePow(length(sinZ), 2.0 / nExp);
        float ang2 = (safeAtan(sinZ.y, sinZ.x) - fk * TAU) / nExp;
        float proj = rad1 * cos(ang1 + uTwist) + rad2 * sin(ang2 - uTwist * 0.7);
        float weight = safePow(0.76, fk);
        sheetAccum += sin(proj * PI + t * 0.6) * weight;
        branchPhase += (ang1 - ang2) * weight;
        ribbonEdge = min(ribbonEdge, abs(fract(proj * 1.5) - 0.5));
        w = abs(w) / clamp(dot(w, w), 0.35, 1.45) - vec2(0.62, 0.48);
    }

    vec2 lat = sin(w * (2.5 + uDensity * 0.25) + t * 0.5);
    float ellipticPores = lat.x * lat.y;

    float height = sheetAccum * 0.55 + ellipticPores * 0.25;
    float phase = branchPhase * 0.45 + height * 0.85 - t * 0.15 + r0 * 0.3;
    float contour = abs(sin(sheetAccum * (3.5 + uContourCarve * 2.5))) * smoothstep(0.01, 0.18 * uContourCarve, ribbonEdge);

    return vec4(height, phase, contour, ellipticPores);
}
`;

const TURING = /* glsl */ `
vec4 eng_turing(vec2 p, float t) {
    vec2 q = p - uMouse * 0.4;
    float r = length(q);
    float a = safeAtan(q.y, q.x);
    a += 0.12 * sin(a * uSymmetry + r * 3.0 - t * 0.4);
    q = vec2(cos(a), sin(a)) * r * (1.8 + uDensity * 0.12);

    float activator = 0.0;
    float inhibitor = 0.0;
    float freq = 1.65;
    float amp = 0.65;
    float octs = clamp(uOctaves, 2.0, 9.0);

    for (int i = 0; i < 9; i++) {
        float fi = float(i);
        if (fi >= octs) break;
        vec2 sp = q * freq + vec2(sin(t * 0.35 + fi), cos(t * 0.28 - fi * 1.3));
        float w1 = cos(sp.x * 2.0 + sin(sp.y * 1.5 + uTwist));
        float w2 = cos((-0.5 * sp.x + 0.866025 * sp.y) * 2.0 + sin(sp.x * 1.4 - t * 0.5));
        float w3 = cos((-0.5 * sp.x - 0.866025 * sp.y) * 2.0 + cos(sp.y * 1.4 + t * 0.4));
        float triad = (w1 + w2 + w3) / 3.0;
        float inhib = (cos(sp.x * 4.0) + cos(sp.y * 4.0)) * 0.25;
        float rdLayer = triad - inhib * (0.45 + 0.15 * sin(uTwist));
        activator += rdLayer * amp;
        inhibitor += abs(rdLayer) * amp;
        vec2 curlStep = vec2(-sin(sp.y * 2.0), sin(sp.x * 2.0)) * 0.42;
        q = rot2D(0.52 + uTwist * 0.12) * (q + curlStep * amp);
        freq *= 1.62;
        amp *= 0.72;
    }

    vec2 hexP = q * (1.2 + uDensity * 0.18);
    float hex1 = sin(hexP.x);
    float hex2 = sin(-0.5 * hexP.x + 0.866025 * hexP.y);
    float hex3 = sin(-0.5 * hexP.x - 0.866025 * hexP.y);
    float diatomPores = abs(hex1 * hex2 * hex3);

    float height = activator * 0.75 + diatomPores * 0.25;
    float phase = (activator - inhibitor * 0.6) * 1.15 + uTwist * 0.25 - t * 0.14;

    float cellWall = smoothstep(0.02, 0.24 * uContourCarve, abs(activator));
    float poreWall = smoothstep(0.03, 0.20 * uContourCarve, diatomPores + 0.08);
    float contour = cellWall * mix(0.35, 1.0, poreWall);

    return vec4(height, phase, contour, diatomPores);
}
`;

const ZETA = /* glsl */ `
vec4 eng_zeta(vec2 p, float t) {
    vec2 z = (p - uMouse * 0.35) * (1.5 + uDensity * 0.08);
    float r = length(z) + 1e-5;
    float theta = safeAtan(z.y, z.x);
    float nSym = floor(clamp(uSymmetry, 3.0, 24.0));

    vec2 zetaSum = vec2(0.0);
    vec2 sComplex = vec2(0.5 + cos(r * 2.0 - t * 0.3) * 0.35, (theta * nSym / PI + r * uTwist * 1.5) * 3.0);
    float maxTerms = clamp(uOctaves, 3.0, 9.0);

    for (int m = 1; m <= 9; m++) {
        float fm = float(m);
        if (fm > maxTerms) break;
        float logM = log(fm);
        float mag = safePow(fm, -sComplex.x);
        float evenM = step(mod(fm, 2.0), 0.5);
        float ang = -sComplex.y * logM + t * 0.4 * (1.0 - 2.0 * evenM);
        float altSign = 1.0 - 2.0 * evenM;
        zetaSum += altSign * mag * vec2(cos(ang), sin(ang));
    }

    float zetaPhase = safeAtan(zetaSum.y, zetaSum.x) / TAU;
    float zetaMag = length(zetaSum);

    float epiWave = r - (0.75 + 0.18 * cos(nSym * theta + t * 0.6) + 0.10 * cos(nSym * 2.0 * theta - t * 0.9 + uTwist));
    float gearTrack = sin(epiWave * (12.0 + uDensity * 0.6));

    vec2 foldZ = foldDihedral(z, nSym);
    float satDist1 = length(foldZ - vec2(0.68 + 0.12 * sin(t * 0.5), 0.0)) - 0.32;
    float satDist2 = length(foldZ - vec2(0.62, 0.08 * cos(t * 0.5 + uTwist))) - 0.26;
    float vesicaCrescent = sin(min(abs(satDist1), abs(satDist2)) * (18.0 + uDensity));

    float besselCymatic = cos(r * (8.0 + uDensity * 0.5) - t * 1.2) * cos(nSym * theta);
    float goldenSpiral = sin(log(r + 0.05) * nSym * PHI + theta * nSym - t * 0.8);

    float height = (gearTrack * 0.35 + vesicaCrescent * 0.30 + besselCymatic * 0.25 + goldenSpiral * 0.20);
    float phase = zetaPhase + height * 0.45 + zetaMag * 0.25 + uTwist * 0.15;

    float c1 = smoothstep(0.04, 0.28 * uContourCarve, abs(height));
    float c2 = smoothstep(0.02, 0.22 * uContourCarve, abs(sin(zetaPhase * PI * 6.0)));
    float contour = c1 * mix(0.28, 1.0, c2);

    return vec4(height, phase, contour, goldenSpiral);
}
`;

const HOPF = /* glsl */ `
vec4 eng_hopf(vec2 p, float t) {
    vec2 q = (p - uMouse * 0.4) * (1.35 + uDensity * 0.06);
    float r2 = dot(q, q);
    float nSym = clamp(uSymmetry, 3.0, 24.0);

    float denom = 1.0 / (1.0 + r2);
    float psi = uTwist * 0.8 + t * 0.35 + sin(safeAtan(q.y, q.x) * floor(nSym * 0.5)) * 0.4;
    vec4 hopf4 = vec4(
        2.0 * (q.x * cos(psi) - q.y * sin(psi)) * denom,
        2.0 * (q.x * sin(psi) + q.y * cos(psi)) * denom,
        (1.0 - r2) * denom * cos(psi * 0.7),
        (1.0 - r2) * denom * sin(psi * 0.7)
    );

    float fluxTube = sin(hopf4.x * nSym + hopf4.w * 4.0 + t) * cos(hopf4.y * nSym - hopf4.z * 4.0 - t * 0.8);

    vec2 cellUV = foldDihedral(q, max(3.0, floor(nSym * 0.5))) * (2.2 + uDensity * 0.16) + vec2(fluxTube * 0.35);
    vec2 iCell = floor(cellUV);
    vec2 fCell = fract(cellUV);

    float dMin1 = 8.0;
    float dMin2 = 8.0;
    float smoothBubble = 8.0;

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 rnd = hash22(iCell + neighbor);
            vec2 pt = neighbor + 0.5 + 0.42 * sin(t * 0.9 + TAU * rnd + uTwist);
            vec2 diff = pt - fCell;
            float d = length(diff);
            smoothBubble = smin(smoothBubble, d, 0.32);
            if (d < dMin1) { dMin2 = dMin1; dMin1 = d; }
            else if (d < dMin2) { dMin2 = d; }
        }
    }

    float plateauBorder = dMin2 - dMin1;
    float ferroSpike = cos(smoothBubble * PI * 2.5 - t * 1.4) * exp(-smoothBubble * 1.2);

    float height = ferroSpike * 0.65 + fluxTube * 0.35;
    float phase = smoothBubble * 0.85 + fluxTube * 0.45 - t * 0.18 + plateauBorder * 0.5;

    float borderCarve = smoothstep(0.015, 0.14 * uContourCarve, plateauBorder);
    float ringCarve = smoothstep(0.03, 0.22 * uContourCarve, abs(sin(smoothBubble * (6.0 + uDensity * 0.3))));
    float contour = borderCarve * mix(0.25, 1.0, ringCarve);

    return vec4(height, phase, contour, plateauBorder);
}
`;

/* ------------------------------------------------------------------ */
/* FAMILY: QUASICRYSTAL                                                */
/* ------------------------------------------------------------------ */
const QUASI = /* glsl */ `
vec4 eng_quasi(vec2 p, float t) {
    vec2 q = p - uMouse * 0.45;
    float r = length(q) + 1e-4;
    float angle = atan(q.y, q.x);

    float bzSpiral1 = sin(r * 9.0 - angle * 4.0 - t * 2.2);
    float bzSpiral2 = cos(length(p + vec2(cos(t * 0.4), sin(t * 0.3)) * 0.7) * 11.0 + angle * 3.0 - t * 1.8);
    float bzWave = (bzSpiral1 + bzSpiral2) * 0.5;

    vec2 wp = q * (1.5 + u_freq * 0.25) + vec2(bzSpiral1, bzSpiral2) * 0.2 * u_shape;

    float sumPrimary = 0.0;
    float sumHarmonic = 0.0;
    float count = clamp(floor(u_sym), 4.0, 21.0);

    for (int i = 0; i < 21; i++) {
        float fi = float(i);
        if (fi >= count) break;
        float theta = fi * PI / count + t * 0.06;
        vec2 dir = vec2(cos(theta), sin(theta));
        float proj = dot(wp, dir);
        sumPrimary  += cos(proj * 3.2 - t * 1.4 + sin(fi * PHI + t * 0.5));
        sumHarmonic += sin(proj * 3.2 * PHI + t * 1.1 + bzWave * 1.6);
    }

    float norm = 1.0 / sqrt(count);
    vec2 qc = vec2(sumPrimary * norm + bzWave * 0.55 * u_shape * 0.7, sumHarmonic * norm - bzWave * 0.45 * u_shape * 0.7);

    float ridge = abs(qc.x) + abs(qc.y) * 0.6;
    float phase = ridge * 0.32 * (0.5 + u_tension) - t * 0.15;
    float filigree = smoothstep(0.04 * u_ink, 0.22 * u_ink, abs(sin((qc.x + qc.y) * PI * 1.5)));
    float peak = smoothstep(1.35, 2.2, ridge);
    return vec4(qc.x * 0.45 + qc.y * 0.2, phase, mix(0.24, 1.0, filigree), peak);
}
`;

/* ------------------------------------------------------------------ */
/* FAMILY: 4D NEMATIC CATHEDRAL  (raymarched)                          */
/* ------------------------------------------------------------------ */
const CATHEDRAL = /* glsl */ `
vec2 cathPath(float z) {
    return vec2(
        sin(z * 0.22) * 1.15 + cos(z * 0.11) * 0.35,
        cos(z * 0.18) * 1.05 + sin(z * 0.09) * 0.35
    );
}

vec4 cathMap(vec3 pos, out float outScale) {
    vec2 centerXY = cathPath(pos.z);
    vec2 localXY = pos.xy - centerXY;
    localXY *= rot2D(pos.z * 0.10 + uMouse.x * 0.75);

    float radialDist = length(localXY);
    float tunnelClearance = radialDist - 0.62;

    vec4 p4 = vec4(localXY, mod(pos.z + 2.0, 4.0) - 2.0, sin(pos.z * 0.55 + uTime * 0.45) * 0.65);

    float rotAngle = uTime * 0.28 * u_tension + u_tension * 0.75;
    p4.xw *= rot2D(rotAngle);
    p4.yz *= rot2D(rotAngle * 0.78);
    p4.zw *= rot2D(rotAngle * 0.53);

    p4.xy = foldDihedral(p4.xy, u_sym);

    float scale = 1.0;
    vec3 orbitTrap = vec3(1e5);
    float apolloFactor = clamp(u_shape, 0.20, 2.50);

    for (int i = 0; i < 5; i++) {
        p4 = clamp(p4, -0.95, 0.95) * 2.0 - p4;
        if (i == 1) {
            p4.xy = abs(p4.xy);
            p4.xy *= rot2D(0.42 * u_tension);
        }
        float r2 = dot(p4, p4);
        float k = clamp((0.85 + 0.45 * apolloFactor) / clamp(r2, 0.22, 1.15), 1.0, 2.35);
        p4 *= k;
        scale = scale * k + 0.5;
        p4 -= vec4(0.52, 0.44, 0.38, 0.22);
        orbitTrap.x = min(orbitTrap.x, length(p4.xy));
        orbitTrap.y = min(orbitTrap.y, length(p4.zw));
        orbitTrap.z = min(orbitTrap.z, abs(p4.x - p4.y) + abs(p4.z));
    }

    float normScale = clamp(scale, 1.0, 28.0);
    float fractalDist = (length(p4.xyz) - 1.22) / normScale;

    vec3 cp = p4.xyz * (0.35 + u_freq * 0.077);
    float chladni = cos(cp.x) * cos(cp.y) + cos(cp.y) * cos(cp.z) + cos(cp.z) * cos(cp.x);
    float gyroid  = sin(cp.x * PHI) * cos(cp.y * PHI) + sin(cp.y * PHI) * cos(cp.z * PHI) + sin(cp.z * PHI) * cos(cp.x * PHI);

    float diatomShell = (abs(chladni) - 0.28 * abs(gyroid)) * 0.14;
    float d = smin(fractalDist, fractalDist + diatomShell, 0.05);
    d = max(d, -tunnelClearance);

    outScale = normScale;
    return vec4(d, orbitTrap);
}

float cathDist(vec3 pos) { float s; return cathMap(pos, s).x; }

vec3 cathNormal(vec3 pos) {
    vec2 e = vec2(0.003, -0.003);
    return normalize(
        e.xyy * cathDist(pos + e.xyy) + e.yyx * cathDist(pos + e.yyx) +
        e.yxy * cathDist(pos + e.yxy) + e.xxx * cathDist(pos + e.xxx)
    );
}

vec4 eng_cathedral(vec2 uv, float tm) {
    float chl = u_freq * 0.55;
    float camZ = uTime * 1.7;
    vec2 camCenter = cathPath(camZ);
    vec3 ro = vec3(camCenter, camZ);
    float targetZ = camZ + 1.8;
    vec2 targetCenter = cathPath(targetZ);
    vec3 lookAt = vec3(targetCenter + uMouse * 1.10, targetZ);

    vec3 forward = normalize(lookAt - ro);
    vec3 right   = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    vec3 up      = cross(forward, right);
    float bankAngle = -(targetCenter.x - camCenter.x) * 0.35 + uMouse.x * 0.25;
    right = normalize(right * cos(bankAngle) + up * sin(bankAngle));
    up    = cross(forward, right);
    vec3 rd = normalize(uv.x * right + uv.y * up + 1.15 * forward);

    float t = 0.12;
    float maxDist = 15.0;
    float hitScale = 1.0;
    vec3  hitTrap = vec3(0.0);
    bool  hitSurface = false;
    float volW = 0.0;
    float volPhase = 0.0;
    int steps = int(clamp(24.0 + u_depth * 3.0, 24.0, 72.0));

    for (int i = 0; i < 72; i++) {
        if (i >= steps) break;
        vec3 p = ro + rd * t;
        float stepScale;
        vec4 res = cathMap(p, stepScale);
        float d = res.x;
        vec3 trap = res.yzw;
        float stepLen = clamp(abs(d) * 0.72, 0.018, 0.35);
        float shellGlow = exp(-abs(d) * 9.5) * stepLen;
        float volMod = smoothstep(0.15, 0.75, abs(sin(trap.x * chl + p.z * 1.5)));
        float w = shellGlow * volMod;
        volPhase += (trap.x * 0.55 - trap.y * 0.35 + p.z * 0.10 - uTime * 0.22 + float(i) * 0.015) * w;
        volW += w;
        hitScale = stepScale;
        hitTrap = trap;
        if (d < 0.0028) { hitSurface = true; break; }
        if (t > maxDist) break;
        t += stepLen;
    }

    vec3 viewDir = -rd;
    float angle = atan(rd.y, rd.x);
    float radius = length(rd.xy);
    float spokeWave = sin(angle * floor(u_sym) + uTime * 1.1);
    float ringWave  = cos(radius * 16.0 - uTime * 2.2);
    float horizonMask = smoothstep(0.05, 0.65, abs(spokeWave * ringWave));
    float phase = spokeWave * 0.35 + radius * 0.9 - uTime * 0.18;
    float ink = horizonMask * 0.65;
    float height = -maxDist * 0.2;

    if (hitSurface) {
        vec3 pos = ro + rd * t;
        vec3 N = cathNormal(pos);

        vec2 q1 = pos.xy * 2.4 + vec2(sin(pos.z * 0.65 + uTime * 0.7), cos(pos.z * 0.55 - uTime * 0.6));
        vec2 q2 = pos.yz * 2.1 - vec2(cos(pos.x * 0.75 - uTime * 0.5), sin(pos.x * 0.85 + uTime * 0.8));
        float defectPlus  = 0.5 * atan(sin(q1.y * 2.5 + uTime), cos(q1.x * 2.5 - uTime));
        float defectMinus = -0.5 * atan(sin(q2.x * 2.2 - uTime * 0.8), cos(q2.y * 2.2 + uTime * 0.9));
        float curlStream  = sin(dot(pos, vec3(2.8, -2.4, 2.2)) + uTime * 1.3);
        float theta = defectPlus + defectMinus + curlStream * 0.85;
        float schlierenBrush = pow(sin(2.0 * theta), 2.0);
        float schlierenInk = smoothstep(0.06 * u_ink, 0.52 * u_ink, schlierenBrush);
        float chladniContour = sin((hitTrap.x * 3.5 + hitTrap.y * 2.5) * chl * 0.5);
        float diatomInk = smoothstep(0.08 * u_ink, 0.42 * u_ink, abs(chladniContour));
        float darkInk = mix(0.04, 1.0, schlierenInk * diatomInk);

        float fres0 = 1.0 - max(dot(N, viewDir), 0.0);
        float logStress = log(1.0 + hitScale) * 0.42;
        float retardation = (logStress + fres0 * 1.45 + hitTrap.x * 0.95 - hitTrap.y * 0.65) * 1.22 - uTime * 0.16;

        vec3 L1 = normalize(ro + vec3(sin(uTime * 1.3) * 0.8, cos(uTime * 1.1) * 0.8, 1.4) - pos);
        vec3 L2 = normalize(ro + vec3(-cos(uTime * 0.9) * 0.8, sin(uTime * 1.4) * 0.8, 3.0) - pos);
        float diff1 = max(dot(N, L1), 0.0);
        float diff2 = max(dot(N, L2), 0.0);
        float spec = pow(max(dot(N, normalize(L1 + viewDir)), 0.0), 40.0) * 0.75
                   + pow(max(dot(N, normalize(L2 + viewDir)), 0.0), 28.0) * 0.65;
        float fresnel = pow(fres0, 2.6);
        float creviceAO = smoothstep(0.02, 0.48, hitTrap.z);

        float lit = darkInk * (0.28 + 0.72 * (diff1 * 0.7 + diff2 * 0.5)) * creviceAO
                  + spec * darkInk + fresnel * 0.8 * creviceAO;
        float fog = exp(-t * 0.16);
        phase = mix(phase, retardation, fog);
        ink = mix(ink, lit, fog);
        height = -t * 0.2 + (diff1 - diff2) * 0.15;
    }

    float rawGlow = volW * 2.1;
    float bGlow = rawGlow / (1.0 + rawGlow);
    if (volW > 1e-4) {
        float structureShadow = smoothstep(0.0, 0.35, sin(length(uv) * chl * 1.5 - uTime * 2.0) * 0.5 + 0.5);
        float glowInk = bGlow * 0.72 * (0.55 + 0.40 * structureShadow);
        if (glowInk > ink) phase = mix(phase, volPhase / volW, 0.6);
        ink = max(ink, glowInk);
    }
    return vec4(height, phase, clamp(ink, 0.0, 1.0), bGlow);
}
`;

/* ------------------------------------------------------------------ */
/* FAMILY: OTHERSPACE II — HYPERBOLIC ACID ATLAS  (10 engines)         */
/* ------------------------------------------------------------------ */
export const ATLAS_COMMON = /* glsl */ `
vec2 osMobius(vec2 z, vec2 a) { return cDiv(z - a, vec2(1., 0.) - cMul(vec2(a.x, -a.y), z)); }
float ash(float x) { return sign(x) * log(abs(x) + sqrt(x * x + 1.)); }
float ach(float x) { x = max(x, 1.); return log(x + sqrt(max(x * x - 1., 0.))); }
float hd(vec2 z, vec2 a) { return ach(1. + 2. * dot(z - a, z - a) / max((1. - dot(z, z)) * (1. - dot(a, a)), 1e-7)); }
float stripe(float f, float w) { float aa = max(fwidth(f), .001); return 1. - smoothstep(w, w + aa, abs(f)); }
float bands(float f, float w) { return stripe(sin(f), w); }
vec2 uhp(vec2 z) { return cDiv(vec2(-z.y, 1. + z.x), vec2(1. - z.x, -z.y)); }

// Screen plane -> hyperbolic disk through the chosen projection, then a Mobius move to the pointer.
bool osProject(vec2 pw, float t, out vec2 z, out float mask) {
    mask = 1.;
    float px = 2. / uRes.y;
    if (u_proj < 1.5) {
        z = pw / .91;
        float r0 = length(z);
        mask = 1. - smoothstep(1. - 2. * px, 1., r0);
        if (r0 >= 1.) return false;
        if (u_proj > .5) z = z / (1. + sqrt(max(1. - dot(z, z), 1e-6)));
    } else if (u_proj < 2.5) {
        vec2 h = vec2(pw.x, pw.y + 1.) * 1.3;
        if (h.y <= 1e-4) return false;
        z = cDiv(h - vec2(0., 1.), h + vec2(0., 1.));
    } else {
        vec2 b = pw * .7853982 / .9;
        if (abs(b.y) >= .7853) return false;
        mask = 1. - smoothstep(.775, .7853, abs(b.y));
        float x2 = clamp(2. * b.x, -18., 18.), e = exp(x2), ch = .5 * (e + 1. / e), sh = .5 * (e - 1. / e);
        z = vec2(sh, sin(2. * b.y)) / (ch + cos(2. * b.y));
    }
    vec2 cen = uMouse * .8 + .07 * vec2(sin(t * .13), cos(t * .11) - 1.);
    float cr = length(cen);
    if (cr > .87) cen *= .87 / cr;
    z = osMobius(z, cen);
    z = rot2D(t * .0075) * z;
    float r = length(z);
    if (r > .9995) z *= .9995 / r;
    return true;
}
`;

const atlas = (n: number, body: string) => /* glsl */ `
vec4 eng_os${n}(vec2 pw, float t) {
    float mask; vec2 z;
    if (!osProject(pw, t, z, mask)) return vec4(0.);
    float p = clamp(floor(u_sym), 3., 16.), q = clamp(floor(u_q), 3., 8.);
    float depth = u_depth * 3., density = u_freq * .45, shape = u_shape, twist = u_tension, width = u_ink, phase = 0.;
    float r = length(z), val = 0., line = 0., detail = 0., w = .035 * width;
${body}
    line = clamp(line, 0., 1.); detail = clamp(detail, 0., 1.);
    float fill = .35 + .65 * (.5 + .5 * sin(val * TAU));
    float ink = mix(fill * .75, 1., max(line * .95, detail * .75)) * mask;
    return vec4(line * .7 + detail * .3 + val * .2, val + .32 * line + .3 * detail * (1. - line), ink, detail);
}
`;

const OS_BODIES: string[] = [
  // 0 MODULAR JELLYFISH
  `    vec2 h = uhp(z); h.x += t * .06; float n = 0.;
    for (int i = 0; i < 48; i++) { if (float(i) >= depth) break; h.x -= floor(h.x + .5); float d = dot(h, h); if (d < 1.) { h = vec2(-h.x, h.y) / d; n += 1.; } else break; }
    float wall = min(abs(ash((.5 - abs(h.x)) / h.y)), abs(ash((dot(h, h) - 1.) / (2. * h.y))));
    float hh = .9 + shape * .45, ford = smoothstep(0., .04, h.y - hh), lf = log(h.y / hh);
    val = mod(n, 2.) * .17 + n * .031 + ford * .31 + .12 * log(h.y);
    line = max(stripe(wall, w), stripe(lf, w));
    detail = mix(bands(log(h.y) * density * 3. + twist * h.x, .12 * width) * .6, bands(TAU * h.x * p + twist * lf * 3., .25 * width), ford);`,
  // 1 GUILLOCHE RIBBON
  `    vec2 qq = cDiv(vec2(1. + z.x, z.y), vec2(1. - z.x, -z.y));
    float u = log(max(length(qq), 1e-6)), v = atan(qq.y, qq.x), d = ash(tan(clamp(v, -1.55, 1.55)));
    float cu = u * density * .35 + t * .25;
    float f1 = d * p * .45 - shape * sin(cu + twist * d * .5), f2 = d * q * .45 + shape * sin(cu - twist * d * .5);
    val = .13 * floor(f1) + .21 * floor(f2) + .08 * sin(cu * 2.);
    line = max(bands(f1 * PI, .1 * width), bands(f2 * PI, .1 * width));
    detail = pow(abs(cos(f1 * PI) * cos(f2 * PI)), 6.) * (.5 + .5 * cos(cu * 4.));`,
  // 2 SCHOTTKY LIGHTNING
  `    float al = (PI / p) * mix(.5, 1., clamp(shape * .25, 0., 1.)), R = tan(al), s = 1. / cos(al), n = 0., sec = TAU / p; vec2 c;
    for (int i = 0; i < 48; i++) { if (float(i) >= depth) break; float k = floor(atan(z.y, z.x) / sec + .5) * sec; c = s * vec2(cos(k), sin(k)); vec2 v = z - c; float d = dot(v, v); if (d < R * R) { z = c + v * (R * R / d); n += 1.; } else break; }
    float k2 = floor(atan(z.y, z.x) / sec + .5) * sec; c = s * vec2(cos(k2), sin(k2));
    float wall = abs(ash((dot(z - c, z - c) - R * R) / (R * max(1. - dot(z, z), 1e-4))));
    val = n * .11 + mod(n, 2.) * .2 + wall * .06;
    line = stripe(wall, w);
    detail = bands(wall * density * 2. - t * .6 + twist * atan(z.y, z.x), .15 * width) * exp(-wall * .35);`,
  // 3 CHAINMAIL ORBIFOLD
  `    if (1. / p + 1. / q >= .5) q = floor(1. / (.5 - 1. / p)) + 1.;
    float A = PI / p, B = PI / q, cc = cos(B) / sqrt(max(cos(B) * cos(B) - sin(A) * sin(A), 1e-4)), rr = sqrt(max(cc * cc - 1., 0.)), n = 0.;
    for (int i = 0; i < 48; i++) { if (float(i) >= depth) break; float a = atan(z.y, z.x); a = mod(a + A, 2. * A) - A; if (a < 0.) n += 1.; z = length(z) * vec2(cos(a), abs(sin(a))); vec2 v = z - vec2(cc, 0.); float d = dot(v, v); if (d < rr * rr) { z = vec2(cc, 0.) + v * (rr * rr / max(d, 1e-8)); n += 1.; } else break; }
    float vr = cc * cos(A) - sqrt(max(cc * cc * cos(A) * cos(A) - 1., 0.));
    float f0 = hd(z, vec2(0.)) * density, f1 = hd(z, vr * vec2(cos(A), sin(A))) * density, f2 = hd(z, vec2(cc - rr, 0.)) * density * (1. + shape * .5);
    val = .1 * floor(f0 / PI) + .17 * floor(f1 / PI) + .23 * floor(f2 / PI) + mod(n, 2.) * .05;
    line = max(bands(f0 - t * .4, .1 * width), bands(f1 + t * .4, .1 * width));
    detail = bands(f2 + twist * sin(f0 - f1), .1 * width);`,
  // 4 BINARY BRICKWORK
  `    vec2 h = uhp(z) * density * .4; h.x += t * .25;
    float ly = log2(max(h.y, 1e-6)), k = floor(ly), xi = h.x / exp2(k) + twist * .08 * sin(k * 1.7 + t * .3), cx = floor(xi), u = fract(xi), v = fract(ly);
    float du = min(u, 1. - u), dv = min(v, 1. - v), m = length(vec2(u - .5, v - .5));
    val = fract(cx * .381966 + k * .27) + m * .2;
    line = max(stripe(min(du, dv * .69), w), stripe(abs(fract(u * (q - 2.) + .5) - .5), .02 * width) * step(v, .5));
    detail = bands(m * TAU * p * .5 + shape * sin(TAU * u) * sin(PI * v) - t * .5, .22 * width);`,
  // 5 BLASCHKE BLOOM
  `    vec2 b = z; float iters = clamp(q - 2., 1., 4.), rad = min(.15 + .17 * shape, .86);
    for (int it = 0; it < 4; it++) { if (float(it) >= iters) break; vec2 pr = vec2(1., 0.);
        for (int k = 0; k < 16; k++) { if (float(k) >= p) break; float fk = float(k), an = fk * 2.3999632 + phase * TAU + t * .08 * (1. - 2. * mod(float(it), 2.)); pr = cMul(pr, osMobius(b, rad * sqrt((fk + .35) / p) * vec2(cos(an), sin(an)))); }
        b = rot2D(twist * .3) * pr; float bl = length(b); if (bl > .9995) b *= .9995 / bl; }
    float ar = atan(b.y, b.x), hr = -log(max(length(b), 1e-6));
    val = hr * .11 + .2 * sin(ar * 2.) + .1 * sin(ar * 3. + hr);
    line = max(bands(ar * 4., .1 * width), bands(hr * density, .1 * width));
    detail = pow(.5 + .5 * sin(ar * 8.) * sin(hr * density * 2.), 8.);`,
  // 6 CONFOCAL MOIRE
  `    vec2 zz = rot2D(t * .07 + twist * .3) * z; float f = clamp(.12 + .19 * shape, 0., .86);
    float d1 = hd(zz, vec2(-f, 0.)), d2 = hd(zz, vec2(f, 0.)), s = (d1 + d2) * density * .5, h = (d1 - d2) * p * .6;
    val = .12 * floor(s / PI) + .19 * floor(h / PI) + .3 * step(0., sin(s) * sin(h));
    line = max(bands(s, .1 * width), bands(h, .1 * width));
    detail = bands(d1 * density * 2. - t, .3 * width) * bands(d2 * density * 2. + t, .3 * width);`,
  // 7 DIPOLE WHIRLPOOL
  `    float f = clamp(.1 + .19 * shape, .05, .86); vec2 qq = cDiv(z - vec2(-f, 0.), z - vec2(f, 0.));
    vec2 L = vec2(log(max(length(qq), 1e-6)), atan(qq.y, qq.x));
    float g1 = p * L.y + twist * L.x * 2. - t * .6, g2 = q * L.y - density * L.x * 1.5 + t * .4;
    val = L.x * .15 + .33 * step(0., sin(g1) * sin(g2)) + .1 * sin(g1);
    line = max(bands(g1, .1 * width), bands(g2, .1 * width));
    detail = pow(max(0., sin(g1) * sin(g2)), 4.);`,
  // 8 GEODESIC TIMES TABLE
  `    float N = p * 4., m = (q - 1.) + shape * .25 + t * .02, dmin = 50., cnt = 0., gl = 0.;
    for (int i = 0; i < 64; i++) { float fi = float(i); if (fi >= N) break;
        float th = TAU * fi / N + phase * TAU, th2 = th * m; vec2 a = vec2(cos(th), sin(th)), b = vec2(cos(th2), sin(th2));
        if (dot(a - b, a - b) < 4e-4) continue;
        vec2 ab = a + b; float l = length(ab); vec2 c = l > .05 ? ab / l : vec2(-a.y, a.x);
        vec2 u = normalize(cDiv(c - a, c - b)), nn = vec2(-u.y, u.x); if (dot(cDiv(a, b), nn) < 0.) nn = -nn;
        vec2 wz = cDiv(z - a, z - b); float sd = dot(wz, u) / max(dot(wz, nn), 1e-5), d = abs(ash(sd));
        dmin = min(dmin, d); cnt += step(0., sd); gl += exp(-d * density); }
    val = cnt * .045 + dmin * .2;
    line = stripe(dmin, .03 * width);
    detail = clamp(bands(dmin * density * 4. + twist * cnt, .2 * width) * exp(-dmin * 2.) + gl * .04, 0., 1.);`,
  // 9 APOLLONIAN PROPER
  `    float n = 0., sc = 1., r2o = dot(z, z); z = rot2D(twist * .2) * z;
    for (int i = 0; i < 48; i++) { if (float(i) >= depth) break; float d0 = dot(z, z);
        if (d0 < .0717968) { float k = .0717968 / max(d0, 1e-9); z *= k; sc *= k; n += 1.; continue; }
        float th = PI / 3. + floor((atan(z.y, z.x) - PI / 3.) / (TAU / 3.) + .5) * TAU / 3.; vec2 c = 2. * vec2(cos(th), sin(th)), v = z - c; float d = dot(v, v);
        if (d < 3.) { float k = 3. / d; z = c + v * k; sc *= k; n += 1.; } else break; }
    float dc = abs(length(z) - 1.);
    for (int j = 0; j < 3; j++) { float th = float(j) * TAU / 3.; dc = min(dc, abs(length(z - .5358984 * vec2(cos(th), sin(th))) - .4641016)); }
    float de = dc / sc, hy = de * 2. / max(1. - r2o, 1e-4);
    val = .6 * exp(-hy * .9) + .05 * log(sc);
    line = stripe(hy, .03 * width);
    detail = bands(log(max(de, 1e-7)) * density + shape * sin(n) - t * .5, .2 * width) * exp(-hy * .5);`,
];

const OS_META: Array<[string, string, EngineDef['knobs']]> = [
  ['Modular Jellyfish', 'PSL(2,ℤ) fold / Ford circles', { sym: 'Spokes per Ford circle', depth: 'Fold budget', freq: 'Horocycle band frequency', shape: 'Ford circle size', tension: 'Spoke swirl' }],
  ['Guilloché Ribbon', 'Fermi coords / banknote waves', { sym: 'Wave family A', q: 'Wave family B', freq: 'Wavelength along axis', shape: 'Wave amplitude', tension: 'Shear with distance' }],
  ['Schottky Lightning', 'Geodesic mirrors / limit dust', { sym: 'Mirror count', depth: 'Reflection budget', freq: 'Ripple frequency', shape: 'Mirror size (4 = ideal)', tension: 'Ripple pinwheel' }],
  ['Chainmail Orbifold', '{p,q} fold / three ring families', { sym: 'Polygon order p', q: 'Vertex order q', depth: 'Reflection budget', freq: 'Ring frequency', shape: 'Edge-ring ratio', tension: 'Edge-ring wobble' }],
  ['Binary Brickwork', 'Böröczky tiling / horocycle courses', { sym: 'Motif ring count', q: 'Slats per brick', freq: 'Brick scale', shape: 'Motif deformation', tension: 'Course wobble' }],
  ['Blaschke Bloom', 'Disk self-map / domain colour', { sym: 'Zeros per product', q: 'Iterations', freq: 'Modulus ring frequency', shape: 'Zero spiral radius', tension: 'Twist per iteration' }],
  ['Confocal Moiré', 'Hyperbolic ellipses × hyperbolas', { sym: 'Hyperbola count', freq: 'Ellipse / ring frequency', shape: 'Focus separation', tension: 'Axis rotation' }],
  ['Dipole Whirlpool', 'Loxodromes / double spiral', { sym: 'Arm count A', q: 'Arm count B', freq: 'Spiral B pitch', shape: 'Pole separation', tension: 'Spiral A pitch' }],
  ['Geodesic Times Table', 'String art / cardioid envelopes', { sym: 'Strings (×4)', q: 'Multiplier m', freq: 'Glow falloff', shape: 'Fractional multiplier', tension: 'Echo offset' }],
  ['Apollonian Proper', 'Exact gasket / four mirrors', { depth: 'Inversion budget', freq: 'Self-similar ring frequency', shape: 'Ring jitter', tension: 'Gasket rotation' }],
];

const W = { sym: 'Symmetry order', depth: 'Recursion depth', freq: 'Detail frequency', tension: 'Tension / twist' };

export const ENGINES: EngineDef[] = [
  { id: 'biomineral', name: 'Photoelastic Biomineral', family: 'Biomineral', tag: 'KIFS + Apollonian + gyroid diatom', fn: 'eng_biomineral', src: BIOMINERAL,
    knobs: { sym: 'Kaleidoscope sides', depth: 'KIFS recursions', freq: 'Gyroid pore density', shape: 'Apollonian inversion', tension: 'Fold twist' } },
  { id: 'girih', name: 'Poincaré Girih Lace', family: 'Hyper-Weave', tag: 'Hyperbolic tiling + star straps', fn: 'eng_girih', src: GIRIH,
    knobs: { sym: 'Tiling order p', depth: 'Inversion depth', freq: 'Strap / lace density', tension: 'Möbius drift, {p,3}↔{p,4}' } },
  { id: 'caustic', name: 'Catacaustic Neovius Gem', family: 'Hyper-Weave', tag: 'Photon web + minimal-surface facets', fn: 'eng_caustic', src: CAUSTIC,
    knobs: { sym: 'Gem facets', depth: 'Caustic octaves', freq: 'Lattice scale', tension: 'Refraction strength' } },
  { id: 'jacquard', name: 'Jacquard Memphis Loom', family: 'Hyper-Weave', tag: 'Brocade weave + ziggurat matrix', fn: 'eng_jacquard', src: JACQUARD,
    knobs: { sym: 'Loom symmetry (>4 folds)', depth: 'Twill step / Memphis scale', freq: 'Thread count', tension: 'Squiggle shear' } },
  { id: 'bzmycelium', name: 'BZ Scroll Mycelium', family: 'Hyper-Weave', tag: 'Spiral waves + hyphae dendrites', fn: 'eng_bzmycelium', src: BZMYCELIUM,
    knobs: { sym: 'Spiral cores (÷2)', depth: 'Branch generations', freq: 'Wave frequency', tension: 'Wave → hyphae coupling' } },
  { id: 'calabi', name: 'Calabi-Yau Quintic', family: 'Astral-Loom', tag: '6D sheets + elliptic lattice', fn: 'eng_calabi', src: CALABI,
    knobs: { sym: 'Fold + quintic exponent', depth: 'Sheets', freq: 'Lattice density', tension: 'Projection twist' } },
  { id: 'turing', name: 'Turing-Physarum Coral', family: 'Astral-Loom', tag: 'Reaction-diffusion + slime lace', fn: 'eng_turing', src: TURING,
    knobs: { sym: 'Angular wobble', depth: 'Octaves', freq: 'Cell density', tension: 'Curl advection' } },
  { id: 'zeta', name: 'Crop-Circle Zeta', family: 'Astral-Loom', tag: 'Riemann series + cymatic gears', fn: 'eng_zeta', src: ZETA,
    knobs: { sym: 'Gear teeth', depth: 'Zeta terms', freq: 'Ring density', tension: 'Critical-strip twist' } },
  { id: 'hopf', name: 'Hopf Ferro-Foam', family: 'Astral-Loom', tag: 'Hopf flux + ferrofluid Voronoi', fn: 'eng_hopf', src: HOPF,
    knobs: { sym: 'Flux linking', freq: 'Bubble density', tension: 'Fibration twist' } },
  { id: 'quasi', name: 'Penrose Quasicrystal', family: 'Quasicrystal', tag: 'N-wave interference + BZ swirl', fn: 'eng_quasi', src: QUASI,
    knobs: { sym: 'Wave directions', freq: 'Lattice scale', shape: 'BZ spiral warp', tension: 'Iridescence span' } },
  { id: 'cathedral', name: '4D Nematic Cathedral', family: 'Cathedral', tag: 'Raymarched polychoron fly-through', fn: 'eng_cathedral', src: CATHEDRAL, heavy: true,
    knobs: { sym: 'Nave symmetry', depth: 'Ray steps', freq: 'Chladni frequency', shape: 'Apollonian inversion', tension: '4D rotation' } },
  ...OS_BODIES.map((body, i): EngineDef => ({
    id: `os${i}`, name: OS_META[i][0], family: 'Hyperbolic Atlas', tag: OS_META[i][1], fn: `eng_os${i}`, src: atlas(i, body), atlas: true, knobs: OS_META[i][2],
  })),
];

export const ENGINE_BY_ID: Record<string, EngineDef> = Object.fromEntries(ENGINES.map((e) => [e.id, e]));
export const FAMILIES = [...new Set(ENGINES.map((e) => e.family))];
export const GENERIC_KNOBS = W;
