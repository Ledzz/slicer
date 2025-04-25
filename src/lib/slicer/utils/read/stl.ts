import { Model } from "../../Model.ts";
import { TriangleMesh } from "../../TriangleMesh.ts";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

const loader = new STLLoader();

export const readSTLToModel = async (file: File, model: Model) => {
  const mesh = new TriangleMesh();
  await readSTLToMesh(file, mesh);
  if (mesh.faces.length === 0) {
    throw new Error("This STL file couldn't be read because it's empty.");
  }

  const object = model.add_object();
  object.name = file.name;
  object.input_file = file.name;

  const volume = object.add_volume(mesh);
  volume.name = object.name;

  return true;
};

export const readSTLToMesh = async (file: File, mesh: TriangleMesh) => {
  const geometry = await loader.loadAsync(URL.createObjectURL(file));
  const vertices = geometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    mesh.vertices.push([vertices[i], vertices[i + 1], vertices[i + 2]]);
  }
  for (let i = 0; i < vertices.length / 3; i += 3) {
    mesh.faces.push([i, i + 1, i + 2]);
  }
  return true;
};
