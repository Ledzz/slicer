import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { Box3, Line3, Mesh, Plane, Vector3 } from "three";

const loader = new STLLoader();

export const slice = async () => {
  const file = "/cone.stl";
  const layerHeight = 0.2;

  const layers = [];

  const geometry = await loader.loadAsync(file);
  const obj = new Mesh(geometry);
  const bbox = new Box3().setFromObject(obj);
  const modelHeight = bbox.max.z - bbox.min.z;
  const layerCount = Math.ceil(modelHeight / layerHeight);
  console.log(layerCount);

  for (let i = 0; i < layerCount; i++) {
    const height = bbox.min.z + i * layerHeight;
    const layer = createLayer(height);
    layers.push(layer);
  }

  function createLayer(height: number) {
    const intersectionPlane = new Plane(new Vector3(0, 0, 1), -height);
    const intersectionLines = findIntersections(intersectionPlane);

    const contours = connectSegments(intersectionLines);

    return {
      // height,
      // contours,
      // infill: generateInfill(contours),
      // supports: generateSupports(contours)
    };
  }

  function findIntersections(plane: Plane) {
    const intersections = [];
    const position = geometry.getAttribute("position").array;

    for (let i = 0; i < position.length; i += 9) {
      const p1 = new Vector3(position[i], position[i + 1], position[i + 2]);
      const p2 = new Vector3(position[i + 3], position[i + 4], position[i + 5]);
      const p3 = new Vector3(position[i + 6], position[i + 7], position[i + 8]);

      const line = trianglePlaneIntersection([p1, p2, p3], plane);

      if (!line) {
        continue;
      }

      intersections.push(line);
    }

    return intersections;
  }
};

function trianglePlaneIntersection(
  [p1, p2, p3]: [Vector3, Vector3, Vector3],
  plane: Plane,
) {
  const distances = [p1, p2, p3].map(
    (v) => plane.normal.dot(v) + plane.constant,
  );
  const signs = distances.map((d) => Math.sign(d));

  const intersectionPoints: Vector3[] = [];
  if (signs[0] !== signs[1])
    intersectionPoints.push(linePlaneIntersection(p1, p2, plane));
  if (signs[1] !== signs[2])
    intersectionPoints.push(linePlaneIntersection(p2, p3, plane));
  if (signs[2] !== signs[0])
    intersectionPoints.push(linePlaneIntersection(p3, p1, plane));

  if (intersectionPoints.length === 2) return intersectionPoints;
  // intersectionPoints.push(linePlaneIntersection(p1, p2, plane));
  // intersectionPoints.push(linePlaneIntersection(p2, p3, plane));
  // intersectionPoints.push(linePlaneIntersection(p3, p1, plane));
  // return intersectionPoints;
}

function linePlaneIntersection(p1: Vector3, p2: Vector3, plane: Plane) {
  return plane.intersectLine(new Line3(p1, p2), new Vector3());
}

// Step 2: Connect Line Segments into Continuous Contours
function connectSegments(segments: [Vector3, Vector3][]) {
  let contours = [];

  while (segments.length > 0) {
    let contour = [segments.pop()]; // Start a new contour
    let found = true;

    while (found) {
      found = false;
      for (let i = 0; i < segments.length; i++) {
        let seg = segments[i];
        if (seg[0].distanceTo(contour[contour.length - 1][1]) < 1e-3) {
          contour.push(seg);
          segments.splice(i, 1);
          found = true;
          break;
        } else if (seg[1].distanceTo(contour[0][0]) < 1e-3) {
          contour.unshift(seg);
          segments.splice(i, 1);
          found = true;
          break;
        }
      }
    }
    contours.push(contour);
  }
  return contours;
}
