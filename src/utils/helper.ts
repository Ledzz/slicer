import {
  BufferGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Plane,
  PlaneHelper,
  SphereGeometry,
  Vector3,
} from "three";

export const helperGroup = new Group();

export function debugPoint(p: Vector3) {
  const m = new Mesh(
    new SphereGeometry(),
    new MeshBasicMaterial({ color: 0x00ff00 }),
  );

  m.position.copy(p);

  helperGroup.add(m);
}

export function debugPlane(plane: Plane) {
  const helper = new PlaneHelper(plane, 1, 0xff);

  helperGroup.add(helper);
}

export function debugLine(v1: Vector3, v2: Vector3) {
  const geometry = new BufferGeometry().setFromPoints([v1, v2]);
  const material = new LineBasicMaterial({ color: 0xff0000 });
  const line = new Line(geometry, material);

  helperGroup.add(line);
}
