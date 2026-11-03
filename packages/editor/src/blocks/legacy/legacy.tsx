import { defineBlock } from "../../core";
import { legacyRead } from "./legacy.read";

const Notice = legacyRead.Read;

/** In the editor it reads the same as for a reader: a notice, and the old block kept whole underneath. */
export const legacy = defineBlock(legacyRead, { holds: "nothing", Write: ({ attrs }) => <Notice attrs={attrs} text="">{null}</Notice> });
