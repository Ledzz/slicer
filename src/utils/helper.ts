import { Group, Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from "three";

export const helperGroup = new Group();

export function debugPoint(p: Vector3) {
  const m = new Mesh(
    new SphereGeometry(),
    new MeshBasicMaterial({ color: 0x00ff00 }),
  );

  m.position.copy(p);

  helperGroup.add(m);
}
