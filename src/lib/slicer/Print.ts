import { ModelObject } from "./Model.ts";

export class Print {
  objects: PrintObject[];
  defaultObjectConfig: PrintObjectConfig;

  add_model_object(modelObject: ModelObject) {}
}

export class PrintObject {
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
  }
}

export class PrintObjectConfig {
  support_material_enforce_layers: number;
  support_material: number;
  layer_height: number;
  first_layer_height: number;
}
