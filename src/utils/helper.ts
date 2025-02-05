import {
  BufferGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Plane,
  PlaneGeometry,
  SphereGeometry,
  Vector3,
} from "three";
import { Vec2 } from "manifold-3d";

export const helperGroup = new Group();

export function debugPoint(p: Vector3) {
  const helper = new Mesh(
    new SphereGeometry(),
    new MeshBasicMaterial({ color: 0x00ff00 }),
  );

  helper.position.copy(p);

  helperGroup.add(helper);
}
export function debugPoint2([x, y]: [number, number]) {
  const helper = new Mesh(
    new SphereGeometry(),
    new MeshBasicMaterial({ color: 0x00ff00 }),
  );

  helper.position.set(x, y, 0);

  helperGroup.add(helper);
}

export function debugPlane(plane: Plane) {
  const helper = new Mesh(
    new PlaneGeometry(10, 10),
    new MeshBasicMaterial({ color: 0xff, wireframe: true }),
  );

  helper.lookAt(plane.normal);
  helper.position.copy(plane.normal).multiplyScalar(plane.constant);

  helperGroup.add(helper);
}

export function debugLine(v1: Vector3, v2: Vector3) {
  const helper = new Line(
    new BufferGeometry().setFromPoints([v1, v2]),
    new LineBasicMaterial({ color: 0xff0000 }),
  );

  helperGroup.add(helper);
}

export function debugLine2(line: { start: Vec2; end: Vec2 }) {
  const helper = new Line(
    new BufferGeometry().setFromPoints([
      new Vector3(line.start[0], line.start[1], 0),
      new Vector3(line.end[0], line.end[1], 0),
    ]),
    new LineBasicMaterial({ color: 0xff0000 }),
  );

  helperGroup.add(helper);
}

import.meta.hot.on("vite:beforeUpdate", () => {
  helperGroup.clear();
});
