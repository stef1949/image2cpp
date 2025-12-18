type Palette = number[][];
type DitheringType = 'binary' | 'bayer' | 'floydsteinberg' | 'atkinson';

export const bwrPalette: Palette = [
  [0, 0, 0, 255],
  [255, 255, 255, 255],
  [255, 0, 0, 255],
];

export const bwPalette: Palette = [
  [0, 0, 0, 255],
  [255, 255, 255, 255],
];

export function dithering(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  threshold: number,
  typeIndex: number
): void {
  const type: DitheringType = ['binary', 'bayer', 'floydsteinberg', 'atkinson'][typeIndex] as DitheringType;
  const bayerThresholdMap = [
    [15, 135, 45, 165],
    [195, 75, 225, 105],
    [60, 180, 30, 150],
    [240, 120, 210, 90],
  ];

  const lumR: number[] = [];
  const lumG: number[] = [];
  const lumB: number[] = [];
  for (let i = 0; i < 256; i++) {
    lumR[i] = i * 0.299;
    lumG[i] = i * 0.587;
    lumB[i] = i * 0.114;
  }
  const imageData = ctx.getImageData(0, 0, width, height);

  const imageDataLength = imageData.data.length;

  // Greyscale luminance (sets r pixels to luminance of rgb)
  for (let i = 0; i <= imageDataLength; i += 4) {
    imageData.data[i] =
      Math.floor(lumR[imageData.data[i]] + lumG[imageData.data[i + 1]] + lumB[imageData.data[i + 2]]);
  }

  const w = imageData.width;
  let newPixel: number;
  let err: number;

  for (let currentPixel = 0; currentPixel <= imageDataLength; currentPixel += 4) {
    if (type === 'binary') {
      // No dithering
      imageData.data[currentPixel] = imageData.data[currentPixel] < threshold ? 0 : 255;
    } else if (type === 'bayer') {
      // 4x4 Bayer ordered dithering algorithm
      const x = Math.floor(currentPixel / 4) % w;
      const y = Math.floor(currentPixel / 4 / w);
      const map = Math.floor((imageData.data[currentPixel] + bayerThresholdMap[x % 4][y % 4]) / 2);
      imageData.data[currentPixel] = (map < threshold) ? 0 : 255;
    } else if (type === 'floydsteinberg') {
      // Floyd–Steinberg dithering algorithm
      newPixel = imageData.data[currentPixel] < 129 ? 0 : 255;
      err = Math.floor((imageData.data[currentPixel] - newPixel) / 16);
      imageData.data[currentPixel] = newPixel;

      imageData.data[currentPixel + 4] += err * 7;
      imageData.data[currentPixel + 4 * w - 4] += err * 3;
      imageData.data[currentPixel + 4 * w] += err * 5;
      imageData.data[currentPixel + 4 * w + 4] += err * 1;
    } else if (type === 'atkinson') {
      // Bill Atkinson's dithering algorithm
      newPixel = imageData.data[currentPixel] < threshold ? 0 : 255;
      err = Math.floor((imageData.data[currentPixel] - newPixel) / 8);
      imageData.data[currentPixel] = newPixel;

      imageData.data[currentPixel + 4] += err;
      imageData.data[currentPixel + 8] += err;
      imageData.data[currentPixel + 4 * w - 4] += err;
      imageData.data[currentPixel + 4 * w] += err;
      imageData.data[currentPixel + 4 * w + 4] += err;
      imageData.data[currentPixel + 8 * w] += err;
    } else {
      console.error(`unknown dithering type requested: ${type}`);
    }

    // Set g and b pixels equal to r
    imageData.data[currentPixel + 1] = imageData.data[currentPixel + 2] = imageData.data[currentPixel];
  }

  ctx.putImageData(imageData, 0, 0);
}

