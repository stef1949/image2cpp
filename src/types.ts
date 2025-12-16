export interface Settings {
  screenWidth: number;
  screenHeight: number;
  scaleToFit: boolean;
  preserveRatio: boolean;
  centerHorizontally: boolean;
  centerVertically: boolean;
  flipHorizontally: boolean;
  flipVertically: boolean;
  backgroundColor: 'white' | 'black' | 'transparent';
  scale: number;
  drawMode: string;
  removeZeroesCommas: boolean;
  ditheringThreshold: number;
  ditheringMode: number;
  outputFormat: string;
  invertColors: boolean;
  rotation: number;
  bitswap?: boolean;
  conversionFunction?: ConversionFunction;
}

export type ConversionFunction = (data: Uint8ClampedArray, canvasWidth: number) => string;

export interface ImageObject {
  img: HTMLImageElement;
  canvas: HTMLCanvasElement;
  glyph?: string;
  ctx?: CanvasRenderingContext2D;
}

export interface ConversionFunctions {
  horizontal1bit: ConversionFunction;
  vertical1bit: ConversionFunction;
  horizontal565: ConversionFunction;
  horizontal888: ConversionFunction;
  horizontalAlpha: ConversionFunction;
}
