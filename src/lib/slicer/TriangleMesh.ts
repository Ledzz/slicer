import { Vector3Tuple } from "three";
import { TransformationMatrix } from "./TransformationMatrix.ts";
import { Pointf3 } from "./Point.ts";
import { BoundingBoxf3 } from "./BoundingBox.ts";

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

  get_transformed_mesh(trafo: TransformationMatrix): TriangleMesh {
    // TODO
    return new TriangleMesh();
  }

  get_transformed_bounding_box(trafo: TransformationMatrix): BoundingBoxf3 {
    const bbox = new BoundingBoxf3();
    this.faces.forEach((face) => {
      for (let i = 0; i < 3; i++) {
        const [v_x, v_y, v_z] = this.vertices[face[i]];
        const poi = new Pointf3(
          trafo.m00 * v_x + trafo.m01 * v_y + trafo.m02 * v_z + trafo.m03,
          trafo.m10 * v_x + trafo.m11 * v_y + trafo.m12 * v_z + trafo.m13,
          trafo.m20 * v_x + trafo.m21 * v_y + trafo.m22 * v_z + trafo.m23,
        );
        bbox.merge(poi);
      }
    });
    return bbox;
  }

  bounding_box(): BoundingBoxf3 {
    const bbox = new BoundingBoxf3();
    this.faces.forEach((face) => {
      for (let i = 0; i < 3; i++) {
        const [v_x, v_y, v_z] = this.vertices[face[i]];
        const poi = new Pointf3(v_x, v_y, v_z);
        bbox.merge(poi);
      }
    });
    return bbox;
  }
}
