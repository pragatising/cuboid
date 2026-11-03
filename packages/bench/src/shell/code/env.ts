import models from "~bench/generated/models.json";
import type { Env } from "../../engine/content/check";

/** The components as the extractor made them: what the editor suggests from. */
export const env = { models: models.models, exported: models.exports } as unknown as Env;
