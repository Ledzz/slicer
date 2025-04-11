import { SliceResult, Support } from "./types.ts";
import {
  ArrowHelper,
  BufferGeometry,
  Line,
  LineBasicMaterial,
  Mesh,
  Raycaster,
  Scene,
  Vector3,
} from "three";

export const generateSupports = (sliceResult: SliceResult, scene: Scene) => {
  const { geometry } = sliceResult;
  // determine the support points
  const raycaster = new Raycaster();
  const object = new Mesh(geometry.clone().rotateX(-Math.PI / 2));
  sliceResult.layers.forEach((layer) => {
    const bounds = layer.crossection.bounds();
    const polygons = layer.crossection.toPolygons();
    polygons.forEach((polygon) => {
      polygon.forEach((p) => {
        const samplePoint = new Vector3(p[0], p[1], layer.height);
        raycaster.set(samplePoint, new Vector3(0, 0, -1));
        const intersections = raycaster.intersectObject(object);
        if (intersections.length) {
          console.log(intersections);
        }

        if (scene) {
          const helper = new ArrowHelper(
            raycaster.ray.direction,
            raycaster.ray.origin,
          );
          helper.position.copy(raycaster.ray.origin);
          scene.add(helper);
        }

        // raycast from point to base and check intersections
      });
    });
  });
  console.log(object);

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
