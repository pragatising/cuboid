import { Box, Divider } from "@sragatiping/cuboid";
import { defineReadBlock } from "../../core";

/** The rule with room above and below it, inside the block, so a selected divider is a block you can see and not a hairline. */
export const dividerRead = defineReadBlock<Record<string, never>>({
  name: "divider",
  attrs: {},
  Read: () => (
    <Box paddingBlock="1.5x">
      <Divider />
    </Box>
  ),
});
