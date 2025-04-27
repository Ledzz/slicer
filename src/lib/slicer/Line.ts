import { Point, Pointf3, Vector } from "./Point.ts";
import { directions_parallel } from "./utils/directions_parallel.ts";
import { EPSILON } from "./types.ts";

export class Line {
  constructor(
    public a: Point,
    public b: Point,
  ) {}

  scale(factor: number) {
    this.a.scale(factor);
    this.b.scale(factor);
  }

  translate(x: number, y: number) {
    this.a.translate(x, y);
    this.b.translate(x, y);
  }

  rotate(angle, center: Point) {
    this.a.rotate(angle, center);
    this.b.rotate(angle, center);
  }

  reverse() {
    [this.a, this.b] = [this.b, this.a];
  }

  length(): number {
    return this.a.distance_to(this.b);
  }

  midpoint(): Point {
    return new Point((this.a.x + this.b.x) / 2, (this.a.y + this.b.y) / 2);
  }

  point_at(distance: number, point: Point): void;
  point_at(distance: number): Point;
  point_at(distance: number, point: Point = new Point()): Point | undefined {
    if (this.a.x !== this.b.x) {
      point.x = this.a.x + ((this.b.x - this.a.x) * distance) / this.length();
    }
    if (this.a.y !== this.b.y) {
      point.y = this.a.y + ((this.b.y - this.a.y) * distance) / this.length();
    }

    return point;
  }

  intersection_infinite(other: Line, point: Point): boolean {
    const x = this.a.vector_to(other.a);
    const d1 = this.vector();
    const d2 = other.vector();
    const cross = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(cross) < 1e-12) {
      return false;
    }

    const t1 = (x.x * d2.y - x.y * d2.x) / cross;
    point.x = this.a.x + t1 * d1.x;
    point.y = this.a.y + t1 * d1.y;
    return true;
  }

  coincides_with(line: Line): boolean {
    return this.a.coincides_with(line.a) && this.b.coincides_with(line.b);
  }

  distance_to(point: Point): number {
    return point.distance_to(this);
  }

  parallel_to(angle: number): boolean;
  parallel_to(line: Line): boolean;
  parallel_to(angleOrLine: number | Line): boolean {
    const angle =
      typeof angleOrLine === "number" ? angleOrLine : angleOrLine.direction();
    return directions_parallel(this.direction(), angle);
  }

  atan2_(): number {
    return Math.atan2(this.b.y - this.a.y, this.b.x - this.a.x);
  }
  orientation(): number {
    const angle = this.atan2_();
    if (angle < 0) {
      return 2 * Math.PI + angle;
    }
    return angle;
  }
  direction(): number {
    const atan2 = this.atan2_();
    return Math.abs(atan2 - Math.PI) < EPSILON
      ? 0
      : atan2 < 0
        ? atan2 + Math.PI
        : atan2;
  }
  vector(): Vector {
    return new Vector(this.b.x - this.a.x, this.b.y - this.a.y);
  }
  normal(): Vector {
    return new Vector(this.b.y - this.a.y, -(this.b.x - this.a.x));
  }
  extend_end(distance: number) {
    // relocate last point by extending the segment by the specified length
    this.reverse();
    this.point_at(-distance, this.b);
  }
  extend_start(distance: number) {
    this.point_at(-distance, this.a);
  }
  intersection(line: Line, intersection: Point): boolean {
    const denom =
      (line.b.y - line.a.y) * (this.b.x - this.a.x) -
      (line.b.x - line.a.x) * (this.b.y - this.a.y);

    const nume_a =
      (line.b.x - line.a.x) * (this.a.y - line.a.y) -
      (line.b.y - line.a.y) * (this.a.x - line.a.x);

    const nume_b =
      (this.b.x - this.a.x) * (this.a.y - line.a.y) -
      (this.b.y - this.a.y) * (this.a.x - line.a.x);

    if (Math.abs(denom) < EPSILON) {
      if (Math.abs(nume_a) < EPSILON && Math.abs(nume_b) < EPSILON) {
        return false; // coincident
      }
      return false; // parallel
    }

    const ua = nume_a / denom;
    const ub = nume_b / denom;

    if (ua >= 0 && ua <= 1.0 && ub >= 0 && ub <= 1.0) {
      // Get the intersection point.
      intersection.x = this.a.x + ua * (this.b.x - this.a.x);
      intersection.y = this.a.y + ua * (this.b.y - this.a.y);
      return true;
    }

    return false; // not intersecting
  }
  ccw(point: Point): number {
    return point.ccw(this);
  }
}

export class ThickLine extends Line {
  constructor(
    public a: Point,
    public b: Point,
    public a_width: number = 0,
    public b_width: number = 0,
  ) {
    super(a, b);
  }
}

export class Linef {
  constructor(
    public a: number,
    public b: number,
  ) {}
}

export class Linef3 {
  constructor(
    public a: Pointf3,
    public b: Pointf3,
  ) {}

  intersect_plane(z: number): Pointf3 {
    return new Pointf3(
      this.a.x +
        ((this.b.x - this.a.x) * (z - this.a.z)) / (this.b.z - this.a.z),
      this.a.y +
        ((this.b.y - this.a.y) * (z - this.a.z)) / (this.b.z - this.a.z),
      z,
    );
  }

  scale(factor: number) {
    this.a.scale(factor);
    this.b.scale(factor);
  }
}
