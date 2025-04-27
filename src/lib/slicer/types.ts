import {
  ModelInstance,
  ModelMaterial,
  ModelObject,
  ModelVolume,
} from "./Model.ts";
import { LayerRegion } from "./Layer.ts";

export type LayerRegionPtrs = LayerRegion[]; // Helper types for collections
export type t_model_material_id = string;
type t_model_material_attribute = string;
export type t_model_material_attributes = Map<
  t_model_material_attribute,
  string
>;
type t_layer_height_range = [number, number];
export type t_layer_height_ranges = Map<t_layer_height_range, number>;
export type ModelMaterialMap = Map<t_model_material_id, ModelMaterial>;
export type ModelObjectPtrs = Array<ModelObject>;
export type ModelVolumePtrs = Array<ModelVolume>;
export type ModelInstancePtrs = Array<ModelInstance>;

export enum PrintObjectStep {
  posLayers,
  posSlice,
  posPerimeters,
  posDetectSurfaces,
  posPrepareInfill,
  posInfill,
  posSupportMaterial,
}

export type LayerPtrs = Layer[];
export type SupportLayerPtrs = SupportLayer[];
export type Percent = number;
export type FloatOrPercent = number;
export type Float = number;
export type Int = number;
export type Floats = number[];
export type Strings = string[];

export enum SeamPosition {
  spRandom,
  spNearest,
  spAligned,
  spRear,
}

export enum SupportMaterialPattern {
  smpRectilinear,
  smpRectilinearGrid,
  smpHoneycomb,
  smpPillars,
}

export enum InfillPattern {
  ipRectilinear,
  ipGrid,
  ipAlignedRectilinear,
  ipTriangles,
  ipStars,
  ipCubic,
  ipConcentric,
  ipHoneycomb,
  ip3DHoneycomb,
  ipGyroid,
  ipHilbertCurve,
  ipArchimedeanChords,
  ipOctagramSpiral,
}

export enum GCodeFlavor {
  gcfRepRap,
  gcfTeacup,
  gcfMakerWare,
  gcfSailfish,
  gcfMach3,
  gcfMachinekit,
  gcfNoExtrusion,
  gcfSmoothie,
  gcfRepetier,
}

/// Enumeration for different flow roles
export enum FlowRole {
  frExternalPerimeter = 0b1,
  frPerimeter = 0b10,
  frInfill = 0b100,
  frSolidInfill = 0b1000,
  frTopSolidInfill = 0b10000,
  frSupportMaterial = 0b100000,
  frSupportMaterialInterface = 0b1000000,
}
