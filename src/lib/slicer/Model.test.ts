import { describe, expect, it } from "vitest";
import { Model } from "./Model.ts";
import { readFile } from "node:fs/promises";
import { resolve } from "path";

globalThis.ProgressEvent = class {};

describe("Model", () => {
  it("should create a Model ", () => {
    const model = new Model();
    expect(model).toBeInstanceOf(Model);
  });

  it.todo("should create a model from other model", () => {
    // check if materials copied
    // check if objects copied
    // check if metadata copied
  });

  it.todo("should swap models");
  it.each([
    ["3dbenchy.stl"],
    // , ["test.obj"], ["test.amf"], ["test.3mf"]
  ])("should read model from file %s", async (filename) => {
    const res = await readFile(resolve(`public/${filename}`));
    const file = new File([res], filename);
    const model = await Model.read_from_file(file);
    expect(model.objects.length).toBe(1);
    expect(model.objects[0].volumes.length).toBe(1);
  });
});
describe("ModelObject", () => {
  it("should create a ModelObject from Model", () => {
    const model = new Model();
  });
});

describe("ModelInstance", () => {
  it("should create a ModelInstance", () => {});
});
