import { UNIFORM_KEYS, type State } from '../state';
import { hexToRgb } from '../palettes';
import { buildSceneFS, FEEDBACK_FS, POST_FS, QUAD_VS, sceneKey, SWARM_FS, SWARM_VS, type SceneKey } from './shaders';

interface Prog { p: WebGLProgram; locs: Map<string, WebGLUniformLocation | null>; }
interface Target { fbo: WebGLFramebuffer; tex: WebGLTexture; }

const SWARM_COUNT = 12000;

export class Renderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  private scenes = new Map<string, Prog>();
  private scene: Prog | null = null;
  private sceneId = '';
  private feedback: Prog;
  private post: Prog;
  private swarm: Prog;
  private quadVAO: WebGLVertexArrayObject;
  private swarmVAO: WebGLVertexArrayObject;
  private sceneT!: Target;
  private hist!: [Target, Target];
  private histIdx = 0;
  private tw = 0;
  private th = 0;
  private palBuf = new Float32Array(24);
  lastError = '';
  private failed = new Map<string, string>();

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL2 is not available in this browser. Turn on hardware acceleration and reload.');
    this.gl = gl;
    this.canvas = canvas;

    this.quadVAO = gl.createVertexArray()!;
    gl.bindVertexArray(this.quadVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Swarm particles: idFrac, golden angle, shell radius, glyph type
    const data = new Float32Array(SWARM_COUNT * 4);
    for (let i = 0; i < SWARM_COUNT; i++) {
      // shuffle-ish id so drawing the first N particles still covers every shell
      const id = (i * 7919) % SWARM_COUNT;
      data[i * 4] = id / SWARM_COUNT;
      data[i * 4 + 1] = id * 2.39996323;
      data[i * 4 + 2] = Math.sqrt(id / SWARM_COUNT);
      data[i * 4 + 3] = i % 4;
    }
    this.swarmVAO = gl.createVertexArray()!;
    gl.bindVertexArray(this.swarmVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.feedback = this.compile(QUAD_VS, FEEDBACK_FS);
    this.post = this.compile(QUAD_VS, POST_FS);
    this.swarm = this.compile(SWARM_VS, SWARM_FS);
  }

  private compile(vsSrc: string, fsSrc: string): Prog {
    const gl = this.gl;
    const mk = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(s) || 'unknown shader error';
        gl.deleteShader(s);
        throw new Error(log);
      }
      return s;
    };
    const p = gl.createProgram()!;
    const vs = mk(gl.VERTEX_SHADER, vsSrc);
    const fs = mk(gl.FRAGMENT_SHADER, fsSrc);
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link error');
    return { p, locs: new Map() };
  }

  private loc(pr: Prog, name: string) {
    let l = pr.locs.get(name);
    if (l === undefined) {
      l = this.gl.getUniformLocation(pr.p, name);
      pr.locs.set(name, l);
    }
    return l;
  }

  /** Select (and lazily compile) the scene program for an engine pair. Returns false on a shader error. */
  useScene(k: SceneKey): boolean {
    const id = sceneKey(k);
    if (id === this.sceneId && this.scene) return true;
    const known = this.failed.get(id);
    if (known) { this.lastError = known; return false; }
    let pr = this.scenes.get(id);
    if (!pr) {
      try {
        pr = this.compile(QUAD_VS, buildSceneFS(k));
      } catch (e) {
        this.lastError = `${k.a}${k.b !== 'none' ? ' + ' + k.b : ''}: ${(e as Error).message}`;
        this.failed.set(id, this.lastError);
        return false;
      }
      this.scenes.set(id, pr);
      if (this.scenes.size > 40) {
        const first = this.scenes.keys().next().value as string;
        if (first !== id) { this.gl.deleteProgram(this.scenes.get(first)!.p); this.scenes.delete(first); }
      }
    }
    this.scene = pr;
    this.sceneId = id;
    this.lastError = '';
    return true;
  }

  private makeTarget(w: number, h: number): Target {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { fbo, tex };
  }

  private ensureTargets() {
    const gl = this.gl;
    const w = this.canvas.width, h = this.canvas.height;
    if (w === this.tw && h === this.th) return;
    for (const t of [this.sceneT, ...(this.hist || [])]) {
      if (t) { gl.deleteFramebuffer(t.fbo); gl.deleteTexture(t.tex); }
    }
    this.sceneT = this.makeTarget(w, h);
    this.hist = [this.makeTarget(w, h), this.makeTarget(w, h)];
    this.tw = w;
    this.th = h;
  }

  private setCommon(pr: Prog, s: State, time: number, clock: number, mouse: [number, number]) {
    const gl = this.gl;
    gl.useProgram(pr.p);
    const set1 = (n: string, v: number) => { const l = this.loc(pr, n); if (l) gl.uniform1f(l, v); };
    let l = this.loc(pr, 'uRes'); if (l) gl.uniform2f(l, this.canvas.width, this.canvas.height);
    l = this.loc(pr, 'uMouse'); if (l) gl.uniform2f(l, mouse[0], mouse[1]);
    set1('uTime', time);
    set1('uClock', clock);
    const rec = s as unknown as Record<string, number | boolean>;
    for (const k of UNIFORM_KEYS) set1('u_' + k, Number(rec[k]));
    l = this.loc(pr, 'uPal[0]'); if (l) gl.uniform3fv(l, this.palBuf);
    l = this.loc(pr, 'uPalN'); if (l) gl.uniform1i(l, Math.min(8, s.colors.length));
    l = this.loc(pr, 'uBg'); if (l) { const b = hexToRgb(s.bg); gl.uniform3f(l, b[0], b[1], b[2]); }
  }

  render(s: State, time: number, clock: number, mouse: [number, number]) {
    const gl = this.gl;
    if (!this.scene || gl.isContextLost()) return;
    this.ensureTargets();
    const w = this.canvas.width, h = this.canvas.height;
    gl.viewport(0, 0, w, h);
    gl.disable(gl.BLEND);

    const n = Math.min(8, s.colors.length);
    for (let i = 0; i < 8; i++) this.palBuf.set(hexToRgb(s.colors[i % n]), i * 3);

    // Pass 1: engines -> scene texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneT.fbo);
    this.setCommon(this.scene, s, time, clock, mouse);
    gl.bindVertexArray(this.quadVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (s.swarmOn) {
      this.setCommon(this.swarm, s, time, clock, mouse);
      const l = this.loc(this.swarm, 'uDpr');
      if (l) gl.uniform1f(l, h / 900);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(this.swarmVAO);
      gl.drawArrays(gl.POINTS, 0, Math.floor(SWARM_COUNT * Math.min(1, s.swarm / 1.2)));
      gl.disable(gl.BLEND);
      gl.bindVertexArray(this.quadVAO);
    }

    // Pass 2: feedback trails (ping-pong)
    let src = this.sceneT.tex;
    if (s.trailsOn) {
      const read = this.hist[this.histIdx], write = this.hist[1 - this.histIdx];
      gl.bindFramebuffer(gl.FRAMEBUFFER, write.fbo);
      this.setCommon(this.feedback, s, time, clock, mouse);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.sceneT.tex);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, read.tex);
      gl.uniform1i(this.loc(this.feedback, 'uCur'), 0);
      gl.uniform1i(this.loc(this.feedback, 'uHist'), 1);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      this.histIdx = 1 - this.histIdx;
      src = write.tex;
    }

    // Pass 3: finish -> screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.setCommon(this.post, s, time, clock, mouse);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src);
    gl.uniform1i(this.loc(this.post, 'uTex'), 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  setSize(w: number, h: number) {
    const max = Math.min(this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE) as number, 8192);
    const k = Math.min(1, max / Math.max(w, h));
    w = Math.max(2, Math.round(w * k));
    h = Math.max(2, Math.round(h * k));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  /** Render one still at an arbitrary size and hand back a PNG blob; restores the live size after. */
  async snapshot(s: State, time: number, clock: number, mouse: [number, number], w: number, h: number): Promise<Blob> {
    const ow = this.canvas.width, oh = this.canvas.height;
    this.setSize(w, h);
    // a few frames at a frozen time so feedback trails build up at the new size
    const frames = s.trailsOn ? 10 : 1;
    for (let i = 0; i < frames; i++) this.render(s, time, clock, mouse);
    const blob = await new Promise<Blob | null>((res) => this.canvas.toBlob(res, 'image/png'));
    this.setSize(ow, oh);
    this.render(s, time, clock, mouse);
    if (!blob) throw new Error('The browser could not encode the image at this size. Try a smaller export.');
    return blob;
  }
}
