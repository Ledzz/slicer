// goo-file-generator.ts
// Browser-compatible version using ArrayBuffer and DataView instead of Node.js Buffer

class GooFileGenerator {
  // Use ArrayBuffer and DataView for browser compatibility
  private buffer: ArrayBuffer;
  private dataView: DataView;
  private position: number = 0;
  private encoder: TextEncoder = new TextEncoder();

  constructor(
    private outputPath: string,
    private totalSize: number = 1024 * 1024,
  ) {
    // Initialize buffer with estimated size
    this.buffer = new ArrayBuffer(this.totalSize);
    this.dataView = new DataView(this.buffer);
  }

  /**
   * Write header information to the buffer
   */
  public writeHeader(options: {
    version: string; // 4 bytes
    softwareInfo: string; // 32 bytes
    softwareVersion: string; // 24 bytes
    fileTime: string; // 24 bytes
    printerName: string; // 32 bytes
    printerType: string; // 32 bytes
    profileName: string; // 32 bytes
    antiAliasingLevel: number; // 2 bytes
    greyLevel: number; // 2 bytes
    blurLevel: number; // 2 bytes
    xResolution: number; // 2 bytes
    yResolution: number; // 2 bytes
    xMirror: boolean; // 1 byte
    yMirror: boolean; // 1 byte
    xSizePlatform: number; // 4 bytes (float)
    ySizePlatform: number; // 4 bytes (float)
    zSizePlatform: number; // 4 bytes (float)
    layerThickness: number; // 4 bytes (float)
    exposureTime: number; // 4 bytes (float)
    exposureDelayMode: boolean; // 1 byte
    turnOffTime: number; // 4 bytes (float)
    bottomBeforeLiftTime: number; // 4 bytes (float)
    bottomAfterLiftTime: number; // 4 bytes (float)
    bottomAfterRetractTime: number; // 4 bytes (float)
    beforeLiftTime: number; // 4 bytes (float)
    afterLiftTime: number; // 4 bytes (float)
    afterRetractTime: number; // 4 bytes (float)
    bottomExposureTime: number; // 4 bytes (float)
    bottomLayers: number; // 4 bytes (int)
    totalLayers: number; // 4 bytes (int)
    bottomLiftDistance: number; // 4 bytes (float)
    bottomLiftSpeed: number; // 4 bytes (float)
    liftDistance: number; // 4 bytes (float)
    liftSpeed: number; // 4 bytes (float)
    bottomRetractDistance: number; // 4 bytes (float)
    bottomRetractSpeed: number; // 4 bytes (float)
    retractDistance: number; // 4 bytes (float)
    retractSpeed: number; // 4 bytes (float)
    bottomSecondLiftDistance: number; // 4 bytes (float)
    bottomSecondLiftSpeed: number; // 4 bytes (float)
    secondLiftDistance: number; // 4 bytes (float)
    secondLiftSpeed: number; // 4 bytes (float)
    bottomSecondRetractDistance: number; // 4 bytes (float)
    bottomSecondRetractSpeed: number; // 4 bytes (float)
    secondRetractDistance: number; // 4 bytes (float)
    secondRetractSpeed: number; // 4 bytes (float)
    bottomLightPWM: number; // 2 bytes (short int)
    lightPWM: number; // 2 bytes (short int)
    advanceMode: boolean; // 1 byte
    printingTime: number; // 4 bytes (int)
    totalVolume: number; // 4 bytes (float)
    totalWeight: number; // 4 bytes (float)
    totalPrice: number; // 4 bytes (float)
    priceUnit: string; // 8 bytes
    grayScaleLevel: boolean; // 1 byte
    transitionLayers: number; // 2 bytes (short int)
    smallPreviewData?: Uint16Array; // 2*116*116 bytes (RGB_565)
    bigPreviewData?: Uint16Array; // 2*290*290 bytes (RGB_565)
  }): void {
    // 1. Version - 4 bytes
    this.writeString(options.version, 4);

    // 2. Magic Tag - 8 bytes
    const magicTag = new Uint8Array([
      0x07, 0x00, 0x00, 0x00, 0x44, 0x4c, 0x50, 0x00,
    ]);
    this.writeUint8Array(magicTag);

    // 3. Software info - 32 bytes
    this.writeString(options.softwareInfo, 32);

    // 4. Software version - 24 bytes
    this.writeString(options.softwareVersion, 24);

    // 5. File time - 24 bytes
    this.writeString(options.fileTime, 24);

    // 6. Printer name - 32 bytes
    this.writeString(options.printerName, 32);

    // 7. Printer type - 32 bytes
    this.writeString(options.printerType, 32);

    // 8. Profile name - 32 bytes
    this.writeString(options.profileName, 32);

    // 9. Anti-aliasing level - 2 bytes
    this.writeInt16(options.antiAliasingLevel);

    // 10. Grey level - 2 bytes
    this.writeInt16(options.greyLevel);

    // 11. Blur level - 2 bytes
    this.writeInt16(options.blurLevel);

    // 12. Small Preview Image Data - 2*116*116 bytes
    if (options.smallPreviewData) {
      this.writePreviewImage(options.smallPreviewData, 116, 116);
    } else {
      // Write empty preview
      const emptyPreview = new Uint8Array(2 * 116 * 116);
      this.writeUint8Array(emptyPreview);
    }

    // 13. Delimiter - 2 bytes
    this.writeDelimiter();

    // 14. Big preview Image Data - 2*290*290 bytes
    if (options.bigPreviewData) {
      this.writePreviewImage(options.bigPreviewData, 290, 290);
    } else {
      // Write empty preview
      const emptyPreview = new Uint8Array(2 * 290 * 290);
      this.writeUint8Array(emptyPreview);
    }

    // 15. Delimiter - 2 bytes
    this.writeDelimiter();

    // 16. Total layers - 4 bytes
    this.writeInt32(options.totalLayers);

    // 17. X resolution - 2 bytes
    this.writeInt16(options.xResolution);

    // 18. Y resolution - 2 bytes
    this.writeInt16(options.yResolution);

    // 19. X mirror - 1 byte
    this.writeBool(options.xMirror);

    // 20. Y mirror - 1 byte
    this.writeBool(options.yMirror);

    // 21. X size of platform - 4 bytes
    this.writeFloat(options.xSizePlatform);

    // 22. Y size of platform - 4 bytes
    this.writeFloat(options.ySizePlatform);

    // 23. Z size of platform - 4 bytes
    this.writeFloat(options.zSizePlatform);

    // 24. Layer thickness - 4 bytes
    this.writeFloat(options.layerThickness);

    // 25. Common exposure time - 4 bytes
    this.writeFloat(options.exposureTime);

    // 26. Exposure delay mode - 1 byte
    this.writeBool(options.exposureDelayMode);

    // 27. Turn off time - 4 bytes
    this.writeFloat(options.turnOffTime);

    // 28. Bottom before lift time - 4 bytes
    this.writeFloat(options.bottomBeforeLiftTime);

    // 29. Bottom after lift time - 4 bytes
    this.writeFloat(options.bottomAfterLiftTime);

    // 30. Bottom after retract time - 4 bytes
    this.writeFloat(options.bottomAfterRetractTime);

    // 31. Before lift time - 4 bytes
    this.writeFloat(options.beforeLiftTime);

    // 32. After lift time - 4 bytes
    this.writeFloat(options.afterLiftTime);

    // 33. After retract time - 4 bytes
    this.writeFloat(options.afterRetractTime);

    // 34. Bottom exposure time - 4 bytes
    this.writeFloat(options.bottomExposureTime);

    // 35. Bottom layers - 4 bytes
    this.writeInt32(options.bottomLayers);

    // 36. Bottom lift distance - 4 bytes
    this.writeFloat(options.bottomLiftDistance);

    // 37. Bottom lift speed - 4 bytes
    this.writeFloat(options.bottomLiftSpeed);

    // 38. Lift distance - 4 bytes
    this.writeFloat(options.liftDistance);

    // 39. Lift speed - 4 bytes
    this.writeFloat(options.liftSpeed);

    // 40. Bottom retract distance - 4 bytes
    this.writeFloat(options.bottomRetractDistance);

    // 41. Bottom retract speed - 4 bytes
    this.writeFloat(options.bottomRetractSpeed);

    // 42. Retract distance - 4 bytes
    this.writeFloat(options.retractDistance);

    // 43. Retract speed - 4 bytes
    this.writeFloat(options.retractSpeed);

    // 44. Bottom second lift distance - 4 bytes
    this.writeFloat(options.bottomSecondLiftDistance);

    // 45. Bottom second lift speed - 4 bytes
    this.writeFloat(options.bottomSecondLiftSpeed);

    // 46. Second lift distance - 4 bytes
    this.writeFloat(options.secondLiftDistance);

    // 47. Second lift speed - 4 bytes
    this.writeFloat(options.secondLiftSpeed);

    // 48. Bottom second retract distance - 4 bytes
    this.writeFloat(options.bottomSecondRetractDistance);

    // 49. Bottom second retract speed - 4 bytes
    this.writeFloat(options.bottomSecondRetractSpeed);

    // 50. Second retract distance - 4 bytes
    this.writeFloat(options.secondRetractDistance);

    // 51. Second retract speed - 4 bytes
    this.writeFloat(options.secondRetractSpeed);

    // 52. Bottom light PWM - 2 bytes
    this.writeInt16(options.bottomLightPWM);

    // 53. Light PWM - 2 bytes
    this.writeInt16(options.lightPWM);

    // 54. Advance mode - 1 byte
    this.writeBool(options.advanceMode);

    // 55. Printing time - 4 bytes
    this.writeInt32(options.printingTime);

    // 56. Total volume - 4 bytes
    this.writeFloat(options.totalVolume);

    // 57. Total weight - 4 bytes
    this.writeFloat(options.totalWeight);

    // 58. Total price - 4 bytes
    this.writeFloat(options.totalPrice);

    // 59. Price unit - 8 bytes
    this.writeString(options.priceUnit, 8);

    // 60. Offset of LayerContent - 4 bytes
    // We'll update this later when we know the exact position
    const layerContentOffsetPos = this.position;
    this.writeInt32(0); // Placeholder

    // 61. Gray scale level - 1 byte
    this.writeBool(options.grayScaleLevel);

    // 62. Transition layers - 2 bytes
    this.writeInt16(options.transitionLayers);

    // Return to update the layer content offset
    const layerContentOffset = this.position;
    const currentPos = this.position;
    this.position = layerContentOffsetPos;
    this.writeInt32(layerContentOffset);
    this.position = currentPos;
  }

