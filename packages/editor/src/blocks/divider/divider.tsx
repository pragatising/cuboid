import { defineBlock } from "../../core";
import { dividerRead } from "./divider.read";

const Rule = dividerRead.Read;

export const divider = defineBlock(dividerRead, {
  holds: "nothing",
  menu: { label: "Divider", group: "layout", keywords: ["rule", "line", "hr"] },
  Write: () => <Rule attrs={{}} text="">{null}</Rule>,
});
