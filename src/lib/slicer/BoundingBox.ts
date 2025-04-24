import { Point, Point3 } from "./Point";
import { Line } from "three";

export class BoundingBoxBase<T extends Point> {
  min: T;
  max: T;
  defined: boolean;

  constructor();
  constructor(points: T[]);
  constructor(min: T, max: T);
  constructor(arg1?: T[] | T, arg2?: T) {
    this.defined = false;

    if (arg1 === undefined) {
      // Default constructor
      return;
    }

    if (arg2 !== undefined) {
      // Constructor with min/max points
      const min = arg1 as T;
      const max = arg2;
      this.min = min;
      this.max = max;
      this.defined = min.x < max.x && min.y < max.y;
      return;
    }

    if (Array.isArray(arg1)) {
      // Constructor with points array
      const points = arg1;
      if (points.length === 0) {
        throw new Error(
          "Empty point set supplied to BoundingBoxBase constructor",
        );
      }

      const it = points[0];
      this.min = { ...it } as T;
      this.max = { ...it } as T;

      for (let i = 1; i < points.length; i++) {
        const point = points[i];
        this.min.x = Math.min(point.x, this.min.x);
        this.min.y = Math.min(point.y, this.min.y);
        this.max.x = Math.max(point.x, this.max.x);
        this.max.y = Math.max(point.y, this.max.y);
      }

      this.defined = true;
    }
  }

  merge(arg: T | T[] | BoundingBoxBase<T>): void {
    // Merge with a single point
    if ("x" in arg && "y" in arg) {
      const point = arg as T;
      if (this.defined) {
        this.min.x = Math.min(point.x, this.min.x);
        this.min.y = Math.min(point.y, this.min.y);
        this.max.x = Math.max(point.x, this.max.x);
        this.max.y = Math.max(point.y, this.max.y);
      } else {
        this.min = { ...point } as T;
        this.max = { ...point } as T;
        this.defined = true;
      }
      return;
    }

    // Merge with an array of points
    if (Array.isArray(arg)) {
      const points = arg as T[];
      this.merge(new BoundingBoxBase<T>(points));
      return;
    }

    // Merge with another bounding box
    const bb = arg as BoundingBoxBase<T>;
    if (this.defined) {
      this.min.x = Math.min(bb.min.x, this.min.x);
      this.min.y = Math.min(bb.min.y, this.min.y);
      this.max.x = Math.max(bb.max.x, this.max.x);
      this.max.y = Math.max(bb.max.y, this.max.y);
    } else {
      this.min = { ...bb.min } as T;
      this.max = { ...bb.max } as T;
      this.defined = true;
    }
  }

  scale(factor: number): void {
    if ("scale" in this.min) {
      this.min.scale(factor);
      this.max.scale(factor);
    } else {
      // Fallback if scale method is not available
      this.min.x *= factor;
      this.min.y *= factor;
      this.max.x *= factor;
      this.max.y *= factor;
    }
  }

  size(): T {
    return {
      x: this.max.x - this.min.x,
      y: this.max.y - this.min.y,
    } as T;
  }

  radius(): number {
    const x = this.max.x - this.min.x;
    const y = this.max.y - this.min.y;
    return 0.5 * Math.sqrt(x * x + y * y);
  }

  translate(x: number, y: number): void {
    if ("translate" in this.min) {
      this.min.translate(x, y);
      this.max.translate(x, y);
    } else {
      // Fallback if translate method is not available
      this.min.x += x;
      this.min.y += y;
      this.max.x += x;
      this.max.y += y;
    }
  }

  offset(delta: number): void {
    this.min.translate(-delta, -delta, -delta);
    this.max.translate(delta, delta, delta);
  }

  center(): T {
    return {
      x: (this.max.x + this.min.x) / 2,
      y: (this.max.y + this.min.y) / 2,
    } as T;
  }

  contains(point: T): boolean {
    return (
      point.x >= this.min.x &&
      point.x <= this.max.x &&
      point.y >= this.min.y &&
      point.y <= this.max.y
    );
  }
}

export class BoundingBox3Base<T extends Point3> extends BoundingBoxBase<T> {
  constructor();
  constructor(points: T[]);
  constructor(min: T, max: T);
  constructor(arg1?: T[] | T, arg2?: T) {
    if (arg1 === undefined) {
      super();
      return;
    }

    if (arg2 !== undefined) {
      super(arg1 as T, arg2);
      if ((arg1 as T).z >= arg2.z) {
        this.defined = false;
      }
      return;
    }

    if (Array.isArray(arg1)) {
      super(arg1);
      if (arg1.length === 0) {
        throw new Error(
          "Empty point set supplied to BoundingBox3Base constructor",
        );
      }

      const it = arg1[0];
      this.min.z = it.z;
      this.max.z = it.z;

      for (let i = 1; i < arg1.length; i++) {
        const point = arg1[i];
        this.min.z = Math.min(point.z, this.min.z);
        this.max.z = Math.max(point.z, this.max.z);
      }
    }
  }