  /**
   * Write layer definition to the buffer
   */
  public writeLayerDefinition(layer: {
    pauseFlag: number; // 2 bytes
    pausePositionZ: number; // 4 bytes (float)
    layerPositionZ: number; // 4 bytes (float)
    layerExposureTime: number; // 4 bytes (float)
    layerOffTime: number; // 4 bytes (float)
    beforeLiftTime: number; // 4 bytes (float)
    afterLiftTime: number; // 4 bytes (float)
    afterRetractTime: number; // 4 bytes (float)
    liftDistance: number; // 4 bytes (float)
    liftSpeed: number; // 4 bytes (float)
    secondLiftDistance: number; // 4 bytes (float)
    secondLiftSpeed: number; // 4 bytes (float)
    retractDistance: number; // 4 bytes (float)
    retractSpeed: number; // 4 bytes (float)
    secondRetractDistance: number; // 4 bytes (float)
    secondRetractSpeed: number; // 4 bytes (float)
    lightPWM: number; // 2 bytes (short int)
  }): void {
    // 1. Pause flag - 2 bytes
    this.writeInt16(layer.pauseFlag);

    // 2. Pause position Z - 4 bytes
    this.writeFloat(layer.pausePositionZ);

    // 3. Layer position Z - 4 bytes
    this.writeFloat(layer.layerPositionZ);

    // 4. Layer exposure time - 4 bytes
    this.writeFloat(layer.layerExposureTime);

    // 5. Layer off time - 4 bytes
    this.writeFloat(layer.layerOffTime);

    // 6. Before lift time - 4 bytes
    this.writeFloat(layer.beforeLiftTime);

    // 7. After lift time - 4 bytes
    this.writeFloat(layer.afterLiftTime);

    // 8. After retract time - 4 bytes
    this.writeFloat(layer.afterRetractTime);

    // 9. Lift distance - 4 bytes
    this.writeFloat(layer.liftDistance);

    // 10. Lift speed - 4 bytes
    this.writeFloat(layer.liftSpeed);

    // 11. Second lift distance - 4 bytes
    this.writeFloat(layer.secondLiftDistance);

    // 12. Second lift speed - 4 bytes
    this.writeFloat(layer.secondLiftSpeed);

    // 13. Retract distance - 4 bytes
    this.writeFloat(layer.retractDistance);

    // 14. Retract speed - 4 bytes
    this.writeFloat(layer.retractSpeed);

    // 15. Second retract distance - 4 bytes
    this.writeFloat(layer.secondRetractDistance);

    // 16. Second retract speed - 4 bytes
    this.writeFloat(layer.secondRetractSpeed);

    // 17. Light PWM - 2 bytes
    this.writeInt16(layer.lightPWM);

    // 18. Delimiter - 2 bytes
    this.writeDelimiter();
  }

