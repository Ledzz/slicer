import * as Comlink from "comlink";
import Worker from "./worker?worker";
import type { WorkerApi } from "./worker";

export const worker = new Worker();
export const api = Comlink.wrap<WorkerApi>(worker);
