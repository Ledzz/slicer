import { slice } from "./slicer.ts";
import { Box3 } from "three";
import { gridInfill } from "./infill/grid.ts";
import { debugLine } from "./helper.ts";

export const generateInfill = (data: Awaited<ReturnType<typeof slice>>) => {
  const bounds = new Box3();

  data.forEach((layer) => {
    layer.contours.forEach((contour) => {
      contour.forEach((point) => {
        bounds.expandByPoint(point.clone().setY(layer.height));
      });
    });
  });

  const ret = data.map((layer) => ({
    ...layer,
    infill: gridInfill({
      contours: layer.contours,
      density: 0.2,
      bounds,
    }),
  }));

  ret.forEach((layer) => {
    layer.infill.lines.forEach((l) => {
      debugLine(l[0], l[1]);
    });
  });

  return ret;
};
