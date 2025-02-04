import { slice } from "./slicer";
import { Box3 } from "three";
import { debugLine } from "./helper.ts";
import { gridInfill } from "./infill/grid.ts";

export const generateInfill = (data: Awaited<ReturnType<typeof slice>>) => {
  const bounds = new Box3();
  if (data.geometry.boundingBox) {
    bounds.copy(data.geometry.boundingBox);
  }

  const ret = {
    ...data,
    layers: data.layers.map((layer) => ({
      ...layer,
      infill: gridInfill({
        contours: layer.contours,
        density: 0.2,
        bounds,
        data,
      }),
    })),
  };

  ret.layers.forEach((layer) => {
    layer.infill.lines.forEach((l) => {
      debugLine(l[0], l[1]);
    });
  });

  return ret;
};
