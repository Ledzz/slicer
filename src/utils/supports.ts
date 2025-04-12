import { SliceResult, Support } from "./types.ts";
import {
  ArrowHelper,
  BufferGeometry,
  Line,
  LineBasicMaterial,
  MathUtils,
  Mesh,
  Raycaster,
  Scene,
  Vector3,
} from "three";

const zAxis = new Vector3(0, 0, 1);
const zDown = new Vector3(0, 0, -1);
const overhangAngle = 45;
const raycasterRange = 0.1;

export const generateSupports = (sliceResult: SliceResult, scene: Scene) => {
  const { geometry } = sliceResult;
  // determine the support points
  const raycaster = new Raycaster(undefined, undefined, 0, raycasterRange);
  const object = new Mesh(geometry);
  // scene?.add(object);

  // const geometry = originalGeometry.clone().rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position.array;
  const numFaces = positions.length / 9; // 3 vertices * 3 components (x, y, z)

  for (let i = 0; i < numFaces; i++) {
    const a = i * 9;
    const b = i * 9 + 3;
    const c = i * 9 + 6;

    const vertexA = new Vector3(
      positions[a],
      positions[a + 1],
      positions[a + 2],
    );
    const vertexB = new Vector3(
      positions[b],
      positions[b + 1],
      positions[b + 2],
    );
    const vertexC = new Vector3(
      positions[c],
      positions[c + 1],
      positions[c + 2],
    );
    if (vertexA.z === 0 || vertexB.z === 0 || vertexC.z === 0) {
      continue;
    }

    const ab = new Vector3().subVectors(vertexB, vertexA);
    const ac = new Vector3().subVectors(vertexC, vertexA);
    const normal = new Vector3().crossVectors(ab, ac).normalize();
    const angleDegrees = MathUtils.radToDeg(Math.acos(normal.dot(zAxis)));
    if (overhangAngle < angleDegrees) {
      raycaster.set(vertexA, zDown);

      const intersections = raycaster
        .intersectObject(object)
        .filter((i) => i.point.z > 0);
      if (intersections.length) {
        continue;
      }

      if (scene) {
        const helper = new ArrowHelper(
          raycaster.ray.direction,
          raycaster.ray.origin,
          1,
          0xff,
        );
        helper.position.copy(raycaster.ray.origin);
        scene.add(helper);
      }
    }
  }

  return generateSupportAtPoint(new Vector3(1, 0, 20), sliceResult);
};

export const generateSupportAtPoint = (
  point: Vector3,
  sliceResult: SliceResult,
): Support => {
  const material = new LineBasicMaterial({
    color: 0xff0000,
    linewidth: 1,
  });
  const geometry = new BufferGeometry().setFromPoints([
    point,
    new Vector3(point.x, point.y, 0),
  ]);
  const line = new Line(geometry, material);
  return line;
};
