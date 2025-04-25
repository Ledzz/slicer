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
  materials: ModelMaterialMap = new Map();
  objects: ModelObjectPtrs = [];
  metadata: Map<string, string> = new Map();

  // Constructor
  constructor(other?: Model) {
    if (other) {
      other.materials.forEach((material, material_id) => {
        this.add_material(material_id, material);
      });

      other.objects.forEach((object) => {
        this.add_object(object, true);
      });

      this.metadata = new Map(other.metadata);
    }
  }

  swap(other: Model): void {
    [this.materials, other.materials] = [other.materials, this.materials];
    [this.objects, other.objects] = [other.objects, this.objects];
    [this.metadata, other.metadata] = [other.metadata, this.metadata];
  }
  static async read_from_file(file: File): Promise<Model> {
    const model = new Model();

    if (file.name.endsWith(".stl")) {
      await readSTLToModel(file, model);
    }

    // TODO: Add other file types

    if (model.objects.length === 0) {
      throw new Error("This file couldn't be read because it's empty.");
    }

    model.objects.forEach((object) => {
      object.input_file = file;
    });

    return model;
  }
  merge(other: Model): void {
    other.objects.forEach((object) => {
      this.add_object(object, true);
    });
  }
  add_object(other?: ModelObject, copy_volumes?: boolean): ModelObject {
    const object = new ModelObject(this, other, copy_volumes);
    this.objects.push(object);
    return object;
  }
  delete_object(idx: number): void {
    if (idx < 0 || idx >= this.objects.length) {
      throw new Error("Invalid object index");
    }
    this.objects.splice(idx, 1);
  }
  clear_objects(): void {
    this.objects = [];
  }
  add_material(
    material_id: t_model_material_id,
    other?: ModelMaterial,
  ): ModelMaterial {
    if (other) {
      const material = new ModelMaterial(this, other);
      this.materials.set(material_id, material);
      return material;
    } else {
      let material = this.get_material(material_id);
      if (!material) {
        material = new ModelMaterial(this);
        this.materials.set(material_id, material);
      }
      return material;
    }
  }
  get_material(material_id: t_model_material_id): ModelMaterial | null {
    return this.materials.get(material_id) || null;
  }
  delete_material(material_id: t_model_material_id): void {
    this.materials.delete(material_id);
  }
  clear_materials(): void {
    this.materials.clear();
  }
  has_objects_with_no_instances(): boolean {
    return this.objects.some((object) => object.instances.length === 0);
  }
  add_default_instances(): boolean {
    let added = false;
    this.objects.forEach((object) => {
      if (object.instances.length === 0) {
        object.add_instance();
        added = true;
      }
    });
    return added;
  }
  bounding_box(): BoundingBoxf3 {
    const bbox = new BoundingBoxf3();
    this.objects.forEach((object) => {
      bbox.merge(object.bounding_box());
    });
    return bbox;
  }
  repair(): void {
    this.objects.forEach((object) => {
      object.repair();
    });
  }
  split(): void {
    const new_model = new Model();
    this.objects.forEach((object) => {
      object.split(new_model.objects);
    });

    this.clear_objects();
    new_model.objects.forEach((object) => {
      this.add_object(object);
    });
  }
  center_instances_around_point(point: Pointf): void {
    const bbox = this.bounding_box();
    const size = bbox.size();
    const shift_x = -bbox.min.x + point.x - size.x / 2;
    const shift_y = -bbox.min.y + point.y - size.y / 2;
    this.objects.forEach((object) => {
      object.instances.forEach((instance) => {
        instance.offset.translate(shift_x, shift_y);
      });
      object.invalidate_bounding_box();
    });
  }
  align_instances_to_origin(): void {
    const bbox = this.bounding_box();
    const new_center = bbox.size();
    new_center.translate(-new_center.x / 2, -new_center.y / 2);
    this.center_instances_around_point(new_center);
  }
  align_to_ground(): void {
    const bbox = this.bounding_box();
    this.objects.forEach((object) => {
      object.translate(0, 0, -bbox.min.z);
    });
  }
  translate(x: number, y: number, z: number): void {
    this.objects.forEach((object) => {
      object.translate(x, y, z);
    });
  }
  mesh(): TriangleMesh {
    const m = new TriangleMesh();

    this.objects.forEach((object) => {
      m.merge(object.mesh());
    });

    return m;
  }
  raw_mesh(): TriangleMesh {
    const m = new TriangleMesh();

    this.objects.forEach((object) => {
      m.merge(object.raw_mesh());
    });

    return m;
  }
  _arrange(
    sizes: Pointfs,
    dist: number,
    bb: BoundingBoxf | null,
    out: Pointfs,
  ): boolean {
    throw new Error("Method not implemented.");
  }
  arrange_objects(dist: number, bb?: BoundingBoxf | null): boolean {
    throw new Error("Method not implemented.");
  }
  duplicate(copies_num: number, dist: number, bb?: BoundingBoxf | null): void {
    throw new Error("Method not implemented.");
  }
  duplicate_objects(
    copies_num: number,
    dist: number,
    bb?: BoundingBoxf | null,
  ): void {
    throw new Error("Method not implemented.");
  }
  duplicate_objects_grid(x: number, y: number, dist: number): void {
    throw new Error("Method not implemented.");
  }
  print_info(): void {
    throw new Error("Method not implemented.");
  }
  looks_like_multipart_object(): boolean {
    throw new Error("Method not implemented.");
  }
  convert_multipart_object(): void {
    throw new Error("Method not implemented.");
  }
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
  input_file: File;
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
