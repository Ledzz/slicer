import { Pointf3, Vectorf3 } from "./Point.ts";
import { Axis } from "./axis.ts";

export class TransformationMatrix {
  constructor(
    public m00 = 1,
    public m01 = 0,
    public m02 = 0,
    public m03 = 0,
    public m10 = 0,
    public m11 = 1,
    public m12 = 0,
    public m13 = 0,
    public m20 = 0,
    public m21 = 0,
    public m22 = 1,
    public m23 = 0,
  ) {}

  determinante() {
    return (
      this.m00 * (this.m11 * this.m22 - this.m12 * this.m21) -
      this.m01 * (this.m10 * this.m22 - this.m12 * this.m20) +
      this.m02 * (this.m10 * this.m21 - this.m11 * this.m20)
    );
  }

  inverse() {
    const det = this.determinante();
    if (det === 0) {
      throw new Error("Matrix is not invertible");
    }
    const invDet = 1 / det;

    return new TransformationMatrix(
      (this.m11 * this.m22 - this.m12 * this.m21) * invDet,
      (this.m02 * this.m21 - this.m01 * this.m22) * invDet,
      (this.m01 * this.m12 - this.m02 * this.m11) * invDet,
      0,
      (this.m12 * this.m20 - this.m10 * this.m22) * invDet,
      (this.m00 * this.m22 - this.m02 * this.m20) * invDet,
      (this.m02 * this.m10 - this.m00 * this.m12) * invDet,
      0,
      (this.m10 * this.m21 - this.m11 * this.m20) * invDet,
      (this.m01 * this.m20 - this.m00 * this.m21) * invDet,
      (this.m00 * this.m11 - this.m01 * this.m10) * invDet,
      0,
    );
  }

  copy(right: TransformationMatrix) {
    this.m00 = right.m00;
    this.m01 = right.m01;
    this.m02 = right.m02;
    this.m03 = right.m03;
    this.m10 = right.m10;
    this.m11 = right.m11;
    this.m12 = right.m12;
    this.m13 = right.m13;
    this.m20 = right.m20;
    this.m21 = right.m21;
    this.m22 = right.m22;
    this.m23 = right.m23;
  }

  applyLeft(left: TransformationMatrix) {
    this.copy(TransformationMatrix.multiply(left, this));
  }

  multiplyLeft(left: TransformationMatrix) {
    return TransformationMatrix.multiply(left, this);
  }

  applyRight(right: TransformationMatrix) {
    this.copy(TransformationMatrix.multiply(this, right));
  }
  multiplyRight(right: TransformationMatrix) {
    return TransformationMatrix.multiply(this, right);
  }

  transform(point: Pointf3, w: number): Pointf3 {
    return new Pointf3(
      point.x * this.m00 +
        point.y * this.m01 +
        point.z * this.m02 +
        this.m03 * w,
      point.x * this.m10 +
        point.y * this.m11 +
        point.z * this.m12 +
        this.m13 * w,
      point.x * this.m20 +
        point.y * this.m21 +
        point.z * this.m22 +
        this.m23 * w,
    );
  }

  static mat_eye() {
    return new TransformationMatrix();
  }

  static multiply(left: TransformationMatrix, right: TransformationMatrix) {
    return new TransformationMatrix(
      left.m00 * right.m00 + left.m01 * right.m10 + left.m02 * right.m20,
      left.m00 * right.m01 + left.m01 * right.m11 + left.m02 * right.m21,
      left.m00 * right.m02 + left.m01 * right.m12 + left.m02 * right.m22,
      left.m00 * right.m03 +
        left.m01 * right.m13 +
        left.m02 * right.m23 +
        left.m03,

      left.m10 * right.m00 + left.m11 * right.m10 + left.m12 * right.m20,
      left.m10 * right.m01 + left.m11 * right.m11 + left.m12 * right.m21,
      left.m10 * right.m02 + left.m11 * right.m12 + left.m12 * right.m22,
      left.m10 * right.m03 +
        left.m11 * right.m13 +
        left.m12 * right.m23 +
        left.m13,

      left.m20 * right.m00 + left.m21 * right.m10 + left.m22 * right.m20,
      left.m20 * right.m01 + left.m21 * right.m11 + left.m22 * right.m21,
      left.m20 * right.m02 + left.m21 * right.m12 + left.m22 * right.m22,
      left.m20 * right.m03 +
        left.m21 * right.m13 +
        left.m22 * right.m23 +
        left.m23,
    );
  }

  static mat_translation(vector: Vectorf3): TransformationMatrix;
  static mat_translation(x: number, y: number, z: number): TransformationMatrix;
  static mat_translation(
    xOrVector: number | Vectorf3,
    y?: number,
    z?: number,
  ): TransformationMatrix {
    const isNumber = typeof xOrVector === "number";
    return new TransformationMatrix(
      1.0,
      0.0,
      0.0,
      isNumber ? xOrVector : xOrVector.x,
      0.0,
      1.0,
      0.0,
      isNumber ? y : xOrVector.y,
      0.0,
      0.0,
      1.0,
      isNumber ? z : xOrVector.z,
    );
  }

  static mat_scale(x: number, y: number, z: number): TransformationMatrix {
    return new TransformationMatrix(
      x,
      0.0,
      0.0,
      0.0,
      0.0,
      y,
      0.0,
      0.0,
      0.0,
      0.0,
      z,
      0.0,
    );
  }

  static mat_rotation(angle_rad: number, axis: Axis) {
    const s = Math.sin(angle_rad);
    const c = Math.cos(angle_rad);
    switch (axis) {
      case "x":
        return new TransformationMatrix(1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0);
      case "y":
        return new TransformationMatrix(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0);
      case "z":
        return new TransformationMatrix(
          c,
          -s,
          0,
          0,
          s,
          c,
          0,
          0,
          0,
          0,
          1.0,
          0.0,
        );
    }
  }

  static mat_rotation_quaternion(
    q1: number,
    q2: number,
    q3: number,
    q4: number,
  ) {
    let factor = q1 * q1 + q2 * q2 + q3 * q3 + q4 * q4;
    if (Math.abs(factor - 1) > 1e-12) {
      factor = 1 / Math.sqrt(factor);
      q1 *= factor;
      q2 *= factor;
      q3 *= factor;
      q4 *= factor;
    }

    return new TransformationMatrix(
      1 - 2 * (q3 * q3 + q4 * q4),
      2 * (q2 * q3 - q1 * q4),
      2 * (q2 * q4 + q1 * q3),
      0,
      2 * (q2 * q3 + q1 * q4),
      1 - 2 * (q2 * q2 + q4 * q4),
      2 * (q3 * q4 - q1 * q2),
      0,
      2 * (q2 * q4 - q1 * q3),
      2 * (q3 * q4 + q1 * q2),
      1 - 2 * (q2 * q2 + q3 * q3),
      0,
    );
  }

  static mat_mirror(axis: Axis) {
    const m = new TransformationMatrix();
    switch (axis) {
      case "x":
        m.m00 = -1;
        break;
      case "y":
        m.m11 = -1;
        break;
      case "z":
        m.m22 = -1;
        break;
    }
    return m;
  }
}