  /**
   * Write image data with RLE encoding
   */
  public writeLayerImageData(
    imageData: Uint8Array,
    width: number,
    height: number,
  ): void {
    // Encode the image data using RLE
    const encodedData = this.encodeRLE(imageData);

    // Write data size - 4 bytes
    this.writeInt32(encodedData.length);

    // Write the encoded image data
    this.writeUint8Array(encodedData);

    // Write delimiter - 2 bytes
    this.writeDelimiter();
  }

  /**
   * Write ending string
   */
  public writeEndingString(): void {
    // The ending string as specified
    const endString = new Uint8Array([
      0x0d, 0x0d, 0x0d, 0x0d, 0xd0, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x0d, 0x44, 0x4c, 0x50, 0x00,
    ]);
    this.writeUint8Array(endString);
  }

  /**
   * Save the file to disk (browser implementation using download)
   */
  public saveFile(): Blob {
    // Create a new buffer with the exact length of data written
    const finalBuffer = this.buffer.slice(0, this.position);

    // Create a Blob from the buffer
    const blob = new Blob([finalBuffer], { type: "application/octet-stream" });

    // For browsers: create a download link
    if (typeof window !== "undefined") {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = this.outputPath;
      a.click();
      URL.revokeObjectURL(url);
    }

    return blob;
  }

