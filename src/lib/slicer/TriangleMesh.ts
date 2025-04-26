import { Vector2Tuple, Vector3Tuple } from "three";
import { Axis } from "./axis.ts";
import { TransformationMatrix } from "./TransformationMatrix.ts";
import { BoundingBoxf3 } from "./BoundingBox.ts";
import { Pointf3 } from "./Point.ts";

const EPSILON = 1e-10;

export class TriangleMesh {
  vertices: Vector3Tuple[];
  faces: Vector3Tuple[];
  repaired: boolean;

  constructor(vertices: Vector3Tuple[] = [], faces: Vector3Tuple[] = []) {
    this.vertices = vertices;
    this.faces = faces;
    this.repaired = false;
  }

  /**
   * Creates a deep copy of this mesh
   */
  clone(): TriangleMesh {
    const newVertices = this.vertices.map((v) => [...v] as Vector3Tuple);
    const newFaces = this.faces.map((f) => [...f] as Vector3Tuple);
    const mesh = new TriangleMesh(newVertices, newFaces);
    mesh.repaired = this.repaired;
    return mesh;
  }

  /**
   * Swaps the contents of this mesh with another mesh
   */
  swap(other: TriangleMesh): void {
    const tempVertices = this.vertices;
    const tempFaces = this.faces;
    const tempRepaired = this.repaired;

    this.vertices = other.vertices;
    this.faces = other.faces;
    this.repaired = other.repaired;

    other.vertices = tempVertices;
    other.faces = tempFaces;
    other.repaired = tempRepaired;
  }

  /**
   * Scales the entire mesh by the given factor
   */
  scale(factor: number): void {
    this.vertices = this.vertices.map((vertex) => {
      return [
        vertex[0] * factor,
        vertex[1] * factor,
        vertex[2] * factor,
      ] as Vector3Tuple;
    });
    this.invalidateCache();
  }

  /**
   * Scales the mesh with different factors for each axis
   */
  scaleVector(factors: Vector3Tuple): void {
    this.vertices = this.vertices.map((vertex) => {
      return [
        vertex[0] * factors[0],
        vertex[1] * factors[1],
        vertex[2] * factors[2],
      ] as Vector3Tuple;
    });
    this.invalidateCache();
  }

  /**
   * Translates the mesh by the given vector
   */
  translate(x: number, y: number, z: number): void {
    this.vertices = this.vertices.map((vertex) => {
      return [vertex[0] + x, vertex[1] + y, vertex[2] + z] as Vector3Tuple;
    });
    this.invalidateCache();
  }

  /**
   * Translates the mesh by the given vector
   */
  translateVector(vec: Vector3Tuple): void {
    this.translate(vec[0], vec[1], vec[2]);
  }

  /**
   * Rotates the mesh around the specified axis by the given angle (in radians)
   */
  rotate(angle: number, axis: Axis): void {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    this.vertices = this.vertices.map((vertex) => {
      let x = vertex[0];
      let y = vertex[1];
      let z = vertex[2];
      let newVertex: Vector3Tuple;

      if (axis === "x") {
        // Rotate around X axis
        newVertex = [x, y * cos - z * sin, y * sin + z * cos];
      } else if (axis === "y") {
        // Rotate around Y axis
        newVertex = [x * cos + z * sin, y, -x * sin + z * cos];
      } else {
        // Rotate around Z axis
        newVertex = [x * cos - y * sin, x * sin + y * cos, z];
      }

      return newVertex as Vector3Tuple;
    });

    this.invalidateCache();
  }

  /**
   * Rotates the mesh around the X axis
   */
  rotateX(angle: number): void {
    this.rotate(angle, "x");
  }

  /**
   * Rotates the mesh around the Y axis
   */
  rotateY(angle: number): void {
    this.rotate(angle, "y");
  }

  /**
   * Rotates the mesh around the Z axis
   */
  rotateZ(angle: number): void {
    this.rotate(angle, "z");
  }

  /**
   * Rotates the mesh around the Z axis centered at the specified point
   */
  rotateAroundPoint(angle: number, center: Vector2Tuple): void {
    this.translate(-center[0], -center[1], 0);
    this.rotateZ(angle);
    this.translate(center[0], center[1], 0);
  }

  /**
   * Mirrors the mesh across the specified axis
   */
  mirror(axis: Axis): void {
    this.vertices = this.vertices.map((vertex) => {
      const newVertex = [...vertex] as Vector3Tuple;
      newVertex[axis] = -newVertex[axis];
      return newVertex;
    });

    // When mirroring, we need to reverse face orientation to maintain correct winding
    this.faces = this.faces.map((face) => {
      return [face[0], face[2], face[1]] as Vector3Tuple;
    });

    this.invalidateCache();
  }

