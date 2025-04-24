const EPSILON = 1e-4;
const SCALED_EPSILON = 0.0001;
const PI = Math.PI;

// Forward declarations
interface Line {
  a: Point;
  b: Point;
}

interface MultiPoint {
  first_point(): Point;
  lines(): Line[];
}

// Helper functions similar to the ones in libslic3r.h
function scale_(val: number): number {
  return Math.round(val * 1000000);
}

function unscale(val: number): number {
  return val / 1000000;
}

export class Point {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    if (typeof x === "number" && typeof y === "number") {
      // Handle double coordinates coming in
      this.x = Math.round(x);
      this.y = Math.round(y);
    } else {
      this.x = x;
      this.y = y;
    }
  }

  static new_scale(x: number, y: number): Point {
    return new Point(scale_(x), scale_(y));
  }

  static new_scale_from_point(p: Pointf): Point {
    return new Point(scale_(p.x), scale_(p.y));
  }

  equals(rhs: Point): boolean {
    return this.coincides_with(rhs);
  }

  toString(): string {
    return `POINT(${this.x} ${this.y})`;
  }

  wkt(): string {
    return `POINT(${this.x} ${this.y})`;
  }

  dump_perl(): string {
    return `[${this.x},${this.y}]`;
  }

  scale(factor: number): void {
    this.x *= factor;
    this.y *= factor;
  }

  translate(x: number, y: number): void;
  translate(vector: Vector): void;
  translate(xOrVector: number | Vector, y?: number): void {
    if (typeof xOrVector === "number" && typeof y === "number") {
      this.x += xOrVector;
      this.y += y;
    } else if (typeof xOrVector === "object") {
      this.translate(xOrVector.x, xOrVector.y);
    }
  }

  rotate(angle: number, center?: Point): void {
    if (center) {
      const curX = this.x;
      const curY = this.y;
      const s = Math.sin(angle);
      const c = Math.cos(angle);
      const dx = curX - center.x;
      const dy = curY - center.y;
      this.x = Math.round(center.x + c * dx - s * dy);
      this.y = Math.round(center.y + c * dy + s * dx);
    } else {
      const curX = this.x;
      const curY = this.y;
      const s = Math.sin(angle);
      const c = Math.cos(angle);
      this.x = Math.round(c * curX - s * curY);
      this.y = Math.round(c * curY + s * curX);
    }
  }

  rotated(angle: number, center?: Point): Point {
    const p = new Point(this.x, this.y);
    if (center) {
      p.rotate(angle, center);
    } else {
      p.rotate(angle);
    }
    return p;
  }

  coincides_with(point: Point): boolean {
    return this.x === point.x && this.y === point.y;
  }

  coincides_with_epsilon(point: Point): boolean {
    return (
      Math.abs(this.x - point.x) < SCALED_EPSILON &&
      Math.abs(this.y - point.y) < SCALED_EPSILON
    );
  }

  nearest_point_index(points: Point[] | Point[] | Point[]): number {
    let idx = -1;
    let distance = -1; // We use squared distance to avoid sqrt operations

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      // If the X distance is greater than the current min distance, skip
      let d = Math.pow(this.x - point.x, 2);
      if (distance !== -1 && d > distance) continue;

      // If the Y distance is greater than the current min distance, skip
      d += Math.pow(this.y - point.y, 2);
      if (distance !== -1 && d > distance) continue;

      idx = i;
      distance = d;

      if (distance < EPSILON) break;
    }

    return idx;
  }

  nearest_waypoint_index(points: Point[], dest: Point): number {
    let idx = -1;
    let distance = -1;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      // Distance from this to candidate
      let d = Math.pow(this.x - point.x, 2) + Math.pow(this.y - point.y, 2);

      // Distance from candidate to dest
      d += Math.pow(point.x - dest.x, 2) + Math.pow(point.y - dest.y, 2);

      // If the total distance is greater than current min, skip
      if (distance !== -1 && d > distance) continue;

      idx = i;
      distance = d;

      if (distance < EPSILON) break;
    }

    return idx;
  }

  nearest_point(points: Point[], point: Point): boolean {
    const idx = this.nearest_point_index(points);
    if (idx === -1) return false;

    Object.assign(point, points[idx]);
    return true;
  }

  nearest_waypoint(points: Point[], dest: Point, point: Point): boolean {
    const idx = this.nearest_waypoint_index(points, dest);
    if (idx === -1) return false;

    Object.assign(point, points[idx]);
    return true;
  }

  distance_to(point: Point): number;
  distance_to(line: Line): number;
  distance_to(pointOrLine: Point | Line): number {
    if ("x" in pointOrLine && "y" in pointOrLine) {
      // It's a point
      const point = pointOrLine as Point;
      const dx = point.x - this.x;
      const dy = point.y - this.y;
      return Math.sqrt(dx * dx + dy * dy);
    } else {
      // It's a line
      const line = pointOrLine as Line;
      const dx = line.b.x - line.a.x;
      const dy = line.b.y - line.a.y;

      const l2 = dx * dx + dy * dy; // Avoid a sqrt
      if (l2 === 0.0) return this.distance_to(line.a); // line.a == line.b case

      // Consider the line extending the segment, parameterized as line.a + t (line.b - line.a).
      // We find projection of this point onto the line.
      // It falls where t = [(this-line.a) . (line.b-line.a)] / |line.b-line.a|^2
      const t = ((this.x - line.a.x) * dx + (this.y - line.a.y) * dy) / l2;
      if (t < 0.0)
        return this.distance_to(line.a); // Beyond the 'a' end of the segment
      else if (t > 1.0) return this.distance_to(line.b); // Beyond the 'b' end of the segment

      const projection = new Point(line.a.x + t * dx, line.a.y + t * dy);
      return this.distance_to(projection);
    }
  }

  perp_distance_to(line: Line): number {
    if (line.a.coincides_with(line.b)) return this.distance_to(line.a);

    const n =
      (line.b.x - line.a.x) * (line.a.y - this.y) -
      (line.a.x - this.x) * (line.b.y - line.a.y);

    // Calculate line length
    const lineLength = Math.sqrt(
      Math.pow(line.b.x - line.a.x, 2) + Math.pow(line.b.y - line.a.y, 2),
    );

    return Math.abs(n) / lineLength;
  }

  ccw(p1: Point, p2: Point): number;
  ccw(line: Line): number;
  ccw(p1OrLine: Point | Line, p2?: Point): number {
    if ("a" in p1OrLine && "b" in p1OrLine) {
      // It's a line
      const line = p1OrLine as Line;
      return this.ccw(line.a, line.b);
    } else {
      // It's points
      const p1 = p1OrLine as Point;
      return (
        (p2!.x - p1.x) * (this.y - p1.y) - (p2!.y - p1.y) * (this.x - p1.x)
      );
    }
  }

  ccw_angle(p1: Point, p2: Point): number {
    let angle =
      Math.atan2(p1.x - this.x, p1.y - this.y) -
      Math.atan2(p2.x - this.x, p2.y - this.y);

    // Return only positive angles
    return angle <= 0 ? angle + 2 * PI : angle;
  }

  projection_onto(multiPointOrLine: MultiPoint | Line): Point {
    if ("a" in multiPointOrLine && "b" in multiPointOrLine) {
      // It's a line
      const line = multiPointOrLine as Line;
      if (line.a.coincides_with(line.b)) return line.a;

      // The projection of point onto the line can be represented as an affine combination
      // expressed as: projection = theta*line.a + (1.0-theta)*line.b
      const theta =
        ((line.b.x - this.x) * (line.b.x - line.a.x) +
          (line.b.y - this.y) * (line.b.y - line.a.y)) /
        (Math.pow(line.b.x - line.a.x, 2) + Math.pow(line.b.y - line.a.y, 2));

      if (0.0 <= theta && theta <= 1.0) {
        return new Point(
          theta * line.a.x + (1.0 - theta) * line.b.x,
          theta * line.a.y + (1.0 - theta) * line.b.y,
        );
      }

      // Else pick closest endpoint
      if (this.distance_to(line.a) < this.distance_to(line.b)) {
        return line.a;
      } else {
        return line.b;
      }
    } else {
      // It's a multipoint
      const poly = multiPointOrLine as MultiPoint;
      let running_projection = poly.first_point();
      let running_min = this.distance_to(running_projection);

      const lines = poly.lines();
      for (const line of lines) {
        const point_temp = this.projection_onto(line);
        if (this.distance_to(point_temp) < running_min) {
          running_projection = point_temp;
          running_min = this.distance_to(running_projection);
        }
      }
      return running_projection;
    }
  }

  negative(): Point {
    return new Point(-this.x, -this.y);
  }

  vector_to(point: Point): Vector {
    return new Vector(point.x - this.x, point.y - this.y);
  }

  align_to_grid(spacing: Point, base: Point = new Point(0, 0)): void {
    this.x = base.x + this.align_to_grid_coord(this.x - base.x, spacing.x);
    this.y = base.y + this.align_to_grid_coord(this.y - base.y, spacing.y);
  }

  private align_to_grid_coord(coord: number, spacing: number): number {
    // Align a coordinate to a grid
    assert(spacing > 0);
    return coord < 0
      ? Math.floor((coord - spacing + 1) / spacing) * spacing
      : Math.floor(coord / spacing) * spacing;
  }
}

