import { config } from "virtual:bench";
import { resolve } from "../../frame/document/resolve";

/** What the examples engine needs from the library it is documenting, from `bench.config.ts`: the name an app imports it by, and the words and pictures to put in slots. */
export const importFrom = config.packages[0].name;

export const { fixtures } = config;

export { resolve };