  /**
   * Mirrors the mesh across the X axis
   */
  mirrorX(): void {
    this.mirror("x");
  }

  /**
   * Mirrors the mesh across the Y axis
   */
  mirrorY(): void {
    this.mirror("y");
  }

  /**
   * Mirrors the mesh across the Z axis
   */
  mirrorZ(): void {
    this.mirror("z");
  }

  /**
   * Aligns the mesh to the origin so that the minimum coordinates are at (0,0,0)
   */
  alignToOrigin(): void {
    const bbox = this.boundingBox();
    this.translate(-bbox.min[0], -bbox.min[1], -bbox.min[2]);
  }

  /**
   * Centers the mesh around the origin
   */
  centerAroundOrigin(): void {
    this.alignToOrigin();
    const bbox = this.boundingBox();
    const size = [
      bbox.max[0] - bbox.min[0],
      bbox.max[1] - bbox.min[1],
      bbox.max[2] - bbox.min[2],
    ];

    this.translate(-size[0] / 2, -size[1] / 2, -size[2] / 2);
  }

  /**
   * Aligns the mesh to the XY plane (Z=0)
   */
  alignToBed(): void {
    const bbox = this.boundingBox();
    this.translate(0, 0, -bbox.min[2]);
  }

  /**
   * Merges another mesh with this one
   */
  merge(mesh: TriangleMesh): void {
    const vertexCount = this.vertices.length;

    // Add vertices from the other mesh
    this.vertices = [
      ...this.vertices,
      ...mesh.vertices.map((v) => [...v] as Vector3Tuple),
    ];

    // Add faces from the other mesh, adjusting indices
    this.faces = [
      ...this.faces,
      ...mesh.faces.map(
        (f) =>
          [
            f[0] + vertexCount,
            f[1] + vertexCount,
            f[2] + vertexCount,
          ] as Vector3Tuple,
      ),
    ];

    this.repaired = false;
    this.invalidateCache();
  }

  /**
   * Returns a bounding box of the mesh
   */
  boundingBox(): { min: Vector3Tuple; max: Vector3Tuple } {
    if (this.vertices.length === 0) {
      return {
        min: [0, 0, 0],
        max: [0, 0, 0],
      };
    }

    let min: Vector3Tuple = [...this.vertices[0]];
    let max: Vector3Tuple = [...this.vertices[0]];

    for (const vertex of this.vertices) {
      min[0] = Math.min(min[0], vertex[0]);
      min[1] = Math.min(min[1], vertex[1]);
      min[2] = Math.min(min[2], vertex[2]);

      max[0] = Math.max(max[0], vertex[0]);
      max[1] = Math.max(max[1], vertex[1]);
      max[2] = Math.max(max[2], vertex[2]);
    }

    return { min, max };
  }

  /**
   * Returns the center point of the mesh's bounding box
   */
  center(): Vector3Tuple {
    const bbox = this.boundingBox();
    return [
      (bbox.min[0] + bbox.max[0]) / 2,
      (bbox.min[1] + bbox.max[1]) / 2,
      (bbox.min[2] + bbox.max[2]) / 2,
    ];
  }

  /**
   * Returns the size of the mesh
   */
  size(): Vector3Tuple {
    const bbox = this.boundingBox();
    return [
      bbox.max[0] - bbox.min[0],
      bbox.max[1] - bbox.min[1],
      bbox.max[2] - bbox.min[2],
    ];
  }

  /**
   * Calculates the volume of the mesh
   * This implementation uses the signed tetrahedron volume method
   */
  volume(): number {
    let volume = 0;

    for (const face of this.faces) {
      const v1 = this.vertices[face[0]];
      const v2 = this.vertices[face[1]];
      const v3 = this.vertices[face[2]];

      // Calculate signed volume of tetrahedron formed by the face and the origin
      volume +=
        (v1[0] * (v2[1] * v3[2] - v2[2] * v3[1]) +
          v1[1] * (v2[2] * v3[0] - v2[0] * v3[2]) +
          v1[2] * (v2[0] * v3[1] - v2[1] * v3[0])) /
        6.0;
    }

    return Math.abs(volume); // Return absolute value
  }

