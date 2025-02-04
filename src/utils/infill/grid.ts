import { Box3, Line3, Plane, Vector3 } from "three";
import { debugPlane, debugPoint } from "../helper";
import { slice } from "../slicer.ts";

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
  const lines: [Vector3, Vector3][] = [];
  const rotatedBounds = new Box3(
    new Vector3(bounds.min.x, bounds.max.y, bounds.min.z),
    new Vector3(bounds.max.x, bounds.min.y, bounds.max.z),
  );

  // gridPass({
  //   lineDirection: new Vector3(1, 1, 0).normalize(),
  //   contours,
  //   bounds,
  //   lines,
  //   layer,
  // });
  gridPass({
    lineDirection: new Vector3(1, -1, 0).normalize(),
    contours,
    bounds: rotatedBounds,
    lines,
    layer,
  });

  debugPoint(rotatedBounds.min);
  debugPoint(rotatedBounds.max);

  return { lines };
}

function gridPass({
  lineDirection,
  contours,
  bounds,
  lines,
  data,
  layer,
}: {
  lineDirection: Vector3;
  contours: Vector3[][];
  bounds: Box3;
  lines: [Vector3, Vector3][];
  data: Awaited<ReturnType<typeof slice>>;
  layer: Awaited<ReturnType<typeof slice>>["layers"][0];
}) {
  const firstPlane = new Plane().setFromNormalAndCoplanarPoint(
    lineDirection,
    new Vector3(),
  );

  const distanceBetween = 5;

  let i = 0;

  const planes: Plane[] = [firstPlane];

  while (true) {
    const plane = firstPlane.clone();

    plane.constant -= distanceBetween * i;

    if (plane.distanceToPoint(bounds.max) >= 0) {
      i++;
      planes.push(plane);
      continue;
    }
    break;
  }
  i = 0;
  while (true) {
    const plane = firstPlane.clone();

    plane.constant += distanceBetween * i;

    if (plane.distanceToPoint(bounds.min) <= 0) {
      i++;
      planes.push(plane);
      continue;
    }
    break;
  }

  planes.forEach((plane) => {
    debugPlane(plane);

    const intersections = [];

    for (const polygon of layer.polygons) {
      // Check each edge of the polygon
      for (let i = 0; i < polygon.length; i++) {
        const v1 = polygon[i];
        const v2 = polygon[(i + 1) % polygon.length]; // wrap around to first vertex

        const v31 = new Vector3(v1[0], v1[1], layer.height);
        const v32 = new Vector3(v2[0], v2[1], layer.height);

        const intersection = lineIntersectPlane(plane, [v31, v32]);

        if (intersection) {
          intersections.push(intersection);
        }
      }
    }
    const far = new Vector3(-1000, 1000, 0);

    const sorted = [...intersections].sort(
      (a, b) => a.distanceTo(far) - b.distanceTo(far),
    );

    for (let i = 0; i < sorted.length; i += 2) {
      const p1 = sorted[i];
      const p2 = sorted[i + 1];

      if (!p2) {
        continue;
      }

      lines.push([p1, p2]);
    }
  });
}

function lineIntersectPlane(
  plane: Plane,
  [start, end]: [Vector3, Vector3],
): Vector3 | null {
  return plane.intersectLine(new Line3(start, end), new Vector3());
}
