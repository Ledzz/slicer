// Type definitions
import { BoundingBoxf3 } from "./BoundingBox.ts";
import { LayerHeightSpline } from "./LayerHeightSpline.ts";
import { Pointf } from "./Point.ts";
import { TransformationMatrix } from "./TransformationMatrix.ts";
import { TriangleMesh } from "./TriangleMesh.ts";
import { readSTLToModel } from "./utils/read/stl.ts";

type t_model_material_id = string;
type t_model_material_attribute = string;
type t_model_material_attributes = Map<t_model_material_attribute, string>;
type t_layer_height_range = [number, number];
type t_layer_height_ranges = Map<t_layer_height_range, number>;

// Helper types for collections
type ModelMaterialMap = Map<t_model_material_id, ModelMaterial>;
type ModelObjectPtrs = Array<ModelObject>;
type ModelVolumePtrs = Array<ModelVolume>;
type ModelInstancePtrs = Array<ModelInstance>;

/**
 * Model Class representing the print bed content
 * Description of a triangular model with multiple materials, multiple instances with various affine transformations
 * and with multiple modifier meshes.
 * A model groups multiple objects, each object having possibly multiple instances,
 * all objects may share multiple materials.
 */
export class Model {
  // Properties
  materials: ModelMaterialMap;
  objects: ModelObjectPtrs = [];
  metadata: Map<string, string>;

  // Constructor
  constructor();
  constructor(other: Model);

  // Methods
  swap(other: Model): void;
  static async read_from_file(file: File): Model {
    const model = new Model();

    if (file.name.endsWith(".stl")) {
      await readSTLToModel(file, model);
    }

    return model;
  }
  merge(other: Model): void;
  add_object(other?: ModelObject, copy_volumes?: boolean): ModelObject {
    const object = new ModelObject(this, other, copy_volumes);
    this.objects.push(object);
    return object;
  }
  delete_object(idx: number): void;
  clear_objects(): void;
  add_material(material_id: t_model_material_id): ModelMaterial;
  add_material(
    material_id: t_model_material_id,
    other: ModelMaterial,
  ): ModelMaterial;
  get_material(material_id: t_model_material_id): ModelMaterial | null;
  delete_material(material_id: t_model_material_id): void;
  clear_materials(): void;
  has_objects_with_no_instances(): boolean;
  add_default_instances(): boolean;
  bounding_box(): BoundingBoxf3;
  repair(): void;
  split(): void;
  center_instances_around_point(point: Pointf): void;
  align_instances_to_origin(): void;
  align_to_ground(): void;
  translate(x: number, y: number, z: number): void;
  mesh(): TriangleMesh;
  raw_mesh(): TriangleMesh;
  _arrange(
    sizes: Pointfs,
    dist: number,
    bb: BoundingBoxf | null,
    out: Pointfs,
  ): boolean;
  arrange_objects(dist: number, bb?: BoundingBoxf | null): boolean;
  duplicate(copies_num: number, dist: number, bb?: BoundingBoxf | null): void;
  duplicate_objects(
    copies_num: number,
    dist: number,
    bb?: BoundingBoxf | null,
  ): void;
  duplicate_objects_grid(x: number, y: number, dist: number): void;
  print_info(): void;
  looks_like_multipart_object(): boolean;
  convert_multipart_object(): void;
}

/**
 * Model Material class
 * Material, which may be shared across multiple ModelObjects of a single Model.
 */
export class ModelMaterial {
  // Properties
  attributes: t_model_material_attributes;
  config: DynamicPrintConfig;

  // Constructor
  constructor(model: Model);
  constructor(model: Model, other: ModelMaterial);

  // Methods
  get_model(): Model;
  apply(attributes: t_model_material_attributes): void;
}

/**
 * Model Object class
 * A printable object, possibly having multiple print volumes (each with its own set of parameters and materials),
 * and possibly having multiple modifier volumes, each modifier volume with its set of parameters and materials.
 * Each ModelObject may be instantiated multiple times, each instance having different placement on the print bed,
 * different rotation and different uniform scaling.
 */
export class ModelObject {
  // Properties
  name: string;
  input_file: string;
  instances: ModelInstancePtrs;
  volumes: ModelVolumePtrs = [];
  config: DynamicPrintConfig;
  layer_height_ranges: t_layer_height_ranges;
  part_number: number;
  layer_height_spline: LayerHeightSpline;
  _bounding_box: BoundingBoxf3;
  _bounding_box_valid: boolean;

  // Constructor
  constructor(model: Model);
  constructor(model: Model, other: ModelObject, copy_volumes?: boolean);

