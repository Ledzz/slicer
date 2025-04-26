import { ModelObject, t_layer_height_ranges } from "./Model.ts";
import { BoundingBoxf3 } from "./BoundingBox.ts";
import { LayerHeightSpline } from "./LayerHeightSpline.ts";
import { Point, Point3 } from "./Point.ts";
import { Points } from "three";

export class Print {
  objects: PrintObject[];
  defaultObjectConfig: PrintObjectConfig;

  add_model_object(modelObject: ModelObject) {}
}

enum PrintObjectStep {
  posLayers,
  posSlice,
  posPerimeters,
  posDetectSurfaces,
  posPrepareInfill,
  posInfill,
  posSupportMaterial,
}

type LayerPtrs = Layer[];
type SupportLayerPtrs = SupportLayer[];

class PrintState<StepType> {
  started = new Set<StepType>();
  done = new Set<StepType>();

  is_started(step: StepType): boolean {}
  is_done(step: StepType): boolean {}
  set_started(step: StepType) {}
  set_done(step: StepType) {}
  invalidate(step: StepType): boolean {}
}

export class PrintObject {
  /// map of (vectors of volume ids), indexed by region_id
  /// (we use map instead of vector so that we don't have to worry about
  /// resizing it and the [] operator adds new items automagically)
  region_volumes: Map<number, number[]> = new Map();
  config: PrintObjectConfig;
  layer_height_ranges: t_layer_height_ranges;
  layer_height_spline: LayerHeightSpline;
  /// this is set to true when LayerRegion->slices is split in top/internal/bottom
  /// so that next call to make_perimeters() performs a union() before computing loops
  typed_slices: boolean;
  size: Point3; //< XYZ in scaled coordinates

  // scaled coordinates to add to copies (to compensate for the alignment
  // operated when creating the object but still preserving a coherent API
  // for external callers)
  _copies_shift: Point;

  // Slic3r::Point objects in scaled G-code coordinates in our coordinates
  _shifted_copies: Points;

  layers: LayerPtrs;
  support_layers: SupportLayerPtrs;
  // TODO: Fill* fill_maker        => (is => 'lazy');
  state: PrintState<PrintObjectStep>;

  private _print: Print;
  private _model_object: ModelObject;
  private _copies: Points; // Slic3r::Point objects in scaled G-code coordinates

  constructor(
    print: Print,
    model_object: ModelObject,
    modobj_bbox: BoundingBoxf3,
  ) {}
  // 1) Decides Z positions of the layers,
  // 2) Initializes layers and their regions
  // 3) Slices the object meshes
  // 4) Slices the modifier meshes and reclassifies the slices of the object meshes by the slices of the modifier meshes
  // 5) Applies size compensation (offsets the slices in XY plane)
  // 6) Replaces bad slices by the slices reconstructed from the upper/lower layer
  _slice() {
    const raft_height = 0;
    // coordf_t first_layer_height = this->config.first_layer_height.get_abs_value(this->config.layer_height.value);
    const first_layer_height = this.config.first_layer_height;
    let id = 0;
    if (this.config.raft_layers > 0) {
    }
    // Initialize layers and their slice heights.
    const slice_zs: number[] = [];
    this.clear_layers();
    // All print_z values for this object, without the raft.
    const object_layers = this.generate_object_layers(first_layer_height);
    let lo = raft_height;
    let hi = lo;
    let prev: Layer = null;
    for (let i_layer = 0; i_layer < object_layers.length; i_layer++) {
      lo = hi;
      hi = object_layers[i_layer] + raft_height;
      const slice_z = 0.5 * (lo + hi) - raft_height;
      const layer = this.add_layer(id++, hi - lo, hi, slice_z);
      slice_zs.push(slice_z);
      if (prev) {
        prev.upper_layer = layer;
        layer.lower_layer = prev;
      }
      // Make sure all layers contain layer region objects for all regions.
      for (
        let region_id = 0;
        region_id < this._print.regions.length;
        region_id++
      ) {
        layer.add_region(this.print().regions[region_id]);
      }
      prev = layer;

      if (this.print().regions.length === 1) {
        // Optimized for a single region. Slice the single non-modifier mesh.
        // PrintObject.cpp:819
      }
    }
  }
}
type Percent = number;
type FloatOrPercent = number;
type Float = number;
type Int = number;
type Floats = number[];
type Strings = string[];

