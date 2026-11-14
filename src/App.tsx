import { useCallback, useEffect, useRef, useState } from 'react';
import { ENGINES, ENGINE_BY_ID, FAMILIES } from './gl/engines';
import { Renderer } from './gl/renderer';
import { renderAnimation } from './export';
import { buildSceneFS } from './gl/shaders';
import { PALETTES, randomPalette } from './palettes';
import { applyPreset, PRESETS } from './presets';
import {
  BLEND_MODES, chaos, fxRoll, mutate, PARAMS, PROJECTIONS, sanitize, TOGGLES,
  type ParamKey, type State, type ToggleKey,
} from './state';

const EXPORT_SIZES: Array<[string, number, number]> = [
  ['Screen size', 0, 0],
  ['1080 × 1080 · square', 1080, 1080],
  ['2048 × 2048 · square', 2048, 2048],
  ['3000 × 3000 · square', 3000, 3000],
  ['4096 × 4096 · square', 4096, 4096],
  ['1080 × 1920 · portrait', 1080, 1920],
  ['2160 × 3840 · portrait 4K', 2160, 3840],
  ['1920 × 1080 · landscape', 1920, 1080],
  ['3840 × 2160 · landscape 4K', 3840, 2160],
  ['1200 × 1600 · 3:4', 1200, 1600],
  ['1600 × 1200 · 4:3', 1600, 1200],
];
const START = 5; // open on the Poincaré Girih look
const SAVE_KEY = 'acid-loom-looks-v1';

interface Saved { name: string; recipe: unknown; }
interface Media { kind: 'png' | 'gif' | 'mp4' | 'webm'; url: string; name: string; }

function loadSaved(): Saved[] {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(0, 40) : [];
  } catch { return []; }
}

/* ------------------------------ small controls ------------------------------ */
function Slider({ k, s, set, label, dim }: { k: ParamKey; s: State; set: (p: Partial<State>) => void; label?: string; dim?: boolean }) {
  const d = PARAMS[k];
  const v = s[k];
  return (
    <label className={'slider' + (dim ? ' dim' : '')} htmlFor={'s-' + k}>
      <span className="row"><span>{label ?? d.label}</span><output>{d.step >= 1 ? v.toFixed(0) : v.toFixed(2)}</output></span>
      <input id={'s-' + k} type="range" min={d.min} max={d.max} step={d.step} value={v}
        onChange={(e) => set({ [k]: parseFloat(e.target.value) } as Partial<State>)} />
    </label>
  );
}

function Fx({ k, s, set, params = [] }: { k: ToggleKey; s: State; set: (p: Partial<State>) => void; params?: ParamKey[] }) {
  const on = s[k];
  return (
    <div className={'fx' + (on ? ' on' : '')}>
      <button id={'t-' + k} type="button" className="chip" aria-pressed={on} onClick={() => set({ [k]: !on } as Partial<State>)}>
        <i aria-hidden="true" />{TOGGLES[k].label}
      </button>
      {on && params.length > 0 && <details className="fx-detail">
        <summary>Adjust {TOGGLES[k].label}</summary>
        {params.map((p) => <Slider key={p} k={p} s={s} set={set} />)}
      </details>}
    </div>
  );
}

function Section({ id, title, hint, open = false, children }: { id: string; title: string; hint?: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details className="sec" open={open} id={'sec-' + id}>
      <summary><span>{title}</span>{hint && <small>{hint}</small>}</summary>
      <div className="sec-body">{children}</div>
    </details>
  );
}

