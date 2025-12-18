import { dithering } from './dithering';
import type { Settings, ImageObject, ConversionFunction } from './types';

export function bitswap(b: number, settings: Settings): number {
  let result = b;
  if (settings.bitswap) {
    result = ((result & 0xF0) >> 4) | ((result & 0x0F) << 4);
    result = ((result & 0xCC) >> 2) | ((result & 0x33) << 2);
    result = ((result & 0xAA) >> 1) | ((result & 0x55) << 1);
  }
  return result;
}

export const conversionFunctions = {
  horizontal1bit: (data: Uint8ClampedArray, canvasWidth: number, settings: Settings): string => {
    let stringFromBytes = '';
    let outputIndex = 0;
    let byteIndex = 7;
    let number = 0;

    for (let index = 0; index < data.length; index += 4) {
      const avg = (data[index] + data[index + 1] + data[index + 2]) / 3;
      if (avg > settings.ditheringThreshold) {
        number += 2 ** byteIndex;
      }
      byteIndex--;

      if ((index !== 0 && (((index / 4) + 1) % (canvasWidth)) === 0) || (index === data.length - 4)) {
        byteIndex = -1;
      }

      if (byteIndex < 0) {
        let byteSet = bitswap(number, settings).toString(16);
        if (byteSet.length === 1) { byteSet = `0${byteSet}`; }
        if (!settings.removeZeroesCommas) {
          stringFromBytes += `0x${byteSet}, `;
        } else {
          stringFromBytes += byteSet;
        }
        outputIndex++;
        if (outputIndex >= 16) {
          if (!settings.removeZeroesCommas) {
            stringFromBytes += '\n';
          }
          outputIndex = 0;
        }
        number = 0;
        byteIndex = 7;
      }
    }
    return stringFromBytes;
  },

  vertical1bit: (data: Uint8ClampedArray, _canvasWidth: number, settings: Settings): string => {
    let stringFromBytes = '';
    let outputIndex = 0;
    for (let p = 0; p < Math.ceil(settings.screenHeight / 8); p++) {
      for (let x = 0; x < settings.screenWidth; x++) {
        let byteIndex = 7;
        let number = 0;

        for (let y = 7; y >= 0; y--) {
          const index = ((p * 8) + y) * (settings.screenWidth * 4) + x * 4;
          const avg = (data[index] + data[index + 1] + data[index + 2]) / 3;
          if (avg > settings.ditheringThreshold) {
            number += 2 ** byteIndex;
          }
          byteIndex--;
        }
        let byteSet = bitswap(number, settings).toString(16);
        if (byteSet.length === 1) { byteSet = `0${byteSet}`; }
        if (!settings.removeZeroesCommas) {
          stringFromBytes += `0x${byteSet}, `;
        } else {
          stringFromBytes += byteSet;
        }
        outputIndex++;
        if (outputIndex >= 16) {
          stringFromBytes += '\n';
          outputIndex = 0;
        }
      }
    }
    return stringFromBytes;
  },

  horizontal565: (data: Uint8ClampedArray, _canvasWidth: number, settings: Settings): string => {
    let stringFromBytes = '';
    let outputIndex = 0;

    for (let index = 0; index < data.length; index += 4) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const rgb = ((r & 0b11111000) << 8) | ((g & 0b11111100) << 3) | ((b & 0b11111000) >> 3);

      let byteSet = bitswap(rgb, settings).toString(16);
      while (byteSet.length < 4) { byteSet = `0${byteSet}`; }
      if (!settings.removeZeroesCommas) {
        stringFromBytes += `0x${byteSet}, `;
      } else {
        stringFromBytes += byteSet;
      }
      outputIndex++;
      if (outputIndex >= 16) {
        stringFromBytes += '\n';
        outputIndex = 0;
      }
    }
    return stringFromBytes;
  },

  horizontal888: (data: Uint8ClampedArray, canvasWidth: number, settings: Settings): string => {
    let stringFromBytes = '';
    let outputIndex = 0;

    for (let index = 0; index < data.length; index += 4) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const rgb = (r << 16) | (g << 8) | (b);

      let byteSet = bitswap(rgb, settings).toString(16);
      while (byteSet.length < 8) { byteSet = `0${byteSet}`; }
      if (!settings.removeZeroesCommas) {
        stringFromBytes += `0x${byteSet}, `;
      } else {
        stringFromBytes += byteSet;
      }

      outputIndex++;
      if (outputIndex >= canvasWidth) {
        stringFromBytes += '\n';
        outputIndex = 0;
      }
    }
    return stringFromBytes;
  },

  horizontalAlpha: (data: Uint8ClampedArray, canvasWidth: number, settings: Settings): string => {
    let stringFromBytes = '';
    let outputIndex = 0;
    let byteIndex = 7;
    let number = 0;

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3];
      if (alpha > settings.ditheringThreshold) {
        number += 2 ** byteIndex;
      }
      byteIndex--;

      if ((index !== 0 && (((index / 4) + 1) % (canvasWidth)) === 0) || (index === data.length - 4)) {
        byteIndex = -1;
      }

      if (byteIndex < 0) {
        let byteSet = bitswap(number, settings).toString(16);
        if (byteSet.length === 1) { byteSet = `0${byteSet}`; }
        if (!settings.removeZeroesCommas) {
          stringFromBytes += `0x${byteSet}, `;
        } else {
          stringFromBytes += byteSet;
        }
        outputIndex++;
        if (outputIndex >= 16) {
          stringFromBytes += '\n';
          outputIndex = 0;
        }
        number = 0;
        byteIndex = 7;
      }
    }
    return stringFromBytes;
  },
};