// Alias for Vector (same as in C++ code)
export type Vector = Point;

// Helper assertion function
function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

// Point operators
export function add(point1: Point, point2: Point): Point {
  return new Point(point1.x + point2.x, point1.y + point2.y);
}

export function subtract(point1: Point, point2: Point): Point {
  return new Point(point1.x - point2.x, point1.y - point2.y);
}

export function multiply(scalar: number, point: Point): Point {
  return new Point(scalar * point.x, scalar * point.y);
}

export class Point3 extends Point {
  z: number;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    super(x, y);
    this.z = z;
  }

  coincides_with(point: Point3): boolean {
    return this.x === point.x && this.y === point.y && this.z === point.z;
  }
}

// Alias for Vector3 (same as in C++ code)
export type Vector3 = Point3;

export class Pointf {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  static new_unscale(x: number, y: number): Pointf {
    return new Pointf(unscale(x), unscale(y));
  }

  static new_unscale_from_point(p: Point): Pointf {
    return new Pointf(unscale(p.x), unscale(p.y));
  }

  toString(): string {
    return `${this.x},${this.y}`;
  }

  wkt(): string {
    return `POINT(${this.x} ${this.y})`;
  }

  dump_perl(): string {
    return `[${this.x},${this.y}]`;
  }

  equals(rhs: Pointf): boolean {
    return this.coincides_with_epsilon(rhs);
  }

