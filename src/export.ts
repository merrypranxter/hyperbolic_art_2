import type { Renderer } from './gl/renderer';
import type { State } from './state';

export interface AnimationSettings {
  format: 'gif' | 'mp4';
  width: number;
  height: number;
  seconds: number;
  fps: number;
  bitrate: number;
}
export interface AnimationResult { blob: Blob; extension: 'gif' | 'mp4'; width: number; height: number; }

const nextPaint = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Reuses the original Acid Loom renderer at a temporary output size.
 * No engine, shader, preset, state mutation, or live speed setting is changed.
 * Instead of screen-recording variable real-time frames, renders uniformly
 * spaced shader times and passes them to an encoder with exact timestamps.
 */
export async function renderAnimation(
  renderer: Renderer,
  state: State,
  startTime: number,
  startWall: number,
  mouse: [number, number],
  opts: AnimationSettings,
  progress: (n: number) => void,
  isCancelled: () => boolean,
): Promise<AnimationResult> {
  const canvas = renderer.canvas;
  const previous = [canvas.width, canvas.height] as const;
  const total = Math.max(1, Math.round(opts.seconds * opts.fps));
  const check = () => {
    if (isCancelled()) throw new Error('Export cancelled');
  };
  try {
    check();
    renderer.setSize(opts.width, opts.height);
    const width = canvas.width, height = canvas.height;
    if (width !== opts.width || height !== opts.height)
      throw new Error('This device cannot allocate the selected resolution. Choose a smaller size.');
    if (!renderer.useScene({ a: state.engineA, b: state.engineB, blend: state.blendMode, fd: state.fdOn }))
      throw new Error('The current shader failed to compile: ' + renderer.lastError);

    const renderFrame = (i: number) => {
      check();
      const dt = i / opts.fps;
      renderer.render(state, startTime + dt * state.speed, startWall + dt, mouse);
    };

    if (opts.format === 'gif') {
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
      const gif = GIFEncoder();
      const scratch = document.createElement('canvas');
      scratch.width = width; scratch.height = height;
      const ctx = scratch.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Could not initialize the GIF pixel reader.');
      for (let i = 0; i < total; i++) {
        renderFrame(i);
        ctx.drawImage(canvas, 0, 0);
        const frame = ctx.getImageData(0, 0, width, height);
        const palette = quantize(frame.data, 256);
        const pixels = applyPalette(frame.data, palette);
        gif.writeFrame(pixels, width, height, { palette, delay: Math.round(1000 / opts.fps) });
        progress((i + 1) / total);
        if (i % 2 === 0) await nextPaint();
      }
      gif.finish();
      const bytes = Uint8Array.from(gif.bytes());
      return { blob: new Blob([bytes], { type: 'image/gif' }), extension: 'gif', width, height };
    }

    const { Output, Mp4OutputFormat, BufferTarget, CanvasSource, Quality } = await import('mediabunny');
    const target = new BufferTarget();
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target });
    const source = new CanvasSource(canvas, {
      codec: 'avc',
      quality: new Quality({ bitrate: opts.bitrate }),
      keyFrameInterval: 2,
    });
    output.addVideoTrack(source);
    await output.start();
    for (let i = 0; i < total; i++) {
      renderFrame(i);
      await source.add(i / opts.fps, 1 / opts.fps);
      progress((i + 1) / total);
      if (i % 3 === 0) await nextPaint();
    }
    source.close();
    await output.finalize();
    if (!target.buffer) throw new Error('The MP4 encoder produced no file.');
    return { blob: new Blob([target.buffer], { type: 'video/mp4' }), extension: 'mp4', width, height };
  } finally {
    renderer.setSize(previous[0], previous[1]);
    renderer.useScene({ a: state.engineA, b: state.engineB, blend: state.blendMode, fd: state.fdOn });
    renderer.render(state, startTime, startWall, mouse);
  }
}
