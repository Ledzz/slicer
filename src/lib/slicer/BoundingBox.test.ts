import { describe, expect, it } from "vitest";
import { BoundingBoxf3 } from "./BoundingBox.ts";
import { Pointf3 } from "./Point.ts";

describe("BoundingBox", () => {
  it("should create empty BoundingBox", () => {
    const bbox = new BoundingBoxf3();
    expect(bbox.defined).toBe(false);
  });

  it("should create BoundingBox from points", () => {
    const bbox = new BoundingBoxf3([
      new Pointf3(-1, -2, -3),
      new Pointf3(1, 2, 3),
    ]);

    expect(bbox.defined).toBe(true);
    expect(bbox.min.x).toBe(-1);
    expect(bbox.min.y).toBe(-2);
    expect(bbox.min.z).toBe(-3);
    expect(bbox.max.x).toBe(1);
    expect(bbox.max.y).toBe(2);
    expect(bbox.max.z).toBe(3);
  });

  it("should create BoundingBox from min and max points", () => {
    const bbox = new BoundingBoxf3(
      new Pointf3(-1, -2, -3),
      new Pointf3(1, 2, 3),
    );

    expect(bbox.defined).toBe(true);
    expect(bbox.min.x).toBe(-1);
    expect(bbox.min.y).toBe(-2);
    expect(bbox.min.z).toBe(-3);
    expect(bbox.max.x).toBe(1);
    expect(bbox.max.y).toBe(2);
    expect(bbox.max.z).toBe(3);
  });
  it("should merge BoundingBoxes", () => {
    const bbox1 = new BoundingBoxf3(
      new Pointf3(-1, -2, -3),
      new Pointf3(1, 2, 3),
    );
    const bbox2 = new BoundingBoxf3(
      new Pointf3(-4, -5, -6),
      new Pointf3(4, 5, 6),
    );

    bbox1.merge(bbox2);

    expect(bbox1.min.x).toBe(-4);
    expect(bbox1.min.y).toBe(-5);
    expect(bbox1.min.z).toBe(-6);
    expect(bbox1.max.x).toBe(4);
    expect(bbox1.max.y).toBe(5);
    expect(bbox1.max.z).toBe(6);
  });

  it("should scale BoundingBox", () => {
    const bbox = new BoundingBoxf3(
      new Pointf3(-1, -2, -3),
      new Pointf3(1, 2, 3),
    );

    bbox.scale(2);

    expect(bbox.min.x).toBe(-2);
    expect(bbox.min.y).toBe(-4);
    expect(bbox.min.z).toBe(-6);
    expect(bbox.max.x).toBe(2);
    expect(bbox.max.y).toBe(4);
    expect(bbox.max.z).toBe(6);
  });
  it("should return size of BoundingBox", () => {
    const bbox = new BoundingBoxf3(
      new Pointf3(-1, -2, -3),
      new Pointf3(1, 2, 3),
    );

    const size = bbox.size();

    expect(size.x).toBe(2);
    expect(size.y).toBe(4);
    expect(size.z).toBe(6);
  });

  it("should return radius of BoundingBox", () => {
    const bbox = new BoundingBoxf3(
      new Pointf3(-1, -2, -3),
      new Pointf3(1, 2, 3),
    );

    const radius = bbox.radius();

    expect(radius).toBeCloseTo(3.742, 3);
  });

  it("should translate BoundingBox", () => {
    const bbox = new BoundingBoxf3(
      new Pointf3(-1, -2, -3),
      new Pointf3(1, 2, 3),
    );

    bbox.translate(1, 2, 3);

    expect(bbox.min.x).toBe(0);
    expect(bbox.min.y).toBe(0);
    expect(bbox.min.z).toBe(0);
    expect(bbox.max.x).toBe(2);
    expect(bbox.max.y).toBe(4);
    expect(bbox.max.z).toBe(6);
  });

  it("should offset BoundingBox", () => {
    const bbox = new BoundingBoxf3(
      new Pointf3(-1, -2, -3),
      new Pointf3(1, 2, 3),
    );

    bbox.offset(1);

    expect(bbox.min.x).toBe(-2);
    expect(bbox.min.y).toBe(-3);
    expect(bbox.min.z).toBe(-4);
    expect(bbox.max.x).toBe(2);
    expect(bbox.max.y).toBe(3);
    expect(bbox.max.z).toBe(4);
  });

  it("should return center of BoundingBox", () => {
    const bbox = new BoundingBoxf3(
      new Pointf3(-1, -2, -3),
      new Pointf3(2, 3, 4),
    );

    const center = bbox.center();
    expect(center.x).toBe(0.5);
    expect(center.y).toBe(0.5);
    expect(center.z).toBe(0.5);
  });

  it("should return if point contained in BoundingBox", () => {
    const bbox = new BoundingBoxf3(
      new Pointf3(-1, -2, -3),
      new Pointf3(1, 2, 3),
    );

    const pointInside = new Pointf3(0, 0, 0);
    const pointOutside = new Pointf3(2, 2, 2);

    expect(bbox.contains(pointInside)).toBe(true);
    expect(bbox.contains(pointOutside)).toBe(false);
  });
});
