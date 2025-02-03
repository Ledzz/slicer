import { slice } from "./slicer.ts";
import { Line3, Vector3 } from "three";

export const generateInfill = (data: Awaited<ReturnType<typeof slice>>) => {
  data.map((layer) => ({
    ...layer,
    infill: infill(layer.contours),
  }));
};

function infill(contours: Vector3[][], density = 0.2) {
  const direction = new Vector3(1, 0, 0);
  const lines = [];
  const linesCount = 10;

  for (let i = 0; i < linesCount; i++) {
    const offset = i / linesCount;
    const start = new Vector3(-1, offset, 0);
    const end = new Vector3(1, offset, 0);
    lines.push(new Line3(start, end));
  }
}