export function canvas2bytes(canvas: HTMLCanvasElement, type: string = 'bw'): number[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const arr: number[] = [];
  let buffer: number[] = [];

  for (let x = canvas.width - 1; x >= 0; x--) {
    for (let y = 0; y < canvas.height; y++) {
      const index = (canvas.width * 4 * y) + x * 4;
      if (type !== 'bwr') {
        buffer.push(imageData.data[index] > 0 && imageData.data[index + 1] > 0 && imageData.data[index + 2] > 0 ? 1 : 0);
      } else {
        buffer.push(imageData.data[index] > 0 && imageData.data[index + 1] === 0 && imageData.data[index + 2] === 0 ? 1 : 0);
      }

      if (buffer.length === 8) {
        arr.push(parseInt(buffer.join(''), 2));
        buffer = [];
      }
    }
  }
  return arr;
}

function getNearColorV2(color: Uint8ClampedArray | number[], palette: Palette): number[] {
  let minDistanceSquared = 255 * 255 + 255 * 255 + 255 * 255 + 1;

  let bestIndex = 0;
  for (let i = 0; i < palette.length; i++) {
    const rdiff = (color[0] & 0xff) - (palette[i][0] & 0xff);
    const gdiff = (color[1] & 0xff) - (palette[i][1] & 0xff);
    const bdiff = (color[2] & 0xff) - (palette[i][2] & 0xff);
    const distanceSquared = rdiff * rdiff + gdiff * gdiff + bdiff * bdiff;
    if (distanceSquared < minDistanceSquared) {
      minDistanceSquared = distanceSquared;
      bestIndex = i;
    }
  }
  return palette[bestIndex];
}

function updatePixel(imageData: Uint8ClampedArray, index: number, color: number[]): void {
  imageData[index] = color[0];
  imageData[index + 1] = color[1];
  imageData[index + 2] = color[2];
  imageData[index + 3] = color[3];
}

function getColorErr(color1: Uint8ClampedArray | number[], color2: number[], rate: number): number[] {
  const res: number[] = [];
  for (let i = 0; i < 3; i++) {
    res.push(Math.floor((color1[i] - color2[i]) / rate));
  }
  return res;
}

function updatePixelErr(imageData: Uint8ClampedArray, index: number, err: number[], rate: number): void {
  imageData[index] += err[0] * rate;
  imageData[index + 1] += err[1] * rate;
  imageData[index + 2] += err[2] * rate;
}

export function ditheringCanvasByPalette(canvas: HTMLCanvasElement, palette: Palette | null, type: string): void {
  const usePalette = palette || bwrPalette;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const w = imageData.width;

  for (let currentPixel = 0; currentPixel <= imageData.data.length; currentPixel += 4) {
    const newColor = getNearColorV2(imageData.data.slice(currentPixel, currentPixel + 4), usePalette);

    if (type === 'bwr_floydsteinberg') {
      const err = getColorErr(imageData.data.slice(currentPixel, currentPixel + 4), newColor, 16);

      updatePixel(imageData.data, currentPixel, newColor);
      updatePixelErr(imageData.data, currentPixel + 4, err, 7);
      updatePixelErr(imageData.data, currentPixel + 4 * w - 4, err, 3);
      updatePixelErr(imageData.data, currentPixel + 4 * w, err, 5);
      updatePixelErr(imageData.data, currentPixel + 4 * w + 4, err, 1);
    } else {
      const err = getColorErr(imageData.data.slice(currentPixel, currentPixel + 4), newColor, 8);

      updatePixel(imageData.data, currentPixel, newColor);
      updatePixelErr(imageData.data, currentPixel + 4, err, 1);
      updatePixelErr(imageData.data, currentPixel + 8, err, 1);
      updatePixelErr(imageData.data, currentPixel + 4 * w - 4, err, 1);
      updatePixelErr(imageData.data, currentPixel + 4 * w, err, 1);
      updatePixelErr(imageData.data, currentPixel + 4 * w + 4, err, 1);
      updatePixelErr(imageData.data, currentPixel + 8 * w, err, 1);
    }
  }
  ctx.putImageData(imageData, 0, 0);
}
