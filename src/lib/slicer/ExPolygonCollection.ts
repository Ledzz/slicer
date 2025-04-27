import { ExPolygon } from "./ExPolygon.ts";

export class ExPolygonCollection {
  expolygons: ExPolygon[];

  constructor(polygonOrPolygons: ExPolygon | ExPolygon[]) {
    if (Array.isArray(polygonOrPolygons)) {
      this.expolygons = polygonOrPolygons;
    } else {
      this.expolygons = [polygonOrPolygons];
    }
  }
}
