import { Pointf3 } from "./Point.ts";

export class BoundingBoxf3 {
  constructor(
    public min: Pointf3,
    public max: Pointf3,
  ) {}
}
