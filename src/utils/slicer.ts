import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import {
  Box3,
  BufferGeometry,
  ColorRepresentation,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  Vector3,
} from "three";
import { geometry2mesh, manifold } from "./manifold.ts";
import { SimplePolygon } from "manifold-3d";
import { SliceLayer, SliceResult } from "./types.ts";

const loader = new STLLoader();

export const slice = async (file: string): Promise<SliceResult> => {
  const layerHeight = 0.05;

  const layers = [];

  const geometry = await loader.loadAsync(file);

  const mesh = geometry2mesh(geometry);
  const m = manifold.Manifold.ofMesh(mesh);
  const obj = new Mesh(geometry);
  const bounds = new Box3().setFromObject(obj);
  const modelHeight = bounds.max.z - bounds.min.z;
  const layerCount = Math.ceil(modelHeight / layerHeight);

  // TODO: We need to lay model flat on the bed
  for (let i = 0; i < layerCount; i++) {
    const height = i * layerHeight;

    const layer = createLayer(height);
    layers.push(layer);
  }

  return { manifold: m, layers, geometry, bounds };

  function createLayer(height: number): SliceLayer {
    const crossection = m.slice(height);
    const polygons = crossection.toPolygons();
    const line = contourToLines(polygons, height, 0xff0000, 1);

    return {
      height,
      line,
      polygons,
      crossection,
    };
  }
};

function contourToLines(
  contours: SimplePolygon[],
  height: number,
  color: ColorRepresentation = 0xff0000,
  linewidth: number = 1,
): Group {
  const group = new Group();

  const material = new LineBasicMaterial({
    color: color,
    linewidth: linewidth,
  });

  // Process each contour
  contours.forEach((contour) => {
    const points = [
      ...contour.map((point) => new Vector3(point[0], point[1], height)),
      new Vector3(contour[0][0], contour[0][1], height),
    ];
    const geometry = new BufferGeometry().setFromPoints(points);

    const line = new Line(geometry, material);

    group.add(line);
  });

  return group;
}
