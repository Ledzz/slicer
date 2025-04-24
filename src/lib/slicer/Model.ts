import { BoundingBoxf3 } from "./BoundingBox.ts";
import { TriangleMesh } from "./TriangleMesh.ts";
import { TransformationMatrix } from "./TransformationMatrix.ts";

type ModelMaterialId = string;
type ModelMaterialMap = Map<ModelMaterialId, ModelMaterial>;
type ModelObjectPtrs = ModelObject[];
type ModelVolumePtrs = ModelVolume[];
type ModelInstancePtrs = ModelInstance[];
type t_layer_height_range = [number, number];
type t_layer_height_ranges = Map<t_layer_height_range, number>;

class Model {
  materials: ModelMaterialMap = new Map();
  objects: ModelObjectPtrs = [];
  metadata = new Map<string, string>();

  constructor(other?: Model) {
    if (other) {
      // TODO: Copy model
    }
  }

  swap(other: Model) {
    // TODO: Swap model
  }

  read_from_file(filename: string) {
    // TODO: Read model from file
  }

  merge(other: Model) {
    other.objects.forEach((object) => {
      this.add_object(object, true);
    });
  }

  add_object(other?: ModelObject, copy_volumes = false) {
    const object = new ModelObject(this, other, copy_volumes);
    this.objects.push(object);
    return object;
  }

  delete_object(idx: number) {
    if (idx < 0 || idx >= this.objects.length) {
      throw new Error("Invalid object index");
    }
    this.objects.splice(idx, 1);
  }

  clear_objects() {
    throw new Error("Not implemented");
  }

  delete_material(id: ModelMaterialId) {
    throw new Error("Not implemented");
  }

  clear_materials() {
    throw new Error("Not implemented");
  }

  add_material(material_id: ModelMaterialId, other?: ModelMaterial) {
    if (other) {
      const material = new ModelMaterial(this, other);
      this.materials.set(material_id, material);
      return material;
    } else {
      let material = this.materials.get(material_id);
      if (!material) {
        material = new ModelMaterial(this);
        this.materials.set(material_id, material);
      }
    }
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
    const box = new BoundingBoxf3();
    this.objects.forEach((object) => {
      box.merge(object.bounding_box());
    });
    return box;
  }

  repair() {
    this.objects.forEach((object) => {
      object.repair();
    });
  }

  split() {
    const new_model = new Model();
    this.objects.forEach((object) => {
      object.split(new_model.objects);
    });

    this.clear_objects();

    new_model.objects.forEach((object) => {
      this.add_object(object);
    });
  }

  center_instances_around_point(point: Pointf) {
    const bb = this.bounding_box();
    const size = bb.size();
    const shift_x = -bb.min.x + point.x - size.x / 2;
    const shift_y = -bb.min.y + point.y - size.y / 2;
    this.objects.forEach((object) => {
      object.instances.forEach((instance) => {
        instance.offset.translate(shift_x, shift_y);
      });
      object.invalidate_bounding_box();
    });
  }

  translate(x: number, y: number, z: number) {
    this.objects.forEach((object) => {
      object.translate(x, y, z);
    });
  }

  mesh(): TriangleMesh {
    const mesh = new TriangleMesh();
    this.objects.forEach((object) => {
      mesh.merge(object.mesh());
    });
    return mesh;
  }

  raw_mesh(): TriangleMesh {
    const mesh = new TriangleMesh();
    this.objects.forEach((object) => {
      mesh.merge(object.raw_mesh());
    });
    return mesh;
  }

  _arrange() {
    // TODO: Arrange model
  }

  arrange_objects() {
    // TODO: Arrange objects
  }

  duplicate() {
    // TODO: Duplicate model
  }

  duplicate_objects() {
    // TODO: Duplicate objects
  }

  duplicate_objects_grid() {
    // TODO: Duplicate objects in grid
  }

  looks_like_multipart_object(): boolean {
    // TODO: Check if model looks like multipart object
    return false;
  }

