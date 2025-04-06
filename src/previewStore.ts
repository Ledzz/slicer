import { create } from "zustand/react";

export const usePreviewStore = create(() => ({
  previewLayerIndex: 0,
}));

export const setPreviewLayerIndex = (previewLayerIndex: number) =>
  usePreviewStore.setState({ previewLayerIndex });