  override merge(arg: T | T[] | BoundingBox3Base<T>): void {
    // Merge with a single point
    if ("x" in arg && "y" in arg && "z" in arg) {
      const point = arg as T;
      if (this.defined) {
        this.min.z = Math.min(point.z, this.min.z);
        this.max.z = Math.max(point.z, this.max.z);
      }
      super.merge(point);
      return;
    }

    // Merge with an array of points
    if (Array.isArray(arg)) {
      const points = arg as T[];
      this.merge(new BoundingBox3Base<T>(points));
      return;
    }

    // Merge with another bounding box
    const bb = arg as BoundingBox3Base<T>;
    if (this.defined) {
      this.min.z = Math.min(bb.min.z, this.min.z);
      this.max.z = Math.max(bb.max.z, this.max.z);
    }
    super.merge(bb);
  }

  override size(): T {
    const size = super.size() as T;
    size.z = this.max.z - this.min.z;
    return size;
  }

  override radius(): number {
    const x = this.max.x - this.min.x;
    const y = this.max.y - this.min.y;
    const z = this.max.z - this.min.z;
    return 0.5 * Math.sqrt(x * x + y * y + z * z);
  }

  translate(x: number, y: number, z: number): void {
    if ("translate" in this.min) {
      this.min.translate(x, y, z);
      this.max.translate(x, y, z);
    } else {
      // Fallback if translate method is not available
      this.min.x += x;
      this.min.y += y;
      this.min.z += z;
      this.max.x += x;
      this.min.y += y;
      this.max.z += z;
    }
  }

  override offset(delta: number): void {
    this.min.translate(-delta, -delta, -delta);
    this.max.translate(delta, delta, delta);
  }

  override center(): T {
    const center = super.center() as T;
    center.z = (this.max.z + this.min.z) / 2;
    return center;
  }
}

// Polygon interface for BoundingBox
interface Polygon {
  points: Point[];
}

export class BoundingBox extends BoundingBoxBase<Point> {
  constructor();
  constructor(min: Point, max: Point);
  constructor(points: Point[]);
  constructor(lines: Line[]);
  constructor(arg1?: Point[] | Point | Line[], arg2?: Point) {
    if (arg1 === undefined) {
      super();
      return;
    }

    if (arg2 !== undefined) {
      super(arg1 as Point, arg2);
      return;
    }

    if (Array.isArray(arg1)) {
      // Check if this is an array of lines by checking the first element
      if (arg1.length > 0 && "a" in arg1[0] && "b" in arg1[0]) {
        const lines = arg1 as Line[];
        const points: Point[] = [];
        for (const line of lines) {
          points.push(line.a);
          points.push(line.b);
        }
        super(points);
      } else {
        // It's an array of points
        super(arg1 as Point[]);
      }
    }
  }

  polygon(): Polygon {
    const poly: Polygon = { points: [] };
    this.polygonToRef(poly);
    return poly;
  }

  polygonToRef(polygon: Polygon): void {
    polygon.points = [];
    polygon.points.push({ x: this.min.x, y: this.min.y });
    polygon.points.push({ x: this.max.x, y: this.min.y });
    polygon.points.push({ x: this.max.x, y: this.max.y });
    polygon.points.push({ x: this.min.x, y: this.max.y });
  }

  rotated(angle: number, center?: Point): BoundingBox {
    const out = new BoundingBox();

    if (center) {
      out.merge(this.min.rotated(angle, center));
      out.merge(this.max.rotated(angle, center));
      out.merge({
        x: this.min.x,
        y: this.max.y,
      } as Point);
      out.merge({
        x: this.max.x,
        y: this.min.y,
      } as Point);
    } else {
      out.merge(this.min.rotated(angle));
      out.merge(this.max.rotated(angle));
      out.merge({
        x: this.min.x,
        y: this.max.y,
      } as Point);
      out.merge({
        x: this.max.x,
        y: this.min.y,
      } as Point);
    }

    return out;
  }

  rotate(angle: number, center?: Point): void {
    if (center) {
      const rotated = this.rotated(angle, center);
      this.min = rotated.min;
      this.max = rotated.max;
    } else {
      const rotated = this.rotated(angle);
      this.min = rotated.min;
      this.max = rotated.max;
    }
  }
}

export class BoundingBoxf extends BoundingBoxBase<Point> {
  constructor();
  constructor(min: Point, max: Point);
  constructor(points: Point[]);
  constructor(arg1?: Point[] | Point, arg2?: Point) {
    if (arg1 === undefined) {
      super();
      return;
    }

    if (arg2 !== undefined) {
      super(arg1 as Point, arg2);
      return;
    }

    if (Array.isArray(arg1)) {
      super(arg1);
    }
  }
}

export class BoundingBoxf3 extends BoundingBox3Base<Point3> {
  constructor();
  constructor(min: Point3, max: Point3);
  constructor(points: Point3[]);
  constructor(arg1?: Point3[] | Point3, arg2?: Point3) {
    if (arg1 === undefined) {
      super();
      return;
    }

    if (arg2 !== undefined) {
      super(arg1 as Point3, arg2);
      return;
    }

    if (Array.isArray(arg1)) {
      super(arg1);
    }
  }
}