enum SeamPosition {
  spRandom,
  spNearest,
  spAligned,
  spRear,
}
enum SupportMaterialPattern {
  smpRectilinear,
  smpRectilinearGrid,
  smpHoneycomb,
  smpPillars,
}

enum InfillPattern {
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
enum GCodeFlavor {
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
export class PrintObjectConfig {
  adaptive_slicing: boolean;
  adaptive_slicing_quality: Percent;
  dont_support_bridges: boolean;
  extrusion_width: FloatOrPercent;
  first_layer_height: FloatOrPercent;
  infill_only_where_needed: boolean;
  interface_shells: boolean;
  layer_height: Float;
  match_horizontal_surfaces: boolean;
  raft_layers: Int;
  regions_overlap: Float;
  seam_position: SeamPosition;
  support_material: boolean;
  support_material_angle: Int;
  support_material_buildplate_only: boolean;
  support_material_contact_distance: Float;
  support_material_max_layers: Int;
  support_material_enforce_layers: Int;
  support_material_extruder: Int;
  support_material_extrusion_width: FloatOrPercent;
  support_material_interface_extruder: Int;
  support_material_interface_extrusion_width: FloatOrPercent;
  support_material_interface_layers: Int;
  support_material_interface_spacing: Float;
  support_material_interface_speed: FloatOrPercent;
  support_material_pattern: SupportMaterialPattern;
  support_material_pillar_size: Float;
  support_material_pillar_spacing: Float;
  support_material_spacing: Float;
  support_material_speed: Float;
  support_material_threshold: FloatOrPercent;
  xy_size_compensation: Float;
  sequential_print_priority: Int;
}

export class PrintRegionConfig {
  bottom_infill_pattern: InfillPattern;
  bottom_solid_layers: Int;
  bridge_flow_ratio: Float;
  bridge_speed: Float;
  external_perimeter_extrusion_width: FloatOrPercent;
  external_perimeter_speed: FloatOrPercent;
  external_perimeters_first: boolean;
  extra_perimeters: boolean;
  fill_angle: Float;
  fill_density: Percent;
  fill_gaps: boolean;
  fill_pattern: InfillPattern;
  gap_fill_speed: FloatOrPercent;
  infill_extruder: Int;
  infill_extrusion_width: FloatOrPercent;
  infill_every_layers: Int;
  infill_overlap: FloatOrPercent;
  infill_speed: Float;
  min_shell_thickness: Float;
  min_top_bottom_shell_thickness: Float;
  overhangs: boolean;
  perimeter_extruder: Int;
  perimeter_extrusion_width: FloatOrPercent;
  perimeter_speed: Float;
  perimeters: Int;
  small_perimeter_speed: FloatOrPercent;
  solid_infill_below_area: Float;
  solid_infill_extruder: Int;
  solid_infill_extrusion_width: FloatOrPercent;
  solid_infill_every_layers: Int;
  solid_infill_speed: FloatOrPercent;
  thin_walls: boolean;
  top_infill_extrusion_width: FloatOrPercent;
  top_infill_pattern: InfillPattern;
  top_solid_layers: Int;
  top_solid_infill_speed: FloatOrPercent;
}

export class GCodeConfig {
  before_layer_gcode: string;
  between_objects_gcode: string;
  end_gcode: string;
  end_filament_gcode: Strings;
  extrusion_axis: string;
  extrusion_multiplier: Floats;
  fan_percentage: boolean;
  filament_diameter: Floats;
  filament_density: Floats;
  filament_cost: Floats;
  filament_max_volumetric_speed: Floats;
  filament_notes: Strings;
  gcode_comments: boolean;
  gcode_flavor: GCodeFlavor;
  label_printed_objects: boolean;
  layer_gcode: string;
  max_print_speed: Float;
  max_volumetric_speed: Float;
  notes: string;
  pressure_advance: Float;
  printer_notes: string;
  retract_length: Floats;
  retract_length_toolchange: Floats;
  retract_lift: Floats;
  retract_lift_above: Floats;
  retract_lift_below: Floats;
  retract_restart_extra: Floats;
  retract_restart_extra_toolchange: Floats;
  retract_speed: Floats;
  start_gcode: string;
  start_filament_gcode: Strings;
  toolchange_gcode: string;
  travel_speed: Float;
  use_firmware_retraction: boolean;
  use_relative_e_distances: boolean;
  use_volumetric_e: boolean;
  use_set_and_wait_extruder: boolean;
  use_set_and_wait_bed: boolean;
}
