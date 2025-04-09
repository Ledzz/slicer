// goo-file-generator.ts
// Browser-compatible version using ArrayBuffer and DataView instead of Node.js Buffer

import { X_SIZE, Y_SIZE } from "./constants.ts";
import { api } from "./workerApi.ts";
import { proxy } from "comlink";

class GooFileGenerator {
  // Use array of chunks for flexible size
  private chunks: Uint8Array[] = [];
  private offsets: Map<string, number> = new Map(); // Track special offsets for later updates
  private totalLength: number = 0;
  private encoder: TextEncoder = new TextEncoder();

  constructor(private outputPath: string) {}

  /**
   * Write header information
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
    this.offsets.set("layerContentOffset", this.totalLength);
    this.writeInt32(0); // Placeholder

    // 61. Gray scale level - 1 byte
    this.writeBool(options.grayScaleLevel);

    // 62. Transition layers - 2 bytes
    this.writeInt16(options.transitionLayers);

    // Mark the start of layer content for later offset calculation
    this.offsets.set("layerContentStart", this.totalLength);
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
      0x00, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x44, 0x4c, 0x50, 0x00,
    ]);
    this.writeUint8Array(endString);
  }

  /**
   * Finalizes the file by fixing up any offsets and creating the final buffer
   */
  private finalizeFile(): Uint8Array {
    // Create the final buffer with the exact size
    const finalBuffer = new Uint8Array(this.totalLength);

    // Copy all chunks into the final buffer
    let position = 0;
    for (const chunk of this.chunks) {
      finalBuffer.set(chunk, position);
      position += chunk.length;
    }

    // Fix up the layer content offset
    if (
      this.offsets.has("layerContentOffset") &&
      this.offsets.has("layerContentStart")
    ) {
      const offsetPos = this.offsets.get("layerContentOffset")!;
      const layerContentPos = this.offsets.get("layerContentStart")!;

      // Write the offset at the correct position in big-endian order
      finalBuffer[offsetPos] = (layerContentPos >> 24) & 0xff;
      finalBuffer[offsetPos + 1] = (layerContentPos >> 16) & 0xff;
      finalBuffer[offsetPos + 2] = (layerContentPos >> 8) & 0xff;
      finalBuffer[offsetPos + 3] = layerContentPos & 0xff;
    }

    return finalBuffer;
  }

  /**
   * Save the file to disk (browser implementation using download)
   */
  public saveFile(): Blob {
    // Finalize the file
    const finalBuffer = this.finalizeFile();

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
    let run = 0;

    while (i < imageData.length) {
      const color = imageData[i];

      let count = 1;
      while (i + count < imageData.length && imageData[i + count] === color) {
        count++;
      }
      const runData = this.encodeRun(count, color);
      result.push(...runData);

      prevPixel = color;
      i += count;
      run++;
    }

    // Calculate checksum (8-bit sum of all bytes except the magic number)
    let checksum = 0;
    for (let j = 1; j < result.length; j++) {
      checksum = (checksum + result[j]) & 0xff;
    }
    result.push(255 - checksum);

    if (result.some((v) => v > 0xff)) {
      throw new Error("Encoded data exceeds 8-bit value");
    }

    return new Uint8Array(result);
  }

  private encodeRun(count: number, color: number) {
    // without compression for now
    const run: number[] = [];
    let firstByte = 0;

    if (color === 255) {
      firstByte |= 0b11 << 6;
    } else if (color > 0) {
      firstByte |= 0b01 << 6;
      run.push(color);
    }

    firstByte |= count & 0xf;

    if (count <= 0xf) {
      // noop i guess
    } else if (count <= 0xfff) {
      firstByte |= 0b01 << 4;
      run.push((count >> 4) & 0xff);
    } else if (count <= 0xfffff) {
      firstByte |= 0b10 << 4;
      run.push((count >> 12) & 0xff);
      run.push((count >> 4) & 0xff);
    } else if (count <= 0xfffffff) {
      firstByte |= 0b11 << 4;
      run.push((count >> 20) & 0xff);
      run.push((count >> 12) & 0xff);
      run.push((count >> 4) & 0xff);
    }
    run.unshift(firstByte);
    return run;
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
    this.chunks.push(array);
    this.totalLength += array.length;
  }

  private writeInt16(value: number): void {
    // Create a 2-byte buffer
    const buffer = new Uint8Array(2);

    // Write in big-endian order (most significant byte first)
    buffer[0] = (value >> 8) & 0xff;
    buffer[1] = value & 0xff;

    this.writeUint8Array(buffer);
  }

  private writeInt32(value: number): void {
    // Create a 4-byte buffer
    const buffer = new Uint8Array(4);

    // Write in big-endian order (most significant byte first)
    buffer[0] = (value >> 24) & 0xff;
    buffer[1] = (value >> 16) & 0xff;
    buffer[2] = (value >> 8) & 0xff;
    buffer[3] = value & 0xff;

    this.writeUint8Array(buffer);
  }

