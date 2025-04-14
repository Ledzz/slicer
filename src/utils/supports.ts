import * as Module from "../../wasm/wasm_app.js";

console.log(Module);
// import { SliceResult, Support } from "./types.ts";
// import {
//   Box3,
//   BufferGeometry,
//   Line,
//   LineBasicMaterial,
//   MathUtils,
//   Mesh,
//   Ray,
//   Raycaster,
//   Scene,
//   Vector3,
// } from "three";
//
// const zAxis = new Vector3(0, 0, 1);
// const zDown = new Vector3(0, 0, -1);
// const overhangAngle = 45;
// const raycasterRange = 0.1;
// const supportResolution = 1;
//
export const generateSupports = () => {};
// export const generateSupports = (sliceResult: SliceResult, scene: Scene) => {
//   const { geometry } = sliceResult;
//   // determine the support points
//   const raycaster = new Raycaster(undefined, undefined, 0, raycasterRange);
//   const object = new Mesh(geometry);
//   // scene?.add(object);
//
//   // const geometry = originalGeometry.clone().rotateX(-Math.PI / 2);
//   const positions = geometry.attributes.position.array;
//   const numFaces = positions.length / 9; // 3 vertices * 3 components (x, y, z)
//
//   const facesToSupport: [Vector3, Vector3, Vector3][] = [];
//
//   const supportBounds = new Box3();
//
//   for (let i = 0; i < numFaces; i++) {
//     const a = i * 9;
//     const b = i * 9 + 3;
//     const c = i * 9 + 6;
//
//     const vertexA = new Vector3(
//       positions[a],
//       positions[a + 1],
//       positions[a + 2],
//     );
//     const vertexB = new Vector3(
//       positions[b],
//       positions[b + 1],
//       positions[b + 2],
//     );
//     const vertexC = new Vector3(
//       positions[c],
//       positions[c + 1],
//       positions[c + 2],
//     );
//     // if (vertexA.z === 0 || vertexB.z === 0 || vertexC.z === 0) {
//     //   continue;
//     // }
//
//     const ab = new Vector3().subVectors(vertexB, vertexA);
//     const ac = new Vector3().subVectors(vertexC, vertexA);
//     const normal = new Vector3().crossVectors(ab, ac).normalize();
//     const angleDegrees = MathUtils.radToDeg(Math.acos(normal.dot(zAxis)));
//     if (overhangAngle < angleDegrees) {
//       raycaster.set(vertexA, zDown);
//       supportBounds.expandByPoint(vertexA);
//       supportBounds.expandByPoint(vertexB);
//       supportBounds.expandByPoint(vertexC);
//       facesToSupport.push([vertexA, vertexB, vertexC]);
//       // const intersections = raycaster
//       //   .intersectObject(object)
//       //   .filter((i) => i.point.z > 0);
//       // if (intersections.length) {
//       //   continue;
//       // }
//
//       // if (scene) {
//       //   const helper = new ArrowHelper(
//       //     raycaster.ray.direction,
//       //     raycaster.ray.origin,
//       //     1,
//       //     0xff,
//       //   );
//       //   helper.position.copy(raycaster.ray.origin);
//       //   scene.add(helper);
//       // }
//     }
//   }
//   const intersection = new Vector3();
//   for (
//     let x = supportBounds.min.x;
//     x < supportBounds.max.x;
//     x += supportResolution
//   ) {
//     for (
//       let y = supportBounds.min.y;
//       y < supportBounds.max.y;
//       y += supportResolution
//     ) {
//       const pointOnSurface = new Vector3(x, y, 0);
//       const ray = new Ray(pointOnSurface, zAxis);
//       facesToSupport.forEach((face) => {
//         const [vertexA, vertexB, vertexC] = face;
//         ray.intersectTriangle(vertexA, vertexB, vertexC, true, intersection);
//         if (intersection.z <= 0) {
//           return;
//         }
//
//         // Generate support point
//         // if (scene) {
//         //   const helper = new ArrowHelper(
//         //     raycaster.ray.direction,
//         //     raycaster.ray.origin,
//         //     1,
//         //     0xff,
//         //   );
//         //   helper.position.copy(intersection);
//         //   scene.add(helper);
//         // }
//       });
//     }
//   }
//
//   return generateSupportAtPoint(new Vector3(1, 0, 20), sliceResult);
// };
//
// export const generateSupportAtPoint = (
//   point: Vector3,
//   sliceResult: SliceResult,
// ): Support => {
//   const material = new LineBasicMaterial({
//     color: 0xff0000,
//     linewidth: 1,
//   });
//   const geometry = new BufferGeometry().setFromPoints([
//     point,
//     new Vector3(point.x, point.y, 0),
//   ]);
//   const line = new Line(geometry, material);
//   return line;
// };
// Basic interfaces for the support structure implementation