  /**
   * Encode image data using RLE scheme as per specification
   */
  private encodeRLE(imageData: Uint8Array): Uint8Array {
    const result: number[] = [];

    // Start with the magic number 0x55
    result.push(0x55);

    let i = 0;
    let prevPixel = 0;

    while (i < imageData.length) {
      const pixel = imageData[i];

      // Count run of same values
      let count = 1;
      while (i + count < imageData.length && imageData[i + count] === pixel) {
        count++;
      }

      if (pixel === 0) {
        // Case: all 0x0 pixels
        this.encodeRunLength(result, 0b00000000, count);
      } else if (pixel === 255) {
        // Case: all 0xff pixels
        this.encodeRunLength(result, 0b11000000, count);
      } else if (i > 0) {
        // Case: differential encoding
        const diff = pixel - prevPixel;
        if (diff > 0 && diff <= 15) {
          // Positive diff
          if (count === 1) {
            result.push(0b10000000 | diff);
          } else {
            result.push(0b10010000 | diff);
            result.push(count);
          }
        } else if (diff < 0 && diff >= -15) {
          // Negative diff
          const absDiff = Math.abs(diff);
          if (count === 1) {
            result.push(0b10100000 | absDiff);
          } else {
            result.push(0b10110000 | absDiff);
            result.push(count);
          }
        } else {
          // Regular gray value
          this.encodeRunLength(result, 0b01000000, count, pixel);
        }
      } else {
        // Case: gray value (first pixel)
        this.encodeRunLength(result, 0b01000000, count, pixel);
      }

      prevPixel = pixel;
      i += count;
    }

    // Calculate checksum (8-bit sum of all bytes except the magic number)
    let checksum = 0;
    for (let i = 1; i < result.length; i++) {
      checksum = (checksum + result[i]) & 0xff;
    }
    result.push(checksum);

    return new Uint8Array(result);
  }

