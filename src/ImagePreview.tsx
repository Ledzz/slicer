import { FC, useEffect, useState } from "react";
import { polygonsToGrayscale } from "./export/toGrayscale.ts";
import { X_SIZE, Y_SIZE } from "./export/constants.ts";

export const ImagePreview: FC = ({ layer, result }) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const width = 15120 / 50;
  const height = 6230 / 50;
  useEffect(() => {
    if (canvas) {
      const w = X_SIZE;
      const h = Y_SIZE;
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d")!;
      polygonsToGrayscale(context, layer.polygons, w, h, width, height);
    }
  }, [canvas, height, layer.polygons, result, width]);

  return (
    <canvas
      ref={setCanvas}
      width={width}
      height={height}
      style={{ width, height }}
    />
  );
};
