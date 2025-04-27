import { Polygons } from "./Polygons.ts";
import { Points } from "three";

export class ExPolygon {
  contour: Polygon;
  holes: Polygons;

  constructor(contour: Polygon);
  constructor(contour: Points);
  constructor(contour: Points, hole: Points);
  constructor(contourOrPoints: Polygon | Points, hole?: Points) {}
}