  /**
   * Encode run length for RLE
   */
  private encodeRunLength(
    result: number[],
    prefix: number,
    count: number,
    value?: number,
  ): void {
    if (count <= 15) {
      // 4-bit run-length
      result.push(prefix | count);
    } else if (count <= 0xfff) {
      // 12-bit run-length
      result.push(prefix | 0x10 | (count & 0x0f));
      result.push((count >> 4) & 0xff);
    } else if (count <= 0xfffff) {
      // 20-bit run-length
      result.push(prefix | 0x20 | (count & 0x0f));
      result.push((count >> 4) & 0xff);
      result.push((count >> 12) & 0xff);
    } else {
      // 28-bit run-length
      result.push(prefix | 0x30 | (count & 0x0f));
      result.push((count >> 4) & 0xff);
      result.push((count >> 12) & 0xff);
      result.push((count >> 20) & 0xff);
    }

    // For gray value mode, add the pixel value
    if ((prefix & 0xc0) === 0x40 && value !== undefined) {
      result.push(value);
    }
  }

  // Helper methods for writing different data types

  private writeString(str: string, length: number): void {
    const encoded = this.encoder.encode(str);
    const paddedArray = new Uint8Array(length);

    // Copy the string data (up to the length)
    const bytesToCopy = Math.min(encoded.length, length);
    for (let i = 0; i < bytesToCopy; i++) {
      paddedArray[i] = encoded[i];
    }

    // Write the padded array
    this.writeUint8Array(paddedArray);
  }

  private writeUint8Array(array: Uint8Array): void {
    for (let i = 0; i < array.length; i++) {
      this.dataView.setUint8(this.position + i, array[i]);
    }
    this.position += array.length;
  }

  private writeInt16(value: number): void {
    this.dataView.setInt16(this.position, value, true); // true = little endian
    this.position += 2;
  }

  private writeInt32(value: number): void {
    this.dataView.setInt32(this.position, value, true); // true = little endian
    this.position += 4;
  }

  private writeFloat(value: number): void {
    this.dataView.setFloat32(this.position, value, true); // true = little endian
    this.position += 4;
  }

  private writeBool(value: boolean): void {
    this.dataView.setUint8(this.position, value ? 1 : 0);
    this.position += 1;
  }

  private writeDelimiter(): void {
    this.dataView.setUint8(this.position, 0x0d);
    this.position += 1;
    this.dataView.setUint8(this.position, 0x0a);
    this.position += 1;
  }

  private writePreviewImage(
    data: Uint16Array,
    width: number,
    height: number,
  ): void {
    for (let i = 0; i < data.length; i++) {
      this.dataView.setUint16(this.position, data[i], true); // true = little endian
      this.position += 2;
    }
  }
}