  coincides_with_epsilon(rhs: Pointf): boolean {
    return (
      Math.abs(this.x - rhs.x) < EPSILON && Math.abs(this.y - rhs.y) < EPSILON
    );
  }

  divideEquals(scalar: number): Pointf {
    this.x /= scalar;
    this.y /= scalar;
    return this;
  }

  scale(factor: number): void {
    this.x *= factor;
    this.y *= factor;
  }

  translate(x: number, y: number): void;
  translate(vector: Vectorf): void;
  translate(xOrVector: number | Vectorf, y?: number): void {
    if (typeof xOrVector === "number" && typeof y === "number") {
      this.x += xOrVector;
      this.y += y;
    } else if (typeof xOrVector === "object") {
      this.translate(xOrVector.x, xOrVector.y);
    }
  }

  rotate(angle: number, center?: Pointf): void {
    if (center) {
      const curX = this.x;
      const curY = this.y;
      const s = Math.sin(angle);
      const c = Math.cos(angle);
      this.x = center.x + c * (curX - center.x) - s * (curY - center.y);
      this.y = center.y + c * (curY - center.y) + s * (curX - center.x);
    } else {
      const curX = this.x;
      const curY = this.y;
      const s = Math.sin(angle);
      const c = Math.cos(angle);
      this.x = c * curX - s * curY;
      this.y = c * curY + s * curX;
    }
  }

  negative(): Pointf {
    return new Pointf(-this.x, -this.y);
  }

  vector_to(point: Pointf): Vectorf {
    return new Vectorf(point.x - this.x, point.y - this.y);
  }
}

// Alias for Vectorf (same as in C++ code)
export type Vectorf = Pointf;

// Pointf operators
export function pointfAdd(point1: Pointf, point2: Pointf): Pointf {
  return new Pointf(point1.x + point2.x, point1.y + point2.y);
}

export function pointfDivide(point: Pointf, scalar: number): Pointf {
  return new Pointf(point.x / scalar, point.y / scalar);
}

export class Pointf3 extends Pointf {
  z: number;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    super(x, y);
    this.z = z;
  }

  static new_unscale(x: number, y: number, z: number): Pointf3 {
    return new Pointf3(unscale(x), unscale(y), unscale(z));
  }

  toString(): string {
    return `${this.x},${this.y},${this.z}`;
  }

  override scale(factor: number): void {
    super.scale(factor);
    this.z *= factor;
  }

  translate(x: number, y: number, z: number): void;
  translate(vector: Vectorf3): void;
  translate(xOrVector: number | Vectorf3, y?: number, z?: number): void {
    if (
      typeof xOrVector === "number" &&
      typeof y === "number" &&
      typeof z === "number"
    ) {
      super.translate(xOrVector, y);
      this.z += z;
    } else if (typeof xOrVector === "object") {
      this.translate(xOrVector.x, xOrVector.y, xOrVector.z);
    }
  }

  distance_to(point: Pointf3): number {
    const dx = point.x - this.x;
    const dy = point.y - this.y;
    const dz = point.z - this.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  override negative(): Pointf3 {
    return new Pointf3(-this.x, -this.y, -this.z);
  }

  vector_to(point: Pointf3): Vectorf3 {
    return new Vectorf3(point.x - this.x, point.y - this.y, point.z - this.z);
  }
}

// Alias for Vectorf3 (same as in C++ code)
export type Vectorf3 = Pointf3;

// Utility function to convert to Points
export function to_points<T extends { points: Point[] }>(items: T[]): Point[] {
  const points: Point[] = [];
  for (const item of items) {
    points.push(...item.points);
  }
  return points;
}

// Utility function to scale points
export function scale_points(points: Pointf[]): Point[] {
  const out: Point[] = [];
  for (const p of points) {
    out.push(new Point(scale_(p.x), scale_(p.y)));
  }
  return out;
}
