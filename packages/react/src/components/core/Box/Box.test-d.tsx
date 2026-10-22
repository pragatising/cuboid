import { expectTypeOf, test } from "vitest";
import { Box } from "./Box";
import type { BoxProps } from "./Box";

test("with no `as`, Box takes a div's props and ref", () => {
  expectTypeOf<BoxProps>().toHaveProperty("onClick");
  expectTypeOf<BoxProps>().not.toHaveProperty("href");
  expectTypeOf<BoxProps["ref"]>().toEqualTypeOf<React.Ref<HTMLDivElement> | undefined>();
});

test("Box's own props win over the element's: `color` is a token path, not the HTML attribute", () => {
  expectTypeOf<BoxProps<"span">["color"]>().toEqualTypeOf<BoxProps["color"]>();
});

test("JSX: tokens where the value is a design decision, CSS values everywhere else", () => {
  <Box>default</Box>;
  <Box flexDirection="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" flexGrow={1}>flex</Box>;
  <Box gap={0} padding={0} margin={{ block: 0 }}>zero</Box>;
  <Box display="inline-flex" gap="1.5x" padding={{ block: "1x", inline: "md" }} margin={{ top: "0.5x" }}>spacing</Box>;
  <Box position="absolute" top={0} left="2x" inset={{ inline: "1x" }} zIndex="dialog">position</Box>;
  <Box backgroundColor="canvas.default" borderColor="subtle" color="neutral.muted" borderRadius="md">colour</Box>;
  <Box as="a" href="/x">anchor</Box>;

  // @ts-expect-error not a CSS flex-direction (the old API's "vertical")
  <Box flexDirection="vertical">no</Box>;
  // @ts-expect-error 0.3x is not on the scale (2.4px)
  <Box gap="0.3x">no</Box>;
  // @ts-expect-error not a semantic space name
  <Box gap="huge">no</Box>;
  // @ts-expect-error raw CSS lengths are not spacing tokens
  <Box padding="12px">no</Box>;
  // @ts-expect-error unknown background token
  <Box backgroundColor="nope">no</Box>;
  // @ts-expect-error a div has no href
  <Box href="/x">no</Box>;
  // @ts-expect-error unknown z-index layer
  <Box zIndex="above-everything">no</Box>;
});