  convert_multipart_object() {
    // TODO: Convert multipart object
  }
}
class ModelInstance {}
class ModelMaterial {}
class ModelObject {
  name: string;
  input_file: string;
  instances: ModelInstancePtrs = [];
  volumes: ModelVolumePtrs = [];
  config: DynamicPrintConfig;
  layer_height_ranges: t_layer_height_ranges;
  part_number: number;
  layer_height_spline: LayerHeightSpline;
  _bounding_box: BoundingBoxf3;
  _bounding_box_valid: boolean;

  constructor(
    private model: Model,
    other?: ModelObject,
    copy_volumes = false,
  ) {
    if (copy_volumes) {
      other?.volumes.forEach((volume) => {
        this.add_volume(volume);
      });
    }
    other?.instances.forEach((instance) => {
      this.add_instance(instance);
    });
  }

  get_model(): Model {
    return this.model;
  }

  add_volume(volumeOrMesh: TriangleMesh | ModelVolume) {
    const volume = new ModelVolume(this, volumeOrMesh);
    this.volumes.push(volume);
    return volume;
  }

  delete_volume(idx: number) {
    if (idx < 0 || idx >= this.volumes.length) {
      throw new Error("Invalid volume index");
    }
    this.volumes.splice(idx, 1);
    this.invalidate_bounding_box();
  }
  clear_volumes() {
    this.volumes = [];
    this.invalidate_bounding_box();
  }
  add_instance(other: ModelInstance): ModelInstance {
    const instance = new ModelInstance(this, other);
    this.instances.push(instance);
    return instance;
  }
  delete_instance(idx: number) {
    if (idx < 0 || idx >= this.instances.length) {
      throw new Error("Invalid instance index");
    }
    this.instances.splice(idx, 1);
  }
  bounding_box(): BoundingBoxf3 {
    if (!this._bounding_box_valid) {
      this.update_bounding_box();
    }
    return this._bounding_box;
  }
  invalidate_bounding_box() {
    this._bounding_box_valid = false;
  }
  update_bounding_box() {
    const raw_bbox = new BoundingBoxf3();
    this.volumes.forEach((volume) => {
      if (volume.modifier) {
        return;
      }
      raw_bbox.merge(volume.bounding_box());
    });
    const bb = new BoundingBoxf3();
    this.instances.forEach((instance) => {
      bb.merge(instance.transform_bounding_box(raw_bbox));
    });
    this._bounding_box = bb;
    this._bounding_box_valid = true;
  }

  repair() {
    // TODO: repair
  }
}
class ModelVolume {
  name: string;
  mesh: TriangleMesh;
  trafo: TransformationMatrix;
  config: DynamicPrintConfig;
  input_file: string;
  input_file_obj_idx: number;
  input_file_vol_idx: number;
  modifier: boolean;
  constructor(
    public object: ModelObject,
    other?: ModelVolume | TriangleMesh,
  ) {
    if (other) {
      this.name = other.name;
      this.mesh = other.mesh;
      this.trafo = other.trafo;
      this.config = other.config;
      this.input_file = other.input_file;
      this.input_file_obj_idx = other.input_file_obj_idx;
      this.input_file_vol_idx = other.input_file_vol_idx;
      this.modifier = other.modifier;
      this.material_id = other.material_id;
    }
  }
  get_object(): ModelObject {
    return this.object;
  }
  get_transformed_mesh(trafo: TransformationMatrix): TriangleMesh {
    return this.mesh.get_transformed_mesh(trafo);
  }
  get_transformed_bounding_box(trafo: TransformationMatrix): TriangleMesh {
    return this.mesh.get_transformed_bounding_box(trafo);
  }

  bounding_box(): BoundingBoxf3 {
    return this.mesh.bounding_box();
  }

  translate(x: number, y: number, z: number) {
    // TransformationMatrix trafo = TransformationMatrix::mat_translation(x,y,z);
    // this->apply_transformation(trafo);

    const trafo = TransformationMatrix.mat_translation(x, y, z);
    this.apply_transformation(trafo);
  }
}
class DynamicPrintConfig {}
