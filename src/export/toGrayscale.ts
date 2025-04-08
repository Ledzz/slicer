import { SimplePolygon, Vec2 } from "manifold-3d";

// TODO: rewrite to WebGPU
export function polygonsToGrayscale(
  context: CanvasRenderingContext2D,
  polygons: SimplePolygon[],
  originalWidth: number,
  originalHeight: number,
  width: number,
  height: number,
  backgroundColor: number = 0,
  polygonColor: number = 255,
) {
  // Fill the canvas with the background color
  context.fillStyle = `rgb(${backgroundColor}, ${backgroundColor}, ${backgroundColor})`;
  context.fillRect(0, 0, width, height);
  context.fillStyle = `rgb(${polygonColor}, ${polygonColor}, ${polygonColor})`;

  for (const i in polygons) {
    const polygon = polygons[i];
    const color = determineWinding(polygon) ? polygonColor : backgroundColor;
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
}

function determineWinding(polygon: Vec2[]) {
  let signedArea = 0;

  // Need at least 3 points to form a polygon
  if (polygon.length < 3) {
    return "Not a valid polygon";
  }

  // Calculate the signed area using the shoelace formula
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length]; // Wrap to the first point

    signedArea += x1 * y2 - x2 * y1;
  }

  // Divide by 2 to get the actual area
  signedArea /= 2;

  return signedArea > 0;
}