  /**
   * Calculates face normals
   */
  calculateNormals(): Vector3Tuple[] {
    return this.faces.map((face) => {
      const v1 = this.vertices[face[0]];
      const v2 = this.vertices[face[1]];
      const v3 = this.vertices[face[2]];

      // Calculate vectors for two edges
      const edge1: Vector3Tuple = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];

      const edge2: Vector3Tuple = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];

      // Cross product to get normal
      const normal: Vector3Tuple = [
        edge1[1] * edge2[2] - edge1[2] * edge2[1],
        edge1[2] * edge2[0] - edge1[0] * edge2[2],
        edge1[0] * edge2[1] - edge1[1] * edge2[0],
      ];

      // Normalize
      const length = Math.sqrt(
        normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2],
      );
      if (length > EPSILON) {
        normal[0] /= length;
        normal[1] /= length;
        normal[2] /= length;
      }

      return normal;
    });
  }

  /**
   * Reverses the normal directions of all faces
   */
  reverseNormals(): void {
    // Reverse winding order of each face
    this.faces = this.faces.map((face) => {
      return [face[0], face[2], face[1]] as Vector3Tuple;
    });

    this.invalidateCache();
  }

  /**
   * Repairs mesh topology
   * Note: This is a simplified version. A real implementation would need
   * to handle complex cases like non-manifold edges, degenerate facets, etc.
   */
  repair(): void {
    if (this.repaired) return;

    // TODO: Implement actual mesh repair algorithms:
    // - Remove duplicate vertices
    // - Fix non-manifold edges
    // - Fix degenerate facets
    // - Ensure consistent face orientation
    // - Fix T-junctions
    // - Close holes

    console.warn(
      "TriangleMesh.repair() is not fully implemented. You need to add your own repair code.",
    );

    // Mark as repaired to prevent redundant calls
    this.repaired = true;
  }

  /**
   * Creates a cube mesh with the specified dimensions
   */
  static makeCube(x: number, y: number, z: number): TriangleMesh {
    // Define the 8 vertices of the cube
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

    // Define the 12 triangular faces
    const faces: Vector3Tuple[] = [
      [0, 1, 2],
      [0, 2, 3], // bottom face
      [4, 5, 6],
      [4, 6, 7], // top face
      [0, 4, 7],
      [0, 7, 1], // front face
      [1, 7, 6],
      [1, 6, 2], // right face
      [2, 6, 5],
      [2, 5, 3], // back face
      [4, 0, 3],
      [4, 3, 5], // left face
    ];

    const mesh = new TriangleMesh(vertices, faces);
    mesh.repair();
    return mesh;
  }

  /**
   * Creates a cylinder mesh with the specified radius and height
   */
  static makeCylinder(
    r: number,
    h: number,
    fa: number = (2 * Math.PI) / 360,
  ): TriangleMesh {
    const vertices: Vector3Tuple[] = [];
    const faces: Vector3Tuple[] = [];

    // Center of top and bottom
    vertices.push([0, 0, 0]);
    vertices.push([0, 0, h]);

    // Adjust angle to get an even multiple
    const angle = (2 * Math.PI) / Math.floor((2 * Math.PI) / fa);

    // Create vertices for the cylinder
    vertices.push([r, 0, 0]);
    vertices.push([r, 0, h]);

    let id = 3; // Current vertex index
    for (let i = angle; i < 2 * Math.PI - EPSILON; i += angle) {
      const x = r * Math.sin(i);
      const y = r * Math.cos(i);

      vertices.push([x, y, 0]);
      vertices.push([x, y, h]);

      // Bottom face triangles
      faces.push([0, id, id - 2]);

      // Top face triangles
      faces.push([1, id - 1, id + 1]);

      // Side face triangles
      faces.push([id + 1, id - 1, id - 2]);
      faces.push([id + 1, id - 2, id]);

      id += 2;
    }

    // Connect the last set of vertices with the first
    faces.push([0, 2, id - 2]);
    faces.push([1, id - 1, 3]);
    faces.push([2, 3, id - 1]);
    faces.push([2, id - 1, id - 2]);

    const mesh = new TriangleMesh(vertices, faces);
    mesh.repair();
    return mesh;
  }

  /**
   * Creates a sphere mesh with the specified radius
   */
  static makeSphere(
    rho: number,
    fa: number = (2 * Math.PI) / 360,
  ): TriangleMesh {
    const vertices: Vector3Tuple[] = [];
    const faces: Vector3Tuple[] = [];

    // Adjust angle to get an even multiple
    const angle = (2 * Math.PI) / Math.floor((2 * Math.PI) / fa);

    // Create rings of vertices
    const ringCount = Math.ceil(Math.PI / angle);
    const verticesPerRing = Math.ceil((2 * Math.PI) / angle);

    // Add top vertex
    vertices.push([0, 0, -rho]);

    // Create rings of vertices
    for (let ring = 1; ring < ringCount; ring++) {
      const phi = (Math.PI * ring) / ringCount - Math.PI / 2;
      const z = rho * Math.sin(phi);
      const r = rho * Math.cos(phi);

      for (let i = 0; i < verticesPerRing; i++) {
        const theta = (2 * Math.PI * i) / verticesPerRing;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);

        vertices.push([x, y, z]);
      }
    }

    // Add bottom vertex
    vertices.push([0, 0, rho]);

    // Create faces for top cap
    for (let i = 0; i < verticesPerRing; i++) {
      const nextI = (i + 1) % verticesPerRing;
      faces.push([0, i + 1, nextI + 1]);
    }

    // Create faces for the rings
    for (let ring = 0; ring < ringCount - 2; ring++) {
      const ringOffset = ring * verticesPerRing + 1;

      for (let i = 0; i < verticesPerRing; i++) {
        const nextI = (i + 1) % verticesPerRing;

        // Add two triangular faces for each quad
        faces.push([
          ringOffset + i,
          ringOffset + nextI,
          ringOffset + i + verticesPerRing,
        ]);

        faces.push([
          ringOffset + nextI,
          ringOffset + nextI + verticesPerRing,
          ringOffset + i + verticesPerRing,
        ]);
      }
    }

    // Create faces for bottom cap
    const lastVertex = vertices.length - 1;
    const lastRingOffset = (ringCount - 2) * verticesPerRing + 1;

    for (let i = 0; i < verticesPerRing; i++) {
      const nextI = (i + 1) % verticesPerRing;
      faces.push([lastVertex, lastRingOffset + nextI, lastRingOffset + i]);
    }

    const mesh = new TriangleMesh(vertices, faces);
    mesh.repair();
    return mesh;
  }

  getTransformedMesh(transformationMatrix: TransformationMatrix): TriangleMesh {
    const mesh = new TriangleMesh();
    // TODO
    // std::vector<double> trafo_arr = trafo.matrix3x4f();
    // stl_get_transform(&(this->stl), &(mesh.stl), trafo_arr.data());
    // stl_invalidate_shared_vertices(&(mesh.stl));
    return mesh;
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

  /**
   * Transforms the mesh in place using the provided transformation matrix
   *
   * Note: This is a simplified implementation. You'll need to implement
   * or import a proper TransformationMatrix class for full functionality.
   */
  transform(transformationMatrix: any): void {
    // TODO: Implement proper transformation matrix operations
    console.warn("transform() requires a TransformationMatrix implementation");
    this.invalidateCache();
  }

  /**
   * Invalidates any cached data when the mesh is modified
   */
  private invalidateCache(): void {
    this.repaired = false;
  }

  /**
   * Cuts the mesh at the specified Z height and returns the upper and lower parts
   *
   * Note: This is a complex operation requiring intersection calculations
   * and triangulation - only a simplified placeholder is provided.
   */
  cut(axis: Axis, z: number): { upper: TriangleMesh; lower: TriangleMesh } {
    // TODO: Implement actual cutting algorithm
    console.warn(
      "cut() is not fully implemented. You need to add your own implementation.",
    );

    // This is just a placeholder that returns empty meshes
    const upper = new TriangleMesh();
    const lower = new TriangleMesh();

    return { upper, lower };
  }

  /**
   * Extrudes a 2D mesh along the Z axis
   */
  extrudeTin(offset: number): void {
    // TODO: Implement extrusion algorithm
    console.warn(
      "extrudeTin() is not implemented. You need to add your own implementation.",
    );
    this.invalidateCache();
  }

  /**
   * Splits the mesh into separate connected components
   */
  split(): TriangleMesh[] {
    // TODO: Implement mesh splitting algorithm
    console.warn(
      "split() is not implemented. You need to add your own implementation.",
    );
    return [this.clone()];
  }

  /**
   * Slices the mesh at multiple Z heights
   */
  slice(z: number[]): any[] {
    // TODO: Implement slicing algorithm
    console.warn(
      "slice() is not implemented. You need to add your own implementation.",
    );
    return [];
  }

  /**
   * Checks if the mesh is manifold (watertight)
   */
  isManifold(): boolean {
    // TODO: Implement manifold checking
    console.warn(
      "isManifold() is not implemented. You need to add your own implementation.",
    );
    return true;
  }

  /**
   * Projects the mesh onto the XY plane
   */
  horizontalProjection(): any {
    // TODO: Implement horizontal projection
    console.warn(
      "horizontalProjection() is not implemented. You need to add your own implementation.",
    );
    return null;
  }

  /**
   * Computes the convex hull of the mesh
   */
  convexHull(): any {
    // TODO: Implement convex hull algorithm
    console.warn(
      "convexHull() is not implemented. You need to add your own implementation.",
    );
    return null;
  }
}
