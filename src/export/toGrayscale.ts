import { SimplePolygon } from "manifold-3d";

export function polygonsToGrayscale(
  polygons: SimplePolygon[],
  originalWidth: number,
  originalHeight: number,
  width: number,
  height: number,
  backgroundColor: number = 0,
  polygonColor: number = 255,
): OffscreenCanvas {
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not get canvas context");
  }

  canvas.width = width;
  canvas.height = height;
  // Fill the canvas with the background color
  context.fillStyle = `rgb(${backgroundColor}, ${backgroundColor}, ${backgroundColor})`;
  context.fillRect(0, 0, width, height);
  context.fillStyle = `rgb(${polygonColor}, ${polygonColor}, ${polygonColor})`;

  for (const i in polygons) {
    const polygon = polygons[i];
    const color = i === "0" ? polygonColor : backgroundColor;
    context.fillStyle = `rgb(${color}, ${color}, ${color})`;

    context.beginPath();
    for (let i = 0; i < polygon.length; i++) {
      const [x, y] = polygon[i];
      const scaledX = Math.floor((x / originalWidth + 0.5) * width);
      const scaledY = Math.floor((y / originalHeight + 0.5) * height);
      if (i === 0) {
        context.moveTo(scaledX, scaledY);
      } else {
        context.lineTo(scaledX, scaledY);
      }
    }
    context.closePath();
    context.fill();
  }
  return canvas;
}