export function getImageType(conversionFunction: string): string {
  if (conversionFunction === 'horizontal565') {
    return 'uint16_t';
  }
  if (conversionFunction === 'horizontal888') {
    return 'unsigned long';
  }
  return 'unsigned char';
}

export function processImage(
  image: ImageObject,
  settings: Settings
): string {
  const { ctx, canvas } = image;
  if (!ctx) return '';
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  
  const conversionKey = settings.drawMode + (settings.conversionFunction ? '1bit' : '');
  const convFn = conversionFunctions[conversionKey as keyof typeof conversionFunctions];
  
  if (convFn) {
    return convFn(data, canvas.width, settings);
  }
  
  return '';
}

export function invert(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  ctx.putImageData(imageData, 0, 0);
}

export function placeImage(
  image: ImageObject,
  settings: Settings
): void {
  const { img, canvas } = image;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = Number.isFinite(settings.screenWidth) && settings.screenWidth > 0 ? settings.screenWidth : 1;
  canvas.height = Number.isFinite(settings.screenHeight) && settings.screenHeight > 0 ? settings.screenHeight : 1;
  image.ctx = ctx;
  ctx.save();

  if (settings.backgroundColor === 'transparent') {
    ctx.fillStyle = 'rgba(0,0,0,0.0)';
    ctx.globalCompositeOperation = 'copy';
  } else {
    if (settings.invertColors) {
      ctx.fillStyle = settings.backgroundColor === 'white' ? 'black' : 'white';
    } else {
      ctx.fillStyle = settings.backgroundColor;
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let offsetX = 0;
  let offsetY = 0;
  const imgW = img.width;
  const imgH = img.height;

  switch (settings.scale) {
    case 1:
      if (settings.centerHorizontally) {
        offsetX = Math.round((canvas.width - imgW) / 2);
      }
      if (settings.centerVertically) {
        offsetY = Math.round((canvas.height - imgH) / 2);
      }
      ctx.drawImage(img, 0, 0, imgW, imgH, offsetX, offsetY, imgW, imgH);
      break;
    case 2: {
      const useRatio = Math.min(canvas.width / imgW, canvas.height / imgH);
      if (settings.centerHorizontally) {
        offsetX = Math.round((canvas.width - imgW * useRatio) / 2);
      }
      if (settings.centerVertically) {
        offsetY = Math.round((canvas.height - imgH * useRatio) / 2);
      }
      ctx.drawImage(img, 0, 0, imgW, imgH, offsetX, offsetY, imgW * useRatio, imgH * useRatio);
      break;
    }
    case 3:
      ctx.drawImage(img, 0, 0, imgW, imgH, offsetX, offsetY, canvas.width, canvas.height);
      break;
    case 4:
      offsetX = 0;
      if (settings.centerVertically) {
        offsetY = Math.round((canvas.height - imgH) / 2);
      }
      ctx.drawImage(img, 0, 0, imgW, imgH, offsetX, offsetY, canvas.width, imgH);
      break;
    case 5:
      if (settings.centerHorizontally) {
        offsetX = Math.round((canvas.width - imgW) / 2);
      }
      offsetY = 0;
      ctx.drawImage(img, 0, 0, imgW, imgH, offsetX, offsetY, imgW, canvas.height);
      break;
  }
  ctx.restore();

  const needsDithering = settings.drawMode === 'horizontal' || settings.drawMode === 'vertical';
  if (needsDithering) {
    dithering(ctx, canvas.width, canvas.height, settings.ditheringThreshold, settings.ditheringMode);
    if (settings.invertColors) {
      invert(canvas, ctx);
    }
  }

  if (settings.rotation !== 0) {
    const clone = canvas.cloneNode(true) as HTMLCanvasElement;
    const cloneCtx = clone.getContext('2d');
    if (cloneCtx) {
      cloneCtx.drawImage(canvas, 0, 0);
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (settings.rotation === 90) {
        canvas.width = settings.screenHeight;
        canvas.height = settings.screenWidth;
        ctx.setTransform(1, 0, 0, 1, canvas.width, 0);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(clone, 0, 0);
      } else if (settings.rotation === 180) {
        ctx.setTransform(1, 0, 0, 1, canvas.width, canvas.height);
        ctx.rotate(Math.PI);
        ctx.drawImage(clone, 0, 0);
      } else if (settings.rotation === 270) {
        canvas.width = settings.screenHeight;
        canvas.height = settings.screenWidth;
        ctx.setTransform(1, 0, 0, 1, 0, canvas.height);
        ctx.rotate(Math.PI * 1.5);
        ctx.drawImage(clone, 0, 0);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  const flipHorizontal = settings.flipHorizontally ? -1 : 1;
  const xOffset = settings.flipHorizontally ? canvas.width : 0;
  const flipVertical = settings.flipVertically ? -1 : 1;
  const yOffset = settings.flipVertically ? canvas.height : 0;

  if (flipHorizontal === -1 || flipVertical === -1) {
    const clone = canvas.cloneNode(true) as HTMLCanvasElement;
    const cloneCtx = clone.getContext('2d');
    if (cloneCtx) {
      cloneCtx.drawImage(canvas, 0, 0);
      ctx.setTransform(flipHorizontal, 0, 0, flipVertical, xOffset, yOffset);
      ctx.drawImage(clone, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
}