  // Methods
  operator_assign(other: ModelObject): ModelObject;
  swap(other: ModelObject): void;
  get_model(): Model;
  add_volume(mesh: TriangleMesh): ModelVolume;
  add_volume(volume: ModelVolume): ModelVolume;
  add_volume(meshOrVolume: TriangleMesh | ModelVolume): ModelVolume {
    const volume = new ModelVolume(this, meshOrVolume);
    this.volumes.push(volume);
    return volume;
  }
  delete_volume(idx: number): void;
  clear_volumes(): void;
  add_instance(): ModelInstance;
  add_instance(instance: ModelInstance): ModelInstance;
  delete_instance(idx: number): void;
  delete_last_instance(): void;
  clear_instances(): void;
  bounding_box(): BoundingBoxf3;
  invalidate_bounding_box(): void;
  repair(): void;
  origin_translation(): Pointf3;
  get_trafo_obj(): TransformationMatrix;
  set_trafo_obj(trafo: TransformationMatrix): void;
  mesh(): TriangleMesh;
  raw_mesh(): TriangleMesh;
  raw_bounding_box(): BoundingBoxf3;
  instance_bounding_box(instance_idx: number): BoundingBoxf3;
  align_to_ground(): void;
  center_around_origin(): void;
  get_trafo_to_center(): TransformationMatrix;
  translate(vector: Vectorf3): void;
  translate(x: number, y: number, z: number): void;
  scale(factor: number): void;
  scale(versor: Pointf3): void;
  scale_to_fit(size: Sizef3): void;
  rotate(angle: number, axis: Axis): void;
  rotate(angle: number, axis: Vectorf3): void;
  rotate(origin: Vectorf3, target: Vectorf3): void;
  mirror(axis: Axis): void;
  reset_undo_trafo(): void;
  get_undo_trafo(): TransformationMatrix;
  apply_transformation(trafo: TransformationMatrix): void;
  transform_by_instance(
    instance: ModelInstance,
    dont_translate?: boolean,
  ): void;
  materials_count(): number;
  facets_count(): number;
  needed_repair(): boolean;
  cut(axis: Axis, z: number, model: Model): void;
  split(new_objects: ModelObjectPtrs): void;
  update_bounding_box(): void;
  print_info(): void;
}

/**
 * An object STL, or a modifier volume, over which a different set of parameters shall be applied.
 * ModelVolume instances are owned by a ModelObject.
 */
class ModelVolume {
  // Properties
  name: string;
  mesh: TriangleMesh;
  trafo: TransformationMatrix;
  config: DynamicPrintConfig;
  input_file: string;
  input_file_obj_idx: number;
  input_file_vol_idx: number;
  modifier: boolean;

  // Constructor
  constructor(object: ModelObject, mesh: TriangleMesh);
  constructor(object: ModelObject, other: ModelVolume);

  // Methods
  operator_assign(other: ModelVolume): ModelVolume;
  swap(other: ModelVolume): void;
  get_object(): ModelObject;
  get_transformed_mesh(trafo: TransformationMatrix): TriangleMesh;
  get_transformed_bounding_box(trafo: TransformationMatrix): BoundingBoxf3;
  bounding_box(): BoundingBoxf3;
  translate(x: number, y: number, z: number): void;
  translate(vector: Vectorf3): void;
  translateXY(vector: Vectorf): void;
  scale(factor: number): void;
  scale(x: number, y: number, z: number): void;
  scale(vector: Vectorf3): void;
  mirror(axis: Axis): void;
  mirror(normal: Vectorf3): void;
  rotate(angle_rad: number, axis: Axis): void;
  apply_transformation(trafo: TransformationMatrix): void;
  material_id(): t_model_material_id;
  material_id(material_id: t_model_material_id): void;
  material(): ModelMaterial | null;
  set_material(material_id: t_model_material_id, material: ModelMaterial): void;
  assign_unique_material(): ModelMaterial;
}

/**
 * A single instance of a ModelObject.
 * Knows the affine transformation of an object.
 */
export class ModelInstance {
  // Properties
  rotation: number;
  scaling_factor: number;
  offset: Pointf;
  additional_trafo: TransformationMatrix;

  // Constructor
  constructor(object: ModelObject);
  constructor(object: ModelObject, trafo: TransformationMatrix);
  constructor(object: ModelObject, other: ModelInstance);

  // Methods
  operator_assign(other: ModelInstance): ModelInstance;
  swap(other: ModelInstance): void;
  get_object(): ModelObject;
  set_complete_trafo(trafo: TransformationMatrix): void;
  transform_mesh(mesh: TriangleMesh, dont_translate?: boolean): void;
  get_trafo_matrix(dont_translate?: boolean): TransformationMatrix;
  transform_bounding_box(
    bbox: BoundingBoxf3,
    dont_translate?: boolean,
  ): BoundingBoxf3;
  transform_polygon(polygon: Polygon): void;
}
