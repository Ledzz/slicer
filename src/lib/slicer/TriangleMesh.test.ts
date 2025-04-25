import { describe, expect, it } from "vitest";
import { TriangleMesh } from "./TriangleMesh.ts";

describe("TriangleMesh", () => {
  it("should create a TriangleMesh", () => {
    const mesh = new TriangleMesh();
    expect(mesh).toBeInstanceOf(TriangleMesh);
  });

  it("should clone a TriangleMesh", () => {
    const mesh = new TriangleMesh();
    const clone = mesh.clone();
    expect(clone).toBeInstanceOf(TriangleMesh);
    expect(clone).not.toBe(mesh);
  });

  it("should create a cube mesh", () => {
    const mesh = TriangleMesh.makeCube(1, 1, 1);
    expect(mesh).toBeInstanceOf(TriangleMesh);
    expect(mesh.vertices.length).toBe(8);
    expect(mesh.faces.length).toBe(12);
  });

  it("should create a cylinder mesh", () => {
    const mesh = TriangleMesh.makeCylinder(1, 2, Math.PI / 2 / 6);
    expect(mesh).toBeInstanceOf(TriangleMesh);
    expect(mesh.vertices.length).toBe(50);
    expect(mesh.faces.length).toBe(96);
  });

  it("should create a sphere mesh", () => {
    const mesh = TriangleMesh.makeSphere(1, Math.PI / 2 / 6);
    expect(mesh).toBeInstanceOf(TriangleMesh);
    expect(mesh.vertices.length).toBe(266);
    expect(mesh.faces.length).toBe(528);
  });

  it("should calculate bounding box", () => {
    const mesh = TriangleMesh.makeCube(1, 1, 1);
    const bbox = mesh.boundingBox();
    expect(bbox.max).toStrictEqual([1, 1, 1]);
    expect(bbox.min).toStrictEqual([0, 0, 0]);
  });

  it("should scale mesh", () => {
    const mesh = TriangleMesh.makeCube(1, 1, 1);
    mesh.scale(2);
    const bbox = mesh.boundingBox();
    expect(bbox.max).toStrictEqual([2, 2, 2]);
    expect(bbox.min).toStrictEqual([0, 0, 0]);
  });

  it("should scale mesh non-uniformly", () => {
    const mesh = TriangleMesh.makeCube(1, 1, 1);
    mesh.scaleVector([2, 3, 4]);
    const bbox = mesh.boundingBox();
    expect(bbox.max).toStrictEqual([2, 3, 4]);
    expect(bbox.min).toStrictEqual([0, 0, 0]);
  });

  it("should translate mesh by axes", () => {
    const mesh = TriangleMesh.makeCube(1, 1, 1);
    mesh.translate(1, 2, 3);
    const bbox = mesh.boundingBox();
    expect(bbox.max).toStrictEqual([2, 3, 4]);
    expect(bbox.min).toStrictEqual([1, 2, 3]);
  });

  it("should translate mesh by vector", () => {
    const mesh = TriangleMesh.makeCube(1, 1, 1);
    mesh.translateVector([1, 2, 3]);
    const bbox = mesh.boundingBox();
    expect(bbox.max).toStrictEqual([2, 3, 4]);
    expect(bbox.min).toStrictEqual([1, 2, 3]);
  });

  it("should rotate mesh by angle", () => {
    const mesh = TriangleMesh.makeCube(1, 1, 1);
    mesh.rotate(Math.PI / 6, "z");
    const bbox = mesh.boundingBox();
    expect(bbox.max[0]).toBeCloseTo(0.866);
    expect(bbox.max[1]).toBeCloseTo(1.366);
    expect(bbox.max[2]).toBeCloseTo(1);
    expect(bbox.min[0]).toBeCloseTo(-0.5);
    expect(bbox.min[1]).toBeCloseTo(0);
    expect(bbox.min[2]).toBeCloseTo(0);
  });

  it.todo("rotateX");
  it.todo("rotateY");
  it.todo("rotateZ");
  it.todo("rotateAroundPoint");
  it.todo("mirror");
  it.todo("mirrorX");
  it.todo("mirrorY");
  it.todo("mirrorZ");
  it.todo("alignToOrigin");
  it.todo("centerAroundOrigin");
  it.todo("alignToBed");
  it.todo("merge");
  it.todo("center");
  it.todo("size");
  it.todo("volume");
  it.todo("calculateNormals");
  it.todo("reverseNormals");
  it.todo("repair");
  it.todo("getTransformedMesh");
  it.todo("transform");
  it.todo("invalidateCache");
  it.todo("cut");
  it.todo("extrudeTin");
  it.todo("split");
  it.todo("slice");
  it.todo("isManifold");
  it.todo("horizontalProjection");
  it.todo("convexHull");
});
