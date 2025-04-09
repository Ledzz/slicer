import { FC, useEffect, useState } from "react";
import { X_SIZE, Y_SIZE } from "./export/constants.ts";
import { usePreviewStore } from "./previewStore.ts";
import { api } from "./export/workerApi.ts";
import { reportProgress } from "./export/reportProgress.ts";
import { proxy } from "comlink";

export const ImagePreview: FC = ({ result }) => {
  const [c, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const width = Math.floor(15120 / 50);
  const height = Math.floor(6230 / 50);
  const previewLayerIndex = usePreviewStore((s) => s.previewLayerIndex);

  const [res, setRes] = useState<ImageData[]>([]);

  useEffect(() => {
    (async function () {
      const allPolygons = result.layers.map((l) => l.polygons);
      const r = await api.polygonsToGrayscaleWithCanvas(
        width,
        height,
        allPolygons,
        X_SIZE,
        Y_SIZE,
        proxy(reportProgress),
      );
      setRes(r);
    })();
  }, [c, height, result.layers, width]);

  useEffect(() => {
    if (!c || !res.length) return;
    const context = c.getContext("2d")!;
    c.width = width;
    c.height = height;
    context.putImageData(res[previewLayerIndex], 0, 0);
  }, [c, height, previewLayerIndex, res, width]);

  return (
    <canvas
      ref={setCanvas}
      width={width}
      height={height}
      style={{ width, height }}
    />
  );
};
