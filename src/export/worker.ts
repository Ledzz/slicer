import * as Comlink from "comlink";
import { polygonsToGrayscale } from "./toGrayscale.ts";

export type WorkerApi = typeof worker;
type ArgsWithoutCanvas =
  Parameters<typeof polygonsToGrayscale> extends [any, ...infer Rest]
    ? Rest
    : never;
export const worker = {
  polygonsToGrayscale,
  polygonsToGrayscaleWithCanvas: (
    width: number,
    height: number,
    ...args: ArgsWithoutCanvas
  ) => {
    const canvas = new OffscreenCanvas(width, height);
    canvas.width = width;
    canvas.height = height;
    return polygonsToGrayscale(canvas, ...args);
  },
};

Comlink.expose(worker);
