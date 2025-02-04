import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import {
  Box3,
  BufferGeometry,
  ColorRepresentation,
  Group,
  Line,
  Line3,
  LineBasicMaterial,
  Mesh,
  Plane,
  Vector3,
} from "three";
import { debugPoint } from "./helper.ts";

const loader = new STLLoader();

export const slice = async (file: string) => {
  const layerHeight = 0.2;

  const layers = [];

  const geometry = await loader.loadAsync(file);
  geometry.rotateX(-Math.PI / 2);
  const obj = new Mesh(geometry);
  const bbox = new Box3().setFromObject(obj);
  const modelHeight = bbox.max.y - bbox.min.y;
  const layerCount = Math.ceil(modelHeight / layerHeight);

  for (let i = 0; i < 1; i++) {
    const height = bbox.min.y + i * layerHeight;
    const layer = createLayer(height);
    layers.push(layer);
  }

  return layers;

  function createLayer(height: number) {
    const intersectionPlane = new Plane(new Vector3(0, 1, 0), -height);
    const intersectionLines = findIntersections(intersectionPlane);

    const contours = connectSegments(intersectionLines);
    const line = contourToLines(contours);

    return {
      // height,
      line,
      contours,
      // infill: generateInfill(contours),
      // supports: generateSupports(contours)
    };
  }

  function findIntersections(plane: Plane) {
    const intersections = [];
    const position = geometry.getAttribute("position").array;

    for (let i = 0; i < position.length; i += 9) {
      // for (let i = 0; i < 9; i += 9) {
      const p1 = new Vector3(position[i], position[i + 1], position[i + 2]);
      const p2 = new Vector3(position[i + 3], position[i + 4], position[i + 5]);
      const p3 = new Vector3(position[i + 6], position[i + 7], position[i + 8]);

      const line = trianglePlaneIntersection([p1, p2, p3], plane);

      if (!line) {
        continue;
      }

      debugPoint(line[0]);

      intersections.push(line);
    }

    return intersections;
  }
};

function contourToLines(
  contours: [Vector3, Vector3][][],
  color: ColorRepresentation = 0xff0000,
  linewidth: number = 1,
): Group {
  // Create a group to hold all the lines
  const group = new Group();

  // Create a material that will be shared by all lines
  const material = new LineBasicMaterial({
    color: color,
    linewidth: linewidth,
  });

  // Process each contour
  contours.forEach((contour) => {
    // Create geometry for this contour
    const geometry = new BufferGeometry().setFromPoints(contour);

    // Create a line from the geometry
    const line = new Line(geometry, material);

    // Add the line to the group
    group.add(line);
  });

  return group;
}

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
function connectSegments(segments: [Vector3, Vector3][]): Vector3[][] {
  if (!segments || segments.length === 0) return [];

  // Helper function to check if two points are the same (within tolerance)
  const EPSILON = 0.0001;
  const isSamePoint = (a: Vector3, b: Vector3): boolean =>
    a.distanceTo(b) < EPSILON;

  // Keep track of used segments
  const usedSegments = new Set<number>();
  const contours: Vector3[][] = [];

  while (usedSegments.size < segments.length) {
    // Find first unused segment to start a new contour
    const startIndex = segments.findIndex(
      (_, index) => !usedSegments.has(index),
    );
    if (startIndex === -1) break;

    // Start new contour with the first segment
    const currentContour: Vector3[] = [
      segments[startIndex][0].clone(),
      segments[startIndex][1].clone(),
    ];
    usedSegments.add(startIndex);

    let foundConnection: boolean;
    do {
      foundConnection = false;

      // Try to extend the contour
      for (let i = 0; i < segments.length; i++) {
        if (usedSegments.has(i)) continue;

        const segment = segments[i];
        const lastPoint = currentContour[currentContour.length - 1];

        // Check if this segment connects to the end of our contour
        if (isSamePoint(lastPoint, segment[0])) {
          currentContour.push(segment[1].clone());
          usedSegments.add(i);
          foundConnection = true;
          break;
        } else if (isSamePoint(lastPoint, segment[1])) {
          currentContour.push(segment[0].clone());
          usedSegments.add(i);
          foundConnection = true;
          break;
        }
      }
    } while (foundConnection);

    // Add the completed contour
    contours.push(currentContour);
  }

  return contours;
}
