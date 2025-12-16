import { dithering } from './dithering';
import type { Settings, ImageObject, ConversionFunction, ConversionFunctions } from './types';

// A bunch of settings used when converting
const settings: Settings = {
  screenWidth: 128,
  screenHeight: 64,
  scaleToFit: true,
  preserveRatio: true,
  centerHorizontally: false,
  centerVertically: false,
  flipHorizontally: false,
  flipVertically: false,
  backgroundColor: 'white',
  scale: 1,
  drawMode: 'horizontal',
  removeZeroesCommas: false,
  ditheringThreshold: 128,
  ditheringMode: 0,
  outputFormat: 'plain',
  invertColors: false,
  rotation: 0,
};

function bitswap(b: number): number {
  let result = b;
  if (settings.bitswap) {
    result = ((result & 0xF0) >> 4) | ((result & 0x0F) << 4);
    result = ((result & 0xCC) >> 2) | ((result & 0x33) << 2);
    result = ((result & 0xAA) >> 1) | ((result & 0x55) << 1);
  }
  return result;
}

const ConversionFunctions: ConversionFunctions = {
  // Output the image as a string for horizontally drawing displays
  horizontal1bit(data: Uint8ClampedArray, canvasWidth: number): string {
    let stringFromBytes = '';
    let outputIndex = 0;
    let byteIndex = 7;
    let number = 0;

    // format is RGBA, so move 4 steps per pixel
    for (let index = 0; index < data.length; index += 4) {
      // Get the average of the RGB (we ignore A)
      const avg = (data[index] + data[index + 1] + data[index + 2]) / 3;
      if (avg > settings.ditheringThreshold) {
        number += 2 ** byteIndex;
      }
      byteIndex--;

      // if this was the last pixel of a row or the last pixel of the
      // image, fill up the rest of our byte with zeros so it always contains 8 bits
      if ((index !== 0 && (((index / 4) + 1) % (canvasWidth)) === 0) || (index === data.length - 4)) {
        byteIndex = -1;
      }

      // When we have the complete 8 bits, combine them into a hex value
      if (byteIndex < 0) {
        let byteSet = bitswap(number).toString(16);
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

  vertical1bit(data: Uint8ClampedArray, _canvasWidth: number): string {
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
        let byteSet = bitswap(number).toString(16);
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

  horizontal565(data: Uint8ClampedArray, _canvasWidth: number): string {
    let stringFromBytes = '';
    let outputIndex = 0;

    // format is RGBA, so move 4 steps per pixel
    for (let index = 0; index < data.length; index += 4) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const rgb = ((r & 0b11111000) << 8) | ((g & 0b11111100) << 3) | ((b & 0b11111000) >> 3);

      let byteSet = bitswap(rgb).toString(16);
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

  horizontal888(data: Uint8ClampedArray, canvasWidth: number): string {
    let stringFromBytes = '';
    let outputIndex = 0;

    for (let index = 0; index < data.length; index += 4) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const rgb = (r << 16) | (g << 8) | (b);

      let byteSet = bitswap(rgb).toString(16);
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

  horizontalAlpha(data: Uint8ClampedArray, canvasWidth: number): string {
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
        let byteSet = bitswap(number).toString(16);
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

settings.conversionFunction = ConversionFunctions.horizontal1bit;

// An images collection with helper methods
class Images {
  private collection: ImageObject[] = [];

  push(img: HTMLImageElement, canvas: HTMLCanvasElement, glyph?: string): void {
    this.collection.push({ img, canvas, glyph });
  }

  remove(image: ImageObject): void {
    const i = this.collection.indexOf(image);
    if (i !== -1) this.collection.splice(i, 1);
  }

  each(f: (image: ImageObject) => void): void {
    this.collection.forEach(f);
  }

  length(): number {
    return this.collection.length;
  }

  first(): ImageObject {
    return this.collection[0];
  }

  last(): ImageObject {
    return this.collection[this.collection.length - 1];
  }

  getByIndex(index: number): ImageObject {
    return this.collection[index];
  }

  setByIndex(index: number, img: ImageObject): void {
    this.collection[index] = img;
  }

  get(img?: HTMLImageElement): ImageObject | ImageObject[] {
    if (img) {
      for (let i = 0; i < this.collection.length; i++) {
        if (this.collection[i].img === img) {
          return this.collection[i];
        }
      }
    }
    return this.collection;
  }
}

const images = new Images();
const identifier = 'myBitmap';

function invert(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  ctx.putImageData(imageData, 0, 0);
}

function placeImage(_image: ImageObject): void {
  const { img, canvas } = _image;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = Number.isFinite(settings.screenWidth) && settings.screenWidth > 0 ? settings.screenWidth : 1;
  canvas.height = Number.isFinite(settings.screenHeight) && settings.screenHeight > 0 ? settings.screenHeight : 1;
  _image.ctx = ctx;
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

  if (settings.conversionFunction === ConversionFunctions.horizontal1bit
    || settings.conversionFunction === ConversionFunctions.vertical1bit) {
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

function updateAllImages(): void {
  images.each((image) => {
    placeImage(image);
  });
}

function updateInteger(fieldName: keyof Settings): void {
  const element = document.getElementById(fieldName) as HTMLInputElement;
  if (element) {
    settings[fieldName] = parseInt(element.value) as never;
    updateAllImages();
  }
}

function updateBoolean(fieldName: keyof Settings): void {
  const element = document.getElementById(fieldName) as HTMLInputElement;
  if (element) {
    settings[fieldName] = element.checked as never;
    updateAllImages();
  }
}

function hexToBinary(s: string): { valid: boolean; result?: string; s?: string } {
  let ret = '';
  const lookupTable: Record<string, string> = {
    0: '0000', 1: '0001', 2: '0010', 3: '0011',
    4: '0100', 5: '0101', 6: '0110', 7: '0111',
    8: '1000', 9: '1001',
    a: '1010', b: '1011', c: '1100', d: '1101', e: '1110', f: '1111',
    A: '1010', B: '1011', C: '1100', D: '1101', E: '1110', F: '1111',
  };
  for (let i = 0; i < s.length; i += 1) {
    if (lookupTable.hasOwnProperty(s[i])) {
      ret += lookupTable[s[i]];
    } else {
      return { valid: false, s };
    }
  }
  return { valid: true, result: ret };
}

function getImageType(): string {
  if (settings.conversionFunction === ConversionFunctions.horizontal565) {
    return 'uint16_t';
  }
  if (settings.conversionFunction === ConversionFunctions.horizontal888) {
    return 'unsigned long';
  }
  return 'unsigned char';
}

function listToImageHorizontal(list: string[], canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const imgData = ctx.createImageData(canvas.width, canvas.height);
  let index = 0;

  const widthRoundedUp = Math.floor(canvas.width / 8 + (canvas.width % 8 ? 1 : 0)) * 8;
  let widthCounter = 0;

  for (let i = 0; i < list.length; i++) {
    const binResult = hexToBinary(list[i]);
    if (!binResult.valid) {
      alert('Something went wrong converting the string. Make sure there are no comments in your input?');
      console.error('invalid hexToBinary: ', binResult.s);
      return;
    }
    let binString = binResult.result || '';
    if (binString.length === 4) {
      binString += '0000';
    }

    for (let k = 0; k < binString.length; k++, widthCounter++) {
      if (widthCounter >= widthRoundedUp) {
        widthCounter = 0;
      }
      if (widthCounter < canvas.width) {
        const color = binString.charAt(k) === '1' ? 255 : 0;
        imgData.data[index] = color;
        imgData.data[index + 1] = color;
        imgData.data[index + 2] = color;
        imgData.data[index + 3] = 255;
        index += 4;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const img = new Image();
  img.src = canvas.toDataURL('image/png');
  images.first().img = img;
}

function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: number): void {
  const singlePixel = ctx.createImageData(1, 1);
  const d = singlePixel.data;
  d[0] = color;
  d[1] = color;
  d[2] = color;
  d[3] = 255;
  ctx.putImageData(singlePixel, x, y);
}

function listToImageVertical(list: string[], canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let page = 0;
  let x = 0;
  let y = 7;

  for (let i = 0; i < list.length; i++) {
    const binResult = hexToBinary(list[i]);
    if (!binResult.valid) {
      alert('Something went wrong converting the string. Did you forget to remove any comments from the input?');
      console.error('invalid hexToBinary: ', binResult.s);
      return;
    }
    let binString = binResult.result || '';
    if (binString.length === 4) {
      binString += '0000';
    }

    for (let k = 0; k < binString.length; k++) {
      const color = binString.charAt(k) === '1' ? 255 : 0;
      drawPixel(ctx, x, (page * 8) + y, color);
      y--;
      if (y < 0) {
        y = 7;
        x++;
        if (x >= settings.screenWidth) {
          x = 0;
          page++;
        }
      }
    }
  }
  
  const img = new Image();
  img.src = canvas.toDataURL('image/png');
  images.first().img = img;
}

declare global {
  interface Window {
    handleTextInput: (drawMode: string) => void;
    allSameSize: () => void;
    updateInteger: (fieldName: string) => void;
    updateBoolean: (fieldName: string) => void;
    updateDrawMode: (elm: HTMLSelectElement) => void;
    updateOutputFormat: (elm: HTMLSelectElement) => void;
    updateRadio: (fieldName: string) => void;
    generateOutputString: () => void;
    copyOutput: () => void;
    downloadBinFile: () => void;
  }
}

window.handleTextInput = function (drawMode: string): void {
  const canvasContainer = document.getElementById('images-canvas-container');
  const canvas = document.createElement('canvas');

  const widthInput = document.getElementById('text-input-width') as HTMLInputElement;
  const heightInput = document.getElementById('text-input-height') as HTMLInputElement;
  
  canvas.width = parseInt(widthInput.value);
  canvas.height = parseInt(heightInput.value);
  settings.screenWidth = canvas.width;
  settings.screenHeight = canvas.height;

  if (canvasContainer && canvasContainer.children.length) {
    canvasContainer.removeChild(canvasContainer.firstChild!);
  }
  canvasContainer?.appendChild(canvas);

  const image = new Image();
  images.setByIndex(0, { img: image, canvas });

  const byteInput = document.getElementById('byte-input') as HTMLTextAreaElement;
  let input = byteInput.value;

  input = input.replace(/const\s+(unsigned\s+char|uint8_t)\s+[a-zA-Z0-9]+\s*\[\]\s*(PROGMEM\s*)?=\s*/g, '');
  input = input.replace(/\};|\{/g, '');
  input = input.replace(/\r\n|\r|\n/g, ',');
  input = input.replace(/,{2,}/g, ',');
  input = input.replace(/\s/g, '');
  input = input.replace(/\/\/(.+?),/g, '');
  input = input.replace(/0[xX]/g, '');
  const list = input.split(',');

  if (drawMode === 'horizontal') {
    listToImageHorizontal(list, canvas);
  } else {
    listToImageVertical(list, canvas);
  }
};

window.allSameSize = function (): void {
  if (images.length() > 1) {
    const inputs = document.querySelectorAll('#image-size-settings input') as NodeListOf<HTMLInputElement>;
    for (let i = 2; i < inputs.length; i++) {
      if (inputs[i].name === 'width') {
        inputs[i].value = inputs[0].value;
        inputs[i].oninput?.(new Event('input'));
      }
      if (inputs[i].name === 'height') {
        inputs[i].value = inputs[1].value;
        inputs[i].oninput?.(new Event('input'));
      }
    }
  }
};

function handleImageSelection(evt: Event): void {
  const target = evt.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  files.sort((a, b) => (a.name > b.name ? 1 : -1));
  
  const onlyImagesFileError = document.getElementById('only-images-file-error');
  if (onlyImagesFileError) {
    onlyImagesFileError.style.display = 'none';
  }

  const noFileSelected = document.querySelectorAll('.no-file-selected') as NodeListOf<HTMLElement>;
  if (files.length > 0) {
    noFileSelected.forEach((el) => {
      el.style.display = 'none';
    });
  } else {
    noFileSelected.forEach((el) => {
      el.style.display = 'block';
    });
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.match('image.*')) {
      if (onlyImagesFileError) {
        onlyImagesFileError.style.display = 'block';
      }
      continue;
    }

    const reader = new FileReader();

    reader.onload = (fileEvent: ProgressEvent<FileReader>) => {
      const img = new Image();

      img.onload = () => {
        const fileInputColumnEntry = document.createElement('div');
        fileInputColumnEntry.className = 'file-input-entry';

        const fileInputColumnEntryLabel = document.createElement('span');
        fileInputColumnEntryLabel.textContent = file.name;

        const fileInputColumnEntryRemoveButton = document.createElement('button');
        fileInputColumnEntryRemoveButton.className = 'remove-button';
        fileInputColumnEntryRemoveButton.innerHTML = 'remove';

        const canvas = document.createElement('canvas');

        const imageEntry = document.createElement('li');
        imageEntry.setAttribute('data-img', file.name);

        const w = document.createElement('input');
        w.type = 'number';
        w.name = 'width';
        w.id = 'screenWidth';
        w.min = '0';
        w.className = 'size-input';
        w.value = img.width.toString();
        settings.screenWidth = img.width;
        w.oninput = () => {
          canvas.width = parseInt(w.value);
          updateAllImages();
          updateInteger('screenWidth');
        };

        const h = document.createElement('input');
        h.type = 'number';
        h.name = 'height';
        h.id = 'screenHeight';
        h.min = '0';
        h.className = 'size-input';
        h.value = img.height.toString();
        settings.screenHeight = img.height;
        h.oninput = () => {
          canvas.height = parseInt(h.value);
          updateAllImages();
          updateInteger('screenHeight');
        };

        const gil = document.createElement('span');
        gil.innerHTML = 'glyph';
        gil.className = 'file-info';

        const gi = document.createElement('input');
        gi.type = 'text';
        gi.name = 'glyph';
        gi.className = 'glyph-input';
        gi.onchange = () => {
          const image = images.get(img) as ImageObject;
          image.glyph = gi.value;
        };

        const fn = document.createElement('span');
        fn.className = 'file-info';
        fn.innerHTML = `${file.name} (file resolution: ${img.width} x ${img.height})<br />`;

        const rb = document.createElement('button');
        rb.className = 'remove-button';
        rb.innerHTML = 'remove';

        const fileInputColumn = document.getElementById('file-input-column');
        const imageSizeSettings = document.getElementById('image-size-settings');
        const canvasContainer = document.getElementById('images-canvas-container');

        const removeButtonOnClick = () => {
          const image = images.get(img) as ImageObject;
          canvasContainer?.removeChild(image.canvas);
          images.remove(image);
          imageSizeSettings?.removeChild(imageEntry);
          fileInputColumn?.removeChild(fileInputColumnEntry);
          
          const allSameBtn = document.getElementById('all-same-size');
          if (imageSizeSettings && imageSizeSettings.children.length <= 1 && allSameBtn) {
            allSameBtn.style.display = 'none';
          }
          if (images.length() === 0) {
            noFileSelected.forEach((el) => {
              el.style.display = 'block';
            });
          }
          updateAllImages();
        };

        rb.onclick = removeButtonOnClick;
        fileInputColumnEntryRemoveButton.onclick = removeButtonOnClick;

        fileInputColumnEntry.appendChild(fileInputColumnEntryLabel);
        fileInputColumnEntry.appendChild(fileInputColumnEntryRemoveButton);
        fileInputColumn?.appendChild(fileInputColumnEntry);

        imageEntry.appendChild(fn);
        imageEntry.appendChild(w);
        imageEntry.appendChild(document.createTextNode(' x '));
        imageEntry.appendChild(h);
        imageEntry.appendChild(gil);
        imageEntry.appendChild(gi);
        imageEntry.appendChild(rb);

        imageSizeSettings?.appendChild(imageEntry);

        canvas.width = img.width;
        canvas.height = img.height;
        canvasContainer?.appendChild(canvas);

        images.push(img, canvas, file.name.split('.')[0]);
        const allSameBtn = document.getElementById('all-same-size');
        if (images.length() > 1 && allSameBtn) {
          allSameBtn.style.display = 'block';
        }
        placeImage(images.last());
      };
      if (fileEvent.target?.result) {
        img.src = fileEvent.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  }
}

function imageToString(image: ImageObject): string {
  const { ctx, canvas } = image;
  if (!ctx) return '';
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  return settings.conversionFunction ? settings.conversionFunction(data, canvas.width) : '';
}

function getIdentifier(): string {
  const vn = document.getElementById('identifier') as HTMLInputElement;
  return vn && vn.value.length ? vn.value : identifier;
}

window.generateOutputString = function (): void {
  let outputString = '';
  let code = '';

  switch (settings.outputFormat) {
    case 'arduino': {
      const varQuickArray: string[] = [];
      let bytesUsed = 0;
      
      images.each((image) => {
        code = imageToString(image);
        code = code.replace(/,\s*$/, '');
        code = `\t${code.split('\n').join('\n\t')}\n`;
        const comment = `// '${image.glyph}', ${image.canvas.width}x${image.canvas.height}px\n`;
        bytesUsed += code.split('\n').length * 16;

        const varname = getIdentifier() + (image.glyph || '').replace(/[^a-zA-Z0-9]/g, '_');
        varQuickArray.push(varname);
        code = `${comment}const ${getImageType()} ${varname} [] PROGMEM = {\n${code}};\n`;
        outputString += code;
      });

      varQuickArray.sort();
      outputString += `\n// Array of all bitmaps for convenience. (Total bytes used to store images in PROGMEM = ${bytesUsed})\n`;
      outputString += `const int ${getIdentifier()}allArray_LEN = ${varQuickArray.length};\n`;
      outputString += `const ${getImageType()}* ${getIdentifier()}allArray[${varQuickArray.length}] = {\n\t${varQuickArray.join(',\n\t')}\n};\n`;
      break;
    }

    case 'arduino_single': {
      let comment = '';
      images.each((image) => {
        code = imageToString(image);
        code = `\t${code.split('\n').join('\n\t')}\n`;
        comment = `\t// '${image.glyph}, ${image.canvas.width}x${image.canvas.height}px\n`;
        outputString += comment + code;
      });

      outputString = outputString.replace(/,\s*$/, '');
      outputString = `const ${getImageType()} ${getIdentifier()} [] PROGMEM = {\n${outputString}\n};`;
      break;
    }

    case 'adafruit_gfx': {
      let comment = '';
      let useGlyphs = 0;
      images.each((image) => {
        code = imageToString(image);
        code = `\t${code.split('\n').join('\n\t')}\n`;
        comment = `\t// '${image.glyph}', ${image.canvas.width}x${image.canvas.height}px\n`;
        outputString += comment + code;
        if (image.glyph && image.glyph.length === 1) {
          useGlyphs++;
        }
      });

      outputString = outputString.replace(/,\s*$/, '');
      outputString = `const unsigned char ${getIdentifier()}Bitmap [] PROGMEM = {\n${outputString}\n};\n\n`;
      outputString += `const GFXbitmapGlyph ${getIdentifier()}Glyphs [] PROGMEM = {\n`;

      const firstAsciiCharInput = document.getElementById('first-ascii-char') as HTMLInputElement;
      let firstAsciiChar = parseInt(firstAsciiCharInput.value);
      const xAdvanceInput = document.getElementById('x-advance') as HTMLInputElement;
      const xAdvance = parseInt(xAdvanceInput.value);
      let offset = 0;
      code = '';

      images.each((image) => {
        const glyphChar = images.length() === useGlyphs ? image.glyph : String.fromCharCode(firstAsciiChar++);
        code += `\t{ ${offset}, ${image.canvas.width}, ${image.canvas.height}, ${xAdvance}, '${glyphChar}' }`;
        if (image !== images.last()) {
          code += ',';
        }
        code += `// '${image.glyph}'\n`;
        offset += image.canvas.width;
      });
      code += '};\n';
      outputString += code;

      outputString += `\nconst GFXbitmapFont ${getIdentifier()}Font PROGMEM = {\n`;
      outputString += `\t(uint8_t *)${getIdentifier()}Bitmap,\n`;
      outputString += `\t(GFXbitmapGlyph *)${getIdentifier()}Glyphs,\n`;
      outputString += `\t${images.length()}\n};\n`;
      break;
    }
    
    default: {
      images.each((image) => {
        code = imageToString(image);
        let comment = '';
        if (image.glyph) {
          comment = `// '${image.glyph}', ${image.canvas.width}x${image.canvas.height}px\n`;
        }
        if (image.img !== images.first().img) {
          comment = `\n${comment}`;
        }
        code = comment + code;
        outputString += code;
      });
      outputString = outputString.replace(/,\s*$/g, '');
    }
  }

  const codeOutput = document.getElementById('code-output') as HTMLTextAreaElement;
  if (codeOutput) {
    codeOutput.value = outputString;
  }
  const copyButton = document.getElementById('copy-button') as HTMLButtonElement;
  if (copyButton) {
    copyButton.disabled = false;
  }
};

window.copyOutput = function (): void {
  const codeOutput = document.getElementById('code-output') as HTMLTextAreaElement;
  if (codeOutput) {
    navigator.clipboard.writeText(codeOutput.value);
  }
};

window.downloadBinFile = function (): void {
  let raw: number[] = [];
  images.each((image) => {
    const data = imageToString(image)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((byte) => parseInt(byte, 16));
    raw = raw.concat(data);
  });
  const data = new Uint8Array(raw);
  const a = document.createElement('a');
  a.style.display = 'none';
  document.body.appendChild(a);
  const blob = new Blob([data], { type: 'octet/stream' });
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = `${getIdentifier()}.bin`;
  a.click();
  window.URL.revokeObjectURL(url);
};

window.updateDrawMode = function (elm: HTMLSelectElement): void {
  const conversionFunction = (ConversionFunctions as unknown as Record<string, ConversionFunction>)[elm.value];
  if (conversionFunction) {
    settings.conversionFunction = conversionFunction;
  }
  updateAllImages();
};

window.updateOutputFormat = function (elm: HTMLSelectElement): void {
  let caption = document.getElementById('format-caption-container');
  const adafruitGfx = document.getElementById('adafruit-gfx-settings');
  const arduino = document.getElementById('arduino-identifier');
  const removeZeroesCommasContainer = document.getElementById('remove-zeroes-commas-container');
  const codeOutput = document.getElementById('code-output') as HTMLTextAreaElement;
  if (codeOutput) {
    codeOutput.value = '';
  }

  if (caption) {
    for (let i = 0; i < caption.children.length; i++) {
      (caption.children[i] as HTMLElement).style.display = 'none';
    }
    const specificCaption = document.querySelector(`div[data-caption='${elm.value}']`) as HTMLElement;
    if (specificCaption) specificCaption.style.display = 'block';
  }

  if (elm.value !== 'plain') {
    if (arduino) arduino.style.display = 'block';
    if (removeZeroesCommasContainer) removeZeroesCommasContainer.style.display = 'none';
    settings.removeZeroesCommas = false;
    const removeCheckbox = document.getElementById('removeZeroesCommas') as HTMLInputElement;
    if (removeCheckbox) removeCheckbox.checked = false;
  } else {
    if (arduino) arduino.style.display = 'none';
    if (removeZeroesCommasContainer) removeZeroesCommasContainer.style.display = 'table-row';
  }
  
  if (elm.value === 'adafruit_gfx') {
    if (adafruitGfx) adafruitGfx.style.display = 'block';
  } else {
    if (adafruitGfx) adafruitGfx.style.display = 'none';
  }

  settings.outputFormat = elm.value;
};

window.updateRadio = function (fieldName: string): void {
  const radioGroup = document.getElementsByName(fieldName) as NodeListOf<HTMLInputElement>;
  for (let i = 0; i < radioGroup.length; i++) {
    if (radioGroup[i].checked) {
      (settings as unknown as Record<string, unknown>)[fieldName] = radioGroup[i].value;
    }
  }
  updateAllImages();
};

window.updateInteger = (fieldName: string) => updateInteger(fieldName as keyof Settings);
window.updateBoolean = (fieldName: string) => updateBoolean(fieldName as keyof Settings);

window.onload = () => {
  const copyButton = document.getElementById('copy-button') as HTMLButtonElement;
  if (copyButton) {
    copyButton.disabled = true;
  }

  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  fileInput.addEventListener('click', function() { this.value = ''; }, false);
  fileInput.addEventListener('change', handleImageSelection, false);
  
  const outputFormat = document.getElementById('outputFormat') as HTMLSelectElement;
  if (outputFormat) {
    outputFormat.value = 'arduino';
    outputFormat.onchange?.(new Event('change'));
  }
};
