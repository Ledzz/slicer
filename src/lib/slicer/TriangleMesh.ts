import { Vector3Tuple } from "three";

export class TriangleMesh {
  vertices: Vector3Tuple[];
  faces: Vector3Tuple[];

  constructor(vertices: Vector3Tuple[] = [], faces: Vector3Tuple[] = []) {
    this.vertices = vertices;
    this.faces = faces;
  }

  repair() {
    // TODO
  }

  static makeCube(x: number, y: number, z: number): TriangleMesh {
    const vertices: Vector3Tuple[] = [
      [x, y, 0],
      [x, 0, 0],
      [0, 0, 0],
      [0, y, 0],
      [x, y, z],
      [0, y, z],
      [0, 0, z],
      [x, 0, z],
    ];
    const faces: Vector3Tuple[] = [
      [0, 1, 2],
      [0, 2, 3],
      [4, 5, 6],
      [4, 6, 7],
      [0, 4, 7],
      [0, 7, 1],
      [1, 7, 6],
      [1, 6, 2],
      [2, 6, 5],
      [2, 5, 3],
      [4, 0, 3],
      [4, 3, 5],
    ];
    const mesh = new TriangleMesh(vertices, faces);
    mesh.repair();
    return mesh;
  }
}
