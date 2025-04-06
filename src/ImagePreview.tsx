import { FC, useEffect, useState } from "react";
import { polygonsToGrayscale } from "./export/toGrayscale.ts";

export const ImagePreview: FC = ({ layer, result }) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const width = 128;
  const height = 128;
  useEffect(() => {
    if (canvas) {
      const w = result.bounds.max.x - result.bounds.min.x;
      const h = result.bounds.max.y - result.bounds.min.y;
      const c1 = polygonsToGrayscale(layer.polygons, w, h, width, height);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }
      ctx.drawImage(c1, 0, 0);
    }
  }, [canvas, layer.polygons, result]);

  return (
    <canvas
      ref={setCanvas}
      width={width}
      height={height}
      style={{ width, height }}
    />
  );
};

export function displayGrayscaleImage(
  imageData: Uint8Array,
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
) {
  canvas.width = width;
  canvas.height = height;

  // Get the canvas context
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Create an ImageData object
  const rgbaImageData = ctx.createImageData(width, height);
  const rgbaData = rgbaImageData.data;

  // Convert grayscale data to RGBA
  for (let i = 0; i < imageData.length; i++) {
    const grayValue = imageData[i];
    // Set RGB channels to the same value (grayscale)
    const dataIndex = i * 4;
    rgbaData[dataIndex] = grayValue; // R
    rgbaData[dataIndex + 1] = grayValue; // G
    rgbaData[dataIndex + 2] = grayValue; // B
    rgbaData[dataIndex + 3] = 255; // A (fully opaque)
  }

  // Put the image data onto the canvas
  ctx.putImageData(rgbaImageData, 0, 0);
}
