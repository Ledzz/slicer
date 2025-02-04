import { Box3, Line3, Plane, Vector3 } from "three";
import { debugPlane } from "../helper";

export function gridInfill({
  contours,
  density = 0.2,
  bounds,
}: {
  contours: Vector3[][];
  density?: number;
  bounds: Box3;
}) {
  const lines: [Vector3, Vector3][] = [];

  gridPass({
    lineDirection: new Vector3(1, 0, 1).normalize(),
    contours,
    bounds,
    lines,
  });
  // gridPass({
  //   lineDirection: new Vector3(-1, 0, 1).normalize(),
  //   contours,
  //   bounds,
  //   lines,
  // });

  return { lines };
}

function gridPass({
  lineDirection,
  contours,
  bounds,
  lines,
}: {
  lineDirection: Vector3;
  contours: Vector3[][];
  bounds: Box3;
  lines: [Vector3, Vector3][];
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

    const intersectionswithContours = contours
      .map((contour) => {
        const intersections = [];

        for (let i = 0; i < contour.length; i++) {
          const p1 = contour[i];
          const p2 = contour[(i + 1) % contour.length];

          const line = new Line3(p1, p2);

          const intersection = new Vector3();

          if (plane.intersectLine(line, intersection)) {
            intersections.push(intersection);
          }
        }

        return intersections;
      })
      .filter((intersections) => intersections.length > 0)
      .flat();

    const far = new Vector3(-1000, 0, 1000);

    const sorted = [...intersectionswithContours].sort(
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
