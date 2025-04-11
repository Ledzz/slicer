import { CrossSection, Manifold, SimplePolygon } from "manifold-3d";
import { Box3, BufferGeometry, Group } from "three";

export type SliceLayer = {
  height: number;
  line: Group;
  polygons: SimplePolygon[];
  crossection: CrossSection;
};

export type SliceResult = {
  manifold: Manifold;
  layers: SliceLayer[];
  geometry: BufferGeometry;
  bounds: Box3;
  layerHeight: number;
};

export type Support = {};
