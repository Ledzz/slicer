import { Box3, Vector3 } from "three";
import { slice } from "../slicer.ts";
import { CrossSection, SimplePolygon, Vec2 } from "manifold-3d";
import { debugLine2 } from "../helper.ts";

export function gridInfill({
  contours,
  density = 0.2,
  bounds,
  data,
  layer,
}: {
  contours: Vector3[][];
  density?: number;
  bounds: Box3;
  data: Awaited<ReturnType<typeof slice>>;
  layer: Awaited<ReturnType<typeof slice>>["layers"][0];
}) {
  const infill = [];

  const line = new InfillLine();
  for (let k = -50; k < 50; k++) {
    line.lines.push(new Line(-100 + k, -100, 100 + k, 100));
    line.lines.push(new Line(100 + k, -100, -100 + k, 100));
  }
  line.trim(layer.crossection);
  infill.push(line);
}

class InfillLine {
  lines: Line[] = [];

  trim(crossection: CrossSection) {
    const polygons = crossection.toPolygons();

    const split = this.lines.flatMap((line) =>
      line.splitByPolygons(polygons).filter((l, i) => i % 2 !== 0),
    );

    split.forEach(debugLine2);
  }
}

function lineIntersectLine(a: Vec2, b: Vec2, c: Vec2, d: Vec2): Vec2 | null {
  const x0 = c[0];
  const y0 = c[1];
  const x1 = d[0];
  const y1 = d[1];

  const x2 = a[0];
  const y2 = a[1];
  const x3 = b[0];
  const y3 = b[1];

  const s1_x = x1 - x0;
  const s1_y = y1 - y0;
  const s2_x = x3 - x2;
  const s2_y = y3 - y2;

  const s =
    (-s1_y * (x0 - x2) + s1_x * (y0 - y2)) / (-s2_x * s1_y + s1_x * s2_y);
  const t =
    (s2_x * (y0 - y2) - s2_y * (x0 - x2)) / (-s2_x * s1_y + s1_x * s2_y);

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    return [x0 + t * s1_x, y0 + t * s1_y];
  }

  return null;
}

function polygonIntersectLine(polygon: SimplePolygon, line: Line): Vec2[] {
  const intersections = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const intersection = lineIntersectLine(a, b, line.start, line.end);
    if (intersection) {
      intersections.push(intersection);
    }
  }
  return removeDuplicateTuples(intersections);
}

class Line {
  start: Vec2;
  end: Vec2;

  constructor(x1: number, y1: number, x2: number, y2: number) {
    this.start = [x1, y1];
    this.end = [x2, y2];
  }

  splitByPolygons(polygons: SimplePolygon[]): Line[] {
    let lines = [this];

    for (const polygon of polygons) {
      const newLines = [];
      for (const line of lines) {
        newLines.push(...line.splitByPolygon(polygon));
      }
      lines = newLines;
    }

    return lines;
  }

  splitByPolygon(polygon: SimplePolygon): Line[] {
    const lines = [];
    const intersections = polygonIntersectLine(polygon, this).sort(
      (a, b) => dist(a, this.start) - dist(b, this.start),
    );

    if (intersections.length === 0) {
      return [this];
    }

    intersections.unshift(this.start);
    intersections.push(this.end);

    for (let i = 0; i < intersections.length - 1; i++) {
      const start = intersections[i];
      const end = intersections[i + 1];
      lines.push(new Line(start[0], start[1], end[0], end[1]));
    }

    return lines;
  }
}

function dist(a: Vec2, b: Vec2) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

function removeDuplicateTuples(tuples: Vec2[]): Vec2[] {
  return tuples.filter(
    (tuple, index, array) =>
      index === array.findIndex((t) => t[0] === tuple[0] && t[1] === tuple[1]),
  );
}
