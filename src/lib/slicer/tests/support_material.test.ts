import { TriangleMesh } from "../TriangleMesh.ts";
import { describe, it } from "vitest";
import { Model } from "../Model.ts";
import { Print } from "../Print.ts";

describe("1", () => {
  it("1", () => {
    const mesh = TriangleMesh.makeCube(20, 20, 20);
    const model = new Model();
    const object = model.addObject();
    object.addVolume(mesh);
    model.add_default_instances();
    model.align_instances_to_origin();

    const print = new Print();
    print.defaultObjectConfig.support_material_enforce_layers = 100;
    print.defaultObjectConfig.support_material = 0;
    print.defaultObjectConfig.layer_height = 0.2;
    print.defaultObjectConfig.first_layer_height = 0.3;
    print.add_model_object(model.objects[0]);
    print.objects[0]._slice();
  });
});
