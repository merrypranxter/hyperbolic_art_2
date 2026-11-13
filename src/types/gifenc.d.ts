declare module 'gifenc' {
  export interface GifEncoder {
    writeFrame(pixels: Uint8Array, width: number, height: number, options: { palette: number[][]; delay: number; }): void;
    finish(): void;
    bytes(): Uint8Array;
  }
  export function GIFEncoder(options?: Record<string, unknown>): GifEncoder;
  export function quantize(pixels: Uint8ClampedArray | Uint8Array, maxColors: number): number[][];
  export function applyPalette(pixels: Uint8ClampedArray | Uint8Array, palette: number[][]): Uint8Array;
}
