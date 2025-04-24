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
});