/* ---------------------------------- app ---------------------------------- */
export default function App() {
  const [s, setS] = useState<State>(() => applyPreset(PRESETS[START]));
  const [presetName, setPresetName] = useState<string>(PRESETS[START].name);
  const [slot, setSlot] = useState<'A' | 'B'>('A');
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState(true);
  const [activeTab, setActiveTab] = useState<'create' | 'shape' | 'color' | 'effects' | 'export'>('create');
  const [palGroup, setPalGroup] = useState('All');
  const [paletteQuery, setPaletteQuery] = useState('');
  const [exportFormat, setExportFormat] = useState<'png' | 'gif' | 'mp4'>('png');
  const [exportSeconds, setExportSeconds] = useState(5);
  const [exportFps, setExportFps] = useState(24);
  const [exportBitrate, setExportBitrate] = useState(40);
  const [exportProgress, setExportProgress] = useState(0);
  const [quality, setQuality] = useState(1);
  const [lockGeo, setLockGeo] = useState(false);
  const [lockPal, setLockPal] = useState(false);
  const [fps, setFps] = useState(0);
  const [resLabel, setResLabel] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [dialog, setDialog] = useState<'none' | 'recipe' | 'media' | 'glsl'>('none');
  const [recipeText, setRecipeText] = useState('');
  const [media, setMedia] = useState<Media | null>(null);
  const [exportSize, setExportSize] = useState(0);
  const [showExportFrame, setShowExportFrame] = useState(true);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<Saved[]>(loadSaved);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewRendererRef = useRef<Renderer | null>(null);
  const sRef = useRef(s); sRef.current = s;
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const qualityRef = useRef(quality); qualityRef.current = quality;
  const busyRef = useRef(false);
  const cancelExportRef = useRef(false);
  const mouse = useRef({ x: 0, y: 0, tx: 0.18, ty: -0.12 });
  const clock = useRef({ t: 0, wall: 0 });
  const recRef = useRef<MediaRecorder | null>(null);
  const toastTimer = useRef(0);

  const say = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2400);
  }, []);

  const set = useCallback((p: Partial<State>) => setS((prev) => ({ ...prev, ...p })), []);

  // The matte never changes the full-screen background. The framed canvas gets
  // its own aspect-correct render, so its composition matches the chosen export.
  const [, selectedWidth, selectedHeight] = EXPORT_SIZES[exportSize];
  const frameEnabled = showExportFrame && exportSize !== 0 && !previewFailed;
  const frameRatio = selectedWidth && selectedHeight ? selectedWidth / selectedHeight : 1;
  const frameWidth = Math.max(1, Math.min(viewport.width - 24, (viewport.height - 24) * frameRatio));
  const frameHeight = frameWidth / frameRatio;

  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // A small secondary renderer runs only when the framing guide is enabled.
  // Preview resolution is capped to spare mobile GPUs; export itself remains
  // full-resolution on the same aspect-correct renderer.
  useEffect(() => {
    if (!frameEnabled) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    let r: Renderer;
    try {
      r = new Renderer(canvas);
    } catch {
      setPreviewFailed(true);
      say('This device cannot open a second WebGL preview. Try again with the frame toggle.');
      return;
    }
    previewRendererRef.current = r;
    const resize = () => {
      if (busyRef.current) return;
      const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth <= 740 ? 1.25 : 1.5) * qualityRef.current;
      const w = Math.max(2, canvas.clientWidth * dpr);
      const h = Math.max(2, canvas.clientHeight * dpr);
      const cap = window.innerWidth <= 740 ? 1000 : 1600;
      const scale = Math.min(1, cap / Math.max(w, h));
      r.setSize(w * scale, h * scale);
    };
    (canvas as HTMLCanvasElement & { __resize?: () => void }).__resize = resize;
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      (canvas as HTMLCanvasElement & { __resize?: () => void }).__resize = undefined;
      if (previewRendererRef.current === r) previewRendererRef.current = null;
      r.gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [frameEnabled, say]);

  useEffect(() => {
    const canvas = previewCanvasRef.current as (HTMLCanvasElement & { __resize?: () => void }) | null;
    canvas?.__resize?.();
  }, [frameWidth, frameHeight, quality]);

  /* ---------- renderer lifecycle ---------- */
  useEffect(() => {
    const canvas = canvasRef.current!;
    let r: Renderer;
    try {
      r = new Renderer(canvas);
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    rendererRef.current = r;

    const resize = () => {
      if (busyRef.current) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * qualityRef.current;
      r.setSize(canvas.clientWidth * dpr, canvas.clientHeight * dpr);
      setResLabel(`${canvas.width}×${canvas.height}`);
    };
    resize();
    window.addEventListener('resize', resize);
    (canvas as unknown as { __resize: () => void }).__resize = resize;

    let raf = 0, last = performance.now(), frames = 0, fpsT = last, shownErr = '', lastPreview = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (busyRef.current) return;
      const st = sRef.current;
      if (!pausedRef.current) { clock.current.t += dt * st.speed; clock.current.wall += dt; }
      const m = mouse.current;
      m.x += (m.tx - m.x) * 0.08;
      m.y += (m.ty - m.y) * 0.08;
      const ok = r.useScene({ a: st.engineA, b: st.engineB, blend: st.blendMode, fd: st.fdOn });
      if (!ok && r.lastError !== shownErr) { shownErr = r.lastError; setError('Shader failed to compile — ' + r.lastError); }
      if (ok && shownErr) { shownErr = ''; setError(''); }
      r.render(st, clock.current.t, clock.current.wall, [m.x, m.y]);

      // Preview shares the exact art state/time but uses the export aspect,
      // instead of pretending a crop of the full-screen shader is equivalent.
      const framed = previewRendererRef.current;
      if (framed && now - lastPreview > 42) {
        lastPreview = now;
        if (framed.useScene({ a: st.engineA, b: st.engineB, blend: st.blendMode, fd: st.fdOn })) {
          framed.render(st, clock.current.t, clock.current.wall, [m.x, m.y]);
        }
      }
      frames++;
      if (now - fpsT > 1000) { setFps(Math.round((frames * 1000) / (now - fpsT))); frames = 0; fpsT = now; }
    };
    raf = requestAnimationFrame(loop);

    const lost = (e: Event) => { e.preventDefault(); setError('The GPU context was lost. Reload the page to restart the renderer.'); };
    canvas.addEventListener('webglcontextlost', lost);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); canvas.removeEventListener('webglcontextlost', lost); };
  }, []);

  useEffect(() => {
    const c = canvasRef.current as unknown as { __resize?: () => void } | null;
    c?.__resize?.();
  }, [quality, hud]);

  /* ---------- pointer: drag the pole, wheel / pinch to zoom ---------- */
  useEffect(() => {
    const c = canvasRef.current!;
    const pts = new Map<number, [number, number]>();
    let pinch = 0;
    const pole = (x: number, y: number) => {
      // A drag inside the framed composition should use its coordinates,
      // not the much wider full-screen background coordinates.
      const frame = previewCanvasRef.current?.getBoundingClientRect();
      const inside = frame && x >= frame.left && x <= frame.right && y >= frame.top && y <= frame.bottom;
      const b = inside ? frame : c.getBoundingClientRect();
      mouse.current.tx = Math.max(-1, Math.min(1, ((x - b.left) / b.width) * 2 - 1));
      mouse.current.ty = Math.max(-1, Math.min(1, 1 - ((y - b.top) / b.height) * 2));
    };
    const zoomBy = (f: number) => setS((p) => ({ ...p, zoom: Math.min(PARAMS.zoom.max, Math.max(PARAMS.zoom.min, +(p.zoom * f).toFixed(3))) }));
    const down = (e: PointerEvent) => {
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      try { c.setPointerCapture(e.pointerId); } catch { /* fine */ }
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); }
      else pole(e.clientX, e.clientY);
    };
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinch > 0) zoomBy(d / pinch);
        pinch = d;
      } else pole(e.clientX, e.clientY);
    };
    const up = (e: PointerEvent) => { pts.delete(e.pointerId); pinch = 0; };
    const wheel = (e: WheelEvent) => { e.preventDefault(); zoomBy(Math.exp(-e.deltaY * 0.001)); };
    const dbl = () => { mouse.current.tx = 0; mouse.current.ty = 0; };
    c.addEventListener('pointerdown', down);
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('wheel', wheel, { passive: false });
    c.addEventListener('dblclick', dbl);
    return () => {
      c.removeEventListener('pointerdown', down); c.removeEventListener('pointermove', move);
      c.removeEventListener('pointerup', up); c.removeEventListener('pointercancel', up);
      c.removeEventListener('wheel', wheel); c.removeEventListener('dblclick', dbl);
    };
  }, []);

  /* ---------- actions ---------- */
  const loadPreset = (i: number) => {
    setS(applyPreset(PRESETS[i]));
    setPresetName(PRESETS[i].name);
    mouse.current.tx = 0.18; mouse.current.ty = -0.12;
    say('Loaded ' + PRESETS[i].name);
  };
  const doMutate = () => { setS((p) => mutate(p, lockGeo, lockPal)); setPresetName(''); say('Mutated'); };
  const doChaos = () => { setS((p) => chaos(p, lockGeo, lockPal)); setPresetName(''); say('Chaos roll'); };
  const doFx = () => { setS((p) => fxRoll(p)); say('Effects rolled'); };
  const doPal = () => { const p = randomPalette(); set({ palette: 'custom', bg: p.bg, colors: p.colors }); say('New acid palette'); };

  const recipe = () => ({ app: 'acid-loom', v: 1, state: s, pole: [mouse.current.tx, mouse.current.ty], time: +clock.current.t.toFixed(3) });
  const applyRecipe = (r: unknown) => {
    const o = r as { app?: string; state?: unknown; pole?: unknown; time?: unknown };
    if (!o || o.app !== 'acid-loom' || !o.state) throw new Error('That is not an Acid Loom recipe.');
    setS(sanitize(o.state));
    setPresetName('');
    if (Array.isArray(o.pole) && o.pole.length === 2 && o.pole.every((n) => typeof n === 'number' && Number.isFinite(n))) {
      mouse.current.tx = Math.max(-1, Math.min(1, o.pole[0])); mouse.current.ty = Math.max(-1, Math.min(1, o.pole[1]));
    }
    if (typeof o.time === 'number' && Number.isFinite(o.time) && o.time >= 0) clock.current.t = o.time;
  };
  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); say(what + ' copied'); }
    catch { say('Clipboard is blocked here. Select the text and copy it by hand.'); }
  };
  const persist = (list: Saved[]) => {
    setSaved(list);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(list)); } catch { say('This browser will not keep saved looks. Copy the recipe instead.'); }
  };
  const saveLook = () => {
    const name = `${ENGINE_BY_ID[s.engineA].name}${s.engineB !== 'none' ? ' × ' + ENGINE_BY_ID[s.engineB].name : ''} · ${s.palette}`;
    persist([{ name, recipe: recipe() }, ...saved].slice(0, 40));
    say('Look saved');
  };

  const showMedia = (m: Media) => {
    setMedia((old) => { if (old) URL.revokeObjectURL(old.url); return m; });
    setDialog('media');
  };
  const snapshot = async () => {
    const r = (frameEnabled && previewRendererRef.current) || rendererRef.current;
    if (!r || busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try {
      const [, w, h] = EXPORT_SIZES[exportSize];
      const blob = await r.snapshot(s, clock.current.t, clock.current.wall, [mouse.current.x, mouse.current.y], w || r.canvas.width, h || r.canvas.height);
      showMedia({ kind: 'png', url: URL.createObjectURL(blob), name: `acid-loom-${s.engineA}-${Date.now()}.png` });
    } catch (e) { say((e as Error).message); }
    busyRef.current = false; setBusy(false);
  };
  const exportArtwork = async () => {
    if (exportFormat === 'png') { await snapshot(); return; }
    const r = (frameEnabled && previewRendererRef.current) || rendererRef.current;
    if (!r || busyRef.current) return;
    const [, requestedWidth, requestedHeight] = EXPORT_SIZES[exportSize];
    const width = requestedWidth || r.canvas.width, height = requestedHeight || r.canvas.height;
    const state = { ...s, colors: [...s.colors] };
    const fpsChoice = exportFormat === 'gif' ? Math.min(exportFps, 15) : exportFps;
    const secsChoice = exportFormat === 'gif' ? Math.min(exportSeconds, 10) : exportSeconds;
    busyRef.current = true; setBusy(true); setExportProgress(0); cancelExportRef.current = false;
    try {
      const result = await renderAnimation(
        r, state, clock.current.t, clock.current.wall, [mouse.current.x, mouse.current.y],
        { format: exportFormat, width, height, fps: fpsChoice, seconds: secsChoice, bitrate: exportBitrate * 1_000_000 },
        (n) => setExportProgress(Math.round(n * 100)), () => cancelExportRef.current,
      );
      showMedia({ kind: result.extension, url: URL.createObjectURL(result.blob),
        name: 'acid-loom-' + state.engineA + '-' + result.width + 'x' + result.height + '-' + Date.now() + '.' + result.extension });
    } catch (e) {
      const message = (e as Error).message || 'Export failed';
      say(message);
    } finally {
      busyRef.current = false;
      setBusy(false);
      cancelExportRef.current = false;
      const liveCanvas = canvasRef.current as unknown as { __resize?: () => void } | null;
      liveCanvas?.__resize?.();
    }
  };
  const cancelExport = () => { cancelExportRef.current = true; say('Stopping after this frame…'); };
  const toggleRec = () => {
    if (recRef.current) { recRef.current.stop(); return; }
    const c = canvasRef.current!;
    try {
      const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find((m) => MediaRecorder.isTypeSupported(m));
      if (!mime) throw new Error('none');
      const rec = new MediaRecorder(c.captureStream(60), { mimeType: mime, videoBitsPerSecond: 24_000_000 });
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        recRef.current = null; setRecording(false);
        const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
        showMedia({ kind: 'webm', url: URL.createObjectURL(new Blob(chunks, { type: mime })), name: `acid-loom-${Date.now()}.${ext}` });
      };
      rec.start();
      recRef.current = rec; setRecording(true);
      say('Recording. Press REC again to stop.');
    } catch { say('This browser cannot record the canvas.'); }
  };
  const fullscreen = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { say('Full screen is not available here.'); }
  };

  // Small scripting hook, in the spirit of the source files: window.ACIDLOOM.loadRecipe({...})
  const apiRef = useRef({ recipe, applyRecipe });
  apiRef.current = { recipe, applyRecipe };
  useEffect(() => {
    (window as unknown as Record<string, unknown>).ACIDLOOM = {
      getRecipe: () => apiRef.current.recipe(),
      loadRecipe: (r: unknown) => apiRef.current.applyRecipe(r),
      engines: ENGINES.map((e) => e.id),
      presets: PRESETS.map((p) => p.name),
      loadPreset: (i: number) => setS(applyPreset(PRESETS[i])),
    };
  }, []);

  /* ---------- keyboard ---------- */
  const keyRef = useRef<(k: string) => void>(() => {});
  keyRef.current = (k) => {
    if (k === ' ') setPaused((p) => !p);
    else if (k === 'h') setHud((v) => !v);
    else if (k === 'm') doMutate();
    else if (k === 'c') doChaos();
    else if (k === 'p') doPal();
    else if (k === 'f') doFx();
    else if (k === 's') void snapshot();
    else if (k === 'escape') setDialog('none');
  };
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const tag = el?.tagName ?? '';
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (tag === 'TEXTAREA' || tag === 'SELECT' || (tag === 'INPUT' && (el as HTMLInputElement).type !== 'range')) return;
      const k = e.key.toLowerCase();
      if (k === ' ') { if (tag === 'BUTTON' || tag === 'SUMMARY') return; e.preventDefault(); }
      keyRef.current(k);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);

  /* ---------- derived ---------- */
  const A = ENGINE_BY_ID[s.engineA];
  const B = s.engineB !== 'none' ? ENGINE_BY_ID[s.engineB] : null;
  const knob = (k: 'sym' | 'q' | 'depth' | 'freq' | 'tension' | 'shape') => {
    const label = A.knobs[k] ?? B?.knobs[k];
    return <Slider k={k} s={s} set={set} label={label ?? PARAMS[k].label + ' (unused here)'} dim={!label} />;
  };
  const usesAtlas = A.atlas || B?.atlas;
  const pickEngine = (id: string) => {
    if (slot === 'A') set({ engineA: id });
    else set({ engineB: id });
    setPresetName('');
  };
  const current = slot === 'A' ? s.engineA : s.engineB;
  const setColor = (i: number, hex: string) => { const c = [...s.colors]; c[i] = hex; set({ colors: c, palette: 'custom' }); };

  return (
    <div className={'app' + (hud ? '' : ' hud-off')}>
      <canvas ref={canvasRef} id="stage" aria-label="Live generative artwork. Drag to move the warp pole, scroll to zoom." />

      {frameEnabled && (
        <div className="preview-overlay" aria-hidden="true">
          <div className="preview-frame" style={{ width: frameWidth, height: frameHeight }}>
            <canvas ref={previewCanvasRef} className="preview-stage" />
            <span className="preview-caption">
              {selectedWidth === selectedHeight ? 'SQUARE' : 'EXPORT FRAME'} · {selectedWidth} × {selectedHeight}
            </span>
          </div>
        </div>
      )}

      <header className="bar">
        <div className="brand panel">
          <span className={'led' + (paused ? ' off' : '')} aria-hidden="true" />
          <div>
            <h1>ACID LOOM</h1>
            <p>{A.name}{B ? ` ${['⇄', '≋', '◩', '∿', '▚'][s.blendMode]} ${B.name}` : ''} · {fps} fps · {resLabel}</p>
          </div>
        </div>
        <nav className="actions" aria-label="Quick actions">
          <button type="button" className="btn hot" onClick={doChaos} title="Replace the whole look with a new chaos roll (C)">CHAOS</button>
          <button type="button" className="btn" onClick={doMutate} title="Nudge existing parameters (M)">MUTATE</button>
          <button type="button" className="btn" onClick={() => setPaused((p) => !p)} title="Pause / play (Space)">{paused ? 'PLAY' : 'PAUSE'}</button>
          <button type="button" className="btn" onClick={() => { setActiveTab('export'); setHud(true); }} title="Open export settings">EXPORT</button>
          <button type="button" className="btn cy" onClick={() => setHud((v) => !v)} title="Hide or show controls (H)" aria-expanded={hud}>{hud ? 'HIDE ✕' : 'CONTROLS ☰'}</button>
        </nav>
      </header>

      <aside className="panel side" aria-label="Controls" hidden={!hud}>
        <nav className="workspace-tabs" role="tablist" aria-label="Studio controls">
          {([['create','CREATE'], ['shape','SHAPE'], ['color','COLOUR'], ['effects','EFFECTS'], ['export','EXPORT']] as const).map(([id, name]) => (
            <button key={id} type="button" role="tab" aria-selected={activeTab === id} className={activeTab === id ? 'active' : ''}
              onClick={() => setActiveTab(id)}>{name}</button>
          ))}
        </nav>
        <div className="side-scroll">
          {activeTab === 'create' && (<>
          <Section id="presets" title="Presets" hint={`${PRESETS.length} looks`}>
            <div className="locks">
              <label><input id="lock-geo" type="checkbox" checked={lockGeo} onChange={(e) => setLockGeo(e.target.checked)} /> Lock engines + geometry</label>
              <label><input id="lock-pal" type="checkbox" checked={lockPal} onChange={(e) => setLockPal(e.target.checked)} /> Lock colour</label>
            </div>
            <div className="preset-grid">
              {PRESETS.map((p, i) => (
                <button type="button" key={p.name} className={'preset' + (presetName === p.name ? ' active' : '')} onClick={() => loadPreset(i)}>
                  <span>{p.name}</span><small>{p.from}</small>
                </button>
              ))}
            </div>
          </Section>

          <Section id="engines" title="Engines" hint={`${ENGINES.length} generators, two slots`} open>
            <div className="tabs" role="tablist" aria-label="Engine slot">
              <button type="button" role="tab" aria-selected={slot === 'A'} className={slot === 'A' ? 'active' : ''} onClick={() => setSlot('A')}>SLOT A<small>{A.name}</small></button>
              <button type="button" role="tab" aria-selected={slot === 'B'} className={slot === 'B' ? 'active' : ''} onClick={() => setSlot('B')}>SLOT B<small>{B ? B.name : 'Off'}</small></button>
            </div>
            {slot === 'B' && (
              <button type="button" className={'engine' + (s.engineB === 'none' ? ' active' : '')} onClick={() => pickEngine('none')}>
                <span>Off</span><small>Slot A plays solo</small>
              </button>
            )}
            {FAMILIES.map((fam) => (
              <details key={fam} className="family">
                <summary>{fam}</summary>
                <div className="engine-grid">
                  {ENGINES.filter((e) => e.family === fam).map((e) => (
                    <button type="button" key={e.id} className={'engine' + (current === e.id ? ' active' : '')} onClick={() => pickEngine(e.id)}>
                      <span>{e.name}{e.heavy ? ' ⚠' : ''}</span><small>{e.tag}</small>
                    </button>
                  ))}
                </div>
              </details>
            ))}
            {B && (
              <div className="mixer">
                <label className="select" htmlFor="blend-mode"><span>How B meets A</span>
                  <select id="blend-mode" value={s.blendMode} onChange={(e) => set({ blendMode: +e.target.value })}>
                    {BLEND_MODES.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                </label>
                <Slider k="morph" s={s} set={set} />
              </div>
            )}
            <p className="note">⚠ marks the raymarched engine. It is heavy; drop Quality if it stutters.</p>
          </Section>

          </>)}
          {activeTab === 'shape' && (<>
          <Section id="geometry" title="Geometry" hint="labels follow slot A" open>
            {knob('sym')}{knob('q')}{knob('depth')}{knob('freq')}{knob('tension')}{knob('shape')}
            {(s.engineA === 'biomineral' || s.engineB === 'biomineral') && <Slider k="grit" s={s} set={set} />}
            {usesAtlas && (
              <label className="select" htmlFor="proj"><span>Hyperbolic projection</span>
                <select id="proj" value={s.proj} onChange={(e) => set({ proj: +e.target.value })}>
                  {PROJECTIONS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
              </label>
            )}
            <Slider k="zoom" s={s} set={set} />
            <Slider k="rot" s={s} set={set} />
            <Slider k="speed" s={s} set={set} />
            <div className="row-btns">
              <button type="button" className="mini" onClick={() => { mouse.current.tx = 0; mouse.current.ty = 0; }}>Centre pole</button>
              <button type="button" className="mini" onClick={() => set({ zoom: 1, rot: 0 })}>Reset view</button>
            </div>
          </Section>

          <Section id="warps" title="Space warps" hint="applied before the engines">
            <Fx k="mobiusOn" s={s} set={set} params={['mobius']} />
            <Fx k="kaleidoOn" s={s} set={set} params={['kaleido']} />
            <Fx k="tunnelOn" s={s} set={set} params={['tunnel']} />
            <Fx k="liquidOn" s={s} set={set} params={['liquid']} />
            <Fx k="vhsOn" s={s} set={set} params={['vhs']} />
          </Section>

          </>)}
          {activeTab === 'color' && (<>
          <Section id="color" title="Colour" hint={`${PALETTES.length} palettes`} open>
            <div className="pal-tools">
              <label className="select" htmlFor="palette-family"><span>Collection</span>
                <select id="palette-family" value={palGroup} onChange={(e) => setPalGroup(e.target.value)}>
                  {['All', ...new Set(PALETTES.map((p) => p.group))].map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <input type="search" aria-label="Find palette" placeholder="Find a palette…" value={paletteQuery} onChange={(e) => setPaletteQuery(e.target.value)} />
            </div>
            <div className="pal-grid">
              {PALETTES.filter((p) => (palGroup === 'All' || p.group === palGroup) && p.name.toLowerCase().includes(paletteQuery.toLowerCase())).map((p) => (
                <button type="button" key={p.name} className={'pal' + (s.palette === p.name ? ' active' : '')} title={p.name}
                  onClick={() => set({ palette: p.name, bg: p.bg, colors: [...p.colors] })}>
                  <i style={{ background: `linear-gradient(90deg, ${p.bg} 0 12%, ${p.colors.map((c, i) => `${c} ${12 + (88 * i) / p.colors.length}% ${12 + (88 * (i + 1)) / p.colors.length}%`).join(', ')})` }} />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
            <div className="stops">
              <label className="stop" title="Ink / ground colour"><input id="c-bg" type="color" value={s.bg} onChange={(e) => set({ bg: e.target.value, palette: 'custom' })} /><small>ink</small></label>
              {s.colors.map((c, i) => (
                <label className="stop" key={i}><input id={'c-' + i} type="color" value={c} aria-label={'Palette colour ' + (i + 1)} onChange={(e) => setColor(i, e.target.value)} /><small>{i + 1}</small></label>
              ))}
              <button type="button" className="mini" disabled={s.colors.length >= 8} onClick={() => set({ colors: [...s.colors, s.colors[0]], palette: 'custom' })} aria-label="Add a colour stop">+</button>
              <button type="button" className="mini" disabled={s.colors.length <= 2} onClick={() => set({ colors: s.colors.slice(0, -1), palette: 'custom' })} aria-label="Remove the last colour stop">−</button>
            </div>
            <div className="row-btns">
              <button type="button" className="mini" onClick={doPal}>Generate palette</button>
              <button type="button" className="mini" onClick={() => set({ colors: [...s.colors].reverse(), palette: 'custom' })}>Flip stops</button>
              <button type="button" className="mini" onClick={() => set({ colors: [...s.colors].sort(() => Math.random() - 0.5), palette: 'custom' })}>Shuffle</button>
            </div>
            <details className="mini-sec"><summary>Colour motion & colour treatments</summary>
            <Slider k="colorFreq" s={s} set={set} />
            <Slider k="palOffset" s={s} set={set} />
            <Slider k="palCycle" s={s} set={set} />
            <Slider k="hue" s={s} set={set} />
            <Slider k="sat" s={s} set={set} />
            <Slider k="acid" s={s} set={set} />
            <Fx k="neonOn" s={s} set={set} />
            <Fx k="rainbowOn" s={s} set={set} params={['rainbow']} />
            <Fx k="hardOn" s={s} set={set} />
            <Fx k="reverseOn" s={s} set={set} />
            </details>
          </Section>

          </>)}
          {activeTab === 'effects' && (<>
          <div className="row-btns effect-actions">
            <button type="button" className="mini" onClick={doFx} title="Randomize effects only">FX ROLL</button>
            <button type="button" className="mini" onClick={() => setActiveTab('shape')}>SPACE WARPS</button>
          </div>
          <Section id="surface" title="Surface + ink" hint="relief, light, line work" open>
            <Slider k="relief" s={s} set={set} />
            <Slider k="gloss" s={s} set={set} />
            <Fx k="inkOn" s={s} set={set} params={['ink', 'inkDepth']} />
            <Fx k="prismOn" s={s} set={set} params={['prism']} />
            <Fx k="rimOn" s={s} set={set} params={['rim']} />
            <Fx k="specOn" s={s} set={set} />
            <Fx k="embossOn" s={s} set={set} />
            <Fx k="iridOn" s={s} set={set} />
            <Fx k="engraveOn" s={s} set={set} params={['engrave']} />
            <Fx k="fdOn" s={s} set={set} />
          </Section>

          <Section id="finish" title="Finish" hint="print, lens, analog">
            <Fx k="trailsOn" s={s} set={set} params={['trails']} />
            <Fx k="halftoneOn" s={s} set={set} params={['halftone', 'dots']} />
            <Fx k="caOn" s={s} set={set} params={['ca']} />
            <Fx k="swarmOn" s={s} set={set} params={['swarm']} />
            <Fx k="glitterOn" s={s} set={set} />
            <Fx k="solarOn" s={s} set={set} params={['solar']} />
            <Fx k="posterOn" s={s} set={set} params={['poster']} />
            <Fx k="pixelOn" s={s} set={set} params={['pixel']} />
            <Fx k="mirrorOn" s={s} set={set} />
            <Fx k="scanOn" s={s} set={set} />
            <Fx k="grainOn" s={s} set={set} params={['grain']} />
            <Fx k="vignetteOn" s={s} set={set} />
            <Fx k="invertOn" s={s} set={set} />
          </Section>

          </>)}
          {activeTab === 'export' && (<>
          <Section id="output" title="Export studio" hint="stills · GIF · MP4 · recipes" open>
            <label className="select" htmlFor="quality"><span>Live quality</span>
              <select id="quality" value={quality} onChange={(e) => setQuality(+e.target.value)}>
                <option value={0.5}>Draft (½ res)</option>
                <option value={0.75}>Balanced (¾ res)</option>
                <option value={1}>Sharp (native)</option>
                <option value={1.5}>Supersampled (1.5×)</option>
              </select>
            </label>
            <label className="select" htmlFor="export-size"><span>Output dimensions</span>
              <select id="export-size" value={exportSize} disabled={busy} onChange={(e) => { setPreviewFailed(false); setExportSize(+e.target.value); }}>
                {EXPORT_SIZES.map(([n], i) => <option key={n} value={i}>{n}</option>)}
              </select>
            </label>
            <label className="frame-toggle">
              <input type="checkbox" checked={showExportFrame} disabled={busy}
                onChange={(e) => { setPreviewFailed(false); setShowExportFrame(e.target.checked); }} />
              <span>Show export frame / dim outside</span>
            </label>
            <p className="note">Framed preview shows the selected output shape. The full-screen artwork keeps moving behind the matte. The frame and label are not exported.</p>
            <label className="select" htmlFor="export-format"><span>Format</span>
              <select id="export-format" value={exportFormat} onChange={(e) => {
                const format = e.target.value as 'png' | 'gif' | 'mp4';
                setExportFormat(format);
                if (format === 'gif') {
                  setExportSeconds((n) => Math.min(n, 10));
                  setExportFps((n) => [8, 12, 15].includes(n) ? n : 12);
                } else if (format === 'mp4') {
                  setExportFps((n) => [12, 24, 30, 60].includes(n) ? n : 30);
                }
              }}>
                <option value="png">PNG · still</option>
                <option value="gif">GIF · animated</option>
                <option value="mp4">MP4 · H.264 video</option>
              </select>
            </label>
            {exportFormat !== 'png' && (<>
              <label className="select" htmlFor="export-duration"><span>Duration</span>
                <select id="export-duration" value={exportSeconds} onChange={(e) => setExportSeconds(+e.target.value)}>
                  {[2, 3, 5, 10, ...(exportFormat === 'mp4' ? [15, 30] : [])].map((n) => <option key={n} value={n}>{n} seconds</option>)}
                </select>
              </label>
              <label className="select" htmlFor="export-fps"><span>Frames per second</span>
                <select id="export-fps" value={exportFps} onChange={(e) => setExportFps(+e.target.value)}>
                  {(exportFormat === 'gif' ? [8, 12, 15] : [12, 24, 30, 60]).map((n) => <option key={n} value={n}>{n} fps</option>)}
                </select>
              </label>
              {exportFormat === 'mp4' && <label className="select" htmlFor="export-bitrate"><span>Video bitrate</span>
                <select id="export-bitrate" value={exportBitrate} onChange={(e) => setExportBitrate(+e.target.value)}>
                  {[12, 24, 40, 60].map((n) => <option key={n} value={n}>{n} Mbps</option>)}
                </select>
              </label>}
              <p className="note">{exportFormat === 'gif'
                ? 'GIF is frame-accurate but limited to 256 colours per frame. Large GIFs may take a lot of memory on iPhone.'
                : 'MP4 uses H.264 hardware/software encoding when available. Export size and bitrate are independent of preview quality.'}</p>
            </>)}
            <div className="row-btns">
              <button type="button" className="btn hot" onClick={() => void exportArtwork()} disabled={busy}>{busy ? 'RENDERING ' + exportProgress + '%' : 'EXPORT ' + exportFormat.toUpperCase()}</button>
              {busy && <button type="button" className="mini" onClick={cancelExport}>CANCEL</button>}
            </div>
            {busy && <progress aria-label="Export progress" className="export-progress" max={100} value={exportProgress} />}
            <details className="mini-sec"><summary>Saved looks · recipe · advanced tools</summary>
            <div className="row-btns">
              <button type="button" className="mini" onClick={() => void snapshot()} disabled={busy}>Render PNG</button>
              <button type="button" className="mini" onClick={() => { setRecipeText(JSON.stringify(recipe(), null, 1)); setDialog('recipe'); }}>RECIPE</button>
              <button type="button" className="mini" onClick={() => void fullscreen()}>FULL SCREEN</button>
              <button type="button" className={'mini' + (recording ? ' rec' : '')} onClick={toggleRec}>{recording ? 'STOP LIVE REC' : 'LIVE REC'}</button>
              <button type="button" className="mini" onClick={saveLook}>Save this look</button>
              <button type="button" className="mini" onClick={() => setDialog('glsl')}>View GLSL</button>
            </div>
            {saved.length === 0 && <p className="note">Saved looks land here and stay in this browser. Use RECIPE to move one between devices.</p>}
            {saved.map((v, i) => (
              <div className="saved" key={i}>
                <button type="button" className="mini grow" onClick={() => { try { applyRecipe(v.recipe); say('Look restored'); } catch (e) { say((e as Error).message); } }}>{v.name}</button>
                <button type="button" className="mini" aria-label={'Delete saved look ' + v.name} onClick={() => persist(saved.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            </details>
          </Section>
          </>)}
        </div>
        <footer className="side-foot">Drag the art to move the warp pole · scroll or pinch to zoom · double-click to centre</footer>
      </aside>

      {error && <div className="error panel" role="alert"><strong>Renderer problem</strong><p>{error}</p><button type="button" className="mini" onClick={() => setError('')}>Dismiss</button></div>}
      {toast && <div className="toast panel" role="status">{toast}</div>}

      {dialog !== 'none' && (
        <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) setDialog('none'); }}>
          <div className="panel modal" role="dialog" aria-modal="true" aria-label={dialog}>
            {dialog === 'recipe' && (<>
              <div className="modal-head"><h2>Recipe</h2><button type="button" className="btn" onClick={() => setDialog('none')}>CLOSE</button></div>
              <textarea id="recipe-text" spellCheck={false} value={recipeText} onChange={(e) => setRecipeText(e.target.value)} aria-label="Recipe JSON" />
              <p className="note">Every knob, toggle and colour of the current look. Paste one here and press Load to bring it back.</p>
              <div className="row-btns">
                <button type="button" className="btn" onClick={() => void copy(recipeText, 'Recipe')}>COPY</button>
                <button type="button" className="btn" onClick={() => { try { applyRecipe(JSON.parse(recipeText)); setDialog('none'); say('Recipe loaded'); } catch (e) { say(e instanceof SyntaxError ? 'That text is not valid JSON.' : (e as Error).message); } }}>LOAD</button>
              </div>
            </>)}
            {dialog === 'glsl' && (<>
              <div className="modal-head"><h2>Fragment shader for this engine pair</h2><button type="button" className="btn" onClick={() => setDialog('none')}>CLOSE</button></div>
              <textarea id="glsl-text" readOnly spellCheck={false} value={buildSceneFS({ a: s.engineA, b: s.engineB, blend: s.blendMode, fd: s.fdOn })} aria-label="GLSL source" />
              <div className="row-btns"><button type="button" className="btn" onClick={() => void copy(buildSceneFS({ a: s.engineA, b: s.engineB, blend: s.blendMode, fd: s.fdOn }), 'GLSL')}>COPY GLSL</button></div>
            </>)}
            {dialog === 'media' && media && (<>
              <div className="modal-head"><h2>{media.kind === 'png' ? 'PNG render' : media.kind.toUpperCase() + ' render'}</h2><button type="button" className="btn" onClick={() => setDialog('none')}>CLOSE</button></div>
              {(media.kind === 'png' || media.kind === 'gif') ? <img src={media.url} alt="Rendered artwork" /> : <video src={media.url} controls loop autoPlay muted />}
              <p className="note">Right-click or long-press the {(media.kind === 'png' || media.kind === 'gif') ? 'image' : 'video'} and choose Save. The button below also works when this page runs outside an embedded viewer.</p>
              <div className="row-btns"><a className="btn" href={media.url} download={media.name}>DOWNLOAD FILE</a></div>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}
