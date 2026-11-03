import path from "node:path";
import { config } from "virtual:bench";

/** The folder of the library the tests run against (the first package of the config `BENCH_CONFIG` names: Cuboid's, unless told otherwise). */
export const root = path.resolve(path.dirname(process.env.BENCH_CONFIG ?? "."), config.packages[0].root);