  private writeFloat(value: number): void {
    // Create a temporary ArrayBuffer to use DataView for float conversion
    const tempBuffer = new ArrayBuffer(4);
    const view = new DataView(tempBuffer);
    view.setFloat32(0, value, false); // false = big endian

    // Copy to our Uint8Array with explicit order
    const buffer = new Uint8Array(4);
    buffer[0] = view.getUint8(0);
    buffer[1] = view.getUint8(1);
    buffer[2] = view.getUint8(2);
    buffer[3] = view.getUint8(3);

    this.writeUint8Array(buffer);
  }

  private writeBool(value: boolean): void {
    const buffer = new Uint8Array(1);
    buffer[0] = value ? 1 : 0;
    this.writeUint8Array(buffer);
  }

  private writeDelimiter(): void {
    const buffer = new Uint8Array(2);
    buffer[0] = 0x0d;
    buffer[1] = 0x0a;
    this.writeUint8Array(buffer);
  }

  private writePreviewImage(
    data: Uint16Array,
    width: number,
    height: number,
  ): void {
    // Create a buffer for the entire image
    const buffer = new Uint8Array(data.length * 2);

    // Write each 16-bit value in big-endian order
    for (let i = 0; i < data.length; i++) {
      const value = data[i];
      // RGB565 format, big-endian
      buffer[i * 2] = (value >> 8) & 0xff; // High byte first
      buffer[i * 2 + 1] = value & 0xff; // Low byte second
    }

    this.writeUint8Array(buffer);
  }
}
export async function exportGoo(result) {
  const width = 15120;
  const height = 6230;

  const generator = new GooFileGenerator("output.goo");

  const bottomLayers = 5;
  const bottomExposureTime = 30;
  const exposureTime = 2;
  const totalLayers = result.layers.length;

  generator.writeHeader({
    version: "3.0",
    softwareInfo: "Slic3r",
    softwareVersion: "1.0.0",
    fileTime: new Date().toISOString(),
    printerName: "Sample Printer",
    printerType: "Sample Printer",
    profileName: "Standard Resin",
    antiAliasingLevel: 0,
    greyLevel: 6,
    blurLevel: 2,
    xResolution: width,
    yResolution: height,
    xMirror: false,
    yMirror: true,
    xSizePlatform: X_SIZE,
    ySizePlatform: Y_SIZE,
    zSizePlatform: 220,
    layerThickness: 0.05,
    exposureTime,
    exposureDelayMode: true,
    turnOffTime: 0,
    bottomBeforeLiftTime: 0.0,
    bottomAfterLiftTime: 0.0,
    bottomAfterRetractTime: 0.5,
    beforeLiftTime: 0.0,
    afterLiftTime: 0.0,
    afterRetractTime: 0.5,
    bottomExposureTime,
    bottomLayers,
    totalLayers,
    bottomLiftDistance: 0,
    bottomLiftSpeed: 0,
    liftDistance: 0,
    liftSpeed: 0,
    bottomRetractDistance: 0,
    bottomRetractSpeed: 0,
    retractDistance: 0,
    retractSpeed: 0,
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
    transitionLayers: 8,
  });

  console.time("render");

  const imageData = await api.polygonsToGrayscaleWithCanvas(
    width,
    height,
    result.layers.map((l) => l.polygons),
    X_SIZE,
    Y_SIZE,
    proxy((layerIndex: number, total: number, data: Uint8ClampedArray) => {
      console.log(`Progress: ${((layerIndex / total) * 100).toFixed(2)}%`);
      generator.writeLayerDefinition({
        pauseFlag: 0,
        pausePositionZ: 200,
        layerPositionZ: layerIndex * 0.05,
        layerExposureTime:
          layerIndex <= bottomLayers ? bottomExposureTime : exposureTime,
        layerOffTime: 0,
        beforeLiftTime: 0.0,
        afterLiftTime: 0.0,
        afterRetractTime: 0.0,
        liftDistance: 0,
        liftSpeed: 0,
        secondLiftDistance: 0.0,
        secondLiftSpeed: 0.0,
        retractDistance: 0,
        retractSpeed: 0,
        secondRetractDistance: 0.0,
        secondRetractSpeed: 0.0,
        lightPWM: 255,
      });

      const grayscaleData = new Uint8Array(width * height);
      for (let i = 0; i < data.length; i += 4) {
        grayscaleData[i / 4] = data[i];
      }
      generator.writeLayerImageData(grayscaleData, width, height);
    }),
  );
  console.timeEnd("render");

  result.layers.forEach((layer, layerIndex) => {});

  generator.writeEndingString();
  return generator.saveFile();
}
