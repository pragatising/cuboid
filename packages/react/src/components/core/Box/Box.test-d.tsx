import { expectTypeOf, test } from "vitest";
import { Box } from "./Box";
import type { BoxProps } from "./Box";
import { CSS_ATTRIBUTE_NAMES, CSS_PROPERTIES } from "./cssProperties.generated";

test("with no `as`, Box takes a div's props and ref", () => {
  expectTypeOf<BoxProps>().toHaveProperty("onClick");
  expectTypeOf<BoxProps>().not.toHaveProperty("href");
  expectTypeOf<BoxProps["ref"]>().toEqualTypeOf<React.Ref<HTMLDivElement> | undefined>();
});

test("Box's own props win over the element's: `color` is a token path, not the HTML attribute", () => {
  expectTypeOf<BoxProps<"span">["color"]>().toEqualTypeOf<BoxProps["color"]>();
});

// The runtime list Box uses to tell a style prop from a DOM attribute is generated from React.CSSProperties. If React or csstype
// gain or lose a property and the list is not regenerated (`npm run generate:css-properties`), this fails.
test("the generated CSS property list equals React.CSSProperties minus the names that stay DOM attributes", () => {
  expectTypeOf<(typeof CSS_PROPERTIES)[number]>().toEqualTypeOf<Exclude<keyof React.CSSProperties, (typeof CSS_ATTRIBUTE_NAMES)[number]>>();
});

test("JSX: tokens where the value is a design decision, CSS values everywhere else", () => {
  <Box>default</Box>;
  <Box flexDirection="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" flexGrow={1}>flex</Box>;
  <Box gap={0} padding={0} marginBlock={0}>zero</Box>;
  <Box display="inline-flex" gap="1.5x" rowGap="1x" paddingBlock="1x" paddingInline="md" paddingBlockStart="2x" marginTop="0.5x" marginInline="auto">spacing</Box>;
  <Box position="absolute" top={0} left="2x" insetInline="1x" insetBlockEnd={0} zIndex="dialog">position</Box>;
  <Box backgroundColor="transparent" color="currentColor" borderColor="#e2e1dd" borderRadius="0 0 8px 8px" padding="8px 16px" zIndex={10}>raw colours, multi-value shorthands, a numeric z-index</Box>;
  <Box border="1px solid red" borderBottom="none" backgroundImage="url(/hero.png)" backgroundSize="cover" backgroundPosition="center" backgroundRepeat="no-repeat" background="linear-gradient(red, blue)">raw borders and backgrounds</Box>;
  <Box padding="12px" paddingInline="0.75rem" gap="calc(100% - 2rem)" marginTop="-4px" borderRadius="3px">raw CSS lengths</Box>;
  <Box width="20x" height="100%" minWidth="fit-content" maxWidth="min(90vw, 56rem)" flexBasis="10x" alignSelf="center">lengths</Box>;
  <Box border="subtle" borderBottom="strong" borderBlock="default" borderInlineEnd="translucent.2" borderRadius="1.5x">borders</Box>;
  <Box backgroundColor="canvas.default" borderColor="subtle" color="neutral.muted" borderRadius="md">colour</Box>;
  <Box as="a" href="/x">anchor</Box>;

  <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" textAlign="center" fontSize="14px" aspectRatio="16 / 9" flex="1 1 0" boxShadow="0 1px 2px red">any CSS property</Box>;
  <Box border={{ side: ["top", "bottom"], color: "subtle", width: "thick" }}>border parts</Box>;
  <Box border={[{ side: "top", color: "strong" }, { side: "all", color: "subtle", style: "dashed" }]} borderTop={{ width: "thick" }}>border specs</Box>;
  <Box width={{ size: "50%", min: "10x", max: "40x" }} height={{ min: "5x" }}>size parts</Box>;

  // @ts-expect-error a border side is one of the CSS side names
  <Box border={{ side: "middle" }}>no</Box>;
  // @ts-expect-error a border colour is a token or a CSS colour
  <Box border={{ color: "nope" }}>no</Box>;
  // @ts-expect-error a border width is a token key, a scale step, or a CSS length
  <Box border={{ width: "wide" }}>no</Box>;
  // @ts-expect-error SizeSpec has size, min and max
  <Box width={{ base: "10x" }}>no</Box>;
  // @ts-expect-error not a CSS property value
  <Box textAlign="middle">no</Box>;
  // @ts-expect-error not a CSS flex-direction (the old API's "vertical")
  <Box flexDirection="vertical">no</Box>;
  // @ts-expect-error 0.3x is not on the scale (2.4px)
  <Box gap="0.3x">no</Box>;
  // @ts-expect-error auto is for margins only
  <Box paddingInline="auto">no</Box>;
  // @ts-expect-error the old object shapes are gone: use the CSS names
  <Box padding={{ block: "1x" }}>no</Box>;
  // @ts-expect-error neither a tokens.border entry nor a CSS border
  <Box border="nope">no</Box>;
  // @ts-expect-error neither a token path nor a CSS colour
  <Box color="neutral.nope">no</Box>;
  // @ts-expect-error neither a token path nor a CSS colour
  <Box backgroundColor="canvs.default">no</Box>;
  // palette hues are valid for text, background and border; highlight for a background
  <Box color="indigo.7" backgroundColor="highlight.yellow" borderColor="indigo.5">ok</Box>;
  // @ts-expect-error highlight colours are for backgrounds only
  <Box color="highlight.yellow">no</Box>;
  // @ts-expect-error highlight colours are for backgrounds only
  <Box borderColor="highlight.yellow">no</Box>;
  // @ts-expect-error not a semantic space name
  <Box gap="huge">no</Box>;
  // @ts-expect-error a bare number has no unit
  <Box padding="12">no</Box>;
  // @ts-expect-error a typo is rejected, not silently ignored by the browser
  <Box padding="huge">no</Box>;
  // @ts-expect-error unknown background token
  <Box backgroundColor="nope">no</Box>;
  // @ts-expect-error a div has no href
  <Box href="/x">no</Box>;
  // @ts-expect-error unknown z-index layer
  <Box zIndex="above-everything">no</Box>;
});
