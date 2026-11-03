import { Box, useTokens } from "@sragatiping/cuboid";
import type { BoxProps } from "@sragatiping/cuboid";

/** The editable text: Cuboid's code typeface and row height, so it sits where the highlighted block will put it. */
export function CodeText(props: BoxProps<"pre">) {
  const { text } = useTokens();
  return (
    <Box
      as="pre"
      margin={0}
      paddingBlockStart="1x"
      paddingInline="2x"
      paddingBlockEnd="1.5x"
      font={text.codeBlock.shorthand}
      lineHeight={text.codeBlock.lineHeight}
      whiteSpace="pre-wrap"
      tabSize={2}
      outline="none"
      {...props}
    />
  );
}
