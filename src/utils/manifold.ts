import Module, { Mesh } from "manifold-3d";
import { BufferAttribute, BufferGeometry } from "three";

export const manifold = await Module();
manifold.setup();

export function geometry2mesh(geometry: BufferGeometry) {
  // Only using position in this sample for simplicity. Can interleave any other
  // desired attributes here such as UV, normal, etc.
  const vertProperties = geometry.attributes.position.array as Float32Array;
  // Manifold only uses indexed geometry, so generate an index if necessary.
  const triVerts =
    geometry.index != null
      ? (geometry.index.array as Uint32Array)
      : new Uint32Array(vertProperties.length / 3).map((_, idx) => idx);
  // Create a triangle run for each group (material) - akin to a draw call.
  const starts = [...Array(geometry.groups.length)].map(
    (_, idx) => geometry.groups[idx].start,
  );
  // Map the materials to ID.
  // const originalIDs = [...Array(geometry.groups.length)].map(
  //   (_, idx) => ids[geometry.groups[idx].materialIndex!],
  // );
  // List the runs in sequence.
  const indices = Array.from(starts.keys());
  indices.sort((a, b) => starts[a] - starts[b]);
  const runIndex = new Uint32Array(indices.map((i) => starts[i]));
  // const runOriginalID = new Uint32Array(indices.map((i) => originalIDs[i]));
  // Create the MeshGL for I/O with Manifold library.
  const mesh = new manifold.Mesh({
    numProp: 3,
    vertProperties,
    triVerts,
    runIndex,
    // runOriginalID,
  });
  // Automatically merge vertices with nearly identical positions to create a
  // Manifold. This only fills in the mergeFromVert and mergeToVert vectors -
  // these are automatically filled in for any mesh returned by Manifold. These
  // are necessary because GL drivers require duplicate verts when any
  // properties change, e.g. a UV boundary or sharp corner.
  mesh.merge();
  return mesh;
}

// Convert Manifold Mesh to Three.js BufferGeometry
export function mesh2geometry(mesh: Mesh) {
  const geometry = new BufferGeometry();
  // Assign buffers
  geometry.setAttribute(
    "position",
    new BufferAttribute(mesh.vertProperties, 3),
  );
  geometry.setIndex(new BufferAttribute(mesh.triVerts, 1));
  // Create a group (material) for each ID. Note that there may be multiple
  // triangle runs returned with the same ID, though these will always be
  // sequential since they are sorted by ID. In this example there are two runs
  // for the MeshNormalMaterial, one corresponding to each input mesh that had
  // this ID. This allows runTransform to return the total transformation matrix
  // applied to each triangle run from its input mesh - even after many
  // consecutive operations.
  // let id = mesh.runOriginalID[0];
  // let start = mesh.runIndex[0];
  // for (let run = 0; run < mesh.numRun; ++run) {
  //   const nextID = mesh.runOriginalID[run + 1];
  //   if (nextID !== id) {
  //     const end = mesh.runIndex[run + 1];
  //     geometry.addGroup(start, end - start, id2matIndex.get(id));
  //     id = nextID;
  //     start = end;
  //   }
  // }
  return geometry;
}