// Example usage in a browser context
function generateSampleGooFile(filename: string): Blob {
  const generator = new GooFileGenerator(filename);

  // Write header
  generator.writeHeader({
    version: "1.0",
    softwareInfo: "GooFileGenerator",
    softwareVersion: "1.0.0",
    fileTime: new Date().toISOString(),
    printerName: "Sample Printer",
    printerType: "LCD",
    profileName: "Standard Resin",
    antiAliasingLevel: 4,
    greyLevel: 8,
    blurLevel: 0,
    xResolution: 1440,
    yResolution: 2560,
    xMirror: false,
    yMirror: false,
    xSizePlatform: 68.04,
    ySizePlatform: 120.96,
    zSizePlatform: 150.0,
    layerThickness: 0.05,
    exposureTime: 8.0,
    exposureDelayMode: true,
    turnOffTime: 1.0,
    bottomBeforeLiftTime: 0.0,
    bottomAfterLiftTime: 0.0,
    bottomAfterRetractTime: 0.0,
    beforeLiftTime: 0.0,
    afterLiftTime: 0.0,
    afterRetractTime: 0.0,
    bottomExposureTime: 60.0,
    bottomLayers: 6,
    totalLayers: 100,
    bottomLiftDistance: 5.0,
    bottomLiftSpeed: 90.0,
    liftDistance: 5.0,
    liftSpeed: 100.0,
    bottomRetractDistance: 5.0,
    bottomRetractSpeed: 100.0,
    retractDistance: 5.0,
    retractSpeed: 100.0,
    bottomSecondLiftDistance: 0.0,
    bottomSecondLiftSpeed: 0.0,
    secondLiftDistance: 0.0,
    secondLiftSpeed: 0.0,
    bottomSecondRetractDistance: 0.0,
    bottomSecondRetractSpeed: 0.0,
    secondRetractDistance: 0.0,
    secondRetractSpeed: 0.0,
    bottomLightPWM: 255,
    lightPWM: 255,
    advanceMode: false,
    printingTime: 5400, // 1.5 hours in seconds
    totalVolume: 10.5, // cm³
    totalWeight: 11.55, // g
    totalPrice: 1.16, // price units
    priceUnit: "USD",
    grayScaleLevel: true,
    transitionLayers: 0,
  });

  // Create 3 sample layers
  for (let i = 0; i < 3; i++) {
    // Write layer definition
    generator.writeLayerDefinition({
      pauseFlag: 0,
      pausePositionZ: 0.0,
      layerPositionZ: i * 0.05,
      layerExposureTime: i < 6 ? 60.0 : 8.0,
      layerOffTime: 1.0,
      beforeLiftTime: 0.0,
      afterLiftTime: 0.0,
      afterRetractTime: 0.0,
      liftDistance: 5.0,
      liftSpeed: 100.0,
      secondLiftDistance: 0.0,
      secondLiftSpeed: 0.0,
      retractDistance: 5.0,
      retractSpeed: 100.0,
      secondRetractDistance: 0.0,
      secondRetractSpeed: 0.0,
      lightPWM: 255,
    });

    // Create a simple 100x100 image (all white)
    const sampleImage = new Uint8Array(100 * 100);

    // Create a simple pattern - a circle
    const radius = 40;
    const centerX = 50;
    const centerY = 50;

    for (let y = 0; y < 100; y++) {
      for (let x = 0; x < 100; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distance <= radius) {
          sampleImage[y * 100 + x] = 255; // White inside circle
        } else {
          sampleImage[y * 100 + x] = 0; // Black outside circle
        }
      }
    }

    // Write the image data
    generator.writeLayerImageData(sampleImage, 100, 100);
  }

  // Write ending string
  generator.writeEndingString();

  // Return the file as a Blob
  return generator.saveFile();
}
//
// // Example of how to use this in a browser context
// function setupGooFileGeneration() {
//   if (typeof document !== 'undefined') {
//     const generateButton = document.getElementById('generateGooButton');
//     if (generateButton) {
//       generateButton.addEventListener('click', () => {
//         generateSampleGooFile('sample.goo');
//       });
//     }
//   }
// }
//
// // Initialize the button handler when DOM is loaded
// if (typeof window !== 'undefined') {
//   window.addEventListener('DOMContentLoaded', setupGooFileGeneration);
// }
//
