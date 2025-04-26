// Type definitions
import { Axis } from "./axis.ts";
import { BoundingBoxf3 } from "./BoundingBox.ts";
import { LayerHeightSpline } from "./LayerHeightSpline.ts";
import { Pointf, Pointf3, Sizef3, Vectorf3 } from "./Point.ts";
import { DynamicPrintConfig } from "./PrintConfig.ts";
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
  attributes: t_model_material_attributes = new Map();
  config: DynamicPrintConfig = new DynamicPrintConfig();

  // Constructor
  constructor(
    public model: Model,
    other?: ModelMaterial,
  ) {
    if (other) {
      this.attributes = new Map(other.attributes);
      this.config = new DynamicPrintConfig(other.config);
    }
  }

  // Methods
  get_model(): Model {
    return this.model;
  }
  apply(attributes: t_model_material_attributes): void {
    attributes.forEach((k, v) => {
      this.attributes.set(k, v);
    });
  }
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
  part_number: number = -1;
  layer_height_spline: LayerHeightSpline;
  _bounding_box: BoundingBoxf3;
  _bounding_box_valid: boolean = false;
  trafo_obj: TransformationMatrix = new TransformationMatrix();
  trafo_undo_stack: TransformationMatrix;

  // Constructor
  constructor(
    public model: Model,
    other: ModelObject,
    copy_volumes?: boolean,
  ) {
    if (other) {
      this.name = other.name;
      this.input_file = other.input_file;
      this.config = new DynamicPrintConfig(other.config);
      this.layer_height_ranges = new Map(other.layer_height_ranges);
      this.part_number = other.part_number;
      this.layer_height_spline = new LayerHeightSpline(
        other.layer_height_spline,
      );
      this.trafo_obj = other.trafo_obj;
      this._bounding_box = other._bounding_box;
      this._bounding_box_valid = other._bounding_box_valid;
      this.model = other.model;

      if (copy_volumes) {
        other.volumes.forEach((volume) => {
          this.add_volume(volume);
        });
      }

      other.instances.forEach((instance) => {
        this.add_instance(instance);
      });
    }
  }

  get_model(): Model {
    return this.model;
  }
  add_volume(mesh: TriangleMesh): ModelVolume;
  add_volume(volume: ModelVolume): ModelVolume;
  add_volume(meshOrVolume: TriangleMesh | ModelVolume): ModelVolume {
    const volume = new ModelVolume(this, meshOrVolume);
    this.volumes.push(volume);
    this.invalidate_bounding_box();
    return volume;
  }
  delete_volume(idx: number): void {
    if (idx < 0 || idx >= this.volumes.length) {
      throw new Error("Invalid volume index");
    }
    this.volumes.splice(idx, 1);
    this.invalidate_bounding_box();
  }
  clear_volumes(): void {
    this.volumes = [];
    this.invalidate_bounding_box();
  }
  add_instance(instance?: ModelInstance): ModelInstance {
    const new_instance = new ModelInstance(this, instance);
    this.instances.push(new_instance);
    return new_instance;
  }
  delete_instance(idx: number): void {
    if (idx < 0 || idx >= this.instances.length) {
      throw new Error("Invalid instance index");
    }
    this.instances.splice(idx, 1);
  }
  delete_last_instance(): void {
    this.delete_instance(this.instances.length - 1);
  }
  clear_instances(): void {
    this.instances = [];
  }
  bounding_box(): BoundingBoxf3 {
    if (!this._bounding_box_valid) {
      this.update_bounding_box();
    }
    return this._bounding_box;
  }
  invalidate_bounding_box(): void {
    this._bounding_box_valid = false;
  }
  update_bounding_box(): void {
    const raw_bbox = new BoundingBoxf3();
    this.volumes.forEach((v) => {
      if (v.modifier) {
        return;
      }
      raw_bbox.merge(v.bounding_box());
    });
    const bb = new BoundingBoxf3();
    this.instances.forEach((instance) => {
      bb.merge(instance.transform_bounding_box(raw_bbox));
    });
    this._bounding_box = bb;
    this._bounding_box_valid = true;
  }
  repair(): void {
    this.volumes.forEach((v) => v.mesh.repair());
  }
  origin_translation(): Pointf3 {
    return new Pointf3(
      this.trafo_obj.m03,
      this.trafo_obj.m13,
      this.trafo_obj.m23,
    );
  }
  get_trafo_obj(): TransformationMatrix {
    return this.trafo_obj;
  }
  set_trafo_obj(trafo: TransformationMatrix): void {
    this.trafo_obj = trafo;
  }
  mesh(): TriangleMesh {
    const mesh = new TriangleMesh();
    this.instances.forEach((instance) => {
      const instance_trafo = instance.get_trafo_matrix();
      this.volumes.forEach((volume) => {
        mesh.merge(volume.get_transformed_mesh(instance_trafo));
      });
    });
    return mesh;
  }
  raw_mesh(): TriangleMesh {
    const mesh = new TriangleMesh();
    this.volumes.forEach((volume) => {
      if (volume.modifier) {
        return;
      }
      mesh.merge(volume.mesh);
    });
    return mesh;
  }
  raw_bounding_box(): BoundingBoxf3 {
    const bb = new BoundingBoxf3();
    if (this.instances.length === 0) {
      throw new Error("Can't call raw_bounding_box() with no instances");
    }
    const trafo = this.instances[0].get_trafo_matrix(true);
    this.volumes.forEach((volume) => {
      if (volume.modifier) {
        return;
      }
      bb.merge(volume.get_transformed_bounding_box(trafo));
    });
    return bb;
  }
  // this returns the bounding box of the *transformed* given instance
  instance_bounding_box(instance_idx: number): BoundingBoxf3 {
    const bb = new BoundingBoxf3();
    if (this.instances.length <= instance_idx) {
      throw new Error(
        "Can't call instance_bounding_box(index) with insufficient amount of instances",
      );
    }
    const trafo = this.instances[instance_idx].get_trafo_matrix(true);
    this.volumes.forEach((volume) => {
      if (volume.modifier) {
        return;
      }
      bb.merge(volume.get_transformed_bounding_box(trafo));
    });
    return bb;
  }
  align_to_ground(): void {
    const bbox = new BoundingBoxf3();
    this.volumes.forEach((volume) => {
      if (volume.modifier) {
        return;
      }
      bbox.merge(volume.bounding_box());
    });
    this.translate(0, 0, -bbox.min.z);
  }
  center_around_origin(): void {
    // calculate the displacements needed to
    // center this object around the origin
    const bb = new BoundingBoxf3();
    this.volumes.forEach((volume) => {
      if (volume.modifier) {
        return;
      }
      bb.merge(volume.bounding_box());
    });

    // first align to origin on XYZ
    const vector = new Vectorf3(-bb.min.x, -bb.min.y, -bb.min.z);

    // then center it on XY
    const size = bb.size();
    vector.x -= size.x / 2;
    vector.y -= size.y / 2;
    this.translate(vector);
    if (this.instances.length === 0) {
      return;
    }
    this.instances.forEach((instance) => {
      // apply rotation and scaling to vector as well before translating instance,
      // in order to leave final position unaltered
      const v = vector.negative();
      v.rotate(instance.rotation, instance.offset);
      v.scale(instance.scaling_factor);
      instance.offset.translate(v.x, v.y);
    });
    this.invalidate_bounding_box();
  }
  get_trafo_to_center(): TransformationMatrix {
    const raw_bbox = this.raw_bounding_box();
    return TransformationMatrix.mat_translation(raw_bbox.center().negative());
  }
  translate(vector: Vectorf3): void;
  translate(x: number, y: number, z: number): void;
  translate(xOrVector: number | Vectorf3, yy?: number, zz?: number): void {
    const isNumber = typeof xOrVector === "number";
    const { x, y, z } = isNumber ? { x: xOrVector, y: yy, z: zz } : xOrVector;
    const trafo = TransformationMatrix.mat_translation(x, y, z);
    this.apply_transformation(trafo);
    if (this._bounding_box_valid) {
      this._bounding_box.translate(x, y, z);
    }
  }
  scale(factor: number): void;
  scale(versor: Pointf3): void;
  scale(xOrVersor: number | Pointf3): void {
    const { x, y, z } =
      typeof xOrVersor === "number"
        ? { x: xOrVersor, y: xOrVersor, z: xOrVersor }
        : xOrVersor;
    const center_trafo = this.get_trafo_to_center();
    const trafo = TransformationMatrix.multiply(
      TransformationMatrix.mat_scale(x, y, z),
      center_trafo,
    );
    trafo.applyLeft(center_trafo.inverse());
    this.apply_transformation(trafo);
    this.invalidate_bounding_box();
  }
  scale_to_fit(size: Sizef3): void {
    throw new Error("Method not implemented.");
  }
  rotate(angle: number, axis: Axis): void;
  rotate(angle: number, axis: Vectorf3): void;
  rotate(origin: Vectorf3, target: Vectorf3): void {
    throw new Error("Method not implemented.");
  }
  mirror(axis: Axis): void {
    throw new Error("Method not implemented.");
  }
  reset_undo_trafo(): void {
    this.trafo_undo_stack = TransformationMatrix.mat_eye();
  }
  get_undo_trafo(): TransformationMatrix {
    return this.trafo_undo_stack;
  }
  apply_transformation(trafo: TransformationMatrix): void {
    this.trafo_obj.applyLeft(trafo);
    this.trafo_undo_stack.applyLeft(trafo);
    this.volumes.forEach((v) => v.apply_transformation(trafo));
  }
  transform_by_instance(
    instance: ModelInstance,
    dont_translate?: boolean,
  ): void {
    // We get instance by copy because we would alter it in the loop below,
    // causing inconsistent values in subsequent instances.
    let temp_trafo = instance.get_trafo_matrix(dont_translate);
    this.apply_transformation(temp_trafo);
    temp_trafo = temp_trafo.inverse();
    /*
     Let:
       * I1 be the trafo of the given instance,
       * V the original volume trafo and
       * I2 the trafo of the instance to be updated

     Then:
       previous: T = I2 * V
       I1 has been applied to V:
           Vnew = I1 * V
           I1^-1 * I1 = eye

           T = I2 * I1^-1 * I1 * V
               ----------   ------
                  I2new      Vnew
   */
    this.instances.forEach((i) => {
      i.set_complete_trafo(i.get_trafo_matrix().multiplyRight(temp_trafo));
    });
    this.invalidate_bounding_box();
  }
  materials_count(): number {
    const material_ids = new Set<t_model_material_id>();
    this.volumes.forEach((v) => material_ids.add(v.material_id()));
    return material_ids.size;
  }
  facets_count(): number {
    let count = 0;
    this.volumes.forEach((v) => {
      if (v.modifier) {
        return;
      }
      count += v.mesh.faces.length;
    });
    return count;
  }
  needed_repair(): boolean {
    return this.volumes.some((v) => !v.modifier && v.mesh.needed_repair());
  }
  cut(axis: Axis, z: number, model: Model): void {
    // clone this one to duplicate instances, materials etc.
    const upper = model.add_object(this);
    const lower = model.add_object(this);
    upper.clear_volumes();
    lower.clear_volumes();
    // remove extension from filename and add suffix
    // TODO
    console.warn("Fix file names");
    // if (this->input_file.empty()) {
    //   upper->input_file = "upper";
    //   lower->input_file = "lower";
    // } else {
    //   const boost::filesystem::path p{this->input_file};
    //   upper->input_file = (p.parent_path() / p.stem()).string() + "_upper";
    //   lower->input_file = (p.parent_path() / p.stem()).string() + "_lower";
    // }
    this.volumes.forEach((v) => {
      if (v.modifier) {
        upper.add_volume(v);
        lower.add_volume(v);
      } else {
        const upper_mesh = new TriangleMesh();
        const lower_mesh = new TriangleMesh();

        console.warn("Fix slicing");

        // if (axis === 'x') {
        //   TriangleMeshSlicer
        // }

        upper_mesh.repair();
        lower_mesh.repair();
        upper_mesh.reset_repair_stats();
        lower_mesh.reset_repair_stats();

        if (upper_mesh.faces.length > 0) {
          const vol = upper.add_volume(upper_mesh);
          vol.name = v.name;
          vol.config = v.config;
          vol.set_material(v.material_id(), v.material());
        }

        if (lower_mesh.faces.length > 0) {
          const vol = lower.add_volume(lower_mesh);
          vol.name = v.name;
          vol.config = v.config;
          vol.set_material(v.material_id(), v.material());
        }
      }
    });
  }
  split(new_objects: ModelObjectPtrs): void {
    throw new Error("Method not implemented.");
  }
  print_info(): void {
    throw new Error("Method not implemented.");
  }
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
