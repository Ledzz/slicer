import { slice } from "./slicer.ts";
import { Box3, Plane, PlaneHelper, Vector3 } from "three";

export const generateInfill = (data: Awaited<ReturnType<typeof slice>>) => {
  return data.map((layer) => ({
    ...layer,
    infill: infill(layer.contours),
  }));
};

function infill(contours: Vector3[][], density = 0.2) {
  const bounds = new Box3();

  contours.forEach((contour) => {
    contour.forEach((point) => {
      bounds.expandByPoint(point);
    });
  });

  const lineDirection = new Vector3(1, 0, 1).normalize();
  const patternDirection = lineDirection
    .clone()
    .applyAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
    .normalize();
  const lines = [];

  const linesCount = Math.ceil(bounds.getSize(new Vector3()).length() / 5);

  const firstPlane = new Plane().setFromNormalAndCoplanarPoint(
    patternDirection,
    bounds.min,
  );

  const distanceBetween = 10;

  const helper = new PlaneHelper(firstPlane, 1, 0xff0000);
  // group.add(helper);
  //
  // group.add(pointHelper(bounds.min));
  // group.add(pointHelper(bounds.max));

  // console.log(bounds);

  for (let i = 0; i < 7; i++) {
    const plane = firstPlane.clone();

    plane.constant -= distanceBetween * i;

    // console.log(plane.distanceToPoint(bounds.max));

    // const helper = new PlaneHelper(plane, 1, 0xff0000);
    // group.add(helper);
  }

  // for (let i = 0; i < linesCount; i++) {
  //   const t = i / linesCount;
  //   const point = bounds.min.clone().lerp(bounds.max, t);
  //
  //   const plane = new Plane().setFromNormalAndCoplanarPoint(
  //     lineDirection,
  //     point,
  //   );
  //
  //   const helper.ts = new PlaneHelper(plane, 1, 0xff0000);
  //   group.add(helper.ts);
  //   console.log(point);
  //
  //   const intersectionswithContours = contours
  //     .map((contour) => {
  //       const intersections = [];
  //
  //       for (let i = 0; i < contour.length; i++) {
  //         const p1 = contour[i];
  //         const p2 = contour[(i + 1) % contour.length];
  //
  //         const line = new Line3(p1, p2);
  //
  //         const intersection = new Vector3();
  //
  //         if (plane.intersectLine(line, intersection)) {
  //           intersections.push(intersection);
  //         }
  //       }
  //
  //       return intersections;
  //     })
  //     .filter((intersections) => intersections.length > 0);
  //
  //   intersectionswithContours.forEach((intersections) => {
  //     const sorted = [...intersections].sort(
  //       (a, b) => a.distanceTo(bounds.min) - b.distanceTo(bounds.min),
  //     );
  //
  //     sorted.forEach((p1) => {
  //       lines.push([lineDirection, p1]);
  //     });
  //
  //     // for (let i = 0; i < sorted.length; i += 2) {
  //     //   const p1 = sorted[i];
  //     //   const p2 = sorted[i + 1];
  //     //   if (!p2) {
  //     //     return;
  //     //   }
  //     //
  //     //   lines.push([lineDirection, p1, p2.sub(p1).length()]);
  //     // }
  //
  //     // lines.push([intersections[0], lineDirection]);
  //   });

  // lines.push([point, lineDirection]);
  // }

  return { lines };
}
