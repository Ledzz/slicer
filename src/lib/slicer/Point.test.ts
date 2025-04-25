import { describe, expect, it } from "vitest";
import { Point, Vector } from "./Point.ts";

describe("Point", () => {
  it("should create a Point", () => {
    const point = new Point(1, 2);
    expect(point.x).toBe(1);
    expect(point.y).toBe(2);
  });

  it("should scale Point", () => {
    const point = new Point(1, 2);
    point.scale(2);
    expect(point.x).toBe(2);
    expect(point.y).toBe(4);
  });

  it("should translate Point by xy", () => {
    const point = new Point(1, 2);
    point.translate(3, 4);
    expect(point.x).toBe(4);
    expect(point.y).toBe(6);
  });

  it("should translate Point by Vector", () => {
    const point = new Point(1, 2);
    const translation = new Vector(3, 4);
    point.translate(translation);
    expect(point.x).toBe(4);
    expect(point.y).toBe(6);
  });

  it("should rotate point with no center", () => {
    const point = new Point(1, 2);
    const angle = Math.PI / 6;
    point.rotate(angle);
    expect(point.x).toBeCloseTo(-0.134, 3);
    expect(point.y).toBeCloseTo(2.232, 3);
  });

  it("should rotate point with center", () => {
    const point = new Point(1, 2);
    const angle = Math.PI / 6;
    const center = new Point(4, 6);
    point.rotate(angle, center);
    expect(point.x).toBeCloseTo(3.402, 3);
    expect(point.y).toBeCloseTo(1.036, 3);
  });

  it("should return new rotated point", () => {
    const point = new Point(1, 2);
    const angle = Math.PI / 6;
    const center = new Point(4, 6);
    const rotatedPoint = point.rotated(angle, center);
    expect(rotatedPoint.x).toBeCloseTo(3.402, 3);
    expect(rotatedPoint.y).toBeCloseTo(1.036, 3);
    expect(point.x).toBe(1);
    expect(point.y).toBe(2);
  });

  it("should check point equality", () => {
    const point1 = new Point(1, 2);
    const point2 = new Point(1, 2);
    const point3 = new Point(3, 4);
    expect(point1.equals(point2)).toBe(true);
    expect(point1.equals(point3)).toBe(false);
    expect(point1.coincides_with(point2)).toBe(true);
    expect(point1.coincides_with(point3)).toBe(false);
  });

  it("should check point equality with epsilon", () => {
    const point1 = new Point(1, 2);
    const point2 = new Point(1.00001, 2.00001);
    const point3 = new Point(3, 4);
    expect(point1.coincides_with_epsilon(point2)).toBe(true);
    expect(point1.coincides_with_epsilon(point3)).toBe(false);
  });

  it("should find index of nearest point", () => {
    const point = new Point(1, 2);
    const points = [new Point(3, 4), new Point(5, 6), new Point(1.5, 2.5)];
    const index = point.nearest_point_index(points);
    expect(index).toBe(2);
  });

  it("should find index of point nearest to this and to given", () => {
    const point = new Point(2, 3);
    const points = [
      new Point(1, 1),
      new Point(2, 2),
      new Point(3, 3),
      new Point(4, 4),
    ];
    const index = point.nearest_waypoint_index(points, new Point(3, 4));
    expect(index).toBe(2);
  });

  it("should calculate distance to point", () => {
    const point1 = new Point(1, 2);
    const point2 = new Point(4, 6);
    const distance = point1.distance_to(point2);
    expect(distance).toBeCloseTo(5, 3);
  });

  it("should calculate distance to line", () => {
    const point = new Point(1, 2);
    const lineStart = new Point(0, 0);
    const lineEnd = new Point(3, 3);
    const distance = point.distance_to({ a: lineStart, b: lineEnd });
    expect(distance).toBeCloseTo(0.707, 3);
  });

  it("should calculate ccw", () => {
    const point = new Point(1, 2);
    const angle = point.ccw(new Point(0, 0), new Point(3, 3));
    expect(angle).toBeCloseTo(3, 3);
  });
  it("should calculate ccw angle", () => {
    const point = new Point(1, 2);
    const angle = point.ccw_angle(new Point(0, 0), new Point(3, 3));
    expect(angle).toBeCloseTo(2.498, 3);
  });
  it.todo("projection_onto");
  it.todo("negative");
  it.todo("vector_to");
  it.todo("align_to_grid");
  it.todo("align_to_grid_coord");
});

describe.todo("Point3");
